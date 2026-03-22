import { useState, useEffect } from 'react';
import {
    Building2, MapPin, Globe, Mail, Loader2,
    Users, Sparkles, ArrowLeft, CheckCircle2, Star, Briefcase, ShieldAlert, FileWarning,
    XCircle, Lock // Added new icons for Rejected and Closed states
} from 'lucide-react';
import { auth } from '../../firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';

interface EmployerData {
    company_name: string;
    company_size: string;
    tagline: string;
    description: string;
    perks: string[];
    location: string;
    website: string;
    email: string;
}

interface CompanyProfileProps {
    employerUid: string;
    onBack: () => void;
}

export default function CompanyProfile({ employerUid, onBack }: CompanyProfileProps) {
    const [uid, setUid] = useState<string | null>(null);
    const [profile, setProfile] = useState<EmployerData | null>(null);
    const [jobs, setJobs] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Changed from a Set to a Record to track specific status per job ID
    const [applicationStatuses, setApplicationStatuses] = useState<Record<number, string>>({});

    const [jobToApply, setJobToApply] = useState<any>(null);
    const [isApplying, setIsApplying] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 5000);
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setUid(user.uid);
                fetchInteractions(user.uid);
            }
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        const fetchProfileAndJobs = async () => {
            try {
                const profileRes = await fetch(`http://localhost:8080/api/employer/profile/${employerUid}`);
                if (profileRes.ok) {
                    const data = await profileRes.json();
                    setProfile({
                        company_name: data.company_name || data.companyName || '',
                        company_size: data.company_size || '1-10',
                        tagline: data.tagline || '',
                        description: data.description || '',
                        perks: data.perks || [],
                        location: data.location || data.address || '',
                        website: data.website || '',
                        email: data.email || ''
                    });
                }

                const jobsRes = await fetch(`http://localhost:8080/api/jobs/employer/${employerUid}`);
                if (jobsRes.ok) {
                    const jobsData = await jobsRes.json();
                    setJobs(Array.isArray(jobsData) ? jobsData : []);
                }
            } catch (error) {
                console.error("Failed to load profile or jobs", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchProfileAndJobs();
    }, [employerUid]);

    const fetchInteractions = async (studentUid: string) => {
        try {
            const res = await fetch(`http://localhost:8080/api/interactions/student/${studentUid}`);
            if (res.ok) {
                const data = await res.json();
                const statuses: Record<number, string> = {};

                if (data.applications) {
                    data.applications.forEach((app: any) => {
                        statuses[app.job_id] = app.status; // e.g., 'applied', 'hired', 'rejected'
                    });
                }
                else if (data.applied) {
                    data.applied.forEach((id: number) => {
                        statuses[id] = 'applied';
                    });
                }
                setApplicationStatuses(statuses);
            }
        } catch (error) {
            console.error("Failed to fetch interactions", error);
        }
    };

    const logSystemEvent = (action: string, details: string) => {
        if (!uid) return;
        fetch('http://localhost:8080/api/audit/log', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ uid, action, details })
        }).catch(err => console.error("Audit log failed (silent):", err));
    };

    const confirmAndSubmitApplication = async () => {
        if (!jobToApply || !uid || !profile) return;
        setIsApplying(true);

        try {
            await fetch('http://localhost:8080/api/interactions/record', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ student_uid: uid, job_id: jobToApply.id, type: 'applied' })
            });

            const applyRes = await fetch('http://localhost:8080/api/applications/apply', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    job_id: jobToApply.id,
                    student_uid: uid,
                })
            });

            if (!applyRes.ok) {
                const errorData = await applyRes.json();
                throw new Error(errorData.messages?.error || errorData.message || "Failed to apply");
            }

            setApplicationStatuses(prev => ({ ...prev, [jobToApply.id]: 'applied' }));
            showToast("Application submitted successfully!", 'success');

            logSystemEvent('Submitted Job Application', `Applied for "${jobToApply.title}" at ${profile.company_name}`);

            setJobToApply(null);
        } catch (error: any) {
            showToast(error.message || "Failed to submit application. Please try again.", 'error');
        } finally {
            setIsApplying(false);
        }
    };

    if (isLoading) return <div className="flex justify-center items-center h-96"><Loader2 className="animate-spin text-purple-600" size={40} /></div>;

    if (!profile || !profile.company_name) {
        return (
            <div className="flex flex-col items-center justify-center h-96 text-center">
                <Building2 size={48} className="text-zinc-300 mb-4" />
                <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Profile Not Found</h2>
                <p className="text-zinc-500 mt-2">This employer hasn't set up their public profile yet.</p>
                <button onClick={onBack} className="mt-6 px-6 py-2 bg-zinc-900 text-white rounded-xl font-bold hover:bg-zinc-800 transition-colors">
                    Go Back
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-6 fade-in pb-10 relative">

            {/* TOAST NOTIFICATIONS */}
            {toast && (
                <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-full shadow-2xl flex items-center gap-2 text-sm font-bold text-white transition-all animate-in slide-in-from-top-4 ${toast.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`}>
                    {toast.type === 'success' ? <CheckCircle2 size={18} /> : <FileWarning size={18} />}
                    {toast.message}
                </div>
            )}

            {/* APPLICATION CONSENT MODAL */}
            {jobToApply && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-white dark:bg-zinc-900 rounded-3xl w-full max-w-md p-6 shadow-2xl border border-zinc-200 dark:border-zinc-800 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-2 bg-purple-500" />
                        <div className="flex items-center gap-3 mb-4 mt-2">
                            <div className="p-3 bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-xl">
                                <ShieldAlert size={24} />
                            </div>
                            <h3 className="text-xl font-black text-zinc-900 dark:text-white leading-tight">Data Consent <br /><span className="text-sm font-medium text-zinc-500">Submit Application</span></h3>
                        </div>

                        <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-xl border border-zinc-100 dark:border-zinc-800 mb-6">
                            <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
                                By clicking confirm, you consent to share your <strong>Profile Details</strong>, <strong>Skills</strong>, and <strong>Uploaded Resume</strong> with <span className="font-bold text-purple-600 dark:text-purple-400">{profile.company_name}</span> for the <span className="font-bold text-zinc-900 dark:text-white">{jobToApply.title}</span> role.
                            </p>
                        </div>

                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setJobToApply(null)}
                                disabled={isApplying}
                                className="px-5 py-2.5 rounded-xl text-sm font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmAndSubmitApplication}
                                disabled={isApplying}
                                className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 shadow-lg shadow-purple-500/20 transition-all flex items-center gap-2 disabled:opacity-70"
                            >
                                {isApplying ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                                {isApplying ? "Submitting..." : "Confirm & Apply"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <button onClick={onBack} className="flex items-center gap-2 text-sm font-bold text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors">
                <ArrowLeft size={16} /> Back
            </button>

            {/* PROFILE CARD */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm">
                <div className="h-48 sm:h-64 bg-gradient-to-r from-purple-600 to-indigo-600 relative overflow-hidden">
                    <div className="absolute inset-0 bg-black/20"></div>
                </div>

                <div className="px-6 sm:px-10 pb-10 relative">
                    <div className="relative -mt-16 sm:-mt-20 mb-8 flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
                        <div className="w-32 h-32 sm:w-40 sm:h-40 bg-white dark:bg-zinc-950 rounded-3xl border-4 border-white dark:border-zinc-950 shadow-xl overflow-hidden flex items-center justify-center">
                            <div className="w-full h-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-5xl font-black text-purple-600 dark:text-purple-400">
                                {profile.company_name.charAt(0).toUpperCase()}
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            {profile.website && (
                                <a href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-5 py-2.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-xl text-sm font-bold transition-colors">
                                    <Globe size={16} /> Visit Website
                                </a>
                            )}
                            {profile.email && (
                                <a href={`mailto:${profile.email}`} className="flex items-center gap-2 px-5 py-2.5 bg-purple-50 hover:bg-purple-100 dark:bg-purple-500/10 dark:hover:bg-purple-500/20 text-purple-700 dark:text-purple-400 rounded-xl text-sm font-bold transition-colors">
                                    <Mail size={16} /> Contact
                                </a>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                        <div className="lg:col-span-8 space-y-10">
                            <div>
                                <h2 className="text-3xl sm:text-4xl font-black text-zinc-900 dark:text-white tracking-tight flex items-center gap-3">
                                    {profile.company_name}
                                    <CheckCircle2 className="text-emerald-500 shrink-0" size={28} />
                                </h2>
                                <p className="text-zinc-500 dark:text-zinc-400 font-medium mt-2 text-lg">
                                    {profile.tagline || "Innovating the future, today."}
                                </p>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                                    <Sparkles className="text-purple-500" size={20} /> About Us
                                </h3>
                                <div className="text-[15px] text-zinc-600 dark:text-zinc-400 leading-relaxed font-medium whitespace-pre-wrap">
                                    {profile.description || "This company has not provided a detailed description yet."}
                                </div>
                            </div>

                            {profile.perks && profile.perks.length > 0 && (
                                <div className="space-y-4">
                                    <h3 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                                        <Star className="text-amber-500" size={20} /> Why work with us?
                                    </h3>
                                    <div className="flex flex-wrap gap-2.5">
                                        {profile.perks.map(perk => (
                                            <span key={perk} className="flex items-center gap-1.5 px-4 py-2 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300 rounded-xl text-[13px] font-bold border border-emerald-100 dark:border-emerald-500/20 shadow-sm">
                                                <CheckCircle2 size={14} /> {perk}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="lg:col-span-4">
                            <div className="bg-zinc-50 dark:bg-zinc-800/40 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 space-y-6 sticky top-6">
                                <h3 className="font-bold text-zinc-900 dark:text-white flex items-center gap-2">Company Logistics</h3>
                                <div className="space-y-5">
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-black text-zinc-400 uppercase tracking-wider flex items-center gap-1">Company Size</label>
                                        <div className="flex items-center gap-3 text-[14px] font-bold text-zinc-800 dark:text-zinc-200">
                                            <div className="w-10 h-10 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center shrink-0 shadow-sm"><Users size={18} className="text-blue-500" /></div>
                                            <span>{profile.company_size} Employees</span>
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-black text-zinc-400 uppercase tracking-wider flex items-center gap-1">Headquarters</label>
                                        <div className="flex items-center gap-3 text-[14px] font-bold text-zinc-800 dark:text-zinc-200">
                                            <div className="w-10 h-10 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center shrink-0 shadow-sm"><MapPin size={18} className="text-purple-500" /></div>
                                            <span>{profile.location || "Location not listed"}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            {/*RECENT POSTINGS */}
            <div className="pt-6 border-t border-zinc-200 dark:border-zinc-800">
                <h3 className="text-xl font-black text-zinc-900 dark:text-white mb-6 flex items-center gap-2">
                    <Briefcase className="text-purple-500" size={24} /> Open Roles at {profile.company_name}
                </h3>

                {jobs.length === 0 ? (
                    <div className="text-center py-10 bg-white dark:bg-zinc-900 rounded-3xl border border-dashed border-zinc-200 dark:border-zinc-800 text-zinc-500 font-medium">
                        This company has no active job postings right now.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {jobs.map((job) => {
                            let jobSkills: string[] = [];
                            try {
                                jobSkills = typeof job.skills === 'string' ? JSON.parse(job.skills) : (job.skills || []);
                            } catch (e) { jobSkills = []; }
                            const appStatus = applicationStatuses[job.id]?.toLowerCase();
                            const isJobClosed = job.status?.toLowerCase() === 'closed';

                            return (
                                <div key={job.id} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row gap-5">
                                    <div className="w-full sm:w-24 h-32 sm:h-24 rounded-2xl overflow-hidden shrink-0 bg-zinc-100 dark:bg-zinc-800 relative">
                                        {job.image_url ? (
                                            <img src={job.image_url} alt={job.title} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500"></div>
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                                        <h4 className="text-lg font-black text-zinc-900 dark:text-white truncate">{job.title}</h4>
                                        <p className="text-sm font-medium text-zinc-500 mt-1 flex items-center gap-1.5"><MapPin size={14} /> {job.location || profile.location || "Remote"}</p>

                                        <div className="mt-3 flex flex-wrap gap-2">
                                            {jobSkills.slice(0, 4).map((skill: string) => (
                                                <span key={skill} className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-md">
                                                    {skill}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    {/* STATUS / APPLY BUTTON */}
                                    <div className="flex items-center justify-end sm:justify-center border-t sm:border-t-0 sm:border-l border-zinc-100 dark:border-zinc-800 pt-4 sm:pt-0 sm:pl-5 sm:min-w-[140px]">
                                        {appStatus === 'hired' ? (
                                            <span className="w-full text-center py-2.5 px-4 bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-not-allowed">
                                                <CheckCircle2 size={16} /> Hired
                                            </span>
                                        ) : appStatus === 'rejected' ? (
                                            <span className="w-full text-center py-2.5 px-4 bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-not-allowed">
                                                <XCircle size={16} /> Rejected
                                            </span>
                                        ) : appStatus === 'applied' || appStatus === 'pending' ? (
                                            <span className="w-full text-center py-2.5 px-4 bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-not-allowed">
                                                <CheckCircle2 size={16} /> Applied
                                            </span>
                                        ) : isJobClosed ? (
                                            <span className="w-full text-center py-2.5 px-4 bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-not-allowed">
                                                <Lock size={16} /> Closed
                                            </span>
                                        ) : (
                                            <button
                                                onClick={() => setJobToApply(job)}
                                                className="w-full py-2.5 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-bold transition-all shadow-md shadow-purple-500/20 active:scale-95"
                                            >
                                                Apply Now
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

        </div>
    );
}