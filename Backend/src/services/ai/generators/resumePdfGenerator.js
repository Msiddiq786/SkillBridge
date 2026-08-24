const puppeteer = require("puppeteer");
const { zodToJsonSchema } = require("zod-to-json-schema");
const { generateJson, MODELS } = require("../genai.client");
const { resumePdfSchema } = require("../schemas");
const { buildResumePdfPrompt } = require("../prompts/resumePdf.prompt");

/**
 * Convert HTML to PDF
 */
async function generatePdf(html) {

    const browser = await puppeteer.launch({
        headless: true
    });

    const page = await browser.newPage();

    await page.setContent(html, {
        waitUntil: "networkidle0"
    });

    const pdf = await page.pdf({
        format: "A4",
        printBackground: true,
        margin: {
            top: "20mm",
            bottom: "20mm",
            left: "15mm",
            right: "15mm"
        }
    });

    await browser.close();

    return pdf;

}

/**
 * Generate ATS Resume PDF using PRIMARY model for formatting fidelity
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
            temperature: 0.2,
            responseMimeType: "application/json",
            responseSchema: zodToJsonSchema(
                resumePdfSchema
            )
        }
    });

    return await generatePdf(response.html);

}

module.exports = {
    generateResumePdfBuffer
};