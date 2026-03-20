import { useState, useEffect } from 'react';
import { Search, MapPin, Filter, Clock, Building2, ChevronRight, CheckCircle2, Eye, Calendar, Sparkles, AlertCircle, Loader2, Layers } from 'lucide-react';
import { auth } from '../../firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';

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
  // 👇 AI Attached fields 👇
  matchScore?: number;
  aiReason?: string;
}

interface StudentProfile {
  required_hours: number;
  skills: string[];
}

export default function FindJobs() {
  const [uid, setUid] = useState<string | null>(null);
  const [displayJobs, setDisplayJobs] = useState<Job[]>([]); // The jobs rendered on screen
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAiSearching, setIsAiSearching] = useState(false); // AI Loading State

  // Search & Filters
  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');

  // Status Tracking
  const [viewedJobs, setViewedJobs] = useState<Set<number>>(new Set());
  const [appliedJobs, setAppliedJobs] = useState<Set<number>>(new Set());
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  // --- INITIALIZE DATA ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUid(user.uid);
        await Promise.all([
          fetchAllActiveJobs(),
          fetchStudentProfile(user.uid)
        ]);
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const fetchAllActiveJobs = async () => {
    try {
      const res = await fetch('http://localhost:8080/api/active');
      if (res.ok) setDisplayJobs(await res.json());
    } catch (error) { console.error("Error fetching jobs:", error); }
  };

  const fetchStudentProfile = async (firebaseUid: string) => {
    try {
      const res = await fetch(`http://localhost:8080/api/users/profile/${firebaseUid}`);
      if (res.ok) {
        const data = await res.json();
        setStudentProfile({
          required_hours: Number(data.requiredHours) || Number(data.required_hours) || 450,
          skills: data.skills || []
        });
      } else {
        setStudentProfile({ required_hours: 450, skills: [] });
      }
    } catch (error) {
      setStudentProfile({ required_hours: 450, skills: [] });
    }
  };

  // --- TRIGGER AI SEARCH API ---
  const handleAiSearch = async () => {
    setIsAiSearching(true);
    try {
      const res = await fetch('http://localhost:8080/api/jobs/aisearch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          searchQuery,
          locationQuery,
          category: selectedCategory,
          studentSkills: studentProfile?.skills || []
        })
      });

      if (res.ok) {
        const aiMatchedJobs = await res.json();
        setDisplayJobs(aiMatchedJobs);
      }
    } catch (error) {
      console.error("AI Search Error:", error);
      alert("Failed to connect to AI Engine.");
    } finally {
      setIsAiSearching(false);
    }
  };

  // --- DATE CALCULATION LOGIC ---
  const calculateEndDate = (startDate: string, daysPerWeek: number, hoursPerDay: number) => {
    if (!startDate || !studentProfile || !studentProfile.required_hours) return 'Unknown';
    const hoursPerWeek = daysPerWeek * hoursPerDay;
    if (hoursPerWeek === 0) return 'Invalid Schedule';

    const totalWeeksNeeded = studentProfile.required_hours / hoursPerWeek;
    const totalDaysNeeded = totalWeeksNeeded * 7;

    const start = new Date(startDate);
    const end = new Date(start.getTime() + totalDaysNeeded * 24 * 60 * 60 * 1000);

    return end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Basic UI Filter for Tabs (Remote, Hybrid, etc.)
  const tabFilteredJobs = displayJobs.filter(job => {
    if (activeTab === 'All') return true;
    if (activeTab === 'Paid Allowance') return job.salary !== 'Unpaid / Volunteer';
    return job.work_setup === activeTab;
  });

  const handleJobClick = (job: Job) => {
    setViewedJobs(prev => new Set(prev).add(job.id));
    setSelectedJob(job);
  };

  const handleApply = async (jobId: number) => {
    setAppliedJobs(prev => new Set(prev).add(jobId));
    setSelectedJob(null);
    alert("Application submitted successfully!");
  };

  if (isLoading) return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-purple-600" size={40} /></div>;

  return (
    <div className="space-y-6 pb-20 md:pb-8 animate-in fade-in duration-500 relative max-w-5xl mx-auto">

      {/* --- JOB DETAILS MODAL --- */}
      {selectedJob && studentProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
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
                <p className="text-zinc-500 dark:text-zinc-400 font-medium flex items-center gap-1 mt-1">
                  <Building2 size={14} /> {selectedJob.companyName || "Company Listing"}
                </p>
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
            </div>

            <div className="p-6 sticky bottom-0 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border-t border-zinc-100 dark:border-zinc-800">
              {appliedJobs.has(selectedJob.id) ? (
                <button disabled className="w-full py-3.5 rounded-xl font-black text-white bg-emerald-500 flex items-center justify-center gap-2 cursor-not-allowed shadow-lg shadow-emerald-500/20">
                  <CheckCircle2 size={18} /> Already Applied
                </button>
              ) : (
                <button onClick={() => handleApply(selectedJob.id)} className="w-full py-3.5 rounded-xl font-black text-white bg-purple-600 hover:bg-purple-700 shadow-lg shadow-purple-500/20 transition-all flex items-center justify-center gap-2 hover:-translate-y-0.5">
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
            AI Job Matchmaker
          </h1>
          {/* 👇 AI SEARCH BUTTON 👇 */}
          <button
            onClick={handleAiSearch}
            disabled={isAiSearching}
            className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-purple-500/20 transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isAiSearching ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
            {isAiSearching ? 'AI is Matching...' : 'Find Matches'}
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
              placeholder="Search skills or roles..."
              className="w-full pl-12 pr-4 py-3.5 text-sm font-medium bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 transition-all dark:text-white"
            />
          </div>

          <div className="relative group">
            <Layers className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-purple-600 transition-colors" size={18} />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 text-sm font-medium bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 transition-all dark:text-white appearance-none"
            >
              <option value="All Categories">All Categories</option>
              <option value="Web Development">Web Development</option>
              <option value="Software Engineering">Software Engineering</option>
              <option value="UI/UX Design">UI/UX Design</option>
              <option value="Data & Analytics">Data & Analytics</option>
              <option value="IT Support & Network">IT Support & Network</option>
            </select>
          </div>

          <div className="relative group">
            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-purple-600 transition-colors" size={18} />
            <input
              type="text"
              value={locationQuery}
              onChange={(e) => setLocationQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAiSearch()}
              placeholder="e.g. Region 3 or Metro Manila"
              className="w-full pl-12 pr-4 py-3.5 text-sm font-medium bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 transition-all dark:text-white"
            />
          </div>
        </div>

        {/* Filters */}
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
        {isAiSearching ? (
          <div className="text-center py-20 bg-white/50 dark:bg-zinc-900/50 rounded-3xl border border-purple-200 dark:border-purple-900/50 backdrop-blur-sm">
            <Loader2 className="mx-auto text-purple-600 animate-spin mb-4" size={48} />
            <h3 className="font-black text-xl text-purple-900 dark:text-purple-300">AI is finding your best matches...</h3>
            <p className="text-sm text-purple-600/70 mt-1 font-medium">Scanning locations, skills, and categories.</p>
          </div>
        ) : tabFilteredJobs.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-zinc-900 rounded-3xl border border-dashed border-zinc-200 dark:border-zinc-800">
            <AlertCircle className="mx-auto text-zinc-300 mb-3" size={40} />
            <h3 className="font-bold text-lg text-zinc-900 dark:text-white">No matches found</h3>
            <p className="text-sm text-zinc-500 mt-1">Try asking the AI a different location or keyword.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tabFilteredJobs.map((job) => (
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

                {/* Status Badges */}
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
                  {/* 👇 NEW: AI Score Badge 👇 */}
                  {job.matchScore !== undefined && (
                    <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-purple-600 bg-purple-100 dark:bg-purple-500/20 px-2 py-1 rounded-md">
                      <Sparkles size={12} /> {job.matchScore}% Match
                    </span>
                  )}
                </div>

                {/* Meta Details */}
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

                {/* AI Reason Preview (If exists) */}
                {job.aiReason && (
                  <div className="mt-4 text-xs font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/10 p-2 rounded-lg border border-purple-100 dark:border-purple-800/30 truncate">
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