import { useState, useEffect } from 'react';
import {
  Users, Briefcase, Activity,
  TrendingUp, Building2, GraduationCap,
  MoreVertical, Clock, Loader2, Send,
  Sparkles, FileText, Server, MapPin, Cpu, BriefcaseBusiness
} from 'lucide-react';

export default function AdminDashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:8080/api/admin/dashboard');
      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } catch (error) {
      console.error("Failed to load admin stats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || !data) {
    return <div className="flex justify-center items-center h-[70vh]"><Loader2 className="animate-spin text-purple-600" size={40} /></div>;
  }

  const { stats, distributions, chartData, activities, topSkills, recentJobs } = data;
  const maxChartValue = Math.max(...chartData) || 100;
  const totalApps = stats.applications || 1; // Prevent div by 0

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

  const getActivityIcon = (type: string) => {
    if (type === 'employer') return <Building2 size={14} className="text-purple-500" />;
    if (type === 'system') return <Briefcase size={14} className="text-pink-500" />;
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
            Database Connected
          </div>
          <button onClick={fetchAdminData} className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 dark:text-zinc-900 text-white rounded-xl text-sm font-bold transition-colors shadow-sm shrink-0">
            Refresh
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
              <TrendingUp size={16} className="text-zinc-400" />
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

          {/* Dynamic Bar Chart */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm flex flex-col h-80">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Platform Growth</h3>
                <p className="text-xs text-zinc-500 mt-1">User registration trends over the last 7 days.</p>
              </div>
              <button className="p-2 hover:bg-zinc-100 dark:bg-zinc-800 rounded-lg transition-colors text-zinc-400">
                <MoreVertical size={18} />
              </button>
            </div>

            <div className="flex-1 flex items-end gap-2 sm:gap-4 border-b border-zinc-100 dark:border-zinc-800 relative pb-2">
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-2">
                <div className="w-full border-t border-dashed border-zinc-200 dark:border-zinc-800/50 h-0"></div>
                <div className="w-full border-t border-dashed border-zinc-200 dark:border-zinc-800/50 h-0"></div>
                <div className="w-full border-t border-dashed border-zinc-200 dark:border-zinc-800/50 h-0"></div>
              </div>

              {chartData.map((val: number, i: number) => {
                const heightPercent = maxChartValue > 0 ? (val / maxChartValue) * 100 : 10;
                return (
                  <div key={i} className="flex-1 flex flex-col justify-end items-center group relative z-10 h-full">
                    <div
                      className="w-full max-w-[48px] bg-purple-100 dark:bg-purple-500/20 group-hover:bg-purple-200 dark:group-hover:bg-purple-500/40 rounded-t-xl transition-colors relative overflow-hidden"
                      style={{ height: `${Math.max(5, heightPercent)}%` }}
                    >
                      <div className="absolute bottom-0 left-0 right-0 bg-purple-600 dark:bg-purple-500 rounded-t-xl transition-all duration-500 h-2 group-hover:h-full opacity-20 dark:opacity-50"></div>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 absolute -top-8 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-[10px] font-bold py-1 px-2 rounded-md transition-opacity pointer-events-none shadow-xl">
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

          {/* Quick Metrics Split */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* OJT Hours */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl">
                  <Clock size={20} />
                </div>
                <h3 className="font-bold text-zinc-900 dark:text-white">OJT Hours Logged</h3>
              </div>
              <p className="text-3xl font-black text-zinc-900 dark:text-white mb-2">{stats.totalHours.toLocaleString()} <span className="text-sm font-medium text-zinc-500">hrs</span></p>
              <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-1.5 rounded-full mt-4 overflow-hidden">
                <div className="bg-indigo-500 h-full w-3/4 rounded-full"></div>
              </div>
            </div>

            {/* AI Match */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl">
                  <Sparkles size={20} />
                </div>
                <h3 className="font-bold text-zinc-900 dark:text-white">Avg. AI Match Score</h3>
              </div>
              <p className="text-3xl font-black text-zinc-900 dark:text-white mb-2">{stats.avgAiScore}% <span className="text-sm font-medium text-zinc-500">accuracy</span></p>
              <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-1.5 rounded-full mt-4 overflow-hidden">
                <div className="bg-amber-500 h-full rounded-full" style={{ width: `${stats.avgAiScore}%` }}></div>
              </div>
            </div>
          </div>

          {/* 🔥 NEW: Recent Jobs Table 🔥 */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <BriefcaseBusiness size={18} className="text-purple-500" /> Recent Job Postings
              </h3>
            </div>
            <div className="overflow-x-auto custom-scrollbar pb-2">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-100 dark:border-zinc-800 text-[11px] uppercase tracking-wider text-zinc-400">
                    <th className="pb-3 font-bold px-2">Job Title</th>
                    <th className="pb-3 font-bold px-2">Company</th>
                    <th className="pb-3 font-bold px-2">Work Setup</th>
                    <th className="pb-3 font-bold px-2 text-right">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentJobs?.length === 0 ? (
                    <tr><td colSpan={4} className="text-center py-6 text-sm text-zinc-500">No recent jobs found.</td></tr>
                  ) : (
                    recentJobs?.map((job: any, i: number) => (
                      <tr key={i} className="border-b border-zinc-50 dark:border-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                        <td className="py-3 px-2 text-sm font-bold text-zinc-900 dark:text-white">{job.title}</td>
                        <td className="py-3 px-2 text-[13px] font-medium text-zinc-600 dark:text-zinc-300">{job.company_name || 'Employer'}</td>
                        <td className="py-3 px-2">
                          <span className="text-[10px] font-bold px-2 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-md">
                            {job.work_setup}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-right">
                          <span className="text-[10px] font-black uppercase px-2 py-1 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-md">Active</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Right Column (Span 4) */}
        <div className="lg:col-span-4 flex flex-col gap-6">

          {/* Application Funnel */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm">
            <h3 className="text-base font-bold text-zinc-900 dark:text-white mb-5 flex items-center gap-2">
              <Activity size={16} className="text-purple-500" /> Pipeline Funnel
            </h3>

            <div className="space-y-4">
              {[
                { label: 'Pending Review', value: distributions.appStatus['New Applicant'] + distributions.appStatus['Reviewed'], color: 'bg-zinc-400 dark:bg-zinc-600' },
                { label: 'Shortlisted', value: distributions.appStatus['Shortlisted'], color: 'bg-blue-500' },
                { label: 'Hired', value: distributions.appStatus['Hired'], color: 'bg-emerald-500' },
                { label: 'Rejected', value: distributions.appStatus['Rejected'], color: 'bg-red-400' }
              ].map(item => (
                <div key={item.label}>
                  <div className="flex justify-between text-xs font-bold text-zinc-600 dark:text-zinc-400 mb-1.5">
                    <span>{item.label}</span>
                    <span className="text-zinc-900 dark:text-white">{item.value}</span>
                  </div>
                  <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                    <div className={`${item.color} h-full rounded-full`} style={{ width: `${(item.value / totalApps) * 100}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 🔥 NEW: Work Setup Distribution 🔥 */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm">
            <h3 className="text-base font-bold text-zinc-900 dark:text-white mb-5 flex items-center gap-2">
              <MapPin size={16} className="text-blue-500" /> Job Locations
            </h3>
            <div className="space-y-3">
              {Object.entries(distributions.workSetup).map(([setup, count]: any) => {
                const colors: Record<string, string> = { 'Remote': 'bg-blue-500', 'Hybrid': 'bg-purple-500', 'Onsite': 'bg-amber-500' };
                const maxSetup = Math.max(...Object.values(distributions.workSetup) as number[]) || 1;
                return (
                  <div key={setup} className="flex items-center gap-3">
                    <div className="w-16 text-xs font-bold text-zinc-600 dark:text-zinc-400">{setup}</div>
                    <div className="flex-1 bg-zinc-100 dark:bg-zinc-800 h-2.5 rounded-full overflow-hidden flex">
                      <div className={`${colors[setup] || 'bg-zinc-400'} h-full rounded-full transition-all`} style={{ width: `${(count / maxSetup) * 100}%` }}></div>
                    </div>
                    <div className="text-xs font-bold text-zinc-900 dark:text-white w-6 text-right">{count}</div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* 🔥 NEW: Top Skills in Demand 🔥 */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm">
            <h3 className="text-base font-bold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
              <Cpu size={16} className="text-amber-500" /> Top Skills in Demand
            </h3>
            <div className="flex flex-wrap gap-2">
              {Object.entries(topSkills || {}).length === 0 ? (
                <p className="text-xs text-zinc-500">No skills data available.</p>
              ) : (
                Object.entries(topSkills || {}).map(([skill, count]: any) => (
                  <div key={skill} className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg">
                    <span className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300">{skill}</span>
                    <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-500/20 px-1.5 rounded">{count}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Activity Feed */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm flex-1">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <FileText size={16} className="text-emerald-500" /> Activity Log
              </h3>
            </div>

            <div className="space-y-4">
              {activities.map((item: any, i: number) => (
                <div key={i} className="flex gap-3">
                  <div className="relative flex flex-col items-center">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 z-10 shrink-0">
                      {getActivityIcon(item.type)}
                    </div>
                    {i !== activities.length - 1 && <div className="w-px h-full bg-zinc-100 dark:bg-zinc-800 absolute top-7 bottom-[-16px]"></div>}
                  </div>
                  <div className="flex-1 pb-1 pt-1 min-w-0">
                    <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-snug">
                      <span className="font-bold text-zinc-900 dark:text-white mr-1">{item.user}</span>
                      {item.action}
                    </p>
                    <div className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider mt-1">
                      {item.time}
                    </div>
                  </div>
                </div>
              ))}
              {activities.length === 0 && (
                <p className="text-center text-zinc-500 text-sm py-4">No recent activity.</p>
              )}
            </div>
          </div>

          {/* 🔥 NEW: System Status Card 🔥 */}
          <div className="bg-gradient-to-br from-zinc-900 to-black rounded-3xl p-6 shadow-xl border border-zinc-800 text-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold flex items-center gap-2 text-zinc-300"><Server size={14} className="text-emerald-400" /> System Health</h3>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-zinc-400">Database Connection</span>
                <span className="text-emerald-400 font-bold">Stable</span>
              </div>
              <div className="flex justify-between text-xs font-medium">
                <span className="text-zinc-400">API Latency</span>
                <span className="text-white font-bold">24ms</span>
              </div>
              <div className="flex justify-between text-xs font-medium">
                <span className="text-zinc-400">Uptime</span>
                <span className="text-white font-bold">99.99%</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}