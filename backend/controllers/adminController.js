const db = require('../db/config');

/**
 * Get all active bets for admin view
 */
const getLiveBets = async (req, res) => {
    try {
        const { rows } = await db.query(
            `SELECT b.*, m.name as market_name, u.mobile 
       FROM bets b
       JOIN markets m ON b.market_id = m.id
       JOIN users u ON b.user_id = u.id
       WHERE b.status = 'pending'
       ORDER BY b.created_at DESC LIMIT 500`
        );
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * Declare result for a market and distribute winnings
 */
const declareResult = async (req, res) => {
    const { marketId, winningNumber, date } = req.body;

    const client = await db.getClient();
    try {
        await client.query('BEGIN');

        // 1. Insert result
        await client.query(
            `INSERT INTO results (market_id, date, winning_number) 
       VALUES ($1, $2, $3)
       ON CONFLICT (market_id, date) DO UPDATE SET winning_number = $3`,
            [marketId, date, winningNumber]
        );

        // 2. Update market status
        await client.query(`UPDATE markets SET status = 'declared' WHERE id = $1`, [marketId]);

        // 3. Mark winning bets and distribute money
        // (A real app would have different multipliers depending on betType. E.g., single=9x, jodi=90x, panna=140x)
        const winningBetsRes = await client.query(
            `UPDATE bets SET status = 'won' 
       WHERE market_id = $1 AND selected_number = $2 AND status = 'pending' 
       RETURNING id, user_id, amount, bet_type`,
            [marketId, winningNumber]
        );

        for (let bet of winningBetsRes.rows) {
            let multiplier = 9; // default single digit 
            if (bet.bet_type === 'jodi') multiplier = 90;
            else if (bet.bet_type.includes('panna')) multiplier = 140;

            const wonAmount = bet.amount * multiplier;

            await client.query(
                `UPDATE users SET wallet_balance = wallet_balance + $1 WHERE id = $2`,
                [wonAmount, bet.user_id]
            );
        }

        // 4. Mark other pending bets as lost
        await client.query(
            `UPDATE bets SET status = 'lost' WHERE market_id = $1 AND status = 'pending'`,
            [marketId]
        );

        await client.query('COMMIT');
        res.json({ message: 'Result declared successfully, wallets updated.' });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Declare result error:', error);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        client.release();
    }
};

/**
 * Edit market timings manually
 */
const updateMarketTimings = async (req, res) => {
    const { marketId, openTime, closeTime, status } = req.body;

    try {
        await db.query(
            `UPDATE markets SET open_time = $1, close_time = $2, status = $3 WHERE id = $4`,
            [openTime, closeTime, status, marketId]
        );
        res.json({ message: 'Market updated successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = { getLiveBets, declareResult, updateMarketTimings };
