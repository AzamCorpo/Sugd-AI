import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot, getDocs } from 'firebase/firestore';
import { db, UserProfile } from '../lib/firebase';
import { Users, X, Shield, Clock, Brain } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';
import { Logo } from './Logo';

export const AdminDashboard = ({ onClose }: { onClose: () => void }) => {
  const [users, setUsers] = useState<(UserProfile & { uid: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<(UserProfile & { uid: string }) | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({
        uid: doc.id,
        ...(doc.data() as UserProfile)
      }));
      setUsers(usersData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching users:", error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const filteredUsers = users.filter(u => 
    u.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.fullName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-6xl bg-[#0b0f1a] border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col h-[85vh]"
      >
        <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-500/20 rounded-2xl text-indigo-400">
              <Shield size={24} />
            </div>
            <div>
              <h3 className="text-2xl font-black tracking-tighter text-white uppercase italic">Central Intelligence</h3>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Sugd AI Admin Fleet Command</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-3 hover:bg-white/10 rounded-2xl text-slate-400 hover:text-white transition-all shadow-lg"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* User List Pane */}
          <div className="w-1/3 border-r border-white/5 flex flex-col bg-black/20">
            <div className="p-6 border-b border-white/5">
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Search agents..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-10 py-3 text-sm text-white focus:ring-2 ring-indigo-500/20 outline-none transition-all placeholder:text-slate-600"
                />
                <Users className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
              </div>
              <div className="mt-4 flex items-center justify-between px-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Active Units</span>
                <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-400 text-[10px] font-bold rounded-lg border border-indigo-500/20">{filteredUsers.length}</span>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
               {filteredUsers.map(u => (
                 <button
                    key={u.uid}
                    onClick={() => setSelectedUser(u)}
                    className={cn(
                      "w-full p-4 rounded-2xl text-left transition-all group relative overflow-hidden",
                      selectedUser?.uid === u.uid 
                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20" 
                        : "hover:bg-white/5 text-slate-400"
                    )}
                 >
                   <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs uppercase",
                        selectedUser?.uid === u.uid ? "bg-white/20" : "bg-white/5"
                      )}>
                        {u.username?.substring(0,2)}
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <div className="font-bold truncate group-hover:translate-x-1 transition-transform">{u.fullName || `@${u.username}`}</div>
                        <div className={cn("text-[10px] truncate", selectedUser?.uid === u.uid ? "text-white/60" : "text-slate-600")}>{u.email}</div>
                      </div>
                      {u.isAdmin && <Shield size={12} className={selectedUser?.uid === u.uid ? "text-white" : "text-indigo-400"} />}
                   </div>
                 </button>
               ))}
            </div>
          </div>

          {/* Details Pane */}
          <div className="flex-1 overflow-y-auto p-12 custom-scrollbar bg-black/10">
            {selectedUser ? (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                key={selectedUser.uid}
                className="max-w-2xl mx-auto space-y-10"
              >
                <div className="flex items-center gap-8">
                  <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-indigo-600 to-blue-400 flex items-center justify-center text-3xl font-black text-white shadow-2xl uppercase">
                     {selectedUser.username?.substring(0,2)}
                  </div>
                  <div>
                    <h2 className="text-4xl font-black tracking-tighter text-white uppercase italic">{selectedUser.fullName || selectedUser.username}</h2>
                    <p className="text-indigo-400 font-bold uppercase tracking-widest text-xs mt-2">UUID: {selectedUser.uid}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl space-y-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Deployment Date</span>
                    <p className="text-white font-bold">{selectedUser.createdAt?.toDate ? new Date(selectedUser.createdAt.toDate()).toLocaleString() : 'N/A'}</p>
                  </div>
                  <div className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl space-y-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Contact Protocol</span>
                    <p className="text-white font-bold">{selectedUser.email}</p>
                  </div>
                </div>

                <div className="space-y-6">
                   <h4 className="flex items-center gap-3 text-xs font-black uppercase tracking-[0.3em] text-indigo-500">
                     <Brain size={16} /> Neural Memory Access
                   </h4>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedUser.memory ? (
                        Object.entries(selectedUser.memory).map(([key, val]) => (
                          <div key={key} className="p-6 bg-white/[0.03] border border-white/10 rounded-2xl hover:bg-white/5 transition-colors">
                            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{key}</span>
                            <div className="text-white text-sm mt-1 font-medium">{Array.isArray(val) ? val.join(', ') || 'N/A' : (val as string) || 'N/A'}</div>
                          </div>
                        ))
                      ) : (
                        <div className="col-span-2 p-8 text-center bg-white/5 rounded-3xl border border-dashed border-white/10">
                          <p className="text-slate-500 text-sm italic">No neural memory initialized for this unit.</p>
                        </div>
                      )}
                   </div>
                </div>
              </motion.div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center opacity-20 scale-150">
                 <Logo className="grayscale mb-4" />
                 <p className="text-[10px] font-black uppercase tracking-[0.4em]">Select an active unit to proceed</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
