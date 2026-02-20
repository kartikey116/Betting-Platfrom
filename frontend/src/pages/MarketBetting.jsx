import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { ArrowLeft, Zap, CheckCircle2 } from 'lucide-react';
import Wallet from '../components/Wallet';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const BET_TYPES = [
    { id: 'single_digit', name: 'Single Digit', desc: '0-9', maxLen: 1 },
    { id: 'jodi', name: 'Jodi', desc: '00-99', maxLen: 2 },
    { id: 'single_panna', name: 'Single Panna', desc: '3 Unique', maxLen: 3 },
    { id: 'double_panna', name: 'Double Panna', desc: '2 Same', maxLen: 3 },
    { id: 'triple_panna', name: 'Triple Panna', desc: 'All Same', maxLen: 3 },
];

export default function MarketBetting() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [market, setMarket] = useState(null);
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || {});

    const [betType, setBetType] = useState('single_digit');
    const [number, setNumber] = useState('');
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchMarketInfo();
    }, [id]);

    const fetchMarketInfo = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_URL}/markets`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const m = res.data.find(x => x.id.toString() === id);
            if (m) setMarket(m);
            else navigate('/dashboard');
        } catch (error) {
            console.error(error);
        }
    };

    const activeBetTypeInfo = BET_TYPES.find(b => b.id === betType) || BET_TYPES[0];

    // Smart Autocomplete Suggestions based on Panna rules and input
    const suggestions = useMemo(() => {
        if (!number || number.length === activeBetTypeInfo.maxLen) return [];

        // Auto complete logic: append 0-9 and see if it is valid for the bet type
        let sugs = [];
        if (activeBetTypeInfo.maxLen === 3) {
            // Basic suggestion logic, just append up to 3 length
            for (let i = 0; i < 10 && sugs.length < 5; i++) {
                const potential = number + i;
                if (potential.length <= 3) {
                    // We could add more complex generation (e.g. sorting) here
                    sugs.push(potential.padEnd(3, '0'));
                }
            }
        } else if (activeBetTypeInfo.maxLen === 2) {
            for (let i = 0; i < 10 && sugs.length < 5; i++) {
                sugs.push((number + i).substring(0, 2));
            }
        }
        return [...new Set(sugs)];
    }, [number, betType, activeBetTypeInfo]);

    const handlePlaceBet = async () => {
        if (!number || number.length !== activeBetTypeInfo.maxLen) {
            return toast.error(`Please enter valid ${activeBetTypeInfo.maxLen} digits`);
        }
        const amt = parseFloat(amount);
        if (!amt || amt < 10) return toast.error('Minimum bet amount is ₹10');
        if (amt > user.wallet_balance) return toast.error('Insufficient funds');

        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(`${API_URL}/bets/place`, {
                marketId: parseInt(id),
                betType: betType,
                selectedNumber: number,
                amount: amt
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            toast.success(res.data.message || 'Bet Placed!');

            // Update local wallet
            const updatedUser = { ...user, wallet_balance: res.data.newBalance };
            setUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));

            setNumber('');
            setAmount('');
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to place bet');
        } finally {
            setLoading(false);
        }
    };

    if (!market) return <div className="p-10 text-center text-white">Loading Arena...</div>;

    return (
        <div className="flex flex-col min-h-screen bg-gameBg relative selection:bg-gameAccent/30 pb-10">
            {/* Header */}
            <header className="p-4 flex justify-between items-center z-10 bg-gameCard border-b border-slate-700 shadow-xl">
                <button onClick={() => navigate('/dashboard')} className="p-2 bg-slate-800 rounded-full text-slate-300 hover:text-white transition">
                    <ArrowLeft size={20} />
                </button>
                <h2 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-gameNeon to-gameAccent">
                    {market.name.toUpperCase()}
                </h2>
                <Wallet balance={user.wallet_balance} />
            </header>

            <main className="flex-1 p-5 space-y-8 z-10">

                {/* Bet Type Selection */}
                <section>
                    <h3 className="text-sm font-bold text-slate-400 mb-3 uppercase tracking-wider flex items-center gap-2">
                        <Zap size={16} className="text-gameGold" />
                        Select Bet Type
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                        {BET_TYPES.map(bt => (
                            <motion.button
                                key={bt.id}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => { setBetType(bt.id); setNumber(''); }}
                                className={`p-3 rounded-xl border text-left transition-all ${betType === bt.id
                                        ? 'border-gameAccent bg-gameAccent/10 glow-purple shadow-lg shadow-gameAccent/20'
                                        : 'border-slate-700 bg-slate-800/50 text-slate-300 hover:bg-slate-800'
                                    }`}
                            >
                                <div className="flex justify-between items-start">
                                    <div className="font-bold">{bt.name}</div>
                                    {betType === bt.id && <CheckCircle2 size={16} className="text-gameAccent" />}
                                </div>
                                <div className="text-xs opacity-70 mt-1">{bt.desc}</div>
                            </motion.button>
                        ))}
                    </div>
                </section>

                {/* Input Form */}
                <section className="bg-gameCard p-5 rounded-2xl border border-slate-700 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gameAccent/5 rounded-full blur-3xl -mr-10 -mt-10"></div>

                    <div className="space-y-5 relative z-10">
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">Choose Number</label>
                            <input
                                type="number"
                                value={number}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    if (val.length <= activeBetTypeInfo.maxLen) setNumber(val);
                                }}
                                placeholder={`e.g. ${'8'.repeat(activeBetTypeInfo.maxLen)}`}
                                className="w-full bg-slate-900 border border-slate-700 text-3xl font-mono text-center text-gameNeon rounded-xl p-4 focus:outline-none focus:border-gameNeon transition-colors shadow-inner"
                            />

                            {/* Smart Autocomplete */}
                            {suggestions.length > 0 && (
                                <div className="mt-2 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                                    {suggestions.map((sug, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setNumber(sug)}
                                            className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm font-mono hover:bg-slate-700 hover:border-slate-500 whitespace-nowrap text-gameGold"
                                        >
                                            {sug}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">Bet Amount (₹)</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-xl font-mono">₹</span>
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="500"
                                    className="w-full bg-slate-900 border border-slate-700 text-2xl font-bold pl-10 pr-4 py-3 rounded-xl focus:outline-none focus:border-gameGold focus:ring-1 focus:ring-gameGold transition-all"
                                />
                            </div>
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            disabled={loading}
                            onClick={handlePlaceBet}
                            className="w-full mt-4 bg-gradient-to-r from-gameNeon to-gameAccent hover:from-emerald-400 hover:to-blue-400 text-white font-black text-xl py-4 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all disabled:opacity-50 tracking-wider flex items-center justify-center gap-2"
                        >
                            {loading ? 'PROCESSING...' : 'PLACE BET'}
                        </motion.button>
                    </div>
                </section>
            </main>
        </div>
    );
}
