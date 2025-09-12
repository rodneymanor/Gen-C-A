import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import type { User } from '../types';

// Define authentication context types
interface AuthContextType {
  currentUser: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserProfile: (displayName: string) => Promise<void>;
  sendVerificationEmail: () => Promise<void>;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Auth provider component
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Create or get user profile from Firestore
  const createUserProfile = async (firebaseUser: FirebaseUser): Promise<User> => {
    const userRef = doc(db, 'users', firebaseUser.uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      // User exists in Firestore, return existing profile
      return {
        id: firebaseUser.uid,
        email: firebaseUser.email!,
        name: firebaseUser.displayName || 'User',
        avatar: firebaseUser.photoURL || '',
        ...userSnap.data()
      } as User;
    } else {
      // Create new user profile in Firestore
      const newUser: User = {
        id: firebaseUser.uid,
        name: firebaseUser.displayName || 'User',
        email: firebaseUser.email!,
        avatar: firebaseUser.photoURL || '',
        role: 'creator',
        plan: 'free',
        preferences: {
          theme: 'light',
          language: 'en',
          notifications: {
            email: true,
            push: true,
            inApp: true,
            frequency: 'immediate'
          },
          accessibility: {
            reducedMotion: false,
            highContrast: false,
            fontSize: 'medium',
            screenReaderOptimized: false
          }
        }
      };

      await setDoc(userRef, {
        ...newUser,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      return newUser;
    }
  };

  // Login with email and password
  const login = async (email: string, password: string): Promise<void> => {
    try {
      setLoading(true);
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  // Register with email and password
  const register = async (email: string, password: string, name: string): Promise<void> => {
    try {
      setLoading(true);
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update the user's display name
      await updateProfile(user, {
        displayName: name
      });

      // Send email verification
      await sendEmailVerification(user);
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  // Login with Google
  const loginWithGoogle = async (): Promise<void> => {
    try {
      setLoading(true);
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Google login error:', error);
      throw error;
    }
  };

  // Logout
  const logout = async (): Promise<void> => {
    try {
      await signOut(auth);
      setCurrentUser(null);
      setFirebaseUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  // Reset password
  const resetPassword = async (email: string): Promise<void> => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      console.error('Password reset error:', error);
      throw error;
    }
  };

  // Update user profile
  const updateUserProfile = async (displayName: string): Promise<void> => {
    try {
      if (firebaseUser) {
        await updateProfile(firebaseUser, { displayName });
        
        // Update in Firestore as well
        const userRef = doc(db, 'users', firebaseUser.uid);
        await setDoc(userRef, {
          name: displayName,
          updatedAt: serverTimestamp()
        }, { merge: true });

        // Update local state
        if (currentUser) {
          setCurrentUser(prev => prev ? { ...prev, name: displayName } : null);
        }
      }
    } catch (error) {
      console.error('Profile update error:', error);
      throw error;
    }
  };

  // Send email verification
  const sendVerificationEmail = async (): Promise<void> => {
    try {
      if (firebaseUser) {
        await sendEmailVerification(firebaseUser);
      }
    } catch (error) {
      console.error('Email verification error:', error);
      throw error;
    }
  };

  // Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          // User is signed in
          setFirebaseUser(firebaseUser);
          const userProfile = await createUserProfile(firebaseUser);
          setCurrentUser(userProfile);
        } else {
          // User is signed out
          setFirebaseUser(null);
          setCurrentUser(null);
        }
      } catch (error) {
        console.error('Auth state change error:', error);
        setFirebaseUser(null);
        setCurrentUser(null);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const value: AuthContextType = {
    currentUser,
    firebaseUser,
    loading,
    login,
    register,
    loginWithGoogle,
    logout,
    resetPassword,
    updateUserProfile,
    sendVerificationEmail
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;