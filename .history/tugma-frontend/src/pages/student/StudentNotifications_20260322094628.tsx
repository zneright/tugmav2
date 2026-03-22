import { useState, useEffect } from 'react';
import {
  Bell, Briefcase, MessageSquare, Zap,
  Filter, Search, Loader2, Trash2, UserCheck
} from 'lucide-react';
import { auth } from '../../firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';

interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  is_read: number;
  created_at: string;
}

export default function StudentNotification() {
  const [uid, setUid] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // 1. Authenticate and Fetch
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUid(user.uid);
        fetchNotifications(user.uid);
      } else {
        setIsLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchNotifications = async (userUid: string) => {
    try {
      const res = await fetch(`http://localhost:8080/api/notifications/${userUid}`);
      if (res.ok) {
        const data = await res.json();
        setNotifications(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Failed to load notifications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // 🔥 NEW: SILENT AUDIT LOGGER 🔥
  const logSystemEvent = (action: string, details: string) => {
    if (!uid) return;
    fetch('http://localhost:8080/api/audit/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid, action, details })
    }).catch(err => console.error("Audit log failed (silent):", err));
  };

  // 2. Mark as Read on Hover
  const handleMarkAsRead = async (id: number) => {
    try {
      await fetch(`http://localhost:8080/api/notifications/read/${id}`, { method: 'POST' });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n));
    } catch (error) {
      console.error("Error marking read:", error);
    }
  };

  // 3. Mark All as Read
  const handleMarkAllAsRead = async () => {
    if (!uid) return;
    try {
      await fetch(`http://localhost:8080/api/notifications/read-all/${uid}`, { method: 'POST' });
      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));

      // 🔥 LOG THE EVENT 🔥
      logSystemEvent('Cleared Inbox', 'User marked all notifications as read.');

    } catch (error) {
      console.error("Error marking all read:", error);
    }
  };

  // 4. Delete Notification
  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    try {
      const notifToDelete = notifications.find(n => n.id === id);

      await fetch(`http://localhost:8080/api/notifications/${id}`, { method: 'DELETE' });
      setNotifications(prev => prev.filter(n => n.id !== id));

      if (notifToDelete) {
        logSystemEvent('Deleted Notification', `User deleted alert: "${notifToDelete.title}"`);
      }

    } catch (error) {
      console.error("Delete failed:", error);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'job': return <Briefcase size={18} className="text-blue-500" />;
      case 'message': return <MessageSquare size={18} className="text-purple-500" />;
      case 'app': return <UserCheck size={18} className="text-emerald-500" />;
      default: return <Zap size={18} className="text-amber-500" />;
    }
  };

  const getTimeAgo = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Recently';
      const now = new Date();
      const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
      if (diffInHours < 1) return 'Just now';
      if (diffInHours < 24) return `${diffInHours} hr${diffInHours > 1 ? 's' : ''} ago`;
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    } catch (e) {
      return 'Recently';
    }
  };

  const filteredList = notifications.filter(n =>
    n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    n.message.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-purple-600" size={40} /></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6 fade-in relative pb-20">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-zinc-900 dark:text-white flex items-center gap-3">
            <Bell className="text-purple-600" /> Notifications
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Stay updated with your latest activities and messages.</p>
        </div>
        <button className="p-2.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-800 transition-colors shadow-sm">
          <Filter size={18} />
        </button>
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-zinc-900 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="flex items-center gap-3 flex-1 w-full px-2">
          <Search size={16} className="text-zinc-400 shrink-0" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search alerts..."
            className="bg-transparent border-none outline-none text-sm font-medium text-zinc-900 dark:text-white w-full"
          />
        </div>
        <button
          onClick={handleMarkAllAsRead}
          className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline px-4 w-full sm:w-auto text-right sm:border-l border-zinc-100 dark:border-zinc-800"
        >
          Mark all read
        </button>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredList.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-sm">
            <Bell className="mx-auto text-zinc-300 dark:text-zinc-700 mb-3" size={32} />
            <p className="font-bold text-zinc-500 dark:text-zinc-400">You're all caught up!</p>
          </div>
        ) : (
          filteredList.map((n) => (
            <div
              key={n.id}
              onMouseEnter={() => !Boolean(n.is_read) && handleMarkAsRead(n.id)}
              className={`group p-4 sm:p-5 rounded-3xl border flex gap-4 items-start transition-all ${Boolean(n.is_read)
                ? 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 opacity-80'
                : 'bg-white dark:bg-zinc-900 border-purple-200 dark:border-purple-500/30 shadow-md shadow-purple-500/5'
                }`}
            >
              <div className={`p-3.5 rounded-2xl shrink-0 transition-colors ${Boolean(n.is_read) ? 'bg-zinc-50 dark:bg-zinc-800/50' : 'bg-purple-100 dark:bg-purple-500/20'}`}>
                {getIcon(n.type)}
              </div>

              <div className="flex-1 min-w-0 pt-1">
                <div className="flex items-center justify-between mb-1">
                  <h3 className={`text-[15px] font-bold truncate pr-4 ${Boolean(n.is_read) ? 'text-zinc-700 dark:text-zinc-300' : 'text-zinc-900 dark:text-white'}`}>
                    {n.title}
                  </h3>
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider shrink-0">
                    {getTimeAgo(n.created_at)}
                  </span>
                </div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed pr-6">
                  {n.message}
                </p>
              </div>

              <div className="flex flex-col items-center justify-between gap-4 self-stretch pt-2">
                {!Boolean(n.is_read) ? (
                  <div className="w-2.5 h-2.5 rounded-full bg-purple-500 shrink-0 animate-pulse" />
                ) : <div className="w-2.5 h-2.5" />}

                <button
                  onClick={(e) => handleDelete(e, n.id)}
                  className="p-2 text-zinc-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                  title="Delete Notification"
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