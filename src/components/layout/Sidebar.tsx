import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Plus, 
  MessageSquare, 
  Trash2, 
  Settings, 
  Users,
  Brain,
  User
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Logo } from '../Logo';
import { ChatHistory } from '../../types';
import { logout } from '../../lib/firebase';

interface SidebarProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  chats: ChatHistory[];
  currentChatId: string | null;
  setCurrentChatId: (id: string | null) => void;
  createNewChat: () => void;
  deleteChat: (id: string, e: React.MouseEvent) => void;
  setIsSettingsOpen: (open: boolean) => void;
  setIsAdminDashboardOpen: (open: boolean) => void;
  setIsProfileEditorOpen: (open: boolean) => void;
  setShowGlobalChat: (open: boolean) => void;
  isAdmin: boolean;
  profile: any;
  t: any;
}

export const Sidebar = ({
  isSidebarOpen,
  setIsSidebarOpen,
  chats,
  currentChatId,
  setCurrentChatId,
  createNewChat,
  deleteChat,
  setIsSettingsOpen,
  setIsAdminDashboardOpen,
  setIsProfileEditorOpen,
  setShowGlobalChat,
  isAdmin,
  profile,
  t
}: SidebarProps) => {
  const wisdom = t.wisdoms[Math.floor(Math.random() * t.wisdoms.length)];

  return (
    <>
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
            className="flex items-center gap-2 w-full p-3 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 rounded-xl transition-all duration-300 mb-6 font-bold group shadow-sm hover:shadow-indigo-500/10"
          >
            <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
            <span className="uppercase tracking-widest text-[11px]">{t.newChat}</span>
          </button>

          <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar" id="tour-chat-history">
            <div className="text-[10px] uppercase tracking-[0.3em] text-slate-500 font-black mb-4 px-2 opacity-50">
              {t.chatHistory}
            </div>
            {chats.length === 0 ? (
              <div className="text-sm text-slate-600 px-2 italic">{t.noChats}</div>
            ) : (
              <AnimatePresence>
                {chats.map((chat) => (
                  <motion.div
                    layout
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    key={chat.id}
                    onClick={() => {
                      setCurrentChatId(chat.id);
                      if (window.innerWidth < 768) setIsSidebarOpen(false);
                    }}
                    className={cn(
                      "group flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-all duration-300 border",
                      currentChatId === chat.id 
                        ? "bg-indigo-600 text-white border-transparent shadow-lg shadow-indigo-600/20" 
                        : "border-transparent hover:bg-black/5 dark:hover:bg-white/5 text-slate-600 dark:text-slate-400"
                    )}
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <MessageSquare size={16} className={cn(currentChatId === chat.id ? "text-white" : "text-indigo-500")} />
                      <span className="text-sm truncate font-bold tracking-tight">{chat.title}</span>
                    </div>
                    <button
                      onClick={(e) => deleteChat(chat.id, e)}
                      className={cn(
                        "opacity-0 group-hover:opacity-100 p-1.5 rounded-lg transition-all",
                        currentChatId === chat.id ? "hover:bg-white/20 text-white" : "hover:bg-red-500/10 text-red-400"
                      )}
                    >
                      <Trash2 size={14} />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>

          <div className="mt-4 p-4 rounded-3xl bg-indigo-600/5 border border-indigo-500/10 relative overflow-hidden group/wisdom">
             <div className="absolute top-0 right-0 p-2">
                <Brain size={12} className="text-indigo-500/20 group-hover/wisdom:scale-125 transition-transform" />
             </div>
             <p className="text-[9px] font-black uppercase tracking-[0.2em] text-indigo-500/60 mb-2">{t.wisdom}</p>
             <p className="text-[11px] font-medium text-slate-600 dark:text-slate-400 leading-relaxed italic">
               "{wisdom}"
             </p>
          </div>

          <div className="mt-4 pt-4 border-t border-black/5 dark:border-white/5" id="tour-settings">
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowGlobalChat(true)}
              className="flex items-center gap-3 w-full p-3 hover:bg-slate-100 dark:hover:bg-white/5 rounded-2xl transition-all duration-300 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:text-white text-xs font-bold uppercase tracking-widest group"
            >
              <Users size={18} className="group-hover:scale-110 transition-transform duration-500" />
              <span>Global Chat</span>
            </motion.button>
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsSettingsOpen(true)}
              className="flex items-center gap-3 w-full p-3 hover:bg-slate-100 dark:hover:bg-white/5 rounded-2xl transition-all duration-300 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:text-white text-xs font-bold uppercase tracking-widest group mt-1"
            >
              <Settings size={18} className="group-hover:rotate-90 transition-transform duration-500" />
              <span>{t.settings}</span>
            </motion.button>
            {isAdmin && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsAdminDashboardOpen(true)}
                className="flex items-center gap-3 w-full p-3 hover:bg-indigo-500/10 rounded-2xl transition-all duration-300 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:text-indigo-300 text-xs font-bold uppercase tracking-widest group mt-1"
              >
                <Users size={18} />
                <span>Admin Panel</span>
              </motion.button>
            )}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsProfileEditorOpen(true)}
              className="flex items-center gap-3 w-full p-3 hover:bg-emerald-500/10 rounded-2xl transition-all duration-300 text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:text-emerald-300 text-xs font-bold uppercase tracking-widest group mt-1"
            >
              <User size={18} />
              <span>Edit Profile</span>
            </motion.button>
            <div 
              className="flex items-center gap-3 p-3 mt-4 bg-black/[0.02] dark:bg-white/[0.02] rounded-3xl border border-black/5 dark:border-white/5 relative group cursor-pointer overflow-hidden transition-all hover:border-red-500/20" 
              onClick={logout}
            >
              <div className="w-10 h-10 rounded-2xl overflow-hidden bg-gradient-to-tr from-indigo-600 to-blue-400 flex items-center justify-center text-xs font-bold text-white shadow-lg shadow-indigo-500/20 uppercase shrink-0 relative z-10">
                {profile.photoUrl ? (
                  <img src={profile.photoUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  profile.name.substring(0,2)
                )}
              </div>
              <div className="flex flex-col overflow-hidden relative z-10">
                <span className="text-xs font-black truncate text-slate-900 dark:text-white uppercase tracking-tight">{profile.fullName || profile.name}</span>
                <span className="text-[10px] text-slate-500 truncate font-medium">{profile.email}</span>
              </div>
              <div className="absolute inset-0 bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center backdrop-blur-md z-20 translate-y-full group-hover:translate-y-0">
                <span className="text-[10px] font-black uppercase tracking-[0.3em]">Logout Account</span>
              </div>
            </div>
          </div>
        </div>
      </motion.aside>
    </>
  );
};
