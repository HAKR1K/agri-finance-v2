import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../config'; 
import { Capacitor } from '@capacitor/core';
import './VillageList.css'; // 👈 IMPORT THE CSS

const VillageList = () => {
  const [villages, setVillages] = useState([]);
  const [newVillageName, setNewVillageName] = useState('');
  
  // Selection & Edit Mode States
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedVillage, setSelectedVillage] = useState(null);
  
  const navigate = useNavigate();
  const API_URL = `${API_BASE_URL}/villages`;

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }
    fetchVillages();
  }, [navigate]);

  const fetchVillages = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(API_URL, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      setVillages(response.data);
    } catch (error) {
      if (error.response?.status === 401) { 
        localStorage.removeItem('token'); 
        navigate('/login'); 
      }
    }
  };

  const handleSaveVillage = async (e) => {
    e.preventDefault();
    if (!newVillageName) return;
    
    const token = localStorage.getItem('token');
    const config = { headers: { Authorization: `Bearer ${token}` } };

    try {
      if (selectedVillage) {
        await axios.put(`${API_URL}/${selectedVillage._id}`, { name: newVillageName }, config);
        alert("✅ Village updated!");
      } else {
        await axios.post(API_URL, { name: newVillageName }, config);
        alert("✅ Village added!");
      }
      resetForm();
      fetchVillages();
    } catch (error) { alert("Error saving village"); }
  };

  const handleDeleteVillage = async () => {
    if (!selectedVillage) return;
    if (!window.confirm(`⚠️ ARCHIVE "${selectedVillage.name}"? This will NOT delete the farmers inside, but they will lose their village link.`)) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/${selectedVillage._id}`, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      alert("📦 Village archived");
      resetForm();
      fetchVillages();
    } catch (error) { alert("Error deleting village"); }
  };

  const resetForm = () => {
    setNewVillageName('');
    setSelectedVillage(null);
    setIsSelectionMode(false);
  };

  const handleVillageClick = (village) => {
    if (isSelectionMode) {
      if (selectedVillage?._id === village._id) {
        setSelectedVillage(null);
        setNewVillageName('');
      } else {
        setSelectedVillage(village);
        setNewVillageName(village.name);
      }
    } else {
      navigate(`/village/${village.name}`);
    }
  };

  return (
    <div className="vl-container">
        
        <div className="vl-header-card">
          <div className="vl-header-top" style={{ position: 'relative' }}>
            <div style={{ flex: 1 }}>
                <button onClick={() => navigate('/')} className="vl-back-btn">← Back</button>
            </div>
            
            <h2 style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', margin: 0, fontSize: '24px', fontWeight: 900, color: '#0f172a' }}>Villages</h2>
            
            <div className="vl-action-group" style={{ flex: 1, justifyContent: 'flex-end', display: 'flex', gap: '8px' }}>
                {isSelectionMode && selectedVillage && (
                    <button onClick={handleDeleteVillage} className="vl-delete-btn">Delete</button>
                )}
                <button 
                  onClick={() => isSelectionMode ? resetForm() : setIsSelectionMode(true)}
                  className="vl-mode-btn"
                  style={{ 
                    backgroundColor: isSelectionMode ? "#e2e8f0" : "#eff6ff", 
                    color: isSelectionMode ? "#1e293b" : "#3b82f6"
                  }}
                >
                  {isSelectionMode ? "Done" : "Edit"}
                </button>
            </div>
          </div>
        </div>

        <div className="vl-list">
          {villages.length === 0 && (
            <p className="vl-empty-text">No villages yet. Add one below.</p>
          )}
          {villages.map((village, index) => {
            const isSelected = selectedVillage?._id === village._id;
            return (
              <div 
                key={village._id} 
                onClick={() => handleVillageClick(village)} 
                className={`vl-item-card ${isSelected ? 'vl-selected' : ''}`}
              >
                <div className="vl-item-left">
                  <div className={`vl-index-badge ${isSelected ? 'selected-badge' : ''}`}>
                    {index + 1}
                  </div>
                  <strong className="vl-village-name">{village.name}</strong>
                </div>
                {isSelectionMode ? (
                  <span className="vl-item-status" style={{ color: isSelected ? "#60a5fa" : "#334155" }}>
                    {isSelected ? "SELECTED" : "TAP TO EDIT"}
                  </span>
                ) : (
                  <span className="vl-item-arrow">➜</span>
                )}
              </div>
            );
          })}
        </div>

        <div className="vl-form-card">
          <h3 className="vl-form-title">
              {selectedVillage ? "✏️ Rename Village" : "➕ Add New Village"}
          </h3>
          <form onSubmit={handleSaveVillage} className="vl-form">
              <input 
                type="text" 
                placeholder="Village Name..." 
                value={newVillageName} 
                onChange={(e) => setNewVillageName(e.target.value)} 
                className="vl-input"
              />
              <button 
                type="submit" 
                className="vl-submit-btn"
                style={{ 
                  background: selectedVillage
                    ? "linear-gradient(135deg, #3b82f6, #1d4ed8)"
                    : "linear-gradient(135deg, #22c55e, #16a34a)",
                  boxShadow: selectedVillage
                    ? "0 6px 20px rgba(59,130,246,0.35)"
                    : "0 6px 20px rgba(34,197,94,0.35)"
                }}
              >
                {selectedVillage ? "UPDATE NAME" : "ADD VILLAGE"}
              </button>
              {isSelectionMode && (
                  <button type="button" onClick={resetForm} className="vl-cancel-link">
                      Cancel
                  </button>
              )}
          </form>
        </div>
    </div>
  );
};

export default VillageList;