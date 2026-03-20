import { useState, useMemo } from 'react';
import { Search, MapPin, Filter, Clock, Building2, ChevronRight, CheckCircle2, Eye, Calendar, Sparkles, AlertCircle } from 'lucide-react';

// --- 1. MOCK STUDENT PROFILE ---
const STUDENT_PROFILE = {
  required_hours: 450,
  skills: ["React", "Web Design", "Figma", "CSS"], // Change these to see sorting change!
};

// --- 2. SMART LOCATION DICTIONARY ---
const LOCATION_SYNONYMS: Record<string, string[]> = {
  "metro manila": ["makati", "taguig", "bgc", "pasay", "manila", "quezon city", "pasig", "mandaluyong"],
  "region 3": ["bulacan", "pampanga", "tarlac", "bataan", "nueva ecija", "zambales", "aurora", "central luzon"],
};

// --- 3. EXPANDED MOCK DATA ---
const AVAILABLE_JOBS = [
  {
    id: 1,
    company: "TechNova Solutions",
    logo: "T",
    title: "Front-End Web Developer (OJT)",
    location: "Remote",
    type: "Hybrid",
    days_per_week: 5,
    hours_per_day: 8,
    start_date: "2026-04-01",
    allowance: "₱150 / day",
    tags: ["React", "Web Design", "Tailwind"],
    posted: "1 day ago"
  },
  {
    id: 2,
    company: "BuildRight Systems",
    logo: "B",
    title: ".NET/C# Junior Trainee",
    location: "Makati City, Metro Manila",
    type: "On-site",
    days_per_week: 5,
    hours_per_day: 8,
    start_date: "2026-03-25",
    allowance: "Unpaid",
    tags: ["C#", ".NET MAUI", "Desktop Apps"],
    posted: "3 days ago"
  },
  {
    id: 3,
    company: "Creative Studio PH",
    logo: "C",
    title: "UI/UX & Web Design Intern",
    location: "BGC, Taguig",
    type: "Remote",
    days_per_week: 4,
    hours_per_day: 6,
    start_date: "2026-04-10",
    allowance: "₱200 / day",
    tags: ["Figma", "CSS", "Wireframing", "Web Design"],
    posted: "5 hours ago"
  },
  {
    id: 4,
    company: "Commission on Appointments",
    logo: "C",
    title: "IT Systems Intern",
    location: "Pasay City, Metro Manila",
    type: "On-site",
    days_per_week: 5,
    hours_per_day: 8,
    start_date: "2026-03-30",
    allowance: "Unpaid",
    tags: ["PHP", "CodeIgniter", "Database"],
    posted: "1 week ago"
  }
];

export default function FindJobs() {
  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [locationQuery, setLocationQuery] = useState('');

  // Status Tracking
  const [viewedJobs, setViewedJobs] = useState<Set<number>>(new Set());
  const [appliedJobs, setAppliedJobs] = useState<Set<number>>(new Set());

  // Modal State
  const [selectedJob, setSelectedJob] = useState<typeof AVAILABLE_JOBS[0] | null>(null);

  // --- DATE CALCULATION HELPER ---
  const calculateEndDate = (startDate: string, daysPerWeek: number, hoursPerDay: number) => {
    const hoursPerWeek = daysPerWeek * hoursPerDay;
    const totalWeeksNeeded = STUDENT_PROFILE.required_hours / hoursPerWeek;
    const totalDaysNeeded = totalWeeksNeeded * 7; // Convert weeks to calendar days

    const start = new Date(startDate);
    const end = new Date(start.getTime() + totalDaysNeeded * 24 * 60 * 60 * 1000);

    return end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // --- THE SMART SORTING & FILTERING ENGINE ---
  const filteredAndSortedJobs = useMemo(() => {
    return AVAILABLE_JOBS.filter(job => {
      // 1. Tab Filter
      if (activeTab !== 'All' && job.type !== activeTab && job.allowance === 'Unpaid' && activeTab === 'Paid Allowance') return false;
      if (activeTab === 'Paid Allowance' && job.allowance === 'Unpaid') return false;

      // 2. Keyword Search
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery ||
        job.title.toLowerCase().includes(searchLower) ||
        job.company.toLowerCase().includes(searchLower) ||
        job.tags.some(tag => tag.toLowerCase().includes(searchLower));

      // 3. Smart Location Search
      const locLower = locationQuery.toLowerCase();
      let expandedLocations = [locLower];

      // Check if user typed a region, if so, add all its cities to the search query
      Object.keys(LOCATION_SYNONYMS).forEach(key => {
        if (locLower.includes(key) || key.includes(locLower)) {
          expandedLocations = [...expandedLocations, ...LOCATION_SYNONYMS[key]];
        }
      });

      const matchesLocation = !locationQuery || expandedLocations.some(loc => job.location.toLowerCase().includes(loc));

      return matchesSearch && matchesLocation;
    }).map(job => {
      // 4. Calculate Match Score
      let score = 0;
      job.tags.forEach(tag => {
        if (STUDENT_PROFILE.skills.some(skill => skill.toLowerCase() === tag.toLowerCase())) {
          score += 1;
        }
      });
      return { ...job, matchScore: score };
    }).sort((a, b) => {
      // 5. Sort logic: High score first, then unapplied first, then unviewed first
      if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;

      const aApplied = appliedJobs.has(a.id) ? 1 : 0;
      const bApplied = appliedJobs.has(b.id) ? 1 : 0;
      if (aApplied !== bApplied) return aApplied - bApplied; // Show unapplied first

      const aViewed = viewedJobs.has(a.id) ? 1 : 0;
      const bViewed = viewedJobs.has(b.id) ? 1 : 0;
      return aViewed - bViewed; // Show unviewed first
    });
  }, [activeTab, searchQuery, locationQuery, viewedJobs, appliedJobs]);

  const handleJobClick = (job: typeof AVAILABLE_JOBS[0]) => {
    setViewedJobs(prev => new Set(prev).add(job.id));
    setSelectedJob(job);
  };

  const handleApply = (jobId: number) => {
    setAppliedJobs(prev => new Set(prev).add(jobId));
    setSelectedJob(null); // Close modal after applying
    alert("Application submitted successfully!");
  };

  return (
    <div className="space-y-6 pb-20 md:pb-8 animate-in fade-in duration-500 relative">

      {/* --- JOB DETAILS MODAL --- */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-start">
              <div className="flex gap-4 items-center">
                <div className="w-16 h-16 rounded-xl bg-purple-50 dark:bg-purple-500/10 border border-purple-100 dark:border-purple-500/20 flex items-center justify-center font-black text-2xl text-purple-600 dark:text-purple-400">
                  {selectedJob.logo}
                </div>
                <div>
                  <h2 className="text-xl font-black text-zinc-900 dark:text-white">{selectedJob.title}</h2>
                  <p className="text-zinc-500 dark:text-zinc-400 font-medium">{selectedJob.company}</p>
                </div>
              </div>
              <button onClick={() => setSelectedJob(null)} className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-2xl">
                  <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Start Date</p>
                  <p className="font-bold flex items-center gap-1.5"><Calendar size={14} className="text-purple-500" /> {new Date(selectedJob.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                </div>
                <div className="bg-purple-50 dark:bg-purple-500/10 p-4 rounded-2xl border border-purple-100 dark:border-purple-500/20">
                  <p className="text-[11px] font-bold text-purple-500 dark:text-purple-400 uppercase tracking-wider mb-1 flex items-center gap-1"><Sparkles size={12} /> Est. End Date</p>
                  <p className="font-black text-purple-700 dark:text-purple-300">
                    {calculateEndDate(selectedJob.start_date, selectedJob.days_per_week, selectedJob.hours_per_day)}
                  </p>
                  <p className="text-[10px] text-purple-600/70 dark:text-purple-400/70 mt-1 leading-tight">Based on your {STUDENT_PROFILE.required_hours}hr requirement</p>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-sm mb-2">Schedule & Setup</h4>
                <div className="flex flex-wrap gap-2 text-sm font-medium">
                  <span className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg">{selectedJob.type}</span>
                  <span className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg">{selectedJob.days_per_week} Days/Week</span>
                  <span className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg">{selectedJob.hours_per_day} Hrs/Day</span>
                  <span className="px-3 py-1.5 bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400 rounded-lg">{selectedJob.allowance}</span>
                </div>
              </div>
            </div>

            <div className="p-6 bg-zinc-50 dark:bg-zinc-800/30 border-t border-zinc-100 dark:border-zinc-800">
              {appliedJobs.has(selectedJob.id) ? (
                <button disabled className="w-full py-3.5 rounded-xl font-black text-white bg-zinc-400 dark:bg-zinc-600 flex items-center justify-center gap-2 cursor-not-allowed">
                  <CheckCircle2 size={18} /> Already Applied
                </button>
              ) : (
                <button onClick={() => handleApply(selectedJob.id)} className="w-full py-3.5 rounded-xl font-black text-white bg-purple-600 hover:bg-purple-700 shadow-lg shadow-purple-500/20 transition-all flex items-center justify-center gap-2">
                  Apply Now
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- SEARCH & FILTER HEADER --- */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-sm space-y-4">
        <h1 className="text-2xl font-black text-zinc-900 dark:text-white flex items-center gap-2 tracking-tight">
          Find your perfect OJT
        </h1>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-purple-600 transition-colors" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search skills, roles, or companies..."
              className="w-full pl-11 pr-4 py-3 text-sm font-medium bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 transition-all dark:text-white"
            />
          </div>
          <div className="relative sm:w-64 group">
            <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-purple-600 transition-colors" size={18} />
            <input
              type="text"
              value={locationQuery}
              onChange={(e) => setLocationQuery(e.target.value)}
              placeholder="e.g. Metro Manila..."
              className="w-full pl-11 pr-4 py-3 text-sm font-medium bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 transition-all dark:text-white"
            />
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <button className="p-2.5 text-zinc-500 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 shrink-0">
            <Filter size={16} />
          </button>
          {['All', 'Remote', 'Hybrid', 'On-site', 'Paid Allowance'].map((tab) => (
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

      {/* --- RESULTS LIST --- */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <p className="text-sm font-bold text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
            Showing <span className="text-purple-600 bg-purple-50 dark:bg-purple-500/10 px-2 py-0.5 rounded-md">{filteredAndSortedJobs.length}</span> matches
          </p>
        </div>

        {filteredAndSortedJobs.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-zinc-900 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800">
            <AlertCircle className="mx-auto text-zinc-300 mb-3" size={32} />
            <h3 className="font-bold text-zinc-900 dark:text-white">No exact matches found</h3>
            <p className="text-sm text-zinc-500">Try adjusting your search or location.</p>
          </div>
        ) : (
          filteredAndSortedJobs.map((job) => (
            <div
              key={job.id}
              onClick={() => handleJobClick(job)}
              className={`bg-white dark:bg-zinc-900 rounded-2xl border p-5 shadow-sm transition-all group cursor-pointer relative overflow-hidden ${appliedJobs.has(job.id)
                ? 'border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/30 dark:bg-emerald-900/10 opacity-75'
                : viewedJobs.has(job.id)
                  ? 'border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/20'
                  : 'border-zinc-200 dark:border-zinc-800 hover:shadow-md hover:border-purple-300 dark:hover:border-purple-500/50 hover:-translate-y-0.5'
                }`}
            >

              <div className="flex items-start gap-4">
                {/* Logo */}
                <div className={`w-14 h-14 rounded-xl border flex items-center justify-center font-black text-xl shrink-0 transition-colors ${appliedJobs.has(job.id) ? 'bg-emerald-100 text-emerald-600 border-emerald-200' : 'bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 group-hover:bg-purple-50 dark:group-hover:bg-purple-900/20 group-hover:text-purple-600'
                  }`}>
                  {job.logo}
                </div>

                {/* Core Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-lg font-black text-zinc-900 dark:text-white leading-tight group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors truncate">
                      {job.title}
                    </h3>

                    {/* Status Badges */}
                    <div className="flex gap-2 shrink-0">
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
                      {!appliedJobs.has(job.id) && !viewedJobs.has(job.id) && job.matchScore > 0 && (
                        <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-purple-600 bg-purple-100 dark:bg-purple-500/20 px-2 py-1 rounded-md">
                          <Sparkles size={12} /> Top Match
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mt-1 flex items-center gap-1.5">
                    <Building2 size={14} /> {job.company}
                  </p>

                  {/* Meta Details */}
                  <div className="flex flex-wrap items-center gap-y-2 gap-x-3 mt-3 text-[11px] font-bold text-zinc-600 dark:text-zinc-300">
                    <span className="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1.5 rounded-lg">
                      <MapPin size={12} className="text-zinc-400" /> {job.type}
                    </span>
                    <span className="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1.5 rounded-lg">
                      <Clock size={12} className="text-zinc-400" /> {job.days_per_week * job.hours_per_day * 4} Hrs/Month
                    </span>
                    <span className={`px-2.5 py-1.5 rounded-lg ${job.allowance !== 'Unpaid' ? 'text-emerald-700 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-500/10' : 'text-zinc-500 bg-zinc-100 dark:bg-zinc-800'}`}>
                      {job.allowance}
                    </span>
                  </div>

                  {/* Skills Tags */}
                  <div className="flex flex-wrap gap-1.5 mt-4">
                    {job.tags.map(tag => {
                      // Highlight tags that match the student's skills
                      const isMatch = STUDENT_PROFILE.skills.some(skill => skill.toLowerCase() === tag.toLowerCase());
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
                </div>

                {/* Arrow */}
                <div className="hidden sm:flex flex-col items-end justify-center h-full pl-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${appliedJobs.has(job.id) ? 'bg-emerald-50 text-emerald-500' : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-400 group-hover:bg-purple-50 group-hover:text-purple-600'}`}>
                    <ChevronRight size={18} />
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
}