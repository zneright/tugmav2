import { useState, useEffect } from 'react';
import {
  Briefcase, XOctagon, Eye, Clock,
  Sparkles, Target, TrendingUp, Award,
  CheckCircle2, BarChart3, Loader2, ArrowUpRight, PlayCircle, CheckSquare, FileSignature, Users
} from 'lucide-react';
import { auth } from '../../firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import StatCard from '../../components/StatCard';

export default function Dashboard() {
  const [uid, setUid] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [stats, setStats] = useState({
    applied: 0,
    declined: 0,
    viewed: 0,
    pending: 0,
    shortlisted: 0,
    hired: 0,
    reviewed: 0,
    total_hours: 0 // 🔥 New: Pulled from DTR Logs table
  });

  const [requiredHours, setRequiredHours] = useState(450);

  const [profileInfo, setProfileInfo] = useState({
    topSkill: 'General Skills',
    course: 'Information Technology'
  });

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

        // 🔥 Sync completed hours from the backend's calculation of DTR logs
        setOjtData(prev => ({
          ...prev,
          completed: statsData.total_hours || 0
        }));
      }

      if (profileRes.ok) {
        const profileData = await profileRes.json();

        // Process OJT Data (Status and Requirements)
        if (profileData.ojt) {
          const ojt = typeof profileData.ojt === 'string' ? JSON.parse(profileData.ojt) : profileData.ojt;
          setOjtData(prev => ({
            ...prev,
            required: ojt.requiredHours || 450,
            status: ojt.status || 'Actively Looking'
          }));
        }

        // Process Skills
        let parsedSkills: string[] = [];
        try {
          parsedSkills = typeof profileData.skills === 'string' ? JSON.parse(profileData.skills) : (profileData.skills || []);
        } catch (e) { parsedSkills = []; }

        setProfileInfo({
          course: profileData.course || 'Information Technology',
          topSkill: parsedSkills.length > 0 ? parsedSkills[0] : 'General Skills'
        });
      }
    } catch (error) {
      console.error("Dashboard error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const progressPercentage = Math.min(100, Math.round((ojtData.completed / ojtData.required) * 100)) || 0;
  const activePending = stats.pending + stats.reviewed;

  // 🔥 DYNAMIC UI SWITCH: Detects if the student is in OJT mode
  const isHired = stats.hired > 0 || ojtData.status === 'In Progress' || ojtData.status === 'Completed';

  if (isLoading) return <div className="flex justify-center items-center h-96"><Loader2 className="animate-spin text-purple-600" size={40} /></div>;

  return (
    <div className="space-y-6 fade-in pb-10">

      {/* WELCOME HERO */}
      <div className={`rounded-3xl p-8 sm:p-10 text-white relative overflow-hidden shadow-2xl border transition-all duration-700 ${isHired
        ? 'bg-gradient-to-br from-emerald-900 to-zinc-950 border-emerald-800 shadow-emerald-900/20'
        : 'bg-gradient-to-br from-zinc-900 to-black border-zinc-800'
        }`}>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-4">
              <span className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1 ${isHired ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-purple-500/20 text-purple-400 border-purple-500/30'
                }`}>
                {isHired ? <CheckCircle2 size={12} /> : <Sparkles size={12} />}
                {isHired ? 'OJT Active' : 'Live Dashboard'}
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl font-black mb-3 tracking-tight">
              {isHired ? 'Congratulations! 🎉' : 'System Status: Active'}
            </h1>

            <p className="text-zinc-400 font-medium max-w-xl text-lg leading-relaxed">
              {isHired ? (
                <span>You have officially secured your position! Your priority is now completing your <strong className="text-white font-black">{ojtData.required} hour</strong> requirement.</span>
              ) : activePending > 0 ? (
                <span>You currently have <span className="text-white underline decoration-purple-500 underline-offset-4">{activePending} applications</span> awaiting review by employers.</span>
              ) : (
                <span>You have explored <span className="text-white font-bold">{stats.viewed}</span> jobs. Start applying to secure your OJT!</span>
              )}
            </p>

            {!isHired && (
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
            )}
          </div>

          {/* HIRED CTA BLOCK */}
          {isHired && (
            <div className="shrink-0 bg-emerald-950/50 backdrop-blur-md p-6 rounded-3xl border border-emerald-800 w-full md:w-80 text-center shadow-inner">
              <p className="text-xs font-black text-emerald-500 uppercase tracking-widest mb-2">Completion Status</p>
              <div className="flex items-end justify-center gap-2 mb-6">
                <span className="text-6xl font-black text-white leading-none">{ojtData.completed}</span>
                <span className="text-xl font-bold text-emerald-600 mb-1">/ {ojtData.required}h</span>
              </div>
              <button
                onClick={() => window.location.href = '/ojttracker'}
                className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20 hover:scale-105 active:scale-95"
              >
                <PlayCircle size={20} /> Open OJT Workspace
              </button>
            </div>
          )}
        </div>

        <div className="absolute right-[-10%] top-[-10%] opacity-10 rotate-12 pointer-events-none">
          {isHired ? <CheckCircle2 size={350} className="text-emerald-500" /> : <BarChart3 size={350} className="text-purple-600" />}
        </div>
      </div>

      {isHired ? (
        /* --- WORKSPACE VIEW (HIRED) --- */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in slide-in-from-bottom-4 duration-700">
          <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-sm">
            <h3 className="text-lg font-black text-zinc-900 dark:text-white flex items-center gap-2 mb-6">
              <CheckSquare className="text-emerald-500" size={22} /> Onboarding Checklist
            </h3>
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 opacity-60">
                <CheckCircle2 className="text-emerald-500 shrink-0 mt-0.5" size={24} />
                <div>
                  <h4 className="font-bold text-emerald-900 dark:text-emerald-400 line-through">Secure an OJT Position</h4>
                  <p className="text-xs text-emerald-700 dark:text-emerald-500/80 mt-1">Hired via Tugma Platform.</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                <div className="w-6 h-6 rounded-full border-2 border-zinc-300 dark:border-zinc-700 shrink-0 mt-0.5"></div>
                <div>
                  <h4 className="font-bold text-zinc-900 dark:text-white">Sign MOA & Documents</h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Coordinate with your school admin.</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                <div className="w-6 h-6 rounded-full border-2 border-zinc-300 dark:border-zinc-700 shrink-0 mt-0.5"></div>
                <div>
                  <h4 className="font-bold text-zinc-900 dark:text-white">Daily Log Entry</h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Record your hours in the workspace.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-emerald-600 rounded-3xl p-6 text-white shadow-xl shadow-emerald-500/20">
              <h3 className="font-bold mb-2 flex items-center gap-2"><FileSignature size={18} /> Official DTR</h3>
              <p className="text-xs text-emerald-100 mb-6">Download your certified PDF signature form.</p>
              <button onClick={() => window.location.href = '/ojttracker'} className="w-full py-2.5 bg-white text-emerald-700 rounded-xl text-sm font-black shadow-sm">
                Go to Tracker
              </button>
            </div>
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm">
              <h3 className="font-bold text-zinc-900 dark:text-white mb-4 flex items-center gap-2"><Users className="text-blue-500" size={18} /> Support</h3>
              <button onClick={() => window.location.href = '/messages'} className="w-full py-2 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold transition-colors">
                Message Coordinator
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* --- PIPELINE VIEW (SEARCHING) --- */
        <div className="space-y-6 animate-in slide-in-from-bottom-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard icon={<Briefcase size={20} />} title="Applied" value={stats.applied.toString()} color="text-blue-500" />
            <StatCard icon={<Award size={20} />} title="Shortlisted" value={stats.shortlisted.toString()} color="text-amber-500" />
            <StatCard icon={<Clock size={20} />} title="Pending" value={activePending.toString()} color="text-purple-500" />
            <StatCard icon={<XOctagon size={20} />} title="Declined" value={stats.declined.toString()} color="text-red-500" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm">
              <h3 className="font-bold text-zinc-900 dark:text-white flex items-center gap-2 mb-8">
                <BarChart3 className="text-blue-500" size={18} /> Application Pipeline
              </h3>
              {stats.applied === 0 ? (
                <div className="py-10 text-center">
                  <p className="text-zinc-500 font-bold">No active applications.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {[
                    { label: 'Total Applications', value: stats.applied, color: 'bg-zinc-200 dark:bg-zinc-700', w: '100%' },
                    { label: 'Shortlisted', value: stats.shortlisted, color: 'bg-amber-400', w: `${(stats.shortlisted / stats.applied) * 100}%` },
                    { label: 'Declined', value: stats.declined, color: 'bg-red-400', w: `${(stats.declined / stats.applied) * 100}%` },
                  ].map((item) => (
                    <div key={item.label}>
                      <div className="flex justify-between text-xs font-black uppercase text-zinc-500 mb-2">
                        <span>{item.label}</span>
                        <span>{item.value}</span>
                      </div>
                      <div className="w-full bg-zinc-50 dark:bg-zinc-800 h-3 rounded-full overflow-hidden">
                        <div className={`${item.color} h-full rounded-full transition-all duration-1000`} style={{ width: item.w }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="lg:col-span-5 flex flex-col gap-6">
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm flex-1">
                <h3 className="font-bold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
                  <TrendingUp className="text-emerald-500" size={18} /> Highlights
                </h3>
                <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
                  <p className="text-xs font-bold text-zinc-500 uppercase">Top Skill</p>
                  <p className="text-xl font-black text-zinc-900 dark:text-white capitalize">{profileInfo.topSkill}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}