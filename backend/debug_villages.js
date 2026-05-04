require('dotenv').config();
const mongoose = require('mongoose');
const Village = require('./models/Village');
const Farmer = require('./models/Farmer');

async function checkDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB\n');

    const allVillages = await Village.find({});
    console.log('=== ALL VILLAGES ===');
    allVillages.forEach(v => {
      console.log(`${v.name} - deleted: ${v.deleted}, farmers: ${v.farmers.length}`);
    });

    const deletedVillages = await Village.find({ deleted: true });
    console.log('\n=== DELETED VILLAGES ===');
    console.log(`Count: ${deletedVillages.length}`);
    deletedVillages.forEach(v => {
      console.log(`- ${v.name}`);
    });

    const activeVillages = await Village.find({ deleted: { $ne: true } });
    console.log('\n=== ACTIVE VILLAGES ===');
    console.log(`Count: ${activeVillages.length}`);
    activeVillages.forEach(v => {
      console.log(`- ${v.name}`);
    });

    mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
}

checkDB();