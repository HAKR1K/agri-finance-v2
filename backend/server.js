const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const helmet = require('helmet'); 
require('dotenv').config(); 

const Village = require('./models/Village');
const Farmer = require('./models/Farmer');
const User = require('./models/User');

const app = express();

// 🛡️ SECURITY MIDDLEWARE
app.use(helmet());

const allowedOrigins = [
    process.env.CLIENT_URL,
    "http://localhost:5173",
    "http://localhost",
    "https://agrifinance-app-git-develop-agri-finance.vercel.app",
];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        const isVercelPreview = origin.endsWith(".vercel.app") && origin.includes("agrifinance-app");
        if (allowedOrigins.includes(origin) || isVercelPreview) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true
}));

app.use(express.json());

// ✅ DB CONNECTION
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ DB Connected"))
  .catch(err => console.error("❌ DB Error:", err));

// 🛡️ AUTH MIDDLEWARE
const authMiddleware = (req, res, next) => {
    const token = req.header('Authorization');
    if (!token) return res.status(401).json({ error: "Access Denied" });
    try {
        const verified = jwt.verify(token.replace("Bearer ", ""), process.env.JWT_SECRET);
        req.user = verified;
        next();
    } catch (err) { res.status(400).json({ error: "Invalid Token" }); }
};

// 📧 EMAIL CONFIG (Optimized for Render/Cloud)
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false,
    minVersion: 'TLSv1.2'
  }
});

transporter.verify((error) => {
  if (error) console.log("❌ Email Server Error:", error);
  else console.log("📧 Email Server is ready");
});

// --- 🟢 AUTH ROUTES ---

app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, email, password } = req.body; 
        if (!username || !email || !password) return res.status(400).json({ error: "All fields required" });
        const existing = await User.findOne({ $or: [{ username }, { email }] });
        if (existing) return res.status(400).json({ error: "User already exists" });
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ username, email, password: hashedPassword });
        await newUser.save();
        console.log(`👤 New User Registered: ${username}`);
        res.json({ message: "Registered Successfully!" });
    } catch (err) { res.status(500).json({ error: "Server Error" }); }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });
        if (!user) return res.status(400).json({ error: "Invalid Credentials" });
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ error: "Invalid Credentials" });
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
        res.json({ token, username: user.username, user: { id: user._id, username: user.username, email: user.email } });
    } catch (err) { res.status(500).json({ error: "Server Error" }); }
});

app.post('/api/auth/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ msg: "Please enter email" });
        const cleanEmail = email.trim();
        const user = await User.findOne({ email: { $regex: new RegExp(`^${cleanEmail}$`, 'i') } });
        if (!user) return res.status(404).json({ msg: "Email not found" });

        const resetToken = crypto.randomBytes(20).toString('hex');
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
        await user.save();

        const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
        const message = `<h3>Password Reset Request</h3><p>Hello <strong>${user.username}</strong>,</p><p>Click below to reset your password:</p><a href="${resetUrl}" style="background:#2E7D32; color:white; padding:10px 20px; text-decoration:none; border-radius:5px;">Reset Password</a><p><small>Link expires in 10 minutes.</small></p>`;

        await transporter.sendMail({
            from: `"AgriFinance Security" <${process.env.EMAIL_USER}>`,
            to: user.email,
            subject: 'Reset Your Password',
            html: message
        });
        res.json({ msg: "✅ Email Sent!" });
    } catch (err) { res.status(500).json({ msg: "Could not send email" }); }
});

app.put('/api/auth/reset-password/:token', async (req, res) => {
    try {
        const user = await User.findOne({
            resetPasswordToken: req.params.token,
            resetPasswordExpire: { $gt: Date.now() }
        });
        if (!user) return res.status(400).json({ msg: "Invalid or Expired Token" });
        user.password = await bcrypt.hash(req.body.password, 10);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save();
        res.json({ msg: "Password Updated! Please Login." });
    } catch (err) { res.status(500).send("Server Error"); }
});

// --- 🏠 VILLAGE & FARMER ROUTES ---

app.get('/api/villages', authMiddleware, async (req, res) => {
    const villages = await Village.find({ user: req.user.id });
    res.json(villages);
});

app.post('/api/villages', authMiddleware, async (req, res) => {
    try {
        const newVillage = new Village({ name: req.body.name, user: req.user.id });
        await newVillage.save();
        res.json(newVillage);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/farmers', authMiddleware, async (req, res) => {
    const { village } = req.query;
    const query = { user: req.user.id };
    if (village) query.village = village;
    const farmers = await Farmer.find(query);
    res.json(farmers);
});

app.post('/api/farmers', authMiddleware, async (req, res) => {
    const newFarmer = new Farmer({ ...req.body, isActive: true, user: req.user.id });
    await newFarmer.save();
    res.json(newFarmer);
});

app.get('/api/farmers/:id', authMiddleware, async (req, res) => {
    const farmer = await Farmer.findOne({ _id: req.params.id, user: req.user.id });
    if (!farmer) return res.status(404).json({ error: "Not found" });
    res.json(farmer);
});

// ✏️ UPDATE FARMER PROFILE (Handles Name/Variety Edits from VillageDetails)
app.put('/api/farmers/:id', authMiddleware, async (req, res) => {
    try {
        const farmer = await Farmer.findOneAndUpdate(
            { _id: req.params.id, user: req.user.id },
            { $set: req.body },
            { new: true }
        );
        if (!farmer) return res.status(404).json({ error: "Farmer not found" });
        res.json(farmer);
    } catch (err) { res.status(500).json({ error: "Update failed" }); }
});

// 🗑️ DELETE FARMER PERMANENTLY
app.delete('/api/farmers/:id', authMiddleware, async (req, res) => {
    try {
        const farmer = await Farmer.findOneAndDelete({ _id: req.params.id, user: req.user.id });
        if (!farmer) return res.status(404).json({ error: "Farmer not found" });
        res.json({ message: "Deleted" });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/farmers/:id/status', authMiddleware, async (req, res) => {
    try {
        const farmer = await Farmer.findOne({ _id: req.params.id, user: req.user.id });
        if (!farmer) return res.status(404).json({ error: "Farmer not found" });
        farmer.isActive = !farmer.isActive; 
        await farmer.save();
        res.json(farmer);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- 💸 TRANSACTION ROUTES ---

app.post('/api/farmers/:id/transaction', authMiddleware, async (req, res) => {
    try {
        const farmer = await Farmer.findOne({ _id: req.params.id, user: req.user.id });
        if (!farmer) return res.status(404).send("Not found");
        farmer.transactions.push(req.body);
        await farmer.save();
        res.json(farmer);
    } catch (err) { res.status(500).json({ error: "Failed to add" }); }
});

app.put('/api/farmers/:id/transaction/:transId', authMiddleware, async (req, res) => {
    try {
        const farmer = await Farmer.findOne({ _id: req.params.id, user: req.user.id });
        if (!farmer) return res.status(404).json({ error: "Farmer not found" });
        const transaction = farmer.transactions.id(req.params.transId);
        if (!transaction) return res.status(404).json({ error: "Transaction not found" });
        Object.assign(transaction, req.body);
        await farmer.save();
        res.json(farmer);
    } catch (err) { res.status(500).json({ error: "Update failed" }); }
});

app.delete('/api/farmers/:id/transaction/:transId', authMiddleware, async (req, res) => {
    try {
        const farmer = await Farmer.findOne({ _id: req.params.id, user: req.user.id });
        if (!farmer) return res.status(404).json({ error: "Farmer not found" });
        farmer.transactions.pull({ _id: req.params.transId });
        await farmer.save();
        res.json(farmer);
    } catch (err) { res.status(500).json({ error: "Delete failed" }); }
});

// --- 📊 ANALYSIS & ACTIVITY ROUTES ---

app.get('/api/analysis', authMiddleware, async (req, res) => {
    try {
        const farmers = await Farmer.find({ user: req.user.id });
        let totalInvestment = 0, totalFertilizerCost = 0, villageStats = {}, fertStats = {};

        farmers.forEach(farmer => {
            farmer.transactions.forEach(t => {
                // Cash stats
                if (t.type === 'Money Lent') {
                    totalInvestment += (t.amount || 0);
                    villageStats[farmer.village] = (villageStats[farmer.village] || 0) + t.amount;
                }
                // Fertilizer/Goods stats
                if (t.type === 'Fertilizer') {
                    totalFertilizerCost += (t.amount || 0);
                    const fName = t.fertilizer_name || "Unknown";
                    if (!fertStats[fName]) fertStats[fName] = { count: 0, cost: 0 };
                    
                    const qty = parseFloat(t.quantity) || 0;
                    const amt = parseFloat(t.amount) || 0;
                    
                    fertStats[fName].count += qty;
                    fertStats[fName].cost += amt;
                }
            });
        });
        res.json({ totalFarmers: farmers.length, totalInvestment, totalFertilizerCost, villageStats, fertStats });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/activity', authMiddleware, async (req, res) => {
  try {
    const { limit, days } = req.query; 
    const pipeline = [
      { $match: { user: new mongoose.Types.ObjectId(req.user.id) } }, 
      { $unwind: "$transactions" },
      { $sort: { "transactions.date": -1, "transactions._id": -1 } },
      { 
        $project: { 
          farmerName: "$name", 
          village: "$village",
          date: "$transactions.date",
          type: "$transactions.type",
          amount: "$transactions.amount",
          details: "$transactions.details",
          fertilizer_name: "$transactions.fertilizer_name",
          quantity: "$transactions.quantity"
        } 
      }
    ];

    if (days) {
      const dateLimit = new Date();
      dateLimit.setDate(dateLimit.getDate() - parseInt(days));
      pipeline.push({ $match: { date: { $gte: dateLimit } } });
    }

    if (limit) pipeline.push({ $limit: parseInt(limit) });

    const activity = await Farmer.aggregate(pipeline);
    res.json(activity);
  } catch (err) { res.status(500).json({ error: "Error fetching activity" }); }
});

// --- 🚀 SERVER START ---
const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Secure Server running on port ${PORT}`));