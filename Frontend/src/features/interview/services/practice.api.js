import API from "../../../services/apiClient";

export const startPracticeSessionApi = async ({ interviewReportId, mode }) => {
    const response = await API.post("/api/practice/start", { interviewReportId, mode });
    return response.data;
};

export const getPracticeSessionApi = async (sessionId) => {
    const response = await API.get(`/api/practice/${sessionId}`);
    return response.data;
};

export const updateProgressApi = async (sessionId, progressData, timeSpentDelta = 0) => {
    const response = await API.patch(`/api/practice/${sessionId}/progress`, { progressData, timeSpentDelta });
    return response.data;
};

export const submitAnswerApi = async (sessionId, answerData) => {
    const response = await API.post(`/api/practice/${sessionId}/answer`, answerData);
    return response.data;
};

export const evaluateAnswerApi = async ({ questionType, questionData, userAnswer }) => {
    const response = await API.post("/api/practice/evaluate", { questionType, questionData, userAnswer });
    return response.data;
};

export const completeSessionApi = async (sessionId) => {
    const response = await API.post(`/api/practice/${sessionId}/complete`);
    return response.data;
};

export const getResultsApi = async (sessionId) => {
    const response = await API.get(`/api/practice/${sessionId}/results`);
    return response.data;
};

export const getPracticeStatsApi = async () => {
    const response = await API.get("/api/practice/stats");
    return response.data;
};
