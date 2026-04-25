import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Menu, 
  ChevronDown, 
  Trash2, 
  Share2 
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface ChatHeaderProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  isModelMenuOpen: boolean;
  setIsModelMenuOpen: (open: boolean) => void;
  models: { id: string, name: string }[];
  clearChat: () => void;
  t: any;
}

export const ChatHeader = ({
  isSidebarOpen,
  setIsSidebarOpen,
  selectedModel,
  setSelectedModel,
  isModelMenuOpen,
  setIsModelMenuOpen,
  models,
  clearChat,
  t
}: ChatHeaderProps) => {
  return (
    <header className="h-16 md:h-20 border-b border-black/5 dark:border-white/5 flex items-center justify-between px-4 md:px-10 bg-white/80 dark:bg-black/20 backdrop-blur-2xl sticky top-0 z-20">
      <div className="flex items-center gap-4">
        {!isSidebarOpen && (
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2.5 hover:bg-black/5 dark:bg-white/5 rounded-2xl transition-colors text-slate-600 dark:text-slate-400"
          >
            <Menu size={22} />
          </button>
        )}
        <div className="flex flex-col">
          <div className="flex items-center gap-2" id="tour-model-select">
            <h1 className="text-sm md:text-base font-black tracking-tighter uppercase italic text-indigo-600 dark:text-indigo-400">Sugd AI</h1>
            <div className="relative flex items-center gap-2">
              <button 
                onClick={() => setIsModelMenuOpen(!isModelMenuOpen)}
                className="flex items-center gap-1.5 px-3 py-1 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:bg-white/10 rounded-full border border-black/5 dark:border-white/5 text-[10px] font-black text-slate-600 dark:text-slate-400 transition-all"
              >
                {models.find(m => m.id === selectedModel)?.name || 'Sugd Flash'} 
                <ChevronDown size={10} className={cn("transition-transform duration-500", isModelMenuOpen && "rotate-180")} />
              </button>
              <AnimatePresence>
                {isModelMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute top-full left-0 mt-3 w-56 bg-white dark:bg-[#0b0f1a] border border-black/10 dark:border-white/10 rounded-[1.8rem] shadow-2xl z-50 overflow-hidden backdrop-blur-3xl"
                  >
                    <div className="p-2 space-y-1">
                      {models.map((model) => (
                        <button
                          key={model.id}
                          onClick={() => {
                            setSelectedModel(model.id);
                            setIsModelMenuOpen(false);
                          }}
                          className={cn(
                            "w-full px-4 py-3 text-left text-[11px] font-black uppercase tracking-widest transition-all rounded-2xl relative group/item",
                            selectedModel === model.id 
                              ? "text-indigo-600 dark:text-indigo-400 bg-indigo-500/10" 
                              : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5"
                          )}
                        >
                          {model.name}
                          {selectedModel === model.id && (
                            <motion.div layoutId="activeModelDot" className="absolute right-4 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
                          )}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
             <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
             <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest opacity-60">Neural Engine v1.5</span>
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-2 md:gap-4">
        <button 
          onClick={clearChat}
          className="p-2.5 hover:bg-red-500/10 rounded-2xl transition-colors text-slate-400 hover:text-red-500 group"
          title={t.clearChat}
        >
          <Trash2 size={20} className="group-hover:scale-110 transition-transform" />
        </button>
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 rounded-full border border-emerald-500/10">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
          <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-500 uppercase tracking-widest">E2E Secure</span>
        </div>
        <button className="p-2.5 hover:bg-indigo-500/10 rounded-2xl transition-colors text-slate-400 hover:text-indigo-500 group">
          <Share2 size={20} className="group-hover:rotate-12 transition-transform" />
        </button>
      </div>
    </header>
  );
};
