import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import "../style/home.scss";
import { useInterview } from '../hooks/useInterview.js';
import { useNavigate, Link } from 'react-router';
import { getProgress } from '../services/progress.api.js';
import AppShell from '../components/AppShell';

// ── Preset Definitions ────────────────────────────────────────────────────────
const PLAN_PRESETS = {
    standard: {
        id: 'standard',
        name: 'Standard (Recommended)',
        badge: 'Balanced Prep',
        icon: '⚖️',
        description: 'Complete all-around preparation with 20 Technical, 15 MCQs, 10 Behavioral, 5 Follow-ups, and a 15-day roadmap.',
        config: {
            technicalCount: 20,
            mcqCount: 15,
            behavioralCount: 10,
            technicalFollowUpsPerQuestion: 5,
            roadmapDays: 15,
            technicalDifficulty: { easy: 7, medium: 8, hard: 5 },
            mcqDifficulty: { easy: 6, medium: 6, hard: 3 },
            behavioralDifficulty: { easy: 4, medium: 4, hard: 2 },
            includeTechnical: true,
            includeMCQ: true,
            includeBehavioral: true,
            roadmapIntensity: 'balanced'
        }
    },
    quick: {
        id: 'quick',
        name: 'Quick Review',
        badge: 'Urgent (1 Week)',
        icon: '⚡',
        description: 'Accelerated 7-day refresher with 10 Technical, 10 MCQs, 5 Behavioral, and 3 Follow-ups.',
        config: {
            technicalCount: 10,
            mcqCount: 10,
            behavioralCount: 5,
            technicalFollowUpsPerQuestion: 3,
            roadmapDays: 7,
            technicalDifficulty: { easy: 4, medium: 4, hard: 2 },
            mcqDifficulty: { easy: 4, medium: 4, hard: 2 },
            behavioralDifficulty: { easy: 2, medium: 2, hard: 1 },
            includeTechnical: true,
            includeMCQ: true,
            includeBehavioral: true,
            roadmapIntensity: 'balanced'
        }
    },
    intensive: {
        id: 'intensive',
        name: 'Intensive Mastery',
        badge: 'Deep Dive (30 Days)',
        icon: '🚀',
        description: 'Exhaustive training with 30 Technical, 25 MCQs, 15 Behavioral, 7 Follow-ups, and a 30-day roadmap.',
        config: {
            technicalCount: 30,
            mcqCount: 25,
            behavioralCount: 15,
            technicalFollowUpsPerQuestion: 7,
            roadmapDays: 30,
            technicalDifficulty: { easy: 10, medium: 12, hard: 8 },
            mcqDifficulty: { easy: 10, medium: 10, hard: 5 },
            behavioralDifficulty: { easy: 6, medium: 6, hard: 3 },
            includeTechnical: true,
            includeMCQ: true,
            includeBehavioral: true,
            roadmapIntensity: 'intensive'
        }
    },
    custom: {
        id: 'custom',
        name: 'Custom Plan',
        badge: 'Personalized',
        icon: '⚙️',
        description: 'Configure exact question numbers, modes, difficulty split, roadmap duration, and focus topics.'
    }
};

// ── Progress Overlay ──────────────────────────────────────────────────────────
const ProgressOverlay = ({ progress, onRetry, planConfig }) => {
    const rawPercent = progress.progress || 0;
    const status = progress.status || "IDLE";
    const stages = progress.stages || {};
    const isFailed = status === "Failed" || status === "FAILED";
    const isCompleted = status === "Completed" || status === "COMPLETED";

    // Animated smooth progress counter (strictly monotonic)
    const [animatedPercent, setAnimatedPercent] = useState(rawPercent);

    useEffect(() => {
        if (rawPercent > animatedPercent) {
            const step = Math.max(1, Math.ceil((rawPercent - animatedPercent) / 6));
            const timer = setInterval(() => {
                setAnimatedPercent(prev => {
                    const next = prev + step;
                    if (next >= rawPercent) {
                        clearInterval(timer);
                        return rawPercent;
                    }
                    return next;
                });
            }, 35);
            return () => clearInterval(timer);
        } else if (rawPercent < animatedPercent && !isFailed) {
            setAnimatedPercent(rawPercent);
        }
    }, [rawPercent, isFailed, animatedPercent]);

    // Stage progression checks
    const isReadingDone = stages.readingResume === "COMPLETED" || animatedPercent >= 5;
    const isAnalyzingDone = stages.resumeAnalysis === "COMPLETED" || animatedPercent >= 15;

    // Parallel tasks (Phase 2)
    const isTechnicalDone = stages.technical === "COMPLETED";
    const isMcqDone = stages.mcq === "COMPLETED";
    const isBehavioralDone = stages.behavioral === "COMPLETED";
    const isSkillGapDone = stages.skillGap === "COMPLETED";
    const isParallelPhaseActive = animatedPercent >= 15 && animatedPercent < 65 && !isCompleted && !isFailed;
    const isParallelAllDone = (isTechnicalDone && isMcqDone && isBehavioralDone && isSkillGapDone) || animatedPercent >= 65;

    // Phase 3 & 4
    const isRoadmapActive = (stages.roadmap === "IN_PROGRESS" || (animatedPercent >= 65 && animatedPercent < 85)) && !isCompleted && !isFailed;
    const isRoadmapDone = stages.roadmap === "COMPLETED" || animatedPercent >= 85;

    const isFinalizingActive = (stages.finalizing === "IN_PROGRESS" || (animatedPercent >= 85 && animatedPercent < 100)) && !isCompleted && !isFailed;
    const isFinalizingDone = stages.finalizing === "COMPLETED" || isCompleted;

    const currentPlan = planConfig || PLAN_PRESETS.standard.config;

    return (
        <div className="progress-overlay">
            <div className="progress-card">
                <div className="progress-card__header">
                    <div className="progress-header-icon">⚡</div>
                    <h2>
                        {isFailed
                            ? "Generation Encountered an Issue"
                            : isCompleted
                                ? "Your Interview Plan is Ready!"
                                : "Generating Your Custom Interview Plan"}
                    </h2>
                    {!isFailed && !isCompleted && (
                        <p className="progress-card__subtitle">
                            {isParallelPhaseActive
                                ? "Generating customized questions, MCQs, and skill gaps in parallel..."
                                : "Analyzing your resume against target JD requirements."}
                        </p>
                    )}
                </div>

                {/* Stage list with parallel sub-tasks */}
                <div className="progress-stages">
                    <div className={`progress-stage ${isReadingDone ? "progress-stage--done" : "progress-stage--active"}`}>
                        <span className="progress-stage__dot">{isReadingDone ? "✓" : ""}</span>
                        <span className="progress-stage__label">Reading Resume</span>
                    </div>

                    <div className={`progress-stage ${isAnalyzingDone ? "progress-stage--done" : isReadingDone ? "progress-stage--active" : "progress-stage--pending"}`}>
                        <span className="progress-stage__dot">{isAnalyzingDone ? "✓" : ""}</span>
                        <span className="progress-stage__label">Analyzing Resume & Target Fit</span>
                    </div>

                    <div className={`progress-stage progress-stage--parent ${isParallelAllDone ? "progress-stage--done" : isParallelPhaseActive ? "progress-stage--active" : "progress-stage--pending"}`}>
                        <div className="stage-parent-row">
                            <span className="progress-stage__dot">{isParallelAllDone ? "✓" : ""}</span>
                            <span className="progress-stage__label">Generating Interview Content</span>
                        </div>

                        <div className="progress-sub-tasks">
                            {currentPlan.includeTechnical && currentPlan.technicalCount > 0 && (
                                <div className={`sub-task ${isTechnicalDone ? "sub-task--done" : isParallelPhaseActive ? "sub-task--active" : "sub-task--pending"}`}>
                                    <span className="sub-task__icon">{isTechnicalDone ? "✓" : isParallelPhaseActive ? "●" : "○"}</span>
                                    <span>{currentPlan.technicalCount} Technical Questions</span>
                                </div>
                            )}
                            {currentPlan.includeMCQ && currentPlan.mcqCount > 0 && (
                                <div className={`sub-task ${isMcqDone ? "sub-task--done" : isParallelPhaseActive ? "sub-task--active" : "sub-task--pending"}`}>
                                    <span className="sub-task__icon">{isMcqDone ? "✓" : isParallelPhaseActive ? "●" : "○"}</span>
                                    <span>{currentPlan.mcqCount} MCQ Practice Questions</span>
                                </div>
                            )}
                            {currentPlan.includeBehavioral && currentPlan.behavioralCount > 0 && (
                                <div className={`sub-task ${isBehavioralDone ? "sub-task--done" : isParallelPhaseActive ? "sub-task--active" : "sub-task--pending"}`}>
                                    <span className="sub-task__icon">{isBehavioralDone ? "✓" : isParallelPhaseActive ? "●" : "○"}</span>
                                    <span>{currentPlan.behavioralCount} Behavioral (STAR) Questions</span>
                                </div>
                            )}
                            <div className={`sub-task ${isSkillGapDone ? "sub-task--done" : isParallelPhaseActive ? "sub-task--active" : "sub-task--pending"}`}>
                                <span className="sub-task__icon">{isSkillGapDone ? "✓" : isParallelPhaseActive ? "●" : "○"}</span>
                                <span>Skill Gap Analysis</span>
                            </div>
                        </div>
                    </div>

                    <div className={`progress-stage ${isRoadmapDone ? "progress-stage--done" : isRoadmapActive ? "progress-stage--active" : "progress-stage--pending"}`}>
                        <span className="progress-stage__dot">{isRoadmapDone ? "✓" : ""}</span>
                        <span className="progress-stage__label">{currentPlan.roadmapDays}-Day Preparation Roadmap</span>
                    </div>

                    <div className={`progress-stage ${isFinalizingDone ? "progress-stage--done" : isFinalizingActive ? "progress-stage--active" : "progress-stage--pending"}`}>
                        <span className="progress-stage__dot">{isFinalizingDone ? "✓" : ""}</span>
                        <span className="progress-stage__label">Finalizing Report</span>
                    </div>

                    <div className={`progress-stage ${isCompleted ? "progress-stage--done" : "progress-stage--pending"}`}>
                        <span className="progress-stage__dot">{isCompleted ? "✓" : ""}</span>
                        <span className="progress-stage__label">Completed</span>
                    </div>
                </div>

                {/* Progress bar */}
                <div className="progress-bar-container">
                    <div className="progress-bar">
                        <div
                            className={`progress-bar__fill ${isFailed ? "progress-bar__fill--failed" : ""}`}
                            style={{ width: `${animatedPercent}%` }}
                        />
                    </div>
                    <span className="progress-bar__percent">{animatedPercent}%</span>
                </div>

                <p className={`progress-current ${isFailed ? "progress-current--failed" : ""}`}>
                    {isFailed ? "Generation failed. Please try again." : isCompleted ? "Report Ready! Redirecting..." : status}
                </p>

                {isFailed && (
                    <button className="button primary-button progress-retry-btn" onClick={onRetry}>
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
                    <h2>Multiple Job Tracks Detected</h2>
                    <p className="progress-card__subtitle">
                        This job posting lists multiple positions. Select which track you want to analyze.
                    </p>
                </div>
                <div className="track-list">
                    {tracks.map((track, i) => (
                        <div
                            key={i}
                            className="track-item"
                            onClick={() => onSelect(track)}
                        >
                            <div className="track-item__header">
                                <h3 className="track-item__title">{track.trackTitle}</h3>
                                <span className="track-item__select-btn">Select Track →</span>
                            </div>
                            <p className="track-item__desc">
                                {track.trackDescription.length > 180
                                    ? track.trackDescription.substring(0, 180) + "..."
                                    : track.trackDescription}
                            </p>
                        </div>
                    ))}
                </div>
                <button type="button" className="track-cancel-btn" onClick={onCancel}>
                    Cancel Selection
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
    const [progress, setProgress] = useState({ progress: 0, status: "IDLE", stages: {} });
    const [detectedTracks, setDetectedTracks] = useState(null);
    const [detectingTracks, setDetectingTracks] = useState(false);

    // ── Plan Configuration States ──
    const [selectedPreset, setSelectedPreset] = useState('standard');
    const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);

    // Core Plan State
    const [technicalCount, setTechnicalCount] = useState(20);
    const [mcqCount, setMcqCount] = useState(15);
    const [behavioralCount, setBehavioralCount] = useState(10);
    const [technicalFollowUps, setTechnicalFollowUps] = useState(5);
    const [roadmapDays, setRoadmapDays] = useState(15);
    const [roadmapIntensity, setRoadmapIntensity] = useState('balanced');

    // Enabled Modes
    const [includeTechnical, setIncludeTechnical] = useState(true);
    const [includeMCQ, setIncludeMCQ] = useState(true);
    const [includeBehavioral, setIncludeBehavioral] = useState(true);

    // Difficulty Distribution
    const [technicalDifficulty, setTechnicalDifficulty] = useState({ easy: 7, medium: 8, hard: 5 });
    const [mcqDifficulty, setMcqDifficulty] = useState({ easy: 6, medium: 6, hard: 3 });
    const [behavioralDifficulty, setBehavioralDifficulty] = useState({ easy: 4, medium: 4, hard: 2 });

    // Focus Topics
    const [focusAreas, setFocusAreas] = useState([]);
    const [focusInput, setFocusInput] = useState("");

    const resumeInputRef = useRef(null);
    const pollingRef = useRef(null);
    const navigate = useNavigate();

    // ── Helper: Auto Balance Difficulty ──
    const autoBalance = (total) => {
        const easy = Math.round(total * 0.35);
        const medium = Math.round(total * 0.45);
        const hard = Math.max(0, total - (easy + medium));
        return { easy, medium, hard };
    };

    // Apply Preset
    const applyPreset = (presetKey) => {
        setSelectedPreset(presetKey);
        if (presetKey !== 'custom' && PLAN_PRESETS[presetKey]) {
            const p = PLAN_PRESETS[presetKey].config;
            setTechnicalCount(p.technicalCount);
            setMcqCount(p.mcqCount);
            setBehavioralCount(p.behavioralCount);
            setTechnicalFollowUps(p.technicalFollowUpsPerQuestion);
            setRoadmapDays(p.roadmapDays);
            setRoadmapIntensity(p.roadmapIntensity);
            setIncludeTechnical(p.includeTechnical);
            setIncludeMCQ(p.includeMCQ);
            setIncludeBehavioral(p.includeBehavioral);
            setTechnicalDifficulty({ ...p.technicalDifficulty });
            setMcqDifficulty({ ...p.mcqDifficulty });
            setBehavioralDifficulty({ ...p.behavioralDifficulty });
        }
    };

    // Update difficulty distribution safely
    const handleDifficultyChange = (mode, field, val) => {
        setSelectedPreset('custom');
        const numVal = Math.max(0, parseInt(val) || 0);
        if (mode === 'technical') {
            setTechnicalDifficulty(prev => ({ ...prev, [field]: numVal }));
        } else if (mode === 'mcq') {
            setMcqDifficulty(prev => ({ ...prev, [field]: numVal }));
        } else if (mode === 'behavioral') {
            setBehavioralDifficulty(prev => ({ ...prev, [field]: numVal }));
        }
    };

    // Auto-balance single mode
    const handleAutoBalance = (mode) => {
        setSelectedPreset('custom');
        if (mode === 'technical') {
            setTechnicalDifficulty(autoBalance(technicalCount));
        } else if (mode === 'mcq') {
            setMcqDifficulty(autoBalance(mcqCount));
        } else if (mode === 'behavioral') {
            setBehavioralDifficulty(autoBalance(behavioralCount));
        }
    };

    // Add Focus Area Tag
    const handleAddFocusArea = () => {
        const trimmed = focusInput.trim();
        if (trimmed && !focusAreas.includes(trimmed)) {
            setFocusAreas(prev => [...prev, trimmed]);
            setFocusInput("");
            setSelectedPreset('custom');
        }
    };

    const handleRemoveFocusArea = (tag) => {
        setFocusAreas(prev => prev.filter(t => t !== tag));
        setSelectedPreset('custom');
    };

    // Active full planConfig object
    const currentPlanConfig = useMemo(() => ({
        technicalCount: includeTechnical ? technicalCount : 0,
        mcqCount: includeMCQ ? mcqCount : 0,
        behavioralCount: includeBehavioral ? behavioralCount : 0,
        technicalFollowUpsPerQuestion: technicalFollowUps,
        roadmapDays,
        roadmapIntensity,
        technicalDifficulty: { ...technicalDifficulty },
        mcqDifficulty: { ...mcqDifficulty },
        behavioralDifficulty: { ...behavioralDifficulty },
        includeTechnical,
        includeMCQ,
        includeBehavioral,
        focusAreas
    }), [
        technicalCount, mcqCount, behavioralCount, technicalFollowUps,
        roadmapDays, roadmapIntensity, technicalDifficulty, mcqDifficulty,
        behavioralDifficulty, includeTechnical, includeMCQ, includeBehavioral, focusAreas
    ]);

    // Validation Status
    const validationErrors = useMemo(() => {
        const errors = [];
        if (!includeTechnical && !includeMCQ && !includeBehavioral) {
            errors.push("At least one interview question mode (Technical, MCQ, or Behavioral) must be enabled.");
        }
        if (includeTechnical) {
            const techSum = technicalDifficulty.easy + technicalDifficulty.medium + technicalDifficulty.hard;
            if (techSum !== technicalCount) {
                errors.push(`Technical difficulty sum (${techSum}) must equal technical questions (${technicalCount}).`);
            }
        }
        if (includeMCQ) {
            const mcqSum = mcqDifficulty.easy + mcqDifficulty.medium + mcqDifficulty.hard;
            if (mcqSum !== mcqCount) {
                errors.push(`MCQ difficulty sum (${mcqSum}) must equal MCQ count (${mcqCount}).`);
            }
        }
        if (includeBehavioral) {
            const behSum = behavioralDifficulty.easy + behavioralDifficulty.medium + behavioralDifficulty.hard;
            if (behSum !== behavioralCount) {
                errors.push(`Behavioral difficulty sum (${behSum}) must equal behavioral count (${behavioralCount}).`);
            }
        }
        if (roadmapDays < 7 || roadmapDays > 30) {
            errors.push("Roadmap duration must be between 7 and 30 days.");
        }
        return errors;
    }, [
        includeTechnical, includeMCQ, includeBehavioral,
        technicalCount, mcqCount, behavioralCount,
        technicalDifficulty, mcqDifficulty, behavioralDifficulty,
        roadmapDays
    ]);

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
                    setProgress(prev => {
                        const newPercent = Math.max(prev.progress || 0, data.progress || 0);
                        return {
                            ...data,
                            progress: newPercent,
                            stages: {
                                ...(prev.stages || {}),
                                ...(data.stages || {})
                            }
                        };
                    });

                    const st = (data.status || "").toUpperCase();
                    if (st === "COMPLETED" || st === "FAILED") {
                        stopPolling();
                        if (st === "FAILED") {
                            setGenerating(false);
                        }
                    }
                }
            } catch {
                /* silent */
            }
        }, 1200);
    }, [stopPolling]);

    useEffect(() => {
        return () => stopPolling();
    }, [stopPolling]);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFileName(file.name);
            setFormError("");
        }
    };

    const handleGenerate = async (selectedTrackObj = null) => {
        const resumeFile = resumeInputRef.current?.files[0];

        if (!resumeFile) {
            setFormError("Please upload your resume (PDF or image).");
            return;
        }

        if (!jobDescription.trim()) {
            setFormError("Please paste the target job description.");
            return;
        }

        // Auto-fix difficulty sums if needed before generation
        if (includeTechnical && (technicalDifficulty.easy + technicalDifficulty.medium + technicalDifficulty.hard !== technicalCount)) {
            setTechnicalDifficulty(autoBalance(technicalCount));
        }
        if (includeMCQ && (mcqDifficulty.easy + mcqDifficulty.medium + mcqDifficulty.hard !== mcqCount)) {
            setMcqDifficulty(autoBalance(mcqCount));
        }
        if (includeBehavioral && (behavioralDifficulty.easy + behavioralDifficulty.medium + behavioralDifficulty.hard !== behavioralCount)) {
            setBehavioralDifficulty(autoBalance(behavioralCount));
        }

        if (validationErrors.length > 0 && validationErrors.some(e => e.includes("At least one") || e.includes("Roadmap duration"))) {
            setFormError(validationErrors[0]);
            return;
        }

        setFormError("");

        // If multi-track detection hasn't been checked yet
        if (!selectedTrackObj && jobDescription.trim().length > 100) {
            setDetectingTracks(true);
            try {
                const trackResult = await detectJobTracks(jobDescription);
                setDetectingTracks(false);

                if (trackResult?.multipleTracksDetected && trackResult.tracks?.length > 1) {
                    setDetectedTracks(trackResult.tracks);
                    return;
                }
            } catch {
                setDetectingTracks(false);
            }
        }

        setDetectedTracks(null);
        setGenerating(true);
        setProgress({ progress: 5, status: "Reading Resume", stages: { readingResume: "IN_PROGRESS" } });
        startPolling();

        try {
            const reportData = await generateReport({
                resumeFile,
                jobDescription: jobDescription.trim(),
                selfDescription: selfDescription.trim(),
                selectedTrack: selectedTrackObj?.trackDescription || null,
                selectedTrackTitle: selectedTrackObj?.trackTitle || null,
                selectedTrackDetails: selectedTrackObj?.trackDescription || null,
                planConfig: currentPlanConfig
            });

            setProgress(prev => ({
                ...prev,
                progress: 100,
                status: "COMPLETED",
                stages: {
                    ...(prev.stages || {}),
                    finalizing: "COMPLETED"
                }
            }));

            const reportId = reportData?._id || reportData?.interviewReport?._id;

            setTimeout(() => {
                setGenerating(false);
                stopPolling();
                if (reportId) {
                    navigate(`/interview/${reportId}`);
                }
            }, 800);

        } catch (err) {
            console.error("Generation error:", err);
            stopPolling();
            setProgress({
                progress: 0,
                status: "FAILED",
                stages: {}
            });
            setFormError(err.response?.data?.message || err.message || "Failed to generate report. Please try again.");
        }
    };

    const totalQuestions = (includeTechnical ? technicalCount : 0) +
                           (includeMCQ ? mcqCount : 0) +
                           (includeBehavioral ? behavioralCount : 0);

    return (
        <AppShell activeNavId="resume-analyzer">
            <div className="home-page-container">

                {/* Header */}
                <header className="home-hero-header">
                    <div className="home-hero-badge">
                        <span className="spark-icon">✨</span>
                        <span>AI-POWERED INTERVIEW PLANNER</span>
                    </div>
                    <h1>Create Your <span className="highlight">Targeted Interview Plan</span></h1>
                    <p className="home-hero-desc">
                        Upload your resume and target job description to generate a fully customized preparation plan with voice technical questions, MCQs, STAR behavioral scenarios, ATS keyword insights, and a study roadmap.
                    </p>
                </header>

                {/* Form Error Banner */}
                {formError && (
                    <div className="home-error-banner">
                        <span className="error-icon">⚠️</span>
                        <span>{formError}</span>
                    </div>
                )}

                {/* Main Inputs Grid */}
                <div className="home-grid">

                    {/* Card 1: Resume Upload */}
                    <div className="upload-card">
                        <div className="card-header-bar">
                            <span className="step-indicator">Step 1</span>
                            <h2>Upload Resume</h2>
                        </div>
                        <p className="card-hint">PDF or image formats supported. Strictly acts as the factual source of truth.</p>

                        <div
                            className={`dropzone ${selectedFileName ? 'dropzone--has-file' : ''}`}
                            onClick={() => resumeInputRef.current?.click()}
                        >
                            <input
                                ref={resumeInputRef}
                                type="file"
                                accept=".pdf,image/*"
                                onChange={handleFileChange}
                                style={{ display: 'none' }}
                            />

                            {selectedFileName ? (
                                <div className="file-preview-content">
                                    <div className="file-icon-box">📄</div>
                                    <div className="file-info-text">
                                        <span className="file-name">{selectedFileName}</span>
                                        <span className="file-status-text">✓ Ready for analysis</span>
                                    </div>
                                    <button
                                        type="button"
                                        className="file-remove-btn"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedFileName("");
                                            if (resumeInputRef.current) resumeInputRef.current.value = "";
                                        }}
                                    >
                                        Change File
                                    </button>
                                </div>
                            ) : (
                                <div className="dropzone-empty-content">
                                    <div className="dropzone-cloud-icon">
                                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                            <polyline points="17 8 12 3 7 8" />
                                            <line x1="12" y1="3" x2="12" y2="15" />
                                        </svg>
                                    </div>
                                    <span className="dropzone-main-text">Click or drag resume here</span>
                                    <span className="dropzone-sub-text">PDF, PNG, JPG up to 10MB</span>
                                </div>
                            )}
                        </div>

                        {/* Candidate Self-Description */}
                        <div className="self-desc-group">
                            <label htmlFor="selfDesc">
                                Additional Candidate Context <span className="optional-tag">(Optional)</span>
                            </label>
                            <textarea
                                id="selfDesc"
                                placeholder="Add any projects, coursework, GitHub links, or self-study not captured in your resume..."
                                value={selfDescription}
                                onChange={(e) => setSelfDescription(e.target.value)}
                                rows={3}
                                className="self-desc-textarea"
                            />
                        </div>
                    </div>

                    {/* Card 2: Job Description */}
                    <div className="upload-card">
                        <div className="card-header-bar">
                            <span className="step-indicator">Step 2</span>
                            <h2>Target Job Description</h2>
                        </div>
                        <p className="card-hint">Paste the full job posting. Our multi-role engine will automatically detect distinct tracks.</p>

                        <div className="jd-textarea-wrapper">
                            <textarea
                                placeholder="Paste the job requirements, responsibilities, and qualifications here..."
                                value={jobDescription}
                                onChange={(e) => setJobDescription(e.target.value)}
                                rows={10}
                                className="jd-textarea"
                            />
                            <div className="jd-counter-bar">
                                <span>{jobDescription.length} characters</span>
                                {jobDescription.length > 500 && (
                                    <span className="jd-ready-badge">✓ Good length for multi-track matching</span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Step 3: Customize Interview Preparation Plan ── */}
                <div className="plan-builder-card">
                    <div className="plan-builder-header">
                        <div className="plan-header-left">
                            <div className="card-header-bar">
                                <span className="step-indicator">Step 3</span>
                                <h2>Customize Your Interview Preparation Plan</h2>
                            </div>
                            <p className="card-hint">
                                Choose a preparation preset or configure exact question counts, difficulty distributions, follow-ups, and roadmap duration.
                            </p>
                        </div>
                        <button
                            type="button"
                            className="plan-toggle-customizer-btn"
                            onClick={() => setIsCustomizerOpen(prev => !prev)}
                        >
                            {isCustomizerOpen ? 'Collapse Settings ↑' : 'Advanced Configuration ⚙️'}
                        </button>
                    </div>

                    {/* Preset Selector Grid */}
                    <div className="plan-presets-grid">
                        {Object.values(PLAN_PRESETS).map(preset => {
                            const isSelected = selectedPreset === preset.id;
                            return (
                                <div
                                    key={preset.id}
                                    className={`preset-card ${isSelected ? 'preset-card--selected' : ''}`}
                                    onClick={() => applyPreset(preset.id)}
                                >
                                    <div className="preset-top">
                                        <span className="preset-icon">{preset.icon}</span>
                                        <span className="preset-badge">{preset.badge}</span>
                                    </div>
                                    <h3>{preset.name}</h3>
                                    <p className="preset-desc">{preset.description}</p>
                                    <div className="preset-footer">
                                        <span className={`preset-radio ${isSelected ? 'preset-radio--checked' : ''}`} />
                                        <span>{isSelected ? 'Selected' : 'Use Preset'}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Customizer Panel */}
                    <div className={`plan-customizer-panel ${isCustomizerOpen || selectedPreset === 'custom' ? 'plan-customizer-panel--open' : ''}`}>

                        {/* Section A: Question Counts & Modes */}
                        <div className="customizer-section">
                            <div className="section-title">
                                <span className="section-dot">●</span>
                                <h3>Question Counts & Interview Modes</h3>
                            </div>
                            <div className="modes-config-grid">

                                {/* Technical Mode */}
                                <div className={`mode-config-box ${!includeTechnical ? 'mode-config-box--disabled' : ''}`}>
                                    <div className="mode-toggle-row">
                                        <label className="checkbox-label">
                                            <input
                                                type="checkbox"
                                                checked={includeTechnical}
                                                onChange={(e) => {
                                                    setIncludeTechnical(e.target.checked);
                                                    setSelectedPreset('custom');
                                                }}
                                            />
                                            <span className="mode-name">🎙️ Technical Voice Questions</span>
                                        </label>
                                    </div>
                                    {includeTechnical && (
                                        <div className="count-stepper-wrap">
                                            <button
                                                type="button"
                                                className="stepper-btn"
                                                onClick={() => {
                                                    setSelectedPreset('custom');
                                                    const next = Math.max(5, technicalCount - 5);
                                                    setTechnicalCount(next);
                                                    setTechnicalDifficulty(autoBalance(next));
                                                }}
                                            >–</button>
                                            <input
                                                type="number"
                                                min="5"
                                                max="50"
                                                value={technicalCount}
                                                onChange={(e) => {
                                                    setSelectedPreset('custom');
                                                    const next = Math.max(5, Math.min(50, parseInt(e.target.value) || 5));
                                                    setTechnicalCount(next);
                                                    setTechnicalDifficulty(autoBalance(next));
                                                }}
                                                className="stepper-input"
                                            />
                                            <button
                                                type="button"
                                                className="stepper-btn"
                                                onClick={() => {
                                                    setSelectedPreset('custom');
                                                    const next = Math.min(50, technicalCount + 5);
                                                    setTechnicalCount(next);
                                                    setTechnicalDifficulty(autoBalance(next));
                                                }}
                                            >+</button>
                                            <span className="stepper-unit">questions (5–50)</span>
                                        </div>
                                    )}

                                    {/* Difficulty Breakdown */}
                                    {includeTechnical && (
                                        <div className="difficulty-row">
                                            <div className="diff-field">
                                                <label>Easy</label>
                                                <input
                                                    type="number"
                                                    value={technicalDifficulty.easy}
                                                    onChange={(e) => handleDifficultyChange('technical', 'easy', e.target.value)}
                                                />
                                            </div>
                                            <div className="diff-field">
                                                <label>Medium</label>
                                                <input
                                                    type="number"
                                                    value={technicalDifficulty.medium}
                                                    onChange={(e) => handleDifficultyChange('technical', 'medium', e.target.value)}
                                                />
                                            </div>
                                            <div className="diff-field">
                                                <label>Hard</label>
                                                <input
                                                    type="number"
                                                    value={technicalDifficulty.hard}
                                                    onChange={(e) => handleDifficultyChange('technical', 'hard', e.target.value)}
                                                />
                                            </div>
                                            <button
                                                type="button"
                                                className="auto-balance-btn"
                                                onClick={() => handleAutoBalance('technical')}
                                                title="Auto-balance easy, medium, hard to match count"
                                            >
                                                🪄 Auto Balance
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* MCQ Mode */}
                                <div className={`mode-config-box ${!includeMCQ ? 'mode-config-box--disabled' : ''}`}>
                                    <div className="mode-toggle-row">
                                        <label className="checkbox-label">
                                            <input
                                                type="checkbox"
                                                checked={includeMCQ}
                                                onChange={(e) => {
                                                    setIncludeMCQ(e.target.checked);
                                                    setSelectedPreset('custom');
                                                }}
                                            />
                                            <span className="mode-name">📝 Multiple Choice (MCQs)</span>
                                        </label>
                                    </div>
                                    {includeMCQ && (
                                        <div className="count-stepper-wrap">
                                            <button
                                                type="button"
                                                className="stepper-btn"
                                                onClick={() => {
                                                    setSelectedPreset('custom');
                                                    const next = Math.max(5, mcqCount - 5);
                                                    setMcqCount(next);
                                                    setMcqDifficulty(autoBalance(next));
                                                }}
                                            >–</button>
                                            <input
                                                type="number"
                                                min="5"
                                                max="50"
                                                value={mcqCount}
                                                onChange={(e) => {
                                                    setSelectedPreset('custom');
                                                    const next = Math.max(5, Math.min(50, parseInt(e.target.value) || 5));
                                                    setMcqCount(next);
                                                    setMcqDifficulty(autoBalance(next));
                                                }}
                                                className="stepper-input"
                                            />
                                            <button
                                                type="button"
                                                className="stepper-btn"
                                                onClick={() => {
                                                    setSelectedPreset('custom');
                                                    const next = Math.min(50, mcqCount + 5);
                                                    setMcqCount(next);
                                                    setMcqDifficulty(autoBalance(next));
                                                }}
                                            >+</button>
                                            <span className="stepper-unit">questions (5–50)</span>
                                        </div>
                                    )}

                                    {/* MCQ Difficulty Breakdown */}
                                    {includeMCQ && (
                                        <div className="difficulty-row">
                                            <div className="diff-field">
                                                <label>Easy</label>
                                                <input
                                                    type="number"
                                                    value={mcqDifficulty.easy}
                                                    onChange={(e) => handleDifficultyChange('mcq', 'easy', e.target.value)}
                                                />
                                            </div>
                                            <div className="diff-field">
                                                <label>Medium</label>
                                                <input
                                                    type="number"
                                                    value={mcqDifficulty.medium}
                                                    onChange={(e) => handleDifficultyChange('mcq', 'medium', e.target.value)}
                                                />
                                            </div>
                                            <div className="diff-field">
                                                <label>Hard</label>
                                                <input
                                                    type="number"
                                                    value={mcqDifficulty.hard}
                                                    onChange={(e) => handleDifficultyChange('mcq', 'hard', e.target.value)}
                                                />
                                            </div>
                                            <button
                                                type="button"
                                                className="auto-balance-btn"
                                                onClick={() => handleAutoBalance('mcq')}
                                                title="Auto-balance easy, medium, hard"
                                            >
                                                🪄 Auto Balance
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Behavioral Mode */}
                                <div className={`mode-config-box ${!includeBehavioral ? 'mode-config-box--disabled' : ''}`}>
                                    <div className="mode-toggle-row">
                                        <label className="checkbox-label">
                                            <input
                                                type="checkbox"
                                                checked={includeBehavioral}
                                                onChange={(e) => {
                                                    setIncludeBehavioral(e.target.checked);
                                                    setSelectedPreset('custom');
                                                }}
                                            />
                                            <span className="mode-name">🎯 STAR Behavioral Questions</span>
                                        </label>
                                    </div>
                                    {includeBehavioral && (
                                        <div className="count-stepper-wrap">
                                            <button
                                                type="button"
                                                className="stepper-btn"
                                                onClick={() => {
                                                    setSelectedPreset('custom');
                                                    const next = Math.max(5, behavioralCount - 5);
                                                    setBehavioralCount(next);
                                                    setBehavioralDifficulty(autoBalance(next));
                                                }}
                                            >–</button>
                                            <input
                                                type="number"
                                                min="5"
                                                max="30"
                                                value={behavioralCount}
                                                onChange={(e) => {
                                                    setSelectedPreset('custom');
                                                    const next = Math.max(5, Math.min(30, parseInt(e.target.value) || 5));
                                                    setBehavioralCount(next);
                                                    setBehavioralDifficulty(autoBalance(next));
                                                }}
                                                className="stepper-input"
                                            />
                                            <button
                                                type="button"
                                                className="stepper-btn"
                                                onClick={() => {
                                                    setSelectedPreset('custom');
                                                    const next = Math.min(30, behavioralCount + 5);
                                                    setBehavioralCount(next);
                                                    setBehavioralDifficulty(autoBalance(next));
                                                }}
                                            >+</button>
                                            <span className="stepper-unit">questions (5–30)</span>
                                        </div>
                                    )}

                                    {/* Behavioral Difficulty Breakdown */}
                                    {includeBehavioral && (
                                        <div className="difficulty-row">
                                            <div className="diff-field">
                                                <label>Easy</label>
                                                <input
                                                    type="number"
                                                    value={behavioralDifficulty.easy}
                                                    onChange={(e) => handleDifficultyChange('behavioral', 'easy', e.target.value)}
                                                />
                                            </div>
                                            <div className="diff-field">
                                                <label>Medium</label>
                                                <input
                                                    type="number"
                                                    value={behavioralDifficulty.medium}
                                                    onChange={(e) => handleDifficultyChange('behavioral', 'medium', e.target.value)}
                                                />
                                            </div>
                                            <div className="diff-field">
                                                <label>Hard</label>
                                                <input
                                                    type="number"
                                                    value={behavioralDifficulty.hard}
                                                    onChange={(e) => handleDifficultyChange('behavioral', 'hard', e.target.value)}
                                                />
                                            </div>
                                            <button
                                                type="button"
                                                className="auto-balance-btn"
                                                onClick={() => handleAutoBalance('behavioral')}
                                                title="Auto-balance easy, medium, hard"
                                            >
                                                🪄 Auto Balance
                                            </button>
                                        </div>
                                    )}
                                </div>

                            </div>
                        </div>

                        {/* Section B: Roadmap & Follow-up Settings */}
                        <div className="customizer-section">
                            <div className="section-title">
                                <span className="section-dot">●</span>
                                <h3>Roadmap Duration, Intensity & Technical Follow-ups</h3>
                            </div>
                            <div className="roadmap-config-grid">

                                {/* Roadmap Duration */}
                                <div className="config-block">
                                    <label className="block-label">Roadmap Duration</label>
                                    <div className="chip-button-group">
                                        {[7, 15, 20, 30].map(d => (
                                            <button
                                                key={d}
                                                type="button"
                                                className={`chip-btn ${roadmapDays === d ? 'chip-btn--active' : ''}`}
                                                onClick={() => {
                                                    setRoadmapDays(d);
                                                    setSelectedPreset('custom');
                                                }}
                                            >
                                                {d} Days
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Technical Follow-ups */}
                                <div className="config-block">
                                    <label className="block-label">Technical Follow-ups per Question</label>
                                    <div className="chip-button-group">
                                        {[0, 3, 5, 7].map(f => (
                                            <button
                                                key={f}
                                                type="button"
                                                className={`chip-btn ${technicalFollowUps === f ? 'chip-btn--active' : ''}`}
                                                onClick={() => {
                                                    setTechnicalFollowUps(f);
                                                    setSelectedPreset('custom');
                                                }}
                                            >
                                                {f === 0 ? 'None (0)' : `${f} Follow-ups`}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Study Intensity */}
                                <div className="config-block">
                                    <label className="block-label">Study Intensity</label>
                                    <div className="chip-button-group">
                                        {[
                                            { id: 'light', label: 'Light (1–2 hrs/d)' },
                                            { id: 'balanced', label: 'Balanced (2–4 hrs/d)' },
                                            { id: 'intensive', label: 'Intensive (4–6 hrs/d)' }
                                        ].map(int => (
                                            <button
                                                key={int.id}
                                                type="button"
                                                className={`chip-btn ${roadmapIntensity === int.id ? 'chip-btn--active' : ''}`}
                                                onClick={() => {
                                                    setRoadmapIntensity(int.id);
                                                    setSelectedPreset('custom');
                                                }}
                                            >
                                                {int.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                            </div>
                        </div>

                        {/* Section C: Focus Topics */}
                        <div className="customizer-section">
                            <div className="section-title">
                                <span className="section-dot">●</span>
                                <h3>Priority Focus Topics <span className="optional-tag">(Optional)</span></h3>
                            </div>
                            <div className="focus-topics-wrap">
                                <div className="focus-input-row">
                                    <input
                                        type="text"
                                        placeholder="Add topics to prioritize (e.g. System Design, RAG, React Hooks, SQL Queries)..."
                                        value={focusInput}
                                        onChange={(e) => setFocusInput(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                handleAddFocusArea();
                                            }
                                        }}
                                        className="focus-text-input"
                                    />
                                    <button
                                        type="button"
                                        className="button secondary-button focus-add-btn"
                                        onClick={handleAddFocusArea}
                                    >
                                        + Add Topic
                                    </button>
                                </div>

                                {focusAreas.length > 0 && (
                                    <div className="focus-tags-list">
                                        {focusAreas.map((tag, idx) => (
                                            <span key={idx} className="focus-tag-chip">
                                                {tag}
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveFocusArea(tag)}
                                                    className="focus-tag-remove"
                                                >×</button>
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>

                    {/* Live Plan Summary Bar */}
                    <div className="plan-summary-bar">
                        <div className="summary-pills-row">
                            <span className="summary-title">ACTIVE PLAN:</span>
                            {includeTechnical && (
                                <span className="summary-pill summary-pill--tech">
                                    🎙️ {technicalCount} Tech ({technicalDifficulty.easy}E / {technicalDifficulty.medium}M / {technicalDifficulty.hard}H)
                                </span>
                            )}
                            {includeMCQ && (
                                <span className="summary-pill summary-pill--mcq">
                                    📝 {mcqCount} MCQ ({mcqDifficulty.easy}E / {mcqDifficulty.medium}M / {mcqDifficulty.hard}H)
                                </span>
                            )}
                            {includeBehavioral && (
                                <span className="summary-pill summary-pill--beh">
                                    🎯 {behavioralCount} STAR ({behavioralDifficulty.easy}E / {behavioralDifficulty.medium}M / {behavioralDifficulty.hard}H)
                                </span>
                            )}
                            <span className="summary-pill summary-pill--road">
                                📅 {roadmapDays}-Day Roadmap ({roadmapIntensity})
                            </span>
                            <span className="summary-pill summary-pill--fol">
                                🔄 {technicalFollowUps} Follow-ups/Q
                            </span>
                            {focusAreas.length > 0 && (
                                <span className="summary-pill summary-pill--focus">
                                    🎯 {focusAreas.length} Focus Topics
                                </span>
                            )}
                        </div>
                    </div>

                </div>

                {/* Generate Button Action Bar */}
                <div className="home-action-bar">
                    <button
                        type="button"
                        className="button primary-button generate-main-btn"
                        onClick={() => handleGenerate()}
                        disabled={generating || detectingTracks}
                    >
                        {detectingTracks
                            ? 'Detecting Role Tracks...'
                            : generating
                                ? 'Crafting Custom Plan...'
                                : `Generate Interview Plan (${totalQuestions} Questions, ${roadmapDays} Days) →`}
                    </button>
                </div>

                {/* Overlays */}
                {detectingTracks && (
                    <div className="progress-overlay">
                        <div className="progress-card">
                            <div className="progress-header-icon">🔍</div>
                            <h2>Analyzing Job Description</h2>
                            <p className="progress-card__subtitle">Checking for multiple roles and specialized tracks...</p>
                        </div>
                    </div>
                )}

                {detectedTracks && (
                    <TrackSelectionOverlay
                        tracks={detectedTracks}
                        onSelect={(track) => handleGenerate(track)}
                        onCancel={() => setDetectedTracks(null)}
                    />
                )}

                {generating && (
                    <ProgressOverlay
                        progress={progress}
                        onRetry={() => handleGenerate()}
                        planConfig={currentPlanConfig}
                    />
                )}

            </div>
        </AppShell>
    );
};

export default Home;