import test from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';import {readFileSync} from 'node:fs';import {api,hashPassword} from '../src/api.mjs';import {database} from './local-db.mjs';
test('copy, move, undo twice, redo twice and repeat keeps the correct IDs and dates',async()=>{
 const DB=database(),password='history-test-password',hash=await hashPassword(password);
 await DB.prepare('INSERT INTO companies(id,name,created_at) VALUES(?,?,?)').bind('a','A','2026-09-27').run();
 await DB.prepare('INSERT INTO users(id,username,password_hash,role,must_change) VALUES(?,?,?,?,0)').bind('u','test@local.test',hash,'admin').run();
 let cookie='';const call=async(path,body)=>{const r=await api(new Request('https://local.test'+path,{method:'POST',headers:{origin:'https://local.test','content-type':'application/json',cookie},body:JSON.stringify(body)}),{DB});if(path==='/api/login')cookie=r.headers.get('set-cookie').split(';')[0];const data=await r.json();if(!r.ok)throw Error(data.error);return data;};
 await call('/api/login',{username:'test@local.test',password});await call('/api/tasks',{company_id:'a',title:'Recording',date:'2026-09-27',type:'Grabación'});
 const rows=async()=>(await DB.prepare('SELECT * FROM tasks ORDER BY date').all()).results;
 const listeners={},errors=[],context=vm.createContext({state:{user:{id:'u'},view:'calendario'},document:{addEventListener:(k,f)=>listeners[k]=f},$:()=>({open:false}),request:call,load:async()=>{},toast(){},message:e=>errors.push(e.message)});
 vm.runInContext(readFileSync('public/js/calendar-next.js','utf8'),context);
 await context.batchActivities('copy',await rows(),'2026-09-28');let copy=(await rows()).find(t=>t.date==='2026-09-28');
 await context.batchActivities('move',[copy],'2026-09-30');
 for(let n=0;n<2;n++){
 await context.calendarHistory();await context.calendarHistory();assert.equal((await rows()).length,1);
 await context.calendarHistory(true);await context.calendarHistory(true);assert.equal((await rows()).length,2);assert.equal((await rows())[1].date,'2026-09-30');
 }
 const key=shiftKey=>({key:shiftKey?'Z':'z',ctrlKey:true,shiftKey,target:{closest:()=>null},preventDefault(){}});
 await listeners.keydown(key(false));assert.equal((await rows())[1].date,'2026-09-28');
 await listeners.keydown(key(true));assert.equal((await rows())[1].date,'2026-09-30');
 assert.deepEqual(errors,[]);
 let prevented=false;listeners.keydown({key:'z',ctrlKey:true,shiftKey:false,repeat:true,target:{closest:()=>null},preventDefault(){prevented=true;}});assert.equal(prevented,true);
 // Exercise the same request hook used by the calendar form.
 context.request=async(path,body,method)=>{const r=await api(new Request('https://local.test'+path,{method:method||'POST',headers:{origin:'https://local.test','content-type':'application/json',cookie},body:JSON.stringify(body)}),{DB});const data=await r.json();if(!r.ok)throw Error(data.error);if(path==='/api/tasks')context.recordCalendarForm(data);return data;};
 const created=await context.request('/api/tasks',{company_id:'a',title:'From form',date:'2026-09-27',type:'Grabación'});
 await context.calendarHistory();assert.equal(await DB.prepare('SELECT id FROM tasks WHERE id=?').bind(created.record.id).first(),null);
 await context.calendarHistory(true);assert.ok(await DB.prepare('SELECT id FROM tasks WHERE id=?').bind(created.record.id).first());
 await context.request('/api/tasks',{...created.record,title:'Edited form'});
 await context.calendarHistory();assert.equal((await DB.prepare('SELECT title FROM tasks WHERE id=?').bind(created.record.id).first()).title,'From form');
 await context.calendarHistory(true);assert.equal((await DB.prepare('SELECT title FROM tasks WHERE id=?').bind(created.record.id).first()).title,'Edited form');
 await context.request('/api/tasks',{id:created.record.id,company_id:'a'},'DELETE');
 await context.calendarHistory();assert.equal((await DB.prepare('SELECT title FROM tasks WHERE id=?').bind(created.record.id).first()).title,'Edited form');
 await context.calendarHistory(true);assert.equal(await DB.prepare('SELECT id FROM tasks WHERE id=?').bind(created.record.id).first(),null);
 assert.deepEqual(errors,[]);
 DB.close();
});
