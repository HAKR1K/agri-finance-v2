const mongoose = require('mongoose');

const VillageSchema = new mongoose.Schema({
  // 1. Remove 'unique: true' from here
  name: { type: String, required: true }, 
  
  // 2. This links the village to the specific user
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true } 
});

// 3. THE NEW RULE: Name must be unique ONLY for the same user
// (User A can have "Rudraram", User B can have "Rudraram", but User A can't have two "Rudraram"s)
VillageSchema.index({ name: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('Village', VillageSchema);