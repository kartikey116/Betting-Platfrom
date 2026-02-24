import { io } from "socket.io-client";

const socket = io("https://betting-platfrom.onrender.com", {
    transports: ["websocket"],
    reconnection: true
});

export default socket;