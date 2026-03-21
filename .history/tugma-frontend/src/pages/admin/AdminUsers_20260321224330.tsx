import { useState, useEffect } from 'react';
import {
  Users, Search, Filter, ShieldAlert, CheckCircle2,
  Ban, Mail, Shield, Loader2, Download, Trash2, Unlock
} from 'lucide-react';

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

  useEffect(() => {
    fetchUsers();
  }, []);

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

  // 🔥 REAL ACTION: BAN / UNBAN USER
  const handleToggleStatus = async (uid: string, currentStatus: string) => {
    const newStatus = currentStatus.toLowerCase() === 'banned' ? 'Active' : 'Banned';
    const confirmMsg = newStatus === 'Banned'
      ? "Are you sure you want to BAN this user? They will be locked out of the platform."
      : "Are you sure you want to UNBAN this user? They will regain access.";

    if (!confirm(confirmMsg)) return;

    // Optimistic UI Update (Instant feedback)
    setUsers(prev => prev.map(u => u.id === uid ? { ...u, status: newStatus } : u));

    try {
      const res = await fetch(`http://localhost:8080/api/admin/users/${uid}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (!res.ok) throw new Error("Failed to update status on server");
    } catch (error) {
      console.error(error);
      alert("Network Error: Could not update user status.");
      // Revert UI if it failed
      setUsers(prev => prev.map(u => u.id === uid ? { ...u, status: currentStatus } : u));
    }
  };

  // 🔥 REAL ACTION: DELETE USER
  const handleDeleteUser = async (uid: string) => {
    if (!confirm("CRITICAL WARNING: Are you sure you want to PERMANENTLY DELETE this user? This action cannot be undone and will erase their profile.")) return;

    // Optimistic UI Update
    const previousUsers = [...users];
    setUsers(prev => prev.filter(u => u.id !== uid));

    try {
      const res = await fetch(`http://localhost:8080/api/admin/users/${uid}`, {
        method: 'DELETE'
      });

      if (!res.ok) throw new Error("Failed to delete user on server");
    } catch (error) {
      console.error(error);
      alert("Network Error: Could not delete user.");
      // Revert UI if it failed
      setUsers(previousUsers);
    }
  };

  const exportToCSV = () => {
    if (users.length === 0) return;
    const headers = ['User ID', 'Name', 'Email', 'Role', 'Status', 'Joined Date'];
    const csvRows = users.map(user => `"${user.id}","${user.name}","${user.email}","${user.role}","${user.status}","${user.joined}"`);
    const csvContent = [headers.join(','), ...csvRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `tugma_users_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

  if (isLoading) {
    return <div className="flex justify-center items-center h-[70vh]"><Loader2 className="animate-spin text-red-600" size={40} /></div>;
  }

  return (
    <div className="space-y-6 fade-in pb-10">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-zinc-900 dark:text-white flex items-center gap-3">
            <Users className="text-red-600" /> User Management
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Manage all students, employers, and admins on Tugma.</p>
        </div>
        <button
          onClick={exportToCSV}
          className="flex items-center justify-center gap-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm transition-all hover:opacity-90 shrink-0"
        >
          <Download size={16} /> Export User Data
        </button>
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex bg-zinc-100 dark:bg-zinc-900 p-1 rounded-xl w-fit overflow-x-auto custom-scrollbar">
          {['All', 'Students', 'Employers', 'Admins', 'Banned'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === tab ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'}`}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="flex-1 flex items-center gap-3 bg-white dark:bg-zinc-900 px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm focus-within:ring-2 focus-within:ring-red-500/20 transition-all">
          <Search size={18} className="text-zinc-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, email, or ID..."
            className="bg-transparent border-none outline-none text-sm w-full dark:text-white"
          />
        </div>
      </div>

      {/* Users Table */}
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
                <td colSpan={5} className="p-10 text-center text-zinc-500 font-medium">
                  No users found matching your criteria.
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors group">
                  <td className="p-4 pl-6">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm text-white shadow-sm shrink-0 ${user.role.toLowerCase() === 'admin' ? 'bg-red-600' : user.role.toLowerCase() === 'employer' ? 'bg-blue-600' : 'bg-purple-600'}`}>
                        {user.avatar}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-zinc-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors truncate">{user.name}</h4>
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

                  {/* 🔥 LIVE ACTIONS 🔥 */}
                  <td className="p-4 pr-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <a href={`mailto:${user.email}`} className="p-2 text-zinc-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors" title="Email User">
                        <Mail size={16} />
                      </a>

                      {user.role.toLowerCase() !== 'admin' && (
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
              ))
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}