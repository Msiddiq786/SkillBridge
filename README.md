# STUDENT_SKILL_BRIGDE

An AI-powered interview preparation platform that analyzes a candidate's resume and target job description to generate personalized interview preparation.

The platform combines resume analysis, interview questions, skill-gap identification, and a structured preparation roadmap into a single workflow.

> **Note:** This project started from an existing open-source foundation and has been substantially extended with a modular Gemini AI pipeline, progress tracking, resume analysis, interview preparation features, and planned dashboard/ATS enhancements.

## Features

### Resume & Job Analysis

* Resume PDF upload and parsing
* Job description analysis
* Resume-to-job match score
* Strong skill identification
* Weak skill identification
* Missing keyword identification
* Personalized improvement summary

### AI Interview Preparation

* 20 technical interview questions
* 15 behavioral interview questions
* Easy / Medium / Hard difficulty levels
* Interviewer intention for each question
* Detailed model answers
* Common mistakes
* Follow-up questions
* Learning resources

### Personalized Roadmap

* 15-day interview preparation roadmap
* 5–8 tasks per day
* Estimated study time
* Learning resources
* Progressive preparation from fundamentals to mock interviews

### Skill Gap Analysis

* Skills missing from the candidate profile
* Severity levels
* Reasons for each gap
* Improvement recommendations
* Estimated learning time
* Learning resources

### Resume Generation

* ATS-friendly resume generation
* AI-tailored resume content
* HTML-to-PDF generation using Puppeteer

### Authentication

* User registration
* Login
* JWT-based authentication
* Protected routes
* Secure password hashing

### Progress & Performance

* AI generation progress tracking
* Modular AI generators
* Parallel generation using `Promise.all()`
* Gemini retry handling
* Response caching
* Structured AI response validation

## Technology Stack

### Frontend

* React.js
* Vite
* JavaScript (ES6+)
* React Router
* Axios
* SCSS
* Context API

### Backend

* Node.js
* Express.js
* REST APIs
* JWT
* Cookie Parser
* CORS
* Multer

### Database

* MongoDB
* Mongoose

### AI

* Google Gemini API
* `@google/genai`
* Zod
* `zod-to-json-schema`

### Document Processing

* `pdf-parse`
* Puppeteer
* HTML to PDF generation

### Development

* Git
* GitHub
* VS Code
* npm
* Nodemon
* dotenv

## Architecture

```text
                    ┌────────────────────┐
                    │      React UI      │
                    └─────────┬──────────┘
                              │
                              ▼
                    ┌────────────────────┐
                    │    Express API     │
                    └─────────┬──────────┘
                              │
                ┌─────────────┴─────────────┐
                ▼                           ▼
        Authentication               Interview API
                │                           │
                │                           ▼
                │                  ┌─────────────────┐
                │                  │   AI Service    │
                │                  └────────┬────────┘
                │                           │
                │                    Resume Analysis
                │                           │
                │                           ▼
                │                  ┌─────────────────┐
                │                  │   Promise.all   │
                │                  └───────┬─────────┘
                │                          │
                │          ┌───────────────┼───────────────┐
                │          ▼               ▼               ▼
                │     Technical       Behavioral       Skill Gap
                │     Questions       Questions        Analysis
                │          │               │               │
                │          └───────────────┼───────────────┘
                │                          ▼
                │                       Roadmap
                │                          │
                │                          ▼
                │                  Merge Interview Report
                │                          │
                └──────────────────────────┼───────────────
                                           ▼
                                      MongoDB
```

## Project Structure

```text
Interview-AI-Pro/
│
├── Backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middlewares/
│   │   ├── models/
│   │   ├── routes/
│   │   └── services/
│   │       ├── ai.service.js
│   │       ├── cache.service.js
│   │       ├── progress.service.js
│   │       └── ai/
│   │           ├── genai.client.js
│   │           ├── logger.js
│   │           ├── schemas.js
│   │           ├── prompts/
│   │           ├── generators/
│   │           └── utils/
│   │
│   ├── server.js
│   └── package.json
│
├── Frontend/
│   ├── src/
│   │   ├── features/
│   │   ├── contexts/
│   │   ├── routes/
│   │   └── components/
│   └── package.json
│
├── .gitignore
└── README.md
```

## Getting Started

### Prerequisites

Install:

* Node.js
* npm
* MongoDB / MongoDB Atlas
* Google Gemini API key

### Backend Setup

```bash
cd Backend
npm install
```

Create:

```text
Backend/.env
```

Example:

```env
PORT=3000
GOOGLE_GENAI_API_KEY=your_gemini_api_key
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
```

Start the backend:

```bash
npm start
```

The API runs on:

```text
http://localhost:3000
```

### Frontend Setup

Open a second terminal:

```bash
cd Frontend
npm install
npm run dev
```

Then open:

```text
http://localhost:5173
```

## Main API Routes

### Authentication

```text
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/logout
GET  /api/auth/get-me
```

### Interview

```text
POST /api/interview/
GET  /api/interview/
GET  /api/interview/report/:interviewId
POST /api/interview/resume/pdf/:interviewReportId
```

### Progress

```text
GET /api/progress
```

## AI Generation Flow

```text
Resume + Self Description + Job Description
                  │
                  ▼
          Resume Analysis
                  │
                  ▼
        ┌─────────────────────┐
        │ Parallel Generation │
        ├─────────────────────┤
        │ Technical Questions │
        │ Behavioral Questions│
        │ Skill Gap Analysis   │
        │ Preparation Roadmap  │
        └──────────┬──────────┘
                   ▼
            Final Report
                   │
                   ▼
               MongoDB
```

## Planned Enhancements

The platform is being expanded toward a complete AI interview coach.

Planned features include:

* Progressive report generation
* Live AI generation progress
* ATS resume scoring
* Resume keyword analysis
* Interview preparation dashboard
* Skill visualizations
* Multiple resume templates
* Text-based mock interviews
* Voice mock interviews
* Coding interview mode
* Company-specific interview preparation
* Interview analytics
* Study progress tracking
* Responsive and animated UI enhancements

## Security

Never commit `.env` files or API credentials.

Required environment variables should be documented using `.env.example`.

Sensitive information such as:

```text
GOOGLE_GENAI_API_KEY
MONGO_URI
JWT_SECRET
```

must never be exposed in the repository or application logs.

## Development Workflow

Recommended branches:

```text
main
  │
  └── Stable version

development
  │
  ├── AI refactor
  ├── Progress generation
  ├── ATS analysis
  ├── Dashboard
  └── UI/UX improvements
```

Feature-based commits are preferred:

```text
feat: add resume upload
feat: add AI interview generation
refactor: modularize Gemini pipeline
feat: add interview progress tracking
perf: optimize Gemini generation
feat: add ATS analysis
feat: add interview dashboard
```

## Project Goal

The goal of Interview AI Pro is to provide a practical, personalized interview preparation experience by connecting a candidate's existing profile with the requirements of a target role and turning that information into actionable preparation.

## License

Check the license of the original project and ensure all reused components are used according to its terms. Add your project's final license here once the ownership/licensing terms are settled.
