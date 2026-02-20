const db = require('../db/config');

/**
 * Get all markets with their status and countdown timings
 */
const getMarkets = async (req, res) => {
    try {
        const { rows } = await db.query('SELECT * FROM markets ORDER BY id ASC');

        const currentTime = new Date();
        // Indian Standard Time (IST) offset is UTC+5:30. Let's just use server local time
        // Server should ideally use local time matching the strings '09:00:00' etc.
        const currentHours = currentTime.getHours();
        const currentMinutes = currentTime.getMinutes();
        const currentSeconds = currentTime.getSeconds();

        // Time helper to convert HH:MM:SS to seconds from midnight
        const timeToSeconds = (timeStr) => {
            const [h, m, s] = timeStr.split(':').map(Number);
            return h * 3600 + m * 60 + s;
        };

        const nowSeconds = currentHours * 3600 + currentMinutes * 60 + currentSeconds;

        const marketsWithStatus = rows.map(market => {
            const openSecs = timeToSeconds(market.open_time);
            const closeSecs = timeToSeconds(market.close_time);

            let currentStatus = market.status; // Can be manually overridden by admin to 'declared' or 'closed'
            let countdown = 0; // seconds until close if open, or seconds until open if closed

            if (currentStatus === 'open') {
                if (nowSeconds >= openSecs && nowSeconds <= closeSecs) {
                    currentStatus = 'open';
                    countdown = closeSecs - nowSeconds;
                } else if (nowSeconds < openSecs) {
                    currentStatus = 'closed'; // Upcoming
                    countdown = openSecs - nowSeconds;
                } else {
                    currentStatus = 'closed'; // Passed
                    countdown = 0;
                }
            }

            return {
                id: market.id,
                name: market.name,
                open_time: market.open_time,
                close_time: market.close_time,
                status: currentStatus,
                countdown
            };
        });

        res.json(marketsWithStatus);
    } catch (error) {
        console.error('Error fetching markets:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = { getMarkets };
