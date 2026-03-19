import { useState } from 'react';
import { 
  Briefcase, Plus, Search, Filter, MoreVertical, 
  MapPin, DollarSign, Edit2, Eye, X, ImageIcon, Check
} from 'lucide-react';

export default function EmployerJobs() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newSkill, setNewSkill] = useState('');
  const [skills, setSkills] = useState<string[]>(['React', 'TypeScript']);

  // Mock Active Jobs
  const [jobs] = useState([
    { id: 1, title: 'Senior React Developer', type: 'Full-time', location: 'Remote', salary: '$90k - $120k', applicants: 45, status: 'Active', posted: '2 days ago', image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=100&q=80' },
    { id: 2, title: 'Product Marketing Manager', type: 'Contract', location: 'New York, NY', salary: '$70k - $90k', applicants: 128, status: 'Active', posted: '1 week ago', image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=100&q=80' },
    { id: 3, title: 'UX Research Intern', type: 'Internship', location: 'Hybrid', salary: '$25/hr', applicants: 75, status: 'Draft', posted: 'Just now', image: 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?auto=format&fit=crop&w=100&q=80' },
  ]);

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
      
      {/* --- CREATE JOB MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-zinc-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl relative custom-scrollbar">
            
            {/* Modal Header */}
            <div className="sticky top-0 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md z-10 p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-zinc-900 dark:text-white flex items-center gap-2">
                  <Briefcase className="text-purple-600" /> Post a New Job
                </h3>
                <p className="text-sm text-zinc-500 mt-1">Fill in the details to attract top student talent.</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Modal Body (Form) */}
            <div className="p-6 space-y-6">
              
              {/* Cover Image Upload */}
              <div className="border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-2xl p-8 flex flex-col items-center justify-center text-center hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer group">
                <div className="w-16 h-16 bg-purple-100 dark:bg-purple-500/20 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <ImageIcon size={28} className="text-purple-600 dark:text-purple-400" />
                </div>
                <h4 className="font-bold text-zinc-900 dark:text-white">Upload Job Cover Image</h4>
                <p className="text-xs text-zinc-500 mt-1">PNG, JPG or GIF up to 5MB. Make it stand out!</p>
              </div>

              {/* Grid Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider ml-1">Job Title</label>
                  <input type="text" placeholder="e.g. Senior Frontend Engineer" className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all dark:text-white text-sm" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider ml-1">Employment Type</label>
                  <select className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all dark:text-white text-sm appearance-none">
                    <option>Full-time</option><option>Part-time</option><option>Internship</option><option>Contract</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider ml-1">Salary Range</label>
                  <input type="text" placeholder="e.g. $50k - $70k" className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all dark:text-white text-sm" />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider ml-1">Job Description</label>
                <textarea rows={5} placeholder="Describe the role, responsibilities, and perks..." className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all dark:text-white text-sm resize-none" />
              </div>

              {/* Skills Tags */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider ml-1">Required Skills (Press Enter to add)</label>
                <div className="w-full min-h-[50px] p-2 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-800 flex flex-wrap gap-2 focus-within:ring-2 focus-within:ring-purple-500/20 transition-all">
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
                    placeholder="Type a skill..." 
                    className="flex-1 min-w-[120px] bg-transparent outline-none text-sm dark:text-white px-2"
                  />
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-white dark:bg-zinc-900 p-6 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-end gap-3">
              <button onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 rounded-xl text-sm font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                Save as Draft
              </button>
              <button onClick={() => { setIsModalOpen(false); alert("Job Posted!"); }} className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 shadow-lg shadow-purple-500/20 transition-all flex items-center gap-2">
                <Check size={16} /> Publish Job
              </button>
            </div>

          </div>
        </div>
      )}

      {/* --- PAGE HEADER --- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-zinc-900 dark:text-white flex items-center gap-3">
            <Briefcase className="text-purple-600" /> Manage Postings
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Create, edit, and manage your job listings.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-purple-500/20 transition-all shrink-0">
          <Plus size={18} /> Post New Job
        </button>
      </div>

      {/* --- FILTERS & SEARCH --- */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex bg-zinc-100 dark:bg-zinc-900 p-1 rounded-xl w-fit">
          {['All Jobs', 'Active', 'Drafts', 'Closed'].map((tab, i) => (
            <button key={i} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${i === 0 ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'}`}>
              {tab}
            </button>
          ))}
        </div>
        <div className="flex-1 flex items-center gap-3 bg-white dark:bg-zinc-900 px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm focus-within:ring-2 focus-within:ring-purple-500/20 transition-all">
          <Search size={18} className="text-zinc-400" />
          <input type="text" placeholder="Search jobs by title..." className="bg-transparent border-none outline-none text-sm w-full dark:text-white" />
        </div>
      </div>

      {/* --- JOB LISTINGS GRID --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {jobs.map(job => (
          <div key={job.id} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 shadow-sm hover:shadow-md transition-shadow group flex flex-col sm:flex-row gap-5">
            
            {/* Image Thumbnail */}
            <div className="w-full sm:w-24 h-32 sm:h-24 rounded-2xl overflow-hidden shrink-0 border border-zinc-100 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-800 relative">
              <img src={job.image} alt="Job Cover" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent sm:hidden" />
              <span className={`absolute bottom-2 left-2 sm:top-[-10px] sm:left-[-10px] sm:static text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider w-fit z-10 ${job.status === 'Active' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'}`}>
                {job.status}
              </span>
            </div>

            {/* Details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white truncate group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                  {job.title}
                </h3>
                <button className="text-zinc-400 hover:text-purple-600 transition-colors p-1"><MoreVertical size={16} /></button>
              </div>

              <div className="flex flex-wrap items-center gap-3 mt-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                <span className="flex items-center gap-1"><Briefcase size={12} /> {job.type}</span>
                <span className="flex items-center gap-1"><MapPin size={12} /> {job.location}</span>
                <span className="flex items-center gap-1"><DollarSign size={12} /> {job.salary}</span>
              </div>

              <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-0.5">Applicants</p>
                  <p className="text-sm font-black text-zinc-900 dark:text-white">{job.applicants} <span className="text-xs font-normal text-zinc-500">total</span></p>
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-2 bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-800/50 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-lg transition-colors" title="Edit Job"><Edit2 size={16} /></button>
                  <button className="p-2 bg-purple-50 hover:bg-purple-100 dark:bg-purple-500/10 dark:hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 rounded-lg transition-colors font-bold text-xs flex items-center gap-1">
                    <Eye size={16} /> View
                  </button>
                </div>
              </div>

            </div>
          </div>
        ))}
      </div>

    </div>
  );
}