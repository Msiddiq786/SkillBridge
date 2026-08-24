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
const progressRouter = require("./routes/progress.routes"); // or progress.routes

app.use("/api/auth", authRouter);
app.use("/api/interview", interviewRouter);
app.use("/api/progress", progressRouter);

module.exports = app;