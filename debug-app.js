import puppeteer from 'puppeteer';

(async () => {
  console.log('🚀 Starting browser to debug the app...');
  
  const browser = await puppeteer.launch({
    headless: false, // Show browser for debugging
    defaultViewport: null,
    args: ['--start-maximized']
  });

  try {
    const page = await browser.newPage();
    
    // Enable console logging from the page
    page.on('console', msg => {
      console.log('🖥️  PAGE LOG:', msg.type(), msg.text());
    });
    
    // Enable error logging
    page.on('pageerror', error => {
      console.log('❌ PAGE ERROR:', error.message);
    });
    
    // Enable request failed logging
    page.on('requestfailed', request => {
      console.log('🚫 REQUEST FAILED:', request.url(), request.failure().errorText);
    });

    console.log('🌐 Navigating to http://localhost:3000...');
    await page.goto('http://localhost:3000', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });

    // Wait a bit to see what loads
    await page.waitForTimeout(3000);

    // Check if we can find any content
    const bodyContent = await page.evaluate(() => document.body.innerHTML);
    console.log('📄 Body content length:', bodyContent.length);
    
    if (bodyContent.length < 100) {
      console.log('⚠️  Very little content found. Body HTML:', bodyContent);
    } else {
      console.log('✅ Content found. App seems to be loading.');
    }

    // Check for React root
    const reactRoot = await page.$('#root');
    if (reactRoot) {
      const rootContent = await page.evaluate(el => el.innerHTML, reactRoot);
      console.log('⚛️  React root content length:', rootContent.length);
      
      if (rootContent.length < 50) {
        console.log('⚠️  React root is nearly empty:', rootContent);
      }
    } else {
      console.log('❌ No React root element found');
    }

    // Take a screenshot
    await page.screenshot({ path: '/tmp/app-debug.png', fullPage: true });
    console.log('📸 Screenshot saved to /tmp/app-debug.png');

    // Try navigating to channels page
    console.log('🔗 Navigating to /channels...');
    await page.goto('http://localhost:3000/channels', { 
      waitUntil: 'networkidle2',
      timeout: 15000 
    });
    
    await page.waitForTimeout(2000);
    
    const channelsContent = await page.evaluate(() => document.body.innerHTML);
    console.log('📄 Channels page content length:', channelsContent.length);

  } catch (error) {
    console.log('💥 Error during debugging:', error.message);
  } finally {
    // Keep browser open for manual inspection
    console.log('🔍 Browser left open for manual inspection. Close when done.');
    // await browser.close();
  }
})();