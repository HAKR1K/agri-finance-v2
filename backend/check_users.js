require('dotenv').config();
const mongoose = require('mongoose');
const Village = require('./models/Village');
const User = require('./models/User');

async function checkUsers() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB\n');

    const users = await User.find({});
    console.log('=== USERS ===');
    users.forEach(u => {
      console.log(`${u.username} - ID: ${u._id}`);
    });

    const villages = await Village.find({});
    console.log('\n=== VILLAGES WITH USER IDs ===');
    villages.forEach(v => {
      console.log(`${v.name} - User ID: ${v.user} - Deleted: ${v.deleted}`);
    });

    mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
}

checkUsers();