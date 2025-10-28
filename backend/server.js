const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const compression = require('compression');
require('dotenv').config();

// Utility to check if we're in production
const isProduction = process.env.NODE_ENV === 'production';

const app = express();

// Middleware
// CORS configuration for both development and production
app.use(cors({
  origin: ['http://localhost:5173', 'https://awinja-education-centre.vercel.app'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// JSON body parser
app.use(express.json());

// Helmet adds several HTTP headers to improve security
app.use(helmet());

// Additional security headers (redundant with helmet but left intentionally for clarity)
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Rate limiter for auth endpoints to mitigate brute-force attacks
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  }
});

// Apply limiter to login/register endpoints
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

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