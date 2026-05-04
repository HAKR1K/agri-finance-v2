import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../config'; 
import './Analysis.css';
import { Capacitor } from '@capacitor/core';

const AdvancedAnalysis = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const fetchAdvancedData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.get(`${API_BASE_URL}/advanced-analysis`, { headers });
      setData(res.data);
      setError(null);
    } catch (err) {
      console.error("Error fetching advanced analysis", err);
      setError("Failed to load analysis. Please check your connection and try again.");
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }
    fetchAdvancedData();
  }, [navigate]);



  const fmt = (num) => "₹" + Number(num || 0).toLocaleString('en-IN');
  const safeAreaTop = Capacitor.isNativePlatform() ? 'env(safe-area-inset-top, 40px)' : '20px';

  if (error) return (
    <div className="loading-container">
      <div style={{ fontSize: '40px', marginBottom: '16px' }}>⚠️</div>
      <p className="loading-text" style={{ color: '#ef4444' }}>{error}</p>
      <button onClick={fetchAdvancedData} className="back-home-btn" style={{ marginTop: '20px' }}>Retry</button>
      <button onClick={() => navigate('/')} className="back-home-btn" style={{ marginTop: '10px', background: 'transparent', border: 'none', boxShadow: 'none' }}>Go Back</button>
    </div>
  );

  if (!data) return (
    <div className="loading-container">
      <div className="loading-spinner" />
      <p className="loading-text">Loading Advanced Analysis…</p>
    </div>
  );

  return (
    <div className="analysis-container" style={{ paddingTop: safeAreaTop }}>
      <div className="sticky-summary" style={{ marginBottom: '24px' }}>
        <div className="analysis-header" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <div style={{ flex: 1 }}>
              <button onClick={() => navigate('/')} className="back-home-btn">← Back</button>
          </div>
          <h2 style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', margin: 0, fontSize: '20px', fontWeight: 900, color: '#0f172a', whiteSpace: 'nowrap' }}>Advanced Analysis</h2>
          <div style={{ flex: 1 }} />
        </div>
      </div>


      {/* ── Group 1: CORE FINANCIAL OVERVIEW ── */}
      <div className="analysis-group-title" style={{ fontSize: '12px', fontWeight: 800, color: '#64748b', letterSpacing: '1px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          CORE FINANCIAL OVERVIEW <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
      </div>
      <div className="summary-grid" style={{ marginBottom: '24px' }}>
        <div className="summary-card">
            <div className="card-label">TOTAL LOANS issued</div>
            <div className="card-value" style={{ color: '#2563eb' }}>{fmt(data.grandTotalLoan + data.grandTotalInvestment)}</div>
        </div>
        <div className="summary-card">
            <div className="card-label" style={{ color: '#ef4444' }}>TOTAL INTERESTS</div>
            <div className="card-value" style={{ color: '#dc2626' }}>{fmt(data.grandTotalLoanInterest + data.grandTotalInvestmentInterest)}</div>
        </div>
      </div>

      {/* ── Group 2: OPERATING EXPENSES ── */}
      <div className="analysis-group-title" style={{ fontSize: '12px', fontWeight: 800, color: '#64748b', letterSpacing: '1px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          OPERATING EXPENSES <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
      </div>
      <div className="summary-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '24px' }}>
        <div className="summary-card" style={{ padding: '12px' }}>
            <div className="card-label" style={{ fontSize: '9px' }}>FERTILIZERS</div>
            <div className="card-value" style={{ fontSize: '16px', color: '#059669' }}>{fmt(data.grandTotalFertilizer)}</div>
        </div>
        <div className="summary-card" style={{ padding: '12px' }}>
            <div className="card-label" style={{ fontSize: '9px' }}>LABOUR</div>
            <div className="card-value" style={{ fontSize: '16px', color: '#3b82f6' }}>{fmt(data.grandTotalLabour)}</div>
        </div>
        <div className="summary-card" style={{ padding: '12px' }}>
            <div className="card-label" style={{ fontSize: '9px' }}>HARVEST</div>
            <div className="card-value" style={{ fontSize: '16px', color: '#d97706' }}>{fmt(data.grandTotalMachine)}</div>
        </div>
      </div>

      {/* ── Group 3: INTERESTS & YIELDS ── */}
      <div className="analysis-group-title" style={{ fontSize: '12px', fontWeight: 800, color: '#64748b', letterSpacing: '1px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          INTERESTS & RECOVERY <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
      </div>
      <div style={{ marginBottom: '32px' }}>
        <div className="summary-card" style={{ padding: '16px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
            <div className="card-label" style={{ color: '#64748b' }}>TOTAL GROSS SPENT</div>
            <div className="card-value" style={{ color: '#0f172a', fontSize: '24px' }}>{fmt(data.grandTotalGross)}</div>
        </div>
      </div>


      {/* ── Group 4: GLOBAL YIELD RECOVERY ── */}
      <div className="analysis-group-title" style={{ fontSize: '12px', fontWeight: 800, color: '#64748b', letterSpacing: '1px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          GLOBAL YIELD RECOVERY <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
      </div>
      <div style={{ padding: '16px', background: '#ffffff', borderRadius: '18px', marginBottom: '32px', border: '1.5px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
        <table className="data-table" style={{ background: 'transparent', width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            {data.grandYieldDetails && data.grandYieldDetails.map((yieldVar, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td className="table-row-label" style={{ color: '#0f172a', fontWeight: 700, padding: '12px 0' }}>
                  {yieldVar.name} 
                  <div style={{ color: '#64748b', fontSize: '11px', fontWeight: 500 }}>{yieldVar.bag_count} bags / {yieldVar.quintals} Q</div>
                </td>
                <td className="table-row-value val-green" style={{ fontWeight: 800, textAlign: 'right', padding: '12px 0', fontSize: '16px' }}>{fmt(yieldVar.amount)}</td>
              </tr>
            ))}
            <tr>
              <td className="table-row-label" style={{ color: '#15803d', fontWeight: 800, paddingTop: '16px' }}>TOTAL RECOVERY</td>
              <td className="table-row-value val-green" style={{ fontWeight: 900, paddingTop: '16px', textAlign: 'right', fontSize: '20px' }}>{fmt(data.grandTotalYieldAmount)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ── Group 5: INDIVIDUAL VILLAGE ACCOUNTS ── */}
      <div className="analysis-group-title" style={{ fontSize: '12px', fontWeight: 800, color: '#64748b', letterSpacing: '1px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '40px' }}>
          VILLAGE BREAKDOWN <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
      </div>

      {data.advancedVillageData && data.advancedVillageData.map(village => (
        <div key={village._id} className="data-card" style={{ padding: '20px', marginBottom: '20px' }}>
          <div className="card-header" style={{ border: 'none', marginBottom: '12px', paddingBottom: 0 }}>
            <h3 style={{ fontSize: '18px', fontWeight: 900, color: '#0f172a' }}>{village.name} Account</h3>
          </div>
          <div style={{ height: '3px', width: '40px', background: '#2563eb', borderRadius: '4px', marginBottom: '20px' }} />

          <table className="data-table">
            <tbody>
              <tr>
                <td className="table-row-label">Loans & Investments</td>
                <td className="table-row-value">{fmt(village.villageLoanAmount + village.villageInvestmentAmount)}</td>
              </tr>
              <tr>
                <td className="table-row-label" style={{ paddingLeft: '12px', color: '#64748b', fontSize: '12px' }}>+ Accrued Interest</td>
                <td className="table-row-value" style={{ fontSize: '13px', color: '#ef4444' }}>{fmt(village.villageLoanInterest + village.villageInvestmentInterest)}</td>
              </tr>
              <tr style={{ background: '#f8fafc' }}>
                <td className="table-row-label" style={{ fontWeight: 700, color: '#1e293b', paddingLeft: '8px' }}>TOTAL CASH OUT</td>
                <td className="table-row-value" style={{ fontWeight: 800, color: '#2563eb', paddingRight: '8px' }}>{fmt(village.villageLoanAmount + village.villageLoanInterest + village.villageInvestmentAmount + village.villageInvestmentInterest)}</td>
              </tr>

              <tr>
                <td className="table-row-label" style={{ paddingTop: '20px' }}>Inputs (Fertilizers)</td>
                <td className="table-row-value" style={{ paddingTop: '20px' }}>{fmt(village.villageFertilizerCost)}</td>
              </tr>
              <tr>
                <td className="table-row-label">Labour & Operations</td>
                <td className="table-row-value">{fmt(village.villageLabourCost + village.villageMiscCost)}</td>
              </tr>
              <tr style={{ borderBottom: '1.5px solid #f1f5f9' }}>
                <td className="table-row-label">Harvest (Machine)</td>
                <td className="table-row-value">{fmt(village.villageMachineCost)}</td>
              </tr>

              <tr style={{ background: '#f8fafc' }}>
                <td className="table-row-label" style={{ fontWeight: 800, color: '#0f172a', paddingLeft: '12px' }}>VILLAGE GROSS</td>
                <td className="table-row-value" style={{ fontWeight: 900, color: '#0f172a', paddingRight: '12px' }}>{fmt(village.villageGross)}</td>
              </tr>

              <tr>
                <td className="table-row-label" style={{ paddingTop: '24px', fontWeight: 700, color: '#10b981' }}>Yield Recovery</td>
                <td className="table-row-value" style={{ paddingTop: '24px', fontWeight: 800, color: '#10b981', fontSize: '18px' }}>{fmt(village.villageYieldAmount)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
};

export default AdvancedAnalysis;
