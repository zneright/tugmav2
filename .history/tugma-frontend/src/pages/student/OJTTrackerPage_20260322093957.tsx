import { useState, useEffect } from 'react';
import {
    Clock, Target, Calendar, BrainCircuit,
    Plus, FileText, CheckCircle2, AlertCircle,
    Sparkles, Info, Zap, PlayCircle, Download, Loader2, Briefcase
} from 'lucide-react';
import { auth } from '../../firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import PrintDTRModal from '../../components/PrintDtrModal';

interface LogEntry {
    id?: string;
    date: string;
    hoursLogged: number;
    hoursCredited: number;
    task: string;
    isDouble: boolean;
}

export default function OJTTrackerPage() {
    const [uid, setUid] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // User Details for PDF
    const [studentProfile, setStudentProfile] = useState<any>(null);

    const [status, setStatus] = useState<'Actively Looking' | 'In Progress' | 'Completed' | 'Rejected'>('Actively Looking');
    const [requiredHours, setRequiredHours] = useState<number>(450);
    const [completedHours, setCompletedHours] = useState<number>(0);
    const [logs, setLogs] = useState<LogEntry[]>([]);

    // Job Alert State
    const [jobAlert, setJobAlert] = useState<{ type: 'Hired' | 'Offered', company: string, role: string } | null>(null);

    // DTR Input States
    const [logHours, setLogHours] = useState<number | ''>('');
    const [logTask, setLogTask] = useState('');
    const [isDoublePay, setIsDoublePay] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // AI Predictor States
    const [hoursPerShift, setHoursPerShift] = useState<number | ''>(8);
    const [daysPerWeek, setDaysPerWeek] = useState<number | ''>(5);
    const [targetStartDate, setTargetStartDate] = useState<string>('');

    // Print Modal State
    const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

    // --- CALCULATIONS ---
    const remainingHours = Math.max(0, requiredHours - completedHours);
    const progressPercentage = requiredHours > 0
        ? Math.min(100, Math.round((completedHours / requiredHours) * 100))
        : 0;

    // --- FETCH DATA ON LOAD ---
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setUid(user.uid);
                try {
                    // 1. Fetch Student Profile (for PDF Details)
                    const profileRes = await fetch(`http://localhost:8080/api/users/profile/${user.uid}`);
                    if (profileRes.ok) {
                        const profileData = await profileRes.json();
                        setStudentProfile(profileData);
                        if (profileData.ojt) {
                            setRequiredHours(profileData.ojt.requiredHours || 450);
                            setStatus(profileData.ojt.status || 'Actively Looking');
                        }
                    }

                    // 2. Fetch Existing DTR Logs from Database
                    const logsRes = await fetch(`http://localhost:8080/api/dtr/logs/${user.uid}`);
                    if (logsRes.ok) {
                        const logsData = await logsRes.json();
                        setLogs(logsData);

                        // Calculate total completed hours from DB logs
                        const totalHours = logsData.reduce((sum: number, log: LogEntry) => sum + Number(log.hoursCredited), 0);
                        setCompletedHours(totalHours);

                        if (totalHours >= requiredHours && requiredHours > 0) {
                            setStatus('Completed');
                        }
                    }

                    // 3. Fetch Applications to check for Offers/Hired status
                    const appsRes = await fetch(`http://localhost:8080/api/applications/student/${user.uid}`);
                    if (appsRes.ok) {
                        const appsData = await appsRes.json();
                        const hired = appsData.find((a: any) => a.status === 'Hired');
                        const offered = appsData.find((a: any) => a.status === 'Offered');

                        if (hired) {
                            setJobAlert({ type: 'Hired', company: hired.company_name, role: hired.role });
                        } else if (offered) {
                            setJobAlert({ type: 'Offered', company: offered.company_name, role: offered.role });
                        }
                    }

                } catch (error) {
                    console.error("Failed to load OJT data:", error);
                } finally {
                    setIsLoading(false);
                }
            } else {
                setIsLoading(false);
            }
        });
        return () => unsubscribe();
    }, [requiredHours]);

    // SYSTEM LOGS!!
    const logSystemEvent = (action: string, details: string) => {
        if (!uid) return;
        fetch('http://localhost:8080/api/audit/log', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ uid, action, details })
        }).catch(err => console.error("Audit log failed (silent):", err));
    };

    // DTR LOG 
    const handleAddLog = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!logHours || logHours <= 0 || !logTask.trim() || !uid) return;

        setIsSubmitting(true);
        const creditedHours = isDoublePay ? Number(logHours) * 2 : Number(logHours);

        const newLogData = {
            student_uid: uid,
            date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            hoursLogged: Number(logHours),
            hoursCredited: creditedHours,
            task: logTask,
            isDouble: isDoublePay
        };

        try {
            const res = await fetch('http://localhost:8080/api/dtr/add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newLogData)
            });

            if (res.ok) {
                const savedLog = await res.json();

                setLogs([savedLog, ...logs]);
                setCompletedHours(prev => prev + creditedHours);

                if (completedHours + creditedHours >= requiredHours) {
                    setStatus('Completed');
                }

                logSystemEvent('Logged OJT Hours', `Logged ${logHours} hours (Credited: ${creditedHours}) for task: "${logTask}"`);

                // Reset Form
                setLogHours('');
                setLogTask('');
                setIsDoublePay(false);
            } else {
                alert("Failed to save log to database.");
            }
        } catch (error) {
            console.error("DTR Submit Error:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    //  PREDICTOR
    const calculateLookingForecast = () => {
        if (!hoursPerShift || !daysPerWeek || hoursPerShift <= 0 || daysPerWeek <= 0) return "--";
        if (!targetStartDate) return "Set a Start Date";

        const shiftsNeeded = Math.ceil(requiredHours / hoursPerShift);
        const weeksNeeded = shiftsNeeded / daysPerWeek;
        const calendarDaysNeeded = Math.ceil(weeksNeeded * 7);

        const endDate = new Date(targetStartDate);
        endDate.setDate(endDate.getDate() + calendarDaysNeeded);

        return endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const calculateExpectedEnd = () => {
        if (remainingHours === 0) return "Completed!";
        if (!hoursPerShift || !daysPerWeek || hoursPerShift <= 0 || daysPerWeek <= 0) return "--";

        const shiftsLeft = Math.ceil(remainingHours / hoursPerShift);
        const weeksLeft = shiftsLeft / daysPerWeek;
        const calendarDaysLeft = Math.ceil(weeksLeft * 7);

        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + calendarDaysLeft);

        return targetDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    if (isLoading) {
        return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-purple-600" size={40} /></div>;
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-20 px-4 sm:px-0 animate-in fade-in duration-500">

            {/* HEADER*/}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden transition-colors">
                <div className="p-5 sm:p-8 border-b border-zinc-200 dark:border-zinc-800">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-black text-zinc-900 dark:text-white flex items-center gap-2 mb-1">
                                <Target className="text-purple-500" /> OJT Progress Hub
                            </h1>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400">Track your hours, predict your graduation, and log your daily tasks.</p>

                            {/* Job Alert*/}
                            {jobAlert?.type === 'Hired' && (
                                <div className="mt-3 inline-flex items-center gap-2 bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-100 dark:border-emerald-500/20 transition-colors">
                                    <Briefcase size={14} className="text-emerald-600 dark:text-emerald-400" />
                                    <span className="text-xs font-bold text-emerald-900 dark:text-emerald-100">
                                        Officially Hired by: <span className="text-emerald-600 dark:text-emerald-400">{jobAlert.company}</span> as {jobAlert.role}
                                    </span>
                                </div>
                            )}
                            {jobAlert?.type === 'Offered' && (
                                <div className="mt-3 inline-flex items-center gap-2 bg-purple-50 dark:bg-purple-500/10 px-3 py-1.5 rounded-lg border border-purple-100 dark:border-purple-500/20 transition-colors animate-pulse">
                                    <Sparkles size={14} className="text-purple-600 dark:text-purple-400" />
                                    <span className="text-xs font-bold text-purple-900 dark:text-purple-100">
                                        You have a pending offer from <span className="text-purple-600 dark:text-purple-400">{jobAlert.company}</span>! Check Connected Employers.
                                    </span>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-3 mt-2 sm:mt-0">
                            <span className={`text-[11px] uppercase tracking-wider font-bold px-4 py-2 rounded-full border w-fit transition-colors ${status === 'In Progress'
                                ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'
                                : status === 'Completed'
                                    ? 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20'
                                    : 'bg-orange-50 text-orange-600 border-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20'
                                }`}>
                                {status}
                            </span>

                            <button
                                onClick={() => {
                                    setIsPrintModalOpen(true);
                                    logSystemEvent('Downloaded DTR', `Generated DTR PDF with ${completedHours}/${requiredHours} hours completed.`);
                                }}
                                disabled={logs.length === 0}
                                className="flex items-center gap-2 bg-purple-100 hover:bg-purple-200 text-purple-700 dark:bg-purple-500/20 dark:hover:bg-purple-500/30 dark:text-purple-300 px-4 py-2 rounded-xl text-sm font-bold transition-colors disabled:opacity-50 shadow-sm"
                            >
                                <Download size={16} /> Print DTR
                            </button>
                        </div>
                    </div>

                    {/* PROGRESS BAR */}
                    {(status === 'In Progress' || status === 'Completed') && (
                        <div className="mt-8 animate-in fade-in slide-in-from-top-2">
                            <div className="flex justify-between items-end mb-3">
                                <div>
                                    <p className="text-4xl sm:text-5xl font-black text-zinc-900 dark:text-white tracking-tight transition-colors">
                                        {completedHours} <span className="text-lg sm:text-xl font-medium text-zinc-500 dark:text-zinc-400">/ {requiredHours} hrs</span>
                                    </p>
                                </div>
                                <span className="text-purple-600 dark:text-purple-400 font-black text-2xl sm:text-3xl">{progressPercentage}%</span>
                            </div>
                            <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-4 overflow-hidden shadow-inner transition-colors">
                                <div
                                    className="bg-gradient-to-r from-purple-600 to-indigo-500 h-full rounded-full transition-all duration-1000 ease-out"
                                    style={{ width: `${progressPercentage}%` }}
                                ></div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-5 sm:p-8 bg-zinc-50 dark:bg-zinc-950/50 transition-colors">

                    {/*ACTIVELY LOOKING STATE*/}
                    {status === 'Actively Looking' && (
                        <div className="space-y-6 animate-in fade-in">
                            <div className="text-center py-6">
                                <div className="w-20 h-20 bg-orange-100 dark:bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-5 transition-colors">
                                    <AlertCircle size={40} className="text-orange-500" />
                                </div>
                                <h3 className="text-2xl font-black text-zinc-900 dark:text-white mb-2 transition-colors">Awaiting Employer Action</h3>
                                <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 max-w-md mx-auto mb-8 transition-colors">
                                    Your DTR tracker is currently locked. Once an employer accepts your application and changes your status to "Hired", this tracker will automatically activate.
                                </p>
                            </div>

                            {/* Planning AI Predictor with START DATE */}
                            <div className="bg-gradient-to-br from-purple-50 to-white dark:from-[#1e1430] dark:to-[#120a1f] p-5 sm:p-6 rounded-2xl border border-purple-200 dark:border-purple-500/20 relative overflow-hidden shadow-sm dark:shadow-lg mt-8 transition-colors">
                                <div className="absolute top-0 right-0 w-40 h-40 bg-purple-200/40 dark:bg-purple-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none transition-colors"></div>

                                <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-5 relative z-10">
                                    <div className="p-4 bg-purple-100 dark:bg-purple-500/20 rounded-2xl shrink-0 hidden sm:block transition-colors">
                                        <Sparkles className="text-purple-600 dark:text-purple-400" size={32} />
                                    </div>
                                    <div className="flex-1 w-full">
                                        <div className="flex items-center gap-3 mb-2 sm:mb-1">
                                            <div className="p-2 bg-purple-100 dark:bg-purple-500/20 rounded-lg sm:hidden transition-colors">
                                                <Sparkles className="text-purple-600 dark:text-purple-400" size={20} />
                                            </div>
                                            <h3 className="text-base font-bold text-purple-900 dark:text-white transition-colors">Forecast Your Timeline</h3>
                                        </div>
                                        <p className="text-sm text-purple-700 dark:text-purple-200/70 mb-5 leading-relaxed font-medium transition-colors">
                                            Planning a target start date? Let's estimate when you'll finish your <strong className="text-purple-900 dark:text-white font-black transition-colors">{requiredHours} required hours</strong>.
                                        </p>

                                        <div className="flex flex-col md:flex-row md:items-center gap-4 bg-white dark:bg-black/30 p-4 rounded-xl border border-purple-100 dark:border-white/5 shadow-sm transition-colors">
                                            <div className="flex items-center justify-between md:justify-start gap-3 w-full md:w-auto">
                                                <label className="text-[11px] font-bold text-purple-500 dark:text-purple-200/60 uppercase tracking-wider transition-colors">Target Start</label>
                                                <input type="date" value={targetStartDate} onChange={(e) => setTargetStartDate(e.target.value)} className="w-full md:w-auto bg-zinc-50 dark:bg-white/10 text-zinc-900 dark:text-white text-[13px] font-medium rounded-lg px-3 py-2 border border-zinc-200 dark:border-transparent outline-none focus:ring-2 focus:ring-purple-500 transition-all dark:[color-scheme:dark]" />
                                            </div>
                                            <div className="hidden md:block h-8 w-px bg-purple-100 dark:bg-white/10 transition-colors"></div>

                                            <div className="flex gap-4 w-full md:w-auto">
                                                <div className="flex-1 md:flex-none flex items-center justify-between md:justify-start gap-2">
                                                    <label className="text-[11px] font-bold text-purple-500 dark:text-purple-200/60 uppercase tracking-wider transition-colors">Hrs/Shift</label>
                                                    <input type="number" value={hoursPerShift} onChange={(e) => setHoursPerShift(Number(e.target.value) || '')} className="w-16 bg-zinc-50 dark:bg-white/10 border border-zinc-200 dark:border-transparent text-zinc-900 dark:text-white text-sm font-bold text-center rounded-lg py-2 outline-none focus:ring-2 focus:ring-purple-500 transition-all" />
                                                </div>
                                                <div className="hidden md:block h-8 w-px bg-purple-100 dark:bg-white/10 transition-colors"></div>
                                                <div className="flex-1 md:flex-none flex items-center justify-between md:justify-start gap-2">
                                                    <label className="text-[11px] font-bold text-purple-500 dark:text-purple-200/60 uppercase tracking-wider transition-colors">Days/Wk</label>
                                                    <input type="number" max="7" value={daysPerWeek} onChange={(e) => setDaysPerWeek(Number(e.target.value) || '')} className="w-16 bg-zinc-50 dark:bg-white/10 border border-zinc-200 dark:border-transparent text-zinc-900 dark:text-white text-sm font-bold text-center rounded-lg py-2 outline-none focus:ring-2 focus:ring-purple-500 transition-all" />
                                                </div>
                                            </div>

                                            <div className="mt-2 md:mt-0 md:ml-auto flex flex-col items-center md:items-end p-3 md:p-0 bg-purple-50 dark:bg-white/5 md:bg-transparent md:dark:bg-transparent rounded-lg border border-purple-100 dark:border-transparent md:border-transparent md:dark:border-transparent transition-colors">
                                                <span className="text-[10px] text-purple-500 dark:text-purple-300/60 uppercase tracking-widest font-black mb-1 transition-colors">Expected Completion</span>
                                                <span className="text-xl font-black text-purple-700 dark:text-emerald-400 leading-none transition-colors">{calculateLookingForecast()}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* REJECTED STATE */}
                    {status === 'Rejected' && (
                        <div className="text-center py-12 animate-in fade-in">
                            <AlertCircle size={40} className="mx-auto text-zinc-300 mb-4" />
                            <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Tracker Locked</h3>
                            <p className="text-sm text-zinc-500 max-w-md mx-auto">
                                Your application for this role was not successful. Keep applying and you'll be able to log hours once you accept an official job offer!
                            </p>
                        </div>
                    )}

                    {/*IN PROGRESS STATE */}
                    {status === 'In Progress' && (
                        <div className="space-y-8 animate-in fade-in">

                            {/* Live AI Predictor Card */}
                            <div className="bg-gradient-to-br from-emerald-50 to-white dark:from-[#1e1430] dark:to-[#120a1f] p-5 sm:p-6 rounded-2xl border border-emerald-200 dark:border-purple-500/20 relative overflow-hidden shadow-sm dark:shadow-lg transition-colors">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-200/40 dark:bg-emerald-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none transition-colors"></div>

                                <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-5 relative z-10">
                                    <div className="p-3 bg-emerald-100 dark:bg-emerald-500/20 rounded-xl shrink-0 hidden sm:block transition-colors">
                                        <BrainCircuit className="text-emerald-600 dark:text-emerald-400" size={24} />
                                    </div>
                                    <div className="flex-1 w-full">
                                        <div className="flex items-center gap-3 mb-2 sm:mb-1">
                                            <div className="p-2 bg-emerald-100 dark:bg-emerald-500/20 rounded-lg sm:hidden transition-colors">
                                                <BrainCircuit className="text-emerald-600 dark:text-emerald-400" size={18} />
                                            </div>
                                            <h3 className="text-base font-bold text-emerald-950 dark:text-white transition-colors">Live Completion Predictor</h3>
                                        </div>
                                        <p className="text-[13px] text-emerald-700 dark:text-purple-200/70 mb-5 leading-relaxed font-medium transition-colors">
                                            Based on your remaining <strong className="text-emerald-950 dark:text-white font-black transition-colors">{remainingHours} hours</strong>, we estimate your end date.
                                        </p>

                                        <div className="flex flex-col md:flex-row md:items-center gap-4 bg-white dark:bg-black/30 p-4 rounded-xl border border-emerald-100 dark:border-white/5 shadow-sm mb-3 transition-colors">
                                            <div className="flex gap-4 w-full md:w-auto">
                                                <div className="flex-1 md:flex-none flex items-center justify-between md:justify-start gap-2">
                                                    <label className="text-[11px] font-bold text-emerald-600 dark:text-purple-200/60 uppercase tracking-wider transition-colors">Hrs / Shift</label>
                                                    <input type="number" value={hoursPerShift} onChange={(e) => setHoursPerShift(Number(e.target.value) || '')} className="w-16 bg-zinc-50 dark:bg-white/10 border border-zinc-200 dark:border-transparent text-zinc-900 dark:text-white text-sm font-bold text-center rounded-lg py-2 outline-none focus:ring-2 focus:ring-emerald-500 transition-all" />
                                                </div>
                                                <div className="hidden md:block h-8 w-px bg-emerald-100 dark:bg-white/10 transition-colors"></div>
                                                <div className="flex-1 md:flex-none flex items-center justify-between md:justify-start gap-2">
                                                    <label className="text-[11px] font-bold text-emerald-600 dark:text-purple-200/60 uppercase tracking-wider transition-colors">Days / Wk</label>
                                                    <input type="number" max="7" value={daysPerWeek} onChange={(e) => setDaysPerWeek(Number(e.target.value) || '')} className="w-16 bg-zinc-50 dark:bg-white/10 border border-zinc-200 dark:border-transparent text-zinc-900 dark:text-white text-sm font-bold text-center rounded-lg py-2 outline-none focus:ring-2 focus:ring-emerald-500 transition-all" />
                                                </div>
                                            </div>

                                            <div className="mt-2 md:mt-0 md:ml-auto flex flex-col items-center md:items-end p-3 md:p-0 bg-emerald-50 dark:bg-white/5 md:bg-transparent md:dark:bg-transparent rounded-lg border border-emerald-100 dark:border-transparent md:border-transparent md:dark:border-transparent transition-colors">
                                                <span className="text-[10px] text-emerald-600 dark:text-purple-300/60 uppercase tracking-widest font-black mb-1 transition-colors">Est. End Date</span>
                                                <span className="text-xl font-black text-emerald-700 dark:text-emerald-400 leading-none transition-colors">{calculateExpectedEnd()}</span>
                                            </div>
                                        </div>

                                        {/* Holiday Disclaimer */}
                                        <div className="flex items-start gap-2 mt-4 text-[11px] text-emerald-700/70 dark:text-purple-300/50 font-medium transition-colors">
                                            <Info size={14} className="shrink-0 mt-0.5" />
                                            <p>Note: This is an automated estimate. Your actual completion date may vary due to undeclared holidays, suspension of classes, or overtime logs.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2 mb-4 transition-colors">
                                    <Clock size={20} className="text-purple-500" /> Log Daily Time Record
                                </h3>

                                <form onSubmit={handleAddLog} className="bg-white dark:bg-zinc-900 p-4 sm:p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm mb-6 transition-colors">
                                    <div className="flex flex-col sm:flex-row gap-4 mb-5">
                                        <div className="w-full sm:w-28 shrink-0">
                                            <label className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2 block transition-colors">Hours</label>
                                            <input
                                                type="number" placeholder="e.g. 8" value={logHours} onChange={(e) => setLogHours(Number(e.target.value) || '')}
                                                className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 rounded-xl text-sm font-bold text-zinc-900 dark:text-white outline-none focus:border-purple-500 transition-all placeholder:text-zinc-400"
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <label className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2 block transition-colors">Task / Activity</label>
                                            <input
                                                type="text" placeholder="What did you work on today?" value={logTask} onChange={(e) => setLogTask(e.target.value)}
                                                className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 rounded-xl text-[13px] font-medium text-zinc-900 dark:text-white outline-none focus:border-purple-500 transition-all placeholder:text-zinc-400"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-zinc-100 dark:border-zinc-800 pt-4 transition-colors">
                                        <button
                                            type="button"
                                            onClick={() => setIsDoublePay(!isDoublePay)}
                                            className={`flex items-center justify-center sm:justify-start gap-2 px-4 py-3 sm:py-2.5 rounded-xl border text-[12px] font-bold transition-all w-full sm:w-auto ${isDoublePay
                                                ? 'bg-orange-50 border-orange-200 text-orange-600 dark:bg-orange-500/10 dark:border-orange-500/30 dark:text-orange-400 shadow-sm'
                                                : 'bg-zinc-50 border-zinc-200 text-zinc-500 hover:bg-zinc-100 dark:bg-zinc-800/50 dark:border-zinc-700/50 dark:text-zinc-400 dark:hover:bg-zinc-800'
                                                }`}
                                        >
                                            <Zap size={16} className={isDoublePay ? "fill-orange-500" : ""} />
                                            Holiday / Double Credit
                                        </button>

                                        <button disabled={isSubmitting} type="submit" className="w-full sm:w-auto px-8 py-3.5 sm:py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-md shadow-purple-500/20 disabled:opacity-50">
                                            {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
                                            Submit Entry
                                        </button>
                                    </div>
                                </form>

                                {/* DTR History List */}
                                <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-1 sm:pr-2">
                                    {logs.length === 0 ? (
                                        <div className="text-center py-10 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-900/50 transition-colors">
                                            <FileText className="mx-auto text-zinc-300 dark:text-zinc-700 mb-3 transition-colors" size={32} />
                                            <p className="text-sm font-bold text-zinc-500 dark:text-zinc-400 transition-colors">Your DTR is empty.</p>
                                        </div>
                                    ) : (
                                        logs.map((log) => (
                                            <div key={log.id} className="flex items-center justify-between p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm hover:border-purple-300 dark:hover:border-purple-500/30 transition-colors">
                                                <div className="flex flex-col overflow-hidden pr-3">
                                                    <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5 mb-1 uppercase tracking-wider transition-colors">
                                                        <Calendar size={12} /> {log.date}
                                                    </span>
                                                    <div className="flex flex-col items-start gap-1.5">
                                                        <span className="text-[14px] font-bold text-zinc-900 dark:text-white break-words line-clamp-2 transition-colors">{log.task}</span>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end shrink-0">
                                                    <div className="bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 px-3 py-1.5 rounded-lg text-sm font-black whitespace-nowrap border border-purple-100 dark:border-purple-500/20 transition-colors">
                                                        +{log.hoursCredited} hrs
                                                    </div>
                                                    {log.isDouble && <span className="text-[10px] text-zinc-400 font-medium mt-1">({log.hoursLogged}h x 2)</span>}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {status === 'Completed' && (
                        <div className="text-center py-12 animate-in fade-in zoom-in-95">
                            <div className="w-24 h-24 bg-emerald-100 dark:bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-500/10 transition-colors">
                                <CheckCircle2 size={48} className="text-emerald-500" />
                            </div>
                            <h3 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white mb-3 transition-colors">Requirements Met!</h3>
                            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 max-w-md mx-auto leading-relaxed px-4 transition-colors">
                                Congratulations on completing your required OJT hours! Ensure your final DTR and supervisor evaluations are compiled and submitted to your coordinator.
                            </p>
                            <button
                                onClick={() => {
                                    setIsPrintModalOpen(true);
                                    logSystemEvent('Downloaded DTR', `Generated Final DTR PDF with ${completedHours}/${requiredHours} hours completed.`);
                                }}
                                className="mt-8 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-3 rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 mx-auto transition-all hover:scale-105 active:scale-95"
                            >
                                <Download size={20} /> Download Final DTR
                            </button>
                        </div>
                    )}

                </div>
            </div>

            {/* DTR PRINT MODAL */}
            <PrintDTRModal
                isOpen={isPrintModalOpen}
                onClose={() => setIsPrintModalOpen(false)}
                logs={logs}
                studentProfile={studentProfile}
                requiredHours={requiredHours}
                completedHours={completedHours}
            />

        </div>
    );
}