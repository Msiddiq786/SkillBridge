import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router';
import { useInterview } from '../hooks/useInterview';
import { usePractice } from '../hooks/usePractice';
import AppShell from '../components/AppShell';
import '../style/practice.scss';

const buildPracticeModes = (selectedReport) => {
    const cfg = selectedReport?.planConfig;
    const techCount = cfg?.technicalCount ?? (selectedReport?.technicalQuestions?.length || 20);
    const mcqCount = cfg?.mcqCount ?? (selectedReport?.mcqQuestions?.length || 15);
    const behCount = cfg?.behavioralCount ?? (selectedReport?.behavioralQuestions?.length || 10);
    const mixedTotal = (cfg?.includeTechnical !== false ? techCount : 0) +
                       (cfg?.includeMCQ !== false ? mcqCount : 0) +
                       (cfg?.includeBehavioral !== false ? behCount : 0);

    return [
        {
            id: 'technical',
            title: 'Voice Technical Practice',
            icon: '🎙️',
            questionsCount: techCount,
            estimatedTime: `~${Math.max(10, Math.round(techCount * 1.2))} min`,
            description: 'Speak your answers out loud. Practice articulating complex technical concepts naturally with instant AI scoring and progressive follow-ups.',
            badge: 'Recommended',
            disabled: cfg?.includeTechnical === false
        },
        {
            id: 'behavioral',
            title: 'Behavioral STAR Coaching',
            icon: '🎯',
            questionsCount: behCount,
            estimatedTime: `~${Math.max(10, Math.round(behCount * 1.5))} min`,
            description: 'Master conversational storytelling with the STAR method. Speak your stories and receive structured evaluation on Situation, Task, Action, and Result.',
            badge: 'STAR Voice',
            disabled: cfg?.includeBehavioral === false
        },
        {
            id: 'mcq',
            title: 'MCQ Quiz Simulator',
            icon: '📝',
            questionsCount: mcqCount,
            estimatedTime: `~${Math.max(5, Math.round(mcqCount * 0.7))} min`,
            description: 'Fast-paced multiple choice quiz with instant correctness feedback, timer tracking, and topic accuracy analytics.',
            badge: 'Quiz Mode',
            disabled: cfg?.includeMCQ === false
        },
        {
            id: 'mixed',
            title: 'Full Mock Interview',
            icon: '🚀',
            questionsCount: mixedTotal,
            estimatedTime: `~${Math.max(20, Math.round(mixedTotal * 1.2))} min`,
            description: 'Complete realistic mock interview simulation across Technical (Voice), MCQ, and Behavioral (Voice) in a single session.',
            badge: 'Full Prep',
            disabled: mixedTotal === 0
        }
    ];
};

const PracticeHub = () => {
    const navigate = useNavigate();
    const { reports, getReports } = useInterview();
    const { startSession, getStats, stats, loading: startingSession } = usePractice();

    const [isLoading, setIsLoading] = useState(true);
    const [fetchError, setFetchError] = useState(null);
    const [selectedReportId, setSelectedReportId] = useState('');
    const [selectedMode, setSelectedMode] = useState('technical');

    const loadData = useCallback(async () => {
        setIsLoading(true);
        setFetchError(null);
        try {
            const [fetchedReports] = await Promise.all([
                getReports(),
                getStats().catch(() => null)
            ]);

            if (fetchedReports && fetchedReports.length > 0) {
                setSelectedReportId(prev => prev || fetchedReports[0]._id);
            }
        } catch (err) {
            console.error("PracticeHub load error:", err);
            setFetchError("Unable to load your interview plans.");
        } finally {
            setIsLoading(false);
        }
    }, [getReports, getStats]);

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        if (reports && reports.length > 0 && !selectedReportId) {
            setSelectedReportId(reports[0]._id);
        }
    }, [reports, selectedReportId]);

    const handleStart = async (overrideMode) => {
        const modeToStart = overrideMode || selectedMode;
        if (!selectedReportId) return;
        try {
            const data = await startSession({
                interviewReportId: selectedReportId,
                mode: modeToStart
            });
            if (data?.session?._id) {
                navigate(`/practice/session/${data.session._id}`);
            }
        } catch (err) {
            console.error("Start session error:", err);
        }
    };

    const activeSession = stats?.recentSessions?.find(s => s.status === 'IN_PROGRESS');
    const recentCompleted = stats?.recentSessions?.filter(s => s.status === 'COMPLETED') || [];

    const getActiveSessionRequiredCount = (session) => {
        const cfg = session?.interviewReport?.planConfig;
        const techCount = cfg?.technicalCount ?? 20;
        const mcqCount = cfg?.mcqCount ?? 15;
        const behCount = cfg?.behavioralCount ?? 10;
        const mixedTotal = (cfg?.includeTechnical !== false ? techCount : 0) +
                           (cfg?.includeMCQ !== false ? mcqCount : 0) +
                           (cfg?.includeBehavioral !== false ? behCount : 0);

        if (session.mode === 'technical') return techCount;
        if (session.mode === 'mcq') return mcqCount;
        if (session.mode === 'behavioral') return behCount;
        return mixedTotal;
    };

    // ── Loading Skeleton ──
    if (isLoading && (!reports || reports.length === 0)) {
        return (
            <AppShell activeNavId="practice">
                <div className="practice-hub-page">
                    <div className="loading-screen">
                        <div className="loading-spinner" />
                        <h2>Loading interactive practice simulator...</h2>
                    </div>
                </div>
            </AppShell>
        );
    }

    // ── Error State ──
    if (fetchError && (!reports || reports.length === 0)) {
        return (
            <AppShell activeNavId="practice">
                <div className="practice-hub-page">
                    <div className="practice-error-card">
                        <span className="error-icon">⚠️</span>
                        <h2>Unable to load your interview plans</h2>
                        <p>We encountered an issue fetching your plans. Please check your connection and try again.</p>
                        <button type="button" className="button primary-button" onClick={loadData}>
                            🔄 Retry
                        </button>
                    </div>
                </div>
            </AppShell>
        );
    }

    // ── Brand-New User Empty State (No Reports) ──
    const hasReports = reports && reports.length > 0;

    if (!hasReports) {
        return (
            <AppShell activeNavId="practice">
                <div className="practice-hub-page">
                    <header className="practice-hub-header">
                        <div className="practice-hero-text">
                            <span className="practice-badge">CONVERSATIONAL PRACTICE SIMULATOR</span>
                            <h1>Interview <span className="highlight">Practice Hub</span></h1>
                            <p className="practice-hero-sub">Read · Think · Speak · Get Feedback · Improve</p>
                            <p className="practice-hero-desc">
                                Create an interview plan from your resume and job description, then practice speaking out loud with real-time AI scoring and STAR behavioral feedback.
                            </p>
                        </div>
                    </header>

                    <div className="practice-empty-wrapper">
                        <div className="practice-empty-card">
                            <div className="empty-icon-badge">🎙️</div>
                            <h2>No Practice Plan Yet</h2>
                            <p className="empty-lead-text">
                                Create your first interview plan to unlock personalized voice and quick practice sessions.
                            </p>

                            <div className="empty-benefits-grid">
                                <div className="benefit-item">
                                    <span className="benefit-check">✓</span>
                                    <span className="benefit-label">20 Technical Voice Questions</span>
                                </div>
                                <div className="benefit-item">
                                    <span className="benefit-check">✓</span>
                                    <span className="benefit-label">15 MCQ Practice Quiz</span>
                                </div>
                                <div className="benefit-item">
                                    <span className="benefit-check">✓</span>
                                    <span className="benefit-label">10 STAR Behavioral Coaching</span>
                                </div>
                                <div className="benefit-item">
                                    <span className="benefit-check">✓</span>
                                    <span className="benefit-label">AI Speech & Answer Scoring</span>
                                </div>
                                <div className="benefit-item">
                                    <span className="benefit-check">✓</span>
                                    <span className="benefit-label">Progressive Follow-Up Questions</span>
                                </div>
                                <div className="benefit-item">
                                    <span className="benefit-check">✓</span>
                                    <span className="benefit-label">15-Day Preparation Roadmap</span>
                                </div>
                            </div>

                            <div className="empty-cta-group">
                                <Link to="/" className="button primary-button empty-primary-btn">
                                    Create Your First Interview Plan →
                                </Link>
                                <Link to="/dashboard" className="empty-secondary-link">
                                    Back to Dashboard
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </AppShell>
        );
    }

    // ── Existing User State ──
    const selectedReport = reports.find(r => r._id === selectedReportId) || reports[0];

    return (
        <AppShell activeNavId="practice">
            <div className="practice-hub-page">
                <header className="practice-hub-header">
                    <div className="practice-hero-text">
                        <span className="practice-badge">CONVERSATIONAL PRACTICE SIMULATOR</span>
                        <h1>Interview <span className="highlight">Practice Hub</span></h1>
                        <p className="practice-hero-sub">Read · Think · Speak · Get Feedback · Improve</p>
                    </div>
                </header>

                <div className="practice-hub-content">

                    {/* Active In-Progress Session (if any) */}
                    {activeSession && (
                        <section className="active-session-card">
                            <div className="active-session-content">
                                <div className="active-badge-row">
                                    <span className="live-pulse" />
                                    <span className="active-title-label">CONTINUE YOUR PRACTICE</span>
                                </div>
                                <h3>{activeSession.interviewReport?.title || "Active Practice Session"}</h3>
                                <p className="active-progress-text">
                                    <strong>{activeSession.answers?.length || 0} / {getActiveSessionRequiredCount(activeSession)}</strong> questions completed in {activeSession.mode?.toUpperCase()} mode
                                </p>
                            </div>
                            <div className="active-session-buttons">
                                <Link
                                    to={`/practice/session/${activeSession._id}`}
                                    className="button primary-button active-continue-btn"
                                >
                                    Continue Practice →
                                </Link>
                            </div>
                        </section>
                    )}

                    {/* Step 1: Report Selector */}
                    <section className="hub-section">
                        <div className="section-title-wrap">
                            <span className="step-num">1</span>
                            <div>
                                <h2>Choose Target Role / Interview Report</h2>
                                <p>Select which job application and tailored questions you want to practice with.</p>
                            </div>
                        </div>

                        <div className="report-select-grid">
                            {reports.map(rep => {
                                const isSelected = rep._id === (selectedReportId || reports[0]._id);
                                const title = rep.selectedTrackTitle || rep.title || "Interview Track";
                                const score = rep.matchScore || 70;

                                return (
                                    <div
                                        key={rep._id}
                                        className={`report-select-card ${isSelected ? 'report-select-card--active' : ''}`}
                                        onClick={() => setSelectedReportId(rep._id)}
                                    >
                                        <div className="card-top">
                                            <h3>{title}</h3>
                                            <span className={`score-badge ${score >= 80 ? 'score-badge--high' : 'score-badge--mid'}`}>
                                                {score}% Match
                                            </span>
                                        </div>
                                        {rep.company && <p className="rep-company">{rep.company}</p>}

                                        <div className="rep-breakdown-pills">
                                            <span className="pill">{rep.planConfig?.technicalCount ?? 20} Technical</span>
                                            <span className="pill">{rep.planConfig?.mcqCount ?? 15} MCQ</span>
                                            <span className="pill">{rep.planConfig?.behavioralCount ?? 10} Behavioral</span>
                                        </div>

                                        <div className="card-footer">
                                            <span className="rep-date">Created {new Date(rep.createdAt).toLocaleDateString()}</span>
                                            <span className={`select-indicator ${isSelected ? 'select-indicator--active' : ''}`}>
                                                {isSelected ? '✓ Selected' : 'Select'}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>

                    {/* Step 2: Practice Mode Selector */}
                    <section className="hub-section">
                        <div className="section-title-wrap">
                            <span className="step-num">2</span>
                            <div>
                                <h2>Choose Practice Mode</h2>
                                <p>Practice speaking out loud, complete rapid flashcards, or simulate the full interview.</p>
                            </div>
                        </div>

                        <div className="mode-select-grid">
                            {buildPracticeModes(selectedReport).map(m => {
                                const isSelected = selectedMode === m.id;

                                return (
                                    <div
                                        key={m.id}
                                        className={`mode-card ${isSelected ? 'mode-card--active' : ''} ${m.disabled ? 'mode-card--disabled' : ''}`}
                                        onClick={() => !m.disabled && setSelectedMode(m.id)}
                                        style={m.disabled ? { opacity: 0.5, pointerEvents: 'none' } : {}}
                                    >
                                        <div className="mode-header">
                                            <span className="mode-icon">{m.icon}</span>
                                            <span className="mode-badge">{m.disabled ? 'Disabled in Plan' : m.badge}</span>
                                        </div>
                                        <h3>{m.title}</h3>
                                        <div className="mode-meta">
                                            <span><strong>{m.questionsCount}</strong> Questions</span>
                                            <span>•</span>
                                            <span><strong>{m.estimatedTime}</strong></span>
                                        </div>
                                        <p className="mode-desc">{m.description}</p>
                                        <div className="mode-select-radio">
                                            <span className={`radio-dot ${isSelected ? 'radio-dot--checked' : ''}`} />
                                            <span>{m.disabled ? 'Not in Plan' : isSelected ? 'Selected' : 'Select Mode'}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>

                    {/* Start Bar */}
                    <div className="practice-start-bar">
                        <div className="start-bar-summary">
                            <span>Target Role: <strong>{selectedReport?.title || "Selected Track"}</strong></span>
                            {(() => {
                                const activeModeObj = buildPracticeModes(selectedReport).find(m => m.id === selectedMode);
                                return (
                                    <span className="mode-preview-tag">
                                        {activeModeObj?.title || 'Practice Mode'} ({activeModeObj?.questionsCount || 0} Questions)
                                    </span>
                                );
                            })()}
                        </div>
                        <button
                            type="button"
                            className="button primary-button start-practice-btn"
                            onClick={() => handleStart()}
                            disabled={startingSession}
                        >
                            {startingSession ? 'Initializing Session...' : 'Start Practice Session →'}
                        </button>
                    </div>

                    {/* Recent Practice History */}
                    {recentCompleted.length > 0 && (
                        <section className="hub-section recent-practice-section">
                            <div className="section-title-wrap">
                                <div>
                                    <h3 style={{ fontSize: '1rem', color: '#94A3B8', margin: 0 }}>Recent Practice History</h3>
                                </div>
                            </div>
                            <div className="recent-sessions-list">
                                {recentCompleted.slice(0, 3).map(s => (
                                    <div key={s._id} className="recent-session-item">
                                        <div className="recent-session-left">
                                            <span className="mode-icon-small">
                                                {s.mode === 'technical' ? '🎙️' : s.mode === 'mcq' ? '📝' : s.mode === 'behavioral' ? '🎯' : '🚀'}
                                            </span>
                                            <div>
                                                <h4>{s.interviewReport?.title || "Interview Practice"}</h4>
                                                <span className="recent-date">
                                                    {s.mode?.toUpperCase()} • Completed {new Date(s.completedAt || s.updatedAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="recent-session-right">
                                            {s.overallScore > 0 && (
                                                <span className="score-tag">{s.overallScore}% Score</span>
                                            )}
                                            <Link to={`/practice/results/${s._id}`} className="view-results-btn">
                                                View Results →
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                </div>
            </div>
        </AppShell>
    );
};

export default PracticeHub;
