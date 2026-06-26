const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:3000');
  await page.waitForSelector('text/Compute estimated tax');
  
  console.log("Found quick action button. Clicking...");
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => b.textContent.includes('Compute estimated tax'));
    if (btn) btn.click();
  });
  
  await page.waitForTimeout(1000);
  
  const html = await page.evaluate(() => document.body.innerHTML);
  if (html.includes('Compute my estimated tax')) {
    console.log("Message appeared in DOM!");
  } else {
    console.log("Message NOT in DOM!");
  }
  
  await browser.close();
})();
