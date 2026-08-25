import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { usePractice } from '../hooks/usePractice';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import AppShell from '../components/AppShell';
import '../style/practice.scss';

// ── Difficulty Badge ──────────────────────────────────────────────────────────
const DiffBadge = ({ level }) => {
    const cls = (level || '').toLowerCase();
    return <span className={`diff-badge diff-badge--${cls}`}>{level}</span>;
};

// ── Deterministic Hint Generator (Zero AI Cost) ──────────────────────────────
function getDeterministicHint(item) {
    if (!item) return "Focus on the core concept and how it relates to real-world software.";
    if (item.category && item.intention) {
        return `Think about ${item.category}: ${item.intention}`;
    }
    if (item.simpleExplanation) {
        const sentences = item.simpleExplanation.split('.');
        return `Hint: ${sentences[0]}.`;
    }
    return `Think about the definition and why developers use ${item.category || "this concept"}.`;
}

const PracticeSession = () => {
    const { sessionId } = useParams();
    const navigate = useNavigate();

    const {
        session,
        report,
        loading,
        evaluating,
        getSession,
        saveProgress,
        submitAnswer,
        evaluateAnswer,
        completeSession,
        error
    } = usePractice();

    // Voice recognition hook
    const {
        isSupported: isVoiceSupported,
        status: voiceStatus,
        isListening,
        isStopping,
        transcript: liveTranscript,
        finalTranscript,
        interimTranscript,
        recordingSeconds,
        formattedRecordingTime,
        permissionState,
        error: voiceError,
        isSuspiciousRepeat,
        startListening,
        stopListening,
        resetTranscript,
        setManualTranscript
    } = useSpeechRecognition();

    // Local states
    const [activeTab, setActiveTab] = useState('technical');
    const [currentIdx, setCurrentIdx] = useState(0);
    const [showHint, setShowHint] = useState(false);
    const [revealedAnswer, setRevealedAnswer] = useState(false);
    const [inputMode, setInputMode] = useState('voice'); // 'voice' | 'text' | 'quick'
    const [userTextAnswer, setUserTextAnswer] = useState('');
    const [isEditingTranscript, setIsEditingTranscript] = useState(false);
    const [selectedConfidence, setSelectedConfidence] = useState(null);
    const [selectedMcqOption, setSelectedMcqOption] = useState(null);
    const [mcqSubmitted, setMcqSubmitted] = useState(false);
    const [evaluationResult, setEvaluationResult] = useState(null);
    const [evalError, setEvalError] = useState(null);
    const [activeFollowUpLevel, setActiveFollowUpLevel] = useState(0);
    const [completing, setCompleting] = useState(false);
    const [showEarlyExitModal, setShowEarlyExitModal] = useState(false);

    // Session Timer (Overall)
    const [sessionSeconds, setSessionSeconds] = useState(0);
    const timerRef = useRef(null);

    useEffect(() => {
        if (sessionId) {
            getSession(sessionId).then(data => {
                if (data?.session) {
                    const s = data.session;
                    if (s.mode === 'technical') setActiveTab('technical');
                    else if (s.mode === 'mcq') setActiveTab('mcq');
                    else if (s.mode === 'behavioral') setActiveTab('behavioral');
                    else setActiveTab('technical');

                    setSessionSeconds(s.timeSpentSeconds || 0);

                    if (s.mode === 'technical' && s.technicalProgress) {
                        setCurrentIdx(s.technicalProgress.currentIndex || 0);
                    } else if (s.mode === 'mcq' && s.mcqProgress) {
                        setCurrentIdx(s.mcqProgress.currentIndex || 0);
                    } else if (s.mode === 'behavioral' && s.behavioralProgress) {
                        setCurrentIdx(s.behavioralProgress.currentIndex || 0);
                    }
                }
            });
        }
    }, [sessionId]);

    // Session Timer interval
    useEffect(() => {
        timerRef.current = setInterval(() => {
            setSessionSeconds(sec => sec + 1);
        }, 1000);

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    // Periodic progress save every 30 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            if (sessionId && session) {
                saveProgress(sessionId, {}, 30);
            }
        }, 30000);
        return () => clearInterval(interval);
    }, [sessionId, session]);

    // Current question list based on active tab
    const questionsList = useMemo(() => {
        if (!report) return [];
        if (activeTab === 'technical') return report.technicalQuestions || [];
        if (activeTab === 'mcq') return report.mcqQuestions || [];
        if (activeTab === 'behavioral') return report.behavioralQuestions || [];
        return [];
    }, [report, activeTab]);

    const totalQuestions = questionsList.length;
    const currentQuestion = questionsList[currentIdx];

    // Load existing answer for current question if present
    useEffect(() => {
        setShowHint(false);
        setRevealedAnswer(false);
        setEvaluationResult(null);
        setEvalError(null);
        setIsEditingTranscript(false);
        resetTranscript();
        setActiveFollowUpLevel(0);

        if (session && session.answers) {
            const existing = session.answers.find(
                a => a.questionIndex === currentIdx && a.questionType === activeTab
            );
            if (existing) {
                setUserTextAnswer(existing.userAnswer || '');
                setManualTranscript(existing.userAnswer || '');
                setSelectedConfidence(existing.confidence || null);
                setSelectedMcqOption(existing.selectedOption || null);
                setMcqSubmitted(!!existing.selectedOption);
                if (existing.feedback) {
                    setEvaluationResult(existing.feedback);
                }
                if (existing.confidence || existing.feedback || existing.userAnswer) {
                    setRevealedAnswer(true);
                }
            } else {
                setUserTextAnswer('');
                setSelectedConfidence(null);
                setSelectedMcqOption(null);
                setMcqSubmitted(false);
                setInputMode(isVoiceSupported && permissionState !== 'denied' ? 'voice' : 'text');
            }
        }
    }, [currentIdx, activeTab, session, isVoiceSupported, permissionState]);

    // Automatically switch to text input if mic permission is denied or unsupported
    useEffect(() => {
        if (!isVoiceSupported || permissionState === 'denied') {
            setInputMode('text');
        }
    }, [isVoiceSupported, permissionState]);

    // Format Session timer MM:SS
    const formattedSessionTimer = useMemo(() => {
        const mins = Math.floor(sessionSeconds / 60);
        const secs = sessionSeconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }, [sessionSeconds]);

    // Mode-specific attempted calculations
    const { requiredCount, attemptedCount, remainingCount } = useMemo(() => {
        if (!session) return { requiredCount: 0, attemptedCount: 0, remainingCount: 0 };
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
                const isAttempted = a.isSkipped === true ||
                    (typeof a.confidence === 'string' && a.confidence.length > 0) ||
                    (typeof a.selectedOption === 'string' && a.selectedOption.length > 0) ||
                    (typeof a.userAnswer === 'string' && a.userAnswer.trim().length > 0) ||
                    (typeof a.score === 'number');
                if (isAttempted) {
                    attemptedSet.add(`${a.questionType}-${a.questionIndex}`);
                }
            });
        }
        const att = attemptedSet.size;
        return {
            requiredCount: req,
            attemptedCount: att,
            remainingCount: Math.max(0, req - att)
        };
    }, [session, report]);

    // Quick Practice Confidence rating submission
    const handleQuickConfidence = async (confKey, scoreVal) => {
        setSelectedConfidence(confKey);
        setRevealedAnswer(true);

        await submitAnswer(sessionId, {
            questionIndex: currentIdx,
            questionType: activeTab,
            confidence: confKey,
            score: scoreVal,
            category: currentQuestion?.category || currentQuestion?.intention || 'General',
            difficulty: currentQuestion?.difficulty || 'Medium'
        });
    };

    // Submit MCQ Answer
    const handleMcqOptionSelect = async (opt) => {
        if (mcqSubmitted) return;
        setSelectedMcqOption(opt);
        setMcqSubmitted(true);

        const isCorrect = opt === currentQuestion?.correctAnswer;
        const score = isCorrect ? 100 : 0;

        await submitAnswer(sessionId, {
            questionIndex: currentIdx,
            questionType: 'mcq',
            selectedOption: opt,
            isCorrect,
            score,
            category: currentQuestion?.category || 'MCQ'
        });
    };

    // AI Evaluation trigger for Spoken / Written answer
    const handleEvaluateAnswer = async (answerText) => {
        const textToEvaluate = (answerText || liveTranscript || userTextAnswer).trim();
        if (!textToEvaluate || evaluating) return;
        setEvalError(null);

        try {
            const data = await evaluateAnswer({
                questionType: activeTab,
                questionData: currentQuestion,
                userAnswer: textToEvaluate
            });

            if (data) {
                setEvaluationResult(data);
                setRevealedAnswer(true);

                // Persist score & feedback into session
                await submitAnswer(sessionId, {
                    questionIndex: currentIdx,
                    questionType: activeTab,
                    userAnswer: textToEvaluate,
                    score: data.score || 75,
                    feedback: data,
                    category: currentQuestion?.category || currentQuestion?.intention || 'General',
                    difficulty: currentQuestion?.difficulty || 'Medium'
                });
            }
        } catch (err) {
            setEvalError("Evaluation unavailable right now. Try reviewing the model answer.");
        }
    };

    // Navigation Next / Prev / Skip
    const handleNext = () => {
        if (currentIdx < totalQuestions - 1) {
            setCurrentIdx(i => i + 1);
        } else if (session?.mode === 'mixed') {
            if (activeTab === 'technical') {
                setActiveTab('mcq');
                setCurrentIdx(0);
            } else if (activeTab === 'mcq') {
                setActiveTab('behavioral');
                setCurrentIdx(0);
            } else {
                handleComplete();
            }
        } else {
            handleComplete();
        }
    };

    const handlePrev = () => {
        if (currentIdx > 0) {
            setCurrentIdx(i => i - 1);
        }
    };

    const handleSkip = async () => {
        await submitAnswer(sessionId, {
            questionIndex: currentIdx,
            questionType: activeTab,
            isSkipped: true,
            score: 0,
            category: currentQuestion?.category || 'General'
        });
        handleNext();
    };

    const handleComplete = async () => {
        setCompleting(true);
        try {
            await completeSession(sessionId);
            navigate(`/practice/results/${sessionId}`);
        } catch (err) {
            console.error("Complete session error:", err);
            navigate(`/practice/results/${sessionId}`);
        }
    };

    const handleSaveAndExit = async () => {
        await saveProgress(sessionId, {}, sessionSeconds);
        navigate(`/practice/results/${sessionId}`);
    };

    const currentAnswerText = liveTranscript || userTextAnswer;
    const hasSpokenOrTypedAnswer = currentAnswerText.trim().length > 0;

    if (loading && !session) {
        return (
            <AppShell>
                <div className="loading-screen">
                    <div className="loading-spinner" />
                    <h2>Initializing your interactive practice session...</h2>
                </div>
            </AppShell>
        );
    }

    if (error) {
        return (
            <AppShell>
                <div className="practice-error-card">
                    <span className="error-icon">⚠️</span>
                    <h2>Unable to load practice session</h2>
                    <p>{error}</p>
                    <Link to="/practice" className="button primary-button">
                        Back to Practice Hub
                    </Link>
                </div>
            </AppShell>
        );
    }

    return (
        <AppShell activeNavId="practice">
            <div className="practice-session-page">

                {/* ── Top Session Bar ── */}
                <div className="session-topbar">
                    <div className="session-topbar-left">
                        <span className="session-mode-badge">{activeTab.toUpperCase()} PRACTICE</span>
                        <h2 className="session-role-title">
                            {session?.selectedTrackTitle || report?.title || "Interview Practice"}
                        </h2>
                    </div>

                    <div className="session-topbar-center">
                        <span className="session-q-counter">
                            Question <strong>{currentIdx + 1}</strong> of {totalQuestions}
                        </span>
                        <div className="session-progress-mini">
                            <div
                                className="progress-mini-fill"
                                style={{ width: `${Math.round(((currentIdx + 1) / totalQuestions) * 100)}%` }}
                            />
                        </div>
                    </div>

                    <div className="session-topbar-right">
                        <div className="session-timer-pill" title="Total Practice Time">
                            <span className="timer-icon">⏱</span>
                            <span className="timer-val">{formattedSessionTimer}</span>
                        </div>
                        <button
                            type="button"
                            className="session-exit-btn"
                            onClick={() => setShowEarlyExitModal(true)}
                        >
                            Save & Exit
                        </button>
                    </div>
                </div>

                {/* ── Main Question Card ── */}
                <div className="session-main-card">

                    {/* Question Header */}
                    <div className="session-q-header">
                        <div className="q-meta-row">
                            <DiffBadge level={currentQuestion?.difficulty} />
                            {currentQuestion?.category && (
                                <span className="q-category-tag">{currentQuestion.category}</span>
                            )}
                            {currentQuestion?.estimatedInterviewTime && (
                                <span className="q-time-tag">⏱ {currentQuestion.estimatedInterviewTime}</span>
                            )}
                        </div>
                        <h1 className="session-question-text">{currentQuestion?.question}</h1>
                    </div>

                    {/* Behavioral STAR Guidance Notice */}
                    {activeTab === 'behavioral' && (
                        <div className="star-guidance-bar">
                            <span className="star-tag">STAR Framework Tip:</span>
                            <span className="star-sub">Cover: <strong>Situation</strong>, <strong>Task</strong>, <strong>Action</strong>, and <strong>Result</strong> in your response.</span>
                        </div>
                    )}

                    {/* Hint Box (Deterministic Zero-Cost) */}
                    {showHint && (
                        <div className="session-hint-box">
                            <span className="hint-label">💡 Interviewer Hint:</span>
                            <p>{getDeterministicHint(currentQuestion)}</p>
                        </div>
                    )}

                    {/* ══════════════════════════════════════════════════════════
                        INTERACTIVE WORKSPACE BODY
                        ══════════════════════════════════════════════════════════ */}
                    {activeTab === 'mcq' ? (
                        /* MCQ Practice Mode */
                        <div className="session-mcq-body">
                            <div className="mcq-options-list">
                                {currentQuestion?.options?.map((opt, i) => {
                                    const letter = String.fromCharCode(65 + i);
                                    const isSelected = selectedMcqOption === opt;
                                    let optClass = '';
                                    if (mcqSubmitted) {
                                        if (opt === currentQuestion.correctAnswer) optClass = 'mcq-opt--correct';
                                        else if (isSelected) optClass = 'mcq-opt--wrong';
                                    } else if (isSelected) {
                                        optClass = 'mcq-opt--selected';
                                    }

                                    return (
                                        <div
                                            key={i}
                                            className={`mcq-opt ${optClass}`}
                                            onClick={() => handleMcqOptionSelect(opt)}
                                        >
                                            <span className="mcq-opt__letter">{letter}</span>
                                            <span className="mcq-opt__text">{opt}</span>
                                            {mcqSubmitted && opt === currentQuestion.correctAnswer && <span className="mcq-opt__status">✓ Correct</span>}
                                            {mcqSubmitted && isSelected && opt !== currentQuestion.correctAnswer && <span className="mcq-opt__status">✕ Incorrect</span>}
                                        </div>
                                    );
                                })}
                            </div>

                            {mcqSubmitted && (
                                <div className="mcq-explanation-box">
                                    <span className={`mcq-result-badge ${selectedMcqOption === currentQuestion?.correctAnswer ? 'mcq-result-badge--correct' : 'mcq-result-badge--wrong'}`}>
                                        {selectedMcqOption === currentQuestion?.correctAnswer ? '✓ Correct Answer!' : '✕ Needs Review'}
                                    </span>
                                    <p>{currentQuestion?.explanation}</p>
                                    {currentQuestion?.resource && (
                                        <span className="mcq-resource-tag">Resource: {currentQuestion.resource}</span>
                                    )}
                                </div>
                            )}
                        </div>
                    ) : (
                        /* Voice & Text Workspace for Technical and Behavioral */
                        <div className="session-voice-workspace">

                            {/* Microphone Permission / Unsupported Banner */}
                            {permissionState === 'denied' && (
                                <div className="voice-permission-banner">
                                    <span className="banner-icon">🔒</span>
                                    <div>
                                        <strong>Microphone Access Blocked</strong>
                                        <p>Speech recognition is currently disabled. Please enable microphone permissions in your browser or type your answer below.</p>
                                    </div>
                                </div>
                            )}

                            {/* Mode Switching Tabs */}
                            <div className="input-mode-switcher">
                                <button
                                    type="button"
                                    className={`mode-switch-btn ${inputMode === 'voice' ? 'mode-switch-btn--active' : ''}`}
                                    onClick={() => setInputMode('voice')}
                                    disabled={permissionState === 'denied' || !isVoiceSupported}
                                >
                                    🎙 Speak Your Answer
                                </button>
                                <button
                                    type="button"
                                    className={`mode-switch-btn ${inputMode === 'text' ? 'mode-switch-btn--active' : ''}`}
                                    onClick={() => setInputMode('text')}
                                >
                                    ✍ Type Instead
                                </button>
                                <button
                                    type="button"
                                    className={`mode-switch-btn ${inputMode === 'quick' ? 'mode-switch-btn--active' : ''}`}
                                    onClick={() => setInputMode('quick')}
                                >
                                    ⚡ Quick Self-Check
                                </button>

                                <button
                                    type="button"
                                    className="hint-pill-btn"
                                    onClick={() => setShowHint(h => !h)}
                                >
                                    {showHint ? 'Hide Hint' : '💡 Need a Hint?'}
                                </button>
                            </div>

                            {/* ── 1. Voice Practice Flow (Primary) ── */}
                            {inputMode === 'voice' && (
                                <div className="voice-input-panel">
                                    {/* Mic Permission / Error Banner */}
                                    {(permissionState === 'denied' || !isVoiceSupported || voiceError) && (
                                        <div className="session-error-banner">
                                            <span className="banner-icon">⚠️</span>
                                            <div>
                                                <strong>{permissionState === 'denied' ? 'Microphone Permission Blocked' : !isVoiceSupported ? 'Browser Unsupported' : 'Microphone Notice'}</strong>
                                                <p>{voiceError || (!isVoiceSupported ? 'Voice practice is not supported in this browser. Please use Chrome, Edge, or type instead.' : 'Please allow microphone access or switch to text input.')}</p>
                                            </div>
                                            <button
                                                type="button"
                                                className="button secondary-button"
                                                onClick={() => setInputMode('text')}
                                                style={{ marginLeft: 'auto' }}
                                            >
                                                ✍ Type Instead
                                            </button>
                                        </div>
                                    )}

                                    {/* Mic Trigger State */}
                                    <div className="voice-record-center">
                                        {!isListening ? (
                                            <button
                                                type="button"
                                                className="voice-record-btn voice-record-btn--idle"
                                                onClick={() => startListening()}
                                                aria-label="Start Voice Recording"
                                                disabled={isStopping || permissionState === 'denied' || !isVoiceSupported}
                                            >
                                                <div className="mic-icon-circle">
                                                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
                                                        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                                                        <line x1="12" y1="19" x2="12" y2="22" />
                                                    </svg>
                                                </div>
                                                <span className="record-btn-text">
                                                    {isStopping ? 'Finalizing Transcript...' : hasSpokenOrTypedAnswer ? 'Record Again / Add to Answer' : 'Start Speaking Your Answer'}
                                                </span>
                                                <span className="record-btn-sub">
                                                    {isStopping ? 'Processing final speech segments...' : 'Click to speak naturally as you would in an interview'}
                                                </span>
                                            </button>
                                        ) : (
                                            <button
                                                type="button"
                                                className="voice-record-btn voice-record-btn--recording"
                                                onClick={stopListening}
                                                aria-label="Stop Voice Recording"
                                            >
                                                <div className="mic-icon-circle recording-pulse">
                                                    <span className="rec-stop-square" />
                                                </div>
                                                <div className="recording-status-box">
                                                    <span className="recording-indicator">
                                                        <span className="rec-pulse-dot" /> Listening...
                                                    </span>
                                                    <span className="recording-timer">{formattedRecordingTime}</span>
                                                </div>
                                                <span className="record-btn-sub">Click to stop and review your transcript</span>
                                            </button>
                                        )}
                                    </div>

                                    {/* Live / Completed Transcript Card */}
                                    {(hasSpokenOrTypedAnswer || isListening || isStopping) && (
                                        <div className="transcript-preview-card">
                                            <div className="transcript-header">
                                                <span className="transcript-label">
                                                    {isListening ? '🎙 Live Speech Transcript' : isStopping ? '⏳ Finalizing Transcript' : '📝 Your Spoken Response'}
                                                </span>
                                                {!isListening && !isStopping && hasSpokenOrTypedAnswer && (
                                                    <button
                                                        type="button"
                                                        className="edit-transcript-btn"
                                                        onClick={() => setIsEditingTranscript(e => !e)}
                                                    >
                                                        {isEditingTranscript ? '✓ Done Editing' : '✏️ Edit Text'}
                                                    </button>
                                                )}
                                            </div>

                                            {/* Quality Check Warning if suspicious repetition is detected */}
                                            {isSuspiciousRepeat && !isListening && (
                                                <div className="transcript-quality-warning">
                                                    <span className="warning-icon">⚠️</span>
                                                    <div>
                                                        <strong>Transcript Quality Check:</strong>
                                                        <span> Your recording may contain repeated phrases from mic echo. You can edit the text before evaluation or re-record.</span>
                                                    </div>
                                                </div>
                                            )}

                                            {isEditingTranscript ? (
                                                <textarea
                                                    value={userTextAnswer || liveTranscript}
                                                    onChange={(e) => {
                                                        setManualTranscript(e.target.value);
                                                        setUserTextAnswer(e.target.value);
                                                    }}
                                                    rows={4}
                                                    className="transcript-edit-area"
                                                    placeholder="Edit your speech transcript here..."
                                                />
                                            ) : (
                                                <p className="transcript-body-text">
                                                    {finalTranscript && <span className="transcript-final-text">{finalTranscript}</span>}
                                                    {interimTranscript && <span className="transcript-interim-text">[{interimTranscript}...]</span>}
                                                    {!finalTranscript && !interimTranscript && (
                                                        <span className="transcript-empty-prompt">
                                                            {isListening ? "Listening to your microphone... Speak clearly into your mic." : userTextAnswer || "No transcript recorded yet."}
                                                        </span>
                                                    )}
                                                </p>
                                            )}

                                            {!isListening && !isStopping && hasSpokenOrTypedAnswer && !evaluationResult && (
                                                <div className="transcript-actions-row">
                                                    <button
                                                        type="button"
                                                        className="button secondary-button"
                                                        onClick={() => {
                                                            resetTranscript();
                                                            setUserTextAnswer('');
                                                            setIsEditingTranscript(false);
                                                        }}
                                                    >
                                                        🔄 Clear & Re-Record
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="button primary-button evaluate-submit-btn"
                                                        onClick={() => handleEvaluateAnswer(userTextAnswer || liveTranscript)}
                                                        disabled={evaluating}
                                                    >
                                                        {evaluating ? 'AI Evaluating...' : '✨ Get AI Feedback & Score'}
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ── 2. Text Input Fallback ── */}
                            {inputMode === 'text' && (
                                <div className="text-input-panel">
                                    <textarea
                                        placeholder="Type your answer, core talking points, or bullet points here..."
                                        value={userTextAnswer}
                                        onChange={(e) => {
                                            setUserTextAnswer(e.target.value);
                                            setManualTranscript(e.target.value);
                                        }}
                                        rows={5}
                                        className="user-answer-textarea"
                                    />
                                    {userTextAnswer.trim().length > 5 && !evaluationResult && (
                                        <div className="text-actions-row">
                                            <button
                                                type="button"
                                                className="button primary-button evaluate-submit-btn"
                                                onClick={() => handleEvaluateAnswer()}
                                                disabled={evaluating}
                                            >
                                                {evaluating ? 'AI Evaluating...' : '✨ Get AI Feedback & Score'}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ── 3. Quick Self-Check Mode ── */}
                            {inputMode === 'quick' && (
                                <div className="quick-check-panel">
                                    <p className="quick-check-prompt">How confident are you with this interview question?</p>
                                    <div className="quick-confidence-grid">
                                        <button
                                            type="button"
                                            className={`quick-conf-btn quick-conf-btn--know ${selectedConfidence === 'KNOWN' ? 'quick-conf-btn--active' : ''}`}
                                            onClick={() => handleQuickConfidence('KNOWN', 100)}
                                        >
                                            <span className="conf-icon">🎯</span>
                                            <strong>I Know It</strong>
                                            <span className="conf-sub">Confident conceptual answer</span>
                                        </button>
                                        <button
                                            type="button"
                                            className={`quick-conf-btn quick-conf-btn--partial ${selectedConfidence === 'PARTIAL' ? 'quick-conf-btn--active' : ''}`}
                                            onClick={() => handleQuickConfidence('PARTIAL', 60)}
                                        >
                                            <span className="conf-icon">👍</span>
                                            <strong>Partly Know It</strong>
                                            <span className="conf-sub">Need a quick refresher</span>
                                        </button>
                                        <button
                                            type="button"
                                            className={`quick-conf-btn quick-conf-btn--unknown ${selectedConfidence === 'UNKNOWN' ? 'quick-conf-btn--active' : ''}`}
                                            onClick={() => handleQuickConfidence('UNKNOWN', 20)}
                                        >
                                            <span className="conf-icon">⚠️</span>
                                            <strong>I Don't Know</strong>
                                            <span className="conf-sub">Want to learn model answer</span>
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* ══════════════════════════════════════════════════
                                AI EVALUATION FEEDBACK CARD
                                ══════════════════════════════════════════════════ */}
                            {evaluationResult && (
                                <div className="ai-performance-card">
                                    <div className="performance-header">
                                        <div className="score-badge-circle">
                                            <span className="score-val">{evaluationResult.score ?? 80}%</span>
                                            <span className="score-lbl">Score</span>
                                        </div>
                                        <div className="performance-meta">
                                            <h3>AI Interviewer Performance</h3>
                                            <span className="perf-subtext">Comprehensive breakdown of your response</span>
                                        </div>
                                    </div>

                                    {/* Metrics Grid */}
                                    {activeTab === 'behavioral' && evaluationResult.starCoverage ? (
                                        /* STAR Metrics for Behavioral */
                                        <div className="star-metrics-grid">
                                            <div className="star-metric-item">
                                                <span className="star-metric-name">Situation</span>
                                                <div className="star-metric-bar">
                                                    <div className="star-fill star-fill--blue" style={{ width: `${evaluationResult.starCoverage.situation || 80}%` }} />
                                                </div>
                                                <span className="star-metric-val">{evaluationResult.starCoverage.situation || 80}%</span>
                                            </div>
                                            <div className="star-metric-item">
                                                <span className="star-metric-name">Task</span>
                                                <div className="star-metric-bar">
                                                    <div className="star-fill star-fill--yellow" style={{ width: `${evaluationResult.starCoverage.task || 75}%` }} />
                                                </div>
                                                <span className="star-metric-val">{evaluationResult.starCoverage.task || 75}%</span>
                                            </div>
                                            <div className="star-metric-item">
                                                <span className="star-metric-name">Action</span>
                                                <div className="star-metric-bar">
                                                    <div className="star-fill star-fill--green" style={{ width: `${evaluationResult.starCoverage.action || 90}%` }} />
                                                </div>
                                                <span className="star-metric-val">{evaluationResult.starCoverage.action || 90}%</span>
                                            </div>
                                            <div className="star-metric-item">
                                                <span className="star-metric-name">Result</span>
                                                <div className="star-metric-bar">
                                                    <div className="star-fill star-fill--pink" style={{ width: `${evaluationResult.starCoverage.result || 70}%` }} />
                                                </div>
                                                <span className="star-metric-val">{evaluationResult.starCoverage.result || 70}%</span>
                                            </div>
                                        </div>
                                    ) : (
                                        /* Technical Metrics (Correctness, Completeness, Clarity) */
                                        <div className="eval-metrics-row">
                                            <div className="metric-pill">
                                                <span className="metric-pill__label">Correctness</span>
                                                <span className="metric-pill__val">{evaluationResult.correctness ?? 85}%</span>
                                            </div>
                                            <div className="metric-pill">
                                                <span className="metric-pill__label">Completeness</span>
                                                <span className="metric-pill__val">{evaluationResult.completeness ?? 75}%</span>
                                            </div>
                                            <div className="metric-pill">
                                                <span className="metric-pill__label">Clarity</span>
                                                <span className="metric-pill__val">{evaluationResult.clarity ?? 85}%</span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Strengths and Improvements */}
                                    <div className="eval-details-grid">
                                        {evaluationResult.strengths?.length > 0 && (
                                            <div className="eval-box eval-box--strengths">
                                                <h4>✓ What You Did Well</h4>
                                                <ul>{evaluationResult.strengths.map((s, i) => <li key={i}>{s}</li>)}</ul>
                                            </div>
                                        )}

                                        {(evaluationResult.missingPoints?.length > 0 || evaluationResult.missingElements?.length > 0) && (
                                            <div className="eval-box eval-box--missing">
                                                <h4>⚠ What to Improve</h4>
                                                <ul>
                                                    {(evaluationResult.missingPoints || evaluationResult.missingElements).map((m, i) => <li key={i}>{m}</li>)}
                                                </ul>
                                            </div>
                                        )}
                                    </div>

                                    {/* Coaching Tips */}
                                    {(evaluationResult.improvementTips?.length > 0 || evaluationResult.improvedAnswer) && (
                                        <div className="coaching-tip-box">
                                            <span className="tip-tag">💡 AI Coaching Tip:</span>
                                            <p>{evaluationResult.improvementTips?.[0] || evaluationResult.improvedAnswer}</p>
                                        </div>
                                    )}

                                    {/* Evaluation Actions */}
                                    <div className="eval-footer-actions">
                                        <button
                                            type="button"
                                            className="button secondary-button"
                                            onClick={() => {
                                                setEvaluationResult(null);
                                                resetTranscript();
                                                setUserTextAnswer('');
                                            }}
                                        >
                                            🔄 Try Again
                                        </button>
                                        <button
                                            type="button"
                                            className="button primary-button"
                                            onClick={handleNext}
                                        >
                                            Continue to Next →
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* ══════════════════════════════════════════════════
                                MODEL ANSWER & INTERVIEW COACHING DRAWER
                                ══════════════════════════════════════════════════ */}
                            <div className="model-answer-section">
                                {!revealedAnswer ? (
                                    <button
                                        type="button"
                                        className="reveal-answer-btn"
                                        onClick={() => setRevealedAnswer(true)}
                                    >
                                        👁 Reveal Model Answer & STAR Framework
                                    </button>
                                ) : (
                                    <div className="revealed-answer-box">
                                        <div className="revealed-header">
                                            <h4>Model Answer & Structured Response</h4>
                                            <button
                                                type="button"
                                                className="hide-btn"
                                                onClick={() => setRevealedAnswer(false)}
                                            >
                                                Hide
                                            </button>
                                        </div>
                                        <p className="revealed-text" style={{ whiteSpace: 'pre-line' }}>
                                            {currentQuestion?.answer}
                                        </p>

                                        {currentQuestion?.commonMistakes?.length > 0 && (
                                            <div className="mistakes-box">
                                                <strong>Common Pitfalls:</strong>
                                                <ul>{currentQuestion.commonMistakes.map((m, i) => <li key={i}>{m}</li>)}</ul>
                                            </div>
                                        )}

                                        {/* Progressive Follow-Up Levels */}
                                        {currentQuestion?.followUpQuestions?.length > 0 && (
                                            <div className="follow-up-interview-box">
                                                <span className="followup-title">🎤 Interviewer Follow-Up Question:</span>
                                                <p className="followup-text">
                                                    "{currentQuestion.followUpQuestions[activeFollowUpLevel] || currentQuestion.followUpQuestions[0]}"
                                                </p>
                                                {currentQuestion.followUpQuestions.length > 1 && (
                                                    <div className="followup-step-pills">
                                                        {currentQuestion.followUpQuestions.map((_, idx) => (
                                                            <button
                                                                key={idx}
                                                                type="button"
                                                                className={`followup-step-btn ${activeFollowUpLevel === idx ? 'followup-step-btn--active' : ''}`}
                                                                onClick={() => setActiveFollowUpLevel(idx)}
                                                            >
                                                                Level {idx + 1}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                        </div>
                    )}

                    {/* ── Footer Navigation Actions ── */}
                    <div className="session-footer-actions">
                        <button
                            type="button"
                            className="button secondary-button"
                            onClick={handlePrev}
                            disabled={currentIdx === 0}
                        >
                            ← Previous
                        </button>

                        <div className="session-footer-right">
                            <button
                                type="button"
                                className="session-skip-btn"
                                onClick={handleSkip}
                            >
                                Skip Question
                            </button>

                            <button
                                type="button"
                                className="button primary-button"
                                onClick={handleNext}
                                disabled={completing}
                            >
                                {currentIdx === totalQuestions - 1
                                    ? (session?.mode === 'mixed' && activeTab !== 'behavioral' ? 'Next Section →' : 'Finish & View Results →')
                                    : 'Next Question →'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* ── Early Exit Modal ── */}
                {showEarlyExitModal && (
                    <div className="progress-overlay">
                        <div className="progress-card exit-modal-card">
                            <div className="progress-header-icon">💾</div>
                            <h2>Save Practice Session?</h2>
                            <p className="progress-card__subtitle">
                                You have attempted {attemptedCount} of {requiredCount} questions. All your voice transcripts, confidence levels, and scores will be saved.
                            </p>
                            <div className="exit-modal-buttons">
                                <button
                                    type="button"
                                    className="button primary-button"
                                    onClick={handleSaveAndExit}
                                >
                                    Save & View Current Results
                                </button>
                                <button
                                    type="button"
                                    className="button secondary-button"
                                    onClick={() => setShowEarlyExitModal(false)}
                                >
                                    Continue Practice
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </AppShell>
    );
};

export default PracticeSession;
