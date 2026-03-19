import { useState, useEffect } from 'react';
import {
  Briefcase, Plus, Search, Filter, MoreVertical,
  MapPin, DollarSign, Edit2, Eye, X, ImageIcon, Check, Loader2, CalendarClock
} from 'lucide-react';
import { auth } from '../../firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';

interface Job {
  id: number;
  title: string;
  type: string;
  location: string;
  days_per_week: number;
  hours_per_day: number;
  salary: string;
  applicants_count: number;
  status: string;
  created_at: string;
  image_url: string;
}

export default function EmployerJobs() {
  const [uid, setUid] = useState<string | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal & Form States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newSkill, setNewSkill] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    type: 'Internship', // Default to Internship for OJT
    salary: '',
    location: '',
    days_per_week: '5', // Default schedule
    hours_per_day: '8', // Default hours
    description: '',
    skills: [] as string[]
  });

  // 1. Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUid(user.uid);
        fetchJobs(user.uid);
      } else {
        setIsLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // 2. Fetch Jobs
  const fetchJobs = async (firebaseUid: string) => {
    try {
      const res = await fetch(`http://localhost:8080/api/jobs/employer/${firebaseUid}`);
      if (res.ok) {
        const data = await res.json();
        setJobs(data);
      }
    } catch (error) {
      console.error("Failed to fetch jobs", error);
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Create Job
  const handleCreateJob = async (status: 'Active' | 'Draft') => {
    if (!uid) return;
    if (!formData.title) {
      alert("Job Title is required!");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = { ...formData, status };
      const res = await fetch(`http://localhost:8080/api/jobs/employer/${uid}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setIsModalOpen(false);
        // Reset form
        setFormData({ title: '', type: 'Internship', salary: '', location: '', days_per_week: '5', hours_per_day: '8', description: '', skills: [] });
        fetchJobs(uid);
      } else {
        alert("Failed to create job.");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Form Handlers
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const addSkill = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newSkill.trim() !== '') {
      e.preventDefault();
      setFormData({ ...formData, skills: [...formData.skills, newSkill.trim()] });
      setNewSkill('');
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setFormData({ ...formData, skills: formData.skills.filter(s => s !== skillToRemove) });
  };

  // Helper to format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (isLoading) {
    return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-purple-600" size={40} /></div>;
  }

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
                  <Briefcase className="text-purple-600" /> Post a New Job / OJT
                </h3>
                <p className="text-sm text-zinc-500 mt-1">Fill in the details to attract top student talent.</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Modal Body (Form) */}
            <div className="p-6 space-y-6">

              {/* Cover Image Upload (UI Only for Hackathon) */}
              <div className="border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-2xl p-8 flex flex-col items-center justify-center text-center bg-zinc-50 dark:bg-zinc-800/20">
                <div className="w-16 h-16 bg-purple-100 dark:bg-purple-500/20 rounded-full flex items-center justify-center mb-4">
                  <ImageIcon size={28} className="text-purple-600 dark:text-purple-400" />
                </div>
                <h4 className="font-bold text-zinc-900 dark:text-white">Cover Image Auto-Generated</h4>
                <p className="text-xs text-zinc-500 mt-1">A cover image will be automatically assigned for this demo.</p>
              </div>

              {/* Grid Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider ml-1">Job Title <span className="text-red-500">*</span></label>
                  <input name="title" value={formData.title} onChange={handleChange} type="text" placeholder="e.g. Frontend Developer Intern" className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all dark:text-white text-sm" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider ml-1">Employment Type</label>
                  <select name="type" value={formData.type} onChange={handleChange} className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all dark:text-white text-sm appearance-none">
                    <option value="Internship">Internship / OJT</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Full-time">Full-time</option>
                    <option value="Contract">Contract</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider ml-1">Location</label>
                  <input name="location" value={formData.location} onChange={handleChange} type="text" placeholder="e.g. Remote, or Manila, PH" className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all dark:text-white text-sm" />
                </div>

                {/* 👇 NEW: OJT SCHEDULE FIELDS 👇 */}
                <div className="sm:col-span-2 bg-purple-50/50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-800/30 p-4 rounded-2xl grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <h4 className="text-[13px] font-bold text-purple-900 dark:text-purple-300 flex items-center gap-1.5"><CalendarClock size={16} /> OJT / Work Schedule Requirements</h4>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider ml-1">Days Per Week</label>
                    <select name="days_per_week" value={formData.days_per_week} onChange={handleChange} className="w-full px-4 py-2.5 bg-white dark:bg-zinc-900 rounded-xl border border-purple-200 dark:border-purple-800 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all dark:text-white text-sm appearance-none">
                      <option value="1">1 Day a week</option>
                      <option value="2">2 Days a week</option>
                      <option value="3">3 Days a week</option>
                      <option value="4">4 Days a week</option>
                      <option value="5">5 Days a week</option>
                      <option value="6">6 Days a week</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider ml-1">Hours Per Day</label>
                    <select name="hours_per_day" value={formData.hours_per_day} onChange={handleChange} className="w-full px-4 py-2.5 bg-white dark:bg-zinc-900 rounded-xl border border-purple-200 dark:border-purple-800 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all dark:text-white text-sm appearance-none">
                      <option value="4">4 Hours (Half Day)</option>
                      <option value="5">5 Hours</option>
                      <option value="6">6 Hours</option>
                      <option value="8">8 Hours (Full Day)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider ml-1">Allowance / Salary</label>
                  <input name="salary" value={formData.salary} onChange={handleChange} type="text" placeholder="e.g. Paid Allowance, or Unpaid" className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all dark:text-white text-sm" />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider ml-1">Job Description</label>
                <textarea name="description" value={formData.description} onChange={handleChange} rows={5} placeholder="Describe the role, responsibilities, and learning opportunities..." className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all dark:text-white text-sm resize-none" />
              </div>

              {/* Skills Tags */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider ml-1">Required Skills (Press Enter to add)</label>
                <div className="w-full min-h-[50px] p-2 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-800 flex flex-wrap gap-2 focus-within:ring-2 focus-within:ring-purple-500/20 transition-all">
                  {formData.skills.map(skill => (
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
              <button
                onClick={() => handleCreateJob('Draft')}
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl text-sm font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                Save as Draft
              </button>
              <button
                onClick={() => handleCreateJob('Active')}
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 shadow-lg shadow-purple-500/20 transition-all flex items-center gap-2"
              >
                {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                Publish Job
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
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Create, edit, and manage your job and OJT listings.</p>
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
      {jobs.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl p-10 flex flex-col items-center justify-center text-center h-64">
          <Briefcase size={40} className="text-zinc-300 dark:text-zinc-700 mb-4" />
          <h3 className="text-lg font-bold text-zinc-900 dark:text-white">No Jobs Posted Yet</h3>
          <p className="text-sm text-zinc-500 mt-1 max-w-sm">Click the "Post New Job" button above to create your first listing and start receiving applications.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {jobs.map(job => (
            <div key={job.id} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 shadow-sm hover:shadow-md transition-shadow group flex flex-col sm:flex-row gap-5">

              {/* Image Thumbnail */}
              <div className="w-full sm:w-24 h-32 sm:h-24 rounded-2xl overflow-hidden shrink-0 border border-zinc-100 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-800 relative">
                <img src={job.image_url} alt="Job Cover" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
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

                  {/* 👇 NEW: Display the Schedule on the card 👇 */}
                  <span className="flex items-center gap-1 text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 px-2 py-0.5 rounded-md">
                    <CalendarClock size={12} /> {job.days_per_week} Days/Wk • {job.hours_per_day} Hrs/Day
                  </span>

                  <span className="flex items-center gap-1"><DollarSign size={12} /> {job.salary}</span>
                </div>

                <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-0.5">Posted</p>
                    <p className="text-sm font-black text-zinc-900 dark:text-white">{formatDate(job.created_at)}</p>
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
      )}

    </div>
  );
}