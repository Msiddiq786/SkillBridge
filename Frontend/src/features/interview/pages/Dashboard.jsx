import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, Link } from 'react-router';
import { useInterview } from '../hooks/useInterview';
import { useJourney } from '../hooks/useJourney';
import { useAuth } from '../../auth/hooks/useAuth';
import AppShell from '../components/AppShell';
import TargetSwitcher from '../components/TargetSwitcher';
import '../style/dashboard.scss';

const Dashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { loading: reportsLoading, reports, getReports } = useInterview();
    const {
        dashboardData,
        loading: journeyLoading,
        error: journeyError,
        fetchDashboard,
        completeDay,
        updateTasks,
        switchJourney,
        updateApplication
    } = useJourney();

    const [activeTab, setActiveTab] = useState('journey'); // 'journey' | 'blueprints' | 'activity'
    const [actionFeedback, setActionFeedback] = useState(null);
    const [isUpdatingApp, setIsUpdatingApp] = useState(false);
    const [isSwitchingTarget, setIsSwitchingTarget] = useState(false);
    const switchSeqRef = useRef(0);
    const [appForm, setAppForm] = useState({
        status: 'NOT_APPLIED',
        jobUrl: '',
        notes: ''
    });

    useEffect(() => {
        getReports();
        fetchDashboard();
    }, [getReports, fetchDashboard]);

    const primaryJourney = dashboardData?.primaryJourney || null;
    const streaks = dashboardData?.streaks || { currentStreak: 0, longestStreak: 0, isActiveToday: false };
    const timeStats = dashboardData?.timeStats || { todayMinutes: 0, weekMinutes: 0, totalMinutes: 0 };
    const readiness = dashboardData?.readiness || { jdReadiness: 0, interviewPracticeScore: 0, profileScore: 0 };
    const achievements = dashboardData?.achievements || [];
    const recentActivities = dashboardData?.recentActivities || [];
    const otherJourneys = dashboardData?.otherJourneys || [];
    const application = dashboardData?.application || null;

    useEffect(() => {
        if (application) {
            setAppForm({
                status: application.status || 'NOT_APPLIED',
                jobUrl: application.jobUrl || '',
                notes: application.notes || ''
            });
        }
    }, [application]);

    const greeting = useMemo(() => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 17) return 'Good afternoon';
        return 'Good evening';
    }, []);

    const handleCompleteDayOnDashboard = async (dayNumber, taskIndices) => {
        if (!primaryJourney?._id) return;
        try {
            await completeDay(primaryJourney._id, dayNumber, taskIndices);
            setActionFeedback({ type: 'success', message: `🎉 Day ${dayNumber} completed! Your daily streak is active.` });
        } catch (err) {
            console.error("Dashboard complete day error:", err);
            setActionFeedback({ type: 'error', message: 'Could not complete day. Please try again.' });
        }
    };

    const handleToggleTodayTask = async (dayNumber, taskIdx, currentTasks = []) => {
        if (!primaryJourney?._id) return;
        const nextTasks = currentTasks.includes(taskIdx)
            ? currentTasks.filter(i => i !== taskIdx)
            : [...currentTasks, taskIdx];
        try {
            await updateTasks(primaryJourney._id, dayNumber, nextTasks);
        } catch (err) {
            console.error("Task toggle error:", err);
        }
    };

    const handleSwitchJourney = async (journeyId) => {
        if (!journeyId || journeyId === primaryJourney?._id) return;
        switchSeqRef.current += 1;
        const currentSeq = switchSeqRef.current;
        setIsSwitchingTarget(true);

        try {
            const targetItem = otherJourneys.find(j => j._id === journeyId);
            await switchJourney(journeyId);
            if (currentSeq === switchSeqRef.current) {
                setActionFeedback({
                    type: 'success',
                    message: `✓ Switched target to ${targetItem?.targetRole || 'selected position'}.`
                });
            }
        } catch (err) {
            console.error("Switch error:", err);
            if (currentSeq === switchSeqRef.current) {
                setActionFeedback({ type: 'error', message: "Couldn't switch target. Please try again." });
            }
        } finally {
            if (currentSeq === switchSeqRef.current) {
                setIsSwitchingTarget(false);
            }
        }
    };

    const handleSaveApplication = async (e) => {
        e.preventDefault();
        if (!primaryJourney?._id) return;
        setIsUpdatingApp(true);
        try {
            await updateApplication(primaryJourney._id, appForm.status, appForm.jobUrl, appForm.notes);
            setActionFeedback({ type: 'success', message: 'Application status updated!' });
        } catch (err) {
            console.error("Application update error:", err);
            setActionFeedback({ type: 'error', message: 'Could not update application status.' });
        } finally {
            setIsUpdatingApp(false);
        }
    };

    const isLoading = reportsLoading || journeyLoading;

    // Current Day Object from roadmap
    const currentDayNum = primaryJourney?.currentDay || 1;
    const currentDayPlan = primaryJourney?.preparationPlan?.find(p => p.day === currentDayNum) || null;
    const currentDayProgress = primaryJourney?.dayProgress?.find(p => p.day === currentDayNum);
    const completedTasksToday = currentDayProgress?.completedTasks || [];
    const isTodayCompleted = primaryJourney?.completedDays?.includes(currentDayNum) || false;

    // Unlocked achievements
    const unlockedAchievements = achievements.filter(a => a.isUnlocked);

    return (
        <AppShell>
            <div className="dashboard-container">

                {/* ── Dashboard Header ── */}
                <header className="dashboard-header">
                    <div className="header-greeting-block">
                        <span className="greeting-time">{greeting},</span>
                        <h1 className="greeting-name">{user?.username || 'Learner'} 👋</h1>
                        <p className="greeting-sub">
                            {primaryJourney
                                ? `Active Preparation: ${primaryJourney.targetRole} ${primaryJourney.company ? `at ${primaryJourney.company}` : ''}`
                                : 'Track your active learning journey, daily streaks, and interview readiness.'}
                        </p>
                    </div>

                    <div className="header-actions">
                        <Link to="/progress" className="button secondary-button">
                            📊 Full Progress
                        </Link>
                        <Link to="/" className="button primary-button header-cta-btn">
                            🚀 New Prep Plan
                        </Link>
                    </div>
                </header>

                {/* ── Feedback Notification ── */}
                {actionFeedback && (
                    <div className={`profile-alert-banner ${actionFeedback.type === 'success' ? 'profile-alert-banner--success' : 'profile-alert-banner--error'}`}>
                        <span className="alert-icon">{actionFeedback.type === 'success' ? '✓' : '⚠️'}</span>
                        <span>{actionFeedback.message}</span>
                        <button
                            type="button"
                            onClick={() => setActionFeedback(null)}
                            style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontWeight: 'bold' }}
                        >
                            ✕
                        </button>
                    </div>
                )}

                {/* ── Main Dashboard Content States ── */}
                {isLoading && !dashboardData ? (
                    <div className="dashboard-loading-card">
                        <div className="loading-spinner" />
                        <h3>Loading your active learning journey...</h3>
                        <p style={{ color: '#94A3B8', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                            Preparing your daily milestones, streaks, and job readiness score...
                        </p>
                    </div>
                ) : journeyError && !dashboardData ? (
                    <div className="empty-section-card" style={{ maxWidth: '600px', margin: '3rem auto', textAlign: 'center', padding: '2.5rem' }}>
                        <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>⚠️</div>
                        <h3>Couldn't load your active journey</h3>
                        <p style={{ color: '#94A3B8', marginBottom: '1.5rem' }}>
                            {journeyError || 'We encountered an issue retrieving your dashboard progress.'}
                        </p>
                        <button type="button" className="button primary-button" onClick={() => fetchDashboard()}>
                            🔄 Retry
                        </button>
                    </div>
                ) : !primaryJourney ? (
                    /* ══════════════════════════════════════════════════════
                       STATE 1 & 2: NO ACTIVE JOURNEY (NEW USER / VIEWED ONLY)
                       ══════════════════════════════════════════════════════ */
                    <div className="dashboard-no-journey-view">
                        <div className="welcome-hero-card">
                            <div className="welcome-hero-content">
                                <span className="welcome-pill">👋 Welcome to StudentSkillHub</span>
                                <h2>Start Your Real Learning Journey</h2>
                                <p>
                                    Viewing a roadmap doesn't start preparation. When you're ready, start a targeted learning journey to track daily tasks, earn verifiable streaks, and measure true JD readiness.
                                </p>
                                <div className="welcome-cta-row">
                                    <Link to="/" className="button primary-button">
                                        🎯 Create Preparation Plan
                                    </Link>
                                    <Link to="/profile" className="button secondary-button">
                                        👤 Complete Profile
                                    </Link>
                                </div>
                            </div>
                        </div>

                        {/* Viewed Reports / Blueprints */}
                        {reports && reports.length > 0 && (
                            <div className="viewed-reports-section">
                                <div className="section-title-row">
                                    <div>
                                        <h3>Your Generated Preparation Blueprints ({reports.length})</h3>
                                        <p>You have viewed these target roles. Click Start to activate a roadmap.</p>
                                    </div>
                                </div>

                                <div className="viewed-reports-grid">
                                    {reports.map((rep) => (
                                        <div key={rep._id} className="viewed-report-card">
                                            <div className="report-card-top">
                                                <span className="viewed-badge">👁️ Viewed • Not Started</span>
                                                <span className="rep-score-pill">{rep.matchScore || 0}% Match</span>
                                            </div>
                                            <h4 className="rep-title">{rep.title}</h4>
                                            <p className="rep-company">🏢 {rep.company || 'Target Company'}</p>
                                            <div className="rep-actions-row">
                                                <Link to={`/interview/${rep._id}`} className="button secondary-button btn-sm">
                                                    🗺️ View Roadmap
                                                </Link>
                                                <Link to={`/interview/${rep._id}`} className="button primary-button btn-sm">
                                                    🚀 Start Journey
                                                </Link>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    /* ══════════════════════════════════════════════════════
                       STATE 3 & 4: ACTIVE LEARNING JOURNEY & PROGRESS
                       ══════════════════════════════════════════════════════ */
                    <div className="dashboard-active-view">

                        {/* 1. HERO ACTIVE / COMPLETED JOURNEY CARD */}
                        <div className={`hero-journey-card ${primaryJourney.status === 'COMPLETED' ? 'hero-journey-card--completed' : ''}`}>
                            <div className="hero-journey-header">
                                <div className="journey-identity">
                                    <span className={`journey-status-pill ${primaryJourney.status === 'COMPLETED' ? 'journey-status-pill--completed' : ''}`}>
                                        {primaryJourney.status === 'COMPLETED' ? '🎉 JOURNEY COMPLETED' : '🔥 ACTIVE PREPARATION'}
                                    </span>
                                    <h2 className="journey-role">{primaryJourney.targetRole}</h2>
                                    {primaryJourney.company && (
                                        <p className="journey-company">🏢 {primaryJourney.company}</p>
                                    )}
                                </div>

                                {otherJourneys && otherJourneys.length > 0 && (
                                    <TargetSwitcher
                                        primaryJourney={primaryJourney}
                                        otherJourneys={otherJourneys}
                                        onSwitchJourney={handleSwitchJourney}
                                        isSwitching={isSwitchingTarget}
                                    />
                                )}
                            </div>

                            {/* Progress bar */}
                            <div className="journey-progress-block">
                                <div className="progress-labels">
                                    <span className="progress-step-text">
                                        {primaryJourney.status === 'COMPLETED'
                                            ? `Completed: ${primaryJourney.roadmapDays} of ${primaryJourney.roadmapDays} Days`
                                            : `Day ${currentDayNum} of ${primaryJourney.roadmapDays}`
                                        }
                                    </span>
                                    <span className="progress-pct-text">
                                        {primaryJourney.overallProgress}% Overall Progress
                                    </span>
                                </div>
                                <div className="progress-bar-track">
                                    <div
                                        className={`progress-bar-fill ${primaryJourney.status === 'COMPLETED' ? 'progress-bar-fill--completed' : ''}`}
                                        style={{ width: `${primaryJourney.overallProgress}%` }}
                                    />
                                </div>
                            </div>

                            {/* Current Focus & CTA */}
                            <div className="journey-focus-action-row">
                                <div className="focus-info">
                                    <span className="focus-label">
                                        {primaryJourney.status === 'COMPLETED' ? 'STATUS SUMMARY:' : 'CURRENT FOCUS:'}
                                    </span>
                                    <h4 className="focus-title">
                                        {primaryJourney.status === 'COMPLETED'
                                            ? 'All curriculum days completed! You have finished your roadmap.'
                                            : (primaryJourney.currentFocus || currentDayPlan?.focus || `Day ${currentDayNum} Competencies`)
                                        }
                                    </h4>
                                    {primaryJourney.status !== 'COMPLETED' && currentDayPlan?.whyThisMatters && (
                                        <p className="focus-why">💡 {currentDayPlan.whyThisMatters}</p>
                                    )}
                                </div>

                                <div className="focus-buttons">
                                    {primaryJourney.status === 'COMPLETED' ? (
                                        <>
                                            <Link to="/progress" className="button primary-button">
                                                🎉 View Completion Summary
                                            </Link>
                                            <Link to={`/readiness/${primaryJourney.reportId}`} className="button secondary-button">
                                                🎯 Check Readiness
                                            </Link>
                                        </>
                                    ) : (
                                        <Link to={`/interview/${primaryJourney.reportId}`} className="button primary-button">
                                            📖 Continue Roadmap
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* 2. FOUR REAL METRICS GRID */}
                        <div className="dashboard-metrics-grid">
                            {/* JD Readiness */}
                            <Link to={primaryJourney?.reportId ? `/readiness/${primaryJourney.reportId}` : '/readiness'} className="metric-card metric-card--clickable" style={{ textDecoration: 'none' }}>
                                <div className="metric-header">
                                    <span className="metric-icon">🎯</span>
                                    <span className="metric-title">JD Readiness</span>
                                </div>
                                <div className="metric-value-row">
                                    <span className="metric-number">{readiness.jdReadiness}%</span>
                                    <span className={`readiness-pill ${readiness.jdReadiness >= 75 ? 'readiness-pill--ready' : 'readiness-pill--progress'}`}>
                                        {readiness.jdReadiness >= 75 ? 'Ready to Apply' : 'In Preparation'}
                                    </span>
                                </div>
                                <p className="metric-footer-note">View 8-point evidence breakdown →</p>
                            </Link>

                            {/* Interview Practice Score */}
                            <div className="metric-card">
                                <div className="metric-header">
                                    <span className="metric-icon">🎙️</span>
                                    <span className="metric-title">Practice Score</span>
                                </div>
                                <div className="metric-value-row">
                                    <span className="metric-number">
                                        {readiness.interviewPracticeScore > 0 ? `${readiness.interviewPracticeScore}%` : '—'}
                                    </span>
                                    <span className="metric-subtext">
                                        {readiness.interviewPracticeScore > 0 ? 'Mock sessions avg' : 'No practice yet'}
                                    </span>
                                </div>
                                <p className="metric-footer-note">Technical & behavioral evaluations</p>
                            </div>

                            {/* Profile Completion */}
                            <div className="metric-card">
                                <div className="metric-header">
                                    <span className="metric-icon">👤</span>
                                    <span className="metric-title">Profile Strength</span>
                                </div>
                                <div className="metric-value-row">
                                    <span className="metric-number">{readiness.profileScore}%</span>
                                    <span className="metric-subtext">Verified Evidence</span>
                                </div>
                                <p className="metric-footer-note">Projects, experience & skills</p>
                            </div>

                            {/* Active Streak */}
                            <div className="metric-card metric-card--streak">
                                <div className="metric-header">
                                    <span className="metric-icon">🔥</span>
                                    <span className="metric-title">Learning Streak</span>
                                </div>
                                <div className="metric-value-row">
                                    <span className="metric-number">{streaks.currentStreak} Days</span>
                                    <span className={`streak-badge ${streaks.isActiveToday ? 'streak-badge--today' : 'streak-badge--due'}`}>
                                        {streaks.isActiveToday ? '✓ Active Today' : '⏳ Action Needed'}
                                    </span>
                                </div>
                                <p className="metric-footer-note">
                                    Longest: {streaks.longestStreak} days · Active learning only
                                </p>
                            </div>
                        </div>

                        {/* 3. TWO-COLUMN MAIN WORKSPACE */}
                        <div className="dashboard-workspace-grid">

                            {/* Left Column: Today's Action Plan */}
                            <div className="workspace-left">
                                <div className="dashboard-card today-plan-card">
                                    <div className="dashboard-card-header">
                                        <div className="header-title-group">
                                            <span className="card-icon">📋</span>
                                            <h3>Today's Learning Plan</h3>
                                        </div>
                                        <span className="day-tag-pill">Day {currentDayNum}</span>
                                    </div>

                                    {currentDayPlan ? (
                                        <div className="today-tasks-container">
                                            <div className="today-focus-banner">
                                                <h4>{currentDayPlan.focus}</h4>
                                                {currentDayPlan.estimatedStudyTime && (
                                                    <span className="est-time">⏱ {currentDayPlan.estimatedStudyTime}</span>
                                                )}
                                            </div>

                                            {currentDayPlan.tasks?.length > 0 ? (
                                                <div className="today-checklist">
                                                    <span className="checklist-heading">Action Checklist:</span>
                                                    <ul className="tasks-checklist">
                                                        {currentDayPlan.tasks.map((task, idx) => {
                                                            const isChecked = completedTasksToday.includes(idx);
                                                            return (
                                                                <li
                                                                    key={idx}
                                                                    className={`task-item ${isChecked ? 'task-item--done' : ''}`}
                                                                    onClick={() => handleToggleTodayTask(currentDayNum, idx, completedTasksToday)}
                                                                >
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={isChecked}
                                                                        onChange={() => {}}
                                                                        className="task-checkbox"
                                                                    />
                                                                    <span className="task-text">{task}</span>
                                                                </li>
                                                            );
                                                        })}
                                                    </ul>
                                                </div>
                                            ) : (
                                                <p className="no-tasks-text">Review focus concepts and practice mock questions.</p>
                                            )}

                                            {/* Outcome */}
                                            {currentDayPlan.expectedOutcome && (
                                                <div className="outcome-box">
                                                    <span className="outcome-label">Expected Competency:</span>
                                                    <p>{currentDayPlan.expectedOutcome}</p>
                                                </div>
                                            )}

                                            {/* Action Button */}
                                            <div className="today-action-footer">
                                                {isTodayCompleted ? (
                                                    <div className="day-done-banner">
                                                        <span>✓ Day {currentDayNum} Marked Complete</span>
                                                    </div>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        className="button primary-button btn-complete-day-lg"
                                                        onClick={() => handleCompleteDayOnDashboard(currentDayNum, completedTasksToday)}
                                                    >
                                                        ✓ Mark Day {currentDayNum} Complete
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="empty-day-state">
                                            <p>No specific roadmap day loaded. Open the roadmap to continue.</p>
                                            <Link to={`/interview/${primaryJourney.reportId}`} className="button secondary-button">
                                                Open Roadmap
                                            </Link>
                                        </div>
                                    )}
                                </div>

                                {/* Active Time Stats */}
                                <div className="dashboard-card time-tracking-card">
                                    <div className="dashboard-card-header">
                                        <div className="header-title-group">
                                            <span className="card-icon">⏱️</span>
                                            <h3>Active Learning Time</h3>
                                        </div>
                                    </div>

                                    <div className="time-stats-grid">
                                        <div className="time-tile">
                                            <span className="time-val">{timeStats.todayMinutes}m</span>
                                            <span className="time-lbl">Today</span>
                                        </div>
                                        <div className="time-tile">
                                            <span className="time-val">
                                                {Math.floor(timeStats.weekMinutes / 60)}h {timeStats.weekMinutes % 60}m
                                            </span>
                                            <span className="time-lbl">This Week</span>
                                        </div>
                                        <div className="time-tile">
                                            <span className="time-val">
                                                {Math.floor(timeStats.totalMinutes / 60)}h {timeStats.totalMinutes % 60}m
                                            </span>
                                            <span className="time-lbl">Total Time</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right Column: Readiness, Application & Achievements */}
                            <div className="workspace-right">

                                {/* Job Application Tracking & Readiness */}
                                <div className="dashboard-card application-status-card">
                                    <div className="dashboard-card-header">
                                        <div className="header-title-group">
                                            <span className="card-icon">💼</span>
                                            <h3>Job Application Tracker</h3>
                                        </div>
                                        <Link to="/applications" className="link-view-all">
                                            Open Tracker →
                                        </Link>
                                    </div>

                                    <form onSubmit={handleSaveApplication} className="app-tracker-form">
                                        <div className="app-form-field">
                                            <label htmlFor="app-status-select">Status:</label>
                                            <select
                                                id="app-status-select"
                                                value={appForm.status}
                                                onChange={(e) => setAppForm(f => ({ ...f, status: e.target.value }))}
                                                className="app-select"
                                            >
                                                <option value="NOT_APPLIED">Not Applied Yet</option>
                                                <option value="PREPARING">Preparing</option>
                                                <option value="READY_TO_APPLY">Ready to Apply</option>
                                                <option value="APPLIED">Applied</option>
                                                <option value="INTERVIEW_SCHEDULED">Interview Scheduled</option>
                                                <option value="INTERVIEW_COMPLETED">Interview Completed</option>
                                                <option value="OFFER">Offer Received 🎉</option>
                                                <option value="REJECTED">Archived / Rejected</option>
                                            </select>
                                        </div>

                                        <div className="app-form-field">
                                            <label htmlFor="app-job-url">Job Listing / Application URL:</label>
                                            <input
                                                id="app-job-url"
                                                type="url"
                                                placeholder="https://company.com/careers/job-123"
                                                value={appForm.jobUrl}
                                                onChange={(e) => setAppForm(f => ({ ...f, jobUrl: e.target.value }))}
                                                className="app-input"
                                            />
                                        </div>

                                        <div className="app-form-field">
                                            <label htmlFor="app-notes">Application Notes:</label>
                                            <textarea
                                                id="app-notes"
                                                rows="2"
                                                placeholder="Recruiter email, interview date, salary notes..."
                                                value={appForm.notes}
                                                onChange={(e) => setAppForm(f => ({ ...f, notes: e.target.value }))}
                                                className="app-textarea"
                                            />
                                        </div>

                                        <div className="app-form-actions">
                                            {appForm.jobUrl && (
                                                <a href={appForm.jobUrl} target="_blank" rel="noopener noreferrer" className="button secondary-button btn-sm">
                                                    🔗 Open Job Link
                                                </a>
                                            )}
                                            <button type="submit" className="button primary-button btn-sm" disabled={isUpdatingApp}>
                                                {isUpdatingApp ? 'Saving...' : '💾 Save Status'}
                                            </button>
                                        </div>
                                    </form>
                                </div>

                                {/* Recent Achievements */}
                                <div className="dashboard-card achievements-card">
                                    <div className="dashboard-card-header">
                                        <div className="header-title-group">
                                            <span className="card-icon">🏆</span>
                                            <h3>Achievements ({unlockedAchievements.length})</h3>
                                        </div>
                                        <Link to="/achievements" className="link-view-all">
                                            View All Milestones →
                                        </Link>
                                    </div>

                                    {unlockedAchievements.length > 0 ? (
                                        <div className="achievements-list">
                                            {unlockedAchievements.slice(0, 4).map((ach) => (
                                                <div key={ach.id} className="achievement-badge-row">
                                                    <span className="ach-icon">{ach.icon}</span>
                                                    <div className="ach-info">
                                                        <h5 className="ach-title">{ach.title}</h5>
                                                        <p className="ach-desc">{ach.description}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="empty-achievements-text">
                                            Complete roadmap days and practice sessions to unlock achievements.
                                        </p>
                                    )}
                                </div>

                                {/* Recent Learning Activity Feed */}
                                <div className="dashboard-card activity-feed-card">
                                    <div className="dashboard-card-header">
                                        <div className="header-title-group">
                                            <span className="card-icon">⚡</span>
                                            <h3>Recent Learning Log</h3>
                                        </div>
                                    </div>

                                    {recentActivities.length > 0 ? (
                                        <div className="activity-feed-list">
                                            {recentActivities.slice(0, 5).map((act) => (
                                                <div key={act._id} className="activity-feed-item">
                                                    <div className="act-dot" />
                                                    <div className="act-details">
                                                        <span className="act-title">{act.title}</span>
                                                        <span className="act-date">{act.dateString}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="empty-activity-text">No recent learning activity recorded.</p>
                                    )}
                                </div>

                            </div>
                        </div>

                    </div>
                )}

            </div>
        </AppShell>
    );
};

export default Dashboard;
