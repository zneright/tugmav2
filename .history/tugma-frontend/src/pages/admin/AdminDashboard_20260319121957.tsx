import { 
  Users, Briefcase, ShieldCheck, Activity, 
  TrendingUp, TrendingDown, Building2, GraduationCap, 
  MoreVertical, CheckCircle2, Clock 
} from 'lucide-react';

export default function AdminDashboard() {
  // Mock Data for Stat Cards
  const stats = [
    { 
      title: 'Total Students', 
      value: '12,450', 
      trend: '+12.5%', 
      isUp: true, 
      icon: <GraduationCap size={22} className="text-blue-500" />,
      bg: 'bg-blue-50 dark:bg-blue-500/10'
    },
    { 
      title: 'Active Employers', 
      value: '842', 
      trend: '+5.2%', 
      isUp: true, 
      icon: <Building2 size={22} className="text-purple-500" />,
      bg: 'bg-purple-50 dark:bg-purple-500/10'
    },
    { 
      title: 'Live Job Postings', 
      value: '3,210', 
      trend: '-1.4%', 
      isUp: false, 
      icon: <Briefcase size={22} className="text-pink-500" />,
      bg: 'bg-pink-50 dark:bg-pink-500/10'
    },
    { 
      title: 'Pending Verifications', 
      value: '24', 
      trend: 'Action Needed', 
      isUp: null, 
      icon: <ShieldCheck size={22} className="text-amber-500" />,
      bg: 'bg-amber-50 dark:bg-amber-500/10'
    },
  ];

  // Mock Data for Recent Activity
  const activities = [
    { id: 1, user: 'TechFlow Inc.', action: 'registered as a new employer.', time: '10 mins ago', icon: <Building2 size={16} />, color: 'text-purple-500' },
    { id: 2, user: 'Alex Johnson', action: 'reported a suspicious job posting.', time: '1 hour ago', icon: <ShieldCheck size={16} />, color: 'text-red-500' },
    { id: 3, user: 'System', action: 'automated database backup completed.', time: '3 hours ago', icon: <Activity size={16} />, color: 'text-blue-500' },
    { id: 4, user: 'Sarah Smith', action: 'verified their student email.', time: '5 hours ago', icon: <CheckCircle2 size={16} />, color: 'text-emerald-500' },
  ];

  return (
    <div className="space-y-6 fade-in">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">Admin Overview</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Welcome back. Here is what's happening on Tugma today.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg text-xs font-bold border border-emerald-200 dark:border-emerald-500/20">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            System Online
          </div>
          <button className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 dark:text-zinc-900 text-white rounded-xl text-sm font-bold transition-colors shadow-sm">
            Generate Report
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
              {stat.isUp !== null && (
                <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg ${stat.isUp ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10' : 'text-red-600 bg-red-50 dark:bg-red-500/10'}`}>
                  {stat.isUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                  {stat.trend}
                </div>
              )}
              {stat.isUp === null && (
                <div className="text-xs font-bold px-2 py-1 rounded-lg text-amber-600 bg-amber-50 dark:bg-amber-500/10">
                  {stat.trend}
                </div>
              )}
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
        
        {/* CSS-Only Chart Mockup (Takes up 2 columns) */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Platform Growth</h3>
              <p className="text-sm text-zinc-500">New user registrations over the last 7 days.</p>
            </div>
            <button className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors text-zinc-400">
              <MoreVertical size={20} />
            </button>
          </div>
          
          {/* Bar Chart Representation using Tailwind */}
          <div className="flex-1 flex items-end gap-2 sm:gap-4 h-48 mt-auto pt-4 border-b border-zinc-100 dark:border-zinc-800 relative">
            {/* Y-Axis Lines */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
              <div className="w-full border-t border-dashed border-zinc-200 dark:border-zinc-800"></div>
              <div className="w-full border-t border-dashed border-zinc-200 dark:border-zinc-800"></div>
              <div className="w-full border-t border-dashed border-zinc-200 dark:border-zinc-800"></div>
            </div>
<h1>Hello Git Test</h1>
            {/* Bars */}
            {[40, 70, 45, 90, 65, 85, 100].map((height, i) => (
              <div key={i} className="flex-1 flex flex-col justify-end items-center group relative z-10">
                <div 
                  className="w-full max-w-[40px] bg-purple-100 dark:bg-purple-500/20 group-hover:bg-purple-200 dark:group-hover:bg-purple-500/40 rounded-t-lg transition-colors relative overflow-hidden"
                  style={{ height: `${height}%` }}
                >
                  {/* Fill effect */}
                  <div className="absolute bottom-0 left-0 right-0 bg-purple-500 dark:bg-purple-500 rounded-t-lg transition-all duration-500" style={{ height: '10%' }}></div>
                </div>
                {/* Tooltip on hover */}
                <div className="opacity-0 group-hover:opacity-100 absolute -top-10 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-bold py-1 px-2 rounded transition-opacity pointer-events-none">
                  {height * 12}
                </div>
              </div>
            ))}
          </div>
          {/* X-Axis Labels */}
          <div className="flex justify-between mt-4 text-xs font-medium text-zinc-400 px-2 sm:px-4">
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
            <span>Sun</span>
          </div>
        </div>

        {/* Recent Activity Feed */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Recent Activity</h3>
            <button className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline">View All</button>
          </div>

          <div className="space-y-6">
            {activities.map((item) => (
              <div key={item.id} className="flex gap-4">
                <div className="relative flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 z-10 ${item.color}`}>
                    {item.icon}
                  </div>
                  {/* Vertical Line Connector */}
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
          </div>
        </div>

      </div>
    </div>
  );
}