require('dotenv').config();
const mongoose = require('mongoose');
const Village = require('./models/Village');
const Farmer = require('./models/Farmer');

async function checkDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');

    const villages = await Village.find({});
    console.log('Villages:', villages);

    const farmers = await Farmer.find({});
    console.log('Farmers:', farmers);

    mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
}

checkDB();