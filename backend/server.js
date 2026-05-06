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
const Load = require('./models/Load');

const app = express();

// 🛡️ CORS MIDDLEWARE (must come before helmet)
// Define the allowed origins in an array for better readability
const allowedOrigins = [
    'https://agri-finance-v2-six.vercel.app',
    'https://agrifinance-app.onrender.com'
];

const corsOptions = {
    origin: function (origin, callback) {
        // ALWAYS allow all origins for now to debug deployment
        callback(null, true);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    optionsSuccessStatus: 200 
};

// Apply CORS to all routes
app.use(cors(corsOptions));

// FIXED: Use a regular expression instead of '*' to avoid the PathError crash
// This handles the "Preflight" OPTIONS requests for every route
app.options(/(.*)/, cors(corsOptions));

// 🛡️ SECURITY MIDDLEWARE
// app.use(helmet()); // Temporarily disabled for CORS debugging
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

// 📧 EMAIL CONFIG
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

// --- 🧮 Interest Helpers ---
// Matches the frontend "accrued interest" logic:
// - diffDays is floored
// - months = diffDays / 30
// - interest = principal * rate(%) * months / 100
const getTodayIsoDateUtc = () => new Date().toISOString().split('T')[0]; // YYYY-MM-DD (UTC)

// Normalizes any provided date into a UTC-midnight timestamp so day-differences
// don't drift due to timezone or time components.
const toUtcMidnightMs = (value) => {
    if (!value) return null;

    if (value instanceof Date) {
        const y = value.getUTCFullYear();
        const m = value.getUTCMonth();
        const d = value.getUTCDate();
        return Date.UTC(y, m, d);
    }

    if (typeof value === 'string') {
        const isoMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if (isoMatch) {
            const y = Number(isoMatch[1]);
            const m = Number(isoMatch[2]) - 1;
            const d = Number(isoMatch[3]);
            return Date.UTC(y, m, d);
        }
    }

    const dt = new Date(value);
    if (Number.isNaN(dt.getTime())) return null;
    return Date.UTC(dt.getUTCFullYear(), dt.getUTCMonth(), dt.getUTCDate());
};

const calculateAccruedInterest = (principal, rate, startDate, targetDate) => {
    const p = Number(principal);
    const r = Number(rate);
    // If rate or principal is invalid/missing, treat interest as 0.
    if (!Number.isFinite(p) || !Number.isFinite(r) || p <= 0 || r <= 0) return 0;
    if (!startDate) return 0;
    if (!targetDate) targetDate = getTodayIsoDateUtc();

    const startMs = toUtcMidnightMs(startDate);
    const targetMs = toUtcMidnightMs(targetDate);
    if (startMs === null || targetMs === null) return 0;

    const diffTime = targetMs - startMs;
    if (diffTime <= 0) return 0;

    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const months = diffDays / 30; // standard commercial month
    const interest = (p * r * months) / 100;
    // Round to 2 decimals to stabilize DB values and sums
    return Number(interest.toFixed(2));
};

const getTransactionInterest = (t, farmer) => {
    // If interest_date isn't present, calculate dynamically
    let targetDate = t.interest_date;
    if (!targetDate) {
        if (farmer && farmer.isActive === false && farmer.settledDate) {
            targetDate = farmer.settledDate;
        } else {
            targetDate = getTodayIsoDateUtc();
        }
    }
    return calculateAccruedInterest(t.amount, t.interest_rate, t.date, targetDate);
};

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

// --- 🏠 VILLAGE ROUTES ---

const addFarmerToVillage = async (farmer) => {
    const village = await Village.findOne({ user: farmer.user, name: farmer.village, deleted: { $ne: true } });
    if (!village) return;
    if (!village.farmers.some(id => id.equals(farmer._id))) {
        village.farmers.push(farmer._id);
        await village.save();
    }
};

const removeFarmerFromVillage = async (farmerId, villageName, userId) => {
    const village = await Village.findOne({ user: userId, name: villageName, deleted: { $ne: true } });
    if (!village) return;
    village.farmers = village.farmers.filter(id => !id.equals(farmerId));
    await village.save();
};

app.get('/api/villages', authMiddleware, async (req, res) => {
    const villages = await Village.find({ user: req.user.id, deleted: { $ne: true } });
    res.json(villages);
});

app.post('/api/villages', authMiddleware, async (req, res) => {
    try {
        const newVillage = new Village({ name: req.body.name, user: req.user.id });
        await newVillage.save();
        res.json(newVillage);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/villages/:id', authMiddleware, async (req, res) => {
    try {
        const village = await Village.findOneAndUpdate(
            { _id: req.params.id, user: req.user.id, deleted: { $ne: true } },
            { name: req.body.name },
            { new: true }
        );
        if (!village) return res.status(404).json({ error: "Village not found" });
        res.json(village);
    } catch (err) { res.status(500).json({ error: "Update failed" }); }
});

app.delete('/api/villages/:id', authMiddleware, async (req, res) => {
    try {
        const village = await Village.findOne({ _id: req.params.id, user: req.user.id, deleted: { $ne: true } });
        if (!village) return res.status(404).json({ error: "Village not found" });

        // Soft delete farmers belonging to this village
        await Farmer.updateMany(
            { village: village.name, user: req.user.id },
            { $set: { deleted: true } }
        );

        // Soft delete the village and clear its farmer list
        await Village.updateOne({ _id: req.params.id }, { $set: { deleted: true, farmers: [] } });
        res.json({ message: "Deleted" });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/villages/:id/restore', authMiddleware, async (req, res) => {
    try {
        const village = await Village.findOneAndUpdate(
            { _id: req.params.id, user: req.user.id, deleted: true },
            { deleted: false },
            { new: true }
        );
        if (!village) return res.status(404).json({ error: "Archived village not found" });

        // Restore the farmers that belong to this village
        await Farmer.updateMany(
            { village: village.name, user: req.user.id, deleted: true },
            { $set: { deleted: false } }
        );

        res.json(village);
    } catch (err) { res.status(500).json({ error: "Restore failed" }); }
});

app.delete('/api/villages/:id/permanent', authMiddleware, async (req, res) => {
    try {
        const village = await Village.findOne({ _id: req.params.id, user: req.user.id, deleted: true });
        if (!village) return res.status(404).json({ error: "Archived village not found" });
        // Permanently delete the village document
        await Village.deleteOne({ _id: req.params.id, user: req.user.id });
        res.json({ message: "Village permanently deleted" });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- 👨‍🌾 FARMER ROUTES ---

app.get('/api/farmers', authMiddleware, async (req, res) => {
    const { village } = req.query;
    const query = { user: req.user.id, deleted: { $ne: true } };
    if (village) query.village = village;
    const farmers = await Farmer.find(query);
    res.json(farmers);
});

app.post('/api/farmers', authMiddleware, async (req, res) => {
    try {
        const village = await Village.findOne({ user: req.user.id, name: req.body.village, deleted: { $ne: true } });
        const newFarmer = new Farmer({ ...req.body, isActive: true, status: 'Active', user: req.user.id, villageId: village ? village._id : null });
        await newFarmer.save();
        if (village) {
            village.farmers.push(newFarmer._id);
            await village.save();
        }
        res.json(newFarmer);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/farmers/:id', authMiddleware, async (req, res) => {
    const farmer = await Farmer.findOne({ _id: req.params.id, user: req.user.id });
    if (!farmer) return res.status(404).json({ error: "Not found" });
    res.json(farmer);
});

app.put('/api/farmers/:id', authMiddleware, async (req, res) => {
    try {
        const existingFarmer = await Farmer.findOne({ _id: req.params.id, user: req.user.id });
        if (!existingFarmer) return res.status(404).json({ error: "Farmer not found" });

        const oldVillage = existingFarmer.village;
        const updatedData = { $set: req.body };

        if (req.body.village && req.body.village !== oldVillage) {
            const newVillage = await Village.findOne({ user: req.user.id, name: req.body.village, deleted: { $ne: true } });
            updatedData.$set.villageId = newVillage ? newVillage._id : null;
        }

        const farmer = await Farmer.findOneAndUpdate(
            { _id: req.params.id, user: req.user.id },
            updatedData,
            { new: true }
        );
        if (!farmer) return res.status(404).json({ error: "Farmer not found" });

        if (req.body.village && req.body.village !== oldVillage) {
            await removeFarmerFromVillage(farmer._id, oldVillage, req.user.id);
            await addFarmerToVillage(farmer);
        }

        res.json(farmer);
    } catch (err) { res.status(500).json({ error: "Update failed" }); }
});

app.delete('/api/farmers/:id', authMiddleware, async (req, res) => {
    try {
        const farmer = await Farmer.findOne({ _id: req.params.id, user: req.user.id, deleted: { $ne: true } });
        if (!farmer) return res.status(404).json({ error: "Farmer not found" });
        // Optional: Remove from village array. Since we might restore, let's just leave the array as is.
        // await removeFarmerFromVillage(farmer._id, farmer.village, req.user.id);
        
        await Farmer.updateOne({ _id: req.params.id, user: req.user.id }, { $set: { deleted: true } });
        res.json({ message: "Farmer archived" });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/farmers/:id/restore', authMiddleware, async (req, res) => {
    try {
        const farmer = await Farmer.findOneAndUpdate(
            { _id: req.params.id, user: req.user.id, deleted: true },
            { deleted: false },
            { new: true }
        );
        if (!farmer) return res.status(404).json({ error: "Archived farmer not found" });

        // Check if the original village exists
        let village = await Village.findOne({ name: farmer.village, user: req.user.id });
        if (village) {
            if (village.deleted) {
                village.deleted = false;
                await village.save();
            }
        } else {
            village = new Village({ name: farmer.village, user: req.user.id });
            await village.save();
        }

        // Ensure the farmer's ID is in the village array
        if (!village.farmers.includes(farmer._id)) {
            village.farmers.push(farmer._id);
            await village.save();
        }

        if (farmer.villageId?.toString() !== village._id.toString()) {
            farmer.villageId = village._id;
            await farmer.save();
        }

        res.json(farmer);
    } catch (err) { res.status(500).json({ error: "Restore failed" }); }
});

app.delete('/api/farmers/:id/permanent', authMiddleware, async (req, res) => {
    try {
        const farmer = await Farmer.findOne({ _id: req.params.id, user: req.user.id, deleted: true });
        if (!farmer) return res.status(404).json({ error: "Archived farmer not found" });
        // Permanently delete the farmer document
        await Farmer.deleteOne({ _id: req.params.id, user: req.user.id });
        res.json({ message: "Farmer permanently deleted" });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/farmers/:id/status', authMiddleware, async (req, res) => {
    try {
        const farmer = await Farmer.findOne({ _id: req.params.id, user: req.user.id });
        if (!farmer) return res.status(404).json({ error: "Farmer not found" });
        farmer.isActive = !farmer.isActive;
        if (farmer.isActive === false) {
            farmer.settledDate = getTodayIsoDateUtc();
        } else {
            farmer.settledDate = null;
        }
        await farmer.save();
        res.json(farmer);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- 💸 TRANSACTION ROUTES ---

app.post('/api/farmers/:id/transaction', authMiddleware, async (req, res) => {
    try {
        const farmer = await Farmer.findOne({ _id: req.params.id, user: req.user.id });
        if (!farmer) return res.status(404).send("Not found");
        const village = await Village.findOne({ user: req.user.id, name: farmer.village, deleted: { $ne: true } });
        const transactionData = { ...req.body, villageId: village ? village._id : null };

        // Ensure interest is stored accurately
        if (['Loan', 'Investment', 'Money Lent'].includes(transactionData.type)) {
            let targetDate = transactionData.interest_date;
            if (!targetDate) {
                targetDate = (farmer.isActive === false && farmer.settledDate) ? farmer.settledDate : getTodayIsoDateUtc();
            }

            const computed = calculateAccruedInterest(
                transactionData.amount,
                transactionData.interest_rate,
                transactionData.date,
                transactionData.interest_date
            );
            transactionData.interest = computed;
        }

        farmer.transactions.push(transactionData);
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

        // Recompute interest after any update to ensure DB column stays correct.
        if (['Loan', 'Investment', 'Money Lent'].includes(transaction.type)) {
            let targetDate = transaction.interest_date;
            if (!targetDate) {
                targetDate = (farmer.isActive === false && farmer.settledDate) ? farmer.settledDate : getTodayIsoDateUtc();
            }

            const computed = calculateAccruedInterest(
                transaction.amount,
                transaction.interest_rate,
                transaction.date,
                transaction.interest_date
            );
            transaction.interest = computed;
        }

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
        const userId = req.user.id;
        
        // 1. Fetch only Farmers & Villages belonging to THIS user
        const villages = await Village.find({ user: userId, deleted: { $ne: true } });
        
        // Clean up any farmers with invalid village names (for non-deleted only)
        const villageNames = villages.map(v => v.name);
        await Farmer.updateMany(
            { user: userId, deleted: { $ne: true }, village: { $nin: [...villageNames, 'Unassigned'] } },
            { $set: { village: 'Unassigned' } }
        );

        const farmers = await Farmer.find({ user: userId, deleted: { $ne: true } });
        let totalInvestment = 0, totalFertilizerCost = 0, totalMisc = 0, totalYield = 0, totalRepayment = 0;
        let villageStats = {}, fertStats = {};

        // 2. 🔄 VILLAGE-DRIVEN LOOP: Starts only with villages in your active records
        const spendTypes = ['Money Lent', 'Loan', 'Investment', 'Fertilizer', 'Miscellaneous'];
        const activeFarmers = farmers.filter(f => f.isActive !== false && f.status !== 'Inactive');

        const villageData = villages.map(v => {
            const villagers = activeFarmers.filter(f => {
                if (f.villageId && f.villageId.toString() === v._id.toString()) return true;
                return f.village === v.name;
            });

            const totalForVillage = villagers.reduce((sum, farmer) => {
                return sum + farmer.transactions.reduce((tally, t) => {
                    return tally + (spendTypes.includes(t.type) ? (t.amount || 0) : 0);
                }, 0);
            }, 0);

            villageStats[v.name] = totalForVillage;

            const villagerDetails = villagers.map(farmer => {
                const totalCash = farmer.transactions.reduce((sum, t) => {
                    return sum + (spendTypes.includes(t.type) ? (t.amount || 0) : 0);
                }, 0);
                return { _id: farmer._id, name: farmer.name, totalCash };
            });

            return {
                _id: v._id,
                name: v.name,
                deleted: v.deleted || false,
                totalCash: totalForVillage,
                villagers: villagerDetails,
                farmerCount: villagers.length
            };
        });

        const finance = villageData.map(village => ({
            _id: village._id,
            name: village.name,
            deleted: village.deleted,
            totalCash: village.totalCash,
            villagers: village.villagers
        }));

        // 3. Calculate global totals (Independent of village names)
        activeFarmers.forEach(farmer => {
            farmer.transactions.forEach(t => {
                const amt = parseFloat(t.amount) || 0;
                if (['Money Lent', 'Loan', 'Investment'].includes(t.type)) totalInvestment += amt;
                if (t.type === 'Repayment') {
                    totalRepayment += amt;
                    totalInvestment -= amt;
                }
                
                if (t.type === 'Fertilizer') {
                    totalFertilizerCost += amt;
                    const fName = t.fertilizer_name || "Unknown";
                    if (!fertStats[fName]) fertStats[fName] = { count: 0, cost: 0 };
                    
                    const qty = parseFloat(t.quantity) || 0;
                    fertStats[fName].count += qty;
                    fertStats[fName].cost += amt;
                }
            });
        });

        // 4. Fetch deleted villages for archive section
        const deletedVillages = await Village.find({ user: userId, deleted: true });
        const deletedFarmers = await Farmer.find({ user: userId, deleted: true });

        res.json({ 
            totalFarmers: farmers.length, 
            totalInvestment, 
            totalFertilizerCost, 
            totalMisc,
            totalYield,
            totalRepayment,
            villageStats, 
            villageData, 
            finance, 
            fertStats, 
            deletedVillages, 
            deletedVillages, 
            deletedFarmers 
        });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/advanced-analysis', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const villages = await Village.find({ user: userId, deleted: { $ne: true } });
        const farmers = await Farmer.find({ user: userId, deleted: { $ne: true } });
        const loads = await Load.find({ user: userId }).sort({ date: -1 });

        const allFarmersData = farmers.map(f => {
            let totalBags = 0;
            let totalQuintals = 0;
            f.transactions.forEach(t => {
                if (t.type === 'Yield') {
                    totalBags += parseFloat(t.bag_count) || 0;
                    totalQuintals += parseFloat(t.quintals) || 0;
                }
            });
            return {
                _id: f._id,
                name: f.name,
                village: f.village,
                bags: totalBags,
                quintals: totalQuintals,
                variety: f.paddy_variety || "Unknown Variety"
            };
        }).sort((a,b) => b.bags - a.bags); // Sort largest bag count first
        
        let advancedVillageData = [];
        let grandTotalLoan = 0;
        let grandTotalInvestment = 0;
        let grandTotalFertilizer = 0;
        let grandTotalLabour = 0;
        let grandTotalMachine = 0;
        let grandTotalGross = 0;
        let grandTotalLoanInterest = 0;
        let grandTotalInvestmentInterest = 0;
        let grandTotalYieldAmount = 0;
        let grandYieldDetails = {}; // Grouped by paddy_variety

        // NOTE: We used to perform a sequential sync-save loop here for interest drift.
        // It has been removed to fix the "buffering" / timeout issues.
        // The stats calculation below already uses getTransactionInterest(t) to ensure accuracy.

        villages.forEach(v => {
            // Include ALL farmers for this village (settled and not settled)
            const villagers = farmers.filter(f => {
                if (f.villageId && f.villageId.toString() === v._id.toString()) return true;
                return f.village === v.name;
            });

            let villageLoanAmount = 0;
            let villageLoanInterest = 0;
            let villageInvestmentAmount = 0;
            let villageInvestmentInterest = 0;
            let villageFertilizerCost = 0;
            let villageLabourCost = 0;
            let villageLabourCount = 0;
            let villageMachineCost = 0;
            let villageMiscCost = 0;
            let villageYieldAmount = 0;
            
            let fertilizerDetails = {};
            let villageYieldDetails = {}; // Grouped by paddy_variety

            villagers.forEach(farmer => {
                const variety = farmer.paddy_variety || "Unknown Variety";

                farmer.transactions.forEach(t => {
                    const amt = parseFloat(t.amount) || 0;
                    
                    if (['Money Lent', 'Loan'].includes(t.type)) {
                        villageLoanAmount += amt;
                        villageLoanInterest += getTransactionInterest(t, farmer);
                    } 
                    else if (t.type === 'Repayment') {
                        villageLoanAmount -= amt;
                    }                    else if (t.type === 'Investment') {
                        villageInvestmentAmount += amt;
                        villageInvestmentInterest += getTransactionInterest(t, farmer);
                    }
                    else if (t.type === 'Fertilizer') {
                        villageFertilizerCost += amt;
                        const fName = t.fertilizer_name || "Unknown";
                        if (!fertilizerDetails[fName]) fertilizerDetails[fName] = { count: 0, cost: 0 };
                        fertilizerDetails[fName].count += (parseFloat(t.quantity) || 0);
                        fertilizerDetails[fName].cost += amt;
                    } 
                    else if (t.type === 'Yield') {
                        villageYieldAmount += amt;
                        grandTotalYieldAmount += amt;
                        
                        const bag = parseFloat(t.bag_count) || 0;
                        const qnt = parseFloat(t.quintals) || 0;

                        if (!villageYieldDetails[variety]) villageYieldDetails[variety] = { amount: 0, bag_count: 0, quintals: 0 };
                        villageYieldDetails[variety].amount += amt;
                        villageYieldDetails[variety].bag_count += bag;
                        villageYieldDetails[variety].quintals += qnt;

                        if (!grandYieldDetails[variety]) grandYieldDetails[variety] = { amount: 0, bag_count: 0, quintals: 0 };
                        grandYieldDetails[variety].amount += amt;
                        grandYieldDetails[variety].bag_count += bag;
                        grandYieldDetails[variety].quintals += qnt;
                    }
                    else if (t.type === 'Miscellaneous') {
                        if (t.details && t.details.startsWith('Labour:')) {
                            villageLabourCost += amt;
                            const match = t.details.match(/Labour:\s*([\d.]+)/);
                            if (match && match[1]) villageLabourCount += parseFloat(match[1]);
                        } else if (t.details && t.details.startsWith('Machine:')) {
                            villageMachineCost += amt;
                        } else {
                            villageMiscCost += amt;
                        }
                    }
                });
            });

            const villageGross = villageLoanAmount + villageLoanInterest + villageInvestmentAmount + villageInvestmentInterest + villageFertilizerCost + villageLabourCost + villageMachineCost + villageMiscCost;

            grandTotalLoan += villageLoanAmount;
            grandTotalLoanInterest += villageLoanInterest;
            grandTotalInvestment += villageInvestmentAmount;
            grandTotalInvestmentInterest += villageInvestmentInterest;
            grandTotalFertilizer += villageFertilizerCost;
            grandTotalLabour += villageLabourCost;
            grandTotalMachine += villageMachineCost;
            grandTotalGross += villageGross;

            advancedVillageData.push({
                _id: v._id,
                name: v.name,
                villageLoanAmount,
                villageLoanInterest,
                villageInvestmentAmount,
                villageInvestmentInterest,
                villageFertilizerCost,
                villageLabourCost,
                villageLabourCount,
                villageMachineCost,
                villageMiscCost,
                villageGross,
                fertilizerDetails: Object.entries(fertilizerDetails).map(([name, data]) => ({ name, count: data.count, cost: data.cost })),
                villageYieldAmount,
                yieldDetails: Object.entries(villageYieldDetails).map(([name, data]) => ({ name, ...data }))
            });
        });

        res.json({
            grandTotalLoan,
            grandTotalLoanInterest,
            grandTotalInvestment,
            grandTotalInvestmentInterest,
            grandTotalFertilizer,
            grandTotalLabour,
            grandTotalMachine,
            grandTotalGross,
            grandTotalYieldAmount,
            grandYieldDetails: Object.entries(grandYieldDetails).map(([name, data]) => ({ name, ...data })),
            allFarmersData,
            loads,
            advancedVillageData
        });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/loads', authMiddleware, async (req, res) => {
    try {
        const { name, farmers, totalBags } = req.body;
        const newLoad = new Load({ name, farmers, totalBags, user: req.user.id });
        await newLoad.save();
        res.json(newLoad);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/loads/:id', authMiddleware, async (req, res) => {
    try {
        await Load.findOneAndDelete({ _id: req.params.id, user: req.user.id });
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/cash-analysis', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const villages = await Village.find({ user: userId, deleted: { $ne: true } }).sort({ name: 1 });
        const farmers = await Farmer.find({ user: userId, deleted: { $ne: true } });
        
        let globalTotalLoan = 0;
        let globalTotalInvestment = 0;
        let villageData = [];

        villages.forEach(v => {
            const villagers = farmers.filter(f => {
                if (f.villageId && f.villageId.toString() === v._id.toString()) return true;
                return f.village === v.name;
            }).sort((a, b) => a.name.localeCompare(b.name));

            let currentVillageFarmers = [];
            let villageTotalLoan = 0;
            let villageTotalInvestment = 0;

            villagers.forEach(farmer => {
                let farmerLoan = 0;
                let farmerInvestment = 0;

                farmer.transactions.forEach(t => {
                    const amt = parseFloat(t.amount) || 0;
                    if (['Money Lent', 'Loan'].includes(t.type)) farmerLoan += amt;
                    else if (t.type === 'Investment') farmerInvestment += amt;
                    else if (t.type === 'Repayment') farmerLoan -= amt;
                });

                if (farmerLoan > 0 || farmerInvestment > 0) {
                    currentVillageFarmers.push({
                        _id: farmer._id,
                        name: farmer.name,
                        loan: farmerLoan,
                        investment: farmerInvestment,
                        total: farmerLoan + farmerInvestment
                    });
                }

                villageTotalLoan += farmerLoan;
                villageTotalInvestment += farmerInvestment;
            });

            if (currentVillageFarmers.length > 0) {
                globalTotalLoan += villageTotalLoan;
                globalTotalInvestment += villageTotalInvestment;
                
                villageData.push({
                    _id: v._id,
                    name: v.name,
                    farmers: currentVillageFarmers,
                    villageTotalLoan,
                    villageTotalInvestment,
                    villageTotalCash: villageTotalLoan + villageTotalInvestment
                });
            }
        });

        res.json({
            globalTotalLoan,
            globalTotalInvestment,
            globalTotalCash: globalTotalLoan + globalTotalInvestment,
            villageData
        });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/activity', authMiddleware, async (req, res) => {
  try {
    const { limit, days } = req.query; 
    const pipeline = [
      { $match: { user: new mongoose.Types.ObjectId(req.user.id), deleted: { $ne: true } } }, 
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