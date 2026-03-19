import { useState, useEffect, useRef } from 'react';
import {
  Briefcase, Plus, Search, Filter, MoreVertical,
  MapPin, Edit2, Eye, X, ImageIcon, Check, Loader2, CalendarClock, Trash2
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
  description: string;
  skills: string[];
}

export default function EmployerJobs() {
  const [uid, setUid] = useState<string | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [activeTab, setActiveTab] = useState('All Jobs');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
  const [editingJobId, setEditingJobId] = useState<number | null>(null);
  const [newSkill, setNewSkill] = useState('');

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    title: '',
    salary: '',
    location: '',
    days_per_week: '5',
    hours_per_day: '8',
    description: '',
    skills: [] as string[]
  });

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
  const handleDeleteJob = async (jobId: number) => {
    if (!window.confirm("Are you sure you want to delete this draft? This cannot be undone.")) return;

    try {
      const res = await fetch(`http://localhost:8080/api/jobs/delete/${jobId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        if (uid) fetchJobs(uid); // Refresh the list!
      } else {
        const err = await res.json();
        alert("Failed to delete: " + (err.messages?.error || err.message));
      }
    } catch (error) {
      console.error(error);
      alert("Network Error: Could not connect to the server.");
    }
  };
  const openCreateModal = () => {
    setModalMode('create');
    setEditingJobId(null);
    setFormData({ title: '', salary: '', location: '', days_per_week: '5', hours_per_day: '8', description: '', skills: [] });
    setImageFile(null);
    setImagePreview(null);
    setIsModalOpen(true);
  };

  const openEditModal = (job: Job) => {
    setModalMode('edit');
    setEditingJobId(job.id);
    setFormData({
      title: job.title,
      salary: job.salary === 'Unpaid / Volunteer' ? '' : job.salary,
      location: job.location,
      days_per_week: job.days_per_week.toString(),
      hours_per_day: job.hours_per_day.toString(),
      description: job.description,
      skills: job.skills || []
    });
    setImagePreview(job.image_url);
    setIsModalOpen(true);
  };

  const openViewModal = (job: Job) => {
    setModalMode('view');
    setEditingJobId(job.id);
    setFormData({
      title: job.title,
      salary: job.salary,
      location: job.location,
      days_per_week: job.days_per_week.toString(),
      hours_per_day: job.hours_per_day.toString(),
      description: job.description,
      skills: job.skills || []
    });
    setImagePreview(job.image_url);
    setIsModalOpen(true);
  };

  const handleSaveJob = async (status: 'Active' | 'Draft') => {
    if (!uid) return;
    if (!formData.title) {
      alert("Job Title is required!");
      return;
    }

    setIsSubmitting(true);
    try {
      const submitData = new FormData();
      submitData.append('title', formData.title);
      submitData.append('location', formData.location);
      submitData.append('days_per_week', formData.days_per_week);
      submitData.append('hours_per_day', formData.hours_per_day);
      submitData.append('description', formData.description);
      submitData.append('skills', JSON.stringify(formData.skills));
      submitData.append('status', status);

      // Handle Unpaid Salary logic
      const finalSalary = formData.salary.trim() === '' ? 'Unpaid / Volunteer' : formData.salary;
      submitData.append('salary', finalSalary);

      if (imageFile) {
        submitData.append('image', imageFile);
      }

      const endpoint = modalMode === 'edit' && editingJobId
        ? `http://localhost:8080/api/jobs/update/${editingJobId}`
        : `http://localhost:8080/api/jobs/employer/${uid}`;

      const res = await fetch(endpoint, {
        method: 'POST',
        body: submitData
      });

      if (res.ok) {
        setIsModalOpen(false);
        fetchJobs(uid);
        setActiveTab(status === 'Draft' ? 'Drafts' : 'Active');
      } else {
        const err = await res.json();
        alert("Failed to save job: " + (err.messages?.error || err.message));
      }
    } catch (error) {
      console.error(error);
      alert("Network Error: Could not connect to the server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const filteredJobs = jobs.filter(job => {
    if (activeTab === 'All Jobs') return true;
    if (activeTab === 'Drafts') return job.status === 'Draft';
    return job.status === activeTab;
  });

  const isReadOnly = modalMode === 'view';

  if (isLoading) {
    return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-purple-600" size={40} /></div>;
  }

  return (
    <div className="space-y-6 fade-in relative">

      {/* --- MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-zinc-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl relative custom-scrollbar">

            {/* Modal Header */}
            <div className="sticky top-0 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md z-10 p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-zinc-900 dark:text-white flex items-center gap-2">
                  <Briefcase className="text-purple-600" />
                  {modalMode === 'create' ? 'Post a New OJT' : modalMode === 'edit' ? 'Edit OJT Listing' : 'View OJT Details'}
                </h3>
                <p className="text-sm text-zinc-500 mt-1">
                  {modalMode === 'view' ? 'Reviewing job details.' : 'Fill in the details to attract top student talent.'}
                </p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Modal Body (Form) */}
            <div className="p-6 space-y-6">

              <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageChange} className="hidden" disabled={isReadOnly} />

              <div
                onClick={() => !isReadOnly && fileInputRef.current?.click()}
                className={`border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-2xl flex flex-col items-center justify-center text-center bg-zinc-50 dark:bg-zinc-800/20 transition-colors overflow-hidden relative h-48 ${isReadOnly ? 'cursor-default' : 'cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800/50 group'}`}
              >
                {imagePreview ? (
                  <>
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    {!isReadOnly && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="bg-white/20 backdrop-blur-md text-white px-4 py-2 rounded-xl font-bold border border-white/30 text-sm">Change Image</span>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="w-16 h-16 bg-purple-100 dark:bg-purple-500/20 rounded-full flex items-center justify-center mb-4">
                      <ImageIcon size={28} className="text-purple-600 dark:text-purple-400" />
                    </div>
                    <h4 className="font-bold text-zinc-900 dark:text-white">Upload Job Cover Image</h4>
                  </>
                )}
              </div>

              {/* Grid Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider ml-1">Job Title</label>
                  <input disabled={isReadOnly} name="title" value={formData.title} onChange={handleChange} type="text" className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all dark:text-white text-sm disabled:opacity-70" />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider ml-1">Location</label>
                  <input disabled={isReadOnly} name="location" value={formData.location} onChange={handleChange} type="text" className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all dark:text-white text-sm disabled:opacity-70" />
                </div>

                <div className="sm:col-span-2 bg-purple-50/50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-800/30 p-4 rounded-2xl grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <h4 className="text-[13px] font-bold text-purple-900 dark:text-purple-300 flex items-center gap-1.5"><CalendarClock size={16} /> OJT / Work Schedule Requirements</h4>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider ml-1">Days Per Week</label>
                    <select disabled={isReadOnly} name="days_per_week" value={formData.days_per_week} onChange={handleChange} className="w-full px-4 py-2.5 bg-white dark:bg-zinc-900 rounded-xl border border-purple-200 dark:border-purple-800 outline-none transition-all dark:text-white text-sm appearance-none disabled:opacity-70">
                      <option value="1">1 Day a week</option><option value="2">2 Days a week</option><option value="3">3 Days a week</option><option value="4">4 Days a week</option><option value="5">5 Days a week</option><option value="6">6 Days a week</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider ml-1">Hours Per Day</label>
                    <select disabled={isReadOnly} name="hours_per_day" value={formData.hours_per_day} onChange={handleChange} className="w-full px-4 py-2.5 bg-white dark:bg-zinc-900 rounded-xl border border-purple-200 dark:border-purple-800 outline-none transition-all dark:text-white text-sm appearance-none disabled:opacity-70">
                      <option value="4">4 Hours (Half Day)</option><option value="5">5 Hours</option><option value="6">6 Hours</option><option value="8">8 Hours (Full Day)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider ml-1">Allowance / Salary (₱)</label>
                  <input disabled={isReadOnly} name="salary" value={formData.salary} onChange={handleChange} type="text" placeholder="e.g. 500/day (Leave blank for Unpaid)" className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all dark:text-white text-sm disabled:opacity-70" />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider ml-1">Job Description</label>
                <textarea disabled={isReadOnly} name="description" value={formData.description} onChange={handleChange} rows={5} className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all dark:text-white text-sm resize-none disabled:opacity-70" />
              </div>

              {/* Skills Tags */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider ml-1">Required Skills {!isReadOnly && "(Tap Enter to add skill)"}</label>
                <div className={`w-full min-h-[50px] p-2 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-800 flex flex-wrap gap-2 transition-all ${isReadOnly ? 'opacity-70' : 'focus-within:ring-2 focus-within:ring-purple-500/20'}`}>
                  {formData.skills.map(skill => (
                    <span key={skill} className="flex items-center gap-1.5 px-3 py-1 bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300 rounded-lg text-xs font-bold">
                      {skill} {!isReadOnly && <button onClick={() => removeSkill(skill)} className="hover:text-purple-900 dark:hover:text-white"><X size={12} /></button>}
                    </span>
                  ))}
                  {!isReadOnly && (
                    <input
                      type="text"
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      onKeyDown={addSkill}
                      placeholder="Type a skill..."
                      className="flex-1 min-w-[120px] bg-transparent outline-none text-sm dark:text-white px-2"
                    />
                  )}
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-white dark:bg-zinc-900 p-6 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-end gap-3">
              {modalMode === 'view' ? (
                <button onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-zinc-800 hover:bg-zinc-900 transition-colors">
                  Close
                </button>
              ) : (
                <>
                  <button onClick={() => handleSaveJob('Draft')} disabled={isSubmitting} className="px-6 py-2.5 rounded-xl text-sm font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                    Save as Draft
                  </button>
                  <button onClick={() => handleSaveJob('Active')} disabled={isSubmitting} className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 shadow-lg shadow-purple-500/20 transition-all flex items-center gap-2">
                    {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                    {modalMode === 'edit' ? 'Publish Updates' : 'Publish Job'}
                  </button>
                </>
              )}
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
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Create, edit, and manage your OJT listings.</p>
        </div>
        <button onClick={openCreateModal} className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-purple-500/20 transition-all shrink-0">
          <Plus size={18} /> Post New OJT
        </button>
      </div>

      {/* --- FILTERS --- */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex bg-zinc-100 dark:bg-zinc-900 p-1 rounded-xl w-fit">
          {['All Jobs', 'Active', 'Drafts', 'Closed'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === tab
                ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* --- GRID --- */}
      {filteredJobs.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl p-10 flex flex-col items-center justify-center text-center h-64">
          <Briefcase size={40} className="text-zinc-300 dark:text-zinc-700 mb-4" />
          <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
            {activeTab === 'All Jobs' ? 'No Jobs Posted Yet' : `No ${activeTab} Jobs Found`}
          </h3>
          <p className="text-sm text-zinc-500 mt-1 max-w-sm">
            {activeTab === 'All Jobs'
              ? 'Click the "Post New OJT" button above to create your first listing.'
              : `You don't have any jobs marked as ${activeTab}.`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {filteredJobs.map(job => (
            <div key={job.id} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 shadow-sm hover:shadow-md transition-shadow group flex flex-col sm:flex-row gap-5">

              {/* Thumbnail */}
              <div className="w-full sm:w-24 h-32 sm:h-24 rounded-2xl overflow-hidden shrink-0 border border-zinc-100 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-800 relative">
                <img src={job.image_url} alt="Job" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent sm:hidden" />
                <span className={`absolute bottom-2 left-2 sm:top-[-10px] sm:left-[-10px] sm:static text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider w-fit z-10 ${job.status === 'Active' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
                  : job.status === 'Draft' ? 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400'
                    : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'
                  }`}>
                  {job.status}
                </span>
              </div>

              {/* Body */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-white truncate group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                    {job.title}
                  </h3>
                </div>

                <div className="flex flex-wrap items-center gap-3 mt-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  <span className="flex items-center gap-1"><MapPin size={12} /> {job.location}</span>
                  <span className="flex items-center gap-1 text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 px-2 py-0.5 rounded-md">
                    <CalendarClock size={12} /> {job.days_per_week} Days/Wk • {job.hours_per_day} Hrs/Day
                  </span>
                  <span className="flex items-center gap-0.5 font-bold">
                    <span className="text-[13px] font-black">₱</span> {job.salary}
                  </span>
                </div>

                <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-0.5">
                      {job.status === 'Draft' ? 'Last Updated' : 'Posted'}
                    </p>
                    <p className="text-sm font-black text-zinc-900 dark:text-white">{formatDate(job.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-2">

                    {/* 🔥 CONDITIONAL DELETE BUTTON (ONLY FOR DRAFTS) */}
                    {job.status === 'Draft' && (
                      <button
                        onClick={() => handleDeleteJob(job.id)}
                        className="p-2 bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 rounded-lg transition-colors"
                        title="Delete Draft"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                    <button onClick={() => openEditModal(job)} className="p-2 bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-800/50 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-lg transition-colors">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => openViewModal(job)} className="p-2 bg-purple-50 hover:bg-purple-100 dark:bg-purple-500/10 dark:hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 rounded-lg transition-colors font-bold text-xs flex items-center gap-1">
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