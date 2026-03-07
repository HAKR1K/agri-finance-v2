import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../config'; 

// 🔌 Native APK Features
import { Capacitor } from '@capacitor/core';
import { Share as CapacitorShare } from '@capacitor/share';

const FarmerDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [farmer, setFarmer] = useState(null);
  
  // Transaction State
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]); 
  const [type, setType] = useState('Money Lent'); 
  const [remarks, setRemarks] = useState(''); 
  const [editingId, setEditingId] = useState(null); 
  const [amount, setAmount] = useState('');
  
  // Fertilizer/Yield State
  const [fertName, setFertName] = useState(''); 
  const [quantity, setQuantity] = useState(''); 
  const [pricePerUnit, setPricePerUnit] = useState('');
  const [bags, setBags] = useState(''); 
  const [quintals, setQuintals] = useState(''); 
  const [pricePerQuintal, setPricePerQuintal] = useState('');

  // 🔵 Miscellaneous Specific State
  const [miscType, setMiscType] = useState('Labour'); // Labour, Machine, Others
  const [miscCount, setMiscCount] = useState('');     // Count (Labor) or Hours (Machine)
  const [miscRate, setMiscRate] = useState('');       // Wage or Hourly Rate

  const API_URL = `${API_BASE_URL}/farmers/${id}`;

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }
    fetchFarmerData(); 
  }, [id, navigate]);

  // 🧮 Auto-Calculate Amount (Preserved Feature)
  useEffect(() => {
    if (type === 'Fertilizer') {
        const qty = parseFloat(quantity) || 0; 
        const price = parseFloat(pricePerUnit) || 0;
        if (qty > 0 && price > 0) setAmount(qty * price);
    } 
    else if (type === 'Yield') {
        const q = parseFloat(quintals) || 0; 
        const p = parseFloat(pricePerQuintal) || 0;
        if (q > 0 && p > 0) setAmount(q * p);
    } 
    else if (type === 'Miscellaneous' && miscType !== 'Others') {
        const c = parseFloat(miscCount) || 0; 
        const r = parseFloat(miscRate) || 0;
        if (c > 0 && r > 0) setAmount(c * r);
    }
  }, [quantity, pricePerUnit, quintals, pricePerQuintal, type, miscType, miscCount, miscRate]);

  const fetchFarmerData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(API_URL, { headers: { Authorization: `Bearer ${token}` } });
      setFarmer(response.data);
    } catch (error) { if (error.response?.status === 401) navigate('/login'); }
  };

  const toggleStatus = async () => {
      try {
          const token = localStorage.getItem('token');
          await axios.put(`${API_URL}/status`, {}, { headers: { Authorization: `Bearer ${token}` } });
          fetchFarmerData();
      } catch (error) { alert("Error updating status"); }
  };

  // --- 🧮 FINANCIALS (Preserved Feature) ---
  const getFinancials = () => {
      if (!farmer) return { dues: 0, paid: 0, balance: 0 };
      const dues = farmer.transactions
        .filter(t => t.type === 'Money Lent' || t.type === 'Fertilizer' || t.type === 'Miscellaneous')
        .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
      const paid = farmer.transactions
        .filter(t => t.type === 'Yield' || t.type === 'Repayment')
        .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
      const balance = dues - paid;
      return { dues, paid, balance };
  };

  const { dues, paid, balance } = getFinancials();

  // --- 📤 NATIVE SHARE FUNCTION (Optimized for APK) ---
  const handleShare = async () => {
    if (!farmer) return;
    const isSurplus = balance < 0; 
    const absBalance = Math.abs(balance);
    const shareText = `🚜 *Statement: ${farmer.name}*\n📍 Village: ${farmer.village}\n------------------------\n📉 Total Dues: ₹${formatAmount(dues)}\n📈 Total Paid: ₹${formatAmount(paid)}\n------------------------\n💰 *FINAL SETTLEMENT:*\n${isSurplus ? "🟢 WE NEED TO PAY YOU:" : "🔴 PENDING DUE:"} *₹${formatAmount(absBalance)}*`.trim();

    if (Capacitor.isNativePlatform()) {
      await CapacitorShare.share({ title: `Statement: ${farmer.name}`, text: shareText });
    } else {
      navigator.clipboard.writeText(shareText);
      alert("📋 Report copied to clipboard!");
    }
  };

  // --- HELPERS ---
  const formatDate = (isoString) => {
    if (!isoString) return "-";
    const d = new Date(isoString);
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear().toString().slice(-2);
    return `${day}/${month}/${year}`;
  };

  const formatAmount = (value) => value ? Number(value).toLocaleString('en-IN') : "0";

  const calculateTotal = (transactions) => transactions.reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);

  const calculateCashNet = (transactions) => {
      let lent = 0; let repaid = 0;
      transactions.forEach(t => {
          if (t.type === 'Money Lent') lent += t.amount;
          if (t.type === 'Repayment') repaid += t.amount;
      });
      return lent - repaid; 
  };

  // --- 💾 SUBMIT (Preserved Logic) ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    let finalAmount = amount; 
    if (type === 'Fertilizer') finalAmount = (parseFloat(quantity) || 0) * (parseFloat(pricePerUnit) || 0);
    else if (type === 'Yield') finalAmount = (parseFloat(quintals) || 0) * (parseFloat(pricePerQuintal) || 0);
    else if (type === 'Miscellaneous' && miscType !== 'Others') finalAmount = (parseFloat(miscCount) || 0) * (parseFloat(miscRate) || 0);

    if (!finalAmount || parseFloat(finalAmount) <= 0) return alert("Error: Check inputs.");

    let finalDetails = remarks;
    if (type === 'Miscellaneous') {
        if (miscType === 'Labour') finalDetails = `Labour: ${miscCount} people x ₹${miscRate} | ${remarks}`;
        else if (miscType === 'Machine') finalDetails = `Machine: ${miscCount} hrs x ₹${miscRate} | ${remarks}`;
        else finalDetails = `Misc: ${remarks}`;
    }

    try {
      const token = localStorage.getItem('token');
      const payload = { 
        date, type, amount: finalAmount, details: finalDetails,
        fertilizer_name: type === 'Fertilizer' ? fertName : undefined,
        quantity: type === 'Fertilizer' ? quantity : undefined,
        price_per_unit: type === 'Fertilizer' ? pricePerUnit : undefined,
        bag_count: type === 'Yield' ? bags : undefined,
        quintals: type === 'Yield' ? quintals : undefined,
        price_per_quintal: type === 'Yield' ? pricePerQuintal : undefined
      };
      const config = { headers: { Authorization: `Bearer ${token}` } };
      if (editingId) await axios.put(`${API_URL}/transaction/${editingId}`, payload, config);
      else await axios.post(`${API_URL}/transaction`, payload, config);
      handleCancel(); fetchFarmerData(); alert("✅ Saved!");
    } catch (error) { alert("Error saving transaction"); }
  };

  const handleEditClick = (t) => {
    setEditingId(t._id); setDate(t.date.split('T')[0]); setType(t.type); setRemarks(t.details || ''); setAmount(t.amount);
    if (t.type === 'Fertilizer') { setFertName(t.fertilizer_name || ''); setQuantity(t.quantity || ''); setPricePerUnit(t.price_per_unit || ''); }
    else if (t.type === 'Yield') { setBags(t.bag_count || ''); setQuintals(t.quintals || ''); setPricePerQuintal(t.price_per_quintal || ''); }
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  };

  const handleCancel = () => {
    setEditingId(null); setAmount(''); setRemarks(''); setFertName(''); setQuantity(''); setPricePerUnit(''); setBags(''); setQuintals(''); setPricePerQuintal('');
    setMiscType('Labour'); setMiscCount(''); setMiscRate('');
    setDate(new Date().toISOString().split('T')[0]); setType('Money Lent');
  };

  if (!farmer) return <div style={{textAlign:"center", padding:"50px"}}>Loading...</div>;

  const moneyTransactions = farmer.transactions.filter(t => t.type === 'Money Lent' || t.type === 'Repayment');
  const yieldTransactions = farmer.transactions.filter(t => t.type === 'Yield');
  const fertilizerTransactions = farmer.transactions.filter(t => t.type === 'Fertilizer');
  const miscTransactions = farmer.transactions.filter(t => t.type === 'Miscellaneous');

  // --- 🎨 NATIVE STYLES ---
  const containerStyle = {
    paddingTop: Capacitor.isNativePlatform() ? 'env(safe-area-inset-top, 50px)' : '20px',
    paddingLeft: "15px", paddingRight: "15px", paddingBottom: "40px",
    width: "100%", maxWidth: "500px", margin: "0 auto", boxSizing: "border-box",
    backgroundColor: "#F8F9FA", minHeight: "100vh"
  };

  const inputStyle = { padding: "12px", border: "1px solid #ddd", borderRadius: "10px", width: "100%", fontSize: "16px", boxSizing: "border-box" };
  const thStyle = { padding: "10px 5px", textAlign: "left", fontSize: "13px", borderBottom: "1px solid #ddd" };
  const tdStyle = { padding: "10px 5px", fontSize: "14px", borderBottom: "1px solid #eee", color: "#333" };

  return (
    <div style={containerStyle}>
      {/* 🔝 Pushed Down Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "#fff", padding: "15px", borderRadius: "16px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)", marginBottom: "20px" }}>
        <button onClick={() => navigate(-1)} style={{ cursor: "pointer", padding:"8px 12px", backgroundColor: "#f0f2f5", color: "#333", border: "none", borderRadius: "10px", fontWeight: "bold" }}>⬅ Back</button>
        <button onClick={handleShare} style={{ cursor: "pointer", padding:"8px 15px", backgroundColor: "#E3F2FD", color: "#1565C0", border: "none", borderRadius: "20px", fontWeight: "bold" }}>📤 Share</button>
      </div>

      <div style={{textAlign:"center", marginBottom: "20px"}}>
        <h1 style={{ margin: "0", fontSize: "24px", color: farmer.isActive ? "#1A1A1A" : "#aaa" }}>{farmer.name}</h1>
        <p style={{ margin: "5px 0", color: "#666", fontSize: "14px" }}>{farmer.village} | {farmer.paddy_variety}</p>
        
        <div style={{ margin: "15px 0", padding: "20px", borderRadius: "20px", backgroundColor: balance < 0 ? "#E8F5E9" : "#FFEBEE" }}>
            <small style={{ color: "#666", fontSize:"11px", fontWeight: "bold" }}>{balance < 0 ? "WE PAY FARMER" : "FARMER OWES US"}</small>
            <div style={{ color: balance < 0 ? "green" : "#D32F2F", fontSize: "32px", fontWeight: "900" }}>₹{formatAmount(Math.abs(balance))}</div>
        </div>

        <button onClick={toggleStatus} style={{ padding: "8px 16px", borderRadius: "20px", border: "none", fontWeight: "bold", backgroundColor: farmer.isActive ? "#e0e0e0" : "#4CAF50", color: farmer.isActive ? "#333" : "white" }}>
            {farmer.isActive ? "Mark as Settled" : "Re-open Account"}
        </button>
      </div>

      {/* --- ALL 4 TABLES PRESERVED --- */}

      {/* Yield (Yellow) */}
      <div style={{ backgroundColor: "#fff", padding: "15px", borderRadius: "16px", marginBottom: "20px" }}>
        <h3 style={{ color: "#fab505", borderBottom: "2px solid #fab505", paddingBottom: "5px", margin: "0 0 10px 0", fontSize: "16px" }}>🌾 Yield History</h3>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr><th style={thStyle}>Date</th><th style={thStyle}>Bags</th><th style={thStyle}>Value</th><th></th></tr></thead>
            <tbody>
                {yieldTransactions.length === 0 && <tr><td colSpan="4" style={{textAlign:"center", padding:"10px", color:"#aaa"}}>No records.</td></tr>}
                {yieldTransactions.slice().reverse().map(t => (
                    <tr key={t._id}>
                        <td style={tdStyle}>{formatDate(t.date)}</td>
                        <td style={tdStyle}>{t.bag_count} <span style={{fontSize:"11px", color:"#888"}}>({t.quintals}Q)</span></td>
                        <td style={{...tdStyle, fontWeight:"bold", color:"green"}}>₹{formatAmount(t.amount)}</td>
                        <td style={tdStyle}><button onClick={() => handleEditClick(t)} style={{border:"none", background:"none"}}>✏️</button></td>
                    </tr>
                ))}
            </tbody>
        </table>
      </div>

      {/* Cash (Red) */}
      <div style={{ backgroundColor: "#fff", padding: "15px", borderRadius: "16px", marginBottom: "20px" }}>
        <h3 style={{ color: "#d32f2f", borderBottom: "2px solid #d32f2f", paddingBottom: "5px", margin: "0 0 10px 0", fontSize: "16px" }}>💰 Cash</h3>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr><th style={thStyle}>Date</th><th style={thStyle}>Note</th><th style={thStyle}>Amt</th><th></th></tr></thead>
            <tbody>
                {moneyTransactions.length === 0 && <tr><td colSpan="4" style={{textAlign:"center", padding:"10px", color:"#aaa"}}>No records.</td></tr>}
                {moneyTransactions.slice().reverse().map(t => (
                    <tr key={t._id}>
                        <td style={tdStyle}>{formatDate(t.date)}</td>
                        <td style={tdStyle}>{t.details || '-'}</td>
                        <td style={{...tdStyle, fontWeight:"bold", color: t.type==='Repayment'?"green":"red"}}>{t.type==='Repayment'?"+":"-"} {formatAmount(t.amount)}</td>
                        <td style={tdStyle}><button onClick={() => handleEditClick(t)} style={{border:"none", background:"none"}}>✏️</button></td>
                    </tr>
                ))}
            </tbody>
        </table>
      </div>

      {/* Goods (Green) */}
      <div style={{ backgroundColor: "#fff", padding: "15px", borderRadius: "16px", marginBottom: "20px" }}>
        <h3 style={{ color: "#2e7d32", borderBottom: "2px solid #2e7d32", paddingBottom: "5px", margin: "0 0 10px 0", fontSize: "16px" }}>🌱 Goods</h3>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr><th style={thStyle}>Date</th><th style={thStyle}>Item</th><th style={{...thStyle, textAlign: "right"}}>Total</th><th></th></tr></thead>
            <tbody>
                {fertilizerTransactions.length === 0 && <tr><td colSpan="4" style={{textAlign:"center", padding:"10px", color:"#aaa"}}>No records.</td></tr>}
                {fertilizerTransactions.slice().reverse().map(t => (
                    <tr key={t._id}>
                        <td style={tdStyle}>{formatDate(t.date)}</td>
                        <td style={tdStyle}>{t.fertilizer_name} <br/><span style={{fontSize:"11px", color:"#888"}}>(Qty: {t.quantity})</span></td>
                        <td style={{...tdStyle, fontWeight:"bold", color:"red", textAlign: "right"}}>₹{formatAmount(t.amount)}</td>
                        <td style={tdStyle}><button onClick={() => handleEditClick(t)} style={{border:"none", background:"none"}}>✏️</button></td>
                    </tr>
                ))}
            </tbody>
        </table>
      </div>

      {/* Misc (Blue) */}
      <div style={{ backgroundColor: "#fff", padding: "15px", borderRadius: "16px", marginBottom: "20px" }}>
        <h3 style={{ color: "#1976D2", borderBottom: "2px solid #1976D2", paddingBottom: "5px", margin: "0 0 10px 0", fontSize: "16px" }}>🔵 Miscellaneous</h3>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr><th style={thStyle}>Date</th><th style={thStyle}>Details</th><th style={{...thStyle, textAlign: "right"}}>Cost</th><th></th></tr></thead>
            <tbody>
                {miscTransactions.length === 0 && <tr><td colSpan="4" style={{textAlign:"center", padding:"10px", color:"#aaa"}}>No records.</td></tr>}
                {miscTransactions.slice().reverse().map(t => (
                    <tr key={t._id}>
                        <td style={tdStyle}>{formatDate(t.date)}</td>
                        <td style={tdStyle}>{t.details}</td>
                        <td style={{...tdStyle, fontWeight:"bold", color:"#C62828", textAlign: "right"}}>₹{formatAmount(t.amount)}</td>
                        <td style={tdStyle}><button onClick={() => handleEditClick(t)} style={{border:"none", background:"none"}}>✏️</button></td>
                    </tr>
                ))}
            </tbody>
        </table>
      </div>

      {/* --- FULL FORM PRESERVED --- */}
      {farmer.isActive && (
        <div style={{ backgroundColor: editingId ? "#fff3e0" : "#fff", padding: "24px", borderRadius: "24px", boxShadow: "0 10px 25px rgba(0,0,0,0.08)" }}>
            <h3 style={{ margin: "0 0 15px 0", fontSize: "18px", textAlign: "center" }}>{editingId ? "✏️ Edit Record" : "➕ Add Transaction"}</h3>
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={inputStyle} />
                <select value={type} onChange={(e) => setType(e.target.value)} style={inputStyle}>
                    <option value="Money Lent">🔴 Money Lent</option>
                    <option value="Fertilizer">🌱 Fertilizer</option>
                    <option value="Yield">🌾 Yield (Harvest)</option>
                    <option value="Miscellaneous">🔵 Miscellaneous</option>
                    <option value="Repayment">🟢 Repayment</option>
                </select>

                {type === 'Miscellaneous' && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px", padding: "12px", background: "#E3F2FD", borderRadius: "14px" }}>
                        <div style={{display:"flex", gap:"10px"}}>
                            {['Labour', 'Machine', 'Others'].map(m => (
                                <button key={m} type="button" onClick={() => setMiscType(m)} style={{flex:1, padding:"10px", background: miscType===m?"#1976D2":"white", color: miscType===m?"white":"#333", border: "1px solid #1976D2", borderRadius:"8px", fontSize:"12px", fontWeight:"bold"}}>{m}</button>
                            ))}
                        </div>
                        {miscType !== 'Others' && (
                            <div style={{display:"flex", gap:"10px"}}>
                                <input type="number" placeholder={miscType==='Labour'?"People":"Hours"} value={miscCount} onChange={(e) => setMiscCount(e.target.value)} style={inputStyle} />
                                <input type="number" placeholder="Rate" value={miscRate} onChange={(e) => setMiscRate(e.target.value)} style={inputStyle} />
                            </div>
                        )}
                    </div>
                )}

                {type === 'Yield' && (<div style={{display:"flex", gap:"10px"}}><input type="number" placeholder="Bags" value={bags} onChange={(e) => setBags(e.target.value)} style={inputStyle} /><input type="number" placeholder="Quintals" value={quintals} onChange={(e) => setQuintals(e.target.value)} style={inputStyle} /><input type="number" placeholder="Price/Q" value={pricePerQuintal} onChange={(e) => setPricePerQuintal(e.target.value)} style={inputStyle} /></div>)}
                {type === 'Fertilizer' && (<div style={{display:"flex", gap:"10px", flexDirection: "column"}}><input type="text" placeholder="Item Name" value={fertName} onChange={(e) => setFertName(e.target.value)} style={inputStyle} /><div style={{display:"flex", gap:"10px"}}><input type="number" placeholder="Qty" value={quantity} onChange={(e) => setQuantity(e.target.value)} style={inputStyle} /><input type="number" placeholder="Price" value={pricePerUnit} onChange={(e) => setPricePerUnit(e.target.value)} style={inputStyle} /></div></div>)}
                {(type === 'Money Lent' || type === 'Repayment' || (type === 'Miscellaneous' && miscType === 'Others')) && (<input type="number" placeholder="Amount (₹)" value={amount} onChange={(e) => setAmount(e.target.value)} style={inputStyle} />)}
                
                <input type="text" placeholder="Remarks" value={remarks} onChange={(e) => setRemarks(e.target.value)} style={inputStyle} />

                <button type="submit" style={{ padding: "16px", backgroundColor: editingId ? "orange" : "#1A1A1A", color: "white", border: "none", borderRadius: "14px", fontWeight: "900", fontSize: "16px" }}>{editingId ? "UPDATE" : "SAVE"}</button>
                {editingId && <button type="button" onClick={handleCancel} style={{padding:"12px", border:"none", background:"#ddd", borderRadius:"14px"}}>CANCEL</button>}
            </form>
        </div>
      )}
    </div>
  );
};

export default FarmerDetails;