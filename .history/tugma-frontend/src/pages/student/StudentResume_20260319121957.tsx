import { useState, useRef } from 'react';
import { UploadCloud, FileText, CheckCircle2, AlertCircle, TrendingUp, Zap, Loader2 } from 'lucide-react';

export default function Resume() {
  // 1. New State for the Real File and API Results
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isScanned, setIsScanned] = useState(false);
  
  // Real dynamic data states
  const [atsScore, setAtsScore] = useState(0);
  const [feedback, setFeedback] = useState({ good: '', missing: '', keywords: [] as string[] });

  // 2. Reference to trigger the hidden file input
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 3. Handle when a user selects a file from their computer
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
      processResumeAPI(file);
    } else {
      alert("Please upload a valid PDF file.");
    }
  };

  // 4. THE REAL API CONNECTION FUNCTION
  const processResumeAPI = async (file: File) => {
    setIsScanning(true);
    setIsScanned(false);

    try {
      /* 🚀 HOW TO CONNECT A REAL API HERE:
        
        1. Create a FormData object to hold the PDF file
        const formData = new FormData();
        formData.append('resume', file);

        2. Send it to your backend (Node.js/Python) or an API service
        const response = await fetch('https://your-api-url.com/api/scan-resume', {
          method: 'POST',
          body: formData,
        });

        3. Get the parsed results back from your server
        const data = await response.json();
      */

      // For now, we simulate the API taking 3 seconds to "read" the PDF
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Mocking the data you would receive from an API like OpenAI
      const simulatedApiResponse = {
        score: Math.floor(Math.random() * (95 - 65 + 1)) + 65, // Random score between 65 and 95
        goodFeedback: "Excellent formatting. Your layout is easily readable by ATS bots.",
        missingFeedback: "Consider adding more quantifiable metrics to your past projects.",
        suggestedKeywords: ["Responsive Design", "Git", "API Integration"]
      };

      setAtsScore(simulatedApiResponse.score);
      setFeedback({
        good: simulatedApiResponse.goodFeedback,
        missing: simulatedApiResponse.missingFeedback,
        keywords: simulatedApiResponse.suggestedKeywords
      });

      setIsScanning(false);
      setIsScanned(true);

    } catch (error) {
      console.error("Error scanning resume:", error);
      alert("Failed to scan resume. Please try again.");
      setIsScanning(false);
    }
  };

  // Calculate the SVG circle stroke offset based on the actual score
  const circleCircumference = 351; // 2 * pi * r (where r = 56)
  const strokeDashoffset = circleCircumference - (atsScore / 100) * circleCircumference;

  return (
    <div className="space-y-6 pb-20 md:pb-8 animate-in fade-in duration-500">
      
      {/* Hidden File Input */}
      <input 
        type="file" 
        accept=".pdf" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        className="hidden" 
      />

      {/* Header */}
      <div className="bg-zinc-900 rounded-xl p-6 sm:p-8 text-white shadow-lg overflow-hidden relative">
        <div className="relative z-10">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2 flex items-center gap-3">
            <Zap className="text-yellow-400" /> TUGMA ATS Scanner
          </h1>
          <p className="text-zinc-400 max-w-xl text-sm sm:text-base">
            Upload your resume. Our Applicant Tracking System will grade your formatting, keywords, and readability to ensure employers see you at the top of their list.
          </p>
        </div>
        <div className="absolute right-0 top-0 w-64 h-64 bg-purple-600/20 blur-3xl rounded-full translate-x-1/3 -translate-y-1/3 pointer-events-none"></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* --- UPLOAD ZONE --- */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
          {!isScanned && !isScanning ? (
            
            // Upload Button UI
            <div 
              className="border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl p-12 flex flex-col items-center justify-center text-center cursor-pointer hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/10 transition-colors group"
              onClick={() => fileInputRef.current?.click()} // Trigger the hidden file input
            >
              <div className="w-16 h-16 bg-purple-100 dark:bg-purple-500/20 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <UploadCloud size={32} className="text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-1">Click to upload your resume</h3>
              <p className="text-sm text-zinc-500 mb-6">Supports PDF (Max 5MB)</p>
              <button className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-md shadow-purple-500/20">
                Browse Files
              </button>
            </div>

          ) : isScanning ? (
            
            // Scanning Animation
            <div className="h-64 flex flex-col items-center justify-center space-y-4">
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 border-4 border-zinc-100 dark:border-zinc-800 rounded-full"></div>
                <Loader2 className="absolute inset-0 w-16 h-16 text-purple-600 animate-spin" />
              </div>
              <p className="text-zinc-600 dark:text-zinc-400 font-bold animate-pulse">Uploading and Parsing PDF to API...</p>
            </div>

          ) : (
            
            // Uploaded File Success
            <div className="border border-purple-200 dark:border-purple-500/30 rounded-xl p-6 flex flex-col sm:flex-row items-center justify-between bg-purple-50/50 dark:bg-purple-500/5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 rounded-lg flex items-center justify-center shrink-0">
                  <FileText size={24} />
                </div>
                <div>
                  {/* Dynamically reads the real file name and size! */}
                  <h3 className="font-bold text-zinc-900 dark:text-white break-all line-clamp-1">{selectedFile?.name}</h3>
                  <p className="text-xs text-zinc-500 font-medium mt-0.5">
                    {(selectedFile?.size ? (selectedFile.size / 1024 / 1024).toFixed(2) : '0')} MB • Scanned successfully
                  </p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setIsScanned(false);
                  setSelectedFile(null);
                }} 
                className="mt-4 sm:mt-0 text-sm font-bold text-purple-600 dark:text-purple-400 hover:underline shrink-0"
              >
                Scan Another Resume
              </button>
            </div>
          )}
        </div>

        {/* --- DYNAMIC ATS SCOREBOARD --- */}
        <div className={`bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm transition-all duration-700 ease-out ${isScanned ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none hidden lg:block'}`}>
          <h2 className="font-bold text-zinc-900 dark:text-white mb-6 flex items-center gap-2">
            <TrendingUp className="text-purple-500" /> ATS Results
          </h2>

          <div className="flex flex-col items-center justify-center mb-8 relative">
            {/* Real dynamic progress circle based on the API score */}
            <svg className="w-32 h-32 transform -rotate-90 transition-all duration-1000 ease-out">
              <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-zinc-100 dark:text-zinc-800" />
              <circle 
                cx="64" cy="64" r="56" 
                stroke="currentColor" 
                strokeWidth="8" 
                fill="transparent" 
                strokeDasharray={circleCircumference} 
                strokeDashoffset={isScanned ? strokeDashoffset : circleCircumference} 
                className={atsScore >= 80 ? 'text-emerald-500' : atsScore >= 70 ? 'text-amber-500' : 'text-red-500'} 
                style={{ transition: 'stroke-dashoffset 1.5s ease-out' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-4xl font-black ${atsScore >= 80 ? 'text-emerald-600 dark:text-emerald-400' : atsScore >= 70 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'}`}>
                {atsScore}
              </span>
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mt-1">Match Score</span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/10">
              <CheckCircle2 size={18} className="text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-bold text-emerald-900 dark:text-emerald-400">Strengths</p>
                <p className="text-xs text-emerald-700 dark:text-emerald-500 mt-0.5">{feedback.good}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-500/10">
              <AlertCircle size={18} className="text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-bold text-amber-900 dark:text-amber-400">Needs Improvement</p>
                <p className="text-xs text-amber-700 dark:text-amber-500 mt-0.5">
                  {feedback.missing} We recommend adding these keywords:
                </p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {feedback.keywords.map(kw => (
                    <span key={kw} className="px-2 py-1 bg-amber-200/50 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 text-[10px] font-bold rounded-md">
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}