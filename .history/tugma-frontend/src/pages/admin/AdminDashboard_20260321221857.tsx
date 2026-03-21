import React, { useState, useEffect } from 'react';
import {
  Users, Briefcase, ShieldCheck, Activity,
  TrendingUp, TrendingDown, Building2, GraduationCap,
  MoreVertical, CheckCircle2, Clock, AlertCircle, RefreshCw
} from 'lucide-react';

export default function AdminDashboard() {
  const [isRefreshing, setIsRefreshing] = useState(false);

  // High-level system stats
  const stats = [
    { title: 'Total Students', value: '12,450', trend: '+12.5%', isUp: true, icon: <GraduationCap size={22} />, color: 'blue' },
    { title: 'Active Employers', value: '842', trend: '+5.2%', isUp: true, icon: <Building2 size={22} />, color: 'purple' },
    { title: 'Live Job Postings', value: '3,210', trend: '-1.4%', isUp: false, icon: <Briefcase size={22} />, color: 'pink' },
    { title: 'Pending Verifications', value: '24', trend: 'High Priority', isUp: null, icon: <ShieldCheck size={22} />, color: 'amber' },
  ];

  // Logic to simulate "Live" data fetching
  const refreshData = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  return (
    <div className="p-6 space-y-8 bg-zinc-50 dark:bg-black min-h-screen transition-colors duration-300">

      {/* --- TOP NAV / HEADER --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight">Executive Control</h1>
          <p className="text-zinc-500 dark:text-zinc-400">Monitoring Tugma Ecosystem: Students, Employers, & AI Matches.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={refreshData}
            className={`p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 transition-all ${isRefreshing ? 'animate-spin' : ''}`}
          >
            <RefreshCw size={20} />
          </button>
          <div className="h-10 w-px bg-zinc-200 dark:bg-zinc-800 hidden md:block" />
          <button className="px-5 py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl font-bold text-sm shadow-xl shadow-zinc-200 dark:shadow-none hover:scale-105 transition-transform">
            System Reports
          </button>
        </div>
      </div>

      {/* --- STATS GRID --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="group bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-[2.5rem] hover:border-zinc-400 dark:hover:border-zinc-600 transition-all">
            <div className="flex justify-between items-start mb-4">
              <div className={`p-4 rounded-3xl bg-${stat.color}-50 dark:bg-${stat.color}-500/10 text-${stat.color}-600 dark:text-${stat.color}-400`}>
                {stat.icon}
              </div>
              <span className={`text-xs font-black px-3 py-1 rounded-full ${stat.isUp ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                {stat.trend}
              </span>
            </div>
            <h3 className="text-4xl font-black text-zinc-900 dark:text-white leading-none">{stat.value}</h3>
            <p className="text-zinc-500 font-medium mt-2">{stat.title}</p>
          </div>
        ))}
      </div>

      {/* --- LIVE WORKFLOW SECTION --- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Left: Growth Analytics */}
        <div className="lg:col-span-8 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[3rem] p-8">
          <div className="flex justify-between items-center mb-10">
            <h3 className="text-xl font-bold dark:text-white">Registration Flux</h3>
            <select className="bg-zinc-100 dark:bg-zinc-800 border-none rounded-xl text-xs font-bold px-4 py-2 outline-none">
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
            </select>
          </div>

          <div className="flex items-end justify-between h-64 gap-2">
            {[60, 40, 90, 70, 50, 80, 100].map((h, i) => (
              <div key={i} className="flex-1 group relative">
                <div
                  style={{ height: `${h}%` }}
                  className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-2xl group-hover:bg-zinc-900 dark:group-hover:bg-white transition-all duration-500 relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 w-full h-1 bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="text-[10px] font-bold text-center mt-4 text-zinc-400">DAY {i + 1}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Live Security & Activity */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-zinc-900 text-white rounded-[3rem] p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-3 w-3 bg-emerald-500 rounded-full animate-pulse" />
              <h3 className="font-bold">Security Monitor</h3>
            </div>
            <p className="text-zinc-400 text-sm mb-6">AI Search filters are currently scanning 3,210 active job descriptions for compliance.</p>
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs">
                <span>Database Health</span>
                <span className="text-emerald-400">99.9%</span>
              </div>
              <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full w-[99%]" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[3rem] p-8">
            <h3 className="font-bold mb-6 dark:text-white">Recent Events</h3>
            <div className="space-y-6">
              {[
                { name: 'TechFlow', type: 'Employer', time: '2m ago', icon: <CheckCircle2 size={14} /> },
                { name: 'Renz Jericho', type: 'Student', time: '15m ago', icon: <Users size={14} /> },
              ].map((act, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                    {act.icon}
                  </div>
                  <div>
                    <p className="text-sm font-bold dark:text-white">{act.name}</p>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest">{act.type} • {act.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}