import { useState, useRef } from 'react';
import {
  UploadCloud, FileText, CheckCircle2, AlertCircle,
  Zap, Loader2, Briefcase, FileSearch,
  ListChecks, Target, XCircle
} from 'lucide-react';

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

export default function StudentResume() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [isScanned, setIsScanned] = useState(false);
  const [feedback, setFeedback] = useState<ATSFeedback | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    // If the user cancels/closes the file window, do nothing
    if (!file) return;

    // 1. More forgiving PDF check (fixes Windows MIME type bugs)
    if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {

      // 2. 8MB Limit Check
      if (file.size > 8 * 1024 * 1024) {
        alert("File too large. Please limit your resume to 8MB or below.");
        e.target.value = ''; // Clear the input
        return;
      }

      setSelectedFile(file);
    } else {
      alert("Please upload a valid PDF file.");
    }

    // 3. Reset the hidden input so you can re-upload the exact same file later if needed
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
        throw new Error(errorData.messages?.error || "Backend failed");
      }

      const data = await response.json();
      setFeedback(data);
      setIsScanned(true);
    } catch (error: any) {
      console.error("Scan Error:", error);
      alert(error.message || "Failed to scan. Check backend console.");
    } finally {
      setIsScanning(false);
    }
  };

  const circleCircumference = 351;
  const strokeDashoffset = feedback ? circleCircumference - (feedback.match_score / 100) * circleCircumference : circleCircumference;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 animate-in fade-in duration-500">
      <input type="file" accept=".pdf" ref={fileInputRef} onChange={handleFileChange} className="hidden" />

      {/* HEADER */}
      <div className="bg-zinc-900 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-3xl font-black mb-2 flex items-center gap-3">
            <Zap className="text-yellow-400 fill-yellow-400" /> TUGMA ATS Scanner
          </h1>
          <p className="text-zinc-400 max-w-2xl text-sm font-medium leading-relaxed">
            Upload your resume (Max 8MB) and paste the job description to get a professional ATS evaluation.
          </p>
        </div>
        <div className="absolute right-0 top-0 w-64 h-64 bg-purple-600/10 blur-[100px] rounded-full"></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT: INPUTS */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
            <h2 className="font-bold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
              <FileSearch size={18} className="text-purple-500" /> 1. Resume Upload
            </h2>
            {!selectedFile ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl p-10 flex flex-col items-center justify-center cursor-pointer hover:border-purple-500 hover:bg-purple-50/50 transition-all group"
              >
                <UploadCloud size={32} className="text-zinc-400 group-hover:text-purple-500 mb-2" />
                <p className="text-sm font-bold text-zinc-900 dark:text-white">Choose PDF Resume</p>
                <p className="text-xs text-zinc-500 mt-1">Limit: 8MB</p>
              </div>
            ) : (
              <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-xl border border-zinc-200 dark:border-zinc-700 flex items-center justify-between">
                <div className="flex items-center gap-3 overflow-hidden">
                  <FileText className="text-red-500 shrink-0" />
                  <span className="text-sm font-bold truncate dark:text-white">{selectedFile.name}</span>
                </div>
                <button onClick={() => setSelectedFile(null)} className="text-xs font-bold text-red-500 hover:underline">Remove</button>
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
            <h2 className="font-bold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
              <Briefcase size={18} className="text-purple-500" /> 2. Job Description
            </h2>
            <textarea
              rows={8}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl p-4 text-sm font-medium outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 dark:text-white transition-all resize-none"
              placeholder="Paste the requirements here..."
            />
          </div>

          <button
            onClick={processResumeAPI}
            disabled={isScanning || !selectedFile || !jobDescription}
            className="w-full py-4 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-black rounded-xl shadow-lg shadow-purple-500/20 transition-all flex items-center justify-center gap-2 uppercase tracking-wider text-sm"
          >
            {isScanning ? <><Loader2 className="animate-spin" /> Analyzing...</> : <><Zap size={18} className="fill-white" /> Scan Resume</>}
          </button>
        </div>

        {/* RIGHT: RESULTS */}
        <div className="lg:col-span-7">
          {isScanned && feedback ? (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-700">
              {/* Score Dashboard */}
              <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-8 shadow-sm flex flex-col md:flex-row items-center gap-8">
                <div className="relative shrink-0">
                  <svg className="w-40 h-40 transform -rotate-90">
                    <circle cx="80" cy="80" r="56" stroke="currentColor" strokeWidth="10" fill="transparent" className="text-zinc-100 dark:text-zinc-800" />
                    <circle cx="80" cy="80" r="56" stroke="currentColor" strokeWidth="10" fill="transparent" strokeDasharray={circleCircumference} strokeDashoffset={strokeDashoffset} className={feedback.match_score >= 75 ? 'text-emerald-500' : 'text-amber-500'} style={{ transition: 'stroke-dashoffset 1.5s ease-out' }} />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-5xl font-black dark:text-white">{feedback.match_score}</span>
                    <span className="text-[10px] font-bold uppercase text-zinc-500">Match</span>
                  </div>
                </div>
                <div className="space-y-4 flex-1">
                  <p className="text-sm font-bold text-zinc-900 dark:text-white">Overall Assessment</p>
                  <p className="text-[13px] text-zinc-500 dark:text-zinc-400 leading-relaxed font-medium">{feedback.overall_assessment}</p>
                </div>
              </div>

              {/* Relevance Breakdown */}
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'Skills', val: feedback.skills_relevance },
                  { label: 'Experience', val: feedback.experience_relevance },
                  { label: 'Education', val: feedback.education_relevance },
                ].map(m => (
                  <div key={m.label} className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 text-center">
                    <p className="text-[10px] font-black uppercase text-zinc-500 mb-1">{m.label}</p>
                    <p className="text-xl font-black text-purple-600 dark:text-purple-400">{m.val}%</p>
                  </div>
                ))}
              </div>

              {/* Detailed Lists */}
              <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">
                <div className="p-6 space-y-8">
                  {/* Keywords */}
                  <div>
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2 mb-4"><Target size={16} className="text-red-500" /> Missing Keywords</h3>
                    <div className="flex flex-wrap gap-2">
                      {feedback.missing_keywords.map(k => (
                        <span key={k} className="px-3 py-1 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-[11px] font-bold rounded-lg border border-red-100 dark:border-red-500/20 uppercase">{k}</span>
                      ))}
                    </div>
                  </div>

                  {/* Suggestions */}
                  <div>
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2 mb-4"><ListChecks size={16} className="text-purple-500" /> Improvement Suggestions</h3>
                    <ul className="space-y-3">
                      {feedback.improvement_suggestions.map((s, i) => (
                        <li key={i} className="flex items-start gap-3 text-[13px] font-medium text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800/40 p-3 rounded-xl">
                          <AlertCircle size={16} className="text-amber-500 shrink-0 mt-0.5" /> {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl text-center p-10">
              <FileSearch size={48} className="text-zinc-300 mb-4" />
              <h3 className="text-lg font-bold text-zinc-400">Ready for Analysis</h3>
              <p className="text-sm text-zinc-500 max-w-xs mx-auto mt-2">Upload your documents and click scan to see your result.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}