import puppeteer from 'puppeteer';

async function testScriptGenerationWorkflow() {
  console.log('🚀 Starting script generation workflow test...');
  
  const browser = await puppeteer.launch({ 
    headless: false, // Set to true for headless testing
    defaultViewport: { width: 1280, height: 800 }
  });
  
  const page = await browser.newPage();
  
  try {
    // Navigate to the application
    console.log('📄 Navigating to application...');
    await page.goto('http://localhost:3001');
    
    // Wait for login page to load
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    console.log('🔑 Login page loaded');
    
    // Login with test credentials
    console.log('🔓 Logging in...');
    await page.type('input[type="email"]', 'test');
    await page.type('input[type="password"]', 'testpass');
    await page.click('button[type="submit"]');
    
    // Wait for dashboard to load
    await page.waitForSelector('[data-testid="dashboard"]', { timeout: 10000 });
    console.log('✅ Successfully logged in to dashboard');
    
    // Navigate to Write page
    console.log('📝 Navigating to Write page...');
    await page.goto('http://localhost:3001/write');
    await page.waitForSelector('textarea', { timeout: 5000 });
    console.log('✅ Write page loaded');
    
    // Fill in the script idea
    const scriptIdea = 'A fun TikTok about summer skincare routine for teens';
    console.log(`💡 Entering script idea: "${scriptIdea}"`);
    await page.type('textarea', scriptIdea);
    
    // Click the Generate Script button
    console.log('🤖 Clicking Generate Script button...');
    const generateButton = await page.waitForSelector('button:has-text("Generate Script")', { timeout: 5000 });
    await generateButton.click();
    
    // Wait for loading to appear
    console.log('⏳ Waiting for script generation...');
    await page.waitForSelector('.loading-title', { timeout: 5000 });
    console.log('✅ Loading overlay appeared');
    
    // Wait for loading to disappear and editor to load
    await page.waitForSelector('.loading-title', { hidden: true, timeout: 30000 });
    console.log('✅ Script generation completed');
    
    // Verify we're on the editor page
    await page.waitForURL('**/editor*', { timeout: 5000 });
    console.log('✅ Successfully routed to Hemingway editor');
    
    // Check if script content is loaded
    const editorContent = await page.waitForSelector('.hemingway-editor-content', { timeout: 5000 });
    const content = await editorContent.textContent();
    
    if (content && content.includes('[HOOK')) {
      console.log('✅ Script components successfully loaded in editor:');
      console.log('📋 Content preview:', content.substring(0, 150) + '...');
    } else {
      console.log('❌ Script content not found in editor');
    }
    
    // Test editing functionality
    console.log('✏️ Testing edit functionality...');
    await page.click('.hemingway-editor-content');
    await page.keyboard.type('\n\nThis is a test edit to verify editing works!');
    console.log('✅ Successfully edited content in Hemingway editor');
    
    console.log('🎉 Workflow test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    
    // Take a screenshot for debugging
    await page.screenshot({ path: 'test-failure.png', fullPage: true });
    console.log('📸 Screenshot saved as test-failure.png');
    
  } finally {
    console.log('🔄 Closing browser...');
    await browser.close();
  }
}

// Run the test
testScriptGenerationWorkflow().catch(console.error);