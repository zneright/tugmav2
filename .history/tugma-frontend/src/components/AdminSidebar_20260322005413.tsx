import { LayoutDashboard, Users, Bell, FileWarning, LifeBuoy, X, LogOut } from 'lucide-react';
import { NavLink, Link } from 'react-router-dom';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export default function AdminSidebar({ isOpen, setIsOpen }: SidebarProps) {

  const navItems = [
    { to: '/admin/dashboard', icon: <LayoutDashboard size={20} />, label: 'Admin Overview' },
    { to: '/admin/users', icon: <Users size={20} />, label: 'User Management' },
    { to: '/admin/notifications', icon: <Bell size={20} />, label: 'Notifications' },
    { to: '/admin/support', icon: <LifeBuoy size={20} />, label: 'Customer Service' },
    { to: '/admin/reports', icon: <FileWarning size={20} />, label: 'System Reports' },
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
          {navItems.map((item, index) => (
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
          ))}
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