import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot, getDocs } from 'firebase/firestore';
import { db, UserProfile } from '../lib/firebase';
import { Users, X, Shield, Clock } from 'lucide-react';

export const AdminDashboard = ({ onClose }: { onClose: () => void }) => {
  const [users, setUsers] = useState<(UserProfile & { uid: string })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Note: since the prompt mentioned we don't necessarily want realtime snapshot 
    // unless auth is ready and user is authenticated and is admin, this is fine because
    // we only render this if isAdmin == true.
    const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    
    // We can use getDocs to avoid lingering onSnapshot listeners, or onSnapshot for real-time.
    // Realtime is better for seeing "all new users".
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

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-[#0b0f1a] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
          <h3 className="text-xl font-bold flex items-center gap-3 text-white">
            <Shield className="text-indigo-400" />
            Admin Dashboard
          </h3>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
          {loading ? (
            <div className="flex justify-center p-8">
              <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-6">
                <Users className="text-slate-400" size={18} />
                <span className="text-slate-300 font-medium">Total Users: {users.length}</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {users.map(u => (
                  <div key={u.uid} className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl flex flex-col gap-2 relative group hover:border-indigo-500/30 transition-colors">
                    {u.isAdmin && (
                      <div className="absolute top-4 right-4 bg-indigo-500/20 text-indigo-400 text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-md flex items-center gap-1">
                        <Shield size={10} /> Admin
                      </div>
                    )}
                    <h4 className="font-bold text-white text-lg">@{u.username}</h4>
                    <span className="text-sm text-slate-400">{u.email}</span>
                    <div className="flex items-center gap-1 text-[10px] text-slate-500 mt-2 uppercase tracking-wider font-bold">
                      <Clock size={12} />
                      {u.createdAt?.toDate ? new Date(u.createdAt.toDate()).toLocaleString() : 'Just now'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
