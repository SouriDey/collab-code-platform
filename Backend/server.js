const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const http = require("http");
const { Server } = require("socket.io");

const connectDB = require("./config/db");
const roomRoutes = require("./routes/roomRoutes");

dotenv.config();
connectDB();

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/rooms", roomRoutes);

app.get("/", (req, res) => {
  res.send("Backend Running");
});

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

const timers = {};

const getRoomUsers = (roomId) => {
  const room = io.sockets.adapter.rooms.get(roomId);

  if (!room) return [];

  return Array.from(room).map((socketId) => {
    const userSocket = io.sockets.sockets.get(socketId);

    return {
      id: socketId,
      username: userSocket?.username || "Anonymous",
    };
  });
};

io.on("connection", (socket) => {
  console.log("User Connected:", socket.id);

  socket.on("join-room", ({ roomId, username }) => {
    socket.join(roomId);
    socket.roomId = roomId;
    socket.username = username || "Anonymous";

    const users = getRoomUsers(roomId);

    io.to(roomId).emit("user-count", users.length);
    io.to(roomId).emit("participants", users);

    if (timers[roomId]) {
      socket.emit("timer-update", timers[roomId].timeLeft);
    } else {
      socket.emit("timer-update", 45 * 60);
    }

    console.log(`${socket.username} joined ${roomId}. Users: ${users.length}`);
  });

  socket.on("code-change", ({ roomId, code }) => {
    socket.to(roomId).emit("receive-code", code);
  });

  socket.on("problem-change", ({ roomId, problem }) => {
    socket.to(roomId).emit("receive-problem", problem);
  });

  socket.on("cursor-move", ({ roomId, username, lineNumber, column }) => {
    socket.to(roomId).emit("cursor-update", {
      username: username || socket.username || "Anonymous",
      lineNumber,
      column,
    });
  });

  socket.on("send-message", ({ roomId, username, message }) => {
    io.to(roomId).emit("receive-message", {
      sender: username || socket.username || "Anonymous",
      message,
      time: new Date().toLocaleTimeString(),
    });
  });

  socket.on("start-timer", ({ roomId, minutes }) => {
    if (timers[roomId]?.interval) return;

    const selectedTime = Number(minutes) > 0 ? Number(minutes) * 60 : 45 * 60;

    timers[roomId] = {
      timeLeft: timers[roomId]?.timeLeft || selectedTime,
      interval: null,
    };

    io.to(roomId).emit("timer-update", timers[roomId].timeLeft);

    timers[roomId].interval = setInterval(() => {
      timers[roomId].timeLeft -= 1;

      io.to(roomId).emit("timer-update", timers[roomId].timeLeft);

      if (timers[roomId].timeLeft <= 0) {
        clearInterval(timers[roomId].interval);
        timers[roomId].interval = null;
        io.to(roomId).emit("timer-finished");
      }
    }, 1000);
  });

  socket.on("reset-timer", ({ roomId, minutes }) => {
    if (timers[roomId]?.interval) {
      clearInterval(timers[roomId].interval);
    }

    const selectedTime = Number(minutes) > 0 ? Number(minutes) * 60 : 45 * 60;

    timers[roomId] = {
      timeLeft: selectedTime,
      interval: null,
    };

    io.to(roomId).emit("timer-update", timers[roomId].timeLeft);
  });

  socket.on("disconnect", () => {
    const roomId = socket.roomId;

    if (roomId) {
      setTimeout(() => {
        const users = getRoomUsers(roomId);

        io.to(roomId).emit("user-count", users.length);
        io.to(roomId).emit("participants", users);
      }, 100);
    }

    console.log("User Disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});