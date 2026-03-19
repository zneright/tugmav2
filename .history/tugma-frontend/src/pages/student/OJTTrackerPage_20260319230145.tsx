import { useState } from 'react';
import {
    Clock, Target, Calendar, BrainCircuit,
    Plus, FileText, CheckCircle2, AlertCircle,
    Sparkles, Info, Zap, PlayCircle
} from 'lucide-react';

interface LogEntry {
    id: string;
    date: string;
    hoursLogged: number;
    hoursCredited: number;
    task: string;
    isDouble: boolean;
}

export default function OJTTrackerPage() {
    const [status, setStatus] = useState<'Actively Looking' | 'In Progress' | 'Completed'>('Actively Looking');
    const [requiredHours, setRequiredHours] = useState<number>(450);
    const [completedHours, setCompletedHours] = useState<number>(0);

    const [logs, setLogs] = useState<LogEntry[]>([]);

    // DTR Input States
    const [logHours, setLogHours] = useState<number | ''>('');
    const [logTask, setLogTask] = useState('');
    const [isDoublePay, setIsDoublePay] = useState(false);

    // AI Predictor States
    const [hoursPerShift, setHoursPerShift] = useState<number | ''>(8);
    const [daysPerWeek, setDaysPerWeek] = useState<number | ''>(5);
    const [targetStartDate, setTargetStartDate] = useState<string>('');

    // --- CALCULATIONS ---
    const remainingHours = Math.max(0, requiredHours - completedHours);
    const progressPercentage = requiredHours > 0
        ? Math.min(100, Math.round((completedHours / requiredHours) * 100))
        : 0;

    // --- PREDICTOR LOGIC (Looking Mode) ---
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

    // --- HANDLER: ADD DTR LOG ---
    const handleAddLog = (e: React.FormEvent) => {
        e.preventDefault();
        if (!logHours || logHours <= 0 || !logTask.trim()) return;

        const creditedHours = isDoublePay ? Number(logHours) * 2 : Number(logHours);

        const newLog: LogEntry = {
            id: Math.random().toString(36).substr(2, 9),
            date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            hoursLogged: Number(logHours),
            hoursCredited: creditedHours,
            task: logTask,
            isDouble: isDoublePay
        };

        setLogs([newLog, ...logs]);
        setCompletedHours(prev => prev + creditedHours);

        if (completedHours + creditedHours >= requiredHours) {
            setStatus('Completed');
        }

        setLogHours('');
        setLogTask('');
        setIsDoublePay(false);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-20 px-4 sm:px-0 animate-in fade-in duration-500">

            {/* HEADER SECTION */}
            <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
                <div className="p-5 sm:p-8 border-b border-zinc-200">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-black text-zinc-900 flex items-center gap-2 mb-1">
                                <Target className="text-purple-500" /> OJT Progress Hub
                            </h1>
                            <p className="text-sm text-zinc-500">Track your hours, predict your graduation, and log your daily tasks.</p>
                        </div>

                        <span className={`text-[11px] uppercase tracking-wider font-bold px-4 py-2 rounded-full border w-fit ${status === 'In Progress'
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                            : status === 'Completed'
                                ? 'bg-blue-50 text-blue-600 border-blue-200'
                                : 'bg-orange-50 text-orange-600 border-orange-200'
                            }`}>
                            {status}
                        </span>
                    </div>

                    {/* PROGRESS BAR */}
                    {(status === 'In Progress' || status === 'Completed') && (
                        <div className="mt-8 animate-in fade-in slide-in-from-top-2">
                            <div className="flex justify-between items-end mb-3">
                                <div>
                                    <p className="text-4xl sm:text-5xl font-black text-zinc-900 tracking-tight">
                                        {completedHours} <span className="text-lg sm:text-xl font-medium text-zinc-500">/ {requiredHours} hrs</span>
                                    </p>
                                </div>
                                <span className="text-purple-600 font-black text-2xl sm:text-3xl">{progressPercentage}%</span>
                            </div>
                            <div className="w-full bg-zinc-100 rounded-full h-4 overflow-hidden shadow-inner">
                                <div
                                    className="bg-gradient-to-r from-purple-600 to-indigo-500 h-full rounded-full transition-all duration-1000 ease-out"
                                    style={{ width: `${progressPercentage}%` }}
                                ></div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-5 sm:p-8 bg-zinc-50">

                    {/* ---------------- ACTIVELY LOOKING STATE ---------------- */}
                    {status === 'Actively Looking' && (
                        <div className="space-y-6 animate-in fade-in">
                            <div className="text-center py-6">
                                <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-5">
                                    <AlertCircle size={40} className="text-orange-500" />
                                </div>
                                <h3 className="text-2xl font-black text-zinc-900 mb-2">Ready to Start?</h3>
                                <p className="text-sm font-medium text-zinc-500 max-w-md mx-auto mb-8">
                                    Once you receive an offer and sign your MOA, activate your tracker to begin logging your hours and generating your DTR.
                                </p>
                                <button
                                    onClick={() => setStatus('In Progress')}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 sm:px-8 py-3.5 rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 w-full sm:w-auto mx-auto transition-all hover:scale-105 active:scale-95"
                                >
                                    <PlayCircle size={20} /> Activate OJT Tracker
                                </button>
                            </div>

                            {/* Planning AI Predictor with START DATE (Light Theme) */}
                            <div className="bg-gradient-to-br from-purple-50 to-white p-5 sm:p-6 rounded-2xl border border-purple-200 relative overflow-hidden shadow-sm mt-8">
                                <div className="absolute top-0 right-0 w-40 h-40 bg-purple-200/40 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>

                                <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-5 relative z-10">
                                    <div className="p-4 bg-purple-100 rounded-2xl shrink-0 hidden sm:block">
                                        <Sparkles className="text-purple-600" size={32} />
                                    </div>
                                    <div className="flex-1 w-full">
                                        <div className="flex items-center gap-3 mb-2 sm:mb-1">
                                            <div className="p-2 bg-purple-100 rounded-lg sm:hidden">
                                                <Sparkles className="text-purple-600" size={20} />
                                            </div>
                                            <h3 className="text-base font-bold text-purple-900">Forecast Your Timeline</h3>
                                        </div>
                                        <p className="text-sm text-purple-700 mb-5 leading-relaxed font-medium">
                                            Planning a target start date? Let's estimate when you'll finish your <strong className="text-purple-900 font-black">{requiredHours} required hours</strong>.
                                        </p>

                                        <div className="flex flex-col md:flex-row md:items-center gap-4 bg-white p-4 rounded-xl border border-purple-100 shadow-sm">
                                            <div className="flex items-center justify-between md:justify-start gap-3 w-full md:w-auto">
                                                <label className="text-[11px] font-bold text-purple-500 uppercase tracking-wider">Target Start</label>
                                                <input type="date" value={targetStartDate} onChange={(e) => setTargetStartDate(e.target.value)} className="w-full md:w-auto bg-zinc-50 text-zinc-900 text-[13px] font-medium rounded-lg px-3 py-2 border border-zinc-200 outline-none focus:ring-2 focus:ring-purple-500 transition-all" />
                                            </div>
                                            <div className="hidden md:block h-8 w-px bg-purple-100"></div>

                                            <div className="flex gap-4 w-full md:w-auto">
                                                <div className="flex-1 md:flex-none flex items-center justify-between md:justify-start gap-2">
                                                    <label className="text-[11px] font-bold text-purple-500 uppercase tracking-wider">Hrs/Shift</label>
                                                    <input type="number" value={hoursPerShift} onChange={(e) => setHoursPerShift(Number(e.target.value) || '')} className="w-16 bg-zinc-50 border border-zinc-200 text-zinc-900 text-sm font-bold text-center rounded-lg py-2 outline-none focus:ring-2 focus:ring-purple-500 transition-all" />
                                                </div>
                                                <div className="hidden md:block h-8 w-px bg-purple-100"></div>
                                                <div className="flex-1 md:flex-none flex items-center justify-between md:justify-start gap-2">
                                                    <label className="text-[11px] font-bold text-purple-500 uppercase tracking-wider">Days/Wk</label>
                                                    <input type="number" max="7" value={daysPerWeek} onChange={(e) => setDaysPerWeek(Number(e.target.value) || '')} className="w-16 bg-zinc-50 border border-zinc-200 text-zinc-900 text-sm font-bold text-center rounded-lg py-2 outline-none focus:ring-2 focus:ring-purple-500 transition-all" />
                                                </div>
                                            </div>

                                            <div className="mt-2 md:mt-0 md:ml-auto flex flex-col items-center md:items-end p-3 md:p-0 bg-purple-50 md:bg-transparent rounded-lg border border-purple-100 md:border-transparent">
                                                <span className="text-[10px] text-purple-500 uppercase tracking-widest font-black mb-1">Expected Completion</span>
                                                <span className="text-xl font-black text-purple-700 leading-none">{calculateLookingForecast()}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ---------------- IN PROGRESS STATE ---------------- */}
                    {status === 'In Progress' && (
                        <div className="space-y-8 animate-in fade-in">

                            {/* Live AI Predictor Card (Light Theme) */}
                            <div className="bg-gradient-to-br from-emerald-50 to-white p-5 sm:p-6 rounded-2xl border border-emerald-200 relative overflow-hidden shadow-sm">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-200/40 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>

                                <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-5 relative z-10">
                                    <div className="p-3 bg-emerald-100 rounded-xl shrink-0 hidden sm:block">
                                        <BrainCircuit className="text-emerald-600" size={24} />
                                    </div>
                                    <div className="flex-1 w-full">
                                        <div className="flex items-center gap-3 mb-2 sm:mb-1">
                                            <div className="p-2 bg-emerald-100 rounded-lg sm:hidden">
                                                <BrainCircuit className="text-emerald-600" size={18} />
                                            </div>
                                            <h3 className="text-base font-bold text-emerald-950">Live Completion Predictor</h3>
                                        </div>
                                        <p className="text-[13px] text-emerald-700 mb-5 leading-relaxed font-medium">
                                            Based on your remaining <strong className="text-emerald-950 font-black">{remainingHours} hours</strong>, we estimate your end date.
                                        </p>

                                        <div className="flex flex-col md:flex-row md:items-center gap-4 bg-white p-4 rounded-xl border border-emerald-100 shadow-sm mb-3">
                                            <div className="flex gap-4 w-full md:w-auto">
                                                <div className="flex-1 md:flex-none flex items-center justify-between md:justify-start gap-2">
                                                    <label className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Hrs / Shift</label>
                                                    <input type="number" value={hoursPerShift} onChange={(e) => setHoursPerShift(Number(e.target.value) || '')} className="w-16 bg-zinc-50 border border-zinc-200 text-zinc-900 text-sm font-bold text-center rounded-lg py-2 outline-none focus:ring-2 focus:ring-emerald-500 transition-all" />
                                                </div>
                                                <div className="hidden md:block h-8 w-px bg-emerald-100"></div>
                                                <div className="flex-1 md:flex-none flex items-center justify-between md:justify-start gap-2">
                                                    <label className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Days / Wk</label>
                                                    <input type="number" max="7" value={daysPerWeek} onChange={(e) => setDaysPerWeek(Number(e.target.value) || '')} className="w-16 bg-zinc-50 border border-zinc-200 text-zinc-900 text-sm font-bold text-center rounded-lg py-2 outline-none focus:ring-2 focus:ring-emerald-500 transition-all" />
                                                </div>
                                            </div>

                                            <div className="mt-2 md:mt-0 md:ml-auto flex flex-col items-center md:items-end p-3 md:p-0 bg-emerald-50 md:bg-transparent rounded-lg border border-emerald-100 md:border-transparent">
                                                <span className="text-[10px] text-emerald-600 uppercase tracking-widest font-black mb-1">Est. End Date</span>
                                                <span className="text-xl font-black text-emerald-700 leading-none">{calculateExpectedEnd()}</span>
                                            </div>
                                        </div>

                                        {/* Holiday Disclaimer */}
                                        <div className="flex items-start gap-2 mt-4 text-[11px] text-emerald-700/70 font-medium">
                                            <Info size={14} className="shrink-0 mt-0.5" />
                                            <p>Note: This is an automated estimate. Your actual completion date may vary due to undeclared holidays, suspension of classes, or overtime logs.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* DTR LOGGER */}
                            <div>
                                <h3 className="text-base font-bold text-zinc-900 flex items-center gap-2 mb-4">
                                    <Clock size={20} className="text-purple-500" /> Log Daily Time Record
                                </h3>

                                {/* Form */}
                                <form onSubmit={handleAddLog} className="bg-white p-4 sm:p-5 rounded-2xl border border-zinc-200 shadow-sm mb-6">
                                    <div className="flex flex-col sm:flex-row gap-4 mb-5">
                                        <div className="w-full sm:w-28 shrink-0">
                                            <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-2 block">Hours</label>
                                            <input
                                                type="number" placeholder="e.g. 8" value={logHours} onChange={(e) => setLogHours(Number(e.target.value) || '')}
                                                className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-bold outline-none focus:border-purple-500 transition-all"
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-2 block">Task / Activity</label>
                                            <input
                                                type="text" placeholder="What did you work on today?" value={logTask} onChange={(e) => setLogTask(e.target.value)}
                                                className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-[13px] font-medium outline-none focus:border-purple-500 transition-all"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-zinc-100 pt-4">
                                        {/* Custom Double Pay Toggle */}
                                        <button
                                            type="button"
                                            onClick={() => setIsDoublePay(!isDoublePay)}
                                            className={`flex items-center justify-center sm:justify-start gap-2 px-4 py-3 sm:py-2.5 rounded-xl border text-[12px] font-bold transition-all w-full sm:w-auto ${isDoublePay
                                                ? 'bg-orange-50 border-orange-200 text-orange-600 shadow-sm'
                                                : 'bg-zinc-50 border-zinc-200 text-zinc-500 hover:bg-zinc-100'
                                                }`}
                                        >
                                            <Zap size={16} className={isDoublePay ? "fill-orange-500" : ""} />
                                            Holiday / Double Credit
                                        </button>

                                        <button type="submit" className="w-full sm:w-auto px-8 py-3.5 sm:py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-md shadow-purple-500/20">
                                            <Plus size={18} /> Submit Entry
                                        </button>
                                    </div>
                                </form>

                                {/* DTR History List */}
                                <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-1 sm:pr-2">
                                    {logs.length === 0 ? (
                                        <div className="text-center py-10 border-2 border-dashed border-zinc-200 rounded-2xl bg-white">
                                            <FileText className="mx-auto text-zinc-300 mb-3" size={32} />
                                            <p className="text-sm font-bold text-zinc-500">Your DTR is empty.</p>
                                            <p className="text-[13px] text-zinc-400 mt-1 font-medium">Start recording your daily hours to track your progress.</p>
                                        </div>
                                    ) : (
                                        logs.map((log) => (
                                            <div key={log.id} className="flex items-center justify-between p-4 bg-white border border-zinc-200 rounded-xl shadow-sm hover:border-purple-300 transition-colors">
                                                <div className="flex flex-col overflow-hidden pr-3">
                                                    <span className="text-[11px] font-bold text-zinc-500 flex items-center gap-1.5 mb-1 uppercase tracking-wider">
                                                        <Calendar size={12} /> {log.date}
                                                    </span>
                                                    <div className="flex flex-col items-start gap-1.5">
                                                        <span className="text-[14px] font-bold text-zinc-900 break-words line-clamp-2">{log.task}</span>
                                                        {log.isDouble && (
                                                            <span className="bg-orange-100 text-orange-600 text-[10px] font-black px-2 py-0.5 rounded-md flex items-center gap-1 w-fit mt-0.5 shrink-0">
                                                                <Zap size={10} className="fill-orange-500" /> Holiday Credit
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end shrink-0">
                                                    <div className="bg-purple-50 text-purple-700 px-3 py-1.5 rounded-lg text-sm font-black whitespace-nowrap border border-purple-100">
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

                    {/* ---------------- COMPLETED STATE ---------------- */}
                    {status === 'Completed' && (
                        <div className="text-center py-12 animate-in fade-in zoom-in-95">
                            <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-500/10">
                                <CheckCircle2 size={48} className="text-emerald-500" />
                            </div>
                            <h3 className="text-2xl sm:text-3xl font-black text-zinc-900 mb-3">Requirements Met!</h3>
                            <p className="text-sm font-medium text-zinc-500 max-w-md mx-auto leading-relaxed px-4">
                                Congratulations on completing your required OJT hours! Ensure your final DTR and supervisor evaluations are compiled and submitted to your coordinator.
                            </p>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}