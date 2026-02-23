const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes");
const betRoutes = require("./routes/betRoutes");
const marketRoutes = require("./routes/marketRoutes");
const walletRoutes = require("./routes/wallet.routes");
const adminRoutes = require("./routes/adminRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/bets", betRoutes);
app.use("/api/markets", marketRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/admin", adminRoutes);

module.exports = app;