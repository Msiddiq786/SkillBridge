const { GoogleGenAI } = require("@google/genai");
const { MODELS, MODEL, RETRY } = require("../../config/ai.config");

if (!process.env.GOOGLE_GENAI_API_KEY) {
    throw new Error("GOOGLE_GENAI_API_KEY is missing in .env");
}

const ai = new GoogleGenAI({
    apiKey: process.env.GOOGLE_GENAI_API_KEY
});

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function calculateBackoffWithJitter(attempt, baseDelayMs = RETRY.BASE_DELAY_MS, maxDelayMs = RETRY.MAX_DELAY_MS) {
    const exponential = baseDelayMs * Math.pow(1.8, attempt);
    const jitter = Math.random() * 400;
    return Math.min(maxDelayMs, Math.round(exponential + jitter));
}

function extractRetryDelayMs(err, attempt) {
    // 1. Check details array for RetryInfo from Google RPC
    const details = err?.error?.details || err?.details || err?.cause?.details;
    if (Array.isArray(details)) {
        for (const item of details) {
            if (item && item.retryDelay) {
                const match = String(item.retryDelay).match(/(\d+(\.\d+)?)/);
                if (match) {
                    const secs = parseFloat(match[1]);
                    if (!isNaN(secs) && secs > 0) {
                        return Math.min(RETRY.MAX_DELAY_MS, Math.ceil(secs * 1000) + 300);
                    }
                }
            }
        }
    }

    // 2. Check message string for "retry in Xs"
    const msg = String(err?.message || "");
    const msgMatch = msg.match(/retry in (\d+(\.\d+)?)s/i);
    if (msgMatch) {
        const secs = parseFloat(msgMatch[1]);
        if (!isNaN(secs) && secs > 0) {
            return Math.min(RETRY.MAX_DELAY_MS, Math.ceil(secs * 1000) + 300);
        }
    }

    // 3. Fast exponential backoff with jitter
    return calculateBackoffWithJitter(attempt);
}

/**
 * Execute Gemini generateContent with strict timeout, fallback model routing, and fast retry
 */
async function generateWithRetry(request, retries = RETRY.MAX_RETRIES, timeoutMs = RETRY.TIMEOUT_MS) {
    let currentModel = request.model || MODELS.FAST;
    const requestStartTime = Date.now();
    let lastError;

    for (let attempt = 0; attempt < retries; attempt++) {
        const attemptStartTime = Date.now();

        try {
            // Enforce request timeout
            let timeoutId;
            const timeoutPromise = new Promise((_, reject) => {
                timeoutId = setTimeout(() => {
                    reject(new Error(`Gemini request timed out after ${timeoutMs / 1000}s (model: ${currentModel})`));
                }, timeoutMs);
            });

            const apiPromise = ai.models.generateContent({
                ...request,
                model: currentModel
            });

            const response = await Promise.race([apiPromise, timeoutPromise]);
            clearTimeout(timeoutId);

            const durationMs = Date.now() - requestStartTime;
            console.log(`[AI] ${currentModel} completed in ${(durationMs / 1000).toFixed(2)}s (attempts: ${attempt + 1})`);

            return response;

        } catch (err) {
            lastError = err;
            const attemptDuration = Date.now() - attemptStartTime;

            const code =
                err?.status ||
                err?.error?.code ||
                err?.cause?.status;

            const errorString = String(err?.message || "") + " " + JSON.stringify(err?.error || "");

            const isRateLimit =
                code === 429 ||
                errorString.includes("429") ||
                errorString.includes("RESOURCE_EXHAUSTED") ||
                errorString.includes("quota") ||
                errorString.includes("rate limit");

            const isServerBusy =
                code === 503 ||
                code === 500 ||
                errorString.includes("503") ||
                errorString.includes("UNAVAILABLE") ||
                errorString.includes("overloaded") ||
                errorString.includes("timed out");

            const isTransient = isRateLimit || isServerBusy;

            // Switch to fallback model on second attempt if available
            if (attempt === 1 && MODELS.FALLBACK && currentModel !== MODELS.FALLBACK) {
                console.log(`[AI] Switching from ${currentModel} to fallback model ${MODELS.FALLBACK}...`);
                currentModel = MODELS.FALLBACK;
            }

            if (!isTransient || attempt >= retries - 1) {
                console.error(`[AI] ${currentModel} failed after ${(attemptDuration / 1000).toFixed(2)}s (code: ${code || 'UNKNOWN'}). Error: ${err.message}`);
                throw err;
            }

            const delayMs = extractRetryDelayMs(err, attempt);
            const errorLabel = isRateLimit ? "429 Rate limit" : (code ? `${code} Transient error` : "Service busy");
            console.log(`[AI] ${currentModel} ${errorLabel}. Retrying ${attempt + 1}/${retries} in ${(delayMs / 1000).toFixed(1)}s (elapsed: ${(Date.now() - requestStartTime) / 1000}s)...`);

            await sleep(delayMs);
        }
    }

    throw lastError;
}

/**
 * Generate JSON output validated and parsed
 */
async function generateJson(request) {
    const selectedModel = request.model || MODELS.FAST;

    const response = await generateWithRetry({
        ...request,
        model: selectedModel
    });

    if (!response?.text) {
        throw new Error("Gemini returned an empty response");
    }

    return JSON.parse(response.text);
}

module.exports = {
    ai,
    MODELS,
    MODEL,
    generateWithRetry,
    generateJson
};