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

  // Stores the actual DB address instead of a hardcoded HQ string
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

  // 🔥 FETCH JOBS + REAL APPLICANT COUNTS 🔥
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

        // Map over the jobs and count how many times this job ID appears in the applications table
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

  // 🔥 NEW: SILENT AUDIT LOGGER 🔥
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
    
    // Find the job title for the log before we delete it
    const jobToDelete = jobs.find(j => j.id === jobId);

    try {
      const res = await fetch(`http://localhost:8080/api/jobs/delete/${jobId}`, { method: 'DELETE' });
      if (res.ok) {
        
        // 🔥 LOG THE EVENT 🔥
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
      submitData.append('status', status); // This safely tells the DB if it is Draft, Active, or Closed
      submitData.append('salary', formData.salary.trim());

      if (imageFile) submitData.append('image', imageFile);

      const isEditing = modalMode === 'edit' && editingJobId;
      const endpoint = isEditing
        ? `http://localhost:8080/api/jobs/update/${editingJobId}`
        : `http://localhost:8080/api/jobs/employer/${uid}`;

      const res = await fetch(endpoint, { method: 'POST', body: submitData });

      if (res.ok) {
        
        // 🔥 INTELLIGENT EVENT LOGGING 🔥
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
        fetchJobsAndApplicants(uid); // Re-fetch the fresh data
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

  // Find the original status of the job we are editing so the modal knows which buttons to show
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

            <div className="sticky top-0 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md z-10 p-4 sm:p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
              <h3 className="text-lg sm:text-xl font-black text-zinc-900 dark:text-white flex items-center gap-2">
                <Briefcase className="text-purple-600" size={20} /> Post an OJT / Job
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-6 flex-1">
              {/* Cover Image */}
              <div className="border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-2xl p-6 sm:p-8 flex flex-col items-center justify-center text-center hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer group">
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-purple-100 dark:bg-purple-500/20 rounded-full flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform">
                  <ImageIcon size={24} className="text-purple-600 dark:text-purple-400" />
                </div>
                <h4 className="font-bold text-sm sm:text-base text-zinc-900 dark:text-white">Upload Job / Office Image</h4>
                <p className="text-xs text-zinc-500 mt-1">PNG or JPG up to 5MB.</p>
              </div>

              {/* Title & Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider ml-1">Job Title / Role</label>
                  <input type="text" placeholder="e.g. IT OJT (Web Development)" className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-purple-500/20 outline-none text-sm dark:text-white" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider ml-1">Compensation</label>
                  <select
                    value={allowanceType}
                    onChange={(e) => setAllowanceType(e.target.value)}
                    className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-purple-500/20 outline-none text-sm dark:text-white appearance-none cursor-pointer"
                  >
                    <option value="With Allowance">With Allowance</option>
                    <option value="No Allowance">No Allowance (Unpaid OJT)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className={`text-xs font-bold uppercase tracking-wider ml-1 ${allowanceType === 'No Allowance' ? 'text-zinc-300 dark:text-zinc-600' : 'text-zinc-400'}`}>Allowance Amount</label>
                  <input
                    type="text"
                    placeholder={allowanceType === 'No Allowance' ? 'N/A' : 'e.g. ₱300/day or ₱5000/mo'}
                    disabled={allowanceType === 'No Allowance'}
                    className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-purple-500/20 outline-none text-sm dark:text-white disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider ml-1">Description & Requirements</label>
                <textarea rows={4} placeholder="Describe the daily tasks, required hours (e.g. 450 hrs), and what they will learn..." className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-purple-500/20 outline-none text-sm dark:text-white resize-none" />
              </div>

              {/* Skills Needed */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider ml-1">Skills Needed (Press Enter)</label>
                <div className="w-full min-h-[50px] p-2 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-800 flex flex-wrap gap-2 focus-within:ring-2 focus-within:ring-purple-500/20">
                  {skills.map(skill => (
                    <span key={skill} className="flex items-center gap-1.5 px-3 py-1.5 sm:py-1 bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300 rounded-lg text-xs font-bold">
                      {skill} <button onClick={() => removeSkill(skill)}><X size={12} className="hover:text-purple-900 dark:hover:text-white" /></button>
                    </span>
                  ))}
                  <input
                    type="text"
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyDown={addSkill}
                    placeholder="e.g. CodeIgniter..."
                    className="flex-1 min-w-[120px] bg-transparent outline-none text-sm dark:text-white px-2 py-1"
                  />
                </div>
              </div>

            </div>

            {/* Mobile-Friendly Modal Footer */}
            <div className="sticky bottom-0 bg-white dark:bg-zinc-900 p-4 sm:p-6 border-t border-zinc-100 dark:border-zinc-800 flex flex-col-reverse sm:flex-row items-center justify-end gap-3 shrink-0">
              <button onClick={() => setIsModalOpen(false)} className="w-full sm:w-auto px-6 py-3 sm:py-2.5 rounded-xl text-sm font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                Cancel
              </button>
              <button onClick={() => handleSaveJob('Active')} disabled={isSubmitting} className="w-full sm:w-auto px-6 py-3 sm:py-2.5 rounded-xl text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20 transition-transform active:scale-95">
                <Check size={16} /> Post Job
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">Employer Dashboard</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Here is what is happening with your job postings today.</p>
        </div>
        <button onClick={openCreateModal} className="w-full sm:w-auto flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-5 py-3 sm:py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-purple-500/20 transition-all shrink-0 active:scale-95">
          <Plus size={18} /> Add Job Posting
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

                  {/* 🔥 REAL APPLICANT COUNTS ADDED 🔥 */}
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
                    {/* Allow Deletion for BOTH Draft and Closed jobs */}
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