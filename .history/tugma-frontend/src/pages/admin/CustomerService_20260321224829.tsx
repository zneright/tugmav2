import { useState, useEffect } from 'react';
import {
  Bell, Megaphone, X, Send, ShieldAlert, Loader2, Trash2,
  Users, Mail, Ticket, CheckCircle2, Building2, GraduationCap, Inbox
} from 'lucide-react';
import { auth } from '../../firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';

interface Broadcast {
  id: number;
  title: string;
  message: string;
  created_at: string;
  recipient_count: number;
}

interface SupportTicket {
  id: number;
  title: string;
  message: string;
  type: string;
  is_read: number;
  created_at: string;
  sender_name: string;
  sender_email: string;
  sender_role: string;
}

export default function AdminNotification() {
  const [uid, setUid] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'tickets' | 'broadcasts'>('tickets');

  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [broadcastData, setBroadcastData] = useState({
    title: '',
    message: '',
    target: 'ALL'
  });

  const [recipientModal, setRecipientModal] = useState<{ isOpen: boolean; data: any[]; loading: boolean }>({
    isOpen: false, data: [], loading: false
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

  const fetchAllData = async (adminUid: string) => {
    setIsLoading(true);
    try {
      const [inboxRes, sentRes] = await Promise.all([
        fetch(`http://localhost:8080/api/notifications/${adminUid}`),
        fetch(`http://localhost:8080/api/notifications/sent/${adminUid}`)
      ]);

      if (inboxRes.ok) {
        const inboxData = await inboxRes.json();
        setTickets(Array.isArray(inboxData) ? inboxData : []);
      }

      if (sentRes.ok) {
        const sentData = await sentRes.json();
        setBroadcasts(Array.isArray(sentData) ? sentData : []);
      }
    } catch (error) {
      console.error("Failed to load notifications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendBroadcast = async () => {
    if (!uid || !broadcastData.title.trim() || !broadcastData.message.trim()) {
      alert("Please fill in both the title and message.");
      return;
    }

    setIsSending(true);
    try {
      const response = await fetch('http://localhost:8080/api/notifications/admin-broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          admin_uid: uid,
          title: broadcastData.title,
          message: broadcastData.message,
          target_audience: broadcastData.target
        })
      });

      const result = await response.json();

      if (response.ok) {
        alert(`Success! Broadcast sent to ${result.count} users.`);
        setIsModalOpen(false);
        setBroadcastData({ title: '', message: '', target: 'ALL' });
        fetchAllData(uid);
      } else {
        alert(result.message || "Failed to send broadcast.");
      }
    } catch (error: any) {
      alert(`Network error occurred: ${error.message}`);
    } finally {
      setIsSending(false);
    }
  };

  const handleUnsendBroadcast = async (e: React.MouseEvent, b: Broadcast) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to unsend this broadcast? It will instantly disappear from all users' inboxes.")) return;

    try {
      await fetch(`http://localhost:8080/api/notifications/delete-blast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sender_uid: uid, title: b.title, message: b.message })
      });
      setBroadcasts(prev => prev.filter(sent => !(sent.title === b.title && sent.message === b.message)));
    } catch (error) {
      console.error("Unsend failed:", error);
    }
  };

  const handleResolveTicket = async (id: number) => {
    try {
      await fetch(`http://localhost:8080/api/notifications/${id}`, { method: 'DELETE' });
      setTickets(prev => prev.filter(t => t.id !== id));
    } catch (error) {
      console.error("Failed to resolve ticket:", error);
    }
  };

  const handleViewRecipients = async (b: Broadcast) => {
    setRecipientModal({ isOpen: true, data: [], loading: true });
    try {
      const params = new URLSearchParams({ sender_uid: uid || '', title: b.title, message: b.message });
      const res = await fetch(`http://localhost:8080/api/notifications/recipients?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setRecipientModal({ isOpen: true, data: Array.isArray(data) ? data : [], loading: false });
      }
    } catch (error) {
      setRecipientModal(prev => ({ ...prev, loading: false }));
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const d = new Date(dateString);
      if (isNaN(d.getTime())) return 'Recently';
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return 'Recently';
    }
  };

  if (isLoading) return <div className="flex justify-center items-center h-[70vh]"><Loader2 className="animate-spin text-red-600" size={40} /></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6 fade-in relative pb-10">

      {/* --- PAGE HEADER & CONTROLS --- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-zinc-900 dark:text-white flex items-center gap-3">
            <Bell className="text-red-600" /> System Communications
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Manage incoming support tickets and outgoing platform broadcasts.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-5 py-3 rounded-xl text-sm font-bold shadow-lg shadow-red-500/20 transition-all shrink-0">
          <Megaphone size={18} /> New Broadcast
        </button>
      </div>

      {/* --- TABS --- */}
      <div className="flex bg-white dark:bg-zinc-900 p-2 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm w-fit">
        <button
          onClick={() => setViewMode('tickets')}
          className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${viewMode === 'tickets' ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'}`}
        >
          <Inbox size={16} className={viewMode === 'tickets' ? 'text-blue-500' : ''} />
          Support Tickets
          {tickets.length > 0 && <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full ml-1">{tickets.length}</span>}
        </button>
        <button
          onClick={() => setViewMode('broadcasts')}
          className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${viewMode === 'broadcasts' ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'}`}
        >
          <Send size={16} className={viewMode === 'broadcasts' ? 'text-red-500' : ''} />
          Broadcast History
        </button>
      </div>

      {/* --- CONTENT AREA --- */}
      <div className="space-y-4">

        {/* VIEW 1: SUPPORT TICKETS (INBOX) */}
        {viewMode === 'tickets' && (
          tickets.length === 0 ? (
            <div className="text-center py-20 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
              <CheckCircle2 size={40} className="mx-auto text-emerald-400 dark:text-emerald-500 mb-4" />
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Inbox Zero</h3>
              <p className="text-sm text-zinc-500 mt-1">There are no pending support tickets.</p>
            </div>
          ) : (
            tickets.map((t) => (
              <div key={t.id} className="p-5 rounded-3xl border bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-blue-300 dark:hover:border-blue-900/50 flex gap-4 items-start transition-all shadow-sm">
                <div className="p-3.5 rounded-2xl shrink-0 bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-900/20">
                  <Ticket size={20} className="text-blue-600 dark:text-blue-400" />
                </div>

                <div className="flex-1 min-w-0 pt-0.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-[15px] font-bold text-zinc-900 dark:text-white leading-tight">{t.title}</h3>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 border whitespace-nowrap uppercase tracking-wider
                        ${t.sender_role === 'employer' ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-500/20 dark:text-purple-400 dark:border-purple-500/30' : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30'}`}>
                        {t.sender_role === 'employer' ? <Building2 size={10} /> : <GraduationCap size={10} />}
                        {t.sender_role}
                      </span>
                    </div>
                    <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider shrink-0">
                      {formatDate(t.created_at)}
                    </span>
                  </div>

                  <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800 mt-2">
                    "{t.message}"
                  </p>

                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-[10px] font-bold text-zinc-600 dark:text-zinc-300">
                        {t.sender_name?.charAt(0) || 'U'}
                      </div>
                      <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300">{t.sender_name}</p>
                      <span className="text-zinc-300 dark:text-zinc-600">•</span>
                      <p className="text-xs text-zinc-500">{t.sender_email}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <a href={`mailto:${t.sender_email}?subject=Re: ${t.title}`} className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5">
                        <Mail size={14} /> Reply
                      </a>
                      <button onClick={() => handleResolveTicket(t.id)} className="px-4 py-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-500/10 dark:hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 border border-blue-200 dark:border-blue-900/30">
                        <CheckCircle2 size={14} /> Resolve
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )
        )}

        {/* VIEW 2: BROADCAST HISTORY */}
        {viewMode === 'broadcasts' && (
          broadcasts.length === 0 ? (
            <div className="text-center py-20 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
              <ShieldAlert size={40} className="mx-auto text-zinc-300 dark:text-zinc-700 mb-4" />
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white">No active broadcasts</h3>
              <p className="text-sm text-zinc-500 mt-1">System alerts you send will appear here.</p>
            </div>
          ) : (
            broadcasts.map((b) => (
              <div key={b.id} onClick={() => handleViewRecipients(b)} className="group p-5 rounded-3xl border bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-red-300 dark:hover:border-red-900/50 flex gap-4 items-start transition-all shadow-sm cursor-pointer">
                <div className="p-3.5 rounded-2xl shrink-0 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-900/20">
                  <ShieldAlert size={18} className="text-red-600 dark:text-red-400" />
                </div>

                <div className="flex-1 min-w-0 pt-0.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-1 gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-[15px] font-bold text-zinc-900 dark:text-white leading-tight group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">{b.title}</h3>
                      <span className="text-[10px] font-bold bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400 px-2 py-0.5 rounded-md flex items-center gap-1 border border-red-200 dark:border-red-500/30 whitespace-nowrap transition-colors">
                        <Users size={10} /> Click to view recipients ({b.recipient_count})
                      </span>
                    </div>
                    <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider shrink-0">
                      {formatDate(b.created_at)}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed pr-8 mt-1">{b.message}</p>
                </div>

                <div className="flex flex-col items-end shrink-0">
                  <button onClick={(e) => handleUnsendBroadcast(e, b)} className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all opacity-0 group-hover:opacity-100" title="Unsend this broadcast">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )
        )}
      </div>

      {/* --- MODALS --- */}

      {/* 1. Recipient List Modal */}
      {recipientModal.isOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-950/50">
              <div>
                <h3 className="text-lg font-black text-zinc-900 dark:text-white flex items-center gap-2">
                  <Users size={18} className="text-red-500" /> Broadcast Recipients
                </h3>
              </div>
              <button onClick={() => setRecipientModal({ ...recipientModal, isOpen: false })} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800">
                <X size={18} className="text-zinc-500" />
              </button>
            </div>

            <div className="max-h-[400px] overflow-y-auto p-4 space-y-2 custom-scrollbar">
              {recipientModal.loading ? (
                <div className="py-10 flex justify-center"><Loader2 className="animate-spin text-red-600" /></div>
              ) : recipientModal.data.length === 0 ? (
                <p className="text-center py-10 text-zinc-500">No recipient data found.</p>
              ) : (
                recipientModal.data.map((r, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-700 hover:border-red-200 dark:hover:border-red-900/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 font-bold border border-red-200 dark:border-red-800/30">
                        {r.first_name[0]}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-zinc-900 dark:text-white">{r.first_name} {r.last_name}</p>
                        <p className="text-xs text-zinc-500 flex items-center gap-1"><Mail size={10} /> {r.email}</p>
                      </div>
                    </div>
                    {r.is_read == 1 ? (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 dark:border-emerald-800/30 dark:bg-emerald-500/10 px-2 py-1 rounded-md"><CheckCircle2 size={12} /> READ</span>
                    ) : (
                      <span className="text-[10px] font-bold text-zinc-500 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-2 py-1 rounded-md">DELIVERED</span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. Create Broadcast Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-zinc-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 w-full max-w-md rounded-3xl p-8 shadow-2xl relative animate-in zoom-in-95 duration-200">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-6 right-6 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">
              <X size={20} />
            </button>

            <div className="mb-6">
              <h3 className="text-xl font-black text-zinc-900 dark:text-white flex items-center gap-2">
                <Megaphone className="text-red-500" /> Global Broadcast
              </h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Push an urgent alert to the platform network.</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider ml-1 flex items-center gap-1">
                  <Users size={12} /> Target Audience
                </label>
                <select
                  value={broadcastData.target}
                  onChange={(e) => setBroadcastData({ ...broadcastData, target: e.target.value })}
                  className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-red-500/20 outline-none transition-all dark:text-white text-sm appearance-none font-medium cursor-pointer"
                >
                  <option value="ALL">Entire Platform (All Users)</option>
                  <option value="student">Students / Applicants Only</option>
                  <option value="employer">Employers / Partners Only</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider ml-1">Alert Title</label>
                <input
                  type="text"
                  value={broadcastData.title}
                  onChange={(e) => setBroadcastData({ ...broadcastData, title: e.target.value })}
                  placeholder="e.g., Scheduled Maintenance"
                  className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-red-500/20 outline-none transition-all dark:text-white text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider ml-1">Alert Content</label>
                <textarea
                  rows={4}
                  value={broadcastData.message}
                  onChange={(e) => setBroadcastData({ ...broadcastData, message: e.target.value })}
                  placeholder="Type your alert message here..."
                  className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-red-500/20 outline-none transition-all dark:text-white text-sm resize-none"
                />
              </div>

              <button
                onClick={handleSendBroadcast}
                disabled={isSending || !broadcastData.title || !broadcastData.message}
                className="w-full py-4 mt-2 rounded-2xl text-white font-bold flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 shadow-lg shadow-red-600/20 transition-all disabled:opacity-50"
              >
                {isSending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                {isSending ? "Broadcasting..." : "Send Global Broadcast"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}