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
  Sunrise,
  Sunset,
  Paperclip,
  Brain,
  Heart,
  Save,
  Pencil,
  FileText,
  BookOpen,
  Newspaper,
  Clock
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Toaster, toast } from 'sonner';
import { Joyride, Step } from 'react-joyride';
import { cn } from './lib/utils';
import { Logo } from './components/Logo';
import { getGeminiResponse, extractMemoryUpdates } from './lib/gemini';
import { translations } from './translations';
import { fetchPrayerTimes, type PrayerTimings } from './services/prayerService';

import { useAuth } from './lib/AuthContext';
import { LoginScreen, SetupProfileScreen } from './components/AuthScreens';
import { AdminDashboard } from './components/AdminDashboard';
import { logout, loadUserChatsFromDB, saveUserChatsToDB, updateUserMemory, UserMemory } from './lib/firebase';

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
  const [selectedModel, setSelectedModel] = useState('models/gemini-3-flash-preview');
  const [isModelMenuOpen, setIsModelMenuOpen] = useState(false);
  const [runTour, setRunTour] = useState(false);
  
  const [lang, setLang] = useState<'tg' | 'ru' | 'en' | 'fa'>('tg');
  const [isDocHelperOpen, setIsDocHelperOpen] = useState(false);
  const [isTeacherOpen, setIsTeacherOpen] = useState(false);
  const [isPrayerOpen, setIsPrayerOpen] = useState(false);
  const [isFetchingPrayer, setIsFetchingPrayer] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [activeSettingsTab, setActiveSettingsTab] = useState<'profile' | 'memory' | 'theme'>('profile');
  const [profile, setProfile] = useState({ 
    name: authProfile?.username || 'User', 
    email: authProfile?.email || '', 
    apiKey: '',
    fullName: authProfile?.fullName || '',
    photoUrl: authProfile?.photoUrl || '',
    bio: authProfile?.bio || '',
    links: authProfile?.links || '',
    memory: authProfile?.memory || {} as UserMemory
  });
  const [isEditingMemory, setIsEditingMemory] = useState(false);
  const [tempMemory, setTempMemory] = useState<UserMemory>(profile.memory);
  const t = translations[lang];
  const isRTL = lang === 'fa';

  useEffect(() => {
    if (isSettingsOpen) {
      setTempMemory(profile.memory);
    }
  }, [isSettingsOpen, profile.memory]);

  const handleSaveMemory = async () => {
    if (user) {
      await updateUserMemory(user.uid, tempMemory);
      setProfile(prev => ({ ...prev, memory: tempMemory }));
      setIsEditingMemory(false);
      toast.success("Memory updated successfully!");
    }
  };

  useEffect(() => {
    if (authProfile) {
      setProfile(prev => ({ 
        ...prev, 
        name: authProfile.username || prev.name, 
        email: authProfile.email || prev.email,
        fullName: authProfile.fullName || prev.fullName,
        photoUrl: authProfile.photoUrl || prev.photoUrl,
        bio: authProfile.bio || prev.bio,
        links: authProfile.links || prev.links,
        memory: authProfile.memory || prev.memory
      }));
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
    { id: 'models/gemini-3-flash-preview', name: 'Sugd Flash' },
    { id: 'models/gemini-1.5-flash-latest', name: 'Sugd Lite (Fast)' },
    { id: 'models/gemini-1.5-pro-latest', name: 'Sugd Pro' },
  ];

  const currentChat = chats.find(c => c.id === currentChatId);
  const messages = currentChat?.messages || [];

  // Load chats from DB or localStorage
  useEffect(() => {
    const loadChats = async () => {
      let loadedChats = [];
      if (user) {
        loadedChats = await loadUserChatsFromDB(user.uid);
      }
      
      if (!loadedChats || loadedChats.length === 0) {
        const savedChats = localStorage.getItem('sugd_ai_chats');
        if (savedChats) {
          try {
            loadedChats = JSON.parse(savedChats);
          } catch (e) {}
        }
      }

      if (loadedChats && loadedChats.length > 0) {
        setChats(loadedChats);
        setCurrentChatId(loadedChats[0].id);
      } else {
        const newChat: ChatHistory = { id: Date.now().toString(), title: t.newChat, messages: [], updatedAt: Date.now() };
        setChats([newChat]);
        setCurrentChatId(newChat.id);
      }
    };
    
    loadChats();
  }, [user, t.newChat]); // Reload when user changes

  // Save chats to DB and localStorage
  useEffect(() => {
    localStorage.setItem('sugd_ai_chats', JSON.stringify(chats));
    if (user && chats.length > 0 && chats[0].messages.length > 0) {
      // Only save to DB if we have actual content to avoid overwriting with empty
      saveUserChatsToDB(user.uid, chats);
    }
  }, [chats, user]);

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

  const handleSend = async (overrideContent?: string) => {
    const contentToSend = overrideContent || input;
    if ((!contentToSend.trim() && !selectedImage) || isLoading) return;

    let chatId = currentChatId;
    if (!chatId) {
      const newChat: ChatHistory = {
        id: Date.now().toString(),
        title: contentToSend.slice(0, 30) + (contentToSend.length > 30 ? '...' : '') || 'New Chat',
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
      content: contentToSend,
      image: selectedImage || undefined,
      timestamp: Date.now()
    };

    const updatedChats = chats.map(c => {
      if (c.id === chatId) {
        return {
          ...c,
          messages: [...c.messages, userMessage],
          title: c.messages.length === 0 ? (contentToSend.slice(0, 30) + (contentToSend.length > 30 ? '...' : '') || 'New Chat') : c.title,
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

      const stream = await getGeminiResponse(userMessage.content, history, imageToSend, profile.apiKey, selectedModel, !!authProfile?.isAdmin, profile.memory);
      
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

      // Memory Extraction
      if (user) {
        const conversationForMemory = [
          ...updatedChats.find(c => c.id === chatId)?.messages.slice(0, -1).map(m => ({
            role: m.role === 'user' ? 'user' as const : 'model' as const,
            content: m.content
          })) || [],
          { role: 'user' as const, content: userMessage.content },
          { role: 'model' as const, content: assistantContent }
        ];
        
        extractMemoryUpdates(conversationForMemory, profile.memory, profile.apiKey)
          .then(newMemory => {
            if (newMemory && JSON.stringify(newMemory) !== JSON.stringify(profile.memory)) {
              updateUserMemory(user.uid, newMemory);
              setProfile(prev => ({ ...prev, memory: newMemory }));
              console.log("Memory updated silently:", newMemory);
            }
          });
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

  const handleDocHelp = (type: string) => {
    let promptPrefix = "";
    switch(type) {
      case 'application': promptPrefix = t.docAppPrompt; break;
      case 'contract': promptPrefix = t.docContractPrompt; break;
      case 'reference': promptPrefix = t.docRefPrompt; break;
      case 'resume': promptPrefix = t.docResumePrompt; break;
      case 'complaint': promptPrefix = t.docComplaintPrompt; break;
    }
    setInput(promptPrefix);
    setIsDocHelperOpen(false);
    if (textareaRef.current) textareaRef.current.focus();
  };

  const handleTeacherHelp = (subject: string) => {
    let subLabel = "";
    switch(subject) {
      case 'math': subLabel = t.math; break;
      case 'physics': subLabel = t.physics; break;
      case 'tajik': subLabel = t.tajikLanguage; break;
      case 'history': subLabel = t.historyTajikistan; break;
      case 'english': subLabel = t.english; break;
    }
    const finalPrompt = t.teacherPrompt.replace('{subject}', subLabel);
    handleSend(finalPrompt);
    setIsTeacherOpen(false);
    if (textareaRef.current) textareaRef.current.focus();
  };

  const handlePrayerTimes = () => {
    setInput(t.prayerTimesPrompt);
    setIsPrayerOpen(false);
    if (textareaRef.current) textareaRef.current.focus();
  };

  const handlePrayerCityClick = async (cityId: string, cityName: string) => {
    setIsFetchingPrayer(true);
    const toastId = toast.loading(`${t.prayerTimes}: ${cityName}...`);
    try {
      const timings = await fetchPrayerTimes(cityId);
      let finalContent = "";
      if (timings) {
        const dataStr = `Fajr: ${timings.Fajr}, Sunrise: ${timings.Sunrise}, Dhuhr: ${timings.Dhuhr}, Asr: ${timings.Asr}, Maghrib: ${timings.Maghrib}, Isha: ${timings.Isha}`;
        finalContent = `Вақти намоз барои шаҳри ${cityName}. Илтимос, маълумоти зеринро бо истифода аз виҷети 'prayer-card' нишон диҳед: DATA: ${dataStr}. (Aladhan API). Please strictly use the prayer-card widget.`;
        toast.dismiss(toastId);
      } else {
        finalContent = `${t.prayerRequestPrompt}${cityName}`;
        toast.error("Aladhan API error", { id: toastId });
      }
      handleSend(finalContent);
    } catch (error) {
      const fallbackContent = `${t.prayerRequestPrompt}${cityName}`;
      handleSend(fallbackContent);
      toast.error("Error", { id: toastId });
    } finally {
      setIsFetchingPrayer(false);
      setIsPrayerOpen(false);
      if (textareaRef.current) textareaRef.current.focus();
    }
  };

  const handleNews = () => {
    handleSend(t.newsRequestPrompt);
    if (textareaRef.current) textareaRef.current.focus();
  };

  const suggestions = t.suggestions;

  return (
    <div className="flex h-screen bg-transparent text-slate-800 dark:text-slate-200 overflow-hidden font-sans relative" dir={isRTL ? "rtl" : "ltr"}>
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
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 opacity-60">
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
          className="absolute -top-[20%] -left-[10%] w-[60vw] h-[60vw] max-w-[800px] max-h-[800px] bg-gradient-to-tr from-indigo-500/30 to-purple-500/20 blur-[120px] rounded-full dark:from-indigo-500/20 dark:to-purple-500/10" 
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
          "fixed md:relative z-30 h-full glass-liquid border-r border-slate-200 dark:border-slate-800/50 flex flex-col overflow-hidden transition-all duration-300 ease-in-out",
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
              <div className="w-9 h-9 rounded-xl overflow-hidden bg-gradient-to-tr from-indigo-600 to-blue-400 flex items-center justify-center text-xs font-bold text-slate-900 dark:text-white shadow-lg shadow-indigo-500/20 uppercase shrink-0">
                {profile.photoUrl ? (
                  <img src={profile.photoUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  profile.name.substring(0,2)
                )}
              </div>
              <div className="flex flex-col overflow-hidden">
                <span className="text-xs font-bold truncate text-slate-900 dark:text-white">{profile.fullName || profile.name}</span>
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
        <div className="flex-1 overflow-y-auto p-6 md:p-12 lg:p-16 custom-scrollbar scroll-smooth">
          <div className="max-w-4xl mx-auto w-full">
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
                    className="mb-16 relative group"
                  >
                    <Logo className="scale-[1.8] mb-12 drop-shadow-2xl opacity-90 group-hover:scale-[2] transition-transform duration-700" />
                    <div className="absolute inset-0 bg-indigo-500/20 dark:bg-indigo-500/10 blur-3xl rounded-full scale-125 group-hover:bg-indigo-500/20 transition-all duration-700 -z-10" />
                  </motion.div>
                  <motion.h2 
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-5xl md:text-7xl font-bold mb-8 tracking-tighter text-slate-900 dark:text-white dark:bg-clip-text dark:text-transparent dark:bg-gradient-to-br from-white to-white/40"
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
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-3xl px-4 md:px-0">
                    {suggestions.map((s, i) => (
                      <motion.button
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 + (i * 0.1) }}
                        onClick={() => setInput(s.prompt)}
                        className={cn(
                          "p-4 border border-black/5 dark:border-white/5 hover:border-indigo-500/50 dark:border-indigo-500/30 rounded-2xl text-left transition-all duration-300 group relative overflow-hidden",
                          i > 1 ? "hidden sm:block" : "bg-black/[0.02] dark:bg-white/[0.02] hover:bg-slate-100 dark:hover:bg-white/[0.05]"
                        )}
                      >
                        <div className="flex items-center justify-between mb-1 md:mb-2">
                          <span className="text-[10px] sm:text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.2em]">{s.title}</span>
                          <ChevronRight size={14} className="text-slate-600 group-hover:text-indigo-600 dark:text-indigo-400 sm:group-hover:translate-x-1 transition-all" />
                        </div>
                        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200 transition-colors leading-relaxed line-clamp-2 md:line-clamp-none">{s.prompt}</p>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  key="chat-messages"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-12 pb-24"
                >
                  {messages.map((message, index) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn(
                        "flex gap-5 md:gap-8",
                        message.role === 'user' ? "flex-row-reverse" : "flex-row"
                      )}
                    >
                      <div className={cn(
                        "w-10 h-10 md:w-12 md:h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-2xl transition-all duration-500 hover:scale-110",
                        message.role === 'user' 
                          ? "bg-slate-800 text-slate-300 border border-white/10" 
                          : "bg-indigo-600 text-white shadow-indigo-600/30"
                      )}>
                        {message.role === 'user' ? <User size={22} strokeWidth={1.5} /> : <Bot size={24} strokeWidth={1.5} />}
                      </div>
                      
                      <div className={cn(
                        "flex flex-col max-w-[85%] md:max-w-[75%]",
                        message.role === 'user' ? "items-end" : "items-start"
                      )}>
                        <div className={cn(
                          "p-6 md:p-8 rounded-[2.5rem] relative group transition-all duration-700 glass-liquid",
                          message.role === 'user' 
                            ? "border-indigo-500/20 shadow-indigo-500/5" 
                            : "border-white/10 shadow-2xl"
                        )}>
                          <div className="absolute top-4 right-6 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center gap-2">
                            <button 
                              onClick={() => copyToClipboard(message.content, message.id)}
                              className="p-2.5 hover:bg-white/10 rounded-2xl text-slate-400 hover:text-white transition-all backdrop-blur-md"
                              title={t.copy}
                            >
                              {copiedId === message.id ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                            </button>
                            {message.role === 'assistant' && (
                              <button 
                                className="p-2.5 hover:bg-white/10 rounded-2xl text-slate-400 hover:text-white transition-all backdrop-blur-md"
                                title={t.share}
                              >
                                <Share2 size={16} />
                              </button>
                            )}
                          </div>
                          <div className="markdown-body leading-relaxed max-w-full overflow-hidden text-[16px]">
                            {message.image && (
                              <img src={message.image} alt="Attached image" className="max-w-full rounded-xl mb-4 max-h-80 object-cover shadow-sm border border-black/10 dark:border-white/10" />
                            )}
                            <ReactMarkdown
                              components={{
                                strong: ({node, ...props}) => <strong className="text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50 dark:bg-indigo-900/20 px-1.5 py-0.5 rounded-md transition-colors shadow-sm" {...props} />,
                                code: ({ node, inline, className, children, ...props }: any) => {
                                  const match = /language-(\w+)/.exec(className || '');
                                  if (!inline && match && match[1] === 'prayer-card') {
                                    try {
                                      const rawJson = String(children).trim();
                                      const data = JSON.parse(rawJson);
                                      const prayerIcons: Record<string, any> = {
                                        'Fajr': <Sunrise size={14} className="text-amber-200" />,
                                        'Sunrise': <Sun size={14} className="text-amber-300" />,
                                        'Dhuhr': <Sun size={14} className="text-yellow-400" />,
                                        'Asr': <Sun size={14} className="text-orange-400" />,
                                        'Maghrib': <Sunset size={14} className="text-rose-300" />,
                                        'Isha': <Moon size={14} className="text-indigo-200" />
                                      };

                                      return (
                                        <div className="my-8 p-0 bg-[#0a2e2a] rounded-[2.5rem] text-white shadow-[0_20px_50px_rgba(0,0,0,0.3)] relative overflow-hidden group/card max-w-sm border border-emerald-500/20">
                                          {/* Decorative patterns */}
                                          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-16 -mt-16" />
                                          <div className="absolute bottom-0 left-0 w-32 h-32 bg-teal-500/10 rounded-full blur-3xl -ml-16 -mb-16" />
                                          
                                          <div className="p-6 pb-4 border-b border-white/5 relative z-10 flex items-center justify-between">
                                            <div>
                                              <div className="flex items-center gap-2 mb-1">
                                                <div className="w-6 h-6 bg-emerald-600 rounded-lg flex items-center justify-center">
                                                  <Logo className="scale-50 brightness-0 invert" />
                                                </div>
                                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400">Sugd AI</span>
                                              </div>
                                              <h3 className="text-2xl font-black tracking-tight text-white/90">{data.city}</h3>
                                            </div>
                                            <div className="text-right">
                                              <div className="text-[9px] font-bold uppercase tracking-widest text-emerald-500/60 mb-1">Source</div>
                                              <div className="px-3 py-1 bg-white/5 rounded-full border border-white/10 text-[10px] font-bold tracking-tighter">ALADHAN API</div>
                                            </div>
                                          </div>

                                          <div className="p-3 grid grid-cols-2 gap-2 relative z-10">
                                            {Object.entries(data.timings as PrayerTimings).filter(([k]) => ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'].includes(k)).map(([name, time]) => (
                                              <div key={name} className="bg-white/[0.03] hover:bg-white/[0.07] border border-white/5 p-4 rounded-3xl transition-all duration-300 group/tile">
                                                <div className="flex items-center justify-between mb-2">
                                                  <div className="text-[10px] font-bold uppercase tracking-widest text-white/40">{name}</div>
                                                  <div className="opacity-50 group-hover/tile:opacity-100 transition-opacity">
                                                    {prayerIcons[name] || <Clock size={14} />}
                                                  </div>
                                                </div>
                                                <div className="text-xl font-black tracking-tight group-hover/tile:scale-105 transition-transform origin-left">{time}</div>
                                              </div>
                                            ))}
                                          </div>

                                          <div className="p-4 pt-0 text-center">
                                            <div className="text-[9px] font-medium text-emerald-500/40 italic">
                                              Times are based on local coordination. Verify with your local mosque.
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    } catch (e) {
                                      return <code className={className} {...props}>{children}</code>;
                                    }
                                  }
                                  return <code className={className} {...props}>{children}</code>;
                                },
                                img: ({node, ...props}) => (
                                  <img
                                    {...props}
                                    className="max-w-full rounded-2xl my-4 shadow-lg border border-black/10 dark:border-white/10 hover:shadow-xl transition-all duration-500 transform hover:scale-[1.02] cursor-pointer"
                                    referrerPolicy="no-referrer"
                                    loading="lazy"
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement;
                                      if (target.src.includes('pollinations.ai') && !target.src.includes('?seed=')) {
                                        target.src = target.src + (target.src.includes('?') ? '&seed=' : '?seed=') + Math.random();
                                      }
                                    }}
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
        <div className="p-4 md:p-10 bg-gradient-to-t from-slate-50 via-slate-50/80 dark:from-[#02040a] dark:via-[#02040a]/80 to-transparent">
          <div className="max-w-4xl mx-auto relative">
            <AnimatePresence>
              {isDocHelperOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsDocHelperOpen(false)} />
                  <motion.div 
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.95 }}
                    className="absolute bottom-full left-0 mb-14 w-64 glass-liquid border border-black/10 dark:border-white/10 rounded-3xl p-2 shadow-2xl z-50 overflow-hidden"
                  >
                    <div className="p-3 border-b border-black/5 dark:border-white/5 mb-1">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t.docHelp}</p>
                    </div>
                    <div className="space-y-1">
                      {[
                        { id: 'application', label: t.docApplication },
                        { id: 'contract', label: t.docContract },
                        { id: 'reference', label: t.docReference },
                        { id: 'resume', label: t.docResume },
                        { id: 'complaint', label: t.docComplaint },
                      ].map((docItem) => (
                        <button
                          key={docItem.id}
                          onClick={() => handleDocHelp(docItem.id)}
                          className="flex items-center gap-3 w-full p-3 hover:bg-indigo-500/10 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-2xl transition-all text-xs font-bold text-left"
                        >
                          <FileText size={14} />
                          {docItem.label}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                </>
              )}

              {isTeacherOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsTeacherOpen(false)} />
                  <motion.div 
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.95 }}
                    className="absolute bottom-full left-0 sm:left-32 mb-14 w-64 glass-liquid border border-black/10 dark:border-white/10 rounded-3xl p-2 shadow-2xl z-50 overflow-hidden"
                  >
                    <div className="p-3 border-b border-black/5 dark:border-white/5 mb-1">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t.teacherMode}</p>
                    </div>
                    <div className="space-y-1">
                      {[
                        { id: 'math', label: t.math },
                        { id: 'physics', label: t.physics },
                        { id: 'tajik', label: t.tajikLanguage },
                        { id: 'history', label: t.historyTajikistan },
                        { id: 'english', label: t.english },
                      ].map((sub) => (
                        <button
                          key={sub.id}
                          onClick={() => handleTeacherHelp(sub.id)}
                          className="flex items-center gap-3 w-full p-3 hover:bg-slate-500/10 text-slate-700 dark:text-slate-300 hover:text-indigo-400 rounded-2xl transition-all text-xs font-bold text-left"
                        >
                          <BookOpen size={14} />
                          {sub.label}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                </>
              )}

              {isPrayerOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsPrayerOpen(false)} />
                  <motion.div 
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.95 }}
                    className="absolute bottom-full left-0 sm:left-64 mb-14 w-64 glass-liquid border border-black/10 dark:border-white/10 rounded-3xl p-2 shadow-2xl z-50 overflow-hidden"
                  >
                    <div className="p-3 border-b border-black/5 dark:border-white/5 mb-1">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t.prayerTimes}</p>
                    </div>
                    <div className="p-3">
                      <p className="text-xs text-slate-500 mb-3">{t.prayerTimesPrompt}</p>
                      <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1 custom-scrollbar">
                        {[
                          { id: 'khujand', name: t.cities.khujand },
                          { id: 'dushanbe', name: t.cities.dushanbe },
                          { id: 'khorog', name: t.cities.khorog },
                          { id: 'samarkand', name: t.cities.samarkand },
                          { id: 'bukhara', name: t.cities.bukhara },
                          { id: 'bishkek', name: t.cities.bishkek },
                          { id: 'almaty', name: t.cities.almaty },
                          { id: 'astana', name: t.cities.astana },
                          { id: 'kabul', name: t.cities.kabul },
                          { id: 'tehran', name: t.cities.tehran },
                          { id: 'isfahan', name: t.cities.isfahan }
                        ].map(city => (
                          <button
                            key={city.id}
                            disabled={isFetchingPrayer}
                            onClick={() => handlePrayerCityClick(city.id, city.name)}
                            className="p-2 bg-black/5 dark:bg-white/5 hover:bg-indigo-500/10 rounded-xl text-[10px] font-bold transition-all text-left disabled:opacity-50"
                          >
                            {city.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>

            <div className="flex flex-wrap gap-2 mb-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setIsDocHelperOpen(!isDocHelperOpen);
                  setIsTeacherOpen(false);
                  setIsPrayerOpen(false);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-full text-[11px] font-bold text-slate-600 dark:text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-300 shadow-sm transition-all"
              >
                <FileText size={14} />
                {t.docHelp}
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setIsTeacherOpen(!isTeacherOpen);
                  setIsDocHelperOpen(false);
                  setIsPrayerOpen(false);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-full text-[11px] font-bold text-slate-600 dark:text-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-300 shadow-sm transition-all"
              >
                <BookOpen size={14} />
                {t.teacherMode}
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setIsPrayerOpen(!isPrayerOpen);
                  setIsDocHelperOpen(false);
                  setIsTeacherOpen(false);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-full text-[11px] font-bold text-slate-600 dark:text-amber-400 hover:text-amber-600 dark:hover:text-amber-300 shadow-sm transition-all"
              >
                <Clock size={14} />
                {t.prayerTimes}
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleNews}
                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-full text-[11px] font-bold text-slate-600 dark:text-sky-400 hover:text-sky-600 dark:hover:text-sky-300 shadow-sm transition-all"
              >
                <Newspaper size={14} />
                {t.news}
              </motion.button>
            </div>

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
              className="relative flex flex-col gap-2 glass-liquid border border-black/10 dark:border-white/10 rounded-[2rem] p-2 md:p-3 shadow-2xl focus-within:border-indigo-500/40 focus-within:shadow-indigo-500/10 transition-all duration-500 group mx-2 md:mx-0"
            >
              <AnimatePresence>
                {selectedImage && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="px-3 pt-2 md:px-5 md:pt-3">
                    <div className="relative inline-block group/img">
                      <img src={selectedImage} alt="Preview" className="h-16 md:h-20 w-auto rounded-xl object-cover border border-slate-200 dark:border-slate-800 shadow-md transition-all group-hover/img:brightness-75" />
                      <button onClick={() => setSelectedImage(null)} className="absolute -top-2 -right-2 p-1.5 bg-slate-800 dark:bg-white text-white dark:text-slate-900 rounded-full hover:scale-110 shadow-md transition-all z-10 opacity-0 group-hover/img:opacity-100">
                        <X size={12} strokeWidth={3} />
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <div className="flex items-end gap-1 md:gap-2 w-full">
                <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={handleImageUpload} />
                <motion.button 
                  onClick={() => fileInputRef.current?.click()}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-3 md:p-4 rounded-full text-slate-500 hover:text-indigo-600 dark:text-indigo-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-all outline-none"
                  title="Upload Image/File"
                >
                  <Paperclip size={18} className="md:w-5 md:h-5" />
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
                className="flex-1 bg-transparent border-none focus:ring-0 text-[14px] md:text-[15px] pt-4 pb-4 px-2 min-h-[50px] resize-none max-h-[150px] md:max-h-[200px] custom-scrollbar placeholder:text-slate-400 dark:placeholder:text-slate-600 text-slate-900 dark:text-slate-200 leading-relaxed font-medium"
                rows={1}
              />
              <motion.button
                whileHover={input.trim() && !isLoading ? { scale: 1.05 } : {}}
                whileTap={input.trim() && !isLoading ? { scale: 0.95 } : {}}
                onClick={() => handleSend()}
                disabled={(!input.trim() && !selectedImage) || isLoading}
                className={cn(
                  "p-3 md:p-4 rounded-[1.5rem] md:rounded-[1.8rem] transition-all duration-500 flex items-center justify-center m-1 md:m-0",
                  (input.trim() || selectedImage) && !isLoading
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/40"
                    : "bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-slate-600 cursor-not-allowed"
                )}
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Send size={18} className="md:w-[22px] md:h-[22px]" />
                )}
              </motion.button>
              </div>
            </motion.div>
            <p className="text-[9px] md:text-[10px] text-center text-slate-600 mt-3 md:mt-5 mb-2 md:mb-0 font-bold uppercase tracking-[0.25em] opacity-50 pb-safe">
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
              className="relative w-full max-w-2xl bg-white dark:bg-[#0b0f1a] border border-black/10 dark:border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden glass-liquid"
            >
              <div className="p-6 border-b border-black/5 dark:border-white/5 flex items-center justify-between bg-black/[0.02] dark:bg-white/[0.02]">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-500">
                    <Settings size={22} className={cn(activeSettingsTab === 'profile' && "animate-spin-slow")} />
                  </div>
                  <h3 className="text-xl font-bold">{t.settings}</h3>
                </div>
                <button 
                  onClick={() => setIsSettingsOpen(false)}
                  className="p-2 hover:bg-black/5 dark:bg-white/5 rounded-xl transition-colors text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:text-white"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex px-6 pt-4 gap-1 border-b border-black/5 dark:border-white/5">
                {[
                  { id: 'profile', label: t.profile, icon: User },
                  { id: 'memory', label: t.memory, icon: Brain },
                  { id: 'theme', label: t.theme, icon: Sun },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveSettingsTab(tab.id as any)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-3 text-xs font-bold uppercase tracking-widest transition-all relative",
                      activeSettingsTab === tab.id ? "text-indigo-600 dark:text-indigo-400" : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                    )}
                  >
                    <tab.icon size={14} />
                    {tab.label}
                    {activeSettingsTab === tab.id && (
                      <motion.div layoutId="settingsTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500" />
                    )}
                  </button>
                ))}
              </div>
              
              <div className="p-8 space-y-6 overflow-y-auto max-h-[60vh] custom-scrollbar">
                {activeSettingsTab === 'profile' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">{t.name}</label>
                        <input
                          type="text"
                          value={profile.name}
                          onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                          className="w-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-xl px-4 py-3 text-sm focus:ring-2 ring-indigo-500/20 outline-none transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">{t.email}</label>
                        <input
                          type="email"
                          disabled
                          value={profile.email}
                          className="w-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-xl px-4 py-3 text-sm opacity-50 cursor-not-allowed"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">{t.apiKey} (Optional)</label>
                      <input
                        type="password"
                        value={profile.apiKey}
                        onChange={(e) => setProfile({ ...profile, apiKey: e.target.value })}
                        placeholder="Your personal Gemini API Key"
                        className="w-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-xl px-4 py-3 text-sm focus:ring-2 ring-indigo-500/20 outline-none transition-all"
                      />
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
                      {/* Using a regular button here as click helper might be needed */}
                      <button
                        onClick={() => {
                           if (confirm(t.allChatsCleared)) {
                             localStorage.removeItem('sugd_ai_chats');
                             window.location.reload();
                           }
                        }}
                        className="flex items-center gap-3 w-full p-4 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-2xl transition-all duration-300 font-medium group"
                      >
                        <Trash2 size={18} className="group-hover:scale-110 transition-transform" />
                        <span>{t.clearAll}</span>
                      </button>
                    </div>
                  </div>
                )}

                {activeSettingsTab === 'memory' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                           <User size={12} /> {t.basicInfo}
                        </h4>
                        <div className="space-y-3">
                          {[
                            { label: t.nameLabel, key: 'name' as keyof UserMemory },
                            { label: t.ageLabel, key: 'age' as keyof UserMemory },
                            { label: t.cityLabel, key: 'city' as keyof UserMemory },
                            { label: t.professionLabel, key: 'profession' as keyof UserMemory },
                          ].map((field) => (
                            <div key={field.key} className="space-y-1">
                              <label className="text-xs font-bold text-slate-400 ml-1">{field.label}</label>
                              <input
                                type="text"
                                disabled={!isEditingMemory}
                                value={tempMemory[field.key] || ''}
                                onChange={(e) => setTempMemory({ ...tempMemory, [field.key]: e.target.value })}
                                className="w-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-xl px-4 py-3 text-sm focus:ring-2 ring-indigo-500/20 outline-none transition-all disabled:opacity-70"
                                placeholder="..."
                              />
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                          <Heart size={12} /> {t.interestsGoals}
                        </h4>
                        <div className="space-y-4">
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-400 ml-1">{t.interestsLabel}</label>
                            <textarea
                              disabled={!isEditingMemory}
                              value={(tempMemory.interests || []).join(', ')}
                              onChange={(e) => setTempMemory({ ...tempMemory, interests: e.target.value.split(',').map(s => s.trim()) })}
                              className="w-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-xl px-4 py-3 text-sm h-24 resize-none focus:ring-2 ring-indigo-500/20 outline-none transition-all disabled:opacity-70"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-400 ml-1">{t.goalsLabel}</label>
                            <textarea
                              disabled={!isEditingMemory}
                              value={(tempMemory.goals || []).join(', ')}
                              onChange={(e) => setTempMemory({ ...tempMemory, goals: e.target.value.split(',').map(s => s.trim()) })}
                              className="w-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-xl px-4 py-3 text-sm h-24 resize-none focus:ring-2 ring-indigo-500/20 outline-none transition-all disabled:opacity-70"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-4 border-t border-black/5 dark:border-white/5">
                      <div className="text-[10px] text-slate-500 font-medium max-w-[60%]">
                        <span className="text-indigo-500 font-bold">Совет / Tip:</span> {t.proTip}
                      </div>
                      <div className="flex gap-3">
                        {isEditingMemory ? (
                          <>
                            <button
                              onClick={() => {
                                setIsEditingMemory(false);
                                setTempMemory(profile.memory);
                              }}
                              className="px-4 py-2 rounded-xl font-bold text-xs hover:bg-black/5 dark:hover:bg-white/5 transition-all text-slate-500"
                            >
                              {t.cancel}
                            </button>
                            <button
                              onClick={handleSaveMemory}
                              className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-xs shadow-lg shadow-indigo-600/30 hover:scale-105 transition-all flex items-center gap-2"
                            >
                              <Save size={14} /> {t.saveChanges}
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => setIsEditingMemory(true)}
                            className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold text-xs hover:scale-105 transition-all flex items-center gap-2"
                          >
                            <Pencil size={14} /> {t.editManually}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {activeSettingsTab === 'theme' && (
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t.language}</label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {[
                          { id: 'tg', label: 'Тоҷикӣ' },
                          { id: 'ru', label: 'Русский' },
                          { id: 'en', label: 'English' },
                          { id: 'fa', label: 'فارسی' }
                        ].map((l) => (
                          <button
                            key={l.id}
                            onClick={() => {
                              setLang(l.id as any);
                              localStorage.setItem('sugd_ai_lang', l.id);
                            }}
                            className={cn(
                              "px-4 py-3 rounded-xl text-xs font-bold transition-all border",
                              lang === l.id 
                                ? "bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-600/25" 
                                : "bg-black/5 dark:bg-white/5 border-transparent text-slate-600 dark:text-slate-400 hover:bg-black/10 dark:hover:bg-white/10"
                            )}
                          >
                            {l.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t.theme}</label>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setTheme('light');
                            document.documentElement.classList.remove('dark');
                            localStorage.setItem('sugd_ai_theme', 'light');
                          }}
                          className={cn(
                            "flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs font-bold transition-all border",
                            theme === 'light' 
                              ? "bg-white text-indigo-600 border-indigo-100 shadow-xl" 
                              : "bg-black/5 dark:bg-white/5 border-transparent text-slate-600 dark:text-slate-400 hover:bg-black/10 dark:hover:bg-white/10"
                          )}
                        >
                          <Sun size={16} /> {t.lightMode}
                        </button>
                        <button
                          onClick={() => {
                            setTheme('dark');
                            document.documentElement.classList.add('dark');
                            localStorage.setItem('sugd_ai_theme', 'dark');
                          }}
                          className={cn(
                            "flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs font-bold transition-all border",
                            theme === 'dark' 
                              ? "bg-slate-900 text-indigo-400 border-slate-800 shadow-xl" 
                              : "bg-black/5 dark:bg-white/5 border-transparent text-slate-600 dark:text-slate-400 hover:bg-black/10 dark:hover:bg-white/10"
                          )}
                        >
                          <Moon size={16} /> {t.darkMode}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="p-6 border-t border-black/5 dark:border-white/5 flex items-center justify-between bg-black/[0.01] dark:bg-white/[0.01]">
                <button
                  onClick={() => {
                    if (user) {
                      const updated = {
                        username: profile.name,
                        fullName: profile.fullName,
                        bio: profile.bio,
                        links: profile.links,
                        photoUrl: profile.photoUrl
                      };
                      import('./lib/firebase').then(m => m.updateUserProfileInDB(user.uid, updated));
                      toast.success("Settings saved locally");
                    }
                    setIsSettingsOpen(false);
                  }}
                  className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-bold text-sm shadow-xl shadow-indigo-600/30 hover:scale-105 transition-all flex items-center gap-2 ml-auto"
                >
                  <Save size={18} /> {t.save}
                </button>
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
