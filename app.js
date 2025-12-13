const express = require("express");
const path = require("path");
const http = require("http");
const WebSocket = require("ws");

const app = express();
const PORT = process.env.PORT || 3000;

// Servir archivos estáticos
app.use(express.static(__dirname));

// Página principal
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Crear servidor HTTP (necesario para WebSockets)
const server = http.createServer(app);

// Crear WebSocket Server
const wss = new WebSocket.Server({ server });

// Manejo de conexiones
wss.on("connection", (ws) => {
  console.log("Usuario conectado");
  
  ws.on("message", (msg) => {
    console.log("Mensaje recibido:", msg);
    
    // reenviar mensaje a todos los clientes
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(msg);
      }
    });
  });
  
  ws.on("close", () => {
    console.log("Usuario desconectado");
  });
});

// Iniciar servidor
server.listen(PORT, () => {
  console.log("Servidor escuchando en puerto " + PORT);
});