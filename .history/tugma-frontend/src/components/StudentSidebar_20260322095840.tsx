import { LayoutDashboard, Briefcase, MessageSquare, User, Bell, X, ChevronDown, HelpCircle, Clock } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useState } from 'react';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export default function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isMessagesMenuOpen, setIsMessagesMenuOpen] = useState(false);

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
        <div className="h-16 flex items-center justify-between px-6 border-b border-zinc-200 dark:border-zinc-800/50 min-w-[16rem] transition-colors">
          <span className="text-xl font-bold text-zinc-900 dark:text-white tracking-tight">TUGMA</span>
          <button className="md:hidden p-1 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors" onClick={() => setIsOpen(false)}>
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 py-6 px-3 space-y-1 min-w-[16rem] overflow-y-auto">
          {navItems.map((item, index) => {

            // --- PROFILE SUBMENU ---
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

            // --- MESSAGES SUBMENU ---
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

            // --- NORMAL LINKS ---
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

        {/* Bottom User Card */}
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800/50 min-w-[16rem] transition-colors">
          <div className="flex items-center gap-3 px-2 py-2 rounded-md bg-zinc-50 border border-zinc-200 dark:bg-zinc-900/50 dark:border-zinc-800 transition-colors">
            <div className="w-8 h-8 rounded-full bg-purple-600 flex shrink-0 items-center justify-center text-xs font-bold text-white shadow-sm">
              N
            </div>
            <div className="flex flex-col text-left flex-1 overflow-hidden">
              <span className="text-sm font-medium text-zinc-900 dark:text-white leading-tight truncate">Nishia</span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400 truncate">Student</span>
            </div>
          </div>
        </div>

      </aside>
    </>
  );
}