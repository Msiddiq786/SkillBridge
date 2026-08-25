import { getAllInterviewReports, generateInterviewReport, getInterviewReportById, generateResumePdf, detectTracks, retryAtsAnalysis } from "../services/interview.api"
import { useContext, useEffect, useCallback } from "react"
import { InterviewContext } from "../interview.context"
import { useParams } from "react-router"

export const useInterview = () => {

    const context = useContext(InterviewContext)
    const { interviewId } = useParams()

    if (!context) {
        throw new Error("useInterview must be used within an InterviewProvider")
    }

    const { loading, setLoading, report, setReport, reports, setReports } = context

    const generateReport = useCallback(async (payload) => {
        setLoading(true)
        let response = null
        try {
            response = await generateInterviewReport(payload)
            if (response?.interviewReport) {
                setReport(response.interviewReport)
            }
        } catch (error) {
            console.error("generateReport error:", error)
            throw error
        } finally {
            setLoading(false)
        }

        return response?.interviewReport || response
    }, [setLoading, setReport])

    const detectJobTracks = useCallback(async (param) => {
        try {
            const jobDescription = typeof param === 'string' ? param : param?.jobDescription
            const result = await detectTracks({ jobDescription })
            return result
        } catch (error) {
            console.error("detectTracks error:", error)
            return null
        }
    }, [])

    const getReportById = useCallback(async (id) => {
        setLoading(true)
        let response = null
        try {
            response = await getInterviewReportById(id)
            if (response?.interviewReport) {
                setReport(response.interviewReport)
            }
        } catch (error) {
            console.error("getReportById error:", error)
        } finally {
            setLoading(false)
        }
        return response?.interviewReport
    }, [setLoading, setReport])

    const getReports = useCallback(async () => {
        setLoading(true)
        let response = null
        try {
            response = await getAllInterviewReports()
            if (response?.interviewReports) {
                setReports(response.interviewReports)
            }
        } catch (error) {
            console.error("getReports error:", error)
        } finally {
            setLoading(false)
        }

        return response?.interviewReports || []
    }, [setLoading, setReports])

    const getResumePdf = useCallback(async (interviewReportId) => {
        setLoading(true)
        let response = null
        try {
            response = await generateResumePdf({ interviewReportId })
            const url = window.URL.createObjectURL(new Blob([ response ], { type: "application/pdf" }))
            const link = document.createElement("a")
            link.href = url
            link.setAttribute("download", `resume_${interviewReportId}.pdf`)
            document.body.appendChild(link)
            link.click()
        }
        catch (error) {
            console.error("getResumePdf error:", error)
        } finally {
            setLoading(false)
        }
    }, [setLoading])

    const handleRetryAts = useCallback(async (interviewReportId) => {
        try {
            const res = await retryAtsAnalysis(interviewReportId)
            if (res?.atsAnalysis) {
                setReport(prev => ({
                    ...prev,
                    atsStatus: "ATS_READY",
                    atsAnalysis: res.atsAnalysis
                }))
            }
            return res
        } catch (err) {
            console.error("handleRetryAts error:", err)
            throw err
        }
    }, [setReport])

    useEffect(() => {
        if (interviewId) {
            getReportById(interviewId)
        } else {
            getReports()
        }
    }, [ interviewId, getReportById, getReports ])

    return { loading, report, setReport, reports, generateReport, detectJobTracks, getReportById, getReports, getResumePdf, handleRetryAts }

}