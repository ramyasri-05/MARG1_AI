import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';

const Login = () => {
    const navigate = useNavigate();
    // Default to FALSE: Only Title shown initially.
    const [showRoles, setShowRoles] = useState(false);
    const [showLoginForm, setShowLoginForm] = useState(false);
    const [showSignupForm, setShowSignupForm] = useState(false);
    const [showDriverForm, setShowDriverForm] = useState(false);
    const [ambNumber, setAmbNumber] = useState('');
    const [hospName, setHospName] = useState('');

    const vijayawadaHospitals = [
        "Select Hospital",
        "Ramesh Hospitals, MG Road",
        "Manipal Hospital, Tadepalli",
        "Kamineni Hospitals, Poranki",
        "Andhra Hospitals, Bhavanipuram",
        "Aayush Hospitals, Ramavarappadu",
        "Sentini Hospitals, Ring Road",
        "Capital Hospitals, Benz Circle"
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
        // Show Login Form, Hide others
        setShowLoginForm(true);
        setShowSignupForm(false);
        setShowRoles(true); // Open the card
        setShowDriverForm(false);
    };

    const handleSignupClick = () => {
        setShowSignupForm(true);
        setShowLoginForm(false);
        setShowRoles(true);
        setShowDriverForm(false);
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
                            <button className="back-btn" onClick={() => setShowDriverForm(false)}>⬅ Back</button>
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
                                <button className="role-btn login-submit-btn" onClick={() => setShowLoginForm(false)}>
                                    Login
                                </button>

                                <div className="divider">
                                    <span>OR</span>
                                </div>

                                <button className="google-btn">
                                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" width="20" />
                                    <span>Continue with Google</span>
                                </button>
                            </div>


                            <p className="signup-link">
                                Don't have an account? <span onClick={() => { setShowLoginForm(false); setShowSignupForm(true); }}>Sign Up</span>
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

                                <button className="role-btn login-submit-btn" onClick={() => alert("Account Created! (Mock)")}>
                                    Sign Up
                                </button>
                            </div>
                            <p className="signup-link">
                                Already have an account? <span onClick={() => { setShowSignupForm(false); setShowLoginForm(true); }}>Login</span>
                            </p>
                        </div>
                    ) : (
                        <div className="role-selection fade-in">
                            <h3>Select Your Role</h3>
                            <div className="role-buttons">
                                <button className="role-btn driver" onClick={() => setShowDriverForm(true)}>
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
                            <button className="back-btn" onClick={() => setShowRoles(false)}>⬅ Back</button>
                        </div>
                    )}

                    <div className="footer-links"></div>
                </div>
            </div>
        </div >
    );
};

export default Login;
