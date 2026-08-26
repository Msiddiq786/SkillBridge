import { useState, useEffect, useCallback, useRef } from "react";
import { getAchievementProgressionApi } from "../services/achievement.api";

export const useAchievements = () => {
    const [achievementsData, setAchievementsData] = useState({
        summary: { unlockedCount: 0, totalCount: 22, completionPercentage: 0, currentStreak: 0 },
        milestones: []
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const isMounted = useRef(true);

    const fetchAchievements = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
            const data = await getAchievementProgressionApi(tz);
            if (isMounted.current && data) {
                setAchievementsData(data);
            }
        } catch (err) {
            console.error("useAchievements fetch error:", err);
            if (isMounted.current) {
                setError(err.response?.data?.message || "Failed to load achievements");
            }
        } finally {
            if (isMounted.current) {
                setLoading(false);
            }
        }
    }, []);

    useEffect(() => {
        isMounted.current = true;
        fetchAchievements();
        return () => {
            isMounted.current = false;
        };
    }, [fetchAchievements]);

    return {
        ...achievementsData,
        loading,
        error,
        refreshAchievements: fetchAchievements
    };
};

export default useAchievements;
