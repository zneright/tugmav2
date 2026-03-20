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

      <div className="bg-white dark:bg-