import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../config'; 
import { Capacitor } from '@capacitor/core';
import './VillageDetails.css';

const VillageDetails = () => {
  const { villageName } = useParams();
  const navigate = useNavigate();
  
  const [farmers, setFarmers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isSelectionMode, setIsSelectionMode] = useState(false); 
  const [selectedFarmer, setSelectedFarmer] = useState(null); 
  
  const [name, setName] = useState('');
  const [paddyVariety, setPaddyVariety] = useState('');

  const API_URL = `${API_BASE_URL}/farmers`;

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }
    fetchFarmers();
  }, [navigate, villageName]);

  const fetchFarmers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(API_URL, {
        params: { village: villageName },
        headers: { Authorization: `Bearer ${token}` }
      });
      setFarmers(response.data);
    } catch (error) {
      if (error.response?.status === 401) navigate('/login');
    }
  };

  const handleSaveFarmer = async (e) => {
    e.preventDefault();
    if (!name || !paddyVariety) return alert("Please fill all fields");
    
    const token = localStorage.getItem('token');
    const config = { headers: { Authorization: `Bearer ${token}` } };
    
    try {
      if (selectedFarmer) {
        await axios.put(`${API_URL}/${selectedFarmer._id}`, { name, paddy_variety: paddyVariety }, config);
        alert("✅ Details Updated!");
      } else {
        await axios.post(API_URL, { name, village: villageName, paddy_variety: paddyVariety, phone: "0000000000" }, config);
        alert("✅ Farmer Added!");
      }
      resetForm();
      // Small delay helps ensure database consistency before re-fetching on some mobile environments
      setTimeout(() => {
        fetchFarmers();
      }, 500); 
    } catch (error) { 
      console.error("Save error:", error);
      alert("Error saving farmer"); 
    }
  };

  const handleDeleteFarmer = async () => {
    if (!selectedFarmer) return;
    if (!window.confirm(`⚠️ PERMANENTLY DELETE ${selectedFarmer.name}? This will erase all history.`)) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/${selectedFarmer._id}`, { headers: { Authorization: `Bearer ${token}` } });
      resetForm();
      fetchFarmers();
      alert("🗑️ Farmer deleted");
    } catch (error) { alert("Error deleting farmer"); }
  };

  const resetForm = () => {
    setName(''); setPaddyVariety(''); setSelectedFarmer(null); setIsSelectionMode(false);
  };

  const handleFarmerClick = (farmer) => {
    if (isSelectionMode) {
      if (selectedFarmer?._id === farmer._id) {
        setSelectedFarmer(null); setName(''); setPaddyVariety('');
      } else {
        setSelectedFarmer(farmer); setName(farmer.name); setPaddyVariety(farmer.paddy_variety);
      }
    } else {
      navigate(`/farmer/${farmer._id}`);
    }
  };

  const filteredFarmers = farmers.filter(farmer =>
    farmer.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeCount   = farmers.filter(f => f.isActive !== false).length;
  const settledCount  = farmers.filter(f => f.isActive === false).length;

  // Helper: determine if a farmer is "settled"
  const isSettled = (farmer) => farmer.isActive === false;

  return (
    <div className="vd-container">
      
      {/* ── Header Card ── */}
      <div className="vd-header-card">
        <div className="vd-header-top" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <div style={{ flex: 1 }}>
            <button onClick={() => navigate('/records')} className="vd-back-btn">← Back</button>
          </div>
          
          <h2 className="vd-title" style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', margin: 0, fontSize: '24px', fontWeight: 900, color: '#0f172a', whiteSpace: 'nowrap' }}>{villageName}</h2>
          
          <div className="vd-btn-group" style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            {isSelectionMode && selectedFarmer && (
              <button onClick={handleDeleteFarmer} className="vd-delete-btn">Delete</button>
            )}
            <button 
              onClick={() => isSelectionMode ? resetForm() : setIsSelectionMode(true)}
              className="vd-edit-btn"
              style={{ 
                backgroundColor: isSelectionMode ? "#e2e8f0" : "#eff6ff", 
                color: isSelectionMode ? "#1e293b" : "#6366f1"
              }}
            >
              {isSelectionMode ? "Done" : "Edit"}
            </button>
          </div>
        </div>
        
        {/* ── Stats Row ── */}
        <div className="vd-stats-row">
          <div className="vd-stat-box active">
            <span className="vd-stat-label active">NOT SETTLED</span>
            <span className="vd-stat-number active">{activeCount}</span>
          </div>
          <div className="vd-stat-box settled">
            <span className="vd-stat-label settled">SETTLED</span>
            <span className="vd-stat-number settled">{settledCount}</span>
          </div>
        </div>
      </div>

      {/* ── Search ── */}
      <div style={{ position: "relative", zIndex: 1 }}>
        <input 
          type="text" 
          placeholder="🔍 Search farmer name..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="vd-search-input"
        />
      </div>

      {/* ── Farmer List ── */}
      <div className="vd-list">
        {filteredFarmers.length === 0 && (
          <p style={{ textAlign: 'center', color: '#475569', padding: '20px', fontStyle: 'italic' }}>
            No farmers found.
          </p>
        )}
        {filteredFarmers.map((farmer, index) => {
          const settled   = isSettled(farmer);
          const isSelected = selectedFarmer?._id === farmer._id;
          const isDimmed  = isSelectionMode && selectedFarmer && !isSelected;

          return (
            <div 
              key={farmer._id} 
              onClick={() => handleFarmerClick(farmer)} 
              className={[
                'vd-farmer-card',
                isSelected  ? 'is-selected' : '',
                settled     ? 'is-settled'  : 'is-active',
                isDimmed    ? 'is-dimmed'   : '',
              ].filter(Boolean).join(' ')}
            >
              {/* Index Circle */}
              <div className={`vd-index-circle ${isSelected ? 'selected-circle' : ''}`}>
                {index + 1}
              </div>
              
              {/* Farmer Info */}
              <div className="vd-farmer-info">
                <strong className="vd-farmer-name">{farmer.name}</strong>
                <span className="vd-paddy-tag">{farmer.paddy_variety}</span>
              </div>
              
              {/* ✅ Settled / Not Settled Badge */}
              {!isSelectionMode && (
                <span className={`vd-status-badge ${settled ? 'settled' : 'not-settled'}`}>
                  <span className="vd-status-dot" />
                  {settled ? 'Settled' : 'Not Settled'}
                </span>
              )}

              {/* Selection Radio */}
              {isSelectionMode && (
                <div className="vd-radio" style={{ color: isSelected ? "#f59e0b" : "#334155" }}>
                  {isSelected ? "●" : "○"}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Add / Edit Form ── */}
      <div className="vd-form-card">
        <h3 className="vd-form-title">
          {selectedFarmer ? "✏️ Edit Farmer Details" : "➕ Add New Farmer"}
        </h3>
        <form onSubmit={handleSaveFarmer} className="vd-form">
          <input 
            type="text" 
            placeholder="Full Name" 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            className="vd-input"
          />
          <input 
            type="text" 
            placeholder="Paddy Variety (e.g. BPT, RNR)" 
            value={paddyVariety} 
            onChange={(e) => setPaddyVariety(e.target.value)} 
            className="vd-input"
          />
          <button 
            type="submit" 
            className="vd-submit-btn"
            style={{ 
              background: selectedFarmer
                ? "linear-gradient(135deg, #3b82f6, #1d4ed8)"
                : "linear-gradient(135deg, #22c55e, #16a34a)",
              boxShadow: selectedFarmer
                ? "0 6px 20px rgba(59,130,246,0.35)"
                : "0 6px 20px rgba(34,197,94,0.35)"
            }}
          >
            {selectedFarmer ? "Update Details" : "Add Farmer"}
          </button>
          {isSelectionMode && (
            <button type="button" onClick={resetForm} className="vd-cancel-btn">
              Cancel / Clear
            </button>
          )}
        </form>
      </div>
    </div>
  );
};

export default VillageDetails;