import { LayoutDashboard, Users, FileWarning, LifeBuoy, X, LogOut, ShieldAlert, Shield } from 'lucide-react';
import { NavLink, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { auth } from '../firebaseConfig';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import tugmaLogo from '../assets/tugma_logo_2.png';
import tugmaLogo2 from '../assets/tugma_2.png';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export default function AdminSidebar({ isOpen, setIsOpen }: SidebarProps) {

  // Dynamic User States
  const [userName, setUserName] = useState('Loading...');
  const [userRole, setUserRole] = useState('Admin');
  const [userInitial, setUserInitial] = useState('-');
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const profileRes = await fetch(`http://localhost:8080/api/users/role/${user.uid}`);
          if (profileRes.ok) {
            const data = await profileRes.json();
            const trueRole = data.role?.toLowerCase() || 'admin';
            const isSuper = trueRole === 'superadmin';
            setIsSuperAdmin(isSuper);
            setUserRole(isSuper ? 'Super Admin' : 'Admin');
          }

          const res = await fetch(`http://localhost:8080/api/users/profile/${user.uid}`);
          if (res.ok) {
            const data = await res.json();
            const finalName = `${data.firstName || data.first_name || ''} ${data.lastName || data.last_name || ''}`.trim() || 'Admin';
            setUserName(finalName);
            setUserInitial(finalName.charAt(0).toUpperCase());
          }
        } catch (e) {
          setUserName('System Admin');
          setUserInitial('A');
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const navItems = [
    { to: '/admin/dashboard', icon: <LayoutDashboard size={20} />, label: 'Admin Overview' },
    { to: '/admin/users', icon: <Users size={20} />, label: 'User Management' },
    { to: '/admin/support', icon: <LifeBuoy size={20} />, label: 'Customer Service' },
    { to: '/admin/reports', icon: <FileWarning size={20} />, label: 'System Reports' },
  ];

  return (
    <>
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
        {/* HEADER */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
          <span className="text-xl font-black text-zinc-900 dark:text-white tracking-tight flex items-center gap-1">
            <img src={tugmaLogo} alt="Tugma Logo" className="h-20 opacity-90 hover:opacity-100 transition-opacity drop-shadow-sm" />
            TUGMA <span className="text-[10px] bg-red-600 text-white px-1.5 py-0.5 rounded uppercase tracking-wider font-bold mt-0.5">Admin</span>
          </span>
          <button
            className="md:hidden p-1 -mr-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white rounded-md transition-colors"
            onClick={() => setIsOpen(false)}
          >
            <X size={20} />
          </button>
        </div >

        {/* Navigation */}
        <nav nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto custom-scrollbar" >
          {
            navItems.map((item, index) => (
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
            ))
          }
        </nav >

        {/* LOGO & PROFILE FOOTER */}
        < div className="p-4 border-t border-zinc-200 dark:border-zinc-800 shrink-0 flex flex-col gap-3" >
          <div className="flex justify-center pb-2">
            <img src={tugmaLogo} alt="Tugma Logo" className="h-20 opacity-90 hover:opacity-100 transition-opacity drop-shadow-sm" />
          </div>
          <div className="flex items-center gap-3 p-2 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">

            <div className="w-8 h-8 rounded bg-red-600 flex items-center justify-center text-white shadow-sm shrink-0">
              {isSuperAdmin ? <ShieldAlert size={16} /> : <Shield size={16} />}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-zinc-900 dark:text-white truncate">
                {userName}
              </p>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-500 truncate uppercase tracking-wider font-bold">
                {userRole}
              </p>
            </div>

            <Link
              to="/login"
              onClick={() => signOut(auth)}
              className="text-zinc-400 hover:text-red-500 p-1 rounded-md transition-colors shrink-0"
              title="Logout"
            >
              <LogOut size={16} />
            </Link>
          </div>
        </div >
      </aside >
    </>
  );
}