import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../config'; 
import { Capacitor } from '@capacitor/core'; // 🔌 Added for Notch detection

const VillageList = () => {
  const [villages, setVillages] = useState([]);
  const [newVillageName, setNewVillageName] = useState('');
  const navigate = useNavigate();
  
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }
    fetchVillages();
  }, [navigate]);

  const fetchVillages = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/villages`, { 
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

  const handleAddVillage = async (e) => {
    e.preventDefault();
    if (!newVillageName) return;
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_BASE_URL}/villages`, 
        { name: newVillageName }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNewVillageName(''); 
      fetchVillages();
    } catch (error) { alert("Error adding village"); }
  };

  // --- 🎨 NATIVE SCALING STYLES ---
  const containerStyle = {
    // 📱 Pushes content down to avoid the camera notch or status bar
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
        {/* 🔝 Professional Header - Brought Down */}
        <div style={{ display: "flex", justifyContent: "flex-start", alignItems: "center", marginBottom: "10px" }}>
          <button 
            onClick={() => navigate('/')} 
            style={{ 
              cursor: "pointer", 
              padding:"10px 16px", 
              backgroundColor: "#fff", 
              color: "#333", 
              border: "1px solid #ddd", 
              borderRadius: "12px", 
              fontWeight: "bold",
              boxShadow: "0 2px 5px rgba(0,0,0,0.05)" 
            }}
          >
            ← Back to Dashboard
          </button>
        </div>

        <h1 style={{ margin: 0, fontSize: "24px", fontWeight: "800", color: "#1a1a1a", textAlign: "center" }}>
            📂 All Villages
        </h1>

        <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
          {villages.length === 0 && (
            <p style={{ textAlign: "center", color: "#888", marginTop: "20px" }}>
                No villages yet.
            </p>
          )}
          {villages.map((village, index) => (
            <div 
              key={village._id} 
              onClick={() => navigate(`/village/${village.name}`)} 
              style={{ 
                padding: "20px", 
                borderRadius: "16px", 
                backgroundColor: "#ffffff", 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "space-between", 
                boxShadow: "0 4px 12px rgba(0,0,0,0.04)", 
                cursor: "pointer", 
                borderLeft: "5px solid #2196F3" 
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                <div style={{ 
                    backgroundColor: "#E3F2FD", 
                    color: "#1565C0", 
                    width: "40px", 
                    height: "40px", 
                    borderRadius: "50%", 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center", 
                    fontWeight: "bold", 
                    fontSize: "16px" 
                }}>
                    {index + 1}
                </div>
                <strong style={{ fontSize: "18px", color: "#333" }}>{village.name}</strong>
              </div>
              <span style={{ color: "#bbb", fontSize: "20px" }}>➜</span>
            </div>
          ))}
        </div>

        <div style={{ backgroundColor: "#fff", padding: "20px", borderRadius: "16px", boxShadow: "0 4px 15px rgba(0,0,0,0.08)" }}>
          <h3 style={{ margin: "0 0 15px 0", color: "#333", textAlign: "center", fontSize: "18px" }}>➕ Add New Village</h3>
          <form onSubmit={handleAddVillage} style={{ display: "flex", gap: "10px" }}>
              <input 
                type="text" 
                placeholder="Village Name..." 
                value={newVillageName} 
                onChange={(e) => setNewVillageName(e.target.value)} 
                style={{ 
                    flex: 1, 
                    padding: "14px", 
                    border: "2px solid #f0f0f0", 
                    borderRadius: "12px", 
                    fontSize: "16px", 
                    outline: "none", 
                    backgroundColor: "#f9f9f9", 
                    color: "#333" 
                }} 
              />
              <button 
                type="submit" 
                style={{ 
                    padding: "14px 24px", 
                    backgroundColor: "#2196F3", 
                    color: "white", 
                    border: "none", 
                    borderRadius: "12px", 
                    fontWeight: "bold", 
                    fontSize: "16px", 
                    cursor: "pointer" 
                }}
              >
                Add
              </button>
          </form>
        </div>
    </div>
  );
};

export default VillageList;