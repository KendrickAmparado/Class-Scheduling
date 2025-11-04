import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';

// Import your route files here
import adminRoutes from './routes/adminRoutes.js';
import scheduleRoutes from './routes/scheduleRoutes.js';
import instructorRoutes from './routes/instructorRoutes.js';
import instructorAuthRoutes from './routes/InstructorAuth.js';
import roomRoutes from './routes/roomRoutes.js';
import yearLevelRoutes from './routes/yearLevelRoutes.js';
import registrationRoutes from './routes/registrationRoutes.js';
import sectionRoutes from './routes/sectionRoutes.js';
import alertsRoutes from './routes/alertsRoutes.js';
import instructorNotificationRoutes from './routes/instructorNotificationRoutes.js';
import scheduleTemplateRoutes from './routes/scheduleTemplateRoutes.js';
import passwordResetRoutes from './routes/passwordResetRoutes.js';
import Instructor from './models/Instructor.js'; // Import the model for index management

dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
}));
app.use(express.json());

// MongoDB connection URI
const mongoURI = process.env.MONGO_URI;
if (!mongoURI) {
  console.error('⚠️ MONGO_URI not specified in .env');
  process.exit(1);
}

// Function to drop old email index and create new partial unique index
async function setupIndexes() {
  try {
    const collection = mongoose.connection.collection('instructors');

    // Get current indexes
    const indexes = await collection.indexes();
    const emailIndex = indexes.find(index => index.key.email);

    if (emailIndex) {
      console.log(`Dropping existing index: ${emailIndex.name}`);
      await collection.dropIndex(emailIndex.name);
      console.log('Old email index dropped successfully.');
    } else {
      console.log('No email index found to drop.');
    }

    // Create the indexes defined in Mongoose schema (includes partial unique index)
    await Instructor.createIndexes();
    console.log('New indexes created as per schema definitions.');
  } catch (err) {
    console.error('Error during index setup:', err);
  }
}

// Connect to MongoDB and then setup indexes and start server
mongoose
  .connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(async () => {
    console.log('✅ MongoDB connected successfully');
    await setupIndexes(); // Ensure indexes before server start

    // After indexes setup, start your server...
    const server = http.createServer(app);
    const io = new SocketIOServer(server, {
      cors: { origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE'] },
    });

    app.use((req, res, next) => {
      req.io = io;
      next();
    });

    // Route Mounting
    app.use('/api/admin', adminRoutes);
    app.use('/api/admin', alertsRoutes);
    app.use('/api/instructor', instructorNotificationRoutes);
    app.use('/api/schedule', scheduleRoutes);
    app.use('/api/instructor', instructorAuthRoutes);
    app.use('/api/instructors', instructorRoutes);
    app.use('/api/rooms', roomRoutes);
    app.use('/api/year-levels', yearLevelRoutes);
    app.use('/api/registration', registrationRoutes);
    app.use('/api/sections', sectionRoutes);
    app.use('/api/schedule-templates', scheduleTemplateRoutes);
    app.use('/api/password-reset', passwordResetRoutes);
    app.use("/uploads", express.static("uploads"));

    // Existing health check, error handlers, socket handlers, etc.

    io.on('connection', (socket) => {
      console.log('🔌 New client connected:', socket.id);

      socket.on('disconnect', () => {
        console.log('🔌 Client disconnected:', socket.id);
      });

      socket.on('subscribe-alerts', (userId) => {
        socket.join(`user-${userId}`);
        console.log(`📢 User ${userId} subscribed to alerts`);
      });
    });

    // Start server listening
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      console.log(`🚀 Server + Socket.IO running on port ${PORT}`);
      console.log(`📍 Local: http://localhost:${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    });

    // Graceful shutdown handler remains unchanged
    process.on('SIGTERM', () => {
      console.log('⚠️ SIGTERM received: closing server');
      server.close(() => {
        console.log('✅ HTTP server closed');
        mongoose.connection.close(false, () => {
          console.log('✅ MongoDB connection closed');
          process.exit(0);
        });
      });
    });

  })
  .catch((err) => {
    console.error('❌ MongoDB connection failed:', err);
    process.exit(1);
  });

// Other existing middleware and error handling code remains as you have it
