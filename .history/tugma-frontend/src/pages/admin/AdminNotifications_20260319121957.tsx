import { useState } from 'react';
import { Bell, Megaphone, Filter, Search, X, Send, ShieldAlert } from 'lucide-react';

export default function AdminNotification() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [notifications] = useState([
    { id: 1, title: 'System Maintenance', desc: 'Scheduled downtime on Sunday.', time: '1 day ago', type: 'alert', read: true },
  ]);

  return (
    <div className="max-w-4xl mx-auto space-y-6 fade-in relative">
      
      {/* Broadcast Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-zinc-900/40 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 w-full max-w-md rounded-3xl p-8 shadow-2xl relative">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-6 right-6 text-zinc-400 hover:text-zinc-900 dark:hover:text-white"><X size={20} /></button>
            <h3 className="text-xl font-black text-zinc-900 dark:text-white mb-6 flex items-center gap-2">
              <Megaphone className="text-red-500" /> Global Broadcast
            </h3>
            <div className="space-y-4">
              <input type="text" placeholder="Broadcast title..." className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-200 dark:border-zinc-800 text-sm outline-none dark:text-white" />
              <textarea rows={4} placeholder="Type broadcast message..." className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-200 dark:border-zinc-800 text-sm outline-none dark:text-white resize-none" />
              <button onClick={() => { setIsModalOpen(false); alert("Broadcast Sent to all users!"); }} className="w-full py-4 rounded-2xl text-white font-bold flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 shadow-lg shadow-red-600/20 transition-all">
                <Send size={18} /> Broadcast to Platform
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-zinc-900 dark:text-white flex items-center gap-3"><Bell className="text-red-500" /> System Alerts</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Manage global broadcasts and system notifications.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-red-500/20">
            <Megaphone size={18} /> Global Broadcast
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {notifications.map((n) => (
           <div key={n.id} className="group p-5 rounded-3xl border bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 flex gap-4 items-start">
             <div className="p-3.5 rounded-2xl shrink-0 bg-red-50 dark:bg-red-500/10"><ShieldAlert size={18} className="text-red-500" /></div>
             <div className="flex-1 min-w-0">
               <h3 className="text-[15px] font-bold text-zinc-900 dark:text-white">{n.title}</h3>
               <p className="text-sm text-zinc-500">{n.desc}</p>
             </div>
           </div>
        ))}

        
      </div>
    </div>
  );
}