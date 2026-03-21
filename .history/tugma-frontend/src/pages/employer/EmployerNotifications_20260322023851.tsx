import { useState, useEffect } from 'react';
import {
  Bell, MessageSquare, Zap, Plus,
  Filter, Search, X, Send, Users, UserCheck, Loader2, Trash2, SendHorizontal, Mail, Check, ShieldAlert
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
  recipient_count?: number;
}

export default function EmployerNotifications() {
  const [uid, setUid] = useState<string | null>(null);

  // States for Tabs and Data
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

  // Recipient Modal State
  const [recipientModal, setRecipientModal] = useState<{ isOpen: boolean; data: any[]; loading: boolean }>({
    isOpen: false,
    data: [],
    loading: false
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUid(user.uid);
        fetchAllData(user.uid);
      } else {
        setIsLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchAllData = async (userUid: string) => {
    setIsLoading(true);
    try {
      const [inboxRes, sentRes, jobsRes] = await Promise.all([
        fetch(`http://localhost:8080/api/notifications/${userUid}`),
        fetch(`http://localhost:8080/api/notifications/sent/${userUid}`),
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

  const handleDeleteInbox = async (id: number) => {
    try {
      await fetch(`http://localhost:8080/api/notifications/${id}`, { method: 'DELETE' });
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (error) {
      console.error("Delete failed:", error);
    }
  };

  const handleUnsendBlast = async (e: React.MouseEvent, n: Notification) => {
    e.stopPropagation();
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
        fetchAllData(uid);
      } else {
        alert(result.message || "Failed to send notifications.");
      }
    } catch (error: any) {
      alert(`Network error occurred: ${error.message}`);
    } finally {
      setIsSending(false);
    }
  };

  const handleViewRecipients = async (n: Notification) => {
    if (viewMode !== 'sent') return;

    setRecipientModal({ isOpen: true, data: [], loading: true });
    try {
      const res = await fetch(`http://localhost:8080/api/notifications/recipients?sender_uid=${uid}&title=${encodeURIComponent(n.title)}`);

      if (res.ok) {
        const data = await res.json();
        setRecipientModal({ isOpen: true, data: data, loading: false });
      } else {
        setRecipientModal(prev => ({ ...prev, loading: false }));
      }
    } catch (error) {
      console.error("Failed to load recipients", error);
      setRecipientModal(prev => ({ ...prev, loading: false }));
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'app': return <UserCheck size={18} className="text-blue-500" />;
      case 'message': return <MessageSquare size={18} className="text-purple-500" />;
      case 'alert': return <ShieldAlert size={18} className="text-amber-500" />;
      default: return <Zap size={18} className="text-zinc-500" />;
    }
  };

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
    <div className="max-w-4xl mx-auto space-y-6 fade-in relative pb-20 px-4 sm:px-0">

      {/* --- RECIPIENT LIST MODAL --- */}
      {recipientModal.isOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
            <div className="p-4 sm:p-6 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center shrink-0">
              <h3 className="text-lg font-black text-zinc-900 dark:text-white">Broadcast Recipients</h3>
              <button onClick={() => setRecipientModal({ ...recipientModal, isOpen: false })} className="p-2 hover:bg-zinc-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-full transition-colors shrink-0">
                <X size={20} />
              </button>
            </div>

            <div className="overflow-y-auto p-4 space-y-2 custom-scrollbar">
              {recipientModal.loading ? (
                <div className="py-10 flex justify-center"><Loader2 className="animate-spin text-purple-600" /></div>
              ) : recipientModal.data.length === 0 ? (
                <p className="text-center py-10 text-zinc-500">No recipient data found.</p>
              ) : (
                recipientModal.data.map((r, i) => (
                  <div key={i} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-700 gap-3 sm:gap-2">
                    <div className="flex items-center gap-3 min-w-0 w-full sm:w-auto">
                      <div className="w-10 h-10 shrink-0 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 font-bold">
                        {r.first_name[0]}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-zinc-900 dark:text-white truncate">{r.first_name} {r.last_name}</p>
                        <p className="text-xs text-zinc-500 flex items-center gap-1 truncate">
                          <Mail size={10} className="shrink-0" /> <span className="truncate">{r.email}</span>
                        </p>
                      </div>
                    </div>
                    <div className="shrink-0 w-full sm:w-auto flex justify-end">
                      {r.is_read == 1 ? (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 rounded-md border border-emerald-100 dark:border-emerald-800">
                          <Check size={12} /> READ
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-md border border-zinc-200 dark:border-zinc-700">
                          SENT
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- CREATE NOTIFICATION MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-zinc-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 w-full max-w-md rounded-3xl p-6 sm:p-8 shadow-2xl relative animate-in zoom-in-95 duration-200">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 sm:top-6 sm:right-6 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">
              <X size={20} />
            </button>

            <div className="mb-6 pr-6">
              <h3 className="text-lg sm:text-xl font-black text-zinc-900 dark:text-white flex items-center gap-2">
                <Plus className="text-purple-600 shrink-0" /> Notify Candidates
              </h3>
              <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                Send updates directly to specific groups of applicants.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] sm:text-xs font-bold text-zinc-400 uppercase tracking-wider ml-1 flex items-center gap-1">
                  <Users size={12} /> Target Audience
                </label>
                <select
                  value={notifyData.filter}
                  onChange={(e) => setNotifyData({ ...notifyData, filter: e.target.value })}
                  className="w-full px-3 py-3 sm:px-4 sm:py-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all dark:text-white text-sm appearance-none font-medium cursor-pointer"
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
                <label className="text-[11px] sm:text-xs font-bold text-zinc-400 uppercase tracking-wider ml-1">Update Title</label>
                <input
                  type="text"
                  value={notifyData.title}
                  onChange={(e) => setNotifyData({ ...notifyData, title: e.target.value })}
                  placeholder="e.g., Important Announcement"
                  className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all dark:text-white text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] sm:text-xs font-bold text-zinc-400 uppercase tracking-wider ml-1">Message Content</label>
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
                className="w-full py-3.5 sm:py-4 mt-2 rounded-2xl text-white font-bold flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 shadow-lg shadow-purple-600/20 transition-all disabled:opacity-50"
              >
                {isSending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                {isSending ? "Sending..." : "Send Notification"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- PAGE HEADER --- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 sm:pt-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white flex items-center gap-3">
            <Bell className="text-purple-600 shrink-0" /> Communications
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Manage your inbox and review messages sent to applicants.
          </p>
        </div>

        <button onClick={() => setIsModalOpen(true)} className="flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white w-full sm:w-auto px-5 py-3 rounded-xl text-sm font-bold shadow-lg shadow-purple-500/20 transition-all shrink-0">
          <Plus size={18} /> New Broadcast
        </button>
      </div>

      {/* --- INBOX */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 sm:gap-4 bg-white dark:bg-zinc-900 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">

        {/* TABS */}
        <div className="flex gap-1 bg-zinc-100 dark:bg-zinc-800/50 p-1 rounded-xl overflow-x-auto custom-scrollbar w-full sm:w-auto shrink-0">
          <button
            onClick={() => setViewMode('inbox')}
            className={`flex-1 sm:flex-none px-5 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${viewMode === 'inbox' ? 'bg-white dark:bg-zinc-700 text-purple-600 dark:text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200'}`}
          >
            Inbox
          </button>
          <button
            onClick={() => setViewMode('sent')}
            className={`flex-1 sm:flex-none justify-center px-5 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-1 whitespace-nowrap ${viewMode === 'sent' ? 'bg-white dark:bg-zinc-700 text-purple-600 dark:text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200'}`}
          >
            Sent <SendHorizontal size={14} className={viewMode === 'sent' ? 'text-purple-600 dark:text-white shrink-0' : 'shrink-0'} />
          </button>
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 flex-1 md:w-64 bg-zinc-50 dark:bg-zinc-800/50 px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 focus-within:ring-2 focus-within:ring-purple-500/20 transition-all min-w-[200px]">
            <Search size={16} className="text-zinc-400 shrink-0" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search..."
              className="bg-transparent border-none outline-none text-sm text-zinc-900 dark:text-white w-full min-w-0"
            />
          </div>
          {viewMode === 'inbox' && notifications.some(n => n.is_read == 0) && (
            <button onClick={handleMarkAllAsRead} className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline shrink-0 w-full sm:w-auto text-right sm:text-left">
              Mark all read
            </button>
          )}
        </div>
      </div>

      {/* NOTIFICATIONS LIST */}
      <div className="space-y-3">
        {filteredList.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800">
            <Bell size={32} className="mx-auto text-zinc-300 dark:text-zinc-700 mb-3" />
            <p className="text-zinc-500 font-bold">{viewMode === 'inbox' ? 'Your inbox is empty.' : 'You haven\'t sent any broadcasts yet.'}</p>
          </div>
        ) : (
          filteredList.map((n) => {
            const isRead = viewMode === 'sent' ? true : Boolean(n.is_read);
            const isAlert = n.type === 'alert';

            let cardClass = 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800';
            if (viewMode === 'sent') {
              cardClass = 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-purple-400 shadow-sm';
            } else if (isAlert) {
              cardClass = isRead ? 'bg-white dark:bg-zinc-900 border-amber-100 dark:border-amber-900/30 opacity-90' : 'bg-amber-50/30 dark:bg-amber-500/5 border-amber-200 dark:border-amber-500/30 shadow-md shadow-amber-500/10 hover:border-amber-400';
            } else {
              cardClass = isRead ? 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 opacity-80' : 'bg-white dark:bg-zinc-900 border-purple-200 dark:border-purple-500/30 shadow-md shadow-purple-500/5 hover:border-purple-400';
            }

            return (
              <div
                key={n.id}
                onClick={() => viewMode === 'sent' && handleViewRecipients(n)}
                onMouseEnter={() => !Boolean(n.is_read) && viewMode === 'inbox' && handleMarkAsRead(n.id)}
                className={`group p-4 sm:p-5 rounded-3xl border flex gap-3 sm:gap-4 items-start transition-all cursor-pointer ${cardClass}`}
              >

                {viewMode === 'inbox' && (
                  <div className={`p-3 sm:p-3.5 rounded-2xl shrink-0 mt-1 transition-colors ${isAlert
                    ? (isRead ? 'bg-amber-50 dark:bg-amber-900/10' : 'bg-amber-100 dark:bg-amber-500/20')
                    : (isRead ? 'bg-zinc-100 dark:bg-zinc-800/50' : 'bg-purple-100 dark:bg-purple-500/20')
                    }`}>
                    {getIcon(n.type)}
                  </div>
                )}

                <div className="flex-1 min-w-0 pt-1">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2 mb-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className={`text-[14px] sm:text-[15px] font-bold ${isAlert && !isRead && viewMode === 'inbox'
                        ? 'text-amber-700 dark:text-amber-400'
                        : (viewMode === 'sent' ? 'text-zinc-900 dark:text-white' : 'text-zinc-700 dark:text-zinc-300')
                        }`}>
                        {n.title}
                      </h3>
                      {viewMode === 'sent' && (
                        <span className="text-[10px] font-bold bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-md flex items-center gap-1 shrink-0">
                          Click to view recipients ({n.recipient_count})
                        </span>
                      )}
                      {/*Admin Alerts */}
                      {isAlert && viewMode === 'inbox' && (
                        <span className="text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-900/50 shrink-0">
                          System Alert
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] sm:text-[11px] font-bold text-zinc-400 uppercase tracking-wider shrink-0">{formatDate(n.created_at)}</span>
                  </div>
                  <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed pr-2 sm:pr-8">{n.message}</p>
                </div>

                <div className="flex flex-col items-center justify-between gap-4 self-stretch pt-2 shrink-0">
                  {!Boolean(n.is_read) ? (
                    <div className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-purple-500 shrink-0 animate-pulse" />
                  ) : <div className="w-2 sm:w-2.5 h-2 sm:h-2.5 shrink-0" />}

                  {viewMode === 'inbox' ? (
                    <button onClick={(e) => { e.stopPropagation(); handleDeleteInbox(n.id); }} className="p-1.5 sm:p-2 text-zinc-300 hover:text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-500/20 rounded-xl transition-colors md:opacity-0 md:group-hover:opacity-100 focus:opacity-100 shrink-0">
                      <Trash2 size={16} />
                    </button>
                  ) : (
                    <button onClick={(e) => handleUnsendBlast(e, n)} className="p-1.5 sm:p-2 text-zinc-300 hover:text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-500/20 rounded-xl transition-colors md:opacity-0 md:group-hover:opacity-100 shrink-0" title="Delete Blast">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
}