/**
 * User Profile API Routes
 * Get and update user profile information using extracted services
 */

import { NextRequest } from 'next/server';
import { requireAuth, createSuccessResponse, createErrorResponse } from '@/services/api-middleware';
import { getServices } from '@/services/service-container';
import { getAdminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

/**
 * GET /api/auth/profile
 * Get current user profile with RBAC context
 */
export const GET = requireAuth(async (request, context) => {
  try {
    const { userId, rbacContext } = context;
    const { authService } = getServices();

    // Get user profile from AuthService
    const firebaseUser = authService.getCurrentUser();
    if (!firebaseUser) {
      return createErrorResponse(
        'User not found',
        404,
        'auth/user-not-found'
      );
    }

    // Get full user profile from Firestore
    const userProfile = await authService.getOrCreateUserProfile(firebaseUser);

    return createSuccessResponse({
      user: {
        id: userId,
        uid: userId, // For backward compatibility
        email: userProfile.email,
        name: userProfile.name,
        displayName: userProfile.name, // For backward compatibility
        avatar: userProfile.avatar,
        role: rbacContext?.role || userProfile.role,
        plan: userProfile.plan,
        emailVerified: userProfile.emailVerified,
        isSuperAdmin: rbacContext?.isSuperAdmin || false,
        accessibleCoaches: rbacContext?.accessibleCoaches || [],
        preferences: userProfile.preferences,
        createdAt: userProfile.createdAt,
        updatedAt: userProfile.updatedAt
      }
    });
  } catch (error: any) {
    console.error('Error fetching user profile:', error);
    return createErrorResponse(
      'Failed to fetch user profile',
      500,
      'auth/profile-fetch-error',
      error.message
    );
  }
});

/**
 * PUT /api/auth/profile
 * Update user profile information
 */
export const PUT = requireAuth(async (request, context) => {
  try {
    const { userId } = context;
    const { authService } = getServices();
    const body = await request.json();
    
    const { 
      displayName, 
      name, 
      preferences,
      avatar 
    } = body;

    // Validate input
    const updateData: any = {};
    
    if (displayName || name) {
      const newName = displayName || name;
      if (typeof newName === 'string' && newName.trim().length > 0) {
        updateData.name = newName.trim();
        
        // Update Firebase Auth profile
        try {
          await authService.updateUserProfile(newName.trim());
        } catch (error) {
          console.warn('Failed to update Firebase Auth profile:', error);
        }
      }
    }

    if (preferences && typeof preferences === 'object') {
      updateData.preferences = preferences;
    }

    if (avatar && typeof avatar === 'string') {
      updateData.avatar = avatar;
    }

    // Update Firestore document
    if (Object.keys(updateData).length > 0) {
      const db = getAdminDb();
      if (!db) {
        return createErrorResponse(
          'Database not available',
          500,
          'auth/database-error'
        );
      }

      const userRef = db.collection('users').doc(userId);
      const updatePayload = {
        ...updateData,
        updatedAt: FieldValue.serverTimestamp(),
      };
      await userRef.update(updatePayload);
    }

    // Get updated profile
    const firebaseUser = authService.getCurrentUser();
    if (firebaseUser) {
      const updatedProfile = await authService.getOrCreateUserProfile(firebaseUser);
      
      return createSuccessResponse({
        message: 'Profile updated successfully',
        user: {
          id: userId,
          uid: userId, // For backward compatibility
          email: updatedProfile.email,
          name: updatedProfile.name,
          displayName: updatedProfile.name, // For backward compatibility
          avatar: updatedProfile.avatar,
          role: updatedProfile.role,
          plan: updatedProfile.plan,
          emailVerified: updatedProfile.emailVerified,
          preferences: updatedProfile.preferences
        }
      });
    }

    return createErrorResponse(
      'Failed to retrieve updated profile',
      500,
      'auth/profile-update-error'
    );
    
  } catch (error: any) {
    console.error('Error updating user profile:', error);
    return createErrorResponse(
      'Failed to update profile',
      500,
      'auth/profile-update-error',
      error.message
    );
  }
});
