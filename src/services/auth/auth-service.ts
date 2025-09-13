import { 
  getAuth, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  User as FirebaseSDKUser,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { AuthUser, FirebaseUser, SessionInfo, AuthError, AuthConfig, AuthStateChangeEvent } from './types';

/**
 * Core authentication service that handles Firebase authentication
 * and user profile management. This service is extracted from the source
 * application and made compatible with the integration guide patterns.
 */
export class AuthService {
  private auth;
  private db;
  private config: AuthConfig;
  private listeners: ((event: AuthStateChangeEvent) => void)[] = [];

  constructor(firebaseApp: any, firestore: any, config: AuthConfig = {}) {
    this.auth = getAuth(firebaseApp);
    this.db = firestore;
    this.config = {
      enableLogging: false,
      sessionTimeout: 7 * 24 * 60 * 60 * 1000, // 7 days
      autoRefresh: true,
      persistSession: true,
      ...config
    };

    // Set up auth state listener
    onAuthStateChanged(this.auth, (firebaseUser) => {
      const event: AuthStateChangeEvent = {
        type: firebaseUser ? 'signIn' : 'signOut',
        user: null, // Will be populated by the bridge
        timestamp: new Date()
      };
      this.notifyListeners(event);
    });
  }

  async initialize(): Promise<void> {
    if (this.config.enableLogging) {
      console.log('AuthService initializing...');
    }
    // Additional initialization if needed
  }

  async dispose(): Promise<void> {
    this.listeners = [];
  }

  /**
   * Authenticate user with email and password
   */
  async signInWithEmailAndPassword(email: string, password: string): Promise<FirebaseUser> {
    try {
      const result = await signInWithEmailAndPassword(this.auth, email, password);
      return this.adaptFirebaseUser(result.user);
    } catch (error: any) {
      throw this.createAuthError(error, 'Failed to sign in with email and password');
    }
  }

  /**
   * Create new user account with email and password
   */
  async createUserWithEmailAndPassword(email: string, password: string, displayName: string): Promise<FirebaseUser> {
    try {
      const result = await createUserWithEmailAndPassword(this.auth, email, password);
      
      // Update the user's display name
      await updateProfile(result.user, { displayName });
      
      // Send email verification
      await sendEmailVerification(result.user);
      
      return this.adaptFirebaseUser(result.user);
    } catch (error: any) {
      throw this.createAuthError(error, 'Failed to create user account');
    }
  }

  /**
   * Sign in with Google OAuth
   */
  async signInWithGoogle(): Promise<FirebaseUser> {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(this.auth, provider);
      return this.adaptFirebaseUser(result.user);
    } catch (error: any) {
      throw this.createAuthError(error, 'Failed to sign in with Google');
    }
  }

  /**
   * Sign out current user
   */
  async signOut(): Promise<void> {
    try {
      await firebaseSignOut(this.auth);
    } catch (error: any) {
      throw this.createAuthError(error, 'Failed to sign out');
    }
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(this.auth, email);
    } catch (error: any) {
      throw this.createAuthError(error, 'Failed to send password reset email');
    }
  }

  /**
   * Send email verification to current user
   */
  async sendEmailVerification(): Promise<void> {
    try {
      const user = this.auth.currentUser;
      if (!user) {
        throw new Error('No authenticated user found');
      }
      await sendEmailVerification(user);
    } catch (error: any) {
      throw this.createAuthError(error, 'Failed to send email verification');
    }
  }

  /**
   * Update user profile display name
   */
  async updateUserProfile(displayName: string): Promise<void> {
    try {
      const user = this.auth.currentUser;
      if (!user) {
        throw new Error('No authenticated user found');
      }
      
      await updateProfile(user, { displayName });
      
      // Update in Firestore as well
      const userRef = doc(this.db, 'users', user.uid);
      await setDoc(userRef, {
        name: displayName,
        updatedAt: serverTimestamp()
      }, { merge: true });
      
    } catch (error: any) {
      throw this.createAuthError(error, 'Failed to update user profile');
    }
  }

  /**
   * Get current Firebase user
   */
  getCurrentUser(): FirebaseUser | null {
    const user = this.auth.currentUser;
    return user ? this.adaptFirebaseUser(user) : null;
  }

  /**
   * Validate Firebase ID token
   */
  async validateToken(token: string): Promise<any> {
    // Note: This would typically use Firebase Admin SDK for server-side validation
    // For client-side, we rely on Firebase Auth state
    const user = this.auth.currentUser;
    if (!user) {
      throw this.createAuthError(new Error('No authenticated user'), 'Token validation failed');
    }
    
    const currentToken = await user.getIdToken();
    if (token !== currentToken) {
      throw this.createAuthError(new Error('Token mismatch'), 'Invalid token');
    }
    
    return {
      uid: user.uid,
      email: user.email,
      email_verified: user.emailVerified
    };
  }

  /**
   * Create or get user profile from Firestore
   */
  async getOrCreateUserProfile(firebaseUser: FirebaseUser): Promise<AuthUser> {
    const userRef = doc(this.db, 'users', firebaseUser.uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      // User exists in Firestore, return existing profile
      const userData = userSnap.data();
      return {
        id: firebaseUser.uid,
        email: firebaseUser.email || '',
        name: firebaseUser.displayName || 'User',
        avatar: firebaseUser.photoURL || '',
        emailVerified: firebaseUser.emailVerified,
        ...userData
      } as AuthUser;
    } else {
      // Create new user profile in Firestore
      const newUser: AuthUser = {
        id: firebaseUser.uid,
        name: firebaseUser.displayName || 'User',
        email: firebaseUser.email || '',
        avatar: firebaseUser.photoURL || '',
        role: 'creator',
        plan: 'free',
        emailVerified: firebaseUser.emailVerified,
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
  }

  /**
   * Add auth state change listener
   */
  onAuthStateChanged(callback: (event: AuthStateChangeEvent) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  private notifyListeners(event: AuthStateChangeEvent): void {
    this.listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        if (this.config.enableLogging) {
          console.error('Error in auth state listener:', error);
        }
      }
    });
  }

  private adaptFirebaseUser(firebaseUser: FirebaseSDKUser): FirebaseUser {
    return {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      displayName: firebaseUser.displayName,
      photoURL: firebaseUser.photoURL,
      emailVerified: firebaseUser.emailVerified,
      getIdToken: (forceRefresh?: boolean) => firebaseUser.getIdToken(forceRefresh)
    };
  }

  private createAuthError(originalError: any, message: string): AuthError {
    const error = new Error(message) as AuthError;
    error.code = originalError?.code || 'unknown';
    error.type = 'auth';
    error.cause = originalError;
    return error;
  }
}

/**
 * Factory function to create AuthService with Firebase app and Firestore
 */
export function createAuthService(firebaseApp: any, firestore: any, config?: AuthConfig): AuthService {
  return new AuthService(firebaseApp, firestore, config);
}

/**
 * Factory function to create AuthService from environment variables
 * This would be used when Firebase is already configured in the app
 */
export function createAuthServiceFromEnv(config?: AuthConfig): AuthService {
  // This would need to import the Firebase configuration from the target app
  // For now, we'll return null and implement this in the integration step
  throw new Error('createAuthServiceFromEnv should be implemented during integration with target app Firebase config');
}