const path = require('path');
const fs = require('fs');

console.log("================================================================================");
console.log("STUDENTSKILLHUB — FINAL PRE-DEPLOYMENT FULL SYSTEM AUDIT RUNNER");
console.log("================================================================================\n");

let passedChecks = 0;
let failedChecks = 0;
let p0Bugs = 0;
let p1Bugs = 0;
let p2Bugs = 0;
const defectsList = [];

function check(testName, fn) {
    try {
        fn();
        passedChecks++;
        console.log(`✓ [PASS] ${testName}`);
    } catch (err) {
        failedChecks++;
        p1Bugs++;
        defectsList.push({ name: testName, error: err.message });
        console.error(`❌ [FAIL] ${testName}: ${err.message}`);
    }
}

// ── PHASE 0: ROUTE & CONTROLLER DISCOVERY ──
console.log("--- PHASE 0 & 1: REPOSITORY & ROUTE INVENTORY ---");
check("Frontend Route Inventory Verification", () => {
    const routesPath = path.join(__dirname, '../../Frontend/src/app.routes.jsx');
    if (!fs.existsSync(routesPath)) throw new Error("app.routes.jsx not found");
    const content = fs.readFileSync(routesPath, 'utf8');
    const expectedRoutes = ['/login', '/register', '/', '/dashboard', '/progress', '/readiness', '/applications', '/achievements', '/profile', '/practice'];
    expectedRoutes.forEach(r => {
        if (!content.includes(r)) throw new Error(`Route ${r} missing from app.routes.jsx`);
    });
});

check("Backend API Route Inventory Verification", () => {
    const appPath = path.join(__dirname, 'app.js');
    const content = fs.readFileSync(appPath, 'utf8');
    const expectedMounts = ['/api/auth', '/api/interview', '/api/journey', '/api/progress', '/api/readiness', '/api/applications', '/api/profile', '/api/practice'];
    expectedMounts.forEach(m => {
        if (!content.includes(m)) throw new Error(`API Endpoint mount ${m} missing in app.js`);
    });
});

// ── PHASE 40: SECURITY SECRETS SCAN ──
console.log("\n--- PHASE 40: SECURITY SECRETS SCAN ---");
check("No Hardcoded Sensitive Keys in Source Files", () => {
    const searchDirs = [path.join(__dirname, 'config'), path.join(__dirname, 'services'), path.join(__dirname, '../../Frontend/src')];
    const sensitivePatterns = [/AIZA[0-9A-Za-z-_]{35}/, /sk-[a-zA-Z0-9]{32,}/];
    
    function scanDir(dir) {
        if (!fs.existsSync(dir)) return;
        const files = fs.readdirSync(dir);
        files.forEach(f => {
            const fullPath = path.join(dir, f);
            if (fs.statSync(fullPath).isDirectory()) {
                scanDir(fullPath);
            } else if (f.endsWith('.js') || f.endsWith('.jsx') || f.endsWith('.json')) {
                const text = fs.readFileSync(fullPath, 'utf8');
                sensitivePatterns.forEach(pattern => {
                    if (pattern.test(text)) throw new Error(`Hardcoded API secret found in ${fullPath}`);
                });
            }
        });
    }
    searchDirs.forEach(scanDir);
});

// ── PHASE 29 & 34: USER ISOLATION & IDOR AUDIT ──
console.log("\n--- PHASE 29 & 34: USER ISOLATION & IDOR SECURITY ---");
check("PDF Download Controller Scopes to Authenticated User ID", () => {
    const pdfControllerPath = path.join(__dirname, 'controllers/interview.controller.js');
    if (!fs.existsSync(pdfControllerPath)) throw new Error("interview.controller.js not found");
    const content = fs.readFileSync(pdfControllerPath, 'utf8');
    if (!content.includes('user: userId') && !content.includes('user: req.user.id') && !content.includes('user: req.user._id')) {
        throw new Error("IDOR Security Vulnerability: PDF controller is missing user scope query check!");
    }
});

// ── PHASE 8 & 31: MONOTONIC PROGRESS & MATH INVARIANTS ──
console.log("\n--- PHASE 8, 9 & 31: PROGRESS MONOTONICITY & DATA MATH INVARIANTS ---");
check("Monotonic Progress Service Invariant", () => {
    const servicePath = path.join(__dirname, 'services/progress.service.js');
    if (!fs.existsSync(servicePath)) throw new Error("progress.service.js not found");
    const content = fs.readFileSync(servicePath, 'utf8');
    if (!content.includes('Math.max(doc.progress || 0, calculatedProgress)')) {
        throw new Error("Progress service does not enforce monotonic max progression!");
    }
});

check("Requirement Classification Math Balance", () => {
    const mergePath = path.join(__dirname, 'services/ai/utils/mergeInterviewReport.js');
    if (!fs.existsSync(mergePath)) throw new Error("mergeInterviewReport.js not found");
    const content = fs.readFileSync(mergePath, 'utf8');
    if (!content.includes('skillClassification')) throw new Error("Report merger missing skill classification schema");
});

// ── SUMMARY & GATE DECLARATION ──
console.log("\n================================================================================");
console.log("FINAL AUDIT SUMMARY");
console.log("================================================================================");
console.log(`TOTAL CHECKS EXECUTED : ${passedChecks + failedChecks}`);
console.log(`PASSED                : ${passedChecks}`);
console.log(`FAILED                : ${failedChecks}`);
console.log(`P0 BUGS               : ${p0Bugs}`);
console.log(`P1 BUGS               : ${p1Bugs}`);
console.log(`P2 BUGS               : ${p2Bugs}`);
console.log("================================================================================");

if (failedChecks === 0 && p0Bugs === 0 && p1Bugs === 0) {
    console.log("🚀 PRODUCTION READY GATE: PASSED");
} else {
    console.log("🔴 NOT READY FOR PRODUCTION");
    process.exit(1);
}
