const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  type: {
    type: String,
    enum: ['Money Lent', 'Loan', 'Investment', 'Fertilizer', 'Yield', 'Repayment', 'Miscellaneous'], 
    required: true
  },
  amount: { type: Number, required: true },
  details: { type: String },
  interest_rate: { type: Number, default: 0 },
  interest: { type: Number, default: 0 },
  interest_date: { type: Date },
  villageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Village' },
  villageName: { type: String },
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
  villageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Village' },
  paddy_variety: { type: String, required: true },
  phone: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  settledDate: { type: Date },
  deleted: { type: Boolean, default: false },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  transactions: [TransactionSchema]
});

module.exports = mongoose.model('Farmer', FarmerSchema);