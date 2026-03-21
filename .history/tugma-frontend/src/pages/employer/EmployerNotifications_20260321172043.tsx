import { useState, useEffect } from 'react';
import {
  Bell, Briefcase, MessageSquare, Zap, Plus,
  Filter, Search, X, Send, Users, UserCheck, Loader2
} from 'lucide-react';
import { auth } from '../../firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';

interface Notification {
  id: number;
  user_uid: string;
  title: string;
  message: string;
  type: string;
  is_read: number;
  created_at: string;
}

export default function EmployerNotifications() {
  const [uid, setUid] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [notifyData, setNotifyData] = useState({
    title: '',
    message: '',
    filter: ''
  });

  const [activeJobs, setActiveJobs] = useState<any[]>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUid(user.uid);
        fetchNotifications(user.uid);
        fetchEmployerJobs(user.uid);
      } else {
        setIsLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchNotifications = async (userUid: string) => {
    try {
      const response = await fetch(`http://localhost:8080/api/notifications/${userUid}`);

      // 🔥 BETTER ERROR HANDLING: Log the exact server error message
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Server Error ${response.status}`);
      }

      const data = await response.json();
      setNotifications(data);
    } catch (error: any) {
      console.error("Failed to load notifications:", error);
      alert(`Backend Error: ${error.message}\n\nDid you run the SQL to create the notifications table?`);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEmployerJobs = async (userUid: string) => {
    try {
      const response = await fetch(`http://localhost:8080/api/jobs/employer/${userUid}`);
      if (response.ok) {
        const data = await response.json();
        setActiveJobs(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Failed to load jobs:", error);
    }
  };

  const handleMarkAsRead = async (id: number) => {
    try {
      await fetch(`http://localhost:8080/api/notifications/read/${id}`, { method: 'POST' });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n));
    } catch (error) {
      console.error("Error marking read:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!uid) return;
    try {
      await fetch(`http://localhost:8080/api/notifications/read-all/${uid}`, { method: 'POST' });
      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
    } catch (error) {
      console.error("Error marking all read:", error);
    }
  };

  const handleSendNotification = async () => {
    if (!uid || !notifyData.title.trim() || !notifyData.message.trim()) {
      alert("Please fill in both the title and message.");
      return;
    }

    setIsSending(true);
    try {
      let payload: any = {
        employer_uid: uid,
        title: notifyData.title,
        message: notifyData.message
      };

      if (notifyData.filter !== 'ALL') {
        const [jobId, status] = notifyData.filter.split('_');
        payload.job_id = jobId;
        payload.status_filter = status === 'ALL' ? '' : status;
      }

      const response = await fetch('http://localhost:8080/api/notifications/send-bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (response.ok) {
        alert(`Success! Sent to ${result.count} applicants.`);
        setIsModalOpen(false);
        setNotifyData({ title: '', message: '', filter: '' });
      } else {
        alert(result.message || "Failed to send notifications.");
      }
    } catch (error: any) {
      console.error("Error sending notification:", error);
      alert(`Network error occurred: ${error.message}`);
    } finally {
      setIsSending(false);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'app': return <UserCheck size={18} className="text-blue-500" />;
      case 'message': return <MessageSquare size={18} className="text-purple-500" />;
      default: return <Zap size={18} className="text-amber-500" />;
    }
  };

  const filteredNotifications = notifications.filter(n =>
    n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    n.message.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Simple date formatter to avoid needing an external library just yet
  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-purple-600" size={40} /></div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 fade-in relative">

      {/* --- CREATE NOTIFICATION MODAL --- */}
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
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider ml-1 flex items-center gap-1">
                  <Users size={12} /> Target Audience
                </label>
                <select
                  value={notifyData.filter}
                  onChange={(e) => setNotifyData({ ...notifyData, filter: e.target.value })}
                  className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all dark:text-white text-sm appearance-none font-medium cursor-pointer"
                >
                  <option value="" disabled>Select who receives this...</option>
                  <option value="ALL">Every Single Applicant (All Jobs)</option>
                  {activeJobs.map(job => (
                    <optgroup key={job.id} label={job.title}>
                      <option value={`${job.id}_ALL`}>All Applicants for this role</option>
                      <option value={`${job.id}_Shortlisted`}>Only Shortlisted for this role</option>
                    </optgroup>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider ml-1">Update Title</label>
                <input
                  type="text"
                  value={notifyData.title}
                  onChange={(e) => setNotifyData({ ...notifyData, title: e.target.value })}
                  placeholder="e.g., Interview Process Update"
                  className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all dark:text-white text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider ml-1">Message Content</label>
                <textarea
                  rows={4}
                  value={notifyData.message}
                  onChange={(e) => setNotifyData({ ...notifyData, message: e.target.value })}
                  placeholder="Type your message here..."
                  className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all dark:text-white text-sm resize-none"
                />
              </div>

              <button
                onClick={handleSendNotification}
                disabled={isSending || !notifyData.filter || !notifyData.title}
                className="w-full py-4 mt-2 rounded-2xl text-white font-bold flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 shadow-lg shadow-purple-600/20 transition-all disabled:opacity-50"
              >
                {isSending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                {isSending ? "Sending..." : "Send Notification"}
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
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search notifications..."
            className="bg-transparent border-none outline-none text-sm text-zinc-900 dark:text-white w-full"
          />
        </div>
        <button onClick={handleMarkAllAsRead} className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline px-4 shrink-0">
          Mark all read
        </button>
      </div>

      {/* --- NOTIFICATIONS LIST --- */}
      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <div className="text-center py-16">
            <Bell size={32} className="mx-auto text-zinc-300 dark:text-zinc-700 mb-3" />
            <p className="text-zinc-500 font-bold">No notifications found.</p>
          </div>
        ) : (
          filteredNotifications.map((n) => {
            const isRead = Boolean(n.is_read);

            return (
              <div
                key={n.id}
                onMouseEnter={() => !isRead && handleMarkAsRead(n.id)}
                className={`group p-5 rounded-3xl border flex gap-4 items-start transition-all cursor-pointer ${isRead ? 'bg-white dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800 opacity-80' : 'bg-white dark:bg-zinc-900 border-purple-200 dark:border-purple-500/30 shadow-md shadow-purple-500/5'}`}
              >
                <div className={`p-3.5 rounded-2xl shrink-0 transition-colors ${isRead ? 'bg-zinc-50 dark:bg-zinc-800/50' : 'bg-purple-50 dark:bg-purple-500/10'}`}>
                  {getIcon(n.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className={`text-[15px] font-bold ${isRead ? 'text-zinc-700 dark:text-zinc-300' : 'text-zinc-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors'}`}>
                      {n.title}
                    </h3>
                    <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider shrink-0 ml-2">
                      {formatDate(n.created_at)}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                    {n.message}
                  </p>
                </div>

                {/* Unread Indicator Dot */}
                {!isRead && <div className="w-2.5 h-2.5 rounded-full bg-purple-500 mt-2.5 shrink-0 animate-pulse" />}
              </div>
            );
          })
        )}
      </div>

    </div>
  );
}