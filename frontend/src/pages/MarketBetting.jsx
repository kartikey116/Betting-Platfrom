import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, BarChart, Wallet as WalletIcon, CheckCircle2, ChevronLeft, Zap } from 'lucide-react';
import Wallet from '../components/Wallet';
import axios from 'axios';

// API config
const API_URL = 'http://localhost:5000/api';

const BET_TYPES = [
    { id: 'Single', name: 'Single Digit', maxLen: 1 },
    { id: 'Jodi', name: 'Jodi', maxLen: 2 },
    { id: 'Single Panna', name: 'Single Panna', maxLen: 3 },
    { id: 'Double Panna', name: 'Double Panna', maxLen: 3 },
    { id: 'Triple Panna', name: 'Triple Panna', maxLen: 3 }
];

const PANNA_ORDER = { '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '0': 10 };

const VALID_PANNAS = (() => {
    const single = [];
    const double = [];
    const triple = [];
    for (let i = 1; i <= 10; i++) {
        for (let j = i; j <= 10; j++) {
            for (let k = j; k <= 10; k++) {
                const d1 = i === 10 ? '0' : `${i}`;
                const d2 = j === 10 ? '0' : `${j}`;
                const d3 = k === 10 ? '0' : `${k}`;
                const panna = `${d1}${d2}${d3}`;
                if (i === j && j === k) triple.push(panna);
                else if (i === j || j === k) double.push(panna);
                else single.push(panna);
            }
        }
    }
    return { 'Single Panna': single, 'Double Panna': double, 'Triple Panna': triple };
})();


export default function MarketBetting() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [market, setMarket] = useState(null);
    const [user, setUser] = useState({ wallet_balance: 0 }); // Default state

    const [betType, setBetType] = useState('Single');
    const [number, setNumber] = useState('');
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);
    const [executingSeq, setExecutingSeq] = useState(false);
    const [prediction, setPrediction] = useState('---');

    // Auth Check & Headers
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            toast.error("Please login to place bets");
            navigate('/');
            return;
        }
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }, [navigate]);

    // Data Fetching
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch Wallet
                const walletRes = await axios.get(`${API_URL}/wallet/`);
                setUser(prev => ({ ...prev, wallet_balance: walletRes.data.balance }));

                // Fetch All Markets (to find the specific one by ID)
                const marketsRes = await axios.get(`${API_URL}/markets/`);
                const currentMarket = marketsRes.data.find(m => m.id.toString() === id);
                if (currentMarket) {
                    setMarket(currentMarket);
                } else {
                    toast.error("Market not found");
                    navigate('/dashboard');
                }
            } catch (error) {
                console.error("Error fetching data:", error);
                if (error.response?.status === 401 || error.response?.status === 403) {
                    navigate('/');
                }
            }
        };

        const token = localStorage.getItem('token');
        if (token) {
            fetchData();
            // Poll for balance updates
            const interval = setInterval(fetchData, 10000);
            return () => clearInterval(interval);
        }
    }, [id, navigate]);


    const activeBetTypeInfo = BET_TYPES.find(b => b.id === betType) || BET_TYPES[0];

    // Autocomplete Logic
    const suggestions = useMemo(() => {
        if (!number) {
            if (betType === 'Single') return [{ val: '2', tag: 'HOT', color: 'text-white' }, { val: '5', tag: 'NEW', color: 'text-white' }, { val: '9', tag: 'GOLD', color: 'text-[#0075FF] font-bold shadow-[inset_0_0_20px_rgba(0,117,255,0.2)] border-[#0075FF]' }, { val: '0', tag: 'TREND', color: 'text-white' }];
            if (betType === 'Jodi') return [{ val: '12', tag: 'HOT', color: 'text-white' }, { val: '45', tag: 'NEW', color: 'text-white' }, { val: '50', tag: 'GOLD', color: 'text-[#0075FF] font-bold shadow-[inset_0_0_20px_rgba(0,117,255,0.2)] border-[#0075FF]' }, { val: '99', tag: 'TREND', color: 'text-white' }];
            if (betType.includes('Panna')) {
                const list = VALID_PANNAS[betType] || [];
                return [
                    { val: list[0] || '100', tag: 'HOT', color: 'text-white' },
                    { val: list[10] || list[1] || '200', tag: 'NEW', color: 'text-white' },
                    { val: list[20] || list[2] || '300', tag: 'GOLD', color: 'text-[#0075FF] font-bold shadow-[inset_0_0_20px_rgba(0,117,255,0.2)] border-[#0075FF]' },
                    { val: list[30] || list[3] || '400', tag: 'TREND', color: 'text-white' }
                ];
            }
            return [];
        }

        let matches = [];
        if (betType === 'Single') {
            matches = [number];
        } else if (betType === 'Jodi') {
            if (number.length === 1) {
                matches = ['0', '1', '2', '3'].map(x => number + x);
            } else {
                matches = [number];
            }
        } else if (betType.includes('Panna')) {
            const list = VALID_PANNAS[betType] || [];
            matches = list.filter(p => p.startsWith(number)).slice(0, 4);
            if (matches.length === 0) matches = [number.padEnd(3, '0')]; // fallback
        }

        const tags = ['HOT', 'NEW', 'GOLD', 'TREND'];
        return matches.map((m, i) => ({
            val: m,
            tag: tags[i % 4],
            color: tags[i % 4] === 'GOLD' ? 'text-[#0075FF] font-bold shadow-[inset_0_0_20px_rgba(0,117,255,0.2)] border-[#0075FF]' : 'text-white'
        }));
    }, [betType, number]);

    // Dynamic Suggestion generation depending on mode
    useEffect(() => {
        if (number.length === activeBetTypeInfo.maxLen) {
            setPrediction(number);
        } else {
            setPrediction('---');
        }
    }, [number, activeBetTypeInfo.maxLen]);

    const handlePlaceBet = async () => {
        if (market.status !== 'open') {
            return toast.error("Market is closed. Cannot place bets.");
        }
        if (!number || number.length !== activeBetTypeInfo.maxLen) {
            return toast.error(`Please enter ${activeBetTypeInfo.maxLen} digits for ${betType}`);
        }
        const amt = parseFloat(amount);
        if (!amt || amt < 10) return toast.error('Minimum Stake is ₹10');
        if (amt > user.wallet_balance) return toast.error('Insufficient Funds');

        setLoading(true);

        try {
            await axios.post(`${API_URL}/bets/place`, {
                market_id: market.id,
                bet_type: betType,
                number: number,
                amount: amt
            });

            // Deduct locally for immediate UI update during animation
            setUser(prev => ({ ...prev, wallet_balance: prev.wallet_balance - amt }));

            setExecutingSeq(true);

            setTimeout(() => {
                setNumber('');
                setAmount('');
                setLoading(false);
                setTimeout(() => setExecutingSeq(false), 2000);
            }, 1500);

        } catch (error) {
            console.error("Bet placement failed:", error);
            toast.error(error.response?.data?.error || "Failed to place bet. Please try again.");
            setLoading(false);
        }
    };

    if (!market) return (
        <div className="flex flex-col min-h-screen items-center justify-center bg-[#0A111F] text-white">
            <div className="w-8 h-8 rounded-full border-t-2 border-[#0075FF] animate-spin"></div>
            <p className="mt-4 text-sm tracking-widest text-gray-400">LOADING MARKET DATA</p>
        </div>
    );

    return (
        <div className="flex flex-col min-h-screen relative font-sans bg-[#0A111F] text-white">

            {/* Execution Gamified Modal Overlay */}
            <AnimatePresence>
                {executingSeq && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, transition: { duration: 0.5 } }}
                        className="fixed inset-0 z-[100] bg-[#070D18]/95 backdrop-blur-xl overflow-y-auto"
                    >
                        {/* Mobile Execution View */}
                        <div className="md:hidden w-full h-full min-h-screen flex flex-col items-center justify-center relative py-12">
                            {/* Pulsing glow behind the circle */}
                            <motion.div
                                animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                                transition={{ duration: 3, repeat: Infinity }}
                                className="absolute w-64 h-64 bg-[#0075FF]/30 rounded-full blur-[80px]"
                            ></motion.div>

                            {/* Inner HUD UI element */}
                            <div className="relative w-72 h-72 flex flex-col items-center justify-center mt-12">
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                                    className="absolute inset-0 border-[1px] border-[#0075FF]/20 rounded-full border-dashed"
                                ></motion.div>
                                <motion.div
                                    animate={{ rotate: -360 }}
                                    transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
                                    className="absolute inset-4 border-[2px] border-t-[#0075FF] border-r-transparent border-b-transparent border-l-transparent rounded-full shadow-[0_0_20px_rgba(0,117,255,0.4)]"
                                ></motion.div>

                                <p className="text-[10px] text-[#0075FF] tracking-[0.2em] font-bold uppercase mb-2">PROCESSING</p>
                                <h2 className="text-6xl font-black tracking-wide bg-gradient-to-b from-white to-gray-400 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(255,255,255,0.3)]">{number}</h2>

                                <div className="mt-6 px-4 py-1.5 rounded-full border border-gray-800 bg-[#0C1525] flex items-center gap-2">
                                    <span className="text-[#0075FF]">▼</span>
                                    <span className="text-sm font-mono tracking-[0.2em] text-gray-400">1 &lt; 2 &lt; ... &lt; 0</span>
                                </div>
                            </div>

                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 1 }}
                                className="mt-16 flex flex-col items-center"
                            >
                                <motion.div
                                    initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 1.2, type: "spring" }}
                                    className="w-16 h-16 rounded-full bg-[#00FF41] flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(0,255,65,0.4)]"
                                >
                                    <CheckCircle2 size={32} className="text-black" />
                                </motion.div>
                                <h2 className="text-4xl font-black text-white tracking-wider mb-1">₹{amount || '0'}</h2>
                                <p className="text-[#00FF41] font-bold tracking-widest uppercase text-xs mb-6">Payment Completed</p>

                                <div className="bg-[#0C1525] border border-[#1A2639] rounded-xl p-4 w-full max-w-xs text-center mb-6">
                                    <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Securely Dedicated</p>
                                    <p className="font-mono text-white text-sm">Target Code: {number}</p>
                                </div>
                            </motion.div>
                        </div>

                        {/* Desktop Execution View */}
                        <div className="hidden md:flex flex-col min-h-screen w-full max-w-7xl mx-auto p-12 relative">
                            {/* Top Bar */}
                            <div className="flex justify-between items-center mb-16 w-full shrink-0">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-2xl bg-[#0075FF]/10 flex items-center justify-center border border-[#0075FF]/30 shadow-[0_0_15px_rgba(0,117,255,0.2)]">
                                        <div className="w-4 h-4 bg-[#0075FF] shrink-0 transform rotate-45 flex items-center justify-center shadow-[0_0_10px_rgba(0,117,255,1)]">
                                            <div className="w-1.5 h-1.5 bg-[#0A111F] shrink-0 z-10"></div>
                                        </div>
                                    </div>
                                    <h1 className="text-2xl font-bold font-sans tracking-wide text-white">Luminance</h1>
                                </div>
                                <div className="bg-[#0C1525] px-5 py-2.5 rounded-full border border-[#1A2639] text-sm font-bold flex items-center gap-3">
                                    ₹{(user.wallet_balance).toLocaleString('en-IN')} <WalletIcon size={16} className="text-[#0075FF]" />
                                </div>
                            </div>

                            {/* 3 Column Grid */}
                            <div className="grid grid-cols-3 gap-8 flex-1 items-center w-full">
                                {/* Left Col */}
                                <div className="space-y-6">
                                    <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="bg-[#0C1525] border border-[#1A2639] rounded-[2rem] p-8 shadow-2xl">
                                        <p className="text-[10px] text-[#0075FF] font-black tracking-widest uppercase mb-6">Sorting Engine</p>
                                        <p className="text-xs text-gray-400 mb-2">Active Filter</p>
                                        <p className="font-mono text-2xl font-bold tracking-widest text-white mb-8 italic">1 &lt; 2 &lt; ... &lt; 0</p>
                                        <div className="bg-[#0075FF]/10 text-[#0075FF] px-4 py-2.5 rounded-xl text-xs font-bold border border-[#0075FF]/30 flex items-center justify-center gap-2 w-max">
                                            <Sparkles size={14} /> High-Fidelity Mode
                                        </div>
                                    </motion.div>

                                    <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.4 }} className="bg-[#0C1525] border border-[#1A2639] rounded-[2rem] p-8 shadow-2xl">
                                        <p className="text-[10px] text-gray-500 font-black tracking-widest uppercase mb-6">Live Status</p>
                                        <div className="space-y-5 text-sm font-mono">
                                            <p className="text-[#00FF41] flex items-center gap-3 font-bold"><CheckCircle2 size={16} /> Validating Bet</p>
                                            <p className="text-gray-300 flex items-center gap-3 font-bold">
                                                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }} className="w-4 h-4 border-2 border-t-[#0075FF] border-r-transparent border-b-transparent border-l-transparent rounded-full shadow-[0_0_10px_rgba(0,117,255,0.4)]"></motion.div>
                                                Processing Logic...
                                            </p>
                                            <p className="text-gray-600 italic">Deducting Assets...</p>
                                        </div>
                                    </motion.div>
                                </div>

                                {/* Center Col */}
                                <div className="flex flex-col items-center justify-center relative col-span-1">
                                    <div className="w-96 h-96 relative flex flex-col items-center justify-center">
                                        <motion.div
                                            animate={{ rotate: 360 }}
                                            transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                                            className="absolute inset-0 border-[1px] border-[#0075FF]/20 rounded-full border-dashed"
                                        ></motion.div>
                                        <motion.div
                                            animate={{ rotate: -360 }}
                                            transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
                                            className="absolute inset-6 border-[2px] border-t-[#0075FF] border-r-transparent border-b-transparent border-l-[#0075FF] rounded-full shadow-[0_0_30px_rgba(0,117,255,0.4)]"
                                        ></motion.div>
                                        <motion.div
                                            animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.4, 0.2] }}
                                            transition={{ duration: 2, repeat: Infinity }}
                                            className="absolute inset-10 bg-[#0075FF]/10 rounded-full blur-[40px]"
                                        ></motion.div>

                                        <p className="text-xs text-[#0075FF] tracking-[0.3em] font-bold uppercase mb-2 relative z-10">PROCESSING</p>
                                        <h2 className="text-8xl font-black tracking-wide text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.5)] relative z-10">{number}</h2>

                                        <div className="mt-8 px-5 py-2 rounded-full border border-[#0075FF]/30 bg-[#0075FF]/10 flex items-center gap-3 relative z-10 backdrop-blur-md">
                                            <span className="text-[#0075FF] text-xs">▼</span>
                                            <span className="text-sm font-mono tracking-[0.3em] text-white font-bold">1 &lt; 2 &lt; ... &lt; 0</span>
                                        </div>
                                    </div>

                                    <motion.div
                                        initial={{ y: 20, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        transition={{ delay: 1 }}
                                        className="mt-12 flex flex-col items-center"
                                    >
                                        <motion.div
                                            initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 1.2, type: "spring" }}
                                            className="w-20 h-20 rounded-full bg-[#00FF41] flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(0,255,65,0.4)]"
                                        >
                                            <CheckCircle2 size={40} className="text-black" />
                                        </motion.div>
                                        <h2 className="text-5xl font-black text-white tracking-wider mb-2">₹{amount || '0'}</h2>
                                        <p className="text-[#00FF41] font-black tracking-widest uppercase text-sm mb-6 bg-[#00FF41]/10 px-4 py-1.5 rounded-full border border-[#00FF41]/30">Payment Completed</p>

                                        <div className="bg-[#0C1525] border border-[#1A2639] rounded-2xl p-5 w-full max-w-sm text-center shadow-lg">
                                            <p className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-2">Transaction Details</p>
                                            <div className="flex justify-between items-center text-sm font-mono pt-2 border-t border-[#1A2639]">
                                                <span className="text-gray-400">Target Config</span>
                                                <span className="text-white font-bold">{number}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-sm font-mono pt-2 mt-2 border-t border-[#1A2639]">
                                                <span className="text-gray-400">Status</span>
                                                <span className="text-[#00FF41] font-bold">Recorded via Network API</span>
                                            </div>
                                        </div>
                                    </motion.div>
                                </div>

                                {/* Right Col */}
                                <div className="space-y-6">
                                    <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.6 }} className="bg-[#0075FF] rounded-[2rem] p-8 shadow-[0_0_40px_rgba(0,117,255,0.3)] text-white relative overflow-hidden">
                                        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
                                        <div className="flex justify-between items-start mb-8">
                                            <p className="text-[10px] font-black tracking-widest uppercase opacity-80">Current Stake</p>
                                            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                                                <BarChart size={14} className="opacity-90" />
                                            </div>
                                        </div>
                                        <h3 className="text-5xl font-black tracking-wider mb-3">₹{amount || '0'}</h3>
                                        <p className="text-xs opacity-70 font-mono mb-8 font-medium">Raw Input: {amount || '0'} units</p>
                                        <div className="my-6 border-t border-white/20"></div>
                                        <div className="flex justify-between items-center text-sm font-bold">
                                            <span className="opacity-90">Adjusted Stake</span>
                                            <span className="text-lg shadow-sm">₹{amount || '0'}</span>
                                        </div>
                                    </motion.div>

                                    <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.8 }} className="bg-[#0C1525] border border-[#1A2639] rounded-[2rem] p-8 shadow-2xl">
                                        <div className="flex justify-between items-center mb-5">
                                            <p className="text-[10px] text-gray-500 font-black tracking-widest uppercase">Network Speed</p>
                                            <p className="text-[10px] text-[#0075FF] font-black tracking-widest">12ms API</p>
                                        </div>
                                        <div className="w-full h-2 bg-[#1A2639] rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: "0%" }}
                                                animate={{ width: "85%" }}
                                                transition={{ duration: 1, delay: 0.5 }}
                                                className="h-full bg-[#0075FF] rounded-full shadow-[0_0_10px_rgba(0,117,255,0.8)]"
                                            ></motion.div>
                                        </div>
                                    </motion.div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main UI */}
            <div className="w-full max-w-5xl mx-auto pt-8 pb-32 border-x border-[#1A2639]/50 shadow-2xl min-h-screen flex flex-col">

                {/* Header HUD */}
                <header className="px-6 flex justify-between items-center mb-8">
                    <div className="flex items-center gap-3">
                        <button onClick={() => navigate('/dashboard')} className="w-10 h-10 shrink-0 rounded-2xl bg-[#0C1525] flex items-center justify-center border border-[#1A2639] hover:border-[#0075FF] hover:text-[#0075FF] transition-colors text-gray-400">
                            <ChevronLeft size={20} />
                        </button>
                        <div className="w-10 h-10 shrink-0 rounded-2xl bg-[#0075FF]/10 items-center justify-center border border-[#0075FF]/30 shadow-[0_0_15px_rgba(0,117,255,0.2)] hidden sm:flex">
                            <div className="w-4 h-4 bg-[#0075FF] shrink-0 transform rotate-45 flex items-center justify-center shadow-[0_0_10px_rgba(0,117,255,1)]">
                                <div className="w-1.5 h-1.5 bg-[#0A111F] shrink-0 z-10"></div>
                            </div>
                        </div>
                        <div className="min-w-0">
                            <h1 className="text-sm font-black text-[#0075FF] tracking-widest uppercase truncate">{market.name}</h1>
                            <p className="text-[10px] text-gray-400 font-bold tracking-widest flex items-center gap-1">
                                {market.status === 'open' ? (
                                    <><span className="w-1.5 h-1.5 rounded-full bg-[#00FF41]"></span> MARKET OPEN</>
                                ) : (
                                    <><span className="w-1.5 h-1.5 rounded-full bg-[red]"></span> MARKET CLOSED</>
                                )}
                            </p>
                        </div>
                    </div>

                    <div className="text-right flex items-center gap-3">
                        <div>
                            <p className="text-[9px] text-gray-400 uppercase tracking-widest font-bold">BALANCE</p>
                            <p className="text-lg font-black tracking-wider text-white">₹{(user.wallet_balance).toLocaleString('en-IN')}</p>
                        </div>
                        <div className="w-10 h-10 bg-[#162135] rounded-xl flex items-center justify-center text-gray-400 border border-[#1A2639]">
                            <WalletIcon size={18} />
                        </div>
                    </div>
                </header>

                {/* Tab Selector */}
                <div className="px-6 mb-8 overflow-x-auto pb-2 scrollbar-none flex gap-3">
                    {BET_TYPES.map(bt => (
                        <button
                            key={bt.id}
                            onClick={() => { setBetType(bt.id); setNumber(''); }}
                            className={`flex-shrink-0 px-5 py-2.5 rounded-full text-xs font-bold tracking-wide transition-all ${betType === bt.id
                                ? 'bg-[#0075FF] text-white shadow-[0_0_20px_rgba(0,117,255,0.4)]'
                                : 'bg-[#0C1525] text-gray-400 border border-[#1A2639] hover:text-white'
                                }`}
                        >
                            {bt.name}
                        </button>
                    ))}
                </div>

                {/* Prediction Radar UI */}
                <div className="px-6 mb-8">
                    <div className="border border-[#1A2639] bg-[#0C1525]/80 rounded-[2rem] p-8 flex flex-col items-center justify-center relative overflow-hidden h-48 shadow-inner">

                        {/* Background arcs */}
                        <div className="absolute top-0 w-[150%] h-24 bg-[#0075FF]/5 blur-2xl rounded-[100%]"></div>

                        <p className="text-[9px] font-black tracking-[0.2em] text-[#0075FF] uppercase mb-4 relative z-10">TARGET PREDICTION</p>

                        <input
                            type="text"
                            value={number}
                            onChange={(e) => {
                                let raw = e.target.value.replace(/[^0-9]/g, '');
                                if (betType.includes('Panna') && raw.length > 0) {
                                    raw = raw.split('').sort((a, b) => PANNA_ORDER[a] - PANNA_ORDER[b]).join('');
                                }
                                setNumber(raw.slice(0, activeBetTypeInfo.maxLen));
                            }}
                            placeholder="---"
                            className="bg-transparent border-none text-5xl font-black text-center tracking-[0.3em] text-white focus:outline-none w-full relative z-10 placeholder:text-gray-700 font-mono"
                        />

                        {/* Footer stats inside radar */}
                        <div className="absolute bottom-6 w-full px-8 flex justify-between items-center z-10">
                            <div>
                                <p className="text-[8px] text-gray-500 uppercase tracking-widest font-bold">CONFIDENCE</p>
                                <p className="text-xs font-bold text-[#0075FF]">84% Optimal</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[8px] text-gray-500 uppercase tracking-widest font-bold">VOLATILITY</p>
                                <p className="text-xs font-bold text-[#FCEE0A]">Medium</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Smart Suggestions */}
                <div className="px-6 mb-10">
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-2">
                            <Sparkles size={14} className="text-[#0075FF]" />
                            <h3 className="text-[10px] font-black tracking-[0.2em] text-gray-400 uppercase">SMART SUGGESTIONS</h3>
                        </div>
                        <span className="text-[9px] font-bold text-[#0075FF] tracking-widest uppercase">TRENDING NOW</span>
                    </div>

                    <div className="grid grid-cols-4 gap-3">
                        {suggestions.map((item, idx) => (
                            <button
                                key={idx}
                                onClick={() => setNumber(item.val.slice(0, activeBetTypeInfo.maxLen))}
                                className={`flex flex-col items-center justify-center p-4 rounded-[2rem] border border-[#1A2639] bg-[#0C1525] hover:bg-[#162135] transition-colors relative overflow-hidden ${item.color}`}
                            >
                                <span className="text-xl font-bold font-mono tracking-widest">{item.val.slice(0, activeBetTypeInfo.maxLen)}</span>
                                <span className="text-[7px] font-black uppercase tracking-[0.2em] text-gray-500 mt-1">{item.tag}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Stake Module */}
                <div className="px-6 mt-auto">
                    <div className="flex justify-between items-center mb-4 border-t border-[#1A2639]/50 pt-6">
                        <h3 className="text-[10px] font-black tracking-[0.2em] text-gray-400 uppercase">SELECT STAKE</h3>
                        <p className="text-xs font-bold text-gray-400">Total: <span className="text-[#0075FF]">₹{amount || '0.00'}</span></p>
                    </div>

                    <div className="grid grid-cols-3 gap-3 mb-6">
                        {[100, 500, 1000, 5000, 10000].map(val => (
                            <button
                                key={val}
                                onClick={() => setAmount(String(val))}
                                className={`py-3 rounded-2xl border text-xs font-bold transition-all shadow-inner ${amount === String(val) ? 'bg-[#0075FF]/20 border-[#0075FF] text-white shadow-[0_0_15px_rgba(0,117,255,0.3)]' : 'bg-[#0F1829] border-[#1C2941] text-gray-300 hover:bg-[#162135] hover:text-[#0075FF] hover:border-[#0075FF]/30'}`}
                            >
                                ₹{val >= 1000 ? `${val / 1000}K` : val}
                            </button>
                        ))}
                        <button
                            onClick={() => setAmount(String(Math.floor(user.wallet_balance)))}
                            className={`py-3 rounded-2xl border text-xs font-bold transition-all shadow-inner ${amount === String(Math.floor(user.wallet_balance)) ? 'bg-[#0075FF]/20 border-[#0075FF] text-white shadow-[0_0_15px_rgba(0,117,255,0.3)]' : 'bg-[#0F1829] border-[#1C2941] text-gray-300 hover:bg-[#162135] hover:text-[#0075FF] hover:border-[#0075FF]/30'}`}
                        >
                            MAX
                        </button>
                    </div>

                    <button
                        disabled={loading || market.status !== 'open'}
                        onClick={handlePlaceBet}
                        className={`w-full ${market.status !== 'open' ? 'bg-gray-600 cursor-not-allowed' : 'bg-[#185ACB] hover:bg-[#0075FF] shadow-[0_10px_30px_-5px_rgba(0,117,255,0.4)]'} text-white font-black tracking-[0.2em] text-sm py-5 rounded-[2rem] uppercase transition-all flex items-center justify-center gap-2 group relative overflow-hidden`}
                    >
                        {/* Inner Top Glow */}
                        <div className="absolute top-0 left-0 w-full h-[1px] bg-white opacity-40"></div>

                        {market.status !== 'open' ? 'MARKET CLOSED' : loading ? 'PROCESSING...' : <><CheckCircle2 size={16} /> CONFIRM BET</>}
                    </button>
                    <p className="text-center font-mono text-[7px] text-gray-500 tracking-[0.3em] uppercase mt-4">ENCRYPTED TRANSACTION • SECURE HUD TERMINAL V4.2</p>
                </div>

            </div>
        </div>
    );
}
