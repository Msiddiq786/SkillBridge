import React, { useState, useRef, useEffect, useCallback } from 'react';
import "../style/home.scss";
import { useInterview } from '../hooks/useInterview.js';
import { useNavigate, Link } from 'react-router';
import { getProgress } from '../services/progress.api.js';

const STAGES = [
    "Reading Resume",
    "Analyzing Resume",
    "Generating Technical Questions",
    "Generating MCQ Questions",
    "Generating Behavioral Questions",
    "Analyzing Skill Gaps",
    "Building Roadmap",
    "Finalizing Report",
    "Completed"
];

const ProgressOverlay = ({ progress, onRetry }) => {
    const percent = progress.progress || 0;
    const status = progress.status || "IDLE";
    const isFailed = status === "Failed" || status === "FAILED";
    const isCompleted = status === "Completed" || status === "COMPLETED";

    const currentStageIdx = STAGES.findIndex(
        s => s.toLowerCase() === (status || "").toLowerCase()
    );

    return (
        <div className="progress-overlay">
            <div className="progress-card">
                <div className="progress-card__header">
                    <h2>
                        {isFailed
                            ? "Generation Failed"
                            : isCompleted
                                ? "Report Ready!"
                                : "Generating Your Interview Plan"}
                    </h2>
                    {!isFailed && !isCompleted && (
                        <p className="progress-card__subtitle">
                            This may take a moment. Our AI is crafting your personalized strategy.
                        </p>
                    )}
                </div>

                {/* Stage list */}
                <div className="progress-stages">
                    {STAGES.map((stage, i) => {
                        let stageClass = "progress-stage";
                        if (i < currentStageIdx) stageClass += " progress-stage--done";
                        else if (i === currentStageIdx && !isFailed) stageClass += " progress-stage--active";
                        else stageClass += " progress-stage--pending";

                        return (
                            <div key={stage} className={stageClass}>
                                <span className="progress-stage__dot" />
                                <span className="progress-stage__label">{stage}</span>
                            </div>
                        );
                    })}
                </div>

                {/* Progress bar */}
                <div className="progress-bar-container">
                    <div className="progress-bar">
                        <div
                            className={`progress-bar__fill ${isFailed ? "progress-bar__fill--failed" : ""}`}
                            style={{ width: `${percent}%` }}
                        />
                    </div>
                    <span className="progress-bar__percent">{percent}%</span>
                </div>

                {/* Current stage label */}
                <p className={`progress-current ${isFailed ? "progress-current--failed" : ""}`}>
                    {isFailed ? "Something went wrong. Please check your backend connection." : status}
                </p>

                {/* Retry on failure */}
                {isFailed && (
                    <button className="generate-btn progress-retry-btn" onClick={onRetry}>
                        Retry Generation
                    </button>
                )}
            </div>
        </div>
    );
};

// ── Track Selection Overlay ───────────────────────────────────────────────────
const TrackSelectionOverlay = ({ tracks, onSelect, onCancel }) => {
    return (
        <div className="progress-overlay">
            <div className="progress-card track-selection-card">
                <div className="progress-card__header">
                    <h2>Multiple Roles Detected</h2>
                    <p className="progress-card__subtitle">
                        This job description contains multiple roles. Select the one you want to prepare for.
                    </p>
                </div>
                <div className="track-list">
                    {tracks.map((track, i) => (
                        <div
                            key={i}
                            className="track-item"
                            onClick={() => onSelect(track)}
                        >
                            <h3 className="track-item__title">{track.trackTitle}</h3>
                            <p className="track-item__desc">
                                {track.trackDescription.length > 150
                                    ? track.trackDescription.substring(0, 150) + "..."
                                    : track.trackDescription}
                            </p>
                        </div>
                    ))}
                </div>
                <button className="track-cancel-btn" onClick={onCancel}>
                    Cancel
                </button>
            </div>
        </div>
    );
};

const Home = () => {

    const { loading, generateReport, detectJobTracks, reports } = useInterview();

    const [jobDescription, setJobDescription] = useState("");
    const [selfDescription, setSelfDescription] = useState("");
    const [selectedFileName, setSelectedFileName] = useState("");
    const [formError, setFormError] = useState("");
    const [generating, setGenerating] = useState(false);
    const [progress, setProgress] = useState({ progress: 0, status: "IDLE" });
    const [detectedTracks, setDetectedTracks] = useState(null);
    const [detectingTracks, setDetectingTracks] = useState(false);

    const resumeInputRef = useRef(null);
    const pollingRef = useRef(null);

    const navigate = useNavigate();

    const stopPolling = useCallback(() => {
        if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
        }
    }, []);

    const startPolling = useCallback(() => {
        stopPolling();
        pollingRef.current = setInterval(async () => {
            try {
                const data = await getProgress();
                if (data && data.status) {
                    setProgress(data);

                    const st = (data.status || "").toUpperCase();
                    if (st === "COMPLETED" || st === "FAILED") {
                        stopPolling();
                        if (st === "FAILED") {
                            setGenerating(false);
                        }
                    }
                }
            } catch {
                // silently ignore polling network blips
            }
        }, 1200);
    }, [stopPolling]);

    useEffect(() => {
        return () => stopPolling();
    }, [stopPolling]);

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFileName(file.name);
            setFormError("");
        }
    };

    const startGeneration = async (selectedTrack = null) => {
        setGenerating(true);
        setProgress({ progress: 5, status: "Reading Resume" });
        startPolling();

        try {
            const effectiveSelfDesc = selfDescription.trim() || "Candidate applying for the specified job role.";
            const resumeFile = resumeInputRef.current?.files?.[0];

            const data = await generateReport({
                jobDescription: jobDescription.trim(),
                selfDescription: effectiveSelfDesc,
                resumeFile,
                selectedTrack: selectedTrack?.trackDescription || null,
                selectedTrackTitle: selectedTrack?.trackTitle || null
            });

            stopPolling();
            setProgress({ progress: 100, status: "Completed" });

            if (data?._id) {
                setTimeout(() => {
                    setGenerating(false);
                    navigate(`/interview/${data._id}`);
                }, 600);
            } else {
                setGenerating(false);
            }
        } catch (err) {
            console.error("Generation error:", err);
            stopPolling();
            setProgress({ progress: 0, status: "Failed" });
            setGenerating(false);
            setFormError(err?.response?.data?.message || err.message || "Generation failed. Please try again.");
        }
    };

    const handleGenerateReport = async () => {
        setFormError("");

        if (!jobDescription.trim()) {
            setFormError("Please enter the Target Job Description.");
            return;
        }

        const resumeFile = resumeInputRef.current?.files?.[0];
        if (!resumeFile) {
            setFormError("Please upload your Resume (.pdf).");
            return;
        }

        // Step 1: Detect tracks
        setDetectingTracks(true);
        try {
            const trackResult = await detectJobTracks({ jobDescription: jobDescription.trim() });

            if (trackResult && trackResult.multipleTracksDetected && trackResult.tracks?.length > 1) {
                // Show track selection UI
                setDetectedTracks(trackResult.tracks);
                setDetectingTracks(false);
                return;
            }

            // Single track or detection failed — proceed directly
            setDetectingTracks(false);
            const singleTrack = trackResult?.tracks?.[0] || null;
            await startGeneration(singleTrack);

        } catch (err) {
            // Track detection failed — proceed without track
            setDetectingTracks(false);
            await startGeneration(null);
        }
    };

    const handleTrackSelect = async (track) => {
        setDetectedTracks(null);
        await startGeneration(track);
    };

    const handleTrackCancel = () => {
        setDetectedTracks(null);
    };

    const handleRetry = () => {
        setGenerating(false);
        setProgress({ progress: 0, status: "IDLE" });
        setFormError("");
    };

    if (loading && !generating && !detectingTracks) {
        return (
            <main className='loading-screen'>
                <h1>Loading your interview plan...</h1>
            </main>
        );
    }

    return (
        <div className='home-page'>

            {generating && (
                <ProgressOverlay progress={progress} onRetry={handleRetry} />
            )}

            {detectedTracks && (
                <TrackSelectionOverlay
                    tracks={detectedTracks}
                    onSelect={handleTrackSelect}
                    onCancel={handleTrackCancel}
                />
            )}

            <header className='page-header'>
                <h1>Create Your Custom <span className='highlight'>Interview Plan</span></h1>
                <p>Let our AI analyze the job requirements and your unique profile to build a winning strategy.</p>
                <div className="page-header__nav">
                    <Link to="/dashboard" className="nav-link">Dashboard</Link>
                </div>
            </header>

            <div className='interview-card'>

                <div className='interview-card__body'>

                    <div className='panel panel--left'>

                        <div className='panel__header'>
                            <h2>Target Job Description</h2>
                            <span className='badge badge--required'>Required</span>
                        </div>

                        <textarea
                            className='panel__textarea'
                            value={jobDescription}
                            onChange={(e) => {
                                setJobDescription(e.target.value);
                                if (formError) setFormError("");
                            }}
                            placeholder="Paste the full target job description here..."
                        />

                    </div>

                    <div className='panel-divider'></div>

                    <div className='panel panel--right'>

                        <div className='upload-section'>

                            <div className='panel__header'>
                                <h2>Upload Resume</h2>
                                <span className='badge badge--required'>PDF Required</span>
                            </div>

                            <div className="file-input-wrapper">
                                <input
                                    ref={resumeInputRef}
                                    id="resume"
                                    type="file"
                                    accept=".pdf"
                                    onChange={handleFileChange}
                                />
                                <span className={`file-label-text ${selectedFileName ? 'has-file' : ''}`}>
                                    {selectedFileName || "Click or drop resume PDF here..."}
                                </span>
                                <span className="upload-btn-fake">
                                    {selectedFileName ? "Change" : "Browse"}
                                </span>
                            </div>

                        </div>

                        <div className='self-description'>

                            <div className='panel__header'>
                                <h2>Self Description (Optional)</h2>
                            </div>

                            <textarea
                                value={selfDescription}
                                onChange={(e) => setSelfDescription(e.target.value)}
                                placeholder="Highlight specific experiences, strengths, or focus areas (optional)..."
                            />

                        </div>

                    </div>

                </div>

                <div className='interview-card__footer'>

                    {formError && (
                        <div className="form-error">{formError}</div>
                    )}

                    <div style={{ marginLeft: "auto" }}>
                        <button
                            onClick={handleGenerateReport}
                            className='generate-btn'
                            disabled={generating || detectingTracks}
                        >
                            {detectingTracks ? "Analyzing Job Description..." : generating ? "Generating..." : "Generate My Interview Strategy"}
                        </button>
                    </div>

                </div>

            </div>

            {reports && reports.length > 0 && (
                <div className='recent-reports'>
                    <h2>Recent Reports</h2>
                    <div className='reports-list'>
                        {reports.map((report) => (
                            <div
                                key={report._id}
                                className='report-item'
                                onClick={() => navigate(`/interview/${report._id}`)}
                            >
                                <h3>{report.title || "Interview Report"}</h3>
                                <p>{report.company || ""}</p>
                                <span className='match-score'>{report.matchScore}% match</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

        </div>
    );
};

export default Home;