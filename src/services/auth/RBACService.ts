/**
 * Standalone Role-Based Access Control Service
 * Extracted from React application - no React dependencies
 * Maintains exact business logic and role hierarchy
 */

import { Firestore } from "firebase-admin/firestore";

// Type definitions extracted from original implementation
export interface RBACContext {
  userId: string;
  role: string;
  accessibleCoaches: string[];
  isSuperAdmin: boolean;
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

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  coachId?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  [key: string]: any;
}

export type UserRole = "super_admin" | "coach" | "creator";

export interface UserManagementAdapter {
  getUserProfile(userId: string): Promise<UserProfile | null>;
  getUserAccessibleCoaches(userId: string): Promise<string[]>;
}

export class RBACService {
  private static readonly COLLECTIONS_PATH = "collections";
  private static readonly VIDEOS_PATH = "videos";

  private db: Firestore;
  private userManagement: UserManagementAdapter;

  constructor(db: Firestore, userManagement: UserManagementAdapter) {
    this.db = db;
    this.userManagement = userManagement;
  }

  /**
   * Get RBAC context for a user
   */
  async getRBACContext(userId: string): Promise<RBACContext> {
    const userProfile = await this.userManagement.getUserProfile(userId);
    const accessibleCoaches = await this.userManagement.getUserAccessibleCoaches(userId);

    return {
      userId,
      role: userProfile?.role ?? "creator",
      accessibleCoaches,
      isSuperAdmin: userProfile?.role === "super_admin",
    };
  }

  /**
   * Check if user has access to a specific resource
   */
  async hasAccess(userId: string, resourceType: "collection" | "video", resourceId: string): Promise<boolean> {
    const context = await this.getRBACContext(userId);

    if (context.isSuperAdmin) {
      return true;
    }

    if (context.accessibleCoaches.length === 0) {
      return false;
    }

    // For collections, check if the collection belongs to an accessible coach
    if (resourceType === "collection") {
      const collectionDoc = await this.db
        .collection(RBACService.COLLECTIONS_PATH)
        .where("id", "==", resourceId)
        .where("userId", "in", context.accessibleCoaches)
        .get();
      return !collectionDoc.empty;
    }

    // Check if the video belongs to an accessible coach
    const videoDoc = await this.db
      .collection(RBACService.VIDEOS_PATH)
      .where("id", "==", resourceId)
      .where("userId", "in", context.accessibleCoaches)
      .get();
    return !videoDoc.empty;
  }

  /**
   * Get collections accessible to a user
   */
  async getUserCollections(userId: string): Promise<CollectionAccessResult> {
    try {
      const context = await this.getRBACContext(userId);
      console.log("🔍 [RBAC] User context:", { userId, role: context.role, isSuperAdmin: context.isSuperAdmin });

      if (context.isSuperAdmin) {
        console.log("🔍 [RBAC] Super admin loading all collections");

        // For super admin, get all collections
        const collectionsRef = this.db.collection(RBACService.COLLECTIONS_PATH);
        const querySnapshot = await collectionsRef.orderBy("updatedAt", "desc").get();

        const collections = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: this.formatTimestamp(doc.data().createdAt),
          updatedAt: this.formatTimestamp(doc.data().updatedAt),
        })) as Collection[];

        console.log("✅ [RBAC] Super admin loaded collections:", collections.length);
        return { collections, accessibleCoaches: [] };
      }

      if (context.accessibleCoaches.length === 0) {
        console.log("🔍 [RBAC] No accessible coaches, returning empty");
        return { collections: [], accessibleCoaches: [] };
      }

      const collectionsRef = this.db.collection(RBACService.COLLECTIONS_PATH);
      const querySnapshot = await collectionsRef
        .where("userId", "in", context.accessibleCoaches)
        .orderBy("updatedAt", "desc")
        .get();

      const collections = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: this.formatTimestamp(doc.data().createdAt),
        updatedAt: this.formatTimestamp(doc.data().updatedAt),
      })) as Collection[];

      console.log("✅ [RBAC] Regular user loaded collections:", collections.length);
      return { collections, accessibleCoaches: context.accessibleCoaches };
    } catch (error) {
      console.error("❌ [RBAC] Error fetching collections:", error);
      throw new Error("Failed to fetch collections");
    }
  }

  /**
   * Get videos accessible to a user
   */
  async getCollectionVideos(
    userId: string,
    collectionId?: string,
    videoLimit?: number,
    lastDoc?: any,
  ): Promise<VideoAccessResult> {
    try {
      console.log("🔍 [RBAC] User ID:", userId, "Limit:", videoLimit, "HasCursor:", !!lastDoc);

      const context = await this.getRBACContext(userId);

      if (context.isSuperAdmin) {
        return this.getSuperAdminVideos(userId, collectionId, videoLimit, lastDoc);
      }

      return this.getRegularUserVideos(userId, collectionId, videoLimit, lastDoc, context);
    } catch (error) {
      console.error("❌ [RBAC] Error fetching videos:", error);
      throw new Error("Failed to fetch videos");
    }
  }

  /**
   * Get videos for super admin users
   */
  private async getSuperAdminVideos(
    userId: string,
    collectionId?: string,
    videoLimit?: number,
    lastDoc?: any,
  ): Promise<VideoAccessResult> {
    console.log("🔍 [RBAC] Super admin detected - bypassing coach restrictions");

    let query;
    if (!collectionId || collectionId === "all-videos") {
      console.log("🔍 [RBAC] Super admin loading all videos");
      query = this.db.collection(RBACService.VIDEOS_PATH).orderBy("addedAt", "desc");
    } else {
      try {
        const { collections } = await this.getUserCollections(userId);
        const targetCollection = collections.find((c) => c.id === collectionId);

        if (!targetCollection) {
          console.log("❌ [RBAC] Collection not found:", collectionId);
          return { videos: [], totalCount: 0 };
        }

        query = this.db
          .collection(RBACService.VIDEOS_PATH)
          .where("collectionId", "==", collectionId)
          .where("userId", "==", targetCollection.userId)
          .orderBy("addedAt", "desc");
      } catch (error) {
        console.log("❌ [RBAC] Collection query failed:", error instanceof Error ? error.message : String(error));
        return { videos: [], totalCount: 0 };
      }
    }

    // Apply pagination cursor if provided
    if (lastDoc) {
      query = query.startAfter(lastDoc);
    }

    // Apply limit if specified
    if (videoLimit) {
      query = query.limit(videoLimit);
    }

    const querySnapshot = await query.get();
    let videos = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      addedAt: this.formatTimestamp(doc.data().addedAt),
    })) as Video[];

    // Deduplicate videos for "all-videos" view based on originalUrl
    if (!collectionId || collectionId === "all-videos") {
      videos = this.deduplicateVideosByOriginalUrl(videos);
      console.log("🔄 [RBAC] Deduplicated videos from", querySnapshot.docs.length, "to", videos.length);
    }

    const newLastDoc = querySnapshot.docs.length > 0 ? querySnapshot.docs[querySnapshot.docs.length - 1] : undefined;

    console.log("✅ [RBAC] Super admin loaded videos:", videos.length);
    return { videos, lastDoc: newLastDoc, totalCount: videos.length };
  }

  /**
   * Get videos for regular users (coach/creator)
   */
  private async getRegularUserVideos(
    userId: string,
    collectionId?: string,
    videoLimit?: number,
    lastDoc?: any,
    context?: RBACContext,
  ): Promise<VideoAccessResult> {
    const userContext = context ?? (await this.getRBACContext(userId));
    console.log("🔍 [RBAC] Accessible coaches:", userContext.accessibleCoaches);

    if (userContext.accessibleCoaches.length === 0) {
      console.log("❌ [RBAC] No accessible coaches found - returning empty array");
      return { videos: [], totalCount: 0 };
    }

    let query;
    if (!collectionId || collectionId === "all-videos") {
      console.log("🔍 [RBAC] Regular user loading all accessible videos");
      query = this.db
        .collection(RBACService.VIDEOS_PATH)
        .where("userId", "in", userContext.accessibleCoaches)
        .orderBy("addedAt", "desc");
    } else {
      console.log("🔍 [RBAC] Regular user loading videos from collection:", collectionId);
      const { collections } = await this.getUserCollections(userId);
      const targetCollection = collections.find((c) => c.id === collectionId);

      if (!targetCollection) {
        console.log("❌ [RBAC] Collection not found:", collectionId);
        return { videos: [], totalCount: 0 };
      }

      query = this.db
        .collection(RBACService.VIDEOS_PATH)
        .where("collectionId", "==", collectionId)
        .where("userId", "==", targetCollection.userId)
        .orderBy("addedAt", "desc");
    }

    // Apply pagination cursor if provided
    if (lastDoc) {
      query = query.startAfter(lastDoc);
    }

    // Apply limit if specified
    if (videoLimit) {
      query = query.limit(videoLimit);
    }

    const querySnapshot = await query.get();
    const videos = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      addedAt: this.formatTimestamp(doc.data().addedAt),
    })) as Video[];

    const newLastDoc = querySnapshot.docs.length > 0 ? querySnapshot.docs[querySnapshot.docs.length - 1] : undefined;

    console.log("✅ [RBAC] Regular user loaded videos:", videos.length);
    return { videos, lastDoc: newLastDoc, totalCount: videos.length };
  }

  /**
   * Deduplicate videos by originalUrl, keeping the most recent one
   */
  private deduplicateVideosByOriginalUrl(videos: Video[]): Video[] {
    const urlToVideoMap = new Map<string, Video>();

    // Process videos in order (already sorted by addedAt desc)
    videos.forEach((video) => {
      const originalUrl = video.originalUrl;
      if (!originalUrl) return;

      // Keep the first occurrence (most recent due to sorting)
      if (!urlToVideoMap.has(originalUrl)) {
        urlToVideoMap.set(originalUrl, video);
      }
    });

    return Array.from(urlToVideoMap.values());
  }

  /**
   * Check if user can perform an action on a resource
   */
  async canPerformAction(
    userId: string,
    action: "read" | "write" | "delete",
    resourceType: "collection" | "video" | "user",
    resourceId?: string,
  ): Promise<boolean> {
    const context = await this.getRBACContext(userId);

    // Super admin can do everything
    if (context.isSuperAdmin) {
      return true;
    }

    // Check specific resource access if resourceId is provided
    if (resourceId) {
      return this.hasAccess(userId, resourceType as "collection" | "video", resourceId);
    }

    // For general permissions, check role-based access
    switch (action) {
      case "read":
        return context.accessibleCoaches.length > 0 || context.role === "coach";
      case "write":
        return context.role === "coach" || context.role === "creator";
      case "delete":
        return context.role === "coach";
      default:
        return false;
    }
  }

  /**
   * Get accessible coaches for a user
   */
  async getAccessibleCoaches(userId: string): Promise<string[]> {
    const context = await this.getRBACContext(userId);
    return context.accessibleCoaches;
  }

  /**
   * Check if user is super admin
   */
  async isSuperAdmin(userId: string): Promise<boolean> {
    const context = await this.getRBACContext(userId);
    return context.isSuperAdmin;
  }

  /**
   * Format timestamp for consistent handling
   */
  private formatTimestamp(timestamp: any): Date | string {
    if (!timestamp) return new Date();
    
    // Handle Firestore Timestamp
    if (timestamp.toDate && typeof timestamp.toDate === 'function') {
      return timestamp.toDate();
    }
    
    // Handle regular Date or string
    if (timestamp instanceof Date) {
      return timestamp;
    }
    
    if (typeof timestamp === 'string') {
      return timestamp;
    }
    
    return new Date();
  }

  /**
   * Create a query builder for collections with RBAC applied
   */
  async createCollectionsQuery(userId: string) {
    const context = await this.getRBACContext(userId);
    
    if (context.isSuperAdmin) {
      return this.db.collection(RBACService.COLLECTIONS_PATH);
    }
    
    if (context.accessibleCoaches.length === 0) {
      // Return a query that will return no results
      return this.db.collection(RBACService.COLLECTIONS_PATH).where("userId", "==", "__no_access__");
    }
    
    return this.db.collection(RBACService.COLLECTIONS_PATH).where("userId", "in", context.accessibleCoaches);
  }

  /**
   * Create a query builder for videos with RBAC applied
   */
  async createVideosQuery(userId: string, collectionId?: string) {
    const context = await this.getRBACContext(userId);
    
    let baseQuery = this.db.collection(RBACService.VIDEOS_PATH);
    
    if (context.isSuperAdmin) {
      if (collectionId && collectionId !== "all-videos") {
        baseQuery = baseQuery.where("collectionId", "==", collectionId);
      }
      return baseQuery;
    }
    
    if (context.accessibleCoaches.length === 0) {
      // Return a query that will return no results
      return baseQuery.where("userId", "==", "__no_access__");
    }
    
    if (collectionId && collectionId !== "all-videos") {
      const { collections } = await this.getUserCollections(userId);
      const targetCollection = collections.find((c) => c.id === collectionId);
      
      if (!targetCollection) {
        return baseQuery.where("userId", "==", "__no_access__");
      }
      
      return baseQuery
        .where("collectionId", "==", collectionId)
        .where("userId", "==", targetCollection.userId);
    }
    
    return baseQuery.where("userId", "in", context.accessibleCoaches);
  }

  /**
   * Delete a video and decrement collection counts
   */
  async deleteVideo(userId: string, videoId: string): Promise<void> {
    const context = await this.getRBACContext(userId);

    const videoRef = this.db.collection(RBACService.VIDEOS_PATH).doc(videoId);
    const videoDoc = await videoRef.get();

    if (!videoDoc.exists) {
      throw new Error('Video not found');
    }

    const videoData = videoDoc.data() || {};
    const ownerId = videoData.userId as string | undefined;

    if (!context.isSuperAdmin) {
      const hasOwnership = ownerId === userId;
      const hasCoachAccess = ownerId ? context.accessibleCoaches.includes(ownerId) : false;

      if (!hasOwnership && !hasCoachAccess) {
        throw new Error('Access denied');
      }
    }

    const batch = this.db.batch();
    batch.delete(videoRef);

    const collectionId = videoData.collectionId as string | undefined;
    if (collectionId && collectionId !== 'all-videos') {
      const collectionRef = this.db.collection(RBACService.COLLECTIONS_PATH).doc(collectionId);
      const collectionDoc = await collectionRef.get();

      if (collectionDoc.exists) {
        const currentCount = (collectionDoc.data()?.videoCount ?? 0) as number;
        batch.update(collectionRef, {
          videoCount: Math.max(0, currentCount - 1),
          updatedAt: new Date(),
        });
      }
    }

    await batch.commit();
  }
}

// Factory function for easy instantiation
export function createRBACService(db: Firestore, userManagement: UserManagementAdapter): RBACService {
  return new RBACService(db, userManagement);
}
