import { chromium } from 'playwright';

const BASE = process.env.BASE_URL || 'http://localhost:5173';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 700 } });

  page.on('console', msg => {
    if (msg.type() === 'error') console.error('BROWSER ERROR:', msg.text());
  });
  page.on('pageerror', err => console.error('PAGE ERROR:', err.message));

  console.log('1. Loading game...');
  await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(2000);

  // Check title scene rendered
  const titleText = await page.textContent('body');
  console.log('   Title scene text found:', titleText?.includes('心口不一'));

  // Check canvas exists
  const canvas = await page.$('canvas');
  console.log('   Canvas exists:', !!canvas);

  // Take screenshot
  await page.screenshot({ path: 'test-output/title.png' });
  console.log('   Title screenshot saved');

  // Click start button - approximate position (center, slightly below center)
  const canvasBox = await canvas?.boundingBox();
  if (!canvasBox) { console.error('No canvas bounding box'); await browser.close(); return; }

  // Click on start button area (center, about 65% from top for portrait 700)
  const startX = canvasBox.x + canvasBox.width / 2;
  const startY = canvasBox.y + canvasBox.height * 0.68;
  console.log('2. Clicking start button...');
  await page.mouse.click(startX, startY);
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'test-output/battle.png' });
  console.log('   Battle screenshot saved');

  // Check battle scene loaded
  const battleText = await page.textContent('body');
  console.log('   Battle scene has 刀盾:', battleText?.includes('刀盾'));
  console.log('   Battle scene has 比比拉布:', battleText?.includes('比比拉布'));

  // Click first declare button (rock)
  const declareBtnX = canvasBox.x + canvasBox.width * 0.22;
  const declareBtnY = canvasBox.y + canvasBox.height * 0.90;
  console.log('3. Clicking declare button (rock)...');
  await page.mouse.click(declareBtnX, declareBtnY);
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'test-output/declare.png' });
  console.log('   Declare screenshot saved');

  // Click first reveal button (rock)
  const revealBtnX = canvasBox.x + canvasBox.width * 0.22;
  const revealBtnY = canvasBox.y + canvasBox.height * 0.90;
  console.log('4. Clicking reveal button (rock)...');
  await page.mouse.click(revealBtnX, revealBtnY);
  await page.waitForTimeout(5000);
  await page.screenshot({ path: 'test-output/result.png' });
  console.log('   Result screenshot saved');

  console.log('5. Test complete!');
  await browser.close();
}

import { mkdirSync } from 'node:fs';
mkdirSync('test-output', { recursive: true });

main().catch(err => { console.error('Test failed:', err); process.exit(1); });
