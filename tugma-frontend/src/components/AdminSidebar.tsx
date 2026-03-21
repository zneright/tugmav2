import { LayoutDashboard, Users, ShieldCheck, Bell, FileWarning, Settings, X, LogOut, ChevronDown } from 'lucide-react';
import { NavLink, Link } from 'react-router-dom';
import { useState } from 'react';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export default function AdminSidebar({ isOpen, setIsOpen }: SidebarProps) {
  // Added state for the submenu
  const [isSettingsMenuOpen, setIsSettingsMenuOpen] = useState(false);

  const navItems = [
    { to: '/admin/dashboard', icon: <LayoutDashboard size={20} />, label: 'Admin Overview' },
    { to: '/admin/users', icon: <Users size={20} />, label: 'User Management' },
    { to: '/admin/verification', icon: <ShieldCheck size={20} />, label: 'Verifications' },
    { to: '/admin/notifications', icon: <Bell size={20} />, label: 'Notifications' }, // <-- Fixed missing '/'
    { to: '/admin/reports', icon: <FileWarning size={20} />, label: 'System Reports' },
    { to: '/admin/settings', icon: <Settings size={20} />, label: 'Platform Settings' },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-zinc-900/50 dark:bg-black/60 z-40 md:hidden transition-opacity" 
          onClick={() => setIsOpen(false)} 
        />
      )}

      <aside className={`
        fixed md:relative inset-y-0 left-0 z-50 w-64 flex flex-col transition-all duration-300 ease-in-out
        bg-white dark:bg-zinc-950 text-zinc-600 dark:text-zinc-300 border-r border-zinc-200 dark:border-zinc-800
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-zinc-200 dark:border-zinc-800">
          <span className="text-xl font-black text-zinc-900 dark:text-white tracking-tight">
            TUGMA <span className="text-[10px] bg-red-600 text-white px-1.5 py-0.5 rounded ml-1 uppercase">Admin</span>
          </span>
          <button 
            className="md:hidden text-zinc-400 hover:text-zinc-900 dark:hover:text-white" 
            onClick={() => setIsOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item, index) => {
            
            // --- SUBMENU LOGIC FOR SETTINGS ---
            if (item.label === 'Platform Settings') {
              return (
                <div key={index} className="flex flex-col">
                  <button
                    onClick={() => setIsSettingsMenuOpen(!isSettingsMenuOpen)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-md transition-colors text-sm font-medium ${
                      isSettingsMenuOpen 
                        ? 'bg-zinc-100 text-zinc-900 dark:bg-zinc-900 dark:text-white' 
                        : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {item.icon}
                      {item.label}
                    </div>
                    <ChevronDown size={16} className={`transition-transform duration-200 ${isSettingsMenuOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {/* The Submenu Dropdown */}
                  <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isSettingsMenuOpen ? 'max-h-40 opacity-100 mt-1' : 'max-h-0 opacity-0'}`}>
                    <div className="flex flex-col ml-[22px] pl-4 border-l border-zinc-200 dark:border-zinc-800/80 space-y-1">
                      
                      <NavLink 
                        to="/admin/settings" 
                        onClick={() => { if (window.innerWidth < 768) setIsOpen(false) }} 
                        className={({ isActive }) => `block px-3 py-2 rounded-md transition-colors text-sm font-medium ${isActive ? 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400' : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white'}`}
                      >
                        Global Settings
                      </NavLink>
                      
                      {/* Linking the Support page you requested earlier! */}
                      <NavLink 
                        to="/admin/support" 
                        onClick={() => { if (window.innerWidth < 768) setIsOpen(false) }} 
                        className={({ isActive }) => `block px-3 py-2 rounded-md transition-colors text-sm font-medium ${isActive ? 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400' : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white'}`}
                      >
                        Customer Service
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
                className={({ isActive }) => `
                  flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all
                  ${isActive 
                    ? 'bg-red-600 text-white shadow-md shadow-red-500/20' 
                    : 'hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'}
                `}
              >
                {item.icon} {item.label}
              </NavLink>
            );
          })}
        </nav>

        {/* Admin Profile Footer */}
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-3 p-2 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
            <div className="w-8 h-8 rounded bg-red-600 flex items-center justify-center text-xs font-bold text-white shadow-sm">
              AD
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-zinc-900 dark:text-white truncate">Main Admin</p>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-500 truncate">Root Access</p>
            </div>
            <Link 
              to="/login" 
              className="text-zinc-400 hover:text-red-500 transition-colors"
              title="Logout"
            >
              <LogOut size={16} />
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
}