import puppeteer from 'puppeteer';
import lighthouse from 'lighthouse';

async function run() {
  const browser = await puppeteer.launch({headless: 'new'});
  const page = await browser.newPage();
  const url = 'https://example.com';
  console.log("Running lighthouse");
  try {
    const report = await lighthouse(url, {
      logLevel: 'info',
      output: 'json'
    }, undefined, page);
    console.log(report.lhr.categories.performance.score);
  } catch(e) {
    console.error(e);
  }
  await browser.close();
}
run();
