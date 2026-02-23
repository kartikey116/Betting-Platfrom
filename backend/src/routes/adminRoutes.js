const express = require('express');
const router = express.Router();
const { getMarkets,
    updateMarketStatus,
    declareResult,
    liveBets,
    marketStats,
    updateMarketTime,
    getTodayBets,
    getYesterdayBets,
    getBetsByDate,
    getResults,
    getActiveUsers
} = require('../controllers/adminController');
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');

router.use(authMiddleware, adminMiddleware);

router.get('/markets', getMarkets);
router.patch('/market-status/:marketId', updateMarketStatus);
router.post('/declare-result/:marketId', declareResult);
router.get('/live-bets', liveBets);
router.get('/market-stats/:marketId', marketStats);
router.patch('/market-time/:marketId', updateMarketTime);
router.get('/today-bets', getTodayBets);
router.get('/yesterday-bets', getYesterdayBets);
router.get('/bets-by-date/:date', getBetsByDate);
router.get('/results', getResults);
router.get('/active-users', getActiveUsers);

module.exports = router;
