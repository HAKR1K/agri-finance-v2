require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcryptjs');

async function createTestUser() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');

    // Check if user already exists
    const existingUser = await User.findOne({ username: 'testuser' });
    if (existingUser) {
      console.log('Test user already exists');
      console.log('Username: testuser');
      console.log('Password: testpass123');
      mongoose.disconnect();
      return;
    }

    // Create test user
    const hashedPassword = await bcrypt.hash('testpass123', 10);
    const newUser = new User({
      username: 'testuser',
      email: 'test@example.com',
      password: hashedPassword
    });

    await newUser.save();
    console.log('✅ Test user created!');
    console.log('Username: testuser');
    console.log('Password: testpass123');
    console.log('User ID:', newUser._id);

    mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err);
  }
}

createTestUser();