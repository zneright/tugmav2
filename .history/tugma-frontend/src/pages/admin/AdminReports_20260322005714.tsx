import { useState, useEffect } from 'react';
import {
  FileWarning, Download, Calendar, TrendingUp,
  Users, Briefcase, Filter, Activity, LogIn, LogOut,
  Search, ShieldAlert, Sparkles, Loader2, RefreshCw
} from 'lucide-react';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('All');

  useEffect(() => {
    fetchLogs();
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

  // 🔥 Format timestamps beautifully
  const formatTime = (dateString: string) => {
    const d = new Date(dateString);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  // 🔥 Smart Icon mapping based on the action string!
  const getActionIcon = (action: string) => {
    const a = action.toLowerCase();
    if (a.includes('login') || a.includes('signed in')) return <LogIn size={16} className="text-emerald-500" />;
    if (a.includes('logout') || a.includes('signed out')) return <LogOut size={16} className="text-zinc-500" />;
    if (a.includes('scan') || a.includes('ai')) return <Sparkles size={16} className="text-purple-500" />;
    if (a.includes('create') || a.includes('register')) return <Users size={16} className="text-blue-500" />;
    if (a.includes('delete') || a.includes('ban')) return <ShieldAlert size={16} className="text-red-500" />;
    return <Activity size={16} className="text-amber-500" />;
  };

  // Filter Logic
  const filteredLogs = logs.filter(log => {
    const matchesSearch =
      log.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.details.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = filterRole === 'All' || log.role === filterRole;
    return matchesSearch && matchesRole;
  });

  // Working CSV Export for Logs
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

  return (
    <div className="max-w-6xl mx-auto space-y-6 fade-in pb-10">

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
          <button onClick={exportToCSV} className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg transition-all flex items-center gap-2 active:scale-95">
            <Download size={16} /> Export Activity Log
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Quick Insights (Left Column) */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-50 dark:bg-blue-500/10 rounded-lg text-blue-600 dark:text-blue-400"><Activity size={20} /></div>
              <h3 className="font-bold text-zinc-900 dark:text-white">Total Events (24h)</h3>
            </div>
            <p className="text-3xl font-black text-zinc-900 dark:text-white mb-1">{logs.length}</p>
            <p className="text-sm font-bold text-emerald-600 flex items-center gap-1"><TrendingUp size={14} /> Tracking live data</p>
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
            </div>
          </div>
        </div>

        {/* Live Audit Stream (Right Column) */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-sm flex flex-col overflow-hidden">
          <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Live Activity Stream</h3>
            <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 rounded-md">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div> Live
            </span>
          </div>

          <div className="flex-1 overflow-y-auto max-h-[600px] custom-scrollbar p-2">
            {isLoading ? (
              <div className="flex justify-center py-20"><Loader2 className="animate-spin text-red-600" size={32} /></div>
            ) : filteredLogs.length === 0 ? (
              <div className="text-center py-16 text-zinc-500 font-medium">No activity logs found.</div>
            ) : (
              <div className="space-y-1 relative before:absolute before:inset-0 before:ml-7 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-zinc-200 dark:before:via-zinc-800 before:to-transparent">
                {filteredLogs.map((log) => (
                  <div key={log.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active px-4 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 rounded-xl transition-colors">

                    {/* Icon Node */}
                    <div className="flex items-center justify-center w-8 h-8 rounded-full border-2 border-white dark:border-zinc-900 bg-zinc-100 dark:bg-zinc-800 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                      {getActionIcon(log.action)}
                    </div>

                    {/* Content Card */}
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