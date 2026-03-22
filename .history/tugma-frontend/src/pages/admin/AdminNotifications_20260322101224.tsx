import { useState, useEffect } from 'react';
import {
  Bell, Megaphone, X, Send, ShieldAlert,
  Loader2, Trash2, Users, Mail, Check
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

export default function AdminNotification() {
  const [uid, setUid] = useState<string | null>(null);
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Broadcast Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [broadcastData, setBroadcastData] = useState({
    title: '',
    message: '',
    target: 'ALL'
  });

  // 🔥 NEW: Recipient List Modal States 🔥
  const [recipientModal, setRecipientModal] = useState<{ isOpen: boolean; data: any[]; loading: boolean }>({
    isOpen: false,
    data: [],
    loading: false
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUid(user.uid);
        fetchBroadcastHistory(user.uid);
      } else {
        setIsLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchBroadcastHistory = async (adminUid: string) => {
    try {
      const response = await fetch(`http://localhost:8080/api/notifications/sent/${adminUid}`);
      if (response.ok) {
        const data = await response.json();
        setBroadcasts(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Failed to load broadcasts:", error);
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
        fetchBroadcastHistory(uid); // Refresh the history list
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
    e.stopPropagation(); // Prevent opening the recipient modal when clicking delete
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

  // 🔥 NEW: Fetch & View Recipients 🔥
  const handleViewRecipients = async (b: Broadcast) => {
    setRecipientModal({ isOpen: true, data: [], loading: true });

    try {
      const params = new URLSearchParams({
        sender_uid: uid || '',
        title: b.title,
        message: b.message
      });

      const res = await fetch(`http://localhost:8080/api/notifications/recipients?${params.toString()}`);

      if (res.ok) {
        const data = await res.json();
        setRecipientModal({ isOpen: true, data: Array.isArray(data) ? data : [], loading: false });
      } else {
        throw new Error("Server responded with error");
      }
    } catch (error) {
      console.error("Failed to load recipients:", error);
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

  if (isLoading) return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-red-600" size={40} /></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6 fade-in relative pb-10">

      {/* --- RECIPIENT LIST MODAL --- */}
      {recipientModal.isOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-950/50">
              <div>
                <h3 className="text-lg font-black text-zinc-900 dark:text-white flex items-center gap-2">
                  <Users size={18} className="text-red-500" /> Broadcast Recipients
                </h3>
                <p className="text-xs text-zinc-500 mt-1">See who received this alert.</p>
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
                      <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 dark:border-emerald-800/30 dark:bg-emerald-500/10 px-2 py-1 rounded-md">
                        <Check size={12} /> READ
                      </span>
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

      {/* --- CREATE BROADCAST MODAL --- */}
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
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                Push an urgent alert to the platform network.
              </p>
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

      {/* --- PAGE HEADER --- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-zinc-900 dark:text-white flex items-center gap-3">
            <Bell className="text-red-500" /> System Alerts
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Manage global broadcasts and system notifications.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-5 py-3 rounded-xl text-sm font-bold shadow-lg shadow-red-500/20 transition-all shrink-0">
            <Megaphone size={18} /> New Broadcast
          </button>
        </div>
      </div>

      {/* --- BROADCAST HISTORY LIST --- */}
      <div className="space-y-3">
        {broadcasts.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <ShieldAlert size={40} className="mx-auto text-zinc-300 dark:text-zinc-700 mb-4" />
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white">No active broadcasts</h3>
            <p className="text-sm text-zinc-500 mt-1">System alerts you send will appear here.</p>
          </div>
        ) : (
          broadcasts.map((b) => (
            <div
              key={b.id}
              onClick={() => handleViewRecipients(b)}
              className="group p-5 rounded-3xl border bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-red-300 dark:hover:border-red-900/50 flex gap-4 items-start transition-all shadow-sm cursor-pointer"
            >
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

              {/* Unsend Button */}
              <div className="flex flex-col items-end shrink-0">
                <button
                  onClick={(e) => handleUnsendBroadcast(e, b)}
                  className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                  title="Unsend this broadcast"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}