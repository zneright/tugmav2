import { useState } from 'react';
import {
  Building2, MapPin, Globe, Mail, Phone, Edit2,
  Camera, Check, X, UploadCloud
} from 'lucide-react';

export default function EmployerProfile() {
  const [isEditing, setIsEditing] = useState(false);
  const [perks, setPerks] = useState(['Remote Work', 'Health Insurance', 'Learning Budget']);
  const [newPerk, setNewPerk] = useState('');

  const addPerk = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newPerk.trim() !== '') {
      e.preventDefault();
      setPerks([...perks, newPerk.trim()]);
      setNewPerk('');
    }
  };

  const removePerk = (perkToRemove: string) => {
    setPerks(perks.filter(p => p !== perkToRemove));
  };

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
        <button
          onClick={() => setIsEditing(!isEditing)}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm transition-all ${isEditing
            ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20'
            : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800'
            }`}
        >
          {isEditing ? <><Check size={18} /> Save Changes</> : <><Edit2 size={18} /> Edit Profile</>}
        </button>
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
              <div className="w-full h-full bg-purple-600 flex items-center justify-center text-4xl font-black text-white">TF</div>
              {isEditing && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <UploadCloud size={24} className="text-white" />
                </div>
              )}
            </div>
          </div>

          {/* Details Form / View */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

            {/* Main Content (Left 2 columns) */}
            <div className="lg:col-span-2 space-y-8">
              <div>
                {isEditing ? (
                  <input type="text" defaultValue="TechFlow Inc." className="text-3xl font-black bg-transparent border-b-2 border-purple-500 outline-none text-zinc-900 dark:text-white w-full pb-1" />
                ) : (
                  <h2 className="text-3xl font-black text-zinc-900 dark:text-white">TechFlow Inc.</h2>
                )}
                <p className="text-zinc-500 dark:text-zinc-400 font-medium mt-1">Innovating the future of enterprise software.</p>
              </div>

              <div className="space-y-3">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white">About Us</h3>
                {isEditing ? (
                  <textarea rows={6} defaultValue="TechFlow is a leading software company dedicated to building intuitive and powerful tools for modern businesses. We believe in a remote-first culture, continuous learning, and pushing the boundaries of what's possible." className="w-full p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-700 outline-none focus:ring-2 focus:ring-purple-500/20 text-zinc-900 dark:text-white text-sm resize-none" />
                ) : (
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    TechFlow is a leading software company dedicated to building intuitive and powerful tools for modern businesses. We believe in a remote-first culture, continuous learning, and pushing the boundaries of what's possible.
                  </p>
                )}
              </div>

              <div className="space-y-3">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Company Perks & Benefits</h3>
                <div className="flex flex-wrap gap-2">
                  {perks.map(perk => (
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
                </div>
              </div>
            </div>

            {/* Sidebar Info (Right Column) */}
            <div className="space-y-6">
              <div className="bg-zinc-50 dark:bg-zinc-800/50 p-6 rounded-3xl border border-zinc-100 dark:border-zinc-800/80 space-y-4">
                <h3 className="font-bold text-zinc-900 dark:text-white mb-2">Contact & Details</h3>

                <div className="flex items-center gap-3 text-sm text-zinc-600 dark:text-zinc-400">
                  <div className="w-8 h-8 rounded-lg bg-white dark:bg-zinc-800 flex items-center justify-center shrink-0 shadow-sm"><MapPin size={14} className="text-purple-500" /></div>
                  {isEditing ? <input type="text" defaultValue="San Francisco, CA" className="bg-transparent border-b border-zinc-300 dark:border-zinc-600 outline-none w-full" /> : <span>San Francisco, CA (HQ)</span>}
                </div>

                <div className="flex items-center gap-3 text-sm text-zinc-600 dark:text-zinc-400">
                  <div className="w-8 h-8 rounded-lg bg-white dark:bg-zinc-800 flex items-center justify-center shrink-0 shadow-sm"><Globe size={14} className="text-blue-500" /></div>
                  {isEditing ? <input type="text" defaultValue="https://techflow.io" className="bg-transparent border-b border-zinc-300 dark:border-zinc-600 outline-none w-full" /> : <a href="#" className="hover:text-purple-500 hover:underline">techflow.io</a>}
                </div>

                <div className="flex items-center gap-3 text-sm text-zinc-600 dark:text-zinc-400">
                  <div className="w-8 h-8 rounded-lg bg-white dark:bg-zinc-800 flex items-center justify-center shrink-0 shadow-sm"><Mail size={14} className="text-amber-500" /></div>
                  {isEditing ? <input type="text" defaultValue="careers@techflow.io" className="bg-transparent border-b border-zinc-300 dark:border-zinc-600 outline-none w-full" /> : <span>careers@techflow.io</span>}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}