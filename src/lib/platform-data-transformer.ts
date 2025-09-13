/**
 * Platform Data Transformer
 * Standardizes data formats across different social platforms
 */

import { PlatformContent, PlatformMetrics, TranscriptSegment } from './social-platform-services';

export interface DataTransformConfig {
  normalizeUrls: boolean;
  extractMetadata: boolean;
  validateData: boolean;
  fillDefaults: boolean;
}

export interface TransformResult<T> {
  success: boolean;
  data?: T;
  errors: string[];
  warnings: string[];
  metadata: {
    platform: string;
    transformedAt: Date;
    dataSize: number;
    fieldsProcessed: string[];
  };
}

export interface NormalizedMetrics {
  engagement: {
    likes: number;
    comments: number;
    shares: number;
    saves?: number;
    views: number;
    engagementRate?: number;
  };
  reach: {
    views: number;
    impressions?: number;
    uniqueViewers?: number;
  };
  growth: {
    followers?: number;
    followersGrowth?: number;
    videosCount?: number;
  };
}

export interface ContentMetadata {
  technical: {
    duration?: number;
    resolution?: string;
    fps?: number;
    bitrate?: number;
    fileSize?: number;
    format?: string;
  };
  semantic: {
    topics: string[];
    sentiment: 'positive' | 'negative' | 'neutral';
    complexity: 'low' | 'medium' | 'high';
    language?: string;
    readabilityScore?: number;
  };
  engagement: {
    hooks: string[];
    callsToAction: string[];
    questions: string[];
    emojis: string[];
    trending: boolean;
  };
}

/**
 * Universal data transformer for social platform content
 */
export class PlatformDataTransformer {
  private config: DataTransformConfig;

  constructor(config?: Partial<DataTransformConfig>) {
    this.config = {
      normalizeUrls: true,
      extractMetadata: true,
      validateData: true,
      fillDefaults: true,
      ...config
    };
  }

  /**
   * Transform platform-specific content to unified format
   */
  transformContent(rawData: any, platform: string): TransformResult<PlatformContent> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const fieldsProcessed: string[] = [];

    try {
      let transformedData: PlatformContent;

      switch (platform.toLowerCase()) {
        case 'tiktok':
          transformedData = this.transformTikTokContent(rawData, errors, warnings, fieldsProcessed);
          break;
        case 'instagram':
          transformedData = this.transformInstagramContent(rawData, errors, warnings, fieldsProcessed);
          break;
        case 'youtube':
          transformedData = this.transformYouTubeContent(rawData, errors, warnings, fieldsProcessed);
          break;
        default:
          throw new Error(`Unsupported platform: ${platform}`);
      }

      // Apply post-processing
      if (this.config.normalizeUrls) {
        transformedData = this.normalizeUrls(transformedData, fieldsProcessed);
      }

      if (this.config.validateData) {
        const validationErrors = this.validateContent(transformedData);
        errors.push(...validationErrors);
      }

      if (this.config.fillDefaults) {
        transformedData = this.fillDefaults(transformedData, fieldsProcessed);
      }

      return {
        success: errors.length === 0,
        data: transformedData,
        errors,
        warnings,
        metadata: {
          platform,
          transformedAt: new Date(),
          dataSize: JSON.stringify(rawData).length,
          fieldsProcessed
        }
      };

    } catch (error) {
      errors.push(error instanceof Error ? error.message : 'Unknown transformation error');
      
      return {
        success: false,
        errors,
        warnings,
        metadata: {
          platform,
          transformedAt: new Date(),
          dataSize: JSON.stringify(rawData).length,
          fieldsProcessed
        }
      };
    }
  }

  /**
   * Transform metrics to normalized format
   */
  transformMetrics(rawMetrics: any, platform: string): TransformResult<NormalizedMetrics> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const fieldsProcessed: string[] = [];

    try {
      const normalized: NormalizedMetrics = {
        engagement: {
          likes: 0,
          comments: 0,
          shares: 0,
          views: 0
        },
        reach: {
          views: 0
        },
        growth: {}
      };

      switch (platform.toLowerCase()) {
        case 'tiktok':
          this.extractTikTokMetrics(rawMetrics, normalized, fieldsProcessed);
          break;
        case 'instagram':
          this.extractInstagramMetrics(rawMetrics, normalized, fieldsProcessed);
          break;
        case 'youtube':
          this.extractYouTubeMetrics(rawMetrics, normalized, fieldsProcessed);
          break;
      }

      // Calculate derived metrics
      if (normalized.engagement.views > 0) {
        const totalEngagement = normalized.engagement.likes + 
                               normalized.engagement.comments + 
                               normalized.engagement.shares;
        normalized.engagement.engagementRate = (totalEngagement / normalized.engagement.views) * 100;
        fieldsProcessed.push('engagementRate');
      }

      return {
        success: true,
        data: normalized,
        errors,
        warnings,
        metadata: {
          platform,
          transformedAt: new Date(),
          dataSize: JSON.stringify(rawMetrics).length,
          fieldsProcessed
        }
      };

    } catch (error) {
      errors.push(error instanceof Error ? error.message : 'Unknown metrics transformation error');
      
      return {
        success: false,
        errors,
        warnings,
        metadata: {
          platform,
          transformedAt: new Date(),
          dataSize: JSON.stringify(rawMetrics).length,
          fieldsProcessed
        }
      };
    }
  }

  /**
   * Transform transcript data to normalized format
   */
  transformTranscript(rawTranscript: any, platform: string): TransformResult<TranscriptSegment[]> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const fieldsProcessed: string[] = [];

    try {
      let segments: TranscriptSegment[] = [];

      if (Array.isArray(rawTranscript)) {
        segments = rawTranscript.map((segment, index) => {
          fieldsProcessed.push(`segment-${index}`);
          
          return {
            text: this.cleanText(segment.text || segment.content || ''),
            start: this.parseNumber(segment.start || segment.startTime || segment.offset || 0),
            duration: this.parseNumber(segment.duration || segment.dur || 0)
          };
        }).filter(segment => segment.text.length > 0);
      } else if (typeof rawTranscript === 'string') {
        // Handle plain text transcript
        segments = [{
          text: this.cleanText(rawTranscript),
          start: 0,
          duration: 0
        }];
        fieldsProcessed.push('text-content');
      }

      // Validate segments
      segments.forEach((segment, index) => {
        if (segment.start < 0) {
          warnings.push(`Segment ${index} has negative start time, setting to 0`);
          segment.start = 0;
        }
        
        if (segment.duration < 0) {
          warnings.push(`Segment ${index} has negative duration, setting to 0`);
          segment.duration = 0;
        }
      });

      return {
        success: errors.length === 0,
        data: segments,
        errors,
        warnings,
        metadata: {
          platform,
          transformedAt: new Date(),
          dataSize: JSON.stringify(rawTranscript).length,
          fieldsProcessed
        }
      };

    } catch (error) {
      errors.push(error instanceof Error ? error.message : 'Unknown transcript transformation error');
      
      return {
        success: false,
        errors,
        warnings,
        metadata: {
          platform,
          transformedAt: new Date(),
          dataSize: JSON.stringify(rawTranscript).length,
          fieldsProcessed
        }
      };
    }
  }

  /**
   * Extract enhanced metadata from content
   */
  extractContentMetadata(content: PlatformContent): ContentMetadata {
    const metadata: ContentMetadata = {
      technical: {
        duration: content.duration,
        format: content.isVideo ? 'video' : 'image'
      },
      semantic: {
        topics: this.extractTopics(content.description),
        sentiment: this.analyzeSentiment(content.description),
        complexity: this.analyzeComplexity(content.description),
        language: content.language || 'unknown'
      },
      engagement: {
        hooks: this.extractHooks(content.description),
        callsToAction: this.extractCallsToAction(content.description),
        questions: this.extractQuestions(content.description),
        emojis: this.extractEmojis(content.description),
        trending: this.isTrending(content.metrics)
      }
    };

    // Calculate readability score
    if (content.description) {
      metadata.semantic.readabilityScore = this.calculateReadabilityScore(content.description);
    }

    return metadata;
  }

  // Private transformation methods for each platform

  private transformTikTokContent(
    rawData: any, 
    errors: string[], 
    warnings: string[], 
    fieldsProcessed: string[]
  ): PlatformContent {
    const aweme = rawData.data?.aweme_detail || rawData.aweme_detail || rawData;
    
    if (!aweme) {
      throw new Error('Invalid TikTok data structure');
    }

    const statistics = aweme.statistics || {};
    const author = aweme.author || {};
    const video = aweme.video || {};
    const music = aweme.music || {};

    fieldsProcessed.push('aweme_detail', 'statistics', 'author', 'video', 'music');

    const videoUrls = video.play_addr?.url_list || [];
    const thumbnailUrls = video.cover?.url_list || video.dynamic_cover?.url_list || [];
    const description = aweme.desc || '';

    if (!videoUrls.length && aweme.video_id) {
      warnings.push('No video URLs found, video may be private or deleted');
    }

    return {
      id: aweme.aweme_id || aweme.id || 'unknown',
      title: description || `Video by @${author.nickname || author.unique_id || 'unknown'}`,
      description: this.cleanText(description),
      author: author.unique_id || 'unknown',
      authorDisplayName: author.nickname,
      authorVerified: author.custom_verify === '1' || !!author.enterprise_verify_reason,
      videoUrl: videoUrls.length > 0 ? videoUrls[0] : undefined,
      audioUrl: music.play_url?.uri,
      thumbnailUrl: thumbnailUrls.length > 0 ? thumbnailUrls[0] : undefined,
      duration: video.duration ? Math.floor(video.duration / 1000) : undefined,
      hashtags: this.extractHashtags(description),
      mentions: this.extractMentions(description),
      metrics: {
        likes: statistics.digg_count || 0,
        views: statistics.play_count || 0,
        comments: statistics.comment_count || 0,
        shares: statistics.share_count || 0,
        saves: statistics.collect_count || 0
      },
      timestamp: aweme.create_time ? new Date(aweme.create_time * 1000).toISOString() : undefined,
      platform: 'tiktok',
      isVideo: !!videoUrls.length,
      language: aweme.region || 'en',
      location: aweme.poi_info ? {
        name: aweme.poi_info.poi_name,
        id: aweme.poi_info.poi_id
      } : undefined,
      rawData
    };
  }

  private transformInstagramContent(
    rawData: any,
    errors: string[],
    warnings: string[],
    fieldsProcessed: string[]
  ): PlatformContent {
    const standardVersions = rawData.video_versions || [];
    const dashVersions = rawData.video_dash_manifest?.video_versions || [];
    const allVersions = [...dashVersions, ...standardVersions];

    fieldsProcessed.push('video_versions', 'video_dash_manifest', 'image_versions2', 'caption', 'user');

    const selectedVersion = allVersions.length > 0 
      ? allVersions.sort((a, b) => (a.bandwidth || 0) - (b.bandwidth || 0))[0]
      : null;

    const videoUrl = selectedVersion?.url;
    const thumbnailUrl = rawData.image_versions2?.candidates?.[0]?.url;
    const caption = rawData.caption?.text || '';
    const user = rawData.user || {};

    if (!videoUrl && !thumbnailUrl) {
      warnings.push('No media URLs found');
    }

    return {
      id: rawData.code || rawData.id || 'unknown',
      shortCode: rawData.code,
      title: caption || `Post by @${user.username || 'unknown'}`,
      description: this.cleanText(caption),
      author: user.username || 'unknown',
      authorDisplayName: user.full_name,
      authorVerified: user.is_verified || false,
      videoUrl,
      thumbnailUrl,
      duration: rawData.video_duration || 0,
      hashtags: this.extractHashtags(caption),
      mentions: this.extractMentions(caption),
      metrics: {
        likes: rawData.like_count || 0,
        views: rawData.play_count || rawData.view_count || 0,
        comments: rawData.comment_count || 0,
        shares: rawData.reshare_count || rawData.share_count || 0
      },
      timestamp: rawData.taken_at ? new Date(rawData.taken_at * 1000).toISOString() : undefined,
      platform: 'instagram',
      isVideo: !!videoUrl,
      language: 'en', // Instagram doesn't provide language info
      rawData
    };
  }

  private transformYouTubeContent(
    rawData: any,
    errors: string[],
    warnings: string[],
    fieldsProcessed: string[]
  ): PlatformContent {
    // Handle both API response and oEmbed response
    const snippet = rawData.snippet || rawData;
    const statistics = rawData.statistics || {};
    
    fieldsProcessed.push('snippet', 'statistics');

    const title = snippet.title || rawData.title || '';
    const description = snippet.description || '';
    const channelTitle = snippet.channelTitle || rawData.author_name || '';

    return {
      id: rawData.id || snippet.videoId || rawData.video_id || 'unknown',
      title: this.cleanText(title),
      description: this.cleanText(description),
      author: channelTitle,
      authorDisplayName: channelTitle,
      authorVerified: false, // Would need additional API call to determine
      videoUrl: rawData.id ? `https://www.youtube.com/watch?v=${rawData.id}` : undefined,
      thumbnailUrl: snippet.thumbnails?.medium?.url || rawData.thumbnail_url,
      duration: this.parseYouTubeDuration(snippet.duration || rawData.duration),
      hashtags: this.extractHashtags(description),
      mentions: this.extractMentions(description),
      metrics: {
        likes: parseInt(statistics.likeCount) || 0,
        views: parseInt(statistics.viewCount) || 0,
        comments: parseInt(statistics.commentCount) || 0,
        shares: 0 // Not available via API
      },
      timestamp: snippet.publishedAt,
      platform: 'youtube',
      isVideo: true,
      language: snippet.defaultLanguage || snippet.defaultAudioLanguage || 'en',
      rawData
    };
  }

  // Metrics extraction methods

  private extractTikTokMetrics(rawMetrics: any, normalized: NormalizedMetrics, fieldsProcessed: string[]): void {
    const stats = rawMetrics.statistics || rawMetrics;
    
    normalized.engagement.likes = stats.digg_count || 0;
    normalized.engagement.comments = stats.comment_count || 0;
    normalized.engagement.shares = stats.share_count || 0;
    normalized.engagement.saves = stats.collect_count || 0;
    normalized.engagement.views = stats.play_count || 0;
    normalized.reach.views = stats.play_count || 0;
    
    fieldsProcessed.push('digg_count', 'comment_count', 'share_count', 'collect_count', 'play_count');
  }

  private extractInstagramMetrics(rawMetrics: any, normalized: NormalizedMetrics, fieldsProcessed: string[]): void {
    normalized.engagement.likes = rawMetrics.like_count || 0;
    normalized.engagement.comments = rawMetrics.comment_count || 0;
    normalized.engagement.shares = rawMetrics.reshare_count || rawMetrics.share_count || 0;
    normalized.engagement.views = rawMetrics.play_count || rawMetrics.view_count || 0;
    normalized.reach.views = rawMetrics.play_count || rawMetrics.view_count || 0;
    
    fieldsProcessed.push('like_count', 'comment_count', 'reshare_count', 'play_count');
  }

  private extractYouTubeMetrics(rawMetrics: any, normalized: NormalizedMetrics, fieldsProcessed: string[]): void {
    const stats = rawMetrics.statistics || rawMetrics;
    
    normalized.engagement.likes = parseInt(stats.likeCount) || 0;
    normalized.engagement.comments = parseInt(stats.commentCount) || 0;
    normalized.engagement.views = parseInt(stats.viewCount) || 0;
    normalized.reach.views = parseInt(stats.viewCount) || 0;
    
    if (stats.subscriberCount) {
      normalized.growth.followers = parseInt(stats.subscriberCount) || 0;
    }
    
    fieldsProcessed.push('likeCount', 'commentCount', 'viewCount', 'subscriberCount');
  }

  // Utility methods

  private normalizeUrls(content: PlatformContent, fieldsProcessed: string[]): PlatformContent {
    const normalizeUrl = (url?: string) => {
      if (!url) return url;
      
      try {
        const parsed = new URL(url);
        // Remove tracking parameters
        parsed.searchParams.delete('utm_source');
        parsed.searchParams.delete('utm_medium');
        parsed.searchParams.delete('utm_campaign');
        
        return parsed.toString();
      } catch {
        return url; // Return original if parsing fails
      }
    };

    fieldsProcessed.push('url-normalization');

    return {
      ...content,
      videoUrl: normalizeUrl(content.videoUrl),
      audioUrl: normalizeUrl(content.audioUrl),
      thumbnailUrl: normalizeUrl(content.thumbnailUrl)
    };
  }

  private validateContent(content: PlatformContent): string[] {
    const errors: string[] = [];

    if (!content.id || content.id === 'unknown') {
      errors.push('Content ID is missing or unknown');
    }

    if (!content.title || content.title.trim().length === 0) {
      errors.push('Content title is empty');
    }

    if (!content.author || content.author === 'unknown') {
      errors.push('Author information is missing');
    }

    if (content.isVideo && !content.videoUrl) {
      errors.push('Video content missing video URL');
    }

    if (content.duration !== undefined && content.duration < 0) {
      errors.push('Duration cannot be negative');
    }

    // Validate metrics
    const metrics = content.metrics;
    if (metrics.likes < 0 || metrics.views < 0 || metrics.comments < 0 || metrics.shares < 0) {
      errors.push('Metrics cannot be negative');
    }

    return errors;
  }

  private fillDefaults(content: PlatformContent, fieldsProcessed: string[]): PlatformContent {
    fieldsProcessed.push('default-filling');

    return {
      ...content,
      title: content.title || 'Untitled Content',
      description: content.description || '',
      author: content.author || 'Unknown Author',
      hashtags: content.hashtags || [],
      mentions: content.mentions || [],
      metrics: {
        likes: 0,
        views: 0,
        comments: 0,
        shares: 0,
        ...content.metrics
      }
    };
  }

  // Content analysis methods

  private extractTopics(text: string): string[] {
    if (!text) return [];
    
    // Simple keyword-based topic extraction
    const topicKeywords = {
      technology: ['tech', 'ai', 'software', 'app', 'code', 'programming'],
      lifestyle: ['life', 'daily', 'routine', 'tips', 'advice'],
      entertainment: ['funny', 'comedy', 'entertainment', 'show', 'movie'],
      education: ['learn', 'tutorial', 'how to', 'guide', 'teach'],
      fitness: ['workout', 'fitness', 'gym', 'exercise', 'health'],
      food: ['food', 'recipe', 'cooking', 'restaurant', 'eat']
    };

    const lowerText = text.toLowerCase();
    const topics: string[] = [];

    for (const [topic, keywords] of Object.entries(topicKeywords)) {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        topics.push(topic);
      }
    }

    return topics;
  }

  private analyzeSentiment(text: string): 'positive' | 'negative' | 'neutral' {
    if (!text) return 'neutral';
    
    const positiveWords = ['love', 'amazing', 'great', 'awesome', 'fantastic', 'wonderful', 'excellent'];
    const negativeWords = ['hate', 'terrible', 'awful', 'bad', 'worst', 'horrible', 'disgusting'];
    
    const lowerText = text.toLowerCase();
    const positiveCount = positiveWords.filter(word => lowerText.includes(word)).length;
    const negativeCount = negativeWords.filter(word => lowerText.includes(word)).length;
    
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  private analyzeComplexity(text: string): 'low' | 'medium' | 'high' {
    if (!text) return 'low';
    
    const words = text.split(/\s+/);
    const avgWordLength = words.reduce((sum, word) => sum + word.length, 0) / words.length;
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const avgSentenceLength = words.length / sentences.length;
    
    if (avgWordLength > 6 || avgSentenceLength > 20) return 'high';
    if (avgWordLength > 4 || avgSentenceLength > 15) return 'medium';
    return 'low';
  }

  private extractHooks(text: string): string[] {
    if (!text) return [];
    
    const hookPatterns = [
      /^(what if|imagine|did you know|here's why|the secret)/i,
      /\?$/,
      /^(stop|wait|hold on)/i,
      /^(this will|you won't believe)/i
    ];
    
    return text.split(/[.!?]+/)
      .map(sentence => sentence.trim())
      .filter(sentence => hookPatterns.some(pattern => pattern.test(sentence)))
      .slice(0, 3); // Limit to first 3 hooks
  }

  private extractCallsToAction(text: string): string[] {
    if (!text) return [];
    
    const ctaPatterns = [
      /^(click|tap|swipe|visit|go to|check out)/i,
      /^(subscribe|follow|like|share|comment)/i,
      /^(download|get|try|start|join)/i,
      /^(buy|purchase|order|shop)/i
    ];
    
    return text.split(/[.!?]+/)
      .map(sentence => sentence.trim())
      .filter(sentence => ctaPatterns.some(pattern => pattern.test(sentence)))
      .slice(0, 2); // Limit to first 2 CTAs
  }

  private extractQuestions(text: string): string[] {
    if (!text) return [];
    
    return text.split(/[.!?]+/)
      .map(sentence => sentence.trim())
      .filter(sentence => sentence.endsWith('?'))
      .slice(0, 3); // Limit to first 3 questions
  }

  private extractEmojis(text: string): string[] {
    if (!text) return [];
    
    const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu;
    const matches = text.match(emojiRegex);
    return matches ? [...new Set(matches)] : [];
  }

  private isTrending(metrics: PlatformMetrics): boolean {
    // Simple heuristic for trending content
    const engagementRate = metrics.views > 0 
      ? (metrics.likes + metrics.comments + metrics.shares) / metrics.views 
      : 0;
    
    return engagementRate > 0.1 && metrics.views > 10000;
  }

  private calculateReadabilityScore(text: string): number {
    if (!text) return 0;
    
    const words = text.split(/\s+/);
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const syllables = words.reduce((count, word) => count + this.countSyllables(word), 0);
    
    // Flesch Reading Ease Score
    const avgSentenceLength = words.length / sentences.length;
    const avgSyllablesPerWord = syllables / words.length;
    
    const score = 206.835 - (1.015 * avgSentenceLength) - (84.6 * avgSyllablesPerWord);
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  private countSyllables(word: string): number {
    word = word.toLowerCase();
    if (word.length <= 3) return 1;
    
    word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
    word = word.replace(/^y/, '');
    
    const matches = word.match(/[aeiouy]{1,2}/g);
    return matches ? matches.length : 1;
  }

  private extractHashtags(text: string): string[] {
    const hashtagRegex = /#([a-zA-Z0-9_]+)/g;
    const matches = text.match(hashtagRegex);
    return matches ? matches.map(tag => tag.substring(1)) : [];
  }

  private extractMentions(text: string): string[] {
    const mentionRegex = /@([a-zA-Z0-9_.]+)/g;
    const matches = text.match(mentionRegex);
    return matches ? matches.map(mention => mention.substring(1)) : [];
  }

  private cleanText(text: string): string {
    return text
      .replace(/&#39;/g, "'")
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .trim();
  }

  private parseNumber(value: any): number {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') return parseFloat(value) || 0;
    return 0;
  }

  private parseYouTubeDuration(duration: string | number): number {
    if (typeof duration === 'number') return duration;
    if (!duration) return 0;
    
    // Parse ISO 8601 duration format (PT1M30S)
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (match) {
      const hours = parseInt(match[1] || '0');
      const minutes = parseInt(match[2] || '0');
      const seconds = parseInt(match[3] || '0');
      return (hours * 3600) + (minutes * 60) + seconds;
    }
    
    return 0;
  }
}

// Global transformer instance
export const globalDataTransformer = new PlatformDataTransformer();

// Convenience functions
export function transformPlatformContent(rawData: any, platform: string): TransformResult<PlatformContent> {
  return globalDataTransformer.transformContent(rawData, platform);
}

export function transformPlatformMetrics(rawMetrics: any, platform: string): TransformResult<NormalizedMetrics> {
  return globalDataTransformer.transformMetrics(rawMetrics, platform);
}

export function transformPlatformTranscript(rawTranscript: any, platform: string): TransformResult<TranscriptSegment[]> {
  return globalDataTransformer.transformTranscript(rawTranscript, platform);
}

export function extractContentMetadata(content: PlatformContent): ContentMetadata {
  return globalDataTransformer.extractContentMetadata(content);
}

export function createDataTransformer(config?: Partial<DataTransformConfig>): PlatformDataTransformer {
  return new PlatformDataTransformer(config);
}