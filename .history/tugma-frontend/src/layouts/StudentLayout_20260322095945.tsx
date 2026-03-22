import { useState } from 'react';
import { Outlet } from 'react-router-dom'; 
import { useLocation } from 'react-router-dom';
import Sidebar from '../components/StudentSidebar';
import Topbar from '../components/Topbar';
import FloatingChatWidget from '../components/FloatingChatWidget';



interface DashboardLayoutProps {
  children?: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  const isMessagesPage = location.pathname === '/messages';

  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-zinc-950 overflow-hidden font-sans">
      
      {/* Sidebar */}
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      
      
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Topbar */}
        <Topbar 
          isSidebarOpen={isSidebarOpen} 
          toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} 
        />

        {/* Page */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
{children || <Outlet />}          </div>
        </main>
{!isMessagesPage && <FloatingChatWidget />}
      </div>
    </div>
  );
}