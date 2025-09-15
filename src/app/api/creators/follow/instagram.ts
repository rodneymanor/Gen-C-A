/**
 * Instagram user ID resolution service
 * Handles converting Instagram usernames to user IDs for API calls
 */

interface InstagramUserResponse {
  user_id: string;
  username: string;
  full_name?: string;
  profile_pic_url?: string;
}

/**
 * Get Instagram user ID from username
 * This is a mock implementation - in production you would integrate with:
 * - Instagram Basic Display API
 * - Instagram Graph API
 * - Third-party services like RapidAPI Instagram endpoints
 */
export async function getInstagramUserId(username: string): Promise<string> {
  console.log(`🔍 [INSTAGRAM] Resolving user ID for username: ${username}`);

  try {
    // Mock implementation with realistic delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // In a real implementation, you would make API calls here:
    // 1. Try Instagram Basic Display API
    // 2. Fall back to web scraping (within legal limits)
    // 3. Use third-party services

    // For demonstration, generate a mock user ID based on username
    const mockUserId = generateMockUserId(username);

    console.log(`✅ [INSTAGRAM] Successfully resolved user ID: ${mockUserId} for ${username}`);

    return mockUserId;

  } catch (error) {
    console.error(`❌ [INSTAGRAM] Failed to resolve user ID for ${username}:`, error);
    throw new Error(`Could not resolve Instagram user ID for @${username}`);
  }
}

/**
 * Generate a consistent mock user ID for testing
 */
function generateMockUserId(username: string): string {
  // Generate a consistent "user ID" based on username
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    const char = username.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }

  // Convert to positive number and make it look like an Instagram user ID
  const positiveHash = Math.abs(hash);
  return `${positiveHash}000000`;
}

/**
 * Validate Instagram username format
 */
export function validateInstagramUsername(username: string): boolean {
  // Instagram username rules:
  // - 1-30 characters
  // - Letters, numbers, periods, underscores only
  // - Cannot start or end with a period
  // - Cannot have consecutive periods

  const regex = /^(?!.*\.\.)(?!.*\.$)[^\W][\w.]{0,29}$/;
  return regex.test(username);
}

/**
 * Get Instagram user profile information (mock)
 */
export async function getInstagramUserProfile(userId: string): Promise<InstagramUserResponse> {
  console.log(`👤 [INSTAGRAM] Fetching profile for user ID: ${userId}`);

  // Mock profile data
  return {
    user_id: userId,
    username: `user_${userId.slice(0, 8)}`,
    full_name: 'Mock User',
    profile_pic_url: 'https://via.placeholder.com/150'
  };
}