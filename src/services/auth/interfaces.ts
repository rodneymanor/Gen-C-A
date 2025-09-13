/**
 * Service Interface Definitions
 * Standardized interfaces for authentication services
 * Compatible with both React and non-React applications
 */

// ===== Core Auth Interfaces =====

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

// ===== Authentication Service Interface =====

export interface IAuthService {
  // Initialization
  initialize(): Promise<void>;
  isInitialized(): boolean;
  dispose(): Promise<void>;

  // Token Management
  validateToken(token: string): Promise<TokenValidationResult>;
  validateBearerToken(authHeader: string | null): Promise<TokenValidationResult>;
  getUserIdFromToken(token: string): Promise<string | null>;
  createSessionCookie(idToken: string, expiresIn?: number): Promise<string | null>;
  verifySessionCookie(sessionCookie: string): Promise<FirebaseUser | null>;
  revokeUserTokens(uid: string): Promise<boolean>;

  // User Management
  getUserProfile(uid: string): Promise<any | null>;
  createUserProfile(uid: string, profile: any): Promise<boolean>;
  updateUserProfile(uid: string, updates: UserProfileUpdate): Promise<boolean>;
  deleteUser(uid: string): Promise<boolean>;
  listUsers(maxResults?: number, pageToken?: string): Promise<{ users: FirebaseUser[]; nextPageToken?: string } | null>;

  // Role & Claims Management
  setCustomClaims(uid: string, claims: Record<string, any>): Promise<boolean>;
  getCustomClaims(uid: string): Promise<Record<string, any> | null>;
  hasRole(uid: string, role: string): Promise<boolean>;
  hasAnyRole(uid: string, roles: string[]): Promise<boolean>;
  getUserRole(uid: string): Promise<string | null>;

  // Middleware
  createAuthMiddleware(): (authHeader: string | null) => Promise<{ user?: FirebaseUser; error?: AuthError }>;
}

// ===== RBAC Interfaces =====

export type UserRole = "super_admin" | "coach" | "creator";

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  coachId?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  lastLoginAt?: Date | string;
  [key: string]: any;
}

export interface RBACContext {
  userId: string;
  role: string;
  accessibleCoaches: string[];
  isSuperAdmin: boolean;
}

export interface Collection {
  id: string;
  userId: string;
  title: string;
  description?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  [key: string]: any;
}

export interface Video {
  id: string;
  userId: string;
  collectionId: string;
  originalUrl: string;
  title: string;
  description?: string;
  addedAt: Date | string;
  [key: string]: any;
}

export interface CollectionAccessResult {
  collections: Collection[];
  accessibleCoaches: string[];
}

export interface VideoAccessResult {
  videos: Video[];
  lastDoc?: any; // Firebase Admin SDK document snapshot
  totalCount: number;
}

// ===== User Management Adapter Interface =====

export interface UserManagementAdapter {
  getUserProfile(userId: string): Promise<UserProfile | null>;
  getUserAccessibleCoaches(userId: string): Promise<string[]>;
  updateLastLogin?(userId: string): Promise<void>;
  createUserProfile?(userId: string, profile: Partial<UserProfile>): Promise<boolean>;
}

// ===== RBAC Service Interface =====

export interface IRBACService {
  // Context & Access Control
  getRBACContext(userId: string): Promise<RBACContext>;
  hasAccess(userId: string, resourceType: "collection" | "video", resourceId: string): Promise<boolean>;
  canPerformAction(
    userId: string,
    action: "read" | "write" | "delete",
    resourceType: "collection" | "video" | "user",
    resourceId?: string,
  ): Promise<boolean>;

  // Data Access
  getUserCollections(userId: string): Promise<CollectionAccessResult>;
  getCollectionVideos(
    userId: string,
    collectionId?: string,
    videoLimit?: number,
    lastDoc?: any,
  ): Promise<VideoAccessResult>;

  // Utilities
  getAccessibleCoaches(userId: string): Promise<string[]>;
  isSuperAdmin(userId: string): Promise<boolean>;
  createCollectionsQuery(userId: string): Promise<any>;
  createVideosQuery(userId: string, collectionId?: string): Promise<any>;
}

// ===== Service Factory Interfaces =====

export interface ServiceFactoryConfig {
  auth: AuthConfig;
  userManagement?: UserManagementAdapter;
}

export interface AuthServiceFactory {
  createAuthService(config: AuthConfig): IAuthService;
  createAuthServiceFromEnv(): IAuthService;
}

export interface RBACServiceFactory {
  createRBACService(db: any, userManagement: UserManagementAdapter): IRBACService;
}

// ===== Middleware Interfaces =====

export interface AuthMiddleware {
  (authHeader: string | null): Promise<{ user?: FirebaseUser; error?: AuthError }>;
}

export interface RBACMiddleware {
  requireAuth(requiredRole?: UserRole | UserRole[]): (
    req: any,
    res: any,
    next: any
  ) => Promise<void>;
  requirePermission(
    action: "read" | "write" | "delete",
    resourceType: "collection" | "video" | "user",
    resourceId?: string
  ): (req: any, res: any, next: any) => Promise<void>;
}

// ===== HTTP Request/Response Interfaces =====

export interface AuthenticatedRequest extends Request {
  user?: FirebaseUser;
  userContext?: RBACContext;
}

export interface AuthHeaders {
  authorization?: string;
  "x-user-id"?: string;
  "x-user-role"?: string;
}

export interface AuthResponse<T = any> {
  success: boolean;
  data?: T;
  error?: AuthError;
  user?: FirebaseUser;
}

// ===== Configuration Interfaces =====

export interface FirebaseConfig {
  apiKey?: string;
  authDomain?: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
}

export interface AdminConfig {
  projectId: string;
  privateKey: string;
  clientEmail: string;
  databaseURL?: string;
  storageBucket?: string;
}

export interface ServiceConfig {
  firebase: FirebaseConfig;
  admin: AdminConfig;
  cors?: {
    origin: string | string[];
    credentials: boolean;
  };
  session?: {
    expiresIn: number;
    secure: boolean;
    httpOnly: boolean;
    sameSite: "strict" | "lax" | "none";
  };
}

// ===== Event Interfaces =====

export interface AuthEvent {
  type: "login" | "logout" | "token_refresh" | "profile_update" | "role_change";
  userId: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface AuthEventListener {
  (event: AuthEvent): void | Promise<void>;
}

// ===== Cache Interfaces =====

export interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

export interface AuthCache {
  get<T>(key: string): CacheEntry<T> | null;
  set<T>(key: string, data: T, ttl?: number): void;
  delete(key: string): void;
  clear(): void;
  isExpired(key: string): boolean;
}

// ===== Integration Helper Types =====

export type AuthServiceInstance = IAuthService;
export type RBACServiceInstance = IRBACService;

export interface ServiceContainer {
  auth: AuthServiceInstance;
  rbac: RBACServiceInstance;
  userManagement: UserManagementAdapter;
}

// ===== Express.js Integration Types =====

export interface ExpressAuthRequest extends Express.Request {
  user?: FirebaseUser;
  userContext?: RBACContext;
}

export interface ExpressAuthResponse extends Express.Response {
  sendAuthError(error: AuthError): void;
  sendAuthSuccess<T>(data: T): void;
}

// ===== Next.js Integration Types =====

export interface NextAuthRequest {
  headers: Record<string, string | string[] | undefined>;
  user?: FirebaseUser;
  userContext?: RBACContext;
}

export interface NextAuthResponse {
  status: (code: number) => NextAuthResponse;
  json: (body: any) => NextAuthResponse;
}

// ===== Validation Helpers =====

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export interface ConfigValidator {
  validateAuthConfig(config: AuthConfig): ValidationResult;
  validateFirebaseConfig(config: FirebaseConfig): ValidationResult;
  validateServiceConfig(config: ServiceConfig): ValidationResult;
}

export { FirebaseUser as User };