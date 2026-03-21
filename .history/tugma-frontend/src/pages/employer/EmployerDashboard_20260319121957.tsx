import { useState } from 'react';
import { 
  Briefcase, Users, Star, Eye, Plus, 
  MoreVertical, ChevronRight, CheckCircle2, Clock, XCircle,
  X, ImageIcon, Check
} from 'lucide-react';

export default function EmployerDashboard() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newSkill, setNewSkill] = useState('');
  const [skills, setSkills] = useState<string[]>(['React', 'PHP']);
  const [allowanceType, setAllowanceType] = useState('With Allowance');

  // --- STATS & MOCK DATA (Kept exactly as you had them) ---
  const stats = [
    { title: 'Active Jobs', value: '12', trend: '+2 this week', icon: <Briefcase size={22} className="text-purple-500" />, bg: 'bg-purple-50 dark:bg-purple-500/10' },
    { title: 'Total Applicants', value: '248', trend: '+18% vs last month', icon: <Users size={22} className="text-blue-500" />, bg: 'bg-blue-50 dark:bg-blue-500/10' },
    { title: 'Shortlisted', value: '34', trend: '4 pending interviews', icon: <Star size={22} className="text-amber-500" />, bg: 'bg-amber-50 dark:bg-amber-500/10' },
    { title: 'Profile Views', value: '1.2k', trend: '+5.4% this week', icon: <Eye size={22} className="text-emerald-500" />, bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
  ];

  const recentApplicants = [
    { id: 1, name: 'Alex Johnson', role: 'UI/UX Designer', time: '2 hours ago', status: 'Pending', avatar: 'A' },
    { id: 2, name: 'Sarah Smith', role: 'Frontend Developer', time: '5 hours ago', status: 'Reviewed', avatar: 'S' },
    { id: 3, name: 'Michael Lee', role: 'Marketing Intern', time: '1 day ago', status: 'Shortlisted', avatar: 'M' },
    { id: 4, name: 'Emily Davis', role: 'Data Analyst', time: '2 days ago', status: 'Rejected', avatar: 'E' },
  ];

  const activeJobs = [
    { id: 1, title: 'Senior React Developer', applicants: 45, daysLeft: 12, status: 'Active' },
    { id: 2, title: 'Product Marketing Manager', applicants: 128, daysLeft: 4, status: 'Urgent' },
    { id: 3, title: 'UX Research Intern', applicants: 75, daysLeft: 21, status: 'Active' },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Shortlisted': return <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-md bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400 uppercase tracking-wider"><Star size={10} /> Shortlisted</span>;
      case 'Reviewed': return <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-md bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 uppercase tracking-wider"><CheckCircle2 size={10} /> Reviewed</span>;
      case 'Rejected': return <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-md bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400 uppercase tracking-wider"><XCircle size={10} /> Rejected</span>;
      default: return <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-md bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 uppercase tracking-wider"><Clock size={10} /> New</span>;
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

  return (
    <div className="space-y-6 fade-in relative">
      
      {/* --- ADD JOB MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-zinc-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl relative custom-scrollbar">
            
            <div className="sticky top-0 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md z-10 p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-zinc-900 dark:text-white flex items-center gap-2">
                  <Briefcase className="text-purple-600" /> Post an OJT / Job Opening
                </h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Cover Image */}
              <div className="border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-2xl p-8 flex flex-col items-center justify-center text-center hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer group">
                <div className="w-16 h-16 bg-purple-100 dark:bg-purple-500/20 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <ImageIcon size={28} className="text-purple-600 dark:text-purple-400" />
                </div>
                <h4 className="font-bold text-zinc-900 dark:text-white">Upload Job / Office Image</h4>
                <p className="text-xs text-zinc-500 mt-1">PNG or JPG up to 5MB.</p>
              </div>

              {/* Title & Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider ml-1">Job Title / Role</label>
                  <input type="text" placeholder="e.g. IT OJT (Web Development)" className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-purple-500/20 outline-none text-sm dark:text-white" />
                </div>
                
                {/* Allowance Section */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider ml-1">Compensation</label>
                  <select 
                    value={allowanceType}
                    onChange={(e) => setAllowanceType(e.target.value)}
                    className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-purple-500/20 outline-none text-sm dark:text-white appearance-none"
                  >
                    <option value="With Allowance">With Allowance</option>
                    <option value="No Allowance">No Allowance (Unpaid OJT)</option>
                  </select>
                </div>

                {/* Amount Input (Only shows if With Allowance is selected) */}
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

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider ml-1">Description & Requirements</label>
                <textarea rows={4} placeholder="Describe the daily tasks, required hours (e.g. 450 hrs), and what they will learn..." className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-purple-500/20 outline-none text-sm dark:text-white resize-none" />
              </div>

              {/* Skills Needed */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider ml-1">Skills Needed (Press Enter)</label>
                <div className="w-full min-h-[50px] p-2 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-800 flex flex-wrap gap-2 focus-within:ring-2 focus-within:ring-purple-500/20">
                  {skills.map(skill => (
                    <span key={skill} className="flex items-center gap-1.5 px-3 py-1 bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300 rounded-lg text-xs font-bold">
                      {skill} <button onClick={() => removeSkill(skill)} className="hover:text-purple-900 dark:hover:text-white"><X size={12} /></button>
                    </span>
                  ))}
                  <input 
                    type="text" 
                    value={newSkill} 
                    onChange={(e) => setNewSkill(e.target.value)} 
                    onKeyDown={addSkill}
                    placeholder="e.g. CodeIgniter..." 
                    className="flex-1 min-w-[120px] bg-transparent outline-none text-sm dark:text-white px-2"
                  />
                </div>
              </div>

            </div>

            <div className="sticky bottom-0 bg-white dark:bg-zinc-900 p-6 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-end gap-3">
              <button onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 rounded-xl text-sm font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                Cancel
              </button>
              <button onClick={() => { setIsModalOpen(false); alert("Job Posted!"); }} className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 flex items-center gap-2 shadow-lg shadow-purple-500/20">
                <Check size={16} /> Post Job
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">Employer Dashboard</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Here is what is happening with your job postings today.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-purple-500/20 transition-all shrink-0">
          <Plus size={18} /> Add Job Posting
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow group">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-2xl ${stat.bg} transition-transform group-hover:scale-110`}>
                {stat.icon}
              </div>
              <div className="text-[11px] font-bold px-2 py-1 rounded-lg text-zinc-500 bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-400">
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

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Column: Recent Applicants */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Recent Applicants</h3>
              <p className="text-sm text-zinc-500">Candidates who just applied.</p>
            </div>
            <button className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1">
              View All <ChevronRight size={14} />
            </button>
          </div>

          <div className="space-y-4 flex-1">
            {recentApplicants.map((applicant) => (
              <div key={applicant.id} className="flex items-center justify-between p-3 rounded-2xl hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors border border-transparent hover:border-zinc-100 dark:hover:border-zinc-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center font-black text-sm shrink-0">
                    {applicant.avatar}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-zinc-900 dark:text-white leading-tight">{applicant.name}</h4>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">{applicant.role}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  {getStatusBadge(applicant.status)}
                  <span className="text-[10px] font-medium text-zinc-400">{applicant.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Active Jobs */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Active Postings</h3>
              <p className="text-sm text-zinc-500">Performance of your open roles.</p>
            </div>
            <button className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors text-zinc-400">
              <MoreVertical size={20} />
            </button>
          </div>

          <div className="space-y-4 flex-1">
            {activeJobs.map((job) => (
              <div key={job.id} className="p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/20 hover:border-purple-200 dark:hover:border-purple-500/30 transition-colors group">
                <div className="flex items-start justify-between mb-3">
                  <h4 className="text-sm font-bold text-zinc-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                    {job.title}
                  </h4>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider ${job.status === 'Urgent' ? 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400' : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'}`}>
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
            ))}
          </div>
          
          <button className="w-full mt-4 py-3 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 text-sm font-bold text-zinc-500 hover:text-purple-600 dark:hover:text-purple-400 hover:border-purple-300 dark:hover:border-purple-500/50 transition-colors bg-transparent">
            Manage All Jobs
          </button>
        </div>

      </div>
    </div>
  );
}