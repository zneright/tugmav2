import { useState } from 'react';
import { 
  Bell, Briefcase, MessageSquare, Zap, Plus, 
  Filter, Search, X, Send, Users, UserCheck
} from 'lucide-react';

export default function EmployerNotifications() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Mock Notifications Data (What the Employer receives)
  const [notifications] = useState([
    { id: 1, title: 'New Application Received', desc: 'Alex Johnson applied for Senior React Developer.', time: '10 mins ago', type: 'app', read: false },
    { id: 2, title: 'Interview Accepted', desc: 'Sarah Smith accepted your interview invitation for Tuesday at 2:00 PM.', time: '2 hours ago', type: 'message', read: false },
    { id: 3, title: 'Listing Expiring Soon', desc: 'Your job posting for "Marketing Intern" expires in 3 days.', time: '1 day ago', type: 'system', read: true },
    { id: 4, title: 'Weekly Analytics', desc: 'Your job postings received 342 views this week.', time: '3 days ago', type: 'system', read: true },
  ]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'app': return <UserCheck size={18} className="text-blue-500" />;
      case 'message': return <MessageSquare size={18} className="text-purple-500" />;
      default: return <Zap size={18} className="text-amber-500" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 fade-in relative">
      
      {/* --- CREATE NOTIFICATION MODAL (RESTRICTED TO APPLICANTS) --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-zinc-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 w-full max-w-md rounded-3xl p-8 shadow-2xl relative animate-in zoom-in-95 duration-200">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-6 right-6 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">
              <X size={20} />
            </button>

            <div className="mb-6">
              <h3 className="text-xl font-black text-zinc-900 dark:text-white flex items-center gap-2">
                <Plus className="text-purple-600" /> Notify Applicants
              </h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                Send updates directly to candidates who applied to your roles.
              </p>
            </div>

            <div className="space-y-4">
              
              {/* SMART FEATURE: Target Audience Dropdown */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider ml-1 flex items-center gap-1">
                  <Users size={12} /> Target Audience
                </label>
                <select className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all dark:text-white text-sm appearance-none font-medium">
                  <option value="" disabled selected>Select who receives this...</option>
                  <optgroup label="Senior React Developer">
                    <option>All Applicants (45)</option>
                    <option>Shortlisted Only (12)</option>
                  </optgroup>
                  <optgroup label="Product Marketing Manager">
                    <option>All Applicants (128)</option>
                    <option>Shortlisted Only (34)</option>
                  </optgroup>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider ml-1">Update Title</label>
                <input type="text" placeholder="e.g., Interview Process Update" className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all dark:text-white text-sm" />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider ml-1">Message Content</label>
                <textarea rows={4} placeholder="Type your message here..." className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all dark:text-white text-sm resize-none" />
              </div>

              <button 
                onClick={() => { setIsModalOpen(false); alert("Notification sent to selected applicants!"); }}
                className="w-full py-4 mt-2 rounded-2xl text-white font-bold flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 shadow-lg shadow-purple-600/20 transition-all"
              >
                <Send size={18} />
                Send Notification
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- PAGE HEADER --- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-zinc-900 dark:text-white flex items-center gap-3">
            <Bell className="text-purple-600" /> Notifications
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Stay updated on your job listings and applicant activity.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-purple-500/20 transition-all shrink-0">
            <Plus size={18} /> Notify Applicants
          </button>
          <button className="p-2.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-800 transition-colors">
            <Filter size={18} />
          </button>
        </div>
      </div>

      {/* --- SEARCH & FILTER BAR --- */}
      <div className="flex items-center justify-between bg-white dark:bg-zinc-900 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="flex items-center gap-3 flex-1 px-2">
          <Search size={16} className="text-zinc-400" />
          <input type="text" placeholder="Search notifications..." className="bg-transparent border-none outline-none text-sm text-zinc-900 dark:text-white w-full" />
        </div>
        <button className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline px-4 shrink-0">
          Mark all read
        </button>
      </div>

      {/* --- NOTIFICATIONS LIST --- */}
      <div className="space-y-3">
        {notifications.map((n) => (
          <div key={n.id} className={`group p-5 rounded-3xl border flex gap-4 items-start transition-all ${n.read ? 'bg-white dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800 opacity-80' : 'bg-white dark:bg-zinc-900 border-purple-200 dark:border-purple-500/30 shadow-md shadow-purple-500/5'}`}>
            
            <div className={`p-3.5 rounded-2xl shrink-0 ${n.read ? 'bg-zinc-50 dark:bg-zinc-800/50' : 'bg-purple-50 dark:bg-purple-500/10'}`}>
              {getIcon(n.type)}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h3 className={`text-[15px] font-bold ${n.read ? 'text-zinc-700 dark:text-zinc-300' : 'text-zinc-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors'}`}>
                  {n.title}
                </h3>
                <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider shrink-0 ml-2">{n.time}</span>
              </div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                {n.desc}
              </p>
            </div>

            {/* Unread Indicator Dot */}
            {!n.read && <div className="w-2.5 h-2.5 rounded-full bg-purple-500 mt-2.5 shrink-0 animate-pulse" />}
          </div>
        ))}
      </div>

    </div>
  );
}