import { useState } from 'react';
import { 
  HelpCircle, Search, MessageSquare, FileText, 
  ChevronDown, Send, LifeBuoy 
} from 'lucide-react';

export default function StudentHelp() {
  const [activeFaq, setActiveFaq] = useState<number | null>(0);
  const [ticketSent, setTicketSent] = useState(false);

  const faqs = [
    { 
      question: "How does the ATS Resume Scanner work?", 
      answer: "Our ATS scanner uses AI to parse your uploaded PDF. It checks for formatting readability, identifies matching keywords for your target role, and provides a score out of 100 based on industry standards." 
    },
    { 
      question: "How do I log my OJT hours?", 
      answer: "Once an employer hires you, they will appear in your 'Connected Employers' tab. Your employer will log and approve your weekly hours there, which automatically updates your Dashboard progress bar." 
    },
    { 
      question: "Can I apply to jobs without an allowance?", 
      answer: "Yes! Employers specify if a role has an allowance or not. You can filter jobs based on your preference in the 'Find Jobs' tab." 
    },
    { 
      question: "How long does it take for employers to respond?", 
      answer: "Most verified employers on Tugma respond within 3 to 5 business days. You can track the status of your application in your Dashboard." 
    }
  ];

  const handleTicketSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTicketSent(true);
    setTimeout(() => setTicketSent(false), 3000); // Reset after 3 seconds
  };

  return (
    <div className="space-y-6 fade-in pb-10 max-w-5xl mx-auto">
      
      {/* Header */}
      <div className="bg-purple-600 rounded-3xl p-8 sm:p-12 text-center relative overflow-hidden shadow-lg">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none"></div>
        <div className="relative z-10">
          <div className="w-16 h-16 bg-white/20 text-white rounded-2xl flex items-center justify-center mx-auto mb-6 backdrop-blur-sm border border-white/30">
            <HelpCircle size={32} />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white mb-4">How can we help you today?</h1>
          
          <div className="max-w-xl mx-auto relative group">
            <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-purple-600 transition-colors" />
            <input 
              type="text" 
              placeholder="Search for articles, guides, or FAQs..." 
              className="w-full pl-12 pr-4 py-4 bg-white rounded-2xl outline-none text-zinc-900 shadow-xl focus:ring-4 focus:ring-purple-500/30 transition-all font-medium"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        
        {/* FAQs */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm h-fit">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-6 flex items-center gap-2">
            <FileText className="text-purple-500" /> Frequently Asked Questions
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
            <LifeBuoy className="text-purple-500" /> Contact Support
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">Can't find what you're looking for? Send a ticket directly to the platform admins.</p>

          <form onSubmit={handleTicketSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider ml-1">Issue Category</label>
              <select className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-800 outline-none text-sm dark:text-white appearance-none font-medium">
                <option>Account & Login Issues</option>
                <option>Resume Scanner Bug</option>
                <option>Report an Employer</option>
                <option>Other</option>
              </select>
            </div>
            
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider ml-1">Message</label>
              <textarea required rows={5} placeholder="Describe your issue in detail..." className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-800 outline-none focus:ring-2 focus:ring-purple-500/20 text-sm dark:text-white resize-none" />
            </div>

            <button 
              type="submit" 
              disabled={ticketSent}
              className={`w-full py-3.5 rounded-xl text-white text-sm font-bold flex items-center justify-center gap-2 transition-all ${ticketSent ? 'bg-emerald-500 shadow-lg shadow-emerald-500/20' : 'bg-purple-600 hover:bg-purple-700 shadow-lg shadow-purple-500/20'}`}
            >
              {ticketSent ? "Ticket Sent Successfully!" : <><Send size={16} /> Submit Support Ticket</>}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}