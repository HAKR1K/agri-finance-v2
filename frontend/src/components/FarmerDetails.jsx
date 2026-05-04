import './FarmerDetails.css';
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../config';

import { Capacitor } from '@capacitor/core';
import { Share as CapacitorShare } from '@capacitor/share';

const FarmerDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [farmer, setFarmer] = useState(null);

  const [activeEditSection, setActiveEditSection] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [type, setType] = useState('Loan');
  const [remarks, setRemarks] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [amount, setAmount] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [hasInterest, setHasInterest] = useState(true);
  const [interestTargetDate, setInterestTargetDate] = useState('');
  const [interestAmount, setInterestAmount] = useState('');
  const [interestDate, setInterestDate] = useState('');

  const [fertName, setFertName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [pricePerUnit, setPricePerUnit] = useState('');
  const [bags, setBags] = useState('');
  const [quintals, setQuintals] = useState('');
  const [pricePerQuintal, setPricePerQuintal] = useState('');

  const [miscType, setMiscType] = useState('Labour');
  const [miscCount, setMiscCount] = useState('');
  const [miscRate, setMiscRate] = useState('');

  const API_URL = `${API_BASE_URL}/farmers/${id}`;

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }
    fetchFarmerData();
  }, [id, navigate]);

  useEffect(() => {
    if (type === 'Fertilizer') {
      const qty = parseFloat(quantity) || 0;
      const price = parseFloat(pricePerUnit) || 0;
      setAmount(qty * price || '');
    } else if (type === 'Yield') {
      const q = parseFloat(quintals) || 0;
      const p = parseFloat(pricePerQuintal) || 0;
      setAmount(q * p || '');
    } else if (type === 'Miscellaneous' && miscType !== 'Others') {
      const c = parseFloat(miscCount) || 0;
      const r = parseFloat(miscRate) || 0;
      setAmount(c * r || '');
    }
  }, [quantity, pricePerUnit, quintals, pricePerQuintal, type, miscType, miscCount, miscRate]);

  const fetchFarmerData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(API_URL, { headers: { Authorization: `Bearer ${token}` } });
      setFarmer(response.data);
    } catch (error) {
      if (error.response?.status === 401) navigate('/login');
    }
  };

  const toggleStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_URL}/status`, {}, { headers: { Authorization: `Bearer ${token}` } });
      fetchFarmerData();
    } catch (error) {
      alert("Error updating status");
    }
  };

  const handleShare = async () => {
    if (!farmer) return;
    const { dues, paid, balance } = getFinancials();
    const isSurplus = balance < 0;
    const absBalance = Math.abs(balance);
    const shareText = `🚜 *Statement: ${farmer.name}*\n📍 Village: ${farmer.village}\n------------------------\n📉 Total Dues: ₹${formatAmount(dues)}\n📈 Total Paid: ₹${formatAmount(paid)}\n------------------------\n💰 *FINAL SETTLEMENT:*\n${isSurplus ? "🟢 WE OWE FARMER:" : "🔴 FARMER OWES US:"} *₹${formatAmount(absBalance)}*`.trim();

    if (Capacitor.isNativePlatform()) {
      await CapacitorShare.share({ title: `Statement: ${farmer.name}`, text: shareText });
    } else {
      navigator.clipboard.writeText(shareText);
      alert("📋 Report copied to clipboard!");
    }
  };

  const formatDate = (isoString) => {
    if (!isoString) return "-";
    const d = new Date(isoString);
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear().toString().slice(-2)}`;
  };

  const formatAmount = (value, decimals = 2) => {
    if (value === 0) return "0";
    if (!value) return "0";
    return Number(value).toLocaleString('en-IN', {
      minimumFractionDigits: Number.isInteger(value) ? 0 : decimals,
      maximumFractionDigits: decimals
    });
  };

  const handleEditClick = (t) => {
    setEditingId(t._id);
    setDate(t.date.split('T')[0]);
    setType(t.type);
    setRemarks(t.details || '');
    setAmount(t.amount);
    setInterestRate(t.interest_rate || '');
    setHasInterest(!!t.interest_rate);
    setInterestAmount(t.interest || '');
    const target = t.interest_date ? t.interest_date.split('T')[0] : '';
    setInterestTargetDate(target);
    setInterestDate(target);
    if (t.type === 'Fertilizer') {
      setFertName(t.fertilizer_name || '');
      setQuantity(t.quantity || '');
      setPricePerUnit(t.price_per_unit || '');
    } else if (t.type === 'Yield') {
      setBags(t.bag_count || '');
      setQuintals(t.quintals || '');
      setPricePerQuintal(t.price_per_quintal || '');
    }
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  };

  const handleCancel = () => {
    setEditingId(null);
    setAmount(''); setRemarks(''); setFertName(''); setQuantity(''); setPricePerUnit('');
    setBags(''); setQuintals(''); setPricePerQuintal('');
    setInterestRate(''); setInterestAmount(''); setHasInterest(true);
    setInterestTargetDate('');
    setInterestDate('');
    setMiscType('Labour'); setMiscCount(''); setMiscRate('');
    setDate(new Date().toISOString().split('T')[0]); setType('Loan');
  };

  const handleDelete = async () => {
    if (!editingId) return;
    if (!window.confirm("Delete this record forever?")) return;
    setIsSaving(true);
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/transaction/${editingId}`, { headers: { Authorization: `Bearer ${token}` } });
      handleCancel(); fetchFarmerData(); alert("Record Deleted.");
    } catch (error) {
      alert("Error deleting record");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSaving) return;

    let finalAmount = amount;
    if (type === 'Fertilizer') finalAmount = (parseFloat(quantity) || 0) * (parseFloat(pricePerUnit) || 0);
    else if (type === 'Yield') finalAmount = (parseFloat(quintals) || 0) * (parseFloat(pricePerQuintal) || 0);
    else if (type === 'Miscellaneous' && miscType !== 'Others') finalAmount = (parseFloat(miscCount) || 0) * (parseFloat(miscRate) || 0);

    if (!finalAmount || parseFloat(finalAmount) <= 0) return alert("Check inputs.");

    let finalDetails = remarks;
    if (type === 'Miscellaneous') {
      if (miscType === 'Labour') finalDetails = `Labour: ${miscCount} x ₹${miscRate} | ${remarks}`;
      else if (miscType === 'Machine') finalDetails = `Machine: ${miscCount} hrs x ₹${miscRate} | ${remarks}`;
    }

    setIsSaving(true);
    try {
      const token = localStorage.getItem('token');
      const payload = {
        date, type, amount: finalAmount, details: finalDetails,
        fertilizer_name: type === 'Fertilizer' ? fertName : undefined,
        quantity: type === 'Fertilizer' ? quantity : undefined,
        price_per_unit: type === 'Fertilizer' ? pricePerUnit : undefined,
        bag_count: type === 'Yield' ? bags : undefined,
        quintals: type === 'Yield' ? quintals : undefined,
        price_per_quintal: type === 'Yield' ? pricePerQuintal : undefined,
        interest_rate: ((type === 'Loan' || type === 'Investment') && hasInterest) ? interestRate : undefined,
        interest: ((type === 'Loan' || type === 'Investment') && hasInterest) ? interestAmount : undefined,
        interest_date: ((type === 'Loan' || type === 'Investment') && hasInterest) ? interestDate : undefined
      };
      const config = { headers: { Authorization: `Bearer ${token}` } };
      if (editingId) await axios.put(`${API_URL}/transaction/${editingId}`, payload, config);
      else await axios.post(`${API_URL}/transaction`, payload, config);
      handleCancel(); fetchFarmerData(); alert("✅ Saved!");
    } catch (error) {
      alert("Error saving transaction");
    } finally {
      setIsSaving(false);
    }
  };

  const getDetailedSummary = () => {
    if (!farmer) return { loan: 0, interest: 0, fertilizer: 0, labour: 0, machine: 0, other: 0, totalInvest: 0, yield: 0, remaining: 0 };

    let loan = 0, interest = 0, fertilizer = 0, labour = 0, machine = 0, other = 0, yieldAmount = 0;

    farmer.transactions.forEach(t => {
      const amt = parseFloat(t.amount) || 0;
      if (['Loan', 'Money Lent', 'Investment'].includes(t.type)) {
        loan += amt;
        let untilDate = t.interest_date ? t.interest_date.split('T')[0] : '';
        if (!untilDate) {
          const fallbackDate = interestTargetDate || new Date().toISOString().split('T')[0];
          untilDate = (farmer.isActive === false && farmer.settledDate) ? String(farmer.settledDate).split('T')[0] : fallbackDate;
        }
        interest += calculateAccruedInterest(amt, t.interest_rate, t.date, untilDate);
      } else if (t.type === 'Fertilizer') {
        fertilizer += amt;
      } else if (t.type === 'Miscellaneous') {
        if (t.details && t.details.startsWith('Labour:')) labour += amt;
        else if (t.details && t.details.startsWith('Machine:')) machine += amt;
        else other += amt;
      } else if (t.type === 'Yield') {
        yieldAmount += amt;
      }
    });

    const totalInvest = loan + interest + fertilizer + labour + machine + other;
    return { loan, interest, fertilizer, labour, machine, other, totalInvest, yield: yieldAmount, remaining: totalInvest - yieldAmount };
  };

  const getFinancials = () => {
    const summary = getDetailedSummary();
    // For the global balance, we include repayments as "paid" 
    const repayments = farmer.transactions
      .filter(t => t.type === 'Repayment')
      .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
      
    return { 
      dues: summary.totalInvest, 
      paid: summary.yield + repayments, 
      balance: summary.totalInvest - (summary.yield + repayments) 
    };
  };
  const calculateAccruedInterest = (amount, rate, startDateIso, targetDateIso) => {
    const p = Number(amount);
    const r = Number(rate);
    if (!Number.isFinite(p) || !Number.isFinite(r) || p <= 0 || r <= 0) return 0;
    if (!startDateIso) return 0;
    const start = new Date(startDateIso);
    const target = new Date(targetDateIso);
    if (Number.isNaN(start.getTime()) || Number.isNaN(target.getTime())) return 0;
    const startMs = Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate());
    const targetMs = Date.UTC(target.getUTCFullYear(), target.getUTCMonth(), target.getUTCDate());
    const diffTime = targetMs - startMs;
    if (diffTime <= 0) return 0;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const months = diffDays / 30;
    const interest = (p * r * months) / 100;
    return Number(interest.toFixed(2));
  };

  if (!farmer) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f4f6fb', gap: 14, fontFamily: 'Inter, sans-serif' }}>
      <div className="spinner" />
      <div className="loading-text">Loading…</div>
    </div>
  );

  const { dues, paid, balance } = getFinancials();

  const loanTransactions = farmer.transactions.filter(t => ['Loan', 'Money Lent', 'Repayment', 'Investment'].includes(t.type));
  const yieldTransactions = farmer.transactions.filter(t => t.type === 'Yield');
  const fertilizerTransactions = farmer.transactions.filter(t => t.type === 'Fertilizer');
  const miscTransactions = farmer.transactions.filter(t => t.type === 'Miscellaneous');

  const calculateSubTotal = (transactions) =>
    transactions.reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);

  // Unified edit button builder — uses the .fd-edit-btn class
  const EditToggleBtn = ({ section, color }) => {
    const isActive = activeEditSection === section;
    return (
      <button
        className={`fd-edit-btn ${isActive ? 'active' : 'inactive'}`}
        style={isActive ? { background: color, borderColor: color } : {}}
        onClick={() => { setActiveEditSection(isActive ? null : section); handleCancel(); }}
      >
        {isActive ? '✓ Done' : '✎ Edit'}
      </button>
    );
  };

  return (
    <div className="fd-container">

      {/* Loading Overlay */}
      {isSaving && (
        <div className="loading-overlay">
          <div className="spinner" />
          <div className="loading-text">Processing…</div>
        </div>
      )}

      {/* Nav Header */}
      <div className="fd-nav-header" style={{ position: 'relative' }}>
        <div style={{ flex: 1 }}>
          <button onClick={() => navigate(-1)} className="fd-back-btn">
            ← Back
          </button>
        </div>
        <h2 className="fd-title" style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', margin: 0, fontSize: '24px', fontWeight: 900, color: '#0f172a' }}>Profile</h2>
        <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={handleShare} className="fd-share-btn">
            Share
          </button>
        </div>
      </div>

      {/* Profile Summary */}
      <div className="fd-profile-header">
        <h1 className="fd-profile-name">{farmer.name}</h1>
        <p className="fd-profile-sub">{farmer.village} · {farmer.paddy_variety}</p>

        <button
          onClick={toggleStatus}
          className="fd-status-pill"
          style={{
            backgroundColor: farmer.isActive ? "#dcfce7" : "#fee2e2",
            color: farmer.isActive ? "#15803d" : "#dc2626"
          }}
        >
          {farmer.isActive ? "✓ Account Active" : "✗ Account Settled"} — tap to change
        </button>

        <div
          className="fd-balance-card"
          style={{ backgroundColor: balance < 0 ? "#f0fdf4" : "#fff1f2", border: `1.5px solid ${balance < 0 ? "#bbf7d0" : "#fecdd3"}` }}
        >
          <small className="fd-balance-label">{balance < 0 ? "WE OWE FARMER" : "FARMER OWES US"}</small>
          <div className="fd-balance-amount" style={{ color: balance < 0 ? "#15803d" : "#dc2626" }}>
            ₹{formatAmount(Math.abs(balance))}
          </div>
        </div>
      </div>

      {/* ── Yield Section ── */}
      <div className="fd-section-card" style={{ borderColor: activeEditSection === 'yield' ? '#22c55e' : '#e4e9f2' }}>
        <div className="fd-section-header">
          <h3 className="fd-section-title" style={{ color: "#16a34a", display: 'flex', alignItems: 'center', gap: '8px' }}>🌾 Yield</h3>
          <div className="fd-btn-group" style={{ marginLeft: 'auto' }}>
            {activeEditSection === 'yield' && editingId && (
              <button onClick={handleDelete} className="fd-delete-btn">🗑 Delete</button>
            )}
            <EditToggleBtn section="yield" color="#22c55e" />
          </div>
        </div>
        <div className="fd-table-wrapper">
          <table className="fd-table" style={{ width: 'calc(100% + 150px)', minWidth: '505px' }}>
            <thead>
              <tr>
                <th className="fd-th">Date</th>
                <th className="fd-th">Bags</th>
                <th className="fd-th">Qnts</th>
                <th className="fd-th">Rate/Q</th>
                <th className="fd-th">Value</th>
                <th className="fd-th" style={{ width: '150px', minWidth: '150px' }}>Note</th>
              </tr>
            </thead>
            <tbody>
              {yieldTransactions.slice().reverse().map(t => (
                <tr
                  key={t._id}
                  onClick={() => activeEditSection === 'yield' && handleEditClick(t)}
                  style={{ backgroundColor: editingId === t._id ? "#fffbeb" : "transparent", cursor: activeEditSection === 'yield' ? 'pointer' : 'default' }}
                >
                  <td className="fd-td" style={{ minWidth: '85px', padding: '10px 4px', fontSize: '12px' }}>{formatDate(t.date)}</td>
                  <td className="fd-td" style={{ minWidth: '55px', padding: '10px 4px' }}>{t.bag_count || '-'}</td>
                  <td className="fd-td" style={{ minWidth: '55px', padding: '10px 4px' }}>{t.quintals || '-'}</td>
                  <td className="fd-td" style={{ minWidth: '70px', padding: '10px 4px' }}>₹{formatAmount(t.price_per_quintal)}</td>
                  <td className="fd-td fd-td-amount" style={{ color: "#16a34a", minWidth: '80px', padding: '10px 4px' }}>₹{formatAmount(t.amount)}</td>
                  <td className="fd-td" style={{ fontSize: '11px', color: '#64748b', width: '150px', minWidth: '150px', maxWidth: '150px', paddingLeft: '12px', borderLeft: '1.5px solid #f1f5f9' }}>{t.details || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ padding: '12px 16px', borderTop: '1.5px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fafbfc', borderBottomLeftRadius: '18px', borderBottomRightRadius: '18px' }}>
          <span style={{ fontWeight: 800, fontSize: '13px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Yield Value</span>
          <span style={{ fontWeight: 900, fontSize: '17px', color: '#16a34a' }}>₹{formatAmount(calculateSubTotal(yieldTransactions))}</span>
        </div>
      </div>

      {/* ── Goods Section ── */}
      <div className="fd-section-card" style={{ borderColor: activeEditSection === 'goods' ? '#ef4444' : '#e4e9f2' }}>
        <div className="fd-section-header">
          <h3 className="fd-section-title" style={{ color: "#dc2626", display: 'flex', alignItems: 'center', gap: '8px' }}>📦 Goods</h3>
          <div className="fd-btn-group" style={{ marginLeft: 'auto' }}>
            {activeEditSection === 'goods' && editingId && (
              <button onClick={handleDelete} className="fd-delete-btn">🗑 Delete</button>
            )}
            <EditToggleBtn section="goods" color="#ef4444" />
          </div>
        </div>
        <div className="fd-table-wrapper">
          <table className="fd-table" style={{ width: 'calc(100% + 150px)', minWidth: '485px' }}>
            <thead>
              <tr>
                <th className="fd-th">Date</th>
                <th className="fd-th">Item (Qty)</th>
                <th className="fd-th">Rate</th>
                <th className="fd-th">Value</th>
                <th className="fd-th" style={{ width: '150px', minWidth: '150px' }}>Note</th>
              </tr>
            </thead>
            <tbody>
              {fertilizerTransactions.slice().reverse().map(t => (
                <tr
                  key={t._id}
                  onClick={() => activeEditSection === 'goods' && handleEditClick(t)}
                  style={{ backgroundColor: editingId === t._id ? "#f0fdf4" : "transparent", cursor: activeEditSection === 'goods' ? 'pointer' : 'default' }}
                >
                  <td className="fd-td" style={{ minWidth: '85px', padding: '10px 4px', fontSize: '12px' }}>{formatDate(t.date)}</td>
                  <td className="fd-td" style={{ fontWeight: "700", minWidth: '110px', padding: '10px 4px' }}>
                    {t.fertilizer_name} <span style={{ fontWeight: "500", color: "#94a3b8" }}>({t.quantity || '-'})</span>
                  </td>
                  <td className="fd-td" style={{ minWidth: '60px', padding: '10px 4px', fontSize: '12px' }}>₹{formatAmount(t.price_per_unit)}</td>
                  <td className="fd-td fd-td-amount" style={{ color: "#dc2626", minWidth: '80px', padding: '10px 4px' }}>₹{formatAmount(t.amount)}</td>
                  <td className="fd-td" style={{ fontSize: '11px', color: '#64748b', width: '150px', minWidth: '150px', maxWidth: '150px', paddingLeft: '12px', borderLeft: '1.5px solid #f1f5f9' }}>{t.details || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ padding: '12px 16px', borderTop: '1.5px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fafbfc', borderBottomLeftRadius: '18px', borderBottomRightRadius: '18px' }}>
          <span style={{ fontWeight: 800, fontSize: '13px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Goods Value</span>
          <span style={{ fontWeight: 900, fontSize: '17px', color: '#dc2626' }}>₹{formatAmount(calculateSubTotal(fertilizerTransactions))}</span>
        </div>
      </div>

      {/* ── Loans Section ── */}
      <div className="fd-section-card" style={{ borderColor: activeEditSection === 'loan' ? '#ef4444' : '#e4e9f2' }}>
        <div className="fd-section-header">
          <h3 className="fd-section-title" style={{ color: "#dc2626", display: 'flex', alignItems: 'center', gap: '8px' }}>💰 Loans</h3>
          <div className="fd-btn-group" style={{ marginLeft: 'auto' }}>
            {activeEditSection === 'loan' && editingId && (
              <button onClick={handleDelete} className="fd-delete-btn">🗑 Delete</button>
            )}
            <EditToggleBtn section="loan" color="#ef4444" />
          </div>
        </div>

        <div className="fd-interest-bar">
          <span>Default until:</span>
          <input
            type="date"
            value={interestTargetDate}
            onChange={(e) => { setInterestTargetDate(e.target.value); setInterestDate(e.target.value); }}
            className="fd-input"
            style={{ width: '148px', padding: '5px 10px', fontSize: '13px', margin: 0 }}
          />
        </div>

        <div className="fd-table-wrapper">
          <table className="fd-table" style={{ width: 'calc(100% + 150px)', minWidth: '465px' }}>
            <thead>
              <tr>
                <th className="fd-th">Date & Until</th>
                <th className="fd-th">Principal</th>
                <th className="fd-th">Int(%)</th>
                <th className="fd-th">Total Due</th>
                <th className="fd-th" style={{ width: '150px', minWidth: '150px' }}>Note</th>
              </tr>
            </thead>
            <tbody>
              {loanTransactions.slice().reverse().map(t => {
                const isRepayment = t.type === 'Repayment';
                const principal = parseFloat(t.amount) || 0;
                let targetDate = t.interest_date ? String(t.interest_date).split('T')[0] : '';
                if (!targetDate) {
                  const fallbackDate = interestTargetDate || new Date().toISOString().split('T')[0];
                  targetDate = (farmer.isActive === false && farmer.settledDate) ? String(farmer.settledDate).split('T')[0] : fallbackDate;
                }
                const accrued = isRepayment ? 0 : Math.round(calculateAccruedInterest(principal, t.interest_rate, t.date, targetDate));
                const totalDue = isRepayment ? principal : (principal + accrued);
                return (
                  <tr
                    key={t._id}
                    onClick={() => activeEditSection === 'loan' && handleEditClick(t)}
                    style={{ backgroundColor: editingId === t._id ? "#fff1f2" : "transparent", cursor: activeEditSection === 'loan' ? 'pointer' : 'default' }}
                  >
                    <td className="fd-td" style={{ minWidth: '85px', padding: '16px 4px' }}>
                      <div style={{ fontWeight: 600, fontSize: '13px' }}>{formatDate(t.date)}</div>
                      {!isRepayment && targetDate && (
                        <div style={{ fontSize: '11px', color: '#0f172a', marginTop: '6px', fontWeight: 800, backgroundColor: '#e2e8f0', padding: '4px 6px', borderRadius: '5px', display: 'inline-block' }}>
                          Until: {formatDate(targetDate)}
                        </div>
                      )}
                    </td>
                    <td className="fd-td" style={{ color: isRepayment ? "#16a34a" : "#dc2626", fontWeight: 800, minWidth: '80px', padding: '16px 4px' }}>
                      {isRepayment ? "+" : "−"} ₹{formatAmount(principal)}
                    </td>
                    <td className="fd-td" style={{ minWidth: '55px', padding: '16px 4px', fontSize: '12px' }}>
                      {accrued > 0 && <div style={{ color: '#d97706', fontSize: '14px', fontWeight: 800 }}>+₹{formatAmount(accrued)}</div>}
                      <div style={{ fontWeight: 700, color: accrued > 0 ? '#64748b' : '#334155', fontSize: '10px', marginTop: accrued > 0 ? '2px' : '0' }}>{t.interest_rate ? `${t.interest_rate}%` : '-'}</div>
                    </td>
                    <td className="fd-td fd-td-amount" style={{ color: isRepayment ? "#16a34a" : "#dc2626", minWidth: '95px', padding: '16px 4px' }}>
                      {isRepayment ? "" : "−"} ₹{formatAmount(totalDue)}
                    </td>
                    <td className="fd-td" style={{ fontSize: '11px', color: '#64748b', width: '150px', minWidth: '150px', maxWidth: '150px', paddingLeft: '12px', borderLeft: '1.5px solid #f1f5f9' }}>{t.details || (isRepayment ? 'Repayment' : 'Loan')}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div style={{ padding: '12px 16px', borderTop: '1.5px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fafbfc', borderBottomLeftRadius: '18px', borderBottomRightRadius: '18px' }}>
          <span style={{ fontWeight: 800, fontSize: '13px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Net Loan</span>
          <span style={{ fontWeight: 900, fontSize: '17px', color: '#b91c1c' }}>
            ₹{formatAmount(
              loanTransactions.filter(t => t.type !== 'Repayment').reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0) -
              loanTransactions.filter(t => t.type === 'Repayment').reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0)
            )}
          </span>
        </div>
      </div>

      {/* ── Misc Section ── */}
      <div className="fd-section-card" style={{ borderColor: activeEditSection === 'misc' ? '#ef4444' : '#e4e9f2' }}>
        <div className="fd-section-header">
          <h3 className="fd-section-title" style={{ color: "#dc2626", display: 'flex', alignItems: 'center', gap: '8px' }}>🛠 Misc</h3>
          <div className="fd-btn-group" style={{ marginLeft: 'auto' }}>
            {activeEditSection === 'misc' && editingId && (
              <button onClick={handleDelete} className="fd-delete-btn">🗑 Delete</button>
            )}
            <EditToggleBtn section="misc" color="#ef4444" />
          </div>
        </div>
        <div className="fd-table-wrapper">
          <table className="fd-table" style={{ minWidth: 'unset' }}>
            <thead>
              <tr>
                <th className="fd-th" style={{ width: '85px' }}>Date</th>
                <th className="fd-th">Details</th>
                <th className="fd-th" style={{ width: '90px' }}>Cost</th>
              </tr>
            </thead>
            <tbody>
              {miscTransactions.slice().reverse().map(t => (
                <tr
                  key={t._id}
                  onClick={() => activeEditSection === 'misc' && handleEditClick(t)}
                  style={{ backgroundColor: editingId === t._id ? "#eff6ff" : "transparent", cursor: activeEditSection === 'misc' ? 'pointer' : 'default' }}
                >
                  <td className="fd-td" style={{ width: '85px' }}>{formatDate(t.date)}</td>
                  <td className="fd-td">{t.details}</td>
                  <td className="fd-td fd-td-amount" style={{ color: "#dc2626", width: '90px' }}>₹{formatAmount(t.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ padding: '12px 16px', borderTop: '1.5px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fafbfc', borderBottomLeftRadius: '18px', borderBottomRightRadius: '18px' }}>
          <span style={{ fontWeight: 800, fontSize: '13px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Misc Value</span>
          <span style={{ fontWeight: 900, fontSize: '17px', color: '#dc2626' }}>₹{formatAmount(calculateSubTotal(miscTransactions))}</span>
        </div>
      </div>

      {/* ── Settlement Summary Section ── */}
      {(() => {
        const summary = getDetailedSummary();
        return (
          <div className="fd-summary-card">
            <h3 className="fd-summary-title">Settlement Summary</h3>
            
            <div className="fd-summary-row">
              <span className="fd-summary-label">Total Loan (Principal)</span>
              <span className="fd-summary-value">₹{formatAmount(summary.loan)}</span>
            </div>
            <div className="fd-summary-row">
              <span className="fd-summary-label">Total Interest</span>
              <span className="fd-summary-value">₹{formatAmount(summary.interest)}</span>
            </div>
            <div className="fd-summary-row">
              <span className="fd-summary-label">Total Fertilizer Cost</span>
              <span className="fd-summary-value">₹{formatAmount(summary.fertilizer)}</span>
            </div>
            <div className="fd-summary-row">
              <span className="fd-summary-label">Labour Cost</span>
              <span className="fd-summary-value">₹{formatAmount(summary.labour)}</span>
            </div>
            <div className="fd-summary-row">
              <span className="fd-summary-label">Machine Harvest Cost</span>
              <span className="fd-summary-value">₹{formatAmount(summary.machine)}</span>
            </div>
            <div className="fd-summary-row">
              <span className="fd-summary-label">Other Misc</span>
              <span className="fd-summary-value">₹{formatAmount(summary.other)}</span>
            </div>

            <hr className="fd-divider" />

            <div className="fd-summary-total-row">
              <span>Total Investment</span>
              <span>₹{formatAmount(summary.totalInvest)}</span>
            </div>

            <div className="fd-summary-yield-row">
              <span>Yield (Settlement Credit)</span>
              <span>- ₹{Number(summary.yield).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>

            <div className="fd-summary-remaining">
              <span style={{ color: '#64748b', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px' }}>Final Remaining</span>
              <span style={{ color: summary.remaining > 0 ? '#dc2626' : '#15803d' }}>
                ₹{formatAmount(Math.abs(summary.remaining))}
                <span style={{ fontSize: '12px', marginLeft: '6px', fontWeight: 600 }}>
                  {summary.remaining > 0 ? '(Due)' : '(Surplus)'}
                </span>
              </span>
            </div>
          </div>
        );
      })()}
      <div className="fd-form-card" style={{ backgroundColor: editingId ? "#fffbeb" : "#fff", borderColor: editingId ? "#fde68a" : "#e4e9f2" }}>
          <h3 className="fd-form-title">{editingId ? "✎ Edit Transaction" : "+ Add Transaction"}</h3>
          <form onSubmit={handleSubmit} className="fd-form">
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="fd-input" />
            <select value={type} onChange={(e) => setType(e.target.value)} className="fd-input" disabled={!!editingId}>
              <option value="Loan">💰 Loan</option>
              <option value="Fertilizer">📦 Fertilizer</option>
              <option value="Yield">🌾 Yield (Harvest)</option>
              <option value="Miscellaneous">🛠 Miscellaneous</option>
              <option value="Repayment">💵 Repayment (Against Loan)</option>
            </select>

            {type === 'Miscellaneous' && (
              <div className="fd-misc-box">
                <div className="fd-row-gap">
                  {['Labour', 'Machine', 'Others'].map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMiscType(m)}
                      className="fd-misc-type-btn"
                      style={{ background: miscType === m ? "#2563eb" : "white", color: miscType === m ? "white" : "#334155" }}
                    >
                      {m}
                    </button>
                  ))}
                </div>
                {miscType !== 'Others' && (
                  <div className="fd-row-gap">
                    <input type="number" placeholder={miscType === 'Labour' ? "People" : "Hours"} value={miscCount} onChange={(e) => setMiscCount(e.target.value)} className="fd-input" />
                    <input type="number" placeholder="Rate" value={miscRate} onChange={(e) => setMiscRate(e.target.value)} className="fd-input" />
                  </div>
                )}
              </div>
            )}

            {type === 'Yield' && (
              <div className="fd-form" style={{ gap: "10px" }}>
                <div className="fd-row-gap">
                  <input type="number" placeholder="Bags" value={bags} onChange={(e) => setBags(e.target.value)} className="fd-input" />
                  <input type="number" placeholder="Quintals" value={quintals} onChange={(e) => setQuintals(e.target.value)} className="fd-input" />
                </div>
                <input type="number" placeholder="Price per Quintal (₹)" value={pricePerQuintal} onChange={(e) => setPricePerQuintal(e.target.value)} className="fd-input" />
              </div>
            )}

            {type === 'Fertilizer' && (
              <div className="fd-form" style={{ gap: "10px" }}>
                <input type="text" placeholder="Item Name (e.g. Urea)" value={fertName} onChange={(e) => setFertName(e.target.value)} className="fd-input" />
                <div className="fd-row-gap">
                  <input type="number" placeholder="Quantity" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="fd-input" />
                  <input type="number" placeholder="Price/Unit" value={pricePerUnit} onChange={(e) => setPricePerUnit(e.target.value)} className="fd-input" />
                </div>
              </div>
            )}

            {(type === 'Loan' || type === 'Investment' || type === 'Money Lent' || type === 'Repayment' || (type === 'Miscellaneous' && miscType === 'Others')) && (
              <input type="number" placeholder="Amount (₹)" value={amount} onChange={(e) => setAmount(e.target.value)} className="fd-input" />
            )}

            {(type === 'Loan' || type === 'Investment') && (
              <div style={{ display: 'flex', gap: '15px', padding: '5px 5px 10px 5px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: 600, color: '#334155', cursor: 'pointer' }}>
                  <input type="radio" checked={hasInterest} onChange={() => setHasInterest(true)} style={{ accentColor: '#2563eb', cursor: 'pointer', width: '16px', height: '16px' }} />
                  With Interest
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: 600, color: '#334155', cursor: 'pointer' }}>
                  <input type="radio" checked={!hasInterest} onChange={() => { setHasInterest(false); setInterestRate(''); setInterestAmount(''); setInterestDate(''); }} style={{ accentColor: '#2563eb', cursor: 'pointer', width: '16px', height: '16px' }} />
                  Without Interest
                </label>
              </div>
            )}

            {(type === 'Loan' || type === 'Investment') && hasInterest && (
              <>
                <div className="fd-row-gap">
                  <input type="number" step="0.01" placeholder="Interest Rate (%)" value={interestRate} onChange={(e) => setInterestRate(e.target.value)} className="fd-input" />
                  <input type="number" placeholder="Interest Amount (₹)" value={interestAmount} onChange={(e) => setInterestAmount(e.target.value)} className="fd-input" />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '13px', color: '#64748b', fontWeight: 600 }}>
                  <span style={{ minWidth: '90px' }}>Fixed until:</span>
                  <input
                    type="date"
                    value={interestDate}
                    onChange={(e) => { setInterestDate(e.target.value); setInterestTargetDate(e.target.value); }}
                    className="fd-input"
                    style={{ flex: 1, margin: 0 }}
                  />
                  {interestDate && (
                    <button type="button" onClick={() => { setInterestDate(''); setInterestTargetDate(''); }} style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#ef4444', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 700 }}>✕ Clear</button>
                  )}
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8', paddingLeft: '4px' }}>* Leave empty to automatically update interest day by day.</div>
              </>
            )}

            <input type="text" placeholder="Remarks" value={remarks} onChange={(e) => setRemarks(e.target.value)} className="fd-input" />

            <button
              type="submit"
              disabled={isSaving}
              className="fd-submit-btn"
              style={{ backgroundColor: isSaving ? "#94a3b8" : editingId ? "#f59e0b" : "#0f172a" }}
            >
              {isSaving ? "Saving…" : editingId ? "Update Record" : "Save Transaction"}
            </button>

            {editingId && (
              <div className="fd-row-gap" style={{ marginTop: 4 }}>
                <button type="button" disabled={isSaving} onClick={handleCancel} className="fd-cancel-btn">Cancel</button>
              </div>
            )}
          </form>
        </div>
    </div>
  );
};

export default FarmerDetails;