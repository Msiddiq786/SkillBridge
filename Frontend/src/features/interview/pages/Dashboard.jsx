import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router';
import { useInterview } from '../hooks/useInterview';
import { useAuth } from '../../auth/hooks/useAuth';
import '../style/dashboard.scss';

const Dashboard = () => {
    const { loading, reports } = useInterview();
    const { user, handleLogout } = useAuth();
    const navigate = useNavigate();

    const [searchTerm, setSearchTerm] = useState("");
    const [companyFilter, setCompanyFilter] = useState("All");
    const [sortBy, setSortBy] = useState("newest");

    const stats = useMemo(() => {
        if (!reports || reports.length === 0) {
            return {
                totalReports: 0,
                avgScore: 0,
                highestScore: 0,
                uniqueCompanies: 0,
                strongSkills: [],
                weakSkills: [],
                scoreDistribution: [0, 0, 0, 0, 0] // 0-20, 21-40, 41-60, 61-80, 81-100
            };
        }

        let totalScore = 0;
        let highest = 0;
        const companies = new Set();
        const strongSkillsCount = {};
        const weakSkillsCount = {};
        const dist = [0, 0, 0, 0, 0];

        reports.forEach(report => {
            const score = report.matchScore || 0;
            totalScore += score;
            if (score > highest) highest = score;
            
            if (report.company) {
                companies.add(report.company.trim().toLowerCase());
            }

            // Score distribution
            if (score <= 20) dist[0]++;
            else if (score <= 40) dist[1]++;
            else if (score <= 60) dist[2]++;
            else if (score <= 80) dist[3]++;
            else dist[4]++;

            if (Array.isArray(report.strongSkills)) {
                report.strongSkills.forEach(skill => {
                    strongSkillsCount[skill] = (strongSkillsCount[skill] || 0) + 1;
                });
            }

            if (Array.isArray(report.weakSkills)) {
                report.weakSkills.forEach(skill => {
                    weakSkillsCount[skill] = (weakSkillsCount[skill] || 0) + 1;
                });
            }
        });

        const sortedStrongSkills = Object.entries(strongSkillsCount)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);
            
        const sortedWeakSkills = Object.entries(weakSkillsCount)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);

        return {
            totalReports: reports.length,
            avgScore: Math.round(totalScore / reports.length),
            highestScore: highest,
            uniqueCompanies: companies.size,
            strongSkills: sortedStrongSkills,
            weakSkills: sortedWeakSkills,
            scoreDistribution: dist
        };
    }, [reports]);

    const uniqueCompanyList = useMemo(() => {
        if (!reports) return [];
        const companies = new Set(reports.map(r => r.company).filter(Boolean));
        return Array.from(companies).sort();
    }, [reports]);

    const filteredAndSortedReports = useMemo(() => {
        if (!reports) return [];
        
        let result = [...reports];

        if (searchTerm) {
            const lowerSearch = searchTerm.toLowerCase();
            result = result.filter(r => 
                (r.title && r.title.toLowerCase().includes(lowerSearch)) ||
                (r.company && r.company.toLowerCase().includes(lowerSearch))
            );
        }

        if (companyFilter !== "All") {
            result = result.filter(r => r.company === companyFilter);
        }

        result.sort((a, b) => {
            if (sortBy === "newest") {
                return new Date(b.createdAt) - new Date(a.createdAt);
            } else if (sortBy === "oldest") {
                return new Date(a.createdAt) - new Date(b.createdAt);
            } else if (sortBy === "highest") {
                return (b.matchScore || 0) - (a.matchScore || 0);
            } else if (sortBy === "lowest") {
                return (a.matchScore || 0) - (b.matchScore || 0);
            }
            return 0;
        });

        return result;
    }, [reports, searchTerm, companyFilter, sortBy]);

    if (loading && (!reports || reports.length === 0)) {
        return (
            <main className='loading-screen'>
                <h1>Loading dashboard...</h1>
            </main>
        );
    }

    const maxDist = Math.max(...stats.scoreDistribution, 1);

    return (
        <div className="dashboard-page">
            <header className="page-header">
                <div className="header-content">
                    <div>
                        <h1>Your <span className="highlight">Dashboard</span></h1>
                        <p>Welcome back, {user?.name || 'User'}! Track your interview performance.</p>
                    </div>
                    <div className="header-actions">
                        <Link to="/" className="nav-link">New Interview</Link>
                        <button className="logout-btn" onClick={handleLogout}>Logout</button>
                    </div>
                </div>
            </header>

            <div className="dashboard-content">
                <div className="stats-grid">
                    <div className="stat-card">
                        <h3>Total Reports</h3>
                        <div className="stat-value">{stats.totalReports}</div>
                    </div>
                    <div className="stat-card">
                        <h3>Average Match</h3>
                        <div className="stat-value">{stats.avgScore}%</div>
                    </div>
                    <div className="stat-card">
                        <h3>Highest Match</h3>
                        <div className="stat-value">{stats.highestScore}%</div>
                    </div>
                    <div className="stat-card">
                        <h3>Target Companies</h3>
                        <div className="stat-value">{stats.uniqueCompanies}</div>
                    </div>
                </div>

                <div className="dashboard-grid">
                    <div className="dashboard-panel chart-panel">
                        <h2>Match Score Distribution</h2>
                        <div className="bar-chart">
                            {stats.scoreDistribution.map((count, i) => {
                                const labels = ["0-20", "21-40", "41-60", "61-80", "81-100"];
                                const height = (count / maxDist) * 100;
                                return (
                                    <div key={i} className="bar-container">
                                        <div className="bar-value">{count > 0 ? count : ''}</div>
                                        <div className="bar" style={{ height: `${height}%` }}></div>
                                        <div className="bar-label">{labels[i]}</div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="dashboard-panel skills-panel">
                        <h2>Top Strong Skills</h2>
                        <div className="skills-list">
                            {stats.strongSkills.length > 0 ? (
                                stats.strongSkills.map(([skill, count]) => (
                                    <div key={skill} className="skill-item strong">
                                        <span className="skill-name">{skill}</span>
                                        <span className="skill-count">{count}</span>
                                    </div>
                                ))
                            ) : (
                                <p className="text-muted">No strong skills recorded yet.</p>
                            )}
                        </div>
                    </div>

                    <div className="dashboard-panel skills-panel">
                        <h2>Top Areas for Improvement</h2>
                        <div className="skills-list">
                            {stats.weakSkills.length > 0 ? (
                                stats.weakSkills.map(([skill, count]) => (
                                    <div key={skill} className="skill-item weak">
                                        <span className="skill-name">{skill}</span>
                                        <span className="skill-count">{count}</span>
                                    </div>
                                ))
                            ) : (
                                <p className="text-muted">No weak skills recorded yet.</p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="dashboard-panel reports-panel">
                    <div className="reports-header">
                        <h2>Your Reports</h2>
                        <div className="reports-controls">
                            <input 
                                type="text" 
                                placeholder="Search by title or company..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="search-input"
                            />
                            <select 
                                value={companyFilter} 
                                onChange={(e) => setCompanyFilter(e.target.value)}
                                className="filter-select"
                            >
                                <option value="All">All Companies</option>
                                {uniqueCompanyList.map(company => (
                                    <option key={company} value={company}>{company}</option>
                                ))}
                            </select>
                            <select 
                                value={sortBy} 
                                onChange={(e) => setSortBy(e.target.value)}
                                className="sort-select"
                            >
                                <option value="newest">Newest First</option>
                                <option value="oldest">Oldest First</option>
                                <option value="highest">Highest Score</option>
                                <option value="lowest">Lowest Score</option>
                            </select>
                        </div>
                    </div>

                    <div className="reports-list">
                        {filteredAndSortedReports.length > 0 ? (
                            filteredAndSortedReports.map(report => (
                                <div 
                                    key={report._id} 
                                    className="report-card"
                                    onClick={() => navigate(`/interview/${report._id}`)}
                                >
                                    <div className="report-card-main">
                                        <h3>{report.title || "Interview Report"}</h3>
                                        <p className="company">{report.company}</p>
                                        <p className="date">{new Date(report.createdAt).toLocaleDateString()}</p>
                                    </div>
                                    <div className="report-card-score">
                                        <div className="score-circle">
                                            {report.matchScore || 0}%
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="no-results">
                                <p>No reports found matching your criteria.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
