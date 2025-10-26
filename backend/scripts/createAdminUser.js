const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const createSingleAdmin = async () => {
  try {
    // Check if password is provided
    const adminPassword = process.env.ADMIN_PASSWORD;
    
    if (!adminPassword) {
      console.error('❌ ERROR: ADMIN_PASSWORD is not set in .env file');
      console.log('💡 Please add this to your .env file:');
      console.log('ADMIN_PASSWORD=YourSecurePasswordHere');
      process.exit(1);
    }

    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ Connected to MongoDB');

    // Delete any existing users
    await User.deleteMany({});
    console.log('✅ Cleared existing users');

    // Create single admin user with password from .env
    const adminUser = {
      email: 'awinjaeducationcentre@gmail.com',
      password: adminPassword, // From environment variable
      fullName: 'Awinja Education Center Admin',
      role: 'admin'
    };

    const user = new User(adminUser);
    await user.save();
    
    console.log('🎉 Single admin user created successfully!');
    console.log('📧 Email: awinjaeducationcentre@gmail.com');
    console.log('🔑 Password: [Hidden - from .env file]');
    console.log('⚠️ Keep these credentials secure!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    process.exit(1);
  }
};

createSingleAdmin();