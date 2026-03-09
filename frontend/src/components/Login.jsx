import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../config';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/auth/login`, { username, password });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      navigate('/'); 
    } catch (err) {
      alert(err.response?.data?.error || 'Login failed');
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
      background: "linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%)",
      fontFamily: "'Inter', sans-serif",
      padding: "20px"
    },
    card: {
      background: "rgba(255, 255, 255, 0.98)",
      padding: "40px",
      borderRadius: "28px",
      boxShadow: "0 20px 40px rgba(0,0,0,0.08)",
      width: "100%",
      maxWidth: "400px",
      textAlign: "center"
    },
    // Flex container for horizontal logo and text
    headerSection: {
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
      padding: "16px",
      borderRadius: "14px",
      border: "1.5px solid #E0E0E0",
      fontSize: "16px",
      backgroundColor: "#F9F9F9",
      outline: "none",
      width: "100%",
      boxSizing: "border-box",
      transition: "0.2s border-color"
    },
    button: {
      padding: "16px",
      background: "#2E7D32",
      color: "white",
      border: "none",
      borderRadius: "14px",
      fontSize: "16px",
      fontWeight: "800",
      cursor: "pointer",
      boxShadow: "0 8px 16px rgba(46, 125, 50, 0.24)",
      marginTop: "10px"
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        
        {/* 🌿 Horizontal Logo Section */}
        <div style={styles.headerSection}>
          <span style={{ fontSize: "32px" }}>🌿</span>
          <h2 style={styles.brandName}>AgriFinance</h2>
        </div>

        <p style={{ color: "#666", marginBottom: "30px", fontSize: "14px" }}>
          Welcome back! Please login to your account.
        </p>
        
        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          <input 
            type="text" 
            placeholder="Username" 
            value={username} 
            onChange={(e) => setUsername(e.target.value)} 
            required 
            style={styles.input}
          />

          <input 
            type="password" 
            placeholder="Password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
            style={styles.input}
          />

          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? "Authenticating..." : "Login to Dashboard"}
          </button>
        </form>

        <div style={{ marginTop: "30px", display: "flex", justifyContent: "space-between", fontSize: "14px" }}>
            <Link to="/forgot-password" style={{ color: "#888", textDecoration: "none" }}>Forgot Password?</Link>
            <Link to="/register" style={{ color: "#2E7D32", fontWeight: "bold", textDecoration: "none" }}>Create Account</Link>
        </div>
      </div>
    </div>
  );
};
export default Login;