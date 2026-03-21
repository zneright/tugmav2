import { Menu, Search, Bell, User, LogOut, Check, MessageSquare, Briefcase, Zap } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom'; // 👈 Added useLocation
import ThemeToggle from './ThemeToggle'; 

interface TopbarProps {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
}

export default function Topbar({ toggleSidebar }: TopbarProps) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  
  const profileRef = useRef<HTMLDivElement>(null);
  const notifyRef = useRef<HTMLDivElement>(null);
  const location = useLocation(); // 👈 Get current URL

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

  // --- SMART ROUTING LOGIC ---
  // Determine where the "Profile" button should go based on the current portal
  let profileLink = '/profile'; 
  let avatarInitial = 'N';

  if (location.pathname.startsWith('/employer')) {
    profileLink = '/employer/profile';
    avatarInitial = 'T'; // TechFlow Inc.
  } else if (location.pathname.startsWith('/admin')) {
    profileLink = '/admin/settings'; // Admins use settings instead of a public profile
    avatarInitial = 'AD'; // Admin
  }

  // Mock Notifications Data
  const notifications = [
    { id: 1, title: 'New Job Match!', desc: 'Senior UI Designer at TechFlow', time: '2m ago', icon: <Briefcase size={14} />, color: 'text-blue-500 bg-blue-500/10' },
    { id: 2, title: 'Message received', desc: 'Ibrahim Memon sent you a file', time: '1h ago', icon: <MessageSquare size={14} />, color: 'text-purple-500 bg-purple-500/10' },
    { id: 3, title: 'System Update', desc: 'New features added to dashboard', time: '5h ago', icon: <Zap size={14} />, color: 'text-amber-500 bg-amber-500/10' },
  ];

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
            {/* The Pulse Dot */}
            <span className="absolute top-2 right-2 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500 border border-white dark:border-zinc-950"></span>
            </span>
          </button>

          {/* Dropdown Menu */}
          <div className={`
            absolute right-0 mt-3 w-[320px] sm:w-[380px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl z-50 transition-all duration-200 origin-top-right
            ${isNotificationsOpen ? 'opacity-100 scale-100 translate-y-0 visible' : 'opacity-0 scale-95 -translate-y-2 invisible'}
          `}>
            <div className="p-4 flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800">
              <h3 className="font-bold text-zinc-900 dark:text-white">Notifications</h3>
              <button className="text-[11px] font-bold text-purple-600 dark:text-purple-400 hover:underline uppercase tracking-wider flex items-center gap-1">
                <Check size={12} /> Mark all read
              </button>
            </div>

            <div className="max-h-[350px] overflow-y-auto custom-scrollbar">
              {notifications.map((n) => (
                <button key={n.id} className="w-full text-left p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors flex gap-4 items-start border-b border-zinc-50 dark:border-zinc-800/50 last:border-0">
                  <div className={`mt-0.5 p-2 rounded-lg shrink-0 ${n.color}`}>
                    {n.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-zinc-900 dark:text-white truncate">{n.title}</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 mt-0.5">{n.desc}</p>
                    <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-2 font-medium">{n.time}</p>
                  </div>
                </button>
              ))}
            </div>

            <div className="p-3 text-center border-t border-zinc-100 dark:border-zinc-800">
              <button className="text-xs font-bold text-zinc-500 hover:text-purple-600 transition-colors">See all notifications</button>
            </div>
          </div>
        </div>

        {/* --- PROFILE DROPDOWN --- */}
        <div className="relative" ref={profileRef}>
          <button 
            onClick={() => { setIsProfileOpen(!isProfileOpen); setIsNotificationsOpen(false); }}
            className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-sm hover:opacity-90 transition-all border-2 border-transparent focus:border-purple-500/50 ${
              location.pathname.startsWith('/admin') ? 'bg-red-600' : 'bg-purple-600'
            }`}
          >
            {avatarInitial}
          </button>
          <div className={`
            absolute right-0 mt-3 w-48 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-lg z-50 transition-all duration-200 origin-top-right
            ${isProfileOpen ? 'opacity-100 scale-100 translate-y-0 visible' : 'opacity-0 scale-95 -translate-y-2 invisible'}
          `}>
            <div className="p-1.5 flex flex-col">
              
              {/* 👈 Dynamic Link based on who is logged in! */}
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