import React, { useState, useEffect } from 'react';
import axios from 'axios';
import MapComponent from './MapComponent';
import io from 'socket.io-client';

const PoliceDashboard = () => {
    const [signals, setSignals] = useState([]);
    const [vehicles, setVehicles] = useState([]);
    const [alert, setAlert] = useState(null);

    useEffect(() => {
        const socket = io('http://localhost:5000');

        socket.on('signals-update', setSignals);
        // Listen for ALL vehicles
        socket.on('vehicles-update', (vehs) => {
            const list = vehs || [];
            setVehicles(list);

            if (list.length > 0) {
                setAlert(`⚠️ ${list.length} Approaching Ambulance(s)!`);
            } else {
                setAlert(null);
            }
        });

        // Fallback or legacy single vehicle listener (optional, but 'vehicles-update' covers it)
        socket.on('vehicle-update', (v) => { /* already handled by array update usually, or ignored */ });

        axios.get('http://localhost:5000/api/signals').then(res => setSignals(res.data));

        return () => socket.disconnect();
    }, []);

    const toggleSignal = async (signalId, currentStatus) => {
        const newStatus = currentStatus === 'RED' ? 'GREEN' : 'RED';
        await axios.post('http://localhost:5000/api/police/status', {
            signalId,
            status: newStatus
        });
    };

    return (
        <div className="dashboard-container police-theme">
            <div className="control-panel">
                <h2>👮 Police Control</h2>
                {alert && <div className="police-alert blink">{alert}</div>}

                {/* Incoming Ambulances List */}
                <div className="ambulance-list" style={{ marginBottom: '20px', background: '#2d3436', padding: '15px', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #555', paddingBottom: '10px', marginBottom: '10px' }}>
                        <h3 style={{ margin: 0 }}>🚑 Incoming Ambulances</h3>
                        <button
                            onClick={() => {
                                if (window.confirm("Clear all active ambulances?")) {
                                    axios.post('http://localhost:5000/api/police/clear-vehicles');
                                }
                            }}
                            style={{ background: '#ff4757', border: 'none', padding: '5px 10px', color: 'white', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}
                        >
                            Clear List
                        </button>
                    </div>
                    {vehicles.length === 0 ? (
                        <p style={{ color: '#aaa', fontStyle: 'italic' }}>No active emergency vehicles.</p>
                    ) : (
                        vehicles.map((v, i) => (
                            <div key={v.id || i} style={{
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                padding: '10px', background: '#3b3b3b', marginBottom: '8px', borderRadius: '5px',
                                borderLeft: '4px solid #ff4757'
                            }}>
                                <div>
                                    <div style={{ fontWeight: 'bold', color: '#fff' }}>{v.id || 'Unknown ID'}</div>
                                    <div style={{ fontSize: '0.85rem', color: '#fab1a0' }}>
                                        Condition: {v.patientCondition || 'Unknown'}
                                    </div>
                                    <div style={{ fontSize: '0.85rem', color: '#ccc' }}>
                                        From: <span style={{ color: '#74b9ff' }}>{v.startLocationName || 'Unknown'}</span>
                                    </div>
                                    <div style={{ fontSize: '0.85rem', color: '#ccc' }}>Dest: {v.destinationName || 'Hospital'}</div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ color: '#fab1a0', fontWeight: 'bold' }}>{v.eta || '--'}</div>
                                    <div style={{ fontSize: '0.8rem', color: '#aaa' }}>{v.distance || ''}</div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="signal-list">
                    <h3>🚦 Junction Status</h3>
                    {signals.map(sig => (
                        <div key={sig.id} className="signal-item">
                            <span>{sig.name}</span>
                            <div className="status-toggle">
                                <span className={`status-dot ${sig.status.toLowerCase()}`}></span>
                                <button onClick={() => toggleSignal(sig.id, sig.status)}>
                                    Force {sig.status === 'RED' ? 'GREEN' : 'RED'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="map-view">
                <MapComponent signals={signals} vehicles={vehicles} />
            </div>
        </div>
    );
};

export default PoliceDashboard;
