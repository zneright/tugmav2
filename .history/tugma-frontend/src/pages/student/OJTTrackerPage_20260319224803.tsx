import { useState } from 'react';
import {
    Clock, Target, Calendar, BrainCircuit,
    Plus, FileText, CheckCircle2, AlertCircle,
    Sparkles, Info, Zap
} from 'lucide-react';

interface OJTData {
    status: string;
    requiredHours: number;
    completedHours: number;
}

interface OJTTrackerProps {
    ojt: OJTData;
    isEditing: boolean;
    onUpdate: (updatedOjt: OJTData) => void;
}

interface LogEntry {
    id: string;
    date: string;
    hoursLogged: number;
    hoursCredited: number;
    task: string;
    isDouble: boolean;
}

export default function OJTTracker({ ojt, isEditing, onUpdate }: OJTTrackerProps) {
    const [logs, setLogs] = useState<LogEntry[]>([]);

    // DTR Input States
    const [logHours, setLogHours] = useState<number | ''>('');
    const [logTask, setLogTask] = useState('');
    const [isDoublePay, setIsDoublePay] = useState(false);

    // AI Predictor States
    const [hoursPerShift, setHoursPerShift] = useState<number | ''>(8);
    const [daysPerWeek, setDaysPerWeek] = useState<number | ''>(5);

    // --- CALCULATIONS ---
    const remainingHours = Math.max(0, ojt.requiredHours - ojt.completedHours);
    const progressPercentage = ojt.requiredHours > 0
        ? Math.min(100, Math.round((ojt.completedHours / ojt.requiredHours) * 100))
        : 0;

    // --- PREDICTOR LOGIC (Looking Mode) ---
    const calculateLookingForecast = () => {
        if (!hoursPerShift || !daysPerWeek || hoursPerShift <= 0 || daysPerWeek <= 0) return "--";

        const totalShiftsNeeded = Math.ceil(ojt.requiredHours / hoursPerShift);
        const weeksNeeded = totalShiftsNeeded / daysPerWeek;

        if (weeksNeeded < 4) return `${weeksNeeded.toFixed(1)} weeks`;
        return `${(weeksNeeded / 4).toFixed(1)} months`;
    };

    // --- PREDICTOR LOGIC (Hired Mode) ---
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

        // Apply Double Credit if selected
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

        onUpdate({
            ...ojt,
            completedHours: ojt.completedHours + creditedHours
        });

        // Reset form
        setLogHours('');
        setLogTask('');
        setIsDoublePay(false);
    };

    return (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">

            {/* HEADER SECTION */}
            <div className="p-6 sm:p-8 border-b border-zinc-200 dark:border-zinc-800">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <h2 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                        <Target className="text-purple-500" /> OJT Portal & DTR
                    </h2>

                    {isEditing ? (
                        <select
                            value={ojt.status}
                            onChange={(e) => onUpdate({ ...ojt, status: e.target.value })}
                            className="bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-[13px] font-bold px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 outline-none cursor-pointer shadow-sm"
                        >
                            <option value="Actively Looking">Actively Looking</option>
                            <option value="Hired">Hired</option>
                            <option value="Completed">Completed</option>
                        </select>
                    ) : (
                        <span className={`text-[11px] uppercase tracking-wider font-bold px-4 py-1.5 rounded-full border w-fit ${ojt.status === 'Hired'
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'
                            : ojt.status === 'Completed'
                                ? 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20'
                                : 'bg-orange-50 text-orange-600 border-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20'
                            }`}>
                            {ojt.status}
                        </span>
                    )}
                </div>

                {/* PROGRESS BAR (Only show if Hired or Completed) */}
                {(ojt.status === 'Hired' || ojt.status === 'Completed') && (
                    <div className="mt-6 animate-in fade-in slide-in-from-top-2">
                        <div className="flex justify-between items-end mb-3">
                            <div>
                                <p className="text-4xl font-black text-zinc-900 dark:text-white tracking-tight">
                                    {ojt.completedHours} <span className="text-lg font-medium text-zinc-500">/ {ojt.requiredHours} hrs</span>
                                </p>
                            </div>
                            <span className="text-purple-600 dark:text-purple-400 font-black text-2xl">{progressPercentage}%</span>
                        </div>
                        <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-3.5 overflow-hidden shadow-inner">
                            <div
                                className="bg-gradient-to-r from-purple-600 to-indigo-500 h-full rounded-full transition-all duration-1000 ease-out"
                                style={{ width: `${progressPercentage}%` }}
                            ></div>
                        </div>
                    </div>
                )}
            </div>

            {/* ========================================================================= */}
            {/* DYNAMIC CONTENT BASED ON STATUS */}
            {/* ========================================================================= */}
            <div className="p-6 sm:p-8 bg-zinc-50 dark:bg-zinc-950/50">

                {/* ---------------- ACTIVELY LOOKING STATE ---------------- */}
                {ojt.status === 'Actively Looking' && (
                    <div className="space-y-6 animate-in fade-in">
                        <div className="text-center py-4">
                            <div className="w-16 h-16 bg-orange-100 dark:bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <AlertCircle size={32} className="text-orange-500" />
                            </div>
                            <h3 className="text-xl font-black text-zinc-900 dark:text-white mb-2">Keep Applying!</h3>
                            <p className="text-[13px] font-medium text-zinc-500 max-w-sm mx-auto">
                                Employers can see your profile. Change your status to "Hired" once you land a role to unlock your DTR and progress tracker.
                            </p>
                        </div>

                        {/* Planning AI Predictor */}
                        <div className="bg-gradient-to-br from-[#1e1430] to-[#120a1f] p-6 rounded-2xl border border-purple-500/20 relative overflow-hidden shadow-lg">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>

                            <div className="flex items-start gap-4 relative z-10">
                                <div className="p-3 bg-purple-500/20 rounded-xl shrink-0">
                                    <Sparkles className="text-purple-400" size={24} />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
                                        OJT Duration Predictor
                                    </h3>
                                    <p className="text-[13px] text-purple-200/70 mb-5 leading-relaxed font-medium">
                                        Plan ahead! Let's estimate how long it will take to finish your required <strong className="text-white font-bold">{ojt.requiredHours} hours</strong> once you start.
                                    </p>

                                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 bg-black/30 p-4 rounded-xl border border-white/5">
                                        <div className="flex items-center gap-3">
                                            <label className="text-[11px] font-bold text-purple-200/60 uppercase tracking-wider">Hrs / Shift</label>
                                            <input type="number" value={hoursPerShift} onChange={(e) => setHoursPerShift(Number(e.target.value) || '')} className="w-14 bg-white/10 text-white text-sm font-bold text-center rounded-lg py-1.5 outline-none focus:ring-2 focus:ring-purple-500 transition-all" />
                                        </div>
                                        <div className="hidden sm:block h-6 w-px bg-white/10"></div>
                                        <div className="flex items-center gap-3">
                                            <label className="text-[11px] font-bold text-purple-200/60 uppercase tracking-wider">Days / Wk</label>
                                            <input type="number" max="7" value={daysPerWeek} onChange={(e) => setDaysPerWeek(Number(e.target.value) || '')} className="w-14 bg-white/10 text-white text-sm font-bold text-center rounded-lg py-1.5 outline-none focus:ring-2 focus:ring-purple-500 transition-all" />
                                        </div>

                                        <div className="mt-2 sm:mt-0 sm:ml-auto flex flex-col sm:items-end">
                                            <span className="text-[10px] text-purple-300/60 uppercase tracking-widest font-black mb-0.5">Estimated Time</span>
                                            <span className="text-lg font-black text-emerald-400 leading-none">{calculateLookingForecast()}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ---------------- HIRED STATE ---------------- */}
                {ojt.status === 'Hired' && (
                    <div className="space-y-8 animate-in fade-in">

                        {/* Live AI Predictor Card */}
                        <div className="bg-gradient-to-br from-[#1e1430] to-[#120a1f] p-6 rounded-2xl border border-purple-500/20 relative overflow-hidden shadow-lg">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>

                            <div className="flex items-start gap-4 relative z-10">
                                <div className="p-3 bg-emerald-500/20 rounded-xl shrink-0">
                                    <BrainCircuit className="text-emerald-400" size={24} />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-sm font-bold text-white mb-1">Live Completion Predictor</h3>
                                    <p className="text-[13px] text-purple-200/70 mb-5 leading-relaxed font-medium">
                                        Based on your remaining <strong className="text-white">{remainingHours} hours</strong>, we estimate your end date.
                                    </p>

                                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 bg-black/30 p-4 rounded-xl border border-white/5 mb-3">
                                        <div className="flex items-center gap-3">
                                            <label className="text-[11px] font-bold text-purple-200/60 uppercase tracking-wider">Hrs / Shift</label>
                                            <input type="number" value={hoursPerShift} onChange={(e) => setHoursPerShift(Number(e.target.value) || '')} className="w-14 bg-white/10 text-white text-sm font-bold text-center rounded-lg py-1.5 outline-none focus:ring-2 focus:ring-emerald-500 transition-all" />
                                        </div>
                                        <div className="hidden sm:block h-6 w-px bg-white/10"></div>
                                        <div className="flex items-center gap-3">
                                            <label className="text-[11px] font-bold text-purple-200/60 uppercase tracking-wider">Days / Wk</label>
                                            <input type="number" max="7" value={daysPerWeek} onChange={(e) => setDaysPerWeek(Number(e.target.value) || '')} className="w-14 bg-white/10 text-white text-sm font-bold text-center rounded-lg py-1.5 outline-none focus:ring-2 focus:ring-emerald-500 transition-all" />
                                        </div>

                                        <div className="mt-2 sm:mt-0 sm:ml-auto flex flex-col sm:items-end">
                                            <span className="text-[10px] text-purple-300/60 uppercase tracking-widest font-black mb-0.5">Est. End Date</span>
                                            <span className="text-lg font-black text-emerald-400 leading-none">{calculateExpectedEnd()}</span>
                                        </div>
                                    </div>

                                    {/* Holiday Disclaimer */}
                                    <div className="flex items-start gap-2 mt-3 text-[11px] text-purple-300/50 font-medium">
                                        <Info size={14} className="shrink-0 mt-0.5" />
                                        <p>Note: This is just an expected estimate. Your actual end date may vary due to undeclared holidays, suspension of classes, or overtime.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* DTR LOGGER */}
                        <div>
                            <h3 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2 mb-4">
                                <Clock size={18} className="text-purple-500" /> Daily Time Record (DTR)
                            </h3>

                            {/* Form */}
                            <form onSubmit={handleAddLog} className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm mb-6">
                                <div className="flex flex-col sm:flex-row gap-3 mb-4">
                                    <div className="w-full sm:w-24 shrink-0">
                                        <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5 block">Hours</label>
                                        <input
                                            type="number" placeholder="8" value={logHours} onChange={(e) => setLogHours(Number(e.target.value) || '')}
                                            className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 rounded-xl text-sm font-bold outline-none focus:border-purple-500 dark:text-white transition-all"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5 block">Task / Activity</label>
                                        <input
                                            type="text" placeholder="What did you work on today?" value={logTask} onChange={(e) => setLogTask(e.target.value)}
                                            className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 rounded-xl text-sm font-medium outline-none focus:border-purple-500 dark:text-white transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    {/* Custom Double Pay Toggle */}
                                    <button
                                        type="button"
                                        onClick={() => setIsDoublePay(!isDoublePay)}
                                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-[12px] font-bold transition-all ${isDoublePay
                                            ? 'bg-orange-50 border-orange-200 text-orange-600 dark:bg-orange-500/10 dark:border-orange-500/30 dark:text-orange-400 shadow-sm'
                                            : 'bg-zinc-50 border-zinc-200 text-zinc-500 hover:bg-zinc-100 dark:bg-zinc-800/50 dark:border-zinc-700/50 dark:text-zinc-400 dark:hover:bg-zinc-800'
                                            }`}
                                    >
                                        <Zap size={14} className={isDoublePay ? "fill-orange-500" : ""} />
                                        Holiday / Double Pay Credit
                                    </button>

                                    <button type="submit" className="w-full sm:w-auto px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-md shadow-purple-500/20">
                                        <Plus size={16} /> Log Entry
                                    </button>
                                </div>
                            </form>

                            {/* DTR History List */}
                            <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                                {logs.length === 0 ? (
                                    <div className="text-center py-8 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-900/50">
                                        <FileText className="mx-auto text-zinc-300 dark:text-zinc-700 mb-3" size={32} />
                                        <p className="text-[13px] font-bold text-zinc-500">No logs yet.</p>
                                        <p className="text-xs text-zinc-400 mt-1">Start recording your daily hours to track your progress.</p>
                                    </div>
                                ) : (
                                    logs.map((log) => (
                                        <div key={log.id} className="flex items-center justify-between p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm hover:border-purple-500/30 transition-colors">
                                            <div className="flex flex-col">
                                                <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5 mb-1 uppercase tracking-wider">
                                                    <Calendar size={12} /> {log.date}
                                                </span>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[14px] font-bold text-zinc-900 dark:text-white">{log.task}</span>
                                                    {log.isDouble && (
                                                        <span className="bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400 text-[10px] font-black px-2 py-0.5 rounded-md flex items-center gap-1">
                                                            <Zap size={10} className="fill-orange-500" /> Holiday Credit
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <div className="bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 px-3 py-1.5 rounded-lg text-sm font-black whitespace-nowrap">
                                                    +{log.hoursCredited} hrs
                                                </div>
                                                {log.isDouble && <span className="text-[10px] text-zinc-400 font-medium mt-1">({log.hoursLogged}h base x2)</span>}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                    </div>
                )}

                {/* ---------------- COMPLETED STATE ---------------- */}
                {ojt.status === 'Completed' && (
                    <div className="text-center py-10 animate-in fade-in zoom-in-95">
                        <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-5 shadow-lg shadow-emerald-500/10">
                            <CheckCircle2 size={40} className="text-emerald-500" />
                        </div>
                        <h3 className="text-2xl font-black text-zinc-900 dark:text-white mb-3">Requirements Met!</h3>
                        <p className="text-[13px] font-medium text-zinc-500 max-w-sm mx-auto leading-relaxed">
                            Congratulations on completing your required OJT hours! Ensure your final DTR and supervisor evaluations are compiled and submitted to your coordinator.
                        </p>
                    </div>
                )}

            </div>
        </div>
    );
}