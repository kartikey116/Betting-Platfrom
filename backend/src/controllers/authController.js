const jwt = require("jsonwebtoken");
const db = require("../db/config");

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_key";
const INITIAL_WALLET_BALANCE = 50000;

// In-memory OTP store
const otpStore = new Map();



/* ===============================
   SEND OTP
================================ */
exports.sendOtp = async (req, res) => {
  const { mobile } = req.body;

  if (!mobile || !/^\d{10}$/.test(mobile))
    return res.status(400).json({ error: "Valid mobile required" });

  const otp = Math.floor(100000 + Math.random() * 900000);

  otpStore.set(mobile, {
    otp,
    expires: Date.now() + 5 * 60 * 1000 // 5 min
  });

  console.log("OTP for", mobile, "=", otp);

  res.json({ message: "OTP sent (check console)" });
};



/* ===============================
   LOGIN / VERIFY OTP
================================ */
exports.login = async (req, res) => {
  const { mobile, otp } = req.body;

  if (!mobile || !otp)
    return res.status(400).json({ error: "Mobile and OTP required" });

  try {
    const record = otpStore.get(mobile);

    if (!record)
      return res.status(400).json({ error: "OTP expired" });

    if (record.otp != otp)
      return res.status(400).json({ error: "Invalid OTP" });

    if (Date.now() > record.expires)
      return res.status(400).json({ error: "OTP expired" });

    otpStore.delete(mobile);

    // find user
    let { rows } = await db.query(
      "SELECT * FROM users WHERE mobile = $1",
      [mobile]
    );

    let user = rows[0];

    // auto create user
    if (!user) {
      const result = await db.query(
        `INSERT INTO users (mobile, wallet_balance, role)
         VALUES ($1,$2,$3)
         RETURNING *`,
        [mobile, INITIAL_WALLET_BALANCE, "user"]
      );

      user = result.rows[0];
    }

    // create token
    const token = jwt.sign(
      {
        id: user.id,
        mobile: user.mobile,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login successful",
      token,
      user
    });

  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Server error" });
  }
};



/* ===============================
   ADMIN LOGIN
================================ */
exports.adminLogin = async (req, res) => {
  const { email, password } = req.body;

  if (
    email === process.env.ADMIN_EMAIL &&
    password === process.env.ADMIN_PASS
  ) {
    const token = jwt.sign(
      { role: "admin", email },
      JWT_SECRET,
      { expiresIn: "1d" }
    );

    return res.json({
      message: "Admin login success",
      token,
      role: "admin"
    });
  }

  res.status(401).json({ error: "Invalid credentials" });
};



/* ===============================
   GET PROFILE
================================ */
exports.getProfile = async (req, res) => {
  try {
    const { id } = req.user;

    const { rows } = await db.query(
      "SELECT id,mobile,wallet_balance,role FROM users WHERE id=$1",
      [id]
    );

    res.json(rows[0]);

  } catch (err) {
    res.status(500).json({ error: "Failed to fetch profile" });
  }
};