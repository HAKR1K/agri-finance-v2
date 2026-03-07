const mongoose = require('mongoose');
require('dotenv').config(); // 🔑 Load secrets
const User = require('./models/User');

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("⚠️ Deleting all users...");
    await User.deleteMany({});
    console.log("✅ Users deleted.");
    process.exit();
  })
  .catch(err => console.log(err));