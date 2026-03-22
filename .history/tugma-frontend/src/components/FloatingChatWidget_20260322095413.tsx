import { useState, useEffect, useRef } from 'react';
import { MoreHorizontal, Edit, ChevronDown, Search, Send, ArrowLeft, Loader2 } from 'lucide-react';
import { auth } from '../firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';

interface Conversation {
  id: string;
  name: string;
  role: string;
  avatar: string;
  lastMessage: string;
  time: string;
  unread: number;
  color: string;
}

interface Message {
  id: number;
  sender: 'me' | 'other';
  text: string;
  time: string;
}

export default function FloatingChatWidget() {
  const [uid, setUid] = useState<string | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Navigation States
  const [view, setView] = useState<'list' | 'chat'>('list');
  const [activeChat, setActiveChat] = useState<Conversation | null>(null);

  // Data States
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUid(user.uid);
        const pendingStudentChat = localStorage.getItem('pending_new_chat_student');
        const pendingEmployerChat = localStorage.getItem('pending_new_chat');

        if (pendingStudentChat || pendingEmployerChat) {
          const chatData = JSON.parse((pendingStudentChat || pendingEmployerChat) as string);
          setActiveChat(chatData);
          setView('chat');
          setIsChatOpen(true);
          fetchChat(user.uid, chatData.id);

          // Clear the pending requests
          localStorage.removeItem('pending_new_chat_student');
          localStorage.removeItem('pending_new_chat');
        } else {
          fetchConversations(user.uid);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // 2. Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, view, isChatOpen]);

  // 3. Polling for real-time updates (Every 5 seconds if open)
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isChatOpen && uid) {
      interval = setInterval(() => {
        if (view === 'list') {
          fetchConversations(uid);
        } else if (view === 'chat' && activeChat) {
          fetchChat(uid, activeChat.id);
        }
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [isChatOpen, view, activeChat, uid]);

  // --- API CALLS ---
  const fetchConversations = async (userId: string) => {
    try {
      const res = await fetch(`http://localhost:8080/api/messages/conversations/${userId}`);
      if (res.ok) {
        const data = await res.json();
        setConversations(data);
      }
    } catch (error) {
      console.error("Failed to load conversations:", error);
    }
  };

  const fetchChat = async (myUid: string, otherUid: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`http://localhost:8080/api/messages/chat/${myUid}/${otherUid}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (error) {
      console.error("Failed to load chat:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // --- HANDLERS ---
  const handleOpenChat = (conv: Conversation) => {
    setActiveChat(conv);
    setView('chat');
    if (uid) fetchChat(uid, conv.id);
  };

  const handleBackToList = () => {
    setActiveChat(null);
    setView('list');
    if (uid) fetchConversations(uid);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeChat || !uid) return;

    const msgText = inputText.trim();
    setInputText(''); // Clear input instantly

    // Optimistic Update (Show instantly in UI)
    const optimisticMsg: Message = {
      id: Date.now(),
      sender: 'me',
      text: msgText,
      time: 'Just now'
    };
    setMessages(prev => [...prev, optimisticMsg]);

    try {
      await fetch('http://localhost:8080/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender_uid: uid,
          receiver_uid: activeChat.id,
          message: msgText
        })
      });
      // Silently refresh to get true DB ID and timestamp
      fetchChat(uid, activeChat.id);
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const filteredConversations = conversations.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed bottom-0 right-4 sm:right-8 z-50 w-80 drop-shadow-2xl flex flex-col justify-end">

      {/* Chat Header (Always Visible) */}
      <button
        onClick={() => {
          setIsChatOpen(!isChatOpen);
          if (!isChatOpen && uid && view === 'list') fetchConversations(uid);
        }}
        className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-t-2xl p-3 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]"
      >
        <div className="flex items-center gap-3">
          {view === 'chat' && isChatOpen ? (
            // Header for Active Chat
            <>
              <div
                onClick={(e) => { e.stopPropagation(); handleBackToList(); }}
                className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors mr-1"
              >
                <ArrowLeft size={16} className="text-zinc-500" />
              </div>
              <div className="relative shrink-0">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white font-black text-xs ${activeChat?.color || 'bg-purple-600'}`}>
                  {activeChat?.avatar}
                </div>
                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white dark:border-zinc-900"></div>
              </div>
              <span className="font-bold text-zinc-900 dark:text-white text-sm truncate max-w-[120px] text-left">
                {activeChat?.name}
              </span>
            </>
          ) : (
            // Header for Main List
            <>
              <div className="relative">
                <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white font-black text-xs">M</div>
                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white dark:border-zinc-900"></div>
              </div>
              <span className="font-bold text-zinc-900 dark:text-white text-sm">Messaging</span>
              {/* Unread Badge for List View */}
              {conversations.reduce((sum, c) => sum + c.unread, 0) > 0 && (
                <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-1">
                  {conversations.reduce((sum, c) => sum + c.unread, 0)}
                </span>
              )}
            </>
          )}
        </div>
        <div className="flex items-center gap-2 text-zinc-500">
          <MoreHorizontal size={16} className="hover:text-purple-600 hidden sm:block" />
          <Edit size={14} className="hover:text-purple-600 hidden sm:block" />
          <ChevronDown size={18} className={`transform transition-transform ${isChatOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {/* Chat Body (Collapsible) */}
      <div className={`bg-white dark:bg-zinc-900 border-x border-zinc-200 dark:border-zinc-700 transition-all duration-300 ease-in-out origin-bottom flex flex-col overflow-hidden ${isChatOpen ? 'h-[400px] border-b' : 'h-0'}`}>

        {view === 'list' ? (
          /* ================================== */
          /* CONVERSATION LIST          */
          /* ================================== */
          <>
            <div className="p-2 border-b border-zinc-100 dark:border-zinc-800">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search messages"
                  className="w-full pl-8 pr-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-md text-xs outline-none dark:text-white"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar bg-white dark:bg-zinc-900">
              {filteredConversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-zinc-400">
                  <p className="text-xs">No conversations yet.</p>
                </div>
              ) : (
                filteredConversations.map(conv => (
                  <div
                    key={conv.id}
                    onClick={() => handleOpenChat(conv)}
                    className="flex items-center gap-3 p-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 cursor-pointer border-b border-zinc-50 dark:border-zinc-800/50 transition-colors"
                  >
                    <div className="relative shrink-0">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-sm shadow-sm ${conv.color}`}>
                        {conv.avatar}
                      </div>
                      {conv.unread > 0 && (
                        <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-white dark:border-zinc-900 flex items-center justify-center"></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-0.5">
                        <h4 className={`text-sm truncate pr-2 ${conv.unread > 0 ? 'font-bold text-zinc-900 dark:text-white' : 'font-medium text-zinc-700 dark:text-zinc-300'}`}>
                          {conv.name}
                        </h4>
                        <span className="text-[10px] text-zinc-400 shrink-0">{conv.time}</span>
                      </div>
                      <p className={`text-xs truncate ${conv.unread > 0 ? 'font-bold text-zinc-900 dark:text-white' : 'text-zinc-500 dark:text-zinc-400'}`}>
                        {conv.lastMessage || "Started a conversation"}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        ) : (
          /* ================================== */
          /* ACTIVE CHAT             */
          /* ================================== */
          <>
            <div className="flex-1 p-3 sm:p-4 flex flex-col gap-3 overflow-y-auto bg-zinc-50/50 dark:bg-zinc-950/50 custom-scrollbar">
              {isLoading && messages.length === 0 ? (
                <div className="flex justify-center py-4"><Loader2 size={20} className="animate-spin text-purple-600" /></div>
              ) : messages.length === 0 ? (
                <div className="flex justify-center py-10 text-xs text-zinc-400 text-center">
                  Say hi to start the conversation!
                </div>
              ) : (
                messages.map((m) => (
                  <div key={m.id} className={`flex w-full ${m.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`flex flex-col ${m.sender === 'me' ? 'items-end' : 'items-start'} max-w-[85%]`}>
                      <div className={`px-3 py-2 rounded-2xl text-[13px] shadow-sm ${m.sender === 'me'
                        ? 'bg-purple-600 text-white rounded-tr-sm'
                        : 'bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white rounded-tl-sm'
                        }`}>
                        {m.text}
                      </div>
                      <span className="text-[9px] text-zinc-400 mt-1 px-1">{m.time}</span>
                    </div>
                  </div>
                ))
              )}
              {/* Invisible div to force auto-scroll to bottom */}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSendMessage} className="p-3 bg-white dark:bg-zinc-900 border-t border-zinc-100 dark:border-zinc-800 flex gap-2 items-center">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Write a message..."
                className="flex-1 bg-zinc-100 dark:bg-zinc-800 rounded-full px-4 py-2 text-xs outline-none dark:text-white border border-transparent focus:border-purple-500/30 transition-colors"
              />
              <button
                type="submit"
                disabled={!inputText.trim()}
                className="w-8 h-8 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:hover:bg-purple-600 rounded-full flex items-center justify-center text-white shrink-0 transition-colors"
              >
                <Send size={12} className="ml-0.5" />
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}