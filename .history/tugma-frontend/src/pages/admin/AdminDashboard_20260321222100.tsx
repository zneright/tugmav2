import { useState, useEffect } from 'react';
import {
  Users, Briefcase, ShieldCheck, Activity,
  TrendingUp, Building2, GraduationCap,
  MoreVertical, CheckCircle2, Clock, Loader2, Send
} from 'lucide-react';

export default function AdminDashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const fetchAdminData = async () => {
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

    fetchAdminData();
  }, []);

  if (isLoading) {
    return <div className="flex justify-center items-center h-[70vh]"><Loader2 className="animate-spin text-purple-600" size={40} /></div>;
  }

  // Dynamic Stats mapped from Database
  const stats = [
    {
      title: 'Total Students',
      value: data?.stats.students.toLocaleString() || '0',
      trend: 'Active',
      isUp: true,
      icon: <GraduationCap size={22} className="text-blue-500" />,
      bg: 'bg-blue-50 dark:bg-blue-500/10'
    },
    {
      title: 'Active Employers',
      value: data?.stats.employers.toLocaleString() || '0',
      trend: 'Verified',
      isUp: true,
      icon: <Building2 size={22} className="text-purple-500" />,
      bg: 'bg-purple-50 dark:bg-purple-500/10'
    },
    {
      title: 'Live Job Postings',
      value: data?.stats.jobs.toLocaleString() || '0',
      trend: 'Hiring',
      isUp: true,
      icon: <Briefcase size={22} className="text-pink-500" />,
      bg: 'bg-pink-50 dark:bg-pink-500/10'
    },
    {
      title: 'Total Applications',
      value: data?.stats.applications.toLocaleString() || '0',
      trend: 'Processing',
      isUp: true,
      icon: <Send size={22} className="text-emerald-500" />,
      bg: 'bg-emerald-50 dark:bg-emerald-500/10'
    },
  ];

  // Dynamic Chart Logic
  const maxChartValue = data ? Math.max(...data.chartData) : 100;

  // Icon mapping for Activity Feed
  const getActivityIcon = (type: string) => {
    if (type === 'employer') return <Building2 size={16} className="text-purple-500" />;
    if (type === 'system') return <Briefcase size={16} className="text-pink-500" />;
    return <Users size={16} className="text-blue-500" />;
  };

  return (
    <div className="space-y-6 fade-in pb-10">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">Admin Overview</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Live metrics directly from the Tugma database.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg text-xs font-bold border border-emerald-200 dark:border-emerald-500/20">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Database Online
          </div>
          <button className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 dark:text-zinc-900 text-white rounded-xl text-sm font-bold transition-colors shadow-sm">
            Refresh Data
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-2xl ${stat.bg}`}>
                {stat.icon}
              </div>
              <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg ${stat.isUp ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10' : 'text-amber-600 bg-amber-50 dark:bg-amber-500/10'}`}>
                {stat.isUp && <TrendingUp size={14} />}
                {stat.trend}
              </div>
            </div>
            <div>
              <h4 className="text-3xl font-black text-zinc-900 dark:text-white mb-1 tracking-tight">{stat.value}</h4>
              <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{stat.title}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Middle Section: Chart & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Dynamic Bar Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Platform Growth</h3>
              <p className="text-sm text-zinc-500">Live trajectory based on current registered users.</p>
            </div>
            <button className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors text-zinc-400">
              <MoreVertical size={20} />
            </button>
          </div>

          <div className="flex-1 flex items-end gap-2 sm:gap-4 h-48 mt-auto pt-4 border-b border-zinc-100 dark:border-zinc-800 relative">
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
              <div className="w-full border-t border-dashed border-zinc-200 dark:border-zinc-800"></div>
              <div className="w-full border-t border-dashed border-zinc-200 dark:border-zinc-800"></div>
              <div className="w-full border-t border-dashed border-zinc-200 dark:border-zinc-800"></div>
            </div>

            {/* Render bars dynamically */}
            {data?.chartData.map((val: number, i: number) => {
              const heightPercent = maxChartValue > 0 ? (val / maxChartValue) * 100 : 10;
              return (
                <div key={i} className="flex-1 flex flex-col justify-end items-center group relative z-10 h-full">
                  <div
                    className="w-full max-w-[40px] bg-purple-100 dark:bg-purple-500/20 group-hover:bg-purple-200 dark:group-hover:bg-purple-500/40 rounded-t-lg transition-colors relative overflow-hidden"
                    style={{ height: `${Math.max(5, heightPercent)}%` }}
                  >
                    <div className="absolute bottom-0 left-0 right-0 bg-purple-500 dark:bg-purple-500 rounded-t-lg transition-all duration-500 h-2"></div>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 absolute -top-8 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-bold py-1 px-2 rounded transition-opacity pointer-events-none">
                    {val}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="flex justify-between mt-4 text-xs font-medium text-zinc-400 px-2 sm:px-4">
            <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
          </div>
        </div>

        {/* Live Activity Feed */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Recent Activity</h3>
            <button className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline">View All</button>
          </div>

          <div className="space-y-6">
            {data?.activities.map((item: any, i: number) => (
              <div key={i} className="flex gap-4">
                <div className="relative flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 z-10">
                    {getActivityIcon(item.type)}
                  </div>
                  <div className="w-px h-full bg-zinc-200 dark:bg-zinc-800 absolute top-8 bottom-[-24px] last:hidden"></div>
                </div>
                <div className="flex-1 pb-2">
                  <p className="text-sm text-zinc-700 dark:text-zinc-300">
                    <span className="font-bold text-zinc-900 dark:text-white mr-1">{item.user}</span>
                    {item.action}
                  </p>
                  <div className="flex items-center gap-1 mt-1 text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
                    <Clock size={10} /> {item.time}
                  </div>
                </div>
              </div>
            ))}
            {data?.activities.length === 0 && (
              <p className="text-center text-zinc-500 text-sm py-4">No recent activity found.</p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}