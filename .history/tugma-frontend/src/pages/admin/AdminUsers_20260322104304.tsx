import { useState, useEffect } from 'react';
import {
  Users, Search, ShieldAlert, CheckCircle2,
  Ban, Mail, Shield, Loader2, Download, Trash2, Unlock, Plus, X, FileText, Settings
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { auth } from '../../firebaseConfig';
import { createUserWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';
import tugmaLogo from '../../assets/tugma_logo_white.png'; // Ensure this path is correct

// 🔥 SUPERADMIN EMAILS (Protected from Deletion/Banning)
const SUPERADMIN_EMAIL = "buday.313258@caloocan.sti.edu.ph";
const SUPERADMIN_EMAIL_ALT = "buday.3132578@caloocan.sti.edu.ph";

interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  joined: string;
  avatar: string;
}

export default function AdminUsers() {
  const [activeTab, setActiveTab] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<UserData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Current Admin Details (For the PDF Report)
  const [currentUserUid, setCurrentUserUid] = useState<string | null>(null);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [currentUserName, setCurrentUserName] = useState('Admin User');

  // Admin Creation Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newAdmin, setNewAdmin] = useState({ email: '', password: '', name: '' });
  const [isCreating, setIsCreating] = useState(false);

  // 🔥 PDF Configuration Modal States 🔥
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [pdfOrientation, setPdfOrientation] = useState<'portrait' | 'landscape'>('landscape');
  const [pdfSize, setPdfSize] = useState<'a4' | 'letter' | 'legal'>('a4');
  const [pdfLogo, setPdfLogo] = useState(true);
  const [pdfHeaderMode, setPdfHeaderMode] = useState<'all' | 'first'>('all');
  const [pdfPageNumbers, setPdfPageNumbers] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUserUid(user.uid);
        setCurrentUserEmail(user.email);
        try {
          const res = await fetch(`http://localhost:8080/api/users/profile/${user.uid}`);
          if (res.ok) {
            const data = await res.json();
            const fName = data.firstName || data.first_name || '';
            const lName = data.lastName || data.last_name || '';
            const fullName = `${fName} ${lName}`.trim();
            if (fullName) setCurrentUserName(fullName);
          }
        } catch (error) {
          console.error("Failed to fetch admin profile", error);
        }
      }
    });

    fetchUsers();
    return () => unsubscribe();
  }, []);

  // 🔥 SILENT AUDIT LOGGER 🔥
  const logSystemEvent = (action: string, details: string) => {
    if (!currentUserUid) return;
    fetch('http://localhost:8080/api/audit/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid: currentUserUid, action, details })
    }).catch(err => console.error("Audit log failed (silent):", err));
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/admin/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // 🔥 CREATE NEW ADMIN FUNCTION
  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdmin.email || !newAdmin.password || !newAdmin.name) return;

    if (currentUserEmail !== SUPERADMIN_EMAIL && currentUserEmail !== SUPERADMIN_EMAIL_ALT) {
      alert("Permission Denied: Only the Superadmin can create new Admin accounts.");
      return;
    }

    setIsCreating(true);

    try {
      // 1. Create the user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, newAdmin.email, newAdmin.password);
      const firebaseUid = userCredential.user.uid;

      // 2. Save them to the MySQL database via your existing register endpoint
      const res = await fetch('http://localhost:8080/api/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firebase_uid: firebaseUid,
          email: newAdmin.email,
          role: 'admin', // Force role to admin
          first_name: newAdmin.name.split(' ')[0],
          last_name: newAdmin.name.split(' ').slice(1).join(' ') || 'Admin'
        })
      });

      if (!res.ok) throw new Error("Failed to save admin to database");

      // 🔥 LOG THE SECURITY EVENT 🔥
      logSystemEvent('Created Admin Account', `Superadmin created a new Admin account for: ${newAdmin.email}`);

      alert("Success! New Admin created.");
      setIsModalOpen(false);
      setNewAdmin({ email: '', password: '', name: '' });
      fetchUsers(); // Refresh the list

    } catch (error: any) {
      console.error(error);
      alert(`Error creating admin: ${error.message}`);
    } finally {
      setIsCreating(false);
    }
  };

  const handleToggleStatus = async (uid: string, currentStatus: string) => {
    const newStatus = currentStatus.toLowerCase() === 'banned' ? 'Active' : 'Banned';
    if (!confirm(`Are you sure you want to ${newStatus === 'Banned' ? 'BAN' : 'UNBAN'} this user?`)) return;

    const targetUser = users.find(u => u.id === uid);
    setUsers(prev => prev.map(u => u.id === uid ? { ...u, status: newStatus } : u));

    try {
      const res = await fetch(`http://localhost:8080/api/admin/users/${uid}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) throw new Error("Failed to update status on server");

      // 🔥 LOG THE SECURITY EVENT 🔥
      const actionName = newStatus === 'Banned' ? 'Banned User' : 'Unbanned User';
      logSystemEvent(actionName, `Changed status to ${newStatus} for user: ${targetUser?.email || uid}`);

    } catch (error) {
      alert("Network Error: Could not update user status.");
      setUsers(prev => prev.map(u => u.id === uid ? { ...u, status: currentStatus } : u));
    }
  };

  const handleDeleteUser = async (uid: string) => {
    if (!confirm("CRITICAL WARNING: Are you sure you want to PERMANENTLY DELETE this user?")) return;

    const targetUser = users.find(u => u.id === uid);
    const previousUsers = [...users];
    setUsers(prev => prev.filter(u => u.id !== uid));

    try {
      const res = await fetch(`http://localhost:8080/api/admin/users/${uid}`, { method: 'DELETE' });
      if (!res.ok) throw new Error("Failed to delete user");

      // 🔥 LOG THE SECURITY EVENT 🔥
      logSystemEvent('Deleted User', `Permanently deleted user account: ${targetUser?.email || uid}`);

    } catch (error) {
      alert("Network Error: Could not delete user.");
      setUsers(previousUsers);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesTab =
      activeTab === 'All' ? true :
        activeTab === 'Banned' ? user.status.toLowerCase() === 'banned' :
          activeTab === 'Students' ? user.role.toLowerCase() === 'student' :
            activeTab === 'Employers' ? user.role.toLowerCase() === 'employer' :
              activeTab === 'Admins' ? user.role.toLowerCase() === 'admin' : true;

    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      user.name.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower) ||
      user.id.toLowerCase().includes(searchLower);

    return matchesTab && matchesSearch;
  });

  const exportToCSV = () => {
    if (filteredUsers.length === 0) return;
    const headers = ['User ID', 'Name', 'Email', 'Role', 'Status', 'Joined Date'];
    const csvRows = filteredUsers.map(user => `"${user.id}","${user.name}","${user.email}","${user.role}","${user.status}","${user.joined}"`);
    const csvContent = [headers.join(','), ...csvRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `tugma_users_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    logSystemEvent('Exported User Database', `Exported ${filteredUsers.length} users to CSV. Filter: ${activeTab}`);
  };

  const handleGeneratePDF = async () => {
    setIsExporting(true);

    try {
      const doc = new jsPDF(pdfOrientation, 'mm', pdfSize);
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      let imgData: HTMLImageElement | null = null;

      if (pdfLogo) {
        imgData = new Image();
        imgData.src = tugmaLogo;
        await new Promise((resolve) => {
          imgData!.onload = resolve;
          imgData!.onerror = resolve;
        });
      }

      const tableColumn = ["User ID", "Name", "Email", "Role", "Status", "Joined"];
      const tableRows = filteredUsers.map(user => [
        user.id,
        user.name,
        user.email,
        user.role.toUpperCase(),
        user.status,
        user.joined
      ]);

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

          if (pdfHeaderMode === 'all' || data.pageNumber === 1) {
            doc.setFillColor(15, 9, 30); 
            doc.rect(0, 0, pageWidth, 35, 'F');

            let textStartX = 14;
            if (pdfLogo && imgData) {
              try { doc.addImage(imgData, 'PNG', 14, 5, 28, 24); } catch (e) { }
              textStartX = 48;
            }

            doc.setFontSize(22);
            doc.setTextColor(255, 255, 255);
            doc.setFont('helvetica', 'bold');
            doc.text("PLATFORM USER REGISTRY", textStartX, 16);

            const isSuperAdmin = currentUserEmail === SUPERADMIN_EMAIL || currentUserEmail === SUPERADMIN_EMAIL_ALT;
            const roleTag = isSuperAdmin ? 'SUPER ADMIN' : 'ADMIN';

            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(180, 180, 180);
            doc.text(`Generated by: ${currentUserName} (${roleTag})`, textStartX, 24);
            doc.text(`Report Date: ${new Date().toLocaleString()}`, pageWidth - 14, 24, { align: 'right' });

            let filterText = `Active Filters: Role -> ${activeTab}`;
            if (searchTerm) filterText += ` | Search -> "${searchTerm}"`;

            doc.setFontSize(9);
            doc.setTextColor(100, 100, 100);
            doc.text(filterText, 14, 45);
          }

          if (pdfPageNumbers) {
            doc.setFontSize(9);
            doc.setTextColor(120, 120, 120);
            doc.text(`Page ${data.pageNumber}`, pageWidth / 2, pageHeight - 8, { align: 'center' });
          }
        },
      });

      doc.save(`tugma_users_report_${new Date().toISOString().split('T')[0]}.pdf`);
      setShowPdfModal(false);

      logSystemEvent('Generated User Report', `Exported ${filteredUsers.length} users to PDF. Filter: ${activeTab}`);

    } catch (error) {
      console.error("PDF Generation Error", error);
      alert("Failed to generate PDF. Check console for details.");
    } finally {
      setIsExporting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return <span className="flex items-center gap-1 w-fit px-2 py-1 bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 rounded-lg text-[10px] font-bold uppercase tracking-wider"><CheckCircle2 size={12} /> Active</span>;
      case 'banned': return <span className="flex items-center gap-1 w-fit px-2 py-1 bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400 rounded-lg text-[10px] font-bold uppercase tracking-wider"><Ban size={12} /> Banned</span>;
      default: return <span className="flex items-center gap-1 w-fit px-2 py-1 bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400 rounded-lg text-[10px] font-bold uppercase tracking-wider"><ShieldAlert size={12} /> Pending</span>;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin': return <span className="text-xs font-bold text-red-600 dark:text-red-400 flex items-center gap-1"><Shield size={12} /> {role}</span>;
      case 'employer': return <span className="text-xs font-bold text-blue-600 dark:text-blue-400">{role}</span>;
      default: return <span className="text-xs font-bold text-purple-600 dark:text-purple-400">{role}</span>;
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-[70vh]"><Loader2 className="animate-spin text-red-600" size={40} /></div>;
  }

  return (
    <div className="space-y-6 fade-in pb-10 relative">

      {/* CREATE ADMIN MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-zinc-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 w-full max-w-md rounded-3xl p-8 shadow-2xl relative">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-6 right-6 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">
              <X size={20} />
            </button>

            <div className="mb-6">
              <h3 className="text-xl font-black text-zinc-900 dark:text-white flex items-center gap-2">
                <Shield className="text-red-600" /> Create Admin
              </h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Generate a new platform administrator account.</p>
            </div>

            <form onSubmit={handleCreateAdmin} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider ml-1">Admin Name</label>
                <input required type="text" value={newAdmin.name} onChange={(e) => setNewAdmin({ ...newAdmin, name: e.target.value })} className="w-full px-4 py-3 mt-1 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-red-500/20 outline-none text-sm dark:text-white" />
              </div>
              <div>
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider ml-1">Email Address</label>
                <input required type="email" value={newAdmin.email} onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })} className="w-full px-4 py-3 mt-1 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-red-500/20 outline-none text-sm dark:text-white" />
              </div>
              <div>
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider ml-1">Secure Password</label>
                <input required type="password" value={newAdmin.password} onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })} className="w-full px-4 py-3 mt-1 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-red-500/20 outline-none text-sm dark:text-white" />
              </div>

              <button type="submit" disabled={isCreating} className="w-full py-4 mt-2 rounded-2xl text-white font-bold flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 shadow-lg shadow-red-600/20 transition-all disabled:opacity-50">
                {isCreating ? <Loader2 size={18} className="animate-spin" /> : <Shield size={18} />}
                {isCreating ? "Creating..." : "Create Admin Account"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* PDF SETTINGS MODAL  */}
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
                Customize how your user registry report will look.
              </p>
            </div>

            <div className="space-y-5">
              {/* Orientation & Size */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Orientation</label>
                  <select value={pdfOrientation} onChange={(e) => setPdfOrientation(e.target.value as 'portrait' | 'landscape')} className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700 outline-none text-sm dark:text-white">
                    <option value="landscape">Landscape</option>
                    <option value="portrait">Portrait</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Paper Size</label>
                  <select value={pdfSize} onChange={(e) => setPdfSize(e.target.value as 'a4' | 'letter' | 'legal')} className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700 outline-none text-sm dark:text-white">
                    <option value="a4">A4 Standard</option>
                    <option value="letter">Short (Letter)</option>
                    <option value="legal">Long (Legal)</option>
                  </select>
                </div>
              </div>

              {/* Header  */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Header Display</label>
                <select value={pdfHeaderMode} onChange={(e) => setPdfHeaderMode(e.target.value as 'all' | 'first')} className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700 outline-none text-sm dark:text-white">
                  <option value="all">Repeat Header on Every Page</option>
                  <option value="first">Show Header on First Page Only</option>
                </select>
              </div>

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
                <button onClick={() => setShowPdfModal(false)} className="flex-1 py-3 rounded-xl font-bold text-zinc-600 dark:text-zinc-300 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 transition-colors">
                  Cancel
                </button>
                <button onClick={handleGeneratePDF} disabled={isExporting} className="flex-1 py-3 rounded-xl font-bold text-white bg-red-600 hover:bg-red-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-red-500/20">
                  {isExporting ? <Loader2 size={18} className="animate-spin" /> : <FileText size={18} />}
                  Generate
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/*  PAGE HEADER  */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-zinc-900 dark:text-white flex items-center gap-3">
            <Users className="text-red-600" /> User Management
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Manage all students, employers, and admins on Tugma.</p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          {(currentUserEmail === SUPERADMIN_EMAIL || currentUserEmail === SUPERADMIN_EMAIL_ALT) && (
            <button onClick={() => setIsModalOpen(true)} className="flex items-center justify-center gap-2 bg-red-600 text-white px-4 sm:px-5 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-red-500/20 transition-all hover:bg-red-700 shrink-0">
              <Plus size={16} /> <span className="hidden sm:inline">New Admin</span>
            </button>
          )}
          <button onClick={exportToCSV} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-900 dark:text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-sm transition-all flex items-center gap-2 active:scale-95 shrink-0">
            <Download size={16} /> <span className="hidden sm:inline">CSV</span>
          </button>

          <button
            onClick={() => {
              if (filteredUsers.length === 0) {
                alert("No users match the current filters.");
                return;
              }
              setShowPdfModal(true);
            }}
            className="bg-red-600 hover:bg-red-700 text-white px-4 sm:px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-red-500/20 transition-all flex items-center gap-2 active:scale-95 shrink-0"
          >
            <FileText size={16} /> <span className="hidden sm:inline">Export PDF</span>
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex bg-zinc-100 dark:bg-zinc-900 p-1 rounded-xl w-fit overflow-x-auto custom-scrollbar">
          {['All', 'Students', 'Employers', 'Admins', 'Banned'].map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === tab ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'}`}>
              {tab}
            </button>
          ))}
        </div>
        <div className="flex-1 flex items-center gap-3 bg-white dark:bg-zinc-900 px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm focus-within:ring-2 focus-within:ring-red-500/20 transition-all">
          <Search size={18} className="text-zinc-400" />
          <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search by name, email, or ID..." className="bg-transparent border-none outline-none text-sm w-full dark:text-white" />
        </div>
      </div>

      {/* Users  */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-sm overflow-hidden overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-zinc-50/50 dark:bg-zinc-800/30 border-b border-zinc-200 dark:border-zinc-800 text-xs font-bold text-zinc-400 uppercase tracking-wider">
              <th className="p-4 pl-6">User</th>
              <th className="p-4">Role</th>
              <th className="p-4">Status</th>
              <th className="p-4">Joined Date</th>
              <th className="p-4 text-right pr-6">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-10 text-center text-zinc-500 font-medium">No users found matching your criteria.</td>
              </tr>
            ) : (
              filteredUsers.map((user) => {
                const isSuperAdmin = user.email === SUPERADMIN_EMAIL || user.email === SUPERADMIN_EMAIL_ALT;

                return (
                  <tr key={user.id} className={`hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors group ${isSuperAdmin ? 'bg-red-50/30 dark:bg-red-500/5' : ''}`}>
                    <td className="p-4 pl-6">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm text-white shadow-sm shrink-0 ${user.role.toLowerCase() === 'admin' ? 'bg-red-600' : user.role.toLowerCase() === 'employer' ? 'bg-blue-600' : 'bg-purple-600'}`}>
                          {user.avatar}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-zinc-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors flex items-center gap-2 truncate">
                            {user.name}
                            {isSuperAdmin && <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-red-100 text-red-600 uppercase">Superadmin</span>}
                          </h4>
                          <p className="text-xs text-zinc-500 mt-0.5 truncate">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col">
                        {getRoleBadge(user.role)}
                        <span className="text-[10px] text-zinc-400 mt-0.5 truncate w-24" title={user.id}>{user.id}</span>
                      </div>
                    </td>
                    <td className="p-4">{getStatusBadge(user.status)}</td>
                    <td className="p-4 text-sm font-medium text-zinc-600 dark:text-zinc-400">{user.joined}</td>

                    <td className="p-4 pr-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <a href={`mailto:${user.email}`} className="p-2 text-zinc-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors" title="Email User">
                          <Mail size={16} />
                        </a>

                        {!isSuperAdmin && (
                          <>
                            <button
                              onClick={() => handleToggleStatus(user.id, user.status)}
                              className={`p-2 rounded-lg transition-colors ${user.status.toLowerCase() === 'banned'
                                ? 'text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100'
                                : 'text-zinc-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10'
                                }`}
                              title={user.status.toLowerCase() === 'banned' ? 'Unban User' : 'Ban User'}
                            >
                              {user.status.toLowerCase() === 'banned' ? <Unlock size={16} /> : <Ban size={16} />}
                            </button>

                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                              title="Permanently Delete User"
                            >
                              <Trash2 size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}