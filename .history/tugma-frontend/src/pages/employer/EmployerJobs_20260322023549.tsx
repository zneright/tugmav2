import { useState, useEffect, useRef } from 'react';
import {
  Briefcase, Plus, Search, Filter, MoreVertical,
  MapPin, Edit2, Eye, X, ImageIcon, Check, Loader2, CalendarClock, Trash2, Clock, MonitorSmartphone, Calendar, Users
} from 'lucide-react';
import { auth } from '../../firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';

interface Job {
  id: number;
  title: string;
  type: string;
  location: string;
  work_setup: string;
  days_per_week: number;
  hours_per_day: number;
  salary: string;
  deadline: string;
  start_date: string;
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
  const [employerAddress, setEmployerAddress] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('All Jobs');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
  const [editingJobId, setEditingJobId] = useState<number | null>(null);
  const [newSkill, setNewSkill] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    type: 'Internship',
    work_setup: 'Onsite',
    salary: '',
    deadline: '',
    start_date: '',
    locations: [] as string[],
    days_per_week: '5',
    hours_per_day: '8',
    description: '',
    skills: [] as string[]
  });

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUid(user.uid);
        fetchJobsAndApplicants(user.uid);
        fetchEmployerProfile(user.uid);
      } else {
        setIsLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchJobsAndApplicants = async (firebaseUid: string) => {
    try {
      const [jobsRes, appsRes] = await Promise.all([
        fetch(`http://localhost:8080/api/jobs/employer/${firebaseUid}`),
        fetch(`http://localhost:8080/api/applications/employer/${firebaseUid}`)
      ]);

      let appsData: any[] = [];
      if (appsRes.ok) {
        appsData = await appsRes.json();
      }

      if (jobsRes.ok) {
        const jobsData = await jobsRes.json();
        const jobsWithCounts = jobsData.map((job: any) => ({
          ...job,
          applicants_count: appsData.filter((a: any) => a.job_id === job.id).length
        }));
        setJobs(jobsWithCounts);
      }
    } catch (error) {
      console.error("Failed to fetch jobs", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEmployerProfile = async (firebaseUid: string) => {
    try {
      const res = await fetch(`http://localhost:8080/api/employer/profile/${firebaseUid}`);
      if (res.ok) {
        const data = await res.json();
        setEmployerAddress(data.address || data.location || '');
      }
    } catch (error) { console.error(error); }
  };

  // Record system events silently
  const logSystemEvent = (action: string, details: string) => {
    if (!uid) return;
    fetch('http://localhost:8080/api/audit/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid, action, details })
    }).catch(err => console.error("Audit log failed (silent):", err));
  };

  const handleDeleteJob = async (jobId: number) => {
    if (!window.confirm("Are you sure you want to delete this posting? This cannot be undone.")) return;

    const jobToDelete = jobs.find(j => j.id === jobId);

    try {
      const res = await fetch(`http://localhost:8080/api/jobs/delete/${jobId}`, { method: 'DELETE' });
      if (res.ok) {
        logSystemEvent('Deleted Job Posting', `Deleted job posting: "${jobToDelete?.title || `#${jobId}`}"`);
        if (uid) fetchJobsAndApplicants(uid);
        showToast('Job deleted successfully!', 'success');
      }
      else {
        const err = await res.json();
        showToast("Failed to delete: " + (err.messages?.error || err.message), 'error');
      }
    } catch (error) { showToast("Network Error: Could not connect to the server.", 'error'); }
  };

  const openCreateModal = () => {
    setModalMode('create');
    setEditingJobId(null);
    setFormData({
      title: '', type: 'Internship', work_setup: 'Onsite', salary: '',
      deadline: '', start_date: '',
      locations: employerAddress ? [employerAddress] : [],
      days_per_week: '5', hours_per_day: '8', description: '', skills: []
    });
    setNewLocation('');
    setNewSkill('');
    setImageFile(null);
    setImagePreview(null);
    setIsModalOpen(true);
  };

  const openEditModal = (job: Job) => {
    setModalMode('edit');
    setEditingJobId(job.id);
    const locArray = job.location ? job.location.split(',').map(l => l.trim()).filter(l => l) : [];

    setFormData({
      title: job.title,
      type: job.type,
      work_setup: job.work_setup || 'Onsite',
      salary: job.salary === 'Unpaid / Volunteer' ? '' : job.salary,
      deadline: job.deadline || '',
      start_date: job.start_date || '',
      locations: locArray,
      days_per_week: job.days_per_week.toString(),
      hours_per_day: job.hours_per_day.toString(),
      description: job.description,
      skills: job.skills || []
    });
    setNewLocation('');
    setNewSkill('');
    setImagePreview(job.image_url);
    setIsModalOpen(true);
  };

  const openViewModal = (job: Job) => {
    setModalMode('view');
    setEditingJobId(job.id);
    const locArray = job.location ? job.location.split(',').map(l => l.trim()).filter(l => l) : [];

    setFormData({
      title: job.title, type: job.type, work_setup: job.work_setup || 'Onsite', salary: job.salary,
      deadline: job.deadline || '', start_date: job.start_date || '',
      locations: locArray,
      days_per_week: job.days_per_week.toString(), hours_per_day: job.hours_per_day.toString(),
      description: job.description, skills: job.skills || []
    });
    setImagePreview(job.image_url);
    setIsModalOpen(true);
  };

  const handleSaveJob = async (status: 'Active' | 'Draft' | 'Closed') => {
    if (!uid) return;
    const finalLocation = formData.locations.join(', ');

    if (!formData.title.trim() || formData.locations.length === 0 || !formData.description.trim() || formData.skills.length === 0 || !formData.deadline || !formData.start_date) {
      showToast("Please fill in all required fields (Dates, Location, Description, and Skills).", 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const submitData = new FormData();
      submitData.append('title', formData.title);
      submitData.append('type', formData.type);
      submitData.append('work_setup', formData.work_setup);
      submitData.append('location', finalLocation);
      submitData.append('days_per_week', formData.days_per_week);
      submitData.append('hours_per_day', formData.hours_per_day);
      submitData.append('deadline', formData.deadline);
      submitData.append('start_date', formData.start_date);
      submitData.append('description', formData.description);
      submitData.append('skills', JSON.stringify(formData.skills));
      submitData.append('status', status);
      submitData.append('salary', formData.salary.trim());

      if (imageFile) submitData.append('image', imageFile);

      const isEditing = modalMode === 'edit' && editingJobId;
      const endpoint = isEditing
        ? `http://localhost:8080/api/jobs/update/${editingJobId}`
        : `http://localhost:8080/api/jobs/employer/${uid}`;

      const res = await fetch(endpoint, { method: 'POST', body: submitData });

      if (res.ok) {
        let logAction = '';
        let logDetails = '';

        if (modalMode === 'create') {
          logAction = status === 'Draft' ? 'Saved Job Draft' : 'Published New Job';
          logDetails = `Created job posting: "${formData.title}" as ${status}`;
        } else {
          const originalStatus = jobs.find(j => j.id === editingJobId)?.status;
          if (status === 'Closed' && originalStatus !== 'Closed') {
            logAction = 'Closed Job Posting';
            logDetails = `Closed job posting: "${formData.title}"`;
          } else if (originalStatus === 'Draft' && status === 'Active') {
            logAction = 'Published Job Draft';
            logDetails = `Published draft: "${formData.title}"`;
          } else {
            logAction = 'Updated Job Posting';
            logDetails = `Updated details for: "${formData.title}"`;
          }
        }
        logSystemEvent(logAction, logDetails);

        setIsModalOpen(false);
        fetchJobsAndApplicants(uid);
        setActiveTab(status === 'Draft' ? 'Drafts' : status === 'Closed' ? 'Closed' : 'Active');

        if (status === 'Draft') showToast('Job saved to your Drafts securely.');
        else if (status === 'Closed') showToast('Posting closed successfully.', 'success');
        else if (isEditing) showToast('Job published successfully!');
        else showToast('Job published! Students can now apply.');
      } else {
        const err = await res.json();
        showToast("Failed to save job: " + (err.messages?.error || err.message), 'error');
      }
    } catch (error) {
      console.error(error);
      showToast("Network Error: Could not connect to the server.", 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { setImageFile(file); setImagePreview(URL.createObjectURL(file)); }
  };

  const addSkill = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newSkill.trim() !== '') {
      e.preventDefault();
      if (!formData.skills.includes(newSkill.trim())) {
        setFormData({ ...formData, skills: [...formData.skills, newSkill.trim()] });
      }
      setNewSkill('');
    }
  };
  const removeSkill = (skillToRemove: string) => {
    setFormData({ ...formData, skills: formData.skills.filter(s => s !== skillToRemove) });
  };

  const addLocation = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newLocation.trim() !== '') {
      e.preventDefault();
      if (!formData.locations.includes(newLocation.trim())) {
        setFormData({ ...formData, locations: [...formData.locations, newLocation.trim()] });
      }
      setNewLocation('');
    }
  };
  const removeLocation = (locationToRemove: string) => {
    setFormData({ ...formData, locations: formData.locations.filter(l => l !== locationToRemove) });
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
  };

  const filteredJobs = jobs.filter(job => {
    if (activeTab === 'All Jobs') return true;
    if (activeTab === 'Drafts') return job.status === 'Draft';
    return job.status === activeTab;
  });

  const isReadOnly = modalMode === 'view';

  const editingJobStatus = jobs.find(j => j.id === editingJobId)?.status || 'Draft';

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-purple-600" size={40} /></div>;
  }

  return (
    <div className="space-y-8 fade-in relative max-w-6xl mx-auto pb-20">

      {/* --- GLOBAL TOAST NOTIFICATION --- */}
      {toast && (
        <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-full shadow-2xl flex items-center gap-2 text-sm font-bold text-white transition-all animate-in slide-in-from-top-4 ${toast.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`}>
          {toast.type === 'success' ? <Check size={18} /> : <X size={18} />}
          {toast.message}
        </div>
      )}

      {/* --- MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-zinc-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl relative custom-scrollbar flex flex-col">

            <div className="sticky top-0 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md z-10 p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-zinc-900 dark:text-white flex items-center gap-2">
                  <div className="p-2 bg-purple-100 dark:bg-purple-500/20 rounded-lg">
                    <Briefcase className="text-purple-600 dark:text-purple-400" size={20} />
                  </div>
                  {modalMode === 'create' ? 'Post a New OJT' : modalMode === 'edit' ? 'Edit OJT Listing' : 'View OJT Details'}
                </h3>
                <p className="text-sm text-zinc-500 mt-1 ml-11">
                  {modalMode === 'view' ? 'Reviewing job details.' : 'Fill in the details to attract top student talent.'}
                </p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6 flex-1">
              <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageChange} className="hidden" disabled={isReadOnly} />

              <div
                onClick={() => !isReadOnly && fileInputRef.current?.click()}
                className={`border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-2xl flex flex-col items-center justify-center text-center bg-zinc-50 dark:bg-zinc-800/30 transition-colors overflow-hidden relative h-56 ${isReadOnly ? 'cursor-default' : 'cursor-pointer hover:bg-purple-50 dark:hover:bg-purple-500/10 hover:border-purple-300 dark:hover:border-purple-500/30 group'}`}
              >
                {imagePreview ? (
                  <>
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    {!isReadOnly && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="bg-white/20 backdrop-blur-md text-white px-4 py-2 rounded-xl font-bold border border-white/30 text-sm flex items-center gap-2">
                          <ImageIcon size={16} /> Change Cover Image
                        </span>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="w-16 h-16 bg-purple-100 dark:bg-purple-500/20 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <ImageIcon size={28} className="text-purple-600 dark:text-purple-400" />
                    </div>
                    <h4 className="font-bold text-zinc-900 dark:text-white">Upload Job Cover Image</h4>
                    <p className="text-xs text-zinc-500 mt-1">Recommended ratio 16:9</p>
                  </>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider ml-1">Job Title <span className="text-red-500">*</span></label>
                  <input disabled={isReadOnly} name="title" value={formData.title} onChange={handleChange} type="text" className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 outline-none transition-all dark:text-white text-sm font-medium disabled:opacity-70" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider ml-1">Work Setup <span className="text-red-500">*</span></label>
                  <select disabled={isReadOnly} name="work_setup" value={formData.work_setup} onChange={handleChange} className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 outline-none transition-all dark:text-white text-sm font-medium appearance-none disabled:opacity-70 cursor-pointer">
                    <option value="Onsite">Onsite (In-office)</option>
                    <option value="Hybrid">Hybrid (Mixed)</option>
                    <option value="Remote">Remote (Work from Home)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider ml-1">Allowance / Salary (₱)</label>
                  <input disabled={isReadOnly} name="salary" value={formData.salary} onChange={handleChange} type="text" placeholder="e.g. 500/day (Leave blank if Unpaid)" className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 outline-none transition-all dark:text-white text-sm font-medium disabled:opacity-70" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider ml-1">Submission Deadline <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" size={16} />
                    <input disabled={isReadOnly} name="deadline" value={formData.deadline} onChange={handleChange} type="date" className="w-full pl-10 pr-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 outline-none transition-all dark:text-white text-sm font-medium disabled:opacity-70 [color-scheme:light] dark:[color-scheme:dark]" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider ml-1">Possible Start Date <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <CalendarClock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" size={16} />
                    <input disabled={isReadOnly} name="start_date" value={formData.start_date} onChange={handleChange} type="date" className="w-full pl-10 pr-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 outline-none transition-all dark:text-white text-sm font-medium disabled:opacity-70 [color-scheme:light] dark:[color-scheme:dark]" />
                  </div>
                </div>

                <div className="space-y-1.5 sm:col-span-2 bg-zinc-50 dark:bg-zinc-800/30 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                  <label className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1.5 mb-2"><MapPin size={14} className="text-purple-500" /> Office Locations <span className="text-red-500">*</span> {!isReadOnly && "(Tap Enter to add)"}</label>

                  <div className={`w-full min-h-[52px] p-2 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700 flex flex-wrap gap-2 transition-all ${isReadOnly ? 'opacity-70' : 'focus-within:ring-2 focus-within:ring-purple-500/30 focus-within:border-purple-500'}`}>
                    {formData.locations.map(loc => (
                      <span key={loc} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300 rounded-lg text-xs font-bold shadow-sm border border-blue-100 dark:border-blue-800/30">
                        {loc} {!isReadOnly && <button type="button" onClick={() => removeLocation(loc)} className="hover:text-blue-900 dark:hover:text-white transition-colors"><X size={12} /></button>}
                      </span>
                    ))}
                    {!isReadOnly && (
                      <input
                        type="text"
                        value={newLocation}
                        onChange={(e) => setNewLocation(e.target.value)}
                        onKeyDown={addLocation}
                        placeholder={formData.locations.length === 0 ? "e.g. Makati City..." : "Add another location..."}
                        className="flex-1 min-w-[160px] bg-transparent outline-none text-sm font-medium dark:text-white px-2"
                      />
                    )}
                  </div>
                </div>

                <div className="sm:col-span-2 bg-purple-50/50 dark:bg-purple-500/5 border border-purple-100 dark:border-purple-500/20 p-5 rounded-2xl grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <h4 className="text-[13px] font-bold text-purple-900 dark:text-purple-300 flex items-center gap-1.5"><Clock size={16} /> OJT / Work Schedule Requirements</h4>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider ml-1">Days Per Week <span className="text-red-500">*</span></label>
                    <select disabled={isReadOnly} name="days_per_week" value={formData.days_per_week} onChange={handleChange} className="w-full px-4 py-3 bg-white dark:bg-zinc-900 rounded-xl border border-purple-200 dark:border-purple-800 outline-none focus:ring-2 focus:ring-purple-500/30 transition-all dark:text-white text-sm font-medium appearance-none disabled:opacity-70 cursor-pointer">
                      {[...Array(7)].map((_, i) => (
                        <option key={i + 1} value={i + 1}>{i + 1} Day{i + 1 > 1 ? 's' : ''} a week</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider ml-1">Hours Per Day <span className="text-red-500">*</span></label>
                    <select disabled={isReadOnly} name="hours_per_day" value={formData.hours_per_day} onChange={handleChange} className="w-full px-4 py-3 bg-white dark:bg-zinc-900 rounded-xl border border-purple-200 dark:border-purple-800 outline-none focus:ring-2 focus:ring-purple-500/30 transition-all dark:text-white text-sm font-medium appearance-none disabled:opacity-70 cursor-pointer">
                      {[...Array(12)].map((_, i) => (
                        <option key={i + 1} value={i + 1}>{i + 1} Hour{i + 1 > 1 ? 's' : ''} per day</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider ml-1">Job Description <span className="text-red-500">*</span></label>
                <textarea disabled={isReadOnly} name="description" value={formData.description} onChange={handleChange} rows={6} className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 outline-none transition-all dark:text-white text-sm font-medium resize-none disabled:opacity-70" />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider ml-1">Required Skills <span className="text-red-500">*</span> {!isReadOnly && "(Tap Enter to add)"}</label>
                <div className={`w-full min-h-[56px] p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center gap-2 transition-all ${isReadOnly ? 'opacity-70' : 'focus-within:ring-2 focus-within:ring-purple-500/30 focus-within:border-purple-500'}`}>
                  {formData.skills.map(skill => (
                    <span key={skill} className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300 rounded-lg text-xs font-bold shadow-sm">
                      {skill} {!isReadOnly && <button type="button" onClick={() => removeSkill(skill)} className="hover:text-purple-900 dark:hover:text-white transition-colors"><X size={12} /></button>}
                    </span>
                  ))}
                  {!isReadOnly && (
                    <input
                      type="text"
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      onKeyDown={addSkill}
                      placeholder={formData.skills.length === 0 ? "Type a skill e.g. ReactJS..." : "Add another..."}
                      className="flex-1 min-w-[140px] bg-transparent outline-none text-sm font-medium dark:text-white px-2"
                    />
                  )}
                </div>
              </div>

            </div>

            <div className="sticky bottom-0 bg-white dark:bg-zinc-900 p-6 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-end gap-3">
              {modalMode === 'view' ? (
                <button onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-zinc-800 hover:bg-zinc-900 dark:bg-zinc-700 dark:hover:bg-zinc-600 transition-colors shadow-sm">
                  Close
                </button>
              ) : (
                <>
                  <button onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 rounded-xl text-sm font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                    Cancel
                  </button>

                  {modalMode === 'create' && (
                    <>
                      <button onClick={() => handleSaveJob('Draft')} disabled={isSubmitting} className="px-6 py-2.5 rounded-xl text-sm font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors border border-zinc-200 dark:border-zinc-700">
                        Save as Draft
                      </button>
                      <button onClick={() => handleSaveJob('Active')} disabled={isSubmitting} className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 shadow-lg shadow-purple-500/20 transition-all flex items-center gap-2">
                        {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                        Publish Job
                      </button>
                    </>
                  )}

                  {modalMode === 'edit' && (
                    <>
                      {editingJobStatus === 'Active' && (
                        <button onClick={() => handleSaveJob('Closed')} disabled={isSubmitting} className="px-6 py-2.5 rounded-xl text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 transition-colors border border-red-200 dark:border-red-500/30">
                          Close Posting
                        </button>
                      )}

                      {editingJobStatus === 'Draft' && (
                        <button onClick={() => handleSaveJob('Draft')} disabled={isSubmitting} className="px-6 py-2.5 rounded-xl text-sm font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors border border-zinc-200 dark:border-zinc-700">
                          Save Draft
                        </button>
                      )}

                      {editingJobStatus === 'Closed' && (
                        <button onClick={() => handleSaveJob('Closed')} disabled={isSubmitting} className="px-6 py-2.5 rounded-xl text-sm font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors border border-zinc-200 dark:border-zinc-700">
                          Save Edits
                        </button>
                      )}

                      <button onClick={() => handleSaveJob('Active')} disabled={isSubmitting} className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 shadow-lg shadow-purple-500/20 transition-all flex items-center gap-2">
                        {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                        {editingJobStatus === 'Active' ? 'Publish Updates' : editingJobStatus === 'Closed' ? 'Republish Job' : 'Publish Job'}
                      </button>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white flex items-center gap-3 tracking-tight">
            <div className="p-2.5 bg-purple-100 dark:bg-purple-500/20 rounded-xl">
              <Briefcase className="text-purple-600 dark:text-purple-400" size={24} />
            </div>
            Manage Postings
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2 font-medium">Create, edit, and manage your OJT and Internship listings.</p>
        </div>
        <button onClick={openCreateModal} className="flex items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-900 text-white px-6 py-3 rounded-xl text-sm font-bold shadow-lg transition-all hover:-translate-y-0.5 shrink-0">
          <Plus size={18} /> Post New OJT
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 pt-2">
        <div className="flex bg-zinc-100/80 dark:bg-zinc-900/80 p-1.5 rounded-2xl w-fit border border-zinc-200/50 dark:border-zinc-800/50 backdrop-blur-sm shadow-sm">
          {['All Jobs', 'Active', 'Drafts', 'Closed'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-xl text-sm font-bold transition-all duration-200 ease-out ${activeTab === tab
                ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm ring-1 ring-zinc-200/50 dark:ring-zinc-700/50'
                : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50'
                }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {filteredJobs.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl p-12 flex flex-col items-center justify-center text-center min-h-[300px]">
          <div className="w-20 h-20 bg-zinc-50 dark:bg-zinc-800/50 rounded-full flex items-center justify-center mb-5">
            <Briefcase size={32} className="text-zinc-400 dark:text-zinc-500" />
          </div>
          <h3 className="text-xl font-black text-zinc-900 dark:text-white mb-2">
            {activeTab === 'All Jobs' ? 'No Jobs Posted Yet' : `No ${activeTab} Jobs Found`}
          </h3>
          <p className="text-sm font-medium text-zinc-500 max-w-sm">
            {activeTab === 'All Jobs'
              ? 'Click the "Post New OJT" button above to create your first listing.'
              : `You don't have any job postings currently marked as ${activeTab}.`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          {filteredJobs.map(job => (
            <div key={job.id} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group flex flex-col sm:flex-row gap-6 hover:border-purple-200 dark:hover:border-purple-500/30">

              <div className="w-full sm:w-32 h-48 sm:h-32 rounded-2xl overflow-hidden shrink-0 border border-zinc-100 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-800 relative">
                <img src={job.image_url} alt="Job" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-500" />
                <div className={`absolute top-3 right-3 w-3 h-3 rounded-full border-2 border-white dark:border-zinc-900 shadow-sm ${job.status === 'Active' ? 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.8)]' : job.status === 'Draft' ? 'bg-amber-500' : 'bg-red-500'}`} />
              </div>

              <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                <div>
                  <div className="flex items-start justify-between gap-3 mb-1">
                    <h3 className="text-lg font-black text-zinc-900 dark:text-white truncate group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors tracking-tight">
                      {job.title}
                    </h3>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 mt-3">
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1 ${job.status === 'Active' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' : job.status === 'Draft' ? 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400' : 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400'}`}>
                      {job.status === 'Active' ? 'Published' : job.status}
                    </span>
                    <span className="px-2.5 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-[11px] font-bold text-zinc-600 dark:text-zinc-300 flex items-center gap-1.5">
                      <MonitorSmartphone size={12} className="text-zinc-400" /> {job.work_setup}
                    </span>
                    <span className="px-2.5 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-[11px] font-bold text-zinc-600 dark:text-zinc-300 flex items-center gap-1.5 truncate max-w-[150px]">
                      <MapPin size={12} className="text-zinc-400 shrink-0" /> {job.location}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800/50">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Applicants</span>
                      <span className="text-sm font-black text-zinc-900 dark:text-white flex items-center gap-1.5">
                        <Users size={14} className="text-blue-500" /> {job.applicants_count || 0}
                      </span>
                    </div>

                    <div className="w-px h-8 bg-zinc-200 dark:bg-zinc-800"></div>

                    {job.deadline && (
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Deadline</span>
                        <span className="text-sm font-black text-red-500 dark:text-red-400 flex items-center gap-1.5">
                          <Calendar size={14} /> {formatDate(job.deadline)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-zinc-400 dark:text-zinc-500">
                    <Clock size={14} />
                    <p className="text-[11px] font-bold">
                      {formatDateTime(job.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {(job.status === 'Draft' || job.status === 'Closed') && (
                      <button onClick={() => handleDeleteJob(job.id)} className="p-2.5 bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 rounded-xl transition-colors" title="Delete Job">
                        <Trash2 size={16} />
                      </button>
                    )}
                    <button onClick={() => openEditModal(job)} className="p-2.5 bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-800/50 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-xl transition-colors">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => openViewModal(job)} className="px-4 py-2.5 bg-purple-50 hover:bg-purple-100 dark:bg-purple-500/10 dark:hover:bg-purple-500/20 text-purple-700 dark:text-purple-400 rounded-xl transition-colors font-bold text-[13px] flex items-center gap-1.5">
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