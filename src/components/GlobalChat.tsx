import React, { useState, useEffect, useRef } from 'react';
import { collection, query, orderBy, limit, addDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Send, User, X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { useAuth } from '../lib/AuthContext';

export const GlobalChat = ({ onClose }: { onClose: () => void }) => {
  const { user, profile, localGuest } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Only fetch if db is available
    if (!db) {
      setLoading(false);
      return;
    }
    const q = query(
      collection(db, 'global_messages'),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).reverse();
      setMessages(msgs);
      setLoading(false);
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }, (error) => {
      console.error(error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    if (localGuest && !user) {
      toast.error('Global chat is read-only for local guests without Firebase auth');
      return;
    }

    try {
      await addDoc(collection(db, 'global_messages'), {
        text: input,
        userId: user?.uid || 'guest',
        username: profile?.username || profile?.name || 'User',
        photoUrl: profile?.photoUrl || null,
        createdAt: serverTimestamp()
      });
      setInput('');
    } catch (e) {
      console.error(e);
      toast.error('Failed to send message');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-[500px] sm:h-[700px] bg-white dark:bg-slate-900 sm:rounded-[2rem] sm:shadow-2xl sm:border border-slate-200 dark:border-slate-800 z-50 flex flex-col overflow-hidden"
    >
      <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl">
        <div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <User size={18} className="text-indigo-500" /> 
            Global Chat
          </h2>
          <p className="text-xs text-slate-500">Live community</p>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
          <X className="text-slate-500" size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-[#02040a]">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <Loader2 className="animate-spin text-indigo-500" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-slate-500 dark:text-slate-400 mt-10 text-sm">No messages yet. Say hi!</div>
        ) : (
          messages.map(msg => {
            const isMe = msg.userId === user?.uid || (localGuest && msg.userId === 'guest');
            return (
              <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <div className="flex items-center gap-2 mb-1">
                  {!isMe && <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{msg.username}</span>}
                </div>
                <div className={`px-4 py-2.5 rounded-2xl max-w-[85%] text-sm ${isMe ? 'bg-indigo-600 text-white rounded-br-sm' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-200 rounded-bl-sm shadow-sm'}`}>
                  {msg.text}
                </div>
              </div>
            );
          })
        )}
        <div ref={endRef} />
      </div>

      <form onSubmit={handleSend} className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-transparent border-none focus:ring-0 text-sm px-3 text-slate-800 dark:text-slate-200"
          />
          <button 
            type="submit"
            disabled={!input.trim()}
            className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-colors"
          >
            <Send size={18} />
          </button>
        </div>
      </form>
    </motion.div>
  );
};
