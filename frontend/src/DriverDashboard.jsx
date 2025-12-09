import React, { useState, useEffect } from 'react';
import axios from 'axios';
import MapComponent from './MapComponent';
import io from 'socket.io-client';

// Component for Driver Flow
const DriverDashboard = () => {
    const [hospitals, setHospitals] = useState([]);
    const [selectedHospital, setSelectedHospital] = useState('');
    const [navigationActive, setNavigationActive] = useState(false);
    const [route, setRoute] = useState(null); // Just for display
    const [vehicleId] = useState('AMB-' + Math.floor(Math.random() * 1000));

    // Map State
    const [signals, setSignals] = useState([]);
    const [vehicle, setVehicle] = useState(null);

    useEffect(() => {
        // Fetch Hospitals
        axios.get('http://localhost:5000/api/hospitals')
            .then(res => setHospitals(res.data));

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
            const startLat = 16.5062; // Mock Start (Benz Circle)
            const startLng = 80.6480;

            const res = await axios.post('http://localhost:5000/api/driver/navigate', {
                vehicleId,
                destinationId: selectedHospital,
                startLat,
                startLng
            });

            if (res.data.success) {
                setNavigationActive(true);
                setRoute(res.data.route);
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
                        <label>Select Destination:</label>
                        <select
                            value={selectedHospital}
                            onChange={(e) => setSelectedHospital(e.target.value)}
                            className="hospital-select"
                        >
                            <option value="">-- Choose Hospital --</option>
                            {hospitals.map(h => (
                                <option key={h.id} value={h.id}>{h.name}</option>
                            ))}
                        </select>
                        <button className="nav-btn" onClick={startNavigation}>
                            START NAVIGATION ➡️
                        </button>
                    </div>
                ) : (
                    <div className="navigation-status">
                        <h3 className="blink">NAVIGATING...</h3>
                        <p>Destination: <strong>{hospitals.find(h => h.id === selectedHospital)?.name}</strong></p>
                        <div className="turn-instruction">
                            ⬆️ <strong>Go Straight</strong> on MG Road
                        </div>
                    </div>
                )}
            </div>

            <div className="map-view">
                <MapComponent signals={signals} vehicle={vehicle} />
            </div>
        </div>
    );
};

export default DriverDashboard;
