import puppeteer from 'puppeteer';

async function testSimpleWorkflow() {
  console.log('🚀 Starting simplified script generation test...');
  
  const browser = await puppeteer.launch({ 
    headless: false, // Keep visible for debugging
    defaultViewport: { width: 1280, height: 800 }
  });
  
  const page = await browser.newPage();
  
  // Capture console logs and errors
  page.on('console', msg => console.log('🖥️  Browser console:', msg.text()));
  page.on('pageerror', error => console.log('❌ Page error:', error.message));
  page.on('requestfailed', request => console.log('🚫 Failed request:', request.url()));
  
  try {
    // Test if server is responding
    console.log('📄 Testing server connection...');
    const response = await page.goto('http://localhost:3001', { waitUntil: 'networkidle0' });
    console.log(`✅ Server responded with status: ${response.status()}`);
    
    // Take a screenshot to see what we get
    await page.screenshot({ path: 'homepage.png', fullPage: true });
    console.log('📸 Homepage screenshot saved as homepage.png');
    
    // Let's try to navigate directly to write page
    console.log('📝 Navigating directly to write page...');
    await page.goto('http://localhost:3001/write', { waitUntil: 'networkidle0' });
    
    // Take another screenshot
    await page.screenshot({ path: 'write-page.png', fullPage: true });
    console.log('📸 Write page screenshot saved as write-page.png');
    
    // Check page content
    const content = await page.content();
    console.log('📄 Page title:', await page.title());
    console.log('📄 Page has React root:', content.includes('root'));
    console.log('📄 Page has scripts:', content.includes('script'));
    
    // Let's try to wait for any React component to load
    console.log('⏳ Waiting for page to load...');
    await new Promise(resolve => setTimeout(resolve, 3000)); // Give it time to load
    
    // Look for any interactive elements
    const buttons = await page.$$('button');
    const inputs = await page.$$('input, textarea');
    
    console.log(`🔘 Found ${buttons.length} buttons`);
    console.log(`📝 Found ${inputs.length} inputs/textareas`);
    
    if (inputs.length > 0) {
      console.log('✅ Found input elements, attempting to test script generation...');
      
      // Try to find the textarea for script input
      const textarea = await page.$('textarea');
      if (textarea) {
        console.log('📝 Found textarea, entering script idea...');
        await textarea.type('A fun TikTok about summer skincare routine for teens');
        
        // Look for generate button
        const generateBtn = await page.$('button:has-text("Generate")');
        if (generateBtn) {
          console.log('🤖 Found Generate button, clicking...');
          await generateBtn.click();
          
          // Wait a moment to see what happens
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Check if we get redirected or see loading
          const currentUrl = page.url();
          console.log('🌐 Current URL after clicking:', currentUrl);
          
          if (currentUrl.includes('editor')) {
            console.log('🎉 Successfully redirected to editor!');
          } else {
            console.log('⏳ Waiting for navigation or loading...');
            await new Promise(resolve => setTimeout(resolve, 5000));
          }
        }
      }
    }
    
    console.log('✅ Test completed');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await page.screenshot({ path: 'error-screenshot.png', fullPage: true });
    console.log('📸 Error screenshot saved');
  } finally {
    console.log('🔄 Closing browser...');
    await browser.close();
  }
}

testSimpleWorkflow().catch(console.error);