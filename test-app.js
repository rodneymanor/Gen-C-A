import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  
  try {
    const page = await browser.newPage();
    
    // Enable console and error logging
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', error => console.log('ERROR:', error.message));

    console.log('Testing http://localhost:3000...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });

    // Wait for React to render
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Check if content loaded
    const content = await page.evaluate(() => {
      const root = document.getElementById('root');
      return {
        hasRoot: !!root,
        rootHTML: root ? root.innerHTML.substring(0, 200) : 'No root found',
        title: document.title,
        bodyText: document.body.innerText.substring(0, 100)
      };
    });

    console.log('✅ App Status:', content);

    // Test channels page
    console.log('Testing /channels page...');
    await page.goto('http://localhost:3000/channels', { waitUntil: 'networkidle2' });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const channelsContent = await page.evaluate(() => ({
      bodyText: document.body.innerText.substring(0, 200),
      hasChannelsContent: document.body.innerText.includes('Channels')
    }));
    
    console.log('✅ Channels Page:', channelsContent);

  } catch (error) {
    console.log('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
})();