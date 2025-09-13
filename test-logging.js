import puppeteer from 'puppeteer';

async function testWithLogging() {
  console.log('🚀 Starting logging test...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1280, height: 800 }
  });
  
  const page = await browser.newPage();
  
  // Capture all console logs
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    console.log(`🖥️ [${type.toUpperCase()}] ${text}`);
  });
  
  page.on('pageerror', error => {
    console.log('❌ [PAGE ERROR]', error.message);
  });
  
  try {
    console.log('📄 Navigating to app...');
    await page.goto('http://localhost:3001', { waitUntil: 'networkidle0' });
    
    // Handle login if redirected
    const currentUrl = page.url();
    if (currentUrl.includes('login')) {
      console.log('🔑 Login required, logging in...');
      
      // Wait for login form
      await page.waitForSelector('input[type="email"], input[name="email"]');
      await page.type('input[type="email"], input[name="email"]', 'test');
      await page.type('input[type="password"], input[name="password"]', 'testpass');
      
      // Click sign in
      const signInButton = await page.$('button[type="submit"]');
      if (signInButton) {
        await signInButton.click();
        console.log('✅ Login attempted');
        
        // Wait for redirect
        await page.waitForNavigation({ waitUntil: 'networkidle0' });
      }
    }
    
    console.log('📄 Navigating to write page...');
    await page.goto('http://localhost:3001/write', { waitUntil: 'networkidle0' });
    
    console.log('⏳ Waiting for page to fully load...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Enter text in textarea
    console.log('📝 Entering script idea...');
    const textarea = await page.$('textarea');
    if (textarea) {
      await textarea.type('A fun TikTok about summer skincare tips');
      console.log('✅ Text entered successfully');
    } else {
      console.log('❌ No textarea found');
    }
    
    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Click generate button
    console.log('🔍 Looking for Generate Script button...');
    const buttons = await page.$$('button');
    console.log(`🔘 Found ${buttons.length} buttons`);
    
    for (let i = 0; i < buttons.length; i++) {
      const buttonText = await page.evaluate(el => el.textContent, buttons[i]);
      console.log(`🔘 Button ${i}: "${buttonText}"`);
      
      if (buttonText && buttonText.includes('Generate Script')) {
        console.log('🎯 Found Generate Script button, clicking...');
        await buttons[i].click();
        console.log('✅ Button clicked');
        break;
      }
    }
    
    // Wait for responses
    console.log('⏳ Waiting for script generation...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Check final URL
    const finalUrl = page.url();
    console.log('🌐 Final URL:', finalUrl);
    
    if (finalUrl.includes('editor')) {
      console.log('🎉 Successfully navigated to editor!');
    } else {
      console.log('⚠️ Still on same page');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    console.log('🔄 Closing browser...');
    await browser.close();
  }
}

testWithLogging().catch(console.error);