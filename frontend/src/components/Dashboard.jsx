import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import './Dashboard.css'; // Import the separated CSS

const CAROUSEL_SLIDES = [
  {
    url: "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=800&q=80",
    title: "Track Your Fields",
    subtitle: "Monitor every village & crop cycle"
  },
  {
    url: "https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=800&q=80",
    title: "Smart Farming",
    subtitle: "Fertilizer & investment insights"
  },
  {
    url: "https://images.unsplash.com/photo-1592982537447-7440770cbfc9?w=800&q=80",
    title: "Grow Your Profits",
    subtitle: "Real-time stats & due tracking"
  }
];

const Dashboard = () => {
  const navigate = useNavigate();
  const [greeting, setGreeting] = useState('Welcome');
  const [activeSlide, setActiveSlide] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 17) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');

    return () => {
      document.documentElement.style.background = '';
      document.body.style.background = '';
    };
  }, [navigate]);

  // Auto-advance carousel
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setActiveSlide(s => (s + 1) % CAROUSEL_SLIDES.length);
    }, 3200);
    return () => clearInterval(timerRef.current);
  }, []);

  const goToSlide = (i) => {
    clearInterval(timerRef.current);
    setActiveSlide(i);
    timerRef.current = setInterval(() => {
      setActiveSlide(s => (s + 1) % CAROUSEL_SLIDES.length);
    }, 3200);
  };

  // Safely parse user data
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : { username: 'Karthik' };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const safePaddingTop = Capacitor.isNativePlatform()
    ? 'calc(env(safe-area-inset-top, 44px) + 10px)'
    : '28px';

  return (
    <div className="db-root">
      <div className="db-topbar">
        <div>
          <div className="db-greeting-label">☀️ {greeting}</div>
          <div className="db-username">{user?.username || 'Karthik'}</div>
        </div>
        <button className="db-logout" onClick={handleLogout}>Logout</button>
      </div>

      <div className="carousel-wrap">
        <div
          className="carousel-track"
          style={{ transform: `translateX(-${activeSlide * 100}%)` }}
        >
          {CAROUSEL_SLIDES.map((slide, i) => (
            <div className="carousel-slide" key={i}>
              <img src={slide.url} alt={slide.title} className="carousel-img" />
              <div className="carousel-overlay" />
              <div className="carousel-caption">
                <h3>{slide.title}</h3>
                <p>{slide.subtitle}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="carousel-dots">
        {CAROUSEL_SLIDES.map((_, i) => (
          <button
            key={i}
            className={`carousel-dot${activeSlide === i ? ' active' : ''}`}
            onClick={() => goToSlide(i)}
          />
        ))}
      </div>

      <div className="db-section-title">Select Module</div>

      <div
        className="module-card card-blue"
        onClick={() => navigate('/records')}
      >
        <div className="card-icon">📁</div>
        <div className="card-text">
          <div className="card-title">Farmer Records</div>
          <div className="card-sub">Villages · Lists · Transactions</div>
        </div>
        <div className="card-arrow">›</div>
      </div>

      <div
        className="module-card card-purple"
        onClick={() => navigate('/analysis')}
      >
        <div className="card-icon">📊</div>
        <div className="card-text">
          <div className="card-title">Analysis</div>
          <div className="card-sub">Loans · Inventory · Stats</div>
        </div>
        <div className="card-arrow">›</div>
      </div>

      <div
        className="module-card card-blue"
        onClick={() => navigate('/advanced-analysis')}
      >
        <div className="card-icon">📑</div>
        <div className="card-text">
          <div className="card-title">Reports</div>
          <div className="card-sub">Detailed breakdown · Gross Volumes</div>
        </div>
        <div className="card-arrow">›</div>
      </div>

      <div
        className="module-card card-purple"
        onClick={() => navigate('/all-sections')}
      >
        <div className="card-icon">⚙️</div>
        <div className="card-text">
          <div className="card-title">All Sections</div>
          <div className="card-sub">Cash Module · Logistics · Profile</div>
        </div>
        <div className="card-arrow">›</div>
      </div>

      <div className="db-footer">AGRIFINANCE v1.0</div>
    </div>
  );
};

export default Dashboard;