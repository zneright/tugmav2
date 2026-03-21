import { useState, useEffect, useMemo } from 'react';
import {
  Users, Search, Filter, Download, MessageSquare,
  CheckCircle2, Star, Briefcase, Loader2,
  FileText, ExternalLink, ThumbsUp, ThumbsDown, CalendarClock, X, BrainCircuit, RefreshCw, Sparkles, MessageCircle
} from 'lucide-react';
import { auth } from '../../firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import StudentProfilePublic from './StudentProfilePublic';

interface Applicant {
  application_id: number;
  student_uid: string;
  first_name: string;
  last_name: string;
  email: string;
  course: string;
  profile_photo?: string;
  resume_name: string;
  resume_data: string;
  job_title: string;
  ai_match_score: number | null;
  ai_assessment: string | null;
  status: string;
  applied_at: string;
  student_skills: string[];
  job_skills: string[];
}

export default function EmployerApplicants() {
  const [uid, setUid] = useState<string | null>(null);
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedJobFilter, setSelectedJobFilter] = useState('All Jobs');

  // Analysis & Download State
  const [analyzingId, setAnalyzingId] = useState<number | null>(null);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  // Modal & Routing State
  const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'profile'>('list');
  const [studentUidToView, setStudentUidToView] = useState<string | null>(null);

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
        if (!Array.isArray(data)) {
          setApplicants([]);
          return;
        }

        const safeData = data.map((app: any) => {
          let parsedStudentSkills = [];
          let parsedJobSkills = [];
          try { parsedStudentSkills = typeof app.student_skills === 'string' ? JSON.parse(app.student_skills) : app.student_skills || []; } catch (e) { }
          try { parsedJobSkills = typeof app.job_skills === 'string' ? JSON.parse(app.job_skills) : app.job_skills || []; } catch (e) { }

          return {
            ...app,
            profile_photo: app.profilePhoto || app.profile_photo || null,
            student_skills: Array.isArray(parsedStudentSkills) ? parsedStudentSkills : [],
            job_skills: Array.isArray(parsedJobSkills) ? parsedJobSkills : [],
            ai_match_score: app.ai_match_score !== null && app.ai_match_score !== undefined ? Number(app.ai_match_score) : null
          };
        });
        setApplicants(safeData);
      }
    } catch (error) {
      console.error("Failed to fetch applicants:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (applicationId: number, newStatus: string) => {
    setApplicants(prev => prev.map(app => app.application_id === applicationId ? { ...app, status: newStatus } : app));
    if (selectedApplicant && selectedApplicant.application_id === applicationId) {
      setSelectedApplicant({ ...selectedApplicant, status: newStatus });
    }
    try {
      await fetch(`http://localhost:8080/api/applications/update-status/${applicationId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
    } catch (error) { console.error("Failed to update status", error); }
  };

  const handleAnalyzeApplicant = async (applicationId: number) => {
    setAnalyzingId(applicationId);
    try {
      const res = await fetch(`http://localhost:8080/api/applications/analyze/${applicationId}`, { method: 'POST' });
      const result = await res.json();

      if (!res.ok) throw new Error(result.messages?.error || result.message || result.error || "Unknown Server Error");

      setApplicants(prev => prev.map(app =>
        app.application_id === applicationId
          ? { ...app, ai_match_score: result.match_score, ai_assessment: result.overall_assessment }
          : app
      ));

      if (selectedApplicant && selectedApplicant.application_id === applicationId) {
        setSelectedApplicant(prev => prev ? { ...prev, ai_match_score: result.match_score, ai_assessment: result.overall_assessment } : null);
      }
    } catch (error: any) {
      alert(`AI Scan Failed: ${error.message}`);
    } finally {
      setAnalyzingId(null);
    }
  };

  const handleDownloadResume = async (e: React.MouseEvent, resumeUrl: string, resumeName: string, appId: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (!resumeUrl) return;

    setDownloadingId(appId);
    try {
      const response = await fetch(resumeUrl);
      if (!response.ok) throw new Error("Failed to fetch file");
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = resumeName || 'Resume.pdf';
      document.body.appendChild(a);
      a.click();

      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Blob Download error, trying fallback:", error);
      const a = document.createElement('a');
      a.href = resumeUrl.replace('/upload/', '/upload/fl_attachment/');
      a.setAttribute('download', '');
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } finally {
      setDownloadingId(null);
    }
  };

  const startChatWithApplicant = (app: Applicant) => {
    const newChatData = {
      id: app.student_uid || Date.now().toString(),
      name: `${app.first_name || 'Unknown'} ${app.last_name || 'User'}`,
      role: app.job_title,
      avatar: app.first_name ? app.first_name.charAt(0).toUpperCase() : 'U'
    };
    localStorage.setItem('pending_new_chat', JSON.stringify(newChatData));
    window.location.href = '/employer/messages';
  };

  const exportToCSV = () => {
    if (applicants.length === 0) { alert("No applicants to export."); return; }
    const headers = ["First Name", "Last Name", "Email", "Course", "Applied Role", "AI Match %", "Status", "Date Applied"];
    const csvRows = [headers.join(",")];
    applicants.forEach(app => {
      const row = [
        `"${app.first_name || ''}"`, `"${app.last_name || ''}"`, `"${app.email || ''}"`,
        `"${app.course || ''}"`, `"${app.job_title || ''}"`,
        app.ai_match_score !== null ? `${app.ai_match_score}%` : 'Unscanned',
        `"${app.status || 'Pending'}"`, `"${new Date(app.applied_at || Date.now()).toLocaleDateString()}"`
      ];
      csvRows.push(row.join(","));
    });
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `applicants_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getTimeAgo = (dateString: string) => {
    if (!dateString) return 'Recently';
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  };

  const getAvatarColor = (id: number) => {
    const safeId = id || 0;
    const colors = ['bg-blue-100 text-blue-600', 'bg-emerald-100 text-emerald-600', 'bg-purple-100 text-purple-600', 'bg-amber-100 text-amber-600'];
    return safeId % colors.length;
  };

  const uniqueJobs = Array.from(new Set(applicants.map(app => app.job_title))).filter(Boolean);

  const filteredApplicants = useMemo(() => {
    return applicants.filter(app => {
      const matchesSearch = `${app.first_name} ${app.last_name} ${app.course}`.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesJob = selectedJobFilter === 'All Jobs' || app.job_title === selectedJobFilter;
      return matchesSearch && matchesJob;
    });
  }, [applicants, searchQuery, selectedJobFilter]);

  if (viewMode === 'profile' && studentUidToView) {
    return <StudentProfilePublic studentUid={studentUidToView} onBack={() => { setViewMode('list'); setStudentUidToView(null); }} />;
  }

  if (isLoading) return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-purple-600" size={40} /></div>;

  return (
    <div className="space-y-6 fade-in pb-20 max-w-6xl mx-auto relative">

      {/* --- MODAL --- */}
      {selectedApplicant && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl w-full max-w-2xl overflow-y-auto max-h-[90vh] shadow-2xl custom-scrollbar border border-zinc-200 dark:border-zinc-800">

            <div className="relative">
              <div className={`h-32 w-full ${selectedApplicant.ai_match_score === null ? 'bg-zinc-800' : selectedApplicant.ai_match_score >= 80 ? 'bg-emerald-500' : selectedApplicant.ai_match_score >= 50 ? 'bg-amber-500' : 'bg-red-500'}`} />
              <button onClick={() => setSelectedApplicant(null)} className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full backdrop-blur-md transition-colors">
                <X size={18} />
              </button>

              <div className="px-6 sm:px-10 pb-6 -mt-12 relative z-10 flex flex-col sm:flex-row gap-5 sm:items-end">
                <div className={`w-24 h-24 rounded-2xl flex items-center justify-center font-black text-4xl border-4 border-white dark:border-zinc-900 shadow-lg shrink-0 overflow-hidden ${!selectedApplicant.profile_photo ? ['bg-blue-100 text-blue-600', 'bg-emerald-100 text-emerald-600', 'bg-purple-100 text-purple-600', 'bg-amber-100 text-amber-600'][getAvatarColor(selectedApplicant.application_id)] : 'bg-zinc-200'}`}>
                  {selectedApplicant.profile_photo ? (
                    <img src={selectedApplicant.profile_photo} alt="Profile" className="w-full h-full object-cover object-center" />
                  ) : (
                    selectedApplicant.first_name ? selectedApplicant.first_name.charAt(0).toUpperCase() : 'U'
                  )}
                </div>
                <div className="flex-1 bg-white dark:bg-zinc-900 p-4 rounded-2xl shadow-sm border border-zinc-100 dark:border-zinc-800 mt-2 sm:mt-0 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="min-w-0 pr-4 w-full sm:w-auto">
                    <h2 className="text-xl font-black text-zinc-900 dark:text-white leading-tight truncate">
                      {selectedApplicant.first_name || 'Unknown'} {selectedApplicant.last_name || 'User'}
                    </h2>
                    <p className="text-zinc-500 dark:text-zinc-400 font-medium text-sm mt-0.5 truncate">
                      {selectedApplicant.course || "Student"}
                    </p>
                  </div>
                  <button onClick={() => handleAnalyzeApplicant(selectedApplicant.application_id)} disabled={analyzingId === selectedApplicant.application_id} className="p-2 w-full sm:w-auto flex justify-center text-zinc-400 hover:text-purple-600 hover:bg-purple-50 rounded-xl transition-colors">
                    <RefreshCw size={18} className={analyzingId === selectedApplicant.application_id ? "animate-spin text-purple-600" : ""} />
                  </button>
                </div>
              </div>
            </div>

            <div className="px-6 sm:px-10 pb-8 space-y-6">

              <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-6 flex-col sm:flex-row gap-4">
                <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-center sm:justify-start">
                  <button
                    onClick={() => startChatWithApplicant(selectedApplicant)}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm rounded-xl flex items-center gap-2 transition-colors shadow-md w-full sm:w-auto justify-center"
                  >
                    <MessageCircle size={16} /> Chat
                  </button>
                  <button onClick={() => window.location.href = `mailto:${selectedApplicant.email}`} className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 font-bold text-sm rounded-xl flex items-center gap-2 transition-colors w-full sm:w-auto justify-center">
                    <MessageSquare size={16} /> Email
                  </button>
                  <button
                    onClick={() => { setSelectedApplicant(null); setStudentUidToView(selectedApplicant.student_uid); setViewMode('profile'); }}
                    className="text-sm font-bold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1.5 w-full sm:w-auto justify-center mt-2 sm:mt-0 sm:ml-2"
                  >
                    <ExternalLink size={16} /> Full Profile
                  </button>
                </div>
              </div>

              {selectedApplicant.ai_match_score !== null ? (
                <div className="bg-purple-50 dark:bg-purple-500/5 border border-purple-200 dark:border-purple-800/30 p-4 sm:p-5 rounded-2xl">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 gap-2">
                    <h3 className="font-black text-purple-900 dark:text-purple-300 flex items-center gap-2"><BrainCircuit size={18} /> AI Assessment</h3>
                    <span className={`text-sm font-black px-3 py-1 rounded-lg text-white ${selectedApplicant.ai_match_score >= 80 ? 'bg-emerald-500' : selectedApplicant.ai_match_score >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}>
                      {selectedApplicant.ai_match_score}% Match
                    </span>
                  </div>
                  <p className="text-[13px] font-medium text-purple-800 dark:text-purple-400 leading-relaxed whitespace-pre-wrap">
                    {selectedApplicant.ai_assessment}
                  </p>
                </div>
              ) : (
                <div className="bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700 p-5 rounded-2xl flex flex-col items-center justify-center text-center">
                  <BrainCircuit size={32} className="text-zinc-300 mb-2" />
                  <h3 className="font-bold text-zinc-700 dark:text-zinc-300">Not Analyzed Yet</h3>
                  <button onClick={() => handleAnalyzeApplicant(selectedApplicant.application_id)} className="mt-3 px-5 py-2 bg-zinc-900 text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-zinc-800 transition-colors w-full sm:w-auto justify-center">
                    {analyzingId === selectedApplicant.application_id ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                    {analyzingId === selectedApplicant.application_id ? "Scanning Candidate..." : "Run AI Match Scanner"}
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-zinc-50 dark:bg-zinc-800/40 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                  <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1 flex items-center gap-1.5"><Briefcase size={14} className="text-purple-500" /> Applied Role</p>
                  <p className="font-bold text-zinc-900 dark:text-white truncate">{selectedApplicant.job_title || 'N/A'}</p>
                  <p className="text-xs text-zinc-400 mt-1 flex items-center gap-1"><CalendarClock size={12} /> {getTimeAgo(selectedApplicant.applied_at)}</p>
                </div>

                <div className="bg-zinc-50 dark:bg-zinc-800/40 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="min-w-0 pr-2 w-full sm:w-auto">
                    <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Attached Resume</p>
                    <p className="font-bold text-zinc-900 dark:text-white truncate flex items-center gap-2">
                      <FileText size={16} className="text-purple-500 shrink-0" />
                      <span className="truncate">{selectedApplicant.resume_name || "Not attached"}</span>
                    </p>
                  </div>

                  {selectedApplicant.resume_data && (
                    <button
                      onClick={(e) => handleDownloadResume(e, selectedApplicant.resume_data, selectedApplicant.resume_name, selectedApplicant.application_id)}
                      disabled={downloadingId === selectedApplicant.application_id}
                      className="px-4 py-2 w-full sm:w-auto justify-center bg-zinc-900 hover:bg-black text-white text-xs font-bold rounded-xl transition-colors shrink-0 flex items-center gap-1 disabled:opacity-50"
                    >
                      {downloadingId === selectedApplicant.application_id ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                      {downloadingId === selectedApplicant.application_id ? "Downloading" : "View"}
                    </button>
                  )}
                </div>
              </div>

              <div className="pt-2">
                <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-3">Applicant Skills vs Job Requirements</p>
                <div className="flex flex-wrap gap-2">
                  {(!selectedApplicant.job_skills || selectedApplicant.job_skills.length === 0) ? (
                    <span className="text-sm text-zinc-500 italic">No specific skills required for this job.</span>
                  ) : (
                    selectedApplicant.job_skills.map(reqSkill => {
                      const isMatch = (selectedApplicant.student_skills || []).some(ss => String(ss).toLowerCase() === String(reqSkill).toLowerCase());
                      return (
                        <span key={reqSkill} className={`text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 ${isMatch ? 'bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/20 dark:border-emerald-500/30 dark:text-emerald-300' : 'bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400'}`}>
                          {reqSkill} {isMatch && <CheckCircle2 size={14} />}
                        </span>
                      );
                    })
                  )}
                </div>
              </div>

            </div>

            <div className="p-4 sm:p-6 sticky bottom-0 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border-t border-zinc-100 dark:border-zinc-800 flex flex-col sm:flex-row flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2 w-full sm:w-auto justify-center">
                <span className="text-xs font-bold text-zinc-500 uppercase">Status:</span>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-md ${selectedApplicant.status === 'Shortlisted' ? 'bg-amber-100 text-amber-700' :
                  selectedApplicant.status === 'Reviewed' ? 'bg-blue-100 text-blue-700' :
                    selectedApplicant.status === 'Rejected' ? 'bg-zinc-200 text-zinc-600' :
                      selectedApplicant.status === 'Hired' ? 'bg-emerald-100 text-emerald-700' :
                        'bg-purple-100 text-purple-700'
                  }`}>
                  {selectedApplicant.status || 'Pending'}
                </span>
              </div>

              <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full sm:w-auto">
                <button onClick={() => handleStatusChange(selectedApplicant.application_id, 'Rejected')} className="flex-1 sm:flex-none justify-center px-4 py-2 bg-white border border-zinc-200 text-zinc-600 hover:bg-red-50 hover:text-red-600 rounded-xl text-sm font-bold transition-colors flex items-center gap-1.5"><ThumbsDown size={16} /> Reject</button>
                <button onClick={() => handleStatusChange(selectedApplicant.application_id, 'Shortlisted')} className="flex-1 sm:flex-none justify-center px-4 py-2 bg-amber-50 text-amber-600 hover:bg-amber-100 border border-amber-200 rounded-xl text-sm font-bold transition-colors flex items-center gap-1.5"><Star size={16} /> Shortlist</button>
                <button onClick={() => { handleStatusChange(selectedApplicant.application_id, 'Hired'); setSelectedApplicant(null); }} className="w-full sm:w-auto justify-center px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 rounded-xl text-sm font-bold transition-all flex items-center gap-1.5 mt-2 sm:mt-0"><ThumbsUp size={16} /> Hire</button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-zinc-900 dark:text-white flex items-center gap-3">
            <div className="p-2.5 bg-purple-100 dark:bg-purple-500/20 rounded-xl">
              <Users className="text-purple-600 dark:text-purple-400" size={24} />
            </div>
            Applicant Tracking
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2 font-medium">Review resumes, run AI scans, and shortlist candidates.</p>
        </div>
        <button onClick={exportToCSV} className="flex items-center justify-center gap-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm transition-all shrink-0 w-full sm:w-auto">
          <Download size={18} /> Export CSV
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm flex flex-col lg:flex-row gap-4">
        <div className="relative min-w-[200px] w-full lg:w-auto">
          <Briefcase size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <select
            value={selectedJobFilter}
            onChange={(e) => setSelectedJobFilter(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all dark:text-white text-sm appearance-none font-medium cursor-pointer"
          >
            <option value="All Jobs">All Jobs ({applicants.length})</option>
            {uniqueJobs.map(job => (
              <option key={job} value={job}>{job}</option>
            ))}
          </select>
        </div>
        <div className="flex-1 relative w-full">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search applicants by name or course..."
            className="w-full pl-9 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all dark:text-white text-sm font-medium"
          />
        </div>
        <button className="flex items-center justify-center gap-2 px-5 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm font-bold text-zinc-600 dark:text-zinc-300 transition-colors shrink-0 w-full lg:w-auto">
          <Filter size={16} /> Filters
        </button>
      </div>

      {/* Applicants List Table */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-sm overflow-hidden mt-6">
        {/* Desktop Header */}
        <div className="hidden md:grid grid-cols-12 gap-4 p-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 text-[11px] font-black text-zinc-400 uppercase tracking-wider">
          <div className="col-span-3 pl-2">Candidate</div>
          <div className="col-span-3">Applied Role</div>
          <div className="col-span-1 text-center">Resume</div>
          <div className="col-span-2 text-center">AI Match Score</div>
          <div className="col-span-2 text-center">Status</div>
          <div className="col-span-1 text-right pr-2">Actions</div>
        </div>

        {filteredApplicants.length === 0 ? (
          <div className="text-center py-16">
            <h3 className="font-bold text-lg text-zinc-900 dark:text-white">No applicants yet.</h3>
            <p className="text-sm text-zinc-500 mt-1">Try adjusting your filters or wait for students to apply.</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {filteredApplicants.map((app) => {
              const fullName = `${app.first_name || 'Unknown'} ${app.last_name || 'User'}`;
              return (
                <div key={app.application_id} className="flex flex-col md:grid md:grid-cols-12 gap-4 p-4 md:p-5 items-start md:items-center hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors group">

                  {/* Profile Info */}
                  <div className="col-span-3 flex items-center gap-3 w-full min-w-0">
                    <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full md:rounded-2xl flex items-center justify-center font-black text-sm md:text-lg shrink-0 overflow-hidden ${!app.profile_photo ? ['bg-blue-100 text-blue-600', 'bg-emerald-100 text-emerald-600', 'bg-purple-100 text-purple-600', 'bg-amber-100 text-amber-600'][getAvatarColor(app.application_id)] : 'bg-zinc-200'}`}>
                      {app.profile_photo ? (
                        <img src={app.profile_photo} alt={app.first_name} className="w-full h-full object-cover object-center" />
                      ) : (
                        app.first_name ? app.first_name.charAt(0).toUpperCase() : 'U'
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-zinc-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors truncate text-sm md:text-base">{fullName}</h4>
                      <p className="text-[11px] md:text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">{app.course || "Student"}</p>
                    </div>
                  </div>

                  {/* Role Info */}
                  <div className="col-span-3 flex flex-col min-w-0 w-full pl-12 md:pl-0">
                    <span className="md:hidden text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-0.5">Applied Role</span>
                    <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300 truncate">{app.job_title || 'N/A'}</span>
                    <span className="text-[10px] md:text-[11px] font-medium text-zinc-400 mt-0.5">{getTimeAgo(app.applied_at)}</span>
                  </div>

                  {/* Wrapper for Mobile Row 2 (Resume + AI Score) */}
                  <div className="flex flex-row items-center justify-between w-full md:contents pl-12 md:pl-0 mt-2 md:mt-0">

                    {/* Resume */}
                    <div className="col-span-1 flex flex-col items-start md:items-center">
                      <span className="md:hidden text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Resume</span>
                      {app.resume_data ? (
                        <button
                          onClick={(e) => handleDownloadResume(e, app.resume_data, app.resume_name, app.application_id)}
                          title="Download CV"
                          disabled={downloadingId === app.application_id}
                          className="p-2 text-purple-600 bg-purple-50 hover:bg-purple-100 dark:bg-purple-500/10 dark:hover:bg-purple-500/20 rounded-xl transition-colors disabled:opacity-50"
                        >
                          {downloadingId === app.application_id ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                        </button>
                      ) : (
                        <span className="text-zinc-300 dark:text-zinc-600 font-bold px-2">-</span>
                      )}
                    </div>

                    {/* AI Score */}
                    <div className="col-span-2 flex flex-col items-end md:items-center">
                      <span className="md:hidden text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">AI Match</span>
                      {app.ai_match_score !== null ? (
                        <div className="flex items-center gap-2">
                          <div className="w-12 h-1.5 md:w-16 md:h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden shrink-0">
                            <div className={`h-full rounded-full ${app.ai_match_score >= 80 ? 'bg-emerald-500' : app.ai_match_score >= 50 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${app.ai_match_score}%` }}></div>
                          </div>
                          <span className="text-xs md:text-sm font-black text-zinc-900 dark:text-white">{app.ai_match_score}%</span>
                        </div>
                      ) : (
                        <button onClick={() => handleAnalyzeApplicant(app.application_id)} disabled={analyzingId === app.application_id} className="flex items-center justify-center gap-1 px-2.5 py-1 md:px-3 md:py-1.5 bg-purple-50 text-purple-600 hover:bg-purple-100 rounded-lg text-[9px] md:text-[10px] font-bold uppercase tracking-wider border border-purple-200 transition-colors disabled:opacity-50">
                          {analyzingId === app.application_id ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />}
                          {analyzingId === app.application_id ? "Scanning" : "Scan AI"}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Wrapper for Mobile Row 3 (Status + Actions) */}
                  <div className="flex flex-row items-center justify-between w-full md:contents pl-12 md:pl-0 mt-2 md:mt-0">

                    {/* Status Dropdown */}
                    <div className="col-span-2 flex flex-col items-start md:items-center">
                      <select
                        value={app.status || 'New Applicant'}
                        onChange={(e) => handleStatusChange(app.application_id, e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        className={`text-[10px] md:text-xs font-bold px-2.5 py-1 md:px-3 md:py-1.5 rounded-lg appearance-none cursor-pointer outline-none text-center shadow-sm border w-[110px] md:w-auto
                          ${app.status === 'Shortlisted' ? 'bg-amber-50 border-amber-100 text-amber-600' :
                            app.status === 'Reviewed' ? 'bg-blue-50 border-blue-100 text-blue-600' :
                              app.status === 'Rejected' ? 'bg-zinc-100 border-zinc-200 text-zinc-500' :
                                app.status === 'Hired' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
                                  'bg-purple-50 border-purple-100 text-purple-600'}`}
                      >
                        <option value="New Applicant">New Applicant</option>
                        <option value="Reviewed">Reviewed</option>
                        <option value="Shortlisted">Shortlisted</option>
                        <option value="Hired">Hired</option>
                        <option value="Rejected">Rejected</option>
                      </select>
                    </div>

                    {/* Actions (Chat / Review) */}
                    <div className="col-span-1 flex items-center justify-end gap-1.5 md:gap-2">
                      <button onClick={() => startChatWithApplicant(app)} title="Message Applicant" className="p-1.5 md:p-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 rounded-xl transition-colors shadow-sm shrink-0">
                        <MessageCircle size={14} className="md:w-4 md:h-4" />
                      </button>
                      <button
                        onClick={() => { setSelectedApplicant(app); if (app.status === 'New Applicant' || !app.status) handleStatusChange(app.application_id, 'Reviewed'); }}
                        className="px-3 py-1.5 md:px-4 md:py-2 text-[10px] md:text-xs font-bold bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:text-purple-600 hover:border-purple-200 dark:hover:border-purple-500/50 dark:hover:text-purple-400 rounded-xl transition-colors shadow-sm shrink-0"
                      >
                        Review
                      </button>
                    </div>

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