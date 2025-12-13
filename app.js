const express = require("express");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");
const sqlite3 = require("sqlite3").verbose();

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

// ===== SQLite =====
const db = new sqlite3.Database("./chat.db");

db.run(`
  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    text TEXT NOT NULL,
    timestamp INTEGER
  )
`);

// ===== Express =====
app.use(express.static(__dirname));

app.get("/", (_, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// ===== Socket.IO =====
io.on("connection", socket => {
  console.log("🔗 Usuario conectado:", socket.id);
  
  // Enviar historial
  db.all(
    "SELECT text, timestamp FROM messages ORDER BY id ASC LIMIT 100",
    [],
    (_, rows) => {
      rows.forEach(row => {
        socket.emit("message", {
          text: row.text,
          time: row.timestamp,
          me: false
        });
      });
    }
  );
  
  socket.on("message", data => {
    const time = Date.now();
    
    db.run(
      "INSERT INTO messages (text, timestamp) VALUES (?, ?)",
      [data.text, time]
    );
    
    io.sockets.sockets.forEach(s => {
      s.emit("message", {
        text: data.text,
        time,
        me: s.id === socket.id
      });
    });
  });
  
  socket.on("disconnect", () => {
    console.log("❌ Usuario desconectado:", socket.id);
  });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log("🚀 Servidor escuchando en puerto", PORT);
});