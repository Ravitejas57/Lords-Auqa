const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');

dotenv.config();

const app = express();
const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
});

// Make io accessible to routes
app.set('io', io);
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log('📥 Request:', req.method, req.url);
  next();
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('✅ Socket connected:', socket.id);

  // User joins their own room for targeted notifications
  socket.on('joinUser', (userId) => {
    socket.join(userId);
    console.log(`✅ User ${userId} joined their notification room`);
  });

  socket.on('disconnect', () => {
    console.log('❌ Socket disconnected:', socket.id);
  });
});

// ✅ Connect MongoDB
mongoose.connect(process.env.DBurl, { dbName: 'hatchseed' })
  .then(() => {
    console.log('✅ Connected to MongoDB');

    // Start cleanup service after DB connection
    const cleanupService = require('./services/cleanupService');
    cleanupService.startScheduledCleanup();
  })
  .catch((err) => console.error('❌ DB Connection Error:', err));


// // Routes
const AuthRoutes = require('./routes/Auth.route');
const userProfileRoutes = require('./routes/UserProfile.route');
const hatcheryRoutes = require('./routes/Hatchery.route');
const notificationRoutes = require('./routes/Notification.route');

const adminActionRoutes = require('./routes/Admin.route');


const helpMessageRoutes = require('./routes/HelpMessage.route');
const userHelpRoutes = require('./routes/UserHelp.route');

// Use routes
app.use('/api/auth', AuthRoutes);
app.use('/api/user', userProfileRoutes);

app.use('/api/adminActions', adminActionRoutes);
app.use('/api/hatcheries', hatcheryRoutes);

app.use('/api/notifications', notificationRoutes);
app.use('/api/help', helpMessageRoutes);
app.use('/api/user-help', userHelpRoutes);

// Default route (optional)
app.get('/', (req, res) => {
  res.send('🚀 HatchSeed API is running successfully!');
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('❌ Global Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

// Export app for testing
module.exports = app;
