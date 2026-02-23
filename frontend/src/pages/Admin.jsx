import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import axios from 'axios';
import './Admin.css';

// Admin API config
const API_URL = 'http://localhost:5000/api';

export default function Admin() {
    const navigate = useNavigate();

    // State
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loginError, setLoginError] = useState(false);

    const [activePage, setActivePage] = useState('overview'); // overview, markets, livefeed, results, daily
    const [currentTime, setCurrentTime] = useState('');
    const [nextResetTime, setNextResetTime] = useState('');

    const [markets, setMarkets] = useState([]);
    const [liveBets, setLiveBets] = useState([]);
    const [resultHistory, setResultHistory] = useState([]);
    const [activeUsers, setActiveUsers] = useState([]);

    const [filterMarket, setFilterMarket] = useState('all');
    const [dateTab, setDateTab] = useState('today'); // today, yesterday

    // Declare Result Form State
    const [selectedResultMarket, setSelectedResultMarket] = useState('');
    const [winningNumber, setWinningNumber] = useState('');
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [successData, setSuccessData] = useState(null);

    // Initial Setup & Clocks
    useEffect(() => {
        const timer = setInterval(() => {
            const now = new Date();
            setCurrentTime(now.toLocaleTimeString('en-IN', { hour12: false }));

            // Auto Reset Clock
            const midnight = new Date(now);
            midnight.setHours(24, 0, 0, 0);
            const diff = midnight - now;
            const hours = Math.floor(diff / 3600000);
            const minutes = Math.floor((diff % 3600000) / 60000);
            const seconds = Math.floor((diff % 60000) / 1000);
            setNextResetTime(`${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`);
        }, 1000);

        // Check if token exists in localStorage (persist admin login)
        const token = localStorage.getItem('adminToken');
        if (token) {
            setIsLoggedIn(true);
        }

        return () => clearInterval(timer);
    }, []);

    // Set auth header globally for Axios if logged in
    useEffect(() => {
        const token = localStorage.getItem('adminToken');
        if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        }
    }, [isLoggedIn]);

    // Fetch initial Dashboard Data when logged in
    useEffect(() => {
        if (!isLoggedIn) return;

        fetchMarkets();
        fetchLiveBets();
        fetchResults();
        fetchActiveUsers();

    }, [isLoggedIn]);

    // Live Feed Polling
    useEffect(() => {
        if (!isLoggedIn) return;

        const interval = setInterval(() => {
            fetchLiveBets(true); // silent fetch to avoid too many loading states
            fetchMarkets(true);
        }, 5000); // Poll every 5 seconds

        return () => clearInterval(interval);
    }, [isLoggedIn]);

    // API Calls
    const fetchMarkets = async (silent = false) => {
        try {
            const res = await axios.get(`${API_URL}/admin/markets`);
            // Add some UI metadata for render like colors and emojis based on name
            const enhancedMarkets = res.data.map((m, index) => {
                const colors = ['purple', 'teal', 'pink', 'green', 'blue'];
                const emojis = ['🔵', '🟢', '🔴', '🟡', '🟠'];
                return {
                    ...m,
                    color: colors[index % colors.length],
                    cssClass: `m${(index % 3) + 1}`,
                    emoji: emojis[index % emojis.length],
                    isOpen: m.real_status === 'open',
                    status: m.real_status,
                    // Default stats if DB doesn't aggregate them in the initial query (optimistic update UI fallback)
                    todayBets: m.today_bets || 0,
                    volume: m.volume || 0
                };
            });
            setMarkets(enhancedMarkets);
            if (enhancedMarkets.length > 0 && !selectedResultMarket) {
                setSelectedResultMarket(enhancedMarkets[0].id.toString());
            }
        } catch (err) {
            if (!silent) console.error("Error fetching markets", err);
            if (err.response?.status === 401 || err.response?.status === 403) handleLogout();
        }
    };

    const fetchLiveBets = async (silent = false) => {
        try {
            // Depending on the tab, fetch appropriate bets
            const endpoint = dateTab === 'today' ? '/admin/today-bets' : '/admin/yesterday-bets';
            const res = await axios.get(`${API_URL}${endpoint}`);
            setLiveBets(res.data);
        } catch (err) {
            if (!silent) console.error("Error fetching bets", err);
        }
    };

    // Refetch bets if dateTab changes
    useEffect(() => {
        if (isLoggedIn) fetchLiveBets();
    }, [dateTab]);

    const fetchResults = async () => {
        try {
            const res = await axios.get(`${API_URL}/admin/results`);
            setResultHistory(res.data);
        } catch (err) {
            console.error("Error fetching results", err);
        }
    };

    const fetchActiveUsers = async () => {
        try {
            const res = await axios.get(`${API_URL}/admin/active-users`);
            setActiveUsers(res.data);
        } catch (err) {
            console.error("Error fetching users", err);
        }
    }


    // Actions
    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post(`${API_URL}/auth/admin/login`, {
                email: email,
                password: password
            });

            if (res.data.token) {
                if (res.data.role !== 'admin') {
                    setLoginError(true);
                    toast.error("Access denied. Admin only.");
                    return;
                }

                localStorage.setItem('adminToken', res.data.token);
                setIsLoggedIn(true);
                setLoginError(false);
                toast.success('Successfully logged in');
            }
        } catch (err) {
            console.error(err);
            setLoginError(true);
            setTimeout(() => setLoginError(false), 3000);
            toast.error(err.response?.data?.error || "Login Failed");
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('adminToken');
        setIsLoggedIn(false);
        setEmail('');
        setPassword('');
    };

    const toggleMarket = async (id, currentStatus) => {
        try {
            const newStatus = currentStatus === 'open' ? 'closed' : 'open';
            await axios.patch(`${API_URL}/admin/market-status/${id}`, { status: newStatus });
            toast(newStatus === 'open' ? 'Market Opened' : 'Market Closed', { icon: newStatus === 'open' ? '✅' : '❌' });
            fetchMarkets(); // Refresh markets
        } catch (err) {
            toast.error("Failed to toggle market status");
        }
    };

    const updateMarketTimeState = (id, field, value) => {
        // Optimistic UI update before save
        setMarkets(prev => prev.map(m => m.id === id ? { ...m, [field]: value } : m));
    };

    const saveMarketTime = async (market) => {
        try {
            await axios.patch(`${API_URL}/admin/market-time/${market.id}`, {
                open_time: market.open_time,
                close_time: market.close_time
            });
            toast.success(`Times Updated: ${market.name} schedule saved`);
            fetchMarkets();
        } catch (err) {
            toast.error(err.response?.data?.error || "Failed to update times");
        }
    };

    const confirmDeclareResult = async () => {
        const market = markets.find(m => m.id.toString() === selectedResultMarket);
        const num = winningNumber.padStart(2, '0');

        try {
            await axios.post(`${API_URL}/admin/declare-result/${market.id}`, {
                winning_number: num
            });

            // If success, get updated details
            toast.success(`${market.name}: Result ${num} declared`);

            // Re-fetch data
            fetchResults();
            fetchMarkets();

            setSuccessData({
                market: market,
                number: num,
                winners: '--', // Backend doesn't return payout calculations yet
                payout: '--'
            });

            setShowConfirmModal(false);
            setShowSuccessModal(true);
            setWinningNumber('');

        } catch (err) {
            toast.error(err.response?.data?.error || "Failed to declare result");
            setShowConfirmModal(false);
        }
    };

    const manualReset = () => {
        // Fallback info toast since backend handles it via cron
        toast.success('Backend Cron handles Daily reset automatically at 00:00.');
    };

    // Derived Data
    // We would ideally fetch these aggregates directly from backend, but simulating from fetched open data
    const totalBetsToday = liveBets.length; // Simplified, assuming liveBets API returns all today bets unpaginated for now
    const totalVolume = liveBets.reduce((acc, b) => acc + Number(b.amount), 0);
    const openMarkets = markets.filter(m => m.isOpen).length;

    // Filtering
    const filteredBets = filterMarket === 'all' ? liveBets : liveBets.filter(b => b.market_id.toString() === filterMarket);

    if (!isLoggedIn) {
        return (
            <div className="admin-wrapper">
                <div className="login-container">
                    <div className="login-card">
                        <div className="login-logo">
                            <div className="icon-circle">🎯</div>
                            <h1>Admin Panel</h1>
                            <p>Market Control Dashboard</p>
                        </div>

                        {loginError && (
                            <div className="login-error show">
                                <span>⚠️</span>
                                <span>Invalid credentials or unauthorized.</span>
                            </div>
                        )}

                        <form onSubmit={handleLogin}>
                            <div className="form-group">
                                <label>Admin Email / ID</label>
                                <div className="input-icon-wrap">
                                    <span className="input-icon">👤</span>
                                    <input type="text" className="form-input" placeholder="Admin Email" required value={email} onChange={e => setEmail(e.target.value)} />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Password</label>
                                <div className="input-icon-wrap">
                                    <span className="input-icon">🔒</span>
                                    <input type={showPassword ? 'text' : 'password'} className="form-input" placeholder="admin123" required value={password} onChange={e => setPassword(e.target.value)} />
                                    <button type="button" className="toggle-password" onClick={() => setShowPassword(!showPassword)}>👁️</button>
                                </div>
                            </div>

                            <button type="submit" className="btn btn-primary">Sign In to Dashboard</button>
                        </form>
                    </div>
                </div>
            </div>
        );
    }

    const renderSidebar = () => (
        <aside className="sidebar">
            <div className="sidebar-header">
                <div className="logo-icon">🎯</div>
                <div className="logo-text">
                    <h2>MarketHub</h2>
                    <span>Admin Panel</span>
                </div>
            </div>

            <nav className="sidebar-nav">
                <div className="nav-section-title">Main</div>
                <div className={`nav-item ${activePage === 'overview' ? 'active' : ''}`} onClick={() => setActivePage('overview')}><span className="nav-icon">📊</span><span>Overview</span></div>
                <div className={`nav-item ${activePage === 'markets' ? 'active' : ''}`} onClick={() => setActivePage('markets')}><span className="nav-icon">🏪</span><span>Market Control</span></div>
                <div className={`nav-item ${activePage === 'livefeed' ? 'active' : ''}`} onClick={() => setActivePage('livefeed')}>
                    <span className="nav-icon">📡</span><span>Live Monitoring</span>
                    <span className="nav-badge">{liveBets.length}</span>
                </div>
                <div className={`nav-item ${activePage === 'results' ? 'active' : ''}`} onClick={() => setActivePage('results')}><span className="nav-icon">🏆</span><span>Results</span></div>

                <div className="nav-section-title">System</div>
                <div className={`nav-item ${activePage === 'daily' ? 'active' : ''}`} onClick={() => setActivePage('daily')}><span className="nav-icon">🔄</span><span>Daily Reset</span></div>
                <div className="nav-item" onClick={() => navigate('/')}><span className="nav-icon">🏠</span><span>Back to App</span></div>
            </nav>

            <div className="sidebar-footer">
                <div className="admin-profile">
                    <div className="admin-avatar">A</div>
                    <div className="admin-info">
                        <div className="admin-name">Admin User</div>
                        <div className="admin-role">Super Admin</div>
                    </div>
                </div>
            </div>
        </aside>
    );

    const renderHeader = () => {
        const titles = {
            overview: ['Overview', 'Market statistics and activity'],
            markets: ['Market Control', 'Configure market open/close times'],
            livefeed: ['Live Monitoring', 'Real-time bet feed and tracking'],
            results: ['Results', 'Declare and manage results'],
            daily: ['Daily Reset', 'Day management and reset controls']
        };

        return (
            <header className="top-header">
                <div className="page-title-section">
                    <h1>{titles[activePage][0]}</h1>
                    <p>{titles[activePage][1]}</p>
                </div>
                <div className="header-actions">
                    <div className="header-time">
                        <span className="live-dot"></span>
                        <span>{currentTime}</span>
                    </div>
                    <button className="btn-icon">🔔<span className="notif-dot"></span></button>
                    <button className="btn-icon btn-logout" onClick={handleLogout}>🚪</button>
                </div>
            </header>
        );
    };

    return (
        <div className="admin-wrapper">
            <div className="dashboard active">
                {renderSidebar()}
                <main className="main-content">
                    {renderHeader()}

                    <div className="content-area">
                        {/* OVERVIEW PAGE */}
                        {activePage === 'overview' && (
                            <div className="page-section active">
                                <div className="stats-grid">
                                    <div className="stat-card card-purple"><div className="stat-icon">📈</div><div className="stat-value">{totalBetsToday.toLocaleString()}</div><div className="stat-label">Total Bets Today</div></div>
                                    <div className="stat-card card-teal"><div className="stat-icon">💰</div><div className="stat-value">₹{(totalVolume / 1000).toFixed(1)}k</div><div className="stat-label">Total Volume</div></div>
                                    <div className="stat-card card-pink"><div className="stat-icon">👥</div><div className="stat-value">{activeUsers.length}</div><div className="stat-label">Active Users</div></div>
                                    <div className="stat-card card-green"><div className="stat-icon">✅</div><div className="stat-value">{openMarkets}/{markets.length}</div><div className="stat-label">Markets Open</div></div>
                                </div>

                                <div className="section-header"><h2><span className="section-icon">🏪</span> Market Status</h2></div>
                                <div className="market-grid">
                                    {markets.map((m, idx) => (
                                        <div key={m.id} className="market-card">
                                            <div className="market-card-header">
                                                <div className="market-name-group">
                                                    <div className={`market-dot ${m.isOpen ? 'open' : 'closed'}`}></div>
                                                    <span className="market-name">{m.emoji} {m.name}</span>
                                                </div>
                                                <span className={`market-status-badge ${m.isOpen ? 'open' : 'closed'}`}>{m.status}</span>
                                            </div>
                                            <div className="market-card-body">
                                                <div className="market-stats-row" style={{ borderTop: 'none', paddingTop: 0 }}>
                                                    <div className="market-stat-item"><div className="ms-value text-sm whitespace-nowrap">{m.open_time} - {m.close_time}</div><div className="ms-label">Hours</div></div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="live-section">
                                    <div className="live-section-header">
                                        <div className="live-title-group">
                                            <h3>Recent Activity</h3>
                                            <div className="live-indicator"><span className="blink"></span>LIVE</div>
                                        </div>
                                    </div>
                                    <div className="table-wrapper" style={{ maxHeight: '300px' }}>
                                        <table className="data-table">
                                            <thead><tr><th>User Info</th><th>Market</th><th>Number</th><th>Amount</th><th>Type</th><th>Time</th></tr></thead>
                                            <tbody>
                                                {liveBets.slice(0, 5).map((bet, i) => (
                                                    <tr key={bet.id}>
                                                        <td><div className="user-cell"><div className="user-avatar-sm" style={{ background: `#6C5CE720`, color: `#6C5CE7` }}>U</div><div className="user-details-sm"><div className="user-name-sm">{bet.mobile}</div></div></div></td>
                                                        <td><span className={`market-badge m${(i % 3) + 1}`}>{bet.market_name}</span></td>
                                                        <td><span className="bet-number">{bet.number}</span></td>
                                                        <td><span className="bet-amount">₹{Number(bet.amount).toLocaleString()}</span></td>
                                                        <td style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{bet.bet_type}</td>
                                                        <td><span className="time-stamp">{new Date(bet.created_at).toLocaleTimeString()}</span></td>
                                                    </tr>
                                                ))}
                                                {liveBets.length === 0 && <tr><td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No recent activity</td></tr>}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* MARKET CONTROL PAGE */}
                        {activePage === 'markets' && (
                            <div className="page-section active">
                                <div className="section-header"><h2><span className="section-icon">🏪</span> Market Configuration</h2></div>
                                <div className="market-grid">
                                    {markets.map(m => (
                                        <div key={m.id} className="market-card">
                                            <div className="market-card-header">
                                                <div className="market-name-group">
                                                    <div className={`market-dot ${m.isOpen ? 'open' : 'closed'}`}></div>
                                                    <span className="market-name">{m.emoji} {m.name}</span>
                                                </div>
                                                <span className={`market-status-badge ${m.status === 'open' ? 'open' : 'closed'}`}>{m.status}</span>
                                            </div>
                                            <div className="market-card-body">
                                                <div className="time-controls">
                                                    <div className="time-control"><label>Open Time</label><input type="time" step="1" value={m.open_time} onChange={e => updateMarketTimeState(m.id, 'open_time', e.target.value)} /></div>
                                                    <div className="time-control"><label>Close Time</label><input type="time" step="1" value={m.close_time} onChange={e => updateMarketTimeState(m.id, 'close_time', e.target.value)} /></div>
                                                </div>
                                            </div>
                                            <div className="market-card-footer">
                                                <button className="btn-sm btn-save" onClick={() => saveMarketTime(m)}>💾 Save Times</button>
                                                <button className={`btn-sm btn-toggle-market ${!m.isOpen ? 'open-btn' : ''}`} onClick={() => toggleMarket(m.id, m.status)}>
                                                    {m.isOpen ? '🔒 Close Market' : '🔓 Open Market'}
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* LIVE FEED PAGE */}
                        {activePage === 'livefeed' && (
                            <div className="page-section active">
                                <div className="daily-reset-panel">
                                    <div className="reset-info">
                                        <div className="reset-icon">📅</div>
                                        <div className="reset-details">
                                            <h3>Viewing: <span>{dateTab === 'today' ? "Today's Bets" : "Yesterday's Bets"}</span></h3>
                                            <p>The system automatically separates bets by day. New day starts at 00:00 with fresh market data.</p>
                                        </div>
                                        <div className="reset-actions">
                                            <div className="date-tabs">
                                                <div className={`date-tab ${dateTab === 'today' ? 'active' : ''}`} onClick={() => setDateTab('today')}>Today</div>
                                                <div className={`date-tab ${dateTab === 'yesterday' ? 'active' : ''}`} onClick={() => { setDateTab('yesterday'); toast.success('Viewing archived bets'); }}>Yesterday</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="live-section">
                                    <div className="live-section-header">
                                        <div className="live-title-group"><h3>Live Bet Feed</h3><div className="live-indicator"><span className="blink"></span>LIVE</div></div>
                                        <div className="table-filters">
                                            <select className="filter-select" value={filterMarket} onChange={e => setFilterMarket(e.target.value)}>
                                                <option value="all">All Markets</option>
                                                {markets.map(m => (
                                                    <option key={m.id} value={m.id}>{m.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="table-wrapper">
                                        <table className="data-table">
                                            <thead><tr><th>#ID</th><th>User Mobile</th><th>Market</th><th>Number</th><th>Amount</th><th>Type</th><th>Time</th></tr></thead>
                                            <tbody>
                                                {filteredBets.map((bet, i) => (
                                                    <tr key={bet.id} className={i === 0 && dateTab === 'today' ? 'new-row' : ''}>
                                                        <td style={{ color: 'var(--text-muted)', fontSize: '12px' }}>#{bet.id}</td>
                                                        <td><div className="user-cell"><div className="user-avatar-sm" style={{ background: `#00CEC920`, color: `#00CEC9` }}>U</div><div className="user-details-sm"><div className="user-name-sm">{bet.mobile}</div><div className="user-id-sm">ID: {bet.user_id}</div></div></div></td>
                                                        <td><span className={`market-badge m${(bet.market_id % 3) + 1}`}>{bet.market_name}</span></td>
                                                        <td><span className="bet-number">{bet.number}</span></td>
                                                        <td><span className="bet-amount">₹{Number(bet.amount).toLocaleString()}</span></td>
                                                        <td style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{bet.bet_type}</td>
                                                        <td><span className="time-stamp">{new Date(bet.created_at).toLocaleTimeString()}</span></td>
                                                    </tr>
                                                ))}
                                                {filteredBets.length === 0 && <tr><td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No bets found</td></tr>}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* RESULTS PAGE */}
                        {activePage === 'results' && (
                            <div className="page-section active">
                                <div className="result-grid">
                                    <div className="result-form-card">
                                        <div className="result-form-header"><h3>🏆 Declare Result</h3></div>
                                        <div className="result-form-body">
                                            <div className="market-select-group">
                                                <label>Select Market to Declare</label>
                                                <select
                                                    className="form-input"
                                                    style={{ width: '100%', marginBottom: '16px', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                                                    value={selectedResultMarket}
                                                    onChange={(e) => setSelectedResultMarket(e.target.value)}
                                                >
                                                    {markets.filter(m => m.status !== 'declared').map(m => (
                                                        <option key={m.id} value={m.id}>{m.emoji} {m.name}</option>
                                                    ))}
                                                </select>
                                                {markets.filter(m => m.status !== 'declared').length === 0 && (
                                                    <p style={{ fontSize: '12px', color: 'var(--warning)', margin: '4px 0 16px', fontStyle: 'italic' }}>All markets are already declared or none available.</p>
                                                )}
                                            </div>

                                            <div className="winning-number-input">
                                                <label>Winning Number (Jodi/Single Digit/Panna code)</label>
                                                <input type="text" className="number-input-large" placeholder="Enter number" maxLength="3" value={winningNumber} onChange={e => setWinningNumber(e.target.value.replace(/\D/g, ''))} />
                                            </div>

                                            <button className="btn-declare" disabled={!winningNumber || !selectedResultMarket} onClick={() => setShowConfirmModal(true)}>⚡ Declare Result</button>
                                        </div>
                                    </div>

                                    <div className="result-history-card">
                                        <div className="result-history-header"><h3>📋 Recent Results</h3></div>
                                        <div className="result-history-body">
                                            {resultHistory.map((r, i) => (
                                                <div key={r.id || i} className="result-item">
                                                    <div className={`result-number-big r-purple`}>{r.winning_number}</div>
                                                    <div className="result-details">
                                                        <div className="rd-market">{r.market_name}</div>
                                                        <div className="rd-date">{new Date(r.declared_at).toLocaleString()}</div>
                                                    </div>
                                                </div>
                                            ))}
                                            {resultHistory.length === 0 && (
                                                <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '20px' }}>No results declared yet.</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* DAILY RESET PAGE */}
                        {activePage === 'daily' && (
                            <div className="page-section active">
                                <div className="daily-reset-panel" style={{ marginBottom: '24px' }}>
                                    <div className="reset-info">
                                        <div className="reset-icon">🔄</div>
                                        <div className="reset-details">
                                            <h3>Daily Reset System</h3>
                                            <p>The system automatically resets at midnight (00:00) using a backend Cron job. All markets open fresh, and yesterday's bets are archived. (Manual reset is handled internally bounds).</p>
                                        </div>
                                        <div className="reset-actions">
                                            <button className="btn btn-primary" onClick={manualReset} style={{ whiteSpace: 'nowrap' }}>🔄 Info</button>
                                        </div>
                                    </div>
                                </div>

                                <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
                                    <div className="stat-card card-purple"><div className="stat-icon">📅</div><div className="stat-value">{totalBetsToday.toLocaleString()}</div><div className="stat-label">Today's Total Live Bets Recorded</div></div>
                                    <div className="stat-card card-green"><div className="stat-icon">⏰</div><div className="stat-value">{nextResetTime}</div><div className="stat-label">Next Auto Server Reset</div></div>
                                </div>
                            </div>
                        )}

                    </div>
                </main>
            </div>

            {/* Modals */}
            {showConfirmModal && (
                <div className="modal-overlay show">
                    <div className="modal">
                        <div className="modal-icon warning">⚠️</div>
                        <h3>Confirm Result Declaration</h3>
                        <p>You are about to declare the winning number for Target Market ID: <b>{selectedResultMarket}</b></p>
                        <div className="modal-highlight">{winningNumber}</div>
                        <p style={{ color: 'var(--danger)', fontSize: '12px' }}>⚠️ This action will mark this market as 'declared' and store the result. Cannot be undone implicitly.</p>
                        <div className="modal-actions">
                            <button className="btn btn-cancel" onClick={() => setShowConfirmModal(false)}>Cancel</button>
                            <button className="btn btn-confirm" onClick={confirmDeclareResult}>Confirm & Declare</button>
                        </div>
                    </div>
                </div>
            )}

            {showSuccessModal && successData && (
                <div className="modal-overlay show">
                    <div className="modal success-modal">
                        <div className="modal-icon success">✅</div>
                        <h3>Result Declared Successfully!</h3>
                        <div className="modal-number-display">{successData.number}</div>
                        <p>{successData.market?.name}</p>
                        <div className="modal-actions" style={{ justifyContent: 'center', marginTop: '24px' }}>
                            <button className="btn btn-primary" onClick={() => setShowSuccessModal(false)} style={{ maxWidth: '200px' }}>Done</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
