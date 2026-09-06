const {chromium, webkit}=require('playwright');
const assert=require('assert/strict');
const base=process.env.SITE_URL || 'http://127.0.0.1:4173/';
async function settle(p){await p.evaluate(()=>document.fonts.ready);await p.locator('.hero img').evaluate(i=>i.decode());}
async function scroll(p,y){await p.evaluate(y=>scrollTo({top:y,behavior:'instant'}),y);await p.waitForTimeout(400);}
async function reveal(p){for(const x of await p.locator('[data-reveal]').all()){await x.scrollIntoViewIfNeeded();}await p.waitForTimeout(500);}
(async()=>{
 for(const engine of [chromium,webkit]){
  const b=await engine.launch();
  for(const width of [320,390,430,768,1024,1440,1920])for(const lang of ['', 'it/']){
   const p=await b.newPage({viewport:{width,height:900},deviceScaleFactor:width<700?3:2});
   const errors=[];p.on('pageerror',e=>errors.push(e.message));
   await p.goto(base+lang);await settle(p);
   if(width>=1024){
    await p.waitForSelector('.story-enhanced');
    const positions=await p.locator('.steps figure').evaluateAll(xs=>xs.map(x=>x.getBoundingClientRect().top+scrollY));
    for(const index of [0,1,2,1,0]){
     await scroll(p,positions[index]);
     assert.equal(await p.locator('.story-visual img.is-current').getAttribute('src'),await p.locator('.steps img').nth(index).getAttribute('src'));
     const r=await p.locator('.story-visual').boundingBox();assert(r.y>=0&&r.y+r.height<=901);
    }
    await scroll(p,positions[2]);await scroll(p,positions[0]);
    assert.equal(await p.locator('.story-visual').getAttribute('aria-hidden'),'true');
   }else{
    assert.equal(await p.locator('.story-enhanced').count(),0);
    const bounds=await p.locator('.steps .phone').evaluateAll(xs=>xs.map(x=>{const r=x.getBoundingClientRect();return{left:r.left,right:innerWidth-r.right}}));
    assert(bounds.every(r=>r.left>=24&&r.right>=24&&Math.abs(r.left-r.right)<1));
    await reveal(p);
   }
   assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
   await p.locator('summary').first().click();assert.notEqual(await p.locator('details').first().getAttribute('open'),null);
   await p.locator('summary').first().click();assert.equal(await p.locator('details').first().getAttribute('open'),null);
   await p.locator('.privacy-panel a').focus();assert.equal(await p.locator('.privacy-panel').evaluate(e=>getComputedStyle(e).opacity),'1');
   assert.deepEqual(errors,[]);
   console.log('PASS',engine.name(),width,lang||'EN');
   await p.close();
  }
  for(const mode of ['no-js','reduce','decode-error','missing-observer']){
   const p=await b.newPage({viewport:{width:1440,height:900},javaScriptEnabled:mode!=='no-js',reducedMotion:mode==='reduce'?'reduce':'no-preference'});
   if(mode==='decode-error')await p.addInitScript(()=>{HTMLImageElement.prototype.decode=()=>Promise.reject(new Error('test decode failure'));});
   if(mode==='missing-observer')await p.addInitScript(()=>{delete window.IntersectionObserver;});
   await p.goto(base);await p.waitForTimeout(600);
   if(mode!=='missing-observer')assert.equal(await p.locator('.story-enhanced').count(),0);
   if(mode==='decode-error')assert.equal(await p.locator('.steps .reveal-pending').count(),0);
   if(['no-js','reduce'].includes(mode))assert.equal(await p.locator('.reveal-pending').count(),0);
   console.log('PASS',engine.name(),mode);await p.close();
  }
  const p=await b.newPage({viewport:{width:1440,height:900}});
  await p.goto(base);await p.waitForSelector('.story-enhanced');
  await p.emulateMedia({reducedMotion:'reduce'});await p.waitForFunction(()=>!document.querySelector('.story-enhanced'));
  assert.equal(await p.locator('.reveal-pending').count(),0);
  await p.emulateMedia({reducedMotion:'no-preference'});await p.waitForSelector('.story-enhanced');
  for(const size of [{width:844,height:390},{width:1440,height:650},{width:720,height:450},{width:390,height:844}]){
   await p.setViewportSize(size);await p.waitForFunction(()=>!document.querySelector('.story-enhanced'));
   assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  }
  await p.setViewportSize({width:1440,height:900});await p.waitForSelector('.story-enhanced');
  const position=await p.locator('.steps figure').nth(2).evaluate(e=>e.getBoundingClientRect().top+scrollY);
  await scroll(p,position);await p.reload();await p.waitForSelector('.story-enhanced');
  await p.waitForTimeout(400);
  assert.equal(await p.locator('.story-visual img.is-current').getAttribute('src'),await p.locator('.steps img').nth(2).getAttribute('src'));
  console.log('PASS',engine.name(),'motion toggle, resize, short window, 200%-equivalent reflow, scroll restoration');
  await p.close();await b.close();
 }
})().catch(e=>{console.error(e);process.exit(1)});
