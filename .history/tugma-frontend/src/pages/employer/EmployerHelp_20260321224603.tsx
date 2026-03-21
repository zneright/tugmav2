import { useState, useEffect } from 'react';
import {
  HelpCircle, Search, Building2, ShieldCheck,
  ChevronDown, Send, LifeBuoy, Loader2
} from 'lucide-react';
import { auth } from '../../firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';

export default function EmployerHelp() {
  const [uid, setUid] = useState<string | null>(null);
  const [activeFaq, setActiveFaq] = useState<number | null>(0);

  // Form States
  const [inquiryType, setInquiryType] = useState('Company Verification Setup');
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ticketSent, setTicketSent] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) setUid(user.uid);
    });
    return () => unsubscribe();
  }, []);

  const faqs = [
    {
      question: "How do I get my company verified?",
      answer: "To ensure the safety of our students, all employers must submit a valid Business Permit or Company ID in the 'Company Profile' tab. An admin will review it within 24 hours."
    },
    {
      question: "Is there a limit to how many jobs I can post?",
      answer: "Basic employer accounts can post up to 3 active jobs simultaneously. To post unlimited jobs, please contact support about upgrading to a Pro Plan."
    },
    {
      question: "How do I log a student's OJT hours?",
      answer: "Go to the 'Managed Interns' tab. Click on an active intern's profile, and you will see a 'Log Hours' button where you can update their weekly progress."
    },
    {
      question: "Can I add other recruiters to my company account?",
      answer: "Yes. Navigate to 'Team Settings' in your sidebar dropdown. From there, you can invite colleagues via email and assign them Recruiter or Admin roles."
    }
  ];

  const handleTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uid) {
      alert("You must be logged in to submit a ticket.");
      return;
    }
    if (!details.trim()) {
      alert("Please provide details for your issue.");
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
          details: details
        })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || "Failed to submit ticket.");
      }

      setTicketSent(true);
      setDetails(''); // Clear form
      setTimeout(() => setTicketSent(false), 3000);

    } catch (error: any) {
      alert(`Error submitting ticket: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 fade-in pb-10 max-w-5xl mx-auto">

      {/* Header */}
      <div className="bg-zinc-900 rounded-3xl p-8 sm:p-12 text-center relative overflow-hidden shadow-lg border border-zinc-800">
        <div className="absolute right-0 top-0 w-64 h-64 bg-purple-600/20 blur-3xl rounded-full translate-x-1/3 -translate-y-1/3 pointer-events-none"></div>
        <div className="absolute left-0 bottom-0 w-64 h-64 bg-blue-600/20 blur-3xl rounded-full -translate-x-1/3 translate-y-1/3 pointer-events-none"></div>

        <div className="relative z-10">
          <h1 className="text-3xl sm:text-4xl font-black text-white mb-2">Employer Support Center</h1>
          <p className="text-zinc-400 mb-8 max-w-lg mx-auto">Find quick answers on managing job postings, verifying your business, and tracking intern hours.</p>

          <div className="max-w-xl mx-auto relative group">
            <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-purple-500 transition-colors" />
            <input
              type="text"
              placeholder="Search knowledge base..."
              className="w-full pl-12 pr-4 py-3.5 bg-zinc-800/50 border border-zinc-700 rounded-2xl outline-none text-white focus:ring-2 focus:ring-purple-500/50 transition-all font-medium placeholder:text-zinc-500"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">

        {/* FAQs */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm h-fit">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-6 flex items-center gap-2">
            <Building2 className="text-blue-500" /> Employer FAQs
          </h2>

          <div className="space-y-3">
            {faqs.map((faq, index) => (
              <div key={index} className="border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden bg-zinc-50 dark:bg-zinc-800/30">
                <button
                  onClick={() => setActiveFaq(activeFaq === index ? null : index)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <span className="font-bold text-zinc-900 dark:text-white text-sm">{faq.question}</span>
                  <ChevronDown size={18} className={`text-zinc-400 transition-transform duration-300 ${activeFaq === index ? 'rotate-180' : ''}`} />
                </button>
                <div className={`px-4 overflow-hidden transition-all duration-300 ease-in-out ${activeFaq === index ? 'max-h-40 pb-4 opacity-100' : 'max-h-0 opacity-0'}`}>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed border-t border-zinc-200 dark:border-zinc-700 pt-3">
                    {faq.answer}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Support Ticket Form */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm h-fit">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-2 flex items-center gap-2">
            <LifeBuoy className="text-purple-500" /> Open a Support Ticket
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">Need technical help or verification assistance? Send a message to our Admin team.</p>

          <form onSubmit={handleTicketSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider ml-1">Inquiry Type</label>
              <select
                value={inquiryType}
                onChange={(e) => setInquiryType(e.target.value)}
                className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-800 outline-none text-sm dark:text-white appearance-none font-medium cursor-pointer"
              >
                <option>Company Verification Setup</option>
                <option>Job Posting Issue</option>
                <option>Billing & Upgrades</option>
                <option>Report a User</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider ml-1">Details</label>
              <textarea
                required
                rows={5}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Please provide details about your issue..."
                className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-800 outline-none focus:ring-2 focus:ring-purple-500/20 text-sm dark:text-white resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={ticketSent || isSubmitting || !uid}
              className={`w-full py-3.5 rounded-xl text-white text-sm font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-70 ${ticketSent ? 'bg-emerald-500 shadow-lg shadow-emerald-500/20' : 'bg-purple-600 hover:bg-purple-700 shadow-lg shadow-purple-500/20'}`}
            >
              {isSubmitting ? (
                <Loader2 size={16} className="animate-spin" />
              ) : ticketSent ? (
                "Ticket Sent to Admin!"
              ) : (
                <><Send size={16} /> Submit Ticket</>
              )}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}