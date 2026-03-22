import { useState, useRef, useEffect } from 'react';
import {
  UploadCloud, FileText, CheckCircle2, AlertCircle,
  Zap, Loader2, Briefcase, FileSearch,
  ListChecks, Target, XCircle, Clock, ChevronRight,
  Sparkles
} from 'lucide-react';

// 🔥 IMPORT AUTH TO GET THE CURRENT USER'S UID FOR LOGGING
import { auth } from '../../firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';

interface ATSFeedback {
  match_score: number;
  overall_assessment: string;
  strengths: string[];
  weaknesses: string[];
  missing_keywords: string[];
  matched_keywords: string[];
  experience_relevance: number;
  education_relevance: number;
  skills_relevance: number;
  improvement_suggestions: string[];
}

interface ScanHistory {
  id: string;
  file_name: string;
  job_description: string;
  match_score: number;
  created_at: string;
  json_result: ATSFeedback;
}

export default function StudentResume() {
  const [uid, setUid] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [isScanned, setIsScanned] = useState(false);
  const [feedback, setFeedback] = useState<ATSFeedback | null>(null);

  // Track metadata for the report header
  const [reportMeta, setReportMeta] = useState<{ fileName: string, date: string } | null>(null);

  // Database History State
  const [history, setHistory] = useState<ScanHistory[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUid(user.uid);
      }
    });
    return () => unsubscribe();
  }, []);

  // Fetch History from CodeIgniter on Load
  const fetchHistory = async () => {
    try {
      const res = await fetch('http://localhost:8080/api/ats/history');
      if (res.ok) {
        const data = await res.json();
        // Force sort to make sure newest is ALWAYS at the top
        const sortedData = data.sort((a: ScanHistory, b: ScanHistory) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        setHistory(sortedData);
      }
    } catch (err) {
      console.error("Failed to fetch history", err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  // 🔥 NEW: SILENT AUDIT LOGGER 🔥
  const logSystemEvent = (action: string, details: string) => {
    if (!uid) return;
    fetch('http://localhost:8080/api/audit/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid, action, details })
    }).catch(err => console.error("Audit log failed (silent):", err));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isAccepted = file.type === 'application/pdf' || file.name.endsWith('.pdf') || file.name.endsWith('.docx');

    if (isAccepted) {
      if (file.size > 8 * 1024 * 1024) {
        alert("File too large. Please limit your resume to 8MB or below.");
        e.target.value = '';
        return;
      }
      setSelectedFile(file);
    } else {
      alert("Please upload a valid .pdf or .docx file.");
    }
    e.target.value = '';
  };

  const processResumeAPI = async () => {
    if (!selectedFile || !jobDescription.trim()) return;
    setIsScanning(true);
    setIsScanned(false);

    try {
      const formData = new FormData();
      formData.append('resume', selectedFile);
      formData.append('jobDescription', jobDescription);

      const response = await fetch('http://localhost:8080/api/ats/scan', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.messages?.error || errorData.message || "Backend failed");
      }

      const data = await response.json();
      setFeedback(data);
      setIsScanned(true);

      // Set metadata for the header
      setReportMeta({
        fileName: selectedFile.name,
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
      });

      // 🔥 LOG THE AI SCAN EVENT TO ADMIN DASHBOARD 🔥
      logSystemEvent('Ran AI Resume Scan', `Scanned resume against job description. Match Score: ${data.match_score}%`);

      // Refresh history to show the new scan at the top
      fetchHistory();

    } catch (error: any) {
      console.error("Scan Error:", error);
      alert(error.message || "Failed to scan. Check backend console.");
    } finally {
      setIsScanning(false);
    }
  };

  // Load past scan
  const loadHistoryItem = (item: ScanHistory) => {
    setFeedback(item.json_result);
    setJobDescription(item.job_description);
    setSelectedFile(new File([], item.file_name));

    setReportMeta({
      fileName: item.file_name,
      date: new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    });

    setIsScanned(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const circleCircumference = 351;
  const strokeDashoffset = feedback ? circleCircumference - (feedback.match_score / 100) * circleCircumference : circleCircumference;

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20 animate-in fade-in duration-500">
      <input type="file" accept=".pdf,.docx" ref={fileInputRef} onChange={handleFileChange} className="hidden" />

      {/* HEADER */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-8 border border-zinc-200 dark:border-zinc-800 shadow-sm relative overflow-hidden transition-colors">
        <div className="relative z-10">
          <h1 className="text-3xl font-black mb-2 flex items-center gap-3 text-zinc-900 dark:text-white tracking-tight">
            <Zap className="text-yellow-500 fill-yellow-500" /> TUGMA ATS Scanner
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 max-w-2xl text-sm font-medium leading-relaxed">
            Upload your resume (.PDF or .DOCX, Max 8MB) and paste the job description to get a professional ATS evaluation.
          </p>
        </div>
        <div className="absolute right-0 top-0 w-64 h-64 bg-purple-600/5 dark:bg-purple-600/10 blur-[100px] rounded-full"></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* INPUTS & HISTORY*/}
        <div className="lg:col-span-4 space-y-6 flex flex-col">

          {/* UPLOAD & INPUTS */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden transition-colors">
            <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
              <h2 className="font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <FileSearch size={18} className="text-purple-500" /> 1. Upload Document
              </h2>
            </div>
            <div className="p-6">
              {!selectedFile ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-zinc-200 dark:border-zinc-700 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-500/10 transition-all group"
                >
                  <UploadCloud size={32} className="text-zinc-400 group-hover:text-purple-500 mb-2" />
                  <p className="text-sm font-bold text-zinc-900 dark:text-white">Choose Resume</p>
                  <p className="text-[11px] text-zinc-500 mt-1 font-medium">.PDF or .DOCX (Max 8MB)</p>
                </div>
              ) : (
                <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-xl border border-zinc-200 dark:border-zinc-700 flex items-center justify-between transition-colors">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <FileText className="text-purple-500 shrink-0" />
                    <span className="text-sm font-bold truncate text-zinc-900 dark:text-white">{selectedFile.name}</span>
                  </div>
                  <button onClick={() => setSelectedFile(null)} className="text-[11px] uppercase font-black text-red-500 hover:underline shrink-0">Remove</button>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50 transition-colors">
              <h2 className="font-bold text-zinc-900 dark:text-white mb-3 flex items-center gap-2">
                <Briefcase size={18} className="text-purple-500" /> 2. Job Description
              </h2>
              <textarea
                rows={6}
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl p-4 text-[13px] font-medium outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 text-zinc-900 dark:text-white transition-all resize-none shadow-sm"
                placeholder="Paste the target job requirements here..."
              />

              <button
                onClick={processResumeAPI}
                disabled={isScanning || !selectedFile || !jobDescription}
                className="w-full mt-4 py-3.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-black rounded-xl shadow-lg shadow-purple-500/20 transition-all flex items-center justify-center gap-2 uppercase tracking-wider text-sm"
              >
                {isScanning ? <><Loader2 className="animate-spin" /> Analyzing...</> : <><Zap size={18} className="fill-white" /> Scan Resume</>}
              </button>
            </div>
          </div>

          {/* HISTORY SIDEBAR */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex-1 flex flex-col overflow-hidden max-h-[500px] transition-colors">
            <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between transition-colors">
              <h2 className="font-bold text-zinc-900 dark:text-white flex items-center gap-2 text-sm">
                <Clock size={16} className="text-zinc-400" /> Recent Scans
              </h2>
              <span className="text-[10px] bg-zinc-100 dark:bg-zinc-800 text-zinc-500 px-2 py-1 rounded-md font-bold">{history.length}</span>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">

              {/* LIVE ANALYZING STATE IN HISTORY */}
              {isScanning && (
                <div className="w-full text-left p-3 rounded-xl bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/30 flex flex-col gap-2 animate-pulse">
                  <div className="flex items-center justify-between w-full">
                    <span className="flex items-center gap-1.5 text-[10px] font-black text-purple-600 dark:text-purple-400 uppercase">
                      <Loader2 className="animate-spin" size={12} /> Analyzing
                    </span>
                    <span className="text-[10px] text-zinc-400 font-medium">Just now</span>
                  </div>
                  <div className="overflow-hidden pr-2">
                    <p className="text-[13px] font-bold text-zinc-900 dark:text-white truncate">{selectedFile?.name || "Document"}</p>
                  </div>
                </div>
              )}

              {isLoadingHistory ? (
                <div className="flex justify-center p-4"><Loader2 className="animate-spin text-zinc-400" /></div>
              ) : history.length === 0 && !isScanning ? (
                <p className="text-xs text-center text-zinc-500 p-4 font-medium">No previous scans found.</p>
              ) : (
                history.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => loadHistoryItem(item)}
                    className="w-full text-left p-3 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800/50 border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700 transition-all group flex flex-col gap-2"
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-md uppercase ${item.match_score >= 75 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' : item.match_score >= 60 ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400' : 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'}`}>
                        {item.match_score}% Match
                      </span>
                      <span className="text-[10px] text-zinc-400 font-medium">{new Date(item.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="overflow-hidden pr-2">
                        <p className="text-[13px] font-bold text-zinc-900 dark:text-white truncate">{item.file_name}</p>
                        <p className="text-[11px] text-zinc-500 truncate mt-0.5">{item.job_description.substring(0, 40)}...</p>
                      </div>
                      <ChevronRight size={16} className="text-zinc-300 group-hover:text-purple-500 shrink-0" />
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* RESULT*/}
        <div className="lg:col-span-8">
          {isScanned && feedback ? (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-700">

              {/* REPORT HEADER */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm gap-4 transition-colors">
                <div className="overflow-hidden">
                  <h2 className="text-xl font-black text-zinc-900 dark:text-white truncate">ATS Compatibility Report</h2>
                  <p className="text-xs font-medium text-zinc-500 mt-1 truncate">
                    <strong className="text-zinc-700 dark:text-zinc-300">File:</strong> {reportMeta?.fileName} &nbsp;•&nbsp; <strong className="text-zinc-700 dark:text-zinc-300">Evaluated:</strong> {reportMeta?.date}
                  </p>
                </div>
                <div className="flex flex-col items-start sm:items-end shrink-0 gap-1">
                  <span className="flex items-center gap-1.5 text-[11px] font-bold text-purple-700 bg-purple-50 border border-purple-200 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20 px-3 py-1.5 rounded-lg">
                    <Sparkles size={14} /> Processed by AI
                  </span>
                </div>
              </div>

              {/* Score */}
              <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-8 shadow-sm flex flex-col md:flex-row items-center gap-8 transition-colors">
                <div className="relative shrink-0">
                  <svg className="w-40 h-40 transform -rotate-90">
                    <circle cx="80" cy="80" r="56" stroke="currentColor" strokeWidth="10" fill="transparent" className="text-zinc-100 dark:text-zinc-800" />
                    <circle cx="80" cy="80" r="56" stroke="currentColor" strokeWidth="10" fill="transparent" strokeDasharray={circleCircumference} strokeDashoffset={strokeDashoffset} className={feedback.match_score >= 75 ? 'text-emerald-500' : feedback.match_score >= 60 ? 'text-amber-500' : 'text-red-500'} style={{ transition: 'stroke-dashoffset 1.5s ease-out' }} />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-5xl font-black text-zinc-900 dark:text-white">{feedback.match_score}</span>
                    <span className="text-[10px] font-bold uppercase text-zinc-500 mt-1">Overall Match</span>
                  </div>
                </div>
                <div className="space-y-4 flex-1">
                  <p className="text-sm font-bold text-zinc-900 dark:text-white">AI Assessment Summary</p>
                  <p className="text-[13px] text-zinc-600 dark:text-zinc-400 leading-relaxed font-medium bg-zinc-50 dark:bg-zinc-800/40 p-4 rounded-xl border border-zinc-100 dark:border-zinc-700/50">
                    {feedback.overall_assessment}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'Skills Match', val: feedback.skills_relevance },
                  { label: 'Experience', val: feedback.experience_relevance },
                  { label: 'Education', val: feedback.education_relevance },
                ].map(m => (
                  <div key={m.label} className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col items-center justify-center shadow-sm transition-colors">
                    <span className={`text-2xl font-black ${m.val >= 75 ? 'text-emerald-500' : m.val >= 60 ? 'text-amber-500' : 'text-red-500'}`}>{m.val}%</span>
                    <p className="text-[10px] font-bold uppercase text-zinc-500 mt-1 text-center">{m.label}</p>
                  </div>
                ))}
              </div>

              {/* Detailed Feedback Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Missing Keywords */}
                <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-red-200 dark:border-red-900/30 p-6 shadow-sm transition-colors">
                  <h3 className="text-sm font-bold text-red-700 dark:text-red-400 flex items-center gap-2 mb-4">
                    <Target size={16} /> Missing Keywords
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {feedback.missing_keywords.length > 0 ? feedback.missing_keywords.map(k => (
                      <span key={k} className="px-3 py-1.5 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-[11px] font-black rounded-lg border border-red-100 dark:border-red-500/20 uppercase tracking-wider">{k}</span>
                    )) : <p className="text-xs text-zinc-500 font-medium">None found!</p>}
                  </div>
                </div>

                {/* Matched Keywords */}
                <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-emerald-200 dark:border-emerald-900/30 p-6 shadow-sm transition-colors">
                  <h3 className="text-sm font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-2 mb-4">
                    <CheckCircle2 size={16} /> Matched Keywords
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {feedback.matched_keywords.length > 0 ? feedback.matched_keywords.map(k => (
                      <span key={k} className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[11px] font-black rounded-lg border border-emerald-100 dark:border-emerald-500/20 uppercase tracking-wider">{k}</span>
                    )) : <p className="text-xs text-zinc-500 font-medium">None found.</p>}
                  </div>
                </div>

                <div className="md:col-span-2 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm transition-colors">
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2 mb-4">
                    <ListChecks size={16} className="text-purple-500" /> How to Improve
                  </h3>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {feedback.improvement_suggestions.map((s, i) => (
                      <li key={i} className="flex items-start gap-3 text-[13px] font-medium text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800/40 p-4 rounded-xl border border-zinc-100 dark:border-zinc-700/50">
                        <AlertCircle size={16} className="text-amber-500 shrink-0 mt-0.5" />
                        <span className="leading-relaxed">{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Disclaimer */}
              <p className="text-center text-[11px] font-medium text-zinc-400 mt-8 mb-4">
                Note: This compatibility score is generated by an AI model and should be used as a guiding tool to optimize your resume.
              </p>
            </div>
          ) : (
            <div className="h-full min-h-[500px] flex flex-col items-center justify-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl text-center p-10 bg-zinc-50/50 dark:bg-zinc-900/20 transition-colors">
              <div className="w-20 h-20 bg-white dark:bg-zinc-800 rounded-full flex items-center justify-center mb-6 shadow-sm transition-colors">
                <FileSearch size={32} className="text-zinc-400" />
              </div>
              <h3 className="text-xl font-black text-zinc-900 dark:text-white mb-2">Awaiting Document</h3>
              <p className="text-sm text-zinc-500 max-w-sm mx-auto leading-relaxed">
                Upload your resume on the left and paste the job description. Or, click on a previous scan in your history to instantly reload it.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}