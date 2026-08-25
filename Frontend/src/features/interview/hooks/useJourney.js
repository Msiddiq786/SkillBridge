import { useState, useEffect, useCallback } from 'react';
import {
    startLearningJourneyApi,
    getJourneyStatusApi,
    getDashboardJourneyApi,
    completeRoadmapDayApi,
    updateRoadmapDayTasksApi,
    recordLearningActivityApi,
    switchPrimaryJourneyApi,
    updateJobApplicationApi
} from '../services/journey.api';

export const useJourney = () => {
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchDashboard = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getDashboardJourneyApi();
            setDashboardData(data);
            return data;
        } catch (err) {
            console.error("fetchDashboard error:", err);
            setError(err.response?.data?.message || err.message || "Failed to load dashboard learning journey");
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    const startJourney = useCallback(async (reportId) => {
        try {
            const result = await startLearningJourneyApi({ reportId });
            await fetchDashboard();
            return result.journey;
        } catch (err) {
            console.error("startJourney error:", err);
            throw err;
        }
    }, [fetchDashboard]);

    const completeDay = useCallback(async (journeyId, dayNumber, taskIndices = []) => {
        try {
            const result = await completeRoadmapDayApi(journeyId, dayNumber, taskIndices);
            await fetchDashboard();
            return result;
        } catch (err) {
            console.error("completeDay error:", err);
            throw err;
        }
    }, [fetchDashboard]);

    const updateTasks = useCallback(async (journeyId, dayNumber, completedTasks = []) => {
        try {
            const result = await updateRoadmapDayTasksApi(journeyId, dayNumber, completedTasks);
            await fetchDashboard();
            return result;
        } catch (err) {
            console.error("updateTasks error:", err);
            throw err;
        }
    }, [fetchDashboard]);

    const switchJourney = useCallback(async (journeyId) => {
        try {
            const result = await switchPrimaryJourneyApi(journeyId);
            await fetchDashboard();
            return result;
        } catch (err) {
            console.error("switchJourney error:", err);
            throw err;
        }
    }, [fetchDashboard]);

    const updateApplication = useCallback(async (journeyId, status, jobUrl = '', notes = '') => {
        try {
            const result = await updateJobApplicationApi({ journeyId, status, jobUrl, notes });
            await fetchDashboard();
            return result.application;
        } catch (err) {
            console.error("updateApplication error:", err);
            throw err;
        }
    }, [fetchDashboard]);

    return {
        dashboardData,
        loading,
        error,
        fetchDashboard,
        startJourney,
        completeDay,
        updateTasks,
        switchJourney,
        updateApplication,
        getJourneyStatusApi
    };
};
