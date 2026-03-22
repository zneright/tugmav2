import { useState, useEffect } from 'react';
import {
  HelpCircle, Search, FileText,
  ChevronDown, Send, LifeBuoy, Loader2, X, FileWarning
} from 'lucide-react';
import { auth } from '../../firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';

export default function StudentHelp() {
  const [uid, setUid] = useState<string | null>(null);
  const [activeFaq, setActiveFaq] = useState<number | null>(0);
  const [searchQuery, setSearchQuery] = useState('');

  // Form States
  const [inquiryType, setInquiryType] = useState('Account & Login Issues');
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
  //sys
  const logSystemEvent = (action: string, logDetails: string) => {
    if (!uid) return;
    fetch('http://localhost:8080/api/audit/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid, action, details: logDetails })
    }).catch(err => console.error("Audit log failed (silent):", err));
  };

  //  STUDENT FAQS 
  const faqs = [
    {
      question: "How does the ATS Resume Scanner work?",
      answer: "Our ATS scanner uses AI to parse your uploaded PDF or Word document. It checks for formatting readability, identifies matching keywords for your target role, and provides a score out of 100 based on industry standards to help you improve before applying."
    },
    {
      question: "How do I use the Smart Job Matchmaker?",
      answer: "Go to 'Find Jobs' and enter your desired role or location. Our AI reads your profile skills and compares them to all active employer jobs, scoring them from 0-100% so you know exactly which companies are the best fit for your talents."
    },
    {
      question: "How do I log my OJT hours?",
      answer: "Once an employer changes your application status to 'Hired', your Daily Time Record (DTR) tab will unlock. You can log your daily hours there. Your total approved hours will automatically update the progress bar on your main Dashboard."
    },
    {
      question: "Can I apply to jobs without an allowance?",
      answer: "Yes! Employers specify if a role is paid or unpaid. You can easily filter out unpaid jobs by clicking the 'Paid Allowance' button in the Find Jobs tab."
    },
    {
      question: "How do I talk to an Employer?",
      answer: "If an employer wants to interview you or send you an offer, they will message you via the 'Messages' tab. You can reply to them directly in real-time within the platform."
    }
  ];

  // SEARCH FILTERING 
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

      logSystemEvent('Submitted Support Ticket', `Category: ${inquiryType}`);

      setTicketSent(true);
      setDetails(''); 

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

      {/* Header */}
      <div className="bg-purple-600 rounded-[2rem] p-8 sm:p-12 text-center relative overflow-hidden shadow-lg border border-purple-500">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none"></div>
        <div className="relative z-10">
          <div className="w-16 h-16 bg-white/20 text-white rounded-2xl flex items-center justify-center mx-auto mb-6 backdrop-blur-sm border border-white/30 shadow-inner">
            <HelpCircle size={32} />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white mb-4 tracking-tight">How can we help you today?</h1>

          <div className="max-w-xl mx-auto relative group">
            <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-purple-600 transition-colors" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for articles, guides, or FAQs..."
              className="w-full pl-12 pr-10 py-4 bg-white rounded-2xl outline-none text-zinc-900 shadow-xl focus:ring-4 focus:ring-purple-500/30 transition-all font-medium placeholder:text-zinc-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-purple-600 transition-colors"
              >
                <X size={18} />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">

        {/*  FAQs */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2rem] p-6 sm:p-8 shadow-sm h-fit">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-6 flex items-center gap-2">
            <FileText className="text-purple-500" /> Frequently Asked Questions
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

        {/*  Support Ticket Form */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2rem] p-6 sm:p-8 shadow-sm h-fit relative overflow-hidden">

          <div className="absolute -top-10 -right-10 w-40 h-40 bg-purple-500/5 blur-3xl rounded-full pointer-events-none"></div>

          <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-2 flex items-center gap-2 relative z-10">
            <LifeBuoy className="text-purple-500" /> Contact Support
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6 relative z-10">
            Can't find what you're looking for? Send a ticket directly to the platform admins.
          </p>

          {/* Error Message Display */}
          {errorMsg && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl flex items-start gap-2 text-red-600 dark:text-red-400 text-sm font-bold">
              <FileWarning size={16} className="shrink-0 mt-0.5" />
              <p>{errorMsg}</p>
            </div>
          )}

          <form onSubmit={handleTicketSubmit} className="space-y-5 relative z-10">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider ml-1">Issue Category</label>
              <select
                value={inquiryType}
                onChange={(e) => setInquiryType(e.target.value)}
                className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-800 outline-none text-sm text-zinc-900 dark:text-white appearance-none font-bold cursor-pointer focus:ring-2 focus:ring-purple-500/20 transition-all"
              >
                <option>Account & Login Issues</option>
                <option>Resume Scanner Bug</option>
                <option>Internship / DTR Issue</option>
                <option>Report an Employer</option>
                <option>Other Bug / Glitch</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider ml-1">Message</label>
              <textarea
                required
                rows={5}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Describe your issue in detail..."
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
                "Ticket Sent Successfully!"
              ) : (
                <><Send size={18} className={details.trim() ? "translate-x-0.5 -translate-y-0.5 transition-transform" : ""} /> Submit Support Ticket</>
              )}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}