/**
 * Delete Video API Route
 * Removes a video from a collection with RBAC checks
 */

import { requireAuth, createSuccessResponse, createErrorResponse } from '@/services/api-middleware';
import { getServices } from '@/services/service-container';

export const POST = requireAuth(async (request, context) => {
  try {
    const { userId } = context;
    const { rbacService } = getServices();

    const raw = await request.text();
    if (!raw) {
      return createErrorResponse('Missing request body', 400, 'videos/delete-missing-body');
    }

    let videoId: string | undefined;
    try {
      const body = JSON.parse(raw);
      videoId = body.videoId;
    } catch (error) {
      return createErrorResponse('Invalid JSON in request body', 400, 'videos/delete-invalid-json');
    }

    if (!videoId || typeof videoId !== 'string') {
      return createErrorResponse('Video ID is required', 400, 'videos/delete-missing-id');
    }

    await rbacService.deleteVideo(userId, videoId);

    return createSuccessResponse({ deleted: true });
  } catch (error) {
    console.error('❌ [Videos API] Error deleting video:', error);
    return createErrorResponse('Failed to delete video', 500, 'videos/delete-error');
  }
});
