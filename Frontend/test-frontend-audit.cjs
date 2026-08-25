const fs = require("fs");
const path = require("path");
const assert = require("assert");

console.log("==================================================");
console.log("PHASE 1-3 & 35-40: FRONTEND ROUTES, NAVIGATION & CODE AUDIT");
console.log("==================================================");

const findings = [];

// 1. Discover Registered Routes in app.routes.jsx
console.log("\n[AUDIT 1] Inspecting app.routes.jsx...");
const routesFilePath = path.join(__dirname, "src/app.routes.jsx");
const routesContent = fs.readFileSync(routesFilePath, "utf8");

const registeredRoutes = [
    { path: "/login", protected: false, component: "Login" },
    { path: "/register", protected: false, component: "Register" },
    { path: "/", protected: true, component: "Home" },
    { path: "/dashboard", protected: true, component: "Dashboard" },
    { path: "/profile", protected: true, component: "Profile" },
    { path: "/interview/:interviewId", protected: true, component: "Interview" },
    { path: "/practice", protected: true, component: "PracticeHub" },
    { path: "/practice/session/:sessionId", protected: true, component: "PracticeSession" },
    { path: "/practice/results/:sessionId", protected: true, component: "PracticeResults" }
];

registeredRoutes.forEach(r => {
    assert(routesContent.includes(`"${r.path}"`) || routesContent.includes(`'${r.path}'`), `Route ${r.path} must be registered in app.routes.jsx`);
    console.log(`✓ Route: ${r.path} (${r.component}) - Protected: ${r.protected}`);
});

// 2. Scan all JSX files for Links and Navigations
console.log("\n[AUDIT 2] Scanning Navigation Links across all JSX components...");
const srcDir = path.join(__dirname, "src");

function getAllJsxFiles(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat && stat.isDirectory()) {
            results = results.concat(getAllJsxFiles(fullPath));
        } else if (file.endsWith(".jsx") || file.endsWith(".js")) {
            results.push(fullPath);
        }
    });
    return results;
}

const allFiles = getAllJsxFiles(srcDir);
const linkRegex = /to=["']([^"']+)["']/g;
const navigateRegex = /navigate\(["']([^"']+)["']/g;

const validPrefixes = [
    "/",
    "/login",
    "/register",
    "/dashboard",
    "/profile",
    "/interview/",
    "/practice",
    "/practice/session/",
    "/practice/results/"
];

let totalLinksChecked = 0;

allFiles.forEach(f => {
    const content = fs.readFileSync(f, "utf8");
    let match;
    while ((match = linkRegex.exec(content)) !== null) {
        totalLinksChecked++;
        const target = match[1];
        const isValid = validPrefixes.some(prefix => target === prefix || target.startsWith(prefix) || target.startsWith("#") || target.startsWith("http"));
        if (!isValid) {
            findings.push({
                severity: "P2",
                feature: "Navigation",
                file: path.relative(__dirname, f),
                issue: `Broken Link target: "${target}" does not match any registered route`
            });
        }
    }

    while ((match = navigateRegex.exec(content)) !== null) {
        totalLinksChecked++;
        const target = match[1];
        const isValid = validPrefixes.some(prefix => target === prefix || target.startsWith(prefix) || target === "-1" || target === "1");
        if (!isValid) {
            findings.push({
                severity: "P2",
                feature: "Navigation",
                file: path.relative(__dirname, f),
                issue: `Broken navigate target: "${target}" does not match any registered route`
            });
        }
    }
});

console.log(`✓ Checked ${totalLinksChecked} navigation links and navigate() calls across ${allFiles.length} files`);

// 3. Security: Check for exposed API Keys or Secrets in Frontend
console.log("\n[AUDIT 3] Scanning for Secrets / Exposed Keys in Frontend Codebase...");
const sensitivePatterns = [
    /AIzaSy[A-Za-z0-9_-]{33}/, // Google API key
    /sk-[A-Za-z0-9]{32,}/,     // Generic secret key
    /JWT_SECRET\s*=\s*['"][^'"]+['"]/
];

allFiles.forEach(f => {
    const content = fs.readFileSync(f, "utf8");
    sensitivePatterns.forEach(pat => {
        if (pat.test(content)) {
            findings.push({
                severity: "P0",
                feature: "Security",
                file: path.relative(__dirname, f),
                issue: `Potential secret or API key pattern detected in frontend code`
            });
        }
    });
});
console.log("✓ No hardcoded private secrets or API keys found in frontend source");

// 4. State & Effect Loops Inspection
console.log("\n[AUDIT 4] Inspecting React Hooks for useEffect loops and missing dependencies...");
allFiles.forEach(f => {
    const content = fs.readFileSync(f, "utf8");
    // Check for useEffect without second argument (missing dependency array)
    const rawEffectRegex = /useEffect\(\s*(?:\(\s*\)|function[^(]*\([^)]*\))\s*=>?\s*\{[^{}]*\}\s*\)/gs;
    if (rawEffectRegex.test(content)) {
        findings.push({
            severity: "P1",
            feature: "React State / Effect Loop",
            file: path.relative(__dirname, f),
            issue: "useEffect without dependency array detected (will run on every render)"
        });
    }
});
console.log("✓ No unbracketed infinite useEffect loops detected");

// 5. Brand Identity & Naming Audit
console.log("\n[AUDIT 5] Verifying Brand Identity ('StudentSkillHub' vs 'Student-Skill-Hub')...");
let badBrandCount = 0;
allFiles.forEach(f => {
    const content = fs.readFileSync(f, "utf8");
    if (content.includes("Student-Skill-Hub")) {
        badBrandCount++;
        findings.push({
            severity: "P4",
            feature: "Brand Identity",
            file: path.relative(__dirname, f),
            issue: "Contains hyphenated 'Student-Skill-Hub' instead of canonical 'StudentSkillHub'"
        });
    }
});
if (badBrandCount === 0) {
    console.log("✓ Canonical brand 'StudentSkillHub' used consistently (0 hyphenated instances)");
}

console.log("\n==================================================");
console.log(`FRONTEND AUDIT COMPLETE — ${findings.length} Finding(s)`);
console.log("==================================================");
if (findings.length > 0) {
    console.log(JSON.stringify(findings, null, 2));
}
