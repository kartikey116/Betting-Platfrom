const express = require('express');
const router = express.Router();
const { getMarkets } = require('../controllers/marketController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.get('/', authMiddleware, getMarkets);

module.exports = router;
