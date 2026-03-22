import { LayoutDashboard, Briefcase, MessageSquare, User, Bell, X, ChevronDown, HelpCircle, Clock, LogOut } from 'lucide-react';
import { NavLink, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { auth } from '../firebaseConfig';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import tugmaLogo from '../assets/tugma_logo_white.png';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export default function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isMessagesMenuOpen, setIsMessagesMenuOpen] = useState(false);

  // Dynamic User States
  const [userName, setUserName] = useState('Loading...');
  const [userRole, setUserRole] = useState('Student');
  const [userInitial, setUserInitial] = useState('-');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const profileRes = await fetch(`http://localhost:8080/api/users/profile/${user.uid}`);
          if (profileRes.ok) {
            const data = await profileRes.json();
            const finalName = `${data.firstName || data.first_name || ''} ${data.lastName || data.last_name || ''}`.trim() || 'Student';
            setUserName(finalName);
            setUserInitial(finalName.charAt(0).toUpperCase());
          }
        } catch (e) {
          setUserName('Student User');
          setUserInitial('S');
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const navItems = [
    { to: '/dashboard', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { to: '/jobs', icon: <Briefcase size={20} />, label: 'Find Jobs' },
    { to: '/ojttracker', icon: <Clock size={20} />, label: 'OJT & DTR' },
    { to: '/notifications', icon: <Bell size={20} />, label: 'Notifications' },
    { to: '/messages', icon: <MessageSquare size={20} />, label: 'Messages' },
    { to: '/profile', icon: <User size={20} />, label: 'Profile' },
    { to: '/help', icon: <HelpCircle size={20} />, label: 'Help' },
  ];

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-zinc-900/50 dark:bg-black/50 z-40 md:hidden transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside className={`
        fixed md:relative inset-y-0 left-0 z-50 w-64 bg-white dark:bg-zinc-950 text-zinc-700 dark:text-zinc-300 flex flex-col border-r border-zinc-200 dark:border-zinc-800
        transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0 md:ml-0' : '-translate-x-full md:translate-x-0 md:-ml-64'}
      `}>
        {/* HEADER */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-zinc-200 dark:border-zinc-800/50 min-w-[16rem] transition-colors shrink-0">
          <span className="text-xl font-black text-purple-600 dark:text-purple-500 tracking-tight">TUGMA</span>
          <button className="md:hidden p-1 -mr-2 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors" onClick={() => setIsOpen(false)}>
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 py-6 px-3 space-y-1 min-w-[16rem] overflow-y-auto custom-scrollbar">
          {navItems.map((item, index) => {

            if (item.label === 'Profile') {
              return (
                <div key={index} className="flex flex-col">
                  <button
                    onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-md transition-colors text-sm font-medium ${isProfileMenuOpen
                      ? 'bg-zinc-100 text-zinc-900 dark:bg-zinc-900 dark:text-white'
                      : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      {item.icon}
                      {item.label}
                    </div>
                    <ChevronDown size={16} className={`transition-transform duration-200 ${isProfileMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isProfileMenuOpen ? 'max-h-40 opacity-100 mt-1' : 'max-h-0 opacity-0'}`}>
                    <div className="flex flex-col ml-[22px] pl-4 border-l border-zinc-200 dark:border-zinc-800/80 space-y-1 transition-colors">
                      <NavLink to="/profile" onClick={() => { if (window.innerWidth < 768) setIsOpen(false) }} className={({ isActive }) => `block px-3 py-2 rounded-md transition-colors text-sm font-medium ${isActive ? 'bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400' : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white'}`}>
                        Student Profile
                      </NavLink>
                      <NavLink to="/resume" onClick={() => { if (window.innerWidth < 768) setIsOpen(false) }} className={({ isActive }) => `block px-3 py-2 rounded-md transition-colors text-sm font-medium ${isActive ? 'bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400' : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white'}`}>
                        Resume
                      </NavLink>
                    </div>
                  </div>
                </div>
              );
            }

            if (item.label === 'Messages') {
              return (
                <div key={index} className="flex flex-col">
                  <button
                    onClick={() => setIsMessagesMenuOpen(!isMessagesMenuOpen)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-md transition-colors text-sm font-medium ${isMessagesMenuOpen
                      ? 'bg-zinc-100 text-zinc-900 dark:bg-zinc-900 dark:text-white'
                      : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      {item.icon}
                      {item.label}
                    </div>
                    <ChevronDown size={16} className={`transition-transform duration-200 ${isMessagesMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isMessagesMenuOpen ? 'max-h-40 opacity-100 mt-1' : 'max-h-0 opacity-0'}`}>
                    <div className="flex flex-col ml-[22px] pl-4 border-l border-zinc-200 dark:border-zinc-800/80 space-y-1 transition-colors">
                      <NavLink to="/messages" onClick={() => { if (window.innerWidth < 768) setIsOpen(false) }} className={({ isActive }) => `block px-3 py-2 rounded-md transition-colors text-sm font-medium ${isActive ? 'bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400' : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white'}`}>
                        Inbox
                      </NavLink>
                      <NavLink to="/connected-employers" onClick={() => { if (window.innerWidth < 768) setIsOpen(false) }} className={({ isActive }) => `block px-3 py-2 rounded-md transition-colors text-sm font-medium ${isActive ? 'bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400' : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white'}`}>
                        Connected Employers
                      </NavLink>
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <NavLink
                key={index}
                to={item.to}
                onClick={() => { if (window.innerWidth < 768) setIsOpen(false) }}
                className={({ isActive }) => `w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-all text-sm font-medium ${isActive
                  ? 'bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400'
                  : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white'
                  }`}
              >
                {item.icon}
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        {/* LOGO & PROFILE FOOTER */}
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800/50 min-w-[16rem] transition-colors shrink-0 flex flex-col gap-3">
          <div className="flex justify-center pb-2">
            <img src={tugmaLogo} alt="Tugma Logo" className="h-16 object-contain dark:invert-0 invert opacity-90 hover:opacity-100 transition-opacity drop-shadow-sm" />
          </div>
          <div className="flex items-center gap-3 px-2 py-2 rounded-md bg-zinc-50 border border-zinc-200 dark:bg-zinc-900/50 dark:border-zinc-800 transition-colors">
            <div className="w-8 h-8 rounded-full bg-purple-600 flex shrink-0 items-center justify-center text-white font-bold shadow-sm">
              {userInitial}
            </div>
            <div className="flex flex-col text-left flex-1 overflow-hidden">
              <span className="text-sm font-medium text-zinc-900 dark:text-white leading-tight truncate">{userName}</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 truncate">{userRole}</span>
            </div>
            <Link to="/login" onClick={() => signOut(auth)} className="text-zinc-400 hover:text-red-500 p-1 rounded-md transition-colors shrink-0" title="Logout">
              <LogOut size={16} />
            </Link>
          </div>
        </div>

      </aside>
    </>
  );
}