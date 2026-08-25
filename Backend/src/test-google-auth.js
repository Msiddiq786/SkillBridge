require("dotenv").config();
const http = require("http");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const app = require("./app");
const User = require("./models/user.model");
const tokenBlacklistModel = require("./models/blacklist.model");

async function runGoogleAuthTestSuite() {
    console.log("================================================================");
    console.log("RUNNING GOOGLE AUTH & ACCOUNT LINKING VERIFICATION TEST SUITE");
    console.log("================================================================");

    await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/interview-ai");
    console.log("✓ Connected to Database");

    const server = http.createServer(app);
    await new Promise(resolve => server.listen(0, resolve));
    const port = server.address().port;
    const baseUrl = `http://localhost:${port}`;
    console.log(`✓ Test HTTP server running on ${baseUrl}`);

    // Cleanup previous test users
    await User.deleteMany({ email: { $in: [
        "local_user_test@example.com",
        "google_new_user@example.com",
        "link_test_user@example.com"
    ] } });
    await tokenBlacklistModel.deleteMany({});

    // ── TEST 1: Local Registration ──
    console.log("\n--- TEST 1: Local User Registration ---");
    const regRes = await fetch(`${baseUrl}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            username: "local_user_test",
            email: "local_user_test@example.com",
            password: "LocalPassword123!"
        })
    });
    console.log(`Status: ${regRes.status} (Expected: 201)`);
    const regData = await regRes.json();
    if (regRes.status !== 201 || !regData.user?.id) {
        throw new Error("TEST 1 Failed: Local registration failed");
    }
    console.log(`✓ Local user created: ID = ${regData.user.id}, Username = ${regData.user.username}`);

    // ── TEST 2: Local User Login ──
    console.log("\n--- TEST 2: Local User Login ---");
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            email: "local_user_test@example.com",
            password: "LocalPassword123!"
        })
    });
    console.log(`Status: ${loginRes.status} (Expected: 200)`);
    const loginData = await loginRes.json();
    const cookieHeader = loginRes.headers.get("set-cookie");
    if (loginRes.status !== 200 || !loginData.user) {
        throw new Error("TEST 2 Failed: Local login failed");
    }
    console.log(`✓ Local login successful, cookie header received: ${!!cookieHeader}`);

    // ── TEST 3: Missing Credential Rejection ──
    console.log("\n--- TEST 3: Google Auth Missing Credential Rejection ---");
    const missingCredRes = await fetch(`${baseUrl}/api/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({})
    });
    console.log(`Status: ${missingCredRes.status} (Expected: 400)`);
    const missingCredData = await missingCredRes.json();
    console.log(`Message: "${missingCredData.message}"`);
    if (missingCredRes.status !== 400) {
        throw new Error("TEST 3 Failed: Missing credential should return 400");
    }
    console.log("✓ Correctly rejected missing credential");

    // ── TEST 4: Unconfigured Google Client ID ──
    console.log("\n--- TEST 4: Unconfigured Server Behavior ---");
    const savedClientId = process.env.GOOGLE_CLIENT_ID;
    delete process.env.GOOGLE_CLIENT_ID;

    const unconfRes = await fetch(`${baseUrl}/api/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: "some-token" })
    });
    console.log(`Status when unconfigured: ${unconfRes.status} (Expected: 500)`);
    const unconfData = await unconfRes.json();
    console.log(`Message: "${unconfData.message}"`);
    if (unconfRes.status !== 500) {
        throw new Error("TEST 4 Failed: Should return 500 when GOOGLE_CLIENT_ID is not configured");
    }
    console.log("✓ Server gracefully reports unconfigured Google auth");

    // Set test client ID for remaining tests
    process.env.GOOGLE_CLIENT_ID = "test-oauth-client-id.apps.googleusercontent.com";

    // ── TEST 5: Invalid Google Token Rejection ──
    console.log("\n--- TEST 5: Invalid Google Token Rejection ---");
    const invalidTokenRes = await fetch(`${baseUrl}/api/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: "invalid.fake.jwt.token" })
    });
    console.log(`Status: ${invalidTokenRes.status} (Expected: 401)`);
    const invalidTokenData = await invalidTokenRes.json();
    console.log(`Message: "${invalidTokenData.message}"`);
    if (invalidTokenRes.status !== 401) {
        throw new Error("TEST 5 Failed: Invalid Google token should return 401");
    }
    console.log("✓ Correctly rejected invalid Google token");

    // ── Setup Mock Verification for Valid & Link Token Tests ──
    const { OAuth2Client } = require("google-auth-library");
    const googleClientProto = OAuth2Client.prototype;
    const origVerify = googleClientProto.verifyIdToken;

    googleClientProto.verifyIdToken = async function({ idToken, audience }) {
        if (idToken === "valid-mock-google-token-1") {
            return {
                getPayload: () => ({
                    sub: "google-uid-10001",
                    email: "google_new_user@example.com",
                    email_verified: true,
                    name: "Google Jane",
                    picture: "https://example.com/avatar1.jpg"
                })
            };
        }
        if (idToken === "valid-mock-google-token-link") {
            return {
                getPayload: () => ({
                    sub: "google-uid-10002",
                    email: "link_test_user@example.com",
                    email_verified: true,
                    name: "Link User",
                    picture: "https://example.com/avatar2.jpg"
                })
            };
        }
        if (idToken === "unverified-email-token") {
            return {
                getPayload: () => ({
                    sub: "google-uid-99999",
                    email: "unverified@example.com",
                    email_verified: false
                })
            };
        }
        throw new Error("Invalid token signature");
    };

    // ── TEST 6: Google Sign-In with Verified Token (New User) ──
    console.log("\n--- TEST 6: Google Sign-In & New User Creation ---");
    const googleNewRes = await fetch(`${baseUrl}/api/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: "valid-mock-google-token-1" })
    });
    console.log(`Status: ${googleNewRes.status} (Expected: 200)`);
    const googleNewData = await googleNewRes.json();
    const googleCookie = googleNewRes.headers.get("set-cookie");
    console.log(`User created:`, googleNewData.user);
    if (googleNewRes.status !== 200 || !googleNewData.user || googleNewData.user.email !== "google_new_user@example.com") {
        throw new Error("TEST 6 Failed: Google sign-in failed to create user");
    }
    const createdGoogleUser = await User.findOne({ googleId: "google-uid-10001" });
    if (!createdGoogleUser || createdGoogleUser.avatar !== "https://example.com/avatar1.jpg") {
        throw new Error("TEST 6 Failed: Google user fields not saved properly");
    }
    console.log("✓ Google user successfully created in MongoDB with avatar and googleId");

    // ── TEST 7: Subsequent Google Sign-In with Existing Google Account ──
    console.log("\n--- TEST 7: Existing Google User Login ---");
    const googleExistingRes = await fetch(`${baseUrl}/api/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: "valid-mock-google-token-1" })
    });
    const googleExistingData = await googleExistingRes.json();
    console.log(`Status: ${googleExistingRes.status} (Expected: 200)`);
    if (googleExistingData.user.id !== createdGoogleUser._id.toString()) {
        throw new Error("TEST 7 Failed: Re-login should return the same user, not a duplicate");
    }
    const totalUsersWithGoogleId = await User.countDocuments({ googleId: "google-uid-10001" });
    if (totalUsersWithGoogleId !== 1) {
        throw new Error("TEST 7 Failed: Duplicate user created on re-login");
    }
    console.log("✓ Existing Google account logged in without duplicates (Total with ID: 1)");

    // ── TEST 8: Safe Account Linking (Existing Local User Links Google) ──
    console.log("\n--- TEST 8: Safe Account Linking (Local User + Google Login) ---");
    // 1. Create a local user first with password
    await fetch(`${baseUrl}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            username: "link_test_user",
            email: "link_test_user@example.com",
            password: "MyLocalPassword789!"
        })
    });

    const userBeforeLinking = await User.findOne({ email: "link_test_user@example.com" });
    const originalPasswordHash = userBeforeLinking.password;

    // 2. User signs in with Google using the same email
    const linkRes = await fetch(`${baseUrl}/api/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: "valid-mock-google-token-link" })
    });
    const linkData = await linkRes.json();
    console.log(`Google Link Status: ${linkRes.status} (Expected: 200)`);
    if (linkRes.status !== 200 || linkData.user.email !== "link_test_user@example.com") {
        throw new Error("TEST 8 Failed: Google linking failed");
    }

    const userAfterLinking = await User.findOne({ email: "link_test_user@example.com" });
    if (userAfterLinking.googleId !== "google-uid-10002") {
        throw new Error("TEST 8 Failed: googleId was not linked");
    }
    if (userAfterLinking.password !== originalPasswordHash) {
        throw new Error("TEST 8 Failed: Original password was altered or deleted during linking!");
    }
    console.log("✓ Google identity linked to existing local account without modifying password");

    // 3. Verify user can STILL login using password
    const passLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            email: "link_test_user@example.com",
            password: "MyLocalPassword789!"
        })
    });
    console.log(`Password Login after Linking Status: ${passLoginRes.status} (Expected: 200)`);
    if (passLoginRes.status !== 200) {
        throw new Error("TEST 8 Failed: Local password login stopped working after linking Google account!");
    }
    console.log("✓ Linked account successfully logged in with password!");

    // ── TEST 9: Unverified Google Email Rejection ──
    console.log("\n--- TEST 9: Unverified Email Rejection ---");
    const unverifiedRes = await fetch(`${baseUrl}/api/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: "unverified-email-token" })
    });
    console.log(`Status: ${unverifiedRes.status} (Expected: 401)`);
    if (unverifiedRes.status !== 401) {
        throw new Error("TEST 9 Failed: Unverified Google email should be rejected");
    }
    console.log("✓ Unverified Google email rejected with 401");

    // ── TEST 10: Protected Route & Logout ──
    console.log("\n--- TEST 10: Protected Route & Logout Flow ---");
    // Extract token from cookie
    const tokenMatch = googleCookie.match(/token=([^;]+)/);
    const validJwtToken = tokenMatch ? tokenMatch[1] : null;

    // Access protected route /api/auth/get-me
    const getMeRes = await fetch(`${baseUrl}/api/auth/get-me`, {
        headers: { "Cookie": `token=${validJwtToken}` }
    });
    console.log(`getMe status with JWT: ${getMeRes.status} (Expected: 200)`);
    const getMeData = await getMeRes.json();
    if (getMeRes.status !== 200 || !getMeData.user) {
        throw new Error("TEST 10 Failed: /api/auth/get-me failed with valid JWT");
    }
    console.log(`✓ Protected route returned user: ${getMeData.user.username}`);

    // Logout
    const logoutRes = await fetch(`${baseUrl}/api/auth/logout`, {
        headers: { "Cookie": `token=${validJwtToken}` }
    });
    console.log(`Logout status: ${logoutRes.status} (Expected: 200)`);

    // Verify token is now blacklisted
    const getMeAfterLogout = await fetch(`${baseUrl}/api/auth/get-me`, {
        headers: { "Cookie": `token=${validJwtToken}` }
    });
    console.log(`getMe after logout: ${getMeAfterLogout.status} (Expected: 401)`);
    if (getMeAfterLogout.status !== 401) {
        throw new Error("TEST 10 Failed: Blacklisted token still accessed protected route!");
    }
    console.log("✓ Token successfully blacklisted on logout");

    // Restore verifyIdToken and env
    googleClientProto.verifyIdToken = origVerify;
    if (savedClientId) {
        process.env.GOOGLE_CLIENT_ID = savedClientId;
    } else {
        delete process.env.GOOGLE_CLIENT_ID;
    }

    server.close();
    await mongoose.disconnect();

    console.log("\n================================================================");
    console.log("ALL 10 GOOGLE AUTH & LINKING TEST SUITES PASSED 100%!");
    console.log("================================================================");
}

runGoogleAuthTestSuite().catch(err => {
    console.error("Test Suite Failed:", err);
    process.exit(1);
});
