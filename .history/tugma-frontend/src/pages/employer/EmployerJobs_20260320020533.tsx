import { useState, useEffect, useRef } from 'react';
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

  const [activeTab, setActiveTab] = useState('All Jobs');

  // Modal & Form States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newSkill, setNewSkill] = useState('');

  // Image Upload States
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

  // 3. Create Job (Now using FormData for the Image Upload)
  const handleCreateJob = async (status: 'Active' | 'Draft') => {
    if (!uid) return;
    if (!formData.title) {
      alert("Job Title is required!");
      return;
    }

    setIsSubmitting(true);
    try {
      // We must use FormData to send files to PHP
      const submitData = new FormData();
      submitData.append('title', formData.title);
      submitData.append('location', formData.location);
      submitData.append('days_per_week', formData.days_per_week);
      submitData.append('hours_per_day', formData.hours_per_day);
      submitData.append('salary', formData.salary);
      submitData.append('description', formData.description);
      submitData.append('skills', JSON.stringify(formData.skills));
      submitData.append('status', status);

      if (imageFile) {
        submitData.append('image', imageFile);
      }

      const res = await fetch(`http://localhost:8080/api/jobs/employer/${uid}`, {
        method: 'POST',
        body: submitData // Notice: No Content-Type header needed for FormData!
      });

      if (res.ok) {
        setIsModalOpen(false);
        // Reset the form
        setFormData({ title: '', salary: '', location: '', days_per_week: '5', hours_per_day: '8', description: '', skills: [] });
        setImageFile(null);
        setImagePreview(null);

        fetchJobs(uid);
        setActiveTab('All Jobs');
      } else {
        const err = await res.json();
        alert("Failed to create job: " + (err.messages?.error || err.message));
      }
    } catch (error) {
      console.error(error);
      alert("Network Error: Could not connect to the server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Input Handlers
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file)); // Create a local preview
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
                  <Briefcase className="text-purple-600" /> Post a New OJT
                </h3>
                <p className="text-sm text-zinc-500 mt-1">Fill in the details to attract top student talent.</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Modal Body (Form) */}
            <div className="p-6 space-y-6">

              {/* LIVE IMAGE UPLOAD */}
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleImageChange}
                className="hidden"
              />

              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-2xl flex flex-col items-center justify-center text-center bg-zinc-50 dark:bg-zinc-800/20 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer group overflow-hidden relative h-48"
              >
                {imagePreview ? (
                  <>
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="bg-white/20 backdrop-blur-md text-white px-4 py-2 rounded-xl font-bold border border-white/30 text-sm">Change Image</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-16 h-16 bg-purple-100 dark:bg-purple-500/20 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <ImageIcon size={28} className="text-purple-600 dark:text-purple-400" />
                    </div>
                    <h4 className="font-bold text-zinc-900 dark:text-white">Upload Job Cover Image</h4>
                    <p className="text-xs text-zinc-500 mt-1">PNG, JPG or GIF up to 5MB. Make it stand out!</p>
                  </>
                )}
              </div>

              {/* Grid Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider ml-1">Job Title <span className="text-red-500">*</span></label>
                  <input name="title" value={formData.title} onChange={handleChange} type="text" placeholder="e.g. Frontend Developer Intern" className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all dark:text-white text-sm" />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider ml-1">Location</label>
                  <input name="location" value={formData.location} onChange={handleChange} type="text" placeholder="e.g. Remote, or Manila, PH" className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all dark:text-white text-sm" />
                </div>

                {/* OJT SCHEDULE FIELDS */}
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
                <div className="w-full min-h-[50px] p-2 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl