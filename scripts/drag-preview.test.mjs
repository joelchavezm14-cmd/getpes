import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
test('shared drag preview follows the pointer, cleans up and only saves a valid drop',()=>{
 const classes=()=>({values:new Set(),add(x){this.values.add(x)},remove(x){this.values.delete(x)}});
 const element=()=>({style:{setProperty(){}},classList:classes(),setAttribute(){},removeAttribute(){},querySelectorAll(){return []},append(x){this.child=x},remove(){this.removed=true}});
 const previews=[],listeners={},dest={classList:classes()},body=element();body.append=x=>previews.push(x);
 const document={body,createElement:element,elementFromPoint:()=>({closest:()=>dest}),addEventListener:(n,f)=>listeners[n]=f,removeEventListener:n=>delete listeners[n]};
 const card=element();card.addEventListener=()=>{};card.getBoundingClientRect=()=>({left:100,top:100,width:200});card.cloneNode=element;card.setPointerCapture=()=>{};card.hasPointerCapture=()=>true;card.releasePointerCapture=()=>{};
 const source=fs.readFileSync('public/js/calendar-next.js','utf8').split('function bindPointerMove(')[1].split('function bindCalendarDrag()')[0];
 const context={document,window:{addEventListener(){},removeEventListener(){}},getComputedStyle:()=>({getPropertyValue:()=> '#123456'})};vm.createContext(context);vm.runInContext('function bindPointerMove('+source,context);
 let saves=0,lastDrop;context.bindPointerMove(card,'.day','over',(target,mode)=>{saves++;lastDrop=mode;});
 const event=(x,y)=>({button:0,pointerType:'mouse',pointerId:1,clientX:x,clientY:y,target:{closest:()=>null},preventDefault(){}});
 card.onpointerdown(event(120,130));card.onpointermove(event(123,132));assert.equal(previews.length,0);
 card.onpointermove(event(300,250));assert.equal(previews.length,1);assert.equal(previews[0].style.width,'200px');assert.match(previews[0].style.transform,/280px,220px/);assert.ok(dest.classList.values.has('over'));
 card.onpointermove(event(340,270));assert.match(previews[0].style.transform,/320px,240px/);card.onpointerup(event(340,270));assert.equal(saves,1);assert.ok(previews[0].removed);assert.equal(dest.classList.values.size,0);
 card.onpointerdown(event(120,130));card.onpointermove(event(300,250));listeners.keydown({key:'Escape',preventDefault(){}});assert.ok(previews[1].removed);assert.equal(saves,1);
 card.onpointerdown({...event(120,130),altKey:true});card.onpointermove(event(300,250));card.onpointerup(event(300,250));assert.equal(lastDrop.copy,true);assert.equal(saves,2);
 card.onpointerdown(event(120,130));card.onpointermove(event(300,250));card.onpointerup(event(300,250));assert.equal(lastDrop.copy,false);assert.equal(saves,3);
});
