import { useState, useEffect } from 'react';
import {
  Briefcase, Users, Star, Plus,
  MoreVertical, ChevronRight, CheckCircle2, Clock, XCircle,
  X, ImageIcon, Check, Loader2
} from 'lucide-react';
import { auth } from '../../firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';

export default function EmployerDashboard() {
  const [uid, setUid] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newJobTitle, setNewJobTitle] = useState('');
  const [newSkill, setNewSkill] = useState('');
  const [skills, setSkills] = useState<string[]>(['React', 'PHP']);
  const [allowanceType, setAllowanceType] = useState('With Allowance');

  const [dashboardStats, setDashboardStats] = useState({
    activeJobs: 0,
    totalApplicants: 0,
    shortlisted: 0,
    hired: 0
  });

  const [recentApplicants, setRecentApplicants] = useState<any[]>([]);
  const [activeJobsList, setActiveJobsList] = useState<any[]>([]);

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

  const fetchDashboardData = async (employerUid: string) => {
    try {
      const [jobsRes, appsRes] = await Promise.all([
        fetch(`http://localhost:8080/api/jobs/employer/${employerUid}`),
        fetch(`http://localhost:8080/api/applications/employer/${employerUid}`)
      ]);

      let jobsData = [];
      let appsData = [];

      if (jobsRes.ok) jobsData = await jobsRes.json();
      if (appsRes.ok) appsData = await appsRes.json();

      const activeCount = jobsData.filter((j: any) => j.status === 'Active' || j.status === 'Urgent').length;
      const shortCount = appsData.filter((a: any) => a.status === 'Shortlisted').length;
      const hiredCount = appsData.filter((a: any) => a.status === 'Hired').length;

      setDashboardStats({
        activeJobs: activeCount,
        totalApplicants: appsData.length,
        shortlisted: shortCount,
        hired: hiredCount
      });

      const sortedApps = [...appsData].sort((a, b) => new Date(b.applied_at).getTime() - new Date(a.applied_at).getTime());
      const formattedRecent = sortedApps.slice(0, 4).map(app => ({
        id: app.application_id,
        name: `${app.first_name || 'Unknown'} ${app.last_name || ''}`,
        role: app.job_title,
        time: getTimeAgo(app.applied_at),
        status: app.status || 'New Applicant',
        avatar: app.first_name ? app.first_name.charAt(0).toUpperCase() : 'U'
      }));
      setRecentApplicants(formattedRecent);

      const activeOnly = jobsData.filter((j: any) => j.status === 'Active' || j.status === 'Urgent');
      const formattedJobs = activeOnly.slice(0, 3).map((job: any) => {
        const appCount = appsData.filter((a: any) => a.job_id === job.id).length;

        let daysLeftVal = '∞';
        if (job.deadline) {
          const diffTime = new Date(job.deadline).getTime() - new Date().getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          daysLeftVal = diffDays > 0 ? diffDays.toString() : '0';
        }

        return {
          id: job.id,
          title: job.title,
          applicants: appCount,
          daysLeft: daysLeftVal,
          status: job.status
        };
      });
      setActiveJobsList(formattedJobs);

    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Record system events
  const logSystemEvent = (action: string, details: string) => {
    if (!uid) return;
    fetch('http://localhost:8080/api/audit/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid, action, details })
    }).catch(err => console.error("Audit log failed (silent):", err));
  };

  const handlePostJob = () => {
    if (!newJobTitle.trim()) {
      alert("Please enter a Job Title.");
      return;
    }

    // Log action
    logSystemEvent('Created Job Posting', `Posted new role: "${newJobTitle}" (${allowanceType})`);

    alert("Job Posted!");
    setIsModalOpen(false);
    setNewJobTitle('');
  };

  const getTimeAgo = (dateString: string) => {
    if (!dateString) return 'Recently';
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hr${diffInHours > 1 ? 's' : ''} ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Shortlisted': return <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-md bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400 uppercase tracking-wider"><Star size={10} /> Shortlisted</span>;
      case 'Reviewed': return <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-md bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 uppercase tracking-wider"><CheckCircle2 size={10} /> Reviewed</span>;
      case 'Rejected': return <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-md bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400 uppercase tracking-wider"><XCircle size={10} /> Rejected</span>;
      case 'Hired': return <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-md bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 uppercase tracking-wider"><Briefcase size={10} /> Hired</span>;
      default: return <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-md bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 uppercase tracking-wider"><Clock size={10} /> New</span>;
    }
  };

  const addSkill = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newSkill.trim() !== '') {
      e.preventDefault();
      setSkills([...skills, newSkill.trim()]);
      setNewSkill('');
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setSkills(skills.filter(s => s !== skillToRemove));
  };

  const statCards = [
    { title: 'Active Jobs', value: dashboardStats.activeJobs.toString(), trend: 'Currently Open', icon: <Briefcase size={18} className="text-purple-500" />, bg: 'bg-purple-50 dark:bg-purple-500/10' },
    { title: 'Total Applicants', value: dashboardStats.totalApplicants.toString(), trend: 'All Time', icon: <Users size={18} className="text-blue-500" />, bg: 'bg-blue-50 dark:bg-blue-500/10' },
    { title: 'Shortlisted', value: dashboardStats.shortlisted.toString(), trend: 'Pending Interviews', icon: <Star size={18} className="text-amber-500" />, bg: 'bg-amber-50 dark:bg-amber-500/10' },
    { title: 'Successfully Hired', value: dashboardStats.hired.toString(), trend: 'Onboarded', icon: <CheckCircle2 size={18} className="text-emerald-500" />, bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
  ];

  if (isLoading) return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-purple-600" size={40} /></div>;

  return (
    <div className="space-y-6 fade-in relative pb-10">

      {/* ADD JOB MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-zinc-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl relative custom-scrollbar flex flex-col">

            <div className="sticky top-0 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md z-10 p-4 sm:p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
              <h3 className="text-lg sm:text-xl font-black text-zinc-900 dark:text-white flex items-center gap-2">
                <Briefcase className="text-purple-600" size={20} /> Post an OJT / Job
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-6 flex-1">
              <div className="border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-2xl p-6 sm:p-8 flex flex-col items-center justify-center text-center hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer group">
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-purple-100 dark:bg-purple-500/20 rounded-full flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform">
                  <ImageIcon size={24} className="text-purple-600 dark:text-purple-400" />
                </div>
                <h4 className="font-bold text-sm sm:text-base text-zinc-900 dark:text-white">Upload Job / Office Image</h4>
                <p className="text-xs text-zinc-500 mt-1">PNG or JPG up to 5MB.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider ml-1">Job Title / Role</label>
                  <input
                    type="text"
                    value={newJobTitle}
                    onChange={(e) => setNewJobTitle(e.target.value)}
                    placeholder="e.g. IT OJT (Web Development)"
                    className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-purple-500/20 outline-none text-sm dark:text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider ml-1">Compensation</label>
                  <select
                    value={allowanceType}
                    onChange={(e) => setAllowanceType(e.target.value)}
                    className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-purple-500/20 outline-none text-sm dark:text-white appearance-none cursor-pointer"
                  >
                    <option value="With Allowance">With Allowance</option>
                    <option value="No Allowance">No Allowance (Unpaid OJT)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className={`text-xs font-bold uppercase tracking-wider ml-1 ${allowanceType === 'No Allowance' ? 'text-zinc-300 dark:text-zinc-600' : 'text-zinc-400'}`}>Allowance Amount</label>
                  <input
                    type="text"
                    placeholder={allowanceType === 'No Allowance' ? 'N/A' : 'e.g. ₱300/day or ₱5000/mo'}
                    disabled={allowanceType === 'No Allowance'}
                    className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-purple-500/20 outline-none text-sm dark:text-white disabled:opacity-50"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider ml-1">Description & Requirements</label>
                <textarea rows={4} placeholder="Describe the daily tasks, required hours (e.g. 450 hrs), and what they will learn..." className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-purple-500/20 outline-none text-sm dark:text-white resize-none" />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider ml-1">Skills Needed (Press Enter)</label>
                <div className="w-full min-h-[50px] p-2 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-800 flex flex-wrap gap-2 focus-within:ring-2 focus-within:ring-purple-500/20">
                  {skills.map(skill => (
                    <span key={skill} className="flex items-center gap-1.5 px-3 py-1.5 sm:py-1 bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300 rounded-lg text-xs font-bold">
                      {skill} <button onClick={() => removeSkill(skill)}><X size={12} className="hover:text-purple-900 dark:hover:text-white" /></button>
                    </span>
                  ))}
                  <input
                    type="text"
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyDown={addSkill}
                    placeholder="e.g. CodeIgniter..."
                    className="flex-1 min-w-[120px] bg-transparent outline-none text-sm dark:text-white px-2 py-1"
                  />
                </div>
              </div>

            </div>

            <div className="sticky bottom-0 bg-white dark:bg-zinc-900 p-4 sm:p-6 border-t border-zinc-100 dark:border-zinc-800 flex flex-col-reverse sm:flex-row items-center justify-end gap-3 shrink-0">
              <button onClick={() => setIsModalOpen(false)} className="w-full sm:w-auto px-6 py-3 sm:py-2.5 rounded-xl text-sm font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                Cancel
              </button>
              <button onClick={handlePostJob} className="w-full sm:w-auto px-6 py-3 sm:py-2.5 rounded-xl text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20 transition-transform active:scale-95">
                <Check size={16} /> Post Job
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header  */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">Employer Dashboard</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Here is what is happening with your job postings today.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="w-full sm:w-auto flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-5 py-3 sm:py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-purple-500/20 transition-all shrink-0 active:scale-95">
          <Plus size={18} /> Add Job Posting
        </button>
      </div>

      {/* STATS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <div key={index} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow group flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2 rounded-xl ${stat.bg} transition-transform group-hover:scale-110`}>
                {stat.icon}
              </div>
              <div className="text-[10px] font-bold px-2 py-1 rounded-md text-zinc-500 bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-400">
                {stat.trend}
              </div>
            </div>
            <div>
              <h4 className="text-2xl font-black text-zinc-900 dark:text-white mb-0.5 tracking-tight">{stat.value}</h4>
              <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400">{stat.title}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Left Column: Recent Applicants */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Recent Applicants</h3>
              <p className="text-sm text-zinc-500">Candidates who just applied.</p>
            </div>
            <button onClick={() => window.location.href = '/employer/applicants'} className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 shrink-0">
              View All <ChevronRight size={14} />
            </button>
          </div>

          <div className="space-y-3 sm:space-y-4 flex-1">
            {recentApplicants.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-zinc-400">
                <Users size={32} className="mb-2 opacity-50" />
                <p className="text-sm font-bold">No applicants yet.</p>
              </div>
            ) : (
              recentApplicants.map((applicant) => (
                <div
                  key={applicant.id}
                  className={`flex items-center justify-between p-3 rounded-2xl transition-colors border ${applicant.status === 'Hired'
                    ? 'bg-emerald-50/50 border-emerald-100 dark:bg-emerald-500/10 dark:border-emerald-500/20 shadow-sm'
                    : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50 border-transparent hover:border-zinc-100 dark:hover:border-zinc-800'
                    }`}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0 pr-2">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm shrink-0 ${applicant.status === 'Hired'
                      ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400'
                      : 'bg-purple-100 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400'
                      }`}>
                      {applicant.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-zinc-900 dark:text-white leading-tight truncate">{applicant.name}</h4>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">{applicant.role}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0 ml-2">
                    {getStatusBadge(applicant.status)}
                    <span className="text-[10px] font-medium text-zinc-400">{applicant.time}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Active Jobs */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Active Postings</h3>
              <p className="text-sm text-zinc-500">Performance of your open roles.</p>
            </div>
            <button onClick={() => window.location.href = '/employer/jobs'} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors text-zinc-400 shrink-0">
              <MoreVertical size={20} />
            </button>
          </div>

          <div className="space-y-3 sm:space-y-4 flex-1">
            {activeJobsList.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-zinc-400">
                <Briefcase size={32} className="mb-2 opacity-50" />
                <p className="text-sm font-bold">No active jobs posted.</p>
              </div>
            ) : (
              activeJobsList.map((job) => (
                <div key={job.id} className="p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/20 hover:border-purple-200 dark:hover:border-purple-500/30 transition-colors group">
                  <div className="flex items-start justify-between mb-3 gap-2">
                    <h4 className="text-sm font-bold text-zinc-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors line-clamp-2">
                      {job.title}
                    </h4>
                    <span className={`shrink-0 text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider ${job.status === 'Urgent' ? 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400' : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'}`}>
                      {job.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Applicants</span>
                      <span className="text-sm font-black text-zinc-900 dark:text-white flex items-center gap-1.5">
                        <Users size={14} className="text-blue-500" /> {job.applicants}
                      </span>
                    </div>
                    <div className="w-px h-8 bg-zinc-200 dark:bg-zinc-800"></div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Days Left</span>
                      <span className="text-sm font-black text-zinc-900 dark:text-white flex items-center gap-1.5">
                        <Clock size={14} className="text-amber-500" /> {job.daysLeft}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <button onClick={() => window.location.href = '/employer/jobs'} className="w-full mt-4 py-3 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 text-sm font-bold text-zinc-500 hover:text-purple-600 dark:hover:text-purple-400 hover:border-purple-300 dark:hover:border-purple-500/50 transition-colors bg-transparent">
            Manage All Jobs
          </button>
        </div>

      </div>
    </div>
  );
}