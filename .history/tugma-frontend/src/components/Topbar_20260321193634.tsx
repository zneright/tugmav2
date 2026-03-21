import { useState, useEffect, useRef } from 'react';
import { 
  Camera, Upload, MapPin, Briefcase, GraduationCap, 
  Mail, Phone, FileText, Check, Loader2, Plus, X, Globe, DollarSign 
} from 'lucide-react';
import { auth } from '../../firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';

export default function StudentProfile() {
  const [uid, setUid] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // --- FORM STATE ---
  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    email: '',
    title: '',
    course: '',
    classification: '',
    address: '',
    expectedSalary: '',
    about: '',
    skills: [] as string[],
    languages: [] as string[],
    preferredLocations: [] as string[],
    education: {
      college: { school: '', years: '' },
      seniorHigh: { school: '', years: '' },
      highSchool: { school: '', years: '' },
      elementary: { school: '', years: '' }
    },
    resumeName: '',
    resumeData: '', // Base64
    profilePhoto: '', // Base64
    coverPhoto: '' // Base64
  });

  // --- INPUT REFS ---
  const profilePhotoRef = useRef<HTMLInputElement>(null);
  const coverPhotoRef = useRef<HTMLInputElement>(null);
  const resumeRef = useRef<HTMLInputElement>(null);

  // --- TAG INPUT STATES ---
  const [skillInput, setSkillInput] = useState('');
  const [langInput, setLangInput] = useState('');
  const [locInput, setLocInput] = useState('');

  // 1. FETCH PROFILE ON LOAD
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUid(user.uid);
        try {
          const res = await fetch(`http://localhost:8080/api/users/profile/${user.uid}`);
          if (res.ok) {
            const data = await res.json();
            setProfile({
              firstName: data.firstName || '',
              lastName: data.lastName || '',
              email: data.email || user.email || '',
              title: data.title || '',
              course: data.course || '',
              classification: data.classification || '',
              address: data.address || '',
              expectedSalary: data.expectedSalary || '',
              about: data.about || '',
              skills: Array.isArray(data.skills) ? data.skills : [],
              languages: Array.isArray(data.languages) ? data.languages : [],
              preferredLocations: Array.isArray(data.preferredLocations) ? data.preferredLocations : [],
              education: data.education || {
                college: { school: '', years: '' },
                seniorHigh: { school: '', years: '' },
                highSchool: { school: '', years: '' },
                elementary: { school: '', years: '' }
              },
              resumeName: data.resumeName || '',
              resumeData: data.resumeData || '',
              profilePhoto: data.profilePhoto || '',
              coverPhoto: data.coverPhoto || ''
            });
          }
        } catch (error) {
          console.error("Failed to load profile", error);
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // 2. SAVE PROFILE
  const handleSave = async () => {
    if (!uid) return;
    setIsSaving(true);
    try {
      const res = await fetch(`http://localhost:8080/api/users/profile/${uid}`, {
        method: 'POST', // Your backend uses POST for updates
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile)
      });
      
      if (res.ok) {
        alert("Profile saved successfully!");
      } else {
        alert("Failed to save profile.");
      }
    } catch (error) {
      console.error("Save error:", error);
      alert("Network error. Could not save.");
    } finally {
      setIsSaving(false);
    }
  };

  // --- FILE UPLOAD HANDLERS (Base64 Conversion) ---
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'profilePhoto' | 'coverPhoto' | 'resumeData', nameField?: 'resumeName') => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size (Limit to 5MB to prevent DB crash)
    if (file.size > 5 * 1024 * 1024) {
      alert("File is too large. Please select a file under 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setProfile(prev => ({
        ...prev,
        [field]: base64String,
        ...(nameField ? { [nameField]: file.name } : {})
      }));
    };
    reader.readAsDataURL(file);
  };

  // --- TAG HANDLERS (Skills, Languages, Locations) ---
  const handleAddTag = (e: React.KeyboardEvent, field: 'skills' | 'languages' | 'preferredLocations', inputVal: string, setInput: (v: string) => void) => {
    if (e.key === 'Enter' && inputVal.trim() !== '') {
      e.preventDefault();
      if (!profile[field].includes(inputVal.trim())) {
        setProfile(prev => ({ ...prev, [field]: [...prev[field], inputVal.trim()] }));
      }
      setInput('');
    }
  };

  const handleRemoveTag = (field: 'skills' | 'languages' | 'preferredLocations', tagToRemove: string) => {
    setProfile(prev => ({ ...prev, [field]: prev[field].filter(t => t !== tagToRemove) }));
  };

  if (isLoading) return <div className="flex justify-center items-center h-96"><Loader2 className="animate-spin text-purple-600" size={40} /></div>;

  return (
    <div className="max-w-5xl mx-auto space-y-6 fade-in pb-20">
      
      {/* --- HEADER: COVER & PROFILE PHOTO --- */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm">
        {/* Cover Photo */}
        <div className="h-48 sm:h-64 bg-zinc-200 dark:bg-zinc-800 relative group">
          {profile.coverPhoto ? (
             <img src={profile.coverPhoto} alt="Cover" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-zinc-400">No Cover Photo</div>
          )}
          <button onClick={() => coverPhotoRef.current?.click()} className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white p-2.5 rounded-xl backdrop-blur-md transition-colors opacity-0 group-hover:opacity-100 flex items-center gap-2 text-sm font-bold">
            <Camera size={16} /> Edit Cover
          </button>
          <input type="file" accept="image/*" ref={coverPhotoRef} className="hidden" onChange={(e) => handleFileUpload(e, 'coverPhoto')} />
        </div>

        <div className="px-6 sm:px-10 pb-8">
          <div className="flex flex-col sm:flex-row gap-6 sm:items-end -mt-16 sm:-mt-20 relative z-10">
            {/* Profile Photo */}
            <div className="relative group shrink-0">
              <div className="w-32 h-32 sm:w-40 sm:h-40 bg-purple-100 dark:bg-purple-900 rounded-3xl border-4 border-white dark:border-zinc-900 shadow-lg overflow-hidden flex items-center justify-center text-4xl font-black text-purple-600">
                {profile.profilePhoto ? (
                  <img src={profile.profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  profile.firstName.charAt(0) || 'U'
                )}
              </div>
              <button onClick={() => profilePhotoRef.current?.click()} className="absolute bottom-2 right-2 bg-purple-600 text-white p-2 rounded-xl shadow-lg hover:bg-purple-700 transition-transform hover:scale-105 active:scale-95">
                <Camera size={16} />
              </button>
              <input type="file" accept="image/*" ref={profilePhotoRef} className="hidden" onChange={(e) => handleFileUpload(e, 'profilePhoto')} />
            </div>

            <div className="flex-1 pb-2 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-3xl font-black text-zinc-900 dark:text-white">
                  {profile.firstName || 'First Name'} {profile.lastName || 'Last Name'}
                </h1>
                <input 
                  type="text" 
                  value={profile.title} 
                  onChange={(e) => setProfile({...profile, title: e.target.value})}
                  placeholder="Professional Title (e.g. Web Developer)" 
                  className="bg-transparent border-none outline-none text-purple-600 dark:text-purple-400 font-bold p-0 w-full mt-1 placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
                />
              </div>
              <button onClick={handleSave} disabled={isSaving} className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-lg shadow-purple-500/20 transition-all flex items-center gap-2 w-full sm:w-auto justify-center disabled:opacity-50">
                {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />} 
                {isSaving ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* --- LEFT COLUMN --- */}
        <div className="space-y-6">
          
          {/* Basic Info */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="font-black text-zinc-900 dark:text-white mb-4">Basic Details</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">First Name</label>
                <input type="text" value={profile.firstName} onChange={(e) => setProfile({...profile, firstName: e.target.value})} className="w-full bg-zinc-50 dark:bg-zinc-800/50 px-3 py-2 rounded-xl text-sm font-bold dark:text-white mt-1 border border-zinc-200 dark:border-zinc-700 outline-none" />
              </div>
              <div>
                <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Last Name</label>
                <input type="text" value={profile.lastName} onChange={(e) => setProfile({...profile, lastName: e.target.value})} className="w-full bg-zinc-50 dark:bg-zinc-800/50 px-3 py-2 rounded-xl text-sm font-bold dark:text-white mt-1 border border-zinc-200 dark:border-zinc-700 outline-none" />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1"><GraduationCap size={12}/> Course</label>
              <input type="text" value={profile.course} onChange={(e) => setProfile({...profile, course: e.target.value})} placeholder="e.g. BS Information Technology" className="w-full bg-zinc-50 dark:bg-zinc-800/50 px-3 py-2 rounded-xl text-sm font-bold dark:text-white mt-1 border border-zinc-200 dark:border-zinc-700 outline-none" />
            </div>

            <div>
              <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1"><MapPin size={12}/> Address</label>
              <input type="text" value={profile.address} onChange={(e) => setProfile({...profile, address: e.target.value})} placeholder="e.g. Manila, Philippines" className="w-full bg-zinc-50 dark:bg-zinc-800/50 px-3 py-2 rounded-xl text-sm font-bold dark:text-white mt-1 border border-zinc-200 dark:border-zinc-700 outline-none" />
            </div>
            
            <div>
              <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1"><DollarSign size={12}/> Expected Salary</label>
              <input type="text" value={profile.expectedSalary} onChange={(e) => setProfile({...profile, expectedSalary: e.target.value})} placeholder="e.g. ₱20,000 / month" className="w-full bg-zinc-50 dark:bg-zinc-800/50 px-3 py-2 rounded-xl text-sm font-bold dark:text-white mt-1 border border-zinc-200 dark:border-zinc-700 outline-none" />
            </div>
          </div>

          {/* Resume Upload */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm">
            <h3 className="font-black text-zinc-900 dark:text-white mb-4 flex items-center gap-2"><FileText size={18} className="text-purple-500" /> Resume / CV</h3>
            <div 
              onClick={() => resumeRef.current?.click()} 
              className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${profile.resumeData ? 'border-purple-300 bg-purple-50 dark:bg-purple-900/10' : 'border-zinc-300 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'}`}
            >
              {profile.resumeData ? (
                <>
                  <FileText size={32} className="text-purple-600 mb-2" />
                  <p className="font-bold text-sm text-purple-900 dark:text-purple-300">{profile.resumeName}</p>
                  <p className="text-[10px] text-purple-600 font-bold mt-2 uppercase tracking-wider">Click to replace</p>
                </>
              ) : (
                <>
                  <Upload size={32} className="text-zinc-400 mb-2" />
                  <p className="font-bold text-sm text-zinc-700 dark:text-zinc-300">Upload PDF Resume</p>
                  <p className="text-xs text-zinc-500 mt-1">Max size 5MB</p>
                </>
              )}
              <input type="file" accept=".pdf" ref={resumeRef} className="hidden" onChange={(e) => handleFileUpload(e, 'resumeData', 'resumeName')} />
            </div>
          </div>

        </div>

        {/* --- RIGHT COLUMN --- */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* About Me */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm">
            <h3 className="font-black text-zinc-900 dark:text-white mb-4">About Me</h3>
            <textarea 
              value={profile.about} 
              onChange={(e) => setProfile({...profile, about: e.target.value})}
              placeholder="Tell employers about yourself, your goals, and what you can bring to the team..."
              rows={5}
              className="w-full bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-2xl text-sm font-medium dark:text-white border border-zinc-200 dark:border-zinc-700 outline-none focus:ring-2 focus:ring-purple-500/20 resize-none leading-relaxed"
            />
          </div>

          {/* Arrays (Skills, Languages, Locations) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Skills */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm">
              <h3 className="font-black text-zinc-900 dark:text-white mb-4 flex items-center gap-2"><Briefcase size={16} className="text-emerald-500" /> Skills</h3>
              <div className="flex flex-wrap gap-2 mb-3">
                {profile.skills.map(skill => (
                  <span key={skill} className="bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 px-3 py-1.5 rounded-lg text-xs font-bold border border-emerald-200 dark:border-emerald-800/50 flex items-center gap-1.5">
                    {skill} <button onClick={() => handleRemoveTag('skills', skill)}><X size={12} className="hover:text-emerald-900 dark:hover:text-white" /></button>
                  </span>
                ))}
              </div>
              <input type="text" value={skillInput} onChange={(e) => setSkillInput(e.target.value)} onKeyDown={(e) => handleAddTag(e, 'skills', skillInput, setSkillInput)} placeholder="Type skill and press Enter..." className="w-full bg-zinc-50 dark:bg-zinc-800/50 px-3 py-2.5 rounded-xl text-xs font-medium dark:text-white border border-zinc-200 dark:border-zinc-700 outline-none" />
            </div>

            {/* Languages */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm">
              <h3 className="font-black text-zinc-900 dark:text-white mb-4 flex items-center gap-2"><Globe size={16} className="text-blue-500" /> Languages</h3>
              <div className="flex flex-wrap gap-2 mb-3">
                {profile.languages.map(lang => (
                  <span key={lang} className="bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 px-3 py-1.5 rounded-lg text-xs font-bold border border-blue-200 dark:border-blue-800/50 flex items-center gap-1.5">
                    {lang} <button onClick={() => handleRemoveTag('languages', lang)}><X size={12} className="hover:text-blue-900 dark:hover:text-white" /></button>
                  </span>
                ))}
              </div>
              <input type="text" value={langInput} onChange={(e) => setLangInput(e.target.value)} onKeyDown={(e) => handleAddTag(e, 'languages', langInput, setLangInput)} placeholder="Type language and press Enter..." className="w-full bg-zinc-50 dark:bg-zinc-800/50 px-3 py-2.5 rounded-xl text-xs font-medium dark:text-white border border-zinc-200 dark:border-zinc-700 outline-none" />
            </div>
            
          </div>

          {/* Education Block */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm">
            <h3 className="font-black text-zinc-900 dark:text-white mb-5 flex items-center gap-2"><GraduationCap size={18} className="text-amber-500" /> Education History</h3>
            
            <div className="space-y-4">
              {['college', 'seniorHigh', 'highSchool', 'elementary'].map((level) => (
                <div key={level} className="flex flex-col sm:flex-row gap-3">
                  <div className="w-full sm:w-1/4 shrink-0">
                    <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider capitalize block mt-2">{level.replace(/([A-Z])/g, ' $1').trim()}</label>
                  </div>
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <input 
                      type="text" 
                      value={(profile.education as any)[level]?.school || ''}
                      onChange={(e) => setProfile({
                        ...profile, 
                        education: { ...profile.education, [level]: { ...(profile.education as any)[level], school: e.target.value } }
                      })}
                      placeholder="School Name" 
                      className="sm:col-span-2 w-full bg-zinc-50 dark:bg-zinc-800/50 px-3 py-2 rounded-xl text-sm font-medium dark:text-white border border-zinc-200 dark:border-zinc-700 outline-none focus:ring-2 focus:ring-purple-500/20" 
                    />
                    <input 
                      type="text" 
                      value={(profile.education as any)[level]?.years || ''}
                      onChange={(e) => setProfile({
                        ...profile, 
                        education: { ...profile.education, [level]: { ...(profile.education as any)[level], years: e.target.value } }
                      })}
                      placeholder="Year (e.g. 2018-2022)" 
                      className="w-full bg-zinc-50 dark:bg-zinc-800/50 px-3 py-2 rounded-xl text-sm font-medium dark:text-white border border-zinc-200 dark:border-zinc-700 outline-none focus:ring-2 focus:ring-purple-500/20" 
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}