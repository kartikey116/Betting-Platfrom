const db = require("../db/config");

const getMarkets = async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT
        id,
        name,
        open_time,
        close_time,
        status,

        CASE
          WHEN status='declared' THEN 'closed'
          WHEN (NOW() AT TIME ZONE 'Asia/Kolkata')::time BETWEEN open_time AND close_time THEN 'open'
          WHEN (NOW() AT TIME ZONE 'Asia/Kolkata')::time < open_time THEN 'upcoming'
          ELSE 'closed'
        END AS computed_status,

        GREATEST(
          EXTRACT(EPOCH FROM (
            CASE
              WHEN (NOW() AT TIME ZONE 'Asia/Kolkata')::time BETWEEN open_time AND close_time
              THEN close_time - (NOW() AT TIME ZONE 'Asia/Kolkata')::time
              WHEN (NOW() AT TIME ZONE 'Asia/Kolkata')::time < open_time
              THEN open_time - (NOW() AT TIME ZONE 'Asia/Kolkata')::time
              ELSE INTERVAL '0'
            END
          )),0
        ) AS countdown

      FROM markets
      ORDER BY id;
    `);

    res.json(rows);

  } catch (err) {
    console.error("MARKET FETCH ERROR:", err);
    res.status(500).json({ error: "Failed to fetch markets" });
  }
};

module.exports = { getMarkets };