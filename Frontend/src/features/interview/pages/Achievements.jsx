import React, { useState, useMemo } from "react";
import { Link } from "react-router";
import { useAchievements } from "../hooks/useAchievements";
import AppShell from "../components/AppShell";
import "../style/achievements.scss";

const CATEGORIES = [
    { id: "ALL", label: "All" },
    { id: "ANALYSIS", label: "Analysis" },
    { id: "LEARNING", label: "Learning" },
    { id: "STREAK", label: "Streak" },
    { id: "SKILLS", label: "Skills" },
    { id: "PROJECTS", label: "Projects" },
    { id: "PRACTICE", label: "Practice" },
    { id: "RESUME", label: "Resume" },
    { id: "APPLICATIONS", label: "Applications" }
];

const Achievements = () => {
    const { summary, milestones, loading, error, refreshAchievements } = useAchievements();
    const [selectedCategory, setSelectedCategory] = useState("ALL");
    const [filterStatus, setFilterStatus] = useState("ALL"); // ALL | UNLOCKED | LOCKED
    const [selectedMilestone, setSelectedMilestone] = useState(null);

    const filteredMilestones = useMemo(() => {
        return (milestones || []).filter(m => {
            const matchesCat = selectedCategory === "ALL" || m.category === selectedCategory;
            const matchesStatus = filterStatus === "ALL" || (filterStatus === "UNLOCKED" ? m.isUnlocked : !m.isUnlocked);
            return matchesCat && matchesStatus;
        });
    }, [milestones, selectedCategory, filterStatus]);

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

    const unlockedCount = summary?.unlockedCount || 0;
    const totalCount = summary?.totalCount || milestones.length || 22;
    const remainingCount = Math.max(0, totalCount - unlockedCount);
    const completionPercent = summary?.completionPercentage || 0;
    const currentStreak = summary?.currentStreak || 0;

    return (
        <AppShell activeNavId="achievements" pageTitle="Career Achievements">
            <div className="achievements-page">
                {/* ── Header ── */}
                <div className="achievements-hero">
                    <div className="achievements-hero__left">
                        <div className="badge-pill">
                            <span className="badge-dot" /> Career Mastery Progression
                        </div>
                        <h1 className="achievements-title">Achievements & Milestones</h1>
                        <p className="achievements-subtitle">
                            Milestones earned from real learning, practice, verified skills, projects, and applications.
                        </p>
                    </div>
                    <div className="achievements-hero__actions">
                        <Link to="/progress" className="action-btn action-btn--primary">
                            📊 Learning & Progress
                        </Link>
                        <Link to="/practice" className="action-btn action-btn--secondary">
                            🎯 Start Practice
                        </Link>
                    </div>
                </div>

                {/* ── Summary Progression Bar ── */}
                <div className="achievements-summary-bar">
                    <div className="summary-stat-box">
                        <span className="icon">🏆</span>
                        <div className="stat-info">
                            <span className="val">{unlockedCount} Earned</span>
                            <span className="lbl">{unlockedCount} / {totalCount} ({completionPercent}%)</span>
                        </div>
                    </div>

                    <div className="summary-progress-cell">
                        <div className="progress-label-row">
                            <span>Total Career Progression</span>
                            <span>{completionPercent}% Completed</span>
                        </div>
                        <div className="track">
                            <div className="fill" style={{ width: `${completionPercent}%` }} />
                        </div>
                    </div>

                    <div className="summary-stat-box">
                        <span className="icon">🔒</span>
                        <div className="stat-info">
                            <span className="val">{remainingCount} Remaining</span>
                            <span className="lbl">To Unlock</span>
                        </div>
                    </div>

                    <div className="summary-stat-box">
                        <span className="icon">🔥</span>
                        <div className="stat-info">
                            <span className="val">{currentStreak} Day Streak</span>
                            <span className="lbl">Active Learning</span>
                        </div>
                    </div>
                </div>

                {/* ── Filter Controls ── */}
                <div className="controls-row">
                    <div className="category-chips">
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat.id}
                                type="button"
                                className={`chip-btn ${selectedCategory === cat.id ? "chip-btn--active" : ""}`}
                                onClick={() => setSelectedCategory(cat.id)}
                            >
                                {cat.label}
                            </button>
                        ))}
                    </div>

                    <div className="status-pills">
                        <button
                            type="button"
                            className={`pill-btn ${filterStatus === "ALL" ? "pill-btn--active" : ""}`}
                            onClick={() => setFilterStatus("ALL")}
                        >
                            All ({milestones.length})
                        </button>
                        <button
                            type="button"
                            className={`pill-btn ${filterStatus === "UNLOCKED" ? "pill-btn--active" : ""}`}
                            onClick={() => setFilterStatus("UNLOCKED")}
                        >
                            🏆 Unlocked ({unlockedCount})
                        </button>
                        <button
                            type="button"
                            className={`pill-btn ${filterStatus === "LOCKED" ? "pill-btn--active" : ""}`}
                            onClick={() => setFilterStatus("LOCKED")}
                        >
                            🔒 Locked ({remainingCount})
                        </button>
                    </div>
                </div>

                {/* ── Milestones Grid ── */}
                {loading ? (
                    <div className="achievements-loading">
                        <div className="spinner" />
                        <p>Loading your career milestones and achievements...</p>
                    </div>
                ) : error ? (
                    <div className="achievements-error">
                        <p>⚠️ Unable to load milestones: {error}</p>
                        <button type="button" onClick={refreshAchievements} className="retry-btn">Retry</button>
                    </div>
                ) : filteredMilestones.length === 0 ? (
                    <div className="achievements-empty">
                        <span className="empty-icon">🏆</span>
                        <h3>No milestones in this filter</h3>
                        <p>Try selecting "All" categories to view your full milestone catalog.</p>
                    </div>
                ) : (
                    <div className="milestones-grid">
                        {filteredMilestones.map((m) => (
                            <div
                                key={m.id}
                                onClick={() => setSelectedMilestone(m)}
                                className={`milestone-card ${m.isUnlocked ? "milestone-card--unlocked" : "milestone-card--locked"}`}
                            >
                                <div className="milestone-card-top">
                                    <span className="milestone-icon">{m.icon}</span>
                                    <div className="milestone-titles">
                                        <h3 className="m-title">{m.title}</h3>
                                        <span className="m-cat">{m.category}</span>
                                    </div>
                                    <span className={`m-badge ${m.isUnlocked ? "m-badge--unlocked" : "m-badge--locked"}`}>
                                        {m.isUnlocked ? "✓ UNLOCKED" : "🔒 LOCKED"}
                                    </span>
                                </div>

                                <p className="m-desc">{m.description}</p>

                                {/* Dynamic Progression Indicator */}
                                <div className="m-progress-block">
                                    <div className="m-progress-header">
                                        <span className="m-prog-text">
                                            {m.currentProgress} / {m.targetValue} {m.unit}
                                        </span>
                                        <span className="m-pct">{m.progressPercent}%</span>
                                    </div>
                                    <div className="m-track">
                                        <div
                                            className={`m-fill ${m.isUnlocked ? "m-fill--done" : ""}`}
                                            style={{ width: `${m.progressPercent}%` }}
                                        />
                                    </div>
                                </div>

                                <div className="m-card-footer">
                                    <span className="m-footer-text">
                                        {m.isUnlocked
                                            ? `✓ Unlocked: ${m.unlockedAt ? formatDateTime(m.unlockedAt) : 'Earned'}`
                                            : m.remainingCount > 0
                                                ? `🔒 ${m.remainingCount} more ${m.unit} needed`
                                                : `🔒 Target: ${m.targetValue} ${m.unit}`
                                        }
                                    </span>
                                    <span className="m-click-hint">Click details →</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* ── MILESTONE DETAIL MODAL ── */}
                {selectedMilestone && (
                    <div className="modal-overlay" onClick={() => setSelectedMilestone(null)}>
                        <div className="milestone-detail-modal" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <div className="modal-header__left">
                                    <span className="modal-icon">{selectedMilestone.icon}</span>
                                    <div>
                                        <h2>{selectedMilestone.title}</h2>
                                        <span className="modal-cat">{selectedMilestone.category} Milestone</span>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setSelectedMilestone(null)}
                                    className="close-btn"
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="modal-body">
                                <div className="detail-status-banner">
                                    <span className={`status-tag ${selectedMilestone.isUnlocked ? 'status-tag--unlocked' : 'status-tag--locked'}`}>
                                        {selectedMilestone.isUnlocked ? '✓ UNLOCKED' : '🔒 LOCKED'}
                                    </span>
                                    <span className="status-progress-txt">
                                        Progress: <strong>{selectedMilestone.currentProgress} / {selectedMilestone.targetValue} {selectedMilestone.unit} ({selectedMilestone.progressPercent}%)</strong>
                                    </span>
                                </div>

                                <div className="detail-group">
                                    <h4>What is this milestone?</h4>
                                    <p>{selectedMilestone.description}</p>
                                </div>

                                <div className="detail-group">
                                    <h4>Exact Requirement</h4>
                                    <p className="req-box">{selectedMilestone.requirement || selectedMilestone.description}</p>
                                </div>

                                {selectedMilestone.isUnlocked ? (
                                    <div className="detail-group">
                                        <h4>Verified Evidence & Source</h4>
                                        <div className="evidence-box">
                                            <p>✓ <strong>Unlocked:</strong> {formatDateTime(selectedMilestone.unlockedAt)}</p>
                                            {selectedMilestone.evidence && (
                                                <p>✓ <strong>Source:</strong> {selectedMilestone.evidence}</p>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="detail-group">
                                        <h4>How to Unlock</h4>
                                        <p className="howto-box">
                                            {selectedMilestone.remainingCount > 0
                                                ? `Complete ${selectedMilestone.remainingCount} more qualifying ${selectedMilestone.unit} to unlock this badge.`
                                                : `Complete the requirement above to unlock.`}
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="modal-footer">
                                <Link
                                    to={selectedMilestone.actionLink || "/"}
                                    className="btn-action-primary"
                                    onClick={() => setSelectedMilestone(null)}
                                >
                                    {selectedMilestone.actionLabel || "Go to Activity"} →
                                </Link>
                                <button
                                    type="button"
                                    onClick={() => setSelectedMilestone(null)}
                                    className="btn-action-secondary"
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

export default Achievements;

