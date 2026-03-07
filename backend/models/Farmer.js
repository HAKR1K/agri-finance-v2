const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  // Fixed: Unified the type definition and added missing comma
  type: {
    type: String,
    enum: ['Money Lent', 'Fertilizer', 'Yield', 'Repayment', 'Miscellaneous'], 
    required: true
  },
  amount: { type: Number, required: true },
  details: { type: String },
  fertilizer_name: String,
  quantity: Number,
  price_per_unit: Number,
  bag_count: Number,
  quintals: Number,
  price_per_quintal: Number
});

const FarmerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  village: { type: String, required: true },
  paddy_variety: { type: String, required: true },
  phone: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  transactions: [TransactionSchema]
});

module.exports = mongoose.model('Farmer', FarmerSchema);