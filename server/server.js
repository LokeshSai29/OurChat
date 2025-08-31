const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const config = require('./config');

// Import routes
const authRoutes = require('./routes/auth');
const contactRoutes = require('./routes/contacts');
const messageRoutes = require('./routes/messages');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: config.CORS_ORIGIN,
    methods: ["GET", "POST"]
  }
});

// Store socket connections
const connectedUsers = new Map();

// Middleware
app.use(cors({
  origin: config.CORS_ORIGIN,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Make io available to routes
app.set('io', io);

// Routes
app.use('/auth', authRoutes);
app.use('/contacts', contactRoutes);
app.use('/messages', messageRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Socket.IO authentication and connection handling
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error'));
    }

    const decoded = jwt.verify(token, config.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return next(new Error('User not found'));
    }

    socket.userId = user._id.toString();
    socket.user = user;
    next();
  } catch (error) {
    next(new Error('Authentication error'));
  }
});

io.on('connection', async (socket) => {
  console.log(`User connected: ${socket.user.email} (${socket.userId})`);

  // Store user connection
  connectedUsers.set(socket.userId, socket.id);

  // Join user's personal room
  socket.join(socket.userId);

  // Update user's online status
  await User.findByIdAndUpdate(socket.userId, {
    isOnline: true,
    lastSeen: new Date()
  });

  // Notify contacts that user is online
  socket.broadcast.emit('userOnline', {
    userId: socket.userId,
    user: socket.user.toPublicJSON()
  });

  // Handle disconnect
  socket.on('disconnect', async () => {
    console.log(`User disconnected: ${socket.user.email} (${socket.userId})`);
    
    connectedUsers.delete(socket.userId);

    // Update user's offline status
    await User.findByIdAndUpdate(socket.userId, {
      isOnline: false,
      lastSeen: new Date()
    });

    // Notify contacts that user is offline
    socket.broadcast.emit('userOffline', {
      userId: socket.userId,
      user: socket.user.toPublicJSON()
    });
  });

  // Handle typing events
  socket.on('typing', (data) => {
    socket.to(data.contactId).emit('userTyping', {
      userId: socket.userId,
      contactId: data.contactId
    });
  });

  socket.on('stopTyping', (data) => {
    socket.to(data.contactId).emit('userStopTyping', {
      userId: socket.userId,
      contactId: data.contactId
    });
  });
});

// Connect to MongoDB
mongoose.connect(config.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    
    // Start server
    server.listen(config.PORT, () => {
      console.log(`Server running on port ${config.PORT}`);
      console.log(`Frontend URL: ${config.CORS_ORIGIN}`);
    });
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  });

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});

module.exports = { app, server, io };

