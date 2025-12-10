import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Login.css';

const Login = () => {
    const navigate = useNavigate();

    // State to toggle between Login and Signup views
    const [view, setView] = useState('landing');

    // Form States
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [role, setRole] = useState(''); // Only for Signup
    const [ambulanceNumber, setAmbulanceNumber] = useState(''); // New State for Driver
    const [isLoading, setIsLoading] = useState(false);

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const API_URL = 'http://localhost:5000/api/auth';

    const handleLoginSubmit = async () => {
        if (!email || !password) {
            alert("Please enter both email and password.");
            return;
        }

        setIsLoading(true);
        try {
            const res = await axios.post(`${API_URL}/login`, { email, password });
            if (res.data.success) {
                const userRole = res.data.role; // 'driver', 'police', etc.
                const userAmbNumber = res.data.ambulanceNumber; // Get Amb Number

                // Redirect based on role
                switch (userRole) {
                    case 'driver':
                        navigate('/driver', { state: { ambNumber: userAmbNumber } });
                        break;
                    case 'police': navigate('/police'); break;
                    case 'hospital': navigate('/hospital'); break;
                    case 'admin': navigate('/admin'); break;
                    default: alert("Unknown role: " + userRole);
                }
            }
        } catch (err) {
            if (!err.response) {
                alert("Cannot connect to server. Is the backend running?");
            } else {
                alert(err.response?.data?.error || "Login Failed");
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleSignupSubmit = async () => {
        if (!fullName || !email || !password || !confirmPassword || !role) {
            alert("Please fill in all fields and select a role.");
            return;
        }

        if (password !== confirmPassword) {
            alert("Passwords do not match!");
            return;
        }

        if (role === 'driver' && !ambulanceNumber) {
            alert("Please enter the Ambulance Number.");
            return;
        }

        setIsLoading(true);
        try {
            const res = await axios.post(`${API_URL}/signup`, {
                fullName,
                email,
                password,
                role,
                ambulanceNumber // Send to backend
            });
            if (res.data.success) {
                alert("Account created successfully! Please Login.");
                setView('login');
                setPassword('');
                setConfirmPassword('');
                setRole('');
                setAmbulanceNumber('');
            }
        } catch (err) {
            if (!err.response) {
                alert("Cannot connect to server. Is the backend running?");
            } else {
                alert(err.response?.data?.error || "Signup Failed");
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-overlay split-layout">

                {/* LEFT SIDE: Hero / Branding */}
                <div className="hero-section">
                    <div className="hero-content">
                        <h1>MARG-AI</h1>
                        <p className="caption">Intelligent Traffic Clearance System</p>
                        <p className="sub-caption">"Saving Lives, One Green Light at a Time"</p>
                    </div>
                </div>

                {/* RIGHT SIDE: Authentication Card */}
                <div className="auth-section">
                    <div className="login-card">

                        {/* Only show small logo inside card for mobile, or omit if strictly desktop split. 
                            For now, we remove the big logo from inside the card. */}

                        {view === 'landing' ? (
                            /* LANDING VIEW (Buttons) */
                            <div className="landing-view fade-in">
                                <h3>Get Started</h3>
                                <p style={{ color: '#aaa', marginBottom: '20px' }}>Select an option to continue</p>
                                <div className="landing-buttons">
                                    <button className="role-btn" onClick={() => setView('login')}>
                                        Login
                                    </button>
                                    <button className="role-btn signup-btn" onClick={() => setView('signup')} style={{ marginTop: '1rem', background: 'transparent', border: '1px solid #00f2fe' }}>
                                        Sign Up
                                    </button>
                                </div>
                            </div>
                        ) : view === 'login' ? (
                            /* LOGIN VIEW */
                            <div className="role-selection fade-in">
                                <h3>👋 Welcome Back</h3>
                                <div className="driver-form">
                                    <input
                                        type="email"
                                        placeholder="Email Address"
                                        className="login-input"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />

                                    <div className="password-wrapper">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            placeholder="Password"
                                            className="login-input"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                        />
                                        <span
                                            className="password-toggle-icon"
                                            onClick={() => setShowPassword(!showPassword)}
                                        >
                                            {showPassword ? (
                                                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                            ) : (
                                                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                                            )}
                                        </span>
                                    </div>

                                    <button
                                        className="role-btn login-submit-btn"
                                        onClick={handleLoginSubmit}
                                        disabled={isLoading}
                                    >
                                        {isLoading ? 'Logging in...' : 'Login'}
                                    </button>

                                    <div className="divider">
                                        <span>OR</span>
                                    </div>

                                    <p className="signup-link">
                                        Don't have an account? <span onClick={() => {
                                            setView('signup');
                                            setEmail('');
                                            setPassword('');
                                        }}>Create Account</span>
                                    </p>
                                    <button className="back-link-btn" onClick={() => setView('landing')}>⬅ Back</button>
                                </div>
                            </div>
                        ) : (
                            /* SIGNUP VIEW */
                            <div className="role-selection fade-in">
                                <h3>🚀 Create Account</h3>
                                <div className="driver-form">
                                    <input
                                        type="text"
                                        placeholder="Full Name"
                                        className="login-input"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                    />
                                    <input
                                        type="email"
                                        placeholder="Email Address"
                                        className="login-input"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />

                                    <div className="password-wrapper">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            placeholder="Password"
                                            className="login-input"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                        />
                                        <span
                                            className="password-toggle-icon"
                                            onClick={() => setShowPassword(!showPassword)}
                                        >
                                            {showPassword ? (
                                                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                            ) : (
                                                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                                            )}
                                        </span>
                                    </div>

                                    <div className="password-wrapper">
                                        <input
                                            type={showConfirmPassword ? "text" : "password"}
                                            placeholder="Confirm Password"
                                            className="login-input"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                        />
                                        <span
                                            className="password-toggle-icon"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        >
                                            {showConfirmPassword ? (
                                                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                            ) : (
                                                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                                            )}
                                        </span>
                                    </div>

                                    {/* Role Selection Grid */}
                                    <label style={{ textAlign: 'left', color: '#ccc', fontSize: '0.9rem', marginBottom: '-10px' }}>Select Role:</label>
                                    <div className="role-grid-input">
                                        <button
                                            className={`mini-role-btn ${role === 'driver' ? 'selected' : ''}`}
                                            onClick={() => setRole('driver')}
                                        >🚑 Driver</button>
                                        <button
                                            className={`mini-role-btn ${role === 'police' ? 'selected' : ''}`}
                                            onClick={() => setRole('police')}
                                        >👮 Police</button>
                                        <button
                                            className={`mini-role-btn ${role === 'hospital' ? 'selected' : ''}`}
                                            onClick={() => setRole('hospital')}
                                        >🏥 Hospital</button>
                                        <button
                                            className={`mini-role-btn ${role === 'admin' ? 'selected' : ''}`}
                                            onClick={() => setRole('admin')}
                                        >🛡️ Admin</button>
                                    </div>

                                    {/* AMBULANCE NUMBER INPUT (Conditional) */}
                                    {role === 'driver' && (
                                        <div className="fade-in" style={{ marginTop: '10px' }}>
                                            <input
                                                type="text"
                                                placeholder="Ambulance Number (e.g., AP 39 Z 9999)"
                                                className="login-input"
                                                value={ambulanceNumber}
                                                onChange={(e) => setAmbulanceNumber(e.target.value)}
                                                style={{ border: '1px solid #ff4757' }}
                                            />
                                        </div>
                                    )}

                                    <button
                                        className="role-btn login-submit-btn"
                                        onClick={handleSignupSubmit}
                                        disabled={isLoading}
                                    >
                                        {isLoading ? 'Creating...' : 'Sign Up'}
                                    </button>
                                </div>
                                <p className="signup-link">
                                    Already have an account? <span onClick={() => setView('login')}>Login</span>
                                </p>
                                <button className="back-link-btn" onClick={() => setView('landing')}>⬅ Back</button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
