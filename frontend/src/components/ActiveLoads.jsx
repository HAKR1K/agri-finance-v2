import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import './Analysis.css';
import { Capacitor } from '@capacitor/core';

const ActiveLoads = () => {
  const navigate = useNavigate();
  const [loads, setLoads] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLoads = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.get(`${API_BASE_URL}/advanced-analysis`, { headers });
      setLoads(res.data.loads || []);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching loads", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }
    fetchLoads();
  }, [navigate]);

  const handleDeleteLoad = async (loadId) => {
    if (!window.confirm("Delete this load?")) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_BASE_URL}/loads/${loadId}`, { headers: { Authorization: `Bearer ${token}` } });
      setLoads(prev => prev.filter(l => l._id !== loadId));
    } catch (err) { alert("Failed to delete load"); }
  };

  const safeAreaTop = Capacitor.isNativePlatform() ? 'env(safe-area-inset-top, 40px)' : '20px';

  if (loading) return (
    <div className="loading-container">
      <div className="loading-spinner" />
      <p className="loading-text">Loading Active Loads…</p>
    </div>
  );

  return (
    <div className="analysis-container" style={{ paddingTop: safeAreaTop }}>
      <div className="sticky-summary" style={{ marginBottom: '24px' }}>
        <div className="analysis-header" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <div style={{ flex: 1 }}>
              <button onClick={() => navigate('/all-sections')} className="back-home-btn">← Back</button>
          </div>
          <h2 style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', margin: 0, fontSize: '20px', fontWeight: 900, color: '#0f172a', whiteSpace: 'nowrap' }}>Active Loads</h2>
          <div style={{ flex: 1 }} />
        </div>
      </div>
      <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '24px', textAlign: 'center' }}>
        Track and manage current transport shipments.
      </p>

      <div className="data-card" style={{ marginBottom: '20px', borderTop: '4px solid #f59e0b' }}>
        {loads && loads.length > 0 ? (
          <div style={{ display: 'grid', gap: '16px', padding: '12px' }}>
            {loads.map(load => (
              <div key={load._id} style={{ background: '#fffbeb', borderRadius: '8px', border: '1px solid #fcd34d', padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div>
                    <div style={{ fontSize: '16px', fontWeight: 800, color: '#b45309' }}>{load.name}</div>
                    <div style={{ fontSize: '12px', color: '#92400e' }}>{new Date(load.date).toLocaleDateString()}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ fontSize: '20px', fontWeight: 900, color: '#d97706' }}>{load.totalBags} <span style={{fontSize:'12px', fontWeight: 600}}>BAGS</span></div>
                    <button onClick={() => handleDeleteLoad(load._id)} style={{ background: 'transparent', border: 'none', color: '#ef4444', fontSize: '18px', cursor: 'pointer' }}>🗑️</button>
                  </div>
                </div>
                <div style={{ background: 'white', borderRadius: '6px', padding: '8px', border: '1px dashed #fcd34d' }}>
                  {load.farmers.map((f, i) => (
                     <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', padding: '4px 0', borderBottom: i < load.farmers.length-1 ? '1px solid #f1f5f9' : 'none' }}>
                        <span style={{ color: '#475569', fontWeight: 600 }}>{f.name} <span style={{fontWeight:'normal', color:'#94a3b8'}}>({f.village})</span></span>
                        <span style={{ color: '#b45309', fontWeight: 700 }}>{f.bags} bags</span>
                     </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ padding: '32px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>No active loads found.</p>
        )}
      </div>
    </div>
  );
};

export default ActiveLoads;
