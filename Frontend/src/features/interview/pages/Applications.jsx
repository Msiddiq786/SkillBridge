import React, { useState } from "react";
import { Link } from "react-router";
import { useApplications } from "../hooks/useApplications";
import AppShell from "../components/AppShell";
import "../style/applications.scss";

const STATUS_OPTIONS = [
    { value: "ALL", label: "All Statuses" },
    { value: "PREPARING", label: "Preparing" },
    { value: "READY_TO_APPLY", label: "Ready to Apply" },
    { value: "APPLIED", label: "Applied" },
    { value: "INTERVIEW", label: "Interview" },
    { value: "OFFER", label: "Offer" },
    { value: "REJECTED", label: "Rejected" },
    { value: "SAVED", label: "Saved" }
];

const Applications = () => {
    const {
        applications,
        summary,
        loading,
        error,
        filters,
        setFilters,
        updateApplicationStatus,
        removeApplication,
        refreshApplications
    } = useApplications();

    const [selectedApp, setSelectedApp] = useState(null);
    const [editingApp, setEditingApp] = useState(null);
    const [statusForm, setStatusForm] = useState({
        status: "APPLIED",
        interviewDate: "",
        recruiterName: "",
        recruiterEmail: "",
        notes: "",
        jobUrl: ""
    });
    const [isSaving, setIsSaving] = useState(false);

    const handleOpenEdit = (app) => {
        setEditingApp(app);
        setStatusForm({
            status: app.status || "APPLIED",
            interviewDate: app.interviewDate ? new Date(app.interviewDate).toISOString().slice(0, 16) : "",
            recruiterName: app.recruiterName || "",
            recruiterEmail: app.recruiterEmail || "",
            notes: app.notes || "",
            jobUrl: app.jobUrl || ""
        });
    };

    const handleSaveEdit = async (e) => {
        e.preventDefault();
        if (!editingApp) return;
        try {
            setIsSaving(true);
            await updateApplicationStatus(editingApp._id, {
                ...statusForm,
                interviewDate: statusForm.interviewDate ? new Date(statusForm.interviewDate) : null
            });
            setEditingApp(null);
        } catch (err) {
            console.error("Failed to update application:", err);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to remove this tracked application?")) {
            await removeApplication(id);
        }
    };

    return (
        <AppShell activeNavId="applications" pageTitle="Application Tracker">
            <div className="applications-page">
                {/* ── Header ── */}
                <div className="applications-hero">
                    <div className="applications-hero__left">
                        <div className="badge-pill">
                            <span className="badge-dot" /> End-to-End Pipeline
                        </div>
                        <h1 className="applications-title">Application Tracker</h1>
                        <p className="applications-subtitle">
                            Track every job from preparation and readiness to interview outcome.
                        </p>
                    </div>
                    <div className="applications-hero__actions">
                        <Link to="/readiness" className="action-btn action-btn--primary">
                            ⚡ Check Readiness
                        </Link>
                        <Link to="/" className="action-btn action-btn--secondary">
                            🚀 + New Job Plan
                        </Link>
                    </div>
                </div>

                {/* ── Summary Counters ── */}
                <div className="summary-counters-grid">
                    <div className="summary-card" onClick={() => setFilters(f => ({ ...f, status: "ALL" }))}>
                        <span className="count-num">{summary.total}</span>
                        <span className="count-lbl">Total Applications</span>
                    </div>
                    <div className="summary-card" onClick={() => setFilters(f => ({ ...f, status: "PREPARING" }))}>
                        <span className="count-num count-num--prep">{summary.preparing}</span>
                        <span className="count-lbl">Preparing</span>
                    </div>
                    <div className="summary-card" onClick={() => setFilters(f => ({ ...f, status: "READY_TO_APPLY" }))}>
                        <span className="count-num count-num--ready">{summary.ready}</span>
                        <span className="count-lbl">Ready to Apply</span>
                    </div>
                    <div className="summary-card" onClick={() => setFilters(f => ({ ...f, status: "APPLIED" }))}>
                        <span className="count-num count-num--applied">{summary.applied}</span>
                        <span className="count-lbl">Applied</span>
                    </div>
                    <div className="summary-card" onClick={() => setFilters(f => ({ ...f, status: "INTERVIEW" }))}>
                        <span className="count-num count-num--interview">{summary.interview}</span>
                        <span className="count-lbl">Interviewing</span>
                    </div>
                    <div className="summary-card" onClick={() => setFilters(f => ({ ...f, status: "OFFER" }))}>
                        <span className="count-num count-num--offer">{summary.offer}</span>
                        <span className="count-lbl">Offers 🎉</span>
                    </div>
                </div>

                {/* ── Filters & Search Toolbar ── */}
                <div className="applications-toolbar">
                    <div className="search-box">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="11" cy="11" r="8" />
                            <line x1="21" y1="21" x2="16.65" y2="16.65" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Filter by role, company, or notes..."
                            value={filters.search}
                            onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))}
                        />
                    </div>

                    <div className="filter-group">
                        <select
                            value={filters.status}
                            onChange={(e) => setFilters(f => ({ ...f, status: e.target.value }))}
                            className="status-select"
                        >
                            {STATUS_OPTIONS.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>

                        <select
                            value={filters.sort}
                            onChange={(e) => setFilters(f => ({ ...f, sort: e.target.value }))}
                            className="sort-select"
                        >
                            <option value="recent">Most Recent</option>
                            <option value="upcoming_interview">Upcoming Interview</option>
                            <option value="highest_match">Highest Match</option>
                            <option value="oldest">Oldest</option>
                        </select>
                    </div>
                </div>

                {/* ── Applications Cards List ── */}
                {loading ? (
                    <div className="applications-loading">
                        <div className="spinner" />
                        <p>Loading your tracked applications...</p>
                    </div>
                ) : error ? (
                    <div className="applications-error">
                        <p>⚠️ {error}</p>
                        <button type="button" onClick={refreshApplications} className="retry-btn">Retry</button>
                    </div>
                ) : applications.length === 0 ? (
                    <div className="applications-empty">
                        <span className="empty-icon">💼</span>
                        <h3>No tracked applications yet</h3>
                        <p>Evaluate your readiness and track target job opportunities to monitor your interview progress.</p>
                        <Link to="/readiness" className="empty-action-btn">
                            ⚡ Evaluate Application Readiness
                        </Link>
                    </div>
                ) : (
                    <div className="applications-grid">
                        {applications.map((app) => (
                            <div key={app._id} className="app-card">
                                <div className="app-card-top">
                                    <div className="app-identity">
                                        <h3 className="app-role">{app.targetRole}</h3>
                                        <span className="app-company">🏢 {app.company}</span>
                                    </div>
                                    <span className={`status-pill status-pill--${app.status.toLowerCase()}`}>
                                        {app.status.replace(/_/g, " ")}
                                    </span>
                                </div>

                                <div className="app-details-row">
                                    <div className="detail-item">
                                        <span className="lbl">JD Match</span>
                                        <span className="val">{app.readinessSnapshot?.jdMatch || app.report?.matchScore || 0}%</span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="lbl">Readiness</span>
                                        <span className="val val--ready">{app.readinessSnapshot?.status || "Ready"}</span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="lbl">Target Resume</span>
                                        <span className="val">{app.resumeVersionUsed?.versionName ? "JD-Ready Resume" : "Resume Aligned"}</span>
                                    </div>
                                    {app.appliedAt && (
                                        <div className="detail-item">
                                            <span className="lbl">Applied Date</span>
                                            <span className="val">{new Date(app.appliedAt).toLocaleDateString()}</span>
                                        </div>
                                    )}
                                    {app.interviewDate && (
                                        <div className="detail-item detail-item--highlight">
                                            <span className="lbl">📅 Interview</span>
                                            <span className="val">{new Date(app.interviewDate).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                                        </div>
                                    )}
                                </div>

                                {app.notes && (
                                    <p className="app-notes">
                                        <strong>Notes:</strong> {app.notes}
                                    </p>
                                )}

                                <div className="app-card-actions">
                                    {app.report?._id && (
                                        <Link to={`/readiness/${app.report._id}`} className="card-btn card-btn--view">
                                            ⚡ Readiness
                                        </Link>
                                    )}
                                    {app.report?._id && (
                                        <Link to={`/interview/${app.report._id}`} className="card-btn card-btn--prep">
                                            🗺️ Prep Plan
                                        </Link>
                                    )}
                                    {app.jobUrl && (
                                        <a href={app.jobUrl} target="_blank" rel="noreferrer" className="card-btn card-btn--link">
                                            🔗 Job Posting
                                        </a>
                                    )}
                                    <button
                                        type="button"
                                        className="card-btn card-btn--timeline"
                                        onClick={() => setSelectedApp(app)}
                                    >
                                        📜 Timeline ({app.timeline?.length || 1})
                                    </button>
                                    <button
                                        type="button"
                                        className="card-btn card-btn--edit"
                                        onClick={() => handleOpenEdit(app)}
                                    >
                                        ✏️ Update
                                    </button>
                                    <button
                                        type="button"
                                        className="card-btn card-btn--delete"
                                        onClick={() => handleDelete(app._id)}
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* ── Edit / Update Modal ── */}
                {editingApp && (
                    <div className="modal-backdrop" onClick={() => setEditingApp(null)}>
                        <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h3>Update Application: {editingApp.targetRole}</h3>
                                <button type="button" onClick={() => setEditingApp(null)} className="close-btn">✕</button>
                            </div>
                            <form onSubmit={handleSaveEdit} className="modal-form">
                                <div className="form-group">
                                    <label>Application Status</label>
                                    <select
                                        value={statusForm.status}
                                        onChange={(e) => setStatusForm(f => ({ ...f, status: e.target.value }))}
                                    >
                                        <option value="PREPARING">Preparing</option>
                                        <option value="READY_TO_APPLY">Ready to Apply</option>
                                        <option value="APPLIED">Applied</option>
                                        <option value="ASSESSMENT">Assessment / Take-Home</option>
                                        <option value="INTERVIEW">Interview Scheduled</option>
                                        <option value="OFFER">Offer Received 🎉</option>
                                        <option value="REJECTED">Rejected</option>
                                        <option value="WITHDRAWN">Withdrawn</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>Interview Date & Time (Optional)</label>
                                    <input
                                        type="datetime-local"
                                        value={statusForm.interviewDate}
                                        onChange={(e) => setStatusForm(f => ({ ...f, interviewDate: e.target.value }))}
                                    />
                                </div>

                                <div className="form-row-2">
                                    <div className="form-group">
                                        <label>Recruiter / Contact Name</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. Sarah Jenkins"
                                            value={statusForm.recruiterName}
                                            onChange={(e) => setStatusForm(f => ({ ...f, recruiterName: e.target.value }))}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Recruiter Email / LinkedIn</label>
                                        <input
                                            type="text"
                                            placeholder="sarah@technova.com"
                                            value={statusForm.recruiterEmail}
                                            onChange={(e) => setStatusForm(f => ({ ...f, recruiterEmail: e.target.value }))}
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>Job Posting URL</label>
                                    <input
                                        type="url"
                                        placeholder="https://..."
                                        value={statusForm.jobUrl}
                                        onChange={(e) => setStatusForm(f => ({ ...f, jobUrl: e.target.value }))}
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Preparation & Interview Notes</label>
                                    <textarea
                                        rows="3"
                                        placeholder="Add notes on questions asked, topics to revise, or recruiter feedback..."
                                        value={statusForm.notes}
                                        onChange={(e) => setStatusForm(f => ({ ...f, notes: e.target.value }))}
                                    />
                                </div>

                                <div className="modal-actions">
                                    <button type="button" onClick={() => setEditingApp(null)} className="btn-cancel">
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn-submit" disabled={isSaving}>
                                        {isSaving ? "Saving..." : "Save Changes"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* ── Timeline History Modal ── */}
                {selectedApp && (
                    <div className="modal-backdrop" onClick={() => setSelectedApp(null)}>
                        <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h3>Application History & Timeline</h3>
                                <button type="button" onClick={() => setSelectedApp(null)} className="close-btn">✕</button>
                            </div>
                            <div className="timeline-view">
                                <div className="timeline-app-summary">
                                    <h4>{selectedApp.targetRole} @ {selectedApp.company}</h4>
                                    <span className="badge">Current: {selectedApp.status.replace(/_/g, " ")}</span>
                                </div>
                                <div className="timeline-events-list">
                                    {(selectedApp.timeline || []).map((evt, idx) => (
                                        <div key={idx} className="timeline-event-item">
                                            <span className="event-dot" />
                                            <div className="event-content">
                                                <div className="event-top">
                                                    <span className="event-title">{evt.title}</span>
                                                    <span className="event-date">{new Date(evt.date).toLocaleDateString()}</span>
                                                </div>
                                                {evt.description && <p className="event-desc">{evt.description}</p>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AppShell>
    );
};

export default Applications;
