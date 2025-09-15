import { getAdminDb } from './firebase-admin';

export class UserManagementAdminService {
  static async getUserProfile(userId: string): Promise<any | null> {
    const db = getAdminDb();
    if (!db) return null;
    try {
      const doc = await db.collection('users').doc(String(userId)).get();
      if (!doc.exists) return null;
      const data = doc.data() || {};
      return {
        uid: userId,
        email: data.email || '',
        displayName: data.name || data.displayName || 'User',
        role: data.role || 'creator',
        coachId: data.coachId,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        ...data,
      };
    } catch (e) {
      console.error('[user-management-admin] getUserProfile error:', e);
      return null;
    }
  }
}

export default UserManagementAdminService;

