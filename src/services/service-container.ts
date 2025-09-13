/**
 * Service Container - Unified initialization and access point for all extracted services
 * Provides dependency injection and service management for API routes
 */

import { Firestore } from 'firebase-admin/firestore';
import { AuthService, createAuthService } from './auth/auth-service';
import { RBACService, createRBACService, UserManagementAdapter } from './auth/RBACService';
import type { AuthConfig } from './auth/types';

// ================================
// SERVICE CONTAINER INTERFACES
// ================================

export interface ServiceConfig {
  auth?: AuthConfig;
  rbac?: {
    enableLogging?: boolean;
  };
  firebase?: {
    adminApp?: any;
    clientApp?: any;
    firestore?: Firestore;
  };
}

export interface ServiceContainer {
  authService: AuthService;
  rbacService: RBACService;
  isInitialized: boolean;
}

// ================================
// USER MANAGEMENT ADAPTER FOR RBAC
// ================================

/**
 * Firebase implementation of UserManagementAdapter for RBACService
 * Bridges the gap between RBACService and Firestore operations
 */
class FirebaseUserManagementAdapter implements UserManagementAdapter {
  private db: Firestore;

  constructor(firestore: Firestore) {
    this.db = firestore;
  }

  async getUserProfile(userId: string): Promise<any> {
    try {
      const userDoc = await this.db.collection('users').doc(userId).get();
      if (!userDoc.exists) {
        return null;
      }

      const userData = userDoc.data();
      return {
        uid: userId,
        email: userData?.email || '',
        displayName: userData?.name || userData?.displayName || 'User',
        role: userData?.role || 'creator',
        coachId: userData?.coachId,
        createdAt: userData?.createdAt,
        updatedAt: userData?.updatedAt,
        ...userData
      };
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  }

  async getUserAccessibleCoaches(userId: string): Promise<string[]> {
    try {
      const userProfile = await this.getUserProfile(userId);
      if (!userProfile) {
        return [];
      }

      // Super admin has access to all coaches
      if (userProfile.role === 'super_admin') {
        const coachesSnapshot = await this.db
          .collection('users')
          .where('role', '==', 'coach')
          .get();
        
        return coachesSnapshot.docs.map(doc => doc.id);
      }

      // Coach has access to their own content
      if (userProfile.role === 'coach') {
        return [userId];
      }

      // Creator has access to specific coaches based on assignment
      if (userProfile.coachId) {
        return [userProfile.coachId];
      }

      // Check for explicit coach access assignments
      const accessDoc = await this.db
        .collection('user_coach_access')
        .doc(userId)
        .get();

      if (accessDoc.exists) {
        const accessData = accessDoc.data();
        return accessData?.coaches || [];
      }

      return [];
    } catch (error) {
      console.error('Error fetching accessible coaches:', error);
      return [];
    }
  }
}

// ================================
// SERVICE CONTAINER IMPLEMENTATION
// ================================

class ServiceContainerImpl implements ServiceContainer {
  public authService!: AuthService;
  public rbacService!: RBACService;
  public isInitialized = false;

  private config: ServiceConfig;
  private userManagementAdapter!: FirebaseUserManagementAdapter;

  constructor(config: ServiceConfig) {
    this.config = config;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Validate Firebase configuration
      if (!this.config.firebase?.firestore) {
        throw new Error('Firebase Firestore instance is required for service initialization');
      }

      // Create user management adapter
      this.userManagementAdapter = new FirebaseUserManagementAdapter(
        this.config.firebase.firestore
      );

      // Initialize AuthService
      this.authService = createAuthService(
        this.config.firebase.clientApp || this.config.firebase.adminApp,
        this.config.firebase.firestore,
        this.config.auth || {}
      );

      // Initialize RBACService
      this.rbacService = createRBACService(
        this.config.firebase.firestore,
        this.userManagementAdapter
      );

      // Initialize services
      await this.authService.initialize();
      
      this.isInitialized = true;

      if (this.config.auth?.enableLogging) {
        console.log('✅ Service container initialized successfully');
      }
    } catch (error) {
      console.error('❌ Failed to initialize service container:', error);
      throw error;
    }
  }

  async dispose(): Promise<void> {
    if (!this.isInitialized) {
      return;
    }

    try {
      if (this.authService) {
        await this.authService.dispose();
      }
      
      this.isInitialized = false;
    } catch (error) {
      console.error('Error disposing service container:', error);
    }
  }

  getServices(): Pick<ServiceContainer, 'authService' | 'rbacService'> {
    if (!this.isInitialized) {
      throw new Error('Service container not initialized. Call initialize() first.');
    }

    return {
      authService: this.authService,
      rbacService: this.rbacService
    };
  }
}

// ================================
// GLOBAL CONTAINER INSTANCE
// ================================

let globalContainer: ServiceContainerImpl | null = null;

/**
 * Initialize the global service container
 */
export async function initializeServices(config: ServiceConfig): Promise<ServiceContainer> {
  if (globalContainer && globalContainer.isInitialized) {
    return globalContainer;
  }

  globalContainer = new ServiceContainerImpl(config);
  await globalContainer.initialize();
  return globalContainer;
}

/**
 * Get the initialized services from the global container
 */
export function getServices(): Pick<ServiceContainer, 'authService' | 'rbacService'> {
  if (!globalContainer || !globalContainer.isInitialized) {
    throw new Error(
      'Services not initialized. Call initializeServices() first, typically in your app startup.'
    );
  }

  return globalContainer.getServices();
}

/**
 * Check if services are initialized
 */
export function isServicesInitialized(): boolean {
  return globalContainer?.isInitialized || false;
}

/**
 * Dispose of the global service container
 */
export async function disposeServices(): Promise<void> {
  if (globalContainer) {
    await globalContainer.dispose();
    globalContainer = null;
  }
}

/**
 * Health check for all services
 */
export function getServiceHealth(): {
  status: 'healthy' | 'unhealthy' | 'not_initialized';
  services: {
    container: boolean;
    authService: boolean;
    rbacService: boolean;
  };
  timestamp: string;
} {
  if (!globalContainer) {
    return {
      status: 'not_initialized',
      services: {
        container: false,
        authService: false,
        rbacService: false
      },
      timestamp: new Date().toISOString()
    };
  }

  const services = {
    container: globalContainer.isInitialized,
    authService: !!globalContainer.authService,
    rbacService: !!globalContainer.rbacService
  };

  const allHealthy = Object.values(services).every(Boolean);

  return {
    status: allHealthy ? 'healthy' : 'unhealthy',
    services,
    timestamp: new Date().toISOString()
  };
}

// ================================
// CONVENIENCE FACTORY FUNCTIONS
// ================================

/**
 * Create service container with Firebase Admin SDK
 */
export async function createServerServices(firestore: Firestore, config: Partial<ServiceConfig> = {}): Promise<ServiceContainer> {
  const serviceConfig: ServiceConfig = {
    auth: {
      enableLogging: process.env.NODE_ENV === 'development',
      ...config.auth
    },
    rbac: {
      enableLogging: process.env.NODE_ENV === 'development',
      ...config.rbac
    },
    firebase: {
      firestore,
      ...config.firebase
    }
  };

  return initializeServices(serviceConfig);
}

/**
 * Create service container with Firebase Client SDK (for client-side usage)
 */
export async function createClientServices(clientApp: any, firestore: any, config: Partial<ServiceConfig> = {}): Promise<ServiceContainer> {
  const serviceConfig: ServiceConfig = {
    auth: {
      enableLogging: process.env.NODE_ENV === 'development',
      ...config.auth
    },
    rbac: {
      enableLogging: process.env.NODE_ENV === 'development',
      ...config.rbac
    },
    firebase: {
      clientApp,
      firestore,
      ...config.firebase
    }
  };

  return initializeServices(serviceConfig);
}