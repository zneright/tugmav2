import { useState, useRef, useEffect } from 'react';
import {
  Search, Send, MoreVertical,
  CheckCircle2, FileText, Loader2, MessageSquare, Printer
} from 'lucide-react';
import { auth } from '../../firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import PrintDTRModal from '../../components/PrintDtrModal'; // Adjust path if needed

export default function EmployerMessages() {
  const [uid, setUid] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [conversations, setConversations] = useState<any[]>([]);
  const [activeChat, setActiveChat] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  // 🔥 NEW: State for Print Modal
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printLogs, setPrintLogs] = useState<any[]>([]);
  const [printProfile, setPrintProfile] = useState<any>(null);
  const [printRequiredHours, setPrintRequiredHours] = useState(450);
  const [printCompletedHours, setPrintCompletedHours] = useState(0);

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

        const pathParts = window.location.pathname.split('/');
        const targetUid = pathParts[pathParts.length - 1];

        let targetChat = null;
        if (targetUid && targetUid !== 'messages') {
          targetChat = data.find((c: any) => c.id === targetUid);
        }

        if (targetChat) {
          setActiveChat(targetChat);
        } else if (!activeChat && data.length > 0) {
          setActiveChat(data[0]);
        }
      }
    } catch (error) {
      console.error("Failed to load inbox", error);
    } finally {
      setIsLoading(false);
    }
  };

  // : SILENT AUDIT 
  const logSystemEvent = (action: string, details: string) => {
    if (!uid) return;
    fetch('http://localhost:8080/api/audit/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid, action, details })
    }).catch(err => console.error("Audit log failed (silent):", err));
  };

  // Auto-send first message!
  useEffect(() => {
    const processPendingChat = async () => {
      const pendingChat = localStorage.getItem('pending_new_chat');
      if (pendingChat && uid) {
        try {
          const chatData = JSON.parse(pendingChat);
          const initialMessage = `Hi ${chatData.name.split(' ')[0]}, thanks for applying to the ${chatData.role || 'open'} position! We are reviewing your application now.`;

          await fetch('http://localhost:8080/api/messages/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sender_uid: uid,
              receiver_uid: chatData.id,
              message: initialMessage
            })
          });

          logSystemEvent('Started Conversation', `Initiated chat and sent first message to ${chatData.name}`);

          localStorage.removeItem('pending_new_chat');
          await loadConversations(uid);
          setActiveChat({ ...chatData, id: chatData.id });
        } catch (error) {
          console.error("Failed to process pending chat", error);
        }
      }
    };
    processPendingChat();
  }, [uid]);

  // Load Chat Messages 
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

  // 4. Send Message 
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

      logSystemEvent('Sent Message', `Sent a message to applicant: ${activeChat.name}`);

      loadConversations(uid);
    } catch (error) {
      console.error("Send failed", error);
    } finally {
      setIsSending(false);
    }
  };

  //  FETCH & OPEN PRINT MODAL 
  const handleOpenPrintModal = async () => {
    if (!activeChat) return;
    setIsPrinting(true);

    try {
      const [logsRes, profRes] = await Promise.all([
        fetch(`http://localhost:8080/api/dtr/logs/${activeChat.id}`),
        fetch(`http://localhost:8080/api/users/profile/${activeChat.id}`)
      ]);

      let fetchedLogs: any[] = [];
      let fetchedProfile: any = { firstName: activeChat.name.split(' ')[0], lastName: activeChat.name.split(' ')[1] || '', course: 'Not specified' };
      let reqHours = 450;
      let compHours = 0;

      if (logsRes.ok) {
        const logsData = await logsRes.json();
        fetchedLogs = Array.isArray(logsData) ? logsData : [];
        compHours = fetchedLogs.reduce((sum, log) => sum + (Number(log.hoursCredited) || 0), 0);
      }

      if (profRes.ok) {
        const profData = await profRes.json();
        if (profData.firstName) fetchedProfile.firstName = profData.firstName;
        if (profData.lastName) fetchedProfile.lastName = profData.lastName;
        if (profData.course) fetchedProfile.course = profData.course;

        if (profData.ojt) {
          const parsedOjt = typeof profData.ojt === 'string' ? JSON.parse(profData.ojt) : profData.ojt;
          if (parsedOjt.requiredHours) reqHours = parsedOjt.requiredHours;
        }
      }

      logSystemEvent('Generated DTR Review', `Opened DTR print preview for intern: ${activeChat.name} (${compHours}/${reqHours} hrs)`);

      setPrintLogs(fetchedLogs);
      setPrintProfile(fetchedProfile);
      setPrintRequiredHours(reqHours);
      setPrintCompletedHours(compHours);
      setIsPrintModalOpen(true);

    } catch (error) {
      console.error("Failed to prepare DTR for printing:", error);
      alert("Failed to load DTR records for this student.");
    } finally {
      setIsPrinting(false);
    }
  };

  if (isLoading) return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-purple-600" size={40} /></div>;

  return (
    <div className="h-[calc(100vh-8rem)] min-h-[500px] flex gap-6 fade-in pb-4 md:pb-0">

      {/* CANDIDATE CONVERSATIONS */}
      <div className="hidden md:flex flex-col w-80 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm shrink-0">

        <div className="p-5 border-b border-zinc-100 dark:border-zinc-800">
          <h2 className="text-xl font-black text-zinc-900 dark:text-white mb-4">Inbox</h2>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Search candidates..."
              className="w-full pl-9 pr-4 py-2 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all dark:text-white text-sm"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
          {conversations.length === 0 ? (
            <div className="p-6 text-center text-sm text-zinc-500 mt-10">No messages yet. Go to your Applicant Dashboard to start a chat!</div>
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

      {/* ACTIVE CHAT WINDOW */}
      <div className="flex-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-sm flex flex-col overflow-hidden relative">
        {activeChat ? (
          <>
            <div className="h-20 px-4 sm:px-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md z-10">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center text-white font-black shadow-sm shrink-0 ${activeChat.color || 'bg-purple-600'}`}>
                  {activeChat.avatar}
                </div>
                <div>
                  <h3 className="font-bold text-zinc-900 dark:text-white text-base sm:text-lg leading-tight flex items-center gap-2">
                    {activeChat.name} <CheckCircle2 size={16} className="text-blue-500 hidden sm:block" />
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium truncate max-w-[150px] sm:max-w-none">
                    {activeChat.role || 'OJT Applicant'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 sm:gap-2">
                <button className="hidden lg:flex items-center gap-2 px-3 py-2 bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-800/50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-bold rounded-xl transition-colors border border-zinc-200 dark:border-zinc-700">
                  <FileText size={14} /> Resume
                </button>

                {/* DTR MODAL */}
                <button
                  onClick={handleOpenPrintModal}
                  disabled={isPrinting}
                  className="hidden sm:flex items-center gap-2 px-3 py-2 bg-purple-50 hover:bg-purple-100 dark:bg-purple-500/10 dark:hover:bg-purple-500/20 text-purple-700 dark:text-purple-400 text-xs font-bold rounded-xl transition-colors border border-purple-200 dark:border-purple-500/30 disabled:opacity-50"
                >
                  {isPrinting ? <Loader2 size={14} className="animate-spin" /> : <Printer size={14} />}
                  {isPrinting ? 'Loading...' : 'Print DTR'}
                </button>

                <button className="p-2 sm:p-2.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors">
                  <MoreVertical size={20} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 custom-scrollbar bg-zinc-50/30 dark:bg-zinc-950/20">
              {messages.length === 0 ? (
                <div className="text-center text-zinc-400 text-sm mt-10">Start the conversation...</div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.sender === 'me';
                  return (
                    <div key={msg.id} className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`flex flex-col max-w-[85%] sm:max-w-[75%] md:max-w-[60%] ${isMe ? 'items-end' : 'items-start'}`}>
                        <div className={`px-4 sm:px-5 py-3 shadow-sm text-sm sm:text-[15px] leading-relaxed relative ${isMe
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

            <div className="p-3 sm:p-4 bg-white dark:bg-zinc-900 border-t border-zinc-100 dark:border-zinc-800">
              <form
                onSubmit={handleSendMessage}
                className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-800/50 p-1.5 sm:p-2 rounded-2xl border border-zinc-200 dark:border-zinc-700 focus-within:ring-2 focus-within:ring-purple-500/20 focus-within:border-purple-500 transition-all"
              >
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Message candidate..."
                  className="flex-1 bg-transparent border-none outline-none text-sm dark:text-white px-3 py-2 placeholder:text-zinc-400"
                />

                <button
                  type="submit"
                  disabled={newMessage.trim() === '' || isSending}
                  className="p-2.5 sm:p-3 bg-purple-600 disabled:bg-purple-400 hover:bg-purple-700 text-white rounded-xl transition-all shadow-md shadow-purple-500/20 shrink-0 flex items-center justify-center"
                >
                  {isSending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} className={`sm:w-[18px] sm:h-[18px] ${newMessage.trim() !== '' ? 'translate-x-0.5 -translate-y-0.5 transition-transform' : ''}`} />}
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-400">
            <MessageSquare size={48} className="mb-4 opacity-20" />
            <p className="font-bold text-zinc-500">No chat selected</p>
            <p className="text-sm">Choose a candidate from the left to start messaging.</p>
          </div>
        )}
      </div>

      {/* PRINT MODAL  */}
      <PrintDTRModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        logs={printLogs}
        studentProfile={printProfile}
        requiredHours={printRequiredHours}
        completedHours={printCompletedHours}
      />
    </div>
  );
}