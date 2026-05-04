const mongoose = require('mongoose');

const LoadSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  name: { type: String, required: true },
  farmers: [{
    farmerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Farmer' },
    name: String,
    village: String,
    bags: Number
  }],
  totalBags: { type: Number, default: 0 },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
});

module.exports = mongoose.model('Load', LoadSchema);
