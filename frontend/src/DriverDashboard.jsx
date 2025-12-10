import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import MapComponent from './MapComponent';
import io from 'socket.io-client';
import { useLocation } from 'react-router-dom';
import { useJsApiLoader, Autocomplete } from '@react-google-maps/api';

const libraries = ['places', 'geometry'];

const fallbackHospitals = [
    { id: 'HOSP-RAMESH', name: 'Ramesh Hospitals', lat: 16.5020, lng: 80.6400, address: 'MG Road, Vijayawada' },
    { id: 'HOSP-MANIPAL', name: 'Manipal Hospital', lat: 16.4780, lng: 80.6200, address: 'Tadepalli, Vijayawada' },
    { id: 'HOSP-GOVT', name: 'Government General Hospital', lat: 16.5100, lng: 80.6180, address: 'Hanumanpet, Vijayawada' }
];

import './Driver.css'; // Add CSS import

// Component for Driver Flow
const DriverDashboard = () => {
    const location = useLocation();
    const { ambNumber, hospName } = location.state || {};

    // Google Maps Script Loader
    const { isLoaded, loadError } = useJsApiLoader({
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
        libraries: libraries
    });

    if (loadError) return <div className="error-screen">Error Loading Maps: {loadError.message}</div>;

    const [hospitals, setHospitals] = useState(fallbackHospitals);
    const [selectedHospital, setSelectedHospital] = useState(hospName || '');
    const [navigationActive, setNavigationActive] = useState(false);
    const [isGreenWave, setIsGreenWave] = useState(false);
    // vehicleId is kept constant for the session
    const [vehicleId] = useState(ambNumber || 'AMB-' + Math.floor(Math.random() * 1000));

    // Geolocation Display
    const [currentLocationText, setCurrentLocationText] = useState("Detecting Location...");

    // Map & Nav State
    const [signals, setSignals] = useState([]);
    const [vehicle, setVehicle] = useState(null);
    const [eta, setEta] = useState(null);
    const [speed, setSpeed] = useState(0);
    const [distance, setDistance] = useState(null);
    const [nextTurn, setNextTurn] = useState('');
    const [navDestination, setNavDestination] = useState(null);
    const [navOrigin, setNavOrigin] = useState(null);

    // Autocomplete Reference
    const autocompleteRef = useRef(null);

    // Callbacks from Map
    const handleNavigationUpdate = (info) => {
        if (info.eta) setEta(info.eta);
        if (info.speed) setSpeed(info.speed);
        if (info.distance) setDistance(info.distance);
        if (info.instruction) setNextTurn(info.instruction);
    };

    // Sync Live Data
    useEffect(() => {
        if (navigationActive && vehicleId && navOrigin) {
            // In a real app, this would emit socket events with location
        }
    }, [eta, speed, distance, navigationActive]);

    // Clean up nav state
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

    // Initial Data Fetch
    useEffect(() => {
        // Get Initial Location
        if (navigator.geolocation && isLoaded) {
            navigator.geolocation.getCurrentPosition((position) => {
                const { latitude, longitude } = position.coords;
                setNavOrigin({ lat: latitude, lng: longitude });

                // Reverse Geocode to get City Name
                const geocoder = new window.google.maps.Geocoder();
                geocoder.geocode({ location: { lat: latitude, lng: longitude } }, (results, status) => {
                    if (status === "OK" && results[0]) {
                        // Extract City or Locality
                        const cityObj = results[0].address_components.find(c => c.types.includes("locality"));
                        const areaObj = results[0].address_components.find(c => c.types.includes("sublocality"));

                        const cityName = cityObj ? cityObj.long_name : "";
                        const areaName = areaObj ? areaObj.long_name : "";

                        const display = [areaName, cityName].filter(Boolean).join(", ");
                        setCurrentLocationText(display || results[0].formatted_address);
                    } else {
                        setCurrentLocationText(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
                    }
                });

            }, (err) => {
                console.error("Location access denied or error:", err);
                setCurrentLocationText("Location Access Denied");
            });
        }

        // Fetch Hospitals
        axios.get('http://localhost:5000/api/hospitals')
            .then(res => {
                setHospitals(res.data);
                if (hospName) {
                    const normalizedInput = hospName.trim().toLowerCase();
                    const found = res.data.find(h => h.name.trim().toLowerCase() === normalizedInput);
                    if (found) setSelectedHospital(found.id);
                    else setSelectedHospital(hospName);
                }
            })
            .catch(err => console.error("Error fetching hospitals:", err));

        // Socket for Map Updates
        const socket = io('http://localhost:5000');
        socket.on('signals-update', setSignals);
        socket.on('vehicle-update', setVehicle);

        axios.get('http://localhost:5000/api/signals').then(res => setSignals(res.data));

        return () => socket.disconnect();
    }, [isLoaded]);

    // Effect: Update Map Destination Preview when selection changes
    useEffect(() => {
        if (!selectedHospital) return;

        const hospitalObj = hospitals.find(h => h.id === selectedHospital);
        if (hospitalObj) {
            setNavDestination({
                lat: hospitalObj.lat,
                lng: hospitalObj.lng,
                name: hospitalObj.name
            });
        }
    }, [selectedHospital, hospitals]);

    // Handle Google Places Autocomplete Selection
    const onPlaceChanged = () => {
        if (autocompleteRef.current !== null) {
            const place = autocompleteRef.current.getPlace();

            if (!place.geometry || !place.geometry.location) {
                console.log("Returned place contains no geometry");
                return;
            }

            const newHospital = {
                id: place.place_id,
                name: place.name,
                lat: place.geometry.location.lat(),
                lng: place.geometry.location.lng(),
                address: place.formatted_address
            };

            // Add to list and select it
            setHospitals(prev => {
                // Avoid duplicates
                if (prev.find(h => h.id === newHospital.id)) return prev;
                return [...prev, newHospital];
            });
            setSelectedHospital(newHospital.id);
        }
    };

    const startNavigation = async () => {
        let destId = selectedHospital;

        // Find the selected hospital object
        const hospitalObj = hospitals.find(h => h.id === destId);

        if (!hospitalObj) return alert("Select a hospital first!");

        if (!navigator.geolocation) {
            alert("Geolocation is not supported by your browser");
            return;
        }

        // Get Real Current Location
        navigator.geolocation.getCurrentPosition(async (position) => {
            const startLat = position.coords.latitude;
            const startLng = position.coords.longitude;

            try {
                setNavigationActive(true);
                setNavOrigin({ lat: startLat, lng: startLng });
                setNavDestination({
                    lat: hospitalObj.lat,
                    lng: hospitalObj.lng,
                    name: hospitalObj.name
                });

                // Send Start Navigation Request to Backend with Metadata
                await axios.post('http://localhost:5000/api/driver/navigate', {
                    vehicleId,
                    destinationId: destId,
                    startLat,
                    startLng,
                    startLocationName: currentLocationText.replace('Detecting Location...', 'Unknown Location'), // Send specific start name
                    patientCondition: 'Critical (Cardiac Arrest)', // Mock condition for demo
                    destinationLat: hospitalObj.lat,
                    destinationLng: hospitalObj.lng,
                    destinationName: hospitalObj.name
                });

                // Simulate Traffic Clearing (Red -> Green)
                setIsGreenWave(false); // Start Red
                setTimeout(() => {
                    setIsGreenWave(true); // Turn Green
                    alert("🚦 GREEN WAVE ACTIVATED: Traffic Signals Cleared for Emergency Route!");
                }, 3000);

            } catch (err) {
                console.error(err);
                alert("Failed to start navigation");
            }
        }, (error) => {
            console.error(error);
            alert("Unable to retrieve your location. Please allow location access.");
        }, { enableHighAccuracy: true });
    };

    if (!isLoaded) return <div className="loading-screen">Loading Maps...</div>;

    // --- RENDER ---
    return (
        <React.Fragment>
            {/* STATE 1: SETUP CONSOLE (CENTERED) */}
            {!navigationActive ? (
                <div className="driver-setup-container">
                    <div className="setup-card">
                        <h2>🚑 Driver Dashboard</h2>

                        <div className="input-group">
                            <label>📍 Starting Location (Auto-Detected from Maps)</label>
                            <input
                                type="text"
                                className="setup-input"
                                value={currentLocationText}
                                readOnly
                                style={{ color: '#00cec9', fontWeight: 'bold' }}
                            />
                        </div>

                        <div className="input-group">
                            <label>🏥 Select Destination Hospital</label>
                            <select
                                className="setup-select"
                                value={selectedHospital}
                                onChange={(e) => setSelectedHospital(e.target.value)}
                            >
                                <option value="">-- Choose a Hospital --</option>
                                {hospitals.map((h, i) => (
                                    <option key={h.id || i} value={h.id}>
                                        {h.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <button className="big-emergency-btn" onClick={startNavigation}>
                            🚨 START EMERGENCY ROUTE 🚨
                        </button>
                    </div>
                </div>
            ) : (
                /* STATE 2: ACTIVE NAVIGATION (MAP VIEW) */
                <div className="dashboard-container full-map">
                    <div className="control-panel">
                        <h2>🚑 Driver Console</h2>
                        <div className="navigation-status" style={{ textAlign: 'center' }}>
                            {/* Status Header */}
                            <div style={{
                                background: isGreenWave ? 'rgba(46, 204, 113, 0.2)' : 'rgba(255, 71, 87, 0.2)',
                                padding: '10px', borderRadius: '10px', marginBottom: '20px',
                                border: `1px solid ${isGreenWave ? '#2ecc71' : '#ff4757'}`
                            }}>
                                <h3 className="blink" style={{ color: isGreenWave ? '#2ecc71' : '#ff4757', margin: 0 }}>
                                    {isGreenWave ? '🟢 GREEN CHANNEL ACTIVE' : '🔴 CLEARING TRAFFIC...'}
                                </h3>
                            </div>

                            {/* HUGE DIRECTION ARROW */}
                            <div className="direction-display" style={{ margin: '40px 0' }}>
                                <div style={{
                                    fontSize: '8rem',
                                    color: 'white',
                                    filter: 'drop-shadow(0 0 10px rgba(0,255,255,0.5))',
                                    animation: 'pulse 1.5s infinite'
                                }}>
                                    {nextTurn && nextTurn.toLowerCase().includes('left') ? '⬅️' :
                                        nextTurn && nextTurn.toLowerCase().includes('right') ? '➡️' :
                                            '⬆️'}
                                </div>
                                <p style={{ fontSize: '1.2rem', color: '#ccc', marginTop: '10px' }}>
                                    {nextTurn || 'Follow Route'}
                                </p>
                            </div>

                            {/* Minimal Stats */}
                            <div className="live-info" style={{ justifyContent: 'center', gap: '20px' }}>
                                <div className="info-card">
                                    <span className="label">ETA</span>
                                    <span className="value" style={{ fontSize: '1.5rem' }}>{eta || '--'}</span>
                                </div>
                                <div className="info-card">
                                    <span className="label">DIST</span>
                                    <span className="value" style={{ fontSize: '1.5rem' }}>{distance || '--'}</span>
                                </div>
                            </div>

                            <button className="stop-btn" onClick={() => setNavigationActive(false)} style={{ marginTop: '40px' }}>
                                🛑 STOP NAVIGATION
                            </button>
                        </div>
                    </div>

                    <div className="map-view">
                        <MapComponent
                            manualLoad={true}
                            signals={signals}
                            vehicle={vehicle}
                            origin={navOrigin}
                            destination={navDestination}
                            onNavigationUpdate={handleNavigationUpdate}
                            isGreenWave={isGreenWave}
                        />
                    </div>
                </div>
            )}
        </React.Fragment>
    );
};

export default DriverDashboard;
