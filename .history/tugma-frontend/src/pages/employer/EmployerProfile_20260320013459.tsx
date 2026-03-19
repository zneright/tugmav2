import { useState, useEffect } from 'react';
import {
  Building2, MapPin, Globe, Mail, Edit2,
  Camera, Check, X, UploadCloud, Loader2
} from 'lucide-react';
import { auth } from '../../firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';

interface EmployerData {
  company_name: string;
  tagline: string;
  description: string;
  perks: string[];
  location: string;
  website: string;
  email: string;
}

export default function EmployerProfile() {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [uid, setUid] = useState<string | null>(null);

  const [newPerk, setNewPerk] = useState('');

  // Dynamic Form State
  const [formData, setFormData] = useState<EmployerData>({
    company_name: '',
    tagline: '',
    description: '',
    perks: [],
    location: '',
    website: '',
    email: ''
  });

  // 1. Listen for Firebase Auth State on component mount
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

  // 2. READ: Fetch Data from CodeIgniter
  const fetchProfile = async (firebaseUid: string) => {
    try {
      const res = await fetch(`http://localhost:8080/api/employer/profile/${firebaseUid}`);
      if (res.ok) {
        const data = await res.json();
        setFormData({
          company_name: data.company_name || '',
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

  // 3. UPDATE: Save changes to CodeIgniter
  const handleSave = async () => {
    if (!uid) return;
    setIsSaving(true);
    try {
      const res = await fetch(`http://localhost:8080/api/employer/profile/${uid}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
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

  // Generic Input Handler
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Perk Handlers
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

  if (isLoading) {
    return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-purple-600" size={40} /></div>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 fade-in pb-10">

      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-zinc-900 dark:text-white flex items-center gap-3">
            <Building2 className="text-purple-600" /> Company Profile
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">This is how students see your company.</p>
        </div>

        {/* Toggle Edit/Save */}
        {isEditing ? (
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm transition-all bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white shadow-emerald-500/20"
          >
            {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm transition-all bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800"
          >
            <Edit2 size={18} /> Edit Profile
          </button>
        )}
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm">

        {/* Banner Section */}
        <div className="h-48 sm:h-64 bg-zinc-200 dark:bg-zinc-800 relative group">
          <img src="https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80" alt="Company Banner" className="w-full h-full object-cover" />
          {isEditing && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm cursor-pointer">
              <span className="flex items-center gap-2 bg-white/20 text-white px-4 py-2 rounded-xl font-bold backdrop-blur-md border border-white/30"><Camera size={18} /> Change Cover</span>
            </div>
          )}
        </div>

        {/* Profile Info Overlay */}
        <div className="px-6 sm:px-10 pb-10 relative">

          {/* Logo */}
          <div className="relative -mt-16 sm:-mt-20 mb-6 flex justify-between items-end">
            <div className="w-32 h-32 sm:w-40 sm:h-40 bg-white dark:bg-zinc-950 rounded-3xl border-4 border-white dark:border-zinc-950 shadow-xl overflow-hidden group relative">
              <div className="w-full h-full bg-purple-600 flex items-center justify-center text-4xl font-black text-white">
                {formData.company_name ? formData.company_name.charAt(0).toUpperCase() : 'C'}
              </div>
              {isEditing && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <UploadCloud size={24} className="text-white" />
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              <div>
                {isEditing ? (
                  <input
                    name="company_name"
                    value={formData.company_name}
                    onChange={handleChange}
                    className="text-3xl font-black bg-transparent border-b-2 border-purple-500 outline-none text-zinc-900 dark:text-white w-full pb-1"
                    placeholder="Company Name"
                  />
                ) : (
                  <h2 className="text-3xl font-black text-zinc-900 dark:text-white">{formData.company_name || 'Your Company Name'}</h2>
                )}

                {isEditing ? (
                  <input
                    name="tagline"
                    value={formData.tagline}
                    onChange={handleChange}
                    className="mt-2 text-sm text-zinc-500 dark:text-zinc-400 font-medium bg-transparent border-b border-zinc-300 dark:border-zinc-700 outline-none w-full pb-1"
                    placeholder="Your short tagline..."
                  />
                ) : (
                  <p className="text-zinc-500 dark:text-zinc-400 font-medium mt-1">{formData.tagline || 'Add a tagline to stand out.'}</p>
                )}
              </div>

              <div className="space-y-3">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white">About Us</h3>
                {isEditing ? (
                  <textarea
                    name="description"
                    rows={6}
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Tell students about your mission and culture..."
                    className="w-full p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-700 outline-none focus:ring-2 focus:ring-purple-500/20 text-zinc-900 dark:text-white text-sm resize-none"
                  />
                ) : (
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed whitespace-pre-wrap">
                    {formData.description || 'No description provided yet.'}
                  </p>
                )}
              </div>

              <div className="space-y-3">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Company Perks & Benefits</h3>
                <div className="flex flex-wrap gap-2">
                  {formData.perks.map(perk => (
                    <span key={perk} className="flex items-center gap-1.5 px-4 py-2 bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-300 rounded-xl text-sm font-bold border border-purple-100 dark:border-purple-500/20">
                      {perk}
                      {isEditing && <button onClick={() => removePerk(perk)} className="hover:text-purple-900 dark:hover:text-white ml-1"><X size={14} /></button>}
                    </span>
                  ))}
                  {isEditing && (
                    <input
                      type="text"
                      value={newPerk}
                      onChange={(e) => setNewPerk(e.target.value)}
                      onKeyDown={addPerk}
                      placeholder="+ Add perk (Press Enter)"
                      className="min-w-[160px] px-4 py-2 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-700 outline-none text-sm dark:text-white"
                    />
                  )}
                  {!isEditing && formData.perks.length === 0 && (
                    <p className="text-sm text-zinc-500">No perks listed yet.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar Info (Contact Details) */}
            <div className="space-y-6">
              <div className="bg-zinc-50 dark:bg-zinc-800/50 p-6 rounded-3xl border border-zinc-100 dark:border-zinc-800/80 space-y-4">
                <h3 className="font-bold text-zinc-900 dark:text-white mb-2">Contact & Details</h3>

                <div className="flex items-center gap-3 text-sm text-zinc-600 dark:text-zinc-400">
                  <div className="w-8 h-8 rounded-lg bg-white dark:bg-zinc-800 flex items-center justify-center shrink-0 shadow-sm"><MapPin size={14} className="text-purple-500" /></div>
                  {isEditing ? (
                    <input name="location" value={formData.location} onChange={handleChange} placeholder="San Francisco, CA" className="bg-transparent border-b border-zinc-300 dark:border-zinc-600 outline-none w-full pb-1" />
                  ) : <span>{formData.location || 'Location not set'}</span>}
                </div>

                <div className="flex items-center gap-3 text-sm text-zinc-600 dark:text-zinc-400">
                  <div className="w-8 h-8 rounded-lg bg-white dark:bg-zinc-800 flex items-center justify-center shrink-0 shadow-sm"><Globe size={14} className="text-blue-500" /></div>
                  {isEditing ? (
                    <input name="website" value={formData.website} onChange={handleChange} placeholder="https://yourwebsite.com" className="bg-transparent border-b border-zinc-300 dark:border-zinc-600 outline-none w-full pb-1" />
                  ) : (
                    formData.website ? <a href={formData.website.startsWith('http') ? formData.website : `https://${formData.website}`} target="_blank" rel="noreferrer" className="hover:text-purple-500 hover:underline">{formData.website}</a> : <span>No website</span>
                  )}
                </div>

                <div className="flex items-center gap-3 text-sm text-zinc-600 dark:text-zinc-400">
                  <div className="w-8 h-8 rounded-lg bg-white dark:bg-zinc-800 flex items-center justify-center shrink-0 shadow-sm"><Mail size={14} className="text-amber-500" /></div>
                  {isEditing ? (
                    <input name="email" type="email" value={formData.email} onChange={handleChange} placeholder="careers@company.com" className="bg-transparent border-b border-zinc-300 dark:border-zinc-600 outline-none w-full pb-1" />
                  ) : <span>{formData.email || 'Email not set'}</span>}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}