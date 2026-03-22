import { useState, useRef, useEffect } from 'react';
import {
  MapPin, GraduationCap, Edit2, Camera,
  Check, X, Plus, FileText, Upload,
  Briefcase, BookOpen, Target, Loader2, ChevronDown, User, Download, Printer,
  Trash2, AlertTriangle // <-- Added new icons for Delete
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

const CLOUDINARY_UPLOAD_PRESET = "student_uploads";
const CLOUDINARY_CLOUD_NAME = "dupjdmjha";

export default function StudentProfile() {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false); // <-- Added delete state
  const [modalImage, setModalImage] = useState<string | null>(null);

  const [uid, setUid] = useState<string | null>(null);

  const [dtrLogs, setDtrLogs] = useState<any[]>([]);

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
    const fetchProfileData = async () => {
      const unsubscribe = auth.onAuthStateChanged(async (user) => {
        if (user) {
          setUid(user.uid);
          try {
            const profileRes = await fetch(`http://localhost:8080/api/users/profile/${user.uid}`);
            const data = await profileRes.json();

            if (!profileRes.ok) throw new Error(data.message || `Server Error: ${profileRes.status}`);

            const logsRes = await fetch(`http://localhost:8080/api/dtr/logs/${user.uid}`);
            let fetchedLogs = [];
            let calculatedHours = 0;

            if (logsRes.ok) {
              fetchedLogs = await logsRes.json();
              setDtrLogs(fetchedLogs);
              calculatedHours = fetchedLogs.reduce((acc: number, log: any) => acc + (log.hoursCredited || 0), 0);
            }

            setProfileData(prev => ({
              ...prev,
              ...data,
              address: data.address || data.location || "",
              education: { ...prev.education, ...(data.education || {}) },
              ojt: {
                ...prev.ojt,
                ...(data.ojt || {}),
                completedHours: calculatedHours
              },
              skills: data.skills || [],
              languages: data.languages || [],
              preferredLocations: data.preferredLocations || []
            }));

          } catch (error: any) {
            console.error("Failed to fetch data:", error);
          } finally {
            setIsLoading(false);
          }
        } else {
          setIsLoading(false);
        }
      });
      return () => unsubscribe();
    };

    fetchProfileData();
  }, []);

  const logSystemEvent = (action: string, details: string) => {
    if (!uid) return;
    fetch('http://localhost:8080/api/audit/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid, action, details })
    }).catch(err => console.error("Audit log failed (silent):", err));
  };

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
      if (!response.ok) throw new Error("Unknown Server Error");

      logSystemEvent('Updated Profile', 'User updated their personal profile details.');

      setIsEditing(false);
      alert("Profile Saved Successfully!");
    } catch (error: any) {
      alert(`Backend Error: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // --- NEW: Account Deletion Handler ---
  const handleDeleteAccount = async () => {
    const user = auth.currentUser;
    if (!user || !uid) return;

    const confirmDelete = window.confirm(
      "WARNING: Are you sure you want to delete your account? Your data will be archived and your login will be permanently removed. This action cannot be undone."
    );
    if (!confirmDelete) return;

    setIsDeleting(true);
    try {
      // 1. Tell backend to archive data and delete from active 'users' collection
      // Ensure your backend code handles this logic on this DELETE endpoint!
      const res = await fetch(`http://localhost:8080/api/users/profile/${uid}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to archive and delete account data on the server.");
      }

      logSystemEvent('Deleted Account', 'User initiated self-deletion. Data moved to archive.');

      // 2. Delete Firebase Authentication
      await user.delete();

      alert("Account deleted and archived successfully.");
      // The Firebase onAuthStateChanged listener will automatically redirect to login

    } catch (error: any) {
      console.error("Delete account error:", error);
      // Firebase requires the user to have signed in recently to delete their account
      if (error.code === 'auth/requires-recent-login') {
        alert("For security reasons, you must log out and log back in before deleting your account.");
      } else {
        alert(`Error: ${error.message}`);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const uploadToCloudinary = async (file: File): Promise<string> => {
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`, {
        method: 'POST', body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error("Upload failed");
      return data.secure_url;
    } finally {
      setIsUploading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'profilePhoto' | 'coverPhoto') => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const imageUrl = await uploadToCloudinary(file);
      setProfileData(prev => ({ ...prev, [field]: imageUrl }));
    } catch (error) { }
  };

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5000000) return alert("File is too large.");
    try {
      const resumeUrl = await uploadToCloudinary(file);
      setProfileData(prev => ({ ...prev, resumeName: file.name, resumeData: resumeUrl }));

      logSystemEvent('Uploaded Resume', `User uploaded a new resume: ${file.name}`);

    } catch (error) { }
  };

  const handleAddTag = (type: 'skills' | 'languages' | 'preferredLocations', value: string, setter: any) => {
    if (value.trim() !== '' && !profileData[type].includes(value.trim())) {
      setProfileData({ ...profileData, [type]: [...profileData[type], value.trim()] });
      setter('');
    }
  };

  const handleRemoveTag = (type: 'skills' | 'languages' | 'preferredLocations', indexToRemove: number) => {
    setProfileData({
      ...profileData, [type]: profileData[type].filter((_, index) => index !== indexToRemove)
    });
  };

  const handleDownloadResume = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!profileData.resumeData) return;
    setIsDownloading(true);
    try {
      const response = await fetch(profileData.resumeData);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = profileData.resumeName || 'Resume.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      window.open(profileData.resumeData, '_blank');
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePrintDTR = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    logSystemEvent('Printed DTR', 'User generated their Daily Time Record PDF.');

    const html = `
      <html>
        <head>
          <title>Daily Time Record - ${profileData.firstName} ${profileData.lastName}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #333; }
            .header { text-align: center; border-bottom: 2px solid #6b21a8; padding-bottom: 20px; margin-bottom: 30px; }
            .header h1 { margin: 0 0 10px 0; color: #6b21a8; }
            .info { display: flex; justify-content: space-between; margin-bottom: 30px; font-size: 14px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            th { background-color: #f8f9fa; font-weight: bold; color: #555; }
            tr:nth-child(even) { background-color: #fdfdfd; }
            .summary { text-align: right; font-size: 18px; font-weight: bold; }
            .highlight { color: #6b21a8; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Daily Time Record (DTR)</h1>
            <p>On-the-Job Training Program</p>
          </div>
          <div class="info">
            <div>
              <strong>Name:</strong> ${profileData.firstName} ${profileData.lastName}<br>
              <strong>Course:</strong> ${profileData.course || 'N/A'}<br>
            </div>
            <div style="text-align: right;">
              <strong>Target Hours:</strong> ${profileData.ojt.requiredHours}<br>
              <strong>Date Printed:</strong> ${new Date().toLocaleDateString()}<br>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Tasks Completed</th>
                <th>Hours Logged</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${dtrLogs.map(log => `
                <tr>
                  <td>${new Date(log.date).toLocaleDateString()}</td>
                  <td>${log.task}</td>
                  <td>${log.hoursCredited} hrs</td>
                  <td>${log.isDouble ? 'Double Credited' : 'Standard'}</td>
                </tr>
              `).join('')}
              ${dtrLogs.length === 0 ? '<tr><td colspan="4" style="text-align:center;">No logs recorded yet.</td></tr>' : ''}
            </tbody>
          </table>
          <div class="summary">
            Total Validated Hours: <span class="highlight">${profileData.ojt.completedHours} / ${profileData.ojt.requiredHours}</span>
          </div>
          <script>
            window.onload = () => { setTimeout(() => { window.print(); window.close(); }, 500); }
          </script>
        </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  };

  if (isLoading) {
    return <div className="h-96 flex items-center justify-center text-white"><Loader2 className="animate-spin text-purple-500" size={40} /></div>;
  }

  const inputClass = "w-full pl-11 pr-4 py-3 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 rounded-xl outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 transition-all text-[13px] font-medium text-zinc-900 dark:text-white shadow-sm placeholder:text-zinc-400";
  const selectClass = "w-full pl-11 pr-10 py-3 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 rounded-xl outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 transition-all text-[13px] font-medium text-zinc-900 dark:text-white shadow-sm appearance-none cursor-pointer";

  const progressPercentage = Math.min(100, (profileData.ojt.completedHours / (profileData.ojt.requiredHours || 1)) * 100);

  return (
    <div className="space-y-6 pb-20 md:pb-8 animate-in fade-in duration-500 max-w-5xl mx-auto">
      {/* Photo Inputs */}
      <input type="file" accept="image/*" className="hidden" ref={profilePhotoRef} onChange={(e) => handleImageUpload(e, 'profilePhoto')} disabled={isUploading} />
      <input type="file" accept="image/*" className="hidden" ref={coverPhotoRef} onChange={(e) => handleImageUpload(e, 'coverPhoto')} disabled={isUploading} />

      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">
        <div className={`h-32 sm:h-48 relative group bg-cover bg-center ${profileData.coverPhoto ? 'cursor-pointer' : ''} ${isUploading ? 'opacity-50' : ''}`} style={{ backgroundImage: profileData.coverPhoto ? `url(${profileData.coverPhoto})` : 'linear-gradient(to right, #9333ea, #8b5cf6, #4f46e5)' }} onClick={() => profileData.coverPhoto && !isEditing && setModalImage(profileData.coverPhoto)}>
          {isEditing && (
            <button onClick={(e) => { e.stopPropagation(); coverPhotoRef.current?.click(); }} disabled={isUploading} className="absolute top-4 right-4 p-2.5 bg-black/40 hover:bg-black/60 text-white rounded-full backdrop-blur-md transition-colors shadow-lg disabled:opacity-50">
              <Camera size={18} />
            </button>
          )}
        </div>

        <div className="px-5 sm:px-8 pb-8 relative">
          <div className="flex justify-between items-end -mt-12 sm:-mt-16 mb-6 relative z-10">
            <div className="relative group">
              <div className={`w-24 h-24 sm:w-32 sm:h-32 rounded-full border-[5px] border-white dark:border-zinc-900 bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center overflow-hidden shadow-md relative ${profileData.profilePhoto ? 'cursor-pointer' : ''} ${isUploading ? 'opacity-50' : ''}`} onClick={() => profileData.profilePhoto && !isEditing && setModalImage(profileData.profilePhoto)}>
                {profileData.profilePhoto ? <img src={profileData.profilePhoto} alt="Profile" className="w-full h-full object-cover" /> : <span className="text-4xl font-bold text-zinc-400">{profileData.firstName?.charAt(0) || "U"}</span>}
                {isEditing && (
                  <button onClick={(e) => { e.stopPropagation(); profilePhotoRef.current?.click(); }} disabled={isUploading} className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer disabled:cursor-not-allowed">
                    <Camera size={26} className="text-white" />
                  </button>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              {isEditing ? (
                <button onClick={handleSaveProfile} disabled={isSaving || isUploading} className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-sm shadow-emerald-500/20 flex items-center gap-2 transition-all disabled:opacity-50">
                  {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />} <span className="hidden sm:block">{isSaving ? 'Saving...' : 'Save Profile'}</span>
                </button>
              ) : (
                <button onClick={() => setIsEditing(true)} className="px-6 py-2.5 rounded-xl bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 font-bold shadow-sm flex items-center gap-2 transition-all">
                  <Edit2 size={18} /> <span className="hidden sm:block">Edit Profile</span>
                </button>
              )}
            </div>
          </div>

          <div className="space-y-4">
            {isEditing ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-4xl">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="relative"><User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" /><input type="text" value={profileData.firstName} onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })} className={inputClass} placeholder="First Name" /></div>
                    <div className="relative"><User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" /><input type="text" value={profileData.lastName} onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })} className={inputClass} placeholder="Last Name" /></div>
                  </div>
                  <div className="relative"><Briefcase size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" /><input type="text" value={profileData.title} onChange={(e) => setProfileData({ ...profileData, title: e.target.value })} className={inputClass} placeholder="Professional Title" /></div>
                  <div className="relative"><GraduationCap size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" /><input type="text" value={profileData.course} onChange={(e) => setProfileData({ ...profileData, course: e.target.value })} className={inputClass} placeholder="Course" /></div>
                </div>
                <div className="space-y-4">
                  <div className="relative w-full"><Target size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" /><select value={profileData.classification} onChange={(e) => setProfileData({ ...profileData, classification: e.target.value })} className={selectClass}>{PHILIPPINE_CLASSIFICATIONS.map(c => <option key={c} value={c}>{c}</option>)}</select><ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" /></div>
                  <div className="relative"><MapPin size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" /><input type="text" value={profileData.address} onChange={(e) => setProfileData({ ...profileData, address: e.target.value })} className={inputClass} placeholder="Address" /></div>
                  <div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500 font-extrabold text-[17px] leading-none">₱</span><input type="text" value={profileData.expectedSalary} onChange={(e) => setProfileData({ ...profileData, expectedSalary: e.target.value })} className={inputClass} placeholder="Expected Salary" /></div>
                </div>
              </div>
            ) : (
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white tracking-tight">{profileData.firstName || "New"} {profileData.lastName || "Student"}</h1>
                <p className="text-base sm:text-lg text-zinc-600 dark:text-zinc-300 mt-1 font-medium">{profileData.title || "No title set"}</p>
                <div className="flex flex-wrap items-center gap-y-3 gap-x-6 mt-5 text-[13px] text-zinc-500 dark:text-zinc-400 font-semibold">
                  {profileData.course && <span className="flex items-center gap-2"><GraduationCap size={16} className="text-orange-500" /> {profileData.course}</span>}
                  {profileData.classification && <span className="flex items-center gap-2"><Briefcase size={16} className="text-blue-500" /> {profileData.classification}</span>}
                  {profileData.address && <span className="flex items-center gap-2"><MapPin size={16} className="text-purple-500" /> {profileData.address}</span>}
                  {profileData.expectedSalary && <span className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md"><span className="font-extrabold text-[15px]">₱</span> {profileData.expectedSalary}</span>}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">

          {/* OJT Hub with Progress Bar & Print */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 sm:p-8 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <Target className="text-purple-500" size={20} /> OJT Progress Hub
              </h2>
              <button
                onClick={handlePrintDTR}
                className="flex items-center gap-2 px-4 py-2 bg-purple-50 dark:bg-purple-500/10 hover:bg-purple-100 dark:hover:bg-purple-500/20 text-purple-700 dark:text-purple-400 rounded-lg text-[13px] font-bold transition-colors border border-purple-200 dark:border-purple-500/30"
              >
                <Printer size={16} /> Print DTR
              </button>
            </div>

            {isEditing ? (
              <div className="max-w-xs relative mb-6">
                <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-2 block">Target Hours Requirement</label>
                <input type="number" value={profileData.ojt.requiredHours} onChange={(e) => setProfileData({ ...profileData, ojt: { ...profileData.ojt, requiredHours: Number(e.target.value) || 0 } })} className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl outline-none font-bold text-zinc-900" />
              </div>
            ) : null}

            {/* Progress Bar */}
            <div className="mb-8">
              <div className="flex justify-between items-end mb-2">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-purple-600 dark:text-purple-400 tracking-tight">{profileData.ojt.completedHours}</span>
                  <span className="text-sm font-bold text-zinc-500">/ {profileData.ojt.requiredHours} hrs completed</span>
                </div>
                <span className="text-sm font-black text-zinc-700 dark:text-zinc-300">{progressPercentage.toFixed(0)}%</span>
              </div>
              <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-3 overflow-hidden">
                <div className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${progressPercentage}%` }}></div>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">Recent Logs</h3>
              {dtrLogs.length > 0 ? (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {dtrLogs.slice(0, 5).map((log: any) => (
                    <div key={log.id} className="flex justify-between items-center p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-100 dark:border-zinc-800">
                      <div>
                        <p className="text-[13px] font-bold text-zinc-900 dark:text-white">{log.task}</p>
                        <p className="text-[11px] font-medium text-zinc-500 mt-0.5">{new Date(log.date).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right flex flex-col items-end">
                        <span className="text-[13px] font-black text-emerald-600 dark:text-emerald-400">+{log.hoursCredited} hrs</span>
                        {log.isDouble && <span className="text-[9px] font-bold text-purple-500 bg-purple-50 px-1.5 py-0.5 rounded mt-1">DOUBLE CREDITED</span>}
                      </div>
                    </div>
                  ))}
                  {dtrLogs.length > 5 && <p className="text-xs text-center text-zinc-500 pt-2 font-medium">Click "Print DTR" to view all {dtrLogs.length} logs.</p>}
                </div>
              ) : (
                <div className="text-center py-6 bg-zinc-50 dark:bg-zinc-800/30 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-700">
                  <p className="text-sm font-medium text-zinc-500">No logs recorded yet.</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 sm:p-8 shadow-sm">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-4">About Me</h2>
            {isEditing ? (
              <textarea rows={5} value={profileData.about} onChange={(e) => setProfileData({ ...profileData, about: e.target.value })} placeholder="Write a brief introduction..." className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-4 outline-none text-[13px] resize-none" />
            ) : (
              <p className="text-[13px] text-zinc-600 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap font-medium">{profileData.about || "No about section yet."}</p>
            )}
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 sm:p-8 shadow-sm">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-8 flex items-center gap-2">
              <BookOpen className="text-purple-500" size={20} /> Educational Background
            </h2>
            <div className="space-y-6 relative before:absolute before:inset-0 before:ml-2.5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-zinc-200 dark:before:via-zinc-700 before:to-transparent">
              {[{ key: 'college', label: 'College', color: 'bg-purple-500', border: 'border-purple-500' }, { key: 'seniorHighSchool', label: 'Senior High School', color: 'bg-zinc-300 dark:bg-zinc-600', border: 'border-zinc-200 dark:border-zinc-700' }, { key: 'highSchool', label: 'Junior High School', color: 'bg-zinc-300 dark:bg-zinc-600', border: 'border-zinc-200 dark:border-zinc-700' }, { key: 'elementary', label: 'Elementary', color: 'bg-zinc-300 dark:bg-zinc-600', border: 'border-zinc-200 dark:border-zinc-700' }].map((edu, index) => {
                const currentEdu = (profileData.education as any)?.[edu.key] || { school: '', years: '' };
                return (
                  <div key={edu.key} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                    <div className={`flex items-center justify-center w-6 h-6 rounded-full border-4 border-white dark:border-zinc-900 ${edu.color} shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow z-10 transition-transform group-hover:scale-110`}></div>
                    <div className={`w-[calc(100%-3rem)] md:w-[calc(50%-2rem)] bg-white dark:bg-zinc-900 p-5 rounded-2xl border ${edu.border} hover:shadow-lg transition-all`}>
                      <p className={`text-[11px] font-bold uppercase tracking-wider mb-2 ${index === 0 ? 'text-purple-500' : 'text-zinc-500'}`}>{edu.label}</p>
                      {isEditing ? (
                        <div className="space-y-2">
                          <input type="text" value={currentEdu.school || ""} onChange={(e) => setProfileData({ ...profileData, education: { ...profileData.education, [edu.key]: { ...currentEdu, school: e.target.value } } })} placeholder="School Name" className="w-full text-[13px] font-semibold bg-transparent border-b border-zinc-300 outline-none pb-1.5 focus:border-purple-500" />
                          <input type="text" value={currentEdu.years || ""} onChange={(e) => setProfileData({ ...profileData, education: { ...profileData.education, [edu.key]: { ...currentEdu, years: e.target.value } } })} placeholder="Years" className="w-full text-[11px] font-medium bg-transparent border-b border-zinc-200 outline-none text-zinc-500 pb-1.5 focus:border-purple-500" />
                        </div>
                      ) : (
                        <div>
                          <p className="text-sm font-bold text-zinc-900 dark:text-white">{currentEdu.school || "-"}</p>
                          {currentEdu.years && <p className="text-xs font-medium text-zinc-500 mt-0.5">{currentEdu.years}</p>}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-4">Resume / CV</h2>
            <div className="flex flex-col gap-3 p-4 bg-purple-50 dark:bg-purple-500/10 border border-purple-100 rounded-xl mb-4">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="p-2.5 bg-white dark:bg-zinc-800 rounded-lg shrink-0 shadow-sm border border-purple-100"><FileText className="text-purple-600" size={20} /></div>
                <span className="text-[13px] font-bold text-zinc-700 dark:text-zinc-200 truncate">{profileData.resumeName || "No resume uploaded"}</span>
              </div>
              {profileData.resumeData && !isEditing && (
                <button onClick={handleDownloadResume} disabled={isDownloading} className="w-full py-2 bg-white dark:bg-zinc-800 border border-purple-200 text-purple-700 text-xs font-bold rounded-lg hover:bg-purple-100 flex items-center justify-center gap-2">
                  {isDownloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />} {isDownloading ? "Downloading..." : "Download Resume"}
                </button>
              )}
            </div>
            {isEditing && (
              <div>
                <input type="file" accept="image/*,application/pdf" className="hidden" ref={fileInputRef} onChange={handleResumeUpload} disabled={isUploading} />
                <button onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="w-full py-3 flex items-center justify-center gap-2 border-2 border-dashed border-zinc-300 rounded-xl text-[13px] font-bold text-zinc-600 hover:border-purple-500 bg-zinc-50">
                  {isUploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />} {isUploading ? "Uploading to Cloud..." : "Upload New Document"}
                </button>
              </div>
            )}
          </div>

          {[{ title: "Top Skills", key: "skills" as const, bg: "bg-zinc-100 border-zinc-200", text: "text-zinc-700", val: newSkill, setter: setNewSkill, placeholder: "E.g. React, UI/UX" }, { title: "Languages", key: "languages" as const, bg: "bg-blue-50 border-blue-100", text: "text-blue-700", val: newLanguage, setter: setNewLanguage, placeholder: "E.g. English, Tagalog" }, { title: "Preferred Areas", key: "preferredLocations" as const, bg: "bg-emerald-50 border-emerald-100", text: "text-emerald-700", val: newLocation, setter: setNewLocation, placeholder: "E.g. Makati, Remote" }].map((section) => (
            <div key={section.key} className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 p-6 shadow-sm">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-4">{section.title}</h2>
              <div className="flex flex-wrap gap-2">
                {profileData[section.key].length === 0 && !isEditing && <p className="text-[13px] font-medium text-zinc-500">No data added yet.</p>}
                {profileData[section.key].map((item, index) => (
                  <span key={index} className={`group relative flex items-center px-3.5 py-1.5 border text-[13px] font-bold rounded-lg shadow-sm ${section.bg} ${section.text}`}>
                    {item}
                    {isEditing && (
                      <button onClick={() => handleRemoveTag(section.key, index)} className="ml-2 opacity-50 hover:opacity-100 hover:text-red-500"><X size={14} /></button>
                    )}
                  </span>
                ))}
              </div>
              {isEditing && (
                <div className="flex items-center mt-4 gap-2 h-11">
                  <input type="text" value={section.val} onChange={(e) => section.setter(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddTag(section.key, section.val, section.setter)} placeholder={section.placeholder} className="flex-1 h-full text-[13px] font-medium bg-zinc-50 border border-zinc-200 rounded-xl px-4 outline-none" />
                  <button onClick={() => handleAddTag(section.key, section.val, section.setter)} className="h-full px-4 bg-purple-50 text-purple-600 border border-purple-200 rounded-xl flex items-center justify-center">
                    <Plus size={18} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {isEditing && (
        <div className="bg-red-50/50 dark:bg-red-950/20 rounded-2xl border border-red-200 dark:border-red-900/50 p-6 sm:p-8 mt-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-red-600 dark:text-red-500 mb-1 flex items-center gap-2">
                <AlertTriangle size={20} /> Danger Zone
              </h2>
              <p className="text-[13px] text-red-700/80 dark:text-red-400/80 font-medium max-w-2xl">
                Deleting your account will instantly remove your login access and permanently archive your data. This action cannot be undone.
              </p>
            </div>
            <button
              onClick={handleDeleteAccount}
              disabled={isDeleting}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-xl transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2 shrink-0 self-start sm:self-center"
            >
              {isDeleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
              {isDeleting ? "Deleting..." : "Delete Account"}
            </button>
          </div>
        </div>
      )}

      {modalImage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={() => setModalImage(null)}>
          <button onClick={() => setModalImage(null)} className="absolute top-4 right-4 p-2 text-white bg-white/10 rounded-full"><X size={24} /></button>
          <img src={modalImage} alt="Expanded view" className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}