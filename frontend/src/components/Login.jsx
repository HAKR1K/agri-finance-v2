import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import './Login.css'; // 👈 Import the CSS file here

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

  return (
    <div className="login-container">
      <div className="login-card">
        
        {/* 🌿 Horizontal Logo Section */}
        <div className="login-header-section">
          <span className="login-logo-emoji">🌿</span>
          <h2 className="login-brand-name">AgriFinance</h2>
        </div>

        <p className="login-subtitle">
          Welcome back! Please login to your account.
        </p>
        
        <form onSubmit={handleLogin} className="login-form">
          <input 
            type="text" 
            placeholder="Username" 
            value={username} 
            onChange={(e) => setUsername(e.target.value)} 
            required 
            className="login-input"
          />

          <input 
            type="password" 
            placeholder="Password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
            className="login-input"
          />

          <button type="submit" disabled={loading} className="login-button">
            {loading ? "Authenticating..." : "Login to Dashboard"}
          </button>
        </form>

        <div className="login-footer-links">
            <Link to="/forgot-password" title="Forgot Password" className="login-link-forgot">
              Forgot Password?
            </Link>
            <Link to="/register" title="Create Account" className="login-link-register">
              Create Account
            </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;