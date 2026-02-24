const jwt = require("jsonwebtoken");
const db = require("../db/config");

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_key";
const INITIAL_WALLET_BALANCE = 50000;

// In-memory OTP store
const otpStore = new Map();


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



/*LOGIN / VERIFY OTP */
// exports.login = async (req, res) => {
//   const { mobile, otp } = req.body;

//   if (!mobile || !otp)
//     return res.status(400).json({ error: "Mobile and OTP required" });

//   try {
//       const record = otpStore.get(mobile);

//       if (!record)
//         return res.status(400).json({ error: "OTP expired" });

//       if (record.otp != otp)
//         return res.status(400).json({ error: "Invalid OTP" });

//       if (Date.now() > record.expires)
//         return res.status(400).json({ error: "OTP expired" });

//       otpStore.delete(mobile);

//     // find user
//     let { rows } = await db.query(
//       "SELECT * FROM users WHERE mobile = $1",
//       [mobile]
//     );

//     let user = rows[0];

//     // auto create user
//     if (!user) {
//       const result = await db.query(
//         `INSERT INTO users (mobile, wallet_balance, role)
//          VALUES ($1,$2,$3)
//          RETURNING *`,
//         [mobile, INITIAL_WALLET_BALANCE, "user"]
//       );

//       user = result.rows[0];
//     }

//     // create token
//     const token = jwt.sign(
//       {
//         id: user.id,
//         mobile: user.mobile,
//         role: user.role
//       },
//       JWT_SECRET,
//       { expiresIn: "7d" }
//     );

//     res.json({
//       message: "Login successful",
//       token,
//       user
//     });

//   } catch (err) {
//     console.error("Login error:", err);
//     res.status(500).json({ error: "Server error" });
//   }
// };
exports.login = async (req, res) => {
  const { mobile, otp } = req.body;

  if (!mobile || !otp)
    return res.status(400).json({ error: "Mobile and OTP required" });

  try {

    // --- DUMMY CREDENTIALS BYPASS ---
    if (mobile === "9999999999" && otp === "123456") {
      console.log("DEV LOGIN → Dummy User Triggered");
    } else {
      console.log("DEV LOGIN → OTP bypassed");
      // Add real OTP logic here if needed in production
    }

    // find user
    let { rows } = await db.query(
      "SELECT * FROM users WHERE phone = $1",
      [mobile]
    );

    let user = rows[0];

    // auto create user
    if (!user) {
      const result = await db.query(
        `INSERT INTO users (phone, wallet_balance, role)
         VALUES ($1,$2,$3)
         RETURNING *`,
        [mobile, 50000, "user"]
      );

      user = result.rows[0];
    }

    const token = jwt.sign(
      {
        id: user.id,
        mobile: user.phone,
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
    res.status(500).json({ error: err.message });
  }
};


exports.adminLogin = async (req, res) => {
  const { email, password } = req.body;

  // Environment credentials or Dummy fallback
  const isAdmin = (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASS) ||
    (email === "admin@market.com" && password === "admin123");

  if (isAdmin) {
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



exports.getProfile = async (req, res) => {
  try {
    const { id } = req.user;

    const { rows } = await db.query(
      "SELECT id,phone,wallet_balance,role FROM users WHERE id=$1",
      [id]
    );

    res.json(rows[0]);

  } catch (err) {
    res.status(500).json({ error: "Failed to fetch profile" });
  }
};