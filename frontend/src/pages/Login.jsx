import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Phone, Lock } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

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
            const res = await axios.post(`${API_URL}/auth/login`, { mobile, otp });
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('user', JSON.stringify(res.data.user));
            toast.success('Login Successful! Welcome to the Arena.');
            navigate('/dashboard');
        } catch (err) {
            toast.error(err.response?.data?.error || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen w-full p-6 relative">
            {/* Background elements */}
            <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-gameAccent/20 to-transparent pointer-events-none"></div>

            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-sm space-y-8 z-10"
            >
                <div className="text-center space-y-2">
                    <motion.div
                        initial={{ y: -20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="w-20 h-20 mx-auto bg-gradient-to-tr from-gameNeon to-gameAccent rounded-2xl shadow-[0_0_30px_rgba(16,185,129,0.3)] flex items-center justify-center mb-6"
                    >
                        <span className="text-4xl font-extrabold text-white">777</span>
                    </motion.div>
                    <h1 className="text-3xl font-black tracking-tight text-white mb-1">
                        LUCKY <span className="text-gameNeon">STRIKE</span>
                    </h1>
                    <p className="text-slate-400 font-medium">Enter your credentials to join the game</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-5 mt-10">
                    <div className="space-y-4">
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-gameNeon transition-colors">
                                <Phone size={20} />
                            </div>
                            <input
                                type="tel"
                                value={mobile}
                                onChange={(e) => setMobile(e.target.value)}
                                placeholder="Mobile Number"
                                className="w-full bg-slate-900/50 border border-slate-700/50 text-white placeholder-slate-500 text-lg rounded-2xl pl-12 pr-4 py-4 focus:outline-none focus:ring-2 focus:ring-gameNeon/50 focus:border-gameNeon/50 transition-all backdrop-blur-sm"
                            />
                        </div>

                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-gameAccent transition-colors">
                                <Lock size={20} />
                            </div>
                            <input
                                type="text"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                placeholder="Any 6-digit OTP"
                                className="w-full bg-slate-900/50 border border-slate-700/50 text-white placeholder-slate-500 text-lg rounded-2xl pl-12 pr-4 py-4 focus:outline-none focus:ring-2 focus:ring-gameAccent/50 focus:border-gameAccent/50 transition-all backdrop-blur-sm"
                            />
                        </div>
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-gameNeon to-gameAccent text-white font-bold text-lg rounded-2xl py-4 shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:shadow-[0_0_30px_rgba(16,185,129,0.6)] transition-all disabled:opacity-70 flex justify-center items-center"
                    >
                        {loading ? (
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ) : "PLAY NOW"}
                    </motion.button>
                </form>
            </motion.div>
        </div>
    );
}
