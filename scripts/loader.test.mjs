import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../public/js/loader.js',import.meta.url),'utf8');
test('loader waits for concurrent operations and releases after an error',async()=>{
 const classes=new Set(),label={},surface={open:false,setAttribute(){},addEventListener(){},querySelector(){return label;},showModal(){this.open=true;},close(){this.open=false;}};
 const context=vm.createContext({setTimeout,clearTimeout,performance,requestAnimationFrame:fn=>setTimeout(fn,1),document:{activeElement:null,body:{append(){}},documentElement:{classList:{add:x=>classes.add(x),remove:x=>classes.delete(x)}},createElement:()=>surface,addEventListener(){}}});
 vm.runInContext(source+';globalThis.loader=GetpesLoader;',context);
 const first=context.loader.begin(),second=context.loader.begin();
 await new Promise(r=>setTimeout(r,10));assert.equal(surface.open,true);
 first();first();await new Promise(r=>setTimeout(r,370));assert.equal(surface.open,true,'one completed operation must not hide another');
 second();await new Promise(r=>setTimeout(r,10));assert.equal(surface.open,false);assert.equal(classes.size,0);
 await assert.rejects(context.loader.run(async()=>{await new Promise(r=>setTimeout(r,10));throw Error('offline');}),/offline/);
 await new Promise(r=>setTimeout(r,370));assert.equal(surface.open,false);assert.equal(classes.size,0);
});
