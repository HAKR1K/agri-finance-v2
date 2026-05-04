const mongoose = require('mongoose');

const VillageSchema = new mongoose.Schema({
  name: { type: String, required: true }, 
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  deleted: { type: Boolean, default: false },
  farmers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Farmer' }]
});

VillageSchema.index({ name: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('Village', VillageSchema);