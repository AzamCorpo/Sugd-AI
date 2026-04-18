import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, 
  Plus, 
  MessageSquare, 
  Settings, 
  Trash2, 
  Menu, 
  X, 
  Sparkles,
  ChevronRight,
  User,
  Bot,
  Copy,
  Check,
  RefreshCw,
  Mic,
  Share2,
  MoreVertical,
  ChevronDown,
  History,
  LayoutGrid,
  Users
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Toaster, toast } from 'sonner';
import { cn } from './lib/utils';
import { Logo } from './components/Logo';
import { getGeminiResponse } from './lib/gemini';
import { translations } from './translations';

import { useAuth } from './lib/AuthContext';
import { LoginScreen, SetupProfileScreen } from './components/AuthScreens';
import { AdminDashboard } from './components/AdminDashboard';
import { logout } from './lib/firebase';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface ChatHistory {
  id: string;
  title: string;
  messages: Message[];
  updatedAt: number;
}

function MainApp() {
  const { user, profile: authProfile } = useAuth();
  const [isAdminDashboardOpen, setIsAdminDashboardOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [chats, setChats] = useState<ChatHistory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showHint, setShowHint] = useState(true);
  const [selectedModel, setSelectedModel] = useState('Gemini 3 Flash');
  const [isModelMenuOpen, setIsModelMenuOpen] = useState(false);
  
  const [lang, setLang] = useState<'tg' | 'ru' | 'en'>('tg');
  const [profile, setProfile] = useState({ name: authProfile?.username || 'User', email: authProfile?.email || '', apiKey: 'spitamen' });
  const t = translations[lang];

  useEffect(() => {
    if (authProfile) {
      setProfile(prev => ({ ...prev, name: authProfile.username, email: authProfile.email }));
    }
  }, [authProfile]);

  useEffect(() => {
    const savedLang = localStorage.getItem('sugd_ai_lang');
    if (savedLang) setLang(savedLang as any);
    const savedProfile = localStorage.getItem('sugd_ai_profile');
    if (savedProfile) setProfile(JSON.parse(savedProfile));
  }, []);

  useEffect(() => {
    localStorage.setItem('sugd_ai_lang', lang);
  }, [lang]);

  useEffect(() => {
    localStorage.setItem('sugd_ai_profile', JSON.stringify(profile));
  }, [profile]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const currentChat = chats.find(c => c.id === currentChatId);
  const messages = currentChat?.messages || [];

  // Load chats from localStorage
  useEffect(() => {
    const savedChats = localStorage.getItem('sugd_ai_chats');
    if (savedChats) {
      try {
        const parsed = JSON.parse(savedChats);
        setChats(parsed);
        if (parsed.length > 0) {
          setCurrentChatId(parsed[0].id);
        }
      } catch (e) {
        console.error("Failed to parse chats", e);
      }
    }
  }, []);

  // Save chats to localStorage
  useEffect(() => {
    localStorage.setItem('sugd_ai_chats', JSON.stringify(chats));
  }, [chats]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  const createNewChat = () => {
    const newChat: ChatHistory = {
      id: Date.now().toString(),
      title: t.newChat,
      messages: [],
      updatedAt: Date.now()
    };
    setChats([newChat, ...chats]);
    setCurrentChatId(newChat.id);
    setInput('');
    if (window.innerWidth < 768) setIsSidebarOpen(false);
  };

  const deleteChat = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newChats = chats.filter(c => c.id !== id);
    setChats(newChats);
    if (currentChatId === id) {
      setCurrentChatId(newChats.length > 0 ? newChats[0].id : null);
    }
    toast.success(t.chatDeleted);
  };

  const clearAllChats = () => {
    setChats([]);
    setCurrentChatId(null);
    localStorage.removeItem('sugd_ai_chats');
    setIsSettingsOpen(false);
    toast.success(t.allChatsCleared);
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    let chatId = currentChatId;
    if (!chatId) {
      const newChat: ChatHistory = {
        id: Date.now().toString(),
        title: input.slice(0, 30) + (input.length > 30 ? '...' : ''),
        messages: [],
        updatedAt: Date.now()
      };
      setChats([newChat, ...chats]);
      chatId = newChat.id;
      setCurrentChatId(chatId);
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: Date.now()
    };

    const updatedChats = chats.map(c => {
      if (c.id === chatId) {
        return {
          ...c,
          messages: [...c.messages, userMessage],
          title: c.messages.length === 0 ? input.slice(0, 30) + (input.length > 30 ? '...' : '') : c.title,
          updatedAt: Date.now()
        };
      }
      return c;
    });

    setChats(updatedChats);
    setInput('');
    setIsLoading(true);

    try {
      const history = updatedChats.find(c => c.id === chatId)?.messages.map(m => ({
        role: m.role === 'user' ? 'user' as const : 'model' as const,
        parts: [{ text: m.content }]
      })) || [];

      // Remove the last message from history as it's the one we're sending
      history.pop();

      const stream = await getGeminiResponse(userMessage.content, history, profile.apiKey);
      
      const assistantMessageId = (Date.now() + 1).toString();
      let assistantContent = '';

      // Add placeholder message
      setChats(prev => prev.map(c => {
        if (c.id === chatId) {
          return {
            ...c,
            messages: [...c.messages, {
              id: assistantMessageId,
              role: 'assistant',
              content: '',
              timestamp: Date.now()
            }]
          };
        }
        return c;
      }));

      for await (const chunk of stream) {
        const text = chunk.text;
        assistantContent += text;
        
        setChats(prev => prev.map(c => {
          if (c.id === chatId) {
            return {
              ...c,
              messages: c.messages.map(m => 
                m.id === assistantMessageId ? { ...m, content: assistantContent } : m
              )
            };
          }
          return c;
        }));
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to get response. Please check your API key.');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast.success(t.copied);
  };

  const suggestions = t.suggestions;

  return (
    <div className="flex h-screen bg-[#02040a] text-slate-200 overflow-hidden font-sans relative">
      <Toaster position="top-center" richColors />
      
      {/* Atmospheric Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] bg-indigo-600/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute -bottom-[20%] -right-[10%] w-[60%] h-[60%] bg-blue-600/10 blur-[120px] rounded-full animate-pulse [animation-delay:2s]" />
      </div>

      {/* Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/50 z-20 md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: isSidebarOpen ? 280 : 0, opacity: isSidebarOpen ? 1 : 0 }}
        className={cn(
          "fixed md:relative z-30 h-full bg-[#0b0f1a] border-r border-slate-800/50 flex flex-col overflow-hidden transition-all duration-300 ease-in-out",
          !isSidebarOpen && "md:w-0"
        )}
      >
        <div className="p-4 flex flex-col h-full w-[280px]">
          <div className="flex items-center justify-between mb-6">
            <Logo className="scale-90 origin-left" />
            <button 
              onClick={() => setIsSidebarOpen(false)}
              className="md:hidden p-2 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <button
            onClick={createNewChat}
            className="flex items-center gap-2 w-full p-3 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-xl transition-all duration-200 mb-6 font-medium group"
          >
            <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
            <span>{t.newChat}</span>
          </button>

          <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
            <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2 px-2">
              {t.chatHistory}
            </div>
            {chats.length === 0 ? (
              <div className="text-sm text-slate-600 px-2 italic">{t.noChats}</div>
            ) : (
              chats.map((chat) => (
                <div
                  key={chat.id}
                  onClick={() => {
                    setCurrentChatId(chat.id);
                    if (window.innerWidth < 768) setIsSidebarOpen(false);
                  }}
                  className={cn(
                    "group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all duration-200 border border-transparent",
                    currentChatId === chat.id 
                      ? "bg-slate-800/50 border-slate-700 text-white shadow-lg" 
                      : "hover:bg-slate-800/30 text-slate-400 hover:text-slate-200"
                  )}
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <MessageSquare size={16} className={cn(currentChatId === chat.id ? "text-primary" : "text-slate-500")} />
                    <span className="text-sm truncate font-medium">{chat.title}</span>
                  </div>
                  <button
                    onClick={(e) => deleteChat(chat.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:text-destructive transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="mt-auto pt-4 border-t border-white/5">
            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="flex items-center gap-3 w-full p-3 hover:bg-white/5 rounded-2xl transition-all duration-300 text-slate-400 hover:text-white text-sm font-medium group"
            >
              <Settings size={18} className="group-hover:rotate-90 transition-transform duration-500" />
              <span>{t.settings}</span>
            </button>
            {authProfile?.isAdmin && (
              <button
                onClick={() => setIsAdminDashboardOpen(true)}
                className="flex items-center gap-3 w-full p-3 hover:bg-white/5 rounded-2xl transition-all duration-300 text-indigo-400 hover:text-indigo-300 text-sm font-medium group mt-1"
              >
                <Users size={18} />
                <span>Admin Panel</span>
              </button>
            )}
            <div className="flex items-center gap-3 p-3 mt-2 bg-white/[0.02] rounded-2xl border border-white/5 relative group cursor-pointer" onClick={logout} title="Click to logout">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-400 flex items-center justify-center text-xs font-bold text-white shadow-lg shadow-indigo-500/20 uppercase">
                {profile.name.substring(0,2)}
              </div>
              <div className="flex flex-col overflow-hidden">
                <span className="text-xs font-bold truncate text-white">{profile.name}</span>
                <span className="text-[10px] text-slate-500 truncate">{profile.email}</span>
              </div>
              <div className="absolute inset-0 bg-red-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                <span className="text-xs font-bold text-red-400">Logout</span>
              </div>
            </div>
          </div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative overflow-hidden z-10">
        {/* Header */}
        <header className="h-16 border-b border-white/5 flex items-center justify-between px-4 md:px-8 bg-black/20 backdrop-blur-2xl sticky top-0 z-20">
          <div className="flex items-center gap-4">
            {!isSidebarOpen && (
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 hover:bg-white/5 rounded-xl transition-colors text-slate-400 hover:text-white"
              >
                <Menu size={20} />
              </button>
            )}
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-semibold tracking-tight">Sugd AI</h1>
                <div className="relative">
                  <button 
                    onClick={() => setIsModelMenuOpen(!isModelMenuOpen)}
                    className="flex items-center gap-1 px-2 py-0.5 bg-white/5 hover:bg-white/10 rounded-md border border-white/5 text-[10px] font-bold text-indigo-400 transition-all"
                  >
                    {selectedModel} <ChevronDown size={10} />
                  </button>
                  <AnimatePresence>
                    {isModelMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        className="absolute top-full left-0 mt-2 w-40 bg-[#0b0f1a] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden"
                      >
                        {['Gemini 3 Flash', 'Gemini 1.5 Pro', 'Sugd Custom'].map((model) => (
                          <button
                            key={model}
                            onClick={() => {
                              setSelectedModel(model);
                              setIsModelMenuOpen(false);
                            }}
                            className="w-full px-4 py-2 text-left text-[11px] font-medium hover:bg-white/5 transition-colors"
                          >
                            {model}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
              <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Azam Corp Enterprise</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => {
                if (currentChatId) {
                  const newChats = chats.map(c => c.id === currentChatId ? { ...c, messages: [] } : c);
                  setChats(newChats);
                  toast.success(t.chatCleared);
                }
              }}
              className="p-2 hover:bg-white/5 rounded-xl transition-colors text-slate-500 hover:text-white"
              title={t.clearChat}
            >
              <Trash2 size={18} />
            </button>
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-white/5 rounded-full border border-white/5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Secure</span>
            </div>
            <button className="p-2 hover:bg-white/5 rounded-xl transition-colors text-slate-500 hover:text-white">
              <Share2 size={18} />
            </button>
          </div>
        </header>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
          <div className="max-w-3xl mx-auto w-full">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center min-h-[75vh] text-center">
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                  className="mb-12 relative"
                >
                  <Logo className="scale-150 mb-8" />
                  <div className="absolute -inset-4 bg-indigo-500/5 blur-3xl rounded-full -z-10" />
                </motion.div>
                <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight text-white">
                  {t.title}
                </h2>
                <p className="text-slate-400 mb-16 max-w-lg text-lg leading-relaxed font-medium opacity-80">
                  {t.subtitle}
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-3xl">
                  {suggestions.map((s, i) => (
                    <motion.button
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      onClick={() => setInput(s.prompt)}
                      className="p-5 bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 hover:border-indigo-500/30 rounded-2xl text-left transition-all duration-300 group relative overflow-hidden"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-[0.2em]">{s.title}</span>
                        <ChevronRight size={14} className="text-slate-600 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
                      </div>
                      <p className="text-sm text-slate-400 group-hover:text-slate-200 transition-colors leading-relaxed">{s.prompt}</p>
                    </motion.button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-8 pb-12">
                {messages.map((message, index) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "flex gap-4 md:gap-6",
                      message.role === 'user' ? "flex-row-reverse" : "flex-row"
                    )}
                  >
                    <div className={cn(
                      "w-9 h-9 md:w-11 md:h-11 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-xl transition-transform hover:scale-105",
                      message.role === 'user' 
                        ? "bg-slate-800 text-slate-400 border border-white/5" 
                        : "bg-indigo-600 text-white shadow-indigo-500/20"
                    )}>
                      {message.role === 'user' ? <User size={20} /> : <Bot size={22} />}
                    </div>
                    
                    <div className={cn(
                      "flex flex-col max-w-[85%] md:max-w-[80%]",
                      message.role === 'user' ? "items-end" : "items-start"
                    )}>
                      <div className={cn(
                        "p-5 md:p-6 rounded-[2rem] relative group transition-all duration-500",
                        message.role === 'user' 
                          ? "bg-white/[0.04] text-slate-200 border border-white/10 shadow-xl backdrop-blur-md" 
                          : "bg-white/[0.02] text-slate-200 border border-white/5 shadow-lg backdrop-blur-sm"
                      )}>
                        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                          <button 
                            onClick={() => copyToClipboard(message.content, message.id)}
                            className="p-2 hover:bg-white/10 rounded-xl text-slate-500 hover:text-white transition-all"
                            title={t.copy}
                          >
                            {copiedId === message.id ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                          </button>
                          {message.role === 'assistant' && (
                            <button 
                              className="p-2 hover:bg-white/10 rounded-xl text-slate-500 hover:text-white transition-all"
                              title={t.share}
                            >
                              <Share2 size={16} />
                            </button>
                          )}
                        </div>
                        <div className="markdown-body leading-relaxed">
                          <ReactMarkdown>{message.content}</ReactMarkdown>
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-600 mt-2.5 font-bold uppercase tracking-tighter">
                        {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </motion.div>
                ))}
                {isLoading && !messages[messages.length - 1]?.content && (
                  <div className="flex gap-4 md:gap-6">
                    <div className="w-9 h-9 md:w-11 md:h-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-500/20">
                      <Bot size={22} />
                    </div>
                    <div className="flex items-center gap-2.5 p-5 bg-white/[0.02] border border-white/5 rounded-3xl">
                      <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                      <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                      <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </div>

        {/* Input Area */}
        <div className="p-4 md:p-10 bg-gradient-to-t from-[#02040a] via-[#02040a] to-transparent">
          <div className="max-w-3xl mx-auto relative">
            {showHint && !input && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute -top-8 left-1/2 -translate-x-1/2 text-[10px] text-slate-500 font-bold uppercase tracking-widest pointer-events-none whitespace-nowrap"
              >
                {t.hint}
              </motion.div>
            )}
            <div className="relative flex items-end gap-2 bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-3 shadow-2xl focus-within:border-indigo-500/40 focus-within:bg-white/[0.05] transition-all duration-500 group">
              <button 
                className="p-4 rounded-full text-slate-500 hover:text-indigo-400 hover:bg-white/5 transition-all"
                title={t.voiceInput}
              >
                <Mic size={20} />
              </button>
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  if (showHint) setShowHint(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder={t.typeMessage}
                className="flex-1 bg-transparent border-none focus:ring-0 text-[15px] py-4 px-2 resize-none max-h-[200px] custom-scrollbar placeholder:text-slate-600 text-slate-200 leading-relaxed"
                rows={1}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className={cn(
                  "p-4 rounded-[1.8rem] transition-all duration-500 flex items-center justify-center",
                  input.trim() && !isLoading
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/40 hover:scale-105 active:scale-95"
                    : "bg-white/5 text-slate-600 cursor-not-allowed"
                )}
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Send size={22} />
                )}
              </button>
            </div>
            <p className="text-[10px] text-center text-slate-600 mt-5 font-bold uppercase tracking-[0.25em] opacity-50">
              by Azam Ashrapov
            </p>
          </div>
        </div>
      </main>

      {/* Settings Modal */}
      <AnimatePresence>
        {isSettingsOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSettingsOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-[#0b0f1a] border border-white/10 rounded-[2rem] shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Settings size={20} className="text-indigo-400" />
                  {t.settings}
                </h3>
                <button 
                  onClick={() => setIsSettingsOpen(false)}
                  className="p-2 hover:bg-white/5 rounded-xl transition-colors text-slate-400 hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-6 space-y-6 overflow-y-auto max-h-[60vh] custom-scrollbar">
                <div className="space-y-4">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t.language}</label>
                  <div className="flex gap-2">
                    {(['tg', 'ru', 'en'] as const).map(l => (
                      <button
                        key={l}
                        onClick={() => setLang(l)}
                        className={cn("flex-1 p-2 rounded-xl border border-white/10 transition-colors uppercase text-xs font-bold", lang === l ? "bg-indigo-600 text-white" : "hover:bg-white/5 text-slate-400")}
                      >{l}</button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t.profile}</label>
                  <div className="space-y-3">
                    <input type="text" value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} placeholder={t.name} className="w-full bg-white/[0.02] border border-white/5 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none focus:border-indigo-500" />
                    <input type="email" value={profile.email} onChange={e => setProfile({...profile, email: e.target.value})} placeholder={t.email} className="w-full bg-white/[0.02] border border-white/5 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none focus:border-indigo-500" />
                    <input type="password" value={profile.apiKey} onChange={e => setProfile({...profile, apiKey: e.target.value})} placeholder={t.apiKey} className="w-full bg-white/[0.02] border border-white/5 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none focus:border-indigo-500" />
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t.info}</label>
                  <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-300">{t.version}</span>
                      <span className="text-xs font-mono text-indigo-400">1.2.0-stable</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-300">{t.model}</span>
                      <span className="text-xs font-mono text-indigo-400">Gemini 3 Flash</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t.actions}</label>
                  <button
                    onClick={clearAllChats}
                    className="flex items-center gap-3 w-full p-4 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-2xl transition-all duration-300 font-medium group"
                  >
                    <Trash2 size={18} className="group-hover:scale-110 transition-transform" />
                    <span>{t.clearAll}</span>
                  </button>
                </div>

                <div className="pt-4 text-center">
                  <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">
                    Sugd AI — Azam Corp
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #1e293b;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #334155;
        }
      `}</style>
      {isAdminDashboardOpen && (
        <AdminDashboard onClose={() => setIsAdminDashboardOpen(false)} />
      )}
    </div>
  );
}

export default function App() {
  const { user, profile, loading } = useAuth();
  const [init, setInit] = useState(true);

  useEffect(() => {
    if (!loading) setInit(false);
  }, [loading]);

  if (init) {
    return (
      <div className="min-h-screen bg-[#02040a] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  if (!profile) {
    return <SetupProfileScreen />;
  }

  return <MainApp />;
}
