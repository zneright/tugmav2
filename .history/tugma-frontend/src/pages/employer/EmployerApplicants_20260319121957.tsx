import { useState } from 'react';
import { 
  Users, Search, Filter, Download, MessageSquare, 
  CheckCircle2, XCircle, Star, MoreVertical, Briefcase 
} from 'lucide-react';

export default function EmployerApplicants() {
  // Mock Applicants
  const [applicants] = useState([
    { id: 1, name: 'Alex Johnson', role: 'UI/UX Designer', university: 'State University', match: '95%', applied: '2 hours ago', status: 'Pending', avatar: 'A', color: 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400' },
    { id: 2, name: 'Sarah Smith', role: 'Frontend Developer', university: 'Tech Institute', match: '88%', applied: '1 day ago', status: 'Shortlisted', avatar: 'S', color: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400' },
    { id: 3, name: 'Michael Lee', role: 'Marketing Intern', university: 'Business College', match: '72%', applied: '3 days ago', status: 'Reviewed', avatar: 'M', color: 'bg-purple-100 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400' },
    { id: 4, name: 'Emily Davis', role: 'Data Analyst', university: 'Science Academy', match: '45%', applied: '1 week ago', status: 'Rejected', avatar: 'E', color: 'bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400' },
  ]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Shortlisted': return <span className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400"><Star size={12} /> Shortlisted</span>;
      case 'Reviewed': return <span className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400"><CheckCircle2 size={12} /> Reviewed</span>;
      case 'Rejected': return <span className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"><XCircle size={12} /> Rejected</span>;
      default: return <span className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">New Applicant</span>;
    }
  };

  return (
    <div className="space-y-6 fade-in">
      
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-zinc-900 dark:text-white flex items-center gap-3">
            <Users className="text-purple-600" /> Applicant Tracking
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Review resumes, shortlist candidates, and send messages.</p>
        </div>
        <button className="flex items-center gap-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm transition-all shrink-0">
          <Download size={18} /> Export CSV
        </button>
      </div>

      {/* Control Bar (Filters & Search) */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm flex flex-col lg:flex-row gap-4">
        {/* Job Dropdown */}
        <div className="relative min-w-[200px]">
          <Briefcase size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <select className="w-full pl-9 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all dark:text-white text-sm appearance-none font-medium">
            <option>All Jobs (248)</option>
            <option>UI/UX Designer (45)</option>
            <option>Frontend Developer (128)</option>
          </select>
        </div>

        {/* Search */}
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input type="text" placeholder="Search applicants by name or university..." className="w-full pl-9 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all dark:text-white text-sm" />
        </div>

        {/* Filter Button */}
        <button className="flex items-center justify-center gap-2 px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm font-bold text-zinc-600 dark:text-zinc-300 transition-colors shrink-0">
          <Filter size={16} /> Filters
        </button>
      </div>

      {/* Applicants List */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-sm overflow-hidden">
        {/* Header Row (Hidden on Mobile) */}
        <div className="hidden md:grid grid-cols-12 gap-4 p-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 text-xs font-bold text-zinc-400 uppercase tracking-wider">
          <div className="col-span-4 pl-2">Candidate</div>
          <div className="col-span-3">Applied Role</div>
          <div className="col-span-2 text-center">Match Score</div>
          <div className="col-span-2 text-center">Status</div>
          <div className="col-span-1 text-right pr-2">Actions</div>
        </div>

        {/* Applicant Rows */}
        <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {applicants.map((app) => (
            <div key={app.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 md:p-5 items-center hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors group">
              
              {/* Profile */}
              <div className="col-span-1 md:col-span-4 flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg shrink-0 ${app.color}`}>
                  {app.avatar}
                </div>
                <div>
                  <h4 className="font-bold text-zinc-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">{app.name}</h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{app.university}</p>
                </div>
              </div>

              {/* Role */}
              <div className="col-span-1 md:col-span-3 flex flex-col md:block">
                <span className="md:hidden text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Role</span>
                <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300">{app.role}</span>
                <span className="block text-xs text-zinc-400 mt-0.5">{app.applied}</span>
              </div>

              {/* Match Score */}
              <div className="col-span-1 md:col-span-2 flex flex-col md:items-center">
                <span className="md:hidden text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Match Score</span>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-purple-500 rounded-full" style={{ width: app.match }}></div>
                  </div>
                  <span className="text-xs font-black text-zinc-900 dark:text-white">{app.match}</span>
                </div>
              </div>

              {/* Status */}
              <div className="col-span-1 md:col-span-2 flex md:justify-center">
                {getStatusBadge(app.status)}
              </div>

              {/* Actions */}
              <div className="col-span-1 md:col-span-1 flex items-center justify-end gap-2 mt-4 md:mt-0">
                <button className="p-2 text-zinc-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-500/10 rounded-lg transition-colors" title="Message Candidate">
                  <MessageSquare size={18} />
                </button>
                <button className="p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors">
                  <MoreVertical size={18} />
                </button>
              </div>

            </div>
          ))}
        </div>
      </div>

    </div>
  );
}