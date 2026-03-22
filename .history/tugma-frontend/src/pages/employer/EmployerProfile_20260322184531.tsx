import { useState, useEffect } from 'react';
import {
  Building2, MapPin, Globe, Mail, Edit2,
  Camera, Check, X, UploadCloud, Loader2, Users,
  AlertCircle, ChevronRight, Info, Trash2, AlertTriangle // <-- Added new icons
} from 'lucide-react';
import { auth } from '../../firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { useNavigate } from 'react-router-dom'; // <-- Added to handle redirect

interface EmployerData {
  company_name: string;
  company_size: string;
  tagline: string;
  description: string;
  perks: string[];
  location: string;
  website: string;
  email: string;
}

export default function EmployerProfile() {
  const navigate = useNavigate(); // <-- Initialize navigate function
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false); // <-- Added delete state
  const [uid, setUid] = useState<string | null>(null);

  const [newPerk, setNewPerk] = useState('');

  const [formData, setFormData] = useState<EmployerData>({
    company_name: '',
    company_size: '1-10',
    tagline: '',
    description: '',
    perks: [],
    location: '',
    website: '',
    email: ''
  });

  const calculateCompletion = () => {
    let score = 0;
    if (formData.company_name) score += 20;
    if (formData.email) score += 20;
    if (formData.location) score += 15;
    if (formData.description && formData.description.length > 20) score += 20;
    if (formData.tagline) score += 10;
    if (formData.website) score += 5;
    if (formData.perks.length > 0) score += 10;
    return score;
  };

  const completionScore = calculateCompletion();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUid(user.uid);
        fetchProfile(user.uid);
      } else {
        setIsLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchProfile = async (firebaseUid: string) => {
    try {
      const res = await fetch(`http://localhost:8080/api/employer/profile/${firebaseUid}`);
      if (res.ok) {
        const data = await res.json();
        setFormData({
          company_name: data.company_name || '',
          company_size: data.company_size || '1-10',
          tagline: data.tagline || '',
          description: data.description || '',
          perks: data.perks || [],
          location: data.location || '',
          website: data.website || '',
          email: data.email || ''
        });
      }
    } catch (error) {
      console.error("Failed to load profile", error);
    } finally {
      setIsLoading(false);
    }
  };

  // System Logs
  const logSystemEvent = (action: string, details: string) => {
    if (!uid) return;
    fetch('http://localhost:8080/api/audit/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid, action, details })
    }).catch(err => console.error("Audit log failed (silent):", err));
  };

  const handleSave = async () => {
    if (!formData.company_name || !formData.email || !formData.location) {
      alert("Please fill out the required fields: Company Name, Location, and Email.");
      return;
    }

    if (!uid) return;
    setIsSaving(true);
    try {
      const res = await fetch(`http://localhost:8080/api/employer/profile/${uid}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        logSystemEvent('Updated Company Profile', `Updated profile details for: ${formData.company_name}`);
        setIsEditing(false);
      } else {
        alert("Failed to save changes.");
      }
    } catch (error) {
      console.error("Save error", error);
    } finally {
      setIsSaving(false);
    }
  };

  // --- NEW: Account Deletion Handler ---
  const handleDeleteAccount = async () => {
    const user = auth.currentUser;
    if (!user || !uid) return;

    const confirmDelete = window.confirm(
      "WARNING: Are you sure you want to delete your Employer account? Your company profile and job postings will be archived, and your login will be permanently removed. This action cannot be undone."
    );
    if (!confirmDelete) return;

    setIsDeleting(true);
    try {
      // 1. Tell backend to archive data and delete from active 'users' collection
      const res = await fetch(`http://localhost:8080/api/users/profile/${uid}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to archive and delete account data on the server.");
      }

      logSystemEvent('Deleted Employer Account', `Company account deleted for: ${formData.company_name}`);

      // 2. Delete Firebase Authentication
      await user.delete();

      alert("Employer account deleted and archived successfully.");

      // 3. Immediately redirect to login page
      navigate('/login', { replace: true });

    } catch (error: any) {
      console.error("Delete account error:", error);
      if (error.code === 'auth/requires-recent-login') {
        alert("For security reasons, you must log out and log back in before deleting your account.");
      } else {
        alert(`Error: ${error.message}`);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const addPerk = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newPerk.trim() !== '') {
      e.preventDefault();
      setFormData({ ...formData, perks: [...formData.perks, newPerk.trim()] });
      setNewPerk('');
    }
  };

  const removePerk = (perkToRemove: string) => {
    setFormData({ ...formData, perks: formData.perks.filter(p => p !== perkToRemove) });
  };

  const handleImageUploadDummy = (type: 'Profile Logo' | 'Cover Image') => {
    logSystemEvent(`Updated ${type}`, `Uploaded a new company ${type.toLowerCase()}.`);
    alert(`In a full implementation, this would upload your ${type} to Cloudinary.`);
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-96"><Loader2 className="animate-spin text-purple-600" size={40} /></div>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 fade-in pb-10">

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-zinc-900 dark:text-white flex items-center gap-3">
            <Building2 className="text-purple-600" /> Company Profile
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Design your employer brand to attract top student talent.</p>
        </div>

        {isEditing ? (
          <div className="flex items-center gap-3">
            <button onClick={() => { setIsEditing(false); fetchProfile(uid!); }} className="text-sm font-bold text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors">Cancel</button>
            <button onClick={handleSave} disabled={isSaving} className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white shadow-lg shadow-emerald-500/20 active:scale-95">
              {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
              {isSaving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        ) : (
          <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 shadow-sm active:scale-95">
            <Edit2 size={16} /> Edit Profile
          </button>
        )}
      </div>

      {/* PROGRESS BAR */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="w-10 h-10 rounded-full bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center shrink-0">
            <span className="text-sm font-black text-purple-600 dark:text-purple-400">{completionScore}%</span>
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Profile Completeness</h3>
            <p className="text-[11px] text-zinc-500 font-medium">Students are 3x more likely to apply to complete profiles.</p>
          </div>
        </div>
        <div className="w-full sm:w-1/2 bg-zinc-100 dark:bg-zinc-800 rounded-full h-2.5 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-1000 ${completionScore === 100 ? 'bg-emerald-500' : 'bg-purple-500'}`}
            style={{ width: `${completionScore}%` }}
          ></div>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm">

        {/* Banner */}
        <div className="h-48 sm:h-64 bg-zinc-200 dark:bg-zinc-800 relative group overflow-hidden">
          <img src="https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80" alt="Company Banner" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
          {isEditing && (
            <div onClick={() => handleImageUploadDummy('Cover Image')} className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm cursor-pointer">
              <span className="flex items-center gap-2 bg-white/20 text-white px-5 py-2.5 rounded-xl font-bold backdrop-blur-md border border-white/30"><Camera size={18} /> Update Cover Image</span>
            </div>
          )}
        </div>

        {/* Profile Info */}
        <div className="px-6 sm:px-10 pb-10 relative">

          {/* Logo Avatar */}
          <div className="relative -mt-16 sm:-mt-20 mb-8 flex justify-between items-end">
            <div className="w-32 h-32 sm:w-40 sm:h-40 bg-white dark:bg-zinc-950 rounded-3xl border-4 border-white dark:border-zinc-950 shadow-xl overflow-hidden group relative">
              <div className="w-full h-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-4xl sm:text-5xl font-black text-white">
                {formData.company_name ? formData.company_name.charAt(0).toUpperCase() : 'C'}
              </div>
              {isEditing && (
                <div onClick={() => handleImageUploadDummy('Profile Logo')} className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <UploadCloud size={28} className="text-white drop-shadow-md" />
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

            <div className="lg:col-span-8 space-y-10">

              {/* Name & Tagline */}
              <div>
                {isEditing ? (
                  <div className="space-y-4">
                    <div>
                      <label className="text-[11px] font-black text-zinc-400 uppercase tracking-wider mb-1 flex items-center gap-1">Company Name <span className="text-red-500">*</span></label>
                      <input name="company_name" value={formData.company_name} onChange={handleChange} className="text-3xl font-black bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-purple-500/50 text-zinc-900 dark:text-white w-full transition-all" placeholder="E.g. TechFlow Inc." />
                    </div>
                    <div>
                      <label className="text-[11px] font-black text-zinc-400 uppercase tracking-wider mb-1 flex items-center gap-1">Company Tagline <span className="text-zinc-300 dark:text-zinc-600 font-medium normal-case tracking-normal">(Recommended)</span></label>
                      <input name="tagline" value={formData.tagline} onChange={handleChange} className="text-sm text-zinc-700 dark:text-zinc-300 font-medium bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-purple-500/50 w-full transition-all" placeholder="E.g. Innovating the future of enterprise software." />
                    </div>
                  </div>
                ) : (
                  <div>
                    <h2 className="text-3xl sm:text-4xl font-black text-zinc-900 dark:text-white tracking-tight">
                      {formData.company_name || <span className="text-zinc-300 dark:text-zinc-700 italic">Company Name Setup Required</span>}
                    </h2>
                    <p className="text-zinc-500 dark:text-zinc-400 font-medium mt-2 text-base">
                      {formData.tagline || <span className="italic">Add a catchy tagline to attract students.</span>}
                    </p>
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-white">About the Company</h3>
                  {isEditing && <span className="text-[10px] font-black text-red-500 uppercase tracking-wider bg-red-50 dark:bg-red-500/10 px-2 py-0.5 rounded">Required</span>}
                </div>

                {isEditing ? (
                  <textarea
                    name="description"
                    rows={6}
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Describe your company's mission, culture, and what makes it a great place to work. Students look for growth opportunities and strong mentorship!"
                    className="w-full p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-700 outline-none focus:ring-2 focus:ring-purple-500/50 text-zinc-900 dark:text-white text-[13px] font-medium resize-none leading-relaxed transition-all"
                  />
                ) : (
                  <div className="text-[14px] text-zinc-600 dark:text-zinc-400 leading-relaxed font-medium whitespace-pre-wrap bg-zinc-50 dark:bg-zinc-800/30 p-5 rounded-2xl border border-zinc-100 dark:border-zinc-800/50">
                    {formData.description || <span className="italic flex items-center gap-2"><Info size={16} className="text-purple-500" /> Your "About Us" section is empty. Click 'Edit Profile' to tell your story.</span>}
                  </div>
                )}
              </div>

              {/* Perks */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Perks & Benefits</h3>
                  {isEditing && <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">Recommended</span>}
                </div>

                <div className="flex flex-wrap gap-2.5">
                  {formData.perks.map(perk => (
                    <span key={perk} className="flex items-center gap-1.5 px-4 py-2 bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-300 rounded-xl text-[13px] font-bold border border-purple-100 dark:border-purple-500/20 shadow-sm">
                      {perk}
                      {isEditing && <button onClick={() => removePerk(perk)} className="hover:bg-purple-200 dark:hover:bg-purple-500/30 rounded-full p-0.5 transition-colors ml-1"><X size={14} /></button>}
                    </span>
                  ))}

                  {isEditing && (
                    <input
                      type="text"
                      value={newPerk}
                      onChange={(e) => setNewPerk(e.target.value)}
                      onKeyDown={addPerk}
                      placeholder="+ Type perk & press Enter"
                      className="min-w-[200px] px-4 py-2 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 outline-none focus:border-purple-500 focus:bg-white text-[13px] font-medium dark:text-white transition-all"
                    />
                  )}

                  {!isEditing && formData.perks.length === 0 && (
                    <p className="text-[13px] text-zinc-500 italic bg-zinc-50 dark:bg-zinc-800/30 px-4 py-2 rounded-xl">No perks listed yet.</p>
                  )}
                </div>
              </div>
            </div>

            {/* LOGISTICS SIDEBAR */}
            <div className="lg:col-span-4">
              <div className="bg-zinc-50 dark:bg-zinc-800/40 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 space-y-6 sticky top-6">
                <h3 className="font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                  Company Logistics
                </h3>

                <div className="space-y-5">
                  {/* Size */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black text-zinc-400 uppercase tracking-wider flex items-center gap-1">Company Size <span className="text-red-500">*</span></label>
                    <div className="flex items-center gap-3 text-[13px] font-medium text-zinc-700 dark:text-zinc-300">
                      <div className="w-9 h-9 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center shrink-0 shadow-sm"><Users size={16} className="text-emerald-500" /></div>
                      {isEditing ? (
                        <select name="company_size" value={formData.company_size} onChange={handleChange} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-purple-500/50 w-full transition-all">
                          <option value="1-10">1-10 Employees</option>
                          <option value="11-50">11-50 Employees</option>
                          <option value="51-200">51-200 Employees</option>
                          <option value="201-500">201-500 Employees</option>
                          <option value="500+">500+ Employees</option>
                        </select>
                      ) : <span>{formData.company_size} Employees</span>}
                    </div>
                  </div>

                  {/* Location */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black text-zinc-400 uppercase tracking-wider flex items-center gap-1">Headquarters <span className="text-red-500">*</span></label>
                    <div className="flex items-center gap-3 text-[13px] font-medium text-zinc-700 dark:text-zinc-300">
                      <div className="w-9 h-9 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center shrink-0 shadow-sm"><MapPin size={16} className="text-purple-500" /></div>
                      {isEditing ? (
                        <input name="location" value={formData.location} onChange={handleChange} placeholder="e.g. San Francisco, CA" className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-purple-500/50 w-full transition-all" />
                      ) : <span>{formData.location || <span className="text-red-500 italic">Location Required</span>}</span>}
                    </div>
                  </div>

                  {/* Website */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black text-zinc-400 uppercase tracking-wider">Website</label>
                    <div className="flex items-center gap-3 text-[13px] font-medium text-zinc-700 dark:text-zinc-300">
                      <div className="w-9 h-9 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center shrink-0 shadow-sm"><Globe size={16} className="text-blue-500" /></div>
                      {isEditing ? (
                        <input name="website" value={formData.website} onChange={handleChange} placeholder="https://..." className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-purple-500/50 w-full transition-all" />
                      ) : (
                        formData.website ? <a href={formData.website.startsWith('http') ? formData.website : `https://${formData.website}`} target="_blank" rel="noreferrer" className="hover:text-purple-600 dark:hover:text-purple-400 hover:underline flex items-center gap-1">{formData.website} <ChevronRight size={14} /></a> : <span className="text-zinc-400 italic">Not provided</span>
                      )}
                    </div>
                  </div>

                  {/* Email */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black text-zinc-400 uppercase tracking-wider flex items-center gap-1">Contact Email <span className="text-red-500">*</span></label>
                    <div className="flex items-center gap-3 text-[13px] font-medium text-zinc-700 dark:text-zinc-300">
                      <div className="w-9 h-9 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center shrink-0 shadow-sm"><Mail size={16} className="text-amber-500" /></div>
                      {isEditing ? (
                        <input name="email" type="email" value={formData.email} onChange={handleChange} placeholder="careers@company.com" className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-purple-500/50 w-full transition-all" />
                      ) : <span>{formData.email || <span className="text-red-500 italic">Email Required</span>}</span>}
                    </div>
                  </div>
                </div>

                {/* Validation */}
                {isEditing && (
                  <div className="mt-6 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50 rounded-xl flex items-start gap-2 text-blue-700 dark:text-blue-300">
                    <Info size={16} className="shrink-0 mt-0.5" />
                    <p className="text-[11px] font-medium leading-relaxed">Fields marked with <span className="text-red-500 font-bold">*</span> are required. Your profile will be marked "Incomplete" to students if these are left blank.</p>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>

      <div className="mt-12 bg-white dark:bg-zinc-900 rounded-2xl border border-red-200 dark:border-red-900/50 shadow-sm overflow-hidden">
        <div className="bg-red-50 dark:bg-red-950/20 p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div>
              <h2 className="text-lg font-bold text-red-600 dark:text-red-500 mb-2 flex items-center gap-2">
                <AlertTriangle size={20} /> Danger Zone: Delete Account
              </h2>
              <p className="text-[13px] text-zinc-600 dark:text-zinc-400 font-medium max-w-2xl leading-relaxed">
                Deleting your employer account will permanently remove your login access, hide your job postings, and archive your company data. This action cannot be undone.
              </p>
            </div>
            <button
              onClick={handleDeleteAccount}
              disabled={isDeleting}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-xl transition-all shadow-sm shadow-red-500/20 disabled:opacity-50 flex items-center gap-2 shrink-0 self-start sm:self-center"
            >
              {isDeleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
              {isDeleting ? "Deleting..." : "Delete Account"}
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}