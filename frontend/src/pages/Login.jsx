import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Phone, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';

export default function Login() {
    const [mobile, setMobile] = useState('');
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        if (mobile.length < 10) return toast.error('Enter valid 10 digit mobile number');
        if (otp.length < 4) return toast.error('Enter valid OTP');

        setLoading(true);

        try {
            const res = await axios.post('https://betting-platfrom.onrender.com/api/auth/login', { mobile, otp });

            localStorage.setItem('token', res.data.token);
            localStorage.setItem('user', JSON.stringify(res.data.user));

            toast.success('Login Successful! Welcome to the Arena.');
            navigate('/dashboard');
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.error || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen w-full px-4 sm:p-6 relative bg-termBg font-sans">
            {/* Background Grid */}
            <div className="absolute inset-0 z-0 opacity-50 bg-[linear-gradient(rgba(17,17,17,0.8)_1px,transparent_1px),linear-gradient(90deg,rgba(17,17,17,0.8)_1px,transparent_1px)] bg-[size:30px_30px]"></div>

            <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md sm:max-w-lg space-y-8 z-10 border border-gray-800 bg-[#080808]/90 p-6 sm:p-10 shadow-2xl relative"
            >
                {/* Decorative corner pieces */}
                <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-[#00f0ff]"></div>
                <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-[#00f0ff]"></div>
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-[#00f0ff]"></div>
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-[#00f0ff]"></div>
                <div className="text-center space-y-2 mb-8">
                    <h1 className="text-6xl sm:text-7xl mt-2 font-hand text-[#00f0ff] drop-shadow-[0_0_20px_rgba(0,240,255,0.5)] tracking-wide">
                        MarketHUB
                    </h1>
                    <div className="inline-block border-t border-b border-[#d926a9] text-[#d926a9] font-mono text-[10px] tracking-[0.4em] font-bold uppercase px-6 py-2 bg-[#d926a9]/5 mt-2">
                        Tactical Betting Syndicate
                    </div>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    <div className="space-y-4">
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500 group-focus-within:text-[#00f0ff] transition-colors">
                                <Phone size={18} />
                            </div>
                            <input
                                type="tel"
                                value={mobile}
                                onChange={(e) => setMobile(e.target.value)}
                                placeholder="Mobile Number"
                                className="w-full bg-[#111] border border-gray-800 text-white placeholder-gray-600 text-base md:text-lg rounded-none pl-12 pr-4 py-4 md:py-5 font-mono tracking-widest focus:outline-none focus:border-[#00f0ff] focus:shadow-[0_0_15px_rgba(0,240,255,0.2)] transition-all"
                            />
                        </div>

                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500 group-focus-within:text-[#d926a9] transition-colors">
                                <Lock size={18} />
                            </div>
                            <input
                                type="text"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                placeholder="Any 6-digit OTP"
                                className="w-full bg-[#111] border border-gray-800 text-white placeholder-gray-600 text-base md:text-lg rounded-none pl-12 pr-4 py-4 md:py-5 font-mono tracking-widest focus:outline-none focus:border-[#d926a9] focus:shadow-[0_0_15px_rgba(217,38,169,0.2)] transition-all"
                            />
                        </div>
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        disabled={loading}
                        className="w-full bg-[#00ff41]/10 border border-[#00ff41] text-[#00ff41] hover:bg-[#00ff41] hover:text-black font-mono font-bold text-lg md:text-xl py-4 md:py-5 shadow-[0_0_15px_rgba(0,255,65,0.2)] hover:shadow-[0_0_30px_rgba(0,255,65,0.6)] transition-all disabled:opacity-50 flex justify-center items-center tracking-[0.3em] uppercase mt-8 relative group overflow-hidden"
                    >
                        {/* Button Shine effect */}
                        {!loading && <div className="absolute top-0 -left-[100%] w-1/2 h-full bg-gradient-to-r from-transparent via-white/50 to-transparent skew-x-[-30deg] group-hover:animate-[shine_1s_ease-in-out]"></div>}

                        {loading ? (
                            <span className="flex items-center gap-2 relative z-10 text-[#00ff41]">
                                <span className="w-5 h-5 rounded-full border-2 border-[#00ff41] border-t-transparent animate-spin"></span>
                                [ AUTHENTICATING ]
                            </span>
                        ) : <span className="relative z-10 flex items-center gap-2">CONNECT</span>}
                    </motion.button>

                    <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mt-4">
                        <button
                            type="button"
                            onClick={() => { setMobile('9999999999'); setOtp('123456'); }}
                            className="text-[#d926a9] text-xs font-mono opacity-80 hover:opacity-100 hover:underline tracking-widest uppercase transition-all"
                        >
                            [ Use Demo: 999 999 9999 / 123456 ]
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate('/admin')}
                            className="text-[#00f0ff] text-xs font-mono opacity-80 hover:opacity-100 hover:underline tracking-widest uppercase transition-all"
                        >
                            [ ACCESS ADMIN PANEL ]
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}
