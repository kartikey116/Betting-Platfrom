const db = require("../db/config");
const { validateBet, normalizeNumber } = require("../utils/panna.js");

/* ===============================
   PLACE BET
================================ */
const placeBet = async (req, res) => {
  const { marketId, betType, selectedNumber, amount } = req.body;
  const userId = req.user.id;

  if (!marketId || !betType || !selectedNumber || !amount)
    return res.status(400).json({ error: "All fields required" });

  if (amount <= 0 || amount > 100000)
    return res.status(400).json({ error: "Invalid amount" });

  const validationError = validateBet(betType, selectedNumber);
  if (validationError)
    return res.status(400).json({ error: validationError });

  const finalNumber = normalizeNumber(betType, selectedNumber);

  try {

    await db.query(
      `SELECT place_bet($1,$2,$3,$4,$5)`,
      [userId, marketId, betType, finalNumber, amount]
    );

    res.json({
      success: true,
      number: finalNumber
    });

  } catch (err) {
    console.error("BET ERROR:", err.message);

    if (
      err.message.includes("Insufficient") ||
      err.message.includes("closed") ||
      err.message.includes("inactive")
    ) {
      return res.status(400).json({ error: err.message });
    }

    res.status(500).json({ error: "Failed to place bet" });
  }
};

module.exports = { placeBet };



/* ===============================
   USER BET HISTORY
================================ */
const getUserBets = async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT b.*, m.name AS market_name
       FROM bets b
       JOIN markets m ON m.id = b.market_id
       WHERE b.user_id = $1
       ORDER BY b.created_at DESC`,
      [req.user.id]
    );

    res.json(rows);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch bets" });
  }
};

module.exports = { placeBet, getUserBets };