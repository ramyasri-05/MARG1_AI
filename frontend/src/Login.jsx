import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import './Login.css';

const Login = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    // Derived state from URL params
    const view = searchParams.get('view'); // 'login', 'signup', 'roles', 'driver_details' or null

    const showRoles = !!view;
    const showLoginForm = view === 'login';
    const showSignupForm = view === 'signup';
    const showDriverForm = view === 'driver_details';

    const [ambNumber, setAmbNumber] = useState('');
    const [hospName, setHospName] = useState('');

    const vijayawadaHospitals = [
        "Select Hospital",
        "Ramesh Hospitals",
        "Manipal Hospital",
        "Government General Hospital"
    ];

    const handleDriverLogin = () => {
        if (!ambNumber || !hospName || hospName === "Select Hospital") {
            alert("Please enter Ambulance Number and Hospital Name!");
            return;
        }
        // Navigate to dashboard with state (optional) or just go
        navigate('/driver', { state: { ambNumber, hospName } });
    };

    const handleLoginClick = () => {
        setSearchParams({ view: 'login' });
    };

    const handleSignupClick = () => {
        setSearchParams({ view: 'signup' });
    };

    const handleSignupSubmit = () => {
        if (!hospName || hospName === "Select Hospital") {
            // Reuse hospName as 'selectedRole' for signup context
            alert("Please select a Role!");
            return;
        }
        // Save Mock User
        localStorage.setItem('margUserRole', hospName);
        // alert("Account Created Successfully! Please Login."); // Removed as per user request
        setSearchParams({ view: 'login' });
    };

    const handleLoginSubmit = () => {
        // Mock Validation
        // In a real app, we'd check credentials here.

        // Always go to Role Selection as per user request
        setSearchParams({ view: 'roles' });
    };

    return (
        <div className="login-container">
            <div className="login-overlay">
                {!showRoles && (
                    <div className="top-nav">
                        <button className="nav-btn" onClick={handleLoginClick}>Login</button>
                        <button className="nav-btn signup" onClick={handleSignupClick}>Sign Up</button>
                    </div>
                )}
                <div className={`login-card ${showRoles ? 'expanded' : 'transparent-card'}`}>
                    <div className="logo-section">
                        <h1>MARG-AI</h1>
                        <p className="caption">Intelligent Traffic Clearance System</p>
                        <p className="sub-caption">"Saving Lives, One Green Light at a Time"</p>
                    </div>

                    {!showRoles ? (
                        <>
                            {/* Empty State: Just Title and Layout */}
                        </>
                    ) : showDriverForm ? (
                        <div className="role-selection fade-in">
                            <h3>🚑 Ambulance Details</h3>
                            <div className="driver-form">
                                <input
                                    type="text"
                                    placeholder="Ambulance Number (e.g., AP16-1234)"
                                    className="login-input"
                                    value={ambNumber}
                                    onChange={(e) => setAmbNumber(e.target.value)}
                                />
                                <select
                                    className="login-input"
                                    value={hospName}
                                    onChange={(e) => setHospName(e.target.value)}
                                >
                                    {vijayawadaHospitals.map((hosp, index) => (
                                        <option key={index} value={hosp === "Select Hospital" ? "" : hosp} style={{ color: 'black' }}>
                                            {hosp}
                                        </option>
                                    ))}
                                </select>
                                <button className="role-btn driver" onClick={handleDriverLogin}>
                                    Submit & Start 🚀
                                </button>
                            </div>
                            <button className="back-btn" onClick={() => setSearchParams({ view: 'roles' })}>⬅ Back</button>
                        </div>
                    ) : showLoginForm ? (
                        <div className="role-selection fade-in">
                            <h3>👋 Welcome Back</h3>
                            <div className="driver-form">
                                <input
                                    type="email"
                                    placeholder="Email Address"
                                    className="login-input"
                                />
                                <input
                                    type="password"
                                    placeholder="Password"
                                    className="login-input"
                                />
                                <button className="role-btn login-submit-btn" onClick={handleLoginSubmit}>
                                    Login
                                </button>

                                <div className="divider">
                                    <span>OR</span>
                                </div>

                                <button className="google-btn" onClick={() => {
                                    alert("🔵 Mock Google Login\n\nSimulating authentication with Google...");
                                    localStorage.setItem('margUserRole', 'driver'); // Defaulting to Driver for demo
                                    setTimeout(() => {
                                        alert("Login Successful! Please select your role.");
                                        setSearchParams({ view: 'roles' });
                                    }, 1000);
                                }}>
                                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" width="20" />
                                    <span>Continue with Google</span>
                                </button>
                            </div>


                            <p className="signup-link">
                                Don't have an account? <span onClick={() => setSearchParams({ view: 'signup' })}>Sign Up</span>
                            </p>
                        </div>
                    ) : showSignupForm ? (
                        <div className="role-selection fade-in">
                            <h3>🚀 Create Account</h3>
                            <div className="driver-form">
                                <input type="text" placeholder="Full Name" className="login-input" />
                                <input type="email" placeholder="Email Address" className="login-input" />
                                <input type="password" placeholder="Password" className="login-input" />

                                {/* Replaced Dropdown with Selection Grid */}
                                <div className="role-grid-input">
                                    <button
                                        className={`mini-role-btn ${hospName === 'driver' ? 'selected' : ''}`}
                                        onClick={() => setHospName('driver')}
                                    >🚑 Driver</button>
                                    <button
                                        className={`mini-role-btn ${hospName === 'police' ? 'selected' : ''}`}
                                        onClick={() => setHospName('police')}
                                    >👮 Police</button>
                                    <button
                                        className={`mini-role-btn ${hospName === 'hospital' ? 'selected' : ''}`}
                                        onClick={() => setHospName('hospital')}
                                    >🏥 Hospital</button>
                                    <button
                                        className={`mini-role-btn ${hospName === 'admin' ? 'selected' : ''}`}
                                        onClick={() => setHospName('admin')}
                                    >🛡️ Admin</button>
                                </div>

                                <button className="role-btn login-submit-btn" onClick={handleSignupSubmit}>
                                    Sign Up
                                </button>
                            </div>
                            <p className="signup-link">
                                Already have an account? <span onClick={() => setSearchParams({ view: 'login' })}>Login</span>
                            </p>
                        </div>
                    ) : (
                        <div className="role-selection fade-in">
                            <h3>Select Your Role</h3>
                            <div className="role-buttons">
                                <button className="role-btn driver" onClick={() => setSearchParams({ view: 'driver_details' })}>
                                    <span className="icon">🚑</span>
                                    <span className="text">Driver</span>
                                </button>
                                <button className="role-btn police" onClick={() => navigate('/police')}>
                                    <span className="icon">👮</span>
                                    <span className="text">Traffic Police</span>
                                </button>
                                <button className="role-btn hospital" onClick={() => navigate('/hospital')}>
                                    <span className="icon">🏥</span>
                                    <span className="text">Hospital Staff</span>
                                </button>
                                <button className="role-btn admin" onClick={() => navigate('/admin')}>
                                    <span className="icon">🛡️</span>
                                    <span className="text">System Admin</span>
                                </button>
                            </div>
                            <button className="back-btn" onClick={() => setSearchParams({})}>⬅ Back</button>
                        </div>
                    )}

                    <div className="footer-links"></div>
                </div>
            </div>
        </div >
    );
};

export default Login;
