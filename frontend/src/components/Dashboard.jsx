import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';

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

    // Set html/body background
    document.documentElement.style.background = '#F0F4F8';
    document.body.style.background = 'transparent';
    document.body.style.margin = '0';
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
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .db-root {
          font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
          min-height: 100dvh;
          background: transparent;
          display: flex;
          flex-direction: column;
          padding-left: 20px;
          padding-right: 20px;
          padding-bottom: 48px;
        }

        /* ── TOPBAR ── */
        .db-topbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 28px;
        }
        .db-greeting-label {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 1.5px;
          color: #7A8BA0;
          text-transform: uppercase;
          margin-bottom: 3px;
        }
        .db-username {
          font-size: 24px;
          font-weight: 800;
          color: #111827;
          line-height: 1.15;
        }
        .db-logout {
          font-family: 'Plus Jakarta Sans', sans-serif;
          background: #FFF8DC;
          border: 1.5px solid #FFD84D;
          color: #7A5C00;
          padding: 9px 18px;
          border-radius: 12px;
          font-weight: 700;
          font-size: 13px;
          cursor: pointer;
          white-space: nowrap;
          box-shadow: 0 3px 10px rgba(255, 216, 77, 0.25);
          transition: transform 0.1s;
        }
        .db-logout:active { transform: scale(0.96); }

        /* ── CAROUSEL ── */
        .carousel-wrap {
          width: 100%;
          border-radius: 22px;
          overflow: hidden;
          position: relative;
          aspect-ratio: 16 / 9;
          box-shadow: 0 12px 32px rgba(0,0,0,0.14);
          margin-bottom: 16px;
        }
        .carousel-track {
          display: flex;
          width: 100%;
          height: 100%;
          transition: transform 0.45s cubic-bezier(0.4,0,0.2,1);
        }
        .carousel-slide {
          min-width: 100%;
          height: 100%;
          position: relative;
          flex-shrink: 0;
        }
        .carousel-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .carousel-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, rgba(0,0,0,0.62) 0%, rgba(0,0,0,0.05) 55%);
        }
        .carousel-caption {
          position: absolute;
          bottom: 18px;
          left: 18px;
          right: 18px;
          color: white;
        }
        .carousel-caption h3 {
          font-size: 17px;
          font-weight: 800;
          margin-bottom: 3px;
          line-height: 1.2;
        }
        .carousel-caption p {
          font-size: 12px;
          opacity: 0.85;
          font-weight: 500;
        }

        .carousel-dots {
          display: flex;
          justify-content: center;
          gap: 7px;
          margin-bottom: 28px;
        }
        .carousel-dot {
          height: 7px;
          border-radius: 4px;
          background: #CBD5E0;
          border: none;
          cursor: pointer;
          transition: width 0.3s ease, background 0.3s ease;
        }
        .carousel-dot.active {
          background: #2b8ef0;
          width: 22px !important;
        }

        .db-section-title {
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 1.2px;
          color: #8A97A8;
          text-transform: uppercase;
          margin-bottom: 16px;
        }

        .module-card {
          width: 100%;
          border: none;
          border-radius: 20px;
          padding: 22px 20px;
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 18px;
          text-align: left;
          margin-bottom: 16px;
          position: relative;
          overflow: hidden;
          transition: transform 0.15s ease, box-shadow 0.15s ease;
          -webkit-tap-highlight-color: transparent;
        }
        .module-card:active { transform: scale(0.97); }
        .card-blue { background: linear-gradient(135deg, #2b8ef0, #1a6fd4); box-shadow: 0 10px 28px rgba(43,142,240,0.35); }
        .card-purple { background: linear-gradient(135deg, #7c4dff, #5b35d5); box-shadow: 0 10px 28px rgba(124,77,255,0.35); }

        .card-icon {
          width: 56px; height: 56px; min-width: 56px;
          background: rgba(255,255,255,0.18);
          border-radius: 16px;
          display: flex; align-items: center; justify-content: center;
          font-size: 26px;
          position: relative; z-index: 1;
        }
        .card-text { flex: 1; position: relative; z-index: 1; }
        .card-title { font-size: 17px; font-weight: 800; margin-bottom: 4px; }
        .card-sub { font-size: 12px; opacity: 0.82; font-weight: 500; }
        .card-arrow {
          width: 30px; height: 30px; min-width: 30px;
          background: rgba(255,255,255,0.2);
          border-radius: 9px;
          display: flex; align-items: center; justify-content: center;
          font-size: 14px;
          position: relative; z-index: 1;
        }

        .db-footer {
          margin-top: auto;
          padding-top: 24px;
          text-align: center;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 2.5px;
          color: #B0BCCC;
        }
      `}</style>

      <div className="db-root" style={{ paddingTop: safePaddingTop }}>

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
              style={{ width: activeSlide === i ? '22px' : '7px' }}
              onClick={() => goToSlide(i)}
            />
          ))}
        </div>

        <div className="db-section-title">Select Module</div>

        {/* 🛠️ NAVIGATION FIXED: Changed /farmers to /records */}
        <div
          className="module-card card-blue"
          onClick={() => navigate('/records')}
          role="button"
          tabIndex={0}
          onKeyDown={e => e.key === 'Enter' && navigate('/records')}
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
          role="button"
          tabIndex={0}
          onKeyDown={e => e.key === 'Enter' && navigate('/analysis')}
        >
          <div className="card-icon">📊</div>
          <div className="card-text">
            <div className="card-title">Analysis</div>
            <div className="card-sub">Investments · Fertilizers · Stats</div>
          </div>
          <div className="card-arrow">›</div>
        </div>

        <div className="db-footer">AGRIFINANCE v1.0</div>

      </div>
    </>
  );
};

export default Dashboard;