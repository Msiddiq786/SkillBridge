import React, { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { useProfile } from '../hooks/useProfile';
import { useJourney } from '../hooks/useJourney';
import { useAuth } from '../../auth/hooks/useAuth';
import AppShell from '../components/AppShell';
import '../style/profile.scss';

const TABS = [
    { id: 'overview', label: 'Overview', icon: '👤' },
    { id: 'skills', label: 'Skills', icon: '⚡' },
    { id: 'projects', label: 'Projects', icon: '🚀' },
    { id: 'experience', label: 'Experience', icon: '💼' },
    { id: 'education', label: 'Education', icon: '🎓' },
    { id: 'certifications', label: 'Certifications', icon: '📜' },
    { id: 'languages', label: 'Languages', icon: '🌐' },
    { id: 'achievements', label: 'Achievements', icon: '🏆' },
    { id: 'learningHistory', label: 'Learning History', icon: '📈' },
    { id: 'careerGoals', label: 'Career Goals', icon: '🎯' },
    { id: 'resume', label: 'Resume', icon: '📄' }
];

export const Profile = () => {
    const { user } = useAuth();

    const {
        profile,
        completionPercentage,
        missingChecklist,
        loading,
        saving,
        error,
        successMessage,
        hasChangedSinceLastPlan,
        saveProfile,
        addSkill,
        removeSkill,
        addProject,
        removeProject,
        addExperience,
        removeExperience,
        addEducation,
        removeEducation,
        addCertification,
        removeCertification,
        addLanguage,
        removeLanguage,
        addAchievement,
        removeAchievement,
        updateCareerGoals,
        fetchProfile
    } = useProfile();

    const { dashboardData, fetchDashboard } = useJourney();

    useEffect(() => {
        fetchDashboard();
    }, [fetchDashboard]);

    const [activeTab, setActiveTab] = useState('overview');
    const [editingPersonal, setEditingPersonal] = useState(false);
    const [personalForm, setPersonalForm] = useState(null);

    // Modal state for adding items
    const [activeModal, setActiveModal] = useState(null); // 'skill' | 'project' | 'experience' | 'education' | 'certification' | 'language' | 'achievement' | 'careerGoals' | null

    // Form states
    const [skillForm, setSkillForm] = useState({ name: '', category: 'Technical', level: 'Intermediate', evidenceType: 'SELF_DECLARED', source: 'Self-added' });
    const [projectForm, setProjectForm] = useState({ name: '', description: '', technologies: '', githubUrl: '', demoUrl: '', role: 'Developer', whatIBuilt: '', keyOutcome: '', status: 'Completed' });
    const [expForm, setExpForm] = useState({ company: '', role: '', type: 'Internship', startDate: '', endDate: '', current: false, description: '', technologies: '', achievements: '' });
    const [eduForm, setEduForm] = useState({ degree: '', university: '', specialization: '', startYear: '', gradYear: '', cgpa: '', coursework: '' });
    const [certForm, setCertForm] = useState({ name: '', issuer: '', date: '', credentialUrl: '' });
    const [langForm, setLangForm] = useState({ language: '', proficiency: 'Fluent' });
    const [achForm, setAchForm] = useState({ title: '', description: '', date: '', evidenceUrl: '', category: 'Hackathon' });
    const [careerForm, setCareerForm] = useState({ targetRole: '', workPreference: 'Hybrid', experienceLevel: 'Internship', targetSkills: '', preferredIndustries: '' });

    const p = profile?.personalDetails || {};
    const userInitial = (p.fullName || user?.username || 'S').charAt(0).toUpperCase();

    const handleOpenEditPersonal = () => {
        setPersonalForm({
            fullName: p.fullName || user?.username || '',
            headline: p.headline || 'Computer Science Student',
            targetRole: p.targetRole || 'Software Engineer / AI Intern',
            bio: p.bio || '',
            email: p.email || user?.email || '',
            phone: p.phone || '',
            location: p.location || 'India',
            linkedin: p.linkedin || '',
            github: p.github || '',
            portfolio: p.portfolio || ''
        });
        setEditingPersonal(true);
    };

    const handleSavePersonal = async (e) => {
        e.preventDefault();
        await saveProfile({
            ...profile,
            personalDetails: personalForm
        });
        setEditingPersonal(false);
    };

    const handleSaveCareerGoals = async (e) => {
        e.preventDefault();
        const techArray = careerForm.targetSkills ? careerForm.targetSkills.split(',').map(s => s.trim()).filter(Boolean) : [];
        const indArray = careerForm.preferredIndustries ? careerForm.preferredIndustries.split(',').map(s => s.trim()).filter(Boolean) : [];
        await updateCareerGoals({
            targetRole: careerForm.targetRole,
            workPreference: careerForm.workPreference,
            experienceLevel: careerForm.experienceLevel,
            targetSkills: techArray,
            preferredIndustries: indArray
        });
        setActiveModal(null);
    };

    const handleAddSkillSubmit = async (e) => {
        e.preventDefault();
        if (!skillForm.name.trim()) return;
        await addSkill(skillForm);
        setSkillForm({ name: '', category: 'Technical', level: 'Intermediate', evidenceType: 'SELF_DECLARED', source: 'Self-added' });
        setActiveModal(null);
    };

    const handleAddProjectSubmit = async (e) => {
        e.preventDefault();
        if (!projectForm.name.trim()) return;
        const techArray = projectForm.technologies ? projectForm.technologies.split(',').map(s => s.trim()).filter(Boolean) : [];
        await addProject({
            ...projectForm,
            technologies: techArray
        });
        setProjectForm({ name: '', description: '', technologies: '', githubUrl: '', demoUrl: '', role: 'Developer', whatIBuilt: '', keyOutcome: '', status: 'Completed' });
        setActiveModal(null);
    };

    const handleAddExpSubmit = async (e) => {
        e.preventDefault();
        if (!expForm.company.trim() || !expForm.role.trim()) return;
        const techArray = expForm.technologies ? expForm.technologies.split(',').map(s => s.trim()).filter(Boolean) : [];
        await addExperience({
            ...expForm,
            technologies: techArray,
            responsibilities: expForm.description ? [expForm.description] : []
        });
        setExpForm({ company: '', role: '', type: 'Internship', startDate: '', endDate: '', current: false, description: '', technologies: '', achievements: '' });
        setActiveModal(null);
    };

    const handleAddEduSubmit = async (e) => {
        e.preventDefault();
        if (!eduForm.degree.trim() || !eduForm.university.trim()) return;
        const cwArray = eduForm.coursework ? eduForm.coursework.split(',').map(s => s.trim()).filter(Boolean) : [];
        await addEducation({
            ...eduForm,
            startYear: eduForm.startYear ? parseInt(eduForm.startYear) : undefined,
            gradYear: eduForm.gradYear ? parseInt(eduForm.gradYear) : undefined,
            coursework: cwArray
        });
        setEduForm({ degree: '', university: '', specialization: '', startYear: '', gradYear: '', cgpa: '', coursework: '' });
        setActiveModal(null);
    };

    const handleAddCertSubmit = async (e) => {
        e.preventDefault();
        if (!certForm.name.trim()) return;
        await addCertification(certForm);
        setCertForm({ name: '', issuer: '', date: '', credentialUrl: '' });
        setActiveModal(null);
    };

    const handleAddLangSubmit = async (e) => {
        e.preventDefault();
        if (!langForm.language.trim()) return;
        await addLanguage(langForm);
        setLangForm({ language: '', proficiency: 'Fluent' });
        setActiveModal(null);
    };

    const handleAddAchSubmit = async (e) => {
        e.preventDefault();
        if (!achForm.title.trim()) return;
        await addAchievement(achForm);
        setAchForm({ title: '', description: '', date: '', evidenceUrl: '', category: 'Hackathon' });
        setActiveModal(null);
    };

    // Helper to group skills by category
    const skillCategories = ['Programming', 'AI / ML', 'Frontend', 'Backend', 'Databases', 'Tools', 'Other'];
    const categorizedSkills = skillCategories.reduce((acc, cat) => {
        acc[cat] = [];
        return acc;
    }, {});

    (profile?.skills || []).forEach(skill => {
        const cat = skill.category?.toLowerCase() || '';
        if (cat.includes('ai') || cat.includes('ml') || cat.includes('data')) {
            categorizedSkills['AI / ML'].push(skill);
        } else if (cat.includes('front') || cat.includes('web') || cat.includes('react') || cat.includes('ui')) {
            categorizedSkills['Frontend'].push(skill);
        } else if (cat.includes('back') || cat.includes('node') || cat.includes('api')) {
            categorizedSkills['Backend'].push(skill);
        } else if (cat.includes('data') || cat.includes('sql') || cat.includes('mongo')) {
            categorizedSkills['Databases'].push(skill);
        } else if (cat.includes('tool') || cat.includes('git') || cat.includes('devops') || cat.includes('cloud')) {
            categorizedSkills['Tools'].push(skill);
        } else if (cat.includes('program') || cat.includes('lang') || cat.includes('tech') || cat.includes('core')) {
            categorizedSkills['Programming'].push(skill);
        } else {
            categorizedSkills['Other'].push(skill);
        }
    });

    if (loading && !profile) {
        return (
            <AppShell activeNavId="profile" pageTitle="Student Profile" pageSubtitle="Manage your skills, resume, projects, experience, and career goals.">
                <div className="profile-page-wrapper">
                    <div className="profile-loading-box">
                        <div className="loading-spinner" />
                        <h2>Loading Student Profile...</h2>
                        <p style={{ color: '#94A3B8', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                            Fetching your academic credentials, verified skills, and project evidence...
                        </p>
                    </div>
                </div>
            </AppShell>
        );
    }

    if (error && !profile) {
        return (
            <AppShell activeNavId="profile" pageTitle="Student Profile" pageSubtitle="Manage your skills, resume, projects, experience, and career goals.">
                <div className="profile-page-wrapper">
                    <div className="empty-section-card" style={{ maxWidth: '600px', margin: '3rem auto', textAlign: 'center', padding: '2.5rem' }}>
                        <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>⚠️</div>
                        <h3>Unable to load your profile</h3>
                        <p style={{ color: '#94A3B8', marginBottom: '1.5rem' }}>
                            {error || 'We encountered an issue retrieving your student profile details.'}
                        </p>
                        <button type="button" className="button primary-button" onClick={() => fetchProfile()}>
                            🔄 Retry
                        </button>
                    </div>
                </div>
            </AppShell>
        );
    }

    if (!profile) {
        return (
            <AppShell activeNavId="profile" pageTitle="Student Profile" pageSubtitle="Manage your skills, resume, projects, experience, and career goals.">
                <div className="profile-page-wrapper">
                    <div className="empty-section-card" style={{ maxWidth: '600px', margin: '3rem auto', textAlign: 'center', padding: '2.5rem' }}>
                        <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>👤</div>
                        <h3>Complete your Student Profile</h3>
                        <p style={{ color: '#94A3B8', marginBottom: '1.5rem' }}>
                            Add your target role, education, skills, and projects to enable personalized interview preparation.
                        </p>
                        <button type="button" className="button primary-button" onClick={handleOpenEditPersonal}>
                            + Add Profile Information
                        </button>
                    </div>
                </div>
            </AppShell>
        );
    }

    return (
        <AppShell
            activeNavId="profile"
            pageTitle="Student Profile"
            pageSubtitle="Manage your skills, resume, projects, experience, and career goals."
            headerActions={
                <div className="profile-header-actions">
                    <button
                        type="button"
                        className="button secondary-button profile-hdr-btn"
                        onClick={handleOpenEditPersonal}
                    >
                        ✏️ Edit Profile
                    </button>
                    <Link to="/" className="button primary-button profile-hdr-btn">
                        🎯 Re-analyze Prep
                    </Link>
                </div>
            }
        >
            <div className="profile-page-wrapper">
                {/* ── Notification Banners ── */}
                {successMessage && (
                    <div className="profile-alert-banner profile-alert-banner--success">
                        <span className="alert-icon">✓</span>
                        <span>{successMessage}</span>
                    </div>
                )}
                {error && (
                    <div className="profile-alert-banner profile-alert-banner--error">
                        <span className="alert-icon">⚠️</span>
                        <span>{error}</span>
                    </div>
                )}
                {hasChangedSinceLastPlan && (
                    <div className="profile-reanalyze-ribbon">
                        <div className="ribbon-text">
                            <span className="ribbon-icon">⚡</span>
                            <span><strong>Profile updated:</strong> Your latest skills and projects can improve your JD match score and preparation plan.</span>
                        </div>
                        <Link to="/" className="ribbon-action-btn">
                            Re-analyze Prep Plan →
                        </Link>
                    </div>
                )}

                {/* ══════════════════════════════════════════════════════════
                    1. UNIFIED FULL-WIDTH PROFILE SUMMARY CARD
                    ══════════════════════════════════════════════════════════ */}
                <section className="profile-summary-hero-card">
                    <div className="summary-hero-main-row">
                        {/* Avatar & Basic Info */}
                        <div className="summary-hero-left">
                            <div className="summary-avatar-wrap">
                                <div className="summary-avatar-circle">
                                    {p.avatar ? <img src={p.avatar} alt={p.fullName} /> : userInitial}
                                </div>
                                <span className="verified-badge-pill" title="StudentSkillHub Verified Member">✓ Student</span>
                            </div>

                            <div className="summary-identity-block">
                                <div className="summary-name-row">
                                    <h2 className="summary-name">{p.fullName || user?.username || 'Student Candidate'}</h2>
                                    <span className="summary-role-pill">{p.targetRole || 'Target: Software Engineer'}</span>
                                </div>
                                <p className="summary-headline">{p.headline || 'Computer Science Student & Developer'}</p>
                                {p.bio && <p className="summary-bio-snippet">{p.bio}</p>}
                            </div>
                        </div>

                        {/* Meta Attributes & Links */}
                        <div className="summary-hero-right">
                            <div className="summary-meta-grid">
                                <div className="summary-meta-item">
                                    <span className="meta-icon">📍</span>
                                    <span className="meta-text">{p.location || 'India'}</span>
                                </div>
                                <div className="summary-meta-item">
                                    <span className="meta-icon">✉️</span>
                                    <span className="meta-text">{p.email || user?.email || 'student@skillhub.com'}</span>
                                </div>
                                {p.phone && (
                                    <div className="summary-meta-item">
                                        <span className="meta-icon">📞</span>
                                        <span className="meta-text">{p.phone}</span>
                                    </div>
                                )}
                                {profile?.education?.[0] && (
                                    <div className="summary-meta-item">
                                        <span className="meta-icon">🎓</span>
                                        <span className="meta-text">{profile.education[0].degree} ({profile.education[0].university})</span>
                                    </div>
                                )}
                            </div>

                            {/* Social / Portfolio Links */}
                            <div className="summary-social-links">
                                {p.linkedin && (
                                    <a href={p.linkedin} target="_blank" rel="noopener noreferrer" className="social-pill" title="LinkedIn Profile">
                                        LinkedIn ↗
                                    </a>
                                )}
                                {p.github && (
                                    <a href={p.github} target="_blank" rel="noopener noreferrer" className="social-pill" title="GitHub Profile">
                                        GitHub ↗
                                    </a>
                                )}
                                {p.portfolio && (
                                    <a href={p.portfolio} target="_blank" rel="noopener noreferrer" className="social-pill" title="Portfolio Link">
                                        Portfolio ↗
                                    </a>
                                )}
                                <button type="button" className="btn-edit-details" onClick={handleOpenEditPersonal}>
                                    ✏️ Edit Details
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Integrated Profile Completion Bar */}
                    <div className="summary-hero-completion-row">
                        <div className="completion-info-left">
                            <span className="comp-label">Profile Completion</span>
                            <span className="comp-pct-pill">{completionPercentage}% Complete</span>
                            {missingChecklist.length > 0 && (
                                <span className="comp-missing-hint">
                                    Missing: {missingChecklist.slice(0, 2).join(' • ')}
                                </span>
                            )}
                        </div>
                        <div className="completion-bar-track">
                            <div className="completion-bar-fill" style={{ width: `${completionPercentage}%` }} />
                        </div>
                    </div>
                </section>

                {/* ══════════════════════════════════════════════════════════
                    2. COMPACT HORIZONTAL QUICK ACTION BAR
                    ══════════════════════════════════════════════════════════ */}
                <section className="profile-quick-action-bar">
                    <span className="action-bar-label">Quick Add:</span>
                    <div className="action-bar-buttons">
                        <button type="button" className="quick-btn" onClick={() => setActiveModal('skill')}>
                            <span>⚡</span> + Skill
                        </button>
                        <button type="button" className="quick-btn" onClick={() => setActiveModal('project')}>
                            <span>🚀</span> + Project
                        </button>
                        <button type="button" className="quick-btn" onClick={() => setActiveModal('experience')}>
                            <span>💼</span> + Experience
                        </button>
                        <button type="button" className="quick-btn" onClick={() => setActiveModal('education')}>
                            <span>🎓</span> + Education
                        </button>
                        <button type="button" className="quick-btn" onClick={() => setActiveModal('certification')}>
                            <span>📜</span> + Certification
                        </button>
                        <button type="button" className="quick-btn" onClick={() => setActiveModal('language')}>
                            <span>🌐</span> + Language
                        </button>
                        <button type="button" className="quick-btn" onClick={() => setActiveModal('achievement')}>
                            <span>🏆</span> + Achievement
                        </button>
                        <Link to="/" className="quick-btn quick-btn--resume">
                            <span>📄</span> Upload Resume
                        </Link>
                    </div>
                </section>

                {/* ══════════════════════════════════════════════════════════
                    3. RESPONSIVE PROFILE NAVIGATION
                    ══════════════════════════════════════════════════════════ */}
                <nav className="profile-tabs-wrapper" aria-label="Profile Sections">
                    {/* Mobile Section Dropdown */}
                    <div className="mobile-tab-select-wrap">
                        <label htmlFor="mobile-profile-tab" className="mobile-select-label">Current Section:</label>
                        <select
                            id="mobile-profile-tab"
                            className="mobile-tab-select"
                            value={activeTab}
                            onChange={(e) => setActiveTab(e.target.value)}
                        >
                            {TABS.map(tab => (
                                <option key={tab.id} value={tab.id}>
                                    {tab.icon} {tab.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Desktop / Tablet Responsive Wrapped Tabs */}
                    <div className="desktop-tabs-list" role="tablist">
                        {TABS.map(tab => {
                            const isSelected = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    type="button"
                                    role="tab"
                                    aria-selected={isSelected}
                                    className={`profile-tab-pill ${isSelected ? 'profile-tab-pill--active' : ''}`}
                                    onClick={() => setActiveTab(tab.id)}
                                >
                                    <span className="tab-icon">{tab.icon}</span>
                                    <span className="tab-label">{tab.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </nav>

                {/* ══════════════════════════════════════════════════════════
                    4. ACTIVE TAB CONTENT CONTAINER (2-Column Standard Grid)
                    ══════════════════════════════════════════════════════════ */}
                <main className="profile-tab-body">
                    {/* ── 1. OVERVIEW TAB ── */}
                    {activeTab === 'overview' && (
                        <div className="profile-grid-2col">
                            {/* Card 1: About Me */}
                            <div className="profile-card">
                                <div className="profile-card-header">
                                    <div className="card-title-group">
                                        <span className="card-title-icon">👤</span>
                                        <h3>About Me</h3>
                                    </div>
                                    <button type="button" className="btn-card-action" onClick={handleOpenEditPersonal}>
                                        ✏️ Edit
                                    </button>
                                </div>
                                <p className="card-body-text">
                                    {p.bio || "Add a summary of your background, technical passions, and what you are building to stand out to hiring teams."}
                                </p>
                            </div>

                            {/* Card 2: Profile Stats */}
                            <div className="profile-card">
                                <div className="profile-card-header">
                                    <div className="card-title-group">
                                        <span className="card-title-icon">📊</span>
                                        <h3>Profile Quick Stats</h3>
                                    </div>
                                </div>
                                <div className="profile-stats-grid">
                                    <div className="stat-tile">
                                        <span className="stat-value">{profile?.skills?.length || 0}</span>
                                        <span className="stat-label">Skills</span>
                                    </div>
                                    <div className="stat-tile">
                                        <span className="stat-value">{profile?.projects?.length || 0}</span>
                                        <span className="stat-label">Projects</span>
                                    </div>
                                    <div className="stat-tile">
                                        <span className="stat-value">{profile?.experience?.length || 0}</span>
                                        <span className="stat-label">Experience</span>
                                    </div>
                                    <div className="stat-tile">
                                        <span className="stat-value">{profile?.certifications?.length || 0}</span>
                                        <span className="stat-label">Certifications</span>
                                    </div>
                                </div>
                            </div>

                            {/* Card 3: Top Skills Preview */}
                            <div className="profile-card">
                                <div className="profile-card-header">
                                    <div className="card-title-group">
                                        <span className="card-title-icon">⚡</span>
                                        <h3>Top Skills Overview</h3>
                                    </div>
                                    <button type="button" className="btn-card-action" onClick={() => setActiveTab('skills')}>
                                        Manage All →
                                    </button>
                                </div>
                                {profile?.skills && profile.skills.length > 0 ? (
                                    <div className="skills-chip-cloud">
                                        {profile.skills.slice(0, 10).map((s, idx) => (
                                            <div key={idx} className="skill-chip">
                                                <span className="chip-name">{s.name}</span>
                                                <span className={`chip-level chip-level--${(s.level || 'Intermediate').toLowerCase()}`}>
                                                    {s.level}
                                                </span>
                                                <span className={`chip-evidence chip-evidence--${(s.evidenceType || 'SELF_DECLARED').toLowerCase()}`}>
                                                    {s.evidenceType === 'VERIFIED' ? '✓ Verified' : s.evidenceType === 'NEEDS_EVIDENCE' ? 'Needs Evidence' : 'Self-Declared'}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="empty-inline-state">
                                        <p>No skills added yet.</p>
                                        <button type="button" className="button secondary-button" onClick={() => setActiveModal('skill')}>
                                            + Add First Skill
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Card 4: Resume Status */}
                            <div className="profile-card">
                                <div className="profile-card-header">
                                    <div className="card-title-group">
                                        <span className="card-title-icon">📄</span>
                                        <h3>Resume Status</h3>
                                    </div>
                                    <Link to="/" className="btn-card-action">
                                        Upload / Replace →
                                    </Link>
                                </div>
                                <div className="resume-overview-box">
                                    <div className="resume-icon-badge">📄</div>
                                    <div className="resume-meta">
                                        <h4 className="resume-filename">{profile?.resumeData?.fileName || "Default Candidate Resume"}</h4>
                                        <p className="resume-status">
                                            Status: <span className="status-highlight">{profile?.resumeData?.status || "Ready for Analysis"}</span>
                                        </p>
                                        {profile?.resumeData?.lastAnalyzedAt && (
                                            <span className="resume-date">
                                                Last Analyzed: {new Date(profile.resumeData.lastAnalyzedAt).toLocaleDateString()}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Card 5: Showcase Projects Preview */}
                            <div className="profile-card">
                                <div className="profile-card-header">
                                    <div className="card-title-group">
                                        <span className="card-title-icon">🚀</span>
                                        <h3>Showcase Projects</h3>
                                    </div>
                                    <button type="button" className="btn-card-action" onClick={() => setActiveTab('projects')}>
                                        View Projects →
                                    </button>
                                </div>
                                {profile?.projects && profile.projects.length > 0 ? (
                                    <div className="projects-preview-stack">
                                        {profile.projects.slice(0, 2).map((proj, idx) => (
                                            <div key={idx} className="project-compact-row">
                                                <div className="proj-compact-top">
                                                    <h4 className="proj-title">{proj.name}</h4>
                                                    <span className="proj-status-badge">{proj.status}</span>
                                                </div>
                                                <p className="proj-desc-snippet">{proj.whatIBuilt || proj.description || "Student showcase software project."}</p>
                                                <div className="tech-tags-line">
                                                    {proj.technologies?.slice(0, 4).map((tech, tIdx) => (
                                                        <span key={tIdx} className="tech-tag-sm">{tech}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="empty-inline-state">
                                        <p>No projects documented yet.</p>
                                        <button type="button" className="button secondary-button" onClick={() => setActiveModal('project')}>
                                            + Add Project
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Card 6: AI Personalization & Impact */}
                            <div className="profile-card">
                                <div className="profile-card-header">
                                    <div className="card-title-group">
                                        <span className="card-title-icon">✨</span>
                                        <h3>How Profile Helps & AI Context</h3>
                                    </div>
                                </div>
                                <div className="impact-checklist-compact">
                                    <div className="impact-check-item">
                                        <span className="check-icon">✓</span>
                                        <span><strong>Better JD Matching:</strong> Verified skills are properly weighted against target job requirements.</span>
                                    </div>
                                    <div className="impact-check-item">
                                        <span className="check-icon">✓</span>
                                        <span><strong>Grounded STAR Answers:</strong> Behavioral questions draw from your real showcase projects.</span>
                                    </div>
                                    <div className="impact-check-item">
                                        <span className="check-icon">✓</span>
                                        <span><strong>Targeted Roadmap:</strong> Focuses study time on true gaps rather than concepts you already know.</span>
                                    </div>
                                </div>

                                <div className="ai-toggle-footer">
                                    <label className="ai-toggle-label">
                                        <input
                                            type="checkbox"
                                            checked={profile?.preferences?.useProfileForAi !== false}
                                            onChange={async (e) => {
                                                await saveProfile({
                                                    ...profile,
                                                    preferences: { useProfileForAi: e.target.checked }
                                                });
                                            }}
                                        />
                                        <span>Enable AI Profile Context for Practice & Plans</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── 2. SKILLS TAB ── */}
                    {activeTab === 'skills' && (
                        <div className="profile-section-container">
                            <div className="section-toolbar">
                                <div className="section-toolbar-left">
                                    <h3>Technical & Domain Skills</h3>
                                    <p>Organized by category. Evidence status is preserved across practice sessions and roadmaps.</p>
                                </div>
                                <button type="button" className="button primary-button" onClick={() => setActiveModal('skill')}>
                                    + Add Skill
                                </button>
                            </div>

                            {/* Legend Bar */}
                            <div className="evidence-legend-bar">
                                <span className="legend-item"><span className="dot dot--verified" /> <strong>VERIFIED:</strong> Proven in resume or project</span>
                                <span className="legend-item"><span className="dot dot--declared" /> <strong>SELF-DECLARED:</strong> Student-added knowledge</span>
                                <span className="legend-item"><span className="dot dot--needs" /> <strong>NEEDS EVIDENCE:</strong> Learning target</span>
                            </div>

                            {/* Categorized Skills Grid */}
                            <div className="profile-grid-2col">
                                {skillCategories.map(categoryName => {
                                    const skillsInCat = categorizedSkills[categoryName];
                                    if (skillsInCat.length === 0 && categoryName === 'Other') return null;

                                    return (
                                        <div key={categoryName} className="profile-card skill-category-card">
                                            <div className="profile-card-header">
                                                <div className="card-title-group">
                                                    <span className="card-title-icon">📌</span>
                                                    <h4>{categoryName}</h4>
                                                </div>
                                                <span className="count-pill">{skillsInCat.length}</span>
                                            </div>

                                            {skillsInCat.length > 0 ? (
                                                <div className="category-skill-chips">
                                                    {skillsInCat.map((skill, sIdx) => {
                                                        const globalIndex = profile?.skills?.findIndex(s => s._id === skill._id || (s.name === skill.name && s.category === skill.category));
                                                        return (
                                                            <div key={sIdx} className="skill-chip-interactive">
                                                                <div className="chip-main-info">
                                                                    <span className="chip-name">{skill.name}</span>
                                                                    <span className={`chip-level chip-level--${(skill.level || 'Intermediate').toLowerCase()}`}>
                                                                        {skill.level}
                                                                    </span>
                                                                </div>
                                                                <div className="chip-right-info">
                                                                    <span className={`chip-evidence chip-evidence--${(skill.evidenceType || 'SELF_DECLARED').toLowerCase()}`}>
                                                                        {skill.evidenceType === 'VERIFIED' ? '✓ Verified' : skill.evidenceType === 'NEEDS_EVIDENCE' ? 'Needs Evidence' : 'Self-Declared'}
                                                                    </span>
                                                                    {globalIndex !== -1 && (
                                                                        <button
                                                                            type="button"
                                                                            className="chip-delete-btn"
                                                                            onClick={() => removeSkill(globalIndex)}
                                                                            title="Remove skill"
                                                                        >
                                                                            ✕
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            ) : (
                                                <p className="empty-category-text">No skills added in this category yet.</p>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* ── 3. PROJECTS TAB ── */}
                    {activeTab === 'projects' && (
                        <div className="profile-section-container">
                            <div className="section-toolbar">
                                <div className="section-toolbar-left">
                                    <h3>Showcase & Academic Projects</h3>
                                    <p>Projects are used to ground your behavioral STAR answers and substantiate technical competencies.</p>
                                </div>
                                <button type="button" className="button primary-button" onClick={() => setActiveModal('project')}>
                                    + Add Project
                                </button>
                            </div>

                            {profile?.projects && profile.projects.length > 0 ? (
                                <div className="profile-grid-2col">
                                    {profile.projects.map((proj, idx) => (
                                        <div key={idx} className="profile-card project-card">
                                            <div className="profile-card-header">
                                                <div>
                                                    <h4 className="card-title">{proj.name}</h4>
                                                    <span className="card-subtitle">{proj.role || 'Developer'}</span>
                                                </div>
                                                <div className="card-header-actions">
                                                    <span className="proj-status-badge">{proj.status}</span>
                                                    <button
                                                        type="button"
                                                        className="btn-delete-card"
                                                        onClick={() => removeProject(idx)}
                                                        title="Delete Project"
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            </div>

                                            <p className="card-body-text">{proj.description}</p>

                                            {proj.whatIBuilt && (
                                                <div className="project-field-block">
                                                    <strong>What I Built:</strong> <span>{proj.whatIBuilt}</span>
                                                </div>
                                            )}
                                            {proj.keyOutcome && (
                                                <div className="project-field-block">
                                                    <strong>Key Outcome:</strong> <span>{proj.keyOutcome}</span>
                                                </div>
                                            )}

                                            <div className="tech-tags-line">
                                                {proj.technologies?.map((tech, tIdx) => (
                                                    <span key={tIdx} className="tech-tag">{tech}</span>
                                                ))}
                                            </div>

                                            {(proj.githubUrl || proj.demoUrl) && (
                                                <div className="project-links-row">
                                                    {proj.githubUrl && (
                                                        <a href={proj.githubUrl} target="_blank" rel="noopener noreferrer" className="proj-ext-link">
                                                            GitHub Repo ↗
                                                        </a>
                                                    )}
                                                    {proj.demoUrl && (
                                                        <a href={proj.demoUrl} target="_blank" rel="noopener noreferrer" className="proj-ext-link">
                                                            Live Demo ↗
                                                        </a>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="empty-section-card">
                                    <h4>No showcase projects documented yet</h4>
                                    <p>Add your projects so StudentSkillHub can ground your interview questions and STAR behavioral responses.</p>
                                    <button type="button" className="button primary-button" onClick={() => setActiveModal('project')}>
                                        + Add Your First Project
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── 4. EXPERIENCE TAB ── */}
                    {activeTab === 'experience' && (
                        <div className="profile-section-container">
                            <div className="section-toolbar">
                                <div className="section-toolbar-left">
                                    <h3>Internships & Work History</h3>
                                    <p>Document your internships, research, part-time, and academic experience.</p>
                                </div>
                                <button type="button" className="button primary-button" onClick={() => setActiveModal('experience')}>
                                    + Add Experience
                                </button>
                            </div>

                            {profile?.experience && profile.experience.length > 0 ? (
                                <div className="profile-grid-2col">
                                    {profile.experience.map((exp, idx) => (
                                        <div key={idx} className="profile-card experience-card">
                                            <div className="profile-card-header">
                                                <div>
                                                    <h4 className="card-title">{exp.role}</h4>
                                                    <span className="card-subtitle">{exp.company} • {exp.type}</span>
                                                </div>
                                                <div className="card-header-actions">
                                                    <span className="card-date-badge">{exp.startDate || 'Start'} - {exp.current ? 'Present' : exp.endDate || 'End'}</span>
                                                    <button type="button" className="btn-delete-card" onClick={() => removeExperience(idx)}>✕</button>
                                                </div>
                                            </div>
                                            <p className="card-body-text">{exp.description}</p>
                                            <div className="tech-tags-line">
                                                {exp.technologies?.map((tech, tIdx) => (
                                                    <span key={tIdx} className="tech-tag">{tech}</span>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="empty-section-card">
                                    <h4>No internships or experience added yet</h4>
                                    <p>Add relevant experience, academic research, or freelance roles.</p>
                                    <button type="button" className="button primary-button" onClick={() => setActiveModal('experience')}>
                                        + Add Experience
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── 5. EDUCATION TAB ── */}
                    {activeTab === 'education' && (
                        <div className="profile-section-container">
                            <div className="section-toolbar">
                                <div className="section-toolbar-left">
                                    <h3>Academic & Education Background</h3>
                                    <p>Your university, degree, coursework, and academic milestones.</p>
                                </div>
                                <button type="button" className="button primary-button" onClick={() => setActiveModal('education')}>
                                    + Add Education
                                </button>
                            </div>

                            {profile?.education && profile.education.length > 0 ? (
                                <div className="profile-grid-2col">
                                    {profile.education.map((edu, idx) => (
                                        <div key={idx} className="profile-card education-card">
                                            <div className="profile-card-header">
                                                <div>
                                                    <h4 className="card-title">{edu.degree}</h4>
                                                    <span className="card-subtitle">{edu.university} {edu.specialization ? `• ${edu.specialization}` : ''}</span>
                                                </div>
                                                <div className="card-header-actions">
                                                    <span className="card-date-badge">{edu.startYear || ''} - {edu.gradYear || 'Present'}</span>
                                                    <button type="button" className="btn-delete-card" onClick={() => removeEducation(idx)}>✕</button>
                                                </div>
                                            </div>
                                            {edu.cgpa && (
                                                <div className="edu-cgpa-line">
                                                    <strong>CGPA / Percentage:</strong> <span>{edu.cgpa}</span>
                                                </div>
                                            )}
                                            {edu.coursework && edu.coursework.length > 0 && (
                                                <div className="edu-coursework-line">
                                                    <strong>Relevant Coursework:</strong> <span>{edu.coursework.join(', ')}</span>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="empty-section-card">
                                    <h4>No education records found</h4>
                                    <p>Add your current college or degree to substantiate your student profile.</p>
                                    <button type="button" className="button primary-button" onClick={() => setActiveModal('education')}>
                                        + Add Education
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── 6. CERTIFICATIONS TAB ── */}
                    {activeTab === 'certifications' && (
                        <div className="profile-section-container">
                            <div className="section-toolbar">
                                <div className="section-toolbar-left">
                                    <h3>Professional Certifications & Credentials</h3>
                                    <p>Certifications act as supporting evidence for your technical competencies.</p>
                                </div>
                                <button type="button" className="button primary-button" onClick={() => setActiveModal('certification')}>
                                    + Add Certification
                                </button>
                            </div>

                            {profile?.certifications && profile.certifications.length > 0 ? (
                                <div className="profile-grid-2col">
                                    {profile.certifications.map((cert, idx) => (
                                        <div key={idx} className="profile-card cert-card">
                                            <div className="profile-card-header">
                                                <div>
                                                    <h4 className="card-title">{cert.name}</h4>
                                                    <span className="card-subtitle">{cert.issuer} {cert.date ? `• ${cert.date}` : ''}</span>
                                                </div>
                                                <button type="button" className="btn-delete-card" onClick={() => removeCertification(idx)}>✕</button>
                                            </div>
                                            {cert.credentialUrl && (
                                                <a href={cert.credentialUrl} target="_blank" rel="noopener noreferrer" className="proj-ext-link">
                                                    View Credential Proof ↗
                                                </a>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="empty-section-card">
                                    <h4>No certifications recorded yet</h4>
                                    <p>Add credentials from AWS, Google, Coursera, or industry leaders.</p>
                                    <button type="button" className="button primary-button" onClick={() => setActiveModal('certification')}>
                                        + Add Certification
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── 7. LANGUAGES TAB ── */}
                    {activeTab === 'languages' && (
                        <div className="profile-section-container">
                            <div className="section-toolbar">
                                <div className="section-toolbar-left">
                                    <h3>Languages & Communication</h3>
                                    <p>Languages you can communicate in during technical and behavioral interviews.</p>
                                </div>
                                <button type="button" className="button primary-button" onClick={() => setActiveModal('language')}>
                                    + Add Language
                                </button>
                            </div>

                            {profile?.languages && profile.languages.length > 0 ? (
                                <div className="profile-grid-2col">
                                    {profile.languages.map((lang, idx) => (
                                        <div key={idx} className="profile-card language-card">
                                            <div className="profile-card-header">
                                                <div>
                                                    <h4 className="card-title">{lang.language}</h4>
                                                    <span className="language-prof-pill">{lang.proficiency}</span>
                                                </div>
                                                <button type="button" className="btn-delete-card" onClick={() => removeLanguage(idx)}>✕</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="empty-section-card">
                                    <h4>No languages documented yet</h4>
                                    <button type="button" className="button primary-button" onClick={() => setActiveModal('language')}>
                                        + Add Language
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── 8. ACHIEVEMENTS TAB ── */}
                    {activeTab === 'achievements' && (
                        <div className="profile-section-container">
                            {/* System Badges & Milestones */}
                            <div className="section-toolbar">
                                <div className="section-toolbar-left">
                                    <h3>Preparation Badges & Milestones</h3>
                                    <p>Earned automatically by completing roadmap days, daily streaks, and interview practice.</p>
                                </div>
                                <div className="section-toolbar-right">
                                    <Link to="/progress" className="button secondary-button btn-sm">
                                        📊 Full Progress
                                    </Link>
                                </div>
                            </div>

                            <div className="profile-grid-2col">
                                {(dashboardData?.achievements || []).map((ach) => (
                                    <div key={ach.id} className={`profile-card achievement-card ${ach.isUnlocked ? 'achievement-card--unlocked' : 'achievement-card--locked'}`}>
                                        <div className="profile-card-header">
                                            <div className="card-title-group">
                                                <span className="card-title-icon">{ach.icon}</span>
                                                <div>
                                                    <h4 className="card-title">{ach.title}</h4>
                                                    <span className="card-subtitle">
                                                        {ach.isUnlocked ? `✓ Unlocked ${ach.unlockedAt ? new Date(ach.unlockedAt).toLocaleDateString() : ''}` : '🔒 Locked Milestone'}
                                                    </span>
                                                </div>
                                            </div>
                                            <span className={`count-pill ${ach.isUnlocked ? 'count-pill--verified' : ''}`}>
                                                {ach.isUnlocked ? 'Unlocked' : 'Locked'}
                                            </span>
                                        </div>
                                        <p className="card-body-text">{ach.description}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Custom Awards & Hackathons */}
                            <div className="section-toolbar" style={{ marginTop: '1.5rem' }}>
                                <div className="section-toolbar-left">
                                    <h3>Personal Awards, Hackathons & Honors</h3>
                                    <p>Showcase competitive programming, hackathon placements, and honors.</p>
                                </div>
                                <button type="button" className="button primary-button" onClick={() => setActiveModal('achievement')}>
                                    + Add Achievement
                                </button>
                            </div>

                            {profile?.achievements && profile.achievements.length > 0 ? (
                                <div className="profile-grid-2col">
                                    {profile.achievements.map((ach, idx) => (
                                        <div key={idx} className="profile-card achievement-card">
                                            <div className="profile-card-header">
                                                <div>
                                                    <h4 className="card-title">🏆 {ach.title}</h4>
                                                    <span className="card-subtitle">{ach.category} {ach.date ? `• ${ach.date}` : ''}</span>
                                                </div>
                                                <button type="button" className="btn-delete-card" onClick={() => removeAchievement(idx)}>✕</button>
                                            </div>
                                            <p className="card-body-text">{ach.description}</p>
                                            {ach.evidenceUrl && (
                                                <a href={ach.evidenceUrl} target="_blank" rel="noopener noreferrer" className="proj-ext-link">
                                                    View Evidence Link ↗
                                                </a>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="empty-section-card">
                                    <h4>No personal awards added yet</h4>
                                    <p>Add competitive programming, hackathons, or academic honors.</p>
                                    <button type="button" className="button primary-button" onClick={() => setActiveModal('achievement')}>
                                        + Add Achievement
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── 9. LEARNING HISTORY TAB ── */}
                    {activeTab === 'learningHistory' && (
                        <div className="profile-section-container">
                            <div className="section-toolbar">
                                <div className="section-toolbar-left">
                                    <h3>Learning Activity & Streaks Log</h3>
                                    <p>Real chronological log of your roadmap study days, practice sessions, and active time.</p>
                                </div>
                            </div>

                            {/* Streaks & Time Stats */}
                            <div className="profile-grid-2col">
                                <div className="profile-card">
                                    <div className="profile-card-header">
                                        <div className="card-title-group">
                                            <span className="card-title-icon">🔥</span>
                                            <h4 className="card-title">Daily Learning Streak</h4>
                                        </div>
                                        <span className="count-pill">
                                            {dashboardData?.streaks?.currentStreak || 0} Days Active
                                        </span>
                                    </div>
                                    <div className="profile-stats-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
                                        <div className="stat-tile">
                                            <span className="stat-value">{dashboardData?.streaks?.currentStreak || 0}</span>
                                            <span className="stat-label">Current Streak</span>
                                        </div>
                                        <div className="stat-tile">
                                            <span className="stat-value">{dashboardData?.streaks?.longestStreak || 0}</span>
                                            <span className="stat-label">Longest Streak</span>
                                        </div>
                                    </div>
                                    <p className="card-body-text" style={{ fontSize: '0.8rem', color: '#94A3B8' }}>
                                        * Streaks are awarded only for qualifying learning activity (completing roadmap days/tasks or mock practice sessions).
                                    </p>
                                </div>

                                <div className="profile-card">
                                    <div className="profile-card-header">
                                        <div className="card-title-group">
                                            <span className="card-title-icon">⏱️</span>
                                            <h4 className="card-title">Active Learning Time</h4>
                                        </div>
                                    </div>
                                    <div className="profile-stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                                        <div className="stat-tile">
                                            <span className="stat-value">{dashboardData?.timeStats?.todayMinutes || 0}m</span>
                                            <span className="stat-label">Today</span>
                                        </div>
                                        <div className="stat-tile">
                                            <span className="stat-value">{Math.floor((dashboardData?.timeStats?.weekMinutes || 0) / 60)}h</span>
                                            <span className="stat-label">This Week</span>
                                        </div>
                                        <div className="stat-tile">
                                            <span className="stat-value">{Math.floor((dashboardData?.timeStats?.totalMinutes || 0) / 60)}h</span>
                                            <span className="stat-label">Total Time</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Recent Learning Activity Feed */}
                            <div className="profile-card">
                                <div className="profile-card-header">
                                    <div className="card-title-group">
                                        <span className="card-title-icon">📜</span>
                                        <h4 className="card-title">Activity Timeline ({dashboardData?.recentActivities?.length || 0})</h4>
                                    </div>
                                </div>

                                {dashboardData?.recentActivities && dashboardData.recentActivities.length > 0 ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                        {dashboardData.recentActivities.map((act) => (
                                            <div key={act._id} style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                padding: '0.75rem 1rem',
                                                background: '#0B1424',
                                                borderRadius: '8px',
                                                border: '1px solid rgba(255, 255, 255, 0.06)'
                                            }}>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                                                    <span style={{ fontSize: '0.875rem', fontWeight: '700', color: '#F8FAFC' }}>
                                                        {act.title}
                                                    </span>
                                                    {act.detail && (
                                                        <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{act.detail}</span>
                                                    )}
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    {act.isQualifying && (
                                                        <span style={{ fontSize: '0.7rem', fontWeight: '700', background: 'rgba(34, 197, 94, 0.15)', color: '#4ADE80', padding: '0.15rem 0.5rem', borderRadius: '9999px' }}>
                                                            🔥 Streak Counted
                                                        </span>
                                                    )}
                                                    <span style={{ fontSize: '0.75rem', color: '#64748B' }}>{act.dateString}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="empty-section-card">
                                        <h4>No activity recorded yet</h4>
                                        <p>Start a learning journey and complete tasks to see your activity timeline here.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ── 9. CAREER GOALS TAB ── */}
                    {activeTab === 'careerGoals' && (
                        <div className="profile-section-container">
                            <div className="section-toolbar">
                                <div className="section-toolbar-left">
                                    <h3>Career Goals & Target Preferences</h3>
                                    <p>Configure your target role, preferred work mode, and target skills.</p>
                                </div>
                                <button
                                    type="button"
                                    className="button primary-button"
                                    onClick={() => {
                                        setCareerForm({
                                            targetRole: profile?.careerGoals?.targetRole || p.targetRole || '',
                                            workPreference: profile?.careerGoals?.workPreference || 'Hybrid',
                                            experienceLevel: profile?.careerGoals?.experienceLevel || 'Internship',
                                            targetSkills: (profile?.careerGoals?.targetSkills || []).join(', '),
                                            preferredIndustries: (profile?.careerGoals?.preferredIndustries || []).join(', ')
                                        });
                                        setActiveModal('careerGoals');
                                    }}
                                >
                                    ✏️ Edit Career Goals
                                </button>
                            </div>

                            <div className="profile-grid-2col">
                                <div className="profile-card">
                                    <div className="profile-card-header">
                                        <div className="card-title-group">
                                            <span className="card-title-icon">🎯</span>
                                            <h4>Primary Target Role</h4>
                                        </div>
                                    </div>
                                    <p className="goal-highlight-text">{profile?.careerGoals?.targetRole || p.targetRole || 'Software Engineer / AI Intern'}</p>
                                </div>

                                <div className="profile-card">
                                    <div className="profile-card-header">
                                        <div className="card-title-group">
                                            <span className="card-title-icon">💼</span>
                                            <h4>Experience Level</h4>
                                        </div>
                                    </div>
                                    <p className="goal-highlight-text">{profile?.careerGoals?.experienceLevel || 'Internship'}</p>
                                </div>

                                <div className="profile-card">
                                    <div className="profile-card-header">
                                        <div className="card-title-group">
                                            <span className="card-title-icon">🏢</span>
                                            <h4>Work Mode Preference</h4>
                                        </div>
                                    </div>
                                    <p className="goal-highlight-text">{profile?.careerGoals?.workPreference || 'Hybrid'}</p>
                                </div>

                                <div className="profile-card">
                                    <div className="profile-card-header">
                                        <div className="card-title-group">
                                            <span className="card-title-icon">🚀</span>
                                            <h4>Target Learning Skills</h4>
                                        </div>
                                    </div>
                                    <p className="card-body-text">
                                        {profile?.careerGoals?.targetSkills?.length > 0 ? profile.careerGoals.targetSkills.join(', ') : 'Add skills you are actively working towards.'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── 10. RESUME TAB ── */}
                    {activeTab === 'resume' && (
                        <div className="profile-section-container">
                            <div className="section-toolbar">
                                <div className="section-toolbar-left">
                                    <h3>Resume Synchronization</h3>
                                    <p>Your uploaded resume is the factual source of truth for match scoring and technical questions.</p>
                                </div>
                                <Link to="/" className="button primary-button">
                                    📄 Upload / Replace Resume
                                </Link>
                            </div>

                            <div className="profile-card resume-full-card">
                                <div className="resume-overview-box">
                                    <div className="resume-icon-badge">📄</div>
                                    <div className="resume-meta">
                                        <h4 className="resume-filename">{profile?.resumeData?.fileName || "Default Candidate Resume"}</h4>
                                        <p className="resume-status">
                                            Status: <span className="status-highlight">{profile?.resumeData?.status || "Ready for Analysis"}</span>
                                        </p>
                                        {profile?.resumeData?.lastAnalyzedAt && (
                                            <span className="resume-date">
                                                Last Analyzed: {new Date(profile.resumeData.lastAnalyzedAt).toLocaleDateString()}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {profile?.resumeData?.parsedTextSnippet && (
                                    <div className="resume-parsed-preview">
                                        <h5>Parsed Text Preview (Source of Truth):</h5>
                                        <p className="parsed-code">{profile.resumeData.parsedTextSnippet}...</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </main>
            </div>

            {/* ══════════════════════════════════════════════════════════
                MODALS FOR EDITING & ADDING ITEMS
                ══════════════════════════════════════════════════════════ */}

            {/* Edit Personal Details Modal */}
            {editingPersonal && personalForm && (
                <div className="profile-modal-overlay" onClick={() => setEditingPersonal(false)}>
                    <div className="profile-modal-box" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Edit Profile Details</h3>
                            <button type="button" className="btn-close-modal" onClick={() => setEditingPersonal(false)}>✕</button>
                        </div>
                        <form onSubmit={handleSavePersonal} className="modal-form">
                            <div className="form-group-row">
                                <div className="form-field">
                                    <label>Full Name</label>
                                    <input
                                        type="text"
                                        value={personalForm.fullName}
                                        onChange={e => setPersonalForm({ ...personalForm, fullName: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-field">
                                    <label>Target Role</label>
                                    <input
                                        type="text"
                                        value={personalForm.targetRole}
                                        onChange={e => setPersonalForm({ ...personalForm, targetRole: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-field">
                                <label>Headline</label>
                                <input
                                    type="text"
                                    value={personalForm.headline}
                                    onChange={e => setPersonalForm({ ...personalForm, headline: e.target.value })}
                                    placeholder="e.g. Computer Science Student & Aspiring AI Engineer"
                                />
                            </div>

                            <div className="form-field">
                                <label>Bio / About Me</label>
                                <textarea
                                    value={personalForm.bio}
                                    onChange={e => setPersonalForm({ ...personalForm, bio: e.target.value })}
                                    rows={3}
                                    placeholder="Brief overview of your background and career interests..."
                                />
                            </div>

                            <div className="form-group-row">
                                <div className="form-field">
                                    <label>Location</label>
                                    <input
                                        type="text"
                                        value={personalForm.location}
                                        onChange={e => setPersonalForm({ ...personalForm, location: e.target.value })}
                                        placeholder="e.g. Bengaluru, India"
                                    />
                                </div>
                                <div className="form-field">
                                    <label>Phone</label>
                                    <input
                                        type="text"
                                        value={personalForm.phone}
                                        onChange={e => setPersonalForm({ ...personalForm, phone: e.target.value })}
                                        placeholder="e.g. +91 98765 43210"
                                    />
                                </div>
                            </div>

                            <div className="form-group-row">
                                <div className="form-field">
                                    <label>LinkedIn URL</label>
                                    <input
                                        type="url"
                                        value={personalForm.linkedin}
                                        onChange={e => setPersonalForm({ ...personalForm, linkedin: e.target.value })}
                                        placeholder="https://linkedin.com/in/..."
                                    />
                                </div>
                                <div className="form-field">
                                    <label>GitHub URL</label>
                                    <input
                                        type="url"
                                        value={personalForm.github}
                                        onChange={e => setPersonalForm({ ...personalForm, github: e.target.value })}
                                        placeholder="https://github.com/..."
                                    />
                                </div>
                            </div>

                            <div className="modal-actions-row">
                                <button type="button" className="button secondary-button" onClick={() => setEditingPersonal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="button primary-button" disabled={saving}>
                                    {saving ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Add Skill Modal */}
            {activeModal === 'skill' && (
                <div className="profile-modal-overlay" onClick={() => setActiveModal(null)}>
                    <div className="profile-modal-box" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>+ Add Skill</h3>
                            <button type="button" className="btn-close-modal" onClick={() => setActiveModal(null)}>✕</button>
                        </div>
                        <form onSubmit={handleAddSkillSubmit} className="modal-form">
                            <div className="form-field">
                                <label>Skill Name</label>
                                <input
                                    type="text"
                                    value={skillForm.name}
                                    onChange={e => setSkillForm({ ...skillForm, name: e.target.value })}
                                    placeholder="e.g. Python, React, Docker, RAG"
                                    required
                                />
                            </div>
                            <div className="form-group-row">
                                <div className="form-field">
                                    <label>Category</label>
                                    <select
                                        value={skillForm.category}
                                        onChange={e => setSkillForm({ ...skillForm, category: e.target.value })}
                                    >
                                        <option value="Programming">Programming</option>
                                        <option value="AI / ML">AI / ML</option>
                                        <option value="Frontend">Frontend</option>
                                        <option value="Backend">Backend</option>
                                        <option value="Databases">Databases</option>
                                        <option value="Tools">Tools</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <div className="form-field">
                                    <label>Proficiency Level</label>
                                    <select
                                        value={skillForm.level}
                                        onChange={e => setSkillForm({ ...skillForm, level: e.target.value })}
                                    >
                                        <option value="Beginner">Beginner</option>
                                        <option value="Intermediate">Intermediate</option>
                                        <option value="Advanced">Advanced</option>
                                    </select>
                                </div>
                            </div>
                            <div className="form-field">
                                <label>Evidence Type</label>
                                <select
                                    value={skillForm.evidenceType}
                                    onChange={e => setSkillForm({ ...skillForm, evidenceType: e.target.value })}
                                >
                                    <option value="SELF_DECLARED">Self-Declared (Personal Knowledge)</option>
                                    <option value="VERIFIED">Verified (Present in Resume / Project)</option>
                                    <option value="NEEDS_EVIDENCE">Needs Evidence (Learning Target)</option>
                                </select>
                            </div>
                            <div className="modal-actions-row">
                                <button type="button" className="button secondary-button" onClick={() => setActiveModal(null)}>Cancel</button>
                                <button type="submit" className="button primary-button" disabled={saving}>Add Skill</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Add Project Modal */}
            {activeModal === 'project' && (
                <div className="profile-modal-overlay" onClick={() => setActiveModal(null)}>
                    <div className="profile-modal-box" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>+ Add Showcase Project</h3>
                            <button type="button" className="btn-close-modal" onClick={() => setActiveModal(null)}>✕</button>
                        </div>
                        <form onSubmit={handleAddProjectSubmit} className="modal-form">
                            <div className="form-field">
                                <label>Project Name</label>
                                <input
                                    type="text"
                                    value={projectForm.name}
                                    onChange={e => setProjectForm({ ...projectForm, name: e.target.value })}
                                    placeholder="e.g. SkillBridge AI Assistant"
                                    required
                                />
                            </div>
                            <div className="form-field">
                                <label>Technologies (Comma separated)</label>
                                <input
                                    type="text"
                                    value={projectForm.technologies}
                                    onChange={e => setProjectForm({ ...projectForm, technologies: e.target.value })}
                                    placeholder="e.g. React, Node.js, Gemini API, MongoDB"
                                />
                            </div>
                            <div className="form-field">
                                <label>What I Built / Description</label>
                                <textarea
                                    value={projectForm.whatIBuilt}
                                    onChange={e => setProjectForm({ ...projectForm, whatIBuilt: e.target.value })}
                                    rows={2}
                                    placeholder="Explain the core functionality you implemented..."
                                />
                            </div>
                            <div className="form-field">
                                <label>Key Outcome & Results</label>
                                <input
                                    type="text"
                                    value={projectForm.keyOutcome}
                                    onChange={e => setProjectForm({ ...projectForm, keyOutcome: e.target.value })}
                                    placeholder="e.g. Reduced preparation time by 50% for 100+ candidates"
                                />
                            </div>
                            <div className="form-group-row">
                                <div className="form-field">
                                    <label>GitHub URL</label>
                                    <input
                                        type="url"
                                        value={projectForm.githubUrl}
                                        onChange={e => setProjectForm({ ...projectForm, githubUrl: e.target.value })}
                                        placeholder="https://github.com/..."
                                    />
                                </div>
                                <div className="form-field">
                                    <label>Status</label>
                                    <select
                                        value={projectForm.status}
                                        onChange={e => setProjectForm({ ...projectForm, status: e.target.value })}
                                    >
                                        <option value="Completed">Completed</option>
                                        <option value="In Progress">In Progress</option>
                                        <option value="Idea">Idea / Planned</option>
                                    </select>
                                </div>
                            </div>
                            <div className="modal-actions-row">
                                <button type="button" className="button secondary-button" onClick={() => setActiveModal(null)}>Cancel</button>
                                <button type="submit" className="button primary-button" disabled={saving}>Add Project</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Add Experience Modal */}
            {activeModal === 'experience' && (
                <div className="profile-modal-overlay" onClick={() => setActiveModal(null)}>
                    <div className="profile-modal-box" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>+ Add Internship / Experience</h3>
                            <button type="button" className="btn-close-modal" onClick={() => setActiveModal(null)}>✕</button>
                        </div>
                        <form onSubmit={handleAddExpSubmit} className="modal-form">
                            <div className="form-group-row">
                                <div className="form-field">
                                    <label>Company / Organization</label>
                                    <input
                                        type="text"
                                        value={expForm.company}
                                        onChange={e => setExpForm({ ...expForm, company: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-field">
                                    <label>Role / Position</label>
                                    <input
                                        type="text"
                                        value={expForm.role}
                                        onChange={e => setExpForm({ ...expForm, role: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="form-group-row">
                                <div className="form-field">
                                    <label>Type</label>
                                    <select
                                        value={expForm.type}
                                        onChange={e => setExpForm({ ...expForm, type: e.target.value })}
                                    >
                                        <option value="Internship">Internship</option>
                                        <option value="Part-time">Part-time</option>
                                        <option value="Freelance">Freelance</option>
                                        <option value="Research">Research / Academic</option>
                                        <option value="Full-time">Full-time</option>
                                    </select>
                                </div>
                                <div className="form-field">
                                    <label>Dates</label>
                                    <input
                                        type="text"
                                        value={expForm.startDate}
                                        onChange={e => setExpForm({ ...expForm, startDate: e.target.value })}
                                        placeholder="e.g. May 2024 - July 2024"
                                    />
                                </div>
                            </div>
                            <div className="form-field">
                                <label>Description & Responsibilities</label>
                                <textarea
                                    value={expForm.description}
                                    onChange={e => setExpForm({ ...expForm, description: e.target.value })}
                                    rows={3}
                                    placeholder="Key projects, tasks, and accomplishments..."
                                />
                            </div>
                            <div className="modal-actions-row">
                                <button type="button" className="button secondary-button" onClick={() => setActiveModal(null)}>Cancel</button>
                                <button type="submit" className="button primary-button" disabled={saving}>Save Experience</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Add Education Modal */}
            {activeModal === 'education' && (
                <div className="profile-modal-overlay" onClick={() => setActiveModal(null)}>
                    <div className="profile-modal-box" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>+ Add Education</h3>
                            <button type="button" className="btn-close-modal" onClick={() => setActiveModal(null)}>✕</button>
                        </div>
                        <form onSubmit={handleAddEduSubmit} className="modal-form">
                            <div className="form-field">
                                <label>Degree</label>
                                <input
                                    type="text"
                                    value={eduForm.degree}
                                    onChange={e => setEduForm({ ...eduForm, degree: e.target.value })}
                                    placeholder="e.g. B.Tech in Computer Science"
                                    required
                                />
                            </div>
                            <div className="form-field">
                                <label>University / College</label>
                                <input
                                    type="text"
                                    value={eduForm.university}
                                    onChange={e => setEduForm({ ...eduForm, university: e.target.value })}
                                    placeholder="e.g. Anna University"
                                    required
                                />
                            </div>
                            <div className="form-group-row">
                                <div className="form-field">
                                    <label>Graduation Year</label>
                                    <input
                                        type="number"
                                        value={eduForm.gradYear}
                                        onChange={e => setEduForm({ ...eduForm, gradYear: e.target.value })}
                                        placeholder="e.g. 2026"
                                    />
                                </div>
                                <div className="form-field">
                                    <label>CGPA / Percentage</label>
                                    <input
                                        type="text"
                                        value={eduForm.cgpa}
                                        onChange={e => setEduForm({ ...eduForm, cgpa: e.target.value })}
                                        placeholder="e.g. 8.8 / 10"
                                    />
                                </div>
                            </div>
                            <div className="modal-actions-row">
                                <button type="button" className="button secondary-button" onClick={() => setActiveModal(null)}>Cancel</button>
                                <button type="submit" className="button primary-button" disabled={saving}>Save Education</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Add Certification Modal */}
            {activeModal === 'certification' && (
                <div className="profile-modal-overlay" onClick={() => setActiveModal(null)}>
                    <div className="profile-modal-box" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>+ Add Certification</h3>
                            <button type="button" className="btn-close-modal" onClick={() => setActiveModal(null)}>✕</button>
                        </div>
                        <form onSubmit={handleAddCertSubmit} className="modal-form">
                            <div className="form-field">
                                <label>Certification Name</label>
                                <input
                                    type="text"
                                    value={certForm.name}
                                    onChange={e => setCertForm({ ...certForm, name: e.target.value })}
                                    placeholder="e.g. AWS Certified Cloud Practitioner"
                                    required
                                />
                            </div>
                            <div className="form-group-row">
                                <div className="form-field">
                                    <label>Issuer</label>
                                    <input
                                        type="text"
                                        value={certForm.issuer}
                                        onChange={e => setCertForm({ ...certForm, issuer: e.target.value })}
                                        placeholder="e.g. Amazon Web Services, Google"
                                    />
                                </div>
                                <div className="form-field">
                                    <label>Credential URL</label>
                                    <input
                                        type="url"
                                        value={certForm.credentialUrl}
                                        onChange={e => setCertForm({ ...certForm, credentialUrl: e.target.value })}
                                        placeholder="https://..."
                                    />
                                </div>
                            </div>
                            <div className="modal-actions-row">
                                <button type="button" className="button secondary-button" onClick={() => setActiveModal(null)}>Cancel</button>
                                <button type="submit" className="button primary-button" disabled={saving}>Add Certification</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Add Language Modal */}
            {activeModal === 'language' && (
                <div className="profile-modal-overlay" onClick={() => setActiveModal(null)}>
                    <div className="profile-modal-box" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>+ Add Language</h3>
                            <button type="button" className="btn-close-modal" onClick={() => setActiveModal(null)}>✕</button>
                        </div>
                        <form onSubmit={handleAddLangSubmit} className="modal-form">
                            <div className="form-group-row">
                                <div className="form-field">
                                    <label>Language</label>
                                    <input
                                        type="text"
                                        value={langForm.language}
                                        onChange={e => setLangForm({ ...langForm, language: e.target.value })}
                                        placeholder="e.g. English, Hindi, Tamil"
                                        required
                                    />
                                </div>
                                <div className="form-field">
                                    <label>Proficiency</label>
                                    <select
                                        value={langForm.proficiency}
                                        onChange={e => setLangForm({ ...langForm, proficiency: e.target.value })}
                                    >
                                        <option value="Native">Native</option>
                                        <option value="Fluent">Fluent</option>
                                        <option value="Intermediate">Intermediate</option>
                                        <option value="Basic">Basic</option>
                                    </select>
                                </div>
                            </div>
                            <div className="modal-actions-row">
                                <button type="button" className="button secondary-button" onClick={() => setActiveModal(null)}>Cancel</button>
                                <button type="submit" className="button primary-button" disabled={saving}>Add Language</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Add Achievement Modal */}
            {activeModal === 'achievement' && (
                <div className="profile-modal-overlay" onClick={() => setActiveModal(null)}>
                    <div className="profile-modal-box" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>+ Add Achievement</h3>
                            <button type="button" className="btn-close-modal" onClick={() => setActiveModal(null)}>✕</button>
                        </div>
                        <form onSubmit={handleAddAchSubmit} className="modal-form">
                            <div className="form-field">
                                <label>Title</label>
                                <input
                                    type="text"
                                    value={achForm.title}
                                    onChange={e => setAchForm({ ...achForm, title: e.target.value })}
                                    placeholder="e.g. Winner - Smart India Hackathon 2024"
                                    required
                                />
                            </div>
                            <div className="form-field">
                                <label>Description</label>
                                <textarea
                                    value={achForm.description}
                                    onChange={e => setAchForm({ ...achForm, description: e.target.value })}
                                    rows={2}
                                    placeholder="Describe the achievement, competition size, or outcome..."
                                />
                            </div>
                            <div className="modal-actions-row">
                                <button type="button" className="button secondary-button" onClick={() => setActiveModal(null)}>Cancel</button>
                                <button type="submit" className="button primary-button" disabled={saving}>Add Achievement</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Career Goals Modal */}
            {activeModal === 'careerGoals' && (
                <div className="profile-modal-overlay" onClick={() => setActiveModal(null)}>
                    <div className="profile-modal-box" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Configure Career Goals</h3>
                            <button type="button" className="btn-close-modal" onClick={() => setActiveModal(null)}>✕</button>
                        </div>
                        <form onSubmit={handleSaveCareerGoals} className="modal-form">
                            <div className="form-field">
                                <label>Target Role</label>
                                <input
                                    type="text"
                                    value={careerForm.targetRole}
                                    onChange={e => setCareerForm({ ...careerForm, targetRole: e.target.value })}
                                    placeholder="e.g. AI/ML Engineer, Full Stack Developer"
                                    required
                                />
                            </div>
                            <div className="form-group-row">
                                <div className="form-field">
                                    <label>Work Preference</label>
                                    <select
                                        value={careerForm.workPreference}
                                        onChange={e => setCareerForm({ ...careerForm, workPreference: e.target.value })}
                                    >
                                        <option value="Hybrid">Hybrid</option>
                                        <option value="Remote">Remote</option>
                                        <option value="On-site">On-site</option>
                                        <option value="Flexible">Flexible</option>
                                    </select>
                                </div>
                                <div className="form-field">
                                    <label>Experience Level</label>
                                    <select
                                        value={careerForm.experienceLevel}
                                        onChange={e => setCareerForm({ ...careerForm, experienceLevel: e.target.value })}
                                    >
                                        <option value="Internship">Internship</option>
                                        <option value="Fresher">Fresher</option>
                                        <option value="Entry Level">Entry Level</option>
                                        <option value="Junior">Junior</option>
                                    </select>
                                </div>
                            </div>
                            <div className="form-field">
                                <label>Target Learning Skills (Comma separated)</label>
                                <input
                                    type="text"
                                    value={careerForm.targetSkills}
                                    onChange={e => setCareerForm({ ...careerForm, targetSkills: e.target.value })}
                                    placeholder="e.g. Vector DBs, LangChain, System Design"
                                />
                            </div>
                            <div className="modal-actions-row">
                                <button type="button" className="button secondary-button" onClick={() => setActiveModal(null)}>Cancel</button>
                                <button type="submit" className="button primary-button" disabled={saving}>Save Career Goals</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AppShell>
    );
};

export default Profile;
