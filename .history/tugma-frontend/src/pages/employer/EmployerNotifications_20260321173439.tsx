import { useState, useEffect } from 'react';
import {
  Bell, MessageSquare, Zap, Plus,
  Filter, Search, X, Send, Users, UserCheck, Loader2, Trash2, SendHorizontal
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
  recipient_count?: number; // Only exists for sent messages
}

export default function EmployerNotifications() {
  const [uid, setUid] = useState<string | null>(null);

  // 🔥 THE MISSING STATES FOR SENT TAB
  const [viewMode, setViewMode] = useState<'inbox' | 'sent'>('inbox');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [sentNotifications, setSentNotifications] = useState<Notification[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [notifyData, setNotifyData] = useState({ title: '', message: '', filter: '' });
  const [activeJobs, setActiveJobs] = useState<any[]>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUid(user.uid);
        fetchAllData(user.uid); // Fetch everything at once
      } else {
        setIsLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // 🔥 THE MISSING FETCH LOGIC
  const fetchAllData = async (userUid: string) => {
    setIsLoading(true);
    try {
      const [inboxRes, sentRes, jobsRes] = await Promise.all([
        fetch(`http://localhost:8080/api/notifications/${userUid}`),
        fetch(`http://localhost:8080/api/notifications/sent/${userUid}`), // Fetches sent blasts
        fetch(`http://localhost:8080/api/jobs/employer/${userUid}`)
      ]);

      if (inboxRes.ok) {
        const inboxData = await inboxRes.json();
        setNotifications(Array.isArray(inboxData) ? inboxData : []);
      }

      if (sentRes.ok) {
        const sentData = await sentRes.json();
        setSentNotifications(Array.isArray(sentData) ? sentData : []);
      }

      if (jobsRes.ok) {
        const jobsData = await jobsRes.json();
        setActiveJobs(Array.isArray(jobsData) ? jobsData : []);
      }
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setIsLoading(false);
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

  // DELETE INBOX NOTIFICATION
  const handleDeleteInbox = async (id: number) => {
    try {
      await fetch(`http://localhost:8080/api/notifications/${id}`, { method: 'DELETE' });
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (error) {
      console.error("Delete failed:", error);
    }
  };

  // UNSEND / DELETE SENT BLAST
  const handleUnsendBlast = async (n: Notification) => {
    if (!confirm("Are you sure you want to unsend this? It will be removed from all applicants' inboxes.")) return;

    try {
      await fetch(`http://localhost:8080/api/notifications/delete-blast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sender_uid: uid, title: n.title, message: n.message })
      });
      setSentNotifications(prev => prev.filter(sent => !(sent.title === n.title && sent.message === n.message)));
    } catch (error) {
      console.error("Unsend failed:", error);
    }
  };

  // SEND BULK NOTIFICATION
  const handleSendNotification = async () => {
    if (!uid || !notifyData.title.trim() || !notifyData.message.trim() || !notifyData.filter) {
      alert("Please fill in the audience, title, and message.");
      return;
    }

    setIsSending(true);
    try {
      let payload: any = { employer_uid: uid, title: notifyData.title, message: notifyData.message };
      const [jobId, status] = notifyData.filter.split('|');

      if (jobId && jobId !== 'ALL') payload.job_id = jobId;
      if (status && status !== 'ALL') payload.status_filter = status;

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
        fetchAllData(uid); // 🔥 Refreshes Sent tab instantly after sending
      } else {
        alert(result.message || "Failed to send notifications.");
      }
    } catch (error: any) {
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

  // Control which list is currently visible
  const activeList = viewMode === 'inbox' ? notifications : sentNotifications;
  const filteredList = activeList.filter(n =>
    n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    n.message.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    try {
      const d = new Date(dateString);
      if (isNaN(d.getTime())) return 'Recently';
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return 'Recently';
    }
  };
  
  if (isLoading) return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-purple-600" size={40} /></div>;
  
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
                <Plus className="text-purple-600" /> Notify Candidates
              </h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                Send updates directly to specific groups of applicants.
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
                  <optgroup label="Global Broadcast">
                    <option value="ALL|ALL">Every Single Applicant (All Jobs)</option>
                    <option value="ALL|Hired">All Hired Interns (Across all roles)</option>
                  </optgroup>
                  {activeJobs.map(job => (
                    <optgroup key={job.id} label={job.title}>
                      <option value={`${job.id}|ALL`}>All Applicants for this role</option>
                      <option value={`${job.id}|Shortlisted`}>Only Shortlisted for this role</option>
                      <option value={`${job.id}|Hired`}>Only Hired for this role</option>
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
                  placeholder="e.g., Important Announcement"
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
            <Bell className="text-purple-600" /> Communications
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Manage your inbox and review messages sent to applicants.
          </p>
        </div>

        <button onClick={() => setIsModalOpen(true)} className="flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-5 py-3 rounded-xl text-sm font-bold shadow-lg shadow-purple-500/20 transition-all shrink-0">
          <Plus size={18} /> New Broadcast
        </button>
      </div>

      {/* --- INBOX / SENT TABS & CONTROLS --- */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white dark:bg-zinc-900 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">

        {/* 🔥 THE TABS 🔥 */}
        <div className="flex gap-1 bg-zinc-100 dark:bg-zinc-800/50 p-1 rounded-xl">
          <button
            onClick={() => setViewMode('inbox')}
            className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'inbox' ? 'bg-white dark:bg-zinc-700 text-purple-600 dark:text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200'}`}
          >
            Inbox
          </button>
          <button
            onClick={() => setViewMode('sent')}
            className={`px-5 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-1 ${viewMode === 'sent' ? 'bg-white dark:bg-zinc-700 text-purple-600 dark:text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200'}`}
          >
            Sent <SendHorizontal size={14} className={viewMode === 'sent' ? 'text-purple-600 dark:text-white' : ''} />
          </button>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 flex-1 md:w-64 bg-zinc-50 dark:bg-zinc-800/50 px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 focus-within:ring-2 focus-within:ring-purple-500/20 transition-all">
            <Search size={16} className="text-zinc-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search..."
              className="bg-transparent border-none outline-none text-sm text-zinc-900 dark:text-white w-full"
            />
          </div>
          {viewMode === 'inbox' && (
            <button onClick={handleMarkAllAsRead} className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline shrink-0">
              Mark all read
            </button>
          )}
        </div>
      </div>

      {/* --- NOTIFICATIONS LIST --- */}
      <div className="space-y-3">
        {filteredList.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800">
            <Bell size={32} className="mx-auto text-zinc-300 dark:text-zinc-700 mb-3" />
            <p className="text-zinc-500 font-bold">{viewMode === 'inbox' ? 'Your inbox is empty.' : 'You haven\'t sent any broadcasts yet.'}</p>
          </div>
        ) : (
          filteredList.map((n) => {
            const isRead = viewMode === 'sent' ? true : Boolean(n.is_read);

            return (
              <div
                key={n.id}
                onMouseEnter={() => !isRead && viewMode === 'inbox' && handleMarkAsRead(n.id)}
                className={`group p-5 rounded-3xl border flex gap-4 items-start transition-all cursor-pointer ${isRead ? 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800' : 'bg-white dark:bg-zinc-900 border-purple-200 dark:border-purple-500/30 shadow-md shadow-purple-500/5'}`}
              >
                <div className={`p-3.5 rounded-2xl shrink-0 transition-colors ${isRead ? 'bg-zinc-50 dark:bg-zinc-800/50' : 'bg-purple-50 dark:bg-purple-500/10'}`}>
                  {viewMode === 'sent' ? <SendHorizontal size={18} className="text-emerald-500" /> : getIcon(n.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <h3 className={`text-[15px] font-bold ${isRead ? 'text-zinc-700 dark:text-zinc-300' : 'text-zinc-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors'}`}>
                        {n.title}
                      </h3>
                      {viewMode === 'sent' && n.recipient_count && (
                        <span className="text-[10px] font-bold bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 px-2 py-0.5 rounded-md">
                          Sent to {n.recipient_count}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider shrink-0 ml-2">
                      {formatDate(n.created_at)}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed pr-8">
                    {n.message}
                  </p>
                </div>

                {/* Status Dot / Delete Button */}
                <div className="flex flex-col items-end gap-2 shrink-0">
                  {!isRead && <div className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-pulse" />}

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      viewMode === 'inbox' ? handleDeleteInbox(n.id) : handleUnsendBlast(n);
                    }}
                    className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                    title={viewMode === 'sent' ? 'Unsend this blast' : 'Delete notification'}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
}