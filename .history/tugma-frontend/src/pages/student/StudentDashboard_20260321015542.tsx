import { useState, useEffect } from 'react';
import {
  Briefcase, XOctagon, Eye, Clock,
  ChevronRight, Sparkles, Target,
  TrendingUp, Award, CheckCircle2,
  BarChart3, Calendar
} from 'lucide-react';
import { auth } from '../../firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import StatCard from '../../components/StatCard';

export default function Dashboard() {
  const [uid, setUid] = useState<string | null>(null);
  const [stats, setStats] = useState({
    applied: 0,
    declined: 0,
    views: 0,
    pending: 0,
    shortlisted: 0
  });
  const [ojtData, setOjtData] = useState({
    required: 450,
    completed: 0,
    status: 'Not Started'
  });
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUid(user.uid);
        fetchDashboardData(user.uid);
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchDashboardData = async (userUid: string) => {
    try {
      // Fetch stats and activities from your existing interactions endpoint
      const res = await fetch(`http://localhost:8080/api/interactions/student/${userUid}`);
      const profileRes = await fetch(`http://localhost:8080/api/users/profile/${userUid}`);

      if (res.ok && profileRes.ok) {
        const interData = await res.json();
        const profileData = await profileRes.json();

        // 1. Calculate Stats
        // Note: You might need a more specific backend endpoint for detailed status counts
        setStats({
          applied: interData.applied?.length || 0,
          views: interData.viewed?.length || 0,
          declined: 0, // Mocked until status 'Rejected' is counted
          pending: interData.applied?.length || 0,
          shortlisted: 0
        });

        // 2. OJT Progress
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
      console.error("Dashboard fetch error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const progressPercentage = Math.round((ojtData.completed / ojtData.required) * 100);

  return (
    <div className="space-y-6 fade-in pb-10">

      {/* --- TOP ROW: WELCOME & PROGRESS --- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-gradient-to-br from-purple-600 to-indigo-700 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl shadow-purple-500/20">
          <div className="relative z-10">
            <h1 className="text-3xl font-black mb-2">Welcome back! 👋</h1>
            <p className="text-purple-100 font-medium max-w-md">Your profile is getting noticed. You have {stats.views} company views this week.</p>

            <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10">
                <p className="text-[10px] uppercase font-bold text-purple-200">Match Accuracy</p>
                <p className="text-xl font-black">92%</p>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10">
                <p className="text-[10px] uppercase font-bold text-purple-200">Response Rate</p>
                <p className="text-xl font-black">78%</p>
              </div>
            </div>
          </div>
          <Sparkles className="absolute right-[-20px] top-[-20px] w-64 h-64 text-white/5 rotate-12" />
        </div>

        {/* OJT Progress Analytics */}
        <div className="lg:col-span-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <Target className="text-purple-500" size={18} /> OJT Goal
            </h3>
            <span className="text-[10px] font-black px-2 py-1 bg-purple-50 text-purple-600 rounded-md uppercase">Year 2026</span>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-end">
              <div>
                <p className="text-2xl font-black text-zinc-900 dark:text-white">{ojtData.completed} <span className="text-sm font-medium text-zinc-400">/ {ojtData.required} hrs</span></p>
              </div>
              <p className="text-sm font-bold text-purple-600">{progressPercentage}%</p>
            </div>

            <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-3 rounded-full overflow-hidden">
              <div
                className="bg-purple-600 h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_12px_rgba(147,51,234,0.4)]"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>

            <p className="text-xs text-zinc-500 font-medium leading-relaxed">
              Based on your current pace, you will complete your OJT by <span className="text-zinc-900 dark:text-zinc-200 font-bold">June 12, 2026</span>.
            </p>
          </div>
        </div>
      </div>

      {/* --- MIDDLE ROW: DETAILED STATS --- */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={<Briefcase size={20} />} title="Jobs Applied" value={stats.applied.toString()} color="text-blue-500" />
        <StatCard icon={<Award size={20} />} title="Shortlisted" value="3" color="text-amber-500" />
        <StatCard icon={<Clock size={20} />} title="In Review" value={stats.pending.toString()} color="text-purple-500" />
        <StatCard icon={<CheckCircle2 size={20} />} title="Hired" value="0" color="text-emerald-500" />
      </div>

      {/* --- BOTTOM ROW: ANALYSIS & LISTS --- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Application Funnel Chart (Visualized with HTML/CSS) */}
        <div className="lg:col-span-7 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <BarChart3 className="text-blue-500" size={18} /> Application Funnel
              </h3>
              <p className="text-xs text-zinc-500 mt-1">Track your conversion rate through hiring stages.</p>
            </div>
          </div>

          <div className="space-y-5">
            {[
              { label: 'Applications Sent', value: stats.applied, color: 'bg-blue-500', width: '100%' },
              { label: 'Profile Viewed', value: stats.views, color: 'bg-indigo-500', width: '75%' },
              { label: 'Shortlisted', value: 3, color: 'bg-purple-500', width: '40%' },
              { label: 'Interviews', value: 1, color: 'bg-pink-500', width: '20%' },
            ].map((item) => (
              <div key={item.label} className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-zinc-600 dark:text-zinc-400">{item.label}</span>
                  <span className="text-zinc-900 dark:text-white">{item.value}</span>
                </div>
                <div className="w-full bg-zinc-50 dark:bg-zinc-800/50 h-2 rounded-lg">
                  <div className={`${item.color} h-full rounded-lg transition-all duration-1000`} style={{ width: item.width }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Skill Gap Analysis */}
        <div className="lg:col-span-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm">
          <h3 className="font-bold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
            <TrendingUp className="text-emerald-500" size={18} /> Trending Skills
          </h3>
          <p className="text-xs text-zinc-500 mb-6">Skills employers are looking for in your matched roles.</p>

          <div className="space-y-4">
            {[
              { skill: 'React.js', demand: 'High', color: 'text-blue-500', bg: 'bg-blue-50' },
              { skill: 'TypeScript', demand: 'Growth', color: 'text-indigo-500', bg: 'bg-indigo-50' },
              { skill: 'Tailwind CSS', demand: 'High', color: 'text-emerald-500', bg: 'bg-emerald-50' },
              { skill: 'Figma', demand: 'Moderate', color: 'text-purple-500', bg: 'bg-purple-50' },
            ].map((item) => (
              <div key={item.skill} className="flex items-center justify-between p-3 rounded-2xl border border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${item.color.replace('text', 'bg')}`} />
                  <span className="text-sm font-bold text-zinc-700 dark:text-zinc-200">{item.skill}</span>
                </div>
                <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-md ${item.bg} ${item.color} dark:bg-opacity-10`}>
                  {item.demand}
                </span>
              </div>
            ))}
          </div>

          <button className="w-full mt-6 py-3 text-xs font-bold text-zinc-500 border border-dashed border-zinc-300 dark:border-zinc-700 rounded-2xl hover:border-purple-500 hover:text-purple-500 transition-all">
            Improve your skill match +
          </button>
        </div>

      </div>
    </div>
  );
}