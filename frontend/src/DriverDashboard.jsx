import React, { useState, useEffect } from 'react';
import axios from 'axios';
import MapComponent from './MapComponent';
import io from 'socket.io-client';

import { useLocation } from 'react-router-dom';

// Component for Driver Flow
const DriverDashboard = () => {
    const location = useLocation();
    const { ambNumber, hospName } = location.state || {};

    const [hospitals, setHospitals] = useState([]);
    const [selectedHospital, setSelectedHospital] = useState(''); // Will be set from hospName
    const [navigationActive, setNavigationActive] = useState(false);
    const [route, setRoute] = useState(null); // Just for display
    const [vehicleId] = useState(ambNumber || 'AMB-' + Math.floor(Math.random() * 1000));

    // Map State
    const [signals, setSignals] = useState([]);
    const [vehicle, setVehicle] = useState(null);

    // Navigation State
    const [eta, setEta] = useState(null);
    const [nextTurn, setNextTurn] = useState('');
    const [navDestination, setNavDestination] = useState(null);
    const [navOrigin, setNavOrigin] = useState(null); // Dynamic Origin

    // Callbacks from Map
    const handleNavigationUpdate = (info) => {
        if (info.eta) setEta(info.eta);
        if (info.instruction) setNextTurn(info.instruction);
    };

    // Clean up manual interval if it exists (removing old logic)
    useEffect(() => {
        if (!navigationActive) {
            setEta(null);
            setNextTurn('');
            setNavDestination(null);
            setNavOrigin(null);
        }
    }, [navigationActive]);

    useEffect(() => {
        // Fetch Hospitals
        axios.get('http://localhost:5000/api/hospitals')
            .then(res => {
                setHospitals(res.data);
                // Auto-select if passed from previous page
                if (hospName) {
                    const found = res.data.find(h => h.name === hospName);
                    if (found) {
                        setSelectedHospital(found.id);
                    } else {
                        // Fallback if name doesn't match ID exactly or if it's just a string
                        // For now, we might just set it as the ID if we can't find it, or handle it.
                        // But let's assume the names match for this demo.
                        // If not found, we might want to just show the name.
                        // But startNavigation needs an ID.
                        // Let's assume for the demo the names in Login.jsx match the names in backend.
                        // Login.jsx has "Ramesh Hospitals, MG Road" etc.
                        // Backend likely has the same.
                        // If not, we might need to be careful.
                        // Let's try to find by partial match or just set it.
                        const fuzzyFound = res.data.find(h => h.name.includes(hospName) || hospName.includes(h.name));
                        if (fuzzyFound) setSelectedHospital(fuzzyFound.id);
                    }
                }
            });

        // Socket for Map Updates
        const socket = io('http://localhost:5000');
        socket.on('signals-update', setSignals);
        socket.on('vehicle-update', setVehicle);

        // Initial Signal Fetch
        axios.get('http://localhost:5000/api/signals').then(res => setSignals(res.data));

        return () => socket.disconnect();
    }, []);

    const startNavigation = async () => {
        if (!selectedHospital) return alert("Select a hospital first!");

        try {
            // Use dynamic start location if available, otherwise mock Agiripalli or Benz Circle
            // For now, we'll use Agiripalli as the "detected" location for this demo
            const startLat = 16.6547; // Agiripalli
            const startLng = 80.7950;

            const res = await axios.post('http://localhost:5000/api/driver/navigate', {
                vehicleId,
                destinationId: selectedHospital,
                startLat,
                startLng
            });

            if (res.data.success) {
                setNavigationActive(true);

                // Set Origin (Dynamic)
                setNavOrigin({ lat: startLat, lng: startLng });

                // Set Destination
                setNavDestination({
                    lat: res.data.hospital.lat || 16.5150,
                    lng: res.data.hospital.lng || 80.6300,
                    name: res.data.hospital.name
                });
                alert(`Navigation Started to ${res.data.hospital.name}`);
            }
        } catch (err) {
            console.error(err);
            alert("Failed to start navigation");
        }
    };

    return (
        <div className="dashboard-container">
            <div className="control-panel">
                <h2>🚑 Driver Console</h2>
                <div className="vehicle-id">ID: <strong>{vehicleId}</strong></div>

                {!navigationActive ? (
                    <div className="selection-box">
                        <label>Destination:</label>
                        <div className="selected-hospital-display">
                            🏥 {hospitals.find(h => h.id === selectedHospital)?.name || selectedHospital || "No Hospital Selected"}
                        </div>
                        <button className="nav-btn" onClick={startNavigation}>
                            START NAVIGATION ➡️
                        </button>
                    </div>
                ) : (
                    <div className="navigation-status">
                        <h3 className="blink">NAVIGATING...</h3>
                        <p>Destination: <strong>{hospitals.find(h => h.id === selectedHospital)?.name}</strong></p>

                        <div className="live-info">
                            <div className="info-card">
                                <span className="label">⏱️ ETA</span>
                                <span className="value">{eta || '--'}</span>
                            </div>
                            <div className="info-card">
                                <span className="label">🛣️ Distance</span>
                                <span className="value">4.2 km</span>
                            </div>
                        </div>

                        <div className="turn-instruction">
                            <h4>Current Direction:</h4>
                            <div className="instruction-box">
                                <span className="arrow">⬆️</span>
                                <span className="text">{nextTurn || 'Calculating route...'}</span>
                            </div>
                        </div>

                        <button className="stop-btn" onClick={() => setNavigationActive(false)}>
                            🛑 STOP NAVIGATION
                        </button>
                    </div>
                )}
            </div>

            <div className="map-view">
                <div className="map-view">
                    <MapComponent
                        signals={signals}
                        vehicle={vehicle}
                        origin={navOrigin}
                        destination={navDestination}
                        onNavigationUpdate={handleNavigationUpdate}
                    />
                </div>
            </div>
        </div>
    );
};

export default DriverDashboard;
