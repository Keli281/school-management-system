const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET || 'awinja_education_center_secret_2025', {
    expiresIn: '30d',
  });
};

// POST /api/auth/register - Create new admin user
router.post('/register', async (req, res) => {
  try {
    const { email, password, fullName, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Create new user
    const user = new User({
      email,
      password,
      fullName,
      role: role || 'admin'
    });

    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        role: user.role
      },
      token
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error creating user',
      error: error.message
    });
  }
});

// POST /api/auth/login - User login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email, isActive: true });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate token
    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        role: user.role
      },
      token
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error during login',
      error: error.message
    });
  }
});

// GET /api/auth/me - Get current user (protected route)
router.get('/me', async (req, res) => {
  try {
    // We'll add middleware later to protect this route
    // For now, this is a placeholder
    res.json({
      success: true,
      message: 'Auth me endpoint - will be protected'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching user data',
      error: error.message
    });
  }
});

module.exports = router;