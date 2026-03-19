import { useState, useRef } from 'react';
import {
  UploadCloud, FileText, CheckCircle2, AlertCircle,
  TrendingUp, Zap, Loader2, Briefcase, FileSearch,
  ListChecks, Target, XCircle
} from 'lucide-react';

// Interfaces for our detailed ATS data structure
interface ATSFeedback {
  overallScore: number;
  metrics: {
    impact: number;
    formatting: number;
    keywords: number;
  };
  strengths: string[];
  improvements: string[];
  missingKeywords: string[];
}

export default function Resume() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState('');

  const [isScanning, setIsScanning] = useState(false);
  const [isScanned, setIsScanned] = useState(false);

  const [feedback, setFeedback] = useState<ATSFeedback | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
    } else {
      alert("Please upload a valid PDF file.");
    }
  };

  const processResumeAPI = async () => {
    if (!selectedFile) {
      alert("Please upload a resume first.");
      return;
    }
    if (!jobDescription.trim()) {
      alert("Please paste a target job description to scan against.");
      return;
    }

    setIsScanning(true);
    setIsScanned(false);

    try {
      /* 🚀 BACKEND CONNECTION POINT:
        const formData = new FormData();
        formData.append('resume', selectedFile);
        formData.append('jobDescription', jobDescription);

        const response = await fetch('http://localhost:8080/api/ats/scan', {
          method: 'POST',
          body: formData,
        });
        const data = await response.json();
      */

      // Simulating API processing time
      await new Promise(resolve => setTimeout(resolve, 3500));

      // Highly detailed mock response structured like a real AI output
      const simulatedResponse: ATSFeedback = {
        overallScore: 78,
        metrics: {
          impact: 65,
          formatting: 92,
          keywords: 76
        },
        strengths: [
          "Clean, single-column layout detected. Highly readable by ATS bots.",
          "Contact information is clearly visible at the top.",
          "Good use of action verbs in the experience section."
        ],
        improvements: [
          "Lacking quantifiable metrics. Try adding numbers (e.g., 'Improved efficiency by 20%').",
          "Your summary is a bit too generic. Tailor it specifically to this job description.",
          "Missing hard skills required in the target job description."
        ],
        missingKeywords: ["React.js", "Agile Methodology", "RESTful APIs", "TypeScript"]
      };

      setFeedback(simulatedResponse);
      setIsScanning(false);
      setIsScanned(true);

    } catch (error) {
      console.error("Error scanning resume:", error);
      alert("Failed to scan resume. Please try again.");
      setIsScanning(false);
    }
  };

  // SVG Circle calculation
  const circleCircumference = 351; // 2 * pi * r (r=56)
  const strokeDashoffset = feedback ? circleCircumference - (feedback.overallScore / 100) * circleCircumference : circleCircumference;

  return (
    <div className="space-y-6 pb-20 md:pb-8 animate-in fade-in duration-500 max-w-6xl mx-auto">

      <input
        type="file"
        accept=".pdf"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />

      {/* HEADER */}
      <div className="bg-zinc-900 rounded-2xl p-6 sm:p-8 text-white shadow-lg overflow-hidden relative">
        <div className="relative z-10">
          <h1 className="text-2xl sm:text-3xl font-black mb-3 flex items-center gap-3 tracking-tight">
            <Zap className="text-yellow-400 fill-yellow-400" /> TUGMA ATS Scanner
          </h1>
          <p className="text-zinc-400 max-w-2xl text-[13px] sm:text-sm font-medium leading-relaxed">
            Upload your resume and paste your target job description. Our AI-powered system simulates how employer ATS bots read your document, highlighting missing keywords and formatting errors.
          </p>
        </div>
        <div className="absolute right-0 top-0 w-64 h-64 bg-purple-600/20 blur-3xl rounded-full translate-x-1/3 -translate-y-1/3 pointer-events-none"></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* --- LEFT COLUMN: INPUTS --- */}
        <div className="lg:col-span-5 space-y-6">

          {/* 1. Upload Zone */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
            <h2 className="font-bold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
              <FileSearch size={18} className="text-purple-500" /> 1. Upload Resume
            </h2>

            {!selectedFile ? (
              <div
                className="border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/10 transition-colors group"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="w-14 h-14 bg-purple-100 dark:bg-purple-500/20 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <UploadCloud size={28} className="text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-white mb-1">Click to upload PDF</h3>
                <p className="text-[11px] font-medium text-zinc-500">Max file size: 5MB</p>
              </div>
            ) : (
              <div className="border border-purple-200 dark:border-purple-500/30 rounded-xl p-4 flex flex-col gap-4 bg-purple-50/50 dark:bg-purple-500/5">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-10 h-10 bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 rounded-lg flex items-center justify-center shrink-0">
                    <FileText size={20} />
                  </div>
                  <div className="overflow-hidden">
                    <h3 className="text-[13px] font-bold text-zinc-900 dark:text-white truncate">{selectedFile.name}</h3>
                    <p className="text-[11px] text-zinc-500 font-medium mt-0.5">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB • Ready to scan
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedFile(null)}
                  className="text-[11px] font-bold text-red-600 dark:text-red-400 hover:underline self-start uppercase tracking-wider"
                >
                  Remove File
                </button>
              </div>
            )}
          </div>

          {/* 2. Job Description Input */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
            <h2 className="font-bold text-zinc-900 dark:text-white mb-2 flex items-center gap-2">
              <Briefcase size={18} className="text-purple-500" /> 2. Target Job Role
            </h2>
            <p className="text-[11px] font-medium text-zinc-500 mb-4">Paste the description of the job you want to apply for to check keyword matching.</p>

            <textarea
              rows={6}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="E.g. We are looking for a Junior Frontend Developer with experience in React, TypeScript, and Tailwind CSS..."
              className="w-full bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 rounded-xl p-4 outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 text-zinc-900 dark:text-white text-[13px] font-medium resize-none transition-all shadow-sm"
            />
          </div>

          {/* Scan Action */}
          <button
            onClick={processResumeAPI}
            disabled={isScanning || !selectedFile || !jobDescription}
            className="w-full py-4 rounded-xl text-white font-black text-sm bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-90 disabled:opacity-50 disabled:grayscale transition-all shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2 uppercase tracking-wide"
          >
            {isScanning ? (
              <><Loader2 size={18} className="animate-spin" /> Analyzing Document...</>
            ) : (
              <><Zap size={18} className="fill-white" /> Scan Resume Now</>
            )}
          </button>
        </div>

        {/* --- RIGHT COLUMN: RESULTS --- */}
        <div className="lg:col-span-7">

          {!isScanned && !isScanning ? (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl bg-zinc-50/50 dark:bg-zinc-900/50 text-center p-8">
              <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-4">
                <Target size={32} className="text-zinc-400" />
              </div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">Awaiting Document</h3>
              <p className="text-sm font-medium text-zinc-500 max-w-sm">
                Upload your resume and provide a target job description to generate a comprehensive ATS compatibility report.
              </p>
            </div>
          ) : isScanning ? (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center border border-zinc-200 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-900 text-center p-8 shadow-sm">
              <div className="relative w-20 h-20 mb-6">
                <div className="absolute inset-0 border-4 border-zinc-100 dark:border-zinc-800 rounded-full"></div>
                <Loader2 className="absolute inset-0 w-20 h-20 text-purple-600 animate-spin" />
              </div>
              <h3 className="text-lg font-black text-zinc-900 dark:text-white mb-2 animate-pulse">Running AI Analysis...</h3>
              <div className="space-y-2 text-sm font-medium text-zinc-500">
                <p className="flex items-center gap-2 justify-center"><CheckCircle2 size={14} className="text-emerald-500" /> Parsing PDF layout...</p>
                <p className="flex items-center gap-2 justify-center"><CheckCircle2 size={14} className="text-emerald-500" /> Extracting core text...</p>
                <p className="flex items-center gap-2 justify-center text-zinc-400"><Loader2 size={14} className="animate-spin" /> Cross-referencing keywords...</p>
              </div>
            </div>
          ) : feedback && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">

              {/* Top Score Dashboard */}
              <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 sm:p-8 shadow-sm flex flex-col md:flex-row items-center gap-8">

                {/* Main Dial */}
                <div className="flex flex-col items-center justify-center relative shrink-0">
                  <svg className="w-40 h-40 transform -rotate-90 transition-all duration-1000 ease-out">
                    <circle cx="80" cy="80" r="56" stroke="currentColor" strokeWidth="10" fill="transparent" className="text-zinc-100 dark:text-zinc-800" />
                    <circle
                      cx="80" cy="80" r="56"
                      stroke="currentColor"
                      strokeWidth="10"
                      fill="transparent"
                      strokeDasharray={circleCircumference}
                      strokeDashoffset={strokeDashoffset}
                      className={feedback.overallScore >= 80 ? 'text-emerald-500' : feedback.overallScore >= 70 ? 'text-amber-500' : 'text-red-500'}
                      style={{ transition: 'stroke-dashoffset 1.5s ease-out' }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`text-5xl font-black tracking-tight ${feedback.overallScore >= 80 ? 'text-emerald-600 dark:text-emerald-400' : feedback.overallScore >= 70 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'}`}>
                      {feedback.overallScore}
                    </span>
                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mt-1">ATS Score</span>
                  </div>
                </div>

                {/* Sub Metrics */}
                <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    { label: 'Impact & Metrics', score: feedback.metrics.impact },
                    { label: 'ATS Formatting', score: feedback.metrics.formatting },
                    { label: 'Keyword Match', score: feedback.metrics.keywords }
                  ].map((metric) => (
                    <div key={metric.label} className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-4 border border-zinc-200 dark:border-zinc-700/50">
                      <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-2">{metric.label}</p>
                      <div className="flex items-end justify-between mb-2">
                        <span className={`text-2xl font-black leading-none ${metric.score >= 80 ? 'text-emerald-500' : metric.score >= 70 ? 'text-amber-500' : 'text-red-500'}`}>
                          {metric.score}/100
                        </span>
                      </div>
                      <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${metric.score >= 80 ? 'bg-emerald-500' : metric.score >= 70 ? 'bg-amber-500' : 'bg-red-500'}`}
                          style={{ width: `${metric.score}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Detailed Breakdown */}
              <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">
                <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
                  <h2 className="font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                    <ListChecks size={18} className="text-purple-500" /> Actionable Feedback
                  </h2>
                </div>

                <div className="p-6 space-y-6">

                  {/* Improvements Section */}
                  <div>
                    <h3 className="text-sm font-bold text-amber-600 dark:text-amber-400 flex items-center gap-2 mb-3">
                      <AlertCircle size={16} /> High Priority Fixes
                    </h3>
                    <ul className="space-y-3">
                      {feedback.improvements.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-3 text-[13px] font-medium text-zinc-700 dark:text-zinc-300 bg-amber-50/50 dark:bg-amber-500/5 p-3 rounded-xl border border-amber-100 dark:border-amber-500/10">
                          <XCircle size={16} className="text-amber-500 mt-0.5 shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Missing Keywords */}
                  <div>
                    <h3 className="text-sm font-bold text-red-600 dark:text-red-400 flex items-center gap-2 mb-3">
                      <Target size={16} /> Missing Hard Skills
                    </h3>
                    <p className="text-[12px] font-medium text-zinc-500 mb-3">The job description mentions these keywords, but the ATS couldn't find them in your resume:</p>
                    <div className="flex flex-wrap gap-2">
                      {feedback.missingKeywords.map(kw => (
                        <span key={kw} className="px-3 py-1.5 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400 text-[11px] font-black rounded-lg uppercase tracking-wider">
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Strengths Section */}
                  <div>
                    <h3 className="text-sm font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-2 mb-3">
                      <CheckCircle2 size={16} /> Passing Marks
                    </h3>
                    <ul className="space-y-2">
                      {feedback.strengths.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-[13px] font-medium text-zinc-600 dark:text-zinc-400">
                          <CheckCircle2 size={16} className="text-emerald-500 mt-0.5 shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                </div>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}