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
  Users,
  Sun,
  Moon,
  Paperclip
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Toaster, toast } from 'sonner';
import { Joyride, Step } from 'react-joyride';
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
  image?: string;
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
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [chats, setChats] = useState<ChatHistory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showHint, setShowHint] = useState(true);
  const [selectedModel, setSelectedModel] = useState('gemini-3-flash-preview');
  const [isModelMenuOpen, setIsModelMenuOpen] = useState(false);
  const [runTour, setRunTour] = useState(false);
  
  const [lang, setLang] = useState<'tg' | 'ru' | 'en'>('tg');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [profile, setProfile] = useState({ name: authProfile?.username || 'User', email: authProfile?.email || '', apiKey: '' });
  const t = translations[lang];

  useEffect(() => {
    if (authProfile) {
      setProfile(prev => ({ ...prev, name: authProfile.username, email: authProfile.email }));
    }
  }, [authProfile]);

  useEffect(() => {
    const savedLang = localStorage.getItem('sugd_ai_lang');
    if (savedLang) setLang(savedLang as any);
    
    const savedTheme = localStorage.getItem('sugd_ai_theme');
    if (savedTheme) {
      setTheme(savedTheme as any);
      if (savedTheme === 'dark') document.documentElement.classList.add('dark');
      else document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark'); // dark by default
    }
    
    const savedProfile = localStorage.getItem('sugd_ai_profile');
    if (savedProfile) {
      const parsed = JSON.parse(savedProfile);
      // Ensure apiKey stays clear unless it's genuinely entered by user
      if (parsed.apiKey === 'spitamen' && !authProfile?.isAdmin) {
        parsed.apiKey = '';
      }
      setProfile(parsed);
    }
    
    // Check if new user
    const hasSeenTour = localStorage.getItem('sugd_ai_tour_seen');
    if (!hasSeenTour) {
      setRunTour(true);
    }
  }, [authProfile]);

  useEffect(() => {
    localStorage.setItem('sugd_ai_lang', lang);
  }, [lang]);

  useEffect(() => {
    localStorage.setItem('sugd_ai_theme', theme);
    if (theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('sugd_ai_profile', JSON.stringify(profile));
  }, [profile]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const models = [
    { id: 'gemini-3-flash-preview', name: 'Sugd Flash' },
    { id: 'gemini-3.1-flash-lite-preview', name: 'Sugd Lite (Fast)' },
    { id: 'gemini-3.1-pro-preview', name: 'Sugd Pro' },
  ];

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
        } else {
          const newChat: ChatHistory = { id: Date.now().toString(), title: t.newChat, messages: [], updatedAt: Date.now() };
          setChats([newChat]);
          setCurrentChatId(newChat.id);
        }
      } catch (e) {
        const newChat: ChatHistory = { id: Date.now().toString(), title: t.newChat, messages: [], updatedAt: Date.now() };
        setChats([newChat]);
        setCurrentChatId(newChat.id);
      }
    } else {
      const newChat: ChatHistory = { id: Date.now().toString(), title: t.newChat, messages: [], updatedAt: Date.now() };
      setChats([newChat]);
      setCurrentChatId(newChat.id);
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

  const handleJoyrideCallback = (data: any) => {
    const { status } = data;
    const finishedStatuses: string[] = ['finished', 'skipped'];
    if (finishedStatuses.includes(status)) {
      setRunTour(false);
      localStorage.setItem('sugd_ai_tour_seen', 'true');
    }
  };

  const tourSteps: Step[] = [
    {
      target: 'body',
      content: t.tourWelcome,
      placement: 'center',
    },
    {
      target: '#tour-model-select',
      content: t.tourModelSelect,
    },
    {
      target: '#tour-chat-history',
      content: t.tourChatHistory,
    },
    {
      target: '#tour-settings',
      content: t.tourSettings,
    },
    {
      target: '#tour-chat-input',
      content: t.tourInput,
    }
  ];

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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size should be less than 5MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSend = async () => {
    if ((!input.trim() && !selectedImage) || isLoading) return;

    let chatId = currentChatId;
    if (!chatId) {
      const newChat: ChatHistory = {
        id: Date.now().toString(),
        title: input.slice(0, 30) + (input.length > 30 ? '...' : '') || 'New Chat',
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
      image: selectedImage || undefined,
      timestamp: Date.now()
    };

    const updatedChats = chats.map(c => {
      if (c.id === chatId) {
        return {
          ...c,
          messages: [...c.messages, userMessage],
          title: c.messages.length === 0 ? (input.slice(0, 30) + (input.length > 30 ? '...' : '') || 'New Chat') : c.title,
          updatedAt: Date.now()
        };
      }
      return c;
    });

    setChats(updatedChats);
    setInput('');
    const imageToSend = selectedImage;
    setSelectedImage(null);
    setIsLoading(true);

    let assistantMessageId = '';

    try {
      const history = updatedChats.find(c => c.id === chatId)?.messages.map(m => ({
        role: m.role === 'user' ? 'user' as const : 'model' as const,
        parts: m.image ? 
          [{ text: m.content }, { inlineData: { mimeType: m.image.match(/data:(.*?);/)?.[1] || 'image/jpeg', data: m.image.split(',')[1] } }] : 
          [{ text: m.content }]
      })) || [];

      // Remove the last message from history as it's the one we're sending
      history.pop();

      const stream = await getGeminiResponse(userMessage.content, history, imageToSend, profile.apiKey, selectedModel, !!authProfile?.isAdmin);
      
      assistantMessageId = (Date.now() + 1).toString();
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
    } catch (error: any) {
      console.error(error);
      const errorMsg = error?.message || 'Failed to get response. Please check your API key.';
      toast.error(`Хатогӣ / Error: ${errorMsg}`);
      
      // Remove placeholder if it was the last message
      setChats(prev => prev.map(c => {
        if (c.id === chatId) {
          const newMessages = [...c.messages];
          if (newMessages[newMessages.length - 1]?.id === assistantMessageId) {
            newMessages.pop();
          }
          return { ...c, messages: newMessages };
        }
        return c;
      }));
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
    <div className="flex h-screen bg-slate-50 dark:bg-[#02040a] text-slate-800 dark:text-slate-200 overflow-hidden font-sans relative">
      <Toaster position="top-center" richColors />
      <Joyride
        steps={tourSteps}
        run={runTour}
        continuous
        options={{
          showProgress: true,
          buttons: ['back', 'skip', 'primary'],
          primaryColor: '#6366f1',
          backgroundColor: theme === 'dark' ? '#0b0f1a' : '#ffffff',
          textColor: theme === 'dark' ? '#f1f5f9' : '#0f172a',
          overlayColor: theme === 'dark' ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.4)',
        }}
        onEvent={handleJoyrideCallback}
        locale={{
          back: t.tourBack,
          close: t.tourSkip,
          last: t.tourLast,
          next: t.tourNext,
          skip: t.tourSkip,
        }}
        styles={{
          buttonBack: { color: '#94a3b8' },
          buttonSkip: { color: '#94a3b8' }
        }}
      />
      
      {/* Atmospheric Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 opacity-60 dark:opacity-40">
        <motion.div 
          animate={{
            scale: [1, 1.2, 1],
            x: [0, 50, 0],
            y: [0, -30, 0],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute -top-[20%] -left-[10%] w-[60vw] h-[60vw] max-w-[800px] max-h-[800px] bg-gradient-to-tr from-indigo-500/20 to-purple-500/10 blur-[120px] rounded-full" 
        />
        <motion.div 
          animate={{
            scale: [1, 1.5, 1],
            x: [0, -60, 0],
            y: [0, 40, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute -bottom-[20%] -right-[10%] w-[70vw] h-[70vw] max-w-[900px] max-h-[900px] bg-gradient-to-bl from-blue-500/20 to-cyan-400/10 blur-[140px] rounded-full" 
        />
        <motion.div 
          animate={{
            scale: [1, 0.8, 1],
            x: [0, 30, 0],
            y: [0, 30, 0],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: "linear",
            delay: 2
          }}
          className="absolute top-[30%] left-[30%] w-[40vw] h-[40vw] max-w-[500px] max-h-[500px] bg-gradient-to-r from-pink-500/10 to-indigo-400/10 blur-[100px] rounded-full" 
        />
      </div>

      {/* Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-slate-900/50 dark:bg-black/50 z-20 md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: isSidebarOpen ? 280 : 0, opacity: isSidebarOpen ? 1 : 0 }}
        className={cn(
          "fixed md:relative z-30 h-full bg-white dark:bg-[#0b0f1a] border-r border-slate-200 dark:border-slate-800/50 flex flex-col overflow-hidden transition-all duration-300 ease-in-out",
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

          <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar" id="tour-chat-history">
            <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2 px-2">
              {t.chatHistory}
            </div>
            {chats.length === 0 ? (
              <div className="text-sm text-slate-600 px-2 italic">{t.noChats}</div>
            ) : (
              <AnimatePresence>
                {chats.map((chat) => (
                  <motion.div
                    layout
                    initial={{ opacity: 0, x: -10, scale: 0.95 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    key={chat.id}
                    onClick={() => {
                      setCurrentChatId(chat.id);
                      if (window.innerWidth < 768) setIsSidebarOpen(false);
                    }}
                    className={cn(
                      "group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all duration-300 border",
                      currentChatId === chat.id 
                        ? "bg-indigo-50 dark:bg-slate-800/50 border-indigo-100 dark:border-slate-700 text-indigo-900 dark:text-white shadow-sm dark:shadow-lg" 
                        : "border-transparent hover:bg-slate-100 dark:hover:bg-slate-800/30 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                    )}
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <MessageSquare size={16} className={cn(currentChatId === chat.id ? "text-primary" : "text-slate-500")} />
                      <span className="text-sm truncate font-medium">{chat.title}</span>
                    </div>
                    <button
                      onClick={(e) => deleteChat(chat.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:text-destructive hover:bg-red-50 dark:hover:hover:bg-red-500/10 rounded-md transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>

          <div className="mt-auto pt-4 border-t border-black/5 dark:border-white/5" id="tour-settings">
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsSettingsOpen(true)}
              className="flex items-center gap-3 w-full p-3 hover:bg-slate-100 dark:hover:bg-white/5 rounded-2xl transition-all duration-300 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:text-white text-sm font-medium group"
            >
              <Settings size={18} className="group-hover:rotate-90 transition-transform duration-500" />
              <span>{t.settings}</span>
            </motion.button>
            {authProfile?.isAdmin && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsAdminDashboardOpen(true)}
                className="flex items-center gap-3 w-full p-3 hover:bg-slate-100 dark:hover:bg-white/5 rounded-2xl transition-all duration-300 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:text-indigo-300 text-sm font-medium group mt-1"
              >
                <Users size={18} />
                <span>Admin Panel</span>
              </motion.button>
            )}
            <div className="flex items-center gap-3 p-3 mt-2 bg-black/[0.02] dark:bg-white/[0.02] rounded-2xl border border-black/5 dark:border-white/5 relative group cursor-pointer" onClick={logout} title="Click to logout">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-400 flex items-center justify-center text-xs font-bold text-slate-900 dark:text-white shadow-lg shadow-indigo-500/20 uppercase">
                {profile.name.substring(0,2)}
              </div>
              <div className="flex flex-col overflow-hidden">
                <span className="text-xs font-bold truncate text-slate-900 dark:text-white">{profile.name}</span>
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
        <header className="h-16 border-b border-black/5 dark:border-white/5 flex items-center justify-between px-4 md:px-8 bg-white/80 dark:bg-black/20 backdrop-blur-2xl sticky top-0 z-20">
          <div className="flex items-center gap-4">
            {!isSidebarOpen && (
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 hover:bg-black/5 dark:bg-white/5 rounded-xl transition-colors text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:text-white"
              >
                <Menu size={20} />
              </button>
            )}
            <div className="flex flex-col">
              <div className="flex items-center gap-2" id="tour-model-select">
                <h1 className="text-sm font-semibold tracking-tight">Sugd AI</h1>
                <div className="relative flex items-center gap-2">
                  <button 
                    onClick={() => setIsModelMenuOpen(!isModelMenuOpen)}
                    className="flex items-center gap-1 px-2 py-0.5 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:bg-white/10 rounded-md border border-black/5 dark:border-white/5 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 transition-all hover:scale-105"
                  >
                    {models.find(m => m.id === selectedModel)?.name || 'Sugd Flash'} <ChevronDown size={10} className={cn("transition-transform duration-300", isModelMenuOpen && "rotate-180")} />
                  </button>
                  <AnimatePresence>
                    {isModelMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 5, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 5, scale: 0.95 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="absolute top-full left-0 mt-2 w-48 bg-white dark:bg-[#0b0f1a]/90 backdrop-blur-3xl border border-black/10 dark:border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden"
                      >
                        {models.map((model) => (
                          <button
                            key={model.id}
                            onClick={() => {
                              setSelectedModel(model.id);
                              setIsModelMenuOpen(false);
                            }}
                            className={cn("w-full px-4 py-3 text-left text-[11px] font-bold transition-all hover:bg-black/10 dark:bg-white/10 relative overflow-hidden", selectedModel === model.id ? "text-indigo-600 dark:text-indigo-400 bg-black/5 dark:bg-white/5" : "text-slate-900 dark:text-white")}
                          >
                            {selectedModel === model.id && <motion.div layoutId="activeModel" className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500" />}
                            {model.name}
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
              className="p-2 hover:bg-black/5 dark:bg-white/5 rounded-xl transition-colors text-slate-500 hover:text-slate-900 dark:text-white"
              title={t.clearChat}
            >
              <Trash2 size={18} />
            </button>
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-black/5 dark:bg-white/5 rounded-full border border-black/5 dark:border-white/5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-tighter">Secure</span>
            </div>
            <button className="p-2 hover:bg-black/5 dark:bg-white/5 rounded-xl transition-colors text-slate-500 hover:text-slate-900 dark:text-white">
              <Share2 size={18} />
            </button>
          </div>
        </header>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
          <div className="max-w-3xl mx-auto w-full">
            <AnimatePresence mode="popLayout">
            {messages.length === 0 ? (
              <motion.div 
                key="empty-state"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
                transition={{ duration: 0.5 }}
                className="flex flex-col items-center justify-center min-h-[75vh] text-center"
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                  className="mb-12 relative group"
                >
                  <Logo className="scale-150 mb-8 drop-shadow-2xl opacity-90 group-hover:scale-[1.6] transition-transform duration-700" />
                  <div className="absolute inset-0 bg-indigo-500/20 dark:bg-indigo-500/10 blur-3xl rounded-full scale-110 group-hover:bg-indigo-500/20 transition-all duration-700 -z-10" />
                </motion.div>
                <motion.h2 
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-4xl md:text-5xl font-bold mb-6 tracking-tight text-slate-900 dark:text-white dark:bg-clip-text dark:text-transparent dark:bg-gradient-to-br from-white to-white/60"
                >
                  {t.title}
                </motion.h2>
                <motion.p 
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-slate-600 dark:text-slate-400 mb-16 max-w-lg text-lg leading-relaxed font-medium opacity-80"
                >
                  {t.subtitle}
                </motion.p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-3xl">
                  {suggestions.map((s, i) => (
                    <motion.button
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + (i * 0.1) }}
                      onClick={() => setInput(s.prompt)}
                      className="p-5 bg-black/[0.02] dark:bg-white/[0.02] hover:bg-slate-100 dark:bg-white/[0.05] border border-black/5 dark:border-white/5 hover:border-indigo-500/50 dark:border-indigo-500/30 rounded-2xl text-left transition-all duration-300 group relative overflow-hidden"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.2em]">{s.title}</span>
                        <ChevronRight size={14} className="text-slate-600 group-hover:text-indigo-600 dark:text-indigo-400 group-hover:translate-x-1 transition-all" />
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 group-hover:text-slate-800 dark:text-slate-200 transition-colors leading-relaxed">{s.prompt}</p>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="chat-messages"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-8 pb-12"
              >
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
                        ? "bg-slate-800 text-slate-600 dark:text-slate-400 border border-black/5 dark:border-white/5" 
                        : "bg-indigo-600 text-slate-900 dark:text-white shadow-indigo-500/20"
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
                          ? "bg-white dark:bg-white/[0.04] text-slate-800 dark:text-slate-200 border border-black/10 dark:border-white/10 shadow-xl backdrop-blur-md" 
                          : "bg-black/[0.02] dark:bg-white/[0.02] text-slate-800 dark:text-slate-200 border border-black/5 dark:border-white/5 shadow-lg backdrop-blur-sm"
                      )}>
                        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                          <button 
                            onClick={() => copyToClipboard(message.content, message.id)}
                            className="p-2 hover:bg-black/10 dark:bg-white/10 rounded-xl text-slate-500 hover:text-slate-900 dark:text-white transition-all"
                            title={t.copy}
                          >
                            {copiedId === message.id ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                          </button>
                          {message.role === 'assistant' && (
                            <button 
                              className="p-2 hover:bg-black/10 dark:bg-white/10 rounded-xl text-slate-500 hover:text-slate-900 dark:text-white transition-all"
                              title={t.share}
                            >
                              <Share2 size={16} />
                            </button>
                          )}
                        </div>
                        <div className="markdown-body leading-relaxed max-w-full overflow-hidden">
                          {message.image && (
                            <img src={message.image} alt="Attached image" className="max-w-full rounded-xl mb-4 max-h-80 object-cover shadow-sm border border-black/10 dark:border-white/10" />
                          )}
                          <ReactMarkdown
                            components={{
                              strong: ({node, ...props}) => <strong className="text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50 dark:bg-indigo-900/20 px-1.5 py-0.5 rounded-md transition-colors shadow-sm" {...props} />,
                              img: ({node, ...props}) => (
                                <img
                                  {...props}
                                  className="max-w-full rounded-2xl my-4 shadow-lg border border-black/10 dark:border-white/10 hover:shadow-xl transition-all duration-500 transform hover:scale-[1.02] cursor-pointer"
                                  referrerPolicy="no-referrer"
                                />
                              ),
                              p: ({node, ...props}) => <p className="mb-4 last:mb-0 leading-relaxed animate-fade-in text-[15px]" {...props} />,
                              a: ({node, ...props}) => <a className="text-indigo-500 hover:text-indigo-600 font-medium underline underline-offset-4" {...props} />
                            }}
                          >
                            {message.content}
                          </ReactMarkdown>
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
                    <div className="w-9 h-9 md:w-11 md:h-11 rounded-2xl bg-indigo-600 text-slate-900 dark:text-white flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-500/20">
                      <Bot size={22} />
                    </div>
                    <div className="p-5 md:p-6 rounded-[2rem] bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5 shadow-lg backdrop-blur-sm min-w-[200px] w-full max-w-md space-y-3">
                      <motion.div
                        className="h-2 bg-indigo-500/20 rounded-full w-3/4 overflow-hidden relative"
                      >
                        <motion.div
                          className="absolute inset-0 bg-indigo-400"
                          initial={{ x: "-100%" }}
                          animate={{ x: "100%" }}
                          transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                        />
                      </motion.div>
                      <motion.div
                        className="h-2 bg-indigo-500/10 rounded-full w-full overflow-hidden relative"
                      >
                         <motion.div
                          className="absolute inset-0 bg-indigo-400"
                          initial={{ x: "-100%" }}
                          animate={{ x: "100%" }}
                          transition={{ repeat: Infinity, duration: 1.5, ease: "linear", delay: 0.2 }}
                        />
                      </motion.div>
                      <motion.div
                        className="h-2 bg-indigo-500/10 rounded-full w-5/6 overflow-hidden relative"
                      >
                         <motion.div
                          className="absolute inset-0 bg-indigo-400"
                          initial={{ x: "-100%" }}
                          animate={{ x: "100%" }}
                          transition={{ repeat: Infinity, duration: 1.5, ease: "linear", delay: 0.4 }}
                        />
                      </motion.div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </motion.div>
            )}
            </AnimatePresence>
          </div>
        </div>

        {/* Input Area */}
        <div className="p-4 md:p-10 bg-gradient-to-t from-slate-50 via-slate-50 dark:from-[#02040a] dark:via-[#02040a] to-transparent">
          <div className="max-w-3xl mx-auto relative">
            {showHint && !input && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute -top-8 left-1/2 -translate-x-1/2 text-[10px] text-slate-500 font-bold uppercase tracking-widest pointer-events-none whitespace-nowrap"
              >
                {t.hint}
              </motion.div>
            )}
            <motion.div 
              id="tour-chat-input"
              layout
              className="relative flex flex-col gap-2 bg-white dark:bg-white/[0.03] backdrop-blur-3xl border border-black/10 dark:border-white/10 rounded-[2.5rem] p-3 shadow-2xl focus-within:border-indigo-500/40 focus-within:bg-slate-50 dark:focus-within:bg-white/[0.05] focus-within:shadow-indigo-500/10 transition-all duration-500 group"
            >
              <AnimatePresence>
                {selectedImage && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="px-5 pt-3">
                    <div className="relative inline-block group/img">
                      <img src={selectedImage} alt="Preview" className="h-20 w-auto rounded-xl object-cover border border-slate-200 dark:border-slate-800 shadow-md transition-all group-hover/img:brightness-75" />
                      <button onClick={() => setSelectedImage(null)} className="absolute -top-2 -right-2 p-1.5 bg-slate-800 dark:bg-white text-white dark:text-slate-900 rounded-full hover:scale-110 shadow-md transition-all z-10 opacity-0 group-hover/img:opacity-100">
                        <X size={12} strokeWidth={3} />
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <div className="flex items-end gap-2 w-full">
                <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={handleImageUpload} />
                <motion.button 
                  onClick={() => fileInputRef.current?.click()}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-4 rounded-full text-slate-500 hover:text-indigo-600 dark:text-indigo-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-all"
                  title="Upload Image/File"
                >
                  <Paperclip size={20} />
                </motion.button>
                <motion.button 
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-4 rounded-full text-slate-500 hover:text-indigo-600 dark:text-indigo-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-all hidden md:block"
                  title={t.voiceInput}
                >
                  <Mic size={20} />
                </motion.button>
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
                className="flex-1 bg-transparent border-none focus:ring-0 text-[15px] py-4 px-2 resize-none max-h-[200px] custom-scrollbar placeholder:text-slate-400 dark:placeholder:text-slate-600 text-slate-900 dark:text-slate-200 leading-relaxed font-medium"
                rows={1}
              />
              <motion.button
                whileHover={input.trim() && !isLoading ? { scale: 1.05 } : {}}
                whileTap={input.trim() && !isLoading ? { scale: 0.95 } : {}}
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className={cn(
                  "p-4 rounded-[1.8rem] transition-all duration-500 flex items-center justify-center",
                  input.trim() && !isLoading
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/40"
                    : "bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-slate-600 cursor-not-allowed"
                )}
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Send size={22} />
                )}
              </motion.button>
              </div>
            </motion.div>
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
              className="absolute inset-0 bg-slate-900/60 dark:bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white dark:bg-[#0b0f1a] border border-black/10 dark:border-white/10 rounded-[2rem] shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-black/5 dark:border-white/5 flex items-center justify-between bg-black/[0.02] dark:bg-white/[0.02]">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Settings size={20} className="text-indigo-600 dark:text-indigo-400" />
                  {t.settings}
                </h3>
                <button 
                  onClick={() => setIsSettingsOpen(false)}
                  className="p-2 hover:bg-black/5 dark:bg-white/5 rounded-xl transition-colors text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:text-white"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-6 space-y-6 overflow-y-auto max-h-[60vh] custom-scrollbar">
                <div className="space-y-4">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t.theme}</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setTheme('light')}
                      className={cn("flex-1 p-2 rounded-xl border border-black/10 dark:border-white/10 transition-colors uppercase text-xs font-bold flex items-center justify-center gap-2", theme === 'light' ? "bg-indigo-600 text-white" : "hover:bg-black/5 dark:hover:bg-white/5 text-slate-600 dark:text-slate-400")}
                    >
                      <Sun size={14} /> {t.lightMode}
                    </button>
                    <button
                      onClick={() => setTheme('dark')}
                      className={cn("flex-1 p-2 rounded-xl border border-black/10 dark:border-white/10 transition-colors uppercase text-xs font-bold flex items-center justify-center gap-2", theme === 'dark' ? "bg-indigo-600 text-white" : "hover:bg-black/5 dark:hover:bg-white/5 text-slate-600 dark:text-slate-400")}
                    >
                      <Moon size={14} /> {t.darkMode}
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t.language}</label>
                  <div className="flex gap-2">
                    {(['tg', 'ru', 'en'] as const).map(l => (
                      <button
                        key={l}
                        onClick={() => setLang(l)}
                        className={cn("flex-1 p-2 rounded-xl border border-black/10 dark:border-white/10 transition-colors uppercase text-xs font-bold", lang === l ? "bg-indigo-600 text-white dark:text-white" : "hover:bg-black/5 dark:bg-white/5 text-slate-600 dark:text-slate-400")}
                      >{l}</button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t.profile}</label>
                  <div className="space-y-3">
                    <input type="text" value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} placeholder={t.name} className="w-full bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5 rounded-xl px-4 py-3 text-sm text-slate-800 dark:text-slate-200 outline-none focus:border-indigo-500" />
                    <input type="email" value={profile.email} onChange={e => setProfile({...profile, email: e.target.value})} placeholder={t.email} className="w-full bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5 rounded-xl px-4 py-3 text-sm text-slate-800 dark:text-slate-200 outline-none focus:border-indigo-500" />
                    <input type="password" value={profile.apiKey} onChange={e => setProfile({...profile, apiKey: e.target.value})} placeholder={t.apiKey} className="w-full bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5 rounded-xl px-4 py-3 text-sm text-slate-800 dark:text-slate-200 outline-none focus:border-indigo-500" />
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t.info}</label>
                  <div className="p-4 bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5 rounded-2xl space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-700 dark:text-slate-300">{t.version}</span>
                      <span className="text-xs font-mono text-indigo-600 dark:text-indigo-400">1.2.0-stable</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-700 dark:text-slate-300">{t.model}</span>
                      <span className="text-xs font-mono text-indigo-600 dark:text-indigo-400">Sugd Flash</span>
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
      <div className="min-h-screen bg-slate-50 dark:bg-[#02040a] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500/50 dark:border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
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
