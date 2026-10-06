import test from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';import {readFileSync} from 'node:fs';
test('nested notification header is reused and Escape respects inner controls',()=>{
 const handlers={},listeners={};let creates=0,closes=0,expanded=null;
 const close={classList:{add(){}},setAttribute(){},textContent:'×'};
 const header={classList:{add(){}},querySelector:()=>close};
 const editor={open:true,classList:{add(){}},querySelector:s=>s==='.dialog-head'?header:s==='details[open]'?expanded:null,querySelectorAll:()=>[],addEventListener:(k,f)=>listeners[k]=f,close(){closes++;this.open=false;}};
 const context=vm.createContext({document:{addEventListener:(k,f)=>handlers[k]=f,getElementById:id=>id==='editor'?editor:null,createElement:()=>{creates++;throw Error('Unexpected new header');}},GetpesDates:{prepare(){}},MutationObserver:class{observe(){}},window:{}});
 vm.runInContext(readFileSync('public/js/forms.js','utf8')+';globalThis.forms=GetpesForms',context);
 for(let i=0;i<5;i++)context.forms.prepare(editor);assert.equal(creates,0);
 handlers.keydown({key:'Escape',defaultPrevented:true});assert.equal(closes,0);
 expanded={open:true,querySelector:()=>({focus(){}})};handlers.keydown({key:'Escape',preventDefault(){}});assert.equal(expanded.open,false);assert.equal(closes,0);
 expanded=null;handlers.keydown({key:'Escape',preventDefault(){}});assert.equal(closes,1);
});
