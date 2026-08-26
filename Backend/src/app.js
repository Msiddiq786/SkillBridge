require("dotenv").config();
const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const app = express();

const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
    "https://studentskillhub.vercel.app",
    process.env.CLIENT_URL
].filter(Boolean);

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (e.g. mobile apps, curl, server-to-server, health checks)
        if (!origin) return callback(null, true);
        if (
            allowedOrigins.includes(origin) ||
            origin.endsWith(".vercel.app") ||
            origin.startsWith("http://localhost:") ||
            origin.startsWith("http://127.0.0.1:")
        ) {
            return callback(null, true);
        }
        return callback(null, true);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"]
}));

app.use(express.json());
app.use(cookieParser());

const authRouter = require("./routes/auth.routes");
const interviewRouter = require("./routes/interview.routes");
const progressRouter = require("./routes/progress.routes");
const practiceRouter = require("./routes/practice.routes");
const profileRouter = require("./routes/profile.routes");
const journeyRouter = require("./routes/journey.routes");
const readinessRouter = require("./routes/readiness.routes");
const applicationRouter = require("./routes/application.routes");

app.use("/api/auth", authRouter);
app.use("/api/interview", interviewRouter);
app.use("/api/progress", progressRouter);
app.use("/api/practice", practiceRouter);
app.use("/api/profile", profileRouter);
app.use("/api/journey", journeyRouter);
app.use("/api/readiness", readinessRouter);
app.use("/api/applications", applicationRouter);

module.exports = app;