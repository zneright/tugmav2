import { useState } from 'react';
import { 
  MapPin, GraduationCap,  Edit2, Camera, 
  Clock, Check, 
} from 'lucide-react';

export default function StudentProfile() {
  // --- 1. STATE FOR EDIT PROFILE ---
  const [isEditing, setIsEditing] = useState(false);
  
  // Profile Data State (This allows us to type in the inputs and save it)
  const [profileData, setProfileData] = useState({
    name: "Nishia Pinlac",
    title: "IT Student | Aspiring Front-End Developer & Web Designer",
    location: "Malabon, Metro Manila",
    about: "I am a dedicated IT student passionate about creating beautiful and user-friendly digital experiences. I specialize in web design and front-end development, focusing on crafting responsive, modern interfaces. While I don't focus heavily on full-stack backend architecture, I have a strong eye for UI design and love bringing wireframes to life. I am currently seeking a 450-hour OJT opportunity where I can contribute my skills to real-world projects and learn from experienced developers."
  });




  return (
    <div className="space-y-6 pb-20 md:pb-8 animate-in fade-in duration-500">
      
      {/* --- HEADER & INTRO CARD --- */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">
        
        {/* Cover Photo */}
        <div className="h-32 sm:h-48 bg-gradient-to-r from-purple-600 via-purple-500 to-indigo-600 relative group cursor-pointer">
          <button className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full backdrop-blur-sm transition-colors opacity-0 group-hover:opacity-100">
            <Camera size={18} />
          </button>
        </div>

        <div className="px-4 sm:px-6 pb-6 relative">
          
          <div className="flex justify-between items-end -mt-12 sm:-mt-16 mb-4 relative z-10">
            <div className="relative group cursor-pointer">
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-white dark:border-zinc-900 bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center overflow-hidden">
                <span className="text-4xl font-bold text-zinc-400">N</span>
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera size={24} className="text-white" />
                </div>
              </div>
            </div>
            
            {/* EDIT BUTTON LOGIC */}
            <div className="flex gap-2">
              <button 
                onClick={() => setIsEditing(!isEditing)}
                className={`p-2 sm:px-4 sm:py-2 rounded-lg transition-colors border flex items-center gap-2 text-sm font-bold shadow-sm ${
                  isEditing 
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-500' 
                    : 'bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 border-zinc-200 dark:border-zinc-700'
                }`}
              >
                {isEditing ? (
                  <><Check size={16} /> <span className="hidden sm:block">Save Profile</span></>
                ) : (
                  <><Edit2 size={16} /> <span className="hidden sm:block">Edit Profile</span></>
                )}
              </button>
            </div>
          </div>

          {/* EDITABLE USER DETAILS */}
          <div className="space-y-3">
            {isEditing ? (
              <div className="space-y-2 max-w-2xl">
                <input 
                  type="text" 
                  value={profileData.name}
                  onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                  className="w-full text-2xl font-bold bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-1 outline-none focus:ring-2 focus:ring-purple-500/20 dark:text-white"
                />
                <input 
                  type="text" 
                  value={profileData.title}
                  onChange={(e) => setProfileData({...profileData, title: e.target.value})}
                  className="w-full text-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-1 outline-none focus:ring-2 focus:ring-purple-500/20 text-zinc-600 dark:text-zinc-300"
                />
                <div className="flex items-center gap-2">
                  <MapPin size={16} className="text-zinc-400" />
                  <input 
                    type="text" 
                    value={profileData.location}
                    onChange={(e) => setProfileData({...profileData, location: e.target.value})}
                    className="flex-1 text-sm bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-1 outline-none focus:ring-2 focus:ring-purple-500/20 text-zinc-500 dark:text-zinc-400"
                  />
                </div>
              </div>
            ) : (
              <div>
                <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">{profileData.name}</h1>
                <p className="text-lg text-zinc-600 dark:text-zinc-300 mt-1">{profileData.title}</p>
                <div className="flex flex-wrap items-center gap-y-2 gap-x-4 mt-3 text-sm text-zinc-500 dark:text-zinc-400">
                  <span className="flex items-center gap-1.5"><MapPin size={16} /> {profileData.location}</span>
                  <span className="flex items-center gap-1.5"><GraduationCap size={16} /> STI College Caloocan</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* --- OJT REQUIREMENT TRACKER --- */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 sm:p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            <Clock className="text-purple-500" /> Internship Status
          </h2>
          <span className="bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400 text-xs font-bold px-3 py-1 rounded-full border border-green-200 dark:border-green-900/50">
            Actively Looking
          </span>
        </div>
        
        <div className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4">
          <div className="flex justify-between items-end mb-2">
            <div>
              <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Required Hours</p>
              <p className="text-2xl font-black text-zinc-900 dark:text-white">0 <span className="text-base font-medium text-zinc-500">/ 450 hrs</span></p>
            </div>
            <button className="text-sm font-medium text-purple-600 dark:text-purple-400 hover:underline">Log Hours</button>
          </div>
          <div className="w-full bg-zinc-200 dark:bg-zinc-800 rounded-full h-2.5 mb-1 mt-3">
            <div className="bg-purple-600 h-2.5 rounded-full" style={{ width: '0%' }}></div>
          </div>
          <p className="text-xs text-zinc-500 mt-2">Ready to start immediately. Available for remote or hybrid setups.</p>
        </div>
      </div>

      {/* --- EDITABLE ABOUT ME --- */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 sm:p-6 shadow-sm">
        <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-3">About</h2>
        {isEditing ? (
          <textarea 
            rows={5}
            value={profileData.about}
            onChange={(e) => setProfileData({...profileData, about: e.target.value})}
            className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl p-4 outline-none focus:ring-2 focus:ring-purple-500/20 text-zinc-900 dark:text-white text-sm resize-none"
          />
        ) : (
          <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
            {profileData.about}
          </p>
        )}
      </div>

      {/* --- SKILLS --- */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 sm:p-6 shadow-sm">
        <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-4">Top Skills</h2>
        <div className="flex flex-wrap gap-2">
          {['Web Design', 'Front-End Development', 'React', 'Tailwind CSS', 'Basic C#', '.NET MAUI', 'UI/UX'].map(skill => (
            <span key={skill} className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 text-sm font-medium rounded-lg">
              {skill}
            </span>
          ))}
          {isEditing && (
            <button className="px-3 py-1.5 bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/30 text-purple-600 dark:text-purple-400 text-sm font-bold rounded-lg hover:bg-purple-100 transition-colors">
              + Add Skill
            </button>
          )}
        </div>
      </div>

      
    </div>
  );
}