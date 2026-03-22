import { useState, useEffect } from 'react';
import {
  FileWarning, Download, Calendar, TrendingUp,
  Users, Briefcase, Filter, Activity, LogIn, LogOut,
  Search, ShieldAlert, Sparkles, Loader2, RefreshCw, FileText, X, Settings
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { auth } from '../../firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import tugmaLogo from '../../assets/tugma_logo_white.png';

// 🔥 SUPERADMIN EMAILS 🔥
const SUPERADMIN_EMAIL = "buday.313258@caloocan.sti.edu.ph";
const SUPERADMIN_EMAIL_ALT = "buday.3132578@caloocan.sti.edu.ph";

interface AuditLog {
  id: string;
  uid: string;
  user_name: string;
  role: string;
  action: string;
  details: string;
  timestamp: string;
}

export default function AdminReports() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Current Admin States
  const [adminName, setAdminName] = useState('Admin User');
  const [adminEmail, setAdminEmail] = useState('');

  // Filtering States
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // 🔥 PDF Configuration Modal States 🔥
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [pdfOrientation, setPdfOrientation] = useState<'portrait' | 'landscape'>('landscape');
  const [pdfSize, setPdfSize] = useState<'a4' | 'letter' | 'legal'>('a4'); // letter = short, legal = long
  const [pdfLogo, setPdfLogo] = useState(true);
  const [pdfHeaderMode, setPdfHeaderMode] = useState<'all' | 'first'>('all');
  const [pdfPageNumbers, setPdfPageNumbers] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    fetchLogs();

    // Authenticate and grab the current admin's details for the PDF
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setAdminEmail(user.email || '');
        try {
          const res = await fetch(`http://localhost:8080/api/users/profile/${user.uid}`);
          if (res.ok) {
            const data = await res.json();
            const fName = data.firstName || data.first_name || '';
            const lName = data.lastName || data.last_name || '';
            const fullName = `${fName} ${lName}`.trim();
            if (fullName) setAdminName(fullName);
          }
        } catch (error) {
          console.error("Failed to fetch admin profile", error);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('http://localhost:8080/api/admin/audit-logs');
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (error) {
      console.error("Failed to fetch logs", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (dateString: string) => {
    const d = new Date(dateString);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const getActionIcon = (action: string) => {
    const a = action.toLowerCase();
    if (a.includes('login') || a.includes('signed in')) return <LogIn size={16} className="text-emerald-500" />;
    if (a.includes('logout') || a.includes('signed out')) return <LogOut size={16} className="text-zinc-500" />;
    if (a.includes('scan') || a.includes('ai')) return <Sparkles size={16} className="text-purple-500" />;
    if (a.includes('create') || a.includes('register')) return <Users size={16} className="text-blue-500" />;
    if (a.includes('delete') || a.includes('ban')) return <ShieldAlert size={16} className="text-red-500" />;
    return <Activity size={16} className="text-amber-500" />;
  };

  // Advanced Filter Logic
  const filteredLogs = logs.filter(log => {
    const matchesSearch =
      log.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.details.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = filterRole === 'All' || log.role === filterRole;

    let matchesDate = true;
    if (startDate || endDate) {
      const logDate = new Date(log.timestamp);
      if (startDate) {
        const sDate = new Date(startDate);
        sDate.setHours(0, 0, 0, 0);
        if (logDate < sDate) matchesDate = false;
      }
      if (endDate) {
        const eDate = new Date(endDate);
        eDate.setHours(23, 59, 59, 999);
        if (logDate > eDate) matchesDate = false;
      }
    }

    return matchesSearch && matchesRole && matchesDate;
  });

  const exportToCSV = () => {
    if (filteredLogs.length === 0) return;
    const headers = ['Log ID', 'Timestamp', 'User', 'Role', 'Action', 'Details'];
    const csvRows = filteredLogs.map(l =>
      `"${l.id}","${l.timestamp}","${l.user_name}","${l.role}","${l.action}","${l.details}"`
    );
    const csvContent = [headers.join(','), ...csvRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `tugma_audit_log_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 🔥 CUSTOMIZABLE PDF EXPORT 🔥
  const handleGeneratePDF = async () => {
    setIsExporting(true);

    try {
      const doc = new jsPDF(pdfOrientation, 'mm', pdfSize);
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      let imgData: HTMLImageElement | null = null;

      // Only load image if requested
      if (pdfLogo) {
        imgData = new Image();
        imgData.src = tugmaLogo;
        await new Promise((resolve) => {
          imgData!.onload = resolve;
          imgData!.onerror = resolve; // Resolve anyway to prevent infinite loading
        });
      }

      const tableColumn = ["Log ID", "Time", "User", "Role", "Action", "Details"];
      const tableRows = filteredLogs.map(log => [
        log.id,
        formatTime(log.timestamp),
        log.user_name,
        log.role,
        log.action,
        log.details
      ]);

      // Calculate where the table should start
      const startYPosition = 55;

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: startYPosition,
        margin: { top: pdfHeaderMode === 'all' ? 55 : 15, bottom: 20, left: 14, right: 14 },
        styles: { fontSize: 8, cellPadding: 3 },
        headStyles: { fillColor: [220, 38, 38], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        didDrawPage: (data) => {

          // --- HEADER LOGIC ---
          if (pdfHeaderMode === 'all' || data.pageNumber === 1) {

            // Background Header
            doc.setFillColor(15, 9, 30); // Very dark purple
            doc.rect(0, 0, pageWidth, 35, 'F');

            // Logo
            let textStartX = 14;
            if (pdfLogo && imgData) {
              try { doc.addImage(imgData, 'PNG', 14, 5, 28, 24); } catch (e) { }
              textStartX = 48; // Push text to the right of the logo
            }

            // Title
            doc.setFontSize(22);
            doc.setTextColor(255, 255, 255);
            doc.setFont('helvetica', 'bold');
            doc.text("SYSTEM AUDIT TRAIL", textStartX, 16);

            // 🔥 SUPER ADMIN LOGIC 🔥
            const isSuperAdmin = adminEmail === SUPERADMIN_EMAIL || adminEmail === SUPERADMIN_EMAIL_ALT;
            const roleTag = isSuperAdmin ? 'SUPER ADMIN' : 'ADMIN';

            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(180, 180, 180);
            doc.text(`Generated by: ${adminName} (${roleTag})`, textStartX, 24);

            doc.text(`Report Date: ${new Date().toLocaleString()}`, pageWidth - 14, 24, { align: 'right' });

            // Active Filters Details (Printed right below the dark block)
            let filterText = `Active Filters: Role -> ${filterRole}`;
            if (searchQuery) filterText += ` | Search -> "${searchQuery}"`;
            if (startDate || endDate) filterText += ` | Dates -> ${startDate || 'Any'} to ${endDate || 'Any'}`;

            doc.setFontSize(9);
            doc.setTextColor(100, 100, 100);
            doc.text(filterText, 14, 45);
          }

          // --- PAGE NUMBERS LOGIC ---
          if (pdfPageNumbers) {
            doc.setFontSize(9);
            doc.setTextColor(120, 120, 120);
            doc.text(
              `Page ${data.pageNumber}`,
              pageWidth / 2,
              pageHeight - 8,
              { align: 'center' }
            );
          }
        },
      });

      doc.save(`tugma_audit_log_${new Date().toISOString().split('T')[0]}.pdf`);
      setShowPdfModal(false);
    } catch (error) {
      console.error("PDF Generation Error", error);
      alert("Failed to generate PDF. Check console for details.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 fade-in pb-10">

      {/* --- PDF SETTINGS MODAL --- */}
      {showPdfModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-zinc-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 w-full max-w-md rounded-3xl p-6 sm:p-8 shadow-2xl relative animate-in zoom-in-95 duration-200">
            <button onClick={() => setShowPdfModal(false)} className="absolute top-6 right-6 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">
              <X size={20} />
            </button>

            <div className="mb-6">
              <h3 className="text-xl font-black text-zinc-900 dark:text-white flex items-center gap-2">
                <Settings className="text-red-600" /> Export PDF Options
              </h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                Customize how your audit log report will look.
              </p>
            </div>

            <div className="space-y-5">

              {/* Orientation & Size */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Orientation</label>
                  <select
                    value={pdfOrientation}
                    onChange={(e) => setPdfOrientation(e.target.value as 'portrait' | 'landscape')}
                    className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700 outline-none text-sm dark:text-white"
                  >
                    <option value="landscape">Landscape</option>
                    <option value="portrait">Portrait</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Paper Size</label>
                  <select
                    value={pdfSize}
                    onChange={(e) => setPdfSize(e.target.value as 'a4' | 'letter' | 'legal')}
                    className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700 outline-none text-sm dark:text-white"
                  >
                    <option value="a4">A4 Standard</option>
                    <option value="letter">Short (Letter)</option>
                    <option value="legal">Long (Legal)</option>
                  </select>
                </div>
              </div>

              {/* Header Mode */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Header Display</label>
                <select
                  value={pdfHeaderMode}
                  onChange={(e) => setPdfHeaderMode(e.target.value as 'all' | 'first')}
                  className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700 outline-none text-sm dark:text-white"
                >
                  <option value="all">Repeat Header on Every Page</option>
                  <option value="first">Show Header on First Page Only</option>
                </select>
              </div>

              {/* Toggles */}
              <div className="flex flex-col gap-3 pt-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={pdfLogo} onChange={(e) => setPdfLogo(e.target.checked)} className="w-4 h-4 accent-red-600 rounded cursor-pointer" />
                  <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Include Tugma Logo</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={pdfPageNumbers} onChange={(e) => setPdfPageNumbers(e.target.checked)} className="w-4 h-4 accent-red-600 rounded cursor-pointer" />
                  <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Show Page Numbers</span>
                </label>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  onClick={() => setShowPdfModal(false)}
                  className="flex-1 py-3 rounded-xl font-bold text-zinc-600 dark:text-zinc-300 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleGeneratePDF}
                  disabled={isExporting}
                  className="flex-1 py-3 rounded-xl font-bold text-white bg-red-600 hover:bg-red-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-red-500/20"
                >
                  {isExporting ? <Loader2 size={18} className="animate-spin" /> : <FileText size={18} />}
                  Generate
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-zinc-900 dark:text-white flex items-center gap-3">
            <Activity className="text-red-600" /> System Audit Trail
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Live tracking of all user movements and system events.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchLogs} className="p-2.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 rounded-xl transition-colors">
            <RefreshCw size={18} className={isLoading ? "animate-spin" : ""} />
          </button>

          <button onClick={exportToCSV} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-900 dark:text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-sm transition-all flex items-center gap-2 active:scale-95">
            <Download size={16} /> CSV
          </button>

          <button
            onClick={() => {
              if (filteredLogs.length === 0) {
                alert("No logs match the current filters.");
                return;
              }
              setShowPdfModal(true);
            }}
            className="bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-red-500/20 transition-all flex items-center gap-2 active:scale-95"
          >
            <FileText size={16} /> Export PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Quick Insights (Left Column) */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-50 dark:bg-blue-500/10 rounded-lg text-blue-600 dark:text-blue-400"><Activity size={20} /></div>
              <h3 className="font-bold text-zinc-900 dark:text-white">Total Events</h3>
            </div>
            <p className="text-3xl font-black text-zinc-900 dark:text-white mb-1">{filteredLogs.length}</p>
            <p className="text-sm font-bold text-emerald-600 flex items-center gap-1"><TrendingUp size={14} /> Matching filters</p>
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-4">Filter Logs</h3>
            <div className="space-y-4">

              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search user, action, details..."
                  className="w-full pl-9 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-red-500/20 outline-none transition-all dark:text-white text-sm"
                />
              </div>

              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-700 outline-none text-sm dark:text-white font-medium cursor-pointer"
              >
                <option value="All">All Roles</option>
                <option value="Student">Students</option>
                <option value="Employer">Employers</option>
                <option value="Admin">Admins</option>
                <option value="System">System Actions</option>
              </select>

              {/* Time Range Filters */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1 block">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-zinc-200 dark:border-zinc-700 outline-none text-xs dark:text-white dark:[color-scheme:dark]"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1 block">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-zinc-200 dark:border-zinc-700 outline-none text-xs dark:text-white dark:[color-scheme:dark]"
                  />
                </div>
              </div>
              {(startDate || endDate) && (
                <button
                  onClick={() => { setStartDate(''); setEndDate(''); }}
                  className="w-full text-xs font-bold text-red-500 hover:underline"
                >
                  Clear Dates
                </button>
              )}

            </div>
          </div>
        </div>

        {/* Live Audit Stream */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-sm flex flex-col overflow-hidden">
          <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Live Activity Stream</h3>
            <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 rounded-md">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div> Live
            </span>
          </div>

          <div className="flex-1 overflow-y-auto max-h-[650px] custom-scrollbar p-2">
            {isLoading ? (
              <div className="flex justify-center py-20"><Loader2 className="animate-spin text-red-600" size={32} /></div>
            ) : filteredLogs.length === 0 ? (
              <div className="text-center py-16 text-zinc-500 font-medium">No activity logs found.</div>
            ) : (
              <div className="space-y-1 relative before:absolute before:inset-0 before:ml-7 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-zinc-200 dark:before:via-zinc-800 before:to-transparent">
                {filteredLogs.map((log) => (
                  <div key={log.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active px-4 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 rounded-xl transition-colors">

                    <div className="flex items-center justify-center w-8 h-8 rounded-full border-2 border-white dark:border-zinc-900 bg-zinc-100 dark:bg-zinc-800 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                      {getActionIcon(log.action)}
                    </div>

                    <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2rem)] p-4 rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-sm">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">{log.id}</span>
                        <span className="text-[10px] font-bold text-zinc-500">{formatTime(log.timestamp)}</span>
                      </div>
                      <h4 className="text-sm font-bold text-zinc-900 dark:text-white mb-0.5">{log.action}</h4>
                      <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed mb-2">{log.details}</p>

                      <div className="flex items-center gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                        <div className="w-5 h-5 rounded-md bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-[9px] font-black text-zinc-600 dark:text-zinc-300">
                          {log.user_name.charAt(0)}
                        </div>
                        <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 truncate max-w-[120px]">{log.user_name}</span>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 rounded uppercase">{log.role}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}