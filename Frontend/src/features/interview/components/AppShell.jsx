import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { useAuth } from '../../auth/hooks/useAuth';
import { StudentSkillHubLogo } from './StudentSkillHubLogo';
import '../style/appShell.scss';

const NAV_ITEMS = [
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
        id: 'resume-analyzer',
        label: 'Interview Planner',
        path: '/',
        icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
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
    },
    {
        id: 'profile',
        label: 'Student Profile',
        path: '/profile',
        icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
            </svg>
        )
    }
];

export const AppShell = ({ children, activeNavId, pageTitle, pageSubtitle, headerActions }) => {
    const { user, handleLogout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

    useEffect(() => {
        const titleText = pageTitle ? `StudentSkillHub | ${pageTitle}` : 'StudentSkillHub | Learn. Practice. Build. Get Hired.';
        document.title = titleText;
    }, [pageTitle]);

    const userInitial = (user?.name || user?.username || 'S').charAt(0).toUpperCase();

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

                {/* Navigation Links */}
                <div className="app-sidebar__section-label">Main Navigation</div>
                <nav className="app-sidebar__nav">
                    {NAV_ITEMS.map(item => {
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

                {/* Quick Shortcuts */}
                <div className="app-sidebar__section-label" style={{ marginTop: '1.5rem' }}>Quick Actions</div>
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
