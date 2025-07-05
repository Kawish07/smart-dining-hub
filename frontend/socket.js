import { Server } from "socket.io";
import http from "http";

const server = http.createServer((req, res) => {
  res.writeHead(200);
  res.end("Socket Server is Running");
});

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000", // Your client URL
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("A user connected");

  socket.on("newOrder", (orderData) => {
    io.emit("orderPlaced", orderData);
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected");
  });
});

server.listen(5000, () => {
  console.log("WebSocket server running on port 5000");
});