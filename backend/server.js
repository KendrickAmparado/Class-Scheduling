import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

// Import route files
import adminRoutes from './routes/adminRoutes.js';
import scheduleRoutes from './routes/scheduleRoutes.js';
import instructorRoutes from './routes/instructorRoutes.js';   // includes archive, restore, delete logic
import roomRoutes from './routes/roomRoutes.js';
import yearLevelRoutes from './routes/yearLevelRoutes.js';
import registrationRoutes from './routes/registrationRoutes.js';
import sectionRoutes from './routes/sectionRoutes.js';

// Load environment variables
dotenv.config();

const app = express();

// ==========================
// Middleware setup
// ==========================
app.use(cors());
app.use(express.json()); // Parses JSON bodies

// ==========================
// MongoDB Connection Setup
// ==========================
const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/class_scheduling';

mongoose
  .connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('✅ MongoDB connected successfully'))
  .catch((err) => {
    console.error('❌ MongoDB connection failed:', err);
    process.exit(1);
  });

// ==========================
// Route Mounting
// ==========================
app.use('/api/admin', adminRoutes);
app.use('/api/schedule', scheduleRoutes);
app.use('/api/instructors', instructorRoutes); // handles active, archive, restore, and delete
app.use('/api/rooms', roomRoutes);
app.use('/api/year-levels', yearLevelRoutes);
app.use('/api/registration', registrationRoutes);
app.use('/api/sections', sectionRoutes);

// ==========================
// Error Handling Middleware
// ==========================
app.use((err, req, res, next) => {
  console.error('💥 Server Error Middleware:', err);
  res.status(500).json({
    success: false,
    message: err.message || 'Server error occurred',
  });
});

// ==========================
// Start the Server
// ==========================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
