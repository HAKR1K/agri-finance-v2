const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  
  // 👇 YOU PROBABLY MISSED THIS PART
  email: { type: String, required: true, unique: true }, 
  
  password: { type: String, required: true },
  
  // Reset Tokens
  resetPasswordToken: String,
  resetPasswordExpire: Date
});

module.exports = mongoose.model('User', UserSchema);