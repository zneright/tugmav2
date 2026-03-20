import { useState, useRef, useEffect } from 'react';
import {
  MapPin, GraduationCap, Edit2, Camera,
  Check, X, Plus, FileText, Upload,
  DollarSign, Briefcase, BookOpen, Target, Loader2, ChevronDown, User, ExternalLink
} from 'lucide-react';
import { auth } from '../../firebaseConfig';

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

  const fileInputRef = useRef<HTMLInputElement>(null);
  const profilePhotoRef = useRef<HTMLInputElement>(null);
  const coverPhotoRef = useRef<HTMLInputElement>(null);

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
    resumeData: "",
    profilePhoto: "",
    coverPhoto: "",
    education: {
      elementary: { school: "", years: "" },
      highSchool: { school: "", years: "" },
      seniorHighSchool: { school: "", years: "" },
      college: { school: "", years: "" }
    },
    ojt: {
      status: "Actively Looking",
      requiredHours: 450,
      completedHours: 0
    },
    skills: [] as string[],
    languages: [] as string[],
    preferredLocations: [] as string[]
  });

  const [newSkill, setNewSkill] = useState('');
  const [newLanguage, setNewLanguage] = useState('');
  const [newLocation, setNewLocation] = useState('');

  useEffect(() => {
    let isMounted = true;

    const fetchProfile = async () => {
      const user = auth.currentUser;
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`http://localhost:8080/api/users/profile/${user.uid}`);
        if (response.ok) {
          const data = await response.json();
          if (isMounted) {
            setProfileData(prev => {
              // Use data.firstName (from our PHP mapping) OR data.first_name (backup)
              const fName = data.firstName || data.first_name || "";
              const lName = data.lastName || data.last_name || "";

              return {
                ...prev,
                ...data,
                firstName: fName,
                lastName: lName,
                education: {
                  elementary: data.education?.elementary || { school: "", years: "" },
                  highSchool: data.education?.highSchool || { school: "", years: "" },
                  seniorHighSchool: data.education?.seniorHighSchool || { school: "", years: "" },
                  college: data.education?.college || { school: data.school || fName ? data.school : "", years: "" },
                }
              };
            });
          }
        }
      } catch (error) {
        console.error("Fetch error:", error);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchProfile();
    return () => { isMounted = false; };
  }, []);

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
      alert("Failed to save profile. Ensure the file isn't too large for the database.");
    } finally {
      setIsSaving(false);
    }
  };

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

  const handleResumeUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2000000) {
        alert("File is too large. Please upload a PDF or image smaller than 2MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileData(prev => ({
          ...prev,
          resumeName: file.name,
          resumeData: reader.result as string
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleViewResume = () => {
    if (profileData.resumeData) {
      const w = window.open('about:blank');
      if (w) {
        const iframe = w.document.createElement('iframe');
        iframe.src = profileData.resumeData;
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        iframe.style.border = 'none';
        w.document.body.appendChild(iframe);
        w.document.body.style.margin = '0';
        w.document.title = profileData.resumeName || 'Resume';
      }
    }
  };

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

  if (isLoading) {
    return <div className="h-96 flex items-center justify-center text-white"><Loader2 className="animate-spin text-purple-500" size={40} /></div>;
  }

  const inputClass = "w-full pl-11 pr-4 py-3 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 rounded-xl outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 transition-all text-[13px] font-medium text-zinc-900 dark:text-white shadow-sm placeholder:text-zinc-400";
  const selectClass = "w-full pl-11 pr-10 py-3 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 rounded-xl outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 transition-all text-[13px] font-medium text-zinc-900 dark:text-white shadow-sm appearance-none cursor-pointer";

  return (
    <div className="space-y-6 pb-20 md:pb-8 animate-in fade-in duration-500 max-w-5xl mx-auto">

      <input type="file" accept="image/*" className="hidden" ref={profilePhotoRef} onChange={(e) => handleImageUpload(e, 'profilePhoto')} />
      <input type="file" accept="image/*" className="hidden" ref={coverPhotoRef} onChange={(e) => handleImageUpload(e, 'coverPhoto')} />

      {/* ... Educational Background Section ... */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 sm:p-8 shadow-sm">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-8 flex items-center gap-2">
              <BookOpen className="text-purple-500" size={20} /> Educational Background
            </h2>

            <div className="space-y-6 relative">
              {[
                { key: 'college', label: 'College' },
                { key: 'seniorHighSchool', label: 'Senior High' },
                { key: 'highSchool', label: 'Junior High' },
                { key: 'elementary', label: 'Elementary' }
              ].map((edu) => (
                <div key={edu.key} className="relative flex items-center">
                  <div className="flex items-center justify-center w-6 h-6 bg-purple-500 z-10 rounded-full"></div>
                  <div className="ml-4 w-full bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-700">
                    <p className="text-[11px] font-bold uppercase text-purple-500 mb-2">{edu.label}</p>

                    {isEditing ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          placeholder="School Name"
                          className="w-full text-[13px] font-bold bg-transparent border-b border-zinc-200 outline-none focus:border-purple-500"
                          value={(profileData.education as any)[edu.key]?.school || ""}
                          onChange={(e) => setProfileData({
                            ...profileData,
                            education: {
                              ...profileData.education,
                              [edu.key]: { ...(profileData.education as any)[edu.key], school: e.target.value }
                            }
                          })}
                        />
                        <input
                          type="text"
                          placeholder="Years (e.g. 2022 - 2026)"
                          className="w-full text-[11px] font-medium bg-transparent border-b border-zinc-100 outline-none text-zinc-500"
                          value={(profileData.education as any)[edu.key]?.years || ""}
                          onChange={(e) => setProfileData({
                            ...profileData,
                            education: {
                              ...profileData.education,
                              [edu.key]: { ...(profileData.education as any)[edu.key], years: e.target.value }
                            }
                          })}
                        />
                      </div>
                    ) : (
                      <div>
                        <p className="text-sm font-bold text-zinc-900 dark:text-white">
                          {(profileData.education as any)[edu.key]?.school || "Not set"}
                        </p>
                        <p className="text-xs text-zinc-500 font-medium">
                          {(profileData.education as any)[edu.key]?.years || "No years added"}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Resume Section */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-4">Resume / CV</h2>
            <div className="flex flex-col gap-3 p-4 bg-purple-50 dark:bg-purple-500/10 border border-purple-100 dark:border-purple-500/20 rounded-xl mb-4">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="p-2.5 bg-white dark:bg-zinc-800 rounded-lg shrink-0 shadow-sm border border-purple-100 dark:border-purple-500/10">
                  <FileText className="text-purple-600 dark:text-purple-400" size={20} />
                </div>
                <span className="text-[13px] font-bold text-zinc-700 dark:text-zinc-200 truncate">
                  {profileData.resumeName || "No resume uploaded"}
                </span>
              </div>
              {profileData.resumeData && !isEditing && (
                <button
                  onClick={handleViewResume}
                  className="w-full py-2 bg-white dark:bg-zinc-800 border border-purple-200 dark:border-purple-500/30 text-purple-700 dark:text-purple-400 text-xs font-bold rounded-lg hover:bg-purple-100 transition-colors flex items-center justify-center gap-2"
                >
                  <ExternalLink size={14} /> View Document
                </button>
              )}
            </div>
            {isEditing && (
              <div>
                <input type="file" accept="image/*,application/pdf" className="hidden" ref={fileInputRef} onChange={handleResumeUpload} />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-3 flex items-center justify-center gap-2 border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl text-[13px] font-bold text-zinc-600 dark:text-zinc-400 hover:border-purple-500 hover:text-purple-500 transition-colors bg-zinc-50 dark:bg-zinc-800/30"
                >
                  <Upload size={16} /> Upload New Document
                </button>
              </div>
            )}
          </div>

          {/* Skills, Languages, Locations Tags */}
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