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
    // vehicleId is kept constant for the session
    const [vehicleId] = useState(ambNumber || 'AMB-' + Math.floor(Math.random() * 1000));

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
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((position) => {
                setNavOrigin({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                });
            }, (err) => console.error("Location access denied or error:", err));
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
    }, []);

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
                // If it's a Google Place (custom added), we might not need to hit the backend /navigate 
                // if the backend expects specific IDs. 
                // But for now, we'll try sending it. If backend fails finding ID, we handle it.
                // Actually, backend looks up ID in its OWN list.
                // FIX: If it's a new place, we can't rely on backend ID lookup.
                // We should pass the LAT/LNG directly to backend or just use frontend state.

                // For this hybrid approach, let's just use the frontend state for the destination
                // and notify backend about the vehicle status.

                setNavigationActive(true);
                setNavOrigin({ lat: startLat, lng: startLng });
                setNavDestination({
                    lat: hospitalObj.lat,
                    lng: hospitalObj.lng,
                    name: hospitalObj.name
                });

                // Notify Backend (Optional - creating a new endpoint or reusing update)
                // For now, we just start the visual navigation
                alert(`Navigation Started to ${hospitalObj.name}`);

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

    return (
        <div className="dashboard-container">
            <div className="control-panel">
                <h2>🚑 Driver Console</h2>
                {!navigationActive && (
                    <div className="vehicle-id">ID: <strong>{vehicleId}</strong></div>
                )}

                {!navigationActive ? (
                    <div className="selection-box">
                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px' }}>Ambulance ID:</label>
                            <input
                                type="text"
                                className="dashboard-input" // Reusing or adding class
                                style={{
                                    width: '100%', padding: '10px', borderRadius: '8px',
                                    border: '1px solid #444', background: '#222', color: 'white', fontWeight: 'bold'
                                }}
                                value={vehicleId}
                                readOnly
                            />
                        </div>

                        {/* GOOGLE PLACES SEARCH */}
                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px' }}>🔎 Search Hospital:</label>
                            <Autocomplete
                                onLoad={ref => autocompleteRef.current = ref}
                                onPlaceChanged={onPlaceChanged}
                                fields={['place_id', 'geometry', 'name', 'formatted_address']}
                                options={{
                                    types: ['hospital', 'health', 'doctor'], // Restrict to relevant places
                                    componentRestrictions: { country: "in" } // Optional: restrict to India if needed
                                }}
                            >
                                <input
                                    type="text"
                                    placeholder="Type hospital name..."
                                    style={{
                                        width: '100%',
                                        padding: '10px',
                                        borderRadius: '8px',
                                        border: '1px solid #444',
                                        background: '#333',
                                        color: '#fff'
                                    }}
                                />
                            </Autocomplete>
                        </div>

                        <div style={{ marginBottom: '15px', textAlign: 'center', opacity: 0.7 }}>
                            <span>- OR -</span>
                        </div>

                        <label style={{ display: 'block', marginBottom: '5px' }}>Select from List:</label>
                        <select
                            style={{
                                width: '100%', padding: '10px', marginBottom: '15px',
                                borderRadius: '8px', border: '1px solid #444', background: '#222', color: 'white', fontSize: '1rem'
                            }}
                            value={selectedHospital}
                            onChange={(e) => setSelectedHospital(e.target.value)}
                        >
                            <option value="">-- Select Hospital --</option>
                            {hospitals.map((h, i) => (
                                <option key={h.id || i} value={h.id}>
                                    🏥 {h.name}
                                </option>
                            ))}
                        </select>

                        <button className="nav-btn" onClick={startNavigation}>
                            START NAVIGATION ➡️
                        </button>
                    </div>
                ) : (
                    <div className="navigation-status">
                        <h3 className="blink">NAVIGATING...</h3>
                        <p>Destination: <strong>{hospitals.find(h => h.id === selectedHospital)?.name || "Unknown"}</strong></p>

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
                <MapComponent
                    manualLoad={true}
                    signals={signals}
                    vehicle={vehicle}
                    origin={navOrigin}
                    destination={navDestination}
                    onNavigationUpdate={handleNavigationUpdate}
                />
            </div>
        </div>
    );
};

export default DriverDashboard;
