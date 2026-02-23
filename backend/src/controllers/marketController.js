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
          WHEN CURRENT_TIME::time BETWEEN open_time AND close_time THEN 'open'
          WHEN CURRENT_TIME::time < open_time THEN 'upcoming'
          ELSE 'closed'
        END AS computed_status,

        GREATEST(
          EXTRACT(EPOCH FROM (
            CASE
              WHEN CURRENT_TIME BETWEEN open_time AND close_time
              THEN close_time - CURRENT_TIME
              WHEN CURRENT_TIME < open_time
              THEN open_time - CURRENT_TIME
              ELSE INTERVAL '0'
            END
          )),0
        ) AS countdown

      FROM markets
      ORDER BY id;
    `);

    res.json(rows);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch markets" });
  }
};

module.exports = { getMarkets };