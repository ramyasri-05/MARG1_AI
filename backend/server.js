const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // Allow all origins for dev
        methods: ["GET", "POST"]
    }
});

// --- VIJAYAWADA MOCK DATA ---

// Traffic Signals (Key Junctions)
const trafficSignals = [
    { id: 'SIG-BENZ', name: 'Benz Circle', lat: 16.5062, lng: 80.6480, status: 'RED' },
    { id: 'SIG-NTR', name: 'NTR Circle', lat: 16.5150, lng: 80.6300, status: 'RED' },
    { id: 'SIG-RAGHU', name: 'Raghu Gardens Junction', lat: 16.4980, lng: 80.6550, status: 'RED' },
    { id: 'SIG-CONTROL', name: 'Police Control Room', lat: 16.5080, lng: 80.6150, status: 'RED' }
];

// Hospitals
const hospitals = [
    { id: 'HOSP-RAMESH', name: 'Ramesh Hospitals', lat: 16.5020, lng: 80.6400, address: 'MG Road, Vijayawada' },
    { id: 'HOSP-MANIPAL', name: 'Manipal Hospital', lat: 16.4780, lng: 80.6200, address: 'Tadepalli, Vijayawada' },
    { id: 'HOSP-GOVT', name: 'Government General Hospital', lat: 16.5100, lng: 80.6180, address: 'Hanumanpet, Vijayawada' }
];

// Active Emergency Vehicle State
let emergencyVehicle = {
    id: null,
    lat: null,
    lng: null,
    destinationId: null,
    route: [] // List of coordinates simulating the path
};

// Helper: Calculate distance between two coords (Haversine)
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
    var R = 6371; // Radius of the earth in km
    var dLat = deg2rad(lat2 - lat1);
    var dLon = deg2rad(lon2 - lon1);
    var a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c; // Distance in km
    return d;
}

function deg2rad(deg) {
    return deg * (Math.PI / 180)
}

// --- API ENDPOINTS ---

// Get Static Data
app.get('/api/signals', (req, res) => {
    res.json(trafficSignals);
});

app.get('/api/hospitals', (req, res) => {
    res.json(hospitals);
});

// DRIVER: Start Navigation
app.post('/api/driver/navigate', (req, res) => {
    const { vehicleId, destinationId, startLat, startLng } = req.body;

    // Find Destination Hospital
    const hospital = hospitals.find(h => h.id === destinationId);
    if (!hospital) return res.status(404).json({ error: "Hospital not found" });

    // Mock Route Generation (Simple straight line points for now, or just return dest)
    // In a real app, we'd use Google Maps Directions API here.
    const route = [
        { lat: startLat, lng: startLng },
        { lat: (startLat + hospital.lat) / 2, lng: (startLng + hospital.lng) / 2 }, // Midpoint
        { lat: hospital.lat, lng: hospital.lng }
    ];

    emergencyVehicle = {
        id: vehicleId,
        lat: startLat,
        lng: startLng,
        destinationId: destinationId,
        route: route
    };

    console.log(`[DRIVER] Vehicle ${vehicleId} started navigation to ${hospital.name}`);
    io.emit('vehicle-update', emergencyVehicle);
    res.json({ success: true, route, hospital });
});

// POLICE: Get Signal Status
app.post('/api/police/status', (req, res) => {
    // In future, Police can manually override here
    const { signalId, status } = req.body;
    const signal = trafficSignals.find(s => s.id === signalId);
    if (signal && status) {
        signal.status = status;
        io.emit('signals-update', trafficSignals);
        console.log(`[POLICE] Manual Override: ${signal.name} -> ${status}`);
    }
    res.json(trafficSignals);
});

// SYSTEM: Periodic/Live Location Update (from AI or App)
app.post('/api/vehicle/update', (req, res) => {
    const { id, lat, lng } = req.body;

    if (emergencyVehicle.id === id) {
        emergencyVehicle.lat = lat;
        emergencyVehicle.lng = lng;
    } else {
        // New vehicle or untracked
        emergencyVehicle = { id, lat, lng, destinationId: null, route: [] };
    }

    console.log(`[GPS] Vehicle ${id} at [${lat}, ${lng}]`);

    // Logic to turn signals GREEN if nearby (< 500m)
    let triggeredSignal = null;
    trafficSignals.forEach(signal => {
        const dist = getDistanceFromLatLonInKm(lat, lng, signal.lat, signal.lng);
        if (dist < 0.5) { // 500 meters
            if (signal.status !== 'GREEN') {
                signal.status = 'GREEN';
                triggeredSignal = signal.id;
                console.log(`[SYSTEM] Triggering GREEN Wave at ${signal.name}`);
            }
        } else {
            // Reset to RED if far away (simplified logic)
            if (signal.status === 'GREEN' && dist > 1.0) {
                signal.status = 'RED';
            }
        }
    });

    // Emit updates to frontend
    io.emit('vehicle-update', emergencyVehicle);
    io.emit('signals-update', trafficSignals);

    res.json({ success: true, triggeredSignal });
});

io.on('connection', (socket) => {
    console.log('Client connected');
    // Send initial state
    socket.emit('signals-update', trafficSignals);
    if (emergencyVehicle.id) socket.emit('vehicle-update', emergencyVehicle);

    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`MARG-AI Server running on port ${PORT}`);
});
