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
            <div className="min-h-screen bg-gameBg text-white font-sans selection:bg-gameAccent/30">
                <div className="max-w-md mx-auto w-full min-h-screen relative shadow-2xl bg-gameBg overflow-hidden border-x border-slate-800/50">
                    <Routes>
                        <Route path="/login" element={<Login />} />
                        <Route path="/admin" element={<Admin />} />

                        <Route path="/dashboard" element={
                            <PrivateRoute>
                                <Dashboard />
                            </PrivateRoute>
                        } />

                        <Route path="/market/:id" element={
                            <PrivateRoute>
                                <MarketBetting />
                            </PrivateRoute>
                        } />

                        <Route path="*" element={<Navigate to="/dashboard" />} />
                    </Routes>
                </div>
            </div>
        </Router>
    );
}

export default App;
