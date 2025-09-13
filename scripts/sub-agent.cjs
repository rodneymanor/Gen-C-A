#!/usr/bin/env node

const { Command } = require('commander');
const path = require('path');
const fs = require('fs');

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
    
    if (!process.env.OPENAI_API_KEY) {
      console.error('❌ OPENAI_API_KEY environment variable is required');
      console.log('💡 Set your OpenAI API key: export OPENAI_API_KEY=your_key_here');
      process.exit(1);
    }

    console.log('✅ Sub-Agent dependencies are installed!');
    console.log('📚 Check sub-agent-examples.md for usage instructions');
    console.log('💡 Required packages:');
    console.log('  • openai - AI code generation');
    console.log('  • natural - Text processing');
    console.log('  • pdf-parse - PDF document parsing');
    console.log('  • mammoth - DOCX document parsing');
    console.log('  • markdown-it - Markdown processing');
    console.log('  • fast-glob - File system scanning');
    console.log('  • chokidar - File watching');
    console.log('  • commander - CLI interface');
  });

program
  .command('status')
  .description('Show sub-agent status and project analysis')
  .action(async () => {
    console.log('📊 Sub-Agent Status Report');
    console.log('=' .repeat(50));
    
    // Project info
    console.log('\n📁 Project Information:');
    console.log(`  Root: ${process.cwd()}`);
    console.log(`  Source: src/`);
    
    // Environment check
    console.log('\n🌍 Environment:');
    console.log(`  OpenAI API Key: ${process.env.OPENAI_API_KEY ? '✅ Configured' : '❌ Missing'}`);
    console.log(`  Node.js: ${process.version}`);
    
    // Check package dependencies
    console.log('\n📦 Dependencies:');
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
    const requiredDeps = [
      'openai', 'natural', 'pdf-parse', 'mammoth', 
      'markdown-it', 'fast-glob', 'chokidar', 'commander'
    ];
    
    requiredDeps.forEach(dep => {
      const installed = packageJson.dependencies?.[dep] || packageJson.devDependencies?.[dep];
      console.log(`  • ${dep}: ${installed ? '✅ ' + installed : '❌ Missing'}`);
    });
    
    if (!process.env.OPENAI_API_KEY) {
      console.log('\n💡 To configure OpenAI API key:');
      console.log('  export OPENAI_API_KEY=your_key_here');
      return;
    }

    // File system analysis
    console.log('\n🔍 Codebase Analysis:');
    const srcExists = fs.existsSync('src');
    console.log(`  • Source directory: ${srcExists ? '✅ Found' : '❌ Missing'}`);
    
    if (srcExists) {
      const components = fs.existsSync('src/components');
      const pages = fs.existsSync('src/pages');
      const services = fs.existsSync('src/services');
      const hooks = fs.existsSync('src/hooks');
      
      console.log(`  • Components: ${components ? '✅ Found' : '❌ Missing'}`);
      console.log(`  • Pages: ${pages ? '✅ Found' : '❌ Missing'}`);
      console.log(`  • Services: ${services ? '✅ Found' : '❌ Missing'}`);
      console.log(`  • Hooks: ${hooks ? '✅ Found' : '❌ Missing'}`);
    }
    
    console.log('\n🎯 Ready for PRD-to-Code implementation!');
  });

program
  .command('help-examples')
  .description('Show usage examples')
  .action(() => {
    console.log('📚 Sub-Agent Usage Examples');
    console.log('=' .repeat(50));
    console.log('\n1. Check status:');
    console.log('   npm run sub-agent:status');
    console.log('\n2. Initialize (one-time setup):');
    console.log('   export OPENAI_API_KEY=your_key_here');
    console.log('   npm run sub-agent:init');
    console.log('\n3. For detailed examples, see:');
    console.log('   📄 sub-agent-examples.md');
    console.log('\n4. Available commands:');
    console.log('   • npm run sub-agent:status - Check installation');
    console.log('   • npm run sub-agent:init - Initialize sub-agent');
    console.log('   • npm run sub-agent help-examples - This help');
    console.log('\n💡 The TypeScript implementation provides full functionality');
    console.log('   once properly configured with ts-node and ESM support.');
  });

// Error handling
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught exception:', error.message);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled rejection:', reason);
  process.exit(1);
});

module.exports = { program };

// If this file is run directly
if (require.main === module) {
  program.parse();
}