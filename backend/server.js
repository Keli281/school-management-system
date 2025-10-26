const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Add Security Headers (Add this block)
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// MongoDB Connection - THIS IS WHERE WE CONNECT TO REAL DATABASE
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ Connected to MongoDB Atlas for Awinja Education Center!');
})
.catch((error) => {
  console.log('❌ MongoDB connection error:', error);
});

// Import routes
const authRoutes = require('./routes/auth');
const studentRoutes = require('./routes/students');
const feeRoutes = require('./routes/fees');
const teacherRoutes = require('./routes/teachers'); // ADD THIS LINE

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/fees', feeRoutes);
app.use('/api/teachers', teacherRoutes); // ADD THIS LINE

// Basic route to test our server
app.get('/', (req, res) => {
  res.json({ 
    message: 'Welcome to Awinja Education Center API!',
    database: 'MongoDB Connected Successfully!',
    school: 'Awinja Education Center - Real Data System'
  });
});

// Simple test route to verify our database connection
app.get('/test-db', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    
    res.json({
      message: 'Database connection successful!',
      database: 'awinja_school',
      collections: collections.map(col => col.name),
      status: '✅ Ready for Awinja student data!'
    });
  } catch (error) {
    res.status(500).json({
      message: 'Database connection failed',
      error: error.message
    });
  }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🏫 Awinja School Server running on port ${PORT}`);
});