const express = require("express");
const path = require("path");
const http = require("http");
const WebSocket = require("ws");
const sqlite3 = require("sqlite3").verbose();

const app = express();
const PORT = process.env.PORT || 3000;

// ===== SQLite =====
const db = new sqlite3.Database("./chat.db");

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      text TEXT NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
});

// ===== Express =====
app.use(express.static(__dirname));

app.get("/", (_, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// ===== HTTP + WebSocket =====
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

wss.on("connection", (ws) => {
  console.log("🔗 Usuario conectado");
  
  // Enviar historial al conectarse
  db.all(
    "SELECT text FROM messages ORDER BY id ASC LIMIT 100",
    [],
    (err, rows) => {
      if (!err) {
        rows.forEach(row => ws.send(row.text));
      }
    }
  );
  
  ws.on("message", (msg) => {
    const text = msg.toString();
    console.log("💬 Mensaje:", text);
    
    // Guardar en SQLite
    db.run("INSERT INTO messages (text) VALUES (?)", [text]);
    
    // Reenviar a todos
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(text);
      }
    });
  });
  
  ws.on("close", () => {
    console.log("❌ Usuario desconectado");
  });
});

// ===== Start =====
server.listen(PORT, "0.0.0.0", () => {
  console.log("🚀 Servidor en puerto", PORT);
});