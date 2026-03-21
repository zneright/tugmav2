import { useState, useEffect } from 'react';
import {
  Search, Building2, ChevronDown, Send, LifeBuoy, Loader2, FileWarning, BookOpen, X
} from 'lucide-react';
import { auth } from '../../firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';

export default function EmployerHelp() {
  const [uid, setUid] = useState<string | null>(null);
  const [activeFaq, setActiveFaq] = useState<number | null>(0);
  const [searchQuery, setSearchQuery] = useState('');

  // Form States
  const [inquiryType, setInquiryType] = useState('Platform Bug / Glitch');
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ticketSent, setTicketSent] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUid(user.uid);
      }
    });
    return () => unsubscribe();
  }, []);

  // 🔥 NEW: SILENT AUDIT LOGGER 🔥
  const logSystemEvent = (action: string, logDetails: string) => {
    if (!uid) return;
    fetch('http://localhost:8080/api/audit/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid, action, details: logDetails })
    }).catch(err => console.error("Audit log failed (silent):", err));
  };

  // 🔥 FULLY LOADED TUGMA EMPLOYER FAQS 🔥
  const faqs = [
    // AI & ATS Features
    {
      question: "How does the AI Resume Screening (ATS) work?",
      answer: "When a student applies, Tugma's AI instantly extracts text from their attached PDF or DOCX resume and cross-references it with your specific job description. It generates a Match Score (0-100%) and a 2-3 sentence assessment highlighting their strengths and missing keywords."
    },
    {
      question: "Why did the AI assessment say 'No resume data available'?",
      answer: "This happens if the applicant did not upload a file, or uploaded an unreadable format (like a scanned image). Don't worry—our AI will still generate a Match Score based entirely on the skills and text provided in their Tugma digital profile."
    },

    // Job Postings & Pipeline
    {
      question: "Can I delete a job posting?",
      answer: "Active job postings cannot be permanently deleted to preserve the application history of students who have already applied. However, you can edit the job and change its status to 'Closed' or 'Archived' to remove it from the public job board."
    },
    {
      question: "What happens when I change an applicant's status to 'Hired'?",
      answer: "Moving an applicant to 'Hired' automatically transitions them into an Active Intern. They will instantly appear in your 'Managed Interns' roster, and the Daily Time Record (DTR) tracker will be unlocked on their student dashboard so they can begin logging hours."
    },

    // Intern Management & DTR
    {
      question: "How do I track and print an intern's DTR?",
      answer: "In the 'Managed Interns' tab, you can view the live progress of all your active interns' logged hours. Click the Printer icon next to their name to automatically generate a formatted PDF of their Official DTR, complete with a supervisor signature line."
    },
    {
      question: "How are holiday or overtime hours handled in the DTR?",
      answer: "When students log their daily hours, they have the option to flag the entry as 'Holiday / Double Credit'. If approved, the system automatically doubles the credited hours for that specific day and highlights the row in orange on the final printed PDF."
    },

    // Communications & Broadcasting
    {
      question: "Can I broadcast messages to multiple applicants at once?",
      answer: "Yes! Use the 'Notifications' tab to send bulk alerts. Our smart targeting allows you to broadcast to all applicants for a specific role, only shortlisted candidates, or specifically blast announcements to your hired, active interns."
    },
    {
      question: "I made a typo in a bulk broadcast. Can I undo it?",
      answer: "Yes. Go to the 'Sent' tab inside Notifications. Find the broadcast you want to retract and click the Trash (Unsend) icon. This will instantly and permanently delete the notification from the inboxes of all students who received it."
    },
    {
      question: "How do I private message a single applicant?",
      answer: "Navigate to the 'Messages' tab and look at your Inbox sidebar. Clicking on any applicant's name will open a private, real-time chat window where you can send text messages and request interviews."
    }
  ];

  // 🔥 REAL-TIME SEARCH FILTERING 🔥
  const filteredFaqs = faqs.filter(faq =>
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!uid) {
      setErrorMsg("You must be logged in to submit a ticket.");
      return;
    }
    if (!details.trim()) {
      setErrorMsg("Please provide details for your issue.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('http://localhost:8080/api/notifications/ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender_uid: uid,
          inquiry_type: inquiryType,
          details: details.trim()
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to submit ticket.");
      }

      // 🔥 LOG THE EVENT 🔥
      logSystemEvent('Submitted Support Ticket', `Category: ${inquiryType}`);

      setTicketSent(true);
      setDetails(''); // Clear form on success

      // Reset button state after 3 seconds
      setTimeout(() => setTicketSent(false), 3000);

    } catch (error: any) {
      console.error("Ticket Submission Error:", error);
      setErrorMsg(`Error: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 fade-in pb-10 max-w-5xl mx-auto">

      {/* Header Banner */}
      <div className="bg-zinc-900 rounded-[2rem] p-8 sm:p-12 text-center relative overflow-hidden shadow-lg border border-zinc-800">
        <div className="absolute right-0 top-0 w-64 h-64 bg-purple-600/20 blur-3xl rounded-full translate-x-1/3 -translate-y-1/3 pointer-events-none"></div>
        <div className="absolute left-0 bottom-0 w-64 h-64 bg-blue-600/20 blur-3xl rounded-full -translate-x-1/3 translate-y-1/3 pointer-events-none"></div>

        <div className="relative z-10">
          <h1 className="text-3xl sm:text-4xl font-black text-white mb-3 tracking-tight">Employer Support Center</h1>
          <p className="text-zinc-400 mb-8 max-w-lg mx-auto text-sm sm:text-base">Find quick answers on managing job postings, AI ATS scanning, and tracking intern DTR hours.</p>

          <div className="max-w-xl mx-auto relative group">
            <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-purple-500 transition-colors" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search knowledge base (e.g. 'DTR', 'AI')..."
              className="w-full pl-12 pr-4 py-3.5 bg-zinc-800/50 border border-zinc-700 rounded-2xl outline-none text-white focus:ring-2 focus:ring-purple-500/50 transition-all font-medium placeholder:text-zinc-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">

        {/* Left Col: FAQs */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2rem] p-6 sm:p-8 shadow-sm h-fit">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-6 flex items-center gap-2">
            <BookOpen className="text-blue-500" /> Knowledge Base
          </h2>

          <div className="space-y-3">
            {filteredFaqs.length === 0 ? (
              <div className="text-center py-10 bg-zinc-50 dark:bg-zinc-800/30 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-700">
                <Search className="mx-auto text-zinc-400 mb-3" size={32} />
                <p className="text-sm font-bold text-zinc-600 dark:text-zinc-300">No results found for "{searchQuery}"</p>
                <p className="text-xs text-zinc-500 mt-1">Try a different keyword or open a support ticket.</p>
              </div>
            ) : (
              filteredFaqs.map((faq, index) => (
                <div key={index} className="border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden bg-zinc-50 dark:bg-zinc-800/30 transition-colors">
                  <button
                    onClick={() => setActiveFaq(activeFaq === index ? null : index)}
                    className="w-full flex items-center justify-between p-4 text-left hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <span className="font-bold text-zinc-900 dark:text-white text-sm pr-4">{faq.question}</span>
                    <ChevronDown size={18} className={`text-zinc-400 shrink-0 transition-transform duration-300 ${activeFaq === index ? 'rotate-180' : ''}`} />
                  </button>
                  <div className={`px-4 overflow-hidden transition-all duration-300 ease-in-out ${activeFaq === index ? 'max-h-40 pb-4 opacity-100' : 'max-h-0 opacity-0'}`}>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed border-t border-zinc-200 dark:border-zinc-700 pt-3">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Col: Support Ticket Form */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2rem] p-6 sm:p-8 shadow-sm h-fit relative overflow-hidden">

          <div className="absolute -top-10 -right-10 w-40 h-40 bg-purple-500/5 blur-3xl rounded-full pointer-events-none"></div>

          <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-2 flex items-center gap-2 relative z-10">
            <LifeBuoy className="text-purple-500" /> Open a Support Ticket
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6 relative z-10">
            Need technical help or verification assistance? Send a message directly to our Admin team.
          </p>

          {/* Error Mes*/}
          {errorMsg && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl flex items-start gap-2 text-red-600 dark:text-red-400 text-sm font-bold">
              <FileWarning size={16} className="shrink-0 mt-0.5" />
              <p>{errorMsg}</p>
            </div>
          )}

          <form onSubmit={handleTicketSubmit} className="space-y-5 relative z-10">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider ml-1">Inquiry Type</label>
              <select
                value={inquiryType}
                onChange={(e) => setInquiryType(e.target.value)}
                className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-800 outline-none text-sm text-zinc-900 dark:text-white appearance-none font-bold cursor-pointer focus:ring-2 focus:ring-purple-500/20 transition-all"
              >
                <option>Platform Bug / Glitch</option>
                <option>Company Verification Setup</option>
                <option>Job Posting Issue</option>
                <option>Intern DTR / Hours Issue</option>
                <option>Report a User / Student</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider ml-1">Details</label>
              <textarea
                required
                rows={5}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Please provide details about your issue so we can help you faster..."
                className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-800 outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 text-sm text-zinc-900 dark:text-white resize-none transition-all placeholder:text-zinc-400"
              />
            </div>

            <button
              type="submit"
              disabled={ticketSent || isSubmitting || !uid}
              className={`w-full py-4 rounded-xl text-white text-sm font-black flex items-center justify-center gap-2 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed active:scale-[0.98] ${ticketSent
                ? 'bg-emerald-500 shadow-lg shadow-emerald-500/20'
                : 'bg-purple-600 hover:bg-purple-700 shadow-lg shadow-purple-500/20'
                }`}
            >
              {isSubmitting ? (
                <Loader2 size={18} className="animate-spin" />
              ) : ticketSent ? (
                "Ticket Delivered to Admin!"
              ) : (
                <><Send size={18} className={details.trim() ? "translate-x-0.5 -translate-y-0.5 transition-transform" : ""} /> Submit Ticket</>
              )}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}