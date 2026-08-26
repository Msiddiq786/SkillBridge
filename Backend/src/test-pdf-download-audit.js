process.env.GOOGLE_GENAI_API_KEY = process.env.GOOGLE_GENAI_API_KEY || "mock_key_for_test";
const assert = require("assert");

// Mock PDF generator before controller imports ai.service
const pdfGenModule = require("./services/ai/generators/resumePdfGenerator");
let pdfGenerationCalled = false;
pdfGenModule.generateResumePdfBuffer = async function() {
    pdfGenerationCalled = true;
    return Buffer.from("%PDF-1.4 Fake PDF Content...");
};

const interviewController = require("./controllers/interview.controller");
const interviewReportModel = require("./models/interviewReport.model");

console.log("==================================================");
console.log("TESTING JD-READY RESUME PDF DOWNLOAD AUDIT SUITE");
console.log("==================================================");

// Mock res helper
function createMockRes() {
    return {
        statusCode: 200,
        headers: {},
        sentData: null,
        status(code) {
            this.statusCode = code;
            return this;
        },
        set(hdrObj) {
            Object.assign(this.headers, hdrObj);
            return this;
        },
        setHeader(key, val) {
            this.headers[key] = val;
            return this;
        },
        json(data) {
            this.sentData = data;
            return this;
        },
        send(data) {
            this.sentData = data;
            return this;
        }
    };
}

async function runPdfDownloadTests() {
    // [TEST 1] Controller Exports & Method Verification
    console.log("\n[TEST 1] Verifying Backend Controller Exports...");
    assert.strictEqual(typeof interviewController.generateResumePdfController, "function", "generateResumePdfController must be exported");
    console.log("✓ TEST 1 Passed: generateResumePdfController function verified");

    // [TEST 2] Ownership & IDOR Protection Check
    console.log("\n[TEST 2] Testing User Ownership & IDOR Security Scoping...");
    const originalFindOne = interviewReportModel.findOne;

    let queriedFilter = null;
    interviewReportModel.findOne = function(filter) {
        queriedFilter = filter;
        return Promise.resolve(null); // Return null (not found)
    };

    const mockReq = {
        params: { interviewReportId: "507f1f77bcf86cd799439011" },
        user: { id: "user_owner_999", _id: "user_owner_999" }
    };
    const mockRes = createMockRes();

    await interviewController.generateResumePdfController(mockReq, mockRes);

    assert(queriedFilter, "findOne should have been called");
    assert.strictEqual(queriedFilter._id, "507f1f77bcf86cd799439011", "Query must filter by report ID");
    assert.strictEqual(queriedFilter.user, "user_owner_999", "Query MUST filter by authenticated user ID (IDOR Protection)");
    assert.strictEqual(mockRes.statusCode, 404, "Unowned report returns 404 status");
    assert.strictEqual(mockRes.sentData.message, "Interview report not found.", "Clear non-leaking message");
    console.log("✓ TEST 2 Passed: Scoped findOne({ _id, user: req.user.id }) prevents IDOR cross-user access");

    // Restore findOne
    interviewReportModel.findOne = originalFindOne;

    // [TEST 3] PDF Content-Type & Attachment Headers
    console.log("\n[TEST 3] Testing Headers & Buffer Response...");
    const fakeReport = {
        _id: "507f1f77bcf86cd799439011",
        user: "user_owner_999",
        resume: "Software Developer candidate...",
        jobDescription: "Full Stack Engineer...",
        selfDescription: "Passionate engineer..."
    };

    interviewReportModel.findOne = function() {
        return Promise.resolve(fakeReport);
    };

    const mockResSuccess = createMockRes();
    await interviewController.generateResumePdfController(mockReq, mockResSuccess);

    assert.strictEqual(pdfGenerationCalled, true, "generateResumePdf generator should be invoked");
    assert.strictEqual(mockResSuccess.statusCode, 200, "Successful PDF request returns HTTP 200");
    assert.strictEqual(mockResSuccess.headers["Content-Type"], "application/pdf", "Content-Type header must be application/pdf");
    assert(mockResSuccess.headers["Content-Disposition"].includes("attachment; filename="), "Content-Disposition must specify attachment filename");
    assert(Buffer.isBuffer(mockResSuccess.sentData), "Returned body must be binary PDF buffer");
    assert(mockResSuccess.sentData.length > 0, "PDF buffer must be non-empty");
    console.log("✓ TEST 3 Passed: Returns HTTP 200, Content-Type: application/pdf, and non-empty PDF Buffer");

    // Restore findOne
    interviewReportModel.findOne = originalFindOne;

    // [TEST 4] Frontend API Architecture Audit
    console.log("\n[TEST 4] Verifying Frontend API Architecture & Method Alignment...");
    const fs = require("fs");
    const path = require("path");

    const apiJsPath = path.join(__dirname, "../../Frontend/src/features/interview/services/interview.api.js");
    const apiJsContent = fs.readFileSync(apiJsPath, "utf8");

    assert(apiJsContent.includes("api.post(`/api/interview/resume/pdf/${interviewReportId}`"), "Frontend API MUST use HTTP POST to /api/interview/resume/pdf/:id");
    assert(apiJsContent.includes("responseType: \"blob\""), "Frontend API MUST specify responseType: blob");
    console.log("✓ TEST 4 Passed: Frontend interview.api.js uses HTTP POST with responseType: blob");

    // [TEST 5] Frontend Readiness Page Audit (No Anchor Tag GET)
    console.log("\n[TEST 5] Verifying Readiness Page Anchor Tag Removal...");
    const readinessPath = path.join(__dirname, "../../Frontend/src/features/interview/pages/Readiness.jsx");
    const readinessContent = fs.readFileSync(readinessPath, "utf8");

    assert(!readinessContent.includes("href={`http://localhost:3000/api/interview/resume/pdf/"), "Readiness.jsx MUST NOT use hardcoded anchor href GET links");
    assert(readinessContent.includes("getResumePdf"), "Readiness.jsx MUST use getResumePdf hook");
    assert(readinessContent.includes("handleDownloadPdf"), "Readiness.jsx MUST handle PDF download with button");
    assert(readinessContent.includes("Generating Resume..."), "Readiness.jsx MUST display loading state while generating");
    console.log("✓ TEST 5 Passed: Readiness.jsx updated to use interactive POST button with state feedback");

    console.log("\n==================================================");
    console.log("ALL PDF DOWNLOAD AUDIT TESTS PASSED! 🚀");
    console.log("==================================================");
}

runPdfDownloadTests().catch(err => {
    console.error("❌ PDF Audit Test Failure:", err);
    process.exit(1);
});
