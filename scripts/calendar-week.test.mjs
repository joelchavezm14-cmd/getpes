import test from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';import {readFileSync} from 'node:fs';

const source=readFileSync('public/js/calendar-next.js','utf8');

function context(mobile){const ctx=vm.createContext({state:{month:'2027-01',view:'calendario',company:'a',companies:[{id:'a',name:'A'}],data:{tasks:[{id:'prev',company_id:'a',date:'2026-12-31',title:'Cierre',type:'Grabación'},{id:'next',company_id:'a',date:'2027-01-07',title:'Fuera',type:'Grabación'}]}},setInterval(){},matchMedia:()=>({matches:mobile}),document:{addEventListener(){}},can:()=>false,canEditTask:()=>false,esc:v=>v,fullDate:v=>v,monthName:v=>v});vm.runInContext(source,ctx);return ctx;}

test('mobile defaults to seven days and crosses month/year without dropping activities',()=>{const c=context(true);assert.equal(JSON.stringify(c.calendarRange()),JSON.stringify({start:'2026-12-28',end:'2027-01-03'}));assert.deepEqual(Array.from(c.scopedCalendarTasks(),t=>t.id),['prev']);const html=c.calendar();assert.equal((html.match(/data-drop-date=/g)||[]).length,7);assert.match(html,/Cierre/);vm.runInContext("calendarAnchor=shiftedDate(calendarAnchor,7);state.month=calendarAnchor.slice(0,7)",c);assert.equal(c.calendarRange().start,'2027-01-04');});

test('desktop defaults to month, explicit week works and external month selection resets anchor',()=>{const c=context(false);assert.equal(c.calendarRange().start,'2027-01-01');assert.equal(c.calendarRange().end,'2027-01-31');vm.runInContext("calendarView='week';state.month='2028-02';calendarAnchor='2028-02-29'",c);assert.equal(c.calendarRange().end,'2028-03-05');c.state.month='2028-04';assert.equal(c.calendarRange().start,'2028-03-27');});



test('weekly API includes adjacent-month activities and preserves company permissions',async()=>{

 const {api,hashPassword}=await import('../src/api.mjs'),{database}=await import('./local-db.mjs');const DB=database();

 for(const id of ['a','b'])await DB.prepare('INSERT INTO companies(id,name,created_at) VALUES(?,?,?)').bind(id,id,'2026-01-01').run();

 await DB.prepare('INSERT INTO users(id,username,password_hash,role,company_id,must_change) VALUES(?,?,?,?,?,0)').bind('u','week@test.local',await hashPassword('test-password'),'company_admin','a').run();

 const login=await api(new Request('https://test.local/api/login',{method:'POST',headers:{origin:'https://test.local','content-type':'application/json'},body:JSON.stringify({username:'week@test.local',password:'test-password'})}),{DB});const cookie=login.headers.get('set-cookie').split(';')[0];

 for(const [id,company,day] of [['one','a','2026-12-31'],['two','a','2027-01-03'],['other','b','2027-01-02'],['outside','a','2027-01-04']])await DB.prepare('INSERT INTO tasks(id,company_id,date,title,type,status,notes,url) VALUES(?,?,?,?,?,?,?,?)').bind(id,company,day,id,'Grabación','Pendiente','','').run();

 const read=company=>api(new Request('https://test.local/api/data?company='+company+'&month=2027-01&calendar_start=2026-12-28&calendar_end=2027-01-03',{headers:{cookie}}),{DB});const result=await read('a');assert.equal(result.status,200);assert.deepEqual((await result.json()).tasks.map(t=>t.id),['one','two']);assert.equal((await read('b')).status,403);

});


test('notifications show relative day plus exact weekday, month and time',()=>{const c=context(false);vm.runInContext("upcomingSummary={today:'2026-09-28'}",c);assert.equal(c.upcomingWhen({date:'2026-09-29',time:'16:15',type:'Reunión'}),'Mañana · Martes 29 de Setiembre · 4:15 PM');assert.equal(c.upcomingDay({date:'2026-09-30'}),'Pasado mañana');assert.equal(c.upcomingDay({date:'2026-10-01'}),'En 3 días');assert.match(c.upcomingWhen({date:'2026-09-28',time:''}),/Hoy.*Sin hora definida/);});

test('expired reminders disappear without removing future or untimed events',()=>{const c=context(true);c.$=()=>({open:false});vm.runInContext(`Date.now=()=>Date.parse('2026-09-29T21:02:00-05:00');calendarToday=()=> '2026-09-29';upcomingSummary={total:4,events:[{id:1,date:'2026-09-29',time:'09:00'},{id:2,date:'2026-09-29',time:'22:00'},{id:3,date:'2026-09-30',time:'09:00'},{id:4,date:'2026-09-29',time:''}]};expireUpcoming();`,c);assert.equal(vm.runInContext('upcomingSummary.total',c),3);assert.equal(vm.runInContext('upcomingSummary.events.some(t=>t.id===1)',c),false);});
