import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router';
import { useInterview } from '../hooks/useInterview';
import { useJourney } from '../hooks/useJourney';
import AppShell from '../components/AppShell';
import '../style/interview.scss';

// ── Navigation Items ─────────────────────────────────────────────────────────
const NAV_ITEMS = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'resume', label: 'Resume & Blueprint', icon: '📄' },
    { id: 'technical', label: 'Technical Questions', icon: '💻' },
    { id: 'mcq', label: 'MCQ Practice', icon: '📝' },
    { id: 'behavioral', label: 'Behavioral (STAR)', icon: '🎯' },
    { id: 'skillgaps', label: 'Skill Gaps', icon: '⚠️' },
    { id: 'roadmap', label: 'Roadmap', icon: '🗺️' },
    { id: 'ats', label: 'ATS Analysis', icon: '📈' }
];

// ── Difficulty Badge Helper ──────────────────────────────────────────────────
const DiffBadge = ({ level }) => {
    const cls = (level || '').toLowerCase();
    return <span className={`diff-badge diff-badge--${cls}`}>{level}</span>;
};

// ── Match Score Color Helpers ────────────────────────────────────────────────
const getMatchScoreInfo = (score = 0) => {
    if (score >= 80) return { label: 'Strong Match', colorClass: 'match-score--high', badgeColor: '#22C55E' };
    if (score >= 60) return { label: 'Moderate Match', colorClass: 'match-score--mid', badgeColor: '#F59E0B' };
    return { label: 'Skill Gap / Early Fit', colorClass: 'match-score--low', badgeColor: '#EF4444' };
};

// ── Formatted Track Details ──────────────────────────────────────────────────
const FormattedTrackDetails = ({ text }) => {
    if (!text) return null;
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

    return (
        <div className="track-details-container">
            {lines.map((line, idx) => {
                const isHeading = line.endsWith(':') || line.toUpperCase() === line && line.length < 40;
                const isBullet = line.startsWith('-') || line.startsWith('•') || line.startsWith('*');

                if (isHeading) {
                    return <h4 key={idx} className="track-heading">{line.replace(/[:]/g, '')}</h4>;
                }
                if (isBullet) {
                    return <p key={idx} className="track-bullet"><span className="bullet-dot">•</span> {line.replace(/^[-•*]\s*/, '')}</p>;
                }
                return <p key={idx} className="track-p">{line}</p>;
            })}
        </div>
    );
};

// ── Copy Button ──────────────────────────────────────────────────────────────
const CopyButton = ({ text }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = (e) => {
        e.stopPropagation();
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <button type="button" className="copy-btn" onClick={handleCopy} title="Copy text">
            {copied ? '✓ Copied' : 'Copy'}
        </button>
    );
};

// ── Technical Question Card (Simple Interview Coach Format) ──────────────────
const TechnicalCard = ({ item, index }) => {
    const [open, setOpen] = useState(false);

    // Extract one-line answer fallback if not explicit
    const oneLine = item.oneLineAnswer || (item.answer ? item.answer.split('\n')[0].replace(/^(Answer:|Direct Answer:)\s*/i, '') : null);
    const spokenAnswer = item.howToSayIt || item.interviewAnswer || item.answer;

    return (
        <div className={`q-card ${open ? 'q-card--open' : ''}`}>
            <div className="q-card__header" onClick={() => setOpen(o => !o)}>
                <div className="q-card__header-left">
                    <span className="q-card__index">Q{index + 1}</span>
                    <DiffBadge level={item.difficulty} />
                    {item.category && <span className="q-card__category">{item.category}</span>}
                    {item.estimatedInterviewTime && <span className="q-card__time">⏱ {item.estimatedInterviewTime}</span>}
                </div>
                <h3 className="q-card__question">{item.question}</h3>
                <div className="q-card__header-right">
                    <button
                        type="button"
                        className="q-card__toggle-btn"
                        onClick={(e) => {
                            e.stopPropagation();
                            setOpen(o => !o);
                        }}
                    >
                        {open ? 'Collapse ↑' : 'View Answer & Explanation ↓'}
                    </button>
                    <span className={`q-card__chevron ${open ? 'q-card__chevron--open' : ''}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
                    </span>
                </div>
            </div>

            {open && (
                <div className="q-card__body">
                    {/* 1. ONE-LINE ANSWER */}
                    {oneLine && (
                        <div className="coach-section coach-section--answer">
                            <div className="coach-section__header">
                                <span className="coach-tag coach-tag--answer">✅ ONE-LINE ANSWER</span>
                                <CopyButton text={oneLine} />
                            </div>
                            <div className="coach-answer-box">
                                <p className="coach-answer-text">{oneLine}</p>
                            </div>
                        </div>
                    )}

                    {/* 2. SIMPLE EXPLANATION */}
                    {item.simpleExplanation && (
                        <div className="coach-section">
                            <div className="coach-section__header">
                                <span className="coach-tag coach-tag--explanation">💡 SIMPLE EXPLANATION</span>
                            </div>
                            <p className="coach-body-text">{item.simpleExplanation}</p>
                        </div>
                    )}

                    {/* 3. EASY EXAMPLE */}
                    {item.easyExample && (
                        <div className="coach-section">
                            <div className="coach-section__header">
                                <span className="coach-tag coach-tag--example">🧪 EASY EXAMPLE</span>
                                <CopyButton text={item.easyExample} />
                            </div>
                            <div className="coach-code-box">
                                <pre><code>{item.easyExample}</code></pre>
                            </div>
                        </div>
                    )}

                    {/* 4. REAL-WORLD EXAMPLE */}
                    {item.realWorldExample && (
                        <div className="coach-section">
                            <div className="coach-section__header">
                                <span className="coach-tag coach-tag--realworld">🌍 REAL-WORLD EXAMPLE</span>
                            </div>
                            <div className="coach-realworld-box">
                                <p>{item.realWorldExample}</p>
                            </div>
                        </div>
                    )}

                    {/* 5. HOW TO SAY IT IN AN INTERVIEW */}
                    {spokenAnswer && (
                        <div className="coach-section coach-section--spoken">
                            <div className="coach-section__header">
                                <span className="coach-tag coach-tag--speech">🎤 HOW TO SAY IT IN INTERVIEW</span>
                                <CopyButton text={spokenAnswer} />
                            </div>
                            <div className="coach-speech-box">
                                <span className="quote-icon">“</span>
                                <p className="speech-text">{spokenAnswer}</p>
                            </div>
                        </div>
                    )}

                    {/* Legacy / Model Answer fallback if specific fields are not separated */}
                    {!item.simpleExplanation && !item.easyExample && item.answer && item.answer !== oneLine && (
                        <div className="coach-section">
                            <div className="coach-section__header">
                                <span className="coach-tag coach-tag--answer">📖 COMPLETE MODEL ANSWER</span>
                                <CopyButton text={item.answer} />
                            </div>
                            <p className="coach-body-text" style={{ whiteSpace: 'pre-line' }}>{item.answer}</p>
                        </div>
                    )}

                    {/* 6. COMMON MISTAKES */}
                    {item.commonMistakes?.length > 0 && (
                        <div className="coach-section">
                            <div className="coach-section__header">
                                <span className="coach-tag coach-tag--mistakes">⚠ COMMON MISTAKES TO AVOID</span>
                            </div>
                            <ul className="coach-mistakes-list">
                                {item.commonMistakes.map((m, i) => (
                                    <li key={i}>
                                        <span className="mistake-bullet">✕</span>
                                        <span>{m}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* 7. PROGRESSIVE FOLLOW-UP QUESTIONS */}
                    {item.followUpQuestions?.length > 0 && (
                        <div className="coach-section">
                            <div className="coach-section__header">
                                <span className="coach-tag coach-tag--followup">➡ PROGRESSIVE FOLLOW-UP QUESTIONS</span>
                            </div>
                            <div className="coach-followup-list">
                                {item.followUpQuestions.map((f, i) => {
                                    const levelLabel = i === 0 ? 'Easy' : i === 1 ? 'Medium' : i === 2 ? 'Practical' : 'Deeper';
                                    return (
                                        <div key={i} className="coach-followup-item">
                                            <span className="followup-num">{i + 1}</span>
                                            <div className="followup-content">
                                                <span className="followup-level-pill">{levelLabel}</span>
                                                <p className="followup-text">{f}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* 8. QUICK MEMORY TIP */}
                    {item.quickMemoryTip && (
                        <div className="coach-section">
                            <div className="coach-memory-tip-card">
                                <span className="tip-icon">🧠</span>
                                <div>
                                    <span className="tip-title">QUICK MEMORY TIP</span>
                                    <p className="tip-text">{item.quickMemoryTip}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 9. RESOURCES */}
                    {item.resources?.length > 0 && (
                        <div className="coach-section">
                            <div className="coach-section__header">
                                <span className="coach-tag coach-tag--resources">📚 RECOMMENDED RESOURCES</span>
                            </div>
                            <div className="coach-resources-tags">
                                {item.resources.map((r, i) => (
                                    <span key={i} className="resource-pill">
                                        📖 {r}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// ── MCQ Practice Card ────────────────────────────────────────────────────────
const McqCard = ({ item, index }) => {
    const [selectedOption, setSelectedOption] = useState(null);
    const [revealed, setRevealed] = useState(false);

    const isCorrect = selectedOption === item.correctAnswer;

    return (
        <div className="mcq-card">
            <div className="mcq-card__header">
                <div className="mcq-card__meta">
                    <span className="mcq-card__index">Q{index + 1} / 15</span>
                    <DiffBadge level={item.difficulty} />
                    {item.category && <span className="mcq-card__category">{item.category}</span>}
                </div>
                <h3 className="mcq-card__question">{item.question}</h3>
            </div>

            <div className="mcq-options-list">
                {item.options?.map((opt, i) => {
                    const letter = String.fromCharCode(65 + i);
                    const isSelected = selectedOption === opt;
                    let optClass = '';
                    if (revealed) {
                        if (opt === item.correctAnswer) optClass = 'mcq-opt--correct';
                        else if (isSelected) optClass = 'mcq-opt--wrong';
                    } else if (isSelected) {
                        optClass = 'mcq-opt--selected';
                    }

                    return (
                        <div
                            key={i}
                            className={`mcq-opt ${optClass}`}
                            onClick={() => !revealed && setSelectedOption(opt)}
                        >
                            <span className="mcq-opt__letter">{letter}</span>
                            <span className="mcq-opt__text">{opt}</span>
                            {revealed && opt === item.correctAnswer && <span className="mcq-opt__status">✓ Correct</span>}
                            {revealed && isSelected && opt !== item.correctAnswer && <span className="mcq-opt__status">✕ Incorrect</span>}
                        </div>
                    );
                })}
            </div>

            <div className="mcq-card__footer">
                {!revealed ? (
                    <button
                        type="button"
                        className="button primary-button"
                        onClick={() => selectedOption && setRevealed(true)}
                        disabled={!selectedOption}
                    >
                        Check Answer
                    </button>
                ) : (
                    <div className="mcq-explanation-box">
                        <span className={`mcq-result-badge ${isCorrect ? 'mcq-result-badge--correct' : 'mcq-result-badge--wrong'}`}>
                            {isCorrect ? '✓ Correct Answer!' : '✕ Needs Review'}
                        </span>
                        <p>{item.explanation}</p>
                        {item.resource && (
                            <span className="mcq-resource-tag">Resource: {item.resource}</span>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

// ── Behavioral Question Card (Simple Interview Coach Format) ─────────────────
const BehavioralCard = ({ item, index }) => {
    const [open, setOpen] = useState(false);

    const asking = item.whatTheyAreAsking || item.intention;
    const thinking = item.howToThink || item.howToAnswer;

    // STAR Breakdown resolution
    const star = item.starBreakdown || {
        situation: item.situation,
        task: item.task,
        action: item.action,
        result: item.result
    };
    const hasStarData = Boolean(star.situation || star.task || star.action || star.result);

    const fullExample = item.realWorldExample || item.interviewAnswer || item.answer;
    const naturalSpoken = item.howToSayIt || item.interviewAnswer;

    const defaultTemplate = item.quickTemplate || `Situation: I was working on [project/coursework]...
Task: I needed to [specific goal or challenge]...
Action: I [exact actions and technical decisions YOU took]...
Result: As a result, [positive outcome, lessons learned, or metric].`;

    return (
        <div className={`q-card ${open ? 'q-card--open' : ''}`}>
            <div className="q-card__header" onClick={() => setOpen(o => !o)}>
                <div className="q-card__header-left">
                    <span className="q-card__index">Q{index + 1}</span>
                    <DiffBadge level={item.difficulty} />
                    <span className="q-card__category">STAR Method</span>
                </div>
                <h3 className="q-card__question">{item.question}</h3>
                <div className="q-card__header-right">
                    <button
                        type="button"
                        className="q-card__toggle-btn"
                        onClick={(e) => {
                            e.stopPropagation();
                            setOpen(o => !o);
                        }}
                    >
                        {open ? 'Collapse ↑' : 'View Answer Guide ↓'}
                    </button>
                    <span className={`q-card__chevron ${open ? 'q-card__chevron--open' : ''}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
                    </span>
                </div>
            </div>

            {open && (
                <div className="q-card__body">
                    {/* 1. WHAT ARE THEY REALLY ASKING? */}
                    {asking && (
                        <div className="coach-section">
                            <div className="coach-section__header">
                                <span className="coach-tag coach-tag--intention">🎯 WHAT ARE THEY REALLY ASKING?</span>
                            </div>
                            <p className="coach-body-text">{asking}</p>
                        </div>
                    )}

                    {/* 2. HOW SHOULD I THINK ABOUT IT? */}
                    {thinking && (
                        <div className="coach-section">
                            <div className="coach-section__header">
                                <span className="coach-tag coach-tag--thinking">🧠 HOW SHOULD I THINK ABOUT IT?</span>
                            </div>
                            <div className="coach-realworld-box">
                                <p>{thinking}</p>
                            </div>
                        </div>
                    )}

                    {/* 3. STAR IN SIMPLE WORDS */}
                    {hasStarData && (
                        <div className="coach-section">
                            <div className="coach-section__header">
                                <span className="coach-tag coach-tag--star">⭐ STAR IN SIMPLE WORDS</span>
                            </div>
                            <div className="coach-star-grid">
                                {star.situation && (
                                    <div className="star-card star-card--s">
                                        <div className="star-card__header">
                                            <span className="star-letter">S</span>
                                            <div>
                                                <span className="star-title">Situation</span>
                                                <span className="star-sub">What was happening?</span>
                                            </div>
                                        </div>
                                        <p>{star.situation}</p>
                                    </div>
                                )}
                                {star.task && (
                                    <div className="star-card star-card--t">
                                        <div className="star-card__header">
                                            <span className="star-letter">T</span>
                                            <div>
                                                <span className="star-title">Task</span>
                                                <span className="star-sub">What did you need to do?</span>
                                            </div>
                                        </div>
                                        <p>{star.task}</p>
                                    </div>
                                )}
                                {star.action && (
                                    <div className="star-card star-card--a">
                                        <div className="star-card__header">
                                            <span className="star-letter">A</span>
                                            <div>
                                                <span className="star-title">Action</span>
                                                <span className="star-sub">What exactly did YOU do?</span>
                                            </div>
                                        </div>
                                        <p>{star.action}</p>
                                    </div>
                                )}
                                {star.result && (
                                    <div className="star-card star-card--r">
                                        <div className="star-card__header">
                                            <span className="star-letter">R</span>
                                            <div>
                                                <span className="star-title">Result</span>
                                                <span className="star-sub">What happened in the end?</span>
                                            </div>
                                        </div>
                                        <p>{star.result}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* 4. SIMPLE GROUNDED EXAMPLE */}
                    {item.simpleExample && (
                        <div className="coach-section">
                            <div className="coach-section__header">
                                <span className="coach-tag coach-tag--example">💬 SIMPLE GROUNDED EXAMPLE</span>
                                <CopyButton text={item.simpleExample} />
                            </div>
                            <p className="coach-body-text">{item.simpleExample}</p>
                        </div>
                    )}

                    {/* 5. REAL-WORLD INTERVIEW EXAMPLE */}
                    {fullExample && (
                        <div className="coach-section">
                            <div className="coach-section__header">
                                <span className="coach-tag coach-tag--realworld">🌍 REAL-WORLD INTERVIEW EXAMPLE</span>
                                <CopyButton text={fullExample} />
                            </div>
                            <div className="coach-realworld-box">
                                <p style={{ whiteSpace: 'pre-line' }}>{fullExample}</p>
                            </div>
                        </div>
                    )}

                    {/* 6. HOW TO SAY IT NATURALLY */}
                    {naturalSpoken && naturalSpoken !== fullExample && (
                        <div className="coach-section coach-section--spoken">
                            <div className="coach-section__header">
                                <span className="coach-tag coach-tag--speech">🎤 HOW TO SAY IT NATURALLY</span>
                                <CopyButton text={naturalSpoken} />
                            </div>
                            <div className="coach-speech-box">
                                <span className="quote-icon">“</span>
                                <p className="speech-text">{naturalSpoken}</p>
                            </div>
                        </div>
                    )}

                    {/* 7. COMMON MISTAKES */}
                    {item.commonMistakes?.length > 0 && (
                        <div className="coach-section">
                            <div className="coach-section__header">
                                <span className="coach-tag coach-tag--mistakes">⚠ COMMON MISTAKES TO AVOID</span>
                            </div>
                            <ul className="coach-mistakes-list">
                                {item.commonMistakes.map((m, i) => (
                                    <li key={i}>
                                        <span className="mistake-bullet">✕</span>
                                        <span>{m}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* 8. FOLLOW-UP QUESTIONS */}
                    {item.followUpQuestions?.length > 0 && (
                        <div className="coach-section">
                            <div className="coach-section__header">
                                <span className="coach-tag coach-tag--followup">➡ FOLLOW-UP QUESTIONS</span>
                            </div>
                            <div className="coach-followup-list">
                                {item.followUpQuestions.map((f, i) => (
                                    <div key={i} className="coach-followup-item">
                                        <span className="followup-num">{i + 1}</span>
                                        <div className="followup-content">
                                            <p className="followup-text">{f}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* 9. QUICK STAR TEMPLATE */}
                    <div className="coach-section">
                        <div className="coach-section__header">
                            <span className="coach-tag coach-tag--template">📝 QUICK STAR TEMPLATE</span>
                            <CopyButton text={defaultTemplate} />
                        </div>
                        <div className="coach-template-box">
                            <pre><code>{defaultTemplate}</code></pre>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// ── Helper to link JD Requirement to 15-Day Roadmap Day ──────────────────────
const getRoadmapDayForRequirement = (reqName, plan = []) => {
    if (!reqName || !plan || plan.length === 0) return null;
    const lower = reqName.toLowerCase();

    // Look for exact or partial keyword match in roadmap focus or tasks
    for (const day of plan) {
        const dayFocus = (day.focus || '').toLowerCase();
        const dayTasks = (day.tasks || []).join(' ').toLowerCase();

        if (dayFocus.includes(lower) || dayTasks.includes(lower)) {
            return day.day;
        }
        // Sub-keyword matches
        if ((lower.includes('rag') || lower.includes('retrieval')) && (dayFocus.includes('rag') || dayTasks.includes('rag'))) return day.day;
        if ((lower.includes('vector') || lower.includes('pinecone')) && (dayFocus.includes('vector') || dayTasks.includes('vector') || dayTasks.includes('database'))) return day.day;
        if ((lower.includes('docker') || lower.includes('container')) && (dayFocus.includes('docker') || dayTasks.includes('docker') || dayTasks.includes('deployment'))) return day.day;
        if ((lower.includes('fastapi') || lower.includes('flask') || lower.includes('api')) && (dayFocus.includes('api') || dayTasks.includes('api') || dayTasks.includes('flask'))) return day.day;
        if ((lower.includes('sql') || lower.includes('database')) && (dayFocus.includes('database') || dayTasks.includes('sql') || dayTasks.includes('nosql'))) return day.day;
        if ((lower.includes('testing') || lower.includes('debugging')) && (dayFocus.includes('test') || dayTasks.includes('test'))) return day.day;
        if ((lower.includes('machine learning') || lower.includes('ml')) && (dayFocus.includes('machine learning') || dayTasks.includes('model') || dayTasks.includes('evaluation'))) return day.day;
    }
    return null;
};

// ── Standardized Requirement / Gap Detail Card Component ──────────────────────
const RequirementDetailCard = ({
    title,
    status = 'MISSING',
    type = 'SKILL',
    evidence,
    whyItMatters,
    gap,
    howToImprove,
    resources = [],
    action, // { label, onClick }
    shortSummary,
    index,
    severity,
    priority,
    learningTime,
    relatedRequirements = []
}) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const normalizedStatus = (status || 'MISSING').toUpperCase();
    const statusClass = normalizedStatus.toLowerCase().replace(/_/g, '-');
    const statusIcon = normalizedStatus === 'PRESENT' ? '✓'
        : normalizedStatus === 'PARTIALLY_DEMONSTRATED' ? '~'
        : normalizedStatus === 'NOT_DEMONSTRATED' ? '!'
        : normalizedStatus === 'MISSING' ? '✕'
        : '•';
    const statusLabel = normalizedStatus === 'PRESENT' ? 'PRESENT'
        : normalizedStatus === 'PARTIALLY_DEMONSTRATED' ? 'PARTIAL'
        : normalizedStatus === 'NOT_DEMONSTRATED' ? 'NOT DEMONSTRATED'
        : normalizedStatus === 'MISSING' ? 'MISSING'
        : status;

    const cardUid = `req-card-${(title || 'item').toLowerCase().replace(/[^a-z0-9]/g, '-')}-${index !== undefined ? index : '0'}`;

    return (
        <div className={`req-detail-card req-detail-card--${statusClass} ${severity ? `req-detail-card--severity-${severity}` : ''} ${isExpanded ? 'req-detail-card--expanded' : 'req-detail-card--collapsed'}`}>
            
            {/* Top Header: Title, Status Badge, Type */}
            <div className="req-detail-card__header">
                <div className="req-detail-card__title-wrap">
                    {index !== undefined && (
                        <span className="req-detail-card__index">{String(index + 1).padStart(2, '0')}</span>
                    )}
                    <div>
                        <h4 className="req-detail-card__title">{title}</h4>
                        <div className="req-detail-card__tags-row">
                            <span className="req-detail-card__type-pill">{type}</span>
                            {priority && <span className="req-detail-card__priority-pill">{priority} Priority</span>}
                            {learningTime && <span className="req-detail-card__time-pill">⏱ {learningTime}</span>}
                        </div>
                    </div>
                </div>

                <div className="req-detail-card__status-col">
                    <span className={`status-badge status-badge--${statusClass}`}>
                        <span className="status-badge__icon">{statusIcon}</span> {statusLabel}
                    </span>
                </div>
            </div>

            {/* Collapsed State: 1-Line Summary + Expand Button */}
            {!isExpanded && (
                <div className="req-detail-card__collapsed-summary">
                    <p className="collapsed-summary-text">{shortSummary || evidence || whyItMatters || 'No additional summary available.'}</p>
                    <button
                        type="button"
                        className="req-expand-btn"
                        onClick={() => setIsExpanded(true)}
                        aria-expanded={false}
                        aria-controls={cardUid}
                    >
                        Expand ↓
                    </button>
                </div>
            )}

            {/* Expanded State: 6-Section Visual Hierarchy */}
            {isExpanded && (
                <div id={cardUid} className="req-detail-card__expanded-content">
                    
                    <div className="req-detail-card__toggle-row">
                        <button
                            type="button"
                            className="req-expand-btn req-expand-btn--collapse"
                            onClick={() => setIsExpanded(false)}
                            aria-expanded={true}
                            aria-controls={cardUid}
                        >
                            Collapse ↑
                        </button>
                    </div>

                    <div className="req-detail-card__divider" />

                    {/* 1. EVIDENCE */}
                    {evidence && (
                        <div className="req-expanded-section">
                            <span className="section-label">EVIDENCE</span>
                            <div className="section-divider" />
                            <p className="section-content">{evidence}</p>
                        </div>
                    )}

                    {/* 2. WHY IT MATTERS */}
                    {whyItMatters && (
                        <div className="req-expanded-section">
                            <span className="section-label">WHY IT MATTERS</span>
                            <div className="section-divider" />
                            <p className="section-content">{whyItMatters}</p>
                        </div>
                    )}

                    {/* 3. GAP */}
                    {gap && (
                        <div className="req-expanded-section">
                            <span className="section-label">GAP</span>
                            <div className="section-divider" />
                            <p className="section-content">{gap}</p>
                        </div>
                    )}

                    {/* 4. HOW TO IMPROVE */}
                    {howToImprove && (
                        <div className="req-expanded-section">
                            <span className="section-label">HOW TO IMPROVE</span>
                            <div className="section-divider" />
                            <p className="section-content">{howToImprove}</p>
                        </div>
                    )}

                    {/* 5. RESOURCES */}
                    {resources && resources.length > 0 && (
                        <div className="req-expanded-section">
                            <span className="section-label">RESOURCES</span>
                            <div className="section-divider" />
                            <div className="req-resource-pills">
                                {resources.map((res, ri) => (
                                    <span key={ri} className="req-resource-tag">
                                        📘 {res}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* 6. ACTION */}
                    {action && (
                        <div className="req-expanded-section req-expanded-section--action">
                            <span className="section-label">ACTION</span>
                            <div className="section-divider" />
                            <div className="action-button-wrap">
                                <button
                                    type="button"
                                    className="req-action-btn"
                                    onClick={action.onClick}
                                >
                                    {action.label || 'View Roadmap →'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Related JD Requirements */}
                    {relatedRequirements && relatedRequirements.length > 0 && (
                        <div className="req-expanded-section">
                            <span className="section-label">RELATED JD REQUIREMENTS</span>
                            <div className="section-divider" />
                            <div className="related-reqs-wrap">
                                {relatedRequirements.map((r, ri) => (
                                    <span key={ri} className="related-req-pill">{r}</span>
                                ))}
                            </div>
                        </div>
                    )}

                </div>
            )}

        </div>
    );
};

// ── Requirement Card (Unified Standard Implementation) ────────────────────────
const RequirementCard = ({ item, roadmapPlan = [], onNavigateToRoadmap, originLabel = 'Requirement Match' }) => {
    const title = item.requirement || item.skill || 'Requirement';
    const status = item.status || 'MISSING';
    const type = (item.type || 'SKILL').toUpperCase();
    const evidence = item.evidence || (status === 'MISSING' ? 'No evidence found in the current resume.' : null);
    const whyItMatters = item.reason || (status === 'MISSING' ? `Target role requires demonstrated experience in ${title}.` : null);
    const gap = item.gap || (status === 'PRESENT' ? 'Requirement is already demonstrated in your verified experience.' : (status === 'MISSING' ? 'No direct experience or tooling demonstrated.' : item.reason || null));
    const howToImprove = item.improvement || (status !== 'PRESENT' ? `Study key concepts and complete a targeted practical project for ${title}.` : 'Continue strengthening this skill with advanced workflows.');
    const resources = item.resources || [];
    const linkedDay = getRoadmapDayForRequirement(title, roadmapPlan);
    const action = linkedDay ? {
        label: `📘 Study Roadmap Day ${linkedDay} →`,
        onClick: () => onNavigateToRoadmap && onNavigateToRoadmap(linkedDay, originLabel)
    } : null;

    let shortSummary = '';
    if (status === 'PRESENT') {
        shortSummary = item.evidence ? (item.evidence.length > 95 ? item.evidence.slice(0, 95) + '…' : item.evidence) : 'Demonstrated in candidate resume.';
    } else if (status === 'PARTIALLY_DEMONSTRATED') {
        shortSummary = item.evidence ? `Mentioned (${item.evidence.slice(0, 60)}…), but full depth is missing.` : 'Partially demonstrated in candidate experience.';
    } else if (status === 'NOT_DEMONSTRATED') {
        shortSummary = item.reason ? (item.reason.length > 95 ? item.reason.slice(0, 95) + '…' : item.reason) : 'Related experience exists, but this specific item is not shown.';
    } else {
        shortSummary = item.reason ? (item.reason.length > 95 ? item.reason.slice(0, 95) + '…' : item.reason) : 'No supporting evidence found in current resume.';
    }

    return (
        <RequirementDetailCard
            title={title}
            status={status}
            type={type}
            evidence={evidence}
            whyItMatters={whyItMatters}
            gap={gap}
            howToImprove={howToImprove}
            resources={resources}
            action={action}
            shortSummary={shortSummary}
        />
    );
};

// ── Gap Card (Unified Standard Implementation) ────────────────────────────────
const GapCard = ({ gap, index, roadmapPlan = [], onNavigateToRoadmap }) => {
    const title = gap.skill || 'Gap Area';
    const severity = (gap.severity || 'medium').toLowerCase();
    const severityLabel = (gap.severity || 'Medium').toUpperCase();
    const type = (gap.type || 'SKILL').toUpperCase() === 'SKILL' ? 'SKILL' : 'EXPERIENCE / TASK';
    const evidence = gap.evidence || `Current candidate baseline does not fully demonstrate ${gap.skill}.`;
    const whyItMatters = gap.reason || `Essential competency for the target role responsibilities.`;
    const gapDesc = gap.gap || gap.reason || 'Experience in this area needs to be developed before applying.';
    const howToImprove = gap.improvement || null;
    const resources = gap.resources || [];
    const linkedDay = getRoadmapDayForRequirement(gap.skill, roadmapPlan);
    const action = linkedDay ? {
        label: `📘 Study Roadmap Day ${linkedDay} →`,
        onClick: () => onNavigateToRoadmap && onNavigateToRoadmap(linkedDay, 'Gaps to Improve')
    } : null;

    const shortSummary = gap.reason ? (gap.reason.length > 95 ? gap.reason.slice(0, 95) + '…' : gap.reason) : 'Skill area requiring preparation for target role.';

    return (
        <RequirementDetailCard
            title={title}
            status={gap.status || severityLabel}
            type={type}
            evidence={evidence}
            whyItMatters={whyItMatters}
            gap={gapDesc}
            howToImprove={howToImprove}
            resources={resources}
            action={action}
            shortSummary={shortSummary}
            index={index}
            severity={severity}
            priority={gap.priority}
            learningTime={gap.estimatedLearningTime}
            relatedRequirements={gap.relatedRequirements}
        />
    );
};

// ── Roadmap Day Card ─────────────────────────────────────────────────────────
const RoadMapDay = ({
    day,
    defaultOpen = false,
    isHighlighted = false,
    isJourneyActive = false,
    isCompleted = false,
    isCurrentDay = false,
    completedTasks = [],
    onCompleteDay,
    onToggleTask,
    onStartJourney
}) => {
    const [open, setOpen] = useState(defaultOpen);

    useEffect(() => {
        if (defaultOpen || isCurrentDay) {
            setOpen(true);
        }
    }, [defaultOpen, isCurrentDay]);

    const totalTasks = day.tasks?.length || 0;
    const completedCount = completedTasks.length;

    return (
        <div id={`roadmap-day-${day.day}`} className={`roadmap-day-card ${isHighlighted ? 'roadmap-day-card--highlighted' : ''} ${isCompleted ? 'roadmap-day-card--completed' : ''} ${isCurrentDay ? 'roadmap-day-card--current' : ''}`}>
            <div className="roadmap-day-header" onClick={() => setOpen(o => !o)}>
                <div className="day-badge-col">
                    <span className="day-num">DAY {day.day}</span>
                    <DiffBadge level={day.difficulty} />
                    {isCompleted && <span className="day-status-pill day-status-pill--completed">✓ Completed</span>}
                    {isCurrentDay && !isCompleted && <span className="day-status-pill day-status-pill--current">→ In Progress</span>}
                </div>
                <div className="day-main-info">
                    <h3 className="day-focus-title">{day.focus}</h3>
                    <div className="day-meta-row">
                        {day.estimatedStudyTime && <span className="day-study-time">⏱ {day.estimatedStudyTime}</span>}
                        {isJourneyActive && totalTasks > 0 && (
                            <span className="day-task-count">
                                📋 {completedCount}/{totalTasks} Tasks Done
                            </span>
                        )}
                    </div>
                </div>
                <span className={`q-card__chevron ${open ? 'q-card__chevron--open' : ''}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
                </span>
            </div>

            {open && (
                <div className="roadmap-day-body">
                    {day.tasks?.length > 0 && (
                        <div className="roadmap-section">
                            <span className="section-label">Study Tasks & Practice Actions</span>
                            <ul className="roadmap-tasks-list">
                                {day.tasks.map((t, i) => {
                                    const isDone = completedTasks.includes(i);
                                    return (
                                        <li
                                            key={i}
                                            className={`roadmap-task-item ${isJourneyActive ? 'roadmap-task-item--interactive' : ''} ${isDone ? 'roadmap-task-item--done' : ''}`}
                                            onClick={() => isJourneyActive && onToggleTask && onToggleTask(day.day, i, completedTasks)}
                                        >
                                            {isJourneyActive ? (
                                                <input
                                                    type="checkbox"
                                                    checked={isDone}
                                                    onChange={() => {}}
                                                    className="roadmap-task-checkbox"
                                                />
                                            ) : (
                                                <span className="task-bullet-dot">•</span>
                                            )}
                                            <span className="task-label-text">{t}</span>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    )}
                    {day.expectedOutcome && (
                        <div className="roadmap-section">
                            <span className="section-label">Expected Competency Outcome</span>
                            <p className="outcome-text">✓ {day.expectedOutcome}</p>
                        </div>
                    )}
                    {day.resources?.length > 0 && (
                        <div className="roadmap-section">
                            <span className="section-label">Resources</span>
                            <ul className="roadmap-resources-list">
                                {day.resources.map((r, i) => <li key={i}>{r}</li>)}
                            </ul>
                        </div>
                    )}

                    {/* Day Action Footer */}
                    <div className="roadmap-day-footer-action">
                        {!isJourneyActive ? (
                            <button
                                type="button"
                                className="button primary-button btn-day-action"
                                onClick={(e) => { e.stopPropagation(); onStartJourney && onStartJourney(); }}
                            >
                                🎯 Start Learning Journey to Track Day {day.day}
                            </button>
                        ) : isCompleted ? (
                            <div className="day-completed-banner">
                                <span>✓ Day {day.day} Completed</span>
                            </div>
                        ) : (
                            <button
                                type="button"
                                className="button primary-button btn-day-action"
                                onClick={(e) => { e.stopPropagation(); onCompleteDay && onCompleteDay(day.day, completedTasks); }}
                            >
                                ✓ Mark Day {day.day} Complete
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

// ── ATS Section ──────────────────────────────────────────────────────────────
const AtsSection = ({ ats, atsStatus, onRetry, isRetrying }) => {
    if (atsStatus === 'ATS_PENDING' || atsStatus === 'ATS_GENERATING') {
        return (
            <div className="ats-loading-card">
                <div className="ats-spinner" />
                <h3>Analyzing ATS Keyword Compatibility</h3>
                <p>Comparing your resume keywords with job description requirements...</p>
            </div>
        );
    }

    if (atsStatus === 'ATS_FAILED') {
        return (
            <div className="ats-loading-card">
                <span className="ats-failed-icon">⚠️</span>
                <h3>ATS Analysis Unavailable</h3>
                <p>We encountered an issue analyzing ATS compatibility. You can retry safely.</p>
                <button type="button" className="button primary-button ats-retry-btn" onClick={onRetry} disabled={isRetrying}>
                    {isRetrying ? 'Retrying...' : 'Retry ATS Analysis'}
                </button>
            </div>
        );
    }

    if (!ats) return <p className="empty-state">ATS Analysis is not available for this report.</p>;

    return (
        <div className="ats-tab-content">
            <div className="ats-score-hero">
                <div className="ats-score-ring" style={{
                    borderColor: ats.atsScore >= 80 ? '#22C55E' : ats.atsScore >= 60 ? '#F59E0B' : '#EF4444'
                }}>
                    <span className="ats-score-num">{ats.atsScore}</span>
                    <span className="ats-score-pct">%</span>
                </div>
                <div className="ats-score-meta">
                    <h3>ATS Compatibility Score</h3>
                    <p>Calculated keyword match and formatting readiness for enterprise applicant tracking systems.</p>
                </div>
            </div>

            <div className="ats-grid-2col">
                <div className="ats-card">
                    <h4>Matched Keywords</h4>
                    <div className="ats-tags">
                        {ats.keywordMatch?.map((k, i) => (
                            <span key={i} className="skill-tag skill-tag--low">{k}</span>
                        ))}
                    </div>
                </div>

                <div className="ats-card">
                    <h4>Missing Critical Keywords</h4>
                    <div className="ats-tags">
                        {ats.missingKeywords?.map((k, i) => (
                            <span key={i} className="skill-tag skill-tag--high">{k}</span>
                        ))}
                    </div>
                </div>

                <div className="ats-card">
                    <h4>Resume Strengths</h4>
                    <ul className="ats-bullet-list">
                        {ats.resumeStrengths?.map((s, i) => <li key={i}>{s}</li>)}
                    </ul>
                </div>

                <div className="ats-card">
                    <h4>Areas for Resume Improvement</h4>
                    <ul className="ats-bullet-list">
                        {ats.resumeWeaknesses?.map((w, i) => <li key={i}>{w}</li>)}
                    </ul>
                </div>
            </div>

            {ats.improvementSuggestions?.length > 0 && (
                <div className="ats-card" style={{ marginTop: '1rem' }}>
                    <h4>ATS Tailoring Suggestions</h4>
                    <ul className="ats-bullet-list">
                        {ats.improvementSuggestions.map((s, i) => <li key={i}>{s}</li>)}
                    </ul>
                </div>
            )}
        </div>
    );
};

// ── Collapsible Chip Group Helper ─────────────────────────────────────────────
const CollapsibleChipList = ({ title, items, tagClass, initialLimit = 8 }) => {
    const [expanded, setExpanded] = useState(false);
    if (!items || items.length === 0) return null;

    const visibleItems = expanded ? items : items.slice(0, initialLimit);
    const hasMore = items.length > initialLimit;

    return (
        <div className="overview-group-card">
            <div className="overview-group-card__header">
                <h4>{title}</h4>
                <span className="overview-group-card__count">{items.length}</span>
            </div>
            <div className="ats-tags">
                {visibleItems.map((item, i) => (
                    <span key={i} className={`skill-tag ${tagClass}`}>
                        {item}
                    </span>
                ))}
            </div>
            {hasMore && (
                <button
                    type="button"
                    className="chip-expand-btn"
                    onClick={() => setExpanded(e => !e)}
                >
                    {expanded ? 'Show Less' : `+${items.length - initialLimit} More`}
                </button>
            )}
        </div>
    );
};

// ── Requirement Detail Panel (Reusable for Table Expansion) ───────────────────
const RequirementDetailPanel = ({ item, roadmapPlan = [], onNavigateToRoadmap, originLabel = 'Requirement Match' }) => {
    const title = item.requirement || item.skill || 'Requirement';
    const status = item.status || 'MISSING';
    const evidence = item.evidence || (status === 'MISSING' ? 'No evidence found in the current resume.' : null);
    const whyItMatters = item.reason || (status === 'MISSING' ? `Target role requires demonstrated experience in ${title}.` : null);
    const gap = item.gap || (status === 'PRESENT' ? 'Requirement is already demonstrated in your verified experience.' : (status === 'MISSING' ? 'No direct experience or tooling demonstrated.' : item.reason || null));
    const howToImprove = item.improvement || (status !== 'PRESENT' ? `Study key concepts and complete a targeted practical project for ${title}.` : 'Continue strengthening this skill with advanced workflows.');
    const resources = item.resources || [];
    const linkedDay = getRoadmapDayForRequirement(title, roadmapPlan);
    const action = linkedDay ? {
        label: `📘 Study Roadmap Day ${linkedDay} →`,
        onClick: () => onNavigateToRoadmap && onNavigateToRoadmap(linkedDay, originLabel)
    } : null;

    return (
        <div className="req-table-detail-panel">
            <div className="req-detail-card__expanded-content">
                {/* 1. EVIDENCE */}
                {evidence && (
                    <div className="req-expanded-section">
                        <span className="section-label">EVIDENCE</span>
                        <div className="section-divider" />
                        <p className="section-content">{evidence}</p>
                    </div>
                )}

                {/* 2. WHY IT MATTERS */}
                {whyItMatters && (
                    <div className="req-expanded-section">
                        <span className="section-label">WHY IT MATTERS</span>
                        <div className="section-divider" />
                        <p className="section-content">{whyItMatters}</p>
                    </div>
                )}

                {/* 3. GAP */}
                {gap && (
                    <div className="req-expanded-section">
                        <span className="section-label">GAP</span>
                        <div className="section-divider" />
                        <p className="section-content">{gap}</p>
                    </div>
                )}

                {/* 4. HOW TO IMPROVE */}
                {howToImprove && (
                    <div className="req-expanded-section">
                        <span className="section-label">HOW TO IMPROVE</span>
                        <div className="section-divider" />
                        <p className="section-content">{howToImprove}</p>
                    </div>
                )}

                {/* 5. RESOURCES */}
                {resources && resources.length > 0 && (
                    <div className="req-expanded-section">
                        <span className="section-label">RESOURCES</span>
                        <div className="section-divider" />
                        <div className="req-resource-pills">
                            {resources.map((res, ri) => (
                                <span key={ri} className="req-resource-tag">
                                    📘 {res}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* 6. ACTION */}
                {action && (
                    <div className="req-expanded-section req-expanded-section--action">
                        <span className="section-label">ACTION</span>
                        <div className="section-divider" />
                        <div className="action-button-wrap">
                            <button
                                type="button"
                                className="req-action-btn"
                                onClick={action.onClick}
                            >
                                {action.label}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// ── Standardized Requirement Table Component (Fixed CSS Grid Tracks) ──────────
const RequirementTable = ({ items = [], roadmapPlan = [], onNavigateToRoadmap }) => {
    const [expandedIndex, setExpandedIndex] = useState(null);

    const handleToggle = (index) => {
        setExpandedIndex(prev => prev === index ? null : index);
    };

    if (!items || items.length === 0) return null;

    return (
        <div className="requirements-table-wrapper">
            <div className="requirements-table" role="table" aria-label="Requirement Match Breakdown">
                
                {/* Fixed Grid Header */}
                <div className="requirements-table__header" role="row">
                    <div className="table-th table-th--req" role="columnheader">Requirement</div>
                    <div className="table-th table-th--type" role="columnheader">Type</div>
                    <div className="table-th table-th--status" role="columnheader">Status</div>
                    <div className="table-th table-th--action" role="columnheader">Evidence / Action</div>
                </div>

                {/* Rows with Identical Fixed Grid Tracks */}
                <div className="requirements-table__body" role="rowgroup">
                    {items.map((item, idx) => {
                        const isExpanded = expandedIndex === idx;
                        const reqName = item.requirement || item.skill || 'Requirement';
                        const normalizedStatus = (item.status || 'MISSING').toUpperCase();
                        const statusClass = normalizedStatus.toLowerCase().replace(/_/g, '-');
                        const statusIcon = normalizedStatus === 'PRESENT' ? '✓'
                            : normalizedStatus === 'PARTIALLY_DEMONSTRATED' ? '~'
                            : normalizedStatus === 'NOT_DEMONSTRATED' ? '!'
                            : normalizedStatus === 'MISSING' ? '✕'
                            : '•';
                        const statusLabel = normalizedStatus === 'PRESENT' ? 'PRESENT'
                            : normalizedStatus === 'PARTIALLY_DEMONSTRATED' ? 'PARTIAL'
                            : normalizedStatus === 'NOT_DEMONSTRATED' ? 'NOT DEMONSTRATED'
                            : normalizedStatus === 'MISSING' ? 'MISSING'
                            : item.status;
                        const typeLabel = (item.type || 'SKILL').toUpperCase();

                        return (
                            <div
                                key={idx}
                                className={`requirements-table__row-wrap ${isExpanded ? 'requirements-table__row-wrap--expanded' : ''} req-row--${statusClass}`}
                                role="row"
                            >
                                <div className="requirements-table__row-main">
                                    <div className="table-td table-td--req" role="cell">
                                        <span className="req-name-text">{reqName}</span>
                                    </div>

                                    <div className="table-td table-td--type" role="cell">
                                        <span className="table-type-badge">{typeLabel}</span>
                                    </div>

                                    <div className="table-td table-td--status" role="cell">
                                        <span className={`status-badge status-badge--${statusClass}`}>
                                            <span className="status-badge__icon">{statusIcon}</span> {statusLabel}
                                        </span>
                                    </div>

                                    <div className="table-td table-td--action" role="cell">
                                        <button
                                            type="button"
                                            className={`table-action-btn ${isExpanded ? 'table-action-btn--active' : ''}`}
                                            onClick={() => handleToggle(idx)}
                                            aria-expanded={isExpanded}
                                        >
                                            {isExpanded ? 'Hide details ↑' : 'View details →'}
                                        </button>
                                    </div>
                                </div>

                                {/* Full-Width Expansion Detail Panel */}
                                {isExpanded && (
                                    <RequirementDetailPanel
                                        item={item}
                                        roadmapPlan={roadmapPlan}
                                        onNavigateToRoadmap={onNavigateToRoadmap}
                                        originLabel="Requirement Match"
                                    />
                                )}
                            </div>
                        );
                    })}
                </div>

            </div>
        </div>
    );
};

// ── Dual Resume Output System Component (JD-Optimized Mode) ───────────────────
const DualResumeSection = ({ report, onDownloadPdf, onNavigateTab }) => {
    const [subTab, setSubTab] = useState('tailored'); // 'tailored' | 'blueprint'
    const [blueprintFilter, setBlueprintFilter] = useState('ALL');
    const [isDownloading, setIsDownloading] = useState(false);

    const handleDownloadClick = async () => {
        if (isDownloading) return;
        try {
            setIsDownloading(true);
            if (onDownloadPdf) {
                await onDownloadPdf();
            }
        } catch (err) {
            console.error("PDF download error:", err);
            alert("Unable to generate your JD-ready resume. Please try again.");
        } finally {
            setIsDownloading(false);
        }
    };

    const classificationList = report?.skillClassification || [];
    const roadmapPlan = report?.preparationPlan || [];

    // Filtered lists for Blueprint
    const presentItems = classificationList.filter(i => i.status === 'PRESENT');
    const partialItems = classificationList.filter(i => i.status === 'PARTIALLY_DEMONSTRATED');
    const notDemonstratedItems = classificationList.filter(i => i.status === 'NOT_DEMONSTRATED');
    const missingItems = classificationList.filter(i => i.status === 'MISSING');

    const filteredBlueprintItems = classificationList.filter(item => {
        if (blueprintFilter === 'ALL') return true;
        return item.status === blueprintFilter;
    });

    const [expandedProjects, setExpandedProjects] = useState({});
    const [projectStatuses, setProjectStatuses] = useState({});

    const toggleProjectExpanded = (num) => {
        setExpandedProjects(prev => ({
            ...prev,
            [num]: !prev[num]
        }));
    };

    const handleUpdateProjectStatus = (num, status) => {
        setProjectStatuses(prev => ({
            ...prev,
            [num]: status
        }));
    };

    // Dynamic role-specific projects derived from report or smart fallback
    const { whyTheseProjects, projects: recommendedProjects } = useMemo(() => {
        if (Array.isArray(report?.recommendedProjects) && report.recommendedProjects.length >= 4) {
            return {
                whyTheseProjects: report.whyTheseProjects || `These 4 projects were curated specifically for the ${report.selectedTrackTitle || report.title || "target role"} to turn key JD gaps into verifiable evidence.`,
                projects: report.recommendedProjects
            };
        }

        const title = (report?.selectedTrackTitle || report?.selectedTrack || report?.title || "").toLowerCase();
        const gaps = classificationList?.filter(i => i.status === 'MISSING' || i.status === 'NOT_DEMONSTRATED' || i.status === 'PARTIALLY_DEMONSTRATED') || [];
        const gapNames = gaps.map(g => g.requirement || g.skill).filter(Boolean);
        const topGaps = gapNames.slice(0, 3).join(', ') || 'production architecture, automated testing, and deployment';
        const roleName = report?.selectedTrackTitle || report?.selectedTrack || report?.title || "Target Role";

        let projects = [];

        if (title.includes('data') || title.includes('analyst') || title.includes('bi ') || title.includes('analytics') || title.includes('sql')) {
            projects = [
                {
                    num: "01",
                    name: "Sales Intelligence & Revenue Analytics Platform",
                    icon: "📊",
                    targetRole: roleName,
                    realWorldProblem: "Sales leadership struggles to identify high-value customer segments and revenue leakage across product lines due to fragmented transactional datasets.",
                    whatYouBuild: "An end-to-end sales performance analytics platform that cleans raw transactions, calculates revenue KPIs, and visualizes cohort retention trends.",
                    responsibilities: [
                        "Design SQL aggregation pipeline extracting revenue, MRR, and churn metrics",
                        "Perform data cleaning and missing value imputation using Pandas and NumPy",
                        "Build customer segmentation model using RFM (Recency, Frequency, Monetary) analysis",
                        "Create interactive dashboard visualizer displaying drill-down KPI charts"
                    ],
                    skills: ["Python", "Pandas", "SQL", "Data Cleaning", "Data Visualization", "Exploratory Data Analysis"],
                    whyThisProject: `Directly targets key data analytics requirements for data modeling and SQL aggregation, addressing current gaps in ${gapNames.slice(0, 2).join(', ') || 'analytical reporting'}.`,
                    suggestedFeatures: [
                        "Automated CSV/SQL data ingestion and schema validation pipeline",
                        "Monthly recurring revenue and customer lifetime value (CLV) calculation",
                        "Customer retention cohort matrix visualization",
                        "Automated anomaly detection flagging unusual revenue drops"
                    ],
                    resumeBoost: "Built an end-to-end sales intelligence analytics pipeline with Pandas and SQL, identifying top revenue-driving customer cohorts. Measure query processing time and record actual benchmark after testing.",
                    expectedEvidence: ["GitHub repository with clean data pipelines", "Jupyter notebook with EDA insights", "Interactive dashboard demo", "Data dictionary documentation"],
                    estimatedDuration: "5-7 days",
                    difficulty: "Intermediate",
                    jdRequirementsCovered: ["SQL Querying", "Data Analysis", "Reporting"],
                    candidateGapsAddressed: gapNames.slice(0, 2),
                    roadmapConnections: ["Day 1-4 SQL & Data Modeling", "Day 5-8 Visualization & Insights"],
                    canonicalSkillIds: ["python", "pandas", "sql", "data-analysis"]
                },
                {
                    num: "02",
                    name: "Predictive Customer Churn Analysis & Risk Scoring",
                    icon: "📉",
                    targetRole: roleName,
                    realWorldProblem: "Customer success teams lack proactive indicators to identify subscribers at risk of cancellation before the billing renewal date.",
                    whatYouBuild: "A customer churn risk scoring engine that analyzes behavioral usage patterns and flags accounts with high cancellation probabilities.",
                    responsibilities: [
                        "Engineer customer engagement features from usage and ticketing logs",
                        "Perform statistical correlation and feature importance evaluation",
                        "Train and validate classification models to compute risk probabilities",
                        "Generate actionable churn risk summary reports for account managers"
                    ],
                    skills: ["Python", "Statistics", "Feature Engineering", "Scikit-Learn", "Matplotlib / Seaborn", "Business Analytics"],
                    whyThisProject: `Addresses core responsibility for business insight extraction and statistical feature analysis required by ${roleName}.`,
                    suggestedFeatures: [
                        "Multi-variable feature engineering pipeline aggregating customer activity",
                        "Correlation heatmap and distribution visualizer for risk indicators",
                        "Predictive risk probability scoring with threshold calibration",
                        "Automated export of high-risk customer accounts with top contributing factors"
                    ],
                    resumeBoost: "Engineered a predictive customer churn analysis pipeline extracting behavioral risk indicators from transactional logs. Measure classification ROC-AUC and record actual metric after testing.",
                    expectedEvidence: ["GitHub repository", "Statistical validation report", "Feature importance breakdown", "Interactive risk dashboard"],
                    estimatedDuration: "6-8 days",
                    difficulty: "Intermediate",
                    jdRequirementsCovered: ["Statistical Analysis", "Business Intelligence"],
                    candidateGapsAddressed: gapNames.slice(2, 4),
                    roadmapConnections: ["Day 5-9 Statistical Analysis", "Day 10-14 Predictive Insights"],
                    canonicalSkillIds: ["python", "statistics", "feature-engineering"]
                },
                {
                    num: "03",
                    name: "Inventory Demand Forecasting & Replenishment Pipeline",
                    icon: "📦",
                    targetRole: roleName,
                    realWorldProblem: "Retail supply chain managers experience frequent stockouts and excess holding costs because historical sales trends are analyzed manually in static spreadsheets.",
                    whatYouBuild: "An automated time-series demand forecasting pipeline that estimates daily product inventory requirements and generates automated reorder recommendations.",
                    responsibilities: [
                        "Extract and aggregate multi-store historical sales data into clean time-series datasets",
                        "Calculate moving averages, seasonality patterns, and lead-time demand buffers",
                        "Generate automated stock reorder trigger thresholds based on safety stock formulas",
                        "Export scheduled summary forecasts to operational management dashboards"
                    ],
                    skills: ["SQL", "Time Series Analysis", "Data Modeling", "ETL Pipelines", "Tableau / Streamlit"],
                    whyThisProject: `Demonstrates strong data engineering and time-series aggregation capabilities essential for ${roleName} roles.`,
                    suggestedFeatures: [
                        "Multi-store sales data ingestion with missing date imputation",
                        "Seasonal trend decomposition and rolling demand calculation",
                        "Reorder point calculator factoring in supplier lead times",
                        "Interactive inventory health monitor visualizer"
                    ],
                    resumeBoost: "Developed an inventory demand forecasting pipeline computing safety stock thresholds and replenishment triggers from historical sales data. Measure forecast error and record actual metric after testing.",
                    expectedEvidence: ["GitHub repository", "ETL pipeline code", "Time-series validation charts", "Dashboard walkthrough video"],
                    estimatedDuration: "5-7 days",
                    difficulty: "Intermediate",
                    jdRequirementsCovered: ["ETL Data Pipelines", "Data Modeling"],
                    candidateGapsAddressed: gapNames.slice(1, 3),
                    roadmapConnections: ["Day 3-6 ETL & Data Modeling", "Day 9-12 Business Insights"],
                    canonicalSkillIds: ["sql", "etl-pipelines", "data-modeling"]
                },
                {
                    num: "04",
                    name: "Marketing Multi-Channel Campaign ROI Analyzer",
                    icon: "🎯",
                    targetRole: roleName,
                    realWorldProblem: "Marketing teams waste ad spend across search, social, and email channels because they cannot accurately attribute conversions or evaluate A/B test results.",
                    whatYouBuild: "A marketing performance analytics hub that aggregates campaign ad spend, computes cost-per-acquisition (CPA), and conducts statistical A/B test significance evaluations.",
                    responsibilities: [
                        "Integrate multi-channel campaign performance data into normalized schema",
                        "Implement multi-touch attribution models (First-touch, Last-touch, Linear)",
                        "Conduct two-sample hypothesis testing for A/B marketing experiment results",
                        "Generate executive-ready campaign ROI visual summary reports"
                    ],
                    skills: ["Python", "Pandas", "Hypothesis Testing", "Data Storytelling", "Statistical Modeling"],
                    whyThisProject: `Provides portfolio differentiation by demonstrating applied statistical hypothesis testing and real-world business ROI modeling.`,
                    suggestedFeatures: [
                        "Multi-channel ad spend and conversion rate normalizer",
                        "Touchpoint attribution calculator comparing linear and weighted models",
                        "A/B test significance calculator computing p-values and confidence intervals",
                        "Executive KPI summary export with visual charts"
                    ],
                    resumeBoost: "Built a marketing attribution and A/B test statistical analysis tool evaluating campaign conversion rates and ROI across digital channels. Record actual statistical significance after testing.",
                    expectedEvidence: ["GitHub repository", "A/B test case study writeup", "Attribution model comparisons", "Live Streamlit demo"],
                    estimatedDuration: "4-6 days",
                    difficulty: "Beginner",
                    jdRequirementsCovered: ["Hypothesis Testing", "A/B Testing"],
                    candidateGapsAddressed: gapNames.slice(0, 2),
                    roadmapConnections: ["Day 7-10 Statistical Testing", "Day 11-15 Executive Reporting"],
                    canonicalSkillIds: ["statistics", "ab-testing", "pandas"]
                }
            ];
        } else if (title.includes('frontend') || title.includes('react') || title.includes('ui') || title.includes('web developer')) {
            projects = [
                {
                    num: "01",
                    name: "High-Performance Analytics Workspace & Visualizer",
                    icon: "⚡",
                    targetRole: roleName,
                    realWorldProblem: "Operations teams experience laggy, unresponsive browser UIs when interacting with large datasets and complex analytical dashboards in real time.",
                    whatYouBuild: "A high-performance responsive frontend workspace featuring virtualized data grids, interactive SVG/Canvas charts, and optimistic client-side caching.",
                    responsibilities: [
                        "Architect modular React component tree with clean state separation",
                        "Implement list and table virtualization for smooth 60fps rendering of 10,000+ rows",
                        "Build interactive responsive chart components with customizable filters",
                        "Optimize client bundle size using code splitting and lazy loading"
                    ],
                    skills: ["React", "TypeScript / JavaScript", "State Management", "Performance Optimization", "Responsive CSS / SCSS", "Component Architecture"],
                    whyThisProject: `Directly targets key frontend engineering requirements for scalable component architecture and UI performance optimization.`,
                    suggestedFeatures: [
                        "Virtualized infinite-scroll table with column sorting and multi-field filtering",
                        "Interactive real-time charting dashboard with dark/light theme switching",
                        "Optimistic UI updates with cached client-side rollback mechanisms",
                        "Responsive layout adhering to WCAG 2.1 AA accessibility standards"
                    ],
                    resumeBoost: "Architected a high-performance React analytics dashboard with table virtualization and optimistic state updates for responsive data exploration. Measure Lighthouse performance score and record actual result after testing.",
                    expectedEvidence: ["GitHub repository with clean component modularity", "Live deployed demo URL (Vercel/Netlify)", "Lighthouse audit screenshot", "Storybook component docs"],
                    estimatedDuration: "5-7 days",
                    difficulty: "Intermediate",
                    jdRequirementsCovered: ["React", "State Management", "UI Performance"],
                    candidateGapsAddressed: gapNames.slice(0, 2),
                    roadmapConnections: ["Day 1-4 Component Architecture", "Day 5-8 Performance & State"],
                    canonicalSkillIds: ["react", "javascript", "css", "state-management"]
                },
                {
                    num: "02",
                    name: "Collaborative Workspace with Optimistic State Sync",
                    icon: "📋",
                    targetRole: roleName,
                    realWorldProblem: "Distributed team members experience sync conflicts and poor user experience when collaborating on shared boards without immediate UI feedback.",
                    whatYouBuild: "A collaborative Kanban workspace with drag-and-drop interactions, optimistic updates, offline state persistence, and real-time event broadcasting.",
                    responsibilities: [
                        "Build accessible drag-and-drop board interface with keyboard navigation",
                        "Implement optimistic UI state transitions with automatic conflict resolution",
                        "Persist offline workspace changes in IndexedDB with background re-sync",
                        "Design custom toast notification system for collaborative action receipts"
                    ],
                    skills: ["React", "Drag-and-Drop APIs", "Client-Side Caching", "IndexedDB", "REST / WebSocket Integration", "CSS Grid"],
                    whyThisProject: `Satisfies JD requirements for modern interactive frontend workflows and complex client-side state handling.`,
                    suggestedFeatures: [
                        "Multi-column task board with smooth drag-and-drop reordering",
                        "Task detail modal with markdown description editor and tag selector",
                        "Offline mode saving edits locally and syncing when connection resumes",
                        "Activity feed displaying recent collaborator actions"
                    ],
                    resumeBoost: "Built a collaborative project board in React with drag-and-drop task workflows, optimistic UI updates, and offline IndexedDB persistence. Record actual sync response latency after testing.",
                    expectedEvidence: ["GitHub repository", "Live interactive demo", "Architecture breakdown diagram", "Unit tests for state transitions"],
                    estimatedDuration: "6-8 days",
                    difficulty: "Intermediate",
                    jdRequirementsCovered: ["Modern UI Frameworks", "Complex State Management"],
                    candidateGapsAddressed: gapNames.slice(1, 3),
                    roadmapConnections: ["Day 4-7 State & Event Handling", "Day 8-11 Offline & Storage"],
                    canonicalSkillIds: ["react", "state-management", "drag-and-drop"]
                },
                {
                    num: "03",
                    name: "Accessible Design System & Reusable Component Library",
                    icon: "🎨",
                    targetRole: roleName,
                    realWorldProblem: "Product teams ship inconsistent, inaccessible user interfaces because they lack a standardized, thoroughly tested design system of UI primitives.",
                    whatYouBuild: "A production-ready design system containing 15+ accessible UI components (Modals, Dropdowns, Tooltips, Tabs, Form Controls) with theme token architecture.",
                    responsibilities: [
                        "Design token-based styling architecture supporting light, dark, and high-contrast themes",
                        "Implement ARIA attributes and full keyboard navigation for complex composite widgets",
                        "Write automated component unit and accessibility tests with Testing Library",
                        "Publish interactive component documentation playground with live code previews"
                    ],
                    skills: ["React", "Accessibility (WCAG)", "CSS Tokens / SCSS", "Jest / Vitest", "Storybook", "Component API Design"],
                    whyThisProject: `Demonstrates elite frontend craftsmanship, accessibility compliance, and professional component library engineering.`,
                    suggestedFeatures: [
                        "15+ fully accessible component primitives with focus trap and ARIA labels",
                        "Dynamic theme token switcher supporting custom brand palettes",
                        "Form input validation system with inline accessible error announcements",
                        "Interactive Storybook playground documenting props and usage examples"
                    ],
                    resumeBoost: "Engineered an accessible React design system with 15+ WCAG-compliant UI primitives, dynamic theme tokens, and automated component test coverage. Measure automated accessibility pass rate after testing.",
                    expectedEvidence: ["GitHub repository", "Storybook documentation live deployment", "Automated test suite reports", "NPM package package.json"],
                    estimatedDuration: "5-7 days",
                    difficulty: "Intermediate",
                    jdRequirementsCovered: ["Accessibility", "Component Testing", "CSS Architecture"],
                    candidateGapsAddressed: gapNames.slice(0, 2),
                    roadmapConnections: ["Day 2-5 Accessible UI", "Day 9-13 Testing & Documentation"],
                    canonicalSkillIds: ["react", "accessibility", "testing", "css"]
                },
                {
                    num: "04",
                    name: "E-Commerce Checkout & Storefront with State Caching",
                    icon: "🛍️",
                    targetRole: roleName,
                    realWorldProblem: "Shoppers abandon carts due to slow page transitions, lost checkout form inputs during navigation, and confusing validation feedback.",
                    whatYouBuild: "A polished e-commerce product catalog and multi-step checkout workflow with instant client-side filtering, form state persistence, and responsive payment flows.",
                    responsibilities: [
                        "Build multi-category product catalog with debounced search and faceted filters",
                        "Implement multi-step checkout wizard with persistent form progress state",
                        "Build cart state management with real-time subtotal, tax, and discount calculations",
                        "Create micro-interactions and skeleton loading states for perceived performance"
                    ],
                    skills: ["React", "Form Validation", "Client State Management", "REST API Consumption", "Responsive Design"],
                    whyThisProject: `Provides portfolio differentiation with a complete, user-facing commercial product experience that recruiters immediately recognize.`,
                    suggestedFeatures: [
                        "Faceted product filtering by price range, brand, rating, and availability",
                        "Slide-over shopping bag drawer with quantity modifiers and coupon code validation",
                        "Multi-step checkout with address verification and payment simulation",
                        "Skeleton loaders and smooth animated transition states"
                    ],
                    resumeBoost: "Developed a responsive e-commerce storefront in React with faceted product filtering, persistent multi-step checkout state, and client-side form validation. Record page load metrics after testing.",
                    expectedEvidence: ["GitHub repository", "Live storefront demo", "Mobile & desktop responsive screenshots", "Component tree diagram"],
                    estimatedDuration: "4-6 days",
                    difficulty: "Beginner",
                    jdRequirementsCovered: ["Frontend Workflows", "API Integration"],
                    candidateGapsAddressed: gapNames.slice(1, 3),
                    roadmapConnections: ["Day 3-6 Form State & Filtering", "Day 7-10 Checkout Workflows"],
                    canonicalSkillIds: ["react", "javascript", "rest-apis"]
                }
            ];
        } else if (title.includes('backend') || title.includes('api') || title.includes('node') || title.includes('express')) {
            projects = [
                {
                    num: "01",
                    name: "High-Throughput Order Processing & Transaction API",
                    icon: "⚙️",
                    targetRole: roleName,
                    realWorldProblem: "E-commerce platforms experience double-charging and inventory discrepancies when concurrent checkout requests hit backend databases simultaneously.",
                    whatYouBuild: "A robust backend REST API featuring ACID database transactions, pessimistic concurrency locking, Redis caching for product inventory, and rate limiting.",
                    responsibilities: [
                        "Design normalized relational database schema with indexing on high-frequency query paths",
                        "Implement atomic transaction handling ensuring inventory deduction and order creation succeed together",
                        "Configure Redis in-memory cache to reduce database read load for popular catalog items",
                        "Build rate-limiting middleware to protect sensitive checkout endpoints from abuse"
                    ],
                    skills: ["Node.js / Express", "SQL / NoSQL", "Redis Caching", "Database Transactions", "REST API Design", "Data Validation"],
                    whyThisProject: `Directly targets key backend requirements for concurrent transaction safety, database design, and caching mechanisms.`,
                    suggestedFeatures: [
                        "Idempotent order placement endpoint preventing duplicate charges on retry",
                        "Atomic inventory reservation with rollback upon checkout cancellation",
                        "Redis caching layer with time-to-live (TTL) expiration policies",
                        "Comprehensive request validation with structured error responses"
                    ],
                    resumeBoost: "Architected a high-throughput order processing API with Node.js and SQL, implementing atomic transactions, Redis caching, and rate limiting. Measure API throughput (req/sec) and record actual benchmark after testing.",
                    expectedEvidence: ["GitHub repository with modular architecture", "Postman / OpenAPI collection", "Database schema migration scripts", "Load testing script and benchmark results"],
                    estimatedDuration: "5-7 days",
                    difficulty: "Intermediate",
                    jdRequirementsCovered: ["REST API Architecture", "Database Design", "Caching"],
                    candidateGapsAddressed: gapNames.slice(0, 2),
                    roadmapConnections: ["Day 1-4 Database Transactions", "Day 5-8 API Design & Caching"],
                    canonicalSkillIds: ["nodejs", "express", "sql", "redis", "rest-apis"]
                },
                {
                    num: "02",
                    name: "Event-Driven Notification & Webhook Dispatch Service",
                    icon: "📬",
                    targetRole: roleName,
                    realWorldProblem: "Monolithic applications experience slow response times when sending emails, SMS, and partner webhooks synchronously inside the main request cycle.",
                    whatYouBuild: "An asynchronous event-driven background worker service that ingests notification events into message queues and reliably dispatches them with retry backoffs.",
                    responsibilities: [
                        "Implement producer-consumer message queue architecture for background job execution",
                        "Build exponential backoff retry mechanism for failed third-party webhook deliveries",
                        "Design dead-letter queue (DLQ) for inspecting and replaying permanently failed events",
                        "Create status query endpoints for tracking asynchronous notification delivery lifecycle"
                    ],
                    skills: ["Node.js / Python", "Message Queues (BullMQ / RabbitMQ)", "Asynchronous Architecture", "Webhook Integration", "Error Handling"],
                    whyThisProject: `Demonstrates critical asynchronous architecture and reliable distributed message handling required by ${roleName} roles.`,
                    suggestedFeatures: [
                        "Event publishing API accepting batched notification dispatch payloads",
                        "Worker pool processing queued jobs with concurrency controls",
                        "Automated retry handler with exponential backoff and jitter",
                        "Webhook signature verification and delivery audit log"
                    ],
                    resumeBoost: "Built an event-driven notification engine with message queues and background workers, implementing exponential backoff retries and dead-letter queue handling. Record delivery throughput after testing.",
                    expectedEvidence: ["GitHub repository", "Architecture sequence diagram", "Queue worker benchmarks", "Integration test suite"],
                    estimatedDuration: "6-8 days",
                    difficulty: "Intermediate",
                    jdRequirementsCovered: ["Asynchronous Processing", "Message Queues", "System Reliability"],
                    candidateGapsAddressed: gapNames.slice(1, 3),
                    roadmapConnections: ["Day 4-7 Background Jobs", "Day 8-12 Message Queues & Retries"],
                    canonicalSkillIds: ["nodejs", "message-queues", "async-architecture"]
                },
                {
                    num: "03",
                    name: "Role-Based Authentication & Security Microservice",
                    icon: "🛡️",
                    targetRole: roleName,
                    realWorldProblem: "Enterprise applications risk data breaches when access control policies and session token invalidations are handled inconsistently across microservices.",
                    whatYouBuild: "A centralized authentication and authorization service supporting JWT signing, refresh token rotation, role-based access control (RBAC), and security middleware.",
                    responsibilities: [
                        "Implement secure password hashing with bcrypt and salted iterations",
                        "Build dual-token authentication (short-lived access token + rotating refresh token)",
                        "Design dynamic role and permission middleware verifying user access levels",
                        "Configure security headers, CORS origin whitelisting, and token blacklist revocation"
                    ],
                    skills: ["Node.js / Express", "JWT", "OAuth 2.0", "Security Best Practices", "RBAC", "Middleware Design"],
                    whyThisProject: `Directly satisfies JD requirements for production security standards, authentication flows, and authorization protocols.`,
                    suggestedFeatures: [
                        "User registration and login with email verification token workflows",
                        "Refresh token rotation mechanism detecting token reuse attempts",
                        "Granular RBAC middleware checking resource-level permissions (Admin, Editor, Viewer)",
                        "Token revocation blacklist stored with automated Redis TTL"
                    ],
                    resumeBoost: "Engineered a centralized JWT authentication service featuring refresh token rotation, role-based access control (RBAC) middleware, and token revocation. Measure auth verification overhead and record actual result after testing.",
                    expectedEvidence: ["GitHub repository", "Postman security test collection", "Authentication flow diagram", "Security audit report"],
                    estimatedDuration: "5-7 days",
                    difficulty: "Intermediate",
                    jdRequirementsCovered: ["Authentication & Security", "JWT / OAuth", "Middleware"],
                    candidateGapsAddressed: gapNames.slice(0, 2),
                    roadmapConnections: ["Day 2-5 Auth & JWT", "Day 6-9 Security & RBAC"],
                    canonicalSkillIds: ["nodejs", "jwt", "authentication", "security"]
                },
                {
                    num: "04",
                    name: "API Observability & Telemetry Monitoring Service",
                    icon: "📈",
                    targetRole: roleName,
                    realWorldProblem: "DevOps and backend teams cannot pinpoint microservice latency bottlenecks or diagnose production 500 errors without centralized telemetry logging.",
                    whatYouBuild: "An API observability and monitoring middleware package that tracks endpoint latency distributions, error rates, system memory usage, and structured logs.",
                    responsibilities: [
                        "Build lightweight request telemetry middleware capturing latency histograms and status codes",
                        "Implement structured JSON logging with correlation IDs for distributed request tracing",
                        "Expose standard Prometheus-compatible `/metrics` and `/health` endpoints",
                        "Create automated alerts that trigger when endpoint error rates exceed configurable thresholds"
                    ],
                    skills: ["Node.js", "Logging (Winston/Pino)", "Prometheus / Grafana", "Docker", "API Observability", "System Diagnostics"],
                    whyThisProject: `Provides portfolio differentiation by demonstrating production observability, telemetry instrumentation, and DevOps maturity.`,
                    suggestedFeatures: [
                        "Correlation ID injection middleware tracking requests through downstream handlers",
                        "Prometheus metrics endpoint exporting P50/P95/P99 latency percentiles",
                        "Health-check endpoint validating database and cache connectivity",
                        "Structured log aggregator with searchable log viewer dashboard"
                    ],
                    resumeBoost: "Developed an API observability service instrumenting request latency percentiles, structured JSON logging with correlation IDs, and automated health checks. Measure latency overhead and record actual metric after testing.",
                    expectedEvidence: ["GitHub repository", "Prometheus / Grafana dashboard screenshot", "Docker Compose setup", "OpenAPI spec with health schemas"],
                    estimatedDuration: "4-6 days",
                    difficulty: "Beginner",
                    jdRequirementsCovered: ["Observability & Logging", "Production Monitoring", "Docker"],
                    candidateGapsAddressed: gapNames.slice(2, 4),
                    roadmapConnections: ["Day 7-10 Logging & Metrics", "Day 11-15 Observability & Deployment"],
                    canonicalSkillIds: ["nodejs", "docker", "logging", "monitoring"]
                }
            ];
        } else {
            // Full Stack / AI / ML / General Fallback
            projects = [
                {
                    num: "01",
                    name: "Full-Stack Collaborative Workspace & Team Portal",
                    icon: "🚀",
                    targetRole: roleName,
                    realWorldProblem: "Cross-functional teams lose track of project deliverables and task dependencies when communication is scattered across disconnected chat and spreadsheet tools.",
                    whatYouBuild: "A full-stack collaborative workspace application with real-time task management, user role permissions, relational data models, and an interactive frontend dashboard.",
                    responsibilities: [
                        "Design full-stack architecture connecting React frontend with Express/Node REST backend",
                        "Implement secure JWT authentication and role-based permissions for team members",
                        "Build structured database schemas with relationship modeling and search indexes",
                        "Create responsive client dashboard with interactive task filtering and real-time status sync"
                    ],
                    skills: ["React", "Node.js", "Express", "MongoDB / PostgreSQL", "REST APIs", "Authentication", "Tailwind / SCSS"],
                    whyThisProject: `Directly targets key full-stack engineering requirements, bridging candidate gaps in ${topGaps}.`,
                    suggestedFeatures: [
                        "Team workspace creation with role invitations (Admin, Member, Viewer)",
                        "Task board with status transitions, priority tags, and due date filters",
                        "Secure JWT authentication with persistent sessions",
                        "Activity log displaying recent project updates and audit history"
                    ],
                    resumeBoost: "Engineered a full-stack collaborative team workspace with React, Node.js, and database indexing, implementing role-based authentication and responsive dashboards. Record API response times after testing.",
                    expectedEvidence: ["GitHub repository with frontend and backend packages", "Live deployed demo URL", "Database ER diagram", "API documentation"],
                    estimatedDuration: "5-7 days",
                    difficulty: "Intermediate",
                    jdRequirementsCovered: ["Full-Stack Architecture", "REST APIs", "Database Modeling"],
                    candidateGapsAddressed: gapNames.slice(0, 2),
                    roadmapConnections: ["Day 1-4 Full-Stack Architecture", "Day 5-8 Database & APIs"],
                    canonicalSkillIds: ["react", "nodejs", "express", "mongodb", "rest-apis"]
                },
                {
                    num: "02",
                    name: "Secure Appointment Booking & Scheduling Platform",
                    icon: "📅",
                    targetRole: roleName,
                    realWorldProblem: "Service businesses suffer from double-booking conflicts and missed customer appointments when reservations are managed through unverified manual schedules.",
                    whatYouBuild: "A secure scheduling and appointment management platform featuring calendar availability algorithms, automated conflict prevention, transactional notifications, and payment checkout.",
                    responsibilities: [
                        "Design availability slot generation algorithm accounting for provider working hours and buffer times",
                        "Implement concurrency-safe reservation lock preventing double bookings",
                        "Build multi-step customer booking wizard with form validation",
                        "Integrate automated transactional confirmation notifications and calendar exports"
                    ],
                    skills: ["React", "Node.js", "Database Transactions", "Calendar Algorithms", "REST APIs", "Form Validation"],
                    whyThisProject: `Demonstrates complex business logic handling, transactional data safety, and polished customer-facing UI engineering.`,
                    suggestedFeatures: [
                        "Dynamic time-slot picker with real-time provider availability calculation",
                        "Concurrency-safe slot reservation with temporary checkout holds",
                        "Admin management dashboard for managing service menus and working hours",
                        "Automated iCal and Google Calendar invite generation"
                    ],
                    resumeBoost: "Built a secure full-stack appointment scheduling platform with calendar slot generation algorithms, concurrency-safe booking locks, and automated calendar notifications. Record booking throughput after testing.",
                    expectedEvidence: ["GitHub repository", "Live booking demo", "Slot calculation algorithm tests", "UI walkthrough recording"],
                    estimatedDuration: "6-8 days",
                    difficulty: "Intermediate",
                    jdRequirementsCovered: ["Business Logic Algorithms", "Transactional Safety"],
                    candidateGapsAddressed: gapNames.slice(1, 3),
                    roadmapConnections: ["Day 4-7 Scheduling Algorithms", "Day 8-12 Booking Workflows"],
                    canonicalSkillIds: ["react", "nodejs", "rest-apis", "database-transactions"]
                },
                {
                    num: "03",
                    name: "E-Commerce Order Management & Inventory Fulfillment Hub",
                    icon: "🛍️",
                    targetRole: roleName,
                    realWorldProblem: "Online merchants struggle to synchronize warehouse stock counts with live storefront catalogs, leading to overselling and order fulfillment delays.",
                    whatYouBuild: "An e-commerce order management system connecting a customer shopping storefront with a merchant fulfillment backend, featuring automated stock deduction and search filters.",
                    responsibilities: [
                        "Implement product catalog with faceted search, categorization, and pricing filters",
                        "Build cart checkout state pipeline with inventory reservation and order invoice generation",
                        "Create merchant fulfillment dashboard to update shipping tracking and order status",
                        "Write automated integration tests covering end-to-end purchasing workflows"
                    ],
                    skills: ["Full-Stack JavaScript", "SQL / NoSQL", "State Management", "Payment Integration", "Testing"],
                    whyThisProject: `Satisfies core commercial application requirements and provides tangible proof of production data handling.`,
                    suggestedFeatures: [
                        "Product catalog with keyword search and category filtering",
                        "Multi-item shopping cart with quantity validation against live stock",
                        "Merchant order fulfillment portal with status updates (Processing, Shipped, Delivered)",
                        "Invoice generation with line-item tax and shipping calculations"
                    ],
                    resumeBoost: "Developed an e-commerce order fulfillment platform connecting storefront product search with merchant inventory management and invoice generation. Measure catalog query latency after testing.",
                    expectedEvidence: ["GitHub repository", "Postman API documentation", "Live demo application", "Automated test suite report"],
                    estimatedDuration: "5-7 days",
                    difficulty: "Intermediate",
                    jdRequirementsCovered: ["E-Commerce Workflows", "API Integration", "Testing"],
                    candidateGapsAddressed: gapNames.slice(0, 2),
                    roadmapConnections: ["Day 3-6 E-Commerce Logic", "Day 9-13 Fulfillment & Testing"],
                    canonicalSkillIds: ["full-stack", "sql", "state-management", "rest-apis"]
                },
                {
                    num: "04",
                    name: "Production REST API with Containerization & Monitoring",
                    icon: "🐳",
                    targetRole: roleName,
                    realWorldProblem: "Development teams face environment inconsistency bugs and deployment failures when transferring applications from local developer machines to production servers.",
                    whatYouBuild: "A containerized production API microservice packaged with multi-stage Docker builds, automated health checks, structured request logging, and environment configuration management.",
                    responsibilities: [
                        "Containerize application services using Docker and multi-container Docker Compose",
                        "Implement multi-stage Dockerfile optimizing production image footprint",
                        "Configure automated health check endpoints and structured logging middleware",
                        "Set up automated CI testing workflow validating builds on code commit"
                    ],
                    skills: ["Docker", "Docker Compose", "CI/CD Workflows", "Production Deployment", "REST APIs", "Logging"],
                    whyThisProject: `Provides portfolio differentiation by demonstrating modern DevOps containerization and production deployment readiness.`,
                    suggestedFeatures: [
                        "Multi-stage Dockerfile reducing container image size and build times",
                        "Docker Compose configuration orchestrating app, database, and cache services",
                        "Health-check endpoint validating database readiness and memory usage",
                        "Structured JSON logging middleware capturing request duration and status"
                    ],
                    resumeBoost: "Containerized a multi-tier web application using multi-stage Docker builds and Docker Compose, implementing structured latency logging and automated health probes. Record container image size optimization after testing.",
                    expectedEvidence: ["GitHub repository with Dockerfile & docker-compose.yml", "Container build logs", "Architecture deployment guide", "Live containerized endpoint"],
                    estimatedDuration: "4-6 days",
                    difficulty: "Beginner",
                    jdRequirementsCovered: ["Docker Containerization", "DevOps & Deployment", "Production Monitoring"],
                    candidateGapsAddressed: gapNames.slice(2, 4),
                    roadmapConnections: ["Day 7-10 Containerization", "Day 11-15 Production Deployment"],
                    canonicalSkillIds: ["docker", "devops", "ci-cd", "rest-apis"]
                }
            ];
        }

        return {
            whyTheseProjects: `These 4 projects were curated specifically for the ${roleName} role to turn identified JD gaps (${topGaps}) into practical, verifiable portfolio evidence.`,
            projects
        };
    }, [report, classificationList]);

    return (
        <div className="dual-resume-section">

            {/* Sub-Tabs Switcher */}
            <div className="resume-subtabs-switcher">
                <button
                    type="button"
                    className={`resume-subtab-btn ${subTab === 'tailored' ? 'resume-subtab-btn--active' : ''}`}
                    onClick={() => setSubTab('tailored')}
                >
                    <span className="btn-icon">📄</span>
                    <div className="btn-text-wrap">
                        <strong>Current Tailored Resume</strong>
                        <span className="btn-subtext">Original Base · JD-Optimized Summary & Skills</span>
                    </div>
                </button>

                <button
                    type="button"
                    className={`resume-subtab-btn ${subTab === 'blueprint' ? 'resume-subtab-btn--active' : ''}`}
                    onClick={() => setSubTab('blueprint')}
                >
                    <span className="btn-icon">🗺️</span>
                    <div className="btn-text-wrap">
                        <strong>JD Target Resume Plan</strong>
                        <span className="btn-subtext">Target Skills · Recommended Projects · Roadmap</span>
                    </div>
                </button>
            </div>

            {/* ══════════════════════════════════════════════════════════════════════
                OUTPUT A: CURRENT TAILORED RESUME (90%+ ORIGINAL BASE PRESERVED)
                ══════════════════════════════════════════════════════════════════════ */}
            {subTab === 'tailored' && (
                <div className="tailored-resume-view">

                    {/* Purpose Banner */}
                    <div className="resume-callout-banner resume-callout-banner--tailored">
                        <div className="banner-left">
                            <span className="banner-badge">OUTPUT A · CURRENT TAILORED RESUME</span>
                            <h3>JD-Optimized ATS Resume (Submittable Today)</h3>
                            <p>
                                Minimal targeted enhancement: <strong>90%+ of your original resume is preserved verbatim</strong>. Only the Professional Summary and Skills prioritization are tailored for <strong>{report.title || "this role"}</strong>. All internship history, projects, and education remain 100% verified.
                            </p>
                        </div>
                        <button
                            type="button"
                            className="button primary-button download-resume-cta"
                            onClick={handleDownloadClick}
                            disabled={isDownloading}
                        >
                            {isDownloading ? "⏳ Generating Resume..." : "⬇️ Download ATS-Ready PDF"}
                        </button>
                    </div>

                    {/* Grounding Safety Checklist */}
                    <div className="grounding-checklist-card">
                        <div className="checklist-item">
                            <span className="check-icon">✓</span>
                            <span><strong>Targeted Summary:</strong> JD-aligned objective expressing target direction without unverified completed claims</span>
                        </div>
                        <div className="checklist-item">
                            <span className="check-icon">✓</span>
                            <span><strong>Structured Skills:</strong> Core verified skills separated from target role skills</span>
                        </div>
                        <div className="checklist-item">
                            <span className="check-icon">✓</span>
                            <span><strong>Unchanged Work Experience:</strong> Python Developer Intern at TechSoft Solutions preserved intact</span>
                        </div>
                        <div className="checklist-item">
                            <span className="check-icon">✓</span>
                            <span><strong>Unchanged Projects:</strong> SkillBridge & AI Security systems preserved with verified technologies</span>
                        </div>
                        <div className="checklist-item">
                            <span className="check-icon">✓</span>
                            <span><strong>1-Page ATS Formula:</strong> Guaranteed single-page A4 document engineered for enterprise scanners</span>
                        </div>
                    </div>

                    {/* Resume Visual Structure Preview */}
                    <div className="ats-resume-preview-card">
                        <div className="preview-topbar">
                            <span className="preview-label">A4 Single-Page ATS Document Preview</span>
                            <button
                                type="button"
                                className="preview-download-btn"
                                onClick={handleDownloadClick}
                                disabled={isDownloading}
                            >
                                {isDownloading ? "⏳ Generating..." : "📄 Download PDF"}
                            </button>
                        </div>

                        <div className="preview-document-frame">
                            <div className="preview-doc-header">
                                <h2>MUHAMMAD SIDDIQ</h2>
                                <p className="preview-doc-contact">
                                    +92 300 1234567 | msiddiq786@gmail.com | linkedin.com/in/msiddiq786 | github.com/Msiddiq786 | Lahore, Pakistan
                                </p>
                            </div>

                            <div className="preview-doc-section">
                                <h4 className="preview-section-title">PROFESSIONAL SUMMARY</h4>
                                <p className="preview-doc-text">
                                    AI/ML-focused Computer Science Engineering student with hands-on experience developing intelligent applications using Python, Google Gemini API, YOLOv8, OpenCV, and Flask REST APIs. Seeking an {report.title || "AI / ML Intern"} position to apply Python, machine learning, LLMs, prompt engineering, RAG concepts, and REST APIs to intelligent automation solutions.
                                </p>
                            </div>

                            <div className="preview-doc-section">
                                <h4 className="preview-section-title">TECHNICAL SKILLS</h4>
                                <div className="preview-skills-list">
                                    <p><strong>Core Demonstrated Skills:</strong> Python, SQL, Google Gemini API, NLP, OpenCV, YOLOv8, Flask, REST APIs, Git/GitHub, MongoDB, Redis</p>
                                    <p><strong>Target Role Skills (To Develop):</strong> Machine Learning, Data Analysis, LLMs, Prompt Engineering, RAG, Vector Databases, Docker, Model Evaluation, Model Monitoring</p>
                                </div>
                            </div>

                            <div className="preview-doc-section">
                                <h4 className="preview-section-title">PROJECTS</h4>
                                <div className="preview-project-item">
                                    <div className="preview-item-top">
                                        <strong>SkillBridge — AI-Powered Career & Interview Platform</strong>
                                        <span className="preview-item-date">React.js, Node.js, Gemini API</span>
                                    </div>
                                    <ul className="preview-doc-bullets">
                                        <li>Engineered a full-stack career platform integrating the Google Gemini API to analyze candidate resumes against job descriptions and generate structured interview questions.</li>
                                        <li>Implemented JWT authentication, role-based access control, and Redis caching to optimize performance and data delivery.</li>
                                    </ul>
                                </div>

                                <div className="preview-project-item" style={{ marginTop: '4px' }}>
                                    <div className="preview-item-top">
                                        <strong>AI Security & Attendance System</strong>
                                        <span className="preview-item-date">Python, YOLOv8, OpenCV, Flask</span>
                                    </div>
                                    <ul className="preview-doc-bullets">
                                        <li>Built an automated face detection and attendance logging application utilizing Python, YOLOv8, and OpenCV for computer vision processing.</li>
                                        <li>Developed a Flask web interface for real-time check-in monitoring with local attendance records managed via SQLite.</li>
                                    </ul>
                                </div>
                            </div>

                            <div className="preview-doc-section">
                                <h4 className="preview-section-title">EXPERIENCE</h4>
                                <div className="preview-project-item">
                                    <div className="preview-item-top">
                                        <strong>Python Developer Intern — TechSoft Solutions</strong>
                                        <span className="preview-item-date">June 2024 – August 2024</span>
                                    </div>
                                    <ul className="preview-doc-bullets">
                                        <li>Developed Python automation scripts and applied Object-Oriented Programming principles to optimize legacy data processing routines.</li>
                                        <li>Assisted senior engineering teams with code debugging, performance profiling, and unit testing protocols.</li>
                                    </ul>
                                </div>
                            </div>

                            <div className="preview-doc-section">
                                <h4 className="preview-section-title">EDUCATION</h4>
                                <div className="preview-item-top">
                                    <strong>Bachelor of Science in Computer Science (BS CS) — FAST NUCES, Lahore</strong>
                                    <span className="preview-item-date">2022 – 2026 | CGPA: 3.4/4.0</span>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            )}

            {/* ══════════════════════════════════════════════════════════════════════
                OUTPUT B: JD TARGET RESUME PLAN (RECOMMENDED PROJECTS & SKILLS)
                ══════════════════════════════════════════════════════════════════════ */}
            {subTab === 'blueprint' && (
                <div className="jd-blueprint-view">

                    {/* Purpose Banner */}
                    <div className="resume-callout-banner resume-callout-banner--blueprint">
                        <div className="banner-left">
                            <span className="banner-badge banner-badge--blueprint">OUTPUT B · JD TARGET RESUME PLAN</span>
                            <h3>Target Job Description Preparation Plan</h3>
                            <p>
                                This is your preparation blueprint for <strong>{report.title || "this role"}</strong>. It identifies what the JD wants, high-value projects to build before applying, and direct links to practice simulations.
                            </p>
                        </div>
                        <div className="banner-actions-right">
                            <Link to="/practice" className="button primary-button" style={{ padding: '0.65rem 1.25rem', fontSize: '0.85rem' }}>
                                🎯 Start Preparation
                            </Link>
                            <button
                                type="button"
                                className="button secondary-button"
                                style={{ padding: '0.65rem 1.25rem', fontSize: '0.85rem' }}
                                onClick={() => onNavigateTab(1, 'JD Target Plan')}
                            >
                                🗺️ View Roadmap
                            </button>
                        </div>
                    </div>

                    {/* 1. JD Keyword Prioritization Hierarchy */}
                    <div className="blueprint-card">
                        <div className="blueprint-card-header">
                            <div>
                                <h4>1. Skills This Role Wants (Keyword Prioritization)</h4>
                                <p className="card-subtext">Ranked hierarchy of JD requirements to emphasize in your summary and preparation.</p>
                            </div>
                            <span className="blueprint-role-badge">{report.title || "Target Role"}</span>
                        </div>
                        <div className="blueprint-expectations-grid">
                            <div className="exp-box">
                                <h5>🔥 MUST HAVE (Core Competencies)</h5>
                                <div className="ats-tags">
                                    <span className="skill-tag skill-tag--high">Python</span>
                                    <span className="skill-tag skill-tag--high">Machine Learning</span>
                                    <span className="skill-tag skill-tag--high">LLMs & GenAI</span>
                                    <span className="skill-tag skill-tag--high">Data Analysis</span>
                                    <span className="skill-tag skill-tag--high">RAG Pipelines</span>
                                    <span className="skill-tag skill-tag--high">REST APIs</span>
                                </div>
                            </div>

                            <div className="exp-box">
                                <h5>⚡ SHOULD HAVE (Strong Differentiators)</h5>
                                <div className="ats-tags">
                                    <span className="skill-tag skill-tag--medium">Prompt Engineering</span>
                                    <span className="skill-tag skill-tag--medium">SQL / Databases</span>
                                    <span className="skill-tag skill-tag--medium">Git & GitHub</span>
                                </div>
                            </div>

                            <div className="exp-box">
                                <h5>✨ NICE TO HAVE (Advanced Additions)</h5>
                                <div className="ats-tags">
                                    <span className="skill-tag skill-tag--low">NLP & OpenCV</span>
                                    <span className="skill-tag skill-tag--low">Docker & Containers</span>
                                    <span className="skill-tag skill-tag--low">Vector Databases</span>
                                    <span className="skill-tag skill-tag--low">FastAPI Model Serving</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 2. Candidate Match Breakdown (Canonical 4-Tier) */}
                    <div className="blueprint-card">
                        <div className="blueprint-card-header">
                            <div>
                                <h4>2. Complete Requirement Match Breakdown</h4>
                                <p className="card-subtext">Every JD requirement categorized by verified candidate evidence.</p>
                            </div>
                            <div className="segmented-filter-bar" role="tablist">
                                {[
                                    { id: 'ALL', label: 'All', icon: '', count: classificationList.length, cls: 'seg-filter-pill--all' },
                                    { id: 'PRESENT', label: 'Present', icon: '✓', count: presentItems.length, cls: 'seg-filter-pill--present' },
                                    { id: 'PARTIALLY_DEMONSTRATED', label: 'Partial', icon: '~', count: partialItems.length, cls: 'seg-filter-pill--partial' },
                                    { id: 'NOT_DEMONSTRATED', label: 'Not Demonstrated', icon: '!', count: notDemonstratedItems.length, cls: 'seg-filter-pill--not-demonstrated' },
                                    { id: 'MISSING', label: 'Missing', icon: '✕', count: missingItems.length, cls: 'seg-filter-pill--missing' }
                                ].map(f => (
                                    <button
                                        key={f.id}
                                        type="button"
                                        role="tab"
                                        aria-selected={blueprintFilter === f.id}
                                        className={`seg-filter-pill ${f.cls} ${blueprintFilter === f.id ? 'seg-filter-pill--active' : ''}`}
                                        onClick={() => setBlueprintFilter(f.id)}
                                    >
                                        {f.icon && <span className="pill-icon">{f.icon}</span>}
                                        <span className="pill-label">{f.label}</span>
                                        <span className="pill-count">{f.count}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {filteredBlueprintItems.length > 0 ? (
                            <div className="requirements-2col-grid">
                                {filteredBlueprintItems.map((item, idx) => (
                                    <RequirementCard
                                        key={idx}
                                        item={item}
                                        roadmapPlan={roadmapPlan}
                                        onNavigateToRoadmap={onNavigateTab}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="filter-empty-state">
                                <span className="empty-icon">✓</span>
                                <h4>No {blueprintFilter === 'MISSING' ? 'Missing' : 'Matching'} Requirements</h4>
                                <p>All currently analyzed requirements in this category have supporting candidate evidence.</p>
                            </div>
                        )}
                    </div>

                    {/* 3. Recommended Projects for this Role */}
                    <div className="blueprint-card">
                        <div className="blueprint-card-header">
                            <div>
                                <h4>3. Recommended Projects for this Role</h4>
                                <p className="card-subtext">Build these 4 high-value projects to turn target JD requirements into verified resume experience. <em>Clearly labeled as recommended before applying.</em></p>
                            </div>
                            <span className="badge-count-red">4 Role-Specific Projects</span>
                        </div>

                        {/* Dynamic "Why These 4 Projects?" Callout */}
                        {whyTheseProjects && (
                            <div className="why-projects-overview-banner">
                                <div className="overview-icon">💡</div>
                                <div className="overview-content">
                                    <strong>WHY THESE 4 PROJECTS?</strong>
                                    <p>{whyTheseProjects}</p>
                                </div>
                            </div>
                        )}

                        <div className="recommended-projects-grid">
                            {recommendedProjects.map((p, idx) => {
                                const isExpanded = Boolean(expandedProjects[p.num]);
                                const currentStatus = projectStatuses[p.num] || p.status || 'NOT_STARTED';

                                return (
                                    <div key={idx} className={`rec-project-card ${isExpanded ? 'rec-project-card--expanded' : ''}`}>
                                        <div className="rec-project-card__top">
                                            <div className="badge-and-role">
                                                <span className="project-badge">PROJECT {p.num}</span>
                                                {p.targetRole && (
                                                    <span className="project-role-chip">{p.targetRole}</span>
                                                )}
                                            </div>
                                            <div className="rec-project-card__status-wrap">
                                                <select
                                                    value={currentStatus}
                                                    onChange={(e) => handleUpdateProjectStatus(p.num, e.target.value)}
                                                    className={`project-status-select project-status-select--${currentStatus.toLowerCase()}`}
                                                    title="Project Progress Status"
                                                >
                                                    <option value="NOT_STARTED">⏳ Not Started</option>
                                                    <option value="IN_PROGRESS">⚡ In Progress</option>
                                                    <option value="COMPLETED">✓ Completed</option>
                                                </select>
                                                <span className="project-icon">{p.icon || '🚀'}</span>
                                            </div>
                                        </div>

                                        <h4 className="project-name">{p.name}</h4>

                                        {/* Real-World Problem Box */}
                                        <div className="project-problem-box">
                                            <span className="section-tag">REAL-WORLD PROBLEM</span>
                                            <p className="problem-text">{p.realWorldProblem || p.why}</p>
                                        </div>

                                        {/* Key Skills Targeted */}
                                        <div className="project-section">
                                            <span className="section-tag">KEY SKILLS DEMONSTRATED</span>
                                            <div className="skill-pills-wrap">
                                                {(p.skills || []).map((s, si) => (
                                                    <span key={si} className="target-skill-pill">{s}</span>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Why This Project */}
                                        <div className="project-section">
                                            <span className="section-tag">WHY THIS PROJECT</span>
                                            <p className="section-body">{p.whyThisProject || p.why}</p>
                                        </div>

                                        {/* Toggle Details Button */}
                                        <button
                                            type="button"
                                            className="project-details-toggle-btn"
                                            onClick={() => toggleProjectExpanded(p.num)}
                                        >
                                            <span>{isExpanded ? 'Hide Project Details' : 'View Full Project Plan'}</span>
                                            <span className="toggle-arrow">{isExpanded ? '▲' : '▼'}</span>
                                        </button>

                                        {/* Expanded Drawer */}
                                        {isExpanded && (
                                            <div className="project-expanded-drawer">
                                                {/* What you will build */}
                                                {p.whatYouBuild && (
                                                    <div className="drawer-section">
                                                        <span className="section-tag">WHAT YOU WILL BUILD</span>
                                                        <p className="section-body">{p.whatYouBuild}</p>
                                                    </div>
                                                )}

                                                {/* Responsibilities / What you will do */}
                                                {p.responsibilities && p.responsibilities.length > 0 && (
                                                    <div className="drawer-section">
                                                        <span className="section-tag">WHAT YOU WILL DO / RESPONSIBILITIES</span>
                                                        <ul className="responsibilities-checklist">
                                                            {p.responsibilities.map((r, ri) => (
                                                                <li key={ri}>
                                                                    <span className="bullet-check">✓</span>
                                                                    <span>{r}</span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}

                                                {/* Suggested Features */}
                                                {(p.suggestedFeatures || p.features) && (
                                                    <div className="drawer-section">
                                                        <span className="section-tag">SUGGESTED FEATURES ({ (p.suggestedFeatures || p.features).length })</span>
                                                        <ul className="features-list">
                                                            {(p.suggestedFeatures || p.features).map((f, fi) => (
                                                                <li key={fi}>{f}</li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}

                                                {/* Resume Boost Impact */}
                                                <div className="project-evidence-box">
                                                    <span className="evidence-header">HOW THIS BOOSTS YOUR RESUME</span>
                                                    <p className="evidence-text">
                                                        {p.resumeBoost || `"${p.resumeEvidence}"`}
                                                    </p>
                                                    <div className="metric-guidance-pill">
                                                        💡 Tip: Measure response latency or benchmark throughput after building and record the actual result on your resume.
                                                    </div>
                                                </div>

                                                {/* Expected Evidence */}
                                                {p.expectedEvidence && p.expectedEvidence.length > 0 && (
                                                    <div className="drawer-section">
                                                        <span className="section-tag">EXPECTED RESUME EVIDENCE</span>
                                                        <div className="evidence-chips-wrap">
                                                            {p.expectedEvidence.map((ev, evi) => (
                                                                <span key={evi} className="evidence-chip">📁 {ev}</span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Roadmap Connection */}
                                                {p.roadmapConnections && p.roadmapConnections.length > 0 && (
                                                    <div className="roadmap-connection-box">
                                                        <span className="roadmap-connection-tag">🗺️ ROADMAP ALIGNMENT</span>
                                                        <div className="roadmap-pills">
                                                            {p.roadmapConnections.map((rc, rci) => (
                                                                <span key={rci} className="roadmap-connection-pill">{rc}</span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Quick Project Actions */}
                                                <div className="project-drawer-actions">
                                                    <Link to="/practice" className="button primary-button btn-sm">
                                                        🎯 Practice Skills
                                                    </Link>
                                                    <button
                                                        type="button"
                                                        className="button secondary-button btn-sm"
                                                        onClick={() => onNavigateTab(1, 'JD Target Plan')}
                                                    >
                                                        📘 View Roadmap
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* 4. Bottom Action Footer */}
                    <div className="blueprint-bottom-actions">
                        <Link to="/practice" className="button primary-button" style={{ padding: '0.85rem 2rem', fontSize: '0.95rem' }}>
                            🎯 Start Technical Practice
                        </Link>
                        <button
                            type="button"
                            className="button secondary-button"
                            style={{ padding: '0.85rem 2rem', fontSize: '0.95rem' }}
                            onClick={() => onNavigateTab(1, 'JD Target Plan')}
                        >
                            📘 Open {report?.preparationPlan?.length || report?.planConfig?.roadmapDays || 15}-Day Preparation Roadmap
                        </button>
                    </div>

                </div>
            )}

        </div>
    );
};

// ── Main Interview Component ──────────────────────────────────────────────────
const Interview = () => {
    const [activeNav, setActiveNav] = useState('overview');
    const [showRoleDetails, setShowRoleDetails] = useState(false);
    const [classificationView, setClassificationView] = useState('cards');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [gapTypeFilter, setGapTypeFilter] = useState('ALL');
    const [isRetryingAts, setIsRetryingAts] = useState(false);
    const [returnContext, setReturnContext] = useState(null);
    const [targetRoadmapDay, setTargetRoadmapDay] = useState(null);
    const [reqSearchQuery, setReqSearchQuery] = useState('');

    const { report, getReportById, loading, getResumePdf, handleRetryAts } = useInterview();
    const { startJourney, completeDay, updateTasks, getJourneyStatusApi } = useJourney();
    const { interviewId } = useParams();

    const [journeyState, setJourneyState] = useState(null);
    const [isStartingJourney, setIsStartingJourney] = useState(false);
    const [journeyFeedback, setJourneyFeedback] = useState(null);

    useEffect(() => {
        if (interviewId) {
            getReportById(interviewId);
        }
    }, [interviewId]);

    // Check if learning journey exists for this report
    useEffect(() => {
        if (report?._id) {
            getJourneyStatusApi(report._id)
                .then(res => setJourneyState(res?.journey || null))
                .catch(err => console.error("Failed to load journey status:", err));
        }
    }, [report?._id]);

    const handleStartJourney = async () => {
        if (!report?._id || isStartingJourney) return;
        setIsStartingJourney(true);
        try {
            const j = await startJourney(report._id);
            setJourneyState(j);
            setJourneyFeedback({ type: 'success', message: '🚀 Active Learning Journey started! Track your progress and daily streak.' });
        } catch (err) {
            console.error("Failed to start journey:", err);
            setJourneyFeedback({ type: 'error', message: 'Could not start learning journey. Please try again.' });
        } finally {
            setIsStartingJourney(false);
        }
    };

    const handleCompleteDay = async (dayNumber, taskIndices) => {
        if (!journeyState?._id) return;
        try {
            const result = await completeDay(journeyState._id, dayNumber, taskIndices);
            setJourneyState(result.journey);
            setJourneyFeedback({ type: 'success', message: `🎉 Day ${dayNumber} completed! Daily learning streak updated.` });
        } catch (err) {
            console.error("Failed to complete day:", err);
            setJourneyFeedback({ type: 'error', message: 'Could not mark day as complete.' });
        }
    };

    const handleToggleTask = async (dayNumber, taskIdx, currentCompletedTasks = []) => {
        if (!journeyState?._id) return;
        const nextTasks = currentCompletedTasks.includes(taskIdx)
            ? currentCompletedTasks.filter(i => i !== taskIdx)
            : [...currentCompletedTasks, taskIdx];
        try {
            const result = await updateTasks(journeyState._id, dayNumber, nextTasks);
            setJourneyState(result.journey);
        } catch (err) {
            console.error("Failed to update tasks:", err);
        }
    };

    // Background polling for ATS when pending or generating
    useEffect(() => {
        if (!interviewId || !report) return;

        const atsStatus = report.atsStatus || (report.atsAnalysis ? 'ATS_READY' : 'ATS_GENERATING');
        if (atsStatus === 'ATS_READY' || atsStatus === 'ATS_FAILED') return;

        const interval = setInterval(async () => {
            try {
                const updated = await getReportById(interviewId);
                if (updated?.atsStatus === 'ATS_READY' || updated?.atsAnalysis) {
                    clearInterval(interval);
                }
            } catch {
                /* silent */
            }
        }, 3000);

        return () => clearInterval(interval);
    }, [interviewId, report?.atsStatus, report?.atsAnalysis]);

    const onRetryAtsClick = async () => {
        if (!interviewId || isRetryingAts) return;
        setIsRetryingAts(true);
        try {
            await handleRetryAts(interviewId);
        } catch (err) {
            console.error("Failed to retry ATS:", err);
        } finally {
            setIsRetryingAts(false);
        }
    };

    const handleNavigateToRoadmap = (dayNumber, originLabel) => {
        setTargetRoadmapDay(dayNumber || null);
        setReturnContext({
            tab: activeNav,
            label: originLabel || 'Requirement Match'
        });
        setActiveNav('roadmap');
    };

    if (loading || !report) {
        return (
            <AppShell>
                <div className="loading-screen">
                    <div className="loading-spinner" />
                    <h2>Loading your interview plan & analytics...</h2>
                </div>
            </AppShell>
        );
    }

    const scoreInfo = getMatchScoreInfo(report.matchScore);

    const cleanTrackTitle = report.selectedTrackTitle ||
        (report.selectedTrack && report.selectedTrack.length < 80 ? report.selectedTrack : null) ||
        report.title;

    const trackDetailsText = report.selectedTrackDetails ||
        (report.selectedTrack && report.selectedTrack.length >= 80 ? report.selectedTrack : report.jobDescription);

    const classificationList = report.skillClassification || [];
    
    // Canonical Categorization
    const strongSkills = classificationList
        .filter(i => (i.type === 'SKILL' || !i.type) && i.status === 'PRESENT')
        .map(i => i.requirement || i.skill);

    const demonstratedResponsibilities = classificationList
        .filter(i => i.type === 'RESPONSIBILITY' && i.status === 'PRESENT')
        .map(i => i.requirement || i.skill);

    const partialSkills = classificationList
        .filter(i => (i.type === 'SKILL' || !i.type) && i.status === 'PARTIALLY_DEMONSTRATED')
        .map(i => i.requirement || i.skill);

    const partialResponsibilities = classificationList
        .filter(i => i.type === 'RESPONSIBILITY' && i.status === 'PARTIALLY_DEMONSTRATED')
        .map(i => i.requirement || i.skill);

    const notDemonstratedSkills = classificationList
        .filter(i => (i.type === 'SKILL' || !i.type) && i.status === 'NOT_DEMONSTRATED')
        .map(i => i.requirement || i.skill);

    const notDemonstratedResponsibilities = classificationList
        .filter(i => i.type === 'RESPONSIBILITY' && i.status === 'NOT_DEMONSTRATED')
        .map(i => i.requirement || i.skill);

    const missingSkills = classificationList
        .filter(i => (i.type === 'SKILL' || !i.type) && i.status === 'MISSING')
        .map(i => i.requirement || i.skill);

    const missingResponsibilities = classificationList
        .filter(i => i.type === 'RESPONSIBILITY' && i.status === 'MISSING')
        .map(i => i.requirement || i.skill);

    const totalSkillGaps = partialSkills.length + notDemonstratedSkills.length + missingSkills.length;
    const totalRespGaps = partialResponsibilities.length + notDemonstratedResponsibilities.length + missingResponsibilities.length;

    // Filtered and Searched Classification for Overview
    const searchedAndFilteredClassification = classificationList.filter(item => {
        if (statusFilter !== 'ALL' && item.status !== statusFilter) return false;
        if (!reqSearchQuery) return true;
        const q = reqSearchQuery.toLowerCase();
        const name = (item.requirement || item.skill || '').toLowerCase();
        const type = (item.type || '').toLowerCase();
        const evidence = (item.evidence || '').toLowerCase();
        return name.includes(q) || type.includes(q) || evidence.includes(q);
    });

    // Canonical Gaps
    const canonicalGaps = report.skillGaps || [];
    const skillGapsList = canonicalGaps.filter(g => (g.type || 'SKILL').toUpperCase() === 'SKILL');
    const expGapsList = canonicalGaps.filter(g => (g.type || 'SKILL').toUpperCase() !== 'SKILL');

    const filteredGaps = canonicalGaps.filter(g => {
        if (gapTypeFilter === 'ALL') return true;
        const gType = (g.type || 'SKILL').toUpperCase();
        if (gapTypeFilter === 'SKILL') return gType === 'SKILL';
        if (gapTypeFilter === 'RESPONSIBILITY') return gType !== 'SKILL';
        return true;
    });

    const scoreExp = report.scoreExplanation || {};
    const expCounts = scoreExp.counts || {
        strong: strongSkills.length + demonstratedResponsibilities.length,
        partial: partialSkills.length + partialResponsibilities.length,
        notDemonstrated: notDemonstratedSkills.length + notDemonstratedResponsibilities.length,
        missing: missingSkills.length + missingResponsibilities.length
    };

    return (
        <AppShell>
            <div className="interview-page">

                {/* ── Top Report Navigation Sub-Bar ── */}
                <div className="report-top-subbar">
                    <div className="report-subbar-left">
                        <Link to="/dashboard" className="subbar-back-link">← Dashboard</Link>
                        <span className="subbar-sep">/</span>
                        <span className="subbar-current-role">{cleanTrackTitle || 'Interview Report'}</span>
                    </div>

                    <div className="report-subbar-actions">
                        <button
                            type="button"
                            onClick={() => setActiveNav('resume')}
                            className="button secondary-button"
                            style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem' }}
                        >
                            📄 Resume Studio & Blueprint
                        </button>
                        <Link
                            to="/practice"
                            className="button primary-button"
                            style={{ padding: '0.45rem 1rem', fontSize: '0.8rem' }}
                        >
                            🎯 Practice Mode
                        </Link>
                    </div>
                </div>

                <div className="interview-layout">

                    {/* ── Center Content ── */}
                    <main className="interview-content">

                        {/* Section Tabs */}
                        <div className="report-tabs-header">
                            {NAV_ITEMS.map(item => {
                                let countLabel = null;
                                if (item.id === 'technical' && report.technicalQuestions) countLabel = report.technicalQuestions.length;
                                if (item.id === 'mcq' && report.mcqQuestions) countLabel = report.mcqQuestions.length;
                                if (item.id === 'behavioral' && report.behavioralQuestions) countLabel = report.behavioralQuestions.length;
                                if (item.id === 'skillgaps') countLabel = canonicalGaps.length;
                                if (item.id === 'roadmap' && report.preparationPlan) countLabel = `${report.preparationPlan.length}d`;

                                return (
                                    <button
                                        key={item.id}
                                        className={`report-tab-btn ${activeNav === item.id ? 'report-tab-btn--active' : ''}`}
                                        onClick={() => setActiveNav(item.id)}
                                    >
                                        <span className="tab-icon">{item.icon}</span>
                                        <span>{item.label}</span>
                                        {countLabel !== null && <span className="tab-count">{countLabel}</span>}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Resume & Blueprint Tab */}
                        {activeNav === 'resume' && (
                            <section>
                                <DualResumeSection
                                    report={report}
                                    onDownloadPdf={() => getResumePdf(interviewId)}
                                    onNavigateTab={handleNavigateToRoadmap}
                                />
                            </section>
                        )}

                        {/* Overview Tab */}
                        {activeNav === 'overview' && (
                            <section className="overview-tab-content">

                                {/* 1. Hero Card */}
                                <div className="overview-hero-card">
                                    <div className="overview-hero-top">
                                        <div>
                                            <h2 className="overview-title">{report.title || cleanTrackTitle || 'Interview Report'}</h2>
                                            {report.company && <p className="overview-company">{report.company}</p>}
                                        </div>
                                        <div className="overview-score-pill">
                                            <span className="score-num">{report.matchScore}%</span>
                                            <span className="score-label">{scoreInfo.label}</span>
                                        </div>
                                    </div>

                                    {/* Target Track Panel */}
                                    {cleanTrackTitle && (
                                        <div className="target-track-panel">
                                            <div className="target-track-header">
                                                <div className="target-track-info">
                                                    <span className="target-track-tag">TARGET TRACK</span>
                                                    <h3 className="target-track-role">{cleanTrackTitle}</h3>
                                                </div>
                                                {trackDetailsText && (
                                                    <button
                                                        type="button"
                                                        className="view-role-details-btn"
                                                        onClick={() => setShowRoleDetails(v => !v)}
                                                    >
                                                        {showRoleDetails ? 'Hide Details' : 'View Role Details'}
                                                    </button>
                                                )}
                                            </div>

                                            {showRoleDetails && trackDetailsText && (
                                                <FormattedTrackDetails text={trackDetailsText} />
                                            )}
                                        </div>
                                    )}

                                    <p className="overview-summary-text">{report.summary}</p>
                                </div>

                                {/* Active Preparation Plan Card */}
                                <div className="plan-summary-widget">
                                    <div className="plan-summary-widget__header">
                                        <div className="widget-title-wrap">
                                            <span className="widget-icon">⚡</span>
                                            <h3 className="widget-title">Configured Preparation Plan</h3>
                                        </div>
                                        <span className="widget-badge">
                                            {report.planConfig?.roadmapIntensity ? `${report.planConfig.roadmapIntensity.toUpperCase()} INTENSITY` : 'ACTIVE PLAN'}
                                        </span>
                                    </div>
                                    <div className="plan-summary-widget__grid">
                                        <div className="plan-stat-box">
                                            <span className="stat-label">Technical Questions</span>
                                            <span className="stat-value">
                                                {report.planConfig?.technicalCount ?? (report.technicalQuestions?.length || 20)}
                                            </span>
                                            <span className="stat-sub">
                                                {report.planConfig?.technicalDifficulty
                                                    ? `${report.planConfig.technicalDifficulty.easy}E · ${report.planConfig.technicalDifficulty.medium}M · ${report.planConfig.technicalDifficulty.hard}H`
                                                    : 'Voice Practice'}
                                            </span>
                                        </div>
                                        <div className="plan-stat-box">
                                            <span className="stat-label">MCQ Practice</span>
                                            <span className="stat-value">
                                                {report.planConfig?.mcqCount ?? (report.mcqQuestions?.length || 15)}
                                            </span>
                                            <span className="stat-sub">
                                                {report.planConfig?.mcqDifficulty
                                                    ? `${report.planConfig.mcqDifficulty.easy}E · ${report.planConfig.mcqDifficulty.medium}M · ${report.planConfig.mcqDifficulty.hard}H`
                                                    : 'Timed Simulation'}
                                            </span>
                                        </div>
                                        <div className="plan-stat-box">
                                            <span className="stat-label">Behavioral (STAR)</span>
                                            <span className="stat-value">
                                                {report.planConfig?.behavioralCount ?? (report.behavioralQuestions?.length || 10)}
                                            </span>
                                            <span className="stat-sub">
                                                {report.planConfig?.behavioralDifficulty
                                                    ? `${report.planConfig.behavioralDifficulty.easy}E · ${report.planConfig.behavioralDifficulty.medium}M · ${report.planConfig.behavioralDifficulty.hard}H`
                                                    : 'Structured Scenarios'}
                                            </span>
                                        </div>
                                        <div className="plan-stat-box">
                                            <span className="stat-label">Roadmap Duration</span>
                                            <span className="stat-value">
                                                {report.planConfig?.roadmapDays ?? (report.preparationPlan?.length || 15)} Days
                                            </span>
                                            <span className="stat-sub">
                                                {report.planConfig?.roadmapIntensity === 'light' ? '1–2 hrs/day' :
                                                 report.planConfig?.roadmapIntensity === 'intensive' ? '4–6 hrs/day' : '2–4 hrs/day'}
                                            </span>
                                        </div>
                                        <div className="plan-stat-box">
                                            <span className="stat-label">Follow-ups / Q</span>
                                            <span className="stat-value">
                                                {report.planConfig?.technicalFollowUpsPerQuestion ?? 5}
                                            </span>
                                            <span className="stat-sub">Coach Depth</span>
                                        </div>
                                    </div>
                                    {report.planConfig?.focusAreas?.length > 0 && (
                                        <div className="plan-focus-areas-row">
                                            <span className="focus-label">Priority Focus Areas:</span>
                                            <div className="focus-tags">
                                                {report.planConfig.focusAreas.map((area, idx) => (
                                                    <span key={idx} className="focus-pill">{area}</span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* 2. Grouped Summary Badges */}
                                <div className="overview-grouped-grid">
                                    <CollapsibleChipList
                                        title="Strong Skills"
                                        items={strongSkills}
                                        tagClass="skill-tag--low"
                                    />
                                    {demonstratedResponsibilities.length > 0 && (
                                        <CollapsibleChipList
                                            title="Demonstrated Responsibilities"
                                            items={demonstratedResponsibilities}
                                            tagClass="skill-tag--low"
                                        />
                                    )}
                                    {(partialSkills.length > 0 || partialResponsibilities.length > 0) && (
                                        <CollapsibleChipList
                                            title="Partially Demonstrated"
                                            items={[...partialSkills, ...partialResponsibilities]}
                                            tagClass="skill-tag--medium"
                                        />
                                    )}
                                    {(notDemonstratedSkills.length > 0 || notDemonstratedResponsibilities.length > 0) && (
                                        <CollapsibleChipList
                                            title="Not Demonstrated"
                                            items={[...notDemonstratedSkills, ...notDemonstratedResponsibilities]}
                                            tagClass="skill-tag--orange"
                                        />
                                    )}
                                    {(missingSkills.length > 0 || missingResponsibilities.length > 0) && (
                                        <CollapsibleChipList
                                            title="Missing Requirements"
                                            items={[...missingSkills, ...missingResponsibilities]}
                                            tagClass="skill-tag--high"
                                        />
                                    )}
                                </div>

                                {/* 3. Structured Score Explanation (2x2 Grid) */}
                                <div className="score-explanation-card">
                                    <div className="card-section-title">
                                        <h4>Why You Scored {report.matchScore}%</h4>
                                        <div className="score-breakdown-pills">
                                            <span className="breakdown-pill breakdown-pill--green">Strong Alignment [{expCounts.strong}]</span>
                                            <span className="breakdown-pill breakdown-pill--yellow">Partial Alignment [{expCounts.partial}]</span>
                                            <span className="breakdown-pill breakdown-pill--orange">Not Demonstrated [{expCounts.notDemonstrated}]</span>
                                            <span className="breakdown-pill breakdown-pill--red">Missing [{expCounts.missing}]</span>
                                        </div>
                                    </div>

                                    <div className="score-classification-grid">
                                        {/* Card 1: Key Strengths */}
                                        <div className="score-classification-card score-classification-card--strengths">
                                            <div className="score-card-header">
                                                <h5>Key Strengths</h5>
                                                <span className="score-card-badge score-card-badge--green">{expCounts.strong}</span>
                                            </div>
                                            {(strongSkills.length > 0 || demonstratedResponsibilities.length > 0) ? (
                                                <ul className="score-card-list">
                                                    {[...strongSkills, ...demonstratedResponsibilities].map((s, i) => (
                                                        <li key={i}>{s}</li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <p className="score-card-empty">No direct strong alignment items identified.</p>
                                            )}
                                        </div>

                                        {/* Card 2: Partially Demonstrated */}
                                        <div className="score-classification-card score-classification-card--partial">
                                            <div className="score-card-header">
                                                <h5>Partially Demonstrated</h5>
                                                <span className="score-card-badge score-card-badge--yellow">{expCounts.partial}</span>
                                            </div>
                                            {(partialSkills.length > 0 || partialResponsibilities.length > 0) ? (
                                                <ul className="score-card-list">
                                                    {[...partialSkills, ...partialResponsibilities].map((p, i) => (
                                                        <li key={i}>{p}</li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <p className="score-card-empty">No partial alignment items identified.</p>
                                            )}
                                        </div>

                                        {/* Card 3: Not Demonstrated */}
                                        <div className="score-classification-card score-classification-card--orange">
                                            <div className="score-card-header">
                                                <h5>Not Demonstrated</h5>
                                                <span className="score-card-badge score-card-badge--orange">{expCounts.notDemonstrated}</span>
                                            </div>
                                            {(notDemonstratedSkills.length > 0 || notDemonstratedResponsibilities.length > 0) ? (
                                                <ul className="score-card-list">
                                                    {[...notDemonstratedSkills, ...notDemonstratedResponsibilities].map((g, i) => (
                                                        <li key={i}>{g}</li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <p className="score-card-empty">No unproven items identified.</p>
                                            )}
                                        </div>

                                        {/* Card 4: Missing Requirements */}
                                        <div className="score-classification-card score-classification-card--gaps">
                                            <div className="score-card-header">
                                                <h5>Missing Requirements</h5>
                                                <span className="score-card-badge score-card-badge--red">{expCounts.missing}</span>
                                            </div>
                                            {(missingSkills.length > 0 || missingResponsibilities.length > 0) ? (
                                                <ul className="score-card-list">
                                                    {[...missingSkills, ...missingResponsibilities].map((m, i) => (
                                                        <li key={i}>{m}</li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <p className="score-card-empty">No missing requirements identified.</p>
                                            )}
                                        </div>
                                    </div>

                                    {scoreExp.reasoning && (
                                        <div className="score-explanation__summary-box">
                                            <strong>Summary:</strong> {scoreExp.reasoning}
                                        </div>
                                    )}
                                </div>

                                {/* 4. Actionable Next Steps */}
                                {report.nextSteps?.length > 0 && (
                                    <div className="next-steps-card">
                                        <h4>Recommended Next Steps</h4>
                                        <ol className="next-steps-list">
                                            {report.nextSteps.map((step, i) => (
                                                <li key={i}>
                                                    <span className="next-step-num">{i + 1}</span>
                                                    <span className="next-step-text">{step}</span>
                                                </li>
                                            ))}
                                        </ol>
                                    </div>
                                )}

                                {/* 5. Canonical Skill Classification (Complete Requirement Match Breakdown) */}
                                {classificationList.length > 0 && (
                                    <div className="skill-classification-section">
                                        <div className="classification-header">
                                            <div>
                                                <h4>Complete Requirement Match Breakdown</h4>
                                                <p className="section-subtext">Every JD requirement categorized by verified candidate evidence.</p>
                                            </div>
                                            <div className="classification-tools-row">
                                                <div className="req-search-box">
                                                    <span className="search-icon">🔍</span>
                                                    <input
                                                        type="text"
                                                        placeholder="Search requirements..."
                                                        value={reqSearchQuery}
                                                        onChange={(e) => setReqSearchQuery(e.target.value)}
                                                        className="req-search-input"
                                                    />
                                                    {reqSearchQuery && (
                                                        <button type="button" className="clear-search-btn" onClick={() => setReqSearchQuery('')}>✕</button>
                                                    )}
                                                </div>
                                                <div className="view-toggle-btns">
                                                    <button
                                                        type="button"
                                                        className={`view-btn ${classificationView === 'cards' ? 'view-btn--active' : ''}`}
                                                        onClick={() => setClassificationView('cards')}
                                                    >
                                                        Cards
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className={`view-btn ${classificationView === 'table' ? 'view-btn--active' : ''}`}
                                                        onClick={() => setClassificationView('table')}
                                                    >
                                                        Table
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="segmented-filter-bar" role="tablist">
                                            {[
                                                { id: 'ALL', label: 'All', icon: '', count: classificationList.length, cls: 'seg-filter-pill--all' },
                                                { id: 'PRESENT', label: 'Present', icon: '✓', count: strongSkills.length + demonstratedResponsibilities.length, cls: 'seg-filter-pill--present' },
                                                { id: 'PARTIALLY_DEMONSTRATED', label: 'Partial', icon: '~', count: partialSkills.length + partialResponsibilities.length, cls: 'seg-filter-pill--partial' },
                                                { id: 'NOT_DEMONSTRATED', label: 'Not Demonstrated', icon: '!', count: notDemonstratedSkills.length + notDemonstratedResponsibilities.length, cls: 'seg-filter-pill--not-demonstrated' },
                                                { id: 'MISSING', label: 'Missing', icon: '✕', count: missingSkills.length + missingResponsibilities.length, cls: 'seg-filter-pill--missing' }
                                            ].map(f => (
                                                <button
                                                    key={f.id}
                                                    type="button"
                                                    role="tab"
                                                    aria-selected={statusFilter === f.id}
                                                    className={`seg-filter-pill ${f.cls} ${statusFilter === f.id ? 'seg-filter-pill--active' : ''}`}
                                                    onClick={() => setStatusFilter(f.id)}
                                                >
                                                    {f.icon && <span className="pill-icon">{f.icon}</span>}
                                                    <span className="pill-label">{f.label}</span>
                                                    <span className="pill-count">{f.count}</span>
                                                </button>
                                            ))}
                                        </div>

                                        {classificationView === 'cards' ? (
                                            searchedAndFilteredClassification.length > 0 ? (
                                                <div className="requirements-2col-grid">
                                                    {searchedAndFilteredClassification.map((item, i) => (
                                                        <RequirementCard
                                                            key={i}
                                                            item={item}
                                                            roadmapPlan={report.preparationPlan}
                                                            onNavigateToRoadmap={handleNavigateToRoadmap}
                                                        />
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="filter-empty-state">
                                                    <span className="empty-icon">✓</span>
                                                    <h4>No {statusFilter === 'MISSING' ? 'Missing' : 'Matching'} Requirements Found</h4>
                                                    <p>All analyzed requirements in this filter state have supporting evidence.</p>
                                                </div>
                                            )
                                        ) : (
                                            searchedAndFilteredClassification.length > 0 ? (
                                                <RequirementTable
                                                    items={searchedAndFilteredClassification}
                                                    roadmapPlan={report.preparationPlan}
                                                    onNavigateToRoadmap={handleNavigateToRoadmap}
                                                />
                                            ) : (
                                                <div className="filter-empty-state">
                                                    <span className="empty-icon">✓</span>
                                                    <h4>No {statusFilter === 'MISSING' ? 'Missing' : 'Matching'} Requirements Found</h4>
                                                    <p>All analyzed requirements in this filter state have supporting evidence.</p>
                                                </div>
                                            )
                                        )}
                                    </div>
                                )}

                            </section>
                        )}

                        {/* Technical Tab */}
                        {activeNav === 'technical' && (
                            <section>
                                <div className="content-header">
                                    <h2>Technical Questions (AI Interview Coach)</h2>
                                    <span className="content-header__count">{report.technicalQuestions?.length || 0} questions</span>
                                </div>
                                <div className="q-list">
                                    {report.technicalQuestions?.map((q, i) => (
                                        <TechnicalCard key={i} item={q} index={i} />
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* MCQ Tab */}
                        {activeNav === 'mcq' && (
                            <section>
                                <div className="content-header">
                                    <h2>MCQ Practice Simulation</h2>
                                    <span className="content-header__count">{report.mcqQuestions?.length || 0} questions</span>
                                </div>
                                <div className="mcq-list">
                                    {report.mcqQuestions?.length > 0 ? (
                                        report.mcqQuestions.map((mcq, i) => (
                                            <McqCard key={i} item={mcq} index={i} />
                                        ))
                                    ) : (
                                        <p className="empty-state">No MCQ practice questions generated.</p>
                                    )}
                                </div>
                            </section>
                        )}

                        {/* Behavioral Tab */}
                        {activeNav === 'behavioral' && (
                            <section>
                                <div className="content-header">
                                    <h2>Behavioral Questions (STAR Method)</h2>
                                    <span className="content-header__count">{report.behavioralQuestions?.length || 0} questions</span>
                                </div>
                                <div className="q-list">
                                    {report.behavioralQuestions?.map((q, i) => (
                                        <BehavioralCard key={i} item={q} index={i} />
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Skill Gaps Tab (Gaps to Improve) */}
                        {activeNav === 'skillgaps' && (
                            <section className="skillgaps-tab-content">
                                <div className="content-header">
                                    <div>
                                        <h2>Gaps to Improve</h2>
                                        <p className="content-subtitle">Skills and experience areas that need attention for this target role.</p>
                                    </div>
                                    <div className="gaps-summary-pills">
                                        <span className="summary-pill summary-pill--skills">Skills: {skillGapsList.length}</span>
                                        <span className="summary-pill summary-pill--experience">Experience / Tasks: {expGapsList.length}</span>
                                        <span className="summary-pill summary-pill--total">Total: {canonicalGaps.length}</span>
                                    </div>
                                </div>

                                <div className="segmented-filter-bar" role="tablist">
                                    {[
                                        { id: 'ALL', label: 'All Gaps', icon: '', count: canonicalGaps.length, cls: 'seg-filter-pill--all' },
                                        { id: 'SKILL', label: 'Skills', icon: '✓', count: skillGapsList.length, cls: 'seg-filter-pill--partial' },
                                        { id: 'RESPONSIBILITY', label: 'Experience / Tasks', icon: '⚡', count: expGapsList.length, cls: 'seg-filter-pill--not-demonstrated' }
                                    ].map(f => (
                                        <button
                                            key={f.id}
                                            type="button"
                                            role="tab"
                                            aria-selected={gapTypeFilter === f.id}
                                            className={`seg-filter-pill ${f.cls} ${gapTypeFilter === f.id ? 'seg-filter-pill--active' : ''}`}
                                            onClick={() => setGapTypeFilter(f.id)}
                                        >
                                            {f.icon && <span className="pill-icon">{f.icon}</span>}
                                            <span className="pill-label">{f.label}</span>
                                            <span className="pill-count">{f.count}</span>
                                        </button>
                                    ))}
                                </div>

                                {filteredGaps.length > 0 ? (
                                    <div className="gaps-2col-grid">
                                        {filteredGaps.map((gap, i) => (
                                            <GapCard
                                                key={i}
                                                gap={gap}
                                                index={i}
                                                roadmapPlan={report.preparationPlan}
                                                onNavigateToRoadmap={handleNavigateToRoadmap}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="filter-empty-state">
                                        <span className="empty-icon">✓</span>
                                        <h4>No {gapTypeFilter === 'SKILL' ? 'Skill' : 'Experience'} Gaps Identified</h4>
                                        <p>
                                            {gapTypeFilter === 'SKILL'
                                                ? 'Your current resume demonstrates the identified skill requirements.'
                                                : 'Your current experience covers the identified responsibilities.'}
                                        </p>
                                    </div>
                                )}
                            </section>
                        )}

                        {/* Roadmap Tab */}
                        {activeNav === 'roadmap' && (
                            <section className="roadmap-tab-content">
                                {returnContext && (
                                    <div className="roadmap-return-banner">
                                        <button
                                            type="button"
                                            className="roadmap-return-btn"
                                            onClick={() => {
                                                setActiveNav(returnContext.tab || 'overview');
                                                setReturnContext(null);
                                                setTargetRoadmapDay(null);
                                            }}
                                        >
                                            ← Back to {returnContext.label}
                                        </button>
                                        <span className="roadmap-return-hint">
                                            {targetRoadmapDay ? `Focusing on Roadmap Day ${targetRoadmapDay}` : `${report.preparationPlan?.length || report.planConfig?.roadmapDays || 15}-Day Preparation Roadmap`}
                                        </span>
                                    </div>
                                )}

                                {journeyFeedback && (
                                    <div className={`profile-alert-banner ${journeyFeedback.type === 'success' ? 'profile-alert-banner--success' : 'profile-alert-banner--error'}`} style={{ marginBottom: '1rem' }}>
                                        <span className="alert-icon">{journeyFeedback.type === 'success' ? '✓' : '⚠️'}</span>
                                        <span>{journeyFeedback.message}</span>
                                        <button
                                            type="button"
                                            onClick={() => setJourneyFeedback(null)}
                                            style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontWeight: 'bold' }}
                                        >
                                            ✕
                                        </button>
                                    </div>
                                )}

                                {!journeyState ? (
                                    <div className="roadmap-journey-cta-card">
                                        <div className="cta-left">
                                            <div className="cta-badge-row">
                                                <span className="cta-pill">🎯 Active Learning Journey</span>
                                                <span className="cta-tag">Recommended</span>
                                            </div>
                                            <h3>Start Your Preparation for {cleanTrackTitle || report.title}</h3>
                                            <p>Viewing this roadmap does not mark preparation as started. Click below to begin Day 1, track daily tasks, build learning streaks, and unlock achievements.</p>
                                        </div>
                                        <button
                                            type="button"
                                            className="button primary-button btn-start-journey"
                                            onClick={handleStartJourney}
                                            disabled={isStartingJourney}
                                        >
                                            {isStartingJourney ? 'Starting Journey...' : '🚀 Start Learning Journey'}
                                        </button>
                                    </div>
                                ) : (
                                    <div className="roadmap-journey-active-banner">
                                        <div className="active-banner-left">
                                            <div className="banner-top-row">
                                                <span className="active-badge-pill">🔥 Active Journey</span>
                                                <span className="banner-day-tag">Day {journeyState.currentDay} of {journeyState.roadmapDays}</span>
                                                {journeyState.status === 'COMPLETED' && (
                                                    <span className="banner-completed-tag">🎉 Journey Complete</span>
                                                )}
                                            </div>
                                            <h3 className="banner-focus-title">
                                                Current Focus: <span>{journeyState.currentFocus || `Day ${journeyState.currentDay} Competencies`}</span>
                                            </h3>
                                            <div className="banner-progress-wrap">
                                                <div className="banner-progress-info">
                                                    <span>Overall Progress: <strong>{journeyState.overallProgress}%</strong> ({journeyState.completedDays?.length || 0}/{journeyState.roadmapDays} Days Completed)</span>
                                                </div>
                                                <div className="banner-progress-track">
                                                    <div className="banner-progress-fill" style={{ width: `${journeyState.overallProgress}%` }} />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="active-banner-right">
                                            <Link to="/dashboard" className="button secondary-button btn-dashboard-link">
                                                📊 View Dashboard
                                            </Link>
                                        </div>
                                    </div>
                                )}

                                <div className="content-header">
                                    <div>
                                        <h2>{report.preparationPlan?.length || report.planConfig?.roadmapDays || 15}-Day Preparation Roadmap</h2>
                                        <p className="content-subtitle">Structured day-by-day learning plan to master target role competencies.</p>
                                    </div>
                                    <span className="content-header__count">{report.preparationPlan?.length || 0}-day plan</span>
                                </div>

                                <div className="roadmap-list">
                                    {report.preparationPlan?.map((day) => {
                                        const isCompleted = journeyState?.completedDays?.includes(day.day) || false;
                                        const isCurrent = journeyState ? journeyState.currentDay === day.day : day.day === 1;
                                        const dayProg = journeyState?.dayProgress?.find(d => d.day === day.day);
                                        const completedTasks = dayProg?.completedTasks || [];

                                        return (
                                            <RoadMapDay
                                                key={day.day}
                                                day={day}
                                                defaultOpen={day.day === targetRoadmapDay || isCurrent}
                                                isHighlighted={day.day === targetRoadmapDay}
                                                isJourneyActive={Boolean(journeyState)}
                                                isCompleted={isCompleted}
                                                isCurrentDay={isCurrent}
                                                completedTasks={completedTasks}
                                                onCompleteDay={handleCompleteDay}
                                                onToggleTask={handleToggleTask}
                                                onStartJourney={handleStartJourney}
                                            />
                                        );
                                    })}
                                </div>
                            </section>
                        )}

                        {/* ATS Tab */}
                        {activeNav === 'ats' && (
                            <section>
                                <div className="content-header">
                                    <h2>ATS Resume Compatibility</h2>
                                </div>
                                <AtsSection
                                    ats={report.atsAnalysis}
                                    atsStatus={report.atsStatus}
                                    onRetry={onRetryAtsClick}
                                    isRetrying={isRetryingAts}
                                />
                            </section>
                        )}

                    </main>

                    {/* ── Right Sidebar ── */}
                    <aside className="interview-sidebar">

                        {/* Match Score */}
                        <div className="match-score">
                            <p className="match-score__label">Match Score</p>
                            <div className={`match-score__ring ${scoreInfo.colorClass}`}>
                                <span className="match-score__value">{report.matchScore}</span>
                                <span className="match-score__pct">%</span>
                            </div>
                            <p className="match-score__sub" style={{ color: scoreInfo.badgeColor }}>
                                {scoreInfo.label}
                            </p>
                        </div>

                        {cleanTrackTitle && (
                            <>
                                <div className="sidebar-divider" />
                                <div className="skill-gaps">
                                    <p className="skill-gaps__label">Target Track</p>
                                    <span className="sidebar-track-tag">{cleanTrackTitle}</span>
                                </div>
                            </>
                        )}

                        <div className="sidebar-divider" />

                        {/* Areas to Improve */}
                        <div className="skill-gaps">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                <p className="skill-gaps__label" style={{ margin: 0 }}>Areas to Improve</p>
                                <span style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600 }}>
                                    Skills {totalSkillGaps} · Tasks {totalRespGaps}
                                </span>
                            </div>

                            {totalSkillGaps > 0 && (
                                <div style={{ marginBottom: '0.75rem' }}>
                                    <span style={{ fontSize: '0.7rem', color: '#F87171', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em', display: 'block', marginBottom: '0.35rem' }}>
                                        Skills ({totalSkillGaps})
                                    </span>
                                    <div className="skill-gaps__list">
                                        {[...partialSkills, ...notDemonstratedSkills, ...missingSkills].map((skillName, i) => (
                                            <span
                                                key={i}
                                                className={`skill-tag ${missingSkills.includes(skillName) ? 'skill-tag--high' : notDemonstratedSkills.includes(skillName) ? 'skill-tag--orange' : 'skill-tag--medium'}`}
                                            >
                                                {skillName}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {totalRespGaps > 0 && (
                                <div>
                                    <span style={{ fontSize: '0.7rem', color: '#FBBF24', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em', display: 'block', marginBottom: '0.35rem' }}>
                                        Experience / Tasks ({totalRespGaps})
                                    </span>
                                    <div className="skill-gaps__list">
                                        {[...partialResponsibilities, ...notDemonstratedResponsibilities, ...missingResponsibilities].map((respName, i) => (
                                            <span
                                                key={i}
                                                className={`skill-tag ${missingResponsibilities.includes(respName) ? 'skill-tag--high' : notDemonstratedResponsibilities.includes(respName) ? 'skill-tag--orange' : 'skill-tag--medium'}`}
                                            >
                                                {respName}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* ATS Score in Sidebar */}
                        {report.atsAnalysis && (
                            <>
                                <div className="sidebar-divider" />
                                <div className="skill-gaps">
                                    <p className="skill-gaps__label">ATS Score</p>
                                    <div className="match-score__ring" style={{
                                        borderColor: report.atsAnalysis.atsScore >= 80 ? '#22C55E' : report.atsAnalysis.atsScore >= 60 ? '#F59E0B' : '#EF4444',
                                        width: '72px', height: '72px', borderWidth: '3px', margin: '0 auto'
                                    }}>
                                        <span className="match-score__value" style={{ fontSize: '1.25rem' }}>{report.atsAnalysis.atsScore}</span>
                                        <span className="match-score__pct">%</span>
                                    </div>
                                </div>
                            </>
                        )}

                    </aside>
                </div>
            </div>
        </AppShell>
    );
};

export default Interview;