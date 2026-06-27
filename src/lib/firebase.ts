import { initializeApp } from 'firebase/app';
import { 
  initializeAuth, 
  browserLocalPersistence,
  browserPopupRedirectResolver,
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail
} from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import firebaseConfigDefault from '@/firebase-applet-config.json';

const env = (import.meta as any).env || {};

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || firebaseConfigDefault?.apiKey,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfigDefault?.authDomain,
  projectId: env.VITE_FIREBASE_PROJECT_ID || firebaseConfigDefault?.projectId,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfigDefault?.storageBucket,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfigDefault?.messagingSenderId,
  appId: env.VITE_FIREBASE_APP_ID || firebaseConfigDefault?.appId,
  firestoreDatabaseId: env.VITE_FIREBASE_DATABASE_ID || firebaseConfigDefault?.firestoreDatabaseId || "ai-studio-f1b0d3da-4d24-494d-b046-921ccc9fe074"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = initializeAuth(app, {
  persistence: browserLocalPersistence,
  popupRedirectResolver: browserPopupRedirectResolver,
});
export const googleProvider = new GoogleAuthProvider();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const logout = () => signOut(auth);

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const userDoc = doc(db, 'users', result.user.uid);
    let snapshot;
    
    try {
      snapshot = await getDoc(userDoc);
    } catch (e) {
      handleFirestoreError(e, OperationType.GET, `users/${result.user.uid}`);
    }
    
    if (!snapshot?.exists()) {
      try {
        await setDoc(userDoc, {
          uid: result.user.uid,
          displayName: result.user.displayName || 'Farmer',
          email: result.user.email,
          role: 'farmer',
          createdAt: serverTimestamp(),
          phoneNumber: result.user.phoneNumber || '',
          location: '',
          photoURL: result.user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${result.user.uid}`
        });
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, `users/${result.user.uid}`);
      }
    }
    return result.user;
  } catch (error: any) {
    throw error;
  }
};

export const registerUser = async (email: string, pass: string, name: string, role: string) => {
  const result = await createUserWithEmailAndPassword(auth, email, pass);
  await updateProfile(result.user, { displayName: name });
  
  // Initialize Firestore Profile
  try {
    await setDoc(doc(db, 'users', result.user.uid), {
      uid: result.user.uid,
      displayName: name,
      email,
      role,
      createdAt: serverTimestamp(),
      phoneNumber: '',
      location: '',
      photoURL: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`
    });
  } catch (e) {
    handleFirestoreError(e, OperationType.WRITE, `users/${result.user.uid}`);
  }
  
  return result.user;
};

export const loginWithEmail = (email: string, pass: string) => signInWithEmailAndPassword(auth, email, pass);

export const resetPassword = (email: string) => sendPasswordResetEmail(auth, email);
