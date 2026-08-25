import React, { useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { usePractice } from '../hooks/usePractice';
import AppShell from '../components/AppShell';
import '../style/practice.scss';

const PracticeResults = () => {
    const { sessionId } = useParams();
    const navigate = useNavigate();

    const {
        session,
        report,
        results,
        loading,
        getResults,
        error
    } = usePractice();

    useEffect(() => {
        if (sessionId) {
            getResults(sessionId);
        }
    }, [sessionId, getResults]);

    const totalSeconds = session?.timeSpentSeconds || 0;
    const formattedTime = useMemo(() => {
        const mins = Math.floor(totalSeconds / 60);
        const secs = totalSeconds % 60;
        if (mins === 0) return `${secs}s`;
        return `${mins}m ${secs}s`;
    }, [totalSeconds]);

    const { requiredCount, attemptedCount, remainingCount, isCompleted } = useMemo(() => {
        if (!session) return { requiredCount: 0, attemptedCount: 0, remainingCount: 0, isCompleted: false };
        const cfg = report?.planConfig;
        const techCount = cfg?.technicalCount ?? (report?.technicalQuestions?.length || 20);
        const mcqCount = cfg?.mcqCount ?? (report?.mcqQuestions?.length || 15);
        const behCount = cfg?.behavioralCount ?? (report?.behavioralQuestions?.length || 10);
        const mixedTotal = (cfg?.includeTechnical !== false ? techCount : 0) +
                           (cfg?.includeMCQ !== false ? mcqCount : 0) +
                           (cfg?.includeBehavioral !== false ? behCount : 0);

        const req = session.mode === 'technical' ? techCount :
                    session.mode === 'mcq' ? mcqCount :
                    session.mode === 'behavioral' ? behCount :
                    session.mode === 'mixed' ? mixedTotal : 0;

        const attemptedSet = new Set();
        if (Array.isArray(session.answers)) {
            session.answers.forEach(a => {
                const hasAttempt = a.isSkipped === true ||
                    (typeof a.confidence === 'string' && a.confidence.length > 0) ||
                    (typeof a.selectedOption === 'string' && a.selectedOption.length > 0) ||
                    (typeof a.userAnswer === 'string' && a.userAnswer.trim().length > 0) ||
                    (typeof a.score === 'number');
                if (hasAttempt) {
                    attemptedSet.add(`${a.questionType}-${a.questionIndex}`);
                }
            });
        }
        const att = attemptedSet.size;
        return {
            requiredCount: req,
            attemptedCount: att,
            remainingCount: Math.max(0, req - att),
            isCompleted: session.status === 'COMPLETED'
        };
    }, [session, report]);

    const behavioralAnswers = useMemo(() => {
        return session?.answers?.filter(a => a.questionType === 'behavioral') || [];
    }, [session?.answers]);

    // STAR competency averages if behavioral questions had feedback
    const starAverages = useMemo(() => {
        const feedbacksWithStar = behavioralAnswers.filter(a => a.feedback?.starCoverage);
        if (feedbacksWithStar.length === 0) return null;

        const totals = { situation: 0, task: 0, action: 0, result: 0 };
        feedbacksWithStar.forEach(a => {
            const sc = a.feedback.starCoverage;
            totals.situation += sc.situation || 0;
            totals.task += sc.task || 0;
            totals.action += sc.action || 0;
            totals.result += sc.result || 0;
        });

        const len = feedbacksWithStar.length;
        return {
            situation: Math.round(totals.situation / len),
            task: Math.round(totals.task / len),
            action: Math.round(totals.action / len),
            result: Math.round(totals.result / len)
        };
    }, [behavioralAnswers]);

    if (error) {
        return (
            <AppShell activeNavId="practice">
                <div className="practice-results-page">
                    <div className="practice-error-card">
                        <span className="error-icon">⚠️</span>
                        <h2>Error Loading Practice Results</h2>
                        <p>{error}</p>
                        <Link to="/practice" className="button primary-button">
                            Back to Practice Hub
                        </Link>
                    </div>
                </div>
            </AppShell>
        );
    }

    if (loading || !results || !session) {
        return (
            <AppShell activeNavId="practice">
                <div className="practice-results-page">
                    <div className="loading-screen">
                        <div className="loading-spinner" />
                        <h2>Computing Practice Analytics & Readiness...</h2>
                    </div>
                </div>
            </AppShell>
        );
    }

    const overallScore = results.overallScore ?? session.overallScore ?? 0;
    const scoreColorClass = overallScore >= 80 ? 'score-ring--high' : overallScore >= 60 ? 'score-ring--mid' : 'score-ring--low';

    const technicalAnswers = session.answers?.filter(a => a.questionType === 'technical') || [];
    const mcqAnswers = session.answers?.filter(a => a.questionType === 'mcq') || [];

    const calculateAvg = (answers) => {
        const attempted = answers.filter(a => typeof a.score === 'number');
        if (attempted.length === 0) return null;
        const total = attempted.reduce((acc, a) => acc + a.score, 0);
        return Math.round(total / attempted.length);
    };

    const techScore = calculateAvg(technicalAnswers);
    const mcqScore = calculateAvg(mcqAnswers);
    const behScore = calculateAvg(behavioralAnswers);

    // Spoken answers count (answers with user text / voice transcript)
    const spokenAnswersCount = (session.answers || []).filter(a => typeof a.userAnswer === 'string' && a.userAnswer.trim().length > 0).length;

    const weakTopics = results.weakTopics || session.weakTopics || [];
    const topicPerformance = results.topicPerformance || session.topicPerformance || [];
    const strongTopics = topicPerformance.filter(t => t.score >= 70);

    return (
        <AppShell activeNavId="practice">
            <div className="practice-results-page">
                <header className="results-header">
                    <div className="results-nav">
                        <Link to="/dashboard" className="hub-back-link">← Dashboard</Link>
                        <span className="hub-divider">|</span>
                        <Link to={`/interview/${session.interviewReport}`} className="hub-back-link">View Full Report</Link>
                    </div>
                    <div className="results-hero-text">
                        <span className={`practice-badge ${isCompleted ? '' : 'practice-badge--in-progress'}`}>
                            {isCompleted ? 'PRACTICE SESSION COMPLETE' : 'PRACTICE IN PROGRESS'}
                        </span>
                        <h1>
                            Interview <span className="highlight">
                                {isCompleted ? 'Practice Results' : 'Practice Progress'}
                            </span>
                        </h1>
                        <p>
                            {session.selectedTrackTitle || report?.title || "Target Role"} • {session.mode?.toUpperCase()} MODE
                            {!isCompleted && ` (${attemptedCount} / ${requiredCount} attempted)`}
                        </p>
                    </div>
                </header>

                <div className="results-content-grid">

                    {/* Incomplete Banner */}
                    {!isCompleted && (
                        <div className="in-progress-banner">
                            <div className="in-progress-text">
                                <h3>Session In Progress ({attemptedCount} / {requiredCount} questions attempted)</h3>
                                <p>You have {remainingCount} questions remaining before final readiness calculation.</p>
                            </div>
                            <button
                                type="button"
                                className="button primary-button"
                                onClick={() => navigate(`/practice/session/${session._id}`)}
                            >
                                Continue Practice →
                            </button>
                        </div>
                    )}

                    {/* 1. Overall Score Hero Card */}
                    <div className="results-hero-card">
                        <div className="hero-score-column">
                            <div className={`results-score-ring ${scoreColorClass}`}>
                                <span className="ring-score-value">{overallScore}</span>
                                <span className="ring-score-pct">%</span>
                            </div>
                            <span className="ring-label">
                                {isCompleted ? 'Practice Readiness Score' : 'Current Practice Score'}
                            </span>
                        </div>

                        <div className="hero-stats-grid">
                            <div className="stat-box">
                                <span className="stat-box__label">
                                    {isCompleted ? 'Questions Completed' : 'Questions Attempted'}
                                </span>
                                <strong className="stat-box__value">{attemptedCount} / {requiredCount}</strong>
                            </div>
                            <div className="stat-box">
                                <span className="stat-box__label">Practice Time</span>
                                <strong className="stat-box__value">{formattedTime}</strong>
                            </div>
                            {spokenAnswersCount > 0 && (
                                <div className="stat-box">
                                    <span className="stat-box__label">Spoken Answers</span>
                                    <strong className="stat-box__value" style={{ color: '#8B5CF6' }}>{spokenAnswersCount}</strong>
                                </div>
                            )}
                            {techScore !== null && (
                                <div className="stat-box">
                                    <span className="stat-box__label">Technical Score</span>
                                    <strong className="stat-box__value">{techScore}%</strong>
                                </div>
                            )}
                            {mcqScore !== null && (
                                <div className="stat-box">
                                    <span className="stat-box__label">MCQ Accuracy</span>
                                    <strong className="stat-box__value">{mcqScore}%</strong>
                                </div>
                            )}
                            {behScore !== null && (
                                <div className="stat-box">
                                    <span className="stat-box__label">Behavioral / STAR</span>
                                    <strong className="stat-box__value">{behScore}%</strong>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* STAR Competency Summary Card (if behavioral answered) */}
                    {starAverages && (
                        <div className="results-card star-competency-card">
                            <h3>STAR Method Competency Breakdown</h3>
                            <p className="card-subtext">Average performance across your behavioral responses.</p>
                            <div className="star-metrics-grid" style={{ marginTop: '0.75rem' }}>
                                <div className="star-metric-item">
                                    <span className="star-metric-name">Situation</span>
                                    <div className="star-metric-bar">
                                        <div className="star-fill star-fill--blue" style={{ width: `${starAverages.situation}%` }} />
                                    </div>
                                    <span className="star-metric-val">{starAverages.situation}%</span>
                                </div>
                                <div className="star-metric-item">
                                    <span className="star-metric-name">Task</span>
                                    <div className="star-metric-bar">
                                        <div className="star-fill star-fill--yellow" style={{ width: `${starAverages.task}%` }} />
                                    </div>
                                    <span className="star-metric-val">{starAverages.task}%</span>
                                </div>
                                <div className="star-metric-item">
                                    <span className="star-metric-name">Action</span>
                                    <div className="star-metric-bar">
                                        <div className="star-fill star-fill--green" style={{ width: `${starAverages.action}%` }} />
                                    </div>
                                    <span className="star-metric-val">{starAverages.action}%</span>
                                </div>
                                <div className="star-metric-item">
                                    <span className="star-metric-name">Result</span>
                                    <div className="star-metric-bar">
                                        <div className="star-fill star-fill--pink" style={{ width: `${starAverages.result}%` }} />
                                    </div>
                                    <span className="star-metric-val">{starAverages.result}%</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 2. Breakdown Cards: Weak Topics & Strengths */}
                    <div className="results-2col-grid">
                        <div className="results-card">
                            <h3>Detected Weak Areas</h3>
                            <p className="card-subtext">Topics where your spoken recall or MCQ answers needed review.</p>
                            {weakTopics.length > 0 ? (
                                <div className="topic-bars-list">
                                    {weakTopics.map((topic, i) => (
                                        <div key={i} className="topic-bar-row">
                                            <div className="topic-meta">
                                                <span className="topic-name">{topic.topic}</span>
                                                <span className="topic-score">{topic.score}%</span>
                                            </div>
                                            <div className="progress-track">
                                                <div
                                                    className="progress-fill progress-fill--pink"
                                                    style={{ width: `${topic.score}%` }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="empty-subtext">No major weak topics identified in this practice run.</p>
                            )}
                        </div>

                        <div className="results-card">
                            <h3>Strong Topics</h3>
                            <p className="card-subtext">Areas where you demonstrated solid conceptual mastery.</p>
                            {strongTopics.length > 0 ? (
                                <div className="topic-bars-list">
                                    {strongTopics.map((topic, i) => (
                                        <div key={i} className="topic-bar-row">
                                            <div className="topic-meta">
                                                <span className="topic-name">{topic.topic}</span>
                                                <span className="topic-score" style={{ color: '#22C55E' }}>{topic.score}%</span>
                                            </div>
                                            <div className="progress-track">
                                                <div
                                                    className="progress-fill progress-fill--green"
                                                    style={{ width: `${topic.score}%` }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="empty-subtext">Keep practicing to build verified strong topics.</p>
                            )}
                        </div>
                    </div>

                    {/* 3. Action Buttons */}
                    <div className="results-action-bar">
                        <Link to="/practice" className="button primary-button">
                            Start Another Practice Session →
                        </Link>
                        <Link to={`/interview/${session.interviewReport}`} className="button secondary-button">
                            View Full Interview Report
                        </Link>
                        <Link to="/dashboard" className="button secondary-button">
                            Return to Dashboard
                        </Link>
                    </div>

                </div>
            </div>
        </AppShell>
    );
};

export default PracticeResults;
