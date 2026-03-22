import { useState, useEffect } from 'react';
import {
  Users, Briefcase, Activity,
  TrendingUp, Building2, GraduationCap,
  MoreVertical, Clock, Loader2, Send,
  Sparkles, FileText, Server, MapPin, Cpu, BriefcaseBusiness, RefreshCw
} from 'lucide-react';
import { auth } from '../../firebaseConfig';

export default function AdminDashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  useEffect(() => {
    fetchAllAdminStats();
  }, []);

  const fetchAllAdminStats = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch live metrics (students, employers, jobs, skills)
      const statsResponse = await fetch('http://localhost:8080/api/admin/dashboard');

      // 2. Fetch live audit logs for the Activity Feed
      const logsResponse = await fetch('http://localhost:8080/api/admin/audit-logs');

      if (statsResponse.ok && logsResponse.ok) {
        const statsResult = await statsResponse.json();
        const logsResult = await logsResponse.json();

        setData(statsResult);
        setAuditLogs(logsResult.slice(0, 8)); 
      }
    } catch (error) {
      console.error("Failed to load live admin data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || !data) {
    return <div className="flex justify-center items-center h-[70vh]"><Loader2 className="animate-spin text-purple-600" size={40} /></div>;
  }

  const { stats, distributions, chartData, topSkills, recentJobs } = data;
  const maxChartValue = Math.max(...chartData) || 10;
  const totalApps = stats.applications || 1;

  const topStats = [
    {
      title: 'Total Students', value: stats.students.toLocaleString(),
      subText: `${stats.hired} currently in OJT`,
      icon: <GraduationCap size={22} className="text-blue-500" />,
      bg: 'bg-blue-50 dark:bg-blue-500/10'
    },
    {
      title: 'Active Employers', value: stats.employers.toLocaleString(),
      subText: 'Verified accounts',
      icon: <Building2 size={22} className="text-purple-500" />,
      bg: 'bg-purple-50 dark:bg-purple-500/10'
    },
    {
      title: 'Live Jobs', value: stats.jobs.toLocaleString(),
      subText: `${stats.views.toLocaleString()} total job views`,
      icon: <Briefcase size={22} className="text-pink-500" />,
      bg: 'bg-pink-50 dark:bg-pink-500/10'
    },
    {
      title: 'Applications', value: stats.applications.toLocaleString(),
      subText: `${Math.round((stats.hired / totalApps) * 100)}% placement rate`,
      icon: <Send size={22} className="text-emerald-500" />,
      bg: 'bg-emerald-50 dark:bg-emerald-500/10'
    },
  ];

  const formatTime = (dateString: string) => {
    const d = new Date(dateString);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getActivityIcon = (role: string) => {
    const normalizedRole = role?.toLowerCase();

    if (normalizedRole === 'employer') return <Building2 size={14} className="text-purple-500" />;
    if (normalizedRole === 'admin' || normalizedRole === 'superadmin' || normalizedRole === 'system') return <Server size={14} className="text-red-500" />;

    return <Users size={14} className="text-blue-500" />;
  };

  return (
    <div className="space-y-6 fade-in pb-10">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">Admin Overview</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Live metrics across the Tugma network.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg text-xs font-bold border border-emerald-200 dark:border-emerald-500/20">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            System Live
          </div>
          <button onClick={fetchAllAdminStats} className="p-2.5 bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 dark:text-zinc-900 text-white rounded-xl transition-all shadow-sm shrink-0">
            <RefreshCw size={18} className={isLoading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Top Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {topStats.map((stat, index) => (
          <div key={index} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 sm:p-6 shadow-sm hover:border-purple-300 dark:hover:border-purple-500/50 transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-2xl ${stat.bg}`}>
                {stat.icon}
              </div>
              <TrendingUp size={16} className="text-emerald-500" />
            </div>
            <div>
              <h4 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white mb-1 tracking-tight">{stat.value}</h4>
              <p className="text-xs sm:text-sm font-bold text-zinc-600 dark:text-zinc-300">{stat.title}</p>
              <p className="text-[10px] sm:text-[11px] font-medium text-zinc-400 mt-2">{stat.subText}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Left Column (Span 8) */}
        <div className="lg:col-span-8 flex flex-col gap-6">

          {/* Dynamic Growth Chart */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm flex flex-col h-80">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Platform Growth</h3>
                <p className="text-xs text-zinc-500 mt-1">User registration trends over the last 7 days.</p>
              </div>
            </div>

            <div className="flex-1 flex items-end gap-2 sm:gap-4 border-b border-zinc-100 dark:border-zinc-800 relative pb-2">
              {chartData.map((val: number, i: number) => {
                const heightPercent = (val / maxChartValue) * 100;
                return (
                  <div key={i} className="flex-1 flex flex-col justify-end items-center group relative z-10 h-full">
                    <div
                      className="w-full max-w-[48px] bg-purple-100 dark:bg-purple-500/20 group-hover:bg-purple-600 dark:group-hover:bg-purple-500 rounded-t-xl transition-all duration-300"
                      style={{ height: `${Math.max(8, heightPercent)}%` }}
                    />
                    <div className="opacity-0 group-hover:opacity-100 absolute -top-8 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-[10px] font-bold py-1 px-2 rounded-md transition-opacity pointer-events-none shadow-xl z-20">
                      {val} Users
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="flex justify-between mt-3 text-[10px] font-bold uppercase tracking-wider text-zinc-400 px-2 sm:px-4">
              <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
            </div>
          </div>

          {/* Recent Jobs Table */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <BriefcaseBusiness size={18} className="text-purple-500" /> Recent OJT Postings
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-100 dark:border-zinc-800 text-[11px] uppercase tracking-wider text-zinc-400">
                    <th className="pb-3 font-bold">Job Title</th>
                    <th className="pb-3 font-bold">Company</th>
                    <th className="pb-3 font-bold">Work Setup</th>
                    <th className="pb-3 font-bold text-right">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentJobs?.map((job: any, i: number) => (
                    <tr key={i} className="border-b border-zinc-50 dark:border-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                      <td className="py-3 text-sm font-bold text-zinc-900 dark:text-white">{job.title}</td>
                      <td className="py-3 text-[13px] font-medium text-zinc-600 dark:text-zinc-300">{job.company_name}</td>
                      <td className="py-3">
                        <span className="text-[10px] font-bold px-2 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-md">
                          {job.work_setup}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <span className="text-[10px] font-black uppercase px-2 py-1 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-md">Live</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column (Span 4) */}
        <div className="lg:col-span-4 flex flex-col gap-6">

          {/* Activity Log (Real data from audit_logs) */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <Activity size={16} className="text-red-500" /> Recent System Movements
              </h3>
            </div>

            <div className="space-y-5">
              {auditLogs.map((log: any) => (
                <div key={log.id} className="flex gap-3">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 shrink-0">
                    {getActivityIcon(log.role)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-snug">
                      <span className="font-bold text-zinc-900 dark:text-white">{log.user_name}</span> {log.action}
                    </p>
                    <p className="text-[10px] font-medium text-zinc-400 mt-1">{formatTime(log.timestamp)}</p>
                  </div>
                </div>
              ))}
            </div>

            <button onClick={() => window.location.href = '/admin/reports'} className="w-full mt-6 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl text-xs font-bold text-zinc-500 dark:text-zinc-400 transition-all">
              View All Movements
            </button>
          </div>

          {/* Skills Distribution */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm">
            <h3 className="text-base font-bold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
              <Cpu size={16} className="text-amber-500" /> Market Skills Demand
            </h3>
            <div className="flex flex-wrap gap-2">
              {Object.entries(topSkills || {}).map(([skill, count]: any) => (
                <div key={skill} className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 rounded-lg">
                  <span className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300">{skill}</span>
                  <span className="text-[10px] font-black text-purple-600 dark:text-purple-400">{count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* System Health */}
          <div className="bg-gradient-to-br from-zinc-900 to-black rounded-3xl p-6 border border-zinc-800 text-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xs font-bold flex items-center gap-2 text-zinc-400 uppercase tracking-widest"><Server size={14} className="text-emerald-400" /> Platform Health</h3>
              <div className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-[11px]">
                <span className="text-zinc-500">Database Status</span>
                <span className="text-emerald-400 font-bold uppercase">Online</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-zinc-500">API Response</span>
                <span className="text-white font-bold">22ms</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}