import { useState, useEffect, useMemo } from 'react';
import { Search, MapPin, Filter, Clock, Building2, ChevronRight, CheckCircle2, Eye, Calendar, Sparkles, AlertCircle, Loader2, Tag, X, ShieldAlert, FileWarning } from 'lucide-react';
import { auth } from '../../firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import CompanyProfile from './CompanyProfile'; // 👈 NEW: Import the profile component

interface Job {
  id: number;
  firebase_uid: string;
  title: string;
  type: string;
  location: string;
  work_setup: string;
  days_per_week: number;
  hours_per_day: number;
  salary: string;
  deadline: string;
  start_date: string;
  image_url: string;
  description: string;
  skills: string[];
  companyName?: string;
  matchScore?: number;
  aiReason?: string;
}

interface StudentProfile {
  required_hours: number;
  skills: string[];
  classification: string;
  course: string;
  resume_name: string;
}

export default function FindJobs() {
  const [uid, setUid] = useState<string | null>(null);
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [aiJobs, setAiJobs] = useState<Job[] | null>(null);

  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAiSearching, setIsAiSearching] = useState(false);

  // 👇 NEW: View State Routing 👇
  const [viewMode, setViewMode] = useState<'jobs' | 'company'>('jobs');
  const [selectedEmployerUid, setSelectedEmployerUid] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  const [categoryQuery, setCategoryQuery] = useState('');

  const [viewedJobs, setViewedJobs] = useState<Set<number>>(new Set());
  const [appliedJobs, setAppliedJobs] = useState<Set<number>>(new Set());
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  const [jobToApply, setJobToApply] = useState<Job | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUid(user.uid);
        await Promise.all([
          fetchAllActiveJobs(),
          fetchStudentProfile(user.uid),
          fetchInteractions(user.uid)
        ]);
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const fetchAllActiveJobs = async () => {
    try {
      const res = await fetch('http://localhost:8080/api/jobs/active');
      if (res.ok) {
        const data = await res.json();
        const safeData = data.map((job: any) => ({
          ...job,
          skills: Array.isArray(job.skills) ? job.skills : []
        }));
        setAllJobs(safeData);
      }
    } catch (error) { console.error("Error fetching jobs:", error); }
  };

  const fetchInteractions = async (firebaseUid: string) => {
    try {
      const res = await fetch(`http://localhost:8080/api/interactions/student/${firebaseUid}`);
      if (res.ok) {
        const data = await res.json();
        setViewedJobs(new Set(data.viewed));
        setAppliedJobs(new Set(data.applied));
      }
    } catch (error) { console.error("Failed to fetch interactions", error); }
  };

  const recordInteraction = async (jobId: number, type: 'viewed' | 'applied') => {
    if (!uid) return;
    try {
      await fetch('http://localhost:8080/api/interactions/record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_uid: uid, job_id: jobId, type })
      });
    } catch (error) { console.error("Failed to record interaction", error); }
  };

  const fetchStudentProfile = async (firebaseUid: string) => {
    try {
      const res = await fetch(`http://localhost:8080/api/users/profile/${firebaseUid}`);
      if (res.ok) {
        const data = await res.json();

        let parsedHours = 450;
        if (data.ojt) {
          const ojtObj = typeof data.ojt === 'string' ? JSON.parse(data.ojt) : data.ojt;
          if (ojtObj && ojtObj.requiredHours) parsedHours = Number(ojtObj.requiredHours);
        }

        let parsedSkills: string[] = [];
        if (Array.isArray(data.skills)) parsedSkills = data.skills;
        else if (typeof data.skills === 'string') {
          try {
            const decoded = JSON.parse(data.skills);
            parsedSkills = Array.isArray(decoded) ? decoded : [];
          } catch (e) { parsedSkills = []; }
        }

        setStudentProfile({
          required_hours: parsedHours,
          skills: parsedSkills,
          classification: data.classification || '',
          course: data.course || '',
          resume_name: data.resumeName || ''
        });
      }
    } catch (error) {
      console.error("Failed to fetch profile:", error);
    }
  };

  const calculateEndDate = (startDate: string, daysPerWeek: number, hoursPerDay: number) => {
    if (!startDate || !studentProfile || !studentProfile.required_hours) return 'Unknown';
    if (daysPerWeek === 0 || hoursPerDay === 0) return 'Invalid Schedule';

    let remainingHours = studentProfile.required_hours;
    let currentDate = new Date(startDate);
    const workDays = Math.min(daysPerWeek, 7);
    let failsafe = 0;

    while (remainingHours > 0 && failsafe < 2000) {
      const dayOfWeek = currentDate.getDay();
      const currentDayNumber = dayOfWeek === 0 ? 7 : dayOfWeek;

      if (currentDayNumber <= workDays) remainingHours -= hoursPerDay;
      if (remainingHours > 0) currentDate.setDate(currentDate.getDate() + 1);
      failsafe++;
    }

    return currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handleAiSearch = async () => {
    setIsAiSearching(true);
    setAiJobs(null);

    if (!searchQuery.trim() && !locationQuery.trim() && !categoryQuery.trim()) {
      setIsAiSearching(false);
      return;
    }

    try {
      const res = await fetch('http://localhost:8080/api/jobs/aisearch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          searchQuery, locationQuery, category: categoryQuery,
          studentSkills: studentProfile?.skills || []
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.messages?.error || "AI Backend Error");
      }

      const aiMatchedJobs = await res.json();
      const safeAiJobs = aiMatchedJobs.map((job: any) => ({
        ...job, skills: Array.isArray(job.skills) ? job.skills : []
      }));
      setAiJobs(safeAiJobs);

    } catch (error: any) {
      console.error("AI Search Error:", error);
      alert(error.message || "Failed to connect to AI Engine. Check backend logs.");
    } finally {
      setIsAiSearching(false);
    }
  };

  const displayJobs = useMemo(() => {
    let baseJobs = aiJobs !== null ? aiJobs : allJobs;

    let finalJobs = baseJobs.filter(job => {
      if (activeTab === 'All') return true;
      if (activeTab === 'Paid Allowance') return job.salary !== 'Unpaid / Volunteer';
      return job.work_setup === activeTab;
    });

    return finalJobs.sort((a, b) => {
      if (a.matchScore && b.matchScore && a.matchScore !== b.matchScore) {
        return b.matchScore - a.matchScore;
      }

      const aApplied = appliedJobs.has(a.id) ? 1 : 0;
      const bApplied = appliedJobs.has(b.id) ? 1 : 0;
      if (aApplied !== bApplied) return aApplied - bApplied;

      const aViewed = viewedJobs.has(a.id) ? 1 : 0;
      const bViewed = viewedJobs.has(b.id) ? 1 : 0;
      if (aViewed !== bViewed) return aViewed - bViewed;

      if (!isAiSearching && aiJobs === null && studentProfile) {
        let aScore = 0;
        let bScore = 0;

        aScore += a.skills.filter(s => studentProfile.skills.some(ps => ps.toLowerCase() === s.toLowerCase())).length * 10;
        bScore += b.skills.filter(s => studentProfile.skills.some(ps => ps.toLowerCase() === s.toLowerCase())).length * 10;

        const aText = (a.title + " " + a.description).toLowerCase();
        const bText = (b.title + " " + b.description).toLowerCase();

        if (studentProfile.classification && aText.includes(studentProfile.classification.toLowerCase())) aScore += 15;
        if (studentProfile.course && aText.includes(studentProfile.course.toLowerCase())) aScore += 15;

        if (studentProfile.classification && bText.includes(studentProfile.classification.toLowerCase())) bScore += 15;
        if (studentProfile.course && bText.includes(studentProfile.course.toLowerCase())) bScore += 15;

        if (aScore !== bScore) return bScore - aScore;
      }

      return b.id - a.id;
    });
  }, [allJobs, aiJobs, activeTab, appliedJobs, viewedJobs, studentProfile, isAiSearching]);

  const handleJobClick = async (job: Job) => {
    // Update local UI state immediately for speed
    if (!viewedJobs.has(job.id)) {
      setViewedJobs(prev => new Set(prev).add(job.id));

      // Save to database
      try {
        await fetch('http://localhost:8080/api/interactions/record', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            student_uid: uid,
            job_id: job.id,
            type: 'viewed'
          })
        });
      } catch (error) {
        console.error("Failed to record view:", error);
      }
    }

    setSelectedJob(job);
  };

  const handleInitiateApplication = (job: Job) => {
    // 🛑 PREVENT DOUBLE APPLYING
    if (appliedJobs.has(job.id)) {
      showToast("You have already applied for this position.", "error");
      return;
    }

    if (!studentProfile?.resume_name) {
      showToast("Missing Resume! Please upload your CV/Resume in the Profile section before applying.", "error");
      return;
    }
    setJobToApply(job);
  }; const handleInitiateApplication = (job: Job) => {
    // 🛑 PREVENT DOUBLE APPLYING
    if (appliedJobs.has(job.id)) {
      showToast("You have already applied for this position.", "error");
      return;
    }

    if (!studentProfile?.resume_name) {
      showToast("Missing Resume! Please upload your CV/Resume in the Profile section before applying.", "error");
      return;
    }
    setJobToApply(job);
  };

  const confirmAndSubmitApplication = async () => {
    if (!jobToApply || !uid) return;
    setIsApplying(true);

    try {
      // 1. Log it in the interactions table (so the student sees the 'Applied' badge)
      await recordInteraction(jobToApply.id, 'applied');
      setAppliedJobs(prev => new Set(prev).add(jobToApply.id));

      // 2. 🔥 THE FIX: Actually send the application to the employer's dashboard!
      const applyRes = await fetch('http://localhost:8080/api/applications/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_id: jobToApply.id,
          student_uid: uid,
          // Sending the employer's UID isn't strictly necessary if the backend looks it up via the job_id, 
          // but it's good practice to include the core identifiers.
        })
      });

      if (!applyRes.ok) {
        throw new Error("Failed to insert into applications table.");
      }

      showToast("Application submitted successfully! The employer will review your profile.", 'success');
      setJobToApply(null);
      setSelectedJob(null);
    } catch (error) {
      console.error("Apply Error:", error);
      showToast("Failed to submit application. Please try again.", 'error');
    } finally {
      setIsApplying(false);
    }
  };

  // 👇 VIEW ROUTING LOGIC 👇
  if (viewMode === 'company' && selectedEmployerUid) {
    return <CompanyProfile employerUid={selectedEmployerUid} onBack={() => { setViewMode('jobs'); setSelectedEmployerUid(null); }} />;
  }

  if (isLoading) return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-purple-600" size={40} /></div>;

  return (
    <div className="space-y-6 pb-20 md:pb-8 animate-in fade-in duration-500 relative max-w-5xl mx-auto">

      {toast && (
        <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-full shadow-2xl flex items-center gap-2 text-sm font-bold text-white transition-all animate-in slide-in-from-top-4 ${toast.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`}>
          {toast.type === 'success' ? <CheckCircle2 size={18} /> : <FileWarning size={18} />}
          {toast.message}
        </div>
      )}

      {jobToApply && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl w-full max-w-md p-6 shadow-2xl border border-zinc-200 dark:border-zinc-800 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-purple-500" />
            <div className="flex items-center gap-3 mb-4 mt-2">
              <div className="p-3 bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-xl">
                <ShieldAlert size={24} />
              </div>
              <h3 className="text-xl font-black text-zinc-900 dark:text-white leading-tight">Data Consent <br /><span className="text-sm font-medium text-zinc-500">Submit Application</span></h3>
            </div>

            <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-xl border border-zinc-100 dark:border-zinc-800 mb-6">
              <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
                By clicking confirm, you consent to share your <strong>Profile Details</strong>, <strong>Skills</strong>, and <strong>Uploaded Resume</strong> with <span className="font-bold text-purple-600 dark:text-purple-400">{jobToApply.companyName || "the employer"}</span> for the <span className="font-bold text-zinc-900 dark:text-white">{jobToApply.title}</span> role.
              </p>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setJobToApply(null)}
                disabled={isApplying}
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmAndSubmitApplication}
                disabled={isApplying}
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 shadow-lg shadow-purple-500/20 transition-all flex items-center gap-2 disabled:opacity-70"
              >
                {isApplying ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                {isApplying ? "Submitting..." : "Confirm & Apply"}
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedJob && studentProfile && (
        <div className="fixed inset-0 z-[50] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl w-full max-w-lg overflow-y-auto max-h-[90vh] shadow-2xl custom-scrollbar border border-zinc-200 dark:border-zinc-800">
            <div className="h-32 w-full relative">
              <img src={selectedJob.image_url || 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=800&q=80'} alt="Cover" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <button onClick={() => setSelectedJob(null)} className="absolute top-4 right-4 p-2 bg-black/40 text-white rounded-full hover:bg-black/60 backdrop-blur-md transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="px-6 pb-6 -mt-8 relative z-10">
              <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl shadow-lg border border-zinc-100 dark:border-zinc-800 mb-6">
                <h2 className="text-xl font-black text-zinc-900 dark:text-white leading-tight">{selectedJob.title}</h2>

                {/* 👇 NEW: Clickable Company Link 👇 */}
                <button
                  onClick={() => { setSelectedJob(null); setSelectedEmployerUid(selectedJob.firebase_uid); setViewMode('company'); }}
                  className="text-zinc-500 dark:text-zinc-400 font-medium flex items-center gap-1.5 mt-1 hover:text-purple-600 dark:hover:text-purple-400 transition-colors group"
                >
                  <Building2 size={14} className="group-hover:scale-110 transition-transform" />
                  <span className="underline decoration-transparent group-hover:decoration-purple-500 underline-offset-4 transition-all">
                    {selectedJob.companyName || "View Company Profile"}
                  </span>
                </button>

                {selectedJob.aiReason && (
                  <div className="mt-3 p-2 bg-purple-50 dark:bg-purple-500/10 rounded-lg border border-purple-100 dark:border-purple-500/20 text-xs font-medium text-purple-700 dark:text-purple-300 flex items-start gap-1.5 leading-relaxed">
                    <Sparkles size={14} className="shrink-0 mt-0.5" />
                    {selectedJob.aiReason}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-700">
                  <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Possible Start</p>
                  <p className="font-bold flex items-center gap-1.5 text-zinc-900 dark:text-white">
                    <Calendar size={14} className="text-purple-500" />
                    {selectedJob.start_date ? new Date(selectedJob.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'TBD'}
                  </p>
                </div>
                <div className="bg-purple-50 dark:bg-purple-500/10 p-4 rounded-2xl border border-purple-100 dark:border-purple-500/20 shadow-sm shadow-purple-500/5">
                  <p className="text-[11px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Sparkles size={12} /> Est. End Date
                  </p>
                  <p className="font-black text-purple-700 dark:text-purple-300">
                    {calculateEndDate(selectedJob.start_date, selectedJob.days_per_week, selectedJob.hours_per_day)}
                  </p>
                  <p className="text-[10px] font-medium text-purple-600/70 dark:text-purple-400/70 mt-1 leading-tight">
                    Based on your required {studentProfile.required_hours} hrs
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <h4 className="font-bold text-sm mb-3 dark:text-white">Schedule & Setup</h4>
                <div className="flex flex-wrap gap-2 text-xs font-bold">
                  <span className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-lg">{selectedJob.work_setup}</span>
                  <span className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-lg">{selectedJob.days_per_week} Days/Week</span>
                  <span className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-lg">{selectedJob.hours_per_day} Hrs/Day</span>
                  <span className={`px-3 py-1.5 rounded-lg ${selectedJob.salary !== 'Unpaid / Volunteer' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'}`}>
                    {selectedJob.salary !== 'Unpaid / Volunteer' ? `₱ ${selectedJob.salary}` : selectedJob.salary}
                  </span>
                </div>
              </div>

              <div className="mb-6">
                <h4 className="font-bold text-sm mb-2 dark:text-white">Description</h4>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap leading-relaxed">{selectedJob.description}</p>
              </div>

              <div className="mb-6 border-t border-zinc-100 dark:border-zinc-800 pt-6">
                <h4 className="font-bold text-sm mb-3 dark:text-white">Required Skills</h4>
                <div className="flex flex-wrap gap-2">
                  {(selectedJob.skills || []).map(tag => {
                    const isMatch = studentProfile?.skills.some(skill => skill.toLowerCase() === tag.toLowerCase());
                    return (
                      <span key={tag} className={`text-xs font-bold px-3 py-1.5 rounded-lg ${isMatch
                        ? 'bg-purple-100 text-purple-700 border border-purple-200 dark:bg-purple-500/20 dark:border-purple-500/30 dark:text-purple-300'
                        : 'bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400'
                        }`}>
                        {tag} {isMatch && '✓'}
                      </span>
                    )
                  })}
                </div>
              </div>
            </div>

            <div className="p-6 sticky bottom-0 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border-t border-zinc-100 dark:border-zinc-800">
              {appliedJobs.has(selectedJob.id) ? (
                <button disabled className="w-full py-3.5 rounded-xl font-black text-white bg-emerald-500 flex items-center justify-center gap-2 cursor-not-allowed shadow-lg shadow-emerald-500/20">
                  <CheckCircle2 size={18} /> Already Applied
                </button>
              ) : (
                <button onClick={() => handleInitiateApplication(selectedJob)} className="w-full py-3.5 rounded-xl font-black text-white bg-purple-600 hover:bg-purple-700 shadow-lg shadow-purple-500/20 transition-all flex items-center justify-center gap-2 hover:-translate-y-0.5">
                  Submit Application
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- SEARCH HEADER --- */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-black text-zinc-900 dark:text-white flex items-center gap-2 tracking-tight">
            Smart Job Matchmaker
          </h1>
          <button
            onClick={handleAiSearch}
            disabled={isAiSearching}
            className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-purple-500/20 transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isAiSearching ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
            {isAiSearching ? 'Matching...' : 'Find Matches'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-purple-600 transition-colors" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAiSearch()}
              placeholder="Keywords (e.g. React, Speaker)..."
              className="w-full pl-12 pr-4 py-3.5 text-sm font-medium bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 transition-all dark:text-white"
            />
          </div>

          <div className="relative group">
            <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-purple-600 transition-colors" size={18} />
            <input
              type="text"
              value={categoryQuery}
              onChange={(e) => setCategoryQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAiSearch()}
              placeholder="Category (e.g. Web Design)..."
              className="w-full pl-12 pr-4 py-3.5 text-sm font-medium bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 transition-all dark:text-white"
            />
          </div>

          <div className="relative group">
            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-purple-600 transition-colors" size={18} />
            <input
              type="text"
              value={locationQuery}
              onChange={(e) => setLocationQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAiSearch()}
              placeholder="Location (e.g. Region 3)..."
              className="w-full pl-12 pr-4 py-3.5 text-sm font-medium bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 transition-all dark:text-white"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide pt-2">
          <button className="p-2.5 text-zinc-500 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 shrink-0">
            <Filter size={16} />
          </button>
          {['All', 'Remote', 'Hybrid', 'Onsite', 'Paid Allowance'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-xl text-sm font-bold transition-all shrink-0 whitespace-nowrap border ${activeTab === tab
                ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-zinc-900 dark:border-white shadow-md'
                : 'bg-white dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* --- RESULTS --- */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <p className="text-sm font-bold text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
            Showing <span className="text-purple-600 bg-purple-50 dark:bg-purple-500/10 px-2 py-0.5 rounded-md">{displayJobs.length}</span> matches
          </p>
        </div>

        {isAiSearching ? (
          <div className="text-center py-20 bg-white/50 dark:bg-zinc-900/50 rounded-3xl border border-purple-200 dark:border-purple-900/50 backdrop-blur-sm">
            <Loader2 className="mx-auto text-purple-600 animate-spin mb-4" size={48} />
            <h3 className="font-black text-xl text-purple-900 dark:text-purple-300">AI is finding your best matches...</h3>
            <p className="text-sm text-purple-600/70 mt-1 font-medium">Analyzing semantics, locations, and concepts.</p>
          </div>
        ) : displayJobs.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-zinc-900 rounded-3xl border border-dashed border-zinc-200 dark:border-zinc-800">
            <AlertCircle className="mx-auto text-zinc-300 mb-3" size={40} />
            <h3 className="font-bold text-lg text-zinc-900 dark:text-white">No matches found</h3>
            <p className="text-sm text-zinc-500 mt-1">Try asking the AI a different concept or location.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {displayJobs.map((job, index) => (
              <div
                key={job.id}
                onClick={() => handleJobClick(job)}
                className={`bg-white dark:bg-zinc-900 rounded-3xl border p-5 shadow-sm transition-all group cursor-pointer relative overflow-hidden flex flex-col ${appliedJobs.has(job.id)
                  ? 'border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/30 dark:bg-emerald-900/10 opacity-75'
                  : viewedJobs.has(job.id)
                    ? 'border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/20'
                    : 'border-zinc-200 dark:border-zinc-800 hover:shadow-xl hover:border-purple-300 dark:hover:border-purple-500/50 hover:-translate-y-1'
                  }`}
              >

                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden shrink-0 border border-zinc-100 dark:border-zinc-800 relative bg-zinc-100">
                    <img src={job.image_url || 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=150&q=80'} alt="Cover" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-lg font-black text-zinc-900 dark:text-white leading-tight group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors truncate">
                        {job.title}
                      </h3>
                    </div>
                    <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mt-1 flex items-center gap-1.5">
                      <Building2 size={14} /> {job.companyName || "Employer"}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mt-4 shrink-0">
                  {appliedJobs.has(job.id) && (
                    <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-100 dark:bg-emerald-500/20 px-2 py-1 rounded-md">
                      <CheckCircle2 size={12} /> Applied
                    </span>
                  )}
                  {!appliedJobs.has(job.id) && viewedJobs.has(job.id) && (
                    <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-md">
                      <Eye size={12} /> Viewed
                    </span>
                  )}
                  {job.matchScore !== undefined && (
                    <span className={`flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-md ${job.matchScore >= 80 ? 'text-purple-600 bg-purple-100 dark:bg-purple-500/20' :
                      job.matchScore >= 50 ? 'text-blue-600 bg-blue-100 dark:bg-blue-500/20' :
                        'text-zinc-600 bg-zinc-100 dark:bg-zinc-800'
                      }`}>
                      <Sparkles size={12} /> {job.matchScore}% Match
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-y-2 gap-x-3 mt-4 text-[11px] font-bold text-zinc-600 dark:text-zinc-300">
                  <span className="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1.5 rounded-lg">
                    <MapPin size={12} className="text-zinc-400" /> {job.work_setup}
                  </span>
                  <span className="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1.5 rounded-lg">
                    <Clock size={12} className="text-zinc-400" /> {job.days_per_week * job.hours_per_day * 4} Hrs/Month
                  </span>
                  <span className={`px-2.5 py-1.5 rounded-lg ${job.salary !== 'Unpaid / Volunteer' ? 'text-emerald-700 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-500/10' : 'text-zinc-500 bg-zinc-100 dark:bg-zinc-800'}`}>
                    {job.salary !== 'Unpaid / Volunteer' ? `₱ ${job.salary}` : job.salary}
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5 mt-auto pt-4">
                  {(job.skills || []).map(tag => {
                    const isMatch = studentProfile?.skills.some(skill => skill.toLowerCase() === tag.toLowerCase());
                    return (
                      <span key={tag} className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-md ${isMatch
                        ? 'bg-purple-100 text-purple-700 border border-purple-200 dark:bg-purple-500/20 dark:border-purple-500/30 dark:text-purple-300'
                        : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-500'
                        }`}>
                        {tag}
                      </span>
                    )
                  })}
                </div>

                {job.aiReason && (
                  <div className="mt-4 text-xs font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/10 p-2 rounded-lg border border-purple-100 dark:border-purple-800/30">
                    <span className="font-bold">AI Note:</span> {job.aiReason}
                  </div>
                )}

              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}