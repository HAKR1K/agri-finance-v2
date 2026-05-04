import { useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import './Dashboard.css'; 

const Sections = () => {
  const navigate = useNavigate();
  const safeAreaTop = Capacitor.isNativePlatform() ? 'env(safe-area-inset-top, 40px)' : '20px';

  const groups = [
    {
      title: 'FINANCIALS',
      items: [
        { title: 'CASH SECTION', sub: 'Loans vs Yields detailed breakdown', icon: '₹', path: '/cash-analysis', color: '#16a34a' }
      ]
    },
    {
      title: 'LOADING SYSTEM',
      items: [
        { title: 'ALL VILLAGE LIST', sub: 'Select villages/farmers for loading', icon: '📁', path: '/village-loading', color: '#16a34a' },
        { title: 'LOADS', sub: 'Manage and track active transport loads', icon: '🚛', path: '/active-loads', color: '#16a34a' }
      ]
    }
  ];

  return (
    <div className="sections-page" style={{ paddingTop: safeAreaTop, minHeight: '100vh', background: '#f9fafb', paddingBottom: '100px' }}>
      <div className="sections-header" style={{ padding: '24px 20px', textAlign: 'left' }}>
        <span style={{ fontSize: '12px', fontWeight: '800', color: '#16a34a', letterSpacing: '2px' }}>EXPLORE</span>
        <h1 style={{ fontSize: '28px', fontWeight: '900', color: '#111827', margin: '4px 0' }}>All Modules</h1>
        <p style={{ fontSize: '14px', color: '#6b7280' }}>Access all features of AgriFinance</p>
      </div>

      <div className="sections-container" style={{ padding: '0 20px' }}>
        {groups.map((group, gIdx) => (
          <div key={gIdx} className="section-group" style={{ marginBottom: '32px' }}>
            <h2 className="db-section-title" style={{ fontSize: '13px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ height: '1.5px', flex: 1, background: '#e5e7eb' }}></div>
              {group.title}
              <div style={{ height: '1.5px', flex: 1, background: '#e5e7eb' }}></div>
            </h2>
            
            <div className="items-grid" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {group.items.map((item, iIdx) => (
                <div
                  key={iIdx}
                  className="modern-card"
                  onClick={() => navigate(item.path)}
                  style={{
                    background: '#ffffff',
                    padding: '18px',
                    borderRadius: '22px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    border: '1px solid #f3f4f6',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div className="modern-icon-box" style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: '16px',
                    background: '#f0fdf4',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px',
                    color: item.color,
                    border: `1.5px solid #dcfce7`
                  }}>
                    {item.icon}
                  </div>
                  
                  <div className="modern-info" style={{ flex: 1 }}>
                    <div style={{ fontSize: '17px', fontWeight: '800', color: '#111827' }}>{item.title}</div>
                    <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500', marginTop: '2px' }}>{item.sub}</div>
                  </div>
                  
                  <div className="modern-arrow" style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#cbd5e1', fontSize: '20px' }}>
                    ›
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Sections;
