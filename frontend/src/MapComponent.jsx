import React, { useState, useEffect, useRef } from 'react';
import { GoogleMap, LoadScript, Marker, DirectionsRenderer } from '@react-google-maps/api';

const containerStyle = {
    width: '100%',
    height: '100%'
};

// Vijayawada Center
const center = {
    lat: 16.5062,
    lng: 80.6480
};

const LIBRARIES = ['geometry'];

const MapComponent = ({ signals, vehicle: propVehicle, vehicles: propVehicles, origin, destination, onNavigationUpdate }) => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    const [directionsResponse, setDirectionsResponse] = useState(null);
    const [internalVehicle, setInternalVehicle] = useState(null);
    const mapRef = useRef(null);
    const animationRef = useRef(null);

    // Combine single vehicle prop (Driver Dashboard) and list (Hospital Dashboard)
    const allVehicles = propVehicles || [];
    if (internalVehicle) allVehicles.push(internalVehicle); // Prioritize internal animation state
    else if (propVehicle) allVehicles.push(propVehicle);

    useEffect(() => {
        if (destination && window.google) {
            const directionsService = new window.google.maps.DirectionsService();

            directionsService.route({
                origin: center, // Start at Benz Circle (Mock)
                destination: { lat: destination.lat, lng: destination.lng } || destination.name,
                travelMode: window.google.maps.TravelMode.DRIVING,
            }, (result, status) => {
                if (status === window.google.maps.DirectionsStatus.OK) {
                    setDirectionsResponse(result);

                    // Start Animation along the path
                    startAnimation(result.routes[0].overview_path);
                } else {
                    console.error(`error fetching directions ${result}`);
                }
            });
        } else {
            setDirectionsResponse(null);
            setInternalVehicle(null);
            if (animationRef.current) clearInterval(animationRef.current);
        }
    }, [destination]);

    const startAnimation = (path) => {
        if (animationRef.current) clearInterval(animationRef.current);

        let index = 0;
        const speed = 100; // ms per step (lower = faster/smoother if points are close)
        // Note: overview_path points can be far apart. For smooth animation we might need to interpolate.
        // For this demo, we'll just hop between points or use a simple interpolation if needed.
        // Let's just hop for now, but maybe slow it down.

        animationRef.current = setInterval(() => {
            if (index >= path.length) {
                index = 0; // Loop
            }

            const point = path[index];
            const nextPoint = path[index + 1] || path[0];

            // Calculate Heading
            const heading = window.google.maps.geometry.spherical.computeHeading(point, nextPoint);

            setInternalVehicle({
                lat: point.lat(),
                lng: point.lng(),
                heading: heading
            });

            // Update Dashboard Info (Mocking ETA based on remaining points)
            if (onNavigationUpdate && index % 10 === 0) {
                const remaining = path.length - index;
                onNavigationUpdate({
                    eta: `${Math.ceil(remaining / 10)} mins`,
                    instruction: `Moving towards ${destination.name || 'Destination'}`
                });
            }

            index++;
        }, 500);
    };

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
        <LoadScript googleMapsApiKey={apiKey} libraries={LIBRARIES}>
            <GoogleMap
                mapContainerStyle={containerStyle}
                center={center}
                zoom={14}
                onLoad={map => mapRef.current = map}
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

                {/* Real Route */}
                {directionsResponse && (
                    <DirectionsRenderer
                        directions={directionsResponse}
                        options={{
                            suppressMarkers: true, // We have our own vehicle marker
                            polylineOptions: {
                                strokeColor: "#00b894",
                                strokeWeight: 6,
                                strokeOpacity: 0.8
                            }
                        }}
                    />
                )}

                {/* Emergency Vehicles */}
                {allVehicles.map((v, i) => (
                    <Marker
                        key={v.id || i}
                        position={{ lat: v.lat, lng: v.lng }}
                        icon={{
                            path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                            scale: 6,
                            fillColor: "#ff0000",
                            fillOpacity: 1,
                            strokeWeight: 2,
                            strokeColor: "#ffffff",
                            rotation: v.heading || 0,
                        }}
                        title={`Ambulance ${v.id || ''}`}
                    />
                ))}
            </GoogleMap>
        </LoadScript>
    );
};

export default React.memo(MapComponent);
