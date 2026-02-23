const db = require("../db/config");
const { validateBet, normalizeNumber } = require("../utils/panna.js");

/* ===============================
   PLACE BET
================================ */
const placeBet = async (req, res) => {
  const { marketId, betType, selectedNumber, amount } = req.body;
  const userId = req.user.id;

  /* ---------- Basic Validation ---------- */

  if (!marketId || !betType || !selectedNumber || !amount)
    return res.status(400).json({ error: "All fields required" });

  if (amount <= 0)
    return res.status(400).json({ error: "Invalid amount" });

  if (amount > 100000)
    return res.status(400).json({ error: "Amount too large" });

  /* ---------- Game Type Validation ---------- */

  const validationError = validateBet(betType, selectedNumber);

  if (validationError)
    return res.status(400).json({ error: validationError });

  /* ---------- Normalize Number ---------- */

  const finalNumber = normalizeNumber(betType, selectedNumber);

  try {

    /* ---------- Call DB Transaction Function ---------- */

    await db.query(
      `SELECT place_bet($1,$2,$3,$4,$5)`,
      [userId, marketId, betType, finalNumber, amount]
    );

    res.json({
      success: true,
      message: "Bet placed successfully",
      number: finalNumber
    });

  } catch (err) {

    console.error("Bet Error:", err.message);

    /* ---------- Known DB Errors ---------- */

    if (
      err.message.includes("Insufficient") ||
      err.message.includes("closed") ||
      err.message.includes("inactive") ||
      err.message.includes("Invalid")
    ) {
      return res.status(400).json({ error: err.message });
    }

    res.status(500).json({ error: "Failed to place bet" });
  }
};



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