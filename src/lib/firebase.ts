import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, OAuthProvider, signInWithPopup, signInAnonymously, signOut } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, writeBatch, collection, query, getDocs, orderBy, onSnapshot } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { toast } from 'sonner';

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const appleProvider = new OAuthProvider('apple.com');

export interface UserMemory {
  name?: string;
  age?: string;
  city?: string;
  profession?: string;
  interests?: string[];
  goals?: string[];
}

export interface UserProfile {
  username: string;
  email: string;
  createdAt: any;
  isAdmin: boolean;
  fullName?: string;
  photoUrl?: string;
  bio?: string;
  links?: string;
  memory?: UserMemory;
}

export const checkConnection = async () => {
  try {
    await getDoc(doc(db, 'test', 'connection'));
  } catch (error: any) {
    if (error.message && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
};
checkConnection();

export const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    console.error("Login failed:", error);
    if (error.code === 'auth/popup-blocked') {
      toast.error("Всплывающее окно заблокировано. Пожалуйста, разрешите всплывающие окна для работы входа.");
    } else {
      toast.error("Ошибка входа Google: " + error.message);
    }
    return null;
  }
};

export const loginWithApple = async () => {
  try {
    const result = await signInWithPopup(auth, appleProvider);
    return result.user;
  } catch (error: any) {
    console.error("Apple login failed:", error);
    toast.error("Ошибка входа Apple: " + error.message);
    return null;
  }
};

export const loginAsGuest = async () => {
  try {
    const result = await signInAnonymously(auth);
    if (result.user) {
      // Small delay to ensure DB is ready if needed
      await new Promise(r => setTimeout(r, 500));
      // Check if profile exists already
      const docSnap = await getDoc(doc(db, 'users', result.user.uid));
      if (!docSnap.exists()) {
        const guestName = `guest_${Math.random().toString(36).substring(2, 9)}`;
        await createUserProfile(result.user.uid, 'guest@sugd.ai', guestName, false);
      }
    }
    return result.user;
  } catch (error: any) {
    console.error("Guest login failed:", error);
    if (error.code !== 'auth/operation-not-allowed') {
      toast.error("Ошибка гостевого входа: " + error.message);
    }
    return null;
  }
};

export const updateUserMemory = async (userId: string, memory: UserMemory) => {
  try {
    await setDoc(doc(db, 'users', userId), { memory }, { merge: true });
  } catch (error) {
    console.error("Error updating user memory:", error);
  }
};

export const logout = async () => {
  await signOut(auth);
};

export const checkUsernameAvailable = async (username: string): Promise<boolean> => {
  try {
    const usernameDoc = await getDoc(doc(db, 'usernames', username.toLowerCase()));
    return !usernameDoc.exists();
  } catch (error) {
    console.error("Error checking username:", error);
    // Be permissive if security rules or network fails, let backend handle actual dupe on write
    return true; 
  }
};

export const createUserProfile = async (uid: string, email: string, username: string, isAdmin: boolean = false) => {
  try {
    const batch = writeBatch(db);
    const userRef = doc(db, 'users', uid);
    const usernameRef = doc(db, 'usernames', username.toLowerCase());

    batch.set(userRef, {
      username: username.toLowerCase(),
      email: email,
      createdAt: new Date(),
      isAdmin: isAdmin
    });

    batch.set(usernameRef, {
      userId: uid
    });

    await batch.commit();
    return true;
  } catch (error: any) {
    console.error("Failed to create profile:", error);
    throw error;
  }
};

export const updateUserProfileInDB = async (uid: string, data: Partial<UserProfile>) => {
  try {
    const userRef = doc(db, 'users', uid);
    
    // If updating username, also update the usernames collection for uniqueness
    if (data.username) {
      const batch = writeBatch(db);
      const snapshot = await getDoc(userRef);
      const oldUsername = snapshot.data()?.username;
      
      if (oldUsername && oldUsername !== data.username.toLowerCase()) {
        const oldRef = doc(db, 'usernames', oldUsername.toLowerCase());
        const newRef = doc(db, 'usernames', data.username.toLowerCase());
        
        // Check if new is available
        const checkNew = await getDoc(newRef);
        if (checkNew.exists()) throw new Error("Username already taken");
        
        batch.delete(oldRef);
        batch.set(newRef, { userId: uid });
      } else if (!oldUsername) {
        batch.set(doc(db, 'usernames', data.username.toLowerCase()), { userId: uid });
      }
      
      batch.set(userRef, data, { merge: true });
      await batch.commit();
    } else {
      await setDoc(userRef, data, { merge: true });
    }
    
    return true;
  } catch (error: any) {
    console.error("Failed to update profile", error);
    toast.error(error.message || "Ошибка при сохранении профиля");
    return false;
  }
};

export const saveUserChatsToDB = async (uid: string, chats: any[]) => {
  try {
    // Sanitize data to remove undefined values which Firestore doesn't support
    const sanitizedChats = JSON.parse(JSON.stringify(chats, (key, value) => {
      if (value === undefined) return null;
      return value;
    }));
    await setDoc(doc(db, 'users', uid, 'data', 'chats'), { chats: sanitizedChats });
  } catch (err) {
    console.error("Error saving chats to DB", err);
  }
};

export const loadUserChatsFromDB = async (uid: string) => {
  try {
    const chatDoc = await getDoc(doc(db, 'users', uid, 'data', 'chats'));
    if (chatDoc.exists()) {
      return chatDoc.data().chats || [];
    }
  } catch (err) {
    console.error("Error loading chats from DB", err);
  }
  return [];
};
