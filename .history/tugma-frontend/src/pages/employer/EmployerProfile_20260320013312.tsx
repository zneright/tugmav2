import { useState, useEffect } from 'react';
import {
  Building2, MapPin, Globe, Mail, Edit2,
  Camera, Check, X, UploadCloud, Loader2
} from 'lucide-react';
import { auth } from '../firebaseConfig'; // ⚠️ UPDATE THIS PATH IF NEEDED
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
  const [uid, setUid] = useState<string | null>(null);

  const [newPerk, setNewPerk] = useState('');

  // Dynamic State for the Form
  const [formData, setFormData] = useState<EmployerData>({
    company_name: '',
    tagline: '',
    description: '',
    perks: [],
    location: '',
    website: '',
    email: ''
  });

  // 1. Listen for Firebase Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUid(user.uid);
        fetchProfile(user.uid);
      } else {
        setIsLoading(false); // Not logged in
      }
    });
    return () => unsubscribe();
  }, []);

  // 2. READ Data
  const fetchProfile = async (firebaseUid: string) => {
    try {
      const res = await fetch(`http://localhost:8080/api/employer/profile/${firebaseUid}`);
      if (res.ok) {
        const data = await res.json();
        setFormData({
          company_name: data.company_name || 'Your Company Name',
          tagline: data.tagline || 'Your tagline here',
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

  // 3. UPDATE Data
  const handleSave = async () => {
    if (!uid) return;
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

  if (isLoading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-purple-500" size={40} /></div>;

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
          <button onClick={handleSave} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm transition-all bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20">
            <Check size={18} /> Save Changes
          </button>
        ) : (
          <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm transition-all bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800">
            <Edit2 size={18} /> Edit Profile
          </button>
        )}
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm">

        {/* Banner Section */}
        <div className="h-48 sm:h-64 bg-zinc-200 dark:bg-zinc-800 relative group">
          <img src="https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80" alt="Company Banner" className="w-full h-full object-cover" />
        </div>

        {/* Profile Info Overlay */}
        <div className="px-6 sm:px-10 pb-10 relative">

          {/* Logo */}
          <div className="relative -mt-16 sm:-mt-20 mb-6 flex justify-between items-end">
            <div className="w-32 h-32 sm:w-40 sm:h-40 bg-white dark:bg-zinc-950 rounded-3xl border-4 border-white dark:border-zinc-950 shadow-xl overflow-hidden group relative">
              <div className="w-full h-full bg-purple-600 flex items-center justify-center text-4xl font-black text-white">
                {formData.company_name ? formData.company_name.charAt(0).toUpperCase() : 'C'}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              <div>
                {isEditing ? (
                  <input name="company_name" value={formData.company_name} onChange={handleChange} className="text-3xl font-black bg-transparent border-b-2 border-purple-500 outline-none text-zinc-900 dark:text-white w-full pb-1" placeholder="Company Name" />
                ) : (
                  <h2 className="text-3xl font-black text-zinc-900 dark:text-white">{formData.company_name}</h2>
                )}

                {isEditing ? (
                  <input name