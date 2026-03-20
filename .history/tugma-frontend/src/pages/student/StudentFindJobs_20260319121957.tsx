import { useState } from 'react';
import { Search, MapPin, Filter, Clock, Building2, ChevronRight } from 'lucide-react';

// Mock Data explicitly tailored for IT/OJT requirements
const AVAILABLE_JOBS = [
  {
    id: 1,
    company: "TechNova Solutions",
    logo: "T",
    title: "Front-End Web Developer (OJT)",
    location: "Remote",
    type: "Hybrid",
    hours: "450 Hours",
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
    hours: "400 - 500 Hours",
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
    hours: "450 Hours",
    allowance: "₱200 / day",
    tags: ["Figma", "CSS", "Wireframing"],
    posted: "5 hours ago"
  },
  {
    id: 4,
    company: "Commission on Appointments",
    logo: "C",
    title: "IT Systems Intern",
    location: "Pasay City, Metro Manila",
    type: "On-site",
    hours: "450 Hours",
    allowance: "Unpaid",
    tags: ["PHP", "CodeIgniter", "Database"],
    posted: "1 week ago"
  }
];

export default function FindJobs() {
  const [activeTab, setActiveTab] = useState('All');

  return (
    <div className="space-y-6 pb-20 md:pb-8 animate-in fade-in duration-500">
      
      {/* --- SEARCH & FILTER HEADER --- */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-sm space-y-4">
        <h1 className="text-xl font-bold text-zinc-900 dark:text-white">Find your perfect OJT</h1>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-purple-600 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Search skills (e.g., React, C#, Web Design)..." 
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all dark:text-white"
            />
          </div>
          <div className="relative sm:w-48 group">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-purple-600 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Location..." 
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all dark:text-white"
            />
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <button className="p-2 text-zinc-500 hover:text-purple-600 bg-zinc-50 dark:bg-zinc-800 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors border border-zinc-200 dark:border-zinc-700 shrink-0">
            <Filter size={18} />
          </button>
          {['All', 'Remote', 'Hybrid', 'On-site', 'Paid Allowance'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors shrink-0 whitespace-nowrap border ${
                activeTab === tab 
                  ? 'bg-purple-600 text-white border-purple-600' 
                  : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 hover:border-purple-500'
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
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            Showing <span className="text-zinc-900 dark:text-white font-bold">{AVAILABLE_JOBS.length}</span> opportunities
          </p>
        </div>

        {AVAILABLE_JOBS.map((job) => (
          <div key={job.id} className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-sm hover:shadow-md hover:border-purple-500/50 dark:hover:border-purple-500/50 transition-all group cursor-pointer">
            
            <div className="flex items-start gap-4">
              {/* Logo */}
              <div className="w-14 h-14 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center font-bold text-xl text-zinc-600 dark:text-zinc-300 group-hover:bg-purple-50 dark:group-hover:bg-purple-900/20 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors shrink-0">
                {job.logo}
              </div>

              {/* Core Info */}
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white leading-tight group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors truncate">
                  {job.title}
                </h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1 flex items-center gap-1.5">
                  <Building2 size={14} /> {job.company}
                </p>

                {/* Meta Details */}
                <div className="flex flex-wrap items-center gap-y-2 gap-x-4 mt-3 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  <span className="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 rounded-md">
                    <MapPin size={12} /> {job.type}
                  </span>
                  <span className="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 rounded-md">
                    <Clock size={12} /> {job.hours}
                  </span>
                  <span className="text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-500/10 px-2.5 py-1 rounded-md">
                    {job.allowance}
                  </span>
                </div>

                {/* Skills Tags */}
                <div className="flex flex-wrap gap-2 mt-4">
                  {job.tags.map(tag => (
                    <span key={tag} className="text-[11px] font-semibold px-2 py-0.5 rounded-full border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action */}
              <div className="hidden sm:flex flex-col items-end justify-between h-full py-1">
                <span className="text-xs text-zinc-400">{job.posted}</span>
                <ChevronRight className="text-zinc-300 group-hover:text-purple-500 transition-colors mt-auto" />
              </div>
            </div>

          </div>
        ))}
      </div>

    </div>
  );
}