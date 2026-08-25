import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import "../auth.form.scss";
import { useAuth } from '../hooks/useAuth';
import GoogleAuthButton from '../components/GoogleAuthButton';

import { StudentSkillHubLogo } from '../../interview/components/StudentSkillHubLogo';

const Register = () => {
    const navigate = useNavigate();
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const { loading, handleRegister } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        try {
            await handleRegister({ username, email, password });
            navigate("/");
        } catch (err) {
            setError(err.response?.data?.message || "Registration failed. Please try again.");
        }
    };

    if (loading) {
        return (
            <main className="auth-page-wrapper">
                <div className="loading-screen">
                    <div className="loading-spinner" />
                    <h2>Creating your account...</h2>
                </div>
            </main>
        );
    }

    return (
        <main className="auth-page-wrapper">
            <div className="form-container">
                {/* Brand Header */}
                <div className="auth-brand-header">
                    <StudentSkillHubLogo size="lg" showWordmark={true} showTagline={true} />
                    <p className="auth-subtitle" style={{ marginTop: '0.75rem' }}>Create an account to start preparing for your dream role</p>
                </div>

                {error && <div className="auth-error-banner">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label htmlFor="username">Full Name / Username</label>
                        <input
                            onChange={(e) => setUsername(e.target.value)}
                            type="text"
                            id="username"
                            name="username"
                            placeholder="John Doe"
                            required
                        />
                    </div>
                    <div className="input-group">
                        <label htmlFor="email">Email Address</label>
                        <input
                            onChange={(e) => setEmail(e.target.value)}
                            type="email"
                            id="email"
                            name="email"
                            placeholder="name@company.com"
                            required
                        />
                    </div>
                    <div className="input-group">
                        <label htmlFor="password">Password</label>
                        <input
                            onChange={(e) => setPassword(e.target.value)}
                            type="password"
                            id="password"
                            name="password"
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <button type="submit" className="button primary-button auth-submit-btn">
                        Create Account →
                    </button>
                </form>

                <div className="auth-divider">
                    <span>OR CONTINUE WITH</span>
                </div>

                <GoogleAuthButton onSuccess={() => navigate('/')} />

                <p className="auth-footer-text">
                    Already have an account? <Link to="/login">Sign in</Link>
                </p>
            </div>
        </main>
    );
};

export default Register;