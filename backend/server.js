const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

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
const studentRoutes = require('./routes/students');
const feeRoutes = require('./routes/fees');

// Use routes
app.use('/api/students', studentRoutes);
app.use('/api/fees', feeRoutes);

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