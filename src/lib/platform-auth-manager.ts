/**
 * Platform Authentication Manager
 * Handles authentication patterns and API key management for social platforms
 */

export interface ApiCredentials {
  rapidApiKey?: string;
  apifyToken?: string;
  youtubeApiKey?: string;
  instagramClientId?: string;
  instagramClientSecret?: string;
  tiktokClientId?: string;
  tiktokClientSecret?: string;
}

export interface PlatformAuth {
  platform: string;
  authType: 'api_key' | 'oauth2' | 'token' | 'hybrid';
  isConfigured: boolean;
  isValid: boolean;
  expiresAt?: Date;
  scopes?: string[];
  rateLimits?: {
    requests: number;
    window: string;
    remaining?: number;
    resetTime?: Date;
  };
  lastValidated?: Date;
  error?: string;
}

export interface AuthValidationResult {
  isValid: boolean;
  platform: string;
  authType: string;
  details?: {
    quotaRemaining?: number;
    quotaLimit?: number;
    features?: string[];
    restrictions?: string[];
  };
  error?: string;
  suggestedAction?: string;
}

/**
 * Platform Authentication Manager
 * Manages API keys, tokens, and authentication states for social platforms
 */
export class PlatformAuthManager {
  private credentials: Map<string, ApiCredentials> = new Map();
  private authStatus: Map<string, PlatformAuth> = new Map();
  private validationCache: Map<string, { result: AuthValidationResult; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 30 * 60 * 1000; // 30 minutes

  constructor() {
    this.loadEnvironmentCredentials();
    this.initializePlatformAuth();
  }

  /**
   * Load credentials from environment variables
   */
  private loadEnvironmentCredentials(): void {
    const envCredentials: ApiCredentials = {
      rapidApiKey: process.env.RAPIDAPI_KEY,
      apifyToken: process.env.APIFY_TOKEN,
      youtubeApiKey: process.env.YOUTUBE_API_KEY,
      instagramClientId: process.env.INSTAGRAM_CLIENT_ID,
      instagramClientSecret: process.env.INSTAGRAM_CLIENT_SECRET,
      tiktokClientId: process.env.TIKTOK_CLIENT_ID,
      tiktokClientSecret: process.env.TIKTOK_CLIENT_SECRET,
    };

    this.credentials.set('global', envCredentials);
  }

  /**
   * Initialize platform authentication status
   */
  private initializePlatformAuth(): void {
    const platforms = ['rapidapi', 'apify', 'youtube', 'instagram', 'tiktok'];
    const globalCreds = this.credentials.get('global')!;

    platforms.forEach(platform => {
      let isConfigured = false;
      let authType: PlatformAuth['authType'] = 'api_key';

      switch (platform) {
        case 'rapidapi':
          isConfigured = !!globalCreds.rapidApiKey;
          break;
        case 'apify':
          isConfigured = !!globalCreds.apifyToken;
          authType = 'token';
          break;
        case 'youtube':
          isConfigured = !!globalCreds.youtubeApiKey;
          break;
        case 'instagram':
          isConfigured = !!(globalCreds.instagramClientId && globalCreds.instagramClientSecret);
          authType = 'oauth2';
          break;
        case 'tiktok':
          isConfigured = !!(globalCreds.tiktokClientId && globalCreds.tiktokClientSecret);
          authType = 'oauth2';
          break;
      }

      this.authStatus.set(platform, {
        platform,
        authType,
        isConfigured,
        isValid: false, // Will be validated on first use
      });
    });
  }

  /**
   * Get credentials for a platform
   */
  getCredentials(platform: string): ApiCredentials | null {
    return this.credentials.get(platform) || this.credentials.get('global') || null;
  }

  /**
   * Set credentials for a platform
   */
  setCredentials(platform: string, credentials: Partial<ApiCredentials>): void {
    const existing = this.credentials.get(platform) || {};
    this.credentials.set(platform, { ...existing, ...credentials });

    // Update auth status
    this.updateAuthStatus(platform, credentials);
  }

  /**
   * Get authentication status for a platform
   */
  getAuthStatus(platform: string): PlatformAuth | null {
    return this.authStatus.get(platform) || null;
  }

  /**
   * Get authentication status for all platforms
   */
  getAllAuthStatus(): PlatformAuth[] {
    return Array.from(this.authStatus.values());
  }

  /**
   * Validate authentication for a platform
   */
  async validateAuth(platform: string, forceRefresh = false): Promise<AuthValidationResult> {
    // Check cache first
    if (!forceRefresh) {
      const cached = this.validationCache.get(platform);
      if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
        return cached.result;
      }
    }

    console.log(`🔐 [AuthManager] Validating ${platform} authentication...`);

    const result = await this.performAuthValidation(platform);
    
    // Cache the result
    this.validationCache.set(platform, {
      result,
      timestamp: Date.now()
    });

    // Update auth status
    const authStatus = this.authStatus.get(platform);
    if (authStatus) {
      authStatus.isValid = result.isValid;
      authStatus.lastValidated = new Date();
      authStatus.error = result.error;
    }

    console.log(`${result.isValid ? '✅' : '❌'} [AuthManager] ${platform} authentication ${result.isValid ? 'valid' : 'failed'}`);

    return result;
  }

  /**
   * Validate authentication for all platforms
   */
  async validateAllAuth(forceRefresh = false): Promise<AuthValidationResult[]> {
    const platforms = Array.from(this.authStatus.keys());
    const results: AuthValidationResult[] = [];

    // Validate in parallel but with some delay to avoid rate limits
    for (let i = 0; i < platforms.length; i++) {
      const platform = platforms[i];
      
      try {
        const result = await this.validateAuth(platform, forceRefresh);
        results.push(result);
        
        // Small delay between validations
        if (i < platforms.length - 1) {
          await this.sleep(500);
        }
      } catch (error) {
        results.push({
          isValid: false,
          platform,
          authType: 'unknown',
          error: error instanceof Error ? error.message : 'Validation failed'
        });
      }
    }

    return results;
  }

  /**
   * Get API key for RapidAPI services
   */
  getRapidApiKey(): string | null {
    const creds = this.getCredentials('global');
    return creds?.rapidApiKey || null;
  }

  /**
   * Get Apify token
   */
  getApifyToken(): string | null {
    const creds = this.getCredentials('global');
    return creds?.apifyToken || null;
  }

  /**
   * Get YouTube API key
   */
  getYouTubeApiKey(): string | null {
    const creds = this.getCredentials('global');
    return creds?.youtubeApiKey || null;
  }

  /**
   * Check if specific service is authenticated
   */
  isAuthenticated(service: string): boolean {
    const authStatus = this.authStatus.get(service);
    return authStatus ? authStatus.isConfigured && authStatus.isValid : false;
  }

  /**
   * Get authentication summary for debugging
   */
  getAuthSummary(): {
    totalPlatforms: number;
    configured: number;
    validated: number;
    issues: string[];
  } {
    const allAuth = this.getAllAuthStatus();
    const configured = allAuth.filter(auth => auth.isConfigured).length;
    const validated = allAuth.filter(auth => auth.isValid).length;
    const issues = allAuth
      .filter(auth => auth.isConfigured && !auth.isValid)
      .map(auth => `${auth.platform}: ${auth.error || 'Unknown issue'}`);

    return {
      totalPlatforms: allAuth.length,
      configured,
      validated,
      issues
    };
  }

  /**
   * Clear validation cache
   */
  clearCache(): void {
    this.validationCache.clear();
    console.log('🧹 [AuthManager] Validation cache cleared');
  }

  /**
   * Export configuration for backup/transfer
   */
  exportConfig(): { platforms: PlatformAuth[]; timestamp: string } {
    return {
      platforms: this.getAllAuthStatus(),
      timestamp: new Date().toISOString()
    };
  }

  // Private methods

  private async performAuthValidation(platform: string): Promise<AuthValidationResult> {
    const credentials = this.getCredentials(platform);
    const authStatus = this.authStatus.get(platform);

    if (!authStatus?.isConfigured || !credentials) {
      return {
        isValid: false,
        platform,
        authType: authStatus?.authType || 'unknown',
        error: 'Platform not configured',
        suggestedAction: 'Configure API credentials in environment variables'
      };
    }

    try {
      switch (platform) {
        case 'rapidapi':
          return await this.validateRapidApi(credentials);
        case 'apify':
          return await this.validateApify(credentials);
        case 'youtube':
          return await this.validateYouTube(credentials);
        case 'instagram':
          return await this.validateInstagram(credentials);
        case 'tiktok':
          return await this.validateTikTok(credentials);
        default:
          return {
            isValid: false,
            platform,
            authType: 'unknown',
            error: 'Unknown platform'
          };
      }
    } catch (error) {
      return {
        isValid: false,
        platform,
        authType: authStatus.authType,
        error: error instanceof Error ? error.message : 'Validation error',
        suggestedAction: 'Check credentials and network connectivity'
      };
    }
  }

  private async validateRapidApi(credentials: ApiCredentials): Promise<AuthValidationResult> {
    if (!credentials.rapidApiKey) {
      return {
        isValid: false,
        platform: 'rapidapi',
        authType: 'api_key',
        error: 'No RapidAPI key provided'
      };
    }

    try {
      // Test with a simple TikTok endpoint
      const response = await fetch(
        'https://tiktok-scrapper-videos-music-challenges-downloader.p.rapidapi.com/video/test',
        {
          method: 'GET',
          headers: {
            'x-rapidapi-key': credentials.rapidApiKey,
            'x-rapidapi-host': 'tiktok-scrapper-videos-music-challenges-downloader.p.rapidapi.com',
          },
        }
      );

      // Even if the specific endpoint fails, we can check the auth headers
      const isValid = response.status !== 401 && response.status !== 403;
      
      return {
        isValid,
        platform: 'rapidapi',
        authType: 'api_key',
        details: {
          quotaRemaining: parseInt(response.headers.get('x-ratelimit-requests-remaining') || '0'),
          features: ['TikTok', 'Instagram', 'YouTube Transcript'],
        },
        error: isValid ? undefined : 'Invalid or expired API key'
      };
    } catch (error) {
      return {
        isValid: false,
        platform: 'rapidapi',
        authType: 'api_key',
        error: 'Network error during validation'
      };
    }
  }

  private async validateApify(credentials: ApiCredentials): Promise<AuthValidationResult> {
    if (!credentials.apifyToken) {
      return {
        isValid: false,
        platform: 'apify',
        authType: 'token',
        error: 'No Apify token provided'
      };
    }

    try {
      // Test Apify API with user info endpoint
      const response = await fetch(
        `https://api.apify.com/v2/users/me?token=${credentials.apifyToken}`,
        {
          method: 'GET',
        }
      );

      const isValid = response.ok;
      
      if (isValid) {
        const userData = await response.json();
        return {
          isValid: true,
          platform: 'apify',
          authType: 'token',
          details: {
            features: ['Instagram Scraper', 'Profile Analysis'],
          }
        };
      } else {
        return {
          isValid: false,
          platform: 'apify',
          authType: 'token',
          error: response.status === 401 ? 'Invalid token' : 'API error'
        };
      }
    } catch (error) {
      return {
        isValid: false,
        platform: 'apify',
        authType: 'token',
        error: 'Network error during validation'
      };
    }
  }

  private async validateYouTube(credentials: ApiCredentials): Promise<AuthValidationResult> {
    if (!credentials.youtubeApiKey) {
      return {
        isValid: false,
        platform: 'youtube',
        authType: 'api_key',
        error: 'No YouTube API key provided'
      };
    }

    try {
      // Test YouTube Data API with a simple search
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&q=test&maxResults=1&key=${credentials.youtubeApiKey}`,
        {
          method: 'GET',
        }
      );

      const isValid = response.ok;
      
      if (isValid) {
        const data = await response.json();
        return {
          isValid: true,
          platform: 'youtube',
          authType: 'api_key',
          details: {
            quotaRemaining: parseInt(response.headers.get('x-ratelimit-remaining') || '0'),
            features: ['Search', 'Video Details', 'Channel Info'],
          }
        };
      } else {
        return {
          isValid: false,
          platform: 'youtube',
          authType: 'api_key',
          error: response.status === 403 ? 'Invalid API key or quota exceeded' : 'API error'
        };
      }
    } catch (error) {
      return {
        isValid: false,
        platform: 'youtube',
        authType: 'api_key',
        error: 'Network error during validation'
      };
    }
  }

  private async validateInstagram(credentials: ApiCredentials): Promise<AuthValidationResult> {
    // Instagram OAuth validation would require more complex flow
    // For now, just check if credentials are present
    const isValid = !!(credentials.instagramClientId && credentials.instagramClientSecret);
    
    return {
      isValid,
      platform: 'instagram',
      authType: 'oauth2',
      details: {
        features: ['Basic Display API', 'Media Access'],
        restrictions: ['Requires OAuth flow for user tokens']
      },
      error: isValid ? undefined : 'Missing client ID or secret',
      suggestedAction: isValid ? undefined : 'Configure Instagram client credentials'
    };
  }

  private async validateTikTok(credentials: ApiCredentials): Promise<AuthValidationResult> {
    // TikTok OAuth validation would require more complex flow
    // For now, just check if credentials are present
    const isValid = !!(credentials.tiktokClientId && credentials.tiktokClientSecret);
    
    return {
      isValid,
      platform: 'tiktok',
      authType: 'oauth2',
      details: {
        features: ['User Info', 'Video List'],
        restrictions: ['Requires OAuth flow for user tokens', 'Limited to verified developers']
      },
      error: isValid ? undefined : 'Missing client ID or secret',
      suggestedAction: isValid ? undefined : 'Configure TikTok client credentials'
    };
  }

  private updateAuthStatus(platform: string, credentials: Partial<ApiCredentials>): void {
    const authStatus = this.authStatus.get(platform);
    if (!authStatus) return;

    // Update configured status based on credentials
    let isConfigured = false;
    
    switch (platform) {
      case 'rapidapi':
        isConfigured = !!credentials.rapidApiKey;
        break;
      case 'apify':
        isConfigured = !!credentials.apifyToken;
        break;
      case 'youtube':
        isConfigured = !!credentials.youtubeApiKey;
        break;
      case 'instagram':
        isConfigured = !!(credentials.instagramClientId && credentials.instagramClientSecret);
        break;
      case 'tiktok':
        isConfigured = !!(credentials.tiktokClientId && credentials.tiktokClientSecret);
        break;
    }

    authStatus.isConfigured = isConfigured;
    
    // Reset validation status when credentials change
    if (isConfigured) {
      authStatus.isValid = false;
      authStatus.lastValidated = undefined;
      authStatus.error = undefined;
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Authentication helper functions
 */
export class AuthHelper {
  private authManager: PlatformAuthManager;

  constructor(authManager?: PlatformAuthManager) {
    this.authManager = authManager || new PlatformAuthManager();
  }

  /**
   * Get authenticated headers for RapidAPI
   */
  getRapidApiHeaders(host: string): Record<string, string> | null {
    const apiKey = this.authManager.getRapidApiKey();
    
    if (!apiKey) {
      throw new Error('RapidAPI key not configured');
    }

    return {
      'x-rapidapi-key': apiKey,
      'x-rapidapi-host': host,
      'User-Agent': 'Social-Platform-Service/1.0'
    };
  }

  /**
   * Get Apify API URL with token
   */
  getApifyApiUrl(endpoint: string): string | null {
    const token = this.authManager.getApifyToken();
    
    if (!token) {
      throw new Error('Apify token not configured');
    }

    const baseUrl = 'https://api.apify.com/v2';
    const separator = endpoint.includes('?') ? '&' : '?';
    
    return `${baseUrl}${endpoint}${separator}token=${token}`;
  }

  /**
   * Get YouTube API URL with key
   */
  getYouTubeApiUrl(endpoint: string, params: Record<string, string> = {}): string | null {
    const apiKey = this.authManager.getYouTubeApiKey();
    
    if (!apiKey) {
      throw new Error('YouTube API key not configured');
    }

    const baseUrl = 'https://www.googleapis.com/youtube/v3';
    const urlParams = new URLSearchParams({ ...params, key: apiKey });
    
    return `${baseUrl}${endpoint}?${urlParams.toString()}`;
  }

  /**
   * Check if platform is ready for use
   */
  async isPlatformReady(platform: string): Promise<boolean> {
    const authStatus = this.authManager.getAuthStatus(platform);
    
    if (!authStatus?.isConfigured) {
      return false;
    }

    // Validate if not already validated
    if (!authStatus.isValid) {
      const validation = await this.authManager.validateAuth(platform);
      return validation.isValid;
    }

    return true;
  }

  /**
   * Get authentication manager instance
   */
  getAuthManager(): PlatformAuthManager {
    return this.authManager;
  }
}

// Global instances
export const globalAuthManager = new PlatformAuthManager();
export const authHelper = new AuthHelper(globalAuthManager);

// Export factory functions
export function createAuthManager(): PlatformAuthManager {
  return new PlatformAuthManager();
}

export function createAuthHelper(authManager?: PlatformAuthManager): AuthHelper {
  return new AuthHelper(authManager);
}
