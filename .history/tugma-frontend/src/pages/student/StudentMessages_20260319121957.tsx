import { useState, useRef, useEffect } from 'react';
import { 
  Search, Send, Paperclip, MoreVertical, 
  Image as ImageIcon, Smile, CheckCircle2 
} from 'lucide-react';

export default function StudentMessages() {
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Mock Conversations List
  const [conversations] = useState([
    { id: 1, name: 'TechFlow Inc.', role: 'HR Department', avatar: 'T', lastMessage: 'We would love to schedule an interview...', time: '10:42 AM', unread: 2, online: true, color: 'bg-blue-600' },
    { id: 2, name: 'Creative Studio PH', role: 'Design Lead', avatar: 'C', lastMessage: 'Thanks for your portfolio submission!', time: 'Yesterday', unread: 0, online: false, color: 'bg-purple-600' },
    { id: 3, name: 'BuildRight Systems', role: 'Recruitment', avatar: 'B', lastMessage: 'Are you familiar with Next.js?', time: 'Mon', unread: 0, online: true, color: 'bg-emerald-600' },
  ]);

  const [activeChat, setActiveChat] = useState(conversations[0]);

  // Mock Chat History for the active chat
  const [messages, setMessages] = useState([
    { id: 1, sender: 'employer', text: 'Hi Gem! We reviewed your application for the Frontend Intern role.', time: '10:30 AM' },
    { id: 2, sender: 'employer', text: 'Your Capstone project (IAIN) looks really impressive. We use a similar stack here.', time: '10:31 AM' },
    { id: 3, sender: 'me', text: 'Hello! Thank you so much for reaching out. Yes, I built that using React and Firebase.', time: '10:35 AM' },
    { id: 4, sender: 'employer', text: 'That is great to hear. We would love to schedule a quick technical interview with you sometime this week.', time: '10:42 AM' },
  ]);

  // Auto-scroll to the bottom when a new message is sent
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() === '') return;

    // Add new message to the UI
    setMessages([...messages, { 
      id: Date.now(), 
      sender: 'me', 
      text: newMessage, 
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
    }]);
    setNewMessage('');
  };

  return (
    <div className="h-[calc(100vh-8rem)] min-h-[500px] flex gap-6 fade-in">
      
      {/* --- LEFT SIDEBAR: CONVERSATIONS LIST --- */}
      <div className="hidden md:flex flex-col w-80 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm shrink-0">
        
        {/* Search Header */}
        <div className="p-5 border-b border-zinc-100 dark:border-zinc-800">
          <h2 className="text-xl font-black text-zinc-900 dark:text-white mb-4">Messages</h2>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input 
              type="text" 
              placeholder="Search messages..." 
              className="w-full pl-9 pr-4 py-2 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all dark:text-white text-sm"
            />
          </div>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
          {conversations.map((chat) => (
            <button 
              key={chat.id}
              onClick={() => setActiveChat(chat)}
              className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all text-left ${
                activeChat.id === chat.id 
                  ? 'bg-purple-50 dark:bg-purple-500/10 border border-purple-100 dark:border-purple-500/20' 
                  : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50 border border-transparent'
              }`}
            >
              <div className="relative shrink-0">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black shadow-sm ${chat.color}`}>
                  {chat.avatar}
                </div>
                {chat.online && <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-white dark:border-zinc-900 rounded-full"></span>}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <h4 className={`text-sm font-bold truncate ${activeChat.id === chat.id ? 'text-purple-700 dark:text-purple-400' : 'text-zinc-900 dark:text-white'}`}>
                    {chat.name}
                  </h4>
                  <span className={`text-[10px] font-bold ${activeChat.id === chat.id ? 'text-purple-600 dark:text-purple-400' : 'text-zinc-400'}`}>
                    {chat.time}
                  </span>
                </div>
                <p className={`text-xs truncate ${chat.unread > 0 ? 'text-zinc-900 dark:text-white font-bold' : 'text-zinc-500 dark:text-zinc-400'}`}>
                  {chat.lastMessage}
                </p>
              </div>

              {chat.unread > 0 && (
                <div className="w-5 h-5 rounded-full bg-purple-600 flex items-center justify-center text-[10px] font-bold text-white shrink-0 shadow-sm">
                  {chat.unread}
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* --- RIGHT SIDE: ACTIVE CHAT WINDOW --- */}
      <div className="flex-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-sm flex flex-col overflow-hidden relative">
        
        {/* Chat Header */}
        <div className="h-20 px-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md z-10">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black shadow-sm ${activeChat.color}`}>
              {activeChat.avatar}
            </div>
            <div>
              <h3 className="font-bold text-zinc-900 dark:text-white text-lg leading-tight flex items-center gap-2">
                {activeChat.name} <CheckCircle2 size={16} className="text-blue-500" />
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                {activeChat.role} • {activeChat.online ? <span className="text-emerald-500">Active Now</span> : 'Offline'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2.5 text-zinc-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-500/10 rounded-xl transition-colors">
              <Search size={20} />
            </button>
            <button className="p-2.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors">
              <MoreVertical size={20} />
            </button>
          </div>
        </div>

        {/* Chat Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-zinc-50/30 dark:bg-zinc-950/20">
          {messages.map((msg) => {
            const isMe = msg.sender === 'me';
            return (
              <div key={msg.id} className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex flex-col max-w-[75%] md:max-w-[60%] ${isMe ? 'items-end' : 'items-start'}`}>
                  
                  {/* ✨ THE CHAT BUBBLE MAGIC ✨ */}
                  <div className={`px-5 py-3 shadow-sm text-[15px] leading-relaxed relative ${
                    isMe 
                      ? 'bg-purple-600 text-white rounded-2xl rounded-tr-sm' // Right-pointing bubble
                      : 'bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white rounded-2xl rounded-tl-sm' // Left-pointing bubble
                  }`}>
                    {msg.text}
                  </div>
                  
                  {/* Timestamp */}
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mt-1.5 px-1">
                    {msg.time}
                  </span>
                </div>
              </div>
            );
          })}
          {/* Invisible div to force scroll to bottom */}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input Box */}
        <div className="p-4 bg-white dark:bg-zinc-900 border-t border-zinc-100 dark:border-zinc-800">
          <form 
            onSubmit={handleSendMessage}
            className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-800/50 p-2 rounded-2xl border border-zinc-200 dark:border-zinc-700 focus-within:ring-2 focus-within:ring-purple-500/20 focus-within:border-purple-500 transition-all"
          >
            <button type="button" className="p-2.5 text-zinc-400 hover:text-purple-600 transition-colors shrink-0">
              <Paperclip size={20} />
            </button>
            <button type="button" className="hidden sm:block p-2.5 text-zinc-400 hover:text-purple-600 transition-colors shrink-0">
              <ImageIcon size={20} />
            </button>
            
            <input 
              type="text" 
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message here..." 
              className="flex-1 bg-transparent border-none outline-none text-sm dark:text-white px-2 placeholder:text-zinc-400"
            />
            
            <button type="button" className="hidden sm:block p-2.5 text-zinc-400 hover:text-amber-500 transition-colors shrink-0">
              <Smile size={20} />
            </button>
            <button 
              type="submit"
              disabled={newMessage.trim() === ''}
              className="p-3 bg-purple-600 disabled:bg-purple-400 hover:bg-purple-700 text-white rounded-xl transition-all shadow-md shadow-purple-500/20 shrink-0"
            >
              <Send size={18} className={newMessage.trim() !== '' ? 'translate-x-0.5 -translate-y-0.5 transition-transform' : ''} />
            </button>
          </form>
          <p className="text-center text-[10px] font-medium text-zinc-400 mt-3">
            Press Enter to send. Employers usually respond within 24 hours.
          </p>
        </div>

      </div>
    </div>
  );
}