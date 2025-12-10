import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Login.css';

const Login = () => {
    const navigate = useNavigate();

    // State to toggle between Login and Signup views
    // Default to 'login' as per "The flow should be clean, fast"
    const [view, setView] = useState('login');

    // Form States
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [role, setRole] = useState(''); // Only for Signup
    const [isLoading, setIsLoading] = useState(false);

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
                const userRole = res.data.role;
                // alert(`Welcome back, ${res.data.name}!`); // Optional welcome

                // Redirect based on role
                switch (userRole) {
                    case 'driver': navigate('/driver'); break;
                    case 'police': navigate('/police'); break;
                    case 'hospital': navigate('/hospital'); break;
                    case 'admin': navigate('/admin'); break;
                    default: alert("Unknown role");
                }
            }
        } catch (err) {
            alert(err.response?.data?.error || "Login Failed");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSignupSubmit = async () => {
        if (!fullName || !email || !password || !role) {
            alert("Please fill in all fields and select a role.");
            return;
        }

        setIsLoading(true);
        try {
            const res = await axios.post(`${API_URL}/signup`, { fullName, email, password, role });
            if (res.data.success) {
                alert("Account created successfully! Please Login.");
                setView('login');
                // Reset form slightly
                setPassword('');
                setRole('');
            }
        } catch (err) {
            alert(err.response?.data?.error || "Signup Failed");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-overlay">

                <div className="login-card expanded">
                    <div className="logo-section">
                        <h1>MARG-AI</h1>
                        <p className="caption">Intelligent Traffic Clearance System</p>
                        <p className="sub-caption">"Saving Lives, One Green Light at a Time"</p>
                    </div>

                    {view === 'login' ? (
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
                                <input
                                    type="password"
                                    placeholder="Password"
                                    className="login-input"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
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
                                <input
                                    type="password"
                                    placeholder="Password"
                                    className="login-input"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />

                                {/* Role Selection Grid from previous CSS */}
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
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Login;
