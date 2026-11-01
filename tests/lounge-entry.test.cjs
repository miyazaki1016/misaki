const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('public/lounge/entry.js','utf8');
function boot({seen=false,blocked=false,reject=false}={}){
 const elements={};
 function el(){return {open:false,hidden:false,handlers:{},addEventListener(n,f){this.handlers[n]=f},emit(n){this.handlers[n]?.({preventDefault(){}})},showModal(){this.open=true},close(){this.open=false},pause(){},play(){return reject?Promise.reject(Error()):Promise.resolve()}}}
 const document=el(),window=el();document.querySelector=k=>elements[k]??=el();
 const store=new Map([['auth','unchanged'],['memory','unchanged'],...(seen?[['misaki-opening-completed-v1','1']]:[])]),writes=[];
 const localStorage={getItem(k){if(blocked)throw Error();return store.get(k)},setItem(k,v){if(blocked)throw Error();writes.push(k);store.set(k,v)}};
 const visits=[];window.location={assign:u=>visits.push(u)};
 vm.runInNewContext(source,{document,window,localStorage});
 return {elements,window,document,store,writes,visits,click:()=>elements['[data-character-id="misaki"].card'].emit('click')};
}
test('first visit starts at lounge, selecting opens movie',()=>{const b=boot();assert.equal(b.elements['#opening'].open,false);b.click();assert.equal(b.elements['#opening'].open,true);assert.deepEqual(b.visits,[])});
for(const action of ['#skip-opening','#opening-video'])test(action+' opens existing chat once and preserves app state',()=>{const b=boot();b.click();b.elements[action].emit(action.includes('video')?'ended':'click');b.elements['#skip-opening'].emit('click');assert.deepEqual(b.visits,['/chat']);assert.deepEqual(b.writes,['misaki-opening-completed-v1']);assert.equal(b.store.get('auth'),'unchanged');assert.equal(b.store.get('memory'),'unchanged')});
test('returning visitor bypasses movie',()=>{const b=boot({seen:true});b.click();assert.deepEqual(b.visits,['/chat']);assert.equal(b.elements['#opening'].open,false)});
test('disabled storage still permits chat',()=>{const b=boot({blocked:true});b.click();b.elements['#skip-opening'].emit('click');assert.deepEqual(b.visits,['/chat'])});
test('autoplay rejection keeps manual play and skip available',async()=>{const b=boot({reject:true});b.click();await Promise.resolve();assert.match(b.elements['#opening-status'].textContent,/再生する/);b.elements['#skip-opening'].emit('click');assert.deepEqual(b.visits,['/chat'])});
test('back/pageshow resets navigation and closes restored dialog',()=>{const b=boot();b.click();b.elements['#skip-opening'].emit('click');b.window.emit('pageshow');assert.equal(b.elements['#opening'].open,false);b.click();assert.deepEqual(b.visits,['/chat','/chat'])});
test('cancel returns to lounge without entering chat',()=>{const b=boot();b.click();b.elements['#opening'].emit('cancel');assert.equal(b.elements['#opening'].open,false);assert.deepEqual(b.visits,[])});
test('video error leaves skip route available',()=>{const b=boot();b.click();b.elements['#opening-video'].emit('error');assert.match(b.elements['#opening-status'].textContent,/スキップ/);b.elements['#skip-opening'].emit('click');assert.deepEqual(b.visits,['/chat'])});
test('LP uses lounge and assets are local, single character only',()=>{const html=fs.readFileSync('public/lounge/index.html','utf8'),lp=fs.readFileSync('app/page.tsx','utf8');assert.equal((lp.match(/href="\/lounge\/"/g)||[]).length,6);assert.ok(!lp.includes('href="/chat"'));assert.ok(!html.includes('女の子A'));assert.ok(!html.includes('https://'));for(const x of html.matchAll(/(?:src|href)="(\/[^"#]+)"/g)){if(x[1]==='/chat')continue;assert.ok(fs.existsSync('public'+x[1]),x[1])}});
