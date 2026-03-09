import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../config'; 
import { Capacitor } from '@capacitor/core'; // 🔌 Native Notch detection preserved

const VillageDetails = () => {
  const { villageName } = useParams();
  const navigate = useNavigate();
  
  const [farmers, setFarmers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Selection & Edit Mode States
  const [isSelectionMode, setIsSelectionMode] = useState(false); 
  const [selectedFarmer, setSelectedFarmer] = useState(null); 
  
  // Form State
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
      const response = await axios.get(`${API_URL}?village=${villageName}`, {
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
        // ✏️ UPDATE existing farmer
        await axios.put(`${API_URL}/${selectedFarmer._id}`, {
          name,
          paddy_variety: paddyVariety
        }, config);
        alert("✅ Details Updated!");
      } else {
        // ➕ ADD new farmer
        await axios.post(API_URL, {
          name,
          village: villageName, 
          paddy_variety: paddyVariety,
          phone: "0000000000"
        }, config);
        alert("✅ Farmer Added!");
      }
      
      resetForm();
      fetchFarmers(); 
    } catch (error) { alert("Error saving farmer"); }
  };

  const handleDeleteFarmer = async () => {
      if (!selectedFarmer) return;
      if (!window.confirm(`⚠️ PERMANENTLY DELETE ${selectedFarmer.name}? This will erase all their transaction history.`)) return;

      try {
          const token = localStorage.getItem('token');
          await axios.delete(`${API_URL}/${selectedFarmer._id}`, { 
              headers: { Authorization: `Bearer ${token}` } 
          });
          resetForm();
          fetchFarmers();
          alert("🗑️ Farmer deleted successfully");
      } catch (error) { alert("Error deleting farmer"); }
  };

  const resetForm = () => {
    setName('');
    setPaddyVariety('');
    setSelectedFarmer(null);
    setIsSelectionMode(false);
  };

  const handleFarmerClick = (farmer) => {
      if (isSelectionMode) {
          // If in Edit Mode, select the farmer and fill the form
          if (selectedFarmer?._id === farmer._id) {
              setSelectedFarmer(null);
              setName('');
              setPaddyVariety('');
          } else {
              setSelectedFarmer(farmer);
              setName(farmer.name);
              setPaddyVariety(farmer.paddy_variety);
          }
      } else {
          // Normal Mode: Navigate to details
          navigate(`/farmer/${farmer._id}`);
      }
  };

  const filteredFarmers = farmers.filter(farmer => 
    farmer.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Preserved counts feature
  const activeCount = farmers.filter(f => f.isActive !== false).length;
  const inactiveCount = farmers.filter(f => f.isActive === false).length;

  // --- 🎨 FULL STYLES PRESERVED ---
  const containerStyle = {
    paddingTop: Capacitor.isNativePlatform() ? 'env(safe-area-inset-top, 50px)' : '20px',
    paddingLeft: '20px',
    paddingRight: '20px',
    paddingBottom: '40px',
    width: "100%", 
    maxWidth: "500px", 
    margin: "0 auto", 
    display: "flex", 
    flexDirection: "column", 
    gap: "20px",
    backgroundColor: "#F4F7FA", 
    minHeight: "100vh",
    boxSizing: "border-box"
  };

  return (
    <div style={containerStyle}>
      
      {/* 🔝 HEADER & COUNTS (ALL FEATURES PRESERVED) */}
      <div style={{ backgroundColor: "#fff", padding: "15px", borderRadius: "18px", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <button 
                  onClick={() => navigate('/records')} 
                  style={{ cursor: "pointer", padding:"10px 14px", backgroundColor: "#fff", border: "1px solid #ddd", borderRadius: "12px", fontWeight: "bold" }}
                >
                  ←
                </button>
                <h2 style={{ margin: 0, fontSize: "19px", fontWeight: "800", color: "#1a1a1a" }}>{villageName}</h2>
            </div>
            
            <div style={{ display: "flex", gap: "8px" }}>
                {/* 🗑️ Delete button appears only after selection in Edit Mode */}
                {isSelectionMode && selectedFarmer && (
                    <button 
                      onClick={handleDeleteFarmer}
                      style={{ backgroundColor: "#fff0f0", color: "#fa5252", border: "1px solid #ffaeb1", padding: "10px 14px", borderRadius: "12px", fontWeight: "bold", fontSize: "12px" }}
                    >
                      Delete
                    </button>
                )}
                {/* ✏️ Clear Edit Toggle Button */}
                <button 
                  onClick={() => isSelectionMode ? resetForm() : setIsSelectionMode(true)}
                  style={{ 
                    backgroundColor: isSelectionMode ? "#1a1a1a" : "#E3F2FD", 
                    color: isSelectionMode ? "white" : "#2196F3", 
                    border: "none", padding: "10px 16px", borderRadius: "12px", fontWeight: "bold" 
                  }}
                >
                    {isSelectionMode ? "Done" : "Edit"}
                </button>
            </div>
        </div>
        
        <div style={{ display: "flex", gap: "10px" }}>
            <div style={{ flex: 1, backgroundColor: "#E8F5E9", padding: "12px", borderRadius: "14px", textAlign: "center" }}>
                <span style={{ display: "block", fontSize: "11px", color: "#2E7D32", fontWeight: "800", letterSpacing: "0.5px" }}>ACTIVE</span>
                <span style={{ fontSize: "22px", fontWeight: "900", color: "#2E7D32" }}>{activeCount}</span>
            </div>
            <div style={{ flex: 1, backgroundColor: "#f1f3f5", padding: "12px", borderRadius: "14px", textAlign: "center" }}>
                <span style={{ display: "block", fontSize: "11px", color: "#666", fontWeight: "800", letterSpacing: "0.5px" }}>SETTLED</span>
                <span style={{ fontSize: "22px", fontWeight: "900", color: "#666" }}>{inactiveCount}</span>
            </div>
        </div>
      </div>

      {/* SEARCH (Preserved) */}
      <div style={{ position: "relative" }}>
        <input 
            type="text" 
            placeholder="🔍 Search Farmer Name..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: "100%", padding: "16px", fontSize: "16px", borderRadius: "16px", border: "1px solid #eee", outline: "none", backgroundColor: "#fff", boxShadow: "0 4px 10px rgba(0,0,0,0.03)", boxSizing: "border-box" }}
        />
      </div>

      {/* LIST (Updated with Selection Logic) */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {filteredFarmers.map((farmer, index) => (
          <div 
            key={farmer._id} 
            onClick={() => handleFarmerClick(farmer)} 
            style={{ 
                padding: "16px", 
                borderRadius: "16px", 
                cursor: "pointer", 
                backgroundColor: selectedFarmer?._id === farmer._id ? "#FFFDE7" : "#ffffff",
                display: "flex", alignItems: "center", gap: "15px", 
                boxShadow: "0 4px 12px rgba(0,0,0,0.04)",
                borderLeft: farmer.isActive === false ? "6px solid #adb5bd" : "6px solid #4CAF50",
                border: selectedFarmer?._id === farmer._id ? "2px solid #FBC02D" : "none",
                opacity: (isSelectionMode && selectedFarmer && selectedFarmer._id !== farmer._id) ? 0.6 : 1,
                transition: "0.2s all ease"
            }}
          >
            <div style={{ 
              backgroundColor: selectedFarmer?._id === farmer._id ? "#FBC02D" : "#1a1a1a", 
              color: "white", width: "35px", height: "35px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "800", fontSize: "14px" 
            }}>
                {index + 1}
            </div>
            
            <div style={{ flex: 1 }}>
                <strong style={{ fontSize: "17px", color: "#1a1a1a", fontWeight: "700" }}>
                    {farmer.name}
                </strong> 
                <br/>
                <span style={{ color: "#495057", backgroundColor: "#e9ecef", padding: "2px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: "700", marginTop: "6px", display: "inline-block", textTransform: "uppercase" }}>
                    {farmer.paddy_variety}
                </span>
            </div>
            
            {isSelectionMode && (
                <div style={{ color: selectedFarmer?._id === farmer._id ? "#FBC02D" : "#ddd", fontSize: "20px" }}>
                    {selectedFarmer?._id === farmer._id ? "●" : "○"}
                </div>
            )}
          </div>
        ))}
      </div>

      {/* DYNAMIC FORM (Handles both Add and Edit) */}
      <div style={{ backgroundColor: "#fff", padding: "24px", borderRadius: "24px", boxShadow: "0 10px 25px rgba(0,0,0,0.06)", marginTop: "10px" }}>
        <h3 style={{ margin: "0 0 18px 0", color: "#1a1a1a", fontSize: "18px", fontWeight: "800", textAlign: "center" }}>
            {selectedFarmer ? "✏️ Edit Farmer Details" : "➕ Add New Farmer"}
        </h3>
        <form onSubmit={handleSaveFarmer} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <input 
              type="text" 
              placeholder="Full Name" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              style={{ padding: "14px", border: "1px solid #eee", borderRadius: "12px", backgroundColor: "#f8f9fa", fontSize: "16px", outline: "none" }} 
            />
            <input 
              type="text" 
              placeholder="Paddy Variety (e.g. BPT, RNR)" 
              value={paddyVariety} 
              onChange={(e) => setPaddyVariety(e.target.value)} 
              style={{ padding: "14px", border: "1px solid #eee", borderRadius: "12px", backgroundColor: "#f8f9fa", fontSize: "16px", outline: "none" }} 
            />
            <button 
              type="submit" 
              style={{ 
                padding: "16px", 
                backgroundColor: selectedFarmer ? "#2196F3" : "#4CAF50", 
                color: "white", 
                border: "none", 
                borderRadius: "14px", 
                fontWeight: "800", 
                fontSize: "16px",
                boxShadow: selectedFarmer ? "0 6px 15px rgba(33, 150, 243, 0.3)" : "0 6px 15px rgba(76, 175, 80, 0.3)",
                marginTop: "5px"
              }}
            >
              {selectedFarmer ? "Update Details" : "Add Farmer"}
            </button>
            {isSelectionMode && (
                <button 
                  type="button" 
                  onClick={resetForm} 
                  style={{ padding: "10px", background: "none", border: "none", color: "#666", fontWeight: "bold", cursor: "pointer" }}
                >
                    Cancel / Clear
                </button>
            )}
        </form>
      </div>
    </div>
  );
};

export default VillageDetails;