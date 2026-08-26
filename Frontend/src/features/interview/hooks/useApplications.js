import { useState, useEffect, useCallback, useRef } from "react";
import {
    getApplicationsApi,
    createApplicationApi,
    updateApplicationApi,
    deleteApplicationApi
} from "../services/application.api";

export const useApplications = (initialFilters = { status: "ALL", search: "", sort: "recent" }) => {
    const [applications, setApplications] = useState([]);
    const [summary, setSummary] = useState({ total: 0, preparing: 0, ready: 0, applied: 0, interview: 0, offer: 0, rejected: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState(initialFilters);
    const isMounted = useRef(true);

    const fetchApplications = useCallback(async (customFilters = null) => {
        try {
            setLoading(true);
            setError(null);
            const activeFilters = customFilters || filters;
            const data = await getApplicationsApi(activeFilters);
            if (isMounted.current && data) {
                setApplications(data.applications || []);
                setSummary(data.summary || { total: 0, preparing: 0, ready: 0, applied: 0, interview: 0, offer: 0, rejected: 0 });
            }
        } catch (err) {
            console.error("useApplications fetch error:", err);
            if (isMounted.current) {
                setError(err.response?.data?.message || "Failed to load job applications");
            }
        } finally {
            if (isMounted.current) {
                setLoading(false);
            }
        }
    }, [filters]);

    useEffect(() => {
        isMounted.current = true;
        fetchApplications();
        return () => {
            isMounted.current = false;
        };
    }, [fetchApplications]);

    const trackNewApplication = async (applicationData) => {
        const created = await createApplicationApi(applicationData);
        await fetchApplications();
        return created;
    };

    const updateApplicationStatus = async (id, updateData) => {
        const updated = await updateApplicationApi(id, updateData);
        await fetchApplications();
        return updated;
    };

    const removeApplication = async (id) => {
        await deleteApplicationApi(id);
        await fetchApplications();
    };

    return {
        applications,
        summary,
        loading,
        error,
        filters,
        setFilters,
        refreshApplications: fetchApplications,
        trackNewApplication,
        updateApplicationStatus,
        removeApplication
    };
};

export default useApplications;
