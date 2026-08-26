require("dotenv").config();
const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const app = express();

app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
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