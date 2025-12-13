const express = require("express");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");
const { Pool } = require("pg");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

// ===== PostgreSQL =====
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ?
    { rejectUnauthorized: false } :
    false
});

(async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS messages (
      id SERIAL PRIMARY KEY,
      text TEXT NOT NULL,
      timestamp BIGINT NOT NULL
    )
  `);
  console.log("🟢 Tabla messages lista");
})();

// ===== Express =====
app.use(express.static(__dirname));

app.get("/", (_, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// ===== Socket.IO =====
io.on("connection", async socket => {
  console.log("🔗 Usuario conectado:", socket.id);
  
  // Enviar historial
  const { rows } = await pool.query(
    "SELECT text, timestamp FROM messages ORDER BY id ASC LIMIT 100"
  );
  
  rows.forEach(row => {
    socket.emit("message", {
      text: row.text,
      time: row.timestamp,
      me: false
    });
  });
  
  socket.on("message", async data => {
    const time = Date.now();
    
    await pool.query(
      "INSERT INTO messages (text, timestamp) VALUES ($1, $2)",
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