import { useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config'; // 🔗 Uses central config

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // ✅ Now uses secure API URL
      const res = await axios.post(`${API_BASE_URL}/auth/forgot-password`, { email });
      setMsg("✅ " + res.data.msg);
    } catch (err) {
      setMsg("❌ " + (err.response?.data?.msg || "Error sending email"));
    }
  };

  return (
    <div style={{ padding: "50px", textAlign: "center" }}>
      <h2>🔒 Reset Password</h2>
      <form onSubmit={handleSubmit} style={{ display: "inline-block", textAlign: "left" }}>
        <input 
          type="email" 
          placeholder="Enter your registered email" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
          required 
          style={{ padding: "10px", width: "250px", marginRight: "10px" }}
        />
        <button type="submit" style={{ padding: "10px 20px", background: "#2E7D32", color: "white", border: "none", cursor: "pointer" }}>
          Send Link
        </button>
      </form>
      {msg && <p style={{ marginTop: "20px", fontWeight: "bold" }}>{msg}</p>}
    </div>
  );
};
export default ForgotPassword;