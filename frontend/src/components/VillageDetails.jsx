import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../config'; 
import { Capacitor } from '@capacitor/core'; // 🔌 Added for Notch detection

const VillageDetails = () => {
  const { villageName } = useParams();
  const navigate = useNavigate();
  
  const [farmers, setFarmers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [newFarmerName, setNewFarmerName] = useState('');
  const [paddyVariety, setPaddyVariety] = useState('');

  const API_URL = `${API_BASE_URL}/farmers`;

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }
    fetchFarmers();
  }, [navigate]);

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

  const handleAddFarmer = async (e) => {
    e.preventDefault();
    if (!newFarmerName || !paddyVariety) return alert("Please fill all fields");
    
    try {
      const token = localStorage.getItem('token');
      await axios.post(API_URL, {
        name: newFarmerName,
        village: villageName, 
        paddy_variety: paddyVariety,
        phone: "0000000000"
      }, { headers: { Authorization: `Bearer ${token}` } });
      
      setNewFarmerName(''); setPaddyVariety('');
      fetchFarmers(); 
      alert("✅ Farmer Added!");
    } catch (error) { alert("Error adding farmer"); }
  };

  const handleDeleteFarmer = async (e, id) => {
      e.stopPropagation();
      if (!window.confirm("Are you sure you want to DELETE this farmer permanently?")) return;

      try {
          const token = localStorage.getItem('token');
          await axios.delete(`${API_URL}/${id}`, { headers: { Authorization: `Bearer ${token}` } });
          fetchFarmers();
      } catch (error) { alert("Error deleting farmer"); }
  };

  const filteredFarmers = farmers.filter(farmer => 
    farmer.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeCount = farmers.filter(f => f.isActive !== false).length;
  const inactiveCount = farmers.filter(f => f.isActive === false).length;

  // --- 🎨 NATIVE SCALING STYLES ---
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
      
      {/* 🔝 Pushed Down Header & Counts */}
      <div style={{ backgroundColor: "#fff", padding: "15px", borderRadius: "18px", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: "15px" }}>
            <button 
              onClick={() => navigate('/records')} 
              style={{ 
                cursor: "pointer", 
                padding:"10px 16px", 
                backgroundColor: "#fff", 
                color: "#333", 
                border: "1px solid #ddd", 
                borderRadius: "12px", 
                fontWeight: "bold" 
              }}
            >
              ← Back
            </button>
            <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "800", color: "#1a1a1a" }}>{villageName}</h2>
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

      {/* SEARCH */}
      <div style={{ position: "relative" }}>
        <input 
            type="text" 
            placeholder="🔍 Search Farmer Name..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ 
              width: "100%", 
              padding: "16px", 
              fontSize: "16px", 
              borderRadius: "16px", 
              border: "1px solid #eee", 
              outline: "none", 
              backgroundColor: "#fff", 
              boxShadow: "0 4px 10px rgba(0,0,0,0.03)", 
              boxSizing: "border-box" 
            }}
        />
      </div>

      {/* LIST */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {filteredFarmers.map((farmer, index) => (
          <div 
            key={farmer._id} 
            onClick={() => navigate(`/farmer/${farmer._id}`)} 
            style={{ 
                padding: "16px", 
                borderRadius: "16px", 
                cursor: "pointer", 
                backgroundColor: farmer.isActive === false ? "#fdfdfd" : "#ffffff",
                display: "flex", alignItems: "center", gap: "15px", 
                boxShadow: "0 4px 12px rgba(0,0,0,0.04)",
                borderLeft: farmer.isActive === false ? "6px solid #adb5bd" : "6px solid #4CAF50",
                opacity: farmer.isActive === false ? 0.75 : 1
            }}
          >
            <div style={{ 
              backgroundColor: farmer.isActive === false ? "#adb5bd" : "#1a1a1a", 
              color: "white", 
              width: "35px", 
              height: "35px", 
              borderRadius: "10px", 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center", 
              fontWeight: "800", 
              fontSize: "14px" 
            }}>
                {index + 1}
            </div>
            
            <div style={{ flex: 1 }}>
                <strong style={{ 
                  fontSize: "17px", 
                  color: farmer.isActive === false ? "#868e96" : "#1a1a1a", 
                  textDecoration: farmer.isActive === false ? "line-through" : "none",
                  fontWeight: "700"
                }}>
                    {farmer.name}
                </strong> 
                <br/>
                <span style={{ 
                  color: "#495057", 
                  backgroundColor: "#e9ecef", 
                  padding: "2px 10px", 
                  borderRadius: "20px", 
                  fontSize: "11px", 
                  fontWeight: "700",
                  marginTop: "6px", 
                  display: "inline-block",
                  textTransform: "uppercase"
                }}>
                    {farmer.paddy_variety}
                </span>
            </div>

            <button 
                onClick={(e) => handleDeleteFarmer(e, farmer._id)}
                style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "#fa5252", padding: "10px" }}
            >
                🗑️
            </button>
          </div>
        ))}
      </div>

      {/* ADD FORM */}
      <div style={{ backgroundColor: "#fff", padding: "24px", borderRadius: "24px", boxShadow: "0 10px 25px rgba(0,0,0,0.06)", marginTop: "10px" }}>
        <h3 style={{ margin: "0 0 18px 0", color: "#1a1a1a", fontSize: "18px", fontWeight: "800", textAlign: "center" }}>➕ Add New Farmer</h3>
        <form onSubmit={handleAddFarmer} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <input 
              type="text" 
              placeholder="Full Name" 
              value={newFarmerName} 
              onChange={(e) => setNewFarmerName(e.target.value)} 
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
                backgroundColor: "#4CAF50", 
                color: "white", 
                border: "none", 
                borderRadius: "14px", 
                fontWeight: "800", 
                fontSize: "16px",
                boxShadow: "0 6px 15px rgba(76, 175, 80, 0.3)",
                marginTop: "5px"
              }}
            >
              Add Farmer
            </button>
        </form>
      </div>
    </div>
  );
};

export default VillageDetails;