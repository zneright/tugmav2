import { useState, useRef } from 'react';
import {
  MapPin, GraduationCap, Edit2, Camera,
  Clock, Check, X, Plus, FileText, Upload,
  DollarSign, Briefcase, BookOpen
} from 'lucide-react';

export default function StudentProfile() {
  const [isEditing, setIsEditing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- STATE: MAIN PROFILE DATA ---
  const [profileData, setProfileData] = useState({
    name: "Nishia Pinlac",
    title: "IT Student | Aspiring Front-End Developer",
    location: "Malabon, Metro Manila",
    classification: "Information Technology (ICT)",
    expectedSalary: "₱15,000 - ₱20,000",
    about: "I am a dedicated IT student passionate about creating beautiful and user-friendly digital experiences...",
    resumeName: "Nishia_Pinlac_Resume.pdf",

    // Education Object
    education: {
      elementary: "Malabon Elementary School",
      highSchool: "Malabon National High School",
      seniorHighSchool: "STI College Caloocan (SHS)",
      college: "STI College Caloocan"
    },

    // Array Data for Tags
    skills: ['Web Design', 'React', 'Tailwind CSS', 'UI/UX'],
    languages: ['English', 'Tagalog'],
    preferredLocations: ['Metro Manila', 'Remote']
  });

  // --- STATE: TEMPORARY INPUTS FOR TAGS ---
  const [newSkill, setNewSkill] = useState('');
  const [newLanguage, setNewLanguage] = useState('');
  const [newLocation, setNewLocation] = useState('');

  // --- HANDLERS: ADDING TAGS ---
  const handleAddTag = (type: 'skills' | 'languages' | 'preferredLocations', value: string, setter: any) => {
    if (value.trim() !== '') {
      setProfileData({ ...profileData, [type]: [...profileData[type], value.trim()] });
      setter(''); // Clear the input field
    }
  };

  // --- HANDLERS: REMOVING TAGS ---
  const handleRemoveTag = (type: 'skills' | 'languages' | 'preferredLocations', indexToRemove: number) => {
    setProfileData({
      ...profileData,
      [type]: profileData[type].filter((_, index) => index !== indexToRemove)
    });
  };

  // --- HANDLER: RESUME UPLOAD ---
  const handleResumeUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      // In a real app, you would upload this to Firebase Storage here
      setProfileData({ ...profileData, resumeName: e.target.files[0].name });
    }
  };

  return (
    <div className="space-y-6 pb-20 md:pb-8 animate-in fade-in duration-500 max-w-5xl mx-auto">

      {/* --- HEADER & INTRO CARD --- */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">

        {/* Cover Photo */}
        <div className="h-32 sm:h-48 bg-gradient-to-r from-purple-600 via-purple-500 to-indigo-600 relative group cursor-pointer">
          {isEditing && (
            <button className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full backdrop-blur-sm transition-colors">
              <Camera size={18} />
            </button>
          )}
        </div>

        <div className="px-4 sm:px-6 pb-6 relative">
          <div className="flex justify-between items-end -mt-12 sm:-mt-16 mb-4 relative z-10">
            <div className="relative group cursor-pointer">
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-white dark:border-zinc-900 bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center overflow-hidden">
                <span className="text-4xl font-bold text-zinc-400">N</span>
                {isEditing && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity">
                    <Camera size={24} className="text-white" />
                  </div>
                )}
              </div>
            </div>

            {/* EDIT BUTTON */}
            <div className="flex gap-2">
              <button
                onClick={() => setIsEditing(!isEditing)}
                className={`p-2 sm:px-5 sm:py-2.5 rounded-xl transition-all border flex items-center gap-2 text-sm font-bold shadow-sm ${isEditing
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-500 shadow-emerald-500/20'
                  : 'bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 border-zinc-200 dark:border-zinc-700'
                  }`}
              >
                {isEditing ? (
                  <><Check size={18} /> <span className="hidden sm:block">Save Profile</span></>
                ) : (
                  <><Edit2 size={18} /> <span className="hidden sm:block">Edit Profile</span></>
                )}
              </button>
            </div>
          </div>

          {/* EDITABLE USER DETAILS */}
          <div className="space-y-4">
            {isEditing ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl">
                <div className="space-y-3">
                  <input type="text" value={profileData.name} onChange={(e) => setProfileData({ ...profileData, name: e.target.value })} className="w-full text-2xl font-bold bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-purple-500/20 dark:text-white" placeholder="Full Name" />
                  <input type="text" value={profileData.title} onChange={(e) => setProfileData({ ...profileData, title: e.target.value })} className="w-full text-sm bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-purple-500/20 text-zinc-600 dark:text-zinc-300" placeholder="Professional Title" />

                  <div className="flex items-center gap-2">
                    <MapPin size={16} className="text-zinc-400 shrink-0" />
                    <input type="text" value={profileData.location} onChange={(e) => setProfileData({ ...profileData, location: e.target.value })} className="flex-1 text-sm bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-purple-500/20 text-zinc-500 dark:text-zinc-400" placeholder="Location" />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Briefcase size={16} className="text-zinc-400 shrink-0" />
                    <input type="text" value={profileData.classification} onChange={(e) => setProfileData({ ...profileData, classification: e.target.value })} className="flex-1 text-sm bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-purple-500/20 text-zinc-500 dark:text-zinc-400" placeholder="Industry/Classification (e.g., ICT)" />
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign size={16} className="text-zinc-400 shrink-0" />
                    <input type="text" value={profileData.expectedSalary} onChange={(e) => setProfileData({ ...profileData, expectedSalary: e.target.value })} className="flex-1 text-sm bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-purple-500/20 text-zinc-500 dark:text-zinc-400" placeholder="Expected Salary (e.g., ₱15,000)" />
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">{profileData.name}</h1>
                <p className="text-lg text-zinc-600 dark:text-zinc-300 mt-1">{profileData.title}</p>
                <div className="flex flex-wrap items-center gap-y-2 gap-x-5 mt-4 text-sm text-zinc-500 dark:text-zinc-400 font-medium">
                  <span className="flex items-center gap-1.5"><MapPin size={16} className="text-purple-500" /> {profileData.location}</span>
                  <span className="flex items-center gap-1.5"><Briefcase size={16} className="text-blue-500" /> {profileData.classification}</span>
                  <span className="flex items-center gap-1.5"><DollarSign size={16} className="text-emerald-500" /> {profileData.expectedSalary}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* LEFT COLUMN: Main Details */}
        <div className="lg:col-span-2 space-y-6">

          {/* --- ABOUT ME --- */}
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 sm:p-6 shadow-sm">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-3">About Me</h2>
            {isEditing ? (
              <textarea
                rows={5}
                value={profileData.about}
                onChange={(e) => setProfileData({ ...profileData, about: e.target.value })}
                className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl p-4 outline-none focus:ring-2 focus:ring-purple-500/20 text-zinc-900 dark:text-white text-sm resize-none"
              />
            ) : (
              <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
                {profileData.about}
              </p>
            )}
          </div>

          {/* --- EDUCATION --- */}
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 sm:p-6 shadow-sm">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
              <BookOpen className="text-purple-500" size={20} /> Education
            </h2>

            <div className="space-y-4 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-zinc-200 dark:before:via-zinc-700 before:to-transparent">

              {/* College */}
              <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                <div className="flex items-center justify-center w-5 h-5 rounded-full border-2 border-white dark:border-zinc-900 bg-purple-500 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow z-10"></div>
                <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-xl border border-zinc-200 dark:border-zinc-700">
                  <p className="text-xs font-bold text-purple-500 mb-1">College</p>
                  {isEditing ? (
                    <input type="text" value={profileData.education.college} onChange={(e) => setProfileData({ ...profileData, education: { ...profileData.education, college: e.target.value } })} className="w-full text-sm bg-transparent border-b border-zinc-300 dark:border-zinc-600 outline-none text-zinc-900 dark:text-white pb-1" />
                  ) : <p className="text-sm font-bold text-zinc-900 dark:text-white">{profileData.education.college}</p>}
                </div>
              </div>

              {/* Senior High */}
              <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                <div className="flex items-center justify-center w-5 h-5 rounded-full border-2 border-white dark:border-zinc-900 bg-zinc-300 dark:bg-zinc-600 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow z-10"></div>
                <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-xl border border-zinc-200 dark:border-zinc-700">
                  <p className="text-xs font-bold text-zinc-500 mb-1">Senior High School</p>
                  {isEditing ? (
                    <input type="text" value={profileData.education.seniorHighSchool} onChange={(e) => setProfileData({ ...profileData, education: { ...profileData.education, seniorHighSchool: e.target.value } })} className="w-full text-sm bg-transparent border-b border-zinc-300 dark:border-zinc-600 outline-none text-zinc-900 dark:text-white pb-1" />
                  ) : <p className="text-sm font-bold text-zinc-900 dark:text-white">{profileData.education.seniorHighSchool}</p>}
                </div>
              </div>

              {/* High School */}
              <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                <div className="flex items-center justify-center w-5 h-5 rounded-full border-2 border-white dark:border-zinc-900 bg-zinc-300 dark:bg-zinc-600 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow z-10"></div>
                <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-xl border border-zinc-200 dark:border-zinc-700">
                  <p className="text-xs font-bold text-zinc-500 mb-1">High School</p>
                  {isEditing ? (
                    <input type="text" value={profileData.education.highSchool} onChange={(e) => setProfileData({ ...profileData, education: { ...profileData.education, highSchool: e.target.value } })} className="w-full text-sm bg-transparent border-b border-zinc-300 dark:border-zinc-600 outline-none text-zinc-900 dark:text-white pb-1" />
                  ) : <p className="text-sm font-bold text-zinc-900 dark:text-white">{profileData.education.highSchool}</p>}
                </div>
              </div>

              {/* Elementary */}
              <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                <div className="flex items-center justify-center w-5 h-5 rounded-full border-2 border-white dark:border-zinc-900 bg-zinc-300 dark:bg-zinc-600 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow z-10"></div>
                <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-xl border border-zinc-200 dark:border-zinc-700">
                  <p className="text-xs font-bold text-zinc-500 mb-1">Elementary</p>
                  {isEditing ? (
                    <input type="text" value={profileData.education.elementary} onChange={(e) => setProfileData({ ...profileData, education: { ...profileData.education, elementary: e.target.value } })} className="w-full text-sm bg-transparent border-b border-zinc-300 dark:border-zinc-600 outline-none text-zinc-900 dark:text-white pb-1" />
                  ) : <p className="text-sm font-bold text-zinc-900 dark:text-white">{profileData.education.elementary}</p>}
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Tags & Files */}
        <div className="space-y-6">

          {/* --- RESUME UPLOAD --- */}
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-sm">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-4">Resume</h2>

            <div className="flex items-center justify-between p-4 bg-purple-50 dark:bg-purple-500/10 border border-purple-100 dark:border-purple-500/20 rounded-xl mb-3">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="p-2 bg-white dark:bg-zinc-800 rounded-lg shrink-0">
                  <FileText className="text-purple-600 dark:text-purple-400" size={20} />
                </div>
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200 truncate">
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
                  className="w-full py-2.5 flex items-center justify-center gap-2 border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl text-sm font-bold text-zinc-600 dark:text-zinc-400 hover:border-purple-500 hover:text-purple-500 transition-colors"
                >
                  <Upload size={16} /> Upload New Resume
                </button>
              </div>
            )}
          </div>

          {/* --- SKILLS --- */}
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-sm">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-4">Top Skills</h2>
            <div className="flex flex-wrap gap-2">
              {profileData.skills.map((skill, index) => (
                <span key={index} className="group relative flex items-center px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 text-sm font-medium rounded-lg">
                  {skill}
                  {isEditing && (
                    <button onClick={() => handleRemoveTag('skills', index)} className="ml-2 text-zinc-400 hover:text-red-500 transition-colors">
                      <X size={14} />
                    </button>
                  )}
                </span>
              ))}
            </div>
            {isEditing && (
              <div className="flex items-center mt-3 gap-2">
                <input
                  type="text" value={newSkill} onChange={(e) => setNewSkill(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddTag('skills', newSkill, setNewSkill)}
                  placeholder="Add skill..."
                  className="flex-1 text-sm bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-purple-500/20 dark:text-white"
                />
                <button onClick={() => handleAddTag('skills', newSkill, setNewSkill)} className="p-2 bg-purple-100 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400 rounded-lg hover:bg-purple-200 transition-colors">
                  <Plus size={18} />
                </button>
              </div>
            )}
          </div>

          {/* --- LANGUAGES --- */}
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-sm">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-4">Languages</h2>
            <div className="flex flex-wrap gap-2">
              {profileData.languages.map((lang, index) => (
                <span key={index} className="group relative flex items-center px-3 py-1.5 bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 text-blue-700 dark:text-blue-300 text-sm font-medium rounded-lg">
                  {lang}
                  {isEditing && (
                    <button onClick={() => handleRemoveTag('languages', index)} className="ml-2 text-blue-400 hover:text-red-500 transition-colors">
                      <X size={14} />
                    </button>
                  )}
                </span>
              ))}
            </div>
            {isEditing && (
              <div className="flex items-center mt-3 gap-2">
                <input
                  type="text" value={newLanguage} onChange={(e) => setNewLanguage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddTag('languages', newLanguage, setNewLanguage)}
                  placeholder="Add language..."
                  className="flex-1 text-sm bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-purple-500/20 dark:text-white"
                />
                <button onClick={() => handleAddTag('languages', newLanguage, setNewLanguage)} className="p-2 bg-purple-100 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400 rounded-lg hover:bg-purple-200 transition-colors">
                  <Plus size={18} />
                </button>
              </div>
            )}
          </div>

          {/* --- PREFERRED LOCATIONS --- */}
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-sm">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-4">Preferred Locations</h2>
            <div className="flex flex-wrap gap-2">
              {profileData.preferredLocations.map((loc, index) => (
                <span key={index} className="group relative flex items-center px-3 py-1.5 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-sm font-medium rounded-lg">
                  {loc}
                  {isEditing && (
                    <button onClick={() => handleRemoveTag('preferredLocations', index)} className="ml-2 text-emerald-400 hover:text-red-500 transition-colors">
                      <X size={14} />
                    </button>
                  )}
                </span>
              ))}
            </div>
            {isEditing && (
              <div className="flex items-center mt-3 gap-2">
                <input
                  type="text" value={newLocation} onChange={(e) => setNewLocation(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddTag('preferredLocations', newLocation, setNewLocation)}
                  placeholder="Add location..."
                  className="flex-1 text-sm bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-purple-500/20 dark:text-white"
                />
                <button onClick={() => handleAddTag('preferredLocations', newLocation, setNewLocation)} className="p-2 bg-purple-100 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400 rounded-lg hover:bg-purple-200 transition-colors">
                  <Plus size={18} />
                </button>
              </div>
            )}
          </div>

        </div>
      </div>

    </div>
  );
}