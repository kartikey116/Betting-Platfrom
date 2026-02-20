const jwt = require('jsonwebtoken');
const db = require('../db/config');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key';
const INITIAL_WALLET_BALANCE = 50000; // ₹50,000 as requested

/**
 * Mock OTP Login for Mobile
 * In a real app, you'd verify an OTP sent via SMS. Here, any 6-digit OTP logs user in.
 */
const login = async (req, res) => {
    const { mobile, otp } = req.body;

    if (!mobile || mobile.length < 10) {
        return res.status(400).json({ error: 'Valid mobile number required' });
    }

    if (!otp || otp.length < 4) {
        return res.status(400).json({ error: 'OTP is required' });
    }

    try {
        // Check if user exists
        let { rows } = await db.query('SELECT * FROM users WHERE mobile = $1', [mobile]);
        let user = rows[0];

        // Auto-create user if not exists
        if (!user) {
            const insertResult = await db.query(
                'INSERT INTO users (mobile, wallet_balance, role) VALUES ($1, $2, $3) RETURNING *',
                [mobile, INITIAL_WALLET_BALANCE, 'user']
            );
            user = insertResult.rows[0];
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: user.id, mobile: user.mobile, role: user.role },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                mobile: user.mobile,
                wallet_balance: user.wallet_balance,
                role: user.role
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * Admin Login
 */
const adminLogin = async (req, res) => {
    const { email, password } = req.body;

    // Hardcoded admin credentials for simplicity 
    // In production, fetch from DB and compare hashed password
    if (email === 'admin@betting.com' && password === 'admin123') {
        const token = jwt.sign(
            { id: 9999, mobile: 'admin', role: 'admin' },
            JWT_SECRET,
            { expiresIn: '1d' }
        );

        return res.json({
            message: 'Admin login successful',
            token,
            user: { id: 9999, role: 'admin' }
        });
    }

    res.status(401).json({ error: 'Invalid admin credentials' });
};

module.exports = { login, adminLogin };
