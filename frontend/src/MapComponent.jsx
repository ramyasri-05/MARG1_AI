import React from 'react';
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';

const containerStyle = {
    width: '100%',
    height: '100%'
};

// Vijayawada Center
const center = {
    lat: 16.5062,
    lng: 80.6480
};

const MapComponent = ({ signals, vehicle }) => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
        return (
            <div style={{
                height: '100%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                background: '#eee',
                color: '#555',
                flexDirection: 'column'
            }}>
                <h3>⚠️ Map Unavailable</h3>
                <p>Google Maps API Key is missing in .env file</p>
                <small>Please add VITE_GOOGLE_MAPS_API_KEY to frontend/.env</small>
            </div>
        );
    }

    return (
        <LoadScript googleMapsApiKey={apiKey}>
            <GoogleMap
                mapContainerStyle={containerStyle}
                center={center}
                zoom={14}
            >
                {/* Traffic Signals */}
                {signals.map(sig => (
                    <Marker
                        key={sig.id}
                        position={{ lat: sig.lat, lng: sig.lng }}
                        icon={{
                            url: sig.status === 'RED'
                                ? 'http://maps.google.com/mapfiles/ms/icons/red-dot.png'
                                : 'http://maps.google.com/mapfiles/ms/icons/green-dot.png'
                        }}
                        title={sig.name}
                    />
                ))}

                {/* Emergency Vehicle */}
                {vehicle && (
                    <Marker
                        position={{ lat: vehicle.lat, lng: vehicle.lng }}
                        icon={{
                            url: 'http://maps.google.com/mapfiles/kml/shapes/ambulance.png',
                            scaledSize: new window.google.maps.Size(40, 40)
                        }}
                        title="Emergency Vehicle"
                        animation={window.google.maps.Animation.BOUNCE}
                    />
                )}
            </GoogleMap>
        </LoadScript>
    );
};

export default React.memo(MapComponent);
