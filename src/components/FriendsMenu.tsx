import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, query, getDocs, doc, getDoc, updateDoc, deleteDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../lib/AuthContext';
import { X, User, MessageSquare, Check, X as XIcon, Loader2 } from 'lucide-react';

export const FriendsMenu = ({ 
  onClose,
  onOpenMessage,
  onOpenProfile
}: { 
  onClose: () => void,
  onOpenMessage: (chatId: string, profile: any) => void,
  onOpenProfile: (userId: string) => void
}) => {
  const { user: currentUser } = useAuth();
  const [friends, setFriends] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;

    const loadFriendsData = async () => {
      try {
        // Load Friends
        const fSnap = await getDocs(collection(db, 'users', currentUser.uid, 'friends'));
        const fData: any[] = [];
        for (const f of fSnap.docs) {
          const uDoc = await getDoc(doc(db, 'users', f.id));
          if (uDoc.exists()) {
            fData.push({ id: f.id, ...uDoc.data() });
          }
        }
        setFriends(fData);

        // Load Friend Requests
        const rSnap = await getDocs(collection(db, 'users', currentUser.uid, 'friend_requests'));
        const rData: any[] = [];
        for (const req of rSnap.docs) {
          const uDoc = await getDoc(doc(db, 'users', req.id));
          if (uDoc.exists()) {
            rData.push({ id: req.id, ...uDoc.data() });
          }
        }
        setRequests(rData);

      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadFriendsData();
  }, [currentUser]);

  const handleAcceptRequest = async (requesterId: string) => {
    if (!currentUser) return;
    try {
      // Add friend to my friends list
      await setDoc(doc(db, 'users', currentUser.uid, 'friends', requesterId), { active: true });
      // Add me to requester's friends list
      await setDoc(doc(db, 'users', requesterId, 'friends', currentUser.uid), { active: true });
      // Remove request
      await deleteDoc(doc(db, 'users', currentUser.uid, 'friend_requests', requesterId));

      setRequests(prev => prev.filter(req => req.id !== requesterId));
      
      // refresh friends
      const uDoc = await getDoc(doc(db, 'users', requesterId));
      if (uDoc.exists()) {
        setFriends(prev => [...prev, { id: requesterId, ...uDoc.data() }]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeclineRequest = async (requesterId: string) => {
    if (!currentUser) return;
    try {
      await deleteDoc(doc(db, 'users', currentUser.uid, 'friend_requests', requesterId));
      setRequests(prev => prev.filter(req => req.id !== requesterId));
    } catch (e) {
      console.error(e);
    }
  };

  const openVipMessage = async (fId: string, fProfile: any) => {
    if (!currentUser) return;
    const sortedIds = [currentUser.uid, fId].sort();
    const chatId = `${sortedIds[0]}_${sortedIds[1]}`;
      
    const chatRef = doc(db, 'direct_messages', chatId);
    const chatDoc = await getDoc(chatRef);
    if (!chatDoc.exists()) {
      await setDoc(chatRef, {
        participants: [currentUser.uid, fId],
      });
    }
    onClose();
    onOpenMessage(chatId, fProfile);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md bg-white dark:bg-[#0b0f1a] border border-black/10 dark:border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden glass-liquid"
      >
        <div className="p-6 border-b border-black/5 dark:border-white/5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold dark:text-white flex items-center gap-2">
              <User size={20} className="text-indigo-500" />
              Friends & DMs
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-colors">
              <X size={20} className="text-slate-500" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-8 max-h-[60vh] overflow-y-auto">
          {loading ? (
             <div className="flex justify-center py-4"><Loader2 className="animate-spin text-indigo-500" /></div>
          ) : (
            <>
              {requests.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Friend Requests</h3>
                  <div className="space-y-3">
                    {requests.map(req => (
                      <div key={req.id} className="flex items-center justify-between bg-black/5 dark:bg-white/5 p-3 rounded-2xl">
                        <div className="flex items-center gap-3 cursor-pointer" onClick={() => { onClose(); onOpenProfile(req.id); }}>
                          {req.photoUrl ? (
                            <img src={req.photoUrl} alt="" className="w-10 h-10 rounded-xl object-cover" />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-500 flex items-center justify-center">
                              <User size={16} />
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-bold dark:text-white">{req.fullName || req.username}</p>
                            <p className="text-[10px] text-slate-500 uppercase">@{req.username}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => handleAcceptRequest(req.id)} className="p-2 bg-emerald-500/20 text-emerald-600 hover:bg-emerald-500/30 rounded-xl transition-colors">
                            <Check size={16} />
                          </button>
                          <button onClick={() => handleDeclineRequest(req.id)} className="p-2 bg-red-500/20 text-red-600 hover:bg-red-500/30 rounded-xl transition-colors">
                            <XIcon size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">My Friends</h3>
                {friends.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-4">No friends yet.</p>
                ) : (
                  <div className="space-y-3">
                    {friends.map(friend => (
                      <div key={friend.id} className="flex flex-col sm:flex-row sm:items-center justify-between bg-black/5 dark:bg-white/5 p-3 rounded-2xl gap-3">
                        <div className="flex items-center gap-3 cursor-pointer" onClick={() => { onClose(); onOpenProfile(friend.id); }}>
                          {friend.photoUrl ? (
                            <img src={friend.photoUrl} alt="" className="w-10 h-10 rounded-xl object-cover" />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-500 flex items-center justify-center">
                              <User size={16} />
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-bold dark:text-white">{friend.fullName || friend.username}</p>
                            <p className="text-[10px] text-slate-500 uppercase">@{friend.username}</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => openVipMessage(friend.id, friend)}
                          className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-indigo-700 transition"
                        >
                          <MessageSquare size={14} /> Message
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
};
