import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../config'; // 🔗 Uses central config

const Register = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      // ✅ Now uses secure API URL
      await axios.post(`${API_BASE_URL}/auth/register`, { username, email, password });
      alert("✅ Registered Successfully! Please Login.");
      navigate('/login');
    } catch (error) { 
      const msg = error.response?.data?.error || "Error registering";
      alert("❌ " + msg); 
    }
  };

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection:"column", justifyContent: "center", alignItems: "center", backgroundColor: "#f0f2f5" }}>
        <h2 style={{ color: "#2E7D32" }}>📝 Register</h2>
        
        <form onSubmit={handleRegister} style={{ display:"flex", flexDirection:"column", gap:"15px", width:"300px", padding: "20px", background: "white", borderRadius: "10px", boxShadow: "0 4px 10px rgba(0,0,0,0.1)" }}>
            
            <input 
              type="text" 
              placeholder="Username" 
              value={username} 
              onChange={e=>setUsername(e.target.value)} 
              required
              style={{padding:"12px", border: "1px solid #ccc", borderRadius: "5px"}}
            />
            
            <input 
              type="email" 
              placeholder="Recovery Email" 
              value={email} 
              onChange={e=>setEmail(e.target.value)} 
              required
              style={{padding:"12px", border: "1px solid #ccc", borderRadius: "5px"}}
            />

            <input 
              type="password" 
              placeholder="Password" 
              value={password} 
              onChange={e=>setPassword(e.target.value)} 
              required
              style={{padding:"12px", border: "1px solid #ccc", borderRadius: "5px"}}
            />

            <button type="submit" style={{padding:"12px", backgroundColor:"#2E7D32", color:"white", border:"none", borderRadius: "5px", fontWeight: "bold", cursor: "pointer"}}>
              Sign Up
            </button>
        </form>
        
        <br/>
        <Link to="/login" style={{ color: "#2E7D32", fontWeight: "bold", textDecoration: "none" }}>Back to Login</Link>
    </div>
  );
};
export default Register;