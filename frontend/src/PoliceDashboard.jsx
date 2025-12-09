import React, { useState, useEffect } from 'react';
import axios from 'axios';
import MapComponent from './MapComponent';
import io from 'socket.io-client';

const PoliceDashboard = () => {
    const [signals, setSignals] = useState([]);
    const [vehicle, setVehicle] = useState(null);
    const [alert, setAlert] = useState(null);

    useEffect(() => {
        const socket = io('http://localhost:5000');

        socket.on('signals-update', setSignals);
        socket.on('vehicle-update', (veh) => {
            setVehicle(veh);
            if (veh && veh.id) {
                setAlert(`⚠️ Emergency Vehicle ${veh.id} Approaching!`);
            } else {
                setAlert(null);
            }
        });

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
                {alert && <div className="police-alert">{alert}</div>}

                <div className="signal-list">
                    <h3>Junction Status</h3>
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
                <MapComponent signals={signals} vehicle={vehicle} />
            </div>
        </div>
    );
};

export default PoliceDashboard;
