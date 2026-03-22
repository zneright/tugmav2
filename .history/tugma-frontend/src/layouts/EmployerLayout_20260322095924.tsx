import { useState } from 'react';
import { useLocation, Outlet } from 'react-router-dom'; 
import EmployerSidebar from '../components/EmployerSidebar';
import Topbar from '../components/Topbar'; 
import FloatingChatWidget from '../components/FloatingChatWidget'; 

interface EmployerLayoutProps {
  children?: React.ReactNode;
}

export default function EmployerLayout({ children }: EmployerLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  // 4. Check if they are on the employer messages page
  const isMessagesPage = location.pathname === '/employer/messages';

  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-zinc-950 overflow-hidden font-sans transition-colors duration-300">
      
      {/* 1. Fixed Left Sidebar (Employer Version) */}
      <EmployerSidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      {/* 2. Main Content Wrapper (Added 'relative' here!) */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        
        {/* 3. Sticky Topbar (Reused) */}
        <Topbar isSidebarOpen={isSidebarOpen} toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

        {/* 4. Scrollable Main Content Area */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
            {children || <Outlet />}
          </div>
        </main>

        {/* 5. Floating Chat Widget (Hidden when on the Messages page) */}
        {!isMessagesPage && <FloatingChatWidget />}
        
      </div>
    </div>
  );
}