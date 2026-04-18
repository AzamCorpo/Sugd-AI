import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, writeBatch, collection, query, getDocs, orderBy, onSnapshot } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { toast } from 'sonner';

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export interface UserProfile {
  username: string;
  email: string;
  createdAt: any;
  isAdmin: boolean;
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
    toast.error("Вход не выполнен / Login failed");
    return null;
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
    return false;
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
