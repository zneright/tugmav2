import { useState } from 'react';
import { MoreHorizontal, Edit, ChevronDown, Search, Send } from 'lucide-react';

export default function FloatingChatWidget() {
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <div className="fixed bottom-0 right-4 sm:right-8 z-50 w-80 drop-shadow-2xl flex flex-col justify-end">
      
      {/* Chat Header (Always Visible) */}
      <button 
        onClick={() => setIsChatOpen(!isChatOpen)}
        className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-t-2xl p-3 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]"
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white font-black text-xs">N</div>
            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white dark:border-zinc-900"></div>
          </div>
          <span className="font-bold text-zinc-900 dark:text-white text-sm">Messaging</span>
        </div>
        <div className="flex items-center gap-2 text-zinc-500">
          <MoreHorizontal size={16} className="hover:text-purple-600" />
          <Edit size={14} className="hover:text-purple-600" />
          <ChevronDown size={18} className={`transform transition-transform ${isChatOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {/* Chat Body (Collapsible) */}
      <div className={`bg-white dark:bg-zinc-900 border-x border-zinc-200 dark:border-zinc-700 transition-all duration-300 ease-in-out origin-bottom overflow-hidden ${isChatOpen ? 'h-[400px] border-b' : 'h-0'}`}>
        
        {/* Search Bar */}
        <div className="p-2 border-b border-zinc-100 dark:border-zinc-800">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input type="text" placeholder="Search messages" className="w-full pl-8 pr-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-md text-xs outline-none dark:text-white" />
          </div>
        </div>

        {/* Messages Area */}
        <div className="h-[280px] p-4 flex flex-col gap-4 overflow-y-auto bg-zinc-50/50 dark:bg-zinc-950/50 custom-scrollbar">
          <div className="flex w-full justify-start">
            <div className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white px-3 py-2 rounded-xl rounded-tl-sm text-xs max-w-[80%] shadow-sm">
              HI
            </div>
          </div>
          <div className="flex w-full justify-end">
            <div className="bg-purple-600 text-white px-3 py-2 rounded-xl rounded-tr-sm text-xs max-w-[80%] shadow-sm">
              HELLO
            </div>
          </div>
          <div className="flex w-full justify-start">
            <div className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white px-3 py-2 rounded-xl rounded-tl-sm text-xs max-w-[80%] shadow-sm">
              message here
            </div>
          </div>
        </div>

        {/* Input Area */}
        <div className="p-3 bg-white dark:bg-zinc-900 border-t border-zinc-100 dark:border-zinc-800 flex gap-2">
          <input type="text" placeholder="Write a message..." className="flex-1 bg-zinc-100 dark:bg-zinc-800 rounded-full px-3 py-1.5 text-xs outline-none dark:text-white" />
          <button className="w-8 h-8 bg-purple-600 hover:bg-purple-700 rounded-full flex items-center justify-center text-white shrink-0">
            <Send size={12} className="ml-0.5" />
          </button>
        </div>

      </div>

    </div>
  );
}