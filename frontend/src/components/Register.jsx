import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../config';

const Register = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/auth/register`, { username, email, password });
      alert("✅ Registered Successfully! Please Login.");
      navigate('/login');
    } catch (error) { 
      alert("❌ " + (error.response?.data?.error || "Error registering")); 
    } finally {
      setLoading(false);
    }
  };

  const styles = {
    container: {
      height: "100vh",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      background: "linear-gradient(135deg, #F1F8E9 0%, #DCEDC8 100%)",
      fontFamily: "'Inter', sans-serif",
      padding: "20px"
    },
    card: {
      background: "white",
      padding: "40px",
      borderRadius: "28px",
      boxShadow: "0 20px 40px rgba(0,0,0,0.08)",
      width: "100%",
      maxWidth: "400px",
      textAlign: "center"
    },
    // New Brand Container for Side-by-Side Logo
    brandContainer: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "12px",
      marginBottom: "10px"
    },
    brandName: {
      color: "#1B5E20", 
      margin: 0, 
      fontWeight: "900", 
      fontSize: "28px",
      letterSpacing: "-0.5px"
    },
    input: {
      padding: "14px 18px",
      borderRadius: "14px",
      border: "1.5px solid #E0E0E0",
      fontSize: "15px",
      backgroundColor: "#FDFDFD",
      outline: "none",
      transition: "0.2s border-color",
      width: "100%",
      boxSizing: "border-box"
    },
    button: {
      padding: "16px",
      backgroundColor: "#1B5E20",
      color: "white",
      border: "none",
      borderRadius: "14px",
      fontWeight: "800",
      fontSize: "16px",
      cursor: "pointer",
      boxShadow: "0 8px 20px rgba(27, 94, 32, 0.2)",
      marginTop: "10px"
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        
        {/* 🌿 Logo and Brand Side-by-Side */}
        <div style={styles.brandContainer}>
            <span style={{ fontSize: "32px" }}>🌿</span>
            <h2 style={styles.brandName}>AgriFinance</h2>
        </div>

        <p style={{ color: "#666", marginBottom: "30px", fontSize: "14px" }}>
            Start managing your village finances easily.
        </p>
        
        <form onSubmit={handleRegister} style={{ display:"flex", flexDirection:"column", gap:"16px" }}>
            <input 
              type="text" 
              placeholder="Username" 
              value={username} 
              onChange={e=>setUsername(e.target.value)} 
              required
              style={styles.input}
            />
            
            <input 
              type="email" 
              placeholder="Email (for recovery)" 
              value={email} 
              onChange={e=>setEmail(e.target.value)} 
              required
              style={styles.input}
            />

            <input 
              type="password" 
              placeholder="Create Password" 
              value={password} 
              onChange={e=>setPassword(e.target.value)} 
              required
              style={styles.input}
            />

            <button type="submit" disabled={loading} style={styles.button}>
              {loading ? "Creating Account..." : "Create My Account"}
            </button>
        </form>
        
        <div style={{ marginTop: "25px", fontSize: "14px" }}>
          <span style={{ color: "#888" }}>Already have an account? </span>
          <Link to="/login" style={{ color: "#2E7D32", fontWeight: "bold", textDecoration: "none" }}>Log In</Link>
        </div>
      </div>
    </div>
  );
};
export default Register;