<<<<<<< HEAD
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios'; // Import axios
=======
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
>>>>>>> 427d256fcba396027a090d41b189024db37aadf9
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

<<<<<<< HEAD
    // Form States
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [selectedRole, setSelectedRole] = useState('Driver'); // Default role for signup

    const [ambNumber, setAmbNumber] = useState('');
    const [hospName, setHospName] = useState('');
=======
    const API_URL = 'http://localhost:5000/api/auth';
>>>>>>> 427d256fcba396027a090d41b189024db37aadf9

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

<<<<<<< HEAD
    const handleLoginClick = () => {
        setSearchParams({ view: 'login' });
    };

    const handleSignupClick = () => {
        setSearchParams({ view: 'signup' });
    };

    const handleSignupSubmit = async () => {
        if (!name || !email || !password || !selectedRole) {
            alert("Please fill in all fields!");
            return;
        }

        try {
            const res = await axios.post('http://localhost:5000/api/auth/signup', {
                name, email, password, role: selectedRole
            });
            if (res.data.success) {
                alert("Account Created Successfully! Please Login.");
                setSearchParams({ view: 'login' });
            }
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.error || "Signup Failed");
        }
    };

    const handleLoginSubmit = async () => {
        if (!email || !password) {
            alert("Please enter email and password");
            return;
        }

        try {
            const res = await axios.post('http://localhost:5000/api/auth/login', {
                email, password
            });

            if (res.data.success) {
                const role = res.data.role; // 'Driver', 'Police', etc.

                // --- AUTO REDIRECT BASED ON ROLE ---
                if (role === 'Driver') {
                    // For Driver, we still need Ambulance/Hospital details
                    // So we go to the Driver Details form immediately
                    setSearchParams({ view: 'driver_details' });
                } else if (role === 'Police') {
                    navigate('/police');
                } else if (role === 'Hospital') {
                    navigate('/hospital');
                } else if (role === 'Admin') {
                    navigate('/admin');
                } else {
                    // Fallback
                    setSearchParams({ view: 'roles' });
                }
            }
        } catch (err) {
            console.error(err);
            alert("Invalid Credentials");
=======
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
>>>>>>> 427d256fcba396027a090d41b189024db37aadf9
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
<<<<<<< HEAD
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
=======
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
>>>>>>> 427d256fcba396027a090d41b189024db37aadf9
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
<<<<<<< HEAD
                                        className={`mini-role-btn ${selectedRole === 'Driver' ? 'selected' : ''}`}
                                        onClick={() => setSelectedRole('Driver')}
                                    >🚑 Driver</button>
                                    <button
                                        className={`mini-role-btn ${selectedRole === 'Police' ? 'selected' : ''}`}
                                        onClick={() => setSelectedRole('Police')}
                                    >👮 Police</button>
                                    <button
                                        className={`mini-role-btn ${selectedRole === 'Hospital' ? 'selected' : ''}`}
                                        onClick={() => setSelectedRole('Hospital')}
                                    >🏥 Hospital</button>
                                    <button
                                        className={`mini-role-btn ${selectedRole === 'Admin' ? 'selected' : ''}`}
                                        onClick={() => setSelectedRole('Admin')}
=======
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
>>>>>>> 427d256fcba396027a090d41b189024db37aadf9
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
