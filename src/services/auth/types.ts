// Core authentication types based on the source application and integration guide

export interface FirebaseUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  getIdToken(forceRefresh?: boolean): Promise<string>;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: UserRole;
  plan: 'free' | 'premium' | 'enterprise';
  preferences?: UserPreferences;
  emailVerified?: boolean;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  notifications: {
    email: boolean;
    push: boolean;
    inApp: boolean;
    frequency: 'immediate' | 'daily' | 'weekly';
  };
  accessibility: {
    reducedMotion: boolean;
    highContrast: boolean;
    fontSize: 'small' | 'medium' | 'large';
    screenReaderOptimized: boolean;
  };
}

export type UserRole = 'creator' | 'admin' | 'team_member';

export interface SessionInfo {
  token: string;
  expiresAt: Date;
  refreshToken?: string;
  userId: string;
  sessionId: string;
  csrfToken?: string;
}

export interface RBACContext {
  userId: string;
  role: UserRole;
  permissions: PermissionSet;
}

export interface PermissionSet {
  collections: {
    create: boolean;
    read: boolean;
    update: boolean;
    delete: boolean;
  };
  content: {
    create: boolean;
    read: boolean;
    update: boolean;
    delete: boolean;
  };
  users: {
    create: boolean;
    read: boolean;
    update: boolean;
    delete: boolean;
  };
  admin: {
    access: boolean;
    manageUsers: boolean;
    systemSettings: boolean;
  };
}

export type PermissionAction = 'create' | 'read' | 'update' | 'delete';
export type ResourceType = 'collection' | 'content' | 'user' | 'admin';

export interface AuthError extends Error {
  code: string;
  type: 'auth' | 'permission' | 'session' | 'network';
}

export interface AuthConfig {
  enableLogging?: boolean;
  sessionTimeout?: number;
  autoRefresh?: boolean;
  persistSession?: boolean;
}

// Event types for auth state changes
export interface AuthStateChangeEvent {
  type: 'signIn' | 'signOut' | 'tokenRefresh' | 'sessionExpired';
  user: AuthUser | null;
  timestamp: Date;
}

export interface RBACStateChangeEvent {
  type: 'contextLoaded' | 'permissionsChanged' | 'roleChanged';
  context: RBACContext | null;
  timestamp: Date;
}