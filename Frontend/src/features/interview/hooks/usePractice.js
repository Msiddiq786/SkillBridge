import { useState, useCallback } from 'react';
import {
    startPracticeSessionApi,
    getPracticeSessionApi,
    updateProgressApi,
    submitAnswerApi,
    evaluateAnswerApi,
    completeSessionApi,
    getResultsApi,
    getPracticeStatsApi
} from '../services/practice.api';

export const usePractice = () => {
    const [loading, setLoading] = useState(false);
    const [evaluating, setEvaluating] = useState(false);
    const [session, setSession] = useState(null);
    const [report, setReport] = useState(null);
    const [stats, setStats] = useState(null);
    const [results, setResults] = useState(null);
    const [error, setError] = useState(null);

    const startSession = useCallback(async ({ interviewReportId, mode }) => {
        setLoading(true);
        setError(null);
        try {
            const data = await startPracticeSessionApi({ interviewReportId, mode });
            setSession(data.session);
            setReport(data.report);
            return data;
        } catch (err) {
            setError(err.response?.data?.message || err.message || "Failed to start practice session");
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const getSession = useCallback(async (sessionId) => {
        setLoading(true);
        setError(null);
        try {
            const data = await getPracticeSessionApi(sessionId);
            setSession(data.session);
            setReport(data.report);
            return data;
        } catch (err) {
            setError(err.response?.data?.message || err.message || "Failed to load practice session");
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const saveProgress = useCallback(async (sessionId, progressData, timeSpentDelta = 0) => {
        try {
            const data = await updateProgressApi(sessionId, progressData, timeSpentDelta);
            setSession(data.session);
            return data.session;
        } catch (err) {
            console.error("Failed to save practice progress:", err);
        }
    }, []);

    const submitAnswer = useCallback(async (sessionId, answerData) => {
        try {
            const data = await submitAnswerApi(sessionId, answerData);
            setSession(data.session);
            return data.session;
        } catch (err) {
            setError(err.response?.data?.message || err.message || "Failed to submit answer");
            throw err;
        }
    }, []);

    const evaluateAnswer = useCallback(async ({ questionType, questionData, userAnswer }) => {
        setEvaluating(true);
        setError(null);
        try {
            const data = await evaluateAnswerApi({ questionType, questionData, userAnswer });
            return data.evaluation;
        } catch (err) {
            const msg = err.response?.data?.message || "Answer evaluation is temporarily unavailable.";
            setError(msg);
            throw new Error(msg);
        } finally {
            setEvaluating(false);
        }
    }, []);

    const completeSession = useCallback(async (sessionId) => {
        setLoading(true);
        setError(null);
        try {
            const data = await completeSessionApi(sessionId);
            setSession(data.session);
            setReport(data.report);
            return data;
        } catch (err) {
            setError(err.response?.data?.message || err.message || "Failed to complete practice session");
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const getResults = useCallback(async (sessionId) => {
        setLoading(true);
        setError(null);
        try {
            const data = await getResultsApi(sessionId);
            setResults(data);
            setSession(data.session);
            setReport(data.report);
            return data;
        } catch (err) {
            setError(err.response?.data?.message || err.message || "Failed to load practice results");
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const getStats = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getPracticeStatsApi();
            setStats(data.stats);
            return data.stats;
        } catch (err) {
            console.error("Failed to get practice stats:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        loading,
        evaluating,
        session,
        report,
        stats,
        results,
        error,
        startSession,
        getSession,
        saveProgress,
        submitAnswer,
        evaluateAnswer,
        completeSession,
        getResults,
        getStats
    };
};
