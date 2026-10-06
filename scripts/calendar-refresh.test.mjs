import test from 'node:test';import assert from 'node:assert/strict';import {api,hashPassword} from '../src/api.mjs';import {database} from './local-db.mjs';
test('nine activity types persist; deletion is scoped to one record and authorized company',async()=>{
 const DB=database(),env={DB},password='Test-only-calendar-password',hash=await hashPassword(password);
 for(const id of ['a','b'])await DB.prepare('INSERT INTO companies(id,name,created_at) VALUES(?,?,?)').bind(id,id,'2026-09-19').run();
 for(const [id,role] of [['admin','admin'],['client','client']])await DB.prepare('INSERT INTO users(id,username,password_hash,role,company_id,must_change) VALUES(?,?,?,?,?,0)').bind(id,id+'@test.local',hash,role,'a').run();
 const call=async(path,body,cookie='',method)=>{const r=await api(new Request('https://test.local'+path,{method:method||(body?'POST':'GET'),headers:{origin:'https://test.local','content-type':'application/json',cookie},body:body?JSON.stringify(body):undefined}),env);return {status:r.status,data:await r.json(),cookie:r.headers.get('set-cookie')?.split(';')[0]};};
 const admin=(await call('/api/login',{username:'admin@test.local',password})).cookie,client=(await call('/api/login',{username:'client@test.local',password})).cookie;
 for(const type of ['Grabación','Video editado','Diseño','Guiones / Copy','Video publicado','Reunión','Entrega','Sesión de fotos','Otra actividad'])assert.equal((await call('/api/tasks',{company_id:'a',date:'2026-09-19',title:type,type,status:'Pendiente'},admin)).status,200);
 const before=(await call('/api/data?company=a&month=2026-09',null,admin)).data.tasks;assert.equal(before.length,9);const id=before[0].id;
 const original=before[0];
 assert.equal((await call('/api/tasks',{...original,company_id:'a',time:'25:00'},admin)).status,400);
 assert.equal((await call('/api/tasks',{...original,company_id:'a',status:undefined,time:'09:30'},admin)).status,200);
 assert.equal((await call('/api/tasks',{...original,company_id:'a',type:'Grabación',time:'12:00',end_time:'16:00'},admin)).status,200);
 assert.equal((await call('/api/tasks',{...original,company_id:'a',type:'Grabación',time:'12:00',end_time:'11:00'},admin)).status,400);
 assert.equal((await call('/api/tasks',{...original,company_id:'a',type:'Video publicado',time:'12:45',end_time:'16:00'},admin)).status,200);
 assert.equal((await DB.prepare('SELECT end_time FROM tasks WHERE id=?').bind(id).first()).end_time,'');
 assert.equal((await call('/api/tasks',{...original,company_id:'a',type:'Grabación',time:'09:30',end_time:'16:00'},admin)).status,200);
 for(const subtype of ['Meta Ads','Google Ads','TikTok Ads','LinkedIn Ads']){
 assert.equal((await call('/api/tasks',{...original,company_id:'a',type:'Campaña',subtype,time:'09:30',end_time:'16:00'},admin)).status,200);
 assert.equal((await DB.prepare('SELECT subtype FROM tasks WHERE id=?').bind(id).first()).subtype,subtype);
 }
 assert.equal((await call('/api/tasks',{...original,company_id:'a',type:'Campaña',subtype:'Post'},admin)).status,400);
 for(const subtype of ['Post','Carrusel','Video'])assert.equal((await call('/api/tasks',{...original,company_id:'a',type:'Video publicado',subtype,time:'12:45'},admin)).status,200);
 assert.equal((await call('/api/tasks',{...original,company_id:'a',type:'Grabación',time:'09:30',end_time:'16:00'},admin)).status,200);
 const timed=await DB.prepare('SELECT * FROM tasks WHERE id=?').bind(id).first();assert.equal(timed.time,'09:30');assert.equal(timed.status,original.status);
 await DB.prepare("UPDATE tasks SET approval='Aprobado',approved_by='Reviewer' WHERE id=?").bind(id).run();
 assert.equal((await call('/api/tasks',{id,company_id:'a',date:'2026-09-25'},client,'PATCH')).status,403);
 assert.equal((await call('/api/tasks',{id,company_id:'b',date:'2026-09-25'},admin,'PATCH')).status,404);
 assert.equal((await call('/api/tasks',{id,company_id:'a',date:'2026-02-30'},admin,'PATCH')).status,400);
 assert.equal((await call('/api/tasks',{id,company_id:'a',date:'2026-09-25'},admin,'PATCH')).status,200);
 const moved=await DB.prepare('SELECT * FROM tasks WHERE id=?').bind(id).first();assert.equal(moved.date,'2026-09-25');assert.equal(moved.time,'09:30');assert.equal(moved.end_time,'16:00');assert.equal(moved.approval,'Aprobado');assert.equal(moved.title,before[0].title);
 assert.equal((await call('/api/tasks',{id,company_id:'a'},client,'DELETE')).status,403);
 assert.equal((await call('/api/tasks',{id,company_id:'b'},admin,'DELETE')).status,404);
 assert.equal((await call('/api/tasks',{id,company_id:'a'},admin,'DELETE')).status,200);
 const after=(await call('/api/data?company=a&month=2026-09',null,admin)).data.tasks;assert.deepEqual(after.map(t=>t.id).sort(),before.filter(t=>t.id!==id).map(t=>t.id).sort());
 const preferences={objective:'sales',indicators:['spend','sales','cpa','revenue','roas'],columns:['name','spend']};assert.equal((await call('/api/dashboard-preferences',{company_id:'a',preferences},client)).status,403);assert.equal((await call('/api/dashboard-preferences',{company_id:'a',preferences},admin)).status,200);assert.deepEqual((await call('/api/data?company=a&month=2026-09',null,admin)).data.dashboardPreferences,preferences);assert.equal((await call('/api/data?company=b&month=2026-09',null,admin)).data.dashboardPreferences,null);
 assert.equal((await call('/api/dashboard-preferences',{company_id:'a',preferences:{...preferences,indicators:['spend','sales','cpa','revenue','roas','leads']}},admin)).status,400);DB.close();
});
