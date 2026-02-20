import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { LogOut, ChevronRight, Activity, Clock } from 'lucide-react';
import Wallet from '../components/Wallet';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function Dashboard() {
    const [markets, setMarkets] = useState([]);
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || {});
    const navigate = useNavigate();

    useEffect(() => {
        fetchMarkets();
        const interval = setInterval(fetchMarkets, 10000); // refresh every 10s
        return () => clearInterval(interval);
    }, []);

    const fetchMarkets = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_URL}/markets`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMarkets(res.data);
        } catch (error) {
            if (error.response?.status === 401) {
                navigate('/login');
            }
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    const formatTime = (seconds) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h.toString().padStart(2, '0')}h ${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`;
    };

    return (
        <div className="flex flex-col min-h-screen relative">
            <div className="absolute top-0 left-0 w-full h-40 bg-gradient-to-b from-gameAccent/20 to-transparent pointer-events-none"></div>

            {/* Header */}
            <header className="p-6 flex justify-between items-center z-10 sticky top-0 bg-gameBg/80 backdrop-blur-md border-b border-slate-800/50">
                <div>
                    <h2 className="text-xl font-black text-white px-2">
                        LUCKY <span className="text-gameNeon">STRIKE</span>
                    </h2>
                    <p className="text-xs text-slate-400 font-medium px-2 mt-1">ID: #{user.mobile?.slice(0, 4)}...{user.mobile?.slice(-4)}</p>
                </div>
                <div className="flex items-center gap-4">
                    <Wallet balance={user.wallet_balance} />
                    <button onClick={logout} className="p-2 bg-slate-800/80 rounded-full hover:bg-slate-700 transition">
                        <LogOut size={18} className="text-slate-300" />
                    </button>
                </div>
            </header>

            {/* Markets List */}
            <main className="flex-1 p-6 space-y-6 overflow-y-auto pb-24 z-10">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                        <Activity className="text-gameNeon" size={20} />
                        LIVE MARKETS
                    </h3>
                    <span className="text-xs font-semibold px-2 py-1 bg-slate-800 rounded-lg text-slate-300">
                        {markets.length} Available
                    </span>
                </div>

                <div className="space-y-4">
                    <AnimatePresence>
                        {markets.map((market, index) => {
                            const isOpen = market.status === 'open';
                            const isClosed = market.status === 'closed';
                            const isDeclared = market.status === 'declared';

                            return (
                                <motion.div
                                    key={market.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    onClick={() => isOpen && navigate(`/market/${market.id}`)}
                                    className={`relative p-[1px] rounded-2xl cursor-pointer ${isOpen ? 'glow-green hover:scale-[1.02] transition-transform' : 'opacity-75 grayscale-[0.2]'
                                        }`}
                                    style={{
                                        background: isOpen
                                            ? 'linear-gradient(to right, #10b981, #3b82f6)'
                                            : 'linear-gradient(to right, #334155, #475569)'
                                    }}
                                >
                                    <div className="bg-gameCard rounded-2xl p-5 flex justify-between items-center w-full h-full relative overflow-hidden">
                                        {/* Background Pattern */}
                                        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>

                                        <div className="z-10 relative">
                                            <h4 className="text-xl font-bold text-white tracking-wide">{market.name}</h4>
                                            <div className="flex items-center gap-2 mt-2">
                                                {isOpen ? (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-gameNeon/20 text-gameNeon border border-gameNeon/30">
                                                        <span className="w-2 h-2 rounded-full bg-gameNeon animate-pulse"></span>
                                                        OPEN
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                                                        CLOSED
                                                    </span>
                                                )}

                                                {(isOpen || market.countdown > 0) && (
                                                    <span className="text-xs font-medium text-slate-400 flex items-center gap-1 bg-slate-800/50 px-2 py-1 rounded-md">
                                                        <Clock size={12} />
                                                        {isOpen ? 'Closes in' : 'Opens in'} {formatTime(market.countdown)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="z-10">
                                            {isOpen ? (
                                                <div className="w-10 h-10 rounded-full bg-gameNeon/10 flex items-center justify-center text-gameNeon">
                                                    <ChevronRight size={24} />
                                                </div>
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-500">
                                                    <Lock size={18} />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}

                        {markets.length === 0 && (
                            <div className="text-center p-10 text-slate-500">
                                <Activity className="mx-auto mb-4 opacity-50" size={40} />
                                <p>Loading markets...</p>
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            </main>
        </div>
    );
}
