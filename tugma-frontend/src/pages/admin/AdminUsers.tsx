import { useState } from 'react';
import { 
  Users, Search, Filter, MoreVertical, 
  ShieldAlert, CheckCircle2, Ban, Mail, Edit2, Shield 
} from 'lucide-react';

export default function AdminUsers() {
  const [activeTab, setActiveTab] = useState('All');

  // Mock Users Database
  const [users] = useState([
    { id: 'USR-001', name: 'Nishia', email: 'nishia@student.edu', role: 'Student', status: 'Active', joined: 'Oct 12, 2023', avatar: 'N' },
    { id: 'USR-002', name: 'TechFlow Inc.', email: 'admin@techflow.io', role: 'Employer', status: 'Active', joined: 'Nov 05, 2023', avatar: 'T' },
    { id: 'USR-003', name: 'Alex Johnson', email: 'alexj@gmail.com', role: 'Student', status: 'Banned', joined: 'Dec 01, 2023', avatar: 'A' },
    { id: 'USR-004', name: 'Main Admin', email: 'root@tugma.com', role: 'Admin', status: 'Active', joined: 'Jan 01, 2023', avatar: 'AD' },
    { id: 'USR-005', name: 'DesignWorks', email: 'hello@designworks.co', role: 'Employer', status: 'Pending', joined: '2 days ago', avatar: 'D' },
  ]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Active': return <span className="flex items-center gap-1 w-fit px-2 py-1 bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 rounded-lg text-[10px] font-bold uppercase tracking-wider"><CheckCircle2 size={12} /> Active</span>;
      case 'Banned': return <span className="flex items-center gap-1 w-fit px-2 py-1 bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400 rounded-lg text-[10px] font-bold uppercase tracking-wider"><Ban size={12} /> Banned</span>;
      default: return <span className="flex items-center gap-1 w-fit px-2 py-1 bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400 rounded-lg text-[10px] font-bold uppercase tracking-wider"><ShieldAlert size={12} /> Pending</span>;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'Admin': return <span className="text-xs font-bold text-red-600 dark:text-red-400 flex items-center gap-1"><Shield size={12} /> {role}</span>;
      case 'Employer': return <span className="text-xs font-bold text-blue-600 dark:text-blue-400">{role}</span>;
      default: return <span className="text-xs font-bold text-purple-600 dark:text-purple-400">{role}</span>;
    }
  };

  return (
    <div className="space-y-6 fade-in">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-zinc-900 dark:text-white flex items-center gap-3">
            <Users className="text-red-600" /> User Management
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Manage all students, employers, and admins on Tugma.</p>
        </div>
        <button className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm transition-all hover:opacity-90">
          Export User Data
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
          <input type="text" placeholder="Search by name, email, or ID..." className="bg-transparent border-none outline-none text-sm w-full dark:text-white" />
        </div>
        <button className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors shrink-0 shadow-sm">
          <Filter size={16} /> Filters
        </button>
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
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors group">
                <td className="p-4 pl-6">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm text-white shadow-sm ${user.role === 'Admin' ? 'bg-red-600' : user.role === 'Employer' ? 'bg-blue-600' : 'bg-purple-600'}`}>
                      {user.avatar}
                    </div>
                    <div>
                      <h4 className="font-bold text-zinc-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">{user.name}</h4>
                      <p className="text-xs text-zinc-500 mt-0.5">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex flex-col">
                    {getRoleBadge(user.role)}
                    <span className="text-[10px] text-zinc-400 mt-0.5">{user.id}</span>
                  </div>
                </td>
                <td className="p-4">{getStatusBadge(user.status)}</td>
                <td className="p-4 text-sm font-medium text-zinc-600 dark:text-zinc-400">{user.joined}</td>
                <td className="p-4 pr-6 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button className="p-2 text-zinc-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors" title="Email User"><Mail size={16} /></button>
                    <button className="p-2 text-zinc-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10 rounded-lg transition-colors" title="Edit User"><Edit2 size={16} /></button>
                    {user.role !== 'Admin' && (
                      <button className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors" title="Ban User"><Ban size={16} /></button>
                    )}
                    <button className="p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"><MoreVertical size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}