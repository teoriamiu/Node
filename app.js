const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);

// Configuración optimizada para producción
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  },
  pingTimeout: 60000,
  pingInterval: 25000
});

// Middleware
app.use(express.static(path.join(__dirname)));

// Ruta principal - sirve el index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Health check para Render.com (CRÍTICO)
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'WhatsChat',
    users: users.length,
    messages: messages.length
  });
});

// Simulación de base de datos en memoria
let users = [];
let messages = [];
let typingUsers = new Set();

// Socket.IO - Lógica del chat
io.on('connection', (socket) => {
  console.log(`🔗 Usuario conectado: ${socket.id}`);
  
  // Unirse al chat
  socket.on('user_join', (username) => {
    const user = {
      id: socket.id,
      username: username,
      online: true,
      lastSeen: new Date(),
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=random&color=fff`
    };
    
    // Actualizar o agregar usuario
    const existingIndex = users.findIndex(u => u.username === username);
    if (existingIndex !== -1) {
      users[existingIndex] = { ...users[existingIndex], ...user };
    } else {
      users.push(user);
    }
    
    socket.join('main_room');
    
    // Notificar a todos
    io.emit('user_list_update', users);
    io.emit('system_message', {
      type: 'join',
      username: username,
      timestamp: new Date(),
      message: `${username} se ha unido al chat`
    });
    
    // Enviar historial de mensajes
    socket.emit('message_history', messages.slice(-50));
  });
  
  // Enviar mensaje
  socket.on('send_message', (data) => {
    const message = {
      id: Date.now().toString(),
      username: data.username,
      text: data.text,
      timestamp: new Date(),
      userId: socket.id
    };
    
    messages.push(message);
    
    // Mantener solo últimos 500 mensajes en memoria
    if (messages.length > 500) {
      messages = messages.slice(-500);
    }
    
    io.emit('new_message', message);
  });
  
  // Usuario escribiendo
  socket.on('typing', (username) => {
    typingUsers.add(username);
    socket.broadcast.emit('user_typing', Array.from(typingUsers));
  });
  
  // Usuario dejó de escribir
  socket.on('stop_typing', (username) => {
    typingUsers.delete(username);
    socket.broadcast.emit('user_typing', Array.from(typingUsers));
  });
  
  // Desconexión
  socket.on('disconnect', () => {
    const user = users.find(u => u.id === socket.id);
    if (user) {
      user.online = false;
      user.lastSeen = new Date();
      
      io.emit('user_list_update', users);
      io.emit('system_message', {
        type: 'left',
        username: user.username,
        timestamp: new Date(),
        message: `${user.username} se ha desconectado`
      });
      
      typingUsers.delete(user.username);
      socket.broadcast.emit('user_typing', Array.from(typingUsers));
    }
  });
});

// Puerto para Render.com (usa process.env.PORT)
const PORT = process.env.PORT || 3000;

// Iniciar servidor
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 WhatsChat corriendo en puerto ${PORT}`);
  console.log(`🌐 Health check disponible en: http://localhost:${PORT}/health`);
});