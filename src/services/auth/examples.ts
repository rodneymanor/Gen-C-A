/**
 * Integration Examples and Usage Patterns
 * Complete examples for different application types
 */

import express from "express";
import { getFirestore } from "firebase-admin/firestore";
import { AuthService } from "./AuthService";
import { RBACService } from "./RBACService";
import { ExpressAuthMiddleware, NextAuthMiddleware, SessionManager } from "./middleware";
import { AuthConfig, UserManagementAdapter, UserProfile } from "./interfaces";

// ===== Example User Management Adapter =====

export class SimpleUserManagementAdapter implements UserManagementAdapter {
  private db: any; // Firebase Firestore instance

  constructor(db: any) {
    this.db = db;
  }

  async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const doc = await this.db.collection("users").doc(userId).get();
      if (!doc.exists) return null;
      
      return {
        uid: doc.id,
        ...doc.data(),
      } as UserProfile;
    } catch (error) {
      console.error("Error fetching user profile:", error);
      return null;
    }
  }

  async getUserAccessibleCoaches(userId: string): Promise<string[]> {
    try {
      const userProfile = await this.getUserProfile(userId);
      if (!userProfile) return [];

      // Super admin can access all coaches
      if (userProfile.role === "super_admin") {
        const coachesSnapshot = await this.db
          .collection("users")
          .where("role", "==", "coach")
          .get();
        return coachesSnapshot.docs.map((doc: any) => doc.id);
      }

      // Coach can access themselves
      if (userProfile.role === "coach") {
        return [userId];
      }

      // Creator can access their assigned coach
      if (userProfile.role === "creator" && userProfile.coachId) {
        return [userProfile.coachId];
      }

      return [];
    } catch (error) {
      console.error("Error fetching accessible coaches:", error);
      return [];
    }
  }

  async updateLastLogin(userId: string): Promise<void> {
    try {
      await this.db.collection("users").doc(userId).update({
        lastLoginAt: new Date(),
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error("Error updating last login:", error);
    }
  }

  async createUserProfile(userId: string, profile: Partial<UserProfile>): Promise<boolean> {
    try {
      await this.db.collection("users").doc(userId).set({
        uid: userId,
        role: "creator",
        createdAt: new Date(),
        updatedAt: new Date(),
        ...profile,
      });
      return true;
    } catch (error) {
      console.error("Error creating user profile:", error);
      return false;
    }
  }
}

// ===== Complete Service Setup =====

export async function createAuthServices(config: AuthConfig, db: any) {
  // Initialize Auth Service
  const authService = new AuthService(config);
  await authService.initialize();

  // Create User Management Adapter
  const userManagement = new SimpleUserManagementAdapter(db);

  // Initialize RBAC Service
  const rbacService = new RBACService(db, userManagement);

  return {
    authService,
    rbacService,
    userManagement,
  };
}

// ===== Express.js Application Example =====

export function setupExpressApp() {
  const app = express();

  // Example setup function
  async function initializeAuth() {
    const config: AuthConfig = {
      projectId: process.env.FIREBASE_PROJECT_ID!,
      privateKey: process.env.FIREBASE_PRIVATE_KEY!,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
    };

    // Get Firebase Admin DB instance (you would get this from your Firebase setup)
    const db = getFirestore();

    const { authService, rbacService } = await createAuthServices(config, db);
    const authMiddleware = new ExpressAuthMiddleware(authService, rbacService);

    // Public routes
    app.get('/api/health', (req: any, res: any) => {
      res.json({ status: 'ok' });
    });

    // Protected routes
    app.get('/api/profile', authMiddleware.authenticate(), async (req: any, res: any) => {
      const profile = await authService.getUserProfile(req.user.uid);
      res.json({ profile });
    });

    // Role-protected routes
    app.get('/api/admin/users', authMiddleware.requireRole('super_admin'), async (req: any, res: any) => {
      const users = await authService.listUsers(50);
      res.json({ users });
    });

    // RBAC-protected routes
    app.get('/api/collections', authMiddleware.requirePermission(
      'read', 
      'collection'
    ), async (req: any, res: any) => {
      const collections = await rbacService.getUserCollections(req.user.uid);
      res.json({ collections });
    });

    // Resource-specific protection
    app.delete('/api/collections/:id', authMiddleware.requirePermission(
      'delete',
      'collection',
      (req: any) => req.params.id
    ), async (req: any, res: any) => {
      // Delete collection logic here
      res.json({ success: true });
    });

    return app;
  }

  return { app, initializeAuth };
}

// ===== Next.js API Route Examples =====

export class NextJSExamples {
  private authMiddleware: NextAuthMiddleware;

  constructor(authMiddleware: NextAuthMiddleware) {
    this.authMiddleware = authMiddleware;
  }

  // pages/api/profile.ts
  profileHandler() {
    return this.authMiddleware.withAuth(async (req, res) => {
      try {
        const profile = await (global as any).authService.getUserProfile(req.user.uid);
        res.status(200).json({ success: true, profile });
      } catch (error) {
        res.status(500).json({ 
          success: false, 
          error: { message: 'Failed to fetch profile' } 
        });
      }
    });
  }

  // pages/api/admin/users.ts
  adminUsersHandler() {
    return this.authMiddleware.withRole('super_admin', async (req: any, res: any) => {
      try {
        const users = await (global as any).authService.listUsers(50);
        res.status(200).json({ success: true, users });
      } catch (error) {
        res.status(500).json({ 
          success: false, 
          error: { message: 'Failed to fetch users' } 
        });
      }
    });
  }

  // pages/api/collections/[id].ts
  collectionHandler() {
    return this.authMiddleware.withPermission(
      'read',
      'collection',
      (req) => req.url?.split('/').pop() || '',
      async (req: any, res: any) => {
        try {
          const collectionId = req.query.id;
          const videos = await (global as any).rbacService.getCollectionVideos(
            req.user.uid,
            collectionId
          );
          res.status(200).json({ success: true, videos });
        } catch (error) {
          res.status(500).json({ 
            success: false, 
            error: { message: 'Failed to fetch collection videos' } 
          });
        }
      }
    );
  }
}

// ===== React Integration Example (for client-side) =====

export class ReactAuthHooks {
  private authService: AuthService;

  constructor(authService: AuthService) {
    this.authService = authService;
  }

  // Custom hook for authentication
  useAuth() {
    // This would be implemented in a React environment
    // with useState, useEffect, etc.
    return {
      user: null, // Current user
      loading: false, // Loading state
      signIn: async (token: string) => {
        const result = await this.authService.validateToken(token);
        return result;
      },
      signOut: async () => {
        // Sign out logic
      },
    };
  }

  // Custom hook for RBAC
  usePermissions() {
    return {
      canRead: (resource: string, resourceId?: string) => {
        // Check read permission
        return true; // Placeholder
      },
      canWrite: (resource: string, resourceId?: string) => {
        // Check write permission
        return true; // Placeholder
      },
      canDelete: (resource: string, resourceId?: string) => {
        // Check delete permission
        return true; // Placeholder
      },
    };
  }
}

// ===== Standalone API Client Example =====

export class AuthAPIClient {
  private baseURL: string;
  private token?: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  setToken(token: string) {
    this.token = token;
  }

  private getHeaders() {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  async get(endpoint: string) {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    return response.json();
  }

  async post(endpoint: string, data: any) {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    return response.json();
  }

  // Auth-specific methods
  async validateToken(token: string) {
    return this.post('/api/auth/validate', { token });
  }

  async getUserProfile() {
    return this.get('/api/profile');
  }

  async getCollections() {
    return this.get('/api/collections');
  }

  async getCollectionVideos(collectionId: string) {
    return this.get(`/api/collections/${collectionId}/videos`);
  }
}

// ===== Testing Utilities =====

export class AuthTestUtils {
  private authService: AuthService;
  private rbacService: RBACService;

  constructor(authService: AuthService, rbacService: RBACService) {
    this.authService = authService;
    this.rbacService = rbacService;
  }

  // Create test user
  async createTestUser(role: 'super_admin' | 'coach' | 'creator' = 'creator') {
    const uid = `test-user-${Date.now()}`;
    const email = `test-${uid}@example.com`;
    
    await this.authService.setCustomClaims(uid, { role });
    await this.authService.createUserProfile(uid, {
      uid,
      email,
      displayName: `Test User ${uid}`,
      role,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return { uid, email, role };
  }

  // Create test token
  async createTestToken(uid: string): Promise<string> {
    // This would create a test token in a real implementation
    // For testing purposes, you might use Firebase Admin SDK's createCustomToken
    return `test-token-${uid}`;
  }

  // Cleanup test data
  async cleanupTestUser(uid: string) {
    await this.authService.deleteUser(uid);
  }

  // Test RBAC permissions
  async testPermissions(userId: string) {
    const context = await this.rbacService.getRBACContext(userId);
    const canRead = await this.rbacService.canPerformAction(userId, 'read', 'collection');
    const canWrite = await this.rbacService.canPerformAction(userId, 'write', 'collection');
    const canDelete = await this.rbacService.canPerformAction(userId, 'delete', 'collection');

    return {
      context,
      permissions: { canRead, canWrite, canDelete }
    };
  }
}

// ===== Environment Configuration Helper =====

export class ConfigHelper {
  static validateEnvironment(): { valid: boolean; errors: string[] } {
    const required = [
      'FIREBASE_PROJECT_ID',
      'FIREBASE_PRIVATE_KEY', 
      'FIREBASE_CLIENT_EMAIL'
    ];

    const errors: string[] = [];

    for (const key of required) {
      if (!process.env[key]) {
        errors.push(`Missing environment variable: ${key}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  static createConfigFromEnv(): AuthConfig {
    const validation = this.validateEnvironment();
    if (!validation.valid) {
      throw new Error(`Invalid configuration: ${validation.errors.join(', ')}`);
    }

    return {
      projectId: process.env.FIREBASE_PROJECT_ID!,
      privateKey: process.env.FIREBASE_PRIVATE_KEY!,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
    };
  }
}

// ===== Usage Examples =====

export const examples = {
  // Basic setup
  async basicSetup() {
    const config = ConfigHelper.createConfigFromEnv();
    const authService = new AuthService(config);
    await authService.initialize();
    
    // Validate a token
    const result = await authService.validateToken('some-jwt-token');
    if (result.valid) {
      console.log('User authenticated:', result.user);
    }
  },

  // Express.js setup
  async expressSetup() {
    const { app, initializeAuth } = setupExpressApp();
    await initializeAuth();
    
    app.listen(3000, () => {
      console.log('Server running on port 3000');
    });
  },

  // API client usage
  async clientUsage() {
    const client = new AuthAPIClient('https://api.example.com');
    client.setToken('user-jwt-token');
    
    const profile = await client.getUserProfile();
    const collections = await client.getCollections();
    
    console.log('User profile:', profile);
    console.log('Collections:', collections);
  },
};

export default examples;
