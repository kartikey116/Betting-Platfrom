const db = require("../db/config");

exports.getWallet = async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT wallet_balance 
       FROM users 
       WHERE id = $1`,
      [req.user.id]
    );

    if (!rows.length)
      return res.status(404).json({ error: "User not found" });

    res.json({
      balance: rows[0].wallet_balance
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch wallet" });
  }
};