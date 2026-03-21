import { useState } from 'react';
import { Bell, Briefcase, MessageSquare, Zap, Filter, Search } from 'lucide-react';

export default function StudentNotification() {
  const [notifications] = useState([
    { id: 1, title: 'New Job Match!', desc: 'Senior UI Designer at TechFlow is looking for someone like you.', time: '2 mins ago', type: 'job', read: false },
    { id: 2, title: 'Message from Employer', desc: 'TechFlow Inc. sent you a message regarding your application.', time: '1 hour ago', type: 'message', read: false },
    { id: 3, title: 'System Update', desc: 'Tugma v2.0 is now live.', time: '5 hours ago', type: 'system', read: true },
  ]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'job': return <Briefcase size={18} className="text-blue-500" />;
      case 'message': return <MessageSquare size={18} className="text-purple-500" />;
      default: return <Zap size={18} className="text-amber-500" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 fade-in relative">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-zinc-900 dark:text-white flex items-center gap-3">
            <Bell className="text-purple-600" /> Notifications
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Stay updated with your latest activities.</p>
        </div>
        <button className="p-2.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-800">
          <Filter size={18} />
        </button>
      </div>

      <div className="flex items-center justify-between bg-white dark:bg-zinc-900 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="flex items-center gap-3 flex-1 px-2">
          <Search size={16} className="text-zinc-400" />
          <input type="text" placeholder="Search alerts..." className="bg-transparent border-none outline-none text-sm text-zinc-900 dark:text-white w-full" />
        </div>
        <button className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline px-4">Mark all read</button>
      </div>

      <div className="space-y-3">
        {notifications.map((n) => (
          <div key={n.id} className={`group p-5 rounded-3xl border flex gap-4 items-start ${n.read ? 'bg-white dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800 opacity-80' : 'bg-white dark:bg-zinc-900 border-purple-200 dark:border-purple-500/30 shadow-md shadow-purple-500/5'}`}>
            <div className="p-3.5 rounded-2xl shrink-0 bg-zinc-50 dark:bg-zinc-800/50">{getIcon(n.type)}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h3 className={`text-[15px] font-bold ${n.read ? 'text-zinc-700 dark:text-zinc-300' : 'text-zinc-900 dark:text-white'}`}>{n.title}</h3>
                <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider">{n.time}</span>
              </div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">{n.desc}</p>
            </div>
            {!n.read && <div className="w-2.5 h-2.5 rounded-full bg-purple-500 mt-2.5 shrink-0 animate-pulse" />}
          </div>
        ))}
      </div>
    </div>
  );
}