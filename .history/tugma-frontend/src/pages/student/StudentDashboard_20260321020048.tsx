import { useState, useEffect, useMemo } from 'react';
import {
  Briefcase, XOctagon, Eye, Clock,
  Sparkles, Target, TrendingUp, Award,
  CheckCircle2, BarChart3, Loader2, ArrowUpRight
} from 'lucide-react';
import { auth } from '../../firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import StatCard from '../../components/StatCard';

export default function Dashboard() {
  const [uid, setUid] = useState<string | null>(null);
  const [stats, setStats] = useState({
    applied: 0,
    declined: 0,
    viewed: 0,
    pending: 0,
    shortlisted: 0,
    hired: 0,
    reviewed: 0
  });
  const [ojtData, setOjtData] = useState({
    required: 450,
    completed: 0,
    status: 'Not Started'
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUid(user.uid);
        fetchDashboardData(user.uid);
      } else {
        setIsLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchDashboardData = async (userUid: string) => {
    try {
      const [statsRes, profileRes] = await Promise.all([
        fetch(`http://localhost:8080/api/interactions/dashboard/${userUid}`),
        fetch(`http://localhost:8080/api/users/profile/${userUid}`)
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      if (profileRes.ok) {
        const profileData = await profileRes.json();
        if (profileData.ojt) {
          const ojt = typeof profileData.ojt === 'string' ? JSON.parse(profileData.ojt) : profileData.ojt;
          setOjtData({
            required: ojt.requiredHours || 450,
            completed: ojt.completedHours || 0,
            status: ojt.status || 'Actively Looking'
          });
        }
      }
    } catch (error) {
      console.error("Dashboard error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const progressPercentage = Math.min(100, Math.round((ojtData.completed / ojtData.required) * 100));

  if (isLoading) return <div className="flex justify-center items-center h-96"><Loader2 className="animate-spin text-purple-600" size={40} /></div>;

  return (
    <div className="space-y-6 fade-in pb-10">

      {/* WELCOME HERO */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-gradient-to-br from-zinc-900 to-black rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl border border-zinc-800">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <span className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-xs font-bold border border-purple-500/30 flex items-center gap-1">
                <Sparkles size={12} /> AI Enhanced Profile
              </span>
            </div>
            <h1 className="text-4xl font-black mb-2 tracking-tight">System Status: <span className="text-purple-500">Active</span></h1>
            <p className="text-zinc-400 font-medium max-w-md text-lg">You have <span className="text-white font-bold">{stats.viewed}</span> profile views. Your most recent application is currently <span className="text-white underline decoration-purple-500 underline-offset-4">In Review</span>.</p>

            <div className="mt-8 flex flex-wrap gap-4">
              <div className="bg-zinc-800/50 backdrop-blur-md rounded-2xl p-4 border border-zinc-700 min-w-[140px]">
                <p className="text-[10px] uppercase font-black text-zinc-500 mb-1">Conversion Rate</p>
                <p className="text-2xl font-black">{stats.applied > 0 ? Math.round(((stats.shortlisted + stats.hired) / stats.applied) * 100) : 0}%</p>
              </div>
              <div className="bg-zinc-800/50 backdrop-blur-md rounded-2xl p-4 border border-zinc-700 min-w-[140px]">
                <p className="text-[10px] uppercase font-black text-zinc-500 mb-1">Total Apps</p>
                <p className="text-2xl font-black">{stats.applied}</p>
              </div>
            </div>
          </div>
          <div className="absolute right-[-10%] top-[-10%] opacity-20 rotate-12 pointer-events-none">
            <BarChart3 size={300} className="text-purple-600" />
          </div>
        </div>

        {/* OJT PROGRESS GAURE */}
        <div className="lg:col-span-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-zinc-900 dark:text-white flex items-center gap-2 mb-1"><Target className="text-purple-500" size={18} /> OJT Requirement</h3>
            <p className="text-[11px] text-zinc-500 font-medium mb-6">Tracking your graduation eligibility</p>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-end">
              <p className="text-3xl font-black text-zinc-900 dark:text-white">{ojtData.completed} <span className="text-sm font-medium text-zinc-400">/ {ojtData.required}h</span></p>
              <div className="flex flex-col items-end">
                <span className="text-xs font-black text-purple-600 bg-purple-50 dark:bg-purple-500/10 px-2 py-0.5 rounded mb-1">{progressPercentage}%</span>
              </div>
            </div>
            <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-4 rounded-full overflow-hidden p-1 border border-zinc-200 dark:border-zinc-700">
              <div className="bg-gradient-to-r from-purple-600 to-indigo-500 h-full rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(147,51,234,0.3)]" style={{ width: `${progressPercentage}%` }} />
            </div>
            <p className="text-[11px] text-center font-bold text-zinc-400 uppercase tracking-widest">{ojtData.status}</p>
          </div>
        </div>
      </div>

      {/* STAT CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={<Briefcase size={20} />} title="Applied" value={stats.applied.toString()} color="text-blue-500" />
        <StatCard icon={<Award size={20} />} title="Shortlisted" value={stats.shortlisted.toString()} color="text-amber-500" />
        <StatCard icon={<Clock size={20} />} title="Pending" value={(stats.pending + stats.reviewed).toString()} color="text-purple-500" />
        <StatCard icon={<XOctagon size={20} />} title="Declined" value={stats.declined.toString()} color="text-red-500" />
      </div>

      {/* FUNNEL & ANALYTICS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm">
          <h3 className="font-bold text-zinc-900 dark:text-white flex items-center gap-2 mb-8">
            <BarChart3 className="text-blue-500" size={18} /> Application Pipeline
          </h3>
          <div className="space-y-6">
            {[
              { label: 'Total Applications', value: stats.applied, color: 'bg-zinc-200 dark:bg-zinc-700', w: '100%' },
              { label: 'Shortlisted for Interview', value: stats.shortlisted, color: 'bg-amber-400', w: stats.applied > 0 ? `${(stats.shortlisted / stats.applied) * 100}%` : '0%' },
              { label: 'Successfully Hired', value: stats.hired, color: 'bg-emerald-500', w: stats.applied > 0 ? `${(stats.hired / stats.applied) * 100}%` : '0%' },
              { label: 'Applications Declined', value: stats.declined, color: 'bg-red-400', w: stats.applied > 0 ? `${(stats.declined / stats.applied) * 100}%` : '0%' },
            ].map((item) => (
              <div key={item.label} className="group">
                <div className="flex justify-between text-xs font-black uppercase tracking-tight text-zinc-500 mb-2 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors">
                  <span>{item.label}</span>
                  <span>{item.value}</span>
                </div>
                <div className="w-full bg-zinc-50 dark:bg-zinc-800/50 h-3 rounded-full overflow-hidden border border-zinc-100 dark:border-zinc-800">
                  <div className={`${item.color} h-full rounded-full transition-all duration-1000 shadow-sm`} style={{ width: item.w }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* MARKET DATA */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm flex-1">
            <h3 className="font-bold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
              <TrendingUp className="text-emerald-500" size={18} /> Hiring Insights
            </h3>
            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-bold text-zinc-500 uppercase">Top Industry Demand</p>
                <ArrowUpRight size={14} className="text-emerald-500" />
              </div>
              <p className="text-xl font-black text-zinc-900 dark:text-white">Software Development</p>
              <p className="text-xs text-zinc-500 mt-1">Based on 85% of your recent job matches.</p>
            </div>
          </div>

          <div className="bg-purple-600 rounded-3xl p-6 text-white shadow-xl shadow-purple-500/20">
            <h3 className="font-bold mb-2 flex items-center gap-2"><CheckCircle2 size={18} /> Hackathon Ready</h3>
            <p className="text-xs text-purple-100 leading-relaxed mb-4">Your dashboard is now synced with live interactions. Every action taken by an employer will reflect here in real-time.</p>
            <button className="w-full py-2.5 bg-white text-purple-600 rounded-xl text-sm font-black hover:bg-purple-50 transition-colors">
              Print OJT Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}