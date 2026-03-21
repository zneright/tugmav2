import { Menu, Search, Bell, User, LogOut, Check, MessageSquare, Briefcase, Zap, UserCheck } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { auth } from '../../firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import ThemeToggle from './ThemeToggle'; 

interface TopbarProps {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
}

interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  is_read: number;
  created_at: string;
}

export default function Topbar({ toggleSidebar }: TopbarProps) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  
  // Real Data States
  const [uid, setUid] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  // 🔥 NEW: Profile States 🔥
  const [avatarInitial, setAvatarInitial] = useState('U');
  const [avatarImage, setAvatarImage] = useState<string | null>(null);
  
  const profileRef = useRef<HTMLDivElement>(null);
  const notifyRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  // 1. Authenticate and Fetch ALL Data
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUid(user.uid);
        fetchNotifications(user.uid);
        fetchUserProfile(user.uid); // 🔥 Fetch user data
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
      console.error("Failed to load notifications for topbar:", error);
    }
  };

  // 🔥 NEW: Fetch User Profile for Real Initials/Photo
  const fetchUserProfile = async (userUid: string) => {
    try {
      // Are we an employer or a student?
      const isEmployer = location.pathname.startsWith('/employer');
      
      if (isEmployer) {
        const res = await fetch(`http://localhost:8080/api/employer/profile/${userUid}`);
        if (res.ok) {
          const data = await res.json();
          // Use company name first letter, fallback to user's first name
          if (data.company_name) {
            setAvatarInitial(data.company_name.charAt(0).toUpperCase());
          } else if (data.first_name) {
            setAvatarInitial(data.first_name.charAt(0).toUpperCase());
          } else {
             setAvatarInitial('E');
          }
        }
      } else {
        const res = await fetch(`http://localhost:8080/api/users/profile/${userUid}`);
        if (res.ok) {
          const data = await res.json();
          if (data.first_name) {
            setAvatarInitial(data.first_name.charAt(0).toUpperCase());
          } else {
             setAvatarInitial('S');
          }
          
          // If they uploaded a profile photo, use it!
          if (data.profile_photo) {
             setAvatarImage(data.profile_photo);
          }
        }
      }
    } catch (error) {
       console.error("Failed to fetch topbar profile info:", error);
    }
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
      if (notifyRef.current && !notifyRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- ACTIONS ---
  const handleMarkAllAsRead = async () => {
    if (!uid) return;
    try {
      await fetch(`http://localhost:8080/api/notifications/read-all/${uid}`, { method: 'POST' });
      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
    } catch (error) {
      console.error("Error marking all read:", error);
    }
  };

  const handleNotificationClick = async (n: Notification) => {
    if (n.is_read == 0) {
      try {
        await fetch(`http://localhost:8080/api/notifications/read/${n.id}`, { method: 'POST' });
        setNotifications(prev => prev.map(item => item.id === n.id ? { ...item, is_read: 1 } : item));
      } catch (error) {
        console.error("Error marking read:", error);
      }
    }
    setIsNotificationsOpen(false);
  };

  // --- SMART ROUTING LOGIC ---
  let profileLink = '/profile'; 
  let notificationsLink = '/notifications';
  let avatarColor = 'bg-purple-600'; 

  if (location.pathname.startsWith('/employer')) {
    profileLink = '/employer/profile';
    notificationsLink = '/employer/notifications';
    avatarColor = 'bg-blue-600'; // Make employer avatar blue to differentiate
  } else if (location.pathname.startsWith('/admin')) {
    profileLink = '/admin/settings'; 
    notificationsLink = '/admin/notifications';
    avatarColor = 'bg-red-600'; 
  }

  // --- UI HELPERS ---
  const unreadCount = notifications.filter(n => n.is_read == 0).length;

  const getIconInfo = (type: string) => {
    switch (type) {
      case 'job': return { icon: <Briefcase size={14} />, color: 'text-blue-500 bg-blue-500/10' };
      case 'message': return { icon: <MessageSquare size={14} />, color: 'text-purple-500 bg-purple-500/10' };
      case 'app': return { icon: <UserCheck size={14} />, color: 'text-emerald-500 bg-emerald-500/10' };
      default: return { icon: <Zap size={14} />, color: 'text-amber-500 bg-amber-500/10' };
    }
  };

  const getTimeAgo = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Recently';
      const now = new Date();
      const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
      if (diffInHours < 1) return 'Just now';
      if (diffInHours < 24) return `${diffInHours}h ago`;
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
    } catch (e) { return 'Recently'; }
  };

  return (
    <header className="h-16 bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-30 px-4 sm:px-6 flex items-center justify-between transition-colors duration-300">
      
      {/* Left Section */}
      <div className="flex items-center gap-4">
        <button onClick={toggleSidebar} className="p-2 -ml-2 text-zinc-500 hover:text-purple-600 dark:hover:text-purple-400 rounded-md transition-colors">
          <Menu size={24} />
        </button>
        <h1 className="text-lg font-semibold text-zinc-900 dark:text-white hidden sm:block">Overview</h1>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-2 sm:gap-4">
        <div className="hidden md:flex relative group">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-purple-500 transition-colors" />
          <input 
            type="text" 
            placeholder="Search..." 
            className="w-48 lg:w-64 pl-9 pr-4 py-1.5 text-sm bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all dark:text-white"
          />
        </div>

        <ThemeToggle />

        {/* --- NOTIFICATION DROPDOWN --- */}
        <div className="relative" ref={notifyRef}>
          <button 
            onClick={() => { setIsNotificationsOpen(!isNotificationsOpen); setIsProfileOpen(false); }}
            className={`relative p-2 rounded-lg transition-colors ${isNotificationsOpen ? 'text-purple-600 bg-purple-50 dark:bg-purple-500/10' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'}`}
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500 border border-white dark:border-zinc-950"></span>
              </span>
            )}
          </button>

          {/* Dropdown Menu */}
          <div className={`
            absolute right-0 mt-3 w-[320px] sm:w-[380px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl z-50 transition-all duration-200 origin-top-right
            ${isNotificationsOpen ? 'opacity-100 scale-100 translate-y-0 visible' : 'opacity-0 scale-95 -translate-y-2 invisible'}
          `}>
            <div className="p-4 flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800">
              <h3 className="font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                Notifications
                {unreadCount > 0 && <span className="bg-purple-100 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400 px-2 py-0.5 rounded-full text-xs">{unreadCount}</span>}
              </h3>
              <button onClick={handleMarkAllAsRead} className="text-[11px] font-bold text-purple-600 dark:text-purple-400 hover:underline uppercase tracking-wider flex items-center gap-1">
                <Check size={12} /> Mark all read
              </button>
            </div>

            <div className="max-h-[350px] overflow-y-auto custom-scrollbar">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-zinc-500">
                  <Bell className="mx-auto mb-2 opacity-50" size={24} />
                  <p className="text-sm font-medium">You're all caught up!</p>
                </div>
              ) : (
                notifications.map((n) => {
                  const ui = getIconInfo(n.type);
                  return (
                    <button 
                      key={n.id} 
                      onClick={() => handleNotificationClick(n)}
                      className={`w-full text-left p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors flex gap-4 items-start border-b border-zinc-50 dark:border-zinc-800/50 last:border-0 ${n.is_read == 0 ? 'bg-purple-50/50 dark:bg-purple-500/5' : ''}`}
                    >
                      <div className={`mt-0.5 p-2 rounded-lg shrink-0 ${ui.color}`}>
                        {ui.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm truncate ${n.is_read == 0 ? 'font-black text-zinc-900 dark:text-white' : 'font-bold text-zinc-700 dark:text-zinc-300'}`}>
                          {n.title}
                        </p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 mt-0.5">{n.message}</p>
                        <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-2 font-medium uppercase tracking-wider">{getTimeAgo(n.created_at)}</p>
                      </div>
                      {n.is_read == 0 && (
                        <div className="w-2 h-2 bg-purple-500 rounded-full shrink-0 mt-2"></div>
                      )}
                    </button>
                  );
                })
              )}
            </div>

            <div className="p-3 text-center border-t border-zinc-100 dark:border-zinc-800">
              <Link to={notificationsLink} onClick={() => setIsNotificationsOpen(false)} className="text-xs font-bold text-zinc-500 hover:text-purple-600 transition-colors block w-full py-1">
                See all notifications
              </Link>
            </div>
          </div>
        </div>

        {/* --- PROFILE DROPDOWN --- */}
        <div className="relative" ref={profileRef}>
          <button 
            onClick={() => { setIsProfileOpen(!isProfileOpen); setIsNotificationsOpen(false); }}
            className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-sm hover:opacity-90 transition-all border-2 border-transparent focus:border-purple-500/50 overflow-hidden ${avatarColor}`}
          >
            {/* 🔥 Shows actual uploaded photo if available, otherwise real initial! */}
            {avatarImage ? (
              <img src={avatarImage} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              avatarInitial
            )}
          </button>
          
          <div className={`
            absolute right-0 mt-3 w-48 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-lg z-50 transition-all duration-200 origin-top-right
            ${isProfileOpen ? 'opacity-100 scale-100 translate-y-0 visible' : 'opacity-0 scale-95 -translate-y-2 invisible'}
          `}>
            <div className="p-1.5 flex flex-col">
              
              <Link to={profileLink} onClick={() => setIsProfileOpen(false)} className="flex items-center gap-2.5 px-3 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors font-medium">
                <User size={16} className="text-zinc-400" /> {location.pathname.startsWith('/admin') ? 'Settings' : 'Profile'}
              </Link>
              
              <div className="h-px bg-zinc-100 dark:bg-zinc-800/80 my-1 mx-2"></div>
              <Link to="/login" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-2.5 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors font-medium">
                <LogOut size={16} /> Logout
              </Link>
            </div>
          </div>
        </div>

      </div>
    </header>
  );
}