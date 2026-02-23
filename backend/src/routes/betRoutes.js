const express = require('express');
const router = express.Router();
const { placeBet, getUserBets } = require('../controllers/betController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.post('/place', authMiddleware, placeBet);
router.get('/history', authMiddleware, getUserBets);

module.exports = router;
