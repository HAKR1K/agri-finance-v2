import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { API_BASE_URL } from '../config';
import './Analysis.css';

import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';

const Analysis = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloadingAudit, setIsDownloadingAudit] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }

    const fetchData = async () => {
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const resAnalysis = await axios.get(`${API_BASE_URL}/analysis`, { headers });
        setData(resAnalysis.data);
        const resActivity = await axios.get(`${API_BASE_URL}/activity?days=3`, { headers });
        setRecentActivity(resActivity.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, [navigate]);

  const saveAndOpenPdf = async (doc, fileName) => {
    try {
      if (Capacitor.isNativePlatform()) {
        const pdfBase64 = doc.output('datauristring').split(',')[1];
        const savedFile = await Filesystem.writeFile({
          path: fileName,
          data: pdfBase64,
          directory: Directory.Documents,
          recursive: true
        });
        await Share.share({ title: 'AgriFinance Report', url: savedFile.uri });
      } else {
        doc.save(fileName);
      }
    } catch (error) {
      console.error('File Error:', error);
      alert('Could not save report to device.');
    }
  };

  const handleDownloadAuditLog = async () => {
    if (!window.confirm("Download Complete Audit Log (All History)?")) return;
    setIsDownloadingAudit(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_BASE_URL}/activity`, { headers: { Authorization: `Bearer ${token}` } });
      const allActivity = res.data;

      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.text("AgriFinance - Full Audit Log", 105, 20, { align: 'center' });
      doc.setFontSize(10);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 105, 28, { align: 'center' });

      const tableRows = allActivity.map(t => [
        new Date(t.date).toLocaleDateString(),
        t.farmerName,
        t.type,
        t.fertilizer_name ? `${t.fertilizer_name} (x${t.quantity})` : (t.details || '-'),
        `Rs. ${parseFloat(t.amount).toLocaleString('en-IN')}`
      ]);

      autoTable(doc, {
        startY: 35,
        head: [['Date', 'Farmer', 'Type', 'Details', 'Amount']],
        body: tableRows,
        theme: 'grid',
        styles: { fontSize: 9 },
        headStyles: { fillColor: [44, 62, 80] },
        alternateRowStyles: { fillColor: [240, 240, 240] }
      });

      await saveAndOpenPdf(doc, `Audit_Log_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (err) {
      console.error(err);
      alert("Error generating Audit Log");
    }
    setIsDownloadingAudit(false);
  };

  const handleDownloadReport = async () => {
    if (!window.confirm("Download Full Financial Report?")) return;
    setIsGenerating(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_BASE_URL}/farmers`, { headers: { Authorization: `Bearer ${token}` } });
      const allFarmers = res.data;

      const doc = new jsPDF();
      let totalDues = 0;
      let totalSurplus = 0;
      const duesList = [];
      const surplusList = [];

      doc.setFontSize(18); doc.setTextColor(40);
      doc.text("AgriFinance - Master Report", 105, 20, { align: 'center' });
      doc.setFontSize(10);
      doc.text(`Generated: ${new Date().toLocaleDateString()} | Total Farmers: ${allFarmers.length}`, 105, 28, { align: 'center' });

      let currentY = 40;
      const pageHeight = doc.internal.pageSize.height;

      allFarmers.forEach((farmer, index) => {
        let balance = 0;
        const tableRows = farmer.transactions.map(t => {
          const isMoneyGiven = ['Money Lent', 'Fertilizer', 'Miscellaneous'].includes(t.type);
          const val = parseFloat(t.amount) || 0;
          if (isMoneyGiven) balance += val; else balance -= val;
          return [
            new Date(t.date).toLocaleDateString(),
            t.type,
            t.fertilizer_name ? `${t.fertilizer_name} (x${t.quantity})` : (t.details || '-'),
            isMoneyGiven ? `+${val.toLocaleString('en-IN')}` : '-',
            !isMoneyGiven ? `-${val.toLocaleString('en-IN')}` : '-'
          ];
        });

        if (balance > 0) { duesList.push([farmer.name, `Rs. ${balance.toLocaleString('en-IN')}`]); totalDues += balance; }
        else if (balance < 0) { surplusList.push([farmer.name, `Rs. ${Math.abs(balance).toLocaleString('en-IN')}`]); totalSurplus += Math.abs(balance); }

        if (currentY + 70 > pageHeight) { doc.addPage(); currentY = 20; }

        doc.setFillColor(240, 240, 240);
        doc.rect(14, currentY - 6, 182, 8, 'F');
        doc.setFontSize(12); doc.setTextColor(0); doc.setFont("helvetica", "bold");
        doc.text(`${index + 1}. ${farmer.name} (${farmer.village})`, 16, currentY);

        autoTable(doc, {
          startY: currentY + 4,
          head: [['Date', 'Type', 'Details', 'Given', 'Paid']],
          body: tableRows,
          theme: 'grid',
          styles: { fontSize: 9, cellPadding: 2, halign: 'center', valign: 'middle' },
          headStyles: { fillColor: [60, 60, 60], halign: 'center' },
          columnStyles: {
            0: { cellWidth: 25 }, 1: { cellWidth: 25 }, 2: { halign: 'left' },
            3: { textColor: [200, 0, 0], fontStyle: 'bold', halign: 'center' },
            4: { textColor: [0, 100, 0], fontStyle: 'bold', halign: 'center' }
          },
          showHead: 'everyPage',
          didDrawPage: (data) => { currentY = data.cursor.y; }
        });

        let finalY = doc.lastAutoTable.finalY;
        if (finalY > pageHeight - 20) { doc.addPage(); finalY = 20; }
        currentY = finalY + 8;
        doc.setFontSize(10); doc.setFont("helvetica", "normal");
        doc.text(`Net Balance:`, 120, currentY);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(balance > 0 ? 200 : 0, balance > 0 ? 0 : 128, 0);
        doc.text(`Rs. ${Math.abs(balance).toLocaleString('en-IN')} ${balance > 0 ? '(Due)' : '(Surplus)'}`, 195, currentY, { align: 'right' });
        currentY += 10;
        doc.setDrawColor(200, 200, 200); doc.line(14, currentY - 5, 196, currentY - 5);
      });

      let summaryStartY = currentY + 10;
      if (summaryStartY + 60 > pageHeight) { doc.addPage(); summaryStartY = 20; }
      doc.setFontSize(16); doc.setTextColor(0); doc.setFont("helvetica", "bold");
      doc.text("Financial Summary", 105, summaryStartY, { align: 'center' });
      doc.setFontSize(11); doc.setFont("helvetica", "normal");
      doc.text(`Total Dues: Rs. ${totalDues.toLocaleString('en-IN')}`, 14, summaryStartY + 10);
      doc.text(`Total Surplus: Rs. ${totalSurplus.toLocaleString('en-IN')}`, 110, summaryStartY + 10);

      const tableTopY = summaryStartY + 15;
      autoTable(doc, { startY: tableTopY, head: [['Farmer Name', 'Amount (Due)']], body: duesList, theme: 'grid', styles: { halign: 'center', valign: 'middle' }, headStyles: { fillColor: [200, 0, 0], halign: 'center' }, columnStyles: { 0: { halign: 'left' }, 1: { halign: 'right', fontStyle: 'bold' } }, margin: { right: 110 } });
      autoTable(doc, { startY: tableTopY, head: [['Farmer Name', 'Amount (Surplus)']], body: surplusList, theme: 'grid', styles: { halign: 'center', valign: 'middle' }, headStyles: { fillColor: [0, 128, 0], halign: 'center' }, columnStyles: { 0: { halign: 'left' }, 1: { halign: 'right', fontStyle: 'bold' } }, margin: { left: 110 } });

      await saveAndOpenPdf(doc, `AgriFinance_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (err) {
      console.error(err);
      alert("Error generating PDF");
    }
    setIsGenerating(false);
  };

  const handleRestoreVillage = async (villageId) => {
    if (!window.confirm("Restore this village?")) return;
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_BASE_URL}/villages/${villageId}/restore`, {}, { headers: { Authorization: `Bearer ${token}` } });
      const resAnalysis = await axios.get(`${API_BASE_URL}/analysis`, { headers: { Authorization: `Bearer ${token}` } });
      setData(resAnalysis.data);
      alert("Village restored successfully!");
    } catch (err) {
      console.error(err);
      alert("Error restoring village");
    }
  };

  const handlePermanentDeleteVillage = async (villageId, villageName) => {
    if (!window.confirm(`⚠️ Permanently delete "${villageName}"? This cannot be undone.`)) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_BASE_URL}/villages/${villageId}/permanent`, { headers: { Authorization: `Bearer ${token}` } });
      const resAnalysis = await axios.get(`${API_BASE_URL}/analysis`, { headers: { Authorization: `Bearer ${token}` } });
      setData(resAnalysis.data);
    } catch (err) {
      console.error(err);
      alert("Error permanently deleting village");
    }
  };

  const handleRestoreFarmer = async (farmerId) => {
    if (!window.confirm("Restore this farmer?")) return;
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_BASE_URL}/farmers/${farmerId}/restore`, {}, { headers: { Authorization: `Bearer ${token}` } });
      const resAnalysis = await axios.get(`${API_BASE_URL}/analysis`, { headers: { Authorization: `Bearer ${token}` } });
      setData(resAnalysis.data);
      alert("Farmer restored successfully!");
    } catch (err) {
      console.error(err);
      alert("Error restoring farmer");
    }
  };

  const handlePermanentDeleteFarmer = async (farmerId, farmerName) => {
    if (!window.confirm(`⚠️ Permanently delete farmer "${farmerName}"? This cannot be undone.`)) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_BASE_URL}/farmers/${farmerId}/permanent`, { headers: { Authorization: `Bearer ${token}` } });
      const resAnalysis = await axios.get(`${API_BASE_URL}/analysis`, { headers: { Authorization: `Bearer ${token}` } });
      setData(resAnalysis.data);
    } catch (err) {
      console.error(err);
      alert("Error permanently deleting farmer");
    }
  };

  if (!data) return (
    <div className="loading-container">
      <div className="loading-spinner" />
      <p className="loading-text">Loading Analysis…</p>
    </div>
  );

  const fmt = (num) => "₹" + Number(num || 0).toLocaleString('en-IN');
  const formatDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

  const financeData = (data.finance && data.finance.length > 0)
    ? data.finance.filter(v => !v.deleted)
    : (data.villageData && data.villageData.length > 0)
      ? data.villageData.filter(v => !v.deleted).map(village => ({
          _id: village._id,
          name: village.name,
          deleted: village.deleted || false,
          totalCash: village.villagers ? village.villagers.reduce((sum, p) => sum + (p.totalCash || 0), 0) : (village.investment || 0),
          villagers: village.villagers || []
        }))
      : [];

  const villageRows = (() => {
    if (data.villageData && data.villageData.length > 0) {
      return data.villageData.filter(v => !v.deleted);
    }
    if (data.villageStats && Object.keys(data.villageStats).length > 0) {
      return Object.entries(data.villageStats).map(([name, amount]) => ({
        _id: name, name, investment: amount, villagers: []
      }));
    }
    return [];
  })();

  return (
    <div className="analysis-container">

      {/* ── Sticky Top Section ── */}
      <div className="sticky-summary" style={{ paddingLeft: '16px', paddingRight: '16px' }}>
        <div className="analysis-header" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <div style={{ flex: 1 }}>
            <button onClick={() => navigate('/')} className="back-home-btn">
              ← Back
            </button>
          </div>
          <h2 style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', margin: 0, fontSize: '24px', fontWeight: 900, color: '#0f172a' }}>Analysis</h2>
          <div style={{ flex: 1 }} />
        </div>

        <div className="summary-grid">
          <div className="summary-card card-blue">
            <div className="card-label card-label-blue">TOTAL FARMERS</div>
            <div className="card-value card-value-blue">{data.totalFarmers}</div>
          </div>
          <div className="summary-card card-red">
            <div className="card-label card-label-red">TOTAL LOANS</div>
            <div className="card-value card-value-red">{fmt(data.totalInvestment)}</div>
          </div>
        </div>

        <button
          onClick={handleDownloadReport}
          disabled={isGenerating}
          className={`master-report-btn ${isGenerating ? 'btn-disabled' : 'btn-active'}`}
        >
          {isGenerating ? "⏳ Generating Report…" : "📄 Download Full Financial Report"}
        </button>
      </div>

      <div style={{ padding: '18px 16px 80px', flex: 1 }}>

        {/* ── Inventory ── */}
        <div className="data-card">
          <div className="card-header" style={{ border: 'none', marginBottom: 4 }}>
            <h3>Inventory</h3>
          </div>
          <hr className="section-divider" />
          <table className="data-table">
            <thead>
              <tr className="table-head-row">
                <th>Item</th>
                <th style={{ textAlign: 'center' }}>Qty</th>
                <th style={{ textAlign: 'right' }}>Cost</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(data.fertStats).map(([name, stat]) => (
                <tr key={name}>
                  <td className="inventory-item" style={{ padding: '10px 0' }}>{name}</td>
                  <td style={{ padding: '10px 0', textAlign: 'center' }}>
                    <span className="qty-badge">{stat.count}</span>
                  </td>
                  <td className="table-row-value val-green" style={{ padding: '10px 0' }}>
                    {fmt(stat.cost)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── Archived Villages ── */}
        <div className="data-card">
          <div className="card-header" style={{ border: 'none', marginBottom: 4 }}>
            <h3>Archived Villages</h3>
          </div>
          <hr className="section-divider" />
          <div className="archived-list">
            {data.deletedVillages && data.deletedVillages.length > 0
              ? data.deletedVillages.map(village => (
                  <div key={village._id} className="archived-village-card">
                    <span className="archived-village-name">{village.name}</span>
                    <div className="archived-actions">
                      <button onClick={() => handleRestoreVillage(village._id)} className="restore-btn">↩ Restore</button>
                      <button onClick={() => handlePermanentDeleteVillage(village._id, village.name)} className="perm-delete-btn">🗑 Delete</button>
                    </div>
                  </div>
                ))
              : <p className="empty-state">No archived villages.</p>}
          </div>
        </div>

        {/* ── Archived Farmers ── */}
        <div className="data-card">
          <div className="card-header" style={{ border: 'none', marginBottom: 4 }}>
            <h3>Archived Farmers</h3>
          </div>
          <hr className="section-divider" />
          <div className="archived-list">
            {data.deletedFarmers && data.deletedFarmers.length > 0
              ? data.deletedFarmers.map(farmer => (
                  <div key={farmer._id} className="archived-village-card">
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span className="archived-village-name">{farmer.name}</span>
                      <span style={{ fontSize: '11px', color: '#78716c' }}>Village: {farmer.village}</span>
                    </div>
                    <div className="archived-actions">
                      <button onClick={() => handleRestoreFarmer(farmer._id)} className="restore-btn">↩ Restore</button>
                      <button onClick={() => handlePermanentDeleteFarmer(farmer._id, farmer.name)} className="perm-delete-btn">🗑 Delete</button>
                    </div>
                  </div>
                ))
              : <p className="empty-state">No archived farmers.</p>}
          </div>
        </div>

        {/* ── Last 3 Days / Audit ── */}
        <div className="data-card">
          <div className="card-header">
            <h3>Last 3 Days</h3>
            <button
              onClick={handleDownloadAuditLog}
              disabled={isDownloadingAudit}
              className="audit-btn"
            >
              {isDownloadingAudit ? "Downloading…" : "📋 Audit Log"}
            </button>
          </div>
          <div className="activity-list">
            {recentActivity.length === 0 ? (
              <p className="empty-state">No recent activity in the last 3 days.</p>
            ) : (
              recentActivity.map((act, idx) => (
                <div key={idx} className="activity-item">
                  <div>
                    <div className="farmer-name">{act.farmerName}</div>
                    <div className="activity-details">
                      {formatDate(act.date)} &nbsp;·&nbsp;
                      {act.type === 'Fertilizer' ? act.fertilizer_name : act.type}
                    </div>
                  </div>
                  <div
                    className="activity-amount"
                    style={{ color: act.type === 'Yield' || act.type === 'Repayment' ? '#10b981' : '#f43f5e' }}
                  >
                    {act.type === 'Yield' || act.type === 'Repayment' ? '+' : '−'} {fmt(act.amount)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Analysis;