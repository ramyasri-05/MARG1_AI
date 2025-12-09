import React, { useState, useEffect } from 'react';
import axios from 'axios';
import MapComponent from './MapComponent';
import io from 'socket.io-client';

import { useLocation } from 'react-router-dom';

const fallbackHospitals = [
    { id: 'HOSP-RAMESH', name: 'Ramesh Hospitals', lat: 16.5020, lng: 80.6400, address: 'MG Road, Vijayawada' },
    { id: 'HOSP-MANIPAL', name: 'Manipal Hospital', lat: 16.4780, lng: 80.6200, address: 'Tadepalli, Vijayawada' },
    { id: 'HOSP-GOVT', name: 'Government General Hospital', lat: 16.5100, lng: 80.6180, address: 'Hanumanpet, Vijayawada' }
];

// Component for Driver Flow
const DriverDashboard = () => {
    const location = useLocation();
    const { ambNumber, hospName } = location.state || {};

    const [hospitals, setHospitals] = useState(fallbackHospitals);
    // Initialize directly so it shows up immediately, even before API loads
    const [selectedHospital, setSelectedHospital] = useState(hospName || '');
    const [navigationActive, setNavigationActive] = useState(false);
    const [route, setRoute] = useState(null); // Just for display
    const [vehicleId] = useState(ambNumber || 'AMB-' + Math.floor(Math.random() * 1000));

    // Map State
    const [signals, setSignals] = useState([]);
    const [vehicle, setVehicle] = useState(null);

    // Navigation State
    const [eta, setEta] = useState(null);
    const [speed, setSpeed] = useState(0);
    const [distance, setDistance] = useState(null);
    const [nextTurn, setNextTurn] = useState('');
    const [navDestination, setNavDestination] = useState(null);
    const [navOrigin, setNavOrigin] = useState(null); // Dynamic Origin

    // Callbacks from Map
    const handleNavigationUpdate = (info) => {
        if (info.eta) setEta(info.eta);
        if (info.speed) setSpeed(info.speed);
        if (info.distance) setDistance(info.distance);
        if (info.instruction) setNextTurn(info.instruction);
    };

    // Sync Live Data to Server for Hospital View
    useEffect(() => {
        if (navigationActive && vehicleId && navOrigin) {
            // We use a debounce or interval to avoid flooding, but here we just send on change
            // For smoother updates, relies on map update rate

            // Derive a simple "Readable Location" based on progress or signal proximity
            // For now, simpler: Just send the data loop
            const payload = {
                id: vehicleId,
                lat: vehicle?.lat || navOrigin.lat, // Use current vehicle pos (from internal map vehicle state if available? No, MapComponent has internal state)
                // Wait, DriverDashboard doesn't know internal map vehicle pos unless MapComponent passes it back!
                // MapComponent passes 'info', but likely not lat/lng.
                // We need MapComponent to pass back lat/lng in onNavigationUpdate.
                // assuming it does or we add it. 
                // Let's assume MapComponent passes lat/lng too.
                eta,
                speed,
                distance,
                mode: 'emergency'
            };

            // We need lat/lng to be sent too. 
            // I'll update MapComponent to include lat/lng in the update info first.
        }
    }, [eta, speed, distance, navigationActive]);

    // Clean up
    useEffect(() => {
        if (!navigationActive) {
            setEta(null);
            setSpeed(0);
            setDistance(null);
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
                    const normalizedInput = hospName.trim().toLowerCase();
                    const found = res.data.find(h => h.name.trim().toLowerCase() === normalizedInput);

                    if (found) {
                        setSelectedHospital(found.id);
                    } else {
                        // Fuzzy search
                        const fuzzy = res.data.find(h => h.name.toLowerCase().includes(normalizedInput));
                        if (fuzzy) {
                            setSelectedHospital(fuzzy.id);
                        } else {
                            // Fallback: Display name directly
                            setSelectedHospital(hospName);
                        }
                    }
                }
            })
            .catch(err => console.error("Error fetching hospitals:", err));

        // Socket for Map Updates
        const socket = io('http://localhost:5000');
        socket.on('signals-update', setSignals);
        socket.on('vehicle-update', setVehicle);

        // Initial Signal Fetch
        axios.get('http://localhost:5000/api/signals').then(res => setSignals(res.data));

        return () => socket.disconnect();
    }, []);

    const startNavigation = async () => {
        let destId = selectedHospital;

        // If selectedHospital is just a name (not an ID like HOSP-...), try to resolve it
        if (selectedHospital && !selectedHospital.toString().startsWith('HOSP-')) {
            const match = hospitals.find(h => h.name === selectedHospital || h.name.toLowerCase() === selectedHospital.toLowerCase());
            if (match) destId = match.id;
            else {
                alert(`Could not verify hospital ID for "${selectedHospital}". Please re-select.`);
                return;
            }
        }

        if (!destId) return alert("Select a hospital first!");

        if (!navigator.geolocation) {
            // ... (rest of logic same)
            alert("Geolocation is not supported by your browser");
            return;
        }

        // Get Real Current Location
        navigator.geolocation.getCurrentPosition(async (position) => {
            const startLat = position.coords.latitude;
            const startLng = position.coords.longitude;

            try {
                const res = await axios.post('http://localhost:5000/api/driver/navigate', {
                    vehicleId,
                    destinationId: destId,
                    startLat,
                    startLng
                });

                if (res.data.success) {
                    setNavigationActive(true);

                    // Set Origin (Real GPS)
                    setNavOrigin({ lat: startLat, lng: startLng });

                    // Set Destination
                    setNavDestination({
                        lat: res.data.hospital.lat || 16.5150,
                        lng: res.data.hospital.lng || 80.6300,
                        name: res.data.hospital.name
                    });
                    alert(`Navigation Started to ${res.data.hospital.name} from Current Location`);
                }
            } catch (err) {
                console.error(err);
                alert("Failed to start navigation");
            }
        }, (error) => {
            console.error(error);
            alert("Unable to retrieve your location. Please allow location access.");
        }, { enableHighAccuracy: true });
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
                                <span className="label">⚡ Speed</span>
                                <span className="value">{speed || '0'} km/h</span>
                            </div>
                            <div className="info-card">
                                <span className="label">🛣️ Distance</span>
                                <span className="value">{distance || '--'}</span>
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
