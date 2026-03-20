import { useState, useEffect } from 'react';
import {
  Users, Search, Filter, Download, MessageSquare,
  CheckCircle2, XCircle, Star, Briefcase, Loader2
} from 'lucide-react';
import { auth } from '../../firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';

interface Applicant {
  application_id: number;
  student_uid: string;
  first_name: string;
  last_name: string;
  email: string;
  course: string;
  resume_name: string;
  job_title: string;
  match_percentage: number;
  status: string;
  applied_at: string;
}

export default function EmployerApplicants() {
  const [uid, setUid] = useState<string | null>(null);
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUid(user.uid);
        fetchApplicants(user.uid);
      } else {
        setIsLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchApplicants = async (employerUid: string) => {
    try {
      const res = await fetch(`http://localhost:8080/api/applications/employer/${employerUid}`);
      if (res.ok) {
        const data = await res.json();
        setApplicants(data);
      }
    } catch (error) {
      console.error("Failed to fetch applicants:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (applicationId: number, newStatus: string) => {
    // Optimistic UI update
    setApplicants(prev => prev.map(app => app.application_id === applicationId ? { ...app, status: newStatus } : app));

    try {
      await fetch(`http://localhost:8080/api/applications/update-status/${applicationId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
    } catch (error) {
      console.error("Failed to update status", error);
    }
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  };

  const getAvatarColor = (id: number) => {
    const colors = [
      'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400',
      'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400',
      'bg-purple-100 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400',
      'bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400',
      'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400'
    ];
    return colors[id % colors.length];
  };

  if (isLoading) return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-purple-600" size={40} /></div>;

  return (
    <div className="space-y-6 fade-in pb-20 max-w-6xl mx-auto">

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-zinc-900 dark:text-white flex items-center gap-3">
            <div className="p-2.5 bg-purple-100 dark:bg-purple-500/20 rounded-xl">
              <Users className="text-purple-600 dark:text-purple-400" size={24} />
            </div>
            Applicant Tracking
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2 font-medium">Review resumes, shortlist candidates, and send messages.</p>
        </div>
        <button className="flex items-center justify-center gap-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm transition-all shrink-0">
          <Download size={18} /> Export CSV
        </button>
      </div>

      {/* Control Bar (Filters & Search) */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm flex flex-col lg:flex-row gap-4">
        {/* Job Dropdown */}
        <div className="relative min-w-[200px]">
          <Briefcase size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <select className="w-full pl-9 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all dark:text-white text-sm appearance-none font-medium cursor-pointer">
            <option>All Jobs ({applicants.length})</option>
          </select>
        </div>

        {/* Search */}
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input type="text" placeholder="Search applicants by name or university..." className="w-full pl-9 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all dark:text-white text-sm font-medium" />
        </div>

        {/* Filter Button */}
        <button className="flex items-center justify-center gap-2 px-5 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm font-bold text-zinc-600 dark:text-zinc-300 transition-colors shrink-0">
          <Filter size={16} /> Filters
        </button>
      </div>

      {/* Applicants List */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-sm overflow-hidden">

        {/* Header Row (Hidden on Mobile) */}
        <div className="hidden md:grid grid-cols-12 gap-4 p-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 text-[11px] font-black text-zinc-400 uppercase tracking-wider">
          <div className="col-span-4 pl-2">Candidate</div>
          <div className="col-span-3">Applied Role</div>
          <div className="col-span-2 text-center">Match Score</div>
          <div className="col-span-2 text-center">Status</div>
          <div className="col-span-1 text-right pr-2">Actions</div>
        </div>

        {/* Applicant Rows */}
        {applicants.length === 0 ? (
          <div className="text-center py-16">
            <h3 className="font-bold text-lg text-zinc-900 dark:text-white">No applicants yet.</h3>
            <p className="text-sm text-zinc-500 mt-1">When students apply, they will appear here.</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {applicants.map((app) => {
              const fullName = `${app.first_name || 'Unknown'} ${app.last_name || 'User'}`;

              return (
                <div key={app.application_id} className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 md:p-5 items-center hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors group">

                  {/* Profile */}
                  <div className="col-span-1 md:col-span-4 flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg shrink-0 ${getAvatarColor(app.application_id)}`}>
                      {app.first_name ? app.first_name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-zinc-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors truncate">
                        {fullName}
                      </h4>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">{app.course || "Student"}</p>
                    </div>
                  </div>

                  {/* Role */}
                  <div className="col-span-1 md:col-span-3 flex flex-col md:block min-w-0">
                    <span className="md:hidden text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Role</span>
                    <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300 truncate block">{app.job_title}</span>
                    <span className="block text-[11px] font-medium text-zinc-400 mt-0.5">{getTimeAgo(app.applied_at)}</span>
                  </div>

                  {/* Match Score */}
                  <div className="col-span-1 md:col-span-2 flex flex-col md:items-center">
                    <span className="md:hidden text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Match Score</span>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${app.match_percentage >= 80 ? 'bg-emerald-500' : app.match_percentage >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                          style={{ width: `${app.match_percentage}%` }}>
                        </div>
                      </div>
                      <span className="text-xs font-black text-zinc-900 dark:text-white">{app.match_percentage}%</span>
                    </div>
                  </div>

                  {/* Dynamic Status Dropdown */}
                  <div className="col-span-1 md:col-span-2 flex md:justify-center relative">
                    <span className="md:hidden text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1 block">Status</span>
                    <select
                      value={app.status}
                      onChange={(e) => handleStatusChange(app.application_id, e.target.value)}
                      className={`text-xs font-bold px-3 py-1.5 rounded-lg appearance-none cursor-pointer outline-none text-center shadow-sm border
                        ${app.status === 'Shortlisted' ? 'bg-amber-50 border-amber-100 text-amber-600 dark:bg-amber-500/10 dark:border-amber-500/20 dark:text-amber-400' :
                          app.status === 'Reviewed' ? 'bg-blue-50 border-blue-100 text-blue-600 dark:bg-blue-500/10 dark:border-blue-500/20 dark:text-blue-400' :
                            app.status === 'Rejected' ? 'bg-zinc-100 border-zinc-200 text-zinc-500 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-400' :
                              'bg-emerald-50 border-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400'}`}
                    >
                      <option value="New Applicant">New Applicant</option>
                      <option value="Reviewed">Reviewed</option>
                      <option value="Shortlisted">Shortlisted</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </div>

                  {/* Actions */}
                  <div className="col-span-1 md:col-span-1 flex items-center justify-end gap-2 mt-4 md:mt-0">
                    <button
                      onClick={() => window.location.href = `mailto:${app.email}`}
                      className="p-2 text-zinc-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-500/10 rounded-lg transition-colors"
                      title="Email Candidate"
                    >
                      <MessageSquare size={18} />
                    </button>
                    {/* Future feature: View full student profile/resume */}
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}