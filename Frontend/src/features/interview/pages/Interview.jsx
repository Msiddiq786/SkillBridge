import React, { useState, useEffect } from 'react'
import '../style/interview.scss'
import { useInterview } from '../hooks/useInterview.js'
import { useNavigate, useParams, Link } from 'react-router'

const NAV_ITEMS = [
    { id: 'overview', label: 'Overview', icon: (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>) },
    { id: 'technical', label: 'Technical Questions', icon: (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></svg>) },
    { id: 'mcq', label: 'MCQ Practice', icon: (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" /></svg>) },
    { id: 'behavioral', label: 'Behavioral Questions', icon: (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>) },
    { id: 'skillgaps', label: 'Skill Gaps', icon: (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>) },
    { id: 'roadmap', label: 'Road Map', icon: (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11" /></svg>) },
    { id: 'ats', label: 'ATS Analysis', icon: (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>) },
]

// ── Copy button helper ────────────────────────────────────────────────────────
const CopyButton = ({ text }) => {
    const [copied, setCopied] = useState(false)
    const handleCopy = async (e) => {
        e.stopPropagation()
        try {
            await navigator.clipboard.writeText(text)
            setCopied(true)
            setTimeout(() => setCopied(false), 1500)
        } catch { /* fallback: silent */ }
    }
    return (
        <button className="copy-btn" onClick={handleCopy} title="Copy answer">
            {copied ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
            ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
            )}
            <span>{copied ? "Copied!" : "Copy"}</span>
        </button>
    )
}

// ── Difficulty badge ──────────────────────────────────────────────────────────
const DiffBadge = ({ level }) => {
    const cls = (level || '').toLowerCase()
    return <span className={`diff-badge diff-badge--${cls}`}>{level}</span>
}

// ── Technical Question Card (Coaching Structure) ──────────────────────────────
const TechnicalCard = ({ item, index }) => {
    const [open, setOpen] = useState(false)
    const spokenAnswer = item.interviewAnswer || item.answer || item.oneLineAnswer || ""

    return (
        <div className='q-card'>
            <div className='q-card__header' onClick={() => setOpen(o => !o)}>
                <span className='q-card__index'>Q{index + 1}</span>
                <DiffBadge level={item.difficulty} />
                {item.category && <span className='q-card__category'>{item.category}</span>}
                {item.estimatedInterviewTime && <span className='q-card__time'>{item.estimatedInterviewTime}</span>}
                <p className='q-card__question'>{item.question}</p>
                <span className={`q-card__chevron ${open ? 'q-card__chevron--open' : ''}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
                </span>
            </div>
            {open && (
                <div className='q-card__body'>
                    {/* ⭐ One-Line Direct Answer */}
                    {item.oneLineAnswer && (
                        <div className='q-card__coach-banner'>
                            <span className='q-card__coach-badge'>⭐ One-Line Answer</span>
                            <p className='q-card__coach-text'>{item.oneLineAnswer}</p>
                        </div>
                    )}

                    {/* Intention */}
                    {item.intention && (
                        <div className='q-card__section'>
                            <span className='q-card__tag q-card__tag--intention'>🎯 What the Interviewer Evaluates</span>
                            <p>{item.intention}</p>
                        </div>
                    )}

                    {/* 🧠 Simple Explanation */}
                    {item.simpleExplanation && (
                        <div className='q-card__section'>
                            <span className='q-card__tag q-card__tag--explanation'>🧠 Simple Explanation</span>
                            <p className='q-card__desc-text'>{item.simpleExplanation}</p>
                        </div>
                    )}

                    {/* 💡 Easy Example */}
                    {item.easyExample && (
                        <div className='q-card__section'>
                            <span className='q-card__tag q-card__tag--example'>💡 Easy Example</span>
                            <div className='q-card__code-block'>
                                <pre>{item.easyExample}</pre>
                            </div>
                        </div>
                    )}

                    {/* 🌍 Real-World Example */}
                    {item.realWorldExample && (
                        <div className='q-card__section'>
                            <span className='q-card__tag q-card__tag--realworld'>🌍 Real-World Use Case</span>
                            <p className='q-card__desc-text'>{item.realWorldExample}</p>
                        </div>
                    )}

                    {/* 🗣️ How to Say It in an Interview */}
                    {spokenAnswer && (
                        <div className='q-card__section q-card__speak-section'>
                            <div className='q-card__section-header'>
                                <span className='q-card__tag q-card__tag--answer'>🗣️ How to Say It in an Interview</span>
                                <CopyButton text={spokenAnswer} />
                            </div>
                            <div className='q-card__speak-box'>
                                <p>"{spokenAnswer}"</p>
                            </div>
                        </div>
                    )}

                    {/* ⚠️ Common Mistakes */}
                    {item.commonMistakes?.length > 0 && (
                        <div className='q-card__section'>
                            <span className='q-card__tag q-card__tag--mistakes'>⚠️ Common Mistakes</span>
                            <ul className='q-card__list'>
                                {item.commonMistakes.map((m, i) => <li key={i}>{m}</li>)}
                            </ul>
                        </div>
                    )}

                    {/* 🔄 Follow-up Questions (5) */}
                    {item.followUpQuestions?.length > 0 && (
                        <div className='q-card__section'>
                            <span className='q-card__tag q-card__tag--followup'>🔄 Progressive Follow-up Questions ({item.followUpQuestions.length})</span>
                            <ol className='q-card__followup-list'>
                                {item.followUpQuestions.map((f, i) => (
                                    <li key={i}>
                                        <span className='followup-num'>{i + 1}</span>
                                        <span className='followup-text'>{f}</span>
                                    </li>
                                ))}
                            </ol>
                        </div>
                    )}

                    {/* 📚 Resources */}
                    {item.resources?.length > 0 && (
                        <div className='q-card__section'>
                            <span className='q-card__tag q-card__tag--resources'>📚 Recommended Resources</span>
                            <div className='q-card__resource-pills'>
                                {item.resources.map((r, i) => (
                                    <span key={i} className='resource-pill'>{r}</span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

// ── MCQ Question Card ─────────────────────────────────────────────────────────
const McqCard = ({ item, index }) => {
    const [selectedOption, setSelectedOption] = useState(null)
    const [submitted, setSubmitted] = useState(false)

    const handleSelect = (opt) => {
        if (!submitted) {
            setSelectedOption(opt)
        }
    }

    const handleSubmit = () => {
        if (selectedOption) {
            setSubmitted(true)
        }
    }

    const handleReset = () => {
        setSelectedOption(null)
        setSubmitted(false)
    }

    const isCorrect = submitted && selectedOption === item.correctAnswer

    return (
        <div className={`mcq-card ${submitted ? (isCorrect ? 'mcq-card--correct' : 'mcq-card--incorrect') : ''}`}>
            <div className="mcq-card__header">
                <div className="mcq-card__meta">
                    <span className="q-card__index">Q{index + 1}</span>
                    <DiffBadge level={item.difficulty} />
                    {item.category && <span className="q-card__category">{item.category}</span>}
                </div>
                <p className="mcq-card__question">{item.question}</p>
            </div>

            <div className="mcq-card__options">
                {item.options?.map((opt, i) => {
                    const isSelected = selectedOption === opt
                    let optClass = 'mcq-option'
                    if (submitted) {
                        if (opt === item.correctAnswer) optClass += ' mcq-option--correct'
                        else if (isSelected) optClass += ' mcq-option--wrong'
                    } else if (isSelected) {
                        optClass += ' mcq-option--selected'
                    }

                    return (
                        <button
                            key={i}
                            type="button"
                            className={optClass}
                            onClick={() => handleSelect(opt)}
                            disabled={submitted}
                        >
                            <span className="mcq-option__letter">{String.fromCharCode(65 + i)}</span>
                            <span className="mcq-option__text">{opt}</span>
                            {submitted && opt === item.correctAnswer && (
                                <span className="mcq-option__badge">✓ Correct</span>
                            )}
                            {submitted && isSelected && opt !== item.correctAnswer && (
                                <span className="mcq-option__badge mcq-option__badge--wrong">✗ Your answer</span>
                            )}
                        </button>
                    )
                })}
            </div>

            <div className="mcq-card__footer">
                {!submitted ? (
                    <button
                        type="button"
                        className="button primary-button mcq-submit-btn"
                        onClick={handleSubmit}
                        disabled={!selectedOption}
                    >
                        Check Answer
                    </button>
                ) : (
                    <div className="mcq-card__result">
                        <div className="mcq-card__explanation">
                            <span className="q-card__tag q-card__tag--answer">Explanation</span>
                            <p>{item.explanation}</p>
                            {item.resource && (
                                <p className="mcq-card__resource">
                                    <strong>Resource:</strong> {item.resource}
                                </p>
                            )}
                        </div>
                        <button type="button" className="mcq-reset-btn" onClick={handleReset}>
                            Try Again
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}

// ── Behavioral Question Card (STAR Coaching Structure) ────────────────────────
const BehavioralCard = ({ item, index }) => {
    const [open, setOpen] = useState(false)
    const spokenAnswer = item.interviewAnswer || item.answer || ""
    const hasStarBreakdown = item.situation || item.task || item.action || item.result

    return (
        <div className='q-card'>
            <div className='q-card__header' onClick={() => setOpen(o => !o)}>
                <span className='q-card__index'>Q{index + 1}</span>
                <DiffBadge level={item.difficulty} />
                <p className='q-card__question'>{item.question}</p>
                <span className={`q-card__chevron ${open ? 'q-card__chevron--open' : ''}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
                </span>
            </div>
            {open && (
                <div className='q-card__body'>
                    {/* 🎯 What the Interviewer is Checking */}
                    {item.intention && (
                        <div className='q-card__section'>
                            <span className='q-card__tag q-card__tag--intention'>🎯 What the Interviewer Checks</span>
                            <p>{item.intention}</p>
                        </div>
                    )}

                    {/* 🧩 How to Answer */}
                    {item.howToAnswer && (
                        <div className='q-card__section'>
                            <span className='q-card__tag q-card__tag--explanation'>🧩 How to Approach This (STAR Method)</span>
                            <p className='q-card__desc-text'>{item.howToAnswer}</p>
                        </div>
                    )}

                    {/* ⭐ STAR Example Breakdown */}
                    {hasStarBreakdown && (
                        <div className='q-card__section'>
                            <span className='q-card__tag q-card__tag--example'>⭐ STAR Example Breakdown</span>
                            <div className='q-card__star-grid'>
                                {item.situation && (
                                    <div className='q-card__star-item'>
                                        <span className='star-letter'>S</span>
                                        <div className='star-content'>
                                            <strong>Situation</strong>
                                            <p>{item.situation}</p>
                                        </div>
                                    </div>
                                )}
                                {item.task && (
                                    <div className='q-card__star-item'>
                                        <span className='star-letter'>T</span>
                                        <div className='star-content'>
                                            <strong>Task</strong>
                                            <p>{item.task}</p>
                                        </div>
                                    </div>
                                )}
                                {item.action && (
                                    <div className='q-card__star-item'>
                                        <span className='star-letter'>A</span>
                                        <div className='star-content'>
                                            <strong>Action</strong>
                                            <p>{item.action}</p>
                                        </div>
                                    </div>
                                )}
                                {item.result && (
                                    <div className='q-card__star-item'>
                                        <span className='star-letter'>R</span>
                                        <div className='star-content'>
                                            <strong>Result</strong>
                                            <p>{item.result}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* 🗣️ Simple Spoken Interview Answer */}
                    {spokenAnswer && (
                        <div className='q-card__section q-card__speak-section'>
                            <div className='q-card__section-header'>
                                <span className='q-card__tag q-card__tag--answer'>🗣️ Spoken Interview Answer</span>
                                <CopyButton text={spokenAnswer} />
                            </div>
                            <div className='q-card__speak-box'>
                                <p>"{spokenAnswer}"</p>
                            </div>
                        </div>
                    )}

                    {/* ⚠️ Common Mistakes */}
                    {item.commonMistakes?.length > 0 && (
                        <div className='q-card__section'>
                            <span className='q-card__tag q-card__tag--mistakes'>⚠️ Common Mistakes</span>
                            <ul className='q-card__list'>
                                {item.commonMistakes.map((m, i) => <li key={i}>{m}</li>)}
                            </ul>
                        </div>
                    )}

                    {/* 🔄 Follow-up Questions (3-5) */}
                    {item.followUpQuestions?.length > 0 && (
                        <div className='q-card__section'>
                            <span className='q-card__tag q-card__tag--followup'>🔄 Follow-up Questions ({item.followUpQuestions.length})</span>
                            <ol className='q-card__followup-list'>
                                {item.followUpQuestions.map((f, i) => (
                                    <li key={i}>
                                        <span className='followup-num'>{i + 1}</span>
                                        <span className='followup-text'>{f}</span>
                                    </li>
                                ))}
                            </ol>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

// ── Skill Gap Card ────────────────────────────────────────────────────────────
const SkillGapCard = ({ gap, index }) => {
    const [open, setOpen] = useState(false)
    return (
        <div className='q-card'>
            <div className='q-card__header' onClick={() => setOpen(o => !o)}>
                <span className='q-card__index'>{index + 1}</span>
                <span className={`skill-tag skill-tag--${gap.severity}`}>{gap.severity}</span>
                <span className='q-card__category'>{gap.priority}</span>
                <p className='q-card__question'>{gap.skill}</p>
                <span className={`q-card__chevron ${open ? 'q-card__chevron--open' : ''}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
                </span>
            </div>
            {open && (
                <div className='q-card__body'>
                    {gap.reason && (
                        <div className='q-card__section'>
                            <span className='q-card__tag q-card__tag--intention'>Why It Matters</span>
                            <p>{gap.reason}</p>
                        </div>
                    )}
                    {gap.improvement && (
                        <div className='q-card__section'>
                            <span className='q-card__tag q-card__tag--answer'>How to Improve</span>
                            <p>{gap.improvement}</p>
                        </div>
                    )}
                    {gap.estimatedLearningTime && (
                        <div className='q-card__section'>
                            <span className='q-card__tag q-card__tag--followup'>Learning Time</span>
                            <p>{gap.estimatedLearningTime}</p>
                        </div>
                    )}
                    {gap.resources?.length > 0 && (
                        <div className='q-card__section'>
                            <span className='q-card__tag q-card__tag--resources'>Resources</span>
                            <ul className='q-card__list'>
                                {gap.resources.map((r, i) => <li key={i}>{r}</li>)}
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

// ── Roadmap Day Card ──────────────────────────────────────────────────────────
const RoadMapDay = ({ day }) => {
    const [open, setOpen] = useState(false)
    return (
        <div className='roadmap-day'>
            <div className='roadmap-day__header' onClick={() => setOpen(o => !o)} style={{ cursor: 'pointer' }}>
                <span className='roadmap-day__badge'>Day {day.day}</span>
                {day.difficulty && <DiffBadge level={day.difficulty} />}
                {day.estimatedStudyTime && <span className='q-card__time'>{day.estimatedStudyTime}</span>}
                <h3 className='roadmap-day__focus'>{day.focus}</h3>
            </div>
            <ul className='roadmap-day__tasks'>
                {day.tasks?.map((task, i) => (
                    <li key={i}>
                        <span className='roadmap-day__bullet' />
                        {task}
                    </li>
                ))}
            </ul>
            {open && (
                <div className='roadmap-day__extra'>
                    {day.resources?.length > 0 && (
                        <div className='q-card__section'>
                            <span className='q-card__tag q-card__tag--resources'>Resources</span>
                            <ul className='q-card__list'>
                                {day.resources.map((r, i) => <li key={i}>{r}</li>)}
                            </ul>
                        </div>
                    )}
                    {day.expectedOutcome && (
                        <div className='q-card__section'>
                            <span className='q-card__tag q-card__tag--answer'>Expected Outcome</span>
                            <p>{day.expectedOutcome}</p>
                        </div>
                    )}
                </div>
            )}
            <button className='roadmap-day__toggle' onClick={() => setOpen(o => !o)}>
                {open ? 'Show less' : 'Show resources & outcome'}
            </button>
        </div>
    )
}

// ── ATS Analysis Section ──────────────────────────────────────────────────────
const AtsSection = ({ ats }) => {
    if (!ats) return <p className='empty-state'>ATS analysis not available for this report.</p>

    const scoreColor = ats.atsScore >= 80 ? '#3fb950' : ats.atsScore >= 60 ? '#f5a623' : '#ff4d4d'

    return (
        <div className='ats-section'>
            <div className='ats-score-card'>
                <div className='ats-score-ring' style={{ borderColor: scoreColor }}>
                    <span className='ats-score-value' style={{ color: scoreColor }}>{ats.atsScore}</span>
                    <span className='ats-score-label'>ATS Score</span>
                </div>
            </div>

            {ats.strongKeywords?.length > 0 && (
                <div className='ats-keywords'>
                    <h4>Strong Keywords</h4>
                    <div className='ats-tags'>
                        {ats.strongKeywords.map((kw, i) => (
                            <span key={i} className='skill-tag skill-tag--low'>{kw}</span>
                        ))}
                    </div>
                </div>
            )}

            {ats.weakKeywords?.length > 0 && (
                <div className='ats-keywords'>
                    <h4>Weak Keywords</h4>
                    <div className='ats-tags'>
                        {ats.weakKeywords.map((kw, i) => (
                            <span key={i} className='skill-tag skill-tag--medium'>{kw}</span>
                        ))}
                    </div>
                </div>
            )}

            {ats.missingKeywords?.length > 0 && (
                <div className='ats-keywords'>
                    <h4>Missing Keywords</h4>
                    <div className='ats-tags'>
                        {ats.missingKeywords.map((kw, i) => (
                            <span key={i} className='skill-tag skill-tag--high'>{kw}</span>
                        ))}
                    </div>
                </div>
            )}

            {ats.resumeStrengths?.length > 0 && (
                <div className='ats-list-section'>
                    <h4>Resume Strengths</h4>
                    <ul className='q-card__list'>
                        {ats.resumeStrengths.map((s, i) => <li key={i}>{s}</li>)}
                    </ul>
                </div>
            )}

            {ats.resumeWeaknesses?.length > 0 && (
                <div className='ats-list-section'>
                    <h4>Resume Weaknesses</h4>
                    <ul className='q-card__list'>
                        {ats.resumeWeaknesses.map((w, i) => <li key={i}>{w}</li>)}
                    </ul>
                </div>
            )}

            {ats.improvementSuggestions?.length > 0 && (
                <div className='ats-list-section'>
                    <h4>Improvement Suggestions</h4>
                    <ul className='q-card__list'>
                        {ats.improvementSuggestions.map((s, i) => <li key={i}>{s}</li>)}
                    </ul>
                </div>
            )}
        </div>
    )
}

// ── Collapsible Chip Group Helper ─────────────────────────────────────────────
const CollapsibleChipList = ({ title, items, tagClass, initialLimit = 8 }) => {
    const [expanded, setExpanded] = useState(false)
    if (!items || items.length === 0) return null

    const visibleItems = expanded ? items : items.slice(0, initialLimit)
    const hasMore = items.length > initialLimit

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
    )
}

// ── Skill Classification Card (with Collapsible Evidence) ─────────────────────
const SkillClassificationCard = ({ item }) => {
    const [showEvidence, setShowEvidence] = useState(false)
    const reqName = item.requirement || item.skill || 'Requirement'
    const statusClass = (item.status || '').toLowerCase().replace(/_/g, '-')
    const statusLabel = item.status === 'PRESENT' ? 'Present'
        : item.status === 'PARTIALLY_DEMONSTRATED' ? 'Partial'
        : item.status === 'NOT_DEMONSTRATED' ? 'Not Demonstrated'
        : 'Missing'

    return (
        <div className={`skill-class-card skill-class-card--${statusClass}`}>
            <div className="skill-class-card__top">
                <span className="skill-class-card__name">{reqName}</span>
                <span className={`status-badge status-badge--${statusClass}`}>
                    {statusLabel}
                </span>
            </div>
            <div className="skill-class-card__meta">
                <span className="skill-class-card__type">{item.type || 'SKILL'}</span>
                {item.evidence && (
                    <button
                        type="button"
                        className={`evidence-toggle-btn ${showEvidence ? 'evidence-toggle-btn--active' : ''}`}
                        onClick={() => setShowEvidence(e => !e)}
                    >
                        {showEvidence ? 'Hide Evidence' : 'Why?'}
                    </button>
                )}
            </div>
            {showEvidence && item.evidence && (
                <div className="skill-class-card__evidence-box">
                    <span className="evidence-label">Evidence:</span>
                    <p>{item.evidence}</p>
                </div>
            )}
        </div>
    )
}

// ── Skill Classification Table Row (with Collapsible Evidence) ────────────────
const SkillClassificationTableRow = ({ item }) => {
    const [showEvidence, setShowEvidence] = useState(false)
    const reqName = item.requirement || item.skill || 'Requirement'
    const statusClass = (item.status || '').toLowerCase().replace(/_/g, '-')
    const statusLabel = item.status === 'PRESENT' ? 'Present'
        : item.status === 'PARTIALLY_DEMONSTRATED' ? 'Partial'
        : item.status === 'NOT_DEMONSTRATED' ? 'Not Demonstrated'
        : 'Missing'

    return (
        <>
            <tr>
                <td className="table-req-name">{reqName}</td>
                <td><span className="table-type-badge">{item.type || 'SKILL'}</span></td>
                <td><span className={`status-badge status-badge--${statusClass}`}>{statusLabel}</span></td>
                <td className="table-evidence-cell">
                    {item.evidence ? (
                        <button
                            type="button"
                            className={`evidence-toggle-btn ${showEvidence ? 'evidence-toggle-btn--active' : ''}`}
                            onClick={() => setShowEvidence(e => !e)}
                        >
                            {showEvidence ? 'Hide' : 'Why?'}
                        </button>
                    ) : '—'}
                </td>
            </tr>
            {showEvidence && item.evidence && (
                <tr className="table-evidence-row">
                    <td colSpan="4">
                        <div className="table-evidence-box">
                            <strong>Evidence:</strong> {item.evidence}
                        </div>
                    </td>
                </tr>
            )}
        </>
    )
}

// ── Main Component ────────────────────────────────────────────────────────────
const Interview = () => {
    const [activeNav, setActiveNav] = useState('overview')
    const [showRoleDetails, setShowRoleDetails] = useState(false)
    const [classificationView, setClassificationView] = useState('cards')
    const [statusFilter, setStatusFilter] = useState('ALL')

    const { report, getReportById, loading, getResumePdf } = useInterview()
    const { interviewId } = useParams()

    useEffect(() => {
        if (interviewId) {
            getReportById(interviewId)
        }
    }, [interviewId])

    if (loading || !report) {
        return (
            <main className='loading-screen'>
                <h1>Loading your interview plan...</h1>
            </main>
        )
    }

    const scoreColor =
        report.matchScore >= 80 ? 'score--high' :
            report.matchScore >= 60 ? 'score--mid' : 'score--low'

    // Clean track title (short, no full JD blob)
    const cleanTrackTitle = report.selectedTrackTitle || 
        (report.selectedTrack && report.selectedTrack.length < 80 ? report.selectedTrack : null) || 
        report.title

    // Clean track details (for expansion modal/drawer)
    const trackDetailsText = report.selectedTrackDetails || 
        (report.selectedTrack && report.selectedTrack.length >= 80 ? report.selectedTrack : report.jobDescription)

    // Filtered skill classification
    const classificationList = report.skillClassification || []
    const filteredClassification = classificationList.filter(item => {
        if (statusFilter === 'ALL') return true
        return item.status === statusFilter
    })

    // Grouped requirements directly from canonical classification
    const presentSkills = report.strongSkills?.length > 0 ? report.strongSkills : 
        classificationList.filter(i => i.status === 'PRESENT').map(i => i.requirement || i.skill)
    
    const partialSkills = classificationList.filter(i => i.status === 'PARTIALLY_DEMONSTRATED').map(i => i.requirement || i.skill)
    const notDemonstratedSkills = classificationList.filter(i => i.status === 'NOT_DEMONSTRATED').map(i => i.requirement || i.skill)
    
    const missingItems = report.missingKeywords?.length > 0 ? report.missingKeywords : 
        classificationList.filter(i => i.status === 'MISSING').map(i => i.requirement || i.skill)

    // Score explanation lists
    const scoreExp = report.scoreExplanation || {}
    const expStrengths = scoreExp.strengths || []
    const expPartial = scoreExp.partial || []
    const expNotDemonstrated = scoreExp.notDemonstrated || []
    const expMissing = scoreExp.missing || []
    const expGaps = scoreExp.gaps || []

    return (
        <div className='interview-page'>
            <div className='interview-layout'>

                {/* ── Left Nav ── */}
                <nav className='interview-nav'>
                    <div className="nav-content">
                        <div style={{ marginBottom: "1.25rem", display: "flex", gap: "0.75rem" }}>
                            <Link to="/dashboard" style={{ fontSize: "0.8rem", color: "#ff2d78", textDecoration: "none", fontWeight: 500 }}>← Dashboard</Link>
                            <span style={{ color: "#7d8590", fontSize: "0.8rem" }}>|</span>
                            <Link to="/" style={{ fontSize: "0.8rem", color: "#7d8590", textDecoration: "none" }}>New Plan</Link>
                        </div>
                        <p className='interview-nav__label'>Sections</p>
                        {NAV_ITEMS.map(item => {
                            let countLabel = null
                            if (item.id === 'technical' && report.technicalQuestions) countLabel = report.technicalQuestions.length
                            if (item.id === 'mcq' && report.mcqQuestions) countLabel = report.mcqQuestions.length
                            if (item.id === 'behavioral' && report.behavioralQuestions) countLabel = report.behavioralQuestions.length
                            if (item.id === 'skillgaps' && report.skillGaps) countLabel = report.skillGaps.length
                            if (item.id === 'roadmap' && report.preparationPlan) countLabel = `${report.preparationPlan.length}d`

                            return (
                                <button
                                    key={item.id}
                                    className={`interview-nav__item ${activeNav === item.id ? 'interview-nav__item--active' : ''}`}
                                    onClick={() => setActiveNav(item.id)}
                                >
                                    <span className='interview-nav__icon'>{item.icon}</span>
                                    <span style={{ flex: 1 }}>{item.label}</span>
                                    {countLabel !== null && (
                                        <span className="nav-item-count">{countLabel}</span>
                                    )}
                                </button>
                            )
                        })}
                    </div>
                    <button
                        onClick={() => { getResumePdf(interviewId) }}
                        className='button primary-button' >
                        <svg height={"0.8rem"} style={{ marginRight: "0.8rem" }} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M10.6144 17.7956 11.492 15.7854C12.2731 13.9966 13.6789 12.5726 15.4325 11.7942L17.8482 10.7219C18.6162 10.381 18.6162 9.26368 17.8482 8.92277L15.5079 7.88394C13.7092 7.08552 12.2782 5.60881 11.5105 3.75894L10.6215 1.61673C10.2916.821765 9.19319.821767 8.8633 1.61673L7.97427 3.75892C7.20657 5.60881 5.77553 7.08552 3.97685 7.88394L1.63658 8.92277C.868537 9.26368.868536 10.381 1.63658 10.7219L4.0523 11.7942C5.80589 12.5726 7.21171 13.9966 7.99275 15.7854L8.8704 17.7956C9.20776 18.5682 10.277 18.5682 10.6144 17.7956ZM19.4014 22.6899 19.6482 22.1242C20.0882 21.1156 20.8807 20.3125 21.8695 19.8732L22.6299 19.5353C23.0412 19.3526 23.0412 18.7549 22.6299 18.5722L21.9121 18.2532C20.8978 17.8026 20.0911 16.9698 19.6586 15.9269L19.4052 15.3156C19.2285 14.8896 18.6395 14.8896 18.4628 15.3156L18.2094 15.9269C17.777 16.9698 16.9703 17.8026 15.956 18.2532L15.2381 18.5722C14.8269 18.7549 14.8269 19.3526 15.2381 19.5353L15.9985 19.8732C16.9874 20.3125 17.7798 21.1156 18.2198 22.1242L18.4667 22.6899C18.6473 23.104 19.2207 23.104 19.4014 22.6899Z"></path></svg>
                        Download Resume
                    </button>
                </nav>

                <div className='interview-divider' />

                {/* ── Center Content ── */}
                <main className='interview-content'>

                    {/* Overview tab */}
                    {activeNav === 'overview' && (
                        <section className="overview-tab-content">

                            {/* 1. Header Card with Target Track */}
                            <div className='overview-hero-card'>
                                <div className="overview-hero-top">
                                    <div>
                                        <h2 className="overview-title">{report.title || cleanTrackTitle || 'Interview Report'}</h2>
                                        {report.company && <p className='overview-company'>{report.company}</p>}
                                    </div>
                                    <div className="overview-score-pill">
                                        <span className="score-num">{report.matchScore}%</span>
                                        <span className="score-label">
                                            {report.matchScore >= 80 ? 'Strong Match' : report.matchScore >= 60 ? 'Good Match' : 'Needs Work'}
                                        </span>
                                    </div>
                                </div>

                                {/* Target Track Card */}
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
                                                    {showRoleDetails ? 'Hide Role Details' : 'View Role Details'}
                                                </button>
                                            )}
                                        </div>

                                        {showRoleDetails && trackDetailsText && (
                                            <div className="role-details-drawer">
                                                <h4>Job Description & Role Requirements</h4>
                                                <div className="role-details-text">
                                                    {trackDetailsText}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <p className='overview-summary-text'>{report.summary}</p>
                            </div>

                            {/* 2. Grouped Summary Badges (Strong, Partial, Not Demonstrated, Missing) */}
                            <div className="overview-grouped-grid">
                                <CollapsibleChipList
                                    title="Strong Skills"
                                    items={presentSkills}
                                    tagClass="skill-tag--low"
                                />
                                {partialSkills.length > 0 && (
                                    <CollapsibleChipList
                                        title="Partially Demonstrated"
                                        items={partialSkills}
                                        tagClass="skill-tag--medium"
                                    />
                                )}
                                {notDemonstratedSkills.length > 0 && (
                                    <CollapsibleChipList
                                        title="Not Demonstrated"
                                        items={notDemonstratedSkills}
                                        tagClass="skill-tag--orange"
                                    />
                                )}
                                {missingItems.length > 0 && (
                                    <CollapsibleChipList
                                        title="Missing Requirements"
                                        items={missingItems}
                                        tagClass="skill-tag--high"
                                    />
                                )}
                            </div>

                            {/* 3. Structured Score Explanation ("Why You Scored X%") */}
                            {report.scoreExplanation && (
                                <div className="score-explanation-card">
                                    <div className="card-section-title">
                                        <h4>Why You Scored {report.matchScore}%</h4>
                                        <span className="score-exp-badge">Evaluation Breakdown</span>
                                    </div>
                                    <div className="score-explanation__grid">
                                        {expStrengths.length > 0 && (
                                            <div className="score-exp-col score-exp-col--strengths">
                                                <h5>Key Strengths</h5>
                                                <ul>
                                                    {expStrengths.map((s, i) => (
                                                        <li key={i}>{s}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                        {expPartial.length > 0 && (
                                            <div className="score-exp-col score-exp-col--partial">
                                                <h5>Partially Demonstrated</h5>
                                                <ul>
                                                    {expPartial.map((p, i) => (
                                                        <li key={i}>{p}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                        {(expNotDemonstrated.length > 0 || (expMissing.length === 0 && expGaps.length > 0)) && (
                                            <div className="score-exp-col score-exp-col--orange">
                                                <h5>Not Demonstrated</h5>
                                                <ul>
                                                    {(expNotDemonstrated.length > 0 ? expNotDemonstrated : expGaps).map((g, i) => (
                                                        <li key={i}>{g}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                        {expMissing.length > 0 && (
                                            <div className="score-exp-col score-exp-col--gaps">
                                                <h5>Missing Requirements</h5>
                                                <ul>
                                                    {expMissing.map((m, i) => (
                                                        <li key={i}>{m}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                    {scoreExp.reasoning && (
                                        <div className="score-explanation__summary-box">
                                            <strong>Summary:</strong> {scoreExp.reasoning}
                                        </div>
                                    )}
                                </div>
                            )}

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

                            {/* 5. Canonical 4-Tier Skill & Requirement Classification */}
                            {classificationList.length > 0 && (
                                <div className="skill-classification-section">
                                    <div className="classification-header">
                                        <div>
                                            <h4>Skill & Requirement Classification</h4>
                                            <p className="section-subtext">Authoritative breakdown of all key job requirements with grounded evidence.</p>
                                        </div>
                                        <div className="classification-controls">
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

                                    {/* Filter Pills */}
                                    <div className="classification-filters">
                                        {['ALL', 'PRESENT', 'PARTIALLY_DEMONSTRATED', 'NOT_DEMONSTRATED', 'MISSING'].map(f => {
                                            const label = f === 'ALL' ? 'All Requirements'
                                                : f === 'PRESENT' ? 'Present'
                                                : f === 'PARTIALLY_DEMONSTRATED' ? 'Partial'
                                                : f === 'NOT_DEMONSTRATED' ? 'Not Demonstrated'
                                                : 'Missing'
                                            const count = f === 'ALL' ? classificationList.length : classificationList.filter(i => i.status === f).length

                                            return (
                                                <button
                                                    key={f}
                                                    type="button"
                                                    className={`filter-pill ${statusFilter === f ? 'filter-pill--active' : ''}`}
                                                    onClick={() => setStatusFilter(f)}
                                                >
                                                    {label} <span className="filter-pill-count">{count}</span>
                                                </button>
                                            )
                                        })}
                                    </div>

                                    {/* Cards View */}
                                    {classificationView === 'cards' && (
                                        <div className="skill-classification-grid">
                                            {filteredClassification.map((item, i) => (
                                                <SkillClassificationCard key={i} item={item} />
                                            ))}
                                        </div>
                                    )}

                                    {/* Table View */}
                                    {classificationView === 'table' && (
                                        <div className="classification-table-wrapper">
                                            <table className="classification-table">
                                                <thead>
                                                    <tr>
                                                        <th>Requirement</th>
                                                        <th>Type</th>
                                                        <th>Status</th>
                                                        <th>Evidence</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {filteredClassification.map((item, i) => (
                                                        <SkillClassificationTableRow key={i} item={item} />
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            )}

                        </section>
                    )}

                    {/* Technical tab */}
                    {activeNav === 'technical' && (
                        <section>
                            <div className='content-header'>
                                <h2>Technical Questions (AI Interview Coach)</h2>
                                <span className='content-header__count'>{report.technicalQuestions?.length || 0} questions</span>
                            </div>
                            <div className='q-list'>
                                {report.technicalQuestions?.map((q, i) => (
                                    <TechnicalCard key={i} item={q} index={i} />
                                ))}
                            </div>
                        </section>
                    )}

                    {/* MCQ tab */}
                    {activeNav === 'mcq' && (
                        <section>
                            <div className='content-header'>
                                <h2>MCQ Practice</h2>
                                <span className='content-header__count'>{report.mcqQuestions?.length || 0} questions</span>
                            </div>
                            <div className='mcq-list'>
                                {report.mcqQuestions && report.mcqQuestions.length > 0 ? (
                                    report.mcqQuestions.map((mcq, i) => (
                                        <McqCard key={i} item={mcq} index={i} />
                                    ))
                                ) : (
                                    <p className='empty-state'>No MCQ questions available for this report.</p>
                                )}
                            </div>
                        </section>
                    )}

                    {/* Behavioral tab */}
                    {activeNav === 'behavioral' && (
                        <section>
                            <div className='content-header'>
                                <h2>Behavioral Questions (STAR Method)</h2>
                                <span className='content-header__count'>{report.behavioralQuestions?.length || 0} questions</span>
                            </div>
                            <div className='q-list'>
                                {report.behavioralQuestions?.map((q, i) => (
                                    <BehavioralCard key={i} item={q} index={i} />
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Skill Gaps tab */}
                    {activeNav === 'skillgaps' && (
                        <section>
                            <div className='content-header'>
                                <h2>Skill Gaps</h2>
                                <span className='content-header__count'>{report.skillGaps?.length || 0} gaps</span>
                            </div>
                            <div className='q-list'>
                                {report.skillGaps?.map((gap, i) => (
                                    <SkillGapCard key={i} gap={gap} index={i} />
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Roadmap tab */}
                    {activeNav === 'roadmap' && (
                        <section>
                            <div className='content-header'>
                                <h2>Preparation Road Map</h2>
                                <span className='content-header__count'>{report.preparationPlan?.length || 0}-day plan</span>
                            </div>
                            <div className='roadmap-list'>
                                {report.preparationPlan?.map((day) => (
                                    <RoadMapDay key={day.day} day={day} />
                                ))}
                            </div>
                        </section>
                    )}

                    {/* ATS tab */}
                    {activeNav === 'ats' && (
                        <section>
                            <div className='content-header'>
                                <h2>ATS Resume Analysis</h2>
                            </div>
                            <AtsSection ats={report.atsAnalysis} />
                        </section>
                    )}
                </main>

                <div className='interview-divider' />

                {/* ── Right Sidebar ── */}
                <aside className='interview-sidebar'>

                    {/* Match Score */}
                    <div className='match-score'>
                        <p className='match-score__label'>Match Score</p>
                        <div className={`match-score__ring ${scoreColor}`}>
                            <span className='match-score__value'>{report.matchScore}</span>
                            <span className='match-score__pct'>%</span>
                        </div>
                        <p className='match-score__sub'>
                            {report.matchScore >= 80 ? 'Strong match' : report.matchScore >= 60 ? 'Good match' : 'Needs improvement'}
                        </p>
                    </div>

                    {cleanTrackTitle && (
                        <>
                            <div className='sidebar-divider' />
                            <div className='skill-gaps'>
                                <p className='skill-gaps__label'>Target Track</p>
                                <span className="sidebar-track-tag">{cleanTrackTitle}</span>
                            </div>
                        </>
                    )}

                    <div className='sidebar-divider' />

                    {/* Skill Gaps */}
                    <div className='skill-gaps'>
                        <p className='skill-gaps__label'>Skill Gaps</p>
                        <div className='skill-gaps__list'>
                            {report.skillGaps?.map((gap, i) => (
                                <span key={i} className={`skill-tag skill-tag--${gap.severity}`}>
                                    {gap.skill}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* ATS Score in sidebar */}
                    {report.atsAnalysis && (
                        <>
                            <div className='sidebar-divider' />
                            <div className='skill-gaps'>
                                <p className='skill-gaps__label'>ATS Score</p>
                                <div className='match-score__ring' style={{
                                    borderColor: report.atsAnalysis.atsScore >= 80 ? '#3fb950' : report.atsAnalysis.atsScore >= 60 ? '#f5a623' : '#ff4d4d',
                                    width: '70px', height: '70px', borderWidth: '3px', margin: '0 auto'
                                }}>
                                    <span className='match-score__value' style={{ fontSize: '1.2rem' }}>{report.atsAnalysis.atsScore}</span>
                                    <span className='match-score__pct'>%</span>
                                </div>
                            </div>
                        </>
                    )}

                </aside>
            </div>
        </div>
    )
}

export default Interview