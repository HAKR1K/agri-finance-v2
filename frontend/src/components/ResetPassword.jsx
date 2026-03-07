import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../config.js'; // 🔗 Uses central config

const ResetPassword = () => {
  const { token } = useParams();
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // ✅ Now uses secure API URL
      await axios.put(`${API_BASE_URL}/auth/reset-password/${token}`, { password });
      alert("✅ Password Updated! Login with new password.");
      navigate('/login');
    } catch (err) {
      alert("❌ Error: " + (err.response?.data?.msg || "Link expired"));
    }
  };

  return (
    <div style={{ padding: "50px", textAlign: "center" }}>
      <h2>🔑 Set New Password</h2>
      <form onSubmit={handleSubmit}>
        <input 
          type="password" 
          placeholder="Enter New Password" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
          required 
          style={{ padding: "10px", width: "250px" }}
        />
        <br /><br />
        <button type="submit" style={{ padding: "10px 20px", background: "#2E7D32", color: "white", border: "none", cursor: "pointer" }}>
          Update Password
        </button>
      </form>
    </div>
  );
};
export default ResetPassword;