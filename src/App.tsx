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
  Clock,
  Camera
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Toaster, toast } from 'sonner';
import { Joyride, Step } from 'react-joyride';
import { cn } from './lib/utils';
import { Logo } from './components/Logo';
import { GlobalChat } from './components/GlobalChat';
import { UserProfileViewer } from './components/UserProfileViewer';
import { DirectMessageChat } from './components/DirectMessageChat';
import { FriendsMenu } from './components/FriendsMenu';
import { getGeminiResponse, extractMemoryUpdates } from './lib/gemini';
import { translations } from './translations';
import { fetchPrayerTimes, type PrayerTimings } from './services/prayerService';
import { PrayerCard, NewsCard } from './components/Widgets';
import { CodeBlock } from './components/ChatComponents';
import { Sidebar } from './components/layout/Sidebar';
import { ChatHeader } from './components/layout/ChatHeader';

import { useAuth } from './lib/AuthContext';
import { LoginScreen, SetupProfileScreen } from './components/AuthScreens';
import { AdminDashboard } from './components/AdminDashboard';
import { logout, loadUserChatsFromDB, saveUserChatsToDB, updateUserMemory } from './lib/firebase';

import { Message, ChatHistory, UserMemory } from './types';

function MainApp() {
  const { user, profile: authProfile, refreshProfile, localGuest } = useAuth();
  const [isAdminDashboardOpen, setIsAdminDashboardOpen] = useState(false);
  const [showGlobalChat, setShowGlobalChat] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [activeDM, setActiveDM] = useState<{ chatId: string, profile: any } | null>(null);
  const [showFriends, setShowFriends] = useState(false);
  const [input, setInput] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const profileFileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const autoResize = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 250)}px`;
    }
  };

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
  
  const _authProfile = authProfile || (localGuest ? {
    username: 'guest_user',
    email: 'guest@local.browser',
    fullName: 'Guest User',
    photoUrl: '',
    bio: 'Local Guest',
    links: '',
    memory: {} as UserMemory,
    isAdmin: false,
    createdAt: new Date()
  } as any : null);
  
  const [profile, setProfile] = useState({ 
    name: _authProfile?.username || 'User', 
    email: _authProfile?.email || '', 
    apiKey: '',
    fullName: _authProfile?.fullName || '',
    photoUrl: _authProfile?.photoUrl || '',
    bio: _authProfile?.bio || '',
    links: _authProfile?.links || '',
    memory: _authProfile?.memory || {} as UserMemory
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

  const handleProfileImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Profile image should be less than 2MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 250;
          const MAX_HEIGHT = 250;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
          setProfile(prev => ({ ...prev, photoUrl: dataUrl }));
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleShareMessage = (content: string) => {
    if (navigator.share) {
      navigator.share({
        title: 'Sugd AI Message',
        text: content,
        url: window.location.href
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(content);
      toast.success("Message copied to clipboard!");
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
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 overflow-hidden font-sans relative" dir={isRTL ? "rtl" : "ltr"}>
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
      
      {/* Sidebar */}
      <Sidebar 
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        chats={chats}
        currentChatId={currentChatId}
        setCurrentChatId={setCurrentChatId}
        createNewChat={createNewChat}
        deleteChat={deleteChat}
        setIsAdminDashboardOpen={setIsAdminDashboardOpen}
        setShowGlobalChat={setShowGlobalChat}
        setShowFriends={setShowFriends}
        isAdmin={!!authProfile?.isAdmin}
        profile={profile}
        t={t}
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative overflow-hidden z-10">
        {/* Header */}
        <ChatHeader 
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
          selectedModel={selectedModel}
          setSelectedModel={setSelectedModel}
          isModelMenuOpen={isModelMenuOpen}
          setIsModelMenuOpen={setIsModelMenuOpen}
          models={models}
          clearChat={() => {
            if (currentChatId) {
              const newChats = chats.map(c => c.id === currentChatId ? { ...c, messages: [] } : c);
              setChats(newChats);
              toast.success(t.chatCleared);
            }
          }}
          setIsSettingsOpen={setIsSettingsOpen}
          t={t}
        />

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
                    className="text-5xl md:text-8xl font-black mb-8 tracking-tighter text-slate-900 dark:text-white dark:bg-clip-text dark:text-transparent dark:bg-gradient-to-br from-white via-white to-white/20 select-none"
                  >
                    {t.title}
                  </motion.h2>
                  <motion.p 
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-slate-600 dark:text-slate-400 mb-16 max-w-xl text-xl leading-relaxed font-medium opacity-70 italic"
                  >
                    {t.subtitle}
                  </motion.p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-4xl px-4 md:px-0">
                    {suggestions.map((s, i) => (
                      <motion.button
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 + (i * 0.1), ease: [0.16, 1, 0.3, 1] }}
                        onClick={() => setInput(s.prompt)}
                        className={cn(
                          "p-6 border border-black/5 dark:border-white/5 hover:border-indigo-500/50 dark:hover:border-indigo-500/30 rounded-[2rem] text-left transition-all duration-500 group relative overflow-hidden",
                          i > 1 ? "hidden md:block" : "bg-white/[0.01] dark:bg-white/[0.01] hover:bg-slate-50 dark:hover:bg-white/[0.03] shadow-sm hover:shadow-2xl hover:-translate-y-1"
                        )}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                             <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                             <span className="text-[11px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.3em]">{s.title}</span>
                          </div>
                          <ChevronRight size={16} className="text-slate-400 group-hover:text-indigo-600 dark:text-indigo-400 group-hover:translate-x-1 transition-all" />
                        </div>
                        <p className="text-sm md:text-base text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200 transition-colors leading-relaxed font-medium">{s.prompt}</p>
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
                          "p-6 md:p-8 rounded-[2.5rem] relative group transition-all duration-700",
                          message.role === 'user' 
                            ? "bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-white/10 shadow-indigo-500/5" 
                            : "bg-white dark:bg-[#0f1523]/80 border border-slate-200 dark:border-white/10 shadow-2xl"
                        )}>
                          <div className="absolute top-4 right-6 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center gap-2">
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
                                  if (!inline && match) {
                                    if (match[1] === 'prayer-card') {
                                      try {
                                        const rawJson = String(children).trim();
                                        const data = JSON.parse(rawJson);
                                        return <PrayerCard data={data} />;
                                      } catch (e) {
                                        return <CodeBlock className={className} {...props}>{children}</CodeBlock>;
                                      }
                                    }
                                    if (match[1] === 'news-card') {
                                      try {
                                        const rawJson = String(children).trim();
                                        const data = JSON.parse(rawJson);
                                        return <NewsCard data={data} />;
                                      } catch (e) {
                                        return <CodeBlock className={className} {...props}>{children}</CodeBlock>;
                                      }
                                    }
                                    return <CodeBlock className={className} {...props}>{children}</CodeBlock>;
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
                            
                            {message.role === 'assistant' && (
                              <div className="flex items-center gap-2 mt-4 pt-3 border-t border-black/5 dark:border-white/5 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                  onClick={() => handleShareMessage(message.content)}
                                  className="p-1.5 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-all text-slate-400 hover:text-indigo-500 flex items-center gap-1.5"
                                  title="Share Content"
                                >
                                  <Share2 size={13} />
                                  <span className="text-[9px] font-black uppercase tracking-[0.2em]">Share</span>
                                </button>
                                <button 
                                  onClick={() => {
                                    navigator.clipboard.writeText(message.content);
                                    toast.success("Copied!");
                                  }}
                                  className="p-1.5 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-all text-slate-400 hover:text-indigo-500 flex items-center gap-1.5"
                                  title="Copy Content"
                                >
                                  <Copy size={13} />
                                  <span className="text-[9px] font-black uppercase tracking-[0.2em]">Copy</span>
                                </button>
                              </div>
                            )}
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
        <div className="p-4 md:p-10 bg-transparent">
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
              className="relative flex flex-col gap-2 bg-white/50 dark:bg-slate-900/50 backdrop-blur-3xl border border-black/10 dark:border-white/10 rounded-[2rem] p-3 md:p-4 focus-within:border-indigo-500/40 focus-within:shadow-2xl focus-within:shadow-indigo-500/10 transition-all duration-500 group mx-2 md:mx-0"
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
                  className="p-3 md:p-4 rounded-2xl text-slate-500 hover:text-indigo-600 dark:text-indigo-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-all outline-none"
                  title="Upload Image/File"
                >
                  <Paperclip size={20} />
                </motion.button>
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                    if (showHint) setShowHint(false);
                    autoResize();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder={t.typeMessage}
                  className="flex-1 bg-transparent border-none focus:ring-0 text-sm md:text-base pt-4 pb-4 px-2 min-h-[50px] resize-none max-h-[150px] md:max-h-[250px] custom-scrollbar placeholder:text-slate-400 dark:placeholder:text-slate-700 text-slate-900 dark:text-slate-100 leading-relaxed font-medium"
                  rows={1}
                />
                <div className="flex items-center gap-2 mb-2 md:mb-3">
                  <motion.button
                    whileHover={input.trim() && !isLoading ? { scale: 1.05 } : {}}
                    whileTap={input.trim() && !isLoading ? { scale: 0.95 } : {}}
                    onClick={() => handleSend()}
                    disabled={(!input.trim() && !selectedImage) || isLoading}
                    className={cn(
                      "w-12 h-12 md:w-14 md:h-14 rounded-2xl md:rounded-[1.8rem] transition-all duration-500 flex items-center justify-center m-1 md:m-0",
                      (input.trim() || selectedImage) && !isLoading
                        ? "bg-indigo-600 text-white shadow-xl shadow-indigo-600/40"
                        : "bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-slate-700 cursor-not-allowed"
                    )}
                  >
                    {isLoading ? (
                      <RefreshCw size={20} className="animate-spin text-white" />
                    ) : (
                      <Send size={20} className={cn("transition-transform duration-500", input.trim() && "translate-x-0.5 -translate-y-0.5")} />
                    )}
                  </motion.button>
                </div>
              </div>
            </motion.div>
            <div className="flex items-center justify-center gap-4 mt-8 md:mt-10 opacity-40 select-none pointer-events-none">
               <div className="h-px w-16 bg-gradient-to-r from-transparent to-slate-400" />
               <p className="text-[10px] text-center text-slate-500 font-extrabold uppercase tracking-[0.5em]">
                  Azure Neural • Azam Corp
               </p>
               <div className="h-px w-16 bg-gradient-to-l from-transparent to-slate-400" />
            </div>
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
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Username</label>
                          <input
                            type="text"
                            value={profile.name}
                            onChange={(e) => setProfile({ ...profile, name: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })}
                            className="w-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-xl px-4 py-3 text-sm focus:ring-2 ring-indigo-500/20 outline-none transition-all"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Full Name</label>
                          <input
                            type="text"
                            value={profile.fullName}
                            onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                            className="w-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-xl px-4 py-3 text-sm focus:ring-2 ring-indigo-500/20 outline-none transition-all"
                          />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <div className="flex items-center gap-4 border-b border-black/5 dark:border-white/5 pb-4">
                            <div className="relative group cursor-pointer" onClick={() => profileFileInputRef.current?.click()}>
                              {profile.photoUrl ? (
                                <img src={profile.photoUrl} alt="Avatar" className="w-16 h-16 rounded-2xl object-cover shadow-lg border border-black/10 dark:border-white/10" />
                              ) : (
                                <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 border border-indigo-500/20">
                                  <User size={24} />
                                </div>
                              )}
                              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-all rounded-2xl flex items-center justify-center text-white">
                                <Camera size={20} />
                              </div>
                              <input type="file" accept="image/*" ref={profileFileInputRef} className="hidden" onChange={handleProfileImageUpload} />
                            </div>
                            <div>
                              <h4 className="text-sm font-bold dark:text-white">Profile Picture</h4>
                              <p className="text-[10px] text-slate-500">JPG, PNG up to 2MB</p>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Links</label>
                          <input
                            type="text"
                            value={profile.links}
                            onChange={(e) => setProfile({ ...profile, links: e.target.value })}
                            placeholder="https://your-link.com"
                            className="w-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-xl px-4 py-3 text-sm focus:ring-2 ring-indigo-500/20 outline-none transition-all"
                          />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Bio</label>
                          <textarea
                            value={profile.bio}
                            onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                            placeholder="Tell us about yourself..."
                            className="w-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-xl px-4 py-3 text-sm focus:ring-2 ring-indigo-500/20 outline-none transition-all min-h-[80px]"
                          />
                        </div>
                        <div className="space-y-2 md:col-span-2 border-t border-black/5 dark:border-white/5 pt-4">
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

      <AnimatePresence>
        {showGlobalChat && (
          <GlobalChat onClose={() => setShowGlobalChat(false)} onSelectUser={setSelectedUserId} />
        )}
        
        {showFriends && (
          <FriendsMenu
            onClose={() => setShowFriends(false)}
            onOpenMessage={(chatId, profile) => setActiveDM({ chatId, profile })}
            onOpenProfile={setSelectedUserId}
          />
        )}
        
        {selectedUserId && (
          <UserProfileViewer 
            userId={selectedUserId} 
            onClose={() => setSelectedUserId(null)}
            onOpenMessage={(chatId, profile) => setActiveDM({ chatId, profile })}
          />
        )}
        
        {activeDM && (
          <DirectMessageChat
            chatId={activeDM.chatId}
            otherUser={activeDM.profile}
            onClose={() => setActiveDM(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default function App() {
  const { user, profile, loading, localGuest } = useAuth();
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

  if (!user && !localGuest) {
    return <LoginScreen />;
  }

  if (!profile && !localGuest) {
    return <SetupProfileScreen />;
  }

  return <MainApp />;
}
