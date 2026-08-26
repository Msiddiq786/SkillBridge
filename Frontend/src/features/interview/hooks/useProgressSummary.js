import { useState, useEffect, useCallback, useRef } from 'react';
import { getProgressSummaryApi } from '../services/progress.api';

const DEFAULT_SUMMARY = {
    analyses: {
        total: 0,
        completed: 0,
        active: 0,
        notStarted: 0,
        averageMatchScore: 0,
        preparationCompletionRate: 0
    },
    journeys: {
        started: 0,
        completed: 0,
        active: 0
    },
    skills: {
        gained: 0,
        skillsList: []
    },
    streak: {
        current: 0,
        longest: 0,
        isActiveToday: false
    },
    learningTime: {
        todayMinutes: 0,
        weekMinutes: 0,
        totalMinutes: 0,
        activeDaysThisWeek: 0
    },
    analyzerHistory: [],
    recentAchievements: [],
    recentActivities: []
};

export const useProgressSummary = (autoFetch = true) => {
    const [summary, setSummary] = useState(DEFAULT_SUMMARY);
    const [loading, setLoading] = useState(autoFetch);
    const [error, setError] = useState(null);
    const isMountedRef = useRef(true);

    const getUserTimezone = () => {
        try {
            return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
        } catch {
            return 'UTC';
        }
    };

    const fetchSummary = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const tz = getUserTimezone();
            const data = await getProgressSummaryApi(tz);
            if (isMountedRef.current && data) {
                setSummary({
                    analyses: { ...DEFAULT_SUMMARY.analyses, ...(data.analyses || {}) },
                    journeys: { ...DEFAULT_SUMMARY.journeys, ...(data.journeys || {}) },
                    skills: { ...DEFAULT_SUMMARY.skills, ...(data.skills || {}) },
                    streak: { ...DEFAULT_SUMMARY.streak, ...(data.streak || {}) },
                    learningTime: { ...DEFAULT_SUMMARY.learningTime, ...(data.learningTime || {}) },
                    analyzerHistory: Array.isArray(data.analyzerHistory) ? data.analyzerHistory : [],
                    recentAchievements: Array.isArray(data.recentAchievements) ? data.recentAchievements : [],
                    recentActivities: Array.isArray(data.recentActivities) ? data.recentActivities : []
                });
            }
        } catch (err) {
            console.error('Failed to load progress summary:', err);
            if (isMountedRef.current) {
                setError(err.response?.data?.message || 'Could not load progress statistics');
            }
        } finally {
            if (isMountedRef.current) {
                setLoading(false);
            }
        }
    }, []);

    useEffect(() => {
        isMountedRef.current = true;
        if (autoFetch) {
            fetchSummary();
        }
        return () => {
            isMountedRef.current = false;
        };
    }, [autoFetch, fetchSummary]);

    return {
        summary,
        loading,
        error,
        refreshSummary: fetchSummary
    };
};

export default useProgressSummary;
