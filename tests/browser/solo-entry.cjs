// Run against a local static public/ server. Chat is stubbed to avoid auth/API writes.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
(async () => {
 const browser = await chromium.launch({headless:true, ...(process.env.CHROMIUM_PATH ? {executablePath:process.env.CHROMIUM_PATH} : {}),args:['--no-sandbox']});
 let passed=0;
 for (const scenario of ['skip','ended','revisit','back','blocked-storage','blocked-play','error','cancel']) {
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/chat',r=>r.fulfill({contentType:'text/html',body:'<h1>Existing chat destination</h1>'}));
  if(scenario==='blocked-storage') await page.addInitScript(()=>{Storage.prototype.getItem=()=>{throw Error('blocked')};Storage.prototype.setItem=()=>{throw Error('blocked')}});
  if(scenario==='blocked-play') await page.addInitScript(()=>{HTMLMediaElement.prototype.play=()=>Promise.reject(Error('NotAllowedError'))});
  if(scenario==='revisit') await page.addInitScript(()=>localStorage.setItem('misaki-opening-completed-v1','1'));
  await page.goto('http://127.0.0.1:8765/lounge/');
  assert.equal(await page.locator('.card').count(),1);
  assert.equal(await page.locator('#opening').evaluate(x=>x.open),false);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await page.locator('.card').click();
  if(scenario==='revisit') await page.waitForURL('**/chat');
  else {
   assert.equal(await page.locator('#opening').evaluate(x=>x.open),true);
   if(scenario==='cancel') {await page.keyboard.press('Escape');assert.equal(await page.locator('#opening').evaluate(x=>x.open),false);assert.match(page.url(),/lounge/)}
   else {
    if(scenario==='error') await page.locator('video').dispatchEvent('error');
    if(scenario==='blocked-play') {await page.waitForTimeout(100);assert.match(await page.locator('#opening-status').textContent(),/再生する/)}
    if(scenario==='ended') await page.locator('video').dispatchEvent('ended');
    else await page.locator('#skip-opening').click();
    await page.waitForURL('**/chat');
    if(scenario==='back') {await page.goBack();assert.equal(await page.locator('#opening').evaluate(x=>x.open),false);await page.locator('.card').click();await page.waitForURL('**/chat')}
   }
  }
  assert.deepEqual(errors,[]);passed++;await context.close();
 }
 console.log(`${passed}/8 mobile Chromium navigation scenarios passed (chat stub; not iPhone Safari or live conversation proof).`);
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
