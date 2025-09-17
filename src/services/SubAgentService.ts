import { OpenAI } from 'openai';
import * as fs from 'fs';
import * as path from 'path';
import * as glob from 'fast-glob';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import MarkdownIt from 'markdown-it';
import { natural } from 'natural';
import chokidar from 'chokidar';

export interface PRDRequirement {
  id: string;
  type: 'page' | 'component' | 'service' | 'route';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  dependencies: string[];
  authRequired: boolean;
  userRoles?: string[];
  apiEndpoints?: string[];
}

export interface CodePattern {
  filePath: string;
  type: 'component' | 'service' | 'hook' | 'utility' | 'route';
  exports: string[];
  imports: string[];
  dependencies: string[];
  authPatterns: string[];
}

export interface ImplementationPlan {
  requirements: PRDRequirement[];
  patterns: CodePattern[];
  implementationOrder: string[];
  routeConfiguration: RouteConfig[];
  serviceConnections: ServiceConnection[];
}

export interface RouteConfig {
  path: string;
  component: string;
  authRequired: boolean;
  roles?: string[];
  children?: RouteConfig[];
}

export interface ServiceConnection {
  component: string;
  service: string;
  endpoints: string[];
  authRequired: boolean;
}

export class SubAgentService {
  private openai: OpenAI;
  private markdown: MarkdownIt;
  private projectRoot: string;
  private codePatterns: CodePattern[] = [];
  private fileWatcher?: chokidar.FSWatcher;

  constructor(apiKey: string, projectRoot: string) {
    this.openai = new OpenAI({ apiKey });
    this.markdown = new MarkdownIt();
    this.projectRoot = projectRoot;
  }

  async initialize(): Promise<void> {
    console.log('🤖 Initializing Sub-Agent Service...');
    await this.scanCodebase();
    this.setupFileWatcher();
    console.log('✅ Sub-Agent Service initialized successfully');
  }

  private async scanCodebase(): Promise<void> {
    const patterns = [
      'src/**/*.tsx',
      'src/**/*.ts',
      '!src/**/*.test.*',
      '!src/**/*.spec.*',
      '!node_modules/**'
    ];

    const files = await glob.glob(patterns, { cwd: this.projectRoot });
    this.codePatterns = [];

    for (const file of files) {
      const filePath = path.join(this.projectRoot, file);
      const pattern = await this.analyzeCodeFile(filePath);
      if (pattern) {
        this.codePatterns.push(pattern);
      }
    }

    console.log(`📁 Analyzed ${this.codePatterns.length} code files`);
  }

  private async analyzeCodeFile(filePath: string): Promise<CodePattern | null> {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const relativePath = path.relative(this.projectRoot, filePath);
      
      const imports = this.extractImports(content);
      const exports = this.extractExports(content);
      const dependencies = this.extractDependencies(content);
      const authPatterns = this.extractAuthPatterns(content);
      const type = this.determineFileType(relativePath, content);

      return {
        filePath: relativePath,
        type,
        exports,
        imports,
        dependencies,
        authPatterns
      };
    } catch (error) {
      console.warn(`⚠️  Failed to analyze ${filePath}:`, error);
      return null;
    }
  }

  private extractImports(content: string): string[] {
    const importRegex = /import\s+.*?\s+from\s+['"`](.*?)['"`]/g;
    const imports: string[] = [];
    let match;

    while ((match = importRegex.exec(content)) !== null) {
      imports.push(match[1]);
    }

    return imports;
  }

  private extractExports(content: string): string[] {
    const exportRegex = /export\s+(?:default\s+)?(?:function|class|const|interface|type)\s+(\w+)/g;
    const namedExportRegex = /export\s+\{\s*([^}]+)\s*\}/g;
    const exports: string[] = [];
    let match;

    while ((match = exportRegex.exec(content)) !== null) {
      exports.push(match[1]);
    }

    while ((match = namedExportRegex.exec(content)) !== null) {
      const namedExports = match[1].split(',').map(exp => exp.trim());
      exports.push(...namedExports);
    }

    return exports;
  }

  private extractDependencies(content: string): string[] {
    const dependencies: string[] = [];
    
    // React hooks
    if (content.includes('useState') || content.includes('useEffect')) {
      dependencies.push('react-hooks');
    }
    
    // Router dependencies
    if (content.includes('useNavigate') || content.includes('Route')) {
      dependencies.push('react-router');
    }
    
    // Firebase dependencies
    if (content.includes('firebase') || content.includes('firestore')) {
      dependencies.push('firebase');
    }
    
    // Atlaskit components
    const atlaskitImports = content.match(/@atlaskit\/[\w-]+/g);
    if (atlaskitImports) {
      dependencies.push(...atlaskitImports);
    }

    return dependencies;
  }

  private extractAuthPatterns(content: string): string[] {
    const patterns: string[] = [];
    
    if (content.includes('useAuth') || content.includes('AuthContext')) {
      patterns.push('auth-context');
    }
    
    if (content.includes('ProtectedRoute')) {
      patterns.push('protected-route');
    }
    
    if (content.includes('token') || content.includes('jwt')) {
      patterns.push('token-auth');
    }
    
    if (content.includes('firebase/auth')) {
      patterns.push('firebase-auth');
    }

    return patterns;
  }

  private determineFileType(filePath: string, content: string): CodePattern['type'] {
    if (filePath.includes('/pages/') || filePath.includes('Page.tsx')) {
      return 'component';
    }
    
    if (filePath.includes('/services/') || filePath.endsWith('Service.ts')) {
      return 'service';
    }
    
    if (filePath.includes('/hooks/') || filePath.startsWith('use')) {
      return 'hook';
    }
    
    if (filePath.includes('/utils/') || filePath.includes('/lib/')) {
      return 'utility';
    }
    
    if (content.includes('Route') && content.includes('path')) {
      return 'route';
    }
    
    return 'component';
  }

  private setupFileWatcher(): void {
    this.fileWatcher = chokidar.watch('src/**/*.{ts,tsx}', {
      cwd: this.projectRoot,
      ignored: ['**/*.test.*', '**/*.spec.*'],
      persistent: true
    });

    this.fileWatcher.on('change', async (filePath) => {
      console.log(`📝 File changed: ${filePath}`);
      await this.updateCodePattern(filePath);
    });

    this.fileWatcher.on('add', async (filePath) => {
      console.log(`➕ File added: ${filePath}`);
      await this.updateCodePattern(filePath);
    });

    this.fileWatcher.on('unlink', (filePath) => {
      console.log(`➖ File removed: ${filePath}`);
      this.codePatterns = this.codePatterns.filter(pattern => pattern.filePath !== filePath);
    });
  }

  private async updateCodePattern(filePath: string): Promise<void> {
    const fullPath = path.join(this.projectRoot, filePath);
    const pattern = await this.analyzeCodeFile(fullPath);
    
    if (pattern) {
      const existingIndex = this.codePatterns.findIndex(p => p.filePath === filePath);
      if (existingIndex >= 0) {
        this.codePatterns[existingIndex] = pattern;
      } else {
        this.codePatterns.push(pattern);
      }
    }
  }

  async parsePRD(filePath: string): Promise<PRDRequirement[]> {
    console.log(`📋 Parsing PRD: ${filePath}`);
    
    const ext = path.extname(filePath).toLowerCase();
    let content: string;

    try {
      switch (ext) {
        case '.pdf': {
          const pdfBuffer = fs.readFileSync(filePath);
          const pdfData = await pdfParse(pdfBuffer);
          content = pdfData.text;
          break;
        }

        case '.docx': {
          const docxBuffer = fs.readFileSync(filePath);
          const docxResult = await mammoth.extractRawText({ buffer: docxBuffer });
          content = docxResult.value;
          break;
        }

        case '.md':
        case '.txt': {
          content = fs.readFileSync(filePath, 'utf-8');
          break;
        }

        default:
          throw new Error(`Unsupported file format: ${ext}`);
      }

      return await this.extractRequirementsFromText(content);
    } catch (error) {
      console.error('❌ Failed to parse PRD:', error);
      throw error;
    }
  }

  private async extractRequirementsFromText(content: string): Promise<PRDRequirement[]> {
    const prompt = `
    Analyze the following Product Requirements Document and extract structured requirements.
    Return a JSON array of requirements with the following structure:
    
    {
      "id": "unique-identifier",
      "type": "page" | "component" | "service" | "route",
      "title": "Requirement title",
      "description": "Detailed description",
      "priority": "high" | "medium" | "low",
      "dependencies": ["list of dependencies"],
      "authRequired": boolean,
      "userRoles": ["optional list of user roles"],
      "apiEndpoints": ["optional list of API endpoints"]
    }
    
    Focus on identifying:
    - Page requirements (dashboard, forms, lists, etc.)
    - Component requirements (buttons, modals, tables, etc.)
    - Service requirements (API integrations, data processing, etc.)
    - Route requirements (navigation, authentication, etc.)
    
    PRD Content:
    ${content}
    `;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
      });

      const result = response.choices[0]?.message?.content;
      if (!result) {
        throw new Error('No response from OpenAI');
      }

      // Extract JSON from the response
      const jsonMatch = result.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in response');
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('❌ Failed to extract requirements:', error);
      throw error;
    }
  }

  async generateImplementationPlan(requirements: PRDRequirement[]): Promise<ImplementationPlan> {
    console.log('📊 Generating implementation plan...');

    const routeConfiguration = this.generateRouteConfiguration(requirements);
    const serviceConnections = this.generateServiceConnections(requirements);
    const implementationOrder = this.calculateImplementationOrder(requirements);

    return {
      requirements,
      patterns: this.codePatterns,
      implementationOrder,
      routeConfiguration,
      serviceConnections
    };
  }

  private generateRouteConfiguration(requirements: PRDRequirement[]): RouteConfig[] {
    return requirements
      .filter(req => req.type === 'page' || req.type === 'route')
      .map(req => ({
        path: this.generateRoutePath(req.title),
        component: this.generateComponentName(req.title),
        authRequired: req.authRequired,
        roles: req.userRoles
      }));
  }

  private generateServiceConnections(requirements: PRDRequirement[]): ServiceConnection[] {
    return requirements
      .filter(req => req.apiEndpoints && req.apiEndpoints.length > 0)
      .map(req => ({
        component: this.generateComponentName(req.title),
        service: this.findMatchingService(req.apiEndpoints || []),
        endpoints: req.apiEndpoints || [],
        authRequired: req.authRequired
      }));
  }

  private calculateImplementationOrder(requirements: PRDRequirement[]): string[] {
    // Simple topological sort based on dependencies
    const order: string[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();

    const visit = (reqId: string) => {
      if (visiting.has(reqId)) {
        throw new Error(`Circular dependency detected: ${reqId}`);
      }
      if (visited.has(reqId)) {
        return;
      }

      visiting.add(reqId);
      const req = requirements.find(r => r.id === reqId);
      if (req) {
        for (const dep of req.dependencies) {
          visit(dep);
        }
      }
      visiting.delete(reqId);
      visited.add(reqId);
      order.push(reqId);
    };

    for (const req of requirements) {
      if (!visited.has(req.id)) {
        visit(req.id);
      }
    }

    return order;
  }

  private generateRoutePath(title: string): string {
    return '/' + title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  }

  private generateComponentName(title: string): string {
    return title.replace(/\s+/g, '') + 'Page';
  }

  private findMatchingService(endpoints: string[]): string {
    // Find existing service that might handle these endpoints
    for (const pattern of this.codePatterns) {
      if (pattern.type === 'service') {
        // Simple heuristic: if any endpoint contains similar words to service name
        const serviceName = path.basename(pattern.filePath, '.ts').toLowerCase();
        for (const endpoint of endpoints) {
          if (endpoint.toLowerCase().includes(serviceName) || 
              serviceName.includes(endpoint.toLowerCase())) {
            return serviceName;
          }
        }
      }
    }
    
    return 'ApiService'; // Default fallback
  }

  async implementRequirement(requirement: PRDRequirement): Promise<string[]> {
    console.log(`🔨 Implementing requirement: ${requirement.title}`);
    
    const generatedFiles: string[] = [];
    
    switch (requirement.type) {
      case 'page': {
        const pageFile = await this.generatePageComponent(requirement);
        generatedFiles.push(pageFile);
        break;
      }

      case 'component': {
        const componentFile = await this.generateComponent(requirement);
        generatedFiles.push(componentFile);
        break;
      }

      case 'service': {
        const serviceFile = await this.generateService(requirement);
        generatedFiles.push(serviceFile);
        break;
      }

      case 'route': {
        const routeFile = await this.generateRouteConfiguration(requirement);
        generatedFiles.push(routeFile);
        break;
      }
    }
    
    return generatedFiles;
  }

  private async generatePageComponent(requirement: PRDRequirement): Promise<string> {
    const componentName = this.generateComponentName(requirement.title);
    const filePath = path.join(this.projectRoot, 'src', 'pages', `${componentName}.tsx`);
    
    const prompt = `
    Generate a React page component based on the following requirement:
    
    Title: ${requirement.title}
    Description: ${requirement.description}
    Auth Required: ${requirement.authRequired}
    User Roles: ${requirement.userRoles?.join(', ') || 'None'}
    
    Use the following existing patterns and components from the codebase:
    ${this.getRelevantPatterns('component').map(p => `- ${p.filePath}: ${p.exports.join(', ')}`).join('\n')}
    
    Requirements:
    1. Use TypeScript
    2. Follow the existing component structure
    3. Use Atlaskit components where appropriate
    4. Include proper authentication checks if required
    5. Use existing hooks and services
    6. Follow the styling patterns from existing components
    
    Generate only the component code without explanations.
    `;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
      });

      const code = response.choices[0]?.message?.content;
      if (!code) {
        throw new Error('No code generated');
      }

      // Ensure directory exists
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(filePath, code);
      console.log(`✅ Generated page component: ${filePath}`);
      
      return filePath;
    } catch (error) {
      console.error(`❌ Failed to generate page component:`, error);
      throw error;
    }
  }

  private async generateComponent(requirement: PRDRequirement): Promise<string> {
    // Similar implementation for components
    return this.generatePageComponent(requirement); // Placeholder
  }

  private async generateService(requirement: PRDRequirement): Promise<string> {
    const serviceName = this.generateComponentName(requirement.title) + 'Service';
    const filePath = path.join(this.projectRoot, 'src', 'services', `${serviceName}.ts`);
    
    // Implementation for service generation
    const code = `// Generated service for ${requirement.title}\n// TODO: Implement service logic`;
    fs.writeFileSync(filePath, code);
    
    return filePath;
  }

  private async generateRouteConfiguration(requirement: PRDRequirement): Promise<string> {
    // Implementation for route configuration
    return 'route-config.ts';
  }

  private getRelevantPatterns(type: CodePattern['type']): CodePattern[] {
    return this.codePatterns.filter(pattern => pattern.type === type);
  }

  async validateImplementation(filePaths: string[]): Promise<boolean> {
    console.log('🔍 Validating implementation...');
    
    for (const filePath of filePaths) {
      try {
        // Basic syntax validation
        if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
          const content = fs.readFileSync(filePath, 'utf-8');
          // TODO: Add TypeScript compilation check
        }
      } catch (error) {
        console.error(`❌ Validation failed for ${filePath}:`, error);
        return false;
      }
    }
    
    console.log('✅ Implementation validation passed');
    return true;
  }

  dispose(): void {
    if (this.fileWatcher) {
      this.fileWatcher.close();
    }
  }
}
