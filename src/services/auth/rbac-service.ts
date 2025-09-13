import { doc, getDoc } from 'firebase/firestore';
import { 
  RBACContext, 
  UserRole, 
  PermissionAction, 
  ResourceType, 
  PermissionSet,
  AuthError 
} from './types';

/**
 * Role-Based Access Control service
 * Manages user permissions and access control based on roles
 */
export class RBACService {
  private db;
  private config: { enableLogging?: boolean };

  constructor(firestore: any, config: { enableLogging?: boolean } = {}) {
    this.db = firestore;
    this.config = config;
  }

  async initialize(): Promise<void> {
    if (this.config.enableLogging) {
      console.log('RBACService initializing...');
    }
  }

  async dispose(): Promise<void> {
    // Cleanup if needed
  }

  /**
   * Load RBAC context for a user
   */
  async loadUserContext(userId: string): Promise<RBACContext> {
    try {
      const userRef = doc(this.db, 'users', userId);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        throw new Error(`User ${userId} not found`);
      }

      const userData = userSnap.data();
      const role = userData.role as UserRole || 'creator';
      
      return {
        userId,
        role,
        permissions: this.getRolePermissions(role)
      };
    } catch (error: any) {
      throw this.createRBACError(error, `Failed to load RBAC context for user ${userId}`);
    }
  }

  /**
   * Check if user has specific permission
   */
  async hasPermission(
    context: RBACContext, 
    action: PermissionAction, 
    resourceType: ResourceType,
    resourceId?: string
  ): Promise<boolean> {
    if (!context) {
      return false;
    }

    // Get base permissions for the resource type
    const resourcePermissions = context.permissions[resourceType as keyof PermissionSet];
    if (!resourcePermissions) {
      return false;
    }

    // Check if the user has the required action permission
    const hasBasePermission = resourcePermissions[action as keyof typeof resourcePermissions];
    if (!hasBasePermission) {
      return false;
    }

    // Additional resource-specific checks could be added here
    // For example, checking if user owns a specific collection
    if (resourceId && resourceType === 'collection') {
      return this.checkCollectionAccess(context, resourceId, action);
    }

    if (resourceId && resourceType === 'content') {
      return this.checkContentAccess(context, resourceId, action);
    }

    return true;
  }

  /**
   * Check if user has specific role
   */
  hasRole(context: RBACContext, role: UserRole): boolean {
    if (!context) {
      return false;
    }

    // Exact role match
    if (context.role === role) {
      return true;
    }

    // Role hierarchy: admin > team_member > creator
    const roleHierarchy = {
      'admin': ['team_member', 'creator'],
      'team_member': ['creator'],
      'creator': []
    };

    return roleHierarchy[context.role]?.includes(role) || false;
  }

  /**
   * Get accessible resources for a user
   */
  async getAccessibleCollections(context: RBACContext): Promise<string[]> {
    if (!context) {
      return [];
    }

    // Admin and team_member can access all collections
    if (context.role === 'admin' || context.role === 'team_member') {
      return ['*']; // Special marker for "all"
    }

    // Creator can only access their own collections
    // This would need to query Firestore to get user's collections
    try {
      // Implementation would query collections where userId === context.userId
      // For now, return empty array as placeholder
      return [];
    } catch (error) {
      if (this.config.enableLogging) {
        console.error('Error getting accessible collections:', error);
      }
      return [];
    }
  }

  /**
   * Check if user is super admin (admin role)
   */
  isSuperAdmin(context: RBACContext): boolean {
    return context?.role === 'admin';
  }

  /**
   * Check if user can manage other users
   */
  canManageUsers(context: RBACContext): boolean {
    return context?.permissions.users.create && 
           context?.permissions.users.update && 
           context?.permissions.users.delete;
  }

  /**
   * Check if user can create collections
   */
  canCreateCollections(context: RBACContext): boolean {
    return context?.permissions.collections.create || false;
  }

  /**
   * Check if user can delete any collection
   */
  canDeleteAnyCollection(context: RBACContext): boolean {
    return context?.role === 'admin';
  }

  /**
   * Check if user can access all content
   */
  canAccessAllContent(context: RBACContext): boolean {
    return context?.role === 'admin' || context?.role === 'team_member';
  }

  private getRolePermissions(role: UserRole): PermissionSet {
    const permissions: Record<UserRole, PermissionSet> = {
      creator: {
        collections: {
          create: true,
          read: true,
          update: true, // Only their own
          delete: true  // Only their own
        },
        content: {
          create: true,
          read: true,
          update: true, // Only their own
          delete: true  // Only their own
        },
        users: {
          create: false,
          read: false, // Only their own profile
          update: false, // Only their own profile
          delete: false
        },
        admin: {
          access: false,
          manageUsers: false,
          systemSettings: false
        }
      },
      team_member: {
        collections: {
          create: true,
          read: true,
          update: true,
          delete: false // Can't delete others' collections
        },
        content: {
          create: true,
          read: true,
          update: true,
          delete: false
        },
        users: {
          create: false,
          read: true, // Can view other users
          update: false,
          delete: false
        },
        admin: {
          access: true, // Basic admin access
          manageUsers: false,
          systemSettings: false
        }
      },
      admin: {
        collections: {
          create: true,
          read: true,
          update: true,
          delete: true
        },
        content: {
          create: true,
          read: true,
          update: true,
          delete: true
        },
        users: {
          create: true,
          read: true,
          update: true,
          delete: true
        },
        admin: {
          access: true,
          manageUsers: true,
          systemSettings: true
        }
      }
    };

    return permissions[role];
  }

  private async checkCollectionAccess(
    context: RBACContext, 
    collectionId: string, 
    action: PermissionAction
  ): Promise<boolean> {
    // Admin can access all collections
    if (context.role === 'admin') {
      return true;
    }

    // Team members can read/update most collections, but can't delete others'
    if (context.role === 'team_member') {
      if (action === 'delete') {
        // Check if they own the collection
        return this.checkResourceOwnership(collectionId, context.userId, 'collection');
      }
      return true;
    }

    // Creators can only access their own collections
    if (context.role === 'creator') {
      return this.checkResourceOwnership(collectionId, context.userId, 'collection');
    }

    return false;
  }

  private async checkContentAccess(
    context: RBACContext, 
    contentId: string, 
    action: PermissionAction
  ): Promise<boolean> {
    // Similar logic to collection access
    if (context.role === 'admin') {
      return true;
    }

    if (context.role === 'team_member') {
      if (action === 'delete') {
        return this.checkResourceOwnership(contentId, context.userId, 'content');
      }
      return true;
    }

    if (context.role === 'creator') {
      return this.checkResourceOwnership(contentId, context.userId, 'content');
    }

    return false;
  }

  private async checkResourceOwnership(
    resourceId: string, 
    userId: string, 
    resourceType: 'collection' | 'content'
  ): Promise<boolean> {
    try {
      const resourceRef = doc(this.db, resourceType === 'collection' ? 'collections' : 'content', resourceId);
      const resourceSnap = await getDoc(resourceRef);

      if (!resourceSnap.exists()) {
        return false;
      }

      const resourceData = resourceSnap.data();
      return resourceData.userId === userId || resourceData.createdBy === userId;
    } catch (error) {
      if (this.config.enableLogging) {
        console.error(`Error checking ${resourceType} ownership:`, error);
      }
      return false;
    }
  }

  private createRBACError(originalError: any, message: string): AuthError {
    const error = new Error(message) as AuthError;
    error.code = originalError?.code || 'rbac-error';
    error.type = 'permission';
    error.cause = originalError;
    return error;
  }
}

/**
 * Factory function to create RBACService
 */
export function createRBACService(firestore: any, config?: { enableLogging?: boolean }): RBACService {
  return new RBACService(firestore, config);
}