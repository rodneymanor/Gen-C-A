import { describe, it, expect } from 'vitest';
import type {
  User,
  UserPreferences,
  NotificationSettings,
  AccessibilitySettings,
  ContentItem,
  ContentType,
  Platform,
  Collection,
  Script,
  ScriptInsight,
  AIGenerationRequest,
  AIGenerationResponse,
  BrandPersona,
  Activity,
  SearchFilters,
  PaginationOptions,
  SortOptions,
  ApiResponse,
  CardAction,
  TableColumn,
  NavigationItem,
  NavigationSection,
  ModalProps,
  FormField,
  SelectOption,
  ValidationRule,
  AppState,
  LoadingState,
  ErrorState,
  UseAsyncReturn,
  UseFormReturn
} from '../types';

describe('TypeScript Type Safety Tests', () => {
  describe('User Related Types', () => {
    it('should have proper User type structure', () => {
      const mockUser: User = {
        id: '1',
        name: 'Test User',
        email: 'test@example.com',
        avatar: 'avatar.jpg',
        role: 'creator',
        plan: 'premium',
        preferences: {
          theme: 'light',
          language: 'en',
          notifications: {
            email: true,
            push: true,
            inApp: true,
            frequency: 'immediate'
          },
          accessibility: {
            reducedMotion: false,
            highContrast: false,
            fontSize: 'medium',
            screenReaderOptimized: false
          }
        }
      };

      // Type assertions to ensure the structure is correct
      expect(typeof mockUser.id).toBe('string');
      expect(typeof mockUser.name).toBe('string');
      expect(typeof mockUser.email).toBe('string');
      expect(['creator', 'admin', 'team_member']).toContain(mockUser.role);
      expect(['free', 'premium', 'enterprise']).toContain(mockUser.plan);
      expect(typeof mockUser.preferences).toBe('object');
    });

    it('should have proper UserPreferences type structure', () => {
      const preferences: UserPreferences = {
        theme: 'dark',
        language: 'es',
        notifications: {
          email: false,
          push: true,
          inApp: false,
          frequency: 'weekly'
        },
        accessibility: {
          reducedMotion: true,
          highContrast: true,
          fontSize: 'large',
          screenReaderOptimized: true
        }
      };

      expect(['light', 'dark', 'system']).toContain(preferences.theme);
      expect(typeof preferences.language).toBe('string');
      expect(typeof preferences.notifications).toBe('object');
      expect(typeof preferences.accessibility).toBe('object');
    });

    it('should have proper NotificationSettings type structure', () => {
      const notifications: NotificationSettings = {
        email: true,
        push: false,
        inApp: true,
        frequency: 'daily'
      };

      expect(typeof notifications.email).toBe('boolean');
      expect(typeof notifications.push).toBe('boolean');
      expect(typeof notifications.inApp).toBe('boolean');
      expect(['immediate', 'daily', 'weekly']).toContain(notifications.frequency);
    });

    it('should have proper AccessibilitySettings type structure', () => {
      const accessibility: AccessibilitySettings = {
        reducedMotion: false,
        highContrast: false,
        fontSize: 'small',
        screenReaderOptimized: false
      };

      expect(typeof accessibility.reducedMotion).toBe('boolean');
      expect(typeof accessibility.highContrast).toBe('boolean');
      expect(['small', 'medium', 'large']).toContain(accessibility.fontSize);
      expect(typeof accessibility.screenReaderOptimized).toBe('boolean');
    });
  });

  describe('Content Related Types', () => {
    it('should have proper ContentItem type structure', () => {
      const contentItem: ContentItem = {
        id: '1',
        title: 'Test Video',
        description: 'A test video',
        type: 'video',
        platform: 'tiktok',
        thumbnail: 'thumb.jpg',
        url: 'https://example.com/video',
        duration: 30,
        wordCount: 100,
        tags: ['test', 'video'],
        creator: 'Test Creator',
        created: new Date(),
        updated: new Date(),
        status: 'published',
        metadata: { views: 1000 }
      };

      expect(typeof contentItem.id).toBe('string');
      expect(typeof contentItem.title).toBe('string');
      expect(['video', 'script', 'image', 'note', 'idea', 'audio']).toContain(contentItem.type);
      expect(['tiktok', 'instagram', 'youtube', 'twitter', 'linkedin', 'facebook', 'other']).toContain(contentItem.platform);
      expect(['draft', 'published', 'archived']).toContain(contentItem.status);
      expect(Array.isArray(contentItem.tags)).toBe(true);
      expect(contentItem.created instanceof Date).toBe(true);
      expect(typeof contentItem.metadata).toBe('object');
    });

    it('should have proper ContentType literals', () => {
      const types: ContentType[] = ['video', 'script', 'image', 'note', 'idea', 'audio'];
      types.forEach(type => {
        expect(['video', 'script', 'image', 'note', 'idea', 'audio']).toContain(type);
      });
    });

    it('should have proper Platform literals', () => {
      const platforms: Platform[] = ['tiktok', 'instagram', 'youtube', 'twitter', 'linkedin', 'facebook', 'other'];
      platforms.forEach(platform => {
        expect(['tiktok', 'instagram', 'youtube', 'twitter', 'linkedin', 'facebook', 'other']).toContain(platform);
      });
    });

    it('should have proper Collection type structure', () => {
      const collection: Collection = {
        id: '1',
        name: 'Test Collection',
        description: 'A test collection',
        thumbnail: 'thumb.jpg',
        tags: ['test'],
        platforms: ['tiktok', 'instagram'],
        videoCount: 5,
        created: new Date(),
        updated: new Date(),
        isPrivate: false,
        previewVideos: []
      };

      expect(typeof collection.id).toBe('string');
      expect(typeof collection.name).toBe('string');
      expect(Array.isArray(collection.tags)).toBe(true);
      expect(Array.isArray(collection.platforms)).toBe(true);
      expect(typeof collection.videoCount).toBe('number');
      expect(typeof collection.isPrivate).toBe('boolean');
      expect(Array.isArray(collection.previewVideos)).toBe(true);
    });
  });

  describe('Script Related Types', () => {
    it('should have proper Script type structure', () => {
      const script: Script = {
        id: '1',
        title: 'Test Script',
        content: 'Script content',
        platform: 'tiktok',
        length: 'short',
        style: 'engaging',
        aiModel: 'gpt-4',
        persona: 'casual',
        wordCount: 50,
        estimatedDuration: 15,
        insights: [],
        created: new Date(),
        updated: new Date()
      };

      expect(typeof script.id).toBe('string');
      expect(typeof script.content).toBe('string');
      expect(['short', 'medium', 'long']).toContain(script.length);
      expect(['engaging', 'educational', 'promotional', 'storytelling']).toContain(script.style);
      expect(typeof script.wordCount).toBe('number');
      expect(Array.isArray(script.insights)).toBe(true);
    });

    it('should have proper ScriptInsight type structure', () => {
      const insight: ScriptInsight = {
        id: '1',
        type: 'success',
        message: 'Great hook!',
        category: 'hook'
      };

      expect(typeof insight.id).toBe('string');
      expect(['success', 'warning', 'suggestion']).toContain(insight.type);
      expect(typeof insight.message).toBe('string');
      expect(['hook', 'structure', 'engagement', 'cta', 'optimization']).toContain(insight.category);
    });

    it('should have proper AIGenerationRequest type structure', () => {
      const request: AIGenerationRequest = {
        prompt: 'Generate a TikTok script',
        aiModel: 'gpt-4',
        length: 'short',
        style: 'engaging',
        platform: 'tiktok',
        persona: 'casual',
        additionalSettings: { temperature: 0.7 }
      };

      expect(typeof request.prompt).toBe('string');
      expect(typeof request.aiModel).toBe('string');
      expect(['short', 'medium', 'long']).toContain(request.length);
      expect(typeof request.style).toBe('string');
      expect(typeof request.additionalSettings).toBe('object');
    });

    it('should have proper AIGenerationResponse type structure', () => {
      const response: AIGenerationResponse = {
        id: '1',
        script: {
          id: '1',
          title: 'Generated Script',
          content: 'Script content',
          platform: 'tiktok',
          length: 'short',
          style: 'engaging',
          wordCount: 50,
          estimatedDuration: 15,
          insights: [],
          created: new Date(),
          updated: new Date()
        },
        status: 'completed',
        progress: 100,
        estimatedTimeRemaining: 0
      };

      expect(typeof response.id).toBe('string');
      expect(typeof response.script).toBe('object');
      expect(['generating', 'completed', 'failed']).toContain(response.status);
      expect(typeof response.progress).toBe('number');
    });
  });

  describe('Brand and Activity Types', () => {
    it('should have proper BrandPersona type structure', () => {
      const persona: BrandPersona = {
        id: '1',
        name: 'Casual Brand',
        description: 'A casual brand persona',
        tone: 'friendly',
        voice: 'conversational',
        targetAudience: 'young adults',
        keywords: ['casual', 'friendly'],
        platforms: ['tiktok', 'instagram'],
        examples: ['Example 1', 'Example 2'],
        created: new Date()
      };

      expect(typeof persona.id).toBe('string');
      expect(typeof persona.name).toBe('string');
      expect(typeof persona.description).toBe('string');
      expect(Array.isArray(persona.keywords)).toBe(true);
      expect(Array.isArray(persona.platforms)).toBe(true);
      expect(Array.isArray(persona.examples)).toBe(true);
    });

    it('should have proper Activity type structure', () => {
      const activity: Activity = {
        id: '1',
        type: 'created',
        description: 'Created a new video',
        entityType: 'video',
        entityId: '123',
        timestamp: new Date(),
        user: {
          id: '1',
          name: 'Test User',
          email: 'test@example.com',
          role: 'creator',
          plan: 'premium',
          preferences: {
            theme: 'light',
            language: 'en',
            notifications: {
              email: true,
              push: true,
              inApp: true,
              frequency: 'immediate'
            },
            accessibility: {
              reducedMotion: false,
              highContrast: false,
              fontSize: 'medium',
              screenReaderOptimized: false
            }
          }
        }
      };

      expect(typeof activity.id).toBe('string');
      expect(['created', 'updated', 'deleted', 'generated', 'imported']).toContain(activity.type);
      expect(typeof activity.description).toBe('string');
      expect(activity.timestamp instanceof Date).toBe(true);
      expect(typeof activity.user).toBe('object');
    });
  });

  describe('Utility Types', () => {
    it('should have proper SearchFilters type structure', () => {
      const filters: SearchFilters = {
        type: ['video', 'script'],
        platform: ['tiktok'],
        tags: ['test'],
        dateRange: {
          from: new Date('2024-01-01'),
          to: new Date('2024-01-31')
        },
        creator: 'Test Creator',
        status: ['published']
      };

      expect(Array.isArray(filters.type)).toBe(true);
      expect(Array.isArray(filters.platform)).toBe(true);
      expect(Array.isArray(filters.tags)).toBe(true);
      expect(typeof filters.dateRange).toBe('object');
      expect(filters.dateRange?.from instanceof Date).toBe(true);
    });

    it('should have proper PaginationOptions type structure', () => {
      const pagination: PaginationOptions = {
        page: 1,
        pageSize: 20,
        total: 100
      };

      expect(typeof pagination.page).toBe('number');
      expect(typeof pagination.pageSize).toBe('number');
      expect(typeof pagination.total).toBe('number');
    });

    it('should have proper SortOptions type structure', () => {
      const sort: SortOptions = {
        field: 'created',
        direction: 'desc'
      };

      expect(typeof sort.field).toBe('string');
      expect(['asc', 'desc']).toContain(sort.direction);
    });

    it('should have proper ApiResponse type structure', () => {
      const response: ApiResponse<string[]> = {
        data: ['item1', 'item2'],
        success: true,
        message: 'Success',
        errors: [],
        pagination: {
          page: 1,
          pageSize: 20,
          total: 2
        }
      };

      expect(Array.isArray(response.data)).toBe(true);
      expect(typeof response.success).toBe('boolean');
      expect(typeof response.message).toBe('string');
      expect(Array.isArray(response.errors)).toBe(true);
      expect(typeof response.pagination).toBe('object');
    });
  });

  describe('Component Types', () => {
    it('should have proper CardAction type structure', () => {
      const action: CardAction = {
        id: '1',
        label: 'Edit',
        icon: '✏️',
        onClick: () => {},
        appearance: 'primary',
        disabled: false
      };

      expect(typeof action.id).toBe('string');
      expect(typeof action.label).toBe('string');
      expect(typeof action.onClick).toBe('function');
      expect(['default', 'primary', 'subtle', 'warning', 'danger']).toContain(action.appearance);
    });

    it('should have proper TableColumn type structure', () => {
      const column: TableColumn = {
        key: 'name',
        label: 'Name',
        sortable: true,
        width: 200,
        render: (value) => value.toString()
      };

      expect(typeof column.key).toBe('string');
      expect(typeof column.label).toBe('string');
      expect(typeof column.sortable).toBe('boolean');
      expect(typeof column.width).toBe('number');
      expect(typeof column.render).toBe('function');
    });

    it('should have proper NavigationItem type structure', () => {
      const navItem: NavigationItem = {
        path: '/dashboard',
        label: 'Dashboard',
        icon: '📊',
        badge: '3',
        children: [
          {
            path: '/dashboard/overview',
            label: 'Overview',
            icon: '👀'
          }
        ]
      };

      expect(typeof navItem.path).toBe('string');
      expect(typeof navItem.label).toBe('string');
      expect(typeof navItem.icon).toBe('string');
      expect(Array.isArray(navItem.children)).toBe(true);
    });

    it('should have proper FormField type structure', () => {
      const field: FormField = {
        name: 'email',
        label: 'Email Address',
        type: 'email',
        placeholder: 'Enter your email',
        required: true,
        validation: [
          {
            type: 'required',
            message: 'Email is required'
          },
          {
            type: 'email',
            message: 'Must be a valid email'
          }
        ],
        options: []
      };

      expect(typeof field.name).toBe('string');
      expect(typeof field.label).toBe('string');
      expect(['text', 'email', 'password', 'textarea', 'select', 'checkbox', 'radio', 'file']).toContain(field.type);
      expect(Array.isArray(field.validation)).toBe(true);
      expect(Array.isArray(field.options)).toBe(true);
    });
  });

  describe('State Management Types', () => {
    it('should have proper AppState type structure', () => {
      const appState: AppState = {
        user: null,
        isAuthenticated: false,
        collections: [],
        scripts: [],
        contentLibrary: [],
        activities: [],
        brandPersonas: [],
        loading: {
          global: false,
          collections: false,
          scripts: false,
          content: false,
          generation: false
        },
        errors: {
          global: null,
          collections: null,
          scripts: null,
          content: null,
          generation: null
        }
      };

      expect(typeof appState.isAuthenticated).toBe('boolean');
      expect(Array.isArray(appState.collections)).toBe(true);
      expect(Array.isArray(appState.scripts)).toBe(true);
      expect(Array.isArray(appState.contentLibrary)).toBe(true);
      expect(typeof appState.loading).toBe('object');
      expect(typeof appState.errors).toBe('object');
    });

    it('should have proper LoadingState type structure', () => {
      const loadingState: LoadingState = {
        global: false,
        collections: true,
        scripts: false,
        content: false,
        generation: true
      };

      Object.values(loadingState).forEach(value => {
        expect(typeof value).toBe('boolean');
      });
    });

    it('should have proper ErrorState type structure', () => {
      const errorState: ErrorState = {
        global: 'Global error',
        collections: null,
        scripts: 'Script error',
        content: null,
        generation: null
      };

      Object.values(errorState).forEach(value => {
        expect(value === null || typeof value === 'string').toBe(true);
      });
    });
  });

  describe('Hook Types', () => {
    it('should have proper UseAsyncReturn type structure', () => {
      // This would normally be returned by a hook, but we can test the structure
      const mockReturn: UseAsyncReturn<string[]> = {
        data: ['item1', 'item2'],
        loading: false,
        error: null,
        execute: async () => {},
        reset: () => {}
      };

      expect(Array.isArray(mockReturn.data)).toBe(true);
      expect(typeof mockReturn.loading).toBe('boolean');
      expect(mockReturn.error === null || typeof mockReturn.error === 'string').toBe(true);
      expect(typeof mockReturn.execute).toBe('function');
      expect(typeof mockReturn.reset).toBe('function');
    });

    it('should have proper UseFormReturn type structure', () => {
      interface FormData {
        name: string;
        email: string;
      }

      const mockReturn: UseFormReturn<FormData> = {
        values: { name: 'John', email: 'john@example.com' },
        errors: { name: '', email: 'Invalid email' },
        touched: { name: true, email: false },
        handleChange: () => {},
        handleSubmit: () => {},
        reset: () => {},
        isValid: false,
        isDirty: true
      };

      expect(typeof mockReturn.values).toBe('object');
      expect(typeof mockReturn.errors).toBe('object');
      expect(typeof mockReturn.touched).toBe('object');
      expect(typeof mockReturn.handleChange).toBe('function');
      expect(typeof mockReturn.handleSubmit).toBe('function');
      expect(typeof mockReturn.reset).toBe('function');
      expect(typeof mockReturn.isValid).toBe('boolean');
      expect(typeof mockReturn.isDirty).toBe('boolean');
    });
  });

  describe('Type Constraints and Validation', () => {
    it('should enforce proper enum constraints', () => {
      // Test that TypeScript would catch invalid values at compile time
      const validRoles: User['role'][] = ['creator', 'admin', 'team_member'];
      const validPlans: User['plan'][] = ['free', 'premium', 'enterprise'];
      const validThemes: UserPreferences['theme'][] = ['light', 'dark', 'system'];
      
      validRoles.forEach(role => {
        expect(['creator', 'admin', 'team_member']).toContain(role);
      });
      
      validPlans.forEach(plan => {
        expect(['free', 'premium', 'enterprise']).toContain(plan);
      });
      
      validThemes.forEach(theme => {
        expect(['light', 'dark', 'system']).toContain(theme);
      });
    });

    it('should ensure required fields are present', () => {
      // This test verifies that required fields exist in type definitions
      // TypeScript would catch missing required fields at compile time
      
      const minimalUser: Pick<User, 'id' | 'name' | 'email' | 'role' | 'plan' | 'preferences'> = {
        id: '1',
        name: 'Test',
        email: 'test@example.com',
        role: 'creator',
        plan: 'free',
        preferences: {
          theme: 'light',
          language: 'en',
          notifications: {
            email: true,
            push: true,
            inApp: true,
            frequency: 'immediate'
          },
          accessibility: {
            reducedMotion: false,
            highContrast: false,
            fontSize: 'medium',
            screenReaderOptimized: false
          }
        }
      };

      expect(minimalUser.id).toBeDefined();
      expect(minimalUser.name).toBeDefined();
      expect(minimalUser.email).toBeDefined();
    });

    it('should allow optional fields to be undefined', () => {
      const minimalContentItem: Omit<ContentItem, 'description' | 'platform' | 'thumbnail' | 'url' | 'duration' | 'wordCount'> = {
        id: '1',
        title: 'Test',
        type: 'video',
        tags: [],
        created: new Date(),
        updated: new Date(),
        status: 'draft',
        metadata: {}
      };

      // Optional fields should be allowed to be undefined
      expect(minimalContentItem.id).toBeDefined();
      expect(minimalContentItem.title).toBeDefined();
      // description, platform, etc. are optional and not included
    });
  });
});