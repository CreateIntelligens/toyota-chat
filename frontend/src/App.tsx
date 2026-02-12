import { useState, useEffect, useRef } from 'react';
import { startChat, sendMessage, getHistory, getConversations } from './api';
import type { Message } from './api';
import { Send, Plus, MessageSquare, Menu, Loader2, User, Bot, ChevronLeft, ChevronRight, Sparkles, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import clsx from 'clsx';

interface ChatSession {
  session_id: string;
  last_message?: string;
  updated_at?: number;
}

function App() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchSessions();
  }, []);

  useEffect(() => {
    if (currentSessionId) {
      loadHistory(currentSessionId);
    } else {
      setMessages([]);
    }
  }, [currentSessionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const fetchSessions = async () => {
    try {
      const data = await getConversations();
      console.log('Conversations data:', data);
      let parsedSessions: ChatSession[] = [];

      if (data && data.sessions && Array.isArray(data.sessions)) {
        parsedSessions = data.sessions.map((s: any) => ({
          session_id: s.session_id || s.id,
          last_message: s.last_message || (s.messages && s.messages.length > 0 ? (s.messages[s.messages.length-1].text || s.messages[s.messages.length-1].content) : '歷史對話'),
          updated_at: s.updated_at
        }));
      } else if (data && typeof data === 'object' && !Array.isArray(data)) {
        // 相容舊格式
        parsedSessions = Object.keys(data).map(sessionId => {
          const sessionMessages = data[sessionId];
          let lastMsg = '歷史對話';
          if (Array.isArray(sessionMessages) && sessionMessages.length > 0) {
            lastMsg = sessionMessages[sessionMessages.length - 1].content || '歷史對話';
          }
          return { session_id: sessionId, last_message: lastMsg };
        });
      }
      
      setSessions(parsedSessions);
    } catch (error) {
      console.error("Failed to fetch sessions:", error);
    }
  };

  const loadHistory = async (sessionId: string) => {
    setIsLoading(true);
    try {
      const data = await getHistory(sessionId);
      console.log('History data:', data);
      
      let historyMsgs: any[] = [];
      if (Array.isArray(data)) {
        historyMsgs = data;
      } else if (data && typeof data === 'object') {
        historyMsgs = data.messages || data.history || [];
      }

      setMessages(historyMsgs.map(m => ({
        role: m.role === 'assistant' ? 'model' : m.role,
        content: m.text || m.content || m.message || '',
        timestamp: m.timestamp || m.created_at
      })));
    } catch (error) {
      console.error("Failed to load history:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewChat = async () => {
    setIsLoading(true);
    try {
      const data = await startChat();
      if (data && data.session_id) {
        setCurrentSessionId(data.session_id);
        const newSession = { session_id: data.session_id, last_message: '新對話' };
        setSessions(prev => [newSession, ...prev]);
        setMessages([]);
      }
    } catch (error) {
      console.error("Failed to start chat:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userContent = inputValue.trim();
    const userMsg: Message = { role: 'user', content: userContent, timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    let targetSessionId = currentSessionId;

    try {
      if (!targetSessionId) {
        const sessionData = await startChat();
        targetSessionId = sessionData.session_id;
        setCurrentSessionId(targetSessionId);
        setSessions(prev => [{ session_id: targetSessionId!, last_message: userContent }, ...prev]);
      }

      if (targetSessionId) {
        const response = await sendMessage(targetSessionId, userContent);
        console.log('Send message response:', response);
        
        const botMsg: Message = { 
          role: 'model',
          content: response.answer || response.text || response.message || response.content || (typeof response === 'string' ? response : JSON.stringify(response)), 
          timestamp: new Date().toISOString() 
        };
        setMessages(prev => [...prev, botMsg]);
        
        setSessions(prev => prev.map(s => 
          s.session_id === targetSessionId ? { ...s, last_message: userContent } : s
        ));
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      setMessages(prev => [...prev, { role: 'model', content: "發生錯誤，請稍後再試。", timestamp: new Date().toISOString() }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSession = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    if (window.confirm('確定要移除此對話紀錄嗎？')) {
      setSessions(prev => prev.filter(s => s.session_id !== sessionId));
      if (currentSessionId === sessionId) {
        setCurrentSessionId(null);
        setMessages([]);
      }
    }
  };

  const formatTime = (isoString?: string) => {
    if (!isoString) return '';
    try {
      return format(new Date(isoString), 'HH:mm');
    } catch (e) {
      return '';
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden selection:bg-red-100 selection:text-red-900">
      {/* Sidebar */}
      <aside className={clsx(
        "bg-slate-900 text-slate-300 transition-all duration-300 ease-in-out flex flex-col z-40 shadow-2xl relative",
        isSidebarOpen ? "w-80" : "w-0 md:w-20 overflow-hidden"
      )}>
        {/* Logo / Header */}
        <div className="p-6 flex items-center justify-between border-b border-slate-800">
          {isSidebarOpen ? (
            <div className="flex items-center gap-3 animate-in fade-in duration-200">
              <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center text-white font-bold shadow-lg shadow-red-900/50">
                T
              </div>
              <div>
                <h1 className="font-bold text-white leading-none">和泰教育訓練</h1>
                <span className="text-xs text-slate-500 font-medium tracking-wider">AI ASSISTANT</span>
              </div>
            </div>
          ) : (
             <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center text-white font-bold mx-auto shadow-lg shadow-red-900/50">
                T
             </div>
          )}
        </div>

        {/* New Chat Button */}
        <div className="p-4">
          <button 
            onClick={handleNewChat}
            className={clsx(
              "group flex items-center gap-3 bg-red-600 hover:bg-red-500 text-white transition-all rounded-xl shadow-lg shadow-red-900/30 border border-red-500 hover:border-red-400 active:scale-[0.98]",
              isSidebarOpen ? "w-full py-3.5 px-4 justify-start" : "w-10 h-10 justify-center mx-auto p-0 rounded-full"
            )}
          >
            <Plus size={isSidebarOpen ? 20 : 24} className="transition-transform group-hover:rotate-90" />
            {isSidebarOpen && <span className="font-semibold tracking-wide">開啟新對話</span>}
          </button>
        </div>

        {/* Session List */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1 custom-scrollbar">
          {isSidebarOpen && <div className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">最近對話</div>}
          {sessions.map((session) => (
            <button
              key={session.session_id}
              onClick={() => {
                setCurrentSessionId(session.session_id);
                if (window.innerWidth < 768) setIsSidebarOpen(false);
              }}
              className={clsx(
                "w-full text-left rounded-xl flex items-center transition-all group relative overflow-hidden",
                isSidebarOpen ? "p-3 gap-3" : "p-3 justify-center",
                currentSessionId === session.session_id 
                  ? "bg-slate-800 text-white shadow-inner border border-slate-700/50" 
                  : "hover:bg-slate-800/50 text-slate-400 hover:text-slate-200 border border-transparent"
              )}
            >
              <MessageSquare 
                size={18} 
                className={clsx(
                  "flex-shrink-0 transition-colors",
                  currentSessionId === session.session_id ? "text-red-500" : "text-slate-500 group-hover:text-slate-400"
                )} 
              />
              {isSidebarOpen && (
                <>
                  <div className="truncate flex-1 z-10">
                    <div className={clsx("text-sm font-medium truncate", currentSessionId === session.session_id ? "text-white" : "text-slate-300")}>
                      {session.session_id.slice(0, 8)}...
                    </div>
                    <div className="text-[11px] text-slate-500 truncate mt-0.5 group-hover:text-slate-400">
                      {session.last_message}
                    </div>
                  </div>
                  <button
                    onClick={(e) => handleDeleteSession(e, session.session_id)}
                    className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-red-500/20 hover:text-red-500 rounded-lg transition-all z-20 text-slate-500"
                    title="移除對話"
                  >
                    <Trash2 size={14} />
                  </button>
                </>
              )}
              {/* Active Indicator Strip */}
              {currentSessionId === session.session_id && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-600 rounded-l-xl" />
              )}
            </button>
          ))}
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/50 backdrop-blur-sm">
           <button 
             onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
             className={clsx("flex items-center gap-3 text-slate-400 hover:text-white transition-colors w-full p-2 rounded-lg hover:bg-slate-800", !isSidebarOpen && "justify-center")}
           >
             {isSidebarOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
             {isSidebarOpen && <span className="text-sm font-medium">收合選單</span>}
           </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-white relative">
        {/* Mobile Header */}
        <header className="md:hidden h-16 bg-white border-b border-slate-100 flex items-center justify-between px-4 sticky top-0 z-30 shadow-sm/50 backdrop-blur-xl bg-white/80">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 -ml-2 rounded-lg hover:bg-slate-100 text-slate-600"
            >
              <Menu size={24} />
            </button>
            <span className="font-bold text-slate-800">和泰教育訓練</span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center text-white font-bold text-sm">T</div>
        </header>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar scroll-smooth bg-slate-50/50">
          <div className="max-w-4xl mx-auto p-4 md:p-10 space-y-8 min-h-full flex flex-col">
            
            {messages.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center animate-in zoom-in-95 duration-500 py-10">
                <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-br from-red-500 to-red-700 shadow-2xl shadow-red-500/30 flex items-center justify-center mb-8 transform hover:scale-105 transition-transform duration-500">
                  <Bot size={48} className="text-white" />
                </div>
                <h2 className="text-3xl font-bold text-slate-800 mb-3 tracking-tight">歡迎使用教育訓練助手</h2>
                <p className="text-slate-500 max-w-md mb-10 text-lg leading-relaxed">
                  我可以協助您查詢教育訓練流程、解答系統操作問題，或是提供相關文件資訊。
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl">
                  {[
                    { title: "教育訓練流程", desc: "查詢標準作業程序" },
                    { title: "系統操作說明", desc: "如何使用後台管理" },
                    { title: "常見問題", desc: "瀏覽 FAQ 列表" },
                    { title: "聯繫支援", desc: "尋找相關負責人" }
                  ].map((item, i) => (
                    <button 
                      key={i}
                      onClick={() => setInputValue(item.title)}
                      className="p-5 bg-white border border-slate-200 rounded-2xl text-left hover:border-red-500 hover:shadow-lg hover:shadow-red-500/5 transition-all group relative overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-red-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <h3 className="font-bold text-slate-700 group-hover:text-red-600 transition-colors relative z-10">{item.title}</h3>
                      <p className="text-sm text-slate-400 mt-1 relative z-10">{item.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                <div className="flex justify-center pb-4">
                   <span className="bg-slate-100 text-slate-400 text-[10px] py-1 px-3 rounded-full uppercase tracking-widest font-medium">Session Started</span>
                </div>
                {messages.map((msg, idx) => {
                  const isUser = msg.role === 'user';
                  return (
                    <div 
                      key={idx} 
                      className={clsx(
                        "flex w-full group animate-in slide-in-from-bottom-2 duration-300",
                        isUser ? "justify-end" : "justify-start"
                      )}
                    >
                      <div className={clsx(
                        "flex max-w-[90%] md:max-w-[80%] gap-4",
                        isUser ? "flex-row-reverse" : "flex-row"
                      )}>
                        {/* Avatar */}
                        <div className={clsx(
                          "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm transition-transform group-hover:scale-105",
                          isUser ? "bg-slate-800 text-white" : "bg-white border border-slate-100 text-red-600"
                        )}>
                          {isUser ? <User size={18} /> : <Sparkles size={18} />}
                        </div>
                        
                        {/* Message Body */}
                        <div className={clsx(
                          "flex flex-col",
                          isUser ? "items-end" : "items-start"
                        )}>
                          <div className="flex items-center gap-2 mb-1 px-1">
                            <span className="text-xs font-bold text-slate-600">
                              {isUser ? '您' : '客戶'}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {formatTime(msg.timestamp)}
                            </span>
                          </div>
                          
                          <div className={clsx(
                            "px-6 py-4 rounded-3xl text-[15px] leading-7 shadow-sm border whitespace-pre-wrap",
                            isUser 
                              ? "bg-slate-800 text-white border-slate-800 rounded-tr-md shadow-slate-900/10" 
                              : "bg-white text-slate-700 border-slate-100 rounded-tl-md shadow-sm"
                          )}>
                            {msg.content}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {isLoading && (
                  <div className="flex w-full justify-start animate-in fade-in">
                    <div className="flex gap-4 max-w-[80%]">
                       <div className="w-10 h-10 rounded-full bg-white border border-slate-100 text-red-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                          <Sparkles size={18} className="animate-pulse" />
                       </div>
                       <div>
                          <div className="flex items-center gap-2 mb-1 px-1">
                            <span className="text-xs font-bold text-slate-600">客戶</span>
                          </div>
                          <div className="bg-white px-6 py-4 rounded-3xl rounded-tl-md border border-slate-100 shadow-sm flex items-center gap-2">
                             <span className="w-2 h-2 bg-red-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                             <span className="w-2 h-2 bg-red-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                             <span className="w-2 h-2 bg-red-400 rounded-full animate-bounce"></span>
                          </div>
                       </div>
                    </div>
                  </div>
                )}
              </>
            )}
            <div ref={messagesEndRef} className="h-4" />
          </div>
        </div>

        {/* Input Footer */}
        <footer className="p-4 md:p-6 bg-white border-t border-slate-100 relative z-20">
          <div className="max-w-4xl mx-auto">
            <form 
              onSubmit={handleSendMessage}
              className="relative flex items-center shadow-2xl shadow-slate-200/50 rounded-2xl transition-shadow focus-within:shadow-red-500/10"
            >
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="輸入您的訊息..."
                className="w-full bg-white border border-slate-200 text-slate-800 text-base rounded-2xl py-4 pl-6 pr-16 focus:border-red-500 focus:ring-4 focus:ring-red-500/10 transition-all outline-none"
                disabled={isLoading}
              />
              <button 
                type="submit" 
                disabled={!inputValue.trim() || isLoading}
                className="absolute right-2 p-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-50 disabled:grayscale transition-all hover:scale-105 active:scale-95 shadow-lg shadow-red-600/20"
              >
                {isLoading ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
              </button>
            </form>
            <div className="text-center mt-3">
               <p className="text-[10px] text-slate-400 font-medium">
                 和泰汽車教育訓練專用 • 創造智能出品
               </p>
            </div>
          </div>
        </footer>
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(148, 163, 184, 0.3);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(148, 163, 184, 0.5);
        }
      `}</style>
    </div>
  );
}

export default App;
