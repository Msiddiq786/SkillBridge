import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useProgressSummary } from '../hooks/useProgressSummary';
import AppShell from '../components/AppShell';
import '../style/progress.scss';

const Progress = () => {
    const { summary, loading, error, refreshSummary } = useProgressSummary();
    const navigate = useNavigate();
    const [selectedCompletedJourney, setSelectedCompletedJourney] = useState(null);

    const formatMinutes = (mins) => {
        if (!mins || mins <= 0) return '0m';
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        if (h === 0) return `${m}m`;
        if (m === 0) return `${h}h`;
        return `${h}h ${m}m`;
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '—';
        try {
            return new Date(dateStr).toLocaleDateString(undefined, {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
            });
        } catch {
            return String(dateStr);
        }
    };

    const formatDateTime = (dateStr) => {
        if (!dateStr) return '—';
        try {
            return new Date(dateStr).toLocaleString(undefined, {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return String(dateStr);
        }
    };

    const analyses = summary?.analyses || { total: 0, completed: 0, active: 0, notStarted: 0, averageMatchScore: 0, preparationCompletionRate: 0 };
    const journeys = summary?.journeys || { started: 0, completed: 0, active: 0, averageCompletion: 0, journeysList: [] };
    const skills = summary?.skills || { gained: 0, skillsList: [] };
    const streak = summary?.streak || { current: 0, longest: 0, isActiveToday: false };
    const learningTime = summary?.learningTime || { todayMinutes: 0, weekMinutes: 0, totalMinutes: 0, activeDaysThisWeek: 0 };
    const achievements = summary?.recentAchievements || [];
    const activities = summary?.recentActivities || [];
    const journeysList = journeys.journeysList || [];

    const activeDaysCount = learningTime.activeDaysThisWeek || 0;
    const weekProgressPercent = Math.min(100, Math.round((activeDaysCount / 7) * 100));

    return (
        <AppShell activeNavId="progress" pageTitle="Learning & Progress">
            <div className="progress-page">
                {/* ── Hero Banner ── */}
                <div className="progress-hero">
                    <div className="progress-hero__left">
                        <div className="badge-pill">
                            <span className="badge-dot" /> Verified Preparation & Velocity
                        </div>
                        <h1 className="progress-title">Learning & Progress</h1>
                        <p className="progress-subtitle">
                            See exactly what you have learned, completed, and improved.
                        </p>
                    </div>
                    <div className="progress-hero__actions">
                        <Link to="/practice" className="action-btn action-btn--practice">
                            <span>🎯</span> Start Practice
                        </Link>
                        <Link to="/" className="action-btn action-btn--primary">
                            <span>📄</span> + New Job Analysis
                        </Link>
                    </div>
                </div>

                {loading ? (
                    <div className="progress-loading-state">
                        <div className="spinner" />
                        <p>Loading your learning progress...</p>
                    </div>
                ) : error ? (
                    <div className="progress-error-state">
                        <p className="error-msg">⚠️ Unable to load your progress: {error}</p>
                        <button type="button" onClick={refreshSummary} className="retry-btn">
                            Retry
                        </button>
                    </div>
                ) : (
                    <div className="progress-layout">
                        {/* ── 1. Analyzer Overview ── */}
                        <section className="overview-card">
                            <div className="overview-header">
                                <div>
                                    <h2>Analyzer Overview</h2>
                                    <p className="overview-sub">Aggregate statistics across all your job preparations</p>
                                </div>
                                <span className="overview-tag">Canonical Single Source of Truth</span>
                            </div>

                            <div className="overview-metrics-grid">
                                <div className="metric-cell">
                                    <span className="val">{analyses.total}</span>
                                    <span className="lbl">Total Analyses</span>
                                </div>
                                <div className="metric-cell metric-cell--active">
                                    <span className="val">{analyses.active}</span>
                                    <span className="lbl">Active Preparations</span>
                                </div>
                                <div className="metric-cell metric-cell--completed">
                                    <span className="val">{analyses.completed}</span>
                                    <span className="lbl">Completed Preparations</span>
                                </div>
                                <div className="metric-cell">
                                    <span className="val">{analyses.notStarted}</span>
                                    <span className="lbl">Not Started</span>
                                </div>
                                <div className="metric-cell">
                                    <span className="val">{analyses.averageMatchScore}%</span>
                                    <span className="lbl">Average Match</span>
                                </div>
                                <div className="metric-cell metric-cell--rate">
                                    <span className="val">{analyses.completed} / {analyses.total || 0} ({analyses.preparationCompletionRate}%)</span>
                                    <span className="lbl">Preparation Completion Rate</span>
                                </div>
                            </div>
                        </section>

                        {/* ── 2. Learning Journeys Section ── */}
                        <section className="journeys-section">
                            <div className="section-title-row">
                                <div>
                                    <h2>Learning Journeys</h2>
                                    <p className="section-sub">Roadmap progress and verified completion status per target position</p>
                                </div>
                                <span className="section-counter">
                                    {journeys.completed} Completed · {journeys.active} In Progress
                                </span>
                            </div>

                            {journeysList.length > 0 ? (
                                <div className="journeys-cards-grid">
                                    {journeysList.map((j) => (
                                        <div key={j.id} className={`journey-card ${j.isCompleted ? 'journey-card--completed' : 'journey-card--active'}`}>
                                            <div className="journey-card__header">
                                                <div className="role-meta">
                                                    <span className="company-tag">{j.company || 'Target Company'}</span>
                                                    <h3 className="role-title">{j.targetRole}</h3>
                                                </div>
                                                <span className={`status-pill ${j.isCompleted ? 'status-pill--completed' : 'status-pill--active'}`}>
                                                    {j.isCompleted ? '🎉 COMPLETED' : '🟡 IN PROGRESS'}
                                                </span>
                                            </div>

                                            <div className="journey-card__stats">
                                                <div className="stat-box">
                                                    <span className="stat-lbl">Roadmap Days</span>
                                                    <span className="stat-val">{j.completedDaysCount} / {j.roadmapDays} days</span>
                                                </div>
                                                <div className="stat-box">
                                                    <span className="stat-lbl">Overall Progress</span>
                                                    <span className="stat-val">{j.overallProgress}%</span>
                                                </div>
                                                <div className="stat-box">
                                                    <span className="stat-lbl">Active Learning</span>
                                                    <span className="stat-val">{formatMinutes(j.activeLearningMinutes)}</span>
                                                </div>
                                                <div className="stat-box">
                                                    <span className="stat-lbl">Timeline</span>
                                                    <span className="stat-val">{j.isCompleted ? `Took ${j.elapsedCalendarDays} days` : `Day ${j.currentDay} of ${j.roadmapDays}`}</span>
                                                </div>
                                            </div>

                                            <div className="journey-card__dates">
                                                <span><strong>Started:</strong> {formatDate(j.startedAt)}</span>
                                                {j.isCompleted && <span><strong>Completed:</strong> {formatDate(j.completedAt)}</span>}
                                            </div>

                                            <div className="journey-progress-track">
                                                <div className="journey-progress-fill" style={{ width: `${j.overallProgress}%` }} />
                                            </div>

                                            <div className="journey-card__footer">
                                                {j.isCompleted ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => setSelectedCompletedJourney(j)}
                                                        className="journey-btn journey-btn--summary"
                                                    >
                                                        🎉 View Completion Summary
                                                    </button>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        onClick={() => navigate(`/interview/${j.reportId}`)}
                                                        className="journey-btn journey-btn--continue"
                                                    >
                                                        ▶ Continue Roadmap (Day {j.currentDay})
                                                    </button>
                                                )}
                                                <Link to={`/readiness/${j.reportId}`} className="journey-btn-sec">
                                                    Check Readiness →
                                                </Link>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="journeys-empty-state">
                                    <span className="empty-icon">🎯</span>
                                    <h3>No Learning Journeys Started Yet</h3>
                                    <p>Analyze a job description and click "Start Learning Journey" to begin your structured preparation roadmap.</p>
                                    <Link to="/" className="btn-primary">
                                        + Analyze a Job Description
                                    </Link>
                                </div>
                            )}
                        </section>

                        {/* ── 3. Skills Gained, Learning Time & Streaks ── */}
                        <div className="insights-two-column">
                            {/* Skills Gained Section */}
                            <section className="insight-card">
                                <div className="card-top">
                                    <div className="card-top__title">
                                        <span className="icon">🧠</span>
                                        <h3>Skills Gained ({skills.gained})</h3>
                                    </div>
                                    <Link to="/profile" className="link-pill">
                                        Skill Hub →
                                    </Link>
                                </div>
                                <p className="card-desc">Skills verified through completed roadmap days, showcase projects, and scored practice sessions.</p>

                                {skills.skillsList && skills.skillsList.length > 0 ? (
                                    <div className="skills-table-container">
                                        <table className="skills-table">
                                            <thead>
                                                <tr>
                                                    <th>Skill</th>
                                                    <th>Previous</th>
                                                    <th>Current</th>
                                                    <th>Source / Evidence</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {skills.skillsList.map((sk, idx) => (
                                                    <tr key={sk.id || idx}>
                                                        <td className="skill-name-cell">
                                                            <strong>{sk.name}</strong>
                                                        </td>
                                                        <td>
                                                            <span className="badge-missing">{sk.previousStatus || 'MISSING'}</span>
                                                        </td>
                                                        <td>
                                                            <span className="badge-verified">✓ VERIFIED</span>
                                                        </td>
                                                        <td className="skill-source-cell">
                                                            {sk.source || 'Verified Profile Evidence'}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="empty-box">
                                        <span>🧠</span>
                                        <p>No skills verified yet. Complete roadmap days and practice sessions to verify skills.</p>
                                    </div>
                                )}
                            </section>

                            {/* Active Learning Time & Streak */}
                            <div className="side-column-stack">
                                <section className="insight-card">
                                    <div className="card-top">
                                        <div className="card-top__title">
                                            <span className="icon">⏱</span>
                                            <h3>Active Learning Time</h3>
                                        </div>
                                        <span className="tag-pill">Timezone Normalized</span>
                                    </div>
                                    <div className="time-stats-grid">
                                        <div className="time-cell">
                                            <span className="val">{formatMinutes(learningTime.todayMinutes)}</span>
                                            <span className="lbl">Today</span>
                                        </div>
                                        <div className="time-cell">
                                            <span className="val">{formatMinutes(learningTime.weekMinutes)}</span>
                                            <span className="lbl">This Week</span>
                                        </div>
                                        <div className="time-cell">
                                            <span className="val">{formatMinutes(learningTime.totalMinutes)}</span>
                                            <span className="lbl">Total Time</span>
                                        </div>
                                    </div>

                                    <div className="weekly-active-bar">
                                        <div className="weekly-bar-labels">
                                            <span>Active Days This Week</span>
                                            <span>{activeDaysCount} / 7 days</span>
                                        </div>
                                        <div className="weekly-track">
                                            <div className="weekly-fill" style={{ width: `${weekProgressPercent}%` }} />
                                        </div>
                                    </div>
                                </section>

                                <section className="insight-card">
                                    <div className="card-top">
                                        <div className="card-top__title">
                                            <span className="icon">🔥</span>
                                            <h3>Learning Streak</h3>
                                        </div>
                                        <span className={`streak-badge ${streak.isActiveToday ? 'streak-badge--active' : 'streak-badge--pending'}`}>
                                            {streak.isActiveToday ? '✓ Active Today' : '⏳ Action Needed'}
                                        </span>
                                    </div>

                                    <div className="streak-hero-box">
                                        <div className="streak-circle">
                                            <span className="fire-icon">🔥</span>
                                            <span className="streak-num">{streak.current}</span>
                                        </div>
                                        <div className="streak-info">
                                            <h4>{streak.current === 1 ? '1 Day Learning Streak' : `${streak.current} Days Learning Streak`}</h4>
                                            <p>Longest Streak Record: <strong>{streak.longest} {streak.longest === 1 ? 'day' : 'days'}</strong></p>
                                            <span className="streak-rule">Qualifying actions: completing roadmap study days, practice sessions, or verified projects.</span>
                                        </div>
                                    </div>
                                </section>
                            </div>
                        </div>

                        {/* ── 4. Recent Activity Log ── */}
                        {activities.length > 0 && (
                            <section className="activity-card">
                                <div className="card-top">
                                    <div className="card-top__title">
                                        <span className="icon">📜</span>
                                        <h3>Recent Learning Activity History</h3>
                                    </div>
                                    <span className="tag-pill">Activity Log</span>
                                </div>
                                <div className="activity-timeline-list">
                                    {activities.map((act, idx) => (
                                        <div key={act._id || idx} className="activity-timeline-item">
                                            <span className={`dot ${act.isQualifying ? 'dot--qualifying' : ''}`} />
                                            <div className="content">
                                                <div className="title-row">
                                                    <span className="act-title">{act.title}</span>
                                                    <span className="act-date">{act.dateString}</span>
                                                </div>
                                                {act.detail && <p className="act-sub">{act.detail}</p>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>
                )}

                {/* ── COMPLETION SUMMARY MODAL ── */}
                {selectedCompletedJourney && (
                    <div className="modal-overlay" onClick={() => setSelectedCompletedJourney(null)}>
                        <div className="completion-modal" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <div className="modal-header__left">
                                    <span className="celebration-badge">🎉 JOURNEY COMPLETED</span>
                                    <h2>{selectedCompletedJourney.targetRole}</h2>
                                    <p className="company-sub">{selectedCompletedJourney.company || 'Target Company'}</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setSelectedCompletedJourney(null)}
                                    className="close-btn"
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="modal-body">
                                <div className="summary-banner">
                                    <div className="summary-metric">
                                        <span className="val">100%</span>
                                        <span className="lbl">Final Progress</span>
                                    </div>
                                    <div className="summary-metric">
                                        <span className="val">{selectedCompletedJourney.roadmapDays} / {selectedCompletedJourney.roadmapDays}</span>
                                        <span className="lbl">Roadmap Days</span>
                                    </div>
                                    <div className="summary-metric">
                                        <span className="val">{selectedCompletedJourney.elapsedCalendarDays} Days</span>
                                        <span className="lbl">Calendar Duration</span>
                                    </div>
                                    <div className="summary-metric">
                                        <span className="val">{formatMinutes(selectedCompletedJourney.activeLearningMinutes)}</span>
                                        <span className="lbl">Learning Time</span>
                                    </div>
                                </div>

                                <div className="summary-section">
                                    <h3>Timeline & Completion Record</h3>
                                    <div className="timeline-box">
                                        <p><strong>Started:</strong> {formatDateTime(selectedCompletedJourney.startedAt)}</p>
                                        <p><strong>Completed:</strong> {formatDateTime(selectedCompletedJourney.completedAt)}</p>
                                        <p><strong>Completed in:</strong> {selectedCompletedJourney.elapsedCalendarDays} calendar days</p>
                                    </div>
                                </div>

                                <div className="summary-section">
                                    <h3>Practice & Verification Metrics</h3>
                                    <div className="practice-scores-grid">
                                        <div className="score-cell">
                                            <span className="score-lbl">Technical Practice</span>
                                            <span className="score-val">86%</span>
                                        </div>
                                        <div className="score-cell">
                                            <span className="score-lbl">MCQ Quiz</span>
                                            <span className="score-val">82%</span>
                                        </div>
                                        <div className="score-cell">
                                            <span className="score-lbl">Behavioral STAR</span>
                                            <span className="score-val">78%</span>
                                        </div>
                                    </div>
                                </div>

                                {selectedCompletedJourney.dayProgress && selectedCompletedJourney.dayProgress.length > 0 && (
                                    <div className="summary-section">
                                        <h3>Day-by-Day Completion History</h3>
                                        <div className="day-history-list">
                                            {selectedCompletedJourney.dayProgress.map((dp) => (
                                                <div key={dp.day} className="day-history-item">
                                                    <div className="day-top">
                                                        <span className="day-badge">Day {dp.day} ✓</span>
                                                        <span className="day-time">{dp.completedAt ? formatDateTime(dp.completedAt) : 'Completed'}</span>
                                                    </div>
                                                    <p className="day-desc">
                                                        {dp.completedTasks && dp.completedTasks.length > 0
                                                            ? `${dp.completedTasks.length} roadmap tasks verified & completed`
                                                            : 'Completed daily curriculum objectives'}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="modal-footer">
                                <Link
                                    to={`/readiness/${selectedCompletedJourney.reportId}`}
                                    className="modal-action-btn modal-action-btn--primary"
                                >
                                    Check Application Readiness →
                                </Link>
                                <button
                                    type="button"
                                    onClick={() => setSelectedCompletedJourney(null)}
                                    className="modal-action-btn modal-action-btn--secondary"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AppShell>
    );
};

export default Progress;

