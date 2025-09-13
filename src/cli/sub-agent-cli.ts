#!/usr/bin/env node

import { Command } from 'commander';
import * as path from 'path';
import * as fs from 'fs';
import { SubAgentService } from '../services/SubAgentService';
import { loadSubAgentConfig } from '../config/sub-agent.config';

const program = new Command();

program
  .name('sub-agent')
  .description('AI-powered PRD to Code implementation sub-agent')
  .version('1.0.0');

program
  .command('init')
  .description('Initialize the sub-agent in the current project')
  .action(async () => {
    console.log('🚀 Initializing Sub-Agent...');
    
    const config = loadSubAgentConfig();
    
    if (!config.openai.apiKey) {
      console.error('❌ OPENAI_API_KEY environment variable is required');
      console.log('💡 Set your OpenAI API key: export OPENAI_API_KEY=your_key_here');
      process.exit(1);
    }

    try {
      const subAgent = new SubAgentService(config.openai.apiKey, config.project.rootPath);
      await subAgent.initialize();
      console.log('✅ Sub-Agent initialized successfully!');
    } catch (error) {
      console.error('❌ Failed to initialize sub-agent:', error);
      process.exit(1);
    }
  });

program
  .command('analyze')
  .description('Analyze PRD document and generate implementation plan')
  .requiredOption('-f, --file <path>', 'Path to PRD document (PDF, DOCX, MD, or TXT)')
  .option('-o, --output <path>', 'Output path for implementation plan', 'implementation-plan.json')
  .action(async (options) => {
    console.log(`📋 Analyzing PRD: ${options.file}`);
    
    const config = loadSubAgentConfig();
    
    if (!config.openai.apiKey) {
      console.error('❌ OPENAI_API_KEY environment variable is required');
      process.exit(1);
    }

    if (!fs.existsSync(options.file)) {
      console.error(`❌ PRD file not found: ${options.file}`);
      process.exit(1);
    }

    try {
      const subAgent = new SubAgentService(config.openai.apiKey, config.project.rootPath);
      await subAgent.initialize();
      
      const requirements = await subAgent.parsePRD(options.file);
      console.log(`📊 Extracted ${requirements.length} requirements`);
      
      const plan = await subAgent.generateImplementationPlan(requirements);
      console.log(`📈 Generated implementation plan with ${plan.implementationOrder.length} steps`);
      
      fs.writeFileSync(options.output, JSON.stringify(plan, null, 2));
      console.log(`✅ Implementation plan saved to: ${options.output}`);
      
      // Display summary
      console.log('\n📋 Requirements Summary:');
      requirements.forEach(req => {
        console.log(`  • ${req.title} (${req.type}) - Priority: ${req.priority}`);
      });
      
      console.log('\n🔄 Implementation Order:');
      plan.implementationOrder.forEach((reqId, index) => {
        const req = requirements.find(r => r.id === reqId);
        console.log(`  ${index + 1}. ${req?.title || reqId}`);
      });
      
      subAgent.dispose();
    } catch (error) {
      console.error('❌ Failed to analyze PRD:', error);
      process.exit(1);
    }
  });

program
  .command('implement')
  .description('Implement requirements from a plan file')
  .requiredOption('-p, --plan <path>', 'Path to implementation plan JSON file')
  .option('-r, --requirement <id>', 'Implement specific requirement by ID')
  .option('--dry-run', 'Show what would be implemented without actually generating files')
  .action(async (options) => {
    console.log(`🔨 Implementing from plan: ${options.plan}`);
    
    const config = loadSubAgentConfig();
    
    if (!config.openai.apiKey) {
      console.error('❌ OPENAI_API_KEY environment variable is required');
      process.exit(1);
    }

    if (!fs.existsSync(options.plan)) {
      console.error(`❌ Plan file not found: ${options.plan}`);
      process.exit(1);
    }

    try {
      const planContent = fs.readFileSync(options.plan, 'utf-8');
      const plan = JSON.parse(planContent);
      
      const subAgent = new SubAgentService(config.openai.apiKey, config.project.rootPath);
      await subAgent.initialize();
      
      if (options.requirement) {
        // Implement specific requirement
        const requirement = plan.requirements.find((req: any) => req.id === options.requirement);
        if (!requirement) {
          console.error(`❌ Requirement not found: ${options.requirement}`);
          process.exit(1);
        }
        
        if (options.dryRun) {
          console.log(`📋 Would implement: ${requirement.title}`);
        } else {
          const files = await subAgent.implementRequirement(requirement);
          console.log(`✅ Implemented ${requirement.title}:`);
          files.forEach(file => console.log(`  • ${file}`));
        }
      } else {
        // Implement all requirements in order
        let implementedCount = 0;
        
        for (const reqId of plan.implementationOrder) {
          const requirement = plan.requirements.find((req: any) => req.id === reqId);
          if (!requirement) {
            console.warn(`⚠️  Requirement not found: ${reqId}`);
            continue;
          }
          
          if (options.dryRun) {
            console.log(`📋 Would implement: ${requirement.title}`);
          } else {
            try {
              const files = await subAgent.implementRequirement(requirement);
              console.log(`✅ Implemented ${requirement.title}:`);
              files.forEach(file => console.log(`  • ${file}`));
              implementedCount++;
            } catch (error) {
              console.error(`❌ Failed to implement ${requirement.title}:`, error);
            }
          }
        }
        
        if (!options.dryRun) {
          console.log(`\n🎉 Successfully implemented ${implementedCount} requirements!`);
        }
      }
      
      subAgent.dispose();
    } catch (error) {
      console.error('❌ Failed to implement requirements:', error);
      process.exit(1);
    }
  });

program
  .command('watch')
  .description('Watch for changes and provide real-time assistance')
  .action(async () => {
    console.log('👀 Starting file watcher...');
    
    const config = loadSubAgentConfig();
    
    if (!config.openai.apiKey) {
      console.error('❌ OPENAI_API_KEY environment variable is required');
      process.exit(1);
    }

    try {
      const subAgent = new SubAgentService(config.openai.apiKey, config.project.rootPath);
      await subAgent.initialize();
      
      console.log('✅ Sub-Agent is now watching for changes...');
      console.log('Press Ctrl+C to stop');
      
      // Keep the process running
      process.on('SIGINT', () => {
        console.log('\n👋 Stopping sub-agent...');
        subAgent.dispose();
        process.exit(0);
      });
      
      // Keep alive
      setInterval(() => {}, 1000);
    } catch (error) {
      console.error('❌ Failed to start watcher:', error);
      process.exit(1);
    }
  });

program
  .command('validate')
  .description('Validate generated code and implementation')
  .option('-p, --path <path>', 'Path to validate (default: src/)', 'src/')
  .action(async (options) => {
    console.log(`🔍 Validating code in: ${options.path}`);
    
    const config = loadSubAgentConfig();
    
    if (!config.openai.apiKey) {
      console.error('❌ OPENAI_API_KEY environment variable is required');
      process.exit(1);
    }

    try {
      const subAgent = new SubAgentService(config.openai.apiKey, config.project.rootPath);
      await subAgent.initialize();
      
      // Get all TypeScript files in the path
      const glob = await import('fast-glob');
      const files = await glob.glob(`${options.path}/**/*.{ts,tsx}`, {
        ignore: ['**/*.test.*', '**/*.spec.*'],
        absolute: true
      });
      
      const isValid = await subAgent.validateImplementation(files);
      
      if (isValid) {
        console.log('✅ All validations passed!');
      } else {
        console.log('❌ Validation failed');
        process.exit(1);
      }
      
      subAgent.dispose();
    } catch (error) {
      console.error('❌ Validation error:', error);
      process.exit(1);
    }
  });

program
  .command('status')
  .description('Show sub-agent status and project analysis')
  .action(async () => {
    console.log('📊 Sub-Agent Status Report');
    console.log('=' .repeat(50));
    
    const config = loadSubAgentConfig();
    
    // Project info
    console.log('\n📁 Project Information:');
    console.log(`  Root: ${config.project.rootPath}`);
    console.log(`  Source: ${config.project.srcPath}`);
    
    // Environment check
    console.log('\n🌍 Environment:');
    console.log(`  OpenAI API Key: ${config.openai.apiKey ? '✅ Configured' : '❌ Missing'}`);
    console.log(`  Node.js: ${process.version}`);
    
    if (!config.openai.apiKey) {
      console.log('\n💡 To configure OpenAI API key:');
      console.log('  export OPENAI_API_KEY=your_key_here');
      return;
    }

    try {
      const subAgent = new SubAgentService(config.openai.apiKey, config.project.rootPath);
      await subAgent.initialize();
      
      console.log('\n🔍 Codebase Analysis:');
      console.log('  (Analysis results would be displayed here)');
      
      subAgent.dispose();
    } catch (error) {
      console.error('\n❌ Failed to analyze project:', error);
    }
  });

// Error handling
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

export { program };

// If this file is run directly
if (require.main === module) {
  program.parse();
}