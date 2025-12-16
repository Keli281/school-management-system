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
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5172', // Added port 5172
  'https://awinja-education-centre.vercel.app'
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = `The CORS policy for this site does not allow access from the specified Origin: ${origin}`;
      console.log('⚠️ CORS blocked origin:', origin);
      return callback(new Error(msg), false);
    }
    console.log('✅ CORS allowed origin:', origin);
    return callback(null, true);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// JSON body parser
app.use(express.json());

// Helmet adds several HTTP headers to improve security
app.use(helmet());

// Additional security headers
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
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  }
});

// Apply limiter to login/register endpoints
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// MongoDB Connection
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
const teacherRoutes = require('./routes/teachers');
const feesRoutes = require('./routes/fees'); // Using the main fees.js file
const nonTeachingStaffRoutes = require('./routes/nonTeachingStaff'); // NEW: Added non-teaching staff routes

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/fees', feesRoutes); // This loads fees.js
app.use('/api/teachers', teacherRoutes);
app.use('/api/non-teaching-staff', nonTeachingStaffRoutes); // NEW: Added route for non-teaching staff

// Basic route to test our server
app.get('/', (req, res) => {
  res.json({ 
    message: 'Welcome to Awinja Education Center API!',
    database: 'MongoDB Connected Successfully!',
    school: 'Awinja Education Center - Real Data System',
    environment: isProduction ? 'Production' : 'Development',
    port: process.env.PORT || 5000,
    routes: {
      auth: '/api/auth',
      students: '/api/students',
      teachers: '/api/teachers',
      fees: '/api/fees',
      nonTeachingStaff: '/api/non-teaching-staff' // NEW: Added to status
    }
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

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// List all routes (for debugging)
app.get('/routes', (req, res) => {
  const routes = [];
  app._router.stack.forEach((middleware) => {
    if (middleware.route) {
      routes.push({
        path: middleware.route.path,
        methods: Object.keys(middleware.route.methods)
      });
    } else if (middleware.name === 'router') {
      middleware.handle.stack.forEach((handler) => {
        if (handler.route) {
          routes.push({
            path: '/api' + handler.route.path,
            methods: Object.keys(handler.route.methods)
          });
        }
      });
    }
  });
  
  res.json({
    message: 'Available API routes',
    routes: routes.sort((a, b) => a.path.localeCompare(b.path))
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🏫 Awinja School Server running on port ${PORT}`);
  console.log('💰 FEES ROUTE LOADED: fees.js (with updated balance calculation)');
  console.log('👨‍🍳 NON-TEACHING STAFF ROUTE LOADED: nonTeachingStaff.js'); // NEW: Log message
  console.log('🌐 CORS allowed origins:', allowedOrigins);
  console.log('🔗 Local API URL: http://localhost:' + PORT);
  console.log('📡 Environment:', isProduction ? 'Production' : 'Development');
});