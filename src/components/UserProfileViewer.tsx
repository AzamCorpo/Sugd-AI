import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { getDoc, doc, setDoc, deleteDoc, collection, query, getDocs, where, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../lib/AuthContext';
import { User, MessageSquare, UserPlus, UserMinus, X, Loader2, Link as LinkIcon } from 'lucide-react';
import { toast } from 'sonner';

export const UserProfileViewer = ({ 
  userId, 
  onClose,
  onOpenMessage
}: { 
  userId: string, 
  onClose: () => void,
  onOpenMessage: (chatId: string, profile: any) => void
}) => {
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [friendStatus, setFriendStatus] = useState<'none' | 'pending' | 'friends'>('none');

  useEffect(() => {
    if (!currentUser || !userId) {
      setLoading(false);
      return;
    }
    
    const loadData = async () => {
      try {
        const uDoc = await getDoc(doc(db, 'users', userId));
        if (uDoc.exists()) {
          setProfile(uDoc.data());
        }

        // check friend status
        const friendDoc = await getDoc(doc(db, 'users', currentUser.uid, 'friends', userId));
        if (friendDoc.exists()) {
          setFriendStatus('friends');
        } else {
          // check if we sent a request to them
          const reqDoc = await getDoc(doc(db, 'users', userId, 'friend_requests', currentUser.uid));
          if (reqDoc.exists()) {
            setFriendStatus('pending');
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [userId, currentUser]);

  const handleAddFriend = async () => {
    if (!currentUser) return;
    try {
      setFriendStatus('pending');
      await setDoc(doc(db, 'users', userId, 'friend_requests', currentUser.uid), {
        status: 'pending',
        createdAt: serverTimestamp()
      });
      toast.success("Friend request sent!");
    } catch (error) {
      console.error(error);
      setFriendStatus('none');
      toast.error("Failed to send request");
    }
  };

  const handleMessage = async () => {
    if (!currentUser || !profile) return;
    try {
      const sortedIds = [currentUser.uid, userId].sort();
      const chatId = `${sortedIds[0]}_${sortedIds[1]}`;
      
      const chatRef = doc(db, 'direct_messages', chatId);
      const chatDoc = await getDoc(chatRef);
      if (!chatDoc.exists()) {
        await setDoc(chatRef, {
          participants: [currentUser.uid, userId],
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
      onClose();
      onOpenMessage(chatId, { ...profile, uid: userId });
    } catch (error) {
      console.error(error);
      toast.error("Failed to open chat");
    }
  };

  if (!userId) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-sm bg-white dark:bg-[#0b0f1a] border border-black/10 dark:border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden glass-liquid"
      >
        <div className="p-4 flex items-center justify-end">
          <button onClick={onClose} className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-colors">
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-10">
            <Loader2 className="animate-spin text-indigo-500" />
          </div>
        ) : !profile ? (
          <div className="text-center py-10 text-slate-500">User not found</div>
        ) : (
          <div className="p-8 pt-0 flex flex-col items-center">
            {profile.photoUrl ? (
              <img src={profile.photoUrl} alt="avatar" className="w-24 h-24 rounded-3xl object-cover mb-4 shadow-xl shadow-indigo-500/20 border-2 border-indigo-500/30" />
            ) : (
              <div className="w-24 h-24 rounded-3xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 mb-4 shadow-inner">
                <User size={40} />
              </div>
            )}
            
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-1 tracking-tight">
              {profile.fullName || profile.username}
            </h3>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-6">
              @{profile.username}
            </p>

            {profile.bio && (
              <div className="w-full bg-black/5 dark:bg-white/5 rounded-2xl p-4 mb-6">
                <p className="text-sm text-slate-700 dark:text-slate-300 text-center italic">
                  "{profile.bio}"
                </p>
              </div>
            )}

            {profile.links && (
              <a href={profile.links} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-xs font-bold text-indigo-500 hover:text-indigo-600 transition-colors mb-6 uppercase tracking-widest bg-indigo-500/10 px-4 py-2 rounded-xl">
                <LinkIcon size={14} />
                {profile.links.replace(/^https?:\/\//, '')}
              </a>
            )}

            {currentUser?.uid !== userId && (
              <div className="flex w-full gap-3">
                <button
                  onClick={handleMessage}
                  className="flex-1 py-3 bg-indigo-600 text-white rounded-2xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/30"
                >
                  <MessageSquare size={16} /> Chat
                </button>

                {friendStatus === 'none' && (
                  <button
                    onClick={handleAddFriend}
                    className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-2xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                  >
                    <UserPlus size={16} /> Add Friend
                  </button>
                )}
                {friendStatus === 'pending' && (
                  <div className="flex-1 py-3 bg-amber-500/10 text-amber-600 rounded-2xl font-bold text-xs uppercase tracking-widest flex items-center justify-center">
                    Pending
                  </div>
                )}
                {friendStatus === 'friends' && (
                  <div className="flex-1 py-3 bg-emerald-500/10 text-emerald-600 rounded-2xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2">
                    <User size={16} /> Friends
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
};
