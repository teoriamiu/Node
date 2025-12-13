const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

let users = [];
let messages = [];
let typingUsers = new Set();

app.use(express.static(__dirname));

app.get("/", (_, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/health", (_, res) => {
  res.json({ status: "ok" });
});

io.on("connection", socket => {
  console.log("🔗 Conectado:", socket.id);
  
  socket.on("user_join", username => {
    const user = {
      id: socket.id,
      username,
      online: true,
      lastSeen: new Date()
    };
    
    users = users.filter(u => u.username !== username);
    users.push(user);
    
    socket.emit("join_success");
    socket.emit("message_history", messages);
    
    io.emit("system_message", {
      message: `${username} se unió`
    });
  });
  
  socket.on("send_message", data => {
    const msg = {
      username: data.username,
      text: data.text,
      timestamp: new Date()
    };
    
    messages.push(msg);
    messages = messages.slice(-500);
    
    io.emit("new_message", msg);
  });
  
  socket.on("typing", username => {
    typingUsers.add(username);
    socket.broadcast.emit("user_typing", [...typingUsers]);
  });
  
  socket.on("stop_typing", username => {
    typingUsers.delete(username);
    socket.broadcast.emit("user_typing", [...typingUsers]);
  });
  
  socket.on("disconnect", () => {
    const user = users.find(u => u.id === socket.id);
    if (user) {
      users = users.filter(u => u.id !== socket.id);
      typingUsers.delete(user.username);
      io.emit("user_typing", [...typingUsers]);
    }
  });
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, "0.0.0.0", () => {
  console.log("🚀 WhatsChat en puerto", PORT);
});