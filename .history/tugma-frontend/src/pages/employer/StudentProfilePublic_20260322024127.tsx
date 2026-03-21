import { useState, useEffect } from 'react';
import {
    GraduationCap, MapPin, Loader2, ArrowLeft,
    Mail, FileText, CheckCircle2, User, Star
} from 'lucide-react';
import { auth } from '../../firebaseConfig';

interface StudentProfilePublicProps {
    studentUid: string;
    onBack: () => void;
}

export default function StudentProfilePublic({ studentUid, onBack }: StudentProfilePublicProps) {
    const [profile, setProfile] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    // To track the current Employer's ID for logging
    const [employerUid, setEmployerUid] = useState<string | null>(null);

    // 🔥 NEW: SILENT AUDIT LOGGER 🔥
    const logSystemEvent = (action: string, details: string, currentUid: string | null) => {
        if (!currentUid) return;
        fetch('http://localhost:8080/api/audit/log', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ uid: currentUid, action, details })
        }).catch(err => console.error("Audit log failed (silent):", err));
    };

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            if (user) setEmployerUid(user.uid);
        });

        const fetchProfile = async () => {
            try {
                const res = await fetch(`http://localhost:8080/api/users/profile/${studentUid}`);
                if (res.ok) {
                    const data = await res.json();

                    let parsedSkills: string[] = [];
                    if (Array.isArray(data.skills)) parsedSkills = data.skills;
                    else if (typeof data.skills === 'string') {
                        try { parsedSkills = JSON.parse(data.skills); } catch (e) { parsedSkills = []; }
                    }

                    const loadedProfile = { ...data, skills: parsedSkills };
                    setProfile(loadedProfile);

                    const currentUser = auth.currentUser;
                    if (currentUser) {
                        logSystemEvent(
                            'Viewed Student Profile',
                            `Employer viewed the full profile of candidate: ${loadedProfile.firstName} ${loadedProfile.lastName}`,
                            currentUser.uid
                        );
                    }
                }
            } catch (error) {
                console.error("Failed to load profile", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchProfile();

        return () => unsubscribe();
    }, [studentUid]);

    const handleViewResume = () => {
        if (profile?.resumeData) {

            // 🔥 LOG THE EVENT 🔥
            logSystemEvent(
                'Downloaded Candidate Resume',
                `Employer opened/downloaded resume for ${profile.firstName} ${profile.lastName} (${profile.resumeName})`,
                employerUid
            );

            window.open(profile.resumeData, '_blank');
        } else {
            alert("Resume file URL is missing.");
        }
    };

    if (isLoading) return <div className="flex justify-center items-center h-96"><Loader2 className="animate-spin text-purple-600" size={40} /></div>;

    if (!profile) return (
        <div className="text-center py-20">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Profile Not Found</h2>
            <button onClick={onBack} className="mt-4 text-purple-600 hover:underline">Go Back</button>
        </div>
    );

    return (
        <div className="max-w-5xl mx-auto space-y-6 fade-in pb-10">

            <button onClick={onBack} className="flex items-center gap-2 text-sm font-bold text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors">
                <ArrowLeft size={16} /> Back to Applicants
            </button>

            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm">

                <div className="h-32 sm:h-48 bg-gradient-to-r from-blue-500 to-purple-600 relative" />

                <div className="px-6 sm:px-10 pb-10 relative">
                    <div className="relative -mt-16 sm:-mt-20 mb-6 flex items-end justify-between">
                        <div className="w-32 h-32 sm:w-40 sm:h-40 bg-zinc-100 dark:bg-zinc-800 rounded-full border-4 border-white dark:border-zinc-950 shadow-xl overflow-hidden flex items-center justify-center text-5xl font-black text-purple-600">
                            {profile.profilePhoto ? <img src={profile.profilePhoto} alt="Profile" className="w-full h-full object-cover" /> : profile.firstName?.charAt(0) || 'U'}
                        </div>

                        <a href={`mailto:${profile.email}`} className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-bold transition-colors shadow-lg flex items-center gap-2">
                            <Mail size={16} /> Email Candidate
                        </a>
                    </div>

                    <div>
                        <h2 className="text-3xl sm:text-4xl font-black text-zinc-900 dark:text-white tracking-tight flex items-center gap-3">
                            {profile.firstName} {profile.lastName}
                        </h2>
                        <p className="text-zinc-500 dark:text-zinc-400 font-medium mt-1 text-lg">
                            {profile.title || "Student Intern Candidate"}
                        </p>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-3 mt-4 text-sm font-bold text-zinc-600 dark:text-zinc-300">
                            {profile.course && <span className="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-800 px-3 py-1.5 rounded-lg"><GraduationCap size={16} className="text-orange-500" /> {profile.course}</span>}
                            {profile.address && <span className="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-800 px-3 py-1.5 rounded-lg"><MapPin size={16} className="text-purple-500" /> {profile.address}</span>}
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-6 sm:p-8 shadow-sm">
                        <h3 className="text-lg font-black text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
                            <User className="text-purple-500" size={20} /> About
                        </h3>
                        <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed whitespace-pre-wrap">
                            {profile.about || "This candidate hasn't added an about me section yet."}
                        </p>
                    </div>

                    <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-6 sm:p-8 shadow-sm">
                        <h3 className="text-lg font-black text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
                            <Star className="text-amber-500" size={20} /> Skills
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {profile.skills.length > 0 ? profile.skills.map((skill: string) => (
                                <span key={skill} className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg text-sm font-bold border border-zinc-200 dark:border-zinc-700">
                                    {skill}
                                </span>
                            )) : <span className="text-zinc-500 italic">No skills listed.</span>}
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
                        <h3 className="text-lg font-black text-zinc-900 dark:text-white mb-4">Attached Resume</h3>
                        {profile.resumeName ? (
                            <div className="p-4 bg-purple-50 dark:bg-purple-500/5 border border-purple-100 dark:border-purple-500/20 rounded-2xl flex flex-col items-center justify-center text-center gap-3">
                                <FileText size={32} className="text-purple-500" />
                                <span className="text-sm font-bold text-purple-900 dark:text-purple-300 truncate w-full">{profile.resumeName}</span>

                                <button
                                    onClick={handleViewResume}
                                    className="mt-2 px-4 py-2 w-full bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold transition-colors"
                                >
                                    View / Download CV
                                </button>

                            </div>
                        ) : (
                            <p className="text-sm text-zinc-500 italic">Resume not provided.</p>
                        )}
                    </div>
                </div>
            </div>

        </div>
    );
}