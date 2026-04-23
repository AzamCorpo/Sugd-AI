import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '../lib/AuthContext';
import { loginWithGoogle, loginWithApple, loginAsGuest, checkUsernameAvailable, createUserProfile, logout } from '../lib/firebase';
import { Logo } from './Logo';
import { toast } from 'sonner';

export const LoginScreen = () => {
  const [loading, setLoading] = useState(false);
  const { refreshProfile } = useAuth();

  const handleGoogleLogin = async () => {
    setLoading(true);
    await loginWithGoogle();
    setLoading(false);
  };

  const handleAppleLogin = async () => {
    setLoading(true);
    await loginWithApple();
    setLoading(false);
  };

  const handleGuestLogin = async () => {
    setLoading(true);
    await loginAsGuest();
    await refreshProfile();
    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-transparent text-slate-200 p-4 relative overflow-hidden">
      {/* Background blobs for Auth screens since they are outside MainApp */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 opacity-40">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-indigo-500/20 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-purple-500/20 blur-[120px] rounded-full animate-pulse" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md p-8 glass-liquid border border-white/10 rounded-3xl shadow-2xl text-center relative z-10"
      >
        <Logo className="mx-auto mb-8 scale-110" />
        <h2 className="text-2xl font-bold mb-2">Хуш омадед / Welcome</h2>
        <p className="text-slate-400 mb-8 text-sm">Sign in to access the next generation AI</p>
        
        <div className="flex flex-col gap-3">
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full py-3 px-4 bg-white text-black font-bold rounded-xl flex items-center justify-center gap-3 hover:bg-slate-200 transition-colors disabled:opacity-50"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-slate-400 border-t-black rounded-full animate-spin" />
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                <span>Continue with Google</span>
              </>
            )}
          </button>
          
          <button
            onClick={handleAppleLogin}
            disabled={loading}
            className="w-full py-3 px-4 bg-black border border-white/20 text-white font-bold rounded-xl flex items-center justify-center gap-3 hover:bg-[#1a1a1a] transition-colors disabled:opacity-50"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <svg className="w-5 h-5 pb-0.5" viewBox="0 0 384 512" fill="currentColor">
                  <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/>
                </svg>
                <span>Continue with Apple</span>
              </>
            )}
          </button>
          
          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-white/10"></div>
            <span className="flex-shrink-0 mx-4 text-slate-500 text-xs uppercase tracking-widest">or</span>
            <div className="flex-grow border-t border-white/10"></div>
          </div>
          
          <button
            onClick={handleGuestLogin}
            disabled={loading}
            className="w-full py-3 px-4 bg-transparent border border-white/20 text-white font-bold rounded-xl flex items-center justify-center gap-3 hover:bg-white/5 transition-colors disabled:opacity-50"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <span>Continue as Guest</span>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export const SetupProfileScreen = () => {
  const { user, refreshProfile } = useAuth();
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    const formatted = username.trim().toLowerCase();
    if (formatted.length < 3 || formatted.length > 20) {
      toast.error('Username must be 3-20 characters');
      return;
    }
    if (!/^[a-z0-9_]+$/.test(formatted)) {
      toast.error('Only letters, numbers, and underscores allowed');
      return;
    }

    setLoading(true);
    const available = await checkUsernameAvailable(formatted);
    if (!available) {
      toast.error('Username is already taken');
      setLoading(false);
      return;
    }

    try {
      const isInitialAdmin = user.email === 'azamashrapov2705@gmail.com';
      await createUserProfile(user.uid, user.email || '', formatted, isInitialAdmin);
      await refreshProfile();
      toast.success('Профиль успешно создан! / Profile created!');
    } catch (error) {
      toast.error('Error creating profile');
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-transparent text-slate-200 p-4 relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 opacity-40">
        <div className="absolute top-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-indigo-500/20 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-purple-500/20 blur-[120px] rounded-full animate-pulse" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md p-8 glass-liquid border border-white/10 rounded-3xl shadow-2xl relative z-10"
      >
        <h2 className="text-2xl font-bold mb-2 text-center">Создайте профиль / Set up profile</h2>
        <p className="text-slate-400 mb-6 text-sm text-center">Choose a unique username</p>
        
        <form onSubmit={handleSetup} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1 mb-2 block">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. azam_27"
              className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-4 py-3 text-slate-200 outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !username.trim()}
            className="w-full py-3 px-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 flex justify-center items-center h-12"
          >
            {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Continue'}
          </button>
        </form>

        <button onClick={logout} className="mt-6 text-sm text-slate-500 hover:text-white w-full text-center">
          Cancel and Logout
        </button>
      </motion.div>
    </div>
  );
};
