require('dotenv').config();
const mongoose = require('mongoose');
const Village = require('./models/Village');
const Farmer = require('./models/Farmer');

async function updateVillagesToNewUser() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');

    const newUserId = '69e0714f3213850ac80dcf82'; // The new test user ID

    // Update all villages to belong to the new user
    const villageResult = await Village.updateMany({}, { user: newUserId });
    console.log(`Updated ${villageResult.modifiedCount} villages`);

    // Update all farmers to belong to the new user
    const farmerResult = await Farmer.updateMany({}, { user: newUserId });
    console.log(`Updated ${farmerResult.modifiedCount} farmers`);

    console.log('✅ All villages and farmers now belong to the test user');

    mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err);
  }
}

updateVillagesToNewUser();