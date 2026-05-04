require('dotenv').config();
const mongoose = require('mongoose');

const Village = require('./models/Village');
const Farmer = require('./models/Farmer');
const User = require('./models/User');

const resetDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ DB Connected");

        const farmerResult = await Farmer.deleteMany({});
        console.log(`🗑️ Deleted ${farmerResult.deletedCount} farmers`);

        const villageResult = await Village.deleteMany({});
        console.log(`🗑️ Deleted ${villageResult.deletedCount} villages`);

        // If the testuser needs recreating, we can ensure it exists
        // Wait, the user already registered it and just wants a DB reset. 
        // Wiping just Farmers and Villages achieves a clean slate for testing.

        console.log("✅ Database has been reset successfully. Users are kept intact.");
    } catch (error) {
        console.error("❌ Reset Error:", error);
    } finally {
        mongoose.disconnect();
        console.log("🔌 Disconnected.");
    }
};

resetDB();