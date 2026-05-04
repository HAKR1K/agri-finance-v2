import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import './Analysis.css';
import { Capacitor } from '@capacitor/core';

const VillageLoading = () => {
  const navigate = useNavigate();
  const [allFarmers, setAllFarmers] = useState([]);
  const [loadSelections, setLoadSelections] = useState({});
  const [loadName, setLoadName] = useState('');
  const [isSavingLoad, setIsSavingLoad] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.get(`${API_BASE_URL}/advanced-analysis`, { headers });
      const filteredFarmers = (res.data.allFarmersData || []).filter(f => (f.bags || 0) > 0);
      setAllFarmers(filteredFarmers);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching data", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }
    fetchData();
  }, [navigate]);

  const handleSelectionChange = (farmer) => {
    setLoadSelections(prev => {
      const updated = { ...prev };
      if (updated[farmer._id]) delete updated[farmer._id];
      else updated[farmer._id] = { farmerId: farmer._id, name: farmer.name, village: farmer.village, bags: farmer.bags || 0 };
      return updated;
    });
  };

  const handleBagsChange = (farmerId, bags) => {
    setLoadSelections(prev => {
      if (!prev[farmerId]) return prev;
      return { ...prev, [farmerId]: { ...prev[farmerId], bags: Number(bags) } };
    });
  };

  const handleCreateLoad = async () => {
    if (!loadName.trim()) return alert('Enter a load name!');
    const selectedFarmers = Object.values(loadSelections);
    if (selectedFarmers.length === 0) return alert('Select at least one farmer for the load!');
    const totalBags = selectedFarmers.reduce((sum, f) => sum + (f.bags || 0), 0);
    setIsSavingLoad(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_BASE_URL}/loads`, { name: loadName, farmers: selectedFarmers, totalBags }, { headers: { Authorization: `Bearer ${token}` } });
      
      // Update local farmer list after load creation
      const updatedFarmers = allFarmers.map(f => {
        const sel = selectedFarmers.find(s => s.farmerId === f._id);
        if (!sel) return f;
        const remaining = (f.bags || 0) - (sel.bags || 0);
        return remaining > 0 ? { ...f, bags: remaining } : null;
      }).filter(Boolean);
      
      setAllFarmers(updatedFarmers);
      setLoadName('');
      setLoadSelections({});
      alert('Load created successfully!');
      navigate('/active-loads');
    } catch (err) {
      alert('Failed to create load');
    } finally {
      setIsSavingLoad(false);
    }
  };

  const safeAreaTop = Capacitor.isNativePlatform() ? 'env(safe-area-inset-top, 40px)' : '20px';

  if (loading) return (
    <div className="loading-container">
      <div className="loading-spinner" />
      <p className="loading-text">Loading Village List…</p>
    </div>
  );

  return (
    <div className="analysis-container" style={{ paddingTop: safeAreaTop }}>
      <div className="sticky-summary" style={{ marginBottom: '24px' }}>
        <div className="analysis-header" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <div style={{ flex: 1 }}>
              <button onClick={() => navigate('/all-sections')} className="back-home-btn">← Back</button>
          </div>
          <h2 style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', margin: 0, fontSize: '20px', fontWeight: 900, color: '#0f172a', whiteSpace: 'nowrap' }}>Village Loading</h2>
          <div style={{ flex: 1 }} />
        </div>
      </div>
      <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '24px', textAlign: 'center' }}>
        Select farmers and bag counts to create a transport load.
      </p>

      <div className="data-card" style={{ marginBottom: '20px', borderTop: '4px solid #14b8a6' }}>
        <div style={{ overflowX: 'auto', marginBottom: '16px', maxHeight: '500px' }}>
          <table className="data-table" style={{ minWidth: '500px' }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 1, background: '#f1f5f9' }}>
              <tr>
                <th style={{ padding: '8px 12px', textAlign: 'center' }}>Load</th>
                <th style={{ padding: '8px 12px', textAlign: 'left' }}>Farmer Name</th>
                <th style={{ padding: '8px 12px', textAlign: 'left' }}>Village</th>
                <th style={{ padding: '8px 12px', textAlign: 'left' }}>Variety</th>
                <th style={{ padding: '8px 12px', textAlign: 'right' }}>Total Bags</th>
              </tr>
            </thead>
            <tbody>
              {allFarmers.map(farmer => {
                const isSelected = !!loadSelections[farmer._id];
                return (
                  <tr key={farmer._id} style={{ borderBottom: '1px solid #e2e8f0', background: isSelected ? '#ccfbf1' : 'transparent' }}>
                    <td style={{ padding: '10px', textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleSelectionChange(farmer)}
                        style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                      />
                    </td>
                    <td style={{ padding: '10px 12px', fontSize: '13px', fontWeight: 600, color: '#334155' }}>{farmer.name}</td>
                    <td style={{ padding: '10px 12px', fontSize: '13px', color: '#64748b' }}>{farmer.village}</td>
                    <td style={{ padding: '10px 12px', fontSize: '13px', color: '#64748b' }}>{farmer.variety}</td>
                    <td style={{ padding: '10px 12px', fontSize: '13px', textAlign: 'right', fontWeight: 700, color: '#0d9488' }}>
                      {isSelected ? (
                        <input
                          type="number"
                          value={loadSelections[farmer._id]?.bags ?? ''}
                          onChange={(e) => handleBagsChange(farmer._id, e.target.value)}
                          style={{ width: '80px', padding: '4px', textAlign: 'right', border: '1px solid #0d9488', borderRadius: '4px' }}
                        />
                      ) : (
                        farmer.bags
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {Object.keys(loadSelections).length > 0 && (
          <div style={{ background: '#f0fdf4', padding: '16px', borderRadius: '8px', border: '1px solid #86efac', display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <input 
                type="text" 
                placeholder="Enter Load Name (e.g. Lorry AP-12)" 
                value={loadName} 
                onChange={(e) => setLoadName(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #bbb', fontSize: '14px' }}
              />
            </div>
            <div style={{ fontWeight: 800, color: '#166534', whiteSpace: 'nowrap' }}>
              Total: {Object.values(loadSelections).reduce((sum, f) => sum + (f.bags || 0), 0)} Bags 
            </div>
            <button 
              onClick={handleCreateLoad} 
              disabled={isSavingLoad}
              style={{ background: '#16a34a', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              {isSavingLoad ? "Saving..." : "Create Load"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default VillageLoading;
