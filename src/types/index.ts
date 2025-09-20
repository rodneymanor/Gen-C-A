// Core type definitions for Gen.C Alpha Dashboard

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'creator' | 'admin' | 'super_admin' | 'team_member';
  plan: 'free' | 'premium' | 'enterprise';
  preferences: UserPreferences;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  notifications: NotificationSettings;
  accessibility: AccessibilitySettings;
}

export interface NotificationSettings {
  email: boolean;
  push: boolean;
  inApp: boolean;
  frequency: 'immediate' | 'daily' | 'weekly';
}

export interface AccessibilitySettings {
  reducedMotion: boolean;
  highContrast: boolean;
  fontSize: 'small' | 'medium' | 'large';
  screenReaderOptimized: boolean;
}

export interface ContentItem {
  id: string;
  title: string;
  description?: string;
  type: ContentType;
  platform?: Platform;
  thumbnail?: string;
  url?: string;
  duration?: number; // in seconds for video content
  wordCount?: number; // for script content
  tags: string[];
  creator?: string;
  created: Date;
  updated: Date;
  status: 'draft' | 'published' | 'archived';
  metadata: Record<string, any>;
}

export type ContentType = 'video' | 'script' | 'image' | 'note' | 'idea' | 'audio';
export type Platform = 'tiktok' | 'instagram' | 'youtube' | 'twitter' | 'linkedin' | 'facebook' | 'other';

export interface Collection {
  id: string;
  name: string;
  description?: string;
  thumbnail?: string;
  tags: string[];
  platforms: Platform[];
  videoCount: number;
  created: Date;
  updated: Date;
  isPrivate: boolean;
  previewVideos: ContentItem[];
}

export interface Script {
  id: string;
  title: string;
  content: string;
  platform: Platform;
  length: 'short' | 'medium' | 'long'; // 15s, 30s, 60s+
  style: 'engaging' | 'educational' | 'promotional' | 'storytelling';
  aiModel?: string;
  brandVoiceId?: string;
  voice?: {
    id: string;
    name: string;
    badges?: string[];
  };
  wordCount: number;
  estimatedDuration: number;
  insights: ScriptInsight[];
  created: Date;
  updated: Date;
}

export interface ScriptInsight {
  id: string;
  type: 'success' | 'warning' | 'suggestion';
  message: string;
  category: 'hook' | 'structure' | 'engagement' | 'cta' | 'optimization';
}

export interface AIGenerationRequest {
  prompt: string;
  aiModel: string;
  length: 'short' | 'medium' | 'long';
  style: 'engaging' | 'educational' | 'promotional' | 'storytelling' | string;
  platform: Platform;
  brandVoiceId?: string;
  brandVoiceCreatorId?: string;
  additionalSettings?: Record<string, any>;
}

export interface AIGenerationResponse {
  id: string;
  script: Script;
  status: 'generating' | 'completed' | 'failed';
  progress: number; // 0-100
  estimatedTimeRemaining?: number; // in seconds
  error?: string;
}

export interface BrandVoice {
  id: string;
  creatorId?: string;
  name: string;
  description: string;
  tone: string;
  voice: string;
  targetAudience: string;
  keywords: string[];
  platforms: Platform[];
  examples?: string[];
  created: Date;
  isDefault?: boolean;
  isShared?: boolean;
}

export interface Activity {
  id: string;
  type: 'created' | 'updated' | 'deleted' | 'generated' | 'imported';
  description: string;
  entityType: ContentType | 'collection' | 'brand-voice';
  entityId: string;
  timestamp: Date;
  user: User;
}

export interface SearchFilters {
  type?: ContentType[];
  platform?: Platform[];
  tags?: string[];
  dateRange?: {
    from: Date;
    to: Date;
  };
  creator?: string;
  status?: ('draft' | 'published' | 'archived')[];
}

export interface PaginationOptions {
  page: number;
  pageSize: number;
  total?: number;
}

export interface SortOptions {
  field: string;
  direction: 'asc' | 'desc';
}

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  errors?: string[];
  pagination?: PaginationOptions;
}

// Component prop types
export interface CardAction {
  id: string;
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  appearance?: 'default' | 'primary' | 'subtle' | 'warning' | 'danger';
  disabled?: boolean;
}

export interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  width?: number;
  render?: (value: any, item: any) => React.ReactNode;
}

export interface NavigationItem {
  path: string;
  label: string;
  icon: React.ReactNode;
  children?: NavigationItem[];
}

export interface NavigationSection {
  section: string;
  items: NavigationItem[];
}

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'small' | 'medium' | 'large' | 'fullscreen';
  actions?: React.ReactNode;
}

// Form types
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'file';
  placeholder?: string;
  required?: boolean;
  validation?: ValidationRule[];
  options?: SelectOption[];
}

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface ValidationRule {
  type: 'required' | 'email' | 'minLength' | 'maxLength' | 'pattern';
  value?: any;
  message: string;
}

// State management types
export interface AppState {
  user: User | null;
  isAuthenticated: boolean;
  collections: Collection[];
  scripts: Script[];
  contentLibrary: ContentItem[];
  activities: Activity[];
  brandVoices: BrandVoice[];
  loading: LoadingState;
  errors: ErrorState;
}

export interface LoadingState {
  global: boolean;
  collections: boolean;
  scripts: boolean;
  content: boolean;
  generation: boolean;
}

export interface ErrorState {
  global: string | null;
  collections: string | null;
  scripts: string | null;
  content: string | null;
  generation: string | null;
}

// Creator/Channels types
export interface Creator {
  id: string;
  name: string;
  username: string;
  avatar?: string;
  followerCount: number;
  platform: Platform;
  isVerified?: boolean;
  description?: string;
  tags: string[];
  metrics: {
    engagementRate?: number;
    averageViews?: number;
    avgLikes?: number;
  };
  created: Date;
  updated: Date;
}

export interface Watchlist {
  id: string;
  name: string;
  description?: string;
  creatorIds: string[];
  isPublic: boolean;
  created: Date;
  updated: Date;
  owner: string;
}

export interface PlatformFilter {
  platform: Platform;
  enabled: boolean;
  count?: number;
}

export interface CreatorFilters {
  search: string;
  platforms: PlatformFilter[];
  minFollowers?: number;
  maxFollowers?: number;
  tags: string[];
  verified?: boolean;
}

export interface CreatorPageState {
  creators: Creator[];
  filteredCreators: Creator[];
  watchlists: Watchlist[];
  activeFilters: CreatorFilters;
  selectedCreators: string[];
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
  isLoading: boolean;
  error: string | null;
}

// Hook return types
export interface UseAsyncReturn<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  execute: (...args: any[]) => Promise<void>;
  reset: () => void;
}

export interface UseFormReturn<T> {
  values: T;
  errors: Record<keyof T, string>;
  touched: Record<keyof T, boolean>;
  handleChange: (name: keyof T, value: any) => void;
  handleSubmit: (onSubmit: (values: T) => void) => void;
  reset: () => void;
  isValid: boolean;
  isDirty: boolean;
}
