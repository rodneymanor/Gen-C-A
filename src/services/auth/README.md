# Standalone Firebase Authentication Services

This package provides a complete, standalone authentication and role-based access control (RBAC) system extracted from a React application. It maintains the exact Firebase configuration and token structures while removing all React dependencies.

## Features

- **Standalone AuthService**: Complete Firebase Admin SDK wrapper
- **RBAC System**: Role-based access control with coach hierarchy
- **Framework Agnostic**: Works with Express.js, Next.js, or any Node.js application
- **TypeScript Support**: Fully typed interfaces and implementations
- **Middleware Ready**: Pre-built middleware for common frameworks
- **Zero React Dependencies**: Pure TypeScript/JavaScript services

## Quick Start

### 1. Installation

```bash
npm install firebase-admin
```

### 2. Environment Variables

```bash
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
FIREBASE_CLIENT_EMAIL=your-service@your-project.iam.gserviceaccount.com
```

### 3. Basic Usage

```typescript
import { AuthService, RBACService, SimpleUserManagementAdapter } from './services/auth';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize services
const config = {
  projectId: process.env.FIREBASE_PROJECT_ID!,
  privateKey: process.env.FIREBASE_PRIVATE_KEY!,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
};

const authService = new AuthService(config);
await authService.initialize();

const db = getFirestore();
const userManagement = new SimpleUserManagementAdapter(db);
const rbacService = new RBACService(db, userManagement);

// Validate a token
const result = await authService.validateToken('jwt-token');
if (result.valid) {
  console.log('User:', result.user);
}

// Check permissions
const canRead = await rbacService.canPerformAction(
  userId, 
  'read', 
  'collection'
);
```

## Core Services

### AuthService

Complete Firebase Admin SDK wrapper with token validation, user management, and custom claims.

```typescript
const authService = new AuthService(config);
await authService.initialize();

// Token validation
const result = await authService.validateToken(token);

// User management
const profile = await authService.getUserProfile(userId);
await authService.setCustomClaims(userId, { role: 'admin' });

// Session management
const sessionCookie = await authService.createSessionCookie(idToken);
```

### RBACService

Role-based access control with hierarchical permissions (super_admin → coach → creator).

```typescript
const rbacService = new RBACService(db, userManagement);

// Get user context
const context = await rbacService.getRBACContext(userId);

// Check permissions
const canDelete = await rbacService.canPerformAction(
  userId, 
  'delete', 
  'collection', 
  collectionId
);

// Get accessible data
const collections = await rbacService.getUserCollections(userId);
const videos = await rbacService.getCollectionVideos(userId, collectionId);
```

## Framework Integration

### Express.js

```typescript
import { ExpressAuthMiddleware } from './services/auth';

const authMiddleware = new ExpressAuthMiddleware(authService, rbacService);

// Basic authentication
app.get('/api/profile', authMiddleware.authenticate(), (req, res) => {
  res.json({ user: req.user });
});

// Role-based protection
app.get('/api/admin', authMiddleware.requireRole('super_admin'), (req, res) => {
  res.json({ message: 'Admin only' });
});

// Permission-based protection
app.get('/api/collections', authMiddleware.requirePermission(
  'read', 
  'collection'
), (req, res) => {
  res.json({ collections: req.userContext.collections });
});
```

### Next.js API Routes

```typescript
import { NextAuthMiddleware } from './services/auth';

const authMiddleware = new NextAuthMiddleware(authService, rbacService);

// pages/api/profile.ts
export default authMiddleware.withAuth(async (req, res) => {
  const profile = await authService.getUserProfile(req.user.uid);
  res.json({ profile });
});

// pages/api/admin/users.ts
export default authMiddleware.withRole('super_admin', async (req, res) => {
  const users = await authService.listUsers();
  res.json({ users });
});
```

## Role Hierarchy

The RBAC system maintains the exact role hierarchy from the original application:

1. **super_admin**: Full access to all resources
2. **coach**: Access to own content and assigned creators
3. **creator**: Access to assigned coach's content only

### Permission Matrix

| Role | Collections | Videos | User Management |
|------|-------------|--------|-----------------|
| super_admin | Full CRUD | Full CRUD | Full CRUD |
| coach | Own + Assigned | Own + Assigned | Read Assigned |
| creator | Read Assigned | Read Assigned | Read Self |

## User Management Adapter

Implement the `UserManagementAdapter` interface to connect with your user data:

```typescript
class CustomUserManagement implements UserManagementAdapter {
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    // Fetch user from your database
  }

  async getUserAccessibleCoaches(userId: string): Promise<string[]> {
    // Return list of coach IDs this user can access
  }
}
```

## Middleware Options

### Authentication Levels

1. **Required**: `authenticate()` - Must have valid token
2. **Role-based**: `requireRole('admin')` - Must have specific role
3. **Permission-based**: `requirePermission('read', 'collection')` - Must have permission
4. **Optional**: `optionalAuth()` - Adds user if token present

### Session Management

```typescript
const sessionManager = new SessionManager(authService);

// Create session from ID token
const sessionCookie = await sessionManager.createSession(idToken);

// Validate session
const user = await sessionManager.validateSession(sessionCookie);

// Express middleware
app.use(sessionManager.createSessionMiddleware());
```

### Rate Limiting

```typescript
const rateLimiter = new AuthRateLimiter(100, 15 * 60 * 1000); // 100 req/15min

app.use(rateLimiter.createMiddleware());
```

## Configuration

### Environment-based Setup

```typescript
import { ConfigHelper, createAuthServiceFromEnv } from './services/auth';

// Validate environment
const validation = ConfigHelper.validateEnvironment();
if (!validation.valid) {
  throw new Error(`Missing config: ${validation.errors.join(', ')}`);
}

// Create from environment
const authService = createAuthServiceFromEnv();
```

### Manual Configuration

```typescript
const config: AuthConfig = {
  projectId: 'your-project-id',
  privateKey: process.env.FIREBASE_PRIVATE_KEY,
  clientEmail: 'service@project.iam.gserviceaccount.com',
};

const authService = new AuthService(config);
```

## Error Handling

All methods return structured error objects:

```typescript
interface AuthError {
  code: string;
  message: string;
  status: number;
}

const result = await authService.validateToken(token);
if (!result.valid) {
  console.error('Auth failed:', result.error);
  // { code: 'auth/invalid-token', message: '...', status: 401 }
}
```

## Testing

```typescript
import { AuthTestUtils } from './services/auth';

const testUtils = new AuthTestUtils(authService, rbacService);

// Create test user
const testUser = await testUtils.createTestUser('coach');

// Test permissions
const permissions = await testUtils.testPermissions(testUser.uid);

// Cleanup
await testUtils.cleanupTestUser(testUser.uid);
```

## Migration from React App

This service maintains **100% compatibility** with the original React application:

- ✅ Same Firebase configuration format
- ✅ Same token validation logic  
- ✅ Same RBAC business rules
- ✅ Same user profile structure
- ✅ Same role hierarchy (super_admin → coach → creator)
- ✅ Same Firestore query patterns

### Key Differences

- ❌ No React Context or hooks
- ❌ No client-side Firebase SDK
- ✅ Server-side Firebase Admin SDK only
- ✅ Framework-agnostic middleware
- ✅ Standalone service classes

## API Reference

### AuthService Methods

- `initialize()` - Initialize Firebase Admin SDK
- `validateToken(token)` - Validate JWT token
- `getUserProfile(uid)` - Get user profile from Firestore
- `setCustomClaims(uid, claims)` - Set custom claims
- `createSessionCookie(idToken)` - Create session cookie
- `revokeUserTokens(uid)` - Revoke all user tokens

### RBACService Methods

- `getRBACContext(userId)` - Get user's RBAC context
- `hasAccess(userId, type, resourceId)` - Check resource access
- `canPerformAction(userId, action, type)` - Check action permission
- `getUserCollections(userId)` - Get accessible collections
- `getCollectionVideos(userId, collectionId)` - Get accessible videos

## License

MIT - Use in any project, commercial or personal.

## Support

For integration help or custom adaptations, refer to the examples in `examples.ts` or create a GitHub issue.