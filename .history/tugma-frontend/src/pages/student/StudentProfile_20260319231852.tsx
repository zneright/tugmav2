import { useState, useRef, useEffect } from 'react';
import {
  MapPin, GraduationCap, Edit2, Camera,
  Check, X, Plus, FileText, Upload,
  DollarSign, Briefcase, BookOpen, Target, Loader2, ChevronDown, User
} from 'lucide-react';
import { auth } from '../../firebaseConfig';

// Comprehensive Philippine Industry & CHED Classifications
const PHILIPPINE_CLASSIFICATIONS = [
  "Accounting, Finance & Economics",
  "Agriculture, Forestry & Fisheries",
  "Architecture & Environmental Planning",
  "Arts, Design & Multimedia",
  "Aviation & Aeronautics",
  "Business, Management & Administration",
  "Communication, Media & Broadcasting",
  "Education & Teacher Training",
  "Engineering (Civil, Mechanical, EE, CE, etc.)",
  "Healthcare & Allied Medicine (Nursing, MedTech, etc.)",
  "Hospitality, Tourism & Culinary Arts",
  "Human Resources & Psychology",
  "Information Technology & Computer Science",
  "Law, Public Administration & Criminal Justice",
  "Manufacturing, Logistics & Supply Chain",
  "Maritime Studies",
  "Science & Mathematics",
  "Social Sciences & Humanities"
];

export default function StudentProfile() {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [modalImage, setModalImage] = useState<string | null>(null);

  // --- FILE REFS ---
  const fileInputRef = useRef<HTMLInputElement>(null);
  const profilePhotoRef = useRef<HTMLInputElement>(null);
  const coverPhotoRef = useRef<HTMLInputElement>(null);

  // --- STATE: MAIN PROFILE DATA ---
  const [profileData, setProfileData] = useState({
    firstName: "",
    lastName: "",
    title: "",
    address: "",
    classification: "Information Technology & Computer Science",
    course: "",
    expectedSalary: "",
    about: "",
    resumeName: "",
    profilePhoto: "",
    coverPhoto: "",

    // Education Object
    education: {
      elementary: "",
      highSchool: "",
      seniorHighSchool: "",
      college: ""
    },

    // OJT Tracker Data (Shared with OJT Tracker Page)
    ojt: {
      status: "Actively Looking",
      requiredHours: 450,
      completedHours: 0
    },

    // Array Data for Tags
    skills: [] as string[],
    languages: [] as string[],
    preferredLocations: [] as string[]
  });

  const [newSkill, setNewSkill] = useState('');
  const [newLanguage, setNewLanguage] = useState('');
  const [newLocation, setNewLocation] = useState('');

  // =================================================================
  // 1. FETCH DATA ON LOAD
  // =================================================================
  useEffect(() => {
    const fetchProfile = async () => {
      const unsubscribe = auth.onAuthStateChanged(async (user) => {
        if (user) {
          try {
            const response = await fetch(`http://localhost:8080/api/users/profile/${user.uid}`);
            if (response.ok) {
              const data = await response.json();
              setProfileData(prev => ({
                ...prev,
                ...data,
                address: data.address || data.location || "",
                education: { ...prev.education, ...(data.education || {}) },
                ojt: { ...prev.ojt, ...(data.ojt || {}) },
                skills: data.skills || [],
                languages: data.languages || [],
                preferredLocations: data.preferredLocations || []
              }));
            }
          } catch (error) {
            console.error("Failed to fetch profile:", error);
          } finally {
            setIsLoading(false);
          }
        } else {
          setIsLoading(false);
        }
      });
      return () => unsubscribe();
    };

    fetchProfile();
  }, []);

  // =================================================================
  // 2. SAVE DATA
  // =================================================================
  const handleSaveProfile = async () => {
    const user = auth.currentUser;
    if (!user) return;

    setIsSaving(true);
    try {
      const response = await fetch(`http://localhost:8080/api/users/profile/${user.uid}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData)
      });

      if (!response.ok) throw new Error("Failed to save");
      setIsEditing(false);
    } catch (error) {
      console.error("Error saving profile:", error);
      alert("Failed to save profile. Make sure the backend is running.");
    } finally {
      setIsSaving(false);
    }
  };

  // --- HANDLERS: IMAGE UPLOADS ---
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'profilePhoto' | 'coverPhoto') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileData(prev => ({ ...prev, [field]: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  // --- HANDLERS: TAGS & FILES ---
  const handleAddTag = (type: 'skills' | 'languages' | 'preferredLocations', value: string, setter: any) => {
    if (value.trim() !== '' && !profileData[type].includes(value.trim())) {
      setProfileData({ ...profileData, [type]: [...profileData[type], value.trim()] });
      setter('');
    }
  };

  const handleRemoveTag = (type: 'skills' | 'languages' | 'preferredLocations', indexToRemove: number) => {
    setProfileData({
      ...profileData,
      [type]: profileData[type].filter((_, index) => index !== indexToRemove)
    });
  };

  const handleResumeUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setProfileData({ ...profileData, resumeName: e.target.files[0].name });
    }
  };

  if (isLoading) {
    return <div className="h-96 flex items-center justify-center text-white"><Loader2 className="animate-spin text-purple-500" size={40} /></div>;
  }

  // Common Input Styles
  const inputClass = "w-full pl-11 pr-4 py-3 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 rounded-xl outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 transition-all text-[13px] font-medium text-zinc-900 dark:text-white shadow-sm placeholder:text-zinc-400";
  const selectClass = "w-full pl-11 pr-10 py-3 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 rounded-xl outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 transition-all text-[13px] font-medium text-zinc-900 dark:text-white shadow-sm appearance-none cursor-pointer";

  return (
    <div className="space-y-6 pb-20 md:pb-8 animate-in fade-in duration-500 max-w-5xl mx-auto">

      {/* Hidden File Inputs for Images */}
      <input type="file" accept="image/*" className="hidden" ref={profilePhotoRef} onChange={(e) => handleImageUpload(e, 'profilePhoto')} />
      <input type="file" accept="image/*" className="hidden" ref={coverPhotoRef} onChange={(e) => handleImageUpload(e, 'coverPhoto')} />

      {/* --- HEADER & INTRO CARD --- */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">

        {/* Cover Photo Area */}
        <div
          className={`h-32 sm:h-48 relative group bg-cover bg-center ${profileData.coverPhoto ? 'cursor-pointer' : ''}`}
          style={{
            backgroundImage: profileData.coverPhoto ? `url(${profileData.coverPhoto})` : 'linear-gradient(to right, #9333ea, #8b5cf6, #4f46e5)'
          }}
          onClick={() => profileData.coverPhoto && !isEditing && setModalImage(profileData.coverPhoto)}
        >
          {isEditing && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                coverPhotoRef.current?.click();
              }}
              className="absolute top-4 right-4 p-2.5 bg-black/40 hover:bg-black/60 text-white rounded-full backdrop-blur-md transition-colors shadow-lg"
            >
              <Camera size={18} />
            </button>
          )}
        </div>

        <div className="px-5 sm:px-8 pb-8 relative">
          <div className="flex justify-between items-end -mt-12 sm:-mt-16 mb-6 relative z-10">

            {/* Profile Photo Area */}
            <div className="relative group">
              <div
                className={`w-24 h-24 sm:w-32 sm:h-32 rounded-full border-[5px] border-white dark:border-zinc-900 bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center overflow-hidden shadow-md relative ${profileData.profilePhoto ? 'cursor-pointer' : ''}`}
                onClick={() => profileData.profilePhoto && !isEditing && setModalImage(profileData.profilePhoto)}
              >
                {profileData.profilePhoto ? (
                  <img src={profileData.profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl font-bold text-zinc-400">{profileData.firstName?.charAt(0) || "U"}</span>
                )}

                {isEditing && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      profilePhotoRef.current?.click();
                    }}
                    className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  >
                    <Camera size={26} className="text-white" />
                  </button>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              {isEditing ? (
                <button
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-sm shadow-emerald-500/20 flex items-center gap-2 transition-all disabled:opacity-50"
                >
                  {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                  <span className="hidden sm:block">{isSaving ? 'Saving...' : 'Save Profile'}</span>
                </button>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-6 py-2.5 rounded-xl bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 font-bold shadow-sm flex items-center gap-2 transition-all"
                >
                  <Edit2 size={18} /> <span className="hidden sm:block">Edit Profile</span>
                </button>
              )}
            </div>
          </div>

          {/* ================= EDITABLE USER DETAILS ================= */}
          <div className="space-y-4">
            {isEditing ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-4xl">

                {/* Left Column */}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="relative">
                      <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                      <input type="text" value={profileData.firstName} onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })} className={inputClass} placeholder="First Name" />
                    </div>
                    <div className="relative">
                      <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                      <input type="text" value={profileData.lastName} onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })} className={inputClass} placeholder="Last Name" />
                    </div>
                  </div>

                  <div className="relative">
                    <Briefcase size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <input type="text" value={profileData.title} onChange={(e) => setProfileData({ ...profileData, title: e.target.value })} className={inputClass} placeholder="Professional Title (e.g. Aspiring Web Developer)" />
                  </div>

                  <div className="relative">
                    <GraduationCap size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <input type="text" value={profileData.course} onChange={(e) => setProfileData({ ...profileData, course: e.target.value })} className={inputClass} placeholder="Course (e.g. BS Information Technology)" />
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                  <div className="relative w-full">
                    <Target size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                    <select
                      value={profileData.classification}
                      onChange={(e) => setProfileData({ ...profileData, classification: e.target.value })}
                      className={selectClass}
                    >
                      {PHILIPPINE_CLASSIFICATIONS.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                  </div>

                  <div className="relative">
                    <MapPin size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <input type="text" value={profileData.address} onChange={(e) => setProfileData({ ...profileData, address: e.target.value })} className={inputClass} placeholder="Address (e.g. Malabon, Metro Manila)" />
                  </div>

                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500 font-extrabold text-[17px] leading-none">₱</span>
                    <input type="text" value={profileData.expectedSalary} onChange={(e) => setProfileData({ ...profileData, expectedSalary: e.target.value })} className={inputClass} placeholder="Expected Salary (e.g. 15,000 / Negotiable)" />
                  </div>
                </div>

              </div>
            ) : (
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white tracking-tight">
                  {profileData.firstName || "New"} {profileData.lastName || "Student"}
                </h1>
                <p className="text-base sm:text-lg text-zinc-600 dark:text-zinc-300 mt-1 font-medium">{profileData.title || "No title set"}</p>
                <div className="flex flex-wrap items-center gap-y-3 gap-x-6 mt-5 text-[13px] text-zinc-500 dark:text-zinc-400 font-semibold">
                  {profileData.course && <span className="flex items-center gap-2"><GraduationCap size={16} className="text-orange-500" /> {profileData.course}</span>}
                  {profileData.classification && <span className="flex items-center gap-2"><Briefcase size={16} className="text-blue-500" /> {profileData.classification}</span>}
                  {profileData.address && <span className="flex items-center gap-2"><MapPin size={16} className="text-purple-500" /> {profileData.address}</span>}
                  {profileData.expectedSalary && (
                    <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-100 dark:border-emerald-500/20">
                      <span className="font-extrabold text-[15px]">₱</span> {profileData.expectedSalary}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ================= MAIN CONTENT GRID ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* LEFT COLUMN */}
        <div className="lg:col-span-2 space-y-6">

          {/* --- OJT REQUIREMENT (Simple Card instead of full tracker) --- */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 sm:p-8 shadow-sm">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
              <Target className="text-purple-500" size={20} /> OJT Requirement
            </h2>

            {isEditing ? (
              <div className="max-w-xs relative">
                <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-2 block">Target / Required Hours</label>
                <input
                  type="number"
                  value={profileData.ojt.requiredHours}
                  onChange={(e) => setProfileData({ ...profileData, ojt: { ...profileData.ojt, requiredHours: Number(e.target.value) || 0 } })}
                  className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 rounded-xl outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 transition-all text-sm font-bold text-zinc-900 dark:text-white shadow-sm"
                />
              </div>
            ) : (
              <div className="flex items-end gap-2">
                <span className="text-4xl font-black text-zinc-900 dark:text-white tracking-tight">{profileData.ojt.requiredHours}</span>
                <span className="text-lg font-medium text-zinc-500 mb-1">hours</span>
              </div>
            )}

            <p className="text-[13px] text-zinc-500 mt-4 font-medium">This requirement will be synced to your OJT Progress Hub.</p>
          </div>

          {/* --- ABOUT ME --- */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 sm:p-8 shadow-sm">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-4">About Me</h2>
            {isEditing ? (
              <textarea
                rows={5}
                value={profileData.about}
                onChange={(e) => setProfileData({ ...profileData, about: e.target.value })}
                placeholder="Write a brief introduction about your goals, passions, and what you are looking for in an OJT..."
                className="w-full bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 rounded-xl p-4 outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 text-zinc-900 dark:text-white text-[13px] font-medium resize-none transition-all shadow-sm"
              />
            ) : (
              <p className="text-[13px] text-zinc-600 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap font-medium">
                {profileData.about || "This student hasn't written an about section yet."}
              </p>
            )}
          </div>

          {/* --- EDUCATION --- */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 sm:p-8 shadow-sm">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-8 flex items-center gap-2">
              <BookOpen className="text-purple-500" size={20} /> Educational Background
            </h2>

            <div className="space-y-6 relative before:absolute before:inset-0 before:ml-2.5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-zinc-200 dark:before:via-zinc-700 before:to-transparent">

              {[
                { key: 'college', label: 'College', color: 'bg-purple-500', border: 'border-purple-500' },
                { key: 'seniorHighSchool', label: 'Senior High School', color: 'bg-zinc-300 dark:bg-zinc-600', border: 'border-zinc-200 dark:border-zinc-700' },
                { key: 'highSchool', label: 'Junior High School', color: 'bg-zinc-300 dark:bg-zinc-600', border: 'border-zinc-200 dark:border-zinc-700' },
                { key: 'elementary', label: 'Elementary', color: 'bg-zinc-300 dark:bg-zinc-600', border: 'border-zinc-200 dark:border-zinc-700' }
              ].map((edu, index) => (
                <div key={edu.key} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                  <div className={`flex items-center justify-center w-6 h-6 rounded-full border-4 border-white dark:border-zinc-900 ${edu.color} shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow z-10 transition-transform group-hover:scale-110`}></div>
                  <div className={`w-[calc(100%-3rem)] md:w-[calc(50%-2rem)] bg-white dark:bg-zinc-900 p-5 rounded-2xl border ${edu.border} hover:shadow-lg dark:hover:shadow-zinc-950/50 transition-all`}>
                    <p className={`text-[11px] font-bold uppercase tracking-wider mb-2 ${index === 0 ? 'text-purple-500' : 'text-zinc-500'}`}>{edu.label}</p>
                    {isEditing ? (
                      <input
                        type="text"
                        value={(profileData.education as any)[edu.key]}
                        onChange={(e) => setProfileData({ ...profileData, education: { ...profileData.education, [edu.key]: e.target.value } })}
                        placeholder="School Name"
                        className="w-full text-[13px] font-semibold bg-transparent border-b border-zinc-300 dark:border-zinc-600 outline-none text-zinc-900 dark:text-white pb-1.5 focus:border-purple-500 transition-colors placeholder:text-zinc-400"
                      />
                    ) : <p className="text-sm font-bold text-zinc-900 dark:text-white">{profileData.education[edu.key as keyof typeof profileData.education] || "-"}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Tags & Files */}
        <div className="space-y-6">

          {/* --- RESUME UPLOAD --- */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-4">Resume / CV</h2>

            <div className="flex items-center justify-between p-4 bg-purple-50 dark:bg-purple-500/10 border border-purple-100 dark:border-purple-500/20 rounded-xl mb-4">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="p-2.5 bg-white dark:bg-zinc-800 rounded-lg shrink-0 shadow-sm border border-purple-100 dark:border-purple-500/10">
                  <FileText className="text-purple-600 dark:text-purple-400" size={20} />
                </div>
                <span className="text-[13px] font-bold text-zinc-700 dark:text-zinc-200 truncate">
                  {profileData.resumeName || "No resume uploaded"}
                </span>
              </div>
            </div>

            {isEditing && (
              <div>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleResumeUpload}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-3 flex items-center justify-center gap-2 border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl text-[13px] font-bold text-zinc-600 dark:text-zinc-400 hover:border-purple-500 hover:text-purple-500 transition-colors bg-zinc-50 dark:bg-zinc-800/30"
                >
                  <Upload size={16} /> Upload Document
                </button>
              </div>
            )}
          </div>

          {/* --- HELPER FUNCTION FOR TAG SECTIONS --- */}
          {[
            { title: "Top Skills", key: "skills" as const, bg: "bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700", text: "text-zinc-700 dark:text-zinc-300", val: newSkill, setter: setNewSkill, placeholder: "E.g. React, UI/UX" },
            { title: "Languages", key: "languages" as const, bg: "bg-blue-50 dark:bg-blue-500/10 border-blue-100 dark:border-blue-500/20", text: "text-blue-700 dark:text-blue-400", val: newLanguage, setter: setNewLanguage, placeholder: "E.g. English, Tagalog" },
            { title: "Preferred Areas", key: "preferredLocations" as const, bg: "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20", text: "text-emerald-700 dark:text-emerald-400", val: newLocation, setter: setNewLocation, placeholder: "E.g. Makati, Remote" },
          ].map((section) => (
            <div key={section.key} className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-4">{section.title}</h2>
              <div className="flex flex-wrap gap-2">
                {profileData[section.key].length === 0 && !isEditing && <p className="text-[13px] font-medium text-zinc-500">No data added yet.</p>}
                {profileData[section.key].map((item, index) => (
                  <span key={index} className={`group relative flex items-center px-3.5 py-1.5 border text-[13px] font-bold rounded-lg shadow-sm ${section.bg} ${section.text}`}>
                    {item}
                    {isEditing && (
                      <button onClick={() => handleRemoveTag(section.key, index)} className="ml-2 opacity-50 hover:opacity-100 hover:text-red-500 transition-opacity">
                        <X size={14} />
                      </button>
                    )}
                  </span>
                ))}
              </div>
              {isEditing && (
                <div className="flex items-center mt-4 gap-2 h-11">
                  <input
                    type="text" value={section.val} onChange={(e) => section.setter(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddTag(section.key, section.val, section.setter)}
                    placeholder={section.placeholder}
                    className="flex-1 h-full text-[13px] font-medium bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 rounded-xl px-4 outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 transition-colors dark:text-white shadow-sm placeholder:text-zinc-400"
                  />
                  <button onClick={() => handleAddTag(section.key, section.val, section.setter)} className="h-full px-4 bg-purple-50 hover:bg-purple-100 dark:bg-purple-500/10 dark:hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-500/30 rounded-xl transition-colors flex items-center justify-center shadow-sm">
                    <Plus size={18} />
                  </button>
                </div>
              )}
            </div>
          ))}

        </div>
      </div>

      {/* ================= IMAGE VIEW MODAL ================= */}
      {modalImage && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={() => setModalImage(null)}
        >
          <button
            onClick={() => setModalImage(null)}
            className="absolute top-4 right-4 p-2 text-white bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-md transition-colors"
          >
            <X size={24} />
          </button>
          <img
            src={modalImage}
            alt="Expanded view"
            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}