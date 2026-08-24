const MODELS = {
    PRIMARY: "models/gemini-3.5-flash-lite",
    FAST: "models/gemini-3.5-flash-lite",
    FALLBACK: "models/gemini-flash-lite-latest"
};

const MODEL = MODELS.PRIMARY;

const REPORT = {
    TECHNICAL_QUESTION_COUNT: 20,
    MCQ_QUESTION_COUNT: 15,
    BEHAVIORAL_QUESTION_COUNT: 10,
    ROADMAP_DAYS: 15,
    ROADMAP_TASKS_MIN: 5,
    ROADMAP_TASKS_MAX: 8,
    ANSWER_WORD_MIN: 150,
    ANSWER_WORD_MAX: 200,
    TECHNICAL_FOLLOWUP_COUNT: 5,
    BEHAVIORAL_FOLLOWUP_MIN: 3,
    BEHAVIORAL_FOLLOWUP_MAX: 5
};

const RETRY = {
    MAX_RETRIES: 3,
    BASE_DELAY_MS: 800,
    MAX_DELAY_MS: 4000,
    TIMEOUT_MS: 45000
};

module.exports = {
    MODELS,
    MODEL,
    REPORT,
    RETRY
};