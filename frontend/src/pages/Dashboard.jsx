import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Bell, Home, LayoutList, UserCircle } from 'lucide-react';
import Wallet from '../components/Wallet';
import axios from 'axios';

export default function Dashboard() {
    const [markets, setMarkets] = useState([]);
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || { wallet_balance: 50000 });
    const navigate = useNavigate();

    useEffect(() => {
        fetchMarkets();
        fetchUser();
        const interval = setInterval(() => {
            fetchMarkets();
            fetchUser();
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    const fetchUser = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return navigate('/');
            const res = await axios.get('http://localhost:5000/api/wallet/', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUser(prev => ({ ...prev, wallet_balance: res.data.balance }));
        } catch (e) {
            if (e.response?.status === 401 || e.response?.status === 403) navigate('/');
        }
    };

    const fetchMarkets = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;
            const res = await axios.get('http://localhost:5000/api/markets', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const enhanced = res.data.map(m => ({
                id: m.id,
                name: m.name,
                ref: `#MKT-${m.id}`,
                status: m.computed_status ? m.computed_status.toUpperCase() : 'CLOSED',
                countdown: Math.floor(m.countdown || 0),
                result: 'AWAITING-RESULT',
                players: '',
                theme: 'neon'
            }));
            setMarkets(enhanced);
        } catch (error) {
            console.error("Error fetching markets", error);
        }
    };

    const formatTime = (seconds) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <div className="min-h-screen bg-termBg text-white pb-24 font-sans w-full max-w-5xl mx-auto relative shadow-2xl border-x border-termBorder/30">

            {/* Top Navigation */}
            <header className="px-5 pt-8 pb-4 flex justify-between items-center relative z-20">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full border border-termNeon flex items-center justify-center bg-termNeon/10 relative">
                        <User size={20} className="text-termNeon" />
                        <div className="absolute top-0 right-0 w-2 h-2 rounded-full bg-termNeon shadow-[0_0_5px_#00FF41]"></div>
                    </div>
                    <div>
                        <h2 className="text-sm font-bold tracking-wider uppercase">Hello, {user.mobile?.slice(0, 4) || 'User'}</h2>
                        <p className="text-[10px] text-termNeon font-bold uppercase tracking-widest">VIP Tier: Gold</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Wallet balance={user.wallet_balance} />
                    <button className="w-8 h-8 rounded-full bg-termCardBg flex items-center justify-center text-gray-400 border border-termBorder">
                        <Bell size={14} />
                    </button>
                </div>
            </header>

            {/* Decorative Top Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-2 bg-gradient-to-r from-transparent via-termNeon to-transparent opacity-50 blur-sm pointer-events-none"></div>

            <main className="px-5 mt-6">
                <div className="mb-6">
                    <h1 className="text-5xl font-hand tracking-wider mb-2 text-[#00f0ff] drop-shadow-[0_0_15px_rgba(0,240,255,0.4)] mt-2">Market Hub</h1>
                    <p className="text-xs text-gray-400 font-medium">Predict and win in real-time markets</p>
                </div>

                {/* Market Cards */}
                <div className="space-y-4">
                    {markets.map((market, idx) => {
                        const isOpen = market.status === 'OPEN';

                        return (
                            <motion.div
                                key={market.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                onClick={() => isOpen && navigate(`/market/${market.id}`)}
                                className={`relative rounded-[2rem] p-6 border transition-all cursor-pointer overflow-hidden ${isOpen
                                    ? 'bg-termCardBg border-termNeon/30 shadow-[0_0_30px_rgba(0,255,65,0.05)]'
                                    : 'bg-termCardBg/50 border-termBorder opacity-60'
                                    }`}
                            >
                                {/* Glowing edge effect */}
                                {isOpen && <div className="absolute -inset-px rounded-[2rem] border border-termNeon opacity-30 pointer-events-none"></div>}

                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <h3 className="text-xl font-bold mb-1">{market.name}</h3>
                                        <p className="text-[10px] text-gray-500 uppercase tracking-widest font-mono">MARKET ID: {market.ref}</p>
                                    </div>

                                    <div className="text-right flex flex-col items-end">
                                        <p className="text-[9px] text-gray-500 uppercase tracking-widest mb-0.5 font-bold">STATUS</p>
                                        <span className={`text-xs font-black tracking-widest relative z-10 ${isOpen ? 'text-termNeon drop-shadow-[0_0_8px_rgba(0,255,65,0.8)]' : 'text-gray-500'}`}>
                                            {market.status}
                                            {isOpen && <div className="absolute -top-1 -right-4 w-12 h-12 bg-termNeon/20 blur-xl -z-10 rounded-full"></div>}
                                        </span>
                                    </div>
                                </div>

                                <div className="bg-[#141B29] rounded-2xl py-5 text-center mb-6 relative overflow-hidden">
                                    {market.status === 'DECLARED' ? (
                                        <>
                                            <div className="absolute inset-0 bg-[#FCEE0A]/5"></div>
                                            <p className="text-[9px] text-[#A39D2F] tracking-widest uppercase font-bold mb-2 relative z-10">TVS-FINAL RESULT</p>
                                            <div className="flex justify-center items-center gap-3 relative z-10">
                                                <span className="font-mono text-3xl font-black text-white">{market.result.split('-')[0]}</span>
                                                <span className="font-mono text-4xl font-black text-[#FCEE0A] drop-shadow-[0_0_15px_rgba(252,238,10,0.5)]">{market.result.split('-')[1]}</span>
                                                <span className="font-mono text-3xl font-black text-white">{market.result.split('-')[2]}</span>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <p className="text-[9px] text-gray-400 tracking-widest uppercase font-bold mb-2">TIME REMAINING</p>
                                            <p className="font-mono text-4xl font-black tracking-widest text-shadow-sm">
                                                {formatTime(market.countdown)}
                                            </p>
                                        </>
                                    )}
                                </div>

                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        {market.players && (
                                            <>
                                                <div className="flex -space-x-2">
                                                    <div className="w-6 h-6 rounded-full bg-gray-700 border-2 border-termCardBg text-[8px] flex items-center justify-center font-bold">J1</div>
                                                    <div className="w-6 h-6 rounded-full bg-gray-600 border-2 border-termCardBg text-[8px] flex items-center justify-center font-bold">M2</div>
                                                    <div className="w-6 h-6 rounded-full bg-gray-500 border-2 border-termCardBg text-[8px] flex items-center justify-center font-bold">R8</div>
                                                </div>
                                                <span className="text-[10px] text-gray-500 font-medium">{market.players}</span>
                                            </>
                                        )}
                                    </div>

                                    {isOpen && (
                                        <button className="bg-termNeon text-black font-black text-xs px-5 py-2.5 rounded-full uppercase tracking-wider hover:bg-white transition-colors flex items-center gap-1 shadow-[0_0_15px_rgba(0,255,65,0.4)]">
                                            BET NOW <span className="text-lg leading-none">›</span>
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </main>

            {/* Floating Bottom Navigation */}
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-2.5rem)] max-w-[400px] z-50">
                <div className="bg-termCardBg/90 backdrop-blur-xl border border-termBorder rounded-full py-3 px-8 flex justify-between items-center shadow-2xl relative">

                    {/* Nav Items */}
                    <button className="flex flex-col items-center gap-1 opacity-50 text-white">
                        <Home size={20} />
                    </button>

                    {/* Center Active Item */}
                    <div className="relative">
                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-14 h-14 bg-termNeon rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(0,255,65,0.5)] border-4 border-termBg text-black cursor-pointer">
                            <LayoutList size={20} className="font-bold" />
                        </div>
                        <p className="text-[9px] font-black text-termNeon pt-6">MARKETS</p>
                    </div>

                    <button className="flex flex-col items-center gap-1 opacity-50 text-white">
                        <UserCircle size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
}
