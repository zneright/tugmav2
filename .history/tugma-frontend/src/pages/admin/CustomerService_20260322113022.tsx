import { useState, useEffect } from 'react';
import {
  LifeBuoy, Search, Filter, MessageSquare,
  CheckCircle2, Clock, AlertCircle, ChevronDown, Loader2, X, Send
} from 'lucide-react';
import { auth } from '../../firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';

interface Ticket {
  id: string;
  db_id: number;
  firebase_uid: string; // Needed to know who to reply to!
  user: string;
  email: string;
  role: string;
  subject: string;
  message: string;
  status: string;
  created_at: string;
}

export default function CustomerService() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [adminUid, setAdminUid] = useState<string | null>(null); // 🔥 Added to track the acting admin

  // Filtering States
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [expandedTicket, setExpandedTicket] = useState<number | null>(null);

  // In-App Reply Modal State
  const [replyModal, setReplyModal] = useState<{ isOpen: boolean, ticket: Ticket | null, message: string, isSending: boolean }>({
    isOpen: false, ticket: null, message: '', isSending: false
  });

  useEffect(() => {
    // 🔥 Grab the current admin's UID for the audit log
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) setAdminUid(user.uid);
    });

    fetchTickets();
    return () => unsubscribe();
  }, []);

  // 🔥 SILENT AUDIT LOGGER 🔥
  const logSystemEvent = (action: string, details: string) => {
    if (!adminUid) return;
    fetch('http://localhost:8080/api/audit/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid: adminUid, action, details })
    }).catch(err => console.error("Audit log failed (silent):", err));
  };

  const fetchTickets = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/admin/tickets');
      if (response.ok) {
        const data = await response.json();
        setTickets(data);
      }
    } catch (error) {
      console.error("Failed to load tickets:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResolveTicket = async (db_id: number, ticketIdString: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Mark this ticket as resolved without replying?")) return;

    setTickets(prev => prev.map(t => t.db_id === db_id ? { ...t, status: 'Closed' } : t));

    try {
      const res = await fetch(`http://localhost:8080/api/admin/tickets/${db_id}/resolve`, { method: 'POST' });
      if (res.ok) {
        // 🔥 Log the action
        logSystemEvent('Resolved Ticket', `Marked ticket ${ticketIdString} as closed without reply.`);
      }
    } catch (error) {
      console.error("Failed to resolve ticket", error);
      fetchTickets(); // Revert on failure
    }
  };

  // Send the Reply to the Database
  const handleSendReply = async () => {
    if (!replyModal.ticket || !replyModal.message.trim()) return;
    setReplyModal(prev => ({ ...prev, isSending: true }));

    try {
      const res = await fetch(`http://localhost:8080/api/admin/tickets/${replyModal.ticket.db_id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiver_uid: replyModal.ticket.firebase_uid,
          subject: replyModal.ticket.subject,
          message: replyModal.message
        })
      });

      if (res.ok) {
        setTickets(prev => prev.map(t => t.db_id === replyModal.ticket!.db_id ? { ...t, status: 'Closed' } : t));

        // 🔥 Log the action
        logSystemEvent('Replied to Ticket', `Sent reply to ${replyModal.ticket.user} for ticket ${replyModal.ticket.id} and marked as Closed.`);

        setReplyModal({ isOpen: false, ticket: null, message: '', isSending: false });
        alert("Reply sent! The user will see it instantly in their Tugma Inbox.");
      } else {
        throw new Error("Failed to send");
      }
    } catch (error) {
      console.error(error);
      alert("Error sending reply.");
      setReplyModal(prev => ({ ...prev, isSending: false }));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Open': return 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400 border-red-200 dark:border-red-500/20';
      case 'In Progress': return 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400 border-amber-200 dark:border-amber-500/20';
      case 'Closed': return 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200 dark:border-emerald-700/50';
      default: return 'bg-zinc-100 text-zinc-500';
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

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch =
      ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'All Status' || ticket.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const openTicketsCount = tickets.filter(t => t.status === 'Open').length;

  if (isLoading) return <div className="flex justify-center items-center h-[70vh]"><Loader2 className="animate-spin text-red-600" size={40} /></div>;

  return (
    <div className="max-w-5xl mx-auto space-y-6 fade-in pb-10">

      {/* --- IN-APP REPLY MODAL --- */}
      {replyModal.isOpen && replyModal.ticket && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl relative">
            <button onClick={() => setReplyModal({ ...replyModal, isOpen: false })} className="absolute top-6 right-6 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">
              <X size={20} />
            </button>

            <div className="mb-6">
              <h3 className="text-xl font-black text-zinc-900 dark:text-white flex items-center gap-2">
                <Send className="text-purple-500" /> Reply to Ticket
              </h3>
              <p className="text-sm text-zinc-500 mt-1">
                Replying to <span className="font-bold">{replyModal.ticket.user}</span> ({replyModal.ticket.subject})
              </p>
            </div>

            <div className="space-y-4">
              <textarea
                rows={5}
                value={replyModal.message}
                onChange={(e) => setReplyModal({ ...replyModal, message: e.target.value })}
                placeholder="Type your official response here. This will be sent directly to their Tugma inbox..."
                className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all dark:text-white text-sm resize-none"
              />

              <button
                onClick={handleSendReply}
                disabled={replyModal.isSending || !replyModal.message.trim()}
                className="w-full py-4 rounded-2xl text-white font-bold flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 shadow-lg shadow-purple-600/20 transition-all disabled:opacity-50"
              >
                {replyModal.isSending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                {replyModal.isSending ? "Sending Reply..." : "Send Official Reply"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-zinc-900 dark:text-white flex items-center gap-3">
            <LifeBuoy className="text-red-600" /> Support Desk
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Resolve user issues, bugs, and platform inquiries.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-xl border ${openTicketsCount > 0 ? 'bg-red-50 text-red-600 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-900/30' : 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-900/30'}`}>
            {openTicketsCount > 0 ? <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span> : <CheckCircle2 size={16} />}
            {openTicketsCount} Open Ticket{openTicketsCount !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Control Bar */}
      <div className="flex flex-col md:flex-row gap-4 bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by ticket ID, user, or subject..."
            className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-red-500/20 outline-none transition-all dark:text-white text-sm font-medium placeholder:text-zinc-400"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-700 outline-none text-sm text-zinc-900 dark:text-white font-bold cursor-pointer transition-colors focus:ring-2 focus:ring-red-500/20"
          >
            <option>All Status</option>
            <option>Open</option>
            <option>Closed</option>
          </select>
          <button className="px-4 py-2.5 bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-800/50 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-600 dark:text-zinc-300 transition-colors">
            <Filter size={18} />
          </button>
        </div>
      </div>

      {/* Tickets List */}
      <div className="space-y-3">
        {filteredTickets.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-zinc-900 rounded-3xl border border-dashed border-zinc-200 dark:border-zinc-800 shadow-sm">
            <CheckCircle2 size={40} className="mx-auto text-zinc-300 dark:text-zinc-700 mb-4" />
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white">No tickets found</h3>
            <p className="text-sm text-zinc-500 mt-1">Adjust your search or filters to see more results.</p>
          </div>
        ) : (
          filteredTickets.map((ticket) => {
            const isExpanded = expandedTicket === ticket.db_id;
            const isUrgent = ticket.subject.toLowerCase().includes('bug') || ticket.subject.toLowerCase().includes('issue');

            return (
              <div
                key={ticket.id}
                onClick={() => setExpandedTicket(isExpanded ? null : ticket.db_id)}
                className={`bg-white dark:bg-zinc-900 border rounded-2xl p-5 shadow-sm transition-all group cursor-pointer 
                  ${ticket.status === 'Closed' ? 'border-zinc-200 dark:border-zinc-800 opacity-80 hover:opacity-100' : 'border-zinc-200 dark:border-zinc-700 hover:border-red-300 dark:hover:border-red-500/50'}`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className={`mt-1 p-2.5 rounded-xl shrink-0 transition-colors ${ticket.status === 'Closed' ? 'bg-zinc-100 text-zinc-400 dark:bg-zinc-800' : 'bg-red-50 text-red-500 dark:bg-red-500/10 border border-red-100 dark:border-red-900/30'}`}>
                      {ticket.status === 'Closed' ? <CheckCircle2 size={20} /> : <MessageSquare size={20} />}
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="text-xs font-black text-zinc-400 tracking-wider">{ticket.id}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border uppercase tracking-wider ${getStatusColor(ticket.status)}`}>
                          {ticket.status}
                        </span>
                        {ticket.status === 'Open' && isUrgent && (
                          <span className="flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-md bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400 uppercase tracking-wider border border-red-200 dark:border-red-900/50">
                            <AlertCircle size={10} /> Urgent
                          </span>
                        )}
                      </div>

                      <h3 className="font-bold text-zinc-900 dark:text-white text-[15px] sm:text-base group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors mt-1">
                        {ticket.subject}
                      </h3>

                      <p className="text-[13px] text-zinc-500 dark:text-zinc-400 mt-1 flex flex-wrap items-center gap-2">
                        <span className="font-bold text-zinc-700 dark:text-zinc-300">{ticket.user}</span>
                        <span className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-600"></span>
                        <span className="font-medium text-zinc-500">{ticket.role}</span>
                        <span className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-600"></span>
                        <span className="flex items-center gap-1"><Clock size={12} /> {formatDate(ticket.created_at)}</span>
                      </p>
                    </div>
                  </div>

                  <button className={`hidden sm:flex items-center justify-center p-2 rounded-xl transition-all ${isExpanded ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white rotate-180' : 'text-zinc-400 group-hover:bg-red-50 dark:group-hover:bg-red-500/10 group-hover:text-red-600 dark:group-hover:text-red-400'}`}>
                    <ChevronDown size={20} />
                  </button>
                </div>

                {/* Expanded Details Section */}
                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-[500px] mt-4 opacity-100' : 'max-h-0 opacity-0'}`}>
                  <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800">
                    <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-700/50">
                      <p className="text-[13px] sm:text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap">
                        {ticket.message}
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4">
                      <div className="flex items-center gap-2 text-[11px] font-bold text-zinc-400">
                        {ticket.email}
                      </div>

                      <div className="flex items-center gap-3 w-full sm:w-auto">
                        {ticket.status === 'Open' && (
                          <button
                            onClick={(e) => { e.stopPropagation(); setReplyModal({ isOpen: true, ticket, message: '', isSending: false }); }}
                            className="flex-1 sm:flex-none px-4 py-2.5 bg-purple-100 hover:bg-purple-200 dark:bg-purple-500/20 dark:hover:bg-purple-500/30 text-purple-700 dark:text-purple-300 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                          >
                            <MessageSquare size={14} /> In-App Reply
                          </button>
                        )}
                        {ticket.status === 'Open' && (
                          <button
                            onClick={(e) => handleResolveTicket(ticket.db_id, ticket.id, e)} // 🔥 Pass the visual ID here for the log
                            className="flex-1 sm:flex-none px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-1.5"
                          >
                            <CheckCircle2 size={14} /> Mark Resolved
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}