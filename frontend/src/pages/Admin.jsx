import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function Admin() {
    const [bets, setBets] = useState([]);
    const [marketId, setMarketId] = useState(1);
    const [winningNumber, setWinningNumber] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        // Only access if admin token (omitted full middleware checks for simplicity here)
        fetchLiveBets();
    }, []);

    const fetchLiveBets = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_URL}/admin/live-bets`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setBets(res.data);
        } catch (error) {
            toast.error('Failed to load bets');
        }
    };

    const declareResult = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const date = new Date().toISOString().split('T')[0];
            await axios.post(`${API_URL}/admin/declare-result`, {
                marketId,
                winningNumber,
                date
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('Result declared and wallets updated!');
            fetchLiveBets();
        } catch (error) {
            toast.error('Failed to declare result');
        }
    };

    return (
        <div className="p-6 bg-slate-900 min-h-screen text-white">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-red-500">ADMIN CONTROL</h1>
                <button onClick={() => navigate('/login')} className="bg-slate-800 px-4 py-2 rounded text-sm">Logout</button>
            </div>

            <div className="bg-slate-800 p-5 rounded-xl border border-red-500 mb-8">
                <h2 className="text-xl font-bold mb-4">Declare Result</h2>
                <form onSubmit={declareResult} className="flex gap-4">
                    <input
                        type="number"
                        placeholder="Market ID (1,2,3)"
                        value={marketId}
                        onChange={e => setMarketId(e.target.value)}
                        className="bg-slate-900 border p-2 rounded"
                    />
                    <input
                        type="text"
                        placeholder="Winning Number"
                        value={winningNumber}
                        onChange={e => setWinningNumber(e.target.value)}
                        className="bg-slate-900 border p-2 rounded"
                    />
                    <button className="bg-red-500 font-bold px-4 py-2 rounded hover:bg-red-600">DECLARE</button>
                </form>
            </div>

            <div>
                <h2 className="text-xl font-bold mb-4">Live Bets (Pending)</h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-800">
                            <tr>
                                <th className="p-2">Market</th>
                                <th className="p-2">User Mobile</th>
                                <th className="p-2">Type</th>
                                <th className="p-2">Number</th>
                                <th className="p-2">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {bets.map(b => (
                                <tr key={b.id} className="border-b border-slate-800">
                                    <td className="p-2 font-bold">{b.market_name}</td>
                                    <td className="p-2">{b.mobile}</td>
                                    <td className="p-2 capitalize">{b.bet_type.replace('_', ' ')}</td>
                                    <td className="p-2 font-mono text-gameNeon">{b.selected_number}</td>
                                    <td className="p-2 font-bold text-gameGold">₹{b.amount}</td>
                                </tr>
                            ))}
                            {bets.length === 0 && <tr><td colSpan="5" className="p-4 text-center">No pending bets</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
