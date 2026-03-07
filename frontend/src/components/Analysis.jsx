import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { API_BASE_URL } from '../config'; 

// 🔌 Capacitor Plugins for Mobile Features
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

  // --- 🛠️ HELPER: UNIVERSAL SAVE & SHARE (The Mobile Fix) ---
  const saveAndOpenPdf = async (doc, fileName) => {
    try {
      if (Capacitor.isNativePlatform()) {
        // APK Logic: Convert to Base64 and Save to device storage
        const pdfBase64 = doc.output('datauristring').split(',')[1];
        const savedFile = await Filesystem.writeFile({
          path: fileName,
          data: pdfBase64,
          directory: Directory.Documents,
          recursive: true
        });
        // Open the native Android Share Menu
        await Share.share({
          title: 'AgriFinance Report',
          url: savedFile.uri,
        });
      } else {
        // Browser Logic: Standard Web Download
        doc.save(fileName);
      }
    } catch (error) {
      console.error('File Error:', error);
      alert('Could not save report to device.');
    }
  };

  // --- 🖨️ PDF: AUDIT LOG (ALL TIME) ---
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

      const fileName = `Audit_Log_${new Date().toISOString().split('T')[0]}.pdf`;
      await saveAndOpenPdf(doc, fileName);

    } catch (err) { console.error(err); alert("Error generating Audit Log"); }
    setIsDownloadingAudit(false);
  };

  // --- 🖨️ PDF: MASTER REPORT ---
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

      // Summary Page
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

      const fileName = `AgriFinance_Report_${new Date().toISOString().split('T')[0]}.pdf`;
      await saveAndOpenPdf(doc, fileName);

    } catch (err) { console.error(err); alert("Error generating PDF"); }
    setIsGenerating(false);
  };

  if (!data) return <div style={{ textAlign:"center", padding:"40px" }}>Loading Analysis...</div>;
  const fmt = (num) => "₹" + Number(num || 0).toLocaleString('en-IN');
  const formatDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

  // --- 🎨 STYLES ---
  const safeAreaStyle = {
    paddingTop: Capacitor.isNativePlatform() ? 'env(safe-area-inset-top, 40px)' : '20px',
    width: "100%",
    maxWidth: "500px",
    margin: "0 auto",
    paddingLeft: "20px",
    paddingRight: "20px",
    paddingBottom: "40px",
    boxSizing: "border-box",
    minHeight: "100vh",
    backgroundColor: "#f8f9fa"
  };

  return (
    <div style={safeAreaStyle}>
      
      {/* 🔝 Professional Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px", marginTop: "10px" }}>
        <button 
          onClick={() => navigate('/')} 
          style={{ 
            border: "1px solid #ddd", background: "white", padding: "10px 16px", borderRadius: "12px", 
            fontWeight: "600", fontSize: "14px", display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" 
          }}
        >
          <span>←</span> Home
        </button>
        <span style={{ fontSize: "12px", fontWeight: "bold", color: "#888", letterSpacing: "1px" }}>AGRIFINANCE</span>
      </div>

      <h1 style={{ margin: "0 0 24px 0", color: "#1a1a1a", textAlign: "left", fontSize: "28px", fontWeight: "800" }}>📊 Analysis</h1>

      {/* 💳 Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", marginBottom: "30px" }}>
        <div style={{ background: "#E3F2FD", padding: "20px", borderRadius: "16px", textAlign: "left" }}>
            <div style={{ fontSize: "11px", color: "#1565C0", fontWeight: "bold", letterSpacing: "0.5px" }}>TOTAL FARMERS</div>
            <div style={{ fontSize: "28px", fontWeight: "900", color: "#1565C0" }}>{data.totalFarmers}</div>
        </div>
        <div style={{ background: "#FFEBEE", padding: "20px", borderRadius: "16px", textAlign: "left" }}>
            <div style={{ fontSize: "11px", color: "#C62828", fontWeight: "bold", letterSpacing: "0.5px" }}>TOTAL INVESTED</div>
            <div style={{ fontSize: "22px", fontWeight: "900", color: "#C62828" }}>{fmt(data.totalInvestment)}</div>
        </div>
      </div>

      {/* 🕒 Recent Activity Card */}
      <div style={{ background: "white", padding: "20px", borderRadius: "20px", marginBottom: "20px", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #eee", paddingBottom: "12px", marginBottom: "12px" }}>
            <h3 style={{ margin: 0, fontSize: "16px" }}>🕒 Last 3 Days</h3>
            <button 
                onClick={handleDownloadAuditLog} 
                disabled={isDownloadingAudit}
                style={{ background: "#1a1a1a", color: "white", border: "none", padding: "8px 14px", borderRadius: "10px", fontSize: "12px", cursor: "pointer", fontWeight: "600" }}
            >
                {isDownloadingAudit ? "⏳" : "📥 Audit Log"}
            </button>
        </div>
        
        <div style={{ maxHeight: "250px", overflowY: "auto" }}>
            {recentActivity.length === 0 && (
                <p style={{ textAlign: "center", color: "#999", padding: "20px", fontSize: "13px" }}>No recent activity.</p>
            )}
            {recentActivity.map((act, idx) => (
                <div key={idx} style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid #f8f8f8" }}>
                    <div>
                        <div style={{ fontWeight: "700", color: "#333", fontSize: "14px" }}>{act.farmerName}</div>
                        <div style={{ fontSize: "12px", color: "#777" }}>{formatDate(act.date)} • {act.type === 'Fertilizer' ? act.fertilizer_name : act.type}</div>
                    </div>
                    <div style={{ fontWeight: "700", color: act.type === 'Yield' || act.type === 'Repayment' ? '#2e7d32' : '#c62828' }}>
                        {act.type === 'Yield' || act.type === 'Repayment' ? '+' : '-'} {fmt(act.amount)}
                    </div>
                </div>
            ))}
        </div>
      </div>

      {/* 🏡 Village Stats Card */}
      <div style={{ background: "white", padding: "20px", borderRadius: "20px", marginBottom: "20px", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
        <h3 style={{ margin: "0 0 15px 0", borderBottom: "1px solid #eee", paddingBottom: "10px", fontSize: "16px" }}>🏡 Village Data</h3>
        <table style={{ width: "100%" }}>
            <tbody>
                {Object.entries(data.villageStats).map(([village, amount]) => (
                    <tr key={village}>
                        <td style={{ padding: "10px 0", fontWeight: "600", color: "#555", fontSize: "14px" }}>{village}</td>
                        <td style={{ padding: "10px 0", textAlign: "right", fontWeight: "700", color: "#C62828" }}>{fmt(amount)}</td>
                    </tr>
                ))}
            </tbody>
        </table>
      </div>

      {/* 🌱 Fertilizer Stats Card */}
      <div style={{ background: "white", padding: "20px", borderRadius: "20px", boxShadow: "0 4px 12px rgba(0,0,0,0.05)", marginBottom: "30px" }}>
        <h3 style={{ margin: "0 0 15px 0", borderBottom: "1px solid #eee", paddingBottom: "10px", fontSize: "16px" }}>🌱 Inventory</h3>
        <table style={{ width: "100%" }}>
            <thead>
                <tr style={{fontSize:"11px", color:"#aaa", textAlign: "left"}}>
                    <th style={{paddingBottom:"10px"}}>ITEM</th>
                    <th style={{paddingBottom:"10px", textAlign:"center"}}>QTY</th>
                    <th style={{paddingBottom:"10px", textAlign:"right"}}>COST</th>
                </tr>
            </thead>
            <tbody>
                {Object.entries(data.fertStats).map(([name, stat]) => (
                    <tr key={name} style={{ fontSize:"14px" }}>
                        <td style={{ padding: "10px 0", fontWeight: "700", color: "#333" }}>{name}</td>
                        <td style={{ padding: "10px 0", textAlign: "center", color: "#666" }}>{stat.count}</td>
                        <td style={{ padding: "10px 0", textAlign: "right", fontWeight: "700", color: "#2E7D32" }}>{fmt(stat.cost)}</td>
                    </tr>
                ))}
            </tbody>
        </table>
      </div>

      <button 
          onClick={handleDownloadReport} 
          disabled={isGenerating}
          style={{ 
            width: "100%", padding: "20px", backgroundColor: isGenerating ? "#ccc" : "#2196F3", 
            color: "white", border: "none", borderRadius: "18px", fontWeight: "800", fontSize: "16px",
            boxShadow: "0 6px 20px rgba(33, 150, 243, 0.3)", transition: "all 0.2s"
          }}
      >
          {isGenerating ? "⏳ Generating Report..." : "📄 Master Financial Report"}
      </button>

    </div>
  );
};

export default Analysis;