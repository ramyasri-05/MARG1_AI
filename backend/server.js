require('dotenv').config();
const express = require('express');
const http = require('http');
const mongoose = require('mongoose'); // Add Mongoose
const { Server } = require('socket.io');
const cors = require('cors');


const app = express();
app.use(cors());
app.use(express.json());

// --- DATABASE CONNECTION ---
// User provided URI
// Load from .env
const MONGO_URI = process.env.MONGO_URI;

console.log("⏳ Attempting to connect to MongoDB...");
// Connection options
mongoose.connect(MONGO_URI)
    .then(() => console.log("✅ MongoDB Connected Successfully"))
    .catch(err => {
        console.error("❌ MongoDB Connection Error:", err.message);
        console.warn("⚠️ Running in Offline Fallback Mode");
    });

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// --- VIJAYAWADA MOCK DATA ---
const trafficSignals = [
    { id: 'sig1', name: 'Benz Circle', lat: 16.4971, lng: 80.6517, status: 'RED' },
    { id: 'sig2', name: 'Ramavarappadu Ring', lat: 16.5193, lng: 80.6625, status: 'RED' },
    { id: 'sig3', name: 'Control Room', lat: 16.5083, lng: 80.6139, status: 'RED' },
    { id: 'sig4', name: 'Putta Vantena', lat: 16.5100, lng: 80.6300, status: 'RED' }
];

const hospitals = [
    { id: 'hosp1', name: 'Manipal Hospital', lat: 16.4880, lng: 80.6090, address: 'Tadepalli' },
    { id: 'hosp2', name: 'Kamineni Hospitals', lat: 16.4714, lng: 80.7003, address: 'Kanuru' },
    { id: 'hosp3', name: 'Ramesh Hospital', lat: 16.5026, lng: 80.6482, address: 'MG Road' },
    { id: 'hosp4', name: 'Andhra Hospitals', lat: 16.4950, lng: 80.6450, address: 'Bhavanipuram' }
];

// --- MONGODB MODELS ---
const userSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, required: true, enum: ['driver', 'police', 'hospital', 'admin'] },
    ambulanceNumber: { type: String } // Optional, only for drivers
});

const User = mongoose.model('User', userSchema);

// --- STATE ---
let emergencyVehicles = []; // Support multiple vehicles

// --- AUTH ENDPOINTS ---

// Local Fallback Storage
const localUsers = [];

// AUTH: Signup
app.post('/api/auth/signup', async (req, res) => {
    const { fullName, email, password, role, ambulanceNumber } = req.body;
    if (!fullName || !email || !password || !role) {
        return res.status(400).json({ error: "All fields are required" });
    }

    try {
        // 1. Try MongoDB
        if (mongoose.connection.readyState === 1) {
            const existingUser = await User.findOne({ email });
            if (existingUser) return res.status(400).json({ error: "User already exists" });

            const newUser = new User({ fullName, email, password, role, ambulanceNumber });
            await newUser.save();

            console.log(`[AUTH-DB] New User Signed Up: ${email} (${role})`);
            return res.json({ success: true, message: "Account created successfully" });
        }
    } catch (err) {
        console.warn("⚠️ DB Error (Using Local Fallback):", err.message);
    }

    // 2. Local Fallback
    console.log(`[AUTH-LOCAL] Saving to local memory: ${email}`);
    const exists = localUsers.find(u => u.email === email);
    if (exists) return res.status(400).json({ error: "User already exists (Local)" });

    const newUser = { fullName, email, password, role, ambulanceNumber };
    localUsers.push(newUser);
    res.json({ success: true, message: "Account created successfully (Local)" });
});

// AUTH: Login
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // 1. Try MongoDB
        if (mongoose.connection.readyState === 1) {
            const user = await User.findOne({ email });

            if (user && user.password === password) {
                console.log(`[AUTH-DB] Login Success: ${email} -> ${user.role}`);
                return res.json({
                    success: true,
                    role: user.role,
                    name: user.fullName,
                    ambulanceNumber: user.ambulanceNumber
                });
            }
        }
    } catch (err) {
        console.warn("⚠️ DB Error (Using Local Fallback):", err.message);
    }

    // 2. Local Fallback
    const localUser = localUsers.find(u => u.email === email && u.password === password);
    if (localUser) {
        console.log(`[AUTH-LOCAL] Login Success: ${email}`);
        return res.json({
            success: true,
            role: localUser.role,
            name: localUser.fullName,
            ambulanceNumber: localUser.ambulanceNumber
        });
    }

    // Return error if neither worked
    res.status(401).json({ error: "Invalid credentials" });
});

// --- UTILITY FUNCTIONS ---
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
    var R = 6371; // Radius of the earth in km
    var dLat = deg2rad(lat2 - lat1);  // deg2rad below
    var dLon = deg2rad(lon2 - lon1);
    var a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2)
        ;
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
    const { vehicleId, destinationId, startLat, startLng, destinationName, destinationLat, destinationLng, startLocationName, patientCondition } = req.body;

    let hospital = hospitals.find(h => h.id === destinationId);

    // If not found in static list, check if dynamic data was passed
    if (!hospital) {
        if (destinationLat && destinationLng) {
            hospital = {
                id: destinationId,
                name: destinationName || "Unknown Hospital",
                lat: destinationLat,
                lng: destinationLng,
                address: "Custom Location"
            };
        } else {
            return res.status(404).json({ error: "Hospital not found" });
        }
    }

    // Mock Route Generation (Simple straight line points for now, or just return dest)
    const route = [
        { lat: startLat, lng: startLng },
        { lat: (startLat + hospital.lat) / 2, lng: (startLng + hospital.lng) / 2 }, // Midpoint
        { lat: hospital.lat, lng: hospital.lng }
    ];

    const newVehicle = {
        id: vehicleId,
        lat: startLat,
        lng: startLng,
        destinationId: destinationId,
        destinationName: hospital.name,
        startLocationName: startLocationName || "Unknown Location",
        patientCondition: patientCondition || "Stable",
        route: route,
        eta: 'Calculating...',
        speed: 0
    };

    // Update or Add
    const idx = emergencyVehicles.findIndex(v => v.id === vehicleId);
    if (idx >= 0) emergencyVehicles[idx] = newVehicle;
    else emergencyVehicles.push(newVehicle);

    console.log(`[DRIVER] Vehicle ${vehicleId} started navigation to ${hospital.name}`);

    io.emit('vehicle-update', newVehicle); // For the specific driver
    io.emit('vehicles-update', emergencyVehicles); // For Police/Map

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

// POLICE: Clear All Vehicles (Reset)
app.post('/api/police/clear-vehicles', (req, res) => {
    emergencyVehicles = [];
    console.log(`[POLICE] Cleared all emergency vehicles`);
    io.emit('vehicles-update', emergencyVehicles);
    res.json({ success: true });
});

// SYSTEM: Periodic/Live Location Update (from AI or App)
app.post('/api/vehicle/update', (req, res) => {
    const { id, lat, lng, eta, speed, distance, destinationId } = req.body;

    let vehicle = emergencyVehicles.find(v => v.id === id);

    if (vehicle) {
        vehicle.lat = lat;
        vehicle.lng = lng;
        if (eta) vehicle.eta = eta;
        if (speed) vehicle.speed = speed;
        if (distance) vehicle.distance = distance;
    } else {
        // New vehicle or untracked
        vehicle = { id, lat, lng, destinationId: destinationId || null, route: [], eta, speed, distance };
        emergencyVehicles.push(vehicle);
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
    io.emit('vehicle-update', emergencyVehicles.find(v => v.id === id)); // Update single vehicle
    io.emit('vehicles-update', emergencyVehicles); // Update all vehicles
    io.emit('signals-update', trafficSignals);

    res.json({ success: true, triggeredSignal });
});

io.on('connection', (socket) => {
    console.log('Client connected');
    // Send initial state
    socket.emit('signals-update', trafficSignals);
    socket.emit('vehicles-update', emergencyVehicles); // Send all currently active

    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`MARG-AI Server running on port ${PORT}`);
});
