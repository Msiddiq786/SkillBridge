require("dotenv").config();
const express = require("express");
const app = require("./app");
const http = require("http");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const User = require("./models/user.model");
const InterviewReport = require("./models/interviewReport.model");

async function testRoutes() {
    await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/interview-ai");
    console.log("Connected to DB");

    const server = http.createServer(app);
    await new Promise(resolve => server.listen(0, resolve));
    const port = server.address().port;
    console.log("Test server running on port", port);

    // Create / find a user
    let user = await User.findOne({ email: "practice_user_a@test.com" });
    if (!user) {
        user = await User.create({ username: "CandidateAlice", email: "practice_user_a@test.com", password: "pwd" });
    }

    const token = jwt.sign({ id: user._id, username: user.username }, process.env.JWT_SECRET, { expiresIn: "1d" });

    let report = await InterviewReport.findOne({ user: user._id });
    if (!report) {
        report = await InterviewReport.create({
            user: user._id,
            title: "Test Track",
            jobDescription: "Test JD",
            resume: "Test Resume",
            matchScore: 80
        });
    }

    // Test POST /api/practice/start
    const res = await fetch(`http://localhost:${port}/api/practice/start`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Cookie": `token=${token}`
        },
        body: JSON.stringify({
            interviewReportId: report._id.toString(),
            mode: "technical"
        })
    });

    console.log("POST /api/practice/start status:", res.status);
    const data = await res.json();
    console.log("Response data:", data);

    server.close();
    await mongoose.disconnect();
}

testRoutes().catch(err => {
    console.error("Test failed:", err);
    process.exit(1);
});
