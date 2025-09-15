import { getAdminDb } from './firebase-admin';

export class CollectionsRBACAdminService {
  static async getCollection(collectionId: string): Promise<any | null> {
    const db = getAdminDb();
    if (!db) return null;
    try {
      const doc = await db.collection('collections').doc(String(collectionId)).get();
      if (!doc.exists) return null;
      return { id: doc.id, ...doc.data() };
    } catch (e) {
      console.error('[collections-rbac-admin] getCollection error:', e);
      return null;
    }
  }

  static async deleteCollection(collectionId: string): Promise<void> {
    const db = getAdminDb();
    if (!db) throw new Error('Database not available');
    try {
      await db.collection('collections').doc(String(collectionId)).delete();
    } catch (e) {
      console.error('[collections-rbac-admin] deleteCollection error:', e);
      throw e;
    }
  }
}

export default CollectionsRBACAdminService;

