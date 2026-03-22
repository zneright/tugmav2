import { useState } from 'react';
import { X, FileText, Calendar, PenTool, Settings2, LayoutTemplate, Image as ImageIcon, Clock, Hash, Check } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import tugmaLogo from '.././assets/tugma_logo_2.png';

interface LogEntry {
    id?: string;
    date: string;
    hoursLogged: number;
    hoursCredited: number;
    task: string;
    isDouble: boolean;
}

interface PrintDTRModalProps {
    isOpen: boolean;
    onClose: () => void;
    logs: LogEntry[];
    studentProfile: any;
    requiredHours: number;
    completedHours: number;
}

export default function PrintDTRModal({ isOpen, onClose, logs, studentProfile, requiredHours, completedHours }: PrintDTRModalProps) {
    const [timeframe, setTimeframe] = useState<'all' | 'current_month' | 'last_month' | 'specific_month' | 'custom_range'>('all');
    const [specificMonth, setSpecificMonth] = useState('');
    const [dateRange, setDateRange] = useState({ start: '', end: '' });

    const [paperSize, setPaperSize] = useState<'a4' | 'letter' | 'legal'>('a4');
    const [signatureMode, setSignatureMode] = useState<'last_page' | 'every_page'>('last_page');
    const [includeLogo, setIncludeLogo] = useState(true);
    const [includeDate, setIncludeDate] = useState(true);
    const [includePageNumbers, setIncludePageNumbers] = useState(true);

    if (!isOpen) return null;

    const getFilteredLogs = () => {
        if (timeframe === 'all') return logs;

        const now = new Date();

        if (timeframe === 'current_month' || timeframe === 'last_month') {
            const targetMonth = timeframe === 'current_month' ? now.getMonth() : now.getMonth() - 1;
            const targetYear = timeframe === 'last_month' && now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
            const safeTargetMonth = targetMonth < 0 ? 11 : targetMonth;

            return logs.filter(log => {
                const logDate = new Date(log.date);
                return logDate.getMonth() === safeTargetMonth && logDate.getFullYear() === targetYear;
            });
        }

        if (timeframe === 'specific_month' && specificMonth) {
            const [year, month] = specificMonth.split('-');
            return logs.filter(log => {
                const logDate = new Date(log.date);
                return logDate.getFullYear() === parseInt(year) && logDate.getMonth() === parseInt(month) - 1;
            });
        }

        if (timeframe === 'custom_range' && dateRange.start && dateRange.end) {
            return logs.filter(log => log.date >= dateRange.start && log.date <= dateRange.end);
        }

        return logs;
    };

    const handleGeneratePDF = () => {
        const doc = new jsPDF({ format: paperSize });
        const filteredLogs = getFilteredLogs();
        const filteredCredited = filteredLogs.reduce((sum, log) => sum + Number(log.hoursCredited), 0);

        // Name Capitalization formatting (Title Case)
        const formatName = (fName: string, lName: string) => {
            const rawName = `${fName || ''} ${lName || ''}`.trim();
            if (!rawName) return 'Unknown Student';
            return rawName.replace(/\b\w/g, (char) => char.toUpperCase());
        };

        const fullName = studentProfile ? formatName(studentProfile.firstName, studentProfile.lastName) : 'Unknown Student';
        const course = studentProfile?.course || 'Information Technology';

        const drawHeader = (doc: jsPDF, pageNumber: number) => {
            let startX = 105;

            if (includeLogo && tugmaLogo) {
                try {
                    doc.addImage(tugmaLogo, 'PNG', 12, 9, 22, 18);
                } catch (error) {
                    console.error("Could not load logo into PDF", error);
                }
            }

            doc.setFontSize(22);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(107, 33, 168);
            doc.text("DAILY TIME RECORD", startX, 20, { align: "center" });

            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(100, 100, 100);

            let periodText = "Official OJT Hours Log";
            if (timeframe === 'current_month') periodText += " (Current Month)";
            if (timeframe === 'last_month') periodText += " (Last Month)";

            if (timeframe === 'specific_month' && specificMonth) {
                const [year, month] = specificMonth.split('-');
                const dateObj = new Date(parseInt(year), parseInt(month) - 1);
                const formattedMonth = dateObj.toLocaleString('default', { month: 'long', year: 'numeric' });
                periodText += ` (${formattedMonth})`;
            }

            if (timeframe === 'custom_range') periodText += ` (${dateRange.start} to ${dateRange.end})`;
            doc.text(periodText, startX, 26, { align: "center" });

            doc.setDrawColor(200, 200, 200);
            doc.line(14, 32, doc.internal.pageSize.width - 14, 32);

            if (pageNumber === 1) {
                doc.setFontSize(11);
                doc.setTextColor(30, 30, 30);

                doc.setFont("helvetica", "bold");
                doc.text("Student Name:", 14, 42);
                doc.setFont("helvetica", "normal");
                doc.text(fullName, 45, 42);

                doc.setFont("helvetica", "bold");
                doc.text("Program:", 14, 49);
                doc.setFont("helvetica", "normal");
                doc.text(course, 45, 49);

                doc.setFont("helvetica", "bold");
                doc.text("Required:", 130, 42);
                doc.setFont("helvetica", "normal");
                doc.text(`${requiredHours} Hours`, 155, 42);

                doc.setFont("helvetica", "bold");
                doc.text("Total Logged:", 130, 49);
                doc.setFont("helvetica", "normal");
                doc.text(`${completedHours} Hours`, 155, 49);
            }
        };

        const drawSignature = (doc: jsPDF, yPos: number) => {
            const pageWidth = doc.internal.pageSize.width;

            doc.setFont("helvetica", "italic");
            doc.setFontSize(9);
            doc.setTextColor(100, 100, 100);
            doc.text("I hereby certify that the above records are true and correct.", 14, yPos);

            doc.setFont("helvetica", "bold");
            doc.setFontSize(10);
            doc.setTextColor(30, 30, 30);
            doc.text("Certified Correct By:", 14, yPos + 10);

            doc.setDrawColor(50, 50, 50);
            doc.line(14, yPos + 25, 90, yPos + 25);
            doc.setFont("helvetica", "normal");
            doc.text("Supervisor Signature over Printed Name", 14, yPos + 30);

            doc.line(pageWidth - 65, yPos + 25, pageWidth - 14, yPos + 25);

            if (includeDate) {
                const today = new Date().toLocaleDateString();
                doc.text(today, pageWidth - 39, yPos + 24, { align: "center" });
            }
            doc.text("Date", pageWidth - 39, yPos + 30, { align: "center" });
        };

        const tableColumn = ["Date", "Task / Activity", "Logged Hours"];
        const tableRows = filteredLogs.map(log => [
            log.date,
            log.task + (log.isDouble ? " (Holiday/OT)" : ""),
            `${log.hoursLogged} hrs`
        ]);

        const bottomMargin = signatureMode === 'every_page' ? 50 : 20;

        autoTable(doc, {
            startY: 58,
            head: [tableColumn],
            body: tableRows,
            theme: 'grid',
            margin: { bottom: bottomMargin, left: 14, right: 14 },
            headStyles: { fillColor: [107, 33, 168], textColor: 255, halign: 'left' },
            columnStyles: {
                0: { cellWidth: 30 },
                1: { cellWidth: 'auto' },
                2: { cellWidth: 30, halign: 'center' },
            },
            styles: { fontSize: 10, cellPadding: 4 },
            didParseCell: function (data) {
                if (data.section === 'body' && filteredLogs[data.row.index].isDouble) {
                    data.cell.styles.fillColor = [250, 245, 255];
                }
            },
            didDrawPage: function (data) {
                drawHeader(doc, data.pageNumber);
                if (signatureMode === 'every_page') {
                    drawSignature(doc, doc.internal.pageSize.height - 40);
                }
            }
        });

        if (signatureMode === 'last_page') {
            let finalY = (doc as any).lastAutoTable.finalY || 65;

            doc.setFont("helvetica", "bold");
            doc.setFontSize(10);
            doc.setTextColor(30, 30, 30);
            doc.text(`Total Credited for this period: ${filteredCredited} Hours`, 14, finalY + 8);

            if (finalY > doc.internal.pageSize.height - 60) {
                doc.addPage();
                drawHeader(doc, (doc.internal.getNumberOfPages()));
                finalY = 35;
            }

            drawSignature(doc, finalY + 20);
        }

        if (includePageNumbers) {
            const pageCount = doc.internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(9);
                doc.setTextColor(150, 150, 150);
                doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 10, { align: 'center' });
            }
        }

        doc.save(`DTR_${timeframe}_${fullName.replace(/\s+/g, '_')}.pdf`);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-zinc-950 w-full max-w-lg rounded-[2rem] shadow-2xl border border-zinc-200/60 dark:border-zinc-800 overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-zinc-100 dark:border-zinc-800/60 shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="p-2.5 bg-gradient-to-br from-purple-100 to-fuchsia-100 dark:from-purple-900/40 dark:to-fuchsia-900/40 rounded-2xl text-purple-600 dark:text-purple-400 border border-purple-200/50 dark:border-purple-800/50 shadow-inner">
                            <Settings2 size={22} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight">Print Settings</h2>
                            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Configure your DTR layout</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-800 rounded-full transition-all active:scale-95">
                        <X size={18} />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">

                    {/* Setting Group 1: Time Range */}
                    <div className="bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-100 dark:border-zinc-800/60 rounded-3xl p-5 space-y-4">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                            <Calendar size={14} className="text-purple-500" /> Time Range
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                            {[
                                { id: 'all', label: 'All Records' },
                                { id: 'current_month', label: 'This Month' },
                                { id: 'last_month', label: 'Last Month' },
                                { id: 'specific_month', label: 'Specific Month' },
                                { id: 'custom_range', label: 'Custom Range' }
                            ].map((option) => (
                                <button
                                    key={option.id}
                                    onClick={() => setTimeframe(option.id as any)}
                                    className={`px-3 py-2.5 rounded-2xl text-[13px] font-bold border transition-all active:scale-[0.98] ${timeframe === option.id
                                        ? 'bg-purple-600 border-purple-600 text-white shadow-md shadow-purple-500/20'
                                        : 'bg-white border-zinc-200 text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50 shadow-sm dark:bg-zinc-900 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800'
                                        }`}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>

                        {/* Conditional Inputs */}
                        {timeframe === 'specific_month' && (
                            <input
                                type="month"
                                value={specificMonth}
                                onChange={(e) => setSpecificMonth(e.target.value)}
                                className="w-full mt-2 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm font-medium outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all shadow-sm"
                            />
                        )}
                        {timeframe === 'custom_range' && (
                            <div className="flex gap-3 mt-2">
                                <input
                                    type="date"
                                    value={dateRange.start}
                                    onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                                    className="flex-1 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm font-medium outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all shadow-sm"
                                />
                                <input
                                    type="date"
                                    value={dateRange.end}
                                    onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                                    className="flex-1 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm font-medium outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all shadow-sm"
                                />
                            </div>
                        )}
                    </div>

                    {/* Setting Group 2: Paper Size & Options */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                                <LayoutTemplate size={14} className="text-purple-500" /> Paper Size
                            </label>
                            <div className="flex flex-col gap-2.5">
                                {[
                                    { id: 'a4', label: 'A4' },
                                    { id: 'letter', label: 'Short' },
                                    { id: 'legal', label: 'Long' }
                                ].map((option) => (
                                    <button
                                        key={option.id}
                                        onClick={() => setPaperSize(option.id as any)}
                                        className={`px-4 py-3 rounded-2xl text-[13px] font-bold border transition-all active:scale-[0.98] flex items-center justify-between ${paperSize === option.id
                                            ? 'bg-purple-50 border-purple-500 text-purple-700 dark:bg-purple-900/20 dark:border-purple-500 dark:text-purple-300 shadow-sm'
                                            : 'bg-white border-zinc-200 text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50 shadow-sm dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800'
                                            }`}
                                    >
                                        {option.label}
                                        {paperSize === option.id && <Check size={16} />}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                                <Settings2 size={14} className="text-purple-500" /> Elements
                            </label>
                            <div className="flex flex-col gap-2.5">
                                {/* Option Toggle 1 */}
                                <label className={`flex items-center gap-3 p-3 border rounded-2xl cursor-pointer transition-all ${includeLogo ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 dark:border-purple-500' : 'border-zinc-200 bg-white hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800'}`}>
                                    <input
                                        type="checkbox"
                                        checked={includeLogo}
                                        onChange={(e) => setIncludeLogo(e.target.checked)}
                                        className="w-4 h-4 text-purple-600 rounded border-zinc-300 focus:ring-purple-500 bg-white"
                                    />
                                    <span className={`text-sm font-semibold flex items-center gap-2 ${includeLogo ? 'text-purple-700 dark:text-purple-300' : 'text-zinc-700 dark:text-zinc-300'}`}>
                                        <ImageIcon size={16} /> Include Logo
                                    </span>
                                </label>

                                {/* Option Toggle 2 */}
                                <label className={`flex items-center gap-3 p-3 border rounded-2xl cursor-pointer transition-all ${includeDate ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 dark:border-purple-500' : 'border-zinc-200 bg-white hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800'}`}>
                                    <input
                                        type="checkbox"
                                        checked={includeDate}
                                        onChange={(e) => setIncludeDate(e.target.checked)}
                                        className="w-4 h-4 text-purple-600 rounded border-zinc-300 focus:ring-purple-500 bg-white"
                                    />
                                    <span className={`text-sm font-semibold flex items-center gap-2 ${includeDate ? 'text-purple-700 dark:text-purple-300' : 'text-zinc-700 dark:text-zinc-300'}`}>
                                        <Clock size={16} /> Print Date
                                    </span>
                                </label>

                                {/* Option Toggle 3 */}
                                <label className={`flex items-center gap-3 p-3 border rounded-2xl cursor-pointer transition-all ${includePageNumbers ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 dark:border-purple-500' : 'border-zinc-200 bg-white hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800'}`}>
                                    <input
                                        type="checkbox"
                                        checked={includePageNumbers}
                                        onChange={(e) => setIncludePageNumbers(e.target.checked)}
                                        className="w-4 h-4 text-purple-600 rounded border-zinc-300 focus:ring-purple-500 bg-white"
                                    />
                                    <span className={`text-sm font-semibold flex items-center gap-2 ${includePageNumbers ? 'text-purple-700 dark:text-purple-300' : 'text-zinc-700 dark:text-zinc-300'}`}>
                                        <Hash size={16} /> Page Numbers
                                    </span>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Setting Group 3: Signature */}
                    <div className="bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-100 dark:border-zinc-800/60 rounded-3xl p-5 space-y-4">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                            <PenTool size={14} className="text-purple-500" /> Signature Placement
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <button
                                onClick={() => setSignatureMode('last_page')}
                                className={`flex flex-col items-start p-4 rounded-2xl border transition-all active:scale-[0.98] text-left ${signatureMode === 'last_page'
                                    ? 'bg-white border-purple-500 shadow-md shadow-purple-500/10 ring-1 ring-purple-500 dark:bg-zinc-900'
                                    : 'bg-white border-zinc-200 hover:border-zinc-300 shadow-sm dark:bg-zinc-900 dark:border-zinc-800 dark:hover:bg-zinc-800'
                                    }`}
                            >
                                <div className="flex items-center justify-between w-full mb-2">
                                    <h4 className={`text-sm font-bold ${signatureMode === 'last_page' ? 'text-purple-700 dark:text-purple-400' : 'text-zinc-700 dark:text-zinc-300'}`}>Last Page Only</h4>
                                    <div className={`w-4 h-4 rounded-full border-[4px] shrink-0 ${signatureMode === 'last_page' ? 'border-purple-500 bg-white dark:bg-zinc-900' : 'border-zinc-300 dark:border-zinc-600 bg-transparent'}`} />
                                </div>
                                <p className="text-[12px] text-zinc-500 dark:text-zinc-500 leading-relaxed">Appends the signature block neatly at the very end.</p>
                            </button>

                            <button
                                onClick={() => setSignatureMode('every_page')}
                                className={`flex flex-col items-start p-4 rounded-2xl border transition-all active:scale-[0.98] text-left ${signatureMode === 'every_page'
                                    ? 'bg-white border-purple-500 shadow-md shadow-purple-500/10 ring-1 ring-purple-500 dark:bg-zinc-900'
                                    : 'bg-white border-zinc-200 hover:border-zinc-300 shadow-sm dark:bg-zinc-900 dark:border-zinc-800 dark:hover:bg-zinc-800'
                                    }`}
                            >
                                <div className="flex items-center justify-between w-full mb-2">
                                    <h4 className={`text-sm font-bold ${signatureMode === 'every_page' ? 'text-purple-700 dark:text-purple-400' : 'text-zinc-700 dark:text-zinc-300'}`}>Every Page</h4>
                                    <div className={`w-4 h-4 rounded-full border-[4px] shrink-0 ${signatureMode === 'every_page' ? 'border-purple-500 bg-white dark:bg-zinc-900' : 'border-zinc-300 dark:border-zinc-600 bg-transparent'}`} />
                                </div>
                                <p className="text-[12px] text-zinc-500 dark:text-zinc-500 leading-relaxed">Ensures every single page has a signature block.</p>
                            </button>
                        </div>
                    </div>

                </div>

                {/* Footer */}
                <div className="p-5 border-t border-zinc-100 dark:border-zinc-800/60 bg-white dark:bg-zinc-950 flex gap-3 shrink-0">
                    <button onClick={onClose} className="flex-1 py-3.5 text-sm font-bold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-2xl transition-colors">
                        Cancel
                    </button>
                    <button onClick={handleGeneratePDF} className="flex-[2] flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-sm font-bold rounded-2xl transition-all shadow-lg shadow-purple-500/30 active:scale-[0.98]">
                        <FileText size={18} /> Generate PDF
                    </button>
                </div>

            </div>
        </div>
    );
}