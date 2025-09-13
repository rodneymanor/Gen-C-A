/**
 * User Management Service
 * 
 * Extracted user management functionality for collections service integration
 */

import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  createdAt: string;
  updatedAt: string;
  role?: 'user' | 'admin' | 'moderator';
  permissions?: string[];
  metadata?: Record<string, any>;
}

export interface UserPreferences {
  theme?: 'light' | 'dark' | 'system';
  language?: string;
  notifications?: {
    email: boolean;
    push: boolean;
    collections: boolean;
  };
}

export interface UserStats {
  totalCollections: number;
  totalVideos: number;
  storageUsed: number;
  lastActivity: string;
}

export class UserManagementService {
  /**
   * Get user profile by ID
   */
  static async getUserProfile(uid: string): Promise<UserProfile | null> {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      
      if (!userDoc.exists()) {
        return null;
      }

      return {
        uid,
        ...userDoc.data()
      } as UserProfile;
    } catch (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
  }

  /**
   * Create or update user profile
   */
  static async upsertUserProfile(uid: string, profile: Partial<UserProfile>): Promise<boolean> {
    try {
      const userRef = doc(db, 'users', uid);
      const userDoc = await getDoc(userRef);

      const now = new Date().toISOString();
      const profileData = {
        ...profile,
        uid,
        updatedAt: now
      };

      if (!userDoc.exists()) {
        // Create new user
        await setDoc(userRef, {
          ...profileData,
          createdAt: now,
          role: 'user',
          permissions: ['read:collections', 'write:collections']
        });
      } else {
        // Update existing user
        await updateDoc(userRef, profileData);
      }

      return true;
    } catch (error) {
      console.error('Error upserting user profile:', error);
      return false;
    }
  }

  /**
   * Update user statistics
   */
  static async updateUserStats(uid: string, stats: Partial<UserStats>): Promise<boolean> {
    try {
      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, {
        stats: stats,
        updatedAt: new Date().toISOString()
      });
      return true;
    } catch (error) {
      console.error('Error updating user stats:', error);
      return false;
    }
  }

  /**
   * Get user preferences
   */
  static async getUserPreferences(uid: string): Promise<UserPreferences | null> {
    try {
      const userProfile = await this.getUserProfile(uid);
      return userProfile?.metadata?.preferences || null;
    } catch (error) {
      console.error('Error getting user preferences:', error);
      return null;
    }
  }

  /**
   * Update user preferences
   */
  static async updateUserPreferences(uid: string, preferences: UserPreferences): Promise<boolean> {
    try {
      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, {
        'metadata.preferences': preferences,
        updatedAt: new Date().toISOString()
      });
      return true;
    } catch (error) {
      console.error('Error updating user preferences:', error);
      return false;
    }
  }

  /**
   * Check if user has specific permission
   */
  static async hasPermission(uid: string, permission: string): Promise<boolean> {
    try {
      const userProfile = await this.getUserProfile(uid);
      
      if (!userProfile) {
        return false;
      }

      const permissions = userProfile.permissions || [];
      
      // Check for exact permission or wildcard
      return permissions.includes(permission) || 
             permissions.includes('*:*') ||
             permissions.some(p => {
               const [action, resource] = permission.split(':');
               const [pAction, pResource] = p.split(':');
               return (pAction === '*' || pAction === action) && 
                      (pResource === '*' || pResource === resource);
             });
    } catch (error) {
      console.error('Error checking user permission:', error);
      return false;
    }
  }

  /**
   * Get user role
   */
  static async getUserRole(uid: string): Promise<string | null> {
    try {
      const userProfile = await this.getUserProfile(uid);
      return userProfile?.role || 'user';
    } catch (error) {
      console.error('Error getting user role:', error);
      return null;
    }
  }

  /**
   * Update user role
   */
  static async updateUserRole(uid: string, role: 'user' | 'admin' | 'moderator'): Promise<boolean> {
    try {
      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, {
        role,
        updatedAt: new Date().toISOString()
      });
      return true;
    } catch (error) {
      console.error('Error updating user role:', error);
      return false;
    }
  }

  /**
   * Delete user profile
   */
  static async deleteUserProfile(uid: string): Promise<boolean> {
    try {
      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, {
        deleted: true,
        deletedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      return true;
    } catch (error) {
      console.error('Error deleting user profile:', error);
      return false;
    }
  }
}