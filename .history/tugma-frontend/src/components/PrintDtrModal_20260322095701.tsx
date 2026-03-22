import { useState } from 'react';
import { X, FileText, Calendar, PenTool, Download, Settings2 } from 'lucide-react';
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

interface PrintDTRModalProps {
    isOpen: boolean;
    onClose: () => void;
    logs: LogEntry[];
    studentProfile: any;
    requiredHours: number;
    completedHours: number;
}

export default function PrintDTRModal({ isOpen, onClose, logs, studentProfile, requiredHours, completedHours }: PrintDTRModalProps) {
    const [timeframe, setTimeframe] = useState<'all' | 'current_month' | 'last_month'>('all');
    const [signatureMode, setSignatureMode] = useState<'last_page' | 'every_page'>('last_page');

    if (!isOpen) return null;

    // --- FILTER LOGS BASED ON TIMEFRAME ---
    const getFilteredLogs = () => {
        if (timeframe === 'all') return logs;

        const now = new Date();
        const targetMonth = timeframe === 'current_month' ? now.getMonth() : now.getMonth() - 1;
        const targetYear = timeframe === 'last_month' && now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
        const safeTargetMonth = targetMonth < 0 ? 11 : targetMonth;

        return logs.filter(log => {
            const logDate = new Date(log.date);
            return logDate.getMonth() === safeTargetMonth && logDate.getFullYear() === targetYear;
        });
    };

    // --- PDF GENERATOR LOGIC ---
    const handleGeneratePDF = () => {
        const doc = new jsPDF();
        const filteredLogs = getFilteredLogs();

        // Calculate totals for the filtered view
        const filteredCredited = filteredLogs.reduce((sum, log) => sum + Number(log.hoursCredited), 0);

        const fullName = studentProfile ? `${studentProfile.firstName || ''} ${studentProfile.lastName || ''}`.trim() : 'Unknown Student';
        const course = studentProfile?.course || 'Information Technology';

        // --- REUSABLE HEADER FUNCTION ---
        const drawHeader = (doc: jsPDF, pageNumber: number) => {
            doc.setFontSize(22);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(107, 33, 168); // Purple-800
            doc.text("DAILY TIME RECORD", 105, 20, { align: "center" });

            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(100, 100, 100);

            let periodText = "Official OJT Hours Log";
            if (timeframe === 'current_month') periodText += " (Current Month)";
            if (timeframe === 'last_month') periodText += " (Last Month)";
            doc.text(periodText, 105, 26, { align: "center" });

            doc.setDrawColor(200, 200, 200);
            doc.line(14, 32, 196, 32);

            // Only draw student details on the first page
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

        // --- REUSABLE SIGNATURE FUNCTION ---
        const drawSignature = (doc: jsPDF, yPos: number) => {
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

            doc.line(140, yPos + 25, 190, yPos + 25);
            doc.text("Date", 140, yPos + 30);
        };

        // --- TABLE GENERATION ---
        const tableColumn = ["Date", "Task / Activity", "Logged Hrs", "Credited Hrs"];
        const tableRows = filteredLogs.map(log => [
            log.date,
            log.task + (log.isDouble ? " (Holiday/OT)" : ""),
            `${log.hoursLogged} hrs`,
            `${log.hoursCredited} hrs`
        ]);
 room for the signature block
        const bottomMargin = signatureMode === 'every_page' ? 50 : 20;

        autoTable(doc, {
            startY: 58,
            head: [tableColumn],
            body: tableRows,
            theme: 'grid',
            margin: { bottom: bottomMargin },
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

        //LAST PAGE SIGNATURE 
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

        doc.save(`DTR_${timeframe}_${fullName.replace(/\s+/g, '_')}.pdf`);
        onClose(); 
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">

                {/* Header */}
                <div className="flex items-center justify-between p-5 sm:p-6 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50">
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

                <div className="p-5 sm:p-6 space-y-6">

                    {/* Timeframe  */}
                    <div className="space-y-3">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                            <Calendar size={14} /> Timeframe to Print
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            {[
                                { id: 'all', label: 'All Records' },
                                { id: 'current_month', label: 'This Month' },
                                { id: 'last_month', label: 'Last Month' }
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
                                    <p className="text-[11px] text-zinc-500 dark:text-zinc-500 mt-1 leading-relaxed">Appends the supervisor signature block neatly at the very end of the document.</p>
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
                                    <p className="text-[11px] text-zinc-500 dark:text-zinc-500 mt-1 leading-relaxed">Ensures every single page has a signature block for stricter university requirements.</p>
                                </div>
                            </button>
                        </div>
                    </div>

                </div>

                {/* Foote*/}
                <div className="p-5 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50 flex gap-3">
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