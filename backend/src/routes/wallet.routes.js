const router = require("express").Router();
const { authMiddleware } = require("../middleware/authMiddleware");
const { getWallet } = require("../controllers/wallet.controller");

router.get("/", authMiddleware, getWallet);

module.exports = router;