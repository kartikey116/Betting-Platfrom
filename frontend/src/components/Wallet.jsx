import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Wallet({ balance }) {
    const [displayBalance, setDisplayBalance] = useState(balance);
    const [animating, setAnimating] = useState(false);

    useEffect(() => {
        if (balance !== displayBalance) {
            setAnimating(true);

            // Animate the number change visually
            const diff = balance - displayBalance;
            const steps = 10;
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
            }, 50);

            return () => clearInterval(interval);
        }
    }, [balance, displayBalance]);

    return (
        <motion.div
            className={`px-4 py-2 rounded-xl border flex items-center gap-2 font-bold bg-slate-800 text-white
        ${animating ? 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]' : 'border-gameGold/50'}
        transition-all`}
            animate={animating ? { scale: [1, 1.05, 1], color: ['#fff', '#ef4444', '#fff'] } : {}}
            transition={{ duration: 0.3 }}
        >
            <span className="text-gameGold text-sm">₹</span>
            <span className="font-mono">{Math.round(displayBalance).toLocaleString('en-IN')}</span>

            <AnimatePresence>
                {animating && balance < displayBalance && (
                    <motion.div
                        initial={{ opacity: 1, y: 0, x: 0 }}
                        animate={{ opacity: 0, y: -20, x: 10 }}
                        exit={{ opacity: 0 }}
                        className="absolute top-0 right-0 text-red-500 font-bold text-sm pointer-events-none"
                    >
                        -{Math.round(displayBalance - balance)}
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
