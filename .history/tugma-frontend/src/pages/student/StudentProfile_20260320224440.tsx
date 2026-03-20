import { useState, useRef, useEffect } from 'react';
import {
  MapPin, GraduationCap, Edit2, Camera,
  Check, X, Plus, FileText, Upload,
  Briefcase, BookOpen, Target, Loader2, ChevronDown, User, ExternalLink
} from 'lucide-react';
import { auth } from '../../firebaseConfig';

const PHILIPPINE_CLASSIFICATIONS = [
  "Accounting, Finance & Economics", "Agriculture, Forestry & Fisheries", "Architecture & Environmental Planning",
  // ... Keep the rest of your classifications array ...
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
    firstName: "", lastName: "", title: "", address: "",
    classification: "Information Technology & Computer Science",
    course: "", expectedSalary: "", about: "",
    resumeName: "",
    resumeUrl: "", // 👈 ADDED: Holds the clickable download link from DB
    resumeFile: null as File | null,
    profilePhoto: "", // String (URL or Base64 preview)
    coverPhoto: "",   // String (URL or Base64 preview)
    profilePhotoFile: null as File | null, // 👈 ADDED: Holds actual image file
    coverPhotoFile: null as File | null,   // 👈 ADDED: Holds actual image file
    education: { elementary: "", highSchool: "", seniorHighSchool: "", college: "" },
    ojt: { status: "Actively Looking", requiredHours: 450, completedHours: 0 },
    skills: [] as string[], languages: [] as string[], preferredLocations: [] as string[]
  });

  const [newSkill, setNewSkill] = useState('');
  const [newLanguage, setNewLanguage] = useState('');
  const [newLocation, setNewLocation] = useState('');

  // ... [Keep your fetchProfile useEffect exactly the same] ...

  const handleSaveProfile = async () => {
    const user = auth.currentUser;
    if (!user) return;
    setIsSaving(true);

    try {
      const formData = new FormData();
      formData.append('firstName', profileData.firstName);
      formData.append('lastName', profileData.lastName);
      formData.append('title', profileData.title);
      formData.append('address', profileData.address);
      formData.append('classification', profileData.classification);
      formData.append('course', profileData.course);
      formData.append('expectedSalary', profileData.expectedSalary);
      formData.append('about', profileData.about);

      formData.append('education', JSON.stringify(profileData.education));
      formData.append('ojt', JSON.stringify(profileData.ojt));
      formData.append('skills', JSON.stringify(profileData.skills));
      formData.append('languages', JSON.stringify(profileData.languages));
      formData.append('preferredLocations', JSON.stringify(profileData.preferredLocations));

      // 👈 Send the actual FILE objects to the backend
      if (profileData.profilePhotoFile) formData.append('profilePhotoFile', profileData.profilePhotoFile);
      if (profileData.coverPhotoFile) formData.append('coverPhotoFile', profileData.coverPhotoFile);

      if (profileData.resumeFile) {
        formData.append('resume', profileData.resumeFile);
      }

      const response = await fetch(`http://localhost:8080/api/users/profile/${user.uid}`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) throw new Error("Failed to save");
      setIsEditing(false);

      // Reload the page or re-fetch profile to get the new actual URLs from the server
      window.location.reload();
    } catch (error) {
      console.error("Error saving profile:", error);
      alert("Failed to save profile.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleResumeUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("File is too large. Please upload a PDF smaller than 5MB.");
        return;
      }
      setProfileData(prev => ({ ...prev, resumeName: file.name, resumeFile: file }));
    }
  };

  // 👈 MODIFIED: Create a preview URL for the UI, but save the physical File object to state
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'profilePhoto' | 'coverPhoto') => {
    const file = e.target.files?.[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setProfileData(prev => ({
        ...prev,
        [field]: previewUrl, // Visual preview for the user
        [`${field}File`]: file // The physical file we will send to CodeIgniter
      }));
    }
  };

// ... [Keep tags logic, inputs, etc. exactly the same down to the Resume render] ...