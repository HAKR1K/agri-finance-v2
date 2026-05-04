import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../config'; 
import './Analysis.css';
import { Capacitor } from '@capacitor/core';

const CashAnalysis = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }

    const fetchData = async () => {
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const res = await axios.get(`${API_BASE_URL}/cash-analysis`, { headers });
        setData(res.data);
      } catch (err) {
        console.error("Error fetching cash analysis", err);
      }
    };
    fetchData();
  }, [navigate]);

  const fmt = (num) => "₹" + Number(num || 0).toLocaleString('en-IN');
  const safeAreaTop = Capacitor.isNativePlatform() ? 'env(safe-area-inset-top, 40px)' : '20px';

  if (!data) return (
    <div className="loading-container">
      <div className="loading-spinner" />
      <p className="loading-text">Loading Cash Data…</p>
    </div>
  );

  return (
    <div className="analysis-container">
      <div className="sticky-summary" style={{ paddingLeft: '26px', paddingRight: '26px', marginBottom: '24px' }}>
        <div className="analysis-header" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <div style={{ flex: 1 }}>
            <button onClick={() => navigate('/')} className="back-home-btn">← Back</button>
          </div>
          <h2 style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', margin: 0, fontSize: '20px', fontWeight: 900, color: '#0f172a', whiteSpace: 'nowrap' }}>Cash Module</h2>
          <div style={{ flex: 1 }} />
        </div>
      </div>

      <div style={{ padding: '0 26px 80px', flex: 1 }}>
      <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '24px', textAlign: 'center' }}>
        Detailed breakdown of all Loans and Investments for each farmer
      </p>

      {/* ── Global Summary Cards ── */}
      <div className="summary-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div className="summary-card" style={{ padding: '16px 12px', borderColor: '#e2e8f0', background: '#ffffff', borderLeft: '4px solid #2563eb' }}>
          <div className="card-label" style={{ color: '#1d4ed8', fontSize: '11px', fontWeight: 800 }}>TOTAL CAPITAL LENT</div>
          <div className="card-value" style={{ fontSize: '18px', color: '#1e3a8a' }}>{fmt(data.globalTotalCash)}</div>
        </div>
        <div className="summary-card" style={{ padding: '16px 12px', borderColor: '#e2e8f0', background: '#ffffff', borderLeft: '4px solid #ef4444' }}>
          <div className="card-label" style={{ color: '#dc2626', fontSize: '11px', fontWeight: 800 }}>VILLAGES ACTIVE</div>
          <div className="card-value" style={{ fontSize: '18px', color: '#b91c1c' }}>{data.villageData.length}</div>
        </div>
      </div>

      {/* ── Village By Village Breakdown ── */}
      {data.villageData.map(village => (
        <div key={village._id} className="data-card" style={{ marginBottom: '20px' }}>
          <div className="card-header" style={{ border: 'none', marginBottom: 4 }}>
            <h3>{village.name}</h3>
          </div>
          <hr className="section-divider" />

          {/* Breakdown Table for Village */}
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ minWidth: '300px' }}>
              <thead>
                <tr style={{ background: '#f1f5f9' }}>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', color: '#475569', fontWeight: 700 }}>Farmer Name</th>
                  <th style={{ padding: '12px', textAlign: 'right', fontSize: '12px', color: '#1e3a8a', fontWeight: 700 }}>Total Loan (Principal)</th>
                </tr>
              </thead>
              <tbody>
                {village.farmers.map(farmer => (
                  <tr key={farmer._id} style={{ borderBottom: '1px solid #e2e8f0', cursor: 'pointer' }} onClick={() => navigate(`/farmer/${farmer._id}`)}>
                    <td style={{ padding: '12px', fontSize: '13px', fontWeight: 500, color: '#334155' }}>
                      {farmer.name}
                    </td>
                    <td style={{ padding: '12px', fontSize: '14px', textAlign: 'right', color: '#1e3a8a', fontWeight: 700 }}>
                      {fmt(farmer.loan + farmer.investment)}
                    </td>
                  </tr>
                ))}
                
                {/* ── Column Totals ── */}
                <tr style={{ background: '#f8fafc', borderTop: '2px solid #e2e8f0' }}>
                  <td style={{ padding: '14px 12px', fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>
                    VILLAGE TOTAL
                  </td>
                  <td style={{ padding: '14px 12px', fontSize: '15px', textAlign: 'right', color: '#172554', fontWeight: 900 }}>
                    {fmt(village.villageTotalCash)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      ))}
      </div>
    </div>
  );
};

export default CashAnalysis;
