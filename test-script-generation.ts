#!/usr/bin/env ts-node

/**
 * Test script to verify the script generation workflow
 * This will test the entire process: idea → Gemini → full transcript → components
 */

import { AIAnalysisService } from './src/services/ai-analysis-service.js';

async function testScriptGeneration() {
  try {
    console.log('🚀 [TEST] Starting script generation test...');
    
    // Test idea
    const testIdea = "How to make money online with AI";
    const scriptLength = "60";
    
    console.log(`📝 [TEST] Test idea: "${testIdea}"`);
    console.log(`⏱️ [TEST] Target length: ${scriptLength} seconds`);
    
    // Create comprehensive prompt for AI analysis
    const scriptPrompt = `
Generate a ${scriptLength}-second script for the following idea: "${testIdea}"

Please create engaging content that follows this structure:
- Hook: An attention-grabbing opener that stops people from scrolling
- Bridge: A transition that connects the hook to the main content
- Golden Nugget: The core value or main insight 
- WTA (What to Action): A compelling call-to-action that encourages engagement

The script should be optimized for social media platforms and designed to maximize viewer engagement and retention.

Please ensure the content is valuable, actionable, and appropriate for a ${scriptLength}-second format.
    `.trim();
    
    console.log('📊 [TEST] Prompt length:', scriptPrompt.length, 'characters');
    console.log('📤 [TEST] Sending to AI Analysis Service...');
    
    // Initialize AI service
    const aiService = new AIAnalysisService();
    
    // Get provider status first
    console.log('🔍 [TEST] Checking AI provider status...');
    const providerStatus = aiService.getProviderStatus();
    console.log('📋 [TEST] Provider status:', JSON.stringify(providerStatus, null, 2));
    
    // Test script component analysis
    console.log('🤖 [TEST] Calling analyzeScriptComponents...');
    const components = await aiService.analyzeScriptComponents(scriptPrompt);
    
    if (!components) {
      console.error('❌ [TEST] No components returned from AI service');
      return;
    }
    
    console.log('✅ [TEST] Script components generated successfully!');
    console.log('📝 [TEST] Generated components:');
    console.log('  Hook:', components.hook);
    console.log('  Bridge:', components.bridge);
    console.log('  Nugget:', components.nugget);
    console.log('  WTA:', components.wta);
    
    // Test if components are properly structured
    const hasAllComponents = components.hook && components.bridge && components.nugget && components.wta;
    
    if (hasAllComponents) {
      console.log('🎉 [TEST] SUCCESS: All script components generated!');
      
      // Test the complete analysis workflow
      console.log('🔄 [TEST] Testing complete analysis workflow...');
      const completeAnalysis = await aiService.performCompleteAnalysis(scriptPrompt);
      
      console.log('📊 [TEST] Complete analysis result:');
      console.log('  Success:', completeAnalysis.success);
      console.log('  Components available:', !!completeAnalysis.components);
      console.log('  Processing time recorded:', completeAnalysis.metadata.processedAt);
      
      if (completeAnalysis.components) {
        console.log('🧩 [TEST] Complete analysis components:');
        console.log('  Hook:', completeAnalysis.components.hook);
        console.log('  Bridge:', completeAnalysis.components.bridge);
        console.log('  Nugget:', completeAnalysis.components.nugget);
        console.log('  WTA:', completeAnalysis.components.wta);
      }
      
    } else {
      console.error('❌ [TEST] FAILURE: Missing script components');
      console.error('  Hook present:', !!components.hook);
      console.error('  Bridge present:', !!components.bridge);
      console.error('  Nugget present:', !!components.nugget);
      console.error('  WTA present:', !!components.wta);
    }
    
  } catch (error) {
    console.error('❌ [TEST] Script generation test failed:', error);
    console.error('❌ [TEST] Error details:', error instanceof Error ? error.message : 'Unknown error');
    if (error instanceof Error && error.stack) {
      console.error('❌ [TEST] Stack trace:', error.stack);
    }
  }
}

// Run the test
testScriptGeneration();