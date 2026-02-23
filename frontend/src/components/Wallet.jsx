import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Coins } from 'lucide-react';

export default function Wallet({ balance }) {
    const [displayBalance, setDisplayBalance] = useState(balance);
    const [animating, setAnimating] = useState(false);

    useEffect(() => {
        if (balance !== displayBalance) {
            setAnimating(true);

            const diff = balance - displayBalance;
            const steps = 15;
            const stepValue = diff / steps;

            let currentStep = 0;
            const interval = setInterval(() => {
                currentStep++;
                if (currentStep === steps) {
                    setDisplayBalance(balance);
                    setAnimating(false);
                    clearInterval(interval);
                } else {
                    setDisplayBalance(prev => prev + stepValue);
                }
            }, 40);

            return () => clearInterval(interval);
        }
    }, [balance, displayBalance]);

    return (
        <motion.div
            className={`px-4 py-2 rounded-2xl flex items-center gap-3 font-bold bg-black/40 text-white border-2 backdrop-blur-md relative overflow-hidden
        ${animating ? 'border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.5)] bg-red-500/10' : 'border-gameGold/30 shadow-[0_0_10px_rgba(234,179,8,0.2)]'}
        transition-all`}
            animate={animating ? { scale: [1, 1.1, 1], y: [0, -5, 0] } : {}}
            transition={{ duration: 0.3 }}
        >
            <Coins size={18} className={`${animating ? 'text-red-400' : 'text-gameGold'} transition-colors`} />

            <span className="font-mono text-lg tracking-wider">
                {Math.round(displayBalance).toLocaleString('en-IN')}
            </span>

            <AnimatePresence>
                {animating && balance < displayBalance && (
                    <motion.div
                        initial={{ opacity: 1, y: 0, scale: 1.5 }}
                        animate={{ opacity: 0, y: -40, scale: 0.5 }}
                        exit={{ opacity: 0 }}
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-red-500 font-black text-2xl pointer-events-none drop-shadow-[0_0_10px_rgba(239,68,68,0.8)]"
                    >
                        -{Math.round(displayBalance - balance)}
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
