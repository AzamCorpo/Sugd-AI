import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, UserProfile } from './firebase';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  localGuest: boolean;
  setLocalGuest: (guest: boolean) => void;
}

const AuthContext = createContext<AuthContextType>({ 
  user: null, 
  profile: null, 
  loading: true, 
  refreshProfile: async () => {},
  localGuest: false,
  setLocalGuest: () => {}
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [localGuest, setLocalGuest] = useState(false);

  const fetchProfile = async (uid: string, currentUser?: User) => {
    try {
      const docSnap = await getDoc(doc(db, 'users', uid));
      if (docSnap.exists()) {
        const data = docSnap.data() as UserProfile;
        const currentEmail = currentUser?.email || user?.email;
        // Auto-promote developer to admin if not already
        if (currentEmail === 'azamashrapov2705@gmail.com' && !data.isAdmin) {
          const userRef = doc(db, 'users', uid);
          await setDoc(userRef, { isAdmin: true }, { merge: true });
          data.isAdmin = true;
        }
        setProfile(data);
      } else {
        setProfile(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await fetchProfile(currentUser.uid, currentUser);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.uid, user);
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, refreshProfile, localGuest, setLocalGuest }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
