import { Search, MessageSquare, Bell, Menu } from 'lucide-react';

interface NavbarProps {
  onMenuClick: () => void;
}

export default function Navbar({ onMenuClick }: NavbarProps) {
  return (
    <nav className="fixed top-0 w-full h-16 bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 z-50 px-4 sm:px-6 lg:px-8 flex items-center justify-between shadow-sm">
      
      {/* urger (Mobile) + Logo & Search */}
      <div className="flex items-center gap-3 sm:gap-6 flex-1">
        
        {/* NEW BURGER BUTTON */}
        <button 
          onClick={onMenuClick}
          className="md:hidden p-1 -ml-1 text-zinc-500 hover:text-purple-600 transition-colors"
        >
          <Menu size={24} />
        </button>

        <span className="text-2xl font-black text-purple-700 dark:text-purple-500 tracking-tight hidden sm:block">TUGMA</span>
        
        <div className="flex relative max-w-md w-full group">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-purple-600 transition-colors" />
          <input 
            type="text" 
            placeholder="Search..." 
            className="w-full pl-10 pr-4 py-2 text-sm bg-zinc-100 dark:bg-zinc-900 border-transparent rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all dark:text-white"
          />
        </div>
      </div>

      {/* Right: Actions & Profile */}
      <div className="flex items-center gap-2 sm:gap-4 ml-2">
        <button className="hidden sm:flex p-2 text-zinc-500 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-zinc-800 rounded-full transition-colors relative">
          <MessageSquare size={20} />
        </button>
        <button className="p-2 text-zinc-500 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-zinc-800 rounded-full transition-colors relative">
          <Bell size={20} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-zinc-950"></span>
        </button>
        <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white text-sm font-bold cursor-pointer ml-1 shadow-sm shrink-0">
          N
        </div>
      </div>
    </nav>
  );
}