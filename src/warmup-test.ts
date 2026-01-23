import { chromium } from 'playwright';

async function warmupTest() {
  console.log('Starting Playwright warmup test...');

  const browser = await chromium.launch();
  const page = await browser.newPage();

  console.log('Navigating to example.com...');
  await page.goto('https://example.com');

  console.log('Taking screenshot...');
  await page.screenshot({
    path: 'tmp/autowebsites/screenshots/warmup.png',
    fullPage: true
  });

  const title = await page.title();
  console.log(`Page title: ${title}`);

  await browser.close();
  console.log('Playwright warmup test complete!');
}

warmupTest().catch(console.error);
