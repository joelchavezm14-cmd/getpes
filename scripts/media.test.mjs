import test from 'node:test';import assert from 'node:assert/strict';import {media} from '../src/media.mjs';
test('video ranges and restricted imports',async()=>{
 const env={BUCKET:{head:async()=>({size:100,httpEtag:'"sample"'}),get:async(k,o)=>({body:new Uint8Array(o?.range.length||100)}),put:async()=>{throw Error('should not write');}}};
 const req=(method='GET',headers={})=>new Request('https://test.local/media/marketing.mp4',{method,headers});
 const r=await media(req('GET',{range:'bytes=10-19'}),env);assert.equal(r.status,206);assert.equal(r.headers.get('content-range'),'bytes 10-19/100');assert.equal((await r.arrayBuffer()).byteLength,10);
 assert.equal((await media(req('GET',{range:'bytes=101-'}),env)).status,416);
 assert.equal((await media(req('PUT'),env)).status,403);
 assert.equal((await media(req('HEAD'),env)).headers.get('content-length'),'100');
});
