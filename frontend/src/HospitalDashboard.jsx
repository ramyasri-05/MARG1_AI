import React, { useState, useEffect } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import MapComponent from './MapComponent';

const HospitalDashboard = () => {
    const [signals, setSignals] = useState([]);
    const [vehicles, setVehicles] = useState([]);

    // For demo, we act as "Ramesh Hospitals" (HOSP-RAMESH)
    // In real app, this would come from login context
    const myHospitalId = 'HOSP-RAMESH';

    useEffect(() => {
        // Fetch static data
        axios.get('http://localhost:5000/api/signals').then(res => setSignals(res.data));

        // Connect Socket
        const socket = io('http://localhost:5000');

        socket.on('signals-update', (updatedSignals) => setSignals(updatedSignals));

        socket.on('vehicle-update', (vehicle) => {
            // Update the specific vehicle in our list
            setVehicles(prev => {
                // If exists, update
                const exists = prev.find(v => v.id === vehicle.id);
                if (exists) {
                    return prev.map(v => v.id === vehicle.id ? vehicle : v);
                }
                // Else add new (only if it has valid location)
                if (vehicle.lat && vehicle.lng) {
                    return [...prev, vehicle];
                }
                return prev;
            });
        });

        return () => socket.disconnect();
    }, []);

    // Build a readable location string based on proximity to signals
    const getReadableLocation = (vehicle, allSignals) => {
        if (!allSignals.length) return "En Route";
        // Simple distance check
        let closest = null;
        let minDist = Infinity;

        allSignals.forEach(sig => {
            const d = Math.sqrt(Math.pow(sig.lat - vehicle.lat, 2) + Math.pow(sig.lng - vehicle.lng, 2));
            if (d < minDist) {
                minDist = d;
                closest = sig;
            }
        });

        // Approx 0.01 deg is roughly 1km. 0.005 ~ 500m
        if (minDist < 0.008) return `Near ${closest.name}`;
        return "En Route to " + closest.name;
    };

    // Filter for THIS hospital
    const incomingVehicles = vehicles.filter(v => v.destinationId === myHospitalId);

    return (
        <div style={{ display: 'flex', height: '100vh', background: '#e0e0e0' }}>
            {/* Left Panel: Incoming List */}
            <div style={{
                width: '350px',
                background: '#fff',
                padding: '20px',
                boxShadow: '2px 0 10px rgba(0,0,0,0.1)',
                overflowY: 'auto'
            }}>
                <div style={{ marginBottom: '20px', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
                    <h2 style={{ margin: 0, color: '#2c3e50' }}>🏥 Hospital Panel</h2>
                    <p style={{ margin: '5px 0', color: '#7f8c8d' }}>Ramesh Hospitals, MG Road</p>
                </div>

                <h3 style={{ color: '#e74c3c' }}>🚑 Incoming Alerts ({incomingVehicles.length})</h3>

                {incomingVehicles.length === 0 ? (
                    <p style={{ color: '#95a5a6', fontStyle: 'italic', marginTop: '20px' }}>
                        No emergency vehicles currently approaching.
                    </p>
                ) : (
                    <div className="vehicle-list">
                        {incomingVehicles.map(v => (
                            <div key={v.id} style={{
                                background: '#fff0f0',
                                borderLeft: '5px solid #e74c3c',
                                padding: '15px',
                                marginBottom: '15px',
                                borderRadius: '4px',
                                boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                    <strong style={{ fontSize: '1.1em' }}>{v.id}</strong>
                                    <span style={{
                                        background: '#e74c3c',
                                        color: 'white',
                                        padding: '2px 8px',
                                        borderRadius: '10px',
                                        fontSize: '0.8em'
                                    }}>CRITICAL</span>
                                </div>
                                <div style={{ fontSize: '0.9em', color: '#555' }}>
                                    <p style={{ margin: '5px 0' }}>
                                        📍 Location: <strong>{getReadableLocation(v, signals)}</strong>
                                        <span style={{ fontSize: '0.8em', color: '#999' }}> ({v.lat.toFixed(4)}, {v.lng.toFixed(4)})</span>
                                    </p>
                                    <p style={{ margin: '5px 0' }}>
                                        ⏱️ ETA: <strong>{v.eta || 'Calculating...'}</strong>
                                        <span style={{ marginLeft: '10px' }}>⚡ Speed: {v.speed || 0} km/h</span>
                                    </p>
                                    <p style={{ margin: '5px 0' }}>
                                        🛣️ Dist: <strong>{v.distance || '--'}</strong>
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Right Panel: Map */}
            <div style={{ flex: 1, position: 'relative' }}>
                <MapComponent
                    signals={signals}
                    vehicles={vehicles} // Pass ALL vehicles to map so they can see context
                />
            </div>
        </div>
    );
};

export default HospitalDashboard;
