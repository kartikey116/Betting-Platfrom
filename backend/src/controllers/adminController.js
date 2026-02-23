const db = require("../db/config");


/* ===============================
   GET ALL MARKETS (WITH REAL STATUS)
================================ */
exports.getMarkets = async (req, res) => {
  try {

    const { rows } = await db.query(`
  SELECT id,name,open_time,close_time,is_active,

  CASE
    WHEN is_active=false THEN 'closed'
    WHEN (NOW() AT TIME ZONE 'Asia/Kolkata')::time BETWEEN open_time AND close_time THEN 'open'
    WHEN (NOW() AT TIME ZONE 'Asia/Kolkata')::time < open_time THEN 'upcoming'
    ELSE 'closed'
  END AS real_status

  FROM markets
  ORDER BY id
`);
    res.json(rows);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch markets" });
  }
};



/* ===============================
   TOGGLE MARKET ACTIVE
================================ */
exports.updateMarketStatus = async (req, res) => {
  const { marketId } = req.params;
  const { is_active, status } = req.body;

  let value;

  if (typeof is_active === "boolean") {
    value = is_active;
  } else if (status) {
    value = status === "open";
  } else {
    return res.status(400).json({ error: "Invalid payload" });
  }

  try {
    await db.query(
      "UPDATE markets SET is_active=$1 WHERE id=$2",
      [value, marketId]
    );

    res.json({ message: "Market status updated" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update market status" });
  }
};



/* ===============================
   UPDATE MARKET TIMINGS
================================ */
exports.updateMarketTime = async (req, res) => {
  const { marketId } = req.params;
  const { open_time, close_time } = req.body;

  if (!open_time || !close_time)
    return res.status(400).json({ error: "Open and close time required" });

  const regex = /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/;

  if (!regex.test(open_time) || !regex.test(close_time))
    return res.status(400).json({ error: "Invalid time format HH:MM:SS" });

  if (open_time >= close_time)
    return res.status(400).json({ error: "Open time must be before close time" });

  try {

    const result = await db.query(
      `UPDATE markets
       SET open_time=$1,
           close_time=$2
       WHERE id=$3
       RETURNING *`,
      [open_time, close_time, marketId]
    );

    if (!result.rows.length)
      return res.status(404).json({ error: "Market not found" });

    res.json({
      message: "Market time updated",
      market: result.rows[0]
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update market time" });
  }
};



/* ===============================
   DECLARE RESULT
================================ */
exports.declareResult = async (req, res) => {
  const { marketId } = req.params;
  const { winning_number } = req.body;

  if (!winning_number)
    return res.status(400).json({ error: "Winning number required" });

  try {

    await db.query("BEGIN");

    /* prevent duplicate result same day */

    const exists = await db.query(`
  SELECT 1
  FROM results
  WHERE market_id=$1
  AND (declared_at AT TIME ZONE 'Asia/Kolkata')::date = CURRENT_DATE
`, [marketId]);

    if (exists.rows.length) {
      await db.query("ROLLBACK");
      return res.status(400).json({ error: "Result already declared today" });
    }

    /* insert result */

    await db.query(
      `INSERT INTO results(market_id,winning_number)
       VALUES ($1,$2)`,
      [marketId, winning_number]
    );

    /* close market */

    await db.query(
      "UPDATE markets SET is_active=false WHERE id=$1",
      [marketId]
    );

    await db.query("COMMIT");

    res.json({ message: "Result declared successfully" });

  } catch (err) {
    await db.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ error: "Failed to declare result" });
  }
};



/* ===============================
   LIVE BET FEED
================================ */
exports.liveBets = async (req, res) => {
  try {

    const { rows } = await db.query(`
      SELECT b.id, b.user_id, b.market_id, b.bet_type, b.amount,
             b.created_at, b.bet_number AS number, b.status,
             u.phone AS mobile, m.name AS market_name
      FROM bets b
      JOIN users u ON u.id=b.user_id
      JOIN markets m ON m.id=b.market_id
      ORDER BY b.created_at DESC
      LIMIT 50
    `);

    res.json(rows);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch bets" });
  }
};



/* ===============================
   MARKET STATS
================================ */
exports.marketStats = async (req, res) => {
  const { marketId } = req.params;

  try {

    const { rows } = await db.query(`
      SELECT
        COUNT(*) AS total_bets,
        COALESCE(SUM(amount),0) AS total_amount
      FROM bets
      WHERE market_id=$1
    `, [marketId]);

    res.json(rows[0]);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed stats" });
  }
};



/* ===============================
   TODAY BETS
================================ */
exports.getTodayBets = async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT b.id,b.user_id,b.market_id,b.bet_type,b.amount,
       b.created_at,b.bet_number AS number,b.status,
       u.phone AS mobile,m.name AS market_name
FROM bets b
JOIN users u ON u.id=b.user_id
JOIN markets m ON m.id=b.market_id
WHERE (b.created_at AT TIME ZONE 'Asia/Kolkata')::date = CURRENT_DATE
ORDER BY b.created_at DESC;
    `);

    res.json(rows);

  } catch (err) {
    console.error("TODAY BET ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};



/* ===============================
   YESTERDAY BETS
================================ */
exports.getYesterdayBets = async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT b.id,b.user_id,b.market_id,b.bet_type,b.amount,
             b.created_at,b.bet_number AS number,b.status,
             u.phone AS mobile,m.name AS market_name
      FROM bets b
      JOIN users u ON u.id=b.user_id
      JOIN markets m ON m.id=b.market_id
      WHERE (b.created_at AT TIME ZONE 'Asia/Kolkata')::date = CURRENT_DATE - 1
      ORDER BY b.created_at DESC
    `);

    res.json(rows);

  } catch (err) {
    console.error("YESTERDAY BET ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};


/* ===============================
   BETS BY DATE
================================ */
exports.getBetsByDate = async (req, res) => {
  const { date } = req.params;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date))
    return res.status(400).json({ error: "Invalid date format YYYY-MM-DD" });

  try {

    const { rows } = await db.query(`
      SELECT b.id,b.user_id,b.market_id,b.bet_type,b.amount,
             b.created_at,b.bet_number AS number,b.status,
             u.phone AS mobile,m.name AS market_name
      FROM bets b
      JOIN users u ON u.id=b.user_id
      JOIN markets m ON m.id=b.market_id
     WHERE (b.created_at AT TIME ZONE 'Asia/Kolkata')::date = $1
      ORDER BY b.created_at DESC
    `, [date]);

    res.json(rows);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch bets" });
  }
};



/* ===============================
   RESULT HISTORY
================================ */
exports.getResults = async (req, res) => {
  try {

    const { rows } = await db.query(`
      SELECT r.id,r.winning_number,r.declared_at,
             m.name AS market_name
      FROM results r
      JOIN markets m ON m.id=r.market_id
      ORDER BY r.declared_at DESC
    `);

    res.json(rows);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch results" });
  }
};



/* ===============================
   ACTIVE USERS TODAY
================================ */
exports.getActiveUsers = async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT DISTINCT u.id, u.phone AS mobile, u.wallet_balance
FROM users u
JOIN bets b ON b.user_id = u.id
WHERE (b.created_at AT TIME ZONE 'Asia/Kolkata')::date = CURRENT_DATE
ORDER BY u.id DESC;
    `);

    res.json(rows);

  } catch (err) {
    console.error("ACTIVE USER ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};