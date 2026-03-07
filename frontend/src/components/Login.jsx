import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../config'; // 🔗 Uses central config

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      // ✅ Now uses secure API URL
      const res = await axios.post(`${API_BASE_URL}/auth/login`, { username, password });
      
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      navigate('/'); 
    } catch (err) {
      alert(err.response?.data?.error || 'Login failed');
    }
  };

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection:"column", justifyContent: "center", alignItems: "center", backgroundColor: "#f0f2f5" }}>
      
      <div style={{ background: "white", padding: "30px", borderRadius: "10px", boxShadow: "0 4px 15px rgba(0,0,0,0.1)", textAlign: "center", width: "300px" }}>
        
        <h2 style={{ color: "#2E7D32", marginBottom: "20px" }}>🌾 AgriFinance Login</h2>
        
        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
          
          <input 
            type="text" 
            placeholder="Username" 
            value={username} 
            onChange={(e) => setUsername(e.target.value)} 
            required 
            style={{ padding: "12px", borderRadius: "5px", border: "1px solid #ccc" }}
          />

          <input 
            type="password" 
            placeholder="Password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
            style={{ padding: "12px", borderRadius: "5px", border: "1px solid #ccc" }}
          />

          <button type="submit" style={{ padding: "12px", background: "#2E7D32", color: "white", border: "none", borderRadius: "5px", fontSize: "16px", fontWeight: "bold", cursor: "pointer" }}>
            Login
          </button>
        </form>

        <div style={{ marginTop: "15px", display: "flex", justifyContent: "space-between", fontSize: "14px" }}>
            <Link to="/forgot-password" style={{ color: "#666", textDecoration: "none" }}>Forgot Password?</Link>
            <Link to="/register" style={{ color: "#2E7D32", fontWeight: "bold", textDecoration: "none" }}>Register</Link>
        </div>

      </div>
    </div>
  );
};
export default Login;