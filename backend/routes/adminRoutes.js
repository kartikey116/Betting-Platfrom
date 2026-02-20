const express = require('express');
const router = express.Router();
const { getLiveBets, declareResult, updateMarketTimings } = require('../controllers/adminController');
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');

router.use(authMiddleware, adminMiddleware);

router.get('/live-bets', getLiveBets);
router.post('/declare-result', declareResult);
router.put('/market-timing', updateMarketTimings);

module.exports = router;
