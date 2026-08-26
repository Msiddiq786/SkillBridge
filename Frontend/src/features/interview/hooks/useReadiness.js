import { useState, useEffect, useCallback, useRef } from "react";
import { getReadinessApi } from "../services/readiness.api";

export const useReadiness = (reportId = null) => {
    const [readiness, setReadiness] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const isMounted = useRef(true);

    const fetchReadiness = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await getReadinessApi(reportId);
            if (isMounted.current) {
                setReadiness(data);
            }
        } catch (err) {
            console.error("useReadiness fetch error:", err);
            if (isMounted.current) {
                setError(err.response?.data?.message || "Failed to load application readiness data");
            }
        } finally {
            if (isMounted.current) {
                setLoading(false);
            }
        }
    }, [reportId]);

    useEffect(() => {
        isMounted.current = true;
        fetchReadiness();
        return () => {
            isMounted.current = false;
        };
    }, [fetchReadiness]);

    return {
        readiness,
        loading,
        error,
        refreshReadiness: fetchReadiness
    };
};

export default useReadiness;
