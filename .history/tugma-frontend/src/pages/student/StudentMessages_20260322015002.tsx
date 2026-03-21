import { useState, useRef, useEffect } from 'react';
import {
  Search, Send, Paperclip, MoreVertical,
  Image as ImageIcon, Smile, CheckCircle2, Loader2, MessageSquare
} from 'lucide-react';
import { auth } from '../../firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';

export default function StudentMessages() {
  const [uid, setUid] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [conversations, setConversations] = useState<any[]>([]);
  const [activeChat, setActiveChat] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  // 1. Authenticate and Load Conversations
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUid(user.uid);
        loadConversations(user.uid);
      } else {
        setIsLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const loadConversations = async (currentUid: string) => {
    try {
      const res = await fetch(`http://localhost:8080/api/messages/conversations/${currentUid}`);
      if (res.ok) {
        const data = await res.json();
        setConversations(data);

        if (!activeChat && data.length > 0) {
          setActiveChat(data[0]);
        }
      }
    } catch (error) {
      console.error("Failed to load inbox", error);
    } finally {
      setIsLoading(false);
    }
  };

  // 🔥 NEW: SILENT AUDIT LOGGER 🔥
  const logSystemEvent = (action: string, details: string) => {
    if (!uid) return;
    fetch('http://localhost:8080/api/audit/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid, action, details })
    }).catch(err => console.error("Audit log failed (silent):", err));
  };

  // 2. Handle Bridge from Jobs Page (Auto-send first message!)
  useEffect(() => {
    const processPendingChat = async () => {
      const pendingChat = localStorage.getItem('pending_new_chat_student');
      if (pendingChat && uid) {
        try {
          const chatData = JSON.parse(pendingChat);
          const initialMessage = `Hello ${chatData.name}! I am very interested in the ${chatData.role || 'open'} position and would love to learn more.`;

          await fetch('http://localhost:8080/api/messages/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sender_uid: uid,
              receiver_uid: chatData.id,
              message: initialMessage
            })
          });

          // 🔥 LOG THE AUTOMATED FIRST MESSAGE 🔥
          logSystemEvent('Started Conversation', `Initiated chat and sent first message to ${chatData.name}`);

          localStorage.removeItem('pending_new_chat_student');

          await loadConversations(uid);
          setActiveChat({ ...chatData, id: chatData.id });
        } catch (error) {
          console.error("Failed to process pending chat", error);
        }
      }
    };
    processPendingChat();
  }, [uid]);

  // 3. Load Chat Messages & Real-time Polling
  const loadMessages = async () => {
    if (!uid || !activeChat) return;
    try {
      const res = await fetch(`http://localhost:8080/api/messages/chat/${uid}/${activeChat.id}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data);

        setConversations(prev => prev.map(c => c.id === activeChat.id ? { ...c, unread: 0 } : c));
      }
    } catch (error) {
      console.error("Failed to load chat", error);
    }
  };

  // Polling hook (Checks for new messages every 3 seconds)
  useEffect(() => {
    loadMessages();
    const interval = setInterval(() => {
      if (uid && activeChat) {
        loadMessages();
        loadConversations(uid);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [activeChat, uid]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 4. Send Message Function
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() === '' || !uid || !activeChat) return;

    const messageText = newMessage;
    setNewMessage('');
    setIsSending(true);

    setMessages(prev => [...prev, {
      id: Date.now(),
      sender: 'me',
      text: messageText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }]);

    try {
      await fetch('http://localhost:8080/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender_uid: uid,
          receiver_uid: activeChat.id,
          message: messageText
        })
      });

      // 🔥 LOG THE MESSAGE EVENT 🔥
      logSystemEvent('Sent Message', `Sent a message to ${activeChat.name}`);

      loadConversations(uid);
    } catch (error) {
      console.error("Send failed", error);
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-purple-600" size={40} /></div>;

  return (
    <div className="h-[calc(100vh-8rem)] min-h-[500px] flex gap-6 fade-in pb-4 md:pb-0">

      {/* --- LEFT SIDEBAR: CONVERSATIONS LIST --- */}
      <div className="hidden md:flex flex-col w-80 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm shrink-0">

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

        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
          {conversations.length === 0 ? (
            <div className="p-6 text-center text-sm text-zinc-500 mt-10">No messages yet. When an employer contacts you, it will appear here.</div>
          ) : (
            conversations.map((chat) => (
              <button
                key={chat.id}
                onClick={() => setActiveChat(chat)}
                className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all text-left ${activeChat?.id === chat.id
                  ? 'bg-purple-50 dark:bg-purple-500/10 border border-purple-100 dark:border-purple-500/20'
                  : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50 border border-transparent'
                  }`}
              >
                <div className="relative shrink-0">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black shadow-sm ${chat.color || 'bg-purple-600'}`}>
                    {chat.avatar}
                  </div>
                  {chat.online && <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-white dark:border-zinc-900 rounded-full"></span>}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <h4 className={`text-sm font-bold truncate ${activeChat?.id === chat.id ? 'text-purple-700 dark:text-purple-400' : 'text-zinc-900 dark:text-white'}`}>
                      {chat.name}
                    </h4>
                    <span className={`text-[10px] font-bold ${activeChat?.id === chat.id ? 'text-purple-600 dark:text-purple-400' : 'text-zinc-400'}`}>
                      {chat.time}
                    </span>
                  </div>
                  <p className={`text-xs truncate ${chat.unread > 0 ? 'text-zinc-900 dark:text-white font-bold' : 'text-zinc-500 dark:text-zinc-400'}`}>
                    {chat.lastMessage || 'No messages yet'}
                  </p>
                </div>

                {chat.unread > 0 && (
                  <div className="w-5 h-5 rounded-full bg-purple-600 flex items-center justify-center text-[10px] font-bold text-white shrink-0 shadow-sm animate-pulse">
                    {chat.unread}
                  </div>
                )}
              </button>
            ))
          )}
        </div>
      </div>

      {/* --- RIGHT SIDE: ACTIVE CHAT WINDOW --- */}
      <div className="flex-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-sm flex flex-col overflow-hidden relative">
        {activeChat ? (
          <>
            <div className="h-20 px-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md z-10">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black shadow-sm ${activeChat.color || 'bg-purple-600'}`}>
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

            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-zinc-50/30 dark:bg-zinc-950/20">
              {messages.length === 0 ? (
                <div className="text-center text-zinc-400 text-sm mt-10">Start the conversation...</div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.sender === 'me';
                  return (
                    <div key={msg.id} className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`flex flex-col max-w-[75%] md:max-w-[60%] ${isMe ? 'items-end' : 'items-start'}`}>
                        <div className={`px-5 py-3 shadow-sm text-[15px] leading-relaxed relative ${isMe
                          ? 'bg-purple-600 text-white rounded-2xl rounded-tr-sm'
                          : 'bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white rounded-2xl rounded-tl-sm'
                          }`}>
                          {msg.text}
                        </div>
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mt-1.5 px-1">
                          {msg.time}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

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
                  disabled={newMessage.trim() === '' || isSending}
                  className="p-3 bg-purple-600 disabled:bg-purple-400 hover:bg-purple-700 text-white rounded-xl transition-all shadow-md shadow-purple-500/20 shrink-0 flex items-center justify-center"
                >
                  {isSending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} className={newMessage.trim() !== '' ? 'translate-x-0.5 -translate-y-0.5 transition-transform' : ''} />}
                </button>
              </form>
              <p className="text-center text-[10px] font-medium text-zinc-400 mt-3">
                Press Enter to send. Employers usually respond within 24 hours.
              </p>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-400">
            <MessageSquare size={48} className="mb-4 opacity-20" />
            <p className="font-bold text-zinc-500">No chat selected</p>
            <p className="text-sm">Choose an employer from the left to start messaging.</p>
          </div>
        )}
      </div>
    </div>
  );
}