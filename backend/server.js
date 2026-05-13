const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/chatroom', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Schemas
const messageSchema = new mongoose.Schema({
  id: { type: String, default: () => uuidv4() },
  userId: String,
  username: String,
  content: String,
  timestamp: { type: Date, default: Date.now },
  isSystemMessage: { type: Boolean, default: false },
});

const Message = mongoose.model('Message', messageSchema);

// Socket.IO Logic
const activeUsers = new Map();

io.on('connection', (socket) => {
  const userId = uuidv4();
  const username = generateAnonymousUsername();
  
  activeUsers.set(socket.id, { userId, username, socketId: socket.id });

  // Send user count and recent messages
  io.emit('user_count', activeUsers.size);
  Message.find().sort({ timestamp: -1 }).limit(50).then((messages) => {
    socket.emit('message_history', messages.reverse());
  });

  // New user joins
  io.emit('user_joined', {
    username,
    count: activeUsers.size,
  });

  // Handle incoming messages
  socket.on('send_message', async (data) => {
    const userInfo = activeUsers.get(socket.id);
    if (!userInfo) return;

    const messageDoc = new Message({
      userId: userInfo.userId,
      username: userInfo.username,
      content: data.content,
    });

    await messageDoc.save();

    io.emit('receive_message', {
      id: messageDoc.id,
      userId: userInfo.userId,
      username: userInfo.username,
      content: data.content,
      timestamp: messageDoc.timestamp,
    });
  });

  // Delete message (optional moderation)
  socket.on('delete_message', async (messageId) => {
    await Message.findByIdAndDelete(messageId);
    io.emit('message_deleted', messageId);
  });

  // User disconnect
  socket.on('disconnect', () => {
    const userInfo = activeUsers.get(socket.id);
    activeUsers.delete(socket.id);
    io.emit('user_left', {
      username: userInfo?.username,
      count: activeUsers.size,
    });
  });
});

// REST Endpoints
app.get('/api/messages', async (req, res) => {
  try {
    const messages = await Message.find().sort({ timestamp: -1 }).limit(100);
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/stats', (req, res) => {
  res.json({
    activeUsers: activeUsers.size,
    timestamp: new Date(),
  });
});

// Utility function
function generateAnonymousUsername() {
  const adjectives = ['Happy', 'Clever', 'Swift', 'Mighty', 'Curious', 'Bright', 'Bold', 'Calm'];
  const animals = ['Panda', 'Eagle', 'Wolf', 'Tiger', 'Phoenix', 'Dragon', 'Lion', 'Falcon'];
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const animal = animals[Math.floor(Math.random() * animals.length)];
  const num = Math.floor(Math.random() * 1000);
  return `${adj}${animal}${num}`;
}

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});