import { useState } from 'react';
import {
    Clock, Target, Calendar, BrainCircuit,
    Plus, FileText, CheckCircle2, AlertCircle
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

// A simple interface for our local DTR logs
interface LogEntry {
    id: string;
    date: string;
    hours: number;
    task: string;
}

export default function OJTTracker({ ojt, isEditing, onUpdate }: OJTTrackerProps) {
    // Local state for the DTR entries (In a real app, save this to Firebase!)
    const [logs, setLogs] = useState<LogEntry[]>([]);

    // DTR Input States
    const [logHours, setLogHours] = useState<number | ''>('');
    const [logTask, setLogTask] = useState('');

    // AI Predictor State
    const [hoursPerShift, setHoursPerShift] = useState<number>(8);

    // --- CALCULATION LOGIC ---
    const remainingHours = Math.max(0, ojt.requiredHours - ojt.completedHours);
    const progressPercentage = ojt.requiredHours > 0
        ? Math.min(100, Math.round((ojt.completedHours / ojt.requiredHours) * 100))
        : 0;

    // --- AI PREDICTOR LOGIC ---
    const calculateExpectedEnd = () => {
        if (remainingHours === 0) return "Completed!";
        if (!hoursPerShift || hoursPerShift <= 0) return "Please set hours per shift.";

        // Calculate how many shifts are left
        const shiftsLeft = Math.ceil(remainingHours / hoursPerShift);

        // Calculate calendar days (Assuming 5 working days a week, so shifts * 1.4)
        const calendarDaysLeft = Math.ceil(shiftsLeft * 1.4);

        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + calendarDaysLeft);

        return targetDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    // --- HANDLER: ADD DTR LOG ---
    const handleAddLog = (e: React.FormEvent) => {
        e.preventDefault();
        if (!logHours || logHours <= 0 || !logTask.trim()) return;

        // 1. Create the new log
        const newLog: LogEntry = {
            id: Math.random().toString(36).substr(2, 9),
            date: new Date().toLocaleDateString(),
            hours: Number(logHours),
            task: logTask
        };

        // 2. Update local logs
        setLogs([newLog, ...logs]);

        // 3. Update the total hours in the main profile data
        onUpdate({
            ...ojt,
            completedHours: ojt.completedHours + Number(logHours)
        });

        // 4. Reset form
        setLogHours('');
        setLogTask('');
    };

    return (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">

            {/* HEADER SECTION */}
            <div className="p-6 sm:p-8 border-b border-zinc-200 dark:border-zinc-800">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
                    <h2 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                        <Target className="text-purple-500" /> OJT Portal & DTR
                    </h2>

                    {isEditing ? (
                        <select
                            value={ojt.status}
                            onChange={(e) => onUpdate({ ...ojt, status: e.target.value })}
                            className="bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-bold px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 outline-none cursor-pointer"
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

                {/* PROGRESS BAR */}
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

            {/* DYNAMIC CONTENT BASED ON STATUS */}
            <div className="p-6 sm:p-8 bg-zinc-50 dark:bg-zinc-950/50">

                {ojt.status === 'Hired' ? (
                    <div className="space-y-6">

                        {/* AI PREDICTOR CARD */}
                        <div className="bg-gradient-to-br from-[#1e1430] to-[#120a1f] p-5 rounded-2xl border border-purple-500/20 relative overflow-hidden shadow-lg">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>

                            <div className="flex items-start gap-4 relative z-10">
                                <div className="p-3 bg-purple-500/20 rounded-xl">
                                    <BrainCircuit className="text-purple-400" size={24} />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
                                        AI Completion Predictor
                                    </h3>
                                    <p className="text-xs text-purple-200/70 mb-4 leading-relaxed">
                                        Based on your remaining <strong className="text-white">{remainingHours} hours</strong>, we estimate your end date based on your average shift length.
                                    </p>

                                    <div className="flex items-center gap-3 bg-black/30 p-3 rounded-xl border border-white/5">
                                        <label className="text-xs font-semibold text-purple-200">Hours per shift:</label>
                                        <input
                                            type="number"
                                            value={hoursPerShift}
                                            onChange={(e) => setHoursPerShift(Number(e.target.value))}
                                            className="w-16 bg-white/10 text-white text-sm font-bold text-center rounded-md py-1 outline-none focus:ring-2 focus:ring-purple-500"
                                        />
                                        <div className="h-6 w-px bg-white/10 mx-2"></div>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] text-purple-300/60 uppercase tracking-wider font-bold">Est. End Date</span>
                                            <span className="text-sm font-black text-emerald-400">{calculateExpectedEnd()}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* DTR LOGGER */}
                        <div>
                            <h3 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2 mb-3">
                                <Clock size={16} className="text-zinc-400" /> Daily Time Record (DTR)
                            </h3>

                            {/* Form */}
                            <form onSubmit={handleAddLog} className="flex gap-3 mb-4">
                                <input
                                    type="number"
                                    placeholder="Hrs"
                                    value={logHours}
                                    onChange={(e) => setLogHours(Number(e.target.value))}
                                    className="w-20 px-3 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm font-bold outline-none focus:border-purple-500 dark:text-white"
                                />
                                <input
                                    type="text"
                                    placeholder="What did you work on today?"
                                    value={logTask}
                                    onChange={(e) => setLogTask(e.target.value)}
                                    className="flex-1 px-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm font-medium outline-none focus:border-purple-500 dark:text-white"
                                />
                                <button
                                    type="submit"
                                    className="px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold flex items-center gap-2 transition-colors shadow-md shadow-purple-500/20"
                                >
                                    <Plus size={18} /> <span className="hidden sm:block">Log</span>
                                </button>
                            </form>

                            {/* DTR History List */}
                            <div className="space-y-2 max-h-[200px] overflow-y-auto custom-scrollbar pr-2">
                                {logs.length === 0 ? (
                                    <div className="text-center py-6 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
                                        <FileText className="mx-auto text-zinc-400 mb-2" size={24} />
                                        <p className="text-xs font-medium text-zinc-500">No logs yet. Start recording your hours!</p>
                                    </div>
                                ) : (
                                    logs.map((log) => (
                                        <div key={log.id} className="flex items-center justify-between p-3 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl shadow-sm">
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5 mb-0.5">
                                                    <Calendar size={12} /> {log.date}
                                                </span>
                                                <span className="text-sm font-medium text-zinc-900 dark:text-zinc-200">{log.task}</span>
                                            </div>
                                            <div className="bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 px-3 py-1.5 rounded-lg text-sm font-black whitespace-nowrap">
                                                +{log.hours} hrs
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                    </div>
                ) : ojt.status === 'Completed' ? (
                    <div className="text-center py-8">
                        <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle2 size={32} className="text-emerald-500" />
                        </div>
                        <h3 className="text-xl font-black text-zinc-900 dark:text-white mb-2">Requirements Met!</h3>
                        <p className="text-sm font-medium text-zinc-500 max-w-xs mx-auto">
                            Congratulations on completing your OJT hours. Make sure your final DTR and supervisor evaluations are submitted.
                        </p>
                    </div>
                ) : (
                    <div className="text-center py-8">
                        <div className="w-16 h-16 bg-orange-100 dark:bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertCircle size={32} className="text-orange-500" />
                        </div>
                        <h3 className="text-xl font-black text-zinc-900 dark:text-white mb-2">Keep Applying!</h3>
                        <p className="text-sm font-medium text-zinc-500 max-w-sm mx-auto">
                            Your profile is visible to employers. Once you land an internship, change your status to "Hired" to unlock the DTR logger and AI completion predictor.
                        </p>
                    </div>
                )}

            </div>
        </div>
    );
}