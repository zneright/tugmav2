import { useState, useEffect } from 'react';
import {
    Clock, Target, Calendar, BrainCircuit,
    Plus, FileText, CheckCircle2, AlertCircle,
    Sparkles, Info, Zap, PlayCircle, Download, Loader2
} from 'lucide-react';
import { auth } from '../../firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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

    const [status, setStatus] = useState<'Actively Looking' | 'In Progress' | 'Completed'>('Actively Looking');
    const [requiredHours, setRequiredHours] = useState<number>(450);
    const [completedHours, setCompletedHours] = useState<number>(0);
    const [logs, setLogs] = useState<LogEntry[]>([]);

    // DTR Input States
    const [logHours, setLogHours] = useState<number | ''>('');
    const [logTask, setLogTask] = useState('');
    const [isDoublePay, setIsDoublePay] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // AI Predictor States
    const [hoursPerShift, setHoursPerShift] = useState<number | ''>(8);
    const [daysPerWeek, setDaysPerWeek] = useState<number | ''>(5);
    const [targetStartDate, setTargetStartDate] = useState<string>('');

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
                            setStatus(profileData.ojt.status || 'In Progress');
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

    // --- PDF GENERATOR ---
    const handleDownloadPDF = () => {
        const doc = new jsPDF();

        // 1. Header Section
        doc.setFontSize(18);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(147, 51, 234); // Purple-600
        doc.text("DAILY TIME RECORD (DTR)", 105, 20, { align: "center" });

        // 2. User Details Section
        doc.setFontSize(11);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(30, 30, 30);

        const fullName = studentProfile ? `${studentProfile.firstName || ''} ${studentProfile.lastName || ''}` : 'Unknown Student';
        const course = studentProfile?.course || 'Information Technology'; // Defaulting to your program if blank

        doc.text(`Student Name: ${fullName}`, 14, 35);
        doc.text(`Course/Program: ${course}`, 14, 42);
        doc.text(`Total Required Hours: ${requiredHours} hrs`, 14, 49);
        doc.text(`Total Completed Hours: ${completedHours} hrs`, 14, 56);

        // 3. Log Table
        const tableColumn = ["Date", "Task / Activity", "Logged Hrs", "Holiday/Double", "Credited Hrs"];
        const tableRows = logs.map(log => [
            log.date,
            log.task,
            `${log.hoursLogged} hrs`,
            log.isDouble ? "Yes" : "No",
            `${log.hoursCredited} hrs`
        ]);

        autoTable(doc, {
            startY: 65,
            head: [tableColumn],
            body: tableRows,
            theme: 'grid',
            headStyles: { fillColor: [147, 51, 234], textColor: 255 }, // Purple Header
            styles: { fontSize: 10 },
            alternateRowStyles: { fillColor: [250, 250, 250] }
        });

        // 4. Supervisor Signature Section (Auto-adjusts below the table)
        const finalY = (doc as any).lastAutoTable.finalY || 65;

        doc.setFont("helvetica", "italic");
        doc.setFontSize(10);
        doc.text("I hereby certify that the above records are true and correct.", 14, finalY + 15);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.text("Certified Correct By:", 14, finalY + 35);

        // Lines for Signature and Date
        doc.setDrawColor(100, 100, 100);
        doc.line(14, finalY + 50, 80, finalY + 50); // Signature Line
        doc.setFont("helvetica", "normal");
        doc.text("Supervisor Signature over Printed Name", 14, finalY + 56);

        doc.line(130, finalY + 50, 180, finalY + 50); // Date Line
        doc.text("Date", 130, finalY + 56);

        // Save
        doc.save(`DTR_Log_${fullName.replace(/\s+/g, '_')}.pdf`);
    };

    // --- HANDLER: ADD DTR LOG ---
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
            // Save to Database
            const res = await fetch('http://localhost:8080/api/dtr/add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newLogData)
            });

            if (res.ok) {
                const savedLog = await res.json();

                // Update UI
                setLogs([savedLog, ...logs]);
                setCompletedHours(prev => prev + creditedHours);

                if (completedHours + creditedHours >= requiredHours) {
                    setStatus('Completed');
                }

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

    // Predictor logic remains the same...
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

    // --- PREDICTOR LOGIC (In Progress Mode) ---
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

            {/* HEADER SECTION */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden transition-colors">
                <div className="p-5 sm:p-8 border-b border-zinc-200 dark:border-zinc-800">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-black text-zinc-900 dark:text-white flex items-center gap-2 mb-1">
                                <Target className="text-purple-500" /> OJT Progress Hub
                            </h1>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400">Track your hours, predict your graduation, and log your daily tasks.</p>
                        </div>

                        <div className="flex items-center gap-3">
                            <span className={`text-[11px] uppercase tracking-wider font-bold px-4 py-2 rounded-full border w-fit transition-colors ${status === 'In Progress'
                                ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400'
                                : status === 'Completed'
                                    ? 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400'
                                    : 'bg-orange-50 text-orange-600 border-orange-200 dark:bg-orange-500/10 dark:text-orange-400'
                                }`}>
                                {status}
                            </span>

                            {/* 🔥 NEW: PDF DOWNLOAD BUTTON 🔥 */}
                            <button
                                onClick={handleDownloadPDF}
                                disabled={logs.length === 0}
                                className="flex items-center gap-2 bg-purple-100 hover:bg-purple-200 text-purple-700 dark:bg-purple-500/20 dark:hover:bg-purple-500/30 dark:text-purple-300 px-4 py-2 rounded-xl text-sm font-bold transition-colors disabled:opacity-50"
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

                    {/* ---------------- IN PROGRESS STATE ---------------- */}
                    {(status === 'In Progress' || status === 'Completed') && (
                        <div className="space-y-8 animate-in fade-in">

                            {/* DTR LOGGER */}
                            <div>
                                <h3 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2 mb-4 transition-colors">
                                    <Clock size={20} className="text-purple-500" /> Log Daily Time Record
                                </h3>

                                {/* Form */}
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
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}