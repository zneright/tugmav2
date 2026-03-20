import { useState, useEffect } from 'react';
import {
    Building2, MapPin, Globe, Mail, Loader2,
    Users, Sparkles, ArrowLeft, CheckCircle2, Star, Briefcase, ChevronRight
} from 'lucide-react';

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
    const [profile, setProfile] = useState<EmployerData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await fetch(`http://localhost:8080/api/employer/profile/${employerUid}`);
                if (res.ok) {
                    const data = await res.json();
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
            } catch (error) {
                console.error("Failed to load profile", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchProfile();
    }, [employerUid]);

    if (isLoading) {
        return <div className="flex justify-center items-center h-96"><Loader2 className="animate-spin text-purple-600" size={40} /></div>;
    }

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
        <div className="max-w-5xl mx-auto space-y-6 fade-in pb-10">

            {/* --- BACK BUTTON --- */}
            <button
                onClick={onBack}
                className="flex items-center gap-2 text-sm font-bold text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors"
            >
                <ArrowLeft size={16} /> Back to Job Listings
            </button>

            {/* --- MAIN PROFILE CARD --- */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm">

                {/* Banner Section */}
                <div className="h-48 sm:h-64 bg-gradient-to-r from-purple-600 to-indigo-600 relative overflow-hidden">
                    <div className="absolute inset-0 bg-black/20"></div>
                    {/* Optional: Add a subtle pattern overlay here */}
                </div>

                {/* Profile Info Overlay */}
                <div className="px-6 sm:px-10 pb-10 relative">

                    {/* Logo & Quick Actions */}
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
                        {/* --- LEFT COLUMN: CORE DETAILS --- */}
                        <div className="lg:col-span-8 space-y-10">

                            {/* Name & Tagline */}
                            <div>
                                <h2 className="text-3xl sm:text-4xl font-black text-zinc-900 dark:text-white tracking-tight flex items-center gap-3">
                                    {profile.company_name}
                                    <CheckCircle2 className="text-emerald-500 shrink-0" size={28} />
                                </h2>
                                <p className="text-zinc-500 dark:text-zinc-400 font-medium mt-2 text-lg">
                                    {profile.tagline || "Innovating the future, today."}
                                </p>
                            </div>

                            {/* Description */}
                            <div className="space-y-4">
                                <h3 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                                    <Sparkles className="text-purple-500" size={20} /> About Us
                                </h3>
                                <div className="text-[15px] text-zinc-600 dark:text-zinc-400 leading-relaxed font-medium whitespace-pre-wrap">
                                    {profile.description || "This company has not provided a detailed description yet."}
                                </div>
                            </div>

                            {/* Perks */}
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

                        {/* --- RIGHT COLUMN: LOGISTICS SIDEBAR --- */}
                        <div className="lg:col-span-4">
                            <div className="bg-zinc-50 dark:bg-zinc-800/40 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 space-y-6 sticky top-6">
                                <h3 className="font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                                    Company Logistics
                                </h3>

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

            {/* --- MOCKUP: RECENT POSTINGS SECTION --- */}
            <div className="pt-6 border-t border-zinc-200 dark:border-zinc-800">
                <h3 className="text-xl font-black text-zinc-900 dark:text-white mb-6 flex items-center gap-2">
                    <Briefcase className="text-purple-500" size={24} /> Open Roles at {profile.company_name}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Mock Job 1 */}
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all group flex flex-col sm:flex-row gap-5 cursor-pointer">
                        <div className="w-full sm:w-24 h-32 sm:h-24 rounded-2xl overflow-hidden shrink-0 bg-zinc-100 dark:bg-zinc-800 relative">
                            <div className="w-full h-full bg-gradient-to-br from-blue-400 to-emerald-400"></div>
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                            <h4 className="text-lg font-black text-zinc-900 dark:text-white truncate group-hover:text-purple-600 transition-colors">Frontend Intern</h4>
                            <p className="text-sm font-medium text-zinc-500 mt-1 flex items-center gap-1.5"><MapPin size={14} /> {profile.location || "Onsite"}</p>
                            <div className="mt-3 flex gap-2">
                                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-md">React</span>
                                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-md">UI/UX</span>
                            </div>
                        </div>
                        <div className="flex items-center justify-end sm:justify-start">
                            <ChevronRight className="text-zinc-300 group-hover:text-purple-500 transition-colors" />
                        </div>
                    </div>

                    {/* Mock Job 2 */}
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all group flex flex-col sm:flex-row gap-5 cursor-pointer">
                        <div className="w-full sm:w-24 h-32 sm:h-24 rounded-2xl overflow-hidden shrink-0 bg-zinc-100 dark:bg-zinc-800 relative">
                            <div className="w-full h-full bg-gradient-to-br from-amber-400 to-orange-500"></div>
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                            <h4 className="text-lg font-black text-zinc-900 dark:text-white truncate group-hover:text-purple-600 transition-colors">Data Analyst Trainee</h4>
                            <p className="text-sm font-medium text-zinc-500 mt-1 flex items-center gap-1.5"><MapPin size={14} /> Remote</p>
                            <div className="mt-3 flex gap-2">
                                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-md">Python</span>
                                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-md">Excel</span>
                            </div>
                        </div>
                        <div className="flex items-center justify-end sm:justify-start">
                            <ChevronRight className="text-zinc-300 group-hover:text-purple-500 transition-colors" />
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
}