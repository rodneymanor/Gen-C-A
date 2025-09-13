export interface SubAgentConfig {
  openai: {
    apiKey: string;
    model: string;
    temperature: number;
  };
  project: {
    rootPath: string;
    srcPath: string;
    outputPath: string;
  };
  scanning: {
    patterns: string[];
    ignore: string[];
    watchMode: boolean;
  };
  generation: {
    componentTemplate: string;
    serviceTemplate: string;
    routeTemplate: string;
  };
  validation: {
    typeCheck: boolean;
    lint: boolean;
    testing: boolean;
  };
}

export const defaultSubAgentConfig: SubAgentConfig = {
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    model: 'gpt-4',
    temperature: 0.1,
  },
  project: {
    rootPath: process.cwd(),
    srcPath: 'src',
    outputPath: 'src/generated',
  },
  scanning: {
    patterns: [
      'src/**/*.tsx',
      'src/**/*.ts',
      '!src/**/*.test.*',
      '!src/**/*.spec.*',
      '!node_modules/**',
    ],
    ignore: [
      'node_modules',
      'dist',
      'build',
      '.git',
      'coverage',
    ],
    watchMode: true,
  },
  generation: {
    componentTemplate: 'atlaskit-react',
    serviceTemplate: 'firebase-service',
    routeTemplate: 'react-router-v6',
  },
  validation: {
    typeCheck: true,
    lint: true,
    testing: false,
  },
};

export function loadSubAgentConfig(): SubAgentConfig {
  // In a real implementation, this would load from a config file
  // For now, return the default configuration
  return {
    ...defaultSubAgentConfig,
    openai: {
      ...defaultSubAgentConfig.openai,
      apiKey: process.env.OPENAI_API_KEY || '',
    },
  };
}