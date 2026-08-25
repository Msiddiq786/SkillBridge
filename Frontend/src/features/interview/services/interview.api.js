import axios from "axios";

const api = axios.create({
    baseURL: "http://localhost:3000",
    withCredentials: true,
})


/**
 * @description Detect multiple roles/tracks in a job description
 */
export const detectTracks = async ({ jobDescription }) => {
    const response = await api.post("/api/interview/detect-tracks", { jobDescription })
    return response.data
}


/**
 * @description Service to generate interview report based on user self description, resume and job description.
 */
export const generateInterviewReport = async (payload) => {
    let formData;
    if (payload instanceof FormData) {
        formData = payload;
    } else {
        const { jobDescription, selfDescription, resumeFile, resume, selectedTrack, selectedTrackTitle, selectedTrackDetails, planConfig } = payload || {};
        formData = new FormData();
        if (jobDescription) formData.append("jobDescription", jobDescription);
        if (selfDescription) formData.append("selfDescription", selfDescription);
        const fileToAppend = resumeFile || resume;
        if (fileToAppend) formData.append("resume", fileToAppend);
        if (selectedTrack) formData.append("selectedTrack", selectedTrack);
        if (selectedTrackTitle) formData.append("selectedTrackTitle", selectedTrackTitle);
        if (selectedTrackDetails) formData.append("selectedTrackDetails", selectedTrackDetails);
        if (planConfig) formData.append("planConfig", typeof planConfig === 'string' ? planConfig : JSON.stringify(planConfig));
    }

    const response = await api.post("/api/interview/", formData, {
        headers: {
            "Content-Type": "multipart/form-data"
        }
    });

    return response.data;
}


/**
 * @description Service to get interview report by interviewId.
 */
export const getInterviewReportById = async (interviewId) => {
    const response = await api.get(`/api/interview/report/${interviewId}`)

    return response.data
}


/**
 * @description Service to get all interview reports of logged in user.
 */
export const getAllInterviewReports = async () => {
    const response = await api.get("/api/interview/")

    return response.data
}


/**
 * @description Service to retry or generate ATS analysis on demand.
 */
export const retryAtsAnalysis = async (interviewId) => {
    const response = await api.post(`/api/interview/report/${interviewId}/ats-retry`);
    return response.data;
}

/**
 * @description Service to generate resume pdf based on user self description, resume content and job description.
 */
export const generateResumePdf = async ({ interviewReportId }) => {
    const response = await api.post(`/api/interview/resume/pdf/${interviewReportId}`, null, {
        responseType: "blob"
    })

    return response.data
}