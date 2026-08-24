import { getAllInterviewReports, generateInterviewReport, getInterviewReportById, generateResumePdf, detectTracks } from "../services/interview.api"
import { useContext, useEffect } from "react"
import { InterviewContext } from "../interview.context"
import { useParams } from "react-router"

export const useInterview = () => {

    const context = useContext(InterviewContext)
    const { interviewId } = useParams()

    if (!context) {
        throw new Error("useInterview must be used within an InterviewProvider")
    }

    const { loading, setLoading, report, setReport, reports, setReports } = context

    const generateReport = async ({ jobDescription, selfDescription, resumeFile, selectedTrack, selectedTrackTitle }) => {
        setLoading(true)
        let response = null
        try {
            response = await generateInterviewReport({ jobDescription, selfDescription, resumeFile, selectedTrack, selectedTrackTitle })
            if (response?.interviewReport) {
                setReport(response.interviewReport)
            }
        } catch (error) {
            console.error("generateReport error:", error)
            throw error
        } finally {
            setLoading(false)
        }

        return response?.interviewReport
    }

    const detectJobTracks = async ({ jobDescription }) => {
        try {
            const result = await detectTracks({ jobDescription })
            return result
        } catch (error) {
            console.error("detectTracks error:", error)
            return null
        }
    }

    const getReportById = async (interviewId) => {
        setLoading(true)
        let response = null
        try {
            response = await getInterviewReportById(interviewId)
            if (response?.interviewReport) {
                setReport(response.interviewReport)
            }
        } catch (error) {
            console.error("getReportById error:", error)
        } finally {
            setLoading(false)
        }
        return response?.interviewReport
    }

    const getReports = async () => {
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
    }

    const getResumePdf = async (interviewReportId) => {
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
    }

    useEffect(() => {
        if (interviewId) {
            getReportById(interviewId)
        } else {
            getReports()
        }
    }, [ interviewId ])

    return { loading, report, reports, generateReport, detectJobTracks, getReportById, getReports, getResumePdf }

}