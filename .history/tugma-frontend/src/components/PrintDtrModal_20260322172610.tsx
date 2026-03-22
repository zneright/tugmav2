import { useState } from 'react';
import { X, FileText, Calendar, PenTool, Settings2, LayoutTemplate, Image as ImageIcon, Clock, Hash } from 'lucide-react';
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
    // Timeframe State
    const [timeframe, setTimeframe] = useState<'all' | 'current_month' | 'last_month' | 'specific_month' | 'custom_range'>('all');
    const [specificMonth, setSpecificMonth] = useState('');
    const [dateRange, setDateRange] = useState({ start: '', end: '' });

    // Layout & Elements State
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

    // PDF Generation
    const handleGeneratePDF = () => {
        const doc = new jsPDF({ format: paperSize });
        const filteredLogs = getFilteredLogs();

        const filteredCredited = filteredLogs.reduce((sum, log) => sum + Number(log.hoursCredited), 0);
        const fullName = studentProfile ? `${studentProfile.firstName || ''} ${studentProfile.lastName || ''}`.trim() : 'Unknown Student';
        const course = studentProfile?.course || 'Information Technology';

        const drawHeader = (doc: jsPDF, pageNumber: number) => {
            let startX = 105;

            if (includeLogo && tugmaLogo) {
                try {
                    doc.addImage(tugmaLogo, 'PNG', 12, 6, 26, 22);
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
            `${log.hoursLogged} hrs`,
            `${log.hoursCredited} hrs`
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
                2: { cellWidth: 25, halign: 'center' },
                3: { cellWidth: 25, halign: 'center' },
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col max-h-[90vh]">

                <div className="flex items-center justify-between p-5 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 dark:bg-purple-500/20 rounded-xl text-purple-600 dark:text-purple-400">
                            <Settings2 size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-zinc-900 dark:text-white leading-tight">Print Settings</h2>
                            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Customize your DTR document</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 bg-white dark:bg-zinc-800 rounded-full shadow-sm border border-zinc-200 dark:border-zinc-700 transition-colors">
                        <X size={18} />
                    </button>
                </div>

                <div className="p-5 overflow-y-auto space-y-6 flex-1 custom-scrollbar">

                    <div className="space-y-3">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                            <Calendar size={14} /> Time Range
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
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
                                    className={`px-3 py-2.5 rounded-xl text-[13px] font-bold border transition-all ${timeframe === option.id
                                        ? 'bg-purple-50 border-purple-300 text-purple-700 dark:bg-purple-500/20 dark:border-purple-500/50 dark:text-purple-300 shadow-sm'
                                        : 'bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50 dark:bg-zinc-900 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800'
                                        }`}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>

                        {timeframe === 'specific_month' && (
                            <input
                                type="month"
                                value={specificMonth}
                                onChange={(e) => setSpecificMonth(e.target.value)}
                                className="w-full mt-2 p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm outline-none focus:border-purple-500"
                            />
                        )}
                        {timeframe === 'custom_range' && (
                            <div className="flex gap-2 mt-2">
                                <input
                                    type="date"
                                    value={dateRange.start}
                                    onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                                    className="flex-1 p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm outline-none focus:border-purple-500"
                                />
                                <input
                                    type="date"
                                    value={dateRange.end}
                                    onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                                    className="flex-1 p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm outline-none focus:border-purple-500"
                                />
                            </div>
                        )}
                    </div>

                    <div className="space-y-3">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                            <LayoutTemplate size={14} /> Paper Size
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            {[
                                { id: 'a4', label: 'A4' },
                                { id: 'letter', label: 'Short' },
                                { id: 'legal', label: 'Long' }
                            ].map((option) => (
                                <button
                                    key={option.id}
                                    onClick={() => setPaperSize(option.id as any)}
                                    className={`px-3 py-2.5 rounded-xl text-[13px] font-bold border transition-all ${paperSize === option.id
                                        ? 'bg-purple-50 border-purple-300 text-purple-700 dark:bg-purple-500/20 dark:border-purple-500/50 dark:text-purple-300 shadow-sm'
                                        : 'bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50 dark:bg-zinc-900 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800'
                                        }`}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                            <Settings2 size={14} /> Options
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <label className="flex items-center gap-3 p-3 border border-zinc-200 dark:border-zinc-700 rounded-xl cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                                <input
                                    type="checkbox"
                                    checked={includeLogo}
                                    onChange={(e) => setIncludeLogo(e.target.checked)}
                                    className="w-4 h-4 text-purple-600 rounded border-zinc-300 focus:ring-purple-500"
                                />
                                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                                    <ImageIcon size={14} /> Logo
                                </span>
                            </label>

                            <label className="flex items-center gap-3 p-3 border border-zinc-200 dark:border-zinc-700 rounded-xl cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                                <input
                                    type="checkbox"
                                    checked={includeDate}
                                    onChange={(e) => setIncludeDate(e.target.checked)}
                                    className="w-4 h-4 text-purple-600 rounded border-zinc-300 focus:ring-purple-500"
                                />
                                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                                    <Clock size={14} /> Date
                                </span>
                            </label>

                            <label className="flex items-center gap-3 p-3 border border-zinc-200 dark:border-zinc-700 rounded-xl cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                                <input
                                    type="checkbox"
                                    checked={includePageNumbers}
                                    onChange={(e) => setIncludePageNumbers(e.target.checked)}
                                    className="w-4 h-4 text-purple-600 rounded border-zinc-300 focus:ring-purple-500"
                                />
                                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                                    <Hash size={14} /> Page #
                                </span>
                            </label>
                        </div>
                    </div>

                    {/* Signature */}
                    <div className="space-y-3">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                            <PenTool size={14} /> Signature Placement
                        </label>
                        <div className="flex flex-col gap-2">
                            <button
                                onClick={() => setSignatureMode('last_page')}
                                className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all text-left ${signatureMode === 'last_page'
                                    ? 'bg-emerald-50 border-emerald-300 dark:bg-emerald-500/10 dark:border-emerald-500/40'
                                    : 'bg-white border-zinc-200 hover:bg-zinc-50 dark:bg-zinc-900 dark:border-zinc-700 dark:hover:bg-zinc-800'
                                    }`}
                            >
                                <div className={`mt-0.5 w-4 h-4 rounded-full border-[4px] shrink-0 ${signatureMode === 'last_page' ? 'border-emerald-500 bg-white dark:bg-zinc-900' : 'border-zinc-300 dark:border-zinc-600 bg-transparent'}`} />
                                <div>
                                    <h4 className={`text-sm font-bold ${signatureMode === 'last_page' ? 'text-emerald-800 dark:text-emerald-400' : 'text-zinc-700 dark:text-zinc-300'}`}>Only on the Last Page</h4>
                                    <p className="text-[11px] text-zinc-500 dark:text-zinc-500 mt-1 leading-relaxed">Appends the supervisor signature block neatly at the very end.</p>
                                </div>
                            </button>

                            <button
                                onClick={() => setSignatureMode('every_page')}
                                className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all text-left ${signatureMode === 'every_page'
                                    ? 'bg-emerald-50 border-emerald-300 dark:bg-emerald-500/10 dark:border-emerald-500/40'
                                    : 'bg-white border-zinc-200 hover:bg-zinc-50 dark:bg-zinc-900 dark:border-zinc-700 dark:hover:bg-zinc-800'
                                    }`}
                            >
                                <div className={`mt-0.5 w-4 h-4 rounded-full border-[4px] shrink-0 ${signatureMode === 'every_page' ? 'border-emerald-500 bg-white dark:bg-zinc-900' : 'border-zinc-300 dark:border-zinc-600 bg-transparent'}`} />
                                <div>
                                    <h4 className={`text-sm font-bold ${signatureMode === 'every_page' ? 'text-emerald-800 dark:text-emerald-400' : 'text-zinc-700 dark:text-zinc-300'}`}>Bottom of Every Page</h4>
                                    <p className="text-[11px] text-zinc-500 dark:text-zinc-500 mt-1 leading-relaxed">Ensures every single page has a signature block.</p>
                                </div>
                            </button>
                        </div>
                    </div>

                </div>

                <div className="p-5 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50 flex gap-3 shrink-0">
                    <button onClick={onClose} className="flex-1 py-3 text-sm font-bold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors">
                        Cancel
                    </button>
                    <button onClick={handleGeneratePDF} className="flex-[2] flex items-center justify-center gap-2 py-3 bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold rounded-xl transition-colors shadow-lg shadow-purple-500/20">
                        <FileText size={16} /> Generate PDF
                    </button>
                </div>

            </div>
        </div>
    );
}