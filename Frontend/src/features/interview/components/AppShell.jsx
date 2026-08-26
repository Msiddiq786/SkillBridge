import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { useAuth } from '../../auth/hooks/useAuth';
import { useProgressSummary } from '../hooks/useProgressSummary';
import { StudentSkillHubLogo } from './StudentSkillHubLogo';
import '../style/appShell.scss';

const NAV_GROUPS = [
    {
        title: "Career Preparation",
        items: [
            {
                id: 'dashboard',
                label: 'Dashboard',
                path: '/dashboard',
                icon: (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="7" height="9" rx="1" />
                        <rect x="14" y="3" width="7" height="5" rx="1" />
                        <rect x="14" y="12" width="7" height="9" rx="1" />
                        <rect x="3" y="16" width="7" height="5" rx="1" />
                    </svg>
                )
            },
            {
                id: 'progress',
                label: 'Learning & Progress',
                path: '/progress',
                icon: (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="20" x2="18" y2="10" />
                        <line x1="12" y1="20" x2="12" y2="4" />
                        <line x1="6" y1="20" x2="6" y2="14" />
                    </svg>
                )
            },
            {
                id: 'readiness',
                label: 'Application Readiness',
                path: '/readiness',
                icon: (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                    </svg>
                )
            },
            {
                id: 'practice',
                label: 'Practice Hub',
                path: '/practice',
                icon: (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <circle cx="12" cy="12" r="6" />
                        <circle cx="12" cy="12" r="2" />
                    </svg>
                )
            }
        ]
    },
    {
        title: "Job Applications",
        items: [
            {
                id: 'applications',
                label: 'Application Tracker',
                path: '/applications',
                icon: (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                    </svg>
                )
            },
            {
                id: 'achievements',
                label: 'Career Milestones',
                path: '/achievements',
                icon: (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
                        <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                        <path d="M4 22h16" />
                        <path d="M10 14.66V17c0 .55-.45 1-1 1H7" />
                        <path d="M14 14.66V17c0 .55.45 1 1 1h2" />
                        <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
                    </svg>
                )
            }
        ]
    },
    {
        title: "Student Profile",
        items: [
            {
                id: 'profile',
                label: 'My Profile & Skills',
                path: '/profile',
                icon: (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                    </svg>
                )
            },
            {
                id: 'resume-analyzer',
                label: '+ New Job Analysis',
                path: '/',
                icon: (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="16" />
                        <line x1="8" y1="12" x2="16" y2="12" />
                    </svg>
                )
            }
        ]
    }
];

export const AppShell = ({ children, activeNavId, pageTitle, pageSubtitle, headerActions }) => {
    const { user, handleLogout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

    // Fetch real persistent progress summary
    const { summary, loading: summaryLoading } = useProgressSummary();

    useEffect(() => {
        const titleText = pageTitle ? `StudentSkillHub | ${pageTitle}` : 'StudentSkillHub | Learn. Practice. Build. Get Hired.';
        document.title = titleText;
    }, [pageTitle]);

    const userInitial = (user?.name || user?.username || 'S').charAt(0).toUpperCase();

    const formatMinutes = (mins) => {
        if (!mins || mins <= 0) return '0 min';
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        if (h === 0) return `${m}m`;
        if (m === 0) return `${h}h`;
        return `${h}h ${m}m`;
    };

    const analysesTotal = summary?.analyses?.total || 0;
    const analysesCompleted = summary?.analyses?.completed || 0;
    const journeysStarted = summary?.journeys?.started || 0;
    const journeysCompleted = summary?.journeys?.completed || 0;
    const skillsGained = summary?.skills?.gained || 0;
    const currentStreak = summary?.streak?.current || 0;
    const weekMinutes = summary?.learningTime?.weekMinutes || 0;
    const analyzerHistory = summary?.analyzerHistory || [];

    return (
        <div className="app-shell">
            {/* ── Desktop & Mobile Sidebar ── */}
            <aside className={`app-sidebar ${mobileDrawerOpen ? 'app-sidebar--open' : ''}`}>
                {/* Brand Header */}
                <div className="app-sidebar__brand">
                    <Link to="/dashboard" className="brand-logo-link" onClick={() => setMobileDrawerOpen(false)} style={{ textDecoration: 'none' }}>
                        <StudentSkillHubLogo size="md" showWordmark={true} showTagline={true} />
                    </Link>
                </div>

                {/* Grouped Navigation Links */}
                <div className="app-sidebar__nav-groups">
                    {NAV_GROUPS.map((group, gIdx) => (
                        <div key={gIdx} className="sidebar-group-block">
                            <div className="app-sidebar__section-label">{group.title}</div>
                            <nav className="app-sidebar__nav">
                                {group.items.map(item => {
                                    const isActive = activeNavId ? activeNavId === item.id : (
                                        item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path)
                                    );

                                    return (
                                        <Link
                                            key={item.id}
                                            to={item.path}
                                            className={`sidebar-nav-item ${isActive ? 'sidebar-nav-item--active' : ''}`}
                                            onClick={() => setMobileDrawerOpen(false)}
                                        >
                                            <span className="sidebar-nav-icon">{item.icon}</span>
                                            <span className="sidebar-nav-label">{item.label}</span>
                                            {isActive && <span className="sidebar-nav-indicator" />}
                                        </Link>
                                    );
                                })}
                            </nav>
                        </div>
                    ))}
                </div>

                {/* Quick Shortcuts */}
                <div className="app-sidebar__section-label" style={{ marginTop: '1.25rem' }}>Quick Actions</div>
                <div className="sidebar-shortcuts">
                    <Link to="/practice" className="shortcut-btn shortcut-btn--practice" onClick={() => setMobileDrawerOpen(false)}>
                        <span className="shortcut-icon">🎯</span>
                        <span>Start Practice</span>
                    </Link>
                    <Link to="/" className="shortcut-btn shortcut-btn--new" onClick={() => setMobileDrawerOpen(false)}>
                        <span className="shortcut-icon">📄</span>
                        <span>+ New Plan</span>
                    </Link>
                </div>

                {/* ── NEW: YOUR PROGRESS Compact Tracker ── */}
                <div className="app-sidebar__section-label" style={{ marginTop: '1.25rem' }}>Your Progress</div>
                <div className="sidebar-progress-box">
                    <div className="progress-stat-row" title={`${analysesTotal} analyses · ${analysesCompleted} completed`}>
                        <span className="stat-icon">📊</span>
                        <div className="stat-text">
                            <span className="stat-title">
                                {analysesTotal} {analysesTotal === 1 ? 'Analysis' : 'Analyses'}
                            </span>
                            <span className="stat-sub">{analysesCompleted} completed</span>
                        </div>
                    </div>

                    <div className="progress-stat-row" title={`${journeysStarted} journeys started · ${journeysCompleted} completed`}>
                        <span className="stat-icon">🎯</span>
                        <div className="stat-text">
                            <span className="stat-title">
                                {journeysStarted} {journeysStarted === 1 ? 'Journey' : 'Journeys'}
                            </span>
                            <span className="stat-sub">{journeysCompleted} completed</span>
                        </div>
                    </div>

                    <div className="progress-stat-row" title={`${skillsGained} verified skills gained`}>
                        <span className="stat-icon">🧠</span>
                        <div className="stat-text">
                            <span className="stat-title">
                                {skillsGained === 0 ? 'No skills yet' : `${skillsGained} ${skillsGained === 1 ? 'Skill Gained' : 'Skills Gained'}`}
                            </span>
                        </div>
                    </div>

                    <div className="progress-stat-row" title={`${currentStreak} day learning streak`}>
                        <span className="stat-icon">🔥</span>
                        <div className="stat-text">
                            <span className="stat-title">
                                {currentStreak === 0 ? 'No streak yet' : `${currentStreak} Day Streak`}
                            </span>
                        </div>
                    </div>

                    <div className="progress-stat-row" title={`${formatMinutes(weekMinutes)} active learning time this week`}>
                        <span className="stat-icon">⏱</span>
                        <div className="stat-text">
                            <span className="stat-title">{formatMinutes(weekMinutes)} this week</span>
                        </div>
                    </div>

                    <Link to="/progress" className="view-progress-btn" onClick={() => setMobileDrawerOpen(false)}>
                        <span>View Progress</span>
                        <span className="arrow">→</span>
                    </Link>
                </div>

                {/* ── NEW: ANALYZER HISTORY Compact Section ── */}
                {analyzerHistory.length > 0 && (
                    <>
                        <div className="app-sidebar__section-label" style={{ marginTop: '1.25rem' }}>Analyzer History</div>
                        <div className="sidebar-history-box">
                            {analyzerHistory.slice(0, 3).map(rep => (
                                <Link
                                    key={rep.id}
                                    to={`/interview/${rep.id}`}
                                    className="history-item"
                                    onClick={() => setMobileDrawerOpen(false)}
                                    title={`${rep.title} · ${rep.matchScore}% fit`}
                                >
                                    <div className="history-info">
                                        <span className="history-title">{rep.title}</span>
                                        <span className="history-sub">
                                            {rep.company ? `${rep.company} · ` : ''}
                                            {rep.journeyStatus === 'COMPLETED' ? 'Completed' : rep.journeyStatus === 'ACTIVE' ? 'Active' : 'Not Started'}
                                        </span>
                                    </div>
                                    <span className={`history-score ${rep.matchScore >= 75 ? 'history-score--high' : rep.matchScore >= 50 ? 'history-score--med' : 'history-score--low'}`}>
                                        {rep.matchScore}%
                                    </span>
                                </Link>
                            ))}
                            <Link to="/dashboard" className="view-history-btn" onClick={() => setMobileDrawerOpen(false)}>
                                <span>View All History</span>
                                <span className="arrow">→</span>
                            </Link>
                        </div>
                    </>
                )}

                {/* Sidebar User Footer */}
                <div className="app-sidebar__footer">
                    <Link to="/profile" className="user-profile-badge" style={{ textDecoration: 'none' }}>
                        <div className="user-avatar">{userInitial}</div>
                        <div className="user-meta">
                            <span className="user-name">{user?.name || user?.username || 'Student'}</span>
                            <span className="user-email">{user?.email || 'Student Account'}</span>
                        </div>
                    </Link>
                    <button
                        type="button"
                        className="sidebar-logout-btn"
                        title="Log Out"
                        onClick={handleLogout}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                            <polyline points="16 17 21 12 16 7" />
                            <line x1="21" y1="12" x2="9" y2="12" />
                        </svg>
                    </button>
                </div>
            </aside>

            {/* Backdrop for Mobile Drawer */}
            {mobileDrawerOpen && (
                <div className="sidebar-backdrop" onClick={() => setMobileDrawerOpen(false)} />
            )}

            {/* ── Main App Content ── */}
            <div className="app-main-wrapper">
                {/* Top Bar Header */}
                <header className="app-topbar">
                    <div className="topbar-left">
                        <button
                            type="button"
                            className="mobile-hamburger-btn"
                            onClick={() => setMobileDrawerOpen(o => !o)}
                            aria-label="Toggle navigation menu"
                        >
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="3" y1="12" x2="21" y2="12" />
                                <line x1="3" y1="6" x2="21" y2="6" />
                                <line x1="3" y1="18" x2="21" y2="18" />
                            </svg>
                        </button>
                        <div className="topbar-search-box">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="11" cy="11" r="8" />
                                <line x1="21" y1="21" x2="16.65" y2="16.65" />
                            </svg>
                            <input
                                type="text"
                                placeholder="Search anything in your workspace..."
                                readOnly
                                className="topbar-search-input"
                            />
                        </div>
                    </div>

                    <div className="topbar-right">
                        <div className="topbar-actions">
                            <Link to="/practice" className="topbar-pill topbar-pill--practice">
                                🎯 Practice Mode
                            </Link>
                            <Link to="/" className="topbar-pill topbar-pill--new">
                                + New Plan
                            </Link>
                        </div>
                        <div className="topbar-user-badge">
                            <div className="user-avatar-small">{userInitial}</div>
                            <span className="user-name-small">{user?.name || user?.username || 'User'}</span>
                        </div>
                    </div>
                </header>

                {/* Page Content Body */}
                <main className="app-page-content">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default AppShell;
