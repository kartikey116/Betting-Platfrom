const db = require('../db/config');
const { sortPanna } = require('../utils/panna');

/**
 * Place a bet
 */
const placeBet = async (req, res) => {
    const { marketId, betType, selectedNumber, amount } = req.body;
    const userId = req.user.id;

    if (amount <= 0) {
        return res.status(400).json({ error: 'Amount must be greater than zero' });
    }

    const client = await db.getClient();

    try {
        await client.query('BEGIN');

        // 1. Check if user has sufficient balance (Lock row for update)
        const userRes = await client.query('SELECT wallet_balance FROM users WHERE id = $1 FOR UPDATE', [userId]);
        const walletBalance = parseFloat(userRes.rows[0].wallet_balance);

        if (walletBalance < amount) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'Insufficient wallet balance' });
        }

        // 2. Check if market is actually open right now
        const marketRes = await client.query('SELECT open_time, close_time, status FROM markets WHERE id = $1', [marketId]);
        if (marketRes.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Market not found' });
        }

        const market = marketRes.rows[0];
        if (market.status !== 'open') {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'Market is not currently open for bets' });
        }

        // Check time limits
        const currentTime = new Date();
        const currentSeconds = currentTime.getHours() * 3600 + currentTime.getMinutes() * 60 + currentTime.getSeconds();
        const timeToSeconds = (timeStr) => {
            const [h, m, s] = timeStr.split(':').map(Number);
            return h * 3600 + m * 60 + s;
        };
        const openSecs = timeToSeconds(market.open_time);
        const closeSecs = timeToSeconds(market.close_time);

        if (currentSeconds < openSecs || currentSeconds > closeSecs) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'Market is closed based on time' });
        }

        // 3. Process Panna Rule (Sorting selected number if it is a Panna bet type)
        let finalNumber = selectedNumber;
        if (['single_panna', 'double_panna', 'triple_panna'].includes(betType)) {
            finalNumber = sortPanna(selectedNumber);
        }

        // 4. Deduct Balance
        const newBalance = walletBalance - amount;
        await client.query('UPDATE users SET wallet_balance = $1 WHERE id = $2', [newBalance, userId]);

        // 5. Insert Bet
        const betRes = await client.query(
            `INSERT INTO bets (user_id, market_id, bet_type, selected_number, amount) 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [userId, marketId, betType, finalNumber, amount]
        );

        await client.query('COMMIT');

        res.json({
            message: 'Bet placed successfully!',
            bet: betRes.rows[0],
            newBalance
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error placing bet:', error);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        client.release();
    }
};

/**
 * Get user bets
 */
const getUserBets = async (req, res) => {
    try {
        const { rows } = await db.query(
            `SELECT b.*, m.name as market_name 
       FROM bets b 
       JOIN markets m ON b.market_id = m.id 
       WHERE b.user_id = $1 
       ORDER BY b.created_at DESC`,
            [req.user.id]
        );
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = { placeBet, getUserBets };
