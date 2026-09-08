require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const logger = require('./utils/logger');
const requestId = require('./middleware/requestId');
const sanitize = require('./middleware/sanitize');
const errorHandler = require('./middleware/errorHandler');

// Validate required environment variables
const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET'];
const missingVars = requiredEnvVars.filter(v => !process.env[v]);
if (missingVars.length > 0) {
  logger.error(`Missing required environment variables: ${missingVars.join(', ')}`);
  process.exit(1);
}

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disabled to avoid breaking the SPA
}));

// CORS configuration
const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(',').map(s => s.trim().replace(/\/+$/, ''))
  : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:5173'];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);

    // In development, permit any localhost or 127.0.0.1 port
    if (process.env.NODE_ENV !== 'production') {
      if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
        return callback(null, true);
      }
    }

    const cleanOrigin = origin.replace(/\/+$/, '');
    const isAllowed = allowedOrigins.some(allowed => {
      const cleanAllowed = allowed.replace(/\/+$/, '');
      return cleanOrigin === cleanAllowed || 
             cleanOrigin === `https://${cleanAllowed}` || 
             cleanOrigin === `http://${cleanAllowed}`;
    }) || cleanOrigin.endsWith('.onrender.com');

    if (isAllowed) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

// Limiter is handled in auth routes

// Request parsing with size limits
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Request ID and NoSQL injection sanitization
app.use(requestId);
app.use(sanitize);

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    logger.info('request', {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: Date.now() - start,
      requestId: req.id,
    });
  });
  next();
});

// Health endpoints
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/ready', (req, res) => {
  const dbReady = mongoose.connection.readyState === 1;
  if (dbReady) {
    return res.json({ status: 'ready', database: 'connected' });
  }
  res.status(503).json({ status: 'not ready', database: 'disconnected' });
});

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/elections', require('./routes/elections'));
app.use('/api/candidates', require('./routes/candidates'));
app.use('/api/voter', require('./routes/voter'));
app.use('/api/votes', require('./routes/votes'));
app.use('/api/admin', require('./routes/admin'));

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use(errorHandler);

// Start server (only if not in test mode)
const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== 'test') {
  connectDB().then(() => {
    const server = app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
    });

    // Initialize Socket.io
    const socketIo = require('socket.io');
    const io = socketIo(server, {
      cors: {
        origin: allowedOrigins,
        credentials: true
      }
    });

    app.set('io', io);

    io.on('connection', (socket) => {
      logger.info(`New WebSocket client connected: ${socket.id}`);
      socket.on('disconnect', () => {
        logger.info(`WebSocket client disconnected: ${socket.id}`);
      });
    });

    // Start background timer to automatically transition election statuses and notify clients
    const Election = require('./models/Election');
    setInterval(async () => {
      try {
        const now = new Date();
        // 1. upcoming -> active
        const upcomingToActive = await Election.find({
          status: 'upcoming',
          startDate: { $lte: now }
        });
        for (const election of upcomingToActive) {
          election.status = 'active';
          await election.save();
          logger.info(`Election automatically started: ${election.title}`);
          io.emit('electionStarted', { electionId: election._id.toString() });
        }

        // 2. active -> ended
        const activeToEnded = await Election.find({
          status: 'active',
          endDate: { $lt: now }
        });
        for (const election of activeToEnded) {
          election.status = 'ended';
          await election.save();
          logger.info(`Election automatically ended: ${election.title}`);
          io.emit('electionEnded', { electionId: election._id.toString() });
        }
      } catch (err) {
        logger.error('Error in background election status timer:', { error: err.message });
      }
    }, 15000); // Check every 15 seconds

    // Graceful shutdown
    const shutdown = async (signal) => {
      logger.info(`${signal} received. Starting graceful shutdown...`);
      server.close(async () => {
        logger.info('HTTP server closed');
        try {
          await mongoose.connection.close();
          logger.info('MongoDB connection closed');
        } catch (err) {
          logger.error('Error closing MongoDB connection', { error: err.message });
        }
        process.exit(0);
      });
      // Force shutdown after 10 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  });
}

module.exports = app;
