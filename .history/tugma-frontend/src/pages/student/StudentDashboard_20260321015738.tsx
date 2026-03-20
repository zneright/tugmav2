import { useState, useEffect, useMemo } from 'react';
import {
  Briefcase, XOctagon, Eye, Clock,
  Sparkles, Target, TrendingUp, Award,
  CheckCircle2, BarChart3, Loader2
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
    hired: 0
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

      {/* TOP ROW: WELCOME & PROGRESS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-gradient-to-br from-purple-600 to-indigo-700 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl shadow-purple-500/20">
          <div className="relative z-10">
            <h1 className="text-3xl font-black mb-2">Welcome back! 👋</h1>
            <p className="text-purple-100 font-medium max-w-md">Your profile is active. You have {stats.viewed} company views recorded.</p>

            <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10">
                <p className="text-[10px] uppercase font-bold text-purple-200">Response Rate</p>
                <p className="text-xl font-black">{stats.applied > 0 ? Math.round((stats.shortlisted / stats.applied) * 100) : 0}%</p>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10">
                <p className="text-[10px] uppercase font-bold text-purple-200">Applications</p>
                <p className="text-xl font-black">{stats.applied}</p>
              </div>
            </div>
          </div>
          <Sparkles className="absolute right-[-20px] top-[-20px] w-64 h-64 text-white/5 rotate-12" />
        </div>

        <div className="lg:col-span-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-zinc-900 dark:text-white flex items-center gap-2"><Target className="text-purple-500" size={18} /> OJT Goal</h3>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-end">
              <p className="text-2xl font-black text-zinc-900 dark:text-white">{ojtData.completed} <span className="text-sm font-medium text-zinc-400">/ {ojtData.required} hrs</span></p>
              <p className="text-sm font-bold text-purple-600">{progressPercentage}%</p>
            </div>
            <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-3 rounded-full overflow-hidden">
              <div className="bg-purple-600 h-full rounded-full transition-all duration-1000" style={{ width: `${progressPercentage}%` }} />
            </div>
            <p className="text-xs text-zinc-500 font-medium italic">"{ojtData.status}"</p>
          </div>
        </div>
      </div>

      {/* MIDDLE ROW: STAT CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={<Briefcase size={20} />} title="Applied" value={stats.applied.toString()} color="text-blue-500" />
        <StatCard icon={<Award size={20} />} title="Shortlisted" value={stats.shortlisted.toString()} color="text-amber-500" />
        <StatCard icon={<Clock size={20} />} title="Pending" value={stats.pending.toString()} color="text-purple-500" />
        <StatCard icon={<CheckCircle2 size={20} />} title="Hired" value={stats.hired.toString()} color="text-emerald-500" />
      </div>

      {/* BOTTOM ROW: VISUAL ANALYTICS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm">
          <h3 className="font-bold text-zinc-900 dark:text-white flex items-center gap-2 mb-6">
            <BarChart3 className="text-blue-500" size={18} /> Hiring Funnel
          </h3>
          <div className="space-y-5">
            {[
              { label: 'Applications', value: stats.applied, color: 'bg-blue-500', w: '100%' },
              { label: 'Shortlisted', value: stats.shortlisted, color: 'bg-amber-500', w: stats.applied > 0 ? `${(stats.shortlisted / stats.applied) * 100}%` : '0%' },
              { label: 'Hired', value: stats.hired, color: 'bg-emerald-500', w: stats.applied > 0 ? `${(stats.hired / stats.applied) * 100}%` : '0%' },
            ].map((item) => (
              <div key={item.label} className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-zinc-500">{item.label}</span>
                  <span>{item.value}</span>
                </div>
                <div className="w-full bg-zinc-50 dark:bg-zinc-800 h-2 rounded-full">
                  <div className={`${item.color} h-full rounded-full transition-all duration-1000`} style={{ width: item.w }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm">
          <h3 className="font-bold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
            <TrendingUp className="text-emerald-500" size={18} /> Market Readiness
          </h3>
          <p className="text-xs text-zinc-500 mb-6">Your profile alignment with current industry demands.</p>
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-purple-50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-800/50">
              <p className="text-xs font-bold text-purple-600 mb-1 uppercase">Top Recommended Skill</p>
              <p className="text-lg font-black text-purple-900 dark:text-purple-300">TypeScript / Next.js</p>
              <p className="text-[10px] text-purple-500 mt-1">Matched in 80% of your viewed jobs</p>
            </div>
            <button className="w-full py-3 text-xs font-bold text-zinc-600 bg-zinc-50 dark:bg-zinc-800 rounded-xl hover:bg-zinc-100 transition-colors">
              View Detailed Skill Analysis
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}