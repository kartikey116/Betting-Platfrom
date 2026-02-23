const cron = require("node-cron");
const db = require("../db/config");

cron.schedule("0 0 * * *", async () => {
  console.log("Running daily market reset...");

  try {
    await db.query(`
      UPDATE markets
      SET status='open'
      WHERE status!='open'
    `);

    console.log("Markets reset successful");

  } catch (err) {
    console.error("Reset failed:", err);
  }
});