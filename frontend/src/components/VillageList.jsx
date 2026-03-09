import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../config'; 
import { Capacitor } from '@capacitor/core';

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
        // ✏️ UPDATE Village Name
        await axios.put(`${API_URL}/${selectedVillage._id}`, { name: newVillageName }, config);
        alert("✅ Village updated!");
      } else {
        // ➕ ADD New Village
        await axios.post(API_URL, { name: newVillageName }, config);
        alert("✅ Village added!");
      }
      resetForm();
      fetchVillages();
    } catch (error) { alert("Error saving village"); }
  };

  const handleDeleteVillage = async () => {
    if (!selectedVillage) return;
    if (!window.confirm(`⚠️ PERMANENTLY DELETE "${selectedVillage.name}"? This will NOT delete the farmers inside, but they will lose their village link.`)) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/${selectedVillage._id}`, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      alert("🗑️ Village deleted");
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
      // If already selected, deselect. Otherwise, select and fill form.
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

  const containerStyle = {
    paddingTop: Capacitor.isNativePlatform() ? 'env(safe-area-inset-top, 50px)' : '20px',
    paddingLeft: '20px', paddingRight: '20px', paddingBottom: '40px',
    width: "100%", maxWidth: "500px", margin: "0 auto", display: "flex", 
    flexDirection: "column", gap: "20px", backgroundColor: "#F4F7FA", 
    minHeight: "100vh", boxSizing: "border-box"
  };

  return (
    <div style={containerStyle}>
        {/* 🔝 Professional Header */}
        <div style={{ backgroundColor: "#fff", padding: "15px", borderRadius: "18px", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <button 
              onClick={() => navigate('/')} 
              style={{ cursor: "pointer", padding:"8px 14px", backgroundColor: "#f8f9fa", border: "1px solid #ddd", borderRadius: "10px", fontWeight: "bold" }}
            >
              ← Back
            </button>
            
            <div style={{ display: "flex", gap: "8px" }}>
                {isSelectionMode && selectedVillage && (
                    <button 
                      onClick={handleDeleteVillage}
                      style={{ backgroundColor: "#fff0f0", color: "#fa5252", border: "1px solid #ffaeb1", padding: "8px 14px", borderRadius: "10px", fontWeight: "bold", fontSize: "13px" }}
                    >
                      Delete
                    </button>
                )}
                <button 
                  onClick={() => isSelectionMode ? resetForm() : setIsSelectionMode(true)}
                  style={{ 
                    backgroundColor: isSelectionMode ? "#1a1a1a" : "#E3F2FD", 
                    color: isSelectionMode ? "white" : "#2196F3", 
                    border: "none", padding: "8px 16px", borderRadius: "10px", fontWeight: "bold" 
                  }}
                >
                    {isSelectionMode ? "Done" : "Edit"}
                </button>
            </div>
          </div>
        </div>

        <h1 style={{ margin: 0, fontSize: "22px", fontWeight: "800", color: "#1a1a1a", textAlign: "center" }}>
            📂 Village Records
        </h1>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {villages.length === 0 && (
            <p style={{ textAlign: "center", color: "#888", marginTop: "20px" }}>No villages yet.</p>
          )}
          {villages.map((village, index) => (
            <div 
              key={village._id} 
              onClick={() => handleVillageClick(village)} 
              style={{ 
                padding: "18px", 
                borderRadius: "16px", 
                backgroundColor: selectedVillage?._id === village._id ? "#E3F2FD" : "#ffffff", 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "space-between", 
                boxShadow: "0 4px 12px rgba(0,0,0,0.04)", 
                cursor: "pointer", 
                borderLeft: selectedVillage?._id === village._id ? "6px solid #2196F3" : "6px solid #e0e0e0",
                transition: "0.2s all ease"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                <div style={{ 
                    backgroundColor: selectedVillage?._id === village._id ? "#2196F3" : "#E3F2FD", 
                    color: selectedVillage?._id === village._id ? "#fff" : "#1565C0", 
                    width: "32px", height: "32px", borderRadius: "8px", 
                    display: "flex", alignItems: "center", justifyContent: "center", 
                    fontWeight: "bold", fontSize: "14px" 
                }}>
                    {index + 1}
                </div>
                <strong style={{ fontSize: "17px", color: "#333" }}>{village.name}</strong>
              </div>
              {isSelectionMode ? (
                  <span style={{ fontSize: "12px", color: "#2196F3", fontWeight: "bold" }}>
                      {selectedVillage?._id === village._id ? "SELECTED" : "TAP TO EDIT"}
                  </span>
              ) : (
                  <span style={{ color: "#bbb", fontSize: "18px" }}>➜</span>
              )}
            </div>
          ))}
        </div>

        {/* ADD / EDIT FORM */}
        <div style={{ backgroundColor: "#fff", padding: "24px", borderRadius: "24px", boxShadow: "0 10px 25px rgba(0,0,0,0.06)", marginTop: "10px" }}>
          <h3 style={{ margin: "0 0 15px 0", color: "#1a1a1a", fontSize: "18px", fontWeight: "800", textAlign: "center" }}>
              {selectedVillage ? "✏️ Rename Village" : "➕ Add New Village"}
          </h3>
          <form onSubmit={handleSaveVillage} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <input 
                type="text" 
                placeholder="Village Name..." 
                value={newVillageName} 
                onChange={(e) => setNewVillageName(e.target.value)} 
                style={{ 
                    padding: "14px", 
                    border: "1px solid #eee", 
                    borderRadius: "12px", 
                    fontSize: "16px", 
                    outline: "none", 
                    backgroundColor: "#f8f9fa"
                }} 
              />
              <button 
                type="submit" 
                style={{ 
                    padding: "16px", 
                    backgroundColor: selectedVillage ? "#2196F3" : "#4CAF50", 
                    color: "white", 
                    border: "none", 
                    borderRadius: "14px", 
                    fontWeight: "900", 
                    fontSize: "16px",
                    boxShadow: selectedVillage ? "0 6px 15px rgba(33, 150, 243, 0.3)" : "0 6px 15px rgba(76, 175, 80, 0.3)"
                }}
              >
                {selectedVillage ? "UPDATE NAME" : "ADD VILLAGE"}
              </button>
              {isSelectionMode && (
                  <button type="button" onClick={resetForm} style={{ background: "none", border: "none", color: "#666", fontWeight: "bold", padding: "5px" }}>
                      Cancel
                  </button>
              )}
          </form>
        </div>
    </div>
  );
};

export default VillageList;