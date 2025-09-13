/**
 * Collections Service Interface for New UI Integration
 * 
 * This file provides the interface patterns and integration examples for using
 * the extracted CollectionsService with new UI components.
 * 
 * Key Integration Patterns:
 * 1. Service interface definitions
 * 2. UI adapter patterns
 * 3. State management integration
 * 4. Error handling patterns
 * 5. Loading state management
 */

import { CollectionsService, type Collection, type Video, type VideoProcessingData } from "./collections-service";

// ================================
// UI ADAPTER INTERFACES
// ================================

export interface CollectionsUIAdapter {
  // Collection Management
  createCollection(userId: string, title: string, description?: string): Promise<string>;
  updateCollection(userId: string, collectionId: string, updates: Partial<Collection>): Promise<void>;
  deleteCollection(userId: string, collectionId: string): Promise<void>;
  toggleCollectionFavorite(userId: string, collectionId: string, favorite: boolean): Promise<void>;

  // Video Management
  addVideoToCollection(userId: string, collectionId: string, video: Omit<Video, "id">): Promise<string>;
  moveVideo(userId: string, videoId: string, newCollectionId: string): Promise<void>;
  deleteVideo(userId: string, videoId: string): Promise<void>;
  toggleVideoFavorite(userId: string, videoId: string, favorite: boolean): Promise<void>;

  // Data Fetching (RBAC-enabled)
  getUserCollections(userId: string): Promise<Collection[]>;
  getCollectionVideos(userId: string, collectionId?: string, limit?: number): Promise<{ videos: Video[]; hasMore: boolean }>;

  // Validation & Utilities
  validateVideoUrl(url: string): { isValid: boolean; platform?: string };
  formatTimestamp(timestamp: unknown): string;
}

export interface CollectionsUIState {
  collections: Collection[];
  videos: Video[];
  selectedCollectionId?: string;
  isLoading: boolean;
  error?: string;
  hasMoreVideos: boolean;
  lastDocId?: string;
}

export interface CollectionsUIActions {
  loadCollections(): Promise<void>;
  loadVideos(collectionId?: string, loadMore?: boolean): Promise<void>;
  createCollection(title: string, description?: string): Promise<void>;
  updateCollection(collectionId: string, updates: Partial<Collection>): Promise<void>;
  deleteCollection(collectionId: string): Promise<void>;
  addVideo(collectionId: string, videoUrl: string): Promise<void>;
  moveVideo(videoId: string, newCollectionId: string): Promise<void>;
  deleteVideo(videoId: string): Promise<void>;
  setError(error?: string): void;
  clearError(): void;
}

// ================================
// CONCRETE UI ADAPTER IMPLEMENTATION
// ================================

export class CollectionsUIAdapterImpl implements CollectionsUIAdapter {
  constructor(private userId: string) {}

  // Collection Management Methods
  async createCollection(userId: string, title: string, description?: string): Promise<string> {
    return CollectionsService.createCollection(userId, title, description || "");
  }

  async updateCollection(userId: string, collectionId: string, updates: Partial<Collection>): Promise<void> {
    return CollectionsService.updateCollection(userId, collectionId, updates);
  }

  async deleteCollection(userId: string, collectionId: string): Promise<void> {
    return CollectionsService.deleteCollection(userId, collectionId);
  }

  async toggleCollectionFavorite(userId: string, collectionId: string, favorite: boolean): Promise<void> {
    return CollectionsService.setFavorite(userId, collectionId, favorite);
  }

  // Video Management Methods
  async addVideoToCollection(userId: string, collectionId: string, video: Omit<Video, "id">): Promise<string> {
    return CollectionsService.addVideoToCollection(userId, collectionId, video);
  }

  async moveVideo(userId: string, videoId: string, newCollectionId: string): Promise<void> {
    return CollectionsService.moveVideo(userId, videoId, newCollectionId);
  }

  async deleteVideo(userId: string, videoId: string): Promise<void> {
    return CollectionsService.deleteVideo(userId, videoId);
  }

  async toggleVideoFavorite(userId: string, videoId: string, favorite: boolean): Promise<void> {
    return CollectionsService.setVideoFavorite(userId, videoId, favorite);
  }

  // Data Fetching Methods (RBAC-enabled)
  async getUserCollections(userId: string): Promise<Collection[]> {
    return CollectionsService.getUserCollections(userId);
  }

  async getCollectionVideos(
    userId: string,
    collectionId?: string,
    limit?: number,
  ): Promise<{ videos: Video[]; hasMore: boolean }> {
    const result = await CollectionsService.getCollectionVideos(userId, collectionId, limit);
    return {
      videos: result.videos,
      hasMore: !!result.lastDoc,
    };
  }

  // Validation & Utility Methods
  validateVideoUrl(url: string): { isValid: boolean; platform?: string } {
    return CollectionsService.validateVideoUrl(url);
  }

  formatTimestamp(timestamp: unknown): string {
    return CollectionsService.formatTimestamp(timestamp as any);
  }
}

// ================================
// REACT INTEGRATION PATTERNS
// ================================

/**
 * React Hook Pattern for Collections Management
 * 
 * Usage Example:
 * ```typescript
 * const {
 *   state,
 *   actions,
 *   adapter
 * } = useCollectionsService(userId);
 * ```
 */
export interface UseCollectionsServiceReturn {
  state: CollectionsUIState;
  actions: CollectionsUIActions;
  adapter: CollectionsUIAdapter;
}

/**
 * Hook Implementation Pattern
 */
export function createCollectionsServiceHook(userId: string) {
  const adapter = new CollectionsUIAdapterImpl(userId);

  // Initial state
  const initialState: CollectionsUIState = {
    collections: [],
    videos: [],
    selectedCollectionId: undefined,
    isLoading: false,
    error: undefined,
    hasMoreVideos: false,
    lastDocId: undefined,
  };

  // Action implementations (to be implemented in actual React hook)
  const actionPatterns: CollectionsUIActions = {
    async loadCollections() {
      // Implementation:
      // 1. Set loading state
      // 2. Call adapter.getUserCollections(userId)
      // 3. Update collections state
      // 4. Handle errors
      // 5. Clear loading state
      throw new Error("Implement in actual React hook");
    },

    async loadVideos(collectionId?: string, loadMore?: boolean) {
      // Implementation:
      // 1. Set loading state (or loadingMore if loadMore)
      // 2. Call adapter.getCollectionVideos(userId, collectionId, limit)
      // 3. Update videos state (append if loadMore, replace otherwise)
      // 4. Update hasMoreVideos and lastDocId
      // 5. Handle errors
      // 6. Clear loading state
      throw new Error("Implement in actual React hook");
    },

    async createCollection(title: string, description?: string) {
      // Implementation:
      // 1. Validate input
      // 2. Call adapter.createCollection(userId, title, description)
      // 3. Refresh collections list
      // 4. Handle success/error states
      throw new Error("Implement in actual React hook");
    },

    async updateCollection(collectionId: string, updates: Partial<Collection>) {
      // Implementation:
      // 1. Call adapter.updateCollection(userId, collectionId, updates)
      // 2. Update local state optimistically or refresh
      // 3. Handle errors
      throw new Error("Implement in actual React hook");
    },

    async deleteCollection(collectionId: string) {
      // Implementation:
      // 1. Confirm deletion
      // 2. Call adapter.deleteCollection(userId, collectionId)
      // 3. Remove from local state
      // 4. Handle errors
      throw new Error("Implement in actual React hook");
    },

    async addVideo(collectionId: string, videoUrl: string) {
      // Implementation:
      // 1. Validate URL using adapter.validateVideoUrl()
      // 2. Create video object from URL
      // 3. Call adapter.addVideoToCollection()
      // 4. Refresh videos if current collection
      // 5. Handle success/error states
      throw new Error("Implement in actual React hook");
    },

    async moveVideo(videoId: string, newCollectionId: string) {
      // Implementation:
      // 1. Call adapter.moveVideo(userId, videoId, newCollectionId)
      // 2. Update local state optimistically
      // 3. Handle errors and revert on failure
      throw new Error("Implement in actual React hook");
    },

    async deleteVideo(videoId: string) {
      // Implementation:
      // 1. Confirm deletion
      // 2. Call adapter.deleteVideo(userId, videoId)
      // 3. Remove from local state
      // 4. Handle errors
      throw new Error("Implement in actual React hook");
    },

    setError(error?: string) {
      // Implementation: Update error state
      throw new Error("Implement in actual React hook");
    },

    clearError() {
      // Implementation: Clear error state
      throw new Error("Implement in actual React hook");
    },
  };

  return {
    initialState,
    actionPatterns,
    adapter,
  };
}

// ================================
// ERROR HANDLING PATTERNS
// ================================

export interface CollectionsError {
  type: "network" | "validation" | "permission" | "not_found" | "unknown";
  message: string;
  code?: string;
  details?: unknown;
}

export function handleCollectionsError(error: unknown): CollectionsError {
  if (error instanceof Error) {
    // Map known error messages to types
    if (error.message.includes("Access denied")) {
      return {
        type: "permission",
        message: "You don't have permission to access this resource",
        details: error.message,
      };
    }

    if (error.message.includes("not found") || error.message.includes("Not found")) {
      return {
        type: "not_found",
        message: "The requested resource was not found",
        details: error.message,
      };
    }

    if (error.message.includes("Invalid") || error.message.includes("validation")) {
      return {
        type: "validation",
        message: "Invalid input provided",
        details: error.message,
      };
    }

    if (error.message.includes("network") || error.message.includes("fetch")) {
      return {
        type: "network",
        message: "Network error occurred. Please check your connection.",
        details: error.message,
      };
    }

    return {
      type: "unknown",
      message: error.message,
      details: error,
    };
  }

  return {
    type: "unknown",
    message: "An unexpected error occurred",
    details: error,
  };
}

// ================================
// LOADING STATE PATTERNS
// ================================

export interface LoadingState {
  collections: boolean;
  videos: boolean;
  videosMore: boolean;
  creating: boolean;
  updating: boolean;
  deleting: boolean;
  adding: boolean;
}

export const createInitialLoadingState = (): LoadingState => ({
  collections: false,
  videos: false,
  videosMore: false,
  creating: false,
  updating: false,
  deleting: false,
  adding: false,
});

// ================================
// INTEGRATION EXAMPLE
// ================================

/**
 * Example usage in a React component:
 * 
 * ```typescript
 * function CollectionsPage({ userId }: { userId: string }) {
 *   const collectionsService = useMemo(() => new CollectionsUIAdapterImpl(userId), [userId]);
 *   
 *   const [state, setState] = useState<CollectionsUIState>({
 *     collections: [],
 *     videos: [],
 *     isLoading: false,
 *     error: undefined,
 *     hasMoreVideos: false,
 *   });
 * 
 *   const loadCollections = useCallback(async () => {
 *     try {
 *       setState(prev => ({ ...prev, isLoading: true, error: undefined }));
 *       const collections = await collectionsService.getUserCollections(userId);
 *       setState(prev => ({ ...prev, collections, isLoading: false }));
 *     } catch (error) {
 *       const collectionsError = handleCollectionsError(error);
 *       setState(prev => ({ ...prev, error: collectionsError.message, isLoading: false }));
 *     }
 *   }, [collectionsService, userId]);
 * 
 *   const loadVideos = useCallback(async (collectionId?: string) => {
 *     try {
 *       setState(prev => ({ ...prev, isLoading: true, error: undefined }));
 *       const result = await collectionsService.getCollectionVideos(userId, collectionId);
 *       setState(prev => ({ 
 *         ...prev, 
 *         videos: result.videos, 
 *         hasMoreVideos: result.hasMore,
 *         selectedCollectionId: collectionId,
 *         isLoading: false 
 *       }));
 *     } catch (error) {
 *       const collectionsError = handleCollectionsError(error);
 *       setState(prev => ({ ...prev, error: collectionsError.message, isLoading: false }));
 *     }
 *   }, [collectionsService, userId]);
 * 
 *   const createCollection = useCallback(async (title: string, description?: string) => {
 *     try {
 *       await collectionsService.createCollection(userId, title, description);
 *       await loadCollections(); // Refresh list
 *     } catch (error) {
 *       const collectionsError = handleCollectionsError(error);
 *       setState(prev => ({ ...prev, error: collectionsError.message }));
 *     }
 *   }, [collectionsService, userId, loadCollections]);
 * 
 *   useEffect(() => {
 *     loadCollections();
 *   }, [loadCollections]);
 * 
 *   return (
 *     <div>
 *       {state.error && <div className="error">{state.error}</div>}
 *       {state.isLoading ? (
 *         <div>Loading...</div>
 *       ) : (
 *         <div>
 *           <CollectionsList 
 *             collections={state.collections}
 *             onSelect={loadVideos}
 *             onDelete={(id) => collectionsService.deleteCollection(userId, id)}
 *           />
 *           <VideoGrid 
 *             videos={state.videos}
 *             hasMore={state.hasMoreVideos}
 *             onLoadMore={() => loadVideos(state.selectedCollectionId, true)}
 *           />
 *         </div>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */

// ================================
// VALIDATION HELPERS
// ================================

export const CollectionValidation = {
  validateTitle(title: string): { isValid: boolean; error?: string } {
    if (!title || title.trim().length === 0) {
      return { isValid: false, error: "Collection title is required" };
    }
    
    if (title.trim().length > 80) {
      return { isValid: false, error: "Collection title must be 80 characters or less" };
    }
    
    return { isValid: true };
  },

  validateDescription(description: string): { isValid: boolean; error?: string } {
    if (description && description.trim().length > 500) {
      return { isValid: false, error: "Collection description must be 500 characters or less" };
    }
    
    return { isValid: true };
  },

  validateCollection(data: { title: string; description?: string }): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    const titleValidation = this.validateTitle(data.title);
    if (!titleValidation.isValid) {
      errors.push(titleValidation.error!);
    }
    
    if (data.description) {
      const descValidation = this.validateDescription(data.description);
      if (!descValidation.isValid) {
        errors.push(descValidation.error!);
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors,
    };
  },
};

// ================================
// RBAC INTEGRATION HELPERS
// ================================

export interface RBACContext {
  userId: string;
  userRole?: string;
  accessibleCoaches: string[];
  permissions: {
    canCreateCollections: boolean;
    canDeleteAnyCollection: boolean;
    canAccessAllVideos: boolean;
    canManageUsers: boolean;
  };
}

export function createRBACContext(
  userId: string,
  userRole: string = "creator",
  accessibleCoaches: string[] = []
): RBACContext {
  const isSuperAdmin = userRole === "super_admin";
  
  return {
    userId,
    userRole,
    accessibleCoaches: isSuperAdmin ? [] : accessibleCoaches,
    permissions: {
      canCreateCollections: true,
      canDeleteAnyCollection: isSuperAdmin,
      canAccessAllVideos: isSuperAdmin,
      canManageUsers: isSuperAdmin,
    },
  };
}

export function checkCollectionAccess(
  rbacContext: RBACContext,
  collection: Collection
): { canRead: boolean; canWrite: boolean; canDelete: boolean } {
  const isSuperAdmin = rbacContext.permissions.canAccessAllVideos;
  const isOwner = collection.userId === rbacContext.userId;
  const hasCoachAccess = rbacContext.accessibleCoaches.includes(collection.userId);

  const canRead = isSuperAdmin || isOwner || hasCoachAccess;
  const canWrite = isSuperAdmin || isOwner;
  const canDelete = isSuperAdmin || isOwner;

  return { canRead, canWrite, canDelete };
}