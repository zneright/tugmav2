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

  const [profileInfo, setProfileInfo] = useState({
    topSkill: 'Loading...',
    course: 'Student'
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

        // Process OJT Data
        if (profileData.ojt) {
          const ojt = typeof profileData.ojt === 'string' ? JSON.parse(profileData.ojt) : profileData.ojt;
          setOjtData(prev => ({
            ...prev,
            completed: statsData.total_hours || 0
          }));
        }

        // Process Skills for Insights
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

  // 🔥 THE MAGIC BOOLEAN: Changes the whole UI if they are hired 🔥
  const isHired = stats.hired > 0 || ojtData.status === 'In Progress' || ojtData.status === 'Completed';

  if (isLoading) return <div className="flex justify-center items-center h-96"><Loader2 className="animate-spin text-purple-600" size={40} /></div>;

  return (
    <div className="space-y-6 fade-in pb-10">

      {/* WELCOME HERO */}
      <div className={`rounded-3xl p-8 sm:p-10 text-white relative overflow-hidden shadow-2xl border transition-colors duration-700 ${isHired
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
                <span>You have officially secured your position! Your main priority now is completing your <strong className="text-white font-black">{ojtData.required} hour</strong> requirement. Let's get to work!</span>
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

          {/* 🔥 IF HIRED: Show a Massive Call to Action in the Hero 🔥 */}
          {isHired && (
            <div className="shrink-0 bg-emerald-950/50 backdrop-blur-md p-6 rounded-3xl border border-emerald-800 w-full md:w-auto text-center shadow-inner">
              <p className="text-xs font-black text-emerald-500 uppercase tracking-widest mb-2">Current Progress</p>
              <div className="flex items-end justify-center gap-2 mb-6">
                <span className="text-6xl font-black text-white leading-none">{ojtData.completed}</span>
                <span className="text-xl font-bold text-emerald-600 mb-1">/ {ojtData.required}h</span>
              </div>
              <button
                onClick={() => window.location.href = '/ojttracker'} // 👈 REMOVED /student/ and FIXED hyphen
                className="w-full mt-4 py-3 bg-emerald-600 ...">
                <PlayCircle size={18} /> Launch OJT Workspace
              </button>
            </div>
          )}
        </div>

        <div className="absolute right-[-10%] top-[-10%] opacity-10 rotate-12 pointer-events-none">
          {isHired ? <CheckCircle2 size={350} className="text-emerald-500" /> : <BarChart3 size={350} className="text-purple-600" />}
        </div>
      </div>

      {/* ----------------------- */}
      {/* HIRED WORKSPACE VIEW    */}
      {/* ----------------------- */}
      {isHired ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in slide-in-from-bottom-4 duration-700">

          {/* Action Plan */}
          <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-sm">
            <h3 className="text-lg font-black text-zinc-900 dark:text-white flex items-center gap-2 mb-6">
              <CheckSquare className="text-emerald-500" size={22} /> Onboarding Checklist
            </h3>

            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 opacity-60">
                <CheckCircle2 className="text-emerald-500 shrink-0 mt-0.5" size={24} />
                <div>
                  <h4 className="font-bold text-emerald-900 dark:text-emerald-400 line-through">Secure an OJT Position</h4>
                  <p className="text-xs text-emerald-700 dark:text-emerald-500/80 mt-1">You've successfully been hired by a partner employer.</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 hover:border-emerald-200 dark:hover:border-emerald-500/30 transition-colors">
                <div className="w-6 h-6 rounded-full border-2 border-zinc-300 dark:border-zinc-700 shrink-0 mt-0.5"></div>
                <div>
                  <h4 className="font-bold text-zinc-900 dark:text-white">Sign Memorandum of Agreement (MOA)</h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Ensure your university coordinator and employer have signed the official MOA before starting.</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 hover:border-emerald-200 dark:hover:border-emerald-500/30 transition-colors">
                <div className="w-6 h-6 rounded-full border-2 border-zinc-300 dark:border-zinc-700 shrink-0 mt-0.5"></div>
                <div>
                  <h4 className="font-bold text-zinc-900 dark:text-white">Log Your First Daily Time Record</h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Once you start, open the OJT Workspace to log your first set of hours and tasks.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-6">
            <div className="bg-emerald-600 rounded-3xl p-6 text-white shadow-xl shadow-emerald-500/20">
              <h3 className="font-bold mb-2 flex items-center gap-2"><FileSignature size={18} /> Generate DTR</h3>
              <p className="text-xs text-emerald-100 leading-relaxed mb-6">Need to submit your hours to your coordinator? Generate an official PDF signature form instantly.</p>
              <button
                onClick={() => window.location.href = '/ojttracker'} // 👈 FIXED HERE TOO
                className={`w-full py-2.5 bg-white ...`}>
                {isHired ? 'Print OJT DTR Report' : 'Go to OJT Tracker'}
              </button>
            </div>

            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm">
              <h3 className="font-bold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
                <Users className="text-blue-500" size={18} /> Support
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">If you encounter issues with your employer or hours, contact your coordinator.</p>
              <button onClick={() => window.location.href = '/student/messages'} className="w-full py-2 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                Message Coordinator
              </button>
            </div>
          </div>

        </div>

      ) : (

        /* ----------------------- */
        /* JOB HUNTING VIEW        */
        /* ----------------------- */
        <div className="space-y-6 animate-in slide-in-from-bottom-4">
          {/* STAT CARDS */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard icon={<Briefcase size={20} />} title="Applied" value={stats.applied.toString()} color="text-blue-500" />
            <StatCard icon={<Award size={20} />} title="Shortlisted" value={stats.shortlisted.toString()} color="text-amber-500" />
            <StatCard icon={<Clock size={20} />} title="Pending" value={activePending.toString()} color="text-purple-500" />
            <StatCard icon={<XOctagon size={20} />} title="Declined" value={stats.declined.toString()} color="text-red-500" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

            {/* FUNNEL */}
            <div className="lg:col-span-7 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm">
              <h3 className="font-bold text-zinc-900 dark:text-white flex items-center gap-2 mb-8">
                <BarChart3 className="text-blue-500" size={18} /> Application Pipeline
              </h3>

              {stats.applied === 0 ? (
                <div className="py-10 text-center text-zinc-500">
                  <BarChart3 size={40} className="mx-auto text-zinc-300 dark:text-zinc-700 mb-3" />
                  <p className="font-bold text-zinc-700 dark:text-zinc-300">No data yet.</p>
                  <p className="text-sm mt-1">Submit your first application to see your funnel.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {[
                    { label: 'Total Applications', value: stats.applied, color: 'bg-zinc-200 dark:bg-zinc-700', w: '100%' },
                    { label: 'Shortlisted for Interview', value: stats.shortlisted, color: 'bg-amber-400', w: `${(stats.shortlisted / stats.applied) * 100}%` },
                    { label: 'Applications Declined', value: stats.declined, color: 'bg-red-400', w: `${(stats.declined / stats.applied) * 100}%` },
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
              )}
            </div>

            {/* HIGHLIGHTS */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm flex-1">
                <h3 className="font-bold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
                  <TrendingUp className="text-emerald-500" size={18} /> Profile Highlights
                </h3>
                <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-xs font-bold text-zinc-500 uppercase">Your Top Skill</p>
                    <ArrowUpRight size={14} className="text-emerald-500" />
                  </div>
                  <p className="text-xl font-black text-zinc-900 dark:text-white capitalize">{profileInfo.topSkill}</p>
                  <p className="text-xs text-zinc-500 mt-1">Make sure to highlight this in interviews.</p>
                </div>
              </div>

              <div className="bg-purple-600 rounded-3xl p-6 text-white shadow-xl shadow-purple-500/20">
                <h3 className="font-bold mb-2 flex items-center gap-2"><CheckCircle2 size={18} /> Everything is Live</h3>
                <p className="text-xs text-white/80 leading-relaxed">
                  Your dashboard is fully synced. Every time an employer reviews your profile or shortlists you, these numbers update instantly.
                </p>
              </div>
            </div>
          </div>
        </div>
      )
      }

    </div >
  );
}