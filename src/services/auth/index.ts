// Authentication services export barrel
export { AuthService, createAuthService, createAuthServiceFromEnv } from './auth-service';
export { RBACService, createRBACService } from './rbac-service';
export type { 
  AuthUser, 
  FirebaseUser, 
  SessionInfo,
  RBACContext,
  UserRole,
  PermissionAction,
  ResourceType
} from './types';