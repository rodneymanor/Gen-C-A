import puppeteer from 'puppeteer';

async function getDialogsCount(page) {
  return await page.evaluate(() => document.querySelectorAll('[role="dialog"]').length);
}

(async () => {
  const headless = process.env.HEADLESS !== 'false';
  const baseUrl = process.env.APP_URL || 'http://localhost:3000';
  const browser = await puppeteer.launch({ headless });
  const page = await browser.newPage();

  try {
    page.on('console', (msg) => console.log('[PAGE]', msg.type(), msg.text()));
    page.on('pageerror', (err) => console.error('[PAGE ERROR]', err.message));
    page.on('dialog', async (dialog) => {
      console.log('[PAGE DIALOG]', dialog.type(), dialog.message());
      await dialog.dismiss();
    });

    // First navigate to origin to set localStorage bypass
    await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.evaluate(() => {
      localStorage.setItem('bypassAuth', '1');
      localStorage.setItem('userId', 'puppeteer-test-user');
    });

    // Go to collections
    await page.goto(`${baseUrl}/collections`, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 500));

    // Click Add to Collections
    const addBtn = await page.waitForSelector('[data-testid="btn-add-to-collections"]', { visible: true, timeout: 5000 });
    await addBtn.focus();
    await page.keyboard.press('Enter');
    await page.evaluate(() => {
      const el = document.querySelector('[data-testid="btn-add-to-collections"]');
      if (el) el.click();
    });
    await page.waitForFunction(() => {
      const dlg = document.querySelector('[role="dialog"]');
      return !!dlg && /Add Video to Collection/i.test(dlg.textContent || '');
    }, { timeout: 5000 });
    // Ensure dialog remains visible
    await new Promise(r => setTimeout(r, 600));
    let count = await getDialogsCount(page);
    console.log('Dialog count after open:', count);
    if (count !== 1) throw new Error(`Expected 1 dialog after opening Add, got ${count}`);

    // Close via Cancel
    const [cancelBtn1] = await page.$x("//div[@role='dialog']//button[normalize-space()='Cancel']");
    if (!cancelBtn1) throw new Error('Cancel button not found in Add dialog');
    await cancelBtn1.click();
    await new Promise(r => setTimeout(r, 200));
    count = await getDialogsCount(page);
    if (count !== 0) throw new Error(`Expected 0 dialogs after cancel, got ${count}`);

    // Click Create Collection
    const createBtn = await page.waitForSelector('[data-testid="btn-create-collection"]', { visible: true, timeout: 5000 });
    await createBtn.focus();
    await page.keyboard.press('Enter');
    await page.evaluate(() => {
      const el = document.querySelector('[data-testid="btn-create-collection"]');
      if (el) el.click();
    });
    await page.waitForFunction(() => {
      const dlg = document.querySelector('[role="dialog"]');
      return !!dlg && /Create Collection/i.test(dlg.textContent || '');
    }, { timeout: 5000 });

    // Double-click Add to Collections and ensure only one dialog remains and it's the Add dialog
    await page.click('[data-testid="btn-add-to-collections"]', { clickCount: 2, delay: 50 });
    await new Promise(r => setTimeout(r, 300));
    count = await getDialogsCount(page);
    console.log('Dialog count after double click:', count);
    if (count !== 1) throw new Error(`Double click should not open multiple dialogs; got ${count}`);

    const addTitleVisible = await page.evaluate(() => {
      const dlg = document.querySelector('[role="dialog"]');
      return !!dlg && /Add Video to Collection/i.test(dlg.textContent || '');
    });
    if (!addTitleVisible) throw new Error('Expected Add Video to Collection dialog after double click');

    // Sanity fill URL input and Cancel
    const urlInput = await page.$('[role="dialog"] input.gen-input');
    if (urlInput) {
      await urlInput.type('https://www.tiktok.com/@user/video/12345');
    }
    const [cancelBtn2] = await page.$x("//div[@role='dialog']//button[normalize-space()='Cancel']");
    if (!cancelBtn2) throw new Error('Cancel button not found in final dialog');
    await cancelBtn2.click();
    await new Promise(r => setTimeout(r, 300));
    count = await getDialogsCount(page);
    if (count !== 0) throw new Error(`Expected 0 dialogs after final cancel, got ${count}`);

    console.log('✅ Collections modal interactions passed');
  } catch (err) {
    console.error('❌ Collections modal test failed:', err.message);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
})();
