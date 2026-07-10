import puppeteer from 'puppeteer';

async function run() {
  const ws = 'wss://api.browsercat.com/connect';
  const key = 'invalid-key-just-testing'; // we just want to see if we get a 401/403
  
  try {
    const browser = await puppeteer.connect({
      browserWSEndpoint: ws,
      headers: { 'Api-Key': key }
    });
    console.log('Connected');
    await browser.close();
  } catch (e) {
    console.error('Error:', e.message);
  }
}
run();
