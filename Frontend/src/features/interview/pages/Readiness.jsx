import React, { useState } from "react";
import { useParams, Link, useNavigate } from "react-router";
import { useReadiness } from "../hooks/useReadiness";
import { useApplications } from "../hooks/useApplications";
import { useInterview } from "../hooks/useInterview";
import AppShell from "../components/AppShell";
import "../style/readiness.scss";

const Readiness = () => {
    const { reportId } = useParams();
    const navigate = useNavigate();
    const { readiness, loading, error, refreshReadiness } = useReadiness(reportId);
    const { trackNewApplication } = useApplications();
    const { getResumePdf } = useInterview();

    const [isApplying, setIsApplying] = useState(false);
    const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
    const [actionMsg, setActionMsg] = useState(null);

    const handleDownloadPdf = async () => {
        const targetReportId = readiness?.reportId || reportId;
        if (!targetReportId || isDownloadingPdf) return;
        try {
            setIsDownloadingPdf(true);
            setActionMsg(null);
            const roleClean = readiness?.targetRole ? readiness.targetRole.replace(/[^a-zA-Z0-9]/g, "_") : "JD_Target";
            const filename = `${roleClean}_JD_Ready_Resume.pdf`;
            await getResumePdf(targetReportId, filename);
        } catch (err) {
            console.error("Failed to download JD-ready resume PDF:", err);
            setActionMsg("Unable to generate your JD-ready resume.");
        } finally {
            setIsDownloadingPdf(false);
        }
    };

    const handleTrackApplication = async () => {
        if (!readiness || !readiness.reportId) return;
        try {
            setIsApplying(true);
            await trackNewApplication({
                reportId: readiness.reportId,
                targetRole: readiness.targetRole,
                company: readiness.company,
                status: readiness.readyStatus === "READY TO APPLY" ? "READY_TO_APPLY" : "PREPARING"
            });
            setActionMsg("Application tracked successfully!");
            setTimeout(() => {
                navigate("/applications");
            }, 1000);
        } catch (err) {
            console.error("Track application error:", err);
            setActionMsg("Failed to track application: " + err.message);
        } finally {
            setIsApplying(false);
        }
    };

    return (
        <AppShell activeNavId="readiness" pageTitle="Application Readiness">
            <div className="readiness-page">
                {/* ── Header ── */}
                <div className="readiness-hero">
                    <div className="readiness-hero__left">
                        <div className="badge-pill">
                            <span className="badge-dot" /> Evidence-Grounded Verification
                        </div>
                        <h1 className="readiness-title">Application Readiness</h1>
                        <p className="readiness-subtitle">
                            See exactly what is ready, what is missing, and what to complete before you apply.
                        </p>
                    </div>
                    <div className="readiness-hero__actions">
                        <Link to="/applications" className="action-btn action-btn--secondary">
                            📋 View Application Tracker
                        </Link>
                        <Link to="/practice" className="action-btn action-btn--practice">
                            🎯 Start Practice
                        </Link>
                    </div>
                </div>

                {loading ? (
                    <div className="readiness-loading">
                        <div className="spinner" />
                        <p>Evaluating your candidate evidence and job readiness...</p>
                    </div>
                ) : error ? (
                    <div className="readiness-error">
                        <p className="error-text">⚠️ {error}</p>
                        <button type="button" onClick={refreshReadiness} className="retry-btn">
                            Retry Evaluation
                        </button>
                    </div>
                ) : !readiness || !readiness.hasReport ? (
                    <div className="readiness-empty">
                        <span className="empty-icon">📊</span>
                        <h2>No Active Analysis Found</h2>
                        <p>Upload a resume and analyze a target job description to evaluate your candidate readiness.</p>
                        <Link to="/" className="empty-btn">
                            🚀 Go to Interview Planner
                        </Link>
                    </div>
                ) : (
                    <div className="readiness-content">
                        {/* ── 1. Target Role & Status Card ── */}
                        <div className={`target-role-banner target-role-banner--${readiness.readyStatusClass}`}>
                            <div className="target-role-info">
                                <span className="role-sublabel">TARGET POSITION:</span>
                                <h2 className="role-title">{readiness.targetRole}</h2>
                                <p className="role-company">🏢 {readiness.company}</p>
                            </div>
                            <div className="target-role-status">
                                <div className="match-pill">
                                    <span className="match-val">{readiness.jdMatch}%</span>
                                    <span className="match-lbl">JD Match</span>
                                </div>
                                <div className={`status-badge status-badge--${readiness.readyStatusClass}`}>
                                    {readiness.readyStatusText}
                                </div>
                            </div>
                        </div>

                        {actionMsg && (
                            <div className="readiness-alert">
                                <span>{actionMsg}</span>
                            </div>
                        )}

                        {/* ── 2. 8 Evidence Metric Cards ── */}
                        <div className="metrics-grid-8">
                            <div className="metric-box">
                                <span className="metric-val">{readiness.metrics.jdMatch.value}%</span>
                                <span className="metric-lbl">JD Match</span>
                            </div>
                            <div className="metric-box">
                                <span className="metric-val">{readiness.metrics.requiredSkills.value}</span>
                                <span className="metric-lbl">Required Skills</span>
                            </div>
                            <div className="metric-box">
                                <span className="metric-val metric-val--verified">{readiness.metrics.verifiedSkills.value}</span>
                                <span className="metric-lbl">Verified Skills</span>
                            </div>
                            <div className="metric-box">
                                <span className="metric-val">{readiness.metrics.roadmap.value}</span>
                                <span className="metric-lbl">Roadmap Days</span>
                            </div>
                            <div className="metric-box">
                                <span className="metric-val">{readiness.metrics.technicalPractice.value}</span>
                                <span className="metric-lbl">Technical Practice</span>
                            </div>
                            <div className="metric-box">
                                <span className="metric-val">{readiness.metrics.behavioralPractice.value}</span>
                                <span className="metric-lbl">Behavioral Practice</span>
                            </div>
                            <div className="metric-box">
                                <span className="metric-val">{readiness.metrics.requiredProjects.value}</span>
                                <span className="metric-lbl">Required Projects</span>
                            </div>
                            <div className="metric-box">
                                <span className="metric-val">{readiness.metrics.resumeAlignment.value}</span>
                                <span className="metric-lbl">Resume Alignment</span>
                            </div>
                        </div>

                        {/* ── 3. Next Best Action Card ── */}
                        <div className="next-action-card">
                            <div className="next-action-left">
                                <span className="next-action-tag">⚡ NEXT BEST ACTION</span>
                                <h3 className="next-action-title">{readiness.nextBestAction.title}</h3>
                                <p className="next-action-desc">{readiness.nextBestAction.description}</p>
                            </div>
                            <div className="next-action-right">
                                {readiness.nextBestAction.type === "APPLY" ? (
                                    <button
                                        type="button"
                                        className="btn-action-cta btn-action-cta--apply"
                                        onClick={handleTrackApplication}
                                        disabled={isApplying}
                                    >
                                        {isApplying ? "Tracking..." : "💼 Track Application"}
                                    </button>
                                ) : (
                                    <Link to={readiness.nextBestAction.actionPath} className="btn-action-cta">
                                        {readiness.nextBestAction.actionLabel} →
                                    </Link>
                                )}
                            </div>
                        </div>

                        {/* ── 4. Two-Column Readiness Breakdown ── */}
                        <div className="breakdown-grid">
                            {/* Why Ready */}
                            <div className="breakdown-card breakdown-card--ready">
                                <div className="breakdown-header">
                                    <span className="icon">✓</span>
                                    <h3>Why You Are Ready</h3>
                                </div>
                                <ul className="breakdown-list">
                                    {readiness.breakdown.whyReady && readiness.breakdown.whyReady.length > 0 ? (
                                        readiness.breakdown.whyReady.map((item, idx) => (
                                            <li key={idx} className="breakdown-item breakdown-item--success">
                                                <span className="check">✓</span>
                                                <span>{item}</span>
                                            </li>
                                        ))
                                    ) : (
                                        <li className="breakdown-item breakdown-item--muted">
                                            No verified readiness factors recorded yet. Complete roadmap days and practice.
                                        </li>
                                    )}
                                </ul>
                            </div>

                            {/* Still Missing */}
                            <div className="breakdown-card breakdown-card--missing">
                                <div className="breakdown-header">
                                    <span className="icon">⚠️</span>
                                    <h3>Still Missing / Action Items</h3>
                                </div>
                                <ul className="breakdown-list">
                                    {readiness.breakdown.stillMissing && readiness.breakdown.stillMissing.length > 0 ? (
                                        readiness.breakdown.stillMissing.map((item, idx) => (
                                            <li key={idx} className="breakdown-item breakdown-item--warning">
                                                <span className="warn">⚠️</span>
                                                <span>{item}</span>
                                            </li>
                                        ))
                                    ) : (
                                        <li className="breakdown-item breakdown-item--success">
                                            <span className="check">✓</span>
                                            <span>All primary requirements satisfied! You are ready to apply.</span>
                                        </li>
                                    )}
                                </ul>
                            </div>
                        </div>

                        {/* ── 5. Required Skills Check ── */}
                        <div className="readiness-section-card">
                            <div className="section-header">
                                <h3>Required Skills Check ({readiness.requiredSkillsList.length})</h3>
                                <Link to="/profile" className="section-link">
                                    Skill Hub & Verification →
                                </Link>
                            </div>
                            <div className="skills-checklist-grid">
                                {readiness.requiredSkillsList.map((sk, idx) => (
                                    <div key={idx} className={`skill-check-pill ${sk.isVerified ? "skill-check-pill--verified" : "skill-check-pill--unverified"}`}>
                                        <span className="status-symbol">{sk.isVerified ? "✓" : "⚠️"}</span>
                                        <span className="skill-title">{sk.name}</span>
                                        <span className="skill-badge">{sk.isVerified ? "Verified" : "Missing Evidence"}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* ── 6. Application Checklist & CTA ── */}
                        <div className="readiness-section-card">
                            <div className="section-header">
                                <h3>Application Readiness Checklist</h3>
                                <span className="section-tag">Final Check</span>
                            </div>
                            <div className="checklist-items">
                                {readiness.checklist.map((c) => (
                                    <div key={c.id} className="checklist-row">
                                        <span className={`chk-box ${c.isComplete ? "chk-box--checked" : ""}`}>
                                            {c.isComplete ? "✓" : "○"}
                                        </span>
                                        <div className="chk-info">
                                            <span className="chk-label">{c.label}</span>
                                            <span className="chk-detail">{c.detail}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {actionMsg && (
                                <div style={{
                                    marginBottom: '1rem',
                                    padding: '0.75rem 1rem',
                                    borderRadius: '8px',
                                    background: actionMsg.includes('Unable') || actionMsg.includes('Failed') ? 'rgba(239, 68, 68, 0.15)' : 'rgba(34, 197, 94, 0.15)',
                                    border: actionMsg.includes('Unable') || actionMsg.includes('Failed') ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(34, 197, 94, 0.3)',
                                    color: actionMsg.includes('Unable') || actionMsg.includes('Failed') ? '#F87171' : '#4ADE80',
                                    fontSize: '0.85rem',
                                    fontWeight: '600',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}>
                                    <span>{actionMsg}</span>
                                    <button type="button" onClick={() => setActionMsg(null)} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontWeight: 'bold' }}>✕</button>
                                </div>
                            )}

                            <div className="checklist-footer-actions">
                                <button
                                    type="button"
                                    onClick={handleDownloadPdf}
                                    className="btn-secondary"
                                    disabled={isDownloadingPdf || !readiness.reportId}
                                >
                                    {isDownloadingPdf ? "⏳ Generating Resume..." : "📄 Download JD-Ready Resume"}
                                </button>
                                <button
                                    type="button"
                                    onClick={handleTrackApplication}
                                    className="btn-primary"
                                    disabled={isApplying}
                                >
                                    {isApplying ? "Saving..." : "💼 Track This Application"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AppShell>
    );
};

export default Readiness;
