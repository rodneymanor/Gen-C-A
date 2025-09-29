/**
 * Collections Service - Extracted Business Logic
 * 
 * This service class contains all collections management business logic extracted from:
 * - src/lib/collections-api-client.ts
 * - src/lib/collections-helpers.ts  
 * - src/lib/collections-rbac.ts
 * - src/lib/collections.ts
 * 
 * Key Features:
 * 1. Collections CRUD operations
 * 2. RBAC integration for collections access
 * 3. Video count management logic
 * 4. Collection metadata handling
 * 5. Data transformation utilities
 * 
 * Migration Notes:
 * - Removed React hooks and component state dependencies
 * - Preserved RBAC access patterns exactly
 * - Maintained Firestore data structures
 * - Created standalone service class for new UI integration
 */

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  writeBatch,
  limit,
  startAfter,
  DocumentSnapshot,
  WriteBatch,
} from "firebase/firestore";

import { db } from "./firebase";
import { UserManagementService } from "./user-management";

// ================================
// TYPE DEFINITIONS & INTERFACES
// ================================

export interface VideoInsights {
  likes: number;
  comments: number;
  shares: number;
  views: number;
  saves: number;
  engagementRate: number;
}

export interface VideoComponents {
  hook: string;
  bridge: string;
  nugget: string;
  wta: string;
}

export interface ContentMetadata {
  platform: string;
  author: string;
  description: string;
  source: string;
  hashtags: string[];
}

export interface Video {
  id?: string;
  originalUrl: string;
  iframeUrl?: string;
  directUrl?: string;
  guid?: string;
  platform: string;
  thumbnailUrl: string;
  previewUrl?: string;
  title: string;
  caption?: string;
  hashtags?: string[];
  transcript?: string;
  components?: VideoComponents;
  visualContext?: string;
  metrics?: {
    likes: number;
    comments: number;
    shares: number;
    views: number;
    saves: number;
  };
  metadata?: {
    originalUrl: string;
    platform: string;
    downloadedAt: string;
    author?: string;
    duration?: number;
    description?: string;
    hashtags?: string[];
  };
  transcriptionStatus?: string;
  userId?: string;
  collectionId?: string;
  addedAt: string;
  fileSize?: number;
  duration?: number;
  favorite?: boolean;
}

export interface Collection {
  id?: string;
  title: string;
  description: string;
  userId: string;
  videoCount: number;
  favorite?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CollectionsApiResponse {
  success: boolean;
  collections: Collection[];
  accessibleCoaches: string[];
  total: number;
  timestamp: string;
  user: {
    id: string;
    email: string;
    displayName?: string;
    role: string;
  };
}

export interface VideosApiResponse {
  success: boolean;
  videos: Video[];
  lastDoc: { id: string } | null;
  totalCount: number;
  timestamp: string;
  user: {
    id: string;
    email: string;
    displayName?: string;
    role: string;
  };
}

export interface VideoCollectionResult {
  success: boolean;
  videoId?: string;
  message: string;
  error?: string;
  fallbackUsed?: boolean;
}

export interface VideoProcessingData {
  originalUrl: string;
  platform: string;
  addedAt: string;
  processing?: {
    scrapeAttempted: boolean;
    transcriptAttempted: boolean;
    components: VideoComponents;
  };
  metrics?: {
    views: number;
    likes: number;
    comments: number;
    saves: number;
  };
}

// ================================
// CONSTANTS & CONFIGURATION
// ================================

export const COLLECTION_LIMITS = {
  MAX_TITLE_LENGTH: 80,
  MAX_DESCRIPTION_LENGTH: 500,
} as const;

// ================================
// MAIN SERVICE CLASS
// ================================

export class CollectionsService {
  private static readonly COLLECTIONS_PATH = "collections";
  private static readonly VIDEOS_PATH = "videos";

  // ================================
  // DATA TRANSFORMATION UTILITIES
  // ================================

  /**
   * Helper to format timestamps consistently
   */
  static formatTimestamp(timestamp: Record<string, unknown> | string): string {
    if (typeof timestamp === "string") {
      return timestamp;
    }

    const timestampWithToDate = timestamp as { toDate?: () => Date };
    return timestampWithToDate.toDate ? timestampWithToDate.toDate().toISOString() : String(timestamp);
  }

  /**
   * Deduplicate videos by originalUrl, keeping the most recent one
   */
  private static deduplicateVideosByOriginalUrl(videos: Video[]): Video[] {
    const urlToVideoMap = new Map<string, Video>();

    videos.forEach((video) => {
      const originalUrl = video.originalUrl;
      if (!originalUrl) return;

      if (!urlToVideoMap.has(originalUrl)) {
        urlToVideoMap.set(originalUrl, video);
      }
    });

    return Array.from(urlToVideoMap.values());
  }

  /**
   * Validate video URL format
   */
  static validateVideoUrl(url: string): { isValid: boolean; platform?: string } {
    if (!url || typeof url !== "string") {
      return { isValid: false };
    }

    const urlLower = url.toLowerCase();

    if (urlLower.includes("tiktok.com")) {
      return { isValid: true, platform: "TikTok" };
    }

    if (urlLower.includes("instagram.com") && (urlLower.includes("/reel/") || urlLower.includes("/p/"))) {
      return { isValid: true, platform: "Instagram" };
    }

    return { isValid: false };
  }

  /**
   * Validate platform URL
   */
  static validatePlatformUrl(url: string): { isValid: boolean; platform?: string; error?: string } {
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname.toLowerCase();

      if (hostname.includes("tiktok.com")) {
        return { isValid: true, platform: "tiktok" };
      }

      if (hostname.includes("instagram.com")) {
        return { isValid: true, platform: "instagram" };
      }

      if (hostname.includes("youtube.com") || hostname.includes("youtu.be")) {
        return { isValid: true, platform: "youtube" };
      }

      return {
        isValid: false,
        error: "Only TikTok, Instagram, and YouTube videos are currently supported",
      };
    } catch {
      return {
        isValid: false,
        error: "Invalid URL format",
      };
    }
  }

  // ================================
  // OWNERSHIP & ACCESS VERIFICATION
  // ================================

  /**
   * Verify collection ownership
   */
  static async verifyCollectionOwnership(
    userId: string,
    collectionId: string,
  ): Promise<{ exists: boolean; data?: Record<string, unknown> }> {
    if (!collectionId || collectionId.trim() === "" || collectionId === "all-videos") {
      return { exists: false };
    }

    const docRef = doc(db, this.COLLECTIONS_PATH, collectionId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return { exists: false };
    }

    const data = docSnap.data();
    if (data.userId !== userId) {
      throw new Error("Access denied");
    }

    return { exists: true, data };
  }

  /**
   * Verify video ownership
   */
  static async verifyVideoOwnership(
    userId: string,
    videoId: string,
  ): Promise<{ exists: boolean; data?: Record<string, unknown> }> {
    const docRef = doc(db, this.VIDEOS_PATH, videoId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return { exists: false };
    }

    const data = docSnap.data();
    if (data.userId !== userId) {
      throw new Error("Access denied");
    }

    return { exists: true, data };
  }

  // ================================
  // COLLECTION MANAGEMENT
  // ================================

  /**
   * Update collection video count
   */
  static async updateCollectionVideoCount(
    batch: WriteBatch,
    collectionId: string,
    userId: string,
    increment: number,
  ): Promise<void> {
    if (collectionId === "all-videos") {
      return;
    }

    const collectionRef = doc(db, this.COLLECTIONS_PATH, collectionId);
    const collectionSnap = await getDoc(collectionRef);

    if (collectionSnap.exists() && collectionSnap.data().userId === userId) {
      const currentCount = collectionSnap.data().videoCount ?? 0;
      batch.update(collectionRef, {
        videoCount: Math.max(0, currentCount + increment),
        updatedAt: serverTimestamp(),
      });
    }
  }

  /**
   * Delete videos in a collection
   */
  static async deleteCollectionVideos(batch: WriteBatch, userId: string, collectionId: string): Promise<void> {
    const videosQuery = query(
      collection(db, this.VIDEOS_PATH),
      where("userId", "==", userId),
      where("collectionId", "==", collectionId),
    );

    const videosSnapshot = await getDocs(videosQuery);
    videosSnapshot.docs.forEach((videoDoc) => {
      batch.delete(videoDoc.ref);
    });
  }

  /**
   * Create a new collection
   */
  static async createCollection(userId: string, title: string, description: string = ""): Promise<string> {
    try {
      const collectionData: Omit<Collection, "id"> = {
        title: title.trim(),
        description: description.trim(),
        userId,
        videoCount: 0,
        favorite: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const docRef = await addDoc(collection(db, this.COLLECTIONS_PATH), {
        ...collectionData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      return docRef.id;
    } catch (error) {
      console.error("Error creating collection:", error);
      throw new Error("Failed to create collection");
    }
  }

  /**
   * Get a specific collection by ID
   */
  static async getCollection(userId: string, collectionId: string): Promise<Collection | null> {
    try {
      const ownership = await this.verifyCollectionOwnership(userId, collectionId);
      if (!ownership.exists) {
        return null;
      }

      return {
        id: collectionId,
        ...ownership.data,
        createdAt: this.formatTimestamp(ownership.data!.createdAt),
        updatedAt: this.formatTimestamp(ownership.data!.updatedAt),
      } as Collection;
    } catch (error) {
      console.error("Error fetching collection:", error);
      throw new Error("Failed to fetch collection");
    }
  }

  /**
   * Update a collection
   */
  static async updateCollection(userId: string, collectionId: string, updates: Partial<Collection>): Promise<void> {
    try {
      await this.verifyCollectionOwnership(userId, collectionId);
      const docRef = doc(db, this.COLLECTIONS_PATH, collectionId);

      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error updating collection:", error);
      throw new Error("Failed to update collection");
    }
  }

  /**
   * Toggle favorite flag on a collection
   */
  static async setFavorite(userId: string, collectionId: string, favorite: boolean): Promise<void> {
    return this.updateCollection(userId, collectionId, { favorite, updatedAt: new Date().toISOString() });
  }

  /**
   * Delete a collection and all its videos
   */
  static async deleteCollection(userId: string, collectionId: string): Promise<void> {
    try {
      const batch = writeBatch(db);

      await this.verifyCollectionOwnership(userId, collectionId);
      await this.deleteCollectionVideos(batch, userId, collectionId);

      const collectionRef = doc(db, this.COLLECTIONS_PATH, collectionId);
      batch.delete(collectionRef);

      await batch.commit();
    } catch (error) {
      console.error("Error deleting collection:", error);
      throw new Error("Failed to delete collection");
    }
  }

  // ================================
  // RBAC INTEGRATION PATTERNS
  // ================================

  /**
   * Get all collections for a user (RBAC-enabled)
   */
  static async getUserCollections(userId: string): Promise<Collection[]> {
    try {
      const userProfile = await UserManagementService.getUserProfile(userId);
      if (userProfile?.role === "super_admin") {
        console.log("🔍 [RBAC] Super admin loading all collections");

        const q = query(collection(db, this.COLLECTIONS_PATH), orderBy("updatedAt", "desc"));
        const querySnapshot = await getDocs(q);
        
        const collections = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: this.formatTimestamp(doc.data().createdAt),
          updatedAt: this.formatTimestamp(doc.data().updatedAt),
        })) as Collection[];

        console.log("✅ [RBAC] Super admin loaded collections:", collections.length);
        return collections;
      }

      const accessibleCoaches = await UserManagementService.getUserAccessibleCoaches(userId);

      if (accessibleCoaches.length === 0) {
        return [];
      }

      const q = query(
        collection(db, this.COLLECTIONS_PATH),
        where("userId", "in", accessibleCoaches),
        orderBy("updatedAt", "desc"),
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: this.formatTimestamp(doc.data().createdAt),
        updatedAt: this.formatTimestamp(doc.data().updatedAt),
      })) as Collection[];
    } catch (error) {
      console.error("Error fetching collections:", error);
      throw new Error("Failed to fetch collections");
    }
  }

  /**
   * Get videos from a collection or all videos (RBAC-enabled)
   */
  static async getCollectionVideos(
    userId: string,
    collectionId?: string,
    videoLimit?: number,
    lastDoc?: DocumentSnapshot,
  ): Promise<{ videos: Video[]; lastDoc?: DocumentSnapshot }> {
    try {
      console.log("🔍 [RBAC] User ID:", userId, "Limit:", videoLimit, "HasCursor:", !!lastDoc);

      const userProfile = await UserManagementService.getUserProfile(userId);
      if (userProfile?.role === "super_admin") {
        return this.getSuperAdminVideos(userId, collectionId, videoLimit, lastDoc);
      }

      return this.getRegularUserVideos(userId, collectionId, videoLimit, lastDoc);
    } catch (error) {
      console.error("Error fetching videos:", error);
      throw new Error("Failed to fetch videos");
    }
  }

  /**
   * Get videos for super admin users
   */
  private static async getSuperAdminVideos(
    userId: string,
    collectionId?: string,
    videoLimit?: number,
    lastDoc?: DocumentSnapshot,
  ): Promise<{ videos: Video[]; lastDoc?: DocumentSnapshot }> {
    console.log("🔍 [RBAC] Super admin detected - bypassing coach restrictions");

    let q;
    if (!collectionId || collectionId === "all-videos") {
      console.log("🔍 [RBAC] Super admin loading all videos");
      q = query(collection(db, this.VIDEOS_PATH), orderBy("addedAt", "desc"));
    } else {
      try {
        q = await this.getSuperAdminCollectionQuery(userId, collectionId);
      } catch (error) {
        console.log("❌ [RBAC] Collection query failed:", error instanceof Error ? error.message : String(error));
        return { videos: [] };
      }
    }

    if (lastDoc) {
      q = query(q, startAfter(lastDoc));
    }

    if (videoLimit) {
      q = query(q, limit(videoLimit));
    }

    const querySnapshot = await getDocs(q);
    let videos = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      addedAt: this.formatTimestamp(doc.data().addedAt),
    })) as Video[];

    if (!collectionId || collectionId === "all-videos") {
      videos = this.deduplicateVideosByOriginalUrl(videos);
      console.log("🔄 [RBAC] Deduplicated videos from", querySnapshot.docs.length, "to", videos.length);
    }

    const newLastDoc = querySnapshot.docs.length > 0 ? querySnapshot.docs[querySnapshot.docs.length - 1] : undefined;

    console.log("✅ [RBAC] Super admin loaded videos:", videos.length);
    return { videos, lastDoc: newLastDoc };
  }

  /**
   * Get collection query for super admin
   */
  private static async getSuperAdminCollectionQuery(userId: string, collectionId: string) {
    console.log("🔍 [RBAC] Super admin loading videos from collection:", collectionId);
    const collections = await this.getUserCollections(userId);
    const targetCollection = collections.find((c) => c.id === collectionId);

    if (!targetCollection) {
      console.log("❌ [RBAC] Collection not found:", collectionId);
      throw new Error(`Collection not found: ${collectionId}`);
    }

    return query(
      collection(db, this.VIDEOS_PATH),
      where("collectionId", "==", collectionId),
      where("userId", "==", targetCollection.userId),
      orderBy("addedAt", "desc"),
    );
  }

  /**
   * Get videos for regular users (coach/creator)
   */
  private static async getRegularUserVideos(
    userId: string,
    collectionId?: string,
    videoLimit?: number,
    lastDoc?: DocumentSnapshot,
  ): Promise<{ videos: Video[]; lastDoc?: DocumentSnapshot }> {
    const accessibleCoaches = await UserManagementService.getUserAccessibleCoaches(userId);
    console.log("🔍 [RBAC] Accessible coaches:", accessibleCoaches);

    if (accessibleCoaches.length === 0) {
      console.log("❌ [RBAC] No accessible coaches found - returning empty array");
      return { videos: [] };
    }

    let q = await this.getRegularUserQuery(userId, collectionId, accessibleCoaches);

    if (lastDoc) {
      q = query(q, startAfter(lastDoc));
    }

    if (videoLimit) {
      q = query(q, limit(videoLimit));
    }

    const querySnapshot = await getDocs(q);
    let videos = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      addedAt: this.formatTimestamp(doc.data().addedAt),
    })) as Video[];

    if (!collectionId || collectionId === "all-videos") {
      videos = this.deduplicateVideosByOriginalUrl(videos);
      console.log("🔄 [RBAC] Deduplicated videos from", querySnapshot.docs.length, "to", videos.length);
    }

    const newLastDoc = querySnapshot.docs.length > 0 ? querySnapshot.docs[querySnapshot.docs.length - 1] : undefined;

    return { videos, lastDoc: newLastDoc };
  }

  /**
   * Get query for regular users
   */
  private static async getRegularUserQuery(
    userId: string,
    collectionId: string | undefined,
    accessibleCoaches: string[],
  ) {
    if (!collectionId || collectionId === "all-videos") {
      return query(
        collection(db, this.VIDEOS_PATH),
        where("userId", "in", accessibleCoaches),
        orderBy("addedAt", "desc"),
      );
    }

    const collections = await this.getUserCollections(userId);
    const hasAccess = collections.some((c) => c.id === collectionId);

    if (!hasAccess) {
      throw new Error("Access denied to collection");
    }

    return query(
      collection(db, this.VIDEOS_PATH),
      where("collectionId", "==", collectionId),
      where("userId", "in", accessibleCoaches),
      orderBy("addedAt", "desc"),
    );
  }

  // ================================
  // VIDEO MANAGEMENT
  // ================================

  /**
   * Add a video to a collection (or all-videos)
   */
  static async addVideoToCollection(userId: string, collectionId: string, video: Omit<Video, "id">): Promise<string> {
    try {
      const batch = writeBatch(db);

      const normalizedCollectionId = !collectionId || collectionId.trim() === "" ? "all-videos" : collectionId;

      const videoRef = doc(collection(db, this.VIDEOS_PATH));
      const videoData = {
        ...video,
        userId,
        collectionId: normalizedCollectionId,
        addedAt: serverTimestamp(),
      };

      batch.set(videoRef, videoData);

      if (normalizedCollectionId !== "all-videos") {
        await this.verifyCollectionOwnership(userId, normalizedCollectionId);
        await this.updateCollectionVideoCount(batch, normalizedCollectionId, userId, 1);
      }

      await batch.commit();
      return videoRef.id;
    } catch (error) {
      console.error("Error adding video to collection:", error);
      throw new Error("Failed to add video to collection");
    }
  }

  /**
   * Get a specific video by ID
   */
  static async getVideo(userId: string, videoId: string): Promise<Video | null> {
    try {
      const ownership = await this.verifyVideoOwnership(userId, videoId);
      if (!ownership.exists) {
        return null;
      }

      return {
        id: videoId,
        ...ownership.data,
        addedAt: this.formatTimestamp(ownership.data!.addedAt),
      } as Video;
    } catch (error) {
      console.error("Error fetching video:", error);
      throw new Error("Failed to fetch video");
    }
  }

  /**
   * Update a video
   */
  static async updateVideo(userId: string, videoId: string, updates: Partial<Video>): Promise<void> {
    try {
      await this.verifyVideoOwnership(userId, videoId);
      const docRef = doc(db, this.VIDEOS_PATH, videoId);
      await updateDoc(docRef, updates);
    } catch (error) {
      console.error("Error updating video:", error);
      throw new Error("Failed to update video");
    }
  }

  /**
   * Delete a video from a collection
   */
  static async deleteVideo(userId: string, videoId: string): Promise<void> {
    try {
      const batch = writeBatch(db);
      const ownership = await this.verifyVideoOwnership(userId, videoId);

      if (!ownership.exists) {
        throw new Error("Video not found");
      }

      const videoRef = doc(db, this.VIDEOS_PATH, videoId);
      batch.delete(videoRef);

      const collectionId = ownership.data!.collectionId;
      await this.updateCollectionVideoCount(batch, collectionId as string, userId, -1);

      await batch.commit();
    } catch (error) {
      console.error("Error deleting video:", error);
      throw new Error("Failed to delete video");
    }
  }

  /**
   * Move a video between collections
   */
  static async moveVideo(userId: string, videoId: string, newCollectionId: string): Promise<void> {
    try {
      const batch = writeBatch(db);
      const ownership = await this.verifyVideoOwnership(userId, videoId);

      if (!ownership.exists) {
        throw new Error("Video not found");
      }

      const oldCollectionId = ownership.data!.collectionId as string;

      const videoRef = doc(db, this.VIDEOS_PATH, videoId);
      batch.update(videoRef, {
        collectionId: newCollectionId === "all-videos" ? "all-videos" : newCollectionId,
      });

      await this.updateCollectionVideoCount(batch, oldCollectionId, userId, -1);

      if (newCollectionId !== "all-videos") {
        await this.verifyCollectionOwnership(userId, newCollectionId);
        await this.updateCollectionVideoCount(batch, newCollectionId, userId, 1);
      }

      await batch.commit();
    } catch (error) {
      console.error("Error moving video:", error);
      throw new Error("Failed to move video");
    }
  }

  /**
   * Copy a video to another collection
   */
  static async copyVideo(userId: string, videoId: string, targetCollectionId: string): Promise<string> {
    try {
      const ownership = await this.verifyVideoOwnership(userId, videoId);
      if (!ownership.exists || !ownership.data) {
        throw new Error("Video not found");
      }

      const videoData = ownership.data as Video;

      if (targetCollectionId !== "all-videos") {
        await this.verifyCollectionOwnership(userId, targetCollectionId);
      }

      const batch = writeBatch(db);
      const newVideoRef = doc(collection(db, this.VIDEOS_PATH));

      batch.set(newVideoRef, {
        ...videoData,
        collectionId: targetCollectionId === "all-videos" ? "all-videos" : targetCollectionId,
        addedAt: serverTimestamp(),
      });

      await this.updateCollectionVideoCount(batch, targetCollectionId, userId, 1);

      await batch.commit();

      return newVideoRef.id;
    } catch (error) {
      console.error("Error copying video:", error);
      throw new Error("Failed to copy video");
    }
  }

  /**
   * Toggle favorite flag on a video
   */
  static async setVideoFavorite(userId: string, videoId: string, favorite: boolean): Promise<void> {
    try {
      await this.updateVideo(userId, videoId, { favorite });
    } catch (error) {
      console.error("Error toggling video favorite:", error);
      throw new Error("Failed to update video favorite status");
    }
  }

  // ================================
  // UTILITY & STATISTICS METHODS
  // ================================

  /**
   * Get total video count for user (across all collections)
   */
  static async getTotalVideoCount(userId: string): Promise<number> {
    try {
      const q = query(collection(db, this.VIDEOS_PATH), where("userId", "==", userId));
      const querySnapshot = await getDocs(q);
      return querySnapshot.size;
    } catch (error) {
      console.error("Error getting total video count:", error);
      return 0;
    }
  }

  /**
   * Create video processing data from URL
   */
  static createVideoDataFromUrl(url: string): VideoProcessingData {
    const validation = this.validatePlatformUrl(url);

    return {
      originalUrl: url,
      platform: validation.platform ?? "unknown",
      addedAt: new Date().toISOString(),
      processing: {
        scrapeAttempted: false,
        transcriptAttempted: false,
        components: {
          hook: "",
          bridge: "",
          nugget: "",
          wta: "",
        },
      },
      metrics: {
        views: 0,
        likes: 0,
        comments: 0,
        saves: 0,
      },
    };
  }

  /**
   * Validate video data for processing
   */
  static validateVideoData(videoData: VideoProcessingData): { isValid: boolean; error?: string } {
    if (!videoData.originalUrl) {
      return { isValid: false, error: "Video URL is required" };
    }

    try {
      new URL(videoData.originalUrl);
    } catch {
      return { isValid: false, error: "Invalid video URL format" };
    }

    if (!videoData.platform) {
      return { isValid: false, error: "Platform is required" };
    }

    const supportedPlatforms = ["TikTok", "Instagram", "tiktok", "instagram", "youtube", "unknown"];
    if (!supportedPlatforms.includes(videoData.platform)) {
      return { isValid: false, error: "Unsupported platform" };
    }

    return { isValid: true };
  }

  // ================================
  // API CLIENT METHODS (Token-based)
  // ================================

  /**
   * Get user collections with RBAC (token-based authentication)
   */
  static async getUserCollectionsWithToken(firebaseToken?: string): Promise<CollectionsApiResponse> {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (firebaseToken) headers["Authorization"] = `Bearer ${firebaseToken}`;
    const { createApiClient } = await import("@/api/client");
    const client = createApiClient("");
    const { data, error } = await client.GET("/api/collections", { headers });
    if (error) throw new Error("Failed to fetch collections");
    const collections = Array.isArray(data?.collections) ? (data?.collections as any[]) : [];
    return {
      success: true,
      collections,
      accessibleCoaches: [],
      total: collections.length,
      timestamp: new Date().toISOString(),
      user: { id: "", email: "", role: "user" },
    } as CollectionsApiResponse;
  }

  /**
   * Get collection videos with RBAC (token-based authentication)
   */
  static async getCollectionVideosWithToken(
    collectionId?: string,
    limit: number = 24,
    lastDocId?: string,
    firebaseToken?: string,
  ): Promise<VideosApiResponse> {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (firebaseToken) headers["Authorization"] = `Bearer ${firebaseToken}`;
    const { createApiClient } = await import("@/api/client");
    const client = createApiClient("");
    const { data, error } = await client.POST("/api/videos/collection", {
      headers,
      body: {
        collectionId: collectionId || undefined,
        videoLimit: limit,
        lastDocId: lastDocId || undefined,
      },
    });
    if (error) throw new Error("Failed to fetch videos");
    return (data || { success: true, videos: [], totalCount: 0 });
  }

  /**
   * Add video to collection using API endpoint (token-based)
   */
  static async addVideoToCollectionViaApi(
    userId: string,
    collectionId: string,
    videoData: VideoProcessingData,
  ): Promise<VideoCollectionResult> {
    try {
      const validation = this.validateVideoData(videoData);
      if (!validation.isValid) {
        return {
          success: false,
          message: validation.error ?? "Invalid video data",
          error: validation.error,
        };
      }

      const { createApiClient } = await import("@/api/client");
      const client = createApiClient("");
      const { data, error } = await client.POST("/api/videos/add-to-collection", {
        body: { userId, collectionId, videoData },
        headers: { "Content-Type": "application/json" },
      });
      if (error) {
        return { success: false, message: "Failed to add video to collection", error: (error as any)?.error } as any;
      }
      return data as any;
    } catch (error) {
      console.error("❌ [VIDEO_COLLECTION] Unexpected error:", error);
      return {
        success: false,
        message: "Failed to add video to collection",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}

// ================================
// LEGACY COMPATIBILITY LAYER
// ================================

/**
 * Legacy CollectionsApiClient for backward compatibility
 * @deprecated Use CollectionsService.getUserCollectionsWithToken instead
 */
export class CollectionsApiClient {
  private static readonly BASE_URL = "/api/collections";

  static async getUserCollections(firebaseToken?: string): Promise<CollectionsApiResponse> {
    return CollectionsService.getUserCollectionsWithToken(firebaseToken);
  }

  static async getCollectionVideos(
    collectionId?: string,
    limit: number = 24,
    lastDocId?: string,
    firebaseToken?: string,
  ): Promise<VideosApiResponse> {
    return CollectionsService.getCollectionVideosWithToken(collectionId, limit, lastDocId, firebaseToken);
  }
}

/**
 * Legacy VideoCollectionService for backward compatibility
 * @deprecated Use CollectionsService.addVideoToCollectionViaApi instead
 */
export class VideoCollectionService {
  static async addVideoToCollection(
    userId: string,
    collectionId: string,
    videoData: VideoProcessingData,
  ): Promise<VideoCollectionResult> {
    return CollectionsService.addVideoToCollectionViaApi(userId, collectionId, videoData);
  }

  static validatePlatformUrl(url: string): { isValid: boolean; platform?: string; error?: string } {
    return CollectionsService.validatePlatformUrl(url);
  }

  static createVideoDataFromUrl(url: string): VideoProcessingData {
    return CollectionsService.createVideoDataFromUrl(url);
  }
}

// Re-export types for convenience
export type { Video as VideoType, Collection as CollectionType };
