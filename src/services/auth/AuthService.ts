/**
 * Standalone Firebase Authentication Service
 * Extracted from React application for standalone use
 * No React dependencies - pure TypeScript service
 */

import { initializeApp, getApps, cert, ServiceAccount } from "firebase-admin/app";
import { getAuth, Auth } from "firebase-admin/auth";
import { getFirestore, Firestore } from "firebase-admin/firestore";

export interface AuthConfig {
  projectId: string;
  privateKey: string;
  clientEmail: string;
}

export interface FirebaseUser {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  emailVerified: boolean;
  customClaims?: Record<string, any>;
}

export interface AuthResult {
  user: FirebaseUser;
  token: string;
}

export interface AuthError {
  code: string;
  message: string;
  status: number;
}

export interface TokenValidationResult {
  valid: boolean;
  user?: FirebaseUser;
  error?: AuthError;
}

export interface UserProfileUpdate {
  displayName?: string;
  email?: string;
  photoURL?: string;
  emailVerified?: boolean;
}

export class AuthService {
  private adminApp: any;
  private adminDb: Firestore | null = null;
  private adminAuth: Auth | null = null;
  private initialized = false;
  private config: AuthConfig;

  constructor(config: AuthConfig) {
    this.config = config;
  }

  /**
   * Initialize Firebase Admin SDK
   */
  async initialize(): Promise<void> {
    try {
      if (this.initialized) {
        return;
      }

      // Validate configuration
      if (!this.config.projectId || !this.config.privateKey || !this.config.clientEmail) {
        throw new Error("Missing required Firebase configuration");
      }

      // Initialize Admin SDK if not already initialized
      if (getApps().length === 0) {
        const serviceAccount: ServiceAccount = {
          projectId: this.config.projectId,
          privateKey: this.config.privateKey.replace(/\\n/g, "\n"),
          clientEmail: this.config.clientEmail,
        };

        this.adminApp = initializeApp({
          credential: cert(serviceAccount),
          projectId: this.config.projectId,
        });
      } else {
        this.adminApp = getApps()[0];
      }

      this.adminDb = getFirestore(this.adminApp);
      this.adminAuth = getAuth(this.adminApp);

      // Configure Firestore settings
      this.adminDb.settings({ ignoreUndefinedProperties: true });

      this.initialized = true;
      console.log("✅ Firebase Auth Service initialized successfully");
    } catch (error) {
      console.error("❌ Failed to initialize Firebase Auth Service:", error);
      throw error;
    }
  }

  /**
   * Check if service is initialized
   */
  isInitialized(): boolean {
    return this.initialized && !!(this.adminDb && this.adminAuth);
  }

  /**
   * Validate Firebase JWT token
   */
  async validateToken(token: string): Promise<TokenValidationResult> {
    if (!this.isInitialized()) {
      return {
        valid: false,
        error: {
          code: "auth/service-not-initialized",
          message: "Auth service not initialized",
          status: 500
        }
      };
    }

    try {
      const decodedToken = await this.adminAuth!.verifyIdToken(token);
      
      const user: FirebaseUser = {
        uid: decodedToken.uid,
        email: decodedToken.email || "",
        displayName: decodedToken.name,
        photoURL: decodedToken.picture,
        emailVerified: decodedToken.email_verified || false,
        customClaims: decodedToken,
      };

      return { valid: true, user };
    } catch (error) {
      console.error("❌ Token validation failed:", error);
      return {
        valid: false,
        error: {
          code: "auth/invalid-token",
          message: "Invalid or expired token",
          status: 401
        }
      };
    }
  }

  /**
   * Get user profile from Firestore
   */
  async getUserProfile(uid: string): Promise<any | null> {
    if (!this.isInitialized()) {
      console.error("❌ Auth service not initialized");
      return null;
    }

    try {
      const userDoc = await this.adminDb!.collection("users").doc(uid).get();

      if (!userDoc.exists) {
        return null;
      }

      return {
        id: userDoc.id,
        ...userDoc.data(),
      };
    } catch (error) {
      console.error("❌ Failed to get user profile:", error);
      return null;
    }
  }

  /**
   * Create or update user profile in Firestore
   */
  async createUserProfile(uid: string, profile: any): Promise<boolean> {
    if (!this.isInitialized()) {
      console.error("❌ Auth service not initialized");
      return false;
    }

    try {
      await this.adminDb!.collection("users").doc(uid).set(profile, { merge: true });
      console.log(`✅ User profile created/updated for ${uid}`);
      return true;
    } catch (error) {
      console.error("❌ Failed to create user profile:", error);
      return false;
    }
  }

  /**
   * Set custom claims for a user
   */
  async setCustomClaims(uid: string, claims: Record<string, any>): Promise<boolean> {
    if (!this.isInitialized()) {
      console.error("❌ Auth service not initialized");
      return false;
    }

    try {
      await this.adminAuth!.setCustomUserClaims(uid, claims);
      console.log(`✅ Set custom claims for user ${uid}:`, claims);
      return true;
    } catch (error) {
      console.error("❌ Failed to set custom claims:", error);
      return false;
    }
  }

  /**
   * Get custom claims for a user
   */
  async getCustomClaims(uid: string): Promise<Record<string, any> | null> {
    if (!this.isInitialized()) {
      console.error("❌ Auth service not initialized");
      return null;
    }

    try {
      const userRecord = await this.adminAuth!.getUser(uid);
      return userRecord.customClaims || null;
    } catch (error) {
      console.error("❌ Failed to get custom claims:", error);
      return null;
    }
  }

  /**
   * Extract user ID from token
   */
  async getUserIdFromToken(token: string): Promise<string | null> {
    const result = await this.validateToken(token);
    return result.valid ? result.user!.uid : null;
  }

  /**
   * Check if user has specific role
   */
  async hasRole(uid: string, role: string): Promise<boolean> {
    const claims = await this.getCustomClaims(uid);
    return claims?.role === role;
  }

  /**
   * Check if user has any of the specified roles
   */
  async hasAnyRole(uid: string, roles: string[]): Promise<boolean> {
    const claims = await this.getCustomClaims(uid);
    return roles.includes(claims?.role);
  }

  /**
   * Get user's role
   */
  async getUserRole(uid: string): Promise<string | null> {
    const claims = await this.getCustomClaims(uid);
    return claims?.role || null;
  }

  /**
   * Create session cookie
   */
  async createSessionCookie(idToken: string, expiresIn?: number): Promise<string | null> {
    if (!this.isInitialized()) {
      console.error("❌ Auth service not initialized");
      return null;
    }

    try {
      const sessionCookie = await this.adminAuth!.createSessionCookie(idToken, {
        expiresIn: expiresIn || 60 * 60 * 24 * 5 * 1000, // 5 days default
      });
      return sessionCookie;
    } catch (error) {
      console.error("❌ Failed to create session cookie:", error);
      return null;
    }
  }

  /**
   * Verify session cookie
   */
  async verifySessionCookie(sessionCookie: string): Promise<FirebaseUser | null> {
    if (!this.isInitialized()) {
      console.error("❌ Auth service not initialized");
      return null;
    }

    try {
      const decodedClaims = await this.adminAuth!.verifySessionCookie(sessionCookie, true);

      return {
        uid: decodedClaims.uid,
        email: decodedClaims.email || "",
        displayName: decodedClaims.name,
        photoURL: decodedClaims.picture,
        emailVerified: decodedClaims.email_verified || false,
        customClaims: decodedClaims,
      };
    } catch (error) {
      console.error("❌ Session cookie verification failed:", error);
      return null;
    }
  }

  /**
   * Revoke all refresh tokens for a user
   */
  async revokeUserTokens(uid: string): Promise<boolean> {
    if (!this.isInitialized()) {
      console.error("❌ Auth service not initialized");
      return false;
    }

    try {
      await this.adminAuth!.revokeRefreshTokens(uid);
      console.log(`✅ Revoked all tokens for user ${uid}`);
      return true;
    } catch (error) {
      console.error("❌ Failed to revoke user tokens:", error);
      return false;
    }
  }

  /**
   * Delete a user account
   */
  async deleteUser(uid: string): Promise<boolean> {
    if (!this.isInitialized()) {
      console.error("❌ Auth service not initialized");
      return false;
    }

    try {
      await this.adminAuth!.deleteUser(uid);
      console.log(`✅ Deleted user ${uid}`);
      return true;
    } catch (error) {
      console.error("❌ Failed to delete user:", error);
      return false;
    }
  }

  /**
   * Update user profile in Firebase Auth
   */
  async updateUserProfile(uid: string, updates: UserProfileUpdate): Promise<boolean> {
    if (!this.isInitialized()) {
      console.error("❌ Auth service not initialized");
      return false;
    }

    try {
      await this.adminAuth!.updateUser(uid, updates);
      console.log(`✅ Updated profile for user ${uid}`);
      return true;
    } catch (error) {
      console.error("❌ Failed to update user profile:", error);
      return false;
    }
  }

  /**
   * Get all users (paginated)
   */
  async listUsers(maxResults?: number, pageToken?: string): Promise<{ users: FirebaseUser[]; nextPageToken?: string } | null> {
    if (!this.isInitialized()) {
      console.error("❌ Auth service not initialized");
      return null;
    }

    try {
      const listUsersResult = await this.adminAuth!.listUsers(maxResults, pageToken);
      
      const users: FirebaseUser[] = listUsersResult.users.map(userRecord => ({
        uid: userRecord.uid,
        email: userRecord.email || "",
        displayName: userRecord.displayName,
        photoURL: userRecord.photoURL,
        emailVerified: userRecord.emailVerified,
        customClaims: userRecord.customClaims,
      }));

      return {
        users,
        nextPageToken: listUsersResult.pageToken,
      };
    } catch (error) {
      console.error("❌ Failed to list users:", error);
      return null;
    }
  }

  /**
   * Validate bearer token from Authorization header
   */
  async validateBearerToken(authHeader: string | null): Promise<TokenValidationResult> {
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return {
        valid: false,
        error: {
          code: "auth/missing-authorization",
          message: "Authorization header required",
          status: 401
        }
      };
    }

    const token = authHeader.substring(7);
    return this.validateToken(token);
  }

  /**
   * Create middleware function for authentication
   */
  createAuthMiddleware() {
    return async (authHeader: string | null): Promise<{ user?: FirebaseUser; error?: AuthError }> => {
      const result = await this.validateBearerToken(authHeader);
      
      if (!result.valid) {
        return { error: result.error };
      }

      return { user: result.user };
    };
  }

  /**
   * Cleanup and close connections
   */
  async dispose(): Promise<void> {
    if (this.adminApp) {
      try {
        await this.adminApp.delete();
        this.initialized = false;
        console.log("✅ Firebase Auth Service disposed");
      } catch (error) {
        console.error("❌ Error disposing Firebase Auth Service:", error);
      }
    }
  }
}

// Factory function for easy instantiation
export function createAuthService(config: AuthConfig): AuthService {
  return new AuthService(config);
}

// Helper function to create from environment variables
export function createAuthServiceFromEnv(): AuthService {
  const config: AuthConfig = {
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
    privateKey: process.env.FIREBASE_PRIVATE_KEY || "",
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL || "",
  };

  return new AuthService(config);
}