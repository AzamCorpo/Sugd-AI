import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, User, Mail, Link as LinkIcon, Edit3, Check, AtSign } from 'lucide-react';
import { UserProfile, updateUserProfileInDB } from '../lib/firebase';
import { toast } from 'sonner';

interface ProfileEditorProps {
  uid: string;
  profile: UserProfile;
  onClose: () => void;
  onUpdate: () => void;
  t: any;
}

export const ProfileEditor = ({ uid, profile, onClose, onUpdate, t }: ProfileEditorProps) => {
  const [formData, setFormData] = useState({
    username: profile.username || '',
    fullName: profile.fullName || '',
    bio: profile.bio || '',
    links: profile.links || ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Validate username if changed
    if (formData.username.toLowerCase() !== profile.username) {
      if (formData.username.length < 3) {
        toast.error("Username too short");
        setLoading(false);
        return;
      }
    }

    const success = await updateUserProfileInDB(uid, formData);
    if (success) {
      toast.success("Profile updated successfully!");
      onUpdate();
      onClose();
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-lg bg-white dark:bg-[#0b0f1a] border border-black/10 dark:border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden shadow-indigo-500/10"
      >
        <div className="p-8 border-b border-black/5 dark:border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-500">
              <Edit3 size={24} />
            </div>
            <div>
              <h3 className="text-2xl font-black tracking-tighter uppercase italic text-slate-900 dark:text-white">Edit Profile</h3>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5 italic">Customize your Sugd identity</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-colors text-slate-400"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2 block pl-1">Unique Username</label>
              <div className="relative group">
                <AtSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={16} />
                <input 
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '')})}
                  className="w-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 ring-indigo-500/20 transition-all"
                  placeholder="username"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2 block pl-1">Display Name</label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={16} />
                <input 
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                  className="w-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 ring-indigo-500/20 transition-all"
                  placeholder="Full Name"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2 block pl-1">Bio / Status</label>
              <textarea 
                value={formData.bio}
                onChange={(e) => setFormData({...formData, bio: e.target.value})}
                className="w-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-2xl py-4 px-4 text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 ring-indigo-500/20 transition-all min-h-[100px] resize-none"
                placeholder="Tell us about yourself..."
              />
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2 block pl-1">Links</label>
              <div className="relative group">
                <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={16} />
                <input 
                  type="text"
                  value={formData.links}
                  onChange={(e) => setFormData({...formData, links: e.target.value})}
                  className="w-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 ring-indigo-500/20 transition-all"
                  placeholder="https://yourlink.com"
                />
              </div>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full py-5 bg-indigo-600 text-white rounded-[1.8rem] font-black uppercase tracking-[0.3em] shadow-xl shadow-indigo-600/30 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Check size={20} className="group-hover:scale-125 transition-transform" />
                Save Intelligence Profile
              </>
            )}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
};
