import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './Login';
import DriverDashboard from './DriverDashboard';
import PoliceDashboard from './PoliceDashboard';
import HospitalDashboard from './HospitalDashboard';
import AdminDashboard from './AdminDashboard';
import './index.css';

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Login />} />
                <Route path="/driver" element={<DriverDashboard />} />
                <Route path="/police" element={<PoliceDashboard />} />
                <Route path="/hospital" element={<HospitalDashboard />} />
                <Route path="/admin" element={<AdminDashboard />} />
            </Routes>
        </Router>
    )
}

export default App;
