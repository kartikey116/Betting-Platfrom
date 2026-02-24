import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import MarketBetting from './pages/MarketBetting';
import Admin from './pages/Admin';

const PrivateRoute = ({ children }) => {
    const token = localStorage.getItem('token');
    return token ? children : <Navigate to="/login" />;
};

function App() {
    return (
        <Router>
            <div className="min-h-screen w-full text-white font-sans selection:bg-[#ff003c]/30 flex justify-center bg-[#050505]">
                <Routes>
                    <Route path="/" element={<div className="w-full bg-[#0A111F] min-h-screen relative"><Login /></div>} />
                    <Route path="/admin" element={<div className="w-full relative min-h-screen bg-[#0A0A0A]"><Admin /></div>} />

                    <Route path="/dashboard" element={
                        <PrivateRoute>
                            <div className="w-full bg-[#0A111F] min-h-screen relative">
                                <Dashboard />
                            </div>
                        </PrivateRoute>
                    } />

                    <Route path="/market/:id" element={
                        <PrivateRoute>
                            <div className="w-full bg-[#0A111F] min-h-screen relative">
                                <MarketBetting />
                            </div>
                        </PrivateRoute>
                    } />

                    <Route path="*" element={<Navigate to="/dashboard" />} />
                </Routes>
            </div>
        </Router>
    );
}

export default App;
