process.on("uncaughtException", err => {
  console.error("UNCAUGHT EXCEPTION:", err);
});

process.on("unhandledRejection", err => {
  console.error("UNHANDLED PROMISE:", err);
});
require("dotenv").config();
require("./src/cron/resetMarkets");

const http = require("http");
const { Server } = require("socket.io");

const app = require("./src/app");

const PORT = 5000;
/* CREATE HTTP SERVER */
const server = http.createServer(app);
/* SOCKET SERVER */
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET","POST","PATCH"]
    }
});

/* GLOBAL ACCESS */
global.io = io;

/* CONNECTION */
io.on("connection", socket => {
    console.log("⚡ Socket Connected:", socket.id);

    socket.on("disconnect", () => {
        console.log("❌ Socket Disconnected:", socket.id);
    });
});

/* START SERVER */
server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});