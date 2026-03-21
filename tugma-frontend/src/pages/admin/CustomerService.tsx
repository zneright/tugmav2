import { useState } from 'react';
import { 
  LifeBuoy, Search, Filter, MessageSquare, 
  CheckCircle2, Clock, AlertCircle, ChevronRight 
} from 'lucide-react';

export default function CustomerService() {
  // Mock Support Tickets
  const [tickets] = useState([
    { id: 'TK-9021', user: 'TechFlow Inc.', role: 'Employer', subject: 'Cannot upload company logo', status: 'Open', priority: 'High', time: '10 mins ago' },
    { id: 'TK-9020', user: 'Alex Johnson', role: 'Student', subject: 'Resume parsing error', status: 'In Progress', priority: 'Medium', time: '2 hours ago' },
    // { id: 'TK-9019', user: 'DesignWorks', role: 'Employer', subject: 'Billing inquiry for Pro Plan', status: 'Closed', priority: 'Low', time: '1 day ago' },
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Open': return 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400 border-red-200 dark:border-red-500/20';
      case 'In Progress': return 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400 border-amber-200 dark:border-amber-500/20';
      case 'Closed': return 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700';
      default: return 'bg-zinc-100 text-zinc-500';
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 fade-in">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-zinc-900 dark:text-white flex items-center gap-3">
            <LifeBuoy className="text-red-600" /> Support Desk
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Resolve user issues, bugs, and platform inquiries.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm font-bold text-zinc-600 dark:text-zinc-300">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span> 1 Open Ticket
          </div>
        </div>
      </div>

      {/* Control Bar */}
      <div className="flex flex-col md:flex-row gap-4 bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input type="text" placeholder="Search by ticket ID or user..." className="w-full pl-9 pr-4 py-2 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-red-500/20 outline-none transition-all dark:text-white text-sm" />
        </div>
        <div className="flex gap-2">
          <select className="px-4 py-2 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-700 outline-none text-sm dark:text-white font-medium appearance-none min-w-[120px]">
            <option>All Status</option>
            <option>Open</option>
            <option>Closed</option>
          </select>
          <button className="px-4 py-2 bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-800/50 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-600 dark:text-zinc-300 transition-colors">
            <Filter size={16} />
          </button>
        </div>
      </div>

      {/* Tickets List */}
      <div className="space-y-3">
        {tickets.map((ticket) => (
          <div key={ticket.id} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-sm hover:border-red-300 dark:hover:border-red-500/50 transition-colors group cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            
            <div className="flex items-start gap-4">
              <div className={`mt-1 p-2 rounded-xl shrink-0 ${ticket.status === 'Closed' ? 'bg-zinc-100 text-zinc-400 dark:bg-zinc-800' : 'bg-red-50 text-red-500 dark:bg-red-500/10'}`}>
                {ticket.status === 'Closed' ? <CheckCircle2 size={20} /> : <MessageSquare size={20} />}
              </div>
              
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-zinc-400">{ticket.id}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border uppercase tracking-wider ${getStatusColor(ticket.status)}`}>
                    {ticket.status}
                  </span>
                  {ticket.priority === 'High' && (
                    <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400 uppercase tracking-wider">
                      <AlertCircle size={10} /> Urgent
                    </span>
                  )}
                </div>
                
                <h3 className="font-bold text-zinc-900 dark:text-white text-base group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                  {ticket.subject}
                </h3>
                
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 flex items-center gap-2">
                  <span className="font-medium text-zinc-700 dark:text-zinc-300">{ticket.user}</span>
                  <span className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-600"></span>
                  {ticket.role}
                  <span className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-600"></span>
                  <span className="flex items-center gap-1"><Clock size={12} /> {ticket.time}</span>
                </p>
              </div>
            </div>

            <button className="hidden sm:flex items-center justify-center p-2 text-zinc-400 group-hover:bg-red-50 dark:group-hover:bg-red-500/10 group-hover:text-red-600 dark:group-hover:text-red-400 rounded-xl transition-colors">
              <ChevronRight size={20} />
            </button>
            
          </div>
        ))}
      </div>

    </div>
  );
}