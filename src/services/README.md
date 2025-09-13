# Video Processing Pipeline Services

A complete, reusable video processing pipeline extracted from a React application. This package provides comprehensive video processing capabilities including multi-platform video download, CDN integration, transcription services, AI-powered content analysis, and background job orchestration.

## Features

### 🎥 Multi-Platform Video Download
- **Supported Platforms**: TikTok, Instagram, YouTube
- **Direct CDN URL Detection**: Optimized handling for CDN video URLs
- **Metadata Extraction**: Views, likes, author information, hashtags
- **Error Handling**: Comprehensive retry patterns with exponential backoff
- **Platform Validation**: URL format validation and platform detection

### 🌐 CDN Integration (Bunny.net)
- **Stream Upload**: Direct streaming from video URLs to CDN
- **Buffer Upload**: Upload video buffers with retry logic
- **Thumbnail Management**: Custom thumbnail upload and generation
- **URL Generation**: Automatic iframe and direct URL generation
- **Video Management**: Delete videos, get video information

### 🎙️ Transcription Services
- **Multiple Providers**: Gemini, OpenAI Whisper, RapidAPI
- **URL & Buffer Support**: Transcribe from URLs or video buffers
- **Fallback System**: Automatic fallback when primary providers fail
- **File Validation**: Size and format validation for uploads
- **Provider Status**: Monitor availability of transcription providers

### 🤖 AI-Powered Content Analysis
- **Script Component Analysis**: Extract Hook, Bridge, Nugget, WTA components
- **Visual Analysis**: Analyze video visual content and scenes
- **Content Analysis**: Sentiment, topics, keywords, engagement metrics
- **Multi-Provider Support**: Gemini, OpenAI, Claude integrations
- **Comprehensive Results**: Combined analysis with metadata

### ⚙️ Background Job Orchestration
- **Queue Management**: In-memory and persistent queue implementations
- **Job Types**: Transcription, analysis, upload, processing jobs
- **Status Tracking**: Real-time job status and progress monitoring
- **Error Handling**: Retry logic with configurable parameters
- **Cleanup**: Automatic cleanup of old completed jobs

### 🔄 Pipeline Orchestration
- **End-to-End Processing**: Complete video processing workflow
- **Error Recovery**: Comprehensive error handling and retry patterns
- **Parallel Processing**: Concurrent execution where possible
- **Health Monitoring**: Service health checks and status reporting
- **Background Mode**: Fire-and-forget processing with status updates

## Quick Start

```typescript
import { processVideoUrl, createQuickVideoProcessor } from './services';

// Simple video processing
const result = await processVideoUrl('https://www.tiktok.com/@user/video/123456789');
console.log('Processing result:', result);

// Advanced setup
const { videoProcessingService, pipelineOrchestrator } = createQuickVideoProcessor({
  bunnyConfig: {
    libraryId: 'your-bunny-library-id',
    apiKey: 'your-bunny-api-key',
    hostname: 'your-bunny-hostname'
  },
  enableBackground: true,
  maxRetries: 3
});

const result = await videoProcessingService.processVideo(videoUrl, {
  title: 'My Processed Video',
  skipTranscription: false,
  skipAIAnalysis: false,
  background: false
});
```

## Architecture

### Service Architecture
```
┌─────────────────────────────────────────────────────────────────┐
│                    Pipeline Orchestrator                       │
├─────────────────────────────────────────────────────────────────┤
│  • Coordinates all services                                    │
│  • Error handling & retry patterns                             │
│  • Background job management                                   │
│  • Health monitoring                                           │
└─────────────────────────────────────────────────────────────────┘
                                   │
           ┌───────────────────────┼───────────────────────┐
           │                       │                       │
           ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Video Download  │    │   CDN Service   │    │ Background Jobs │
│    Service      │    │                 │    │    Service      │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ • TikTok        │    │ • Bunny.net     │    │ • Queue Mgmt    │
│ • Instagram     │    │ • Upload/Stream │    │ • Job Status    │
│ • YouTube       │    │ • Thumbnails    │    │ • Retry Logic   │
│ • Platform      │    │ • URL Gen       │    │ • Cleanup       │
│   Detection     │    │ • Management    │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
           │                       │                       │
           ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Transcription   │    │ AI Analysis     │    │ Service Health  │
│    Service      │    │    Service      │    │   Monitoring    │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ • Gemini        │    │ • Script Comp.  │    │ • Status Checks │
│ • OpenAI        │    │ • Visual Anal.  │    │ • Metrics       │
│ • RapidAPI      │    │ • Content Anal. │    │ • Dependencies  │
│ • Fallbacks     │    │ • Multi-Model   │    │ • Alerts        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Processing Pipeline Flow
```
Video URL Input
       │
       ▼
┌─────────────────┐
│   Validation    │ ──→ Platform Detection
│   & Platform    │     URL Format Check
│   Detection     │     Support Verification
└─────────────────┘
       │
       ▼
┌─────────────────┐
│ Video Download  │ ──→ Multi-platform Scraping
│   & Metadata    │     Video Buffer Download
│   Extraction    │     Metrics & Metadata
└─────────────────┘
       │
       ▼
┌─────────────────┐
│   CDN Upload    │ ──→ Stream to Bunny.net
│  & Processing   │     Thumbnail Upload
│                 │     URL Generation
└─────────────────┘
       │
       ▼
┌─────────────────┐
│ Transcription   │ ──→ Provider Selection
│   Service       │     Audio-to-Text
│                 │     Fallback Handling
└─────────────────┘
       │
       ▼
┌─────────────────┐
│  AI Analysis    │ ──→ Script Components
│                 │     Visual Analysis
│                 │     Content Analysis
└─────────────────┘
       │
       ▼
┌─────────────────┐
│ Final Result    │ ──→ Video Document
│  & Storage      │     Status Updates
│                 │     Error Handling
└─────────────────┘
```

## Configuration

### Environment Variables
```bash
# CDN Configuration (Required)
BUNNY_STREAM_LIBRARY_ID=your-library-id
BUNNY_STREAM_API_KEY=your-api-key
BUNNY_CDN_HOSTNAME=your-cdn-hostname

# Transcription Providers (Optional)
GEMINI_API_KEY=your-gemini-key
OPENAI_API_KEY=your-openai-key
RAPIDAPI_KEY=your-rapidapi-key

# AI Analysis Providers (Optional)
ANTHROPIC_API_KEY=your-claude-key

# Internal API Security
INTERNAL_API_SECRET=your-internal-secret
```

### Pipeline Configuration
```typescript
import { createDefaultPipelineConfig } from './services';

const config = createDefaultPipelineConfig({
  maxRetries: 3,
  operationTimeout: 120000,
  enableParallelProcessing: true,
  backgroundProcessing: {
    enabled: true,
    queuePriority: 'normal',
    maxConcurrentJobs: 5,
    jobTimeout: 300000
  },
  fallbackBehavior: 'partial', // 'fail' | 'partial' | 'continue'
  cdn: {
    libraryId: process.env.BUNNY_STREAM_LIBRARY_ID,
    apiKey: process.env.BUNNY_STREAM_API_KEY,
    hostname: process.env.BUNNY_CDN_HOSTNAME
  }
});
```

## Usage Examples

### Basic Video Processing
```typescript
import { VideoProcessingService, createQuickVideoProcessor } from './services';

// Simple processing
const { videoProcessingService } = createQuickVideoProcessor();

const result = await videoProcessingService.processVideo(
  'https://www.tiktok.com/@user/video/123456789',
  {
    title: 'My TikTok Video',
    skipTranscription: false,
    skipAIAnalysis: false,
    background: false
  }
);

if (result.success) {
  console.log('Video processed successfully!');
  console.log('Video ID:', result.videoId);
  console.log('CDN URLs:', {
    iframe: result.iframeUrl,
    direct: result.directUrl
  });
}
```

### Individual Service Usage
```typescript
import { 
  VideoDownloadService, 
  CDNService, 
  TranscriptionService, 
  AIAnalysisService 
} from './services';

// Download only
const downloadService = new VideoDownloadService();
const downloadResult = await downloadService.downloadVideo(videoUrl);

// CDN upload
const cdnService = new CDNService({
  libraryId: 'your-library-id',
  apiKey: 'your-api-key', 
  hostname: 'your-hostname'
});
const cdnResult = await cdnService.streamFromUrl(videoUrl, 'filename.mp4');

// Transcription
const transcriptionService = new TranscriptionService();
const transcript = await transcriptionService.transcribeFromUrl(videoUrl, 'tiktok');

// AI Analysis
const aiService = new AIAnalysisService();
const components = await aiService.analyzeScriptComponents(transcript.transcript);
```

### Background Processing
```typescript
import { PipelineOrchestrator, createDefaultPipelineConfig } from './services';

const config = createDefaultPipelineConfig();
const orchestrator = new PipelineOrchestrator(config);

// Start background processing
const execution = await orchestrator.executeBackground({
  videoUrl: 'https://www.instagram.com/reel/ABC123/',
  options: {
    title: 'Instagram Reel',
    priority: 'high'
  },
  metadata: {
    userId: 'user123',
    requestId: 'req456',
    startTime: Date.now()
  }
});

console.log('Background job started:', execution.jobId);

// Monitor progress
const status = await orchestrator.getExecutionStatus(execution.jobId);
console.log('Progress:', status.progress + '%');
```

### Health Monitoring
```typescript
import { checkServicesHealth, PipelineOrchestrator } from './services';

// Quick health check
const health = await checkServicesHealth();
console.log('Overall health:', health.overall);
console.log('Service statuses:', health.services);

// Detailed monitoring
const orchestrator = new PipelineOrchestrator(config);
const detailedHealth = await orchestrator.getHealthStatus();

console.log('Pipeline metrics:', detailedHealth.metrics);
console.log('Active jobs:', detailedHealth.metrics.activeJobs);
console.log('Success rate:', detailedHealth.metrics.successRate);
```

## Error Handling

The pipeline includes comprehensive error handling with retry patterns:

```typescript
// Errors are returned in results, not thrown
const result = await videoProcessingService.processVideo(url);

if (!result.success) {
  console.error('Processing failed:', result.error);
  console.log('Transcription status:', result.transcriptionStatus);
}

// Custom error handling
try {
  const downloadResult = await downloadService.downloadVideo(invalidUrl);
} catch (error) {
  if (error instanceof VideoProcessingError) {
    console.log('Error code:', error.code);
    console.log('Retryable:', error.retryable);
    console.log('Step:', error.step);
  }
}
```

## Performance Considerations

- **Parallel Processing**: Enable parallel processing for faster execution
- **Background Jobs**: Use background processing for long-running operations  
- **CDN Streaming**: Direct URL streaming is faster than buffer uploads
- **Provider Fallbacks**: Configure multiple providers for reliability
- **Connection Pooling**: Services reuse connections where possible
- **Memory Management**: Large video buffers are handled efficiently

## Integration with External Services

### Bunny.net CDN
- Stream videos directly to CDN without local storage
- Custom thumbnail upload support
- Automatic URL generation for embedding
- Video management and deletion capabilities

### Transcription Providers
- **Gemini**: Multimodal analysis with visual context
- **OpenAI Whisper**: High-accuracy speech-to-text
- **RapidAPI**: Platform-specific transcription services
- **Fallback**: Graceful degradation when providers are unavailable

### AI Analysis Providers  
- **Gemini**: Advanced multimodal analysis capabilities
- **OpenAI GPT**: Text analysis and content understanding
- **Claude**: Alternative analysis provider (placeholder)

## Monitoring and Observability

The pipeline includes built-in monitoring capabilities:

- **Health Checks**: Automatic service health monitoring
- **Metrics**: Processing time, success rates, queue depth
- **Error Tracking**: Detailed error logging with context
- **Job Status**: Real-time job progress and status updates
- **Service Dependencies**: Monitor external service availability

## Migration Guide

To migrate from the original React application:

1. **Install Dependencies**: Ensure all required environment variables are set
2. **Update Imports**: Replace direct imports with service imports
3. **Configuration**: Use `createDefaultPipelineConfig()` for setup
4. **Error Handling**: Update error handling to use result objects
5. **Background Jobs**: Replace inline processing with background service
6. **Health Monitoring**: Add health checks to your application

## API Reference

See `service-interfaces.ts` for complete type definitions and interfaces.

## Contributing

When contributing to this extracted pipeline:

1. Maintain interface compatibility
2. Add comprehensive error handling
3. Include retry patterns for external services
4. Update health checks for new services
5. Add monitoring and logging
6. Update documentation and examples

## License

This extracted pipeline maintains the same license as the original React application.