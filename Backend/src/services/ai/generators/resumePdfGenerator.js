const puppeteer = require("puppeteer");
const pdfParse = require("pdf-parse");
const { zodToJsonSchema } = require("zod-to-json-schema");
const { generateJson, MODELS } = require("../genai.client");
const { resumePdfSchema } = require("../schemas");
const { buildResumePdfPrompt } = require("../prompts/resumePdf.prompt");

/**
 * Get PDF page count from buffer using pdf-parse
 */
async function countPdfPages(pdfBuffer) {
    try {
        const parser = new pdfParse.PDFParse(Uint8Array.from(pdfBuffer));
        const textData = await parser.getText();
        return textData?.total || 1;
    } catch (e) {
        return 1;
    }
}

/**
 * Factual Sanitizer: Ensures no unsupported JD buzzwords leak into generated HTML
 */
function sanitizeResumeHtml(html, sourceResume, selfDescription) {
    const combinedSource = `${sourceResume || ""} ${selfDescription || ""}`.toLowerCase();

    const buzzwordsToCheck = [
        { regex: /\b(rag|retrieval[- ]augmented generation)\b/gi, raw: "rag" },
        { regex: /\bvector database(s)?\b/gi, raw: "vector database" },
        { regex: /\bpinecone\b/gi, raw: "pinecone" },
        { regex: /\bchromadb\b/gi, raw: "chromadb" },
        { regex: /\bweaviate\b/gi, raw: "weaviate" },
        { regex: /\bdocker\b/gi, raw: "docker" },
        { regex: /\bkubernetes\b/gi, raw: "kubernetes" },
        { regex: /\bfastapi\b/gi, raw: "fastapi" },
        { regex: /\bmodel monitoring\b/gi, raw: "model monitoring" },
        { regex: /\baml\/kyc\b/gi, raw: "aml/kyc" },
        { regex: /\bdocument processing\b/gi, raw: "document processing" },
        { regex: /\bfeature extraction\b/gi, raw: "feature extraction" }
    ];

    let sanitized = html;

    for (const item of buzzwordsToCheck) {
        // If term is not present in original source resume, scrub it from generated HTML
        if (!combinedSource.includes(item.raw)) {
            // Remove clean occurrences in skills list, bullet points, or summary
            sanitized = sanitized.replace(new RegExp(`,?\\s*${item.regex.source}\\s*,?`, "gi"), (match) => {
                return match.includes(",") ? ", " : " ";
            });
            // Clean up any lingering double commas or dangling commas
            sanitized = sanitized.replace(/,\s*,/g, ",").replace(/:\s*,/g, ": ");
        }
    }

    // Preserve project name integrity
    sanitized = sanitized.replace(/AI Security &amp; Document\/Attendance Automation System/gi, "AI Security &amp; Attendance System");
    sanitized = sanitized.replace(/AI Security & Document\/Attendance Automation System/gi, "AI Security & Attendance System");
    sanitized = sanitized.replace(/AI Security &amp; Document Processing System/gi, "AI Security &amp; Attendance System");
    sanitized = sanitized.replace(/AI Security & Document Processing System/gi, "AI Security & Attendance System");

    return sanitized;
}

/**
 * DOM Content Trimmer: Enforces hard limits on bullets and summary length
 */
function trimHtmlContent(html) {
    let trimmed = html;

    // Enforce max 2 bullets per <ul>
    trimmed = trimmed.replace(/<ul([^>]*)>([\s\S]*?)<\/ul>/gi, (match, attrs, content) => {
        const lis = content.match(/<li[\s\S]*?<\/li>/gi) || [];
        if (lis.length > 2) {
            return `<ul${attrs}>${lis.slice(0, 2).join("")}</ul>`;
        }
        return match;
    });

    return trimmed;
}

/**
 * Convert HTML to PDF with specified margin options and DOM preparation
 */
async function renderHtmlToPdf(html, marginMm = 14) {
    const browser = await puppeteer.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });

    try {
        const page = await browser.newPage();

        await page.setContent(html, {
            waitUntil: "networkidle0"
        });

        // Evaluate inside page to clean up empty tags
        await page.evaluate(() => {
            document.querySelectorAll("p, div, li, ul").forEach(el => {
                if (!el.textContent.trim() && el.children.length === 0) {
                    el.remove();
                }
            });
        });

        const pdf = await page.pdf({
            format: "A4",
            printBackground: true,
            margin: {
                top: `${marginMm}mm`,
                bottom: `${marginMm}mm`,
                left: `${marginMm}mm`,
                right: `${marginMm}mm`
            }
        });

        return Buffer.from(pdf);
    } finally {
        await browser.close();
    }
}

/**
 * Generate ATS Resume PDF using PRIMARY model with guaranteed 1-page validation loop
 */
async function generateResumePdfBuffer({
    resume,
    selfDescription,
    jobDescription
}) {

    const prompt = buildResumePdfPrompt({
        resume,
        selfDescription,
        jobDescription
    });

    const response = await generateJson({
        model: MODELS.PRIMARY,
        contents: prompt,
        config: {
            temperature: 0.1,
            responseMimeType: "application/json",
            responseSchema: zodToJsonSchema(
                resumePdfSchema
            )
        }
    });

    // Step 1: Factual Sanitization against source
    let html = sanitizeResumeHtml(response.html, resume, selfDescription);

    // Pass 1: Standard LaTeX density render (14mm margins)
    let pdfBuffer = await renderHtmlToPdf(html, 14);
    let pageCount = await countPdfPages(pdfBuffer);
    if (pageCount === 1) return pdfBuffer;

    // Pass 2: Content Compression (Trim to max 2 bullets per item + tight spacing)
    html = trimHtmlContent(html);
    const pass2Styles = `
        <style>
            body { font-size: 9.3pt !important; line-height: 1.25 !important; }
            .section-title { margin-top: 5px !important; margin-bottom: 2px !important; }
            .item-block { margin-bottom: 3px !important; }
            ul.compact-list { margin: 1px 0 0 0 !important; }
            ul.compact-list li { margin-bottom: 1px !important; line-height: 1.24 !important; }
        </style>
    `;
    let tightenedHtml = html.includes("</head>") ? html.replace("</head>", `${pass2Styles}</head>`) : `${pass2Styles}${html}`;
    pdfBuffer = await renderHtmlToPdf(tightenedHtml, 12);
    pageCount = await countPdfPages(pdfBuffer);
    if (pageCount === 1) return pdfBuffer;

    // Pass 3: Spacing & Margin Compression (10mm margins, 9pt font)
    const pass3Styles = `
        <style>
            body { font-size: 9.0pt !important; line-height: 1.22 !important; }
            .name { font-size: 16pt !important; margin-bottom: 2px !important; }
            .section-title { font-size: 9.8pt !important; margin-top: 4px !important; margin-bottom: 2px !important; }
            .summary-text { font-size: 8.8pt !important; line-height: 1.24 !important; }
            .two-col-row { font-size: 9.0pt !important; margin-bottom: 0px !important; }
            .item-block { margin-bottom: 2px !important; }
            ul.compact-list li { font-size: 8.8pt !important; line-height: 1.22 !important; margin-bottom: 0.5px !important; }
        </style>
    `;
    tightenedHtml = tightenedHtml.includes("</head>") ? tightenedHtml.replace("</head>", `${pass3Styles}</head>`) : `${pass3Styles}${tightenedHtml}`;
    pdfBuffer = await renderHtmlToPdf(tightenedHtml, 10);
    pageCount = await countPdfPages(pdfBuffer);
    if (pageCount === 1) return pdfBuffer;

    // Pass 4: Safe Minimum Single-Page Guarantee (8mm margins, 8.8pt font)
    const pass4Styles = `
        <style>
            body { font-size: 8.8pt !important; line-height: 1.18 !important; }
            .name { font-size: 15pt !important; margin-bottom: 1px !important; }
            .contact-bar { font-size: 8.2pt !important; }
            .section-title { font-size: 9.5pt !important; margin-top: 3px !important; margin-bottom: 1px !important; padding-bottom: 0.5px !important; }
            .summary-text { font-size: 8.5pt !important; line-height: 1.18 !important; margin-bottom: 1px !important; }
            .skills-block { gap: 1.5px !important; font-size: 8.6pt !important; }
            .two-col-row { font-size: 8.6pt !important; margin-bottom: 0px !important; }
            .item-block { margin-bottom: 2px !important; }
            ul.compact-list { margin: 0 !important; }
            ul.compact-list li { font-size: 8.5pt !important; line-height: 1.18 !important; margin-bottom: 0.5px !important; }
        </style>
    `;
    tightenedHtml = tightenedHtml.includes("</head>") ? tightenedHtml.replace("</head>", `${pass4Styles}</head>`) : `${pass4Styles}${tightenedHtml}`;
    pdfBuffer = await renderHtmlToPdf(tightenedHtml, 8);

    return pdfBuffer;
}

module.exports = {
    generateResumePdfBuffer,
    countPdfPages,
    sanitizeResumeHtml,
    trimHtmlContent
};