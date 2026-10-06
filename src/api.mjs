import {social} from './social.mjs';
import {preferences,validateCampaignPreferences} from './dashboard-preferences.mjs';
import {rights,contentTask} from './permissions.mjs';
import {accounts} from './accounts.mjs';
const encoder = new TextEncoder();
const hex = a => [...new Uint8Array(a)].map(x=>x.toString(16).padStart(2,'0')).join('');
const random = () => hex(crypto.getRandomValues(new Uint8Array(32)));
const digest = async s => hex(await crypto.subtle.digest('SHA-256',encoder.encode(s)));
export async function hashPassword(password, salt=random()) {
  const key=await crypto.subtle.importKey('raw',encoder.encode(password),'PBKDF2',false,['deriveBits']);
  const bits=await crypto.subtle.deriveBits({name:'PBKDF2',salt:encoder.encode(salt),iterations:100000,hash:'SHA-256'},key,256);
  return `pbkdf2$100000$${salt}$${hex(bits)}`;
}
async function verify(password, encoded) {
  const parts=encoded?.split('$'); if(parts?.length!==4)return false;
  const candidate=await hashPassword(password,parts[2]);
  let diff=candidate.length^encoded.length; for(let i=0;i<candidate.length;i++)diff|=candidate.charCodeAt(i)^encoded.charCodeAt(i); return diff===0;
}
const fail=(status,message)=>{throw Object.assign(new Error(message),{status});};
const json=(data,status=200,headers={})=>new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store',...headers}});
const text=(v,max=200,required=true)=>{if(typeof v!=='string'||v.length>max||(required&&!v.trim()))fail(400,'Revisa los campos obligatorios.');return v.trim();};
const number=(v,int=false)=>{const n=Number(v);if(!Number.isFinite(n)||n<0||n>1e12||(int&&!Number.isInteger(n)))fail(400,'Los valores deben ser números positivos válidos.');return n;};
const choice=(v,values)=>{if(!values.includes(v))fail(400,'Opción no válida.');return v;};
const month=v=>{if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(v||''))fail(400,'Selecciona un mes válido.');return v;};
const date=v=>{const parsed=new Date(v+'T12:00:00Z');if(!/^\d{4}-\d{2}-\d{2}$/.test(v||'')||!Number.isFinite(parsed.getTime())||parsed.toISOString().slice(0,10)!==v)fail(400,'Fecha no válida.');return v;};
const safeUrl=v=>{if(!v)return '';try{const u=new URL(v);if(!['https:','http:'].includes(u.protocol))throw 0;return u.href;}catch{fail(400,'Usa un enlace https válido.');}};
const cookie=(token,req,age=28800)=>`getpes_session=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${age}${new URL(req.url).protocol==='https:'?'; Secure':''}`;
export async function api(req,env) {
 try {
  if(!env.DB)fail(503,'El panel no está disponible. Intenta nuevamente en unos minutos.');
  const db=env.DB, run=(sql,...args)=>db.prepare(sql).bind(...args).run(), one=(sql,...args)=>db.prepare(sql).bind(...args).first(), all=async(sql,...args)=>(await db.prepare(sql).bind(...args).all()).results;
  const url=new URL(req.url),path=url.pathname,write=!['GET','HEAD'].includes(req.method);
  if(write&&(req.headers.get('origin')!==url.origin||!req.headers.get('content-type')?.startsWith('application/json')))fail(403,'Solicitud no permitida. Recarga la página.');
  let body={};if(write){const raw=await req.text();if(raw.length>(path==='/api/campaigns/import'?500000:path==='/api/companies'?300000:20000))fail(413,'El contenido es demasiado extenso.');try{body=JSON.parse(raw);}catch{fail(400,'Solicitud no válida.');}}
  const token=(req.headers.get('cookie')||'').match(/(?:^|;\s*)getpes_session=([a-f0-9]{64})/)?.[1];
  const user=token?await one('SELECT u.id,u.username,u.role,u.company_id,u.must_change,u.theme,u.hide_branding,u.permissions,u.display_name,u.phone FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token=? AND s.expires>? AND u.active=1',await digest(token),Date.now()):null;
  if(path==='/api/session'&&req.method==='GET')return json({user:user?{...user,rights:rights(user)}:null});
  if(path==='/api/login'&&req.method==='POST'){
    const username=text(body.username,150).toLowerCase(),password=text(body.password,200);
    const key=await digest(username),ipKey='ip:'+await digest(req.headers.get('cf-connecting-ip')||'local');
    for(const k of [key,ipKey]){await run('INSERT INTO login_attempts(key,count,reset_at) VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET count=CASE WHEN reset_at<? THEN 1 ELSE count+1 END,reset_at=CASE WHEN reset_at<? THEN excluded.reset_at ELSE reset_at END',k,Date.now()+900000,Date.now(),Date.now());const attempt=await one('SELECT count FROM login_attempts WHERE key=?',k);if(attempt.count>(k===key?10:50))fail(429,'Demasiados intentos. Espera 15 minutos.');}
    let account=await one('SELECT * FROM users WHERE username=?',username);
    // Initial accounts are provisioned only after proving knowledge of a server-side bootstrap secret.
    if(!account){const seed=username==='admin@getpes.com'?env.BOOTSTRAP_ADMIN_HASH:username==='lgna@getpes.com'?env.BOOTSTRAP_LGNA_HASH:null;
      if(seed&&await verify(password,seed)){
        await run('INSERT OR IGNORE INTO companies(id,name,created_at) VALUES(?,?,?)','lgna','LGNA',new Date().toISOString());
        await run('INSERT OR IGNORE INTO users(id,username,password_hash,role,company_id,active,must_change) VALUES(?,?,?,?,?,1,1)',crypto.randomUUID(),username,seed,username==='admin@getpes.com'?'admin':'client',username==='admin@getpes.com'?null:'lgna');
        account=await one('SELECT * FROM users WHERE username=?',username);
      }
    }
    if(!account||!account.active||!await verify(password,account.password_hash))fail(401,'Usuario o contraseña incorrectos.');
    if(body.admin===true&&account.role!=='admin')fail(403,'Este acceso es solo para administración.');
    await run('DELETE FROM login_attempts WHERE key=?',key);
    const fresh=random();await run('INSERT INTO sessions(token,user_id,expires) VALUES(?,?,?)',await digest(fresh),account.id,Date.now()+28800000);
    await run('DELETE FROM sessions WHERE expires<?',Date.now());
    return json({ok:true},200,{'set-cookie':cookie(fresh,req)});
  }
  if(path==='/api/contact'&&req.method==='POST'){
    if(body.website)fail(400,'Solicitud no válida.');
    const name=text(body.name,150),email=text(body.email,254),contact=text(body.contact||'',200,false),industry=text(body.industry||'',150,false),message=text(body.message||'',2400,false);
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))fail(400,'Revisa tu correo electrónico.');
    const services={redes:'Gestión de redes',video:'Edición de video',campanas:'Campañas digitales',branding:'Branding y diseño',otro:'Otro'};
    const service=services[choice(body.service,Object.keys(services))];
    if(!/^[a-f0-9-]{36}$/.test(body.request_id||''))fail(400,'Recarga el formulario e intenta nuevamente.');
    const id='web-'+await digest(body.request_id+JSON.stringify([name,email,contact,industry,service,message]));
    const key='contact:'+await digest(req.headers.get('cf-connecting-ip')||'local'),now=Date.now();
    await run('INSERT INTO login_attempts(key,count,reset_at) VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET count=CASE WHEN reset_at<? THEN 1 ELSE count+1 END,reset_at=CASE WHEN reset_at<? THEN excluded.reset_at ELSE reset_at END',key,now+900000,now,now);
    if((await one('SELECT count FROM login_attempts WHERE key=?',key)).count>10)fail(429,'Has enviado varias consultas. Espera 15 minutos para volver a intentarlo.');
    const stamp=new Date().toISOString(),notes='Origen: formulario web de Getpes\nServicio: '+service+(message?'\nConsulta: '+message:'');
    await db.batch([
      db.prepare('INSERT OR IGNORE INTO companies(id,name,created_at) VALUES(?,?,?)').bind('getpes','GETPES',stamp),
      db.prepare('INSERT OR IGNORE INTO leads(id,company_id,name,email,contact,industry,source,stage,value,follow_up,notes,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)').bind(id,'getpes',name,email,contact,industry,'Orgánico','Nuevos',0,'',notes,stamp,stamp),
      db.prepare('INSERT OR IGNORE INTO lead_events(id,lead_id,type,detail,actor,occurred_at,created_at) VALUES(?,?,?,?,?,?,?)').bind(id+'-created',id,'Prospecto creado','Consulta recibida desde la web. Servicio: '+service+'. Etapa inicial: Nuevos.','Formulario web',stamp,stamp)
    ]);
    return json({ok:true});
  }
  if(!user)fail(401,'Inicia sesión para continuar.');
  if(path==='/api/logout'&&req.method==='POST'){await run('DELETE FROM sessions WHERE token=?',await digest(token));return json({ok:true},200,{'set-cookie':cookie('',req,0)});}
  if(path==='/api/password'&&req.method==='POST'){
    const current=text(body.current,200),password=text(body.password,200);if(password.length<12)fail(400,'La contraseña debe tener al menos 12 caracteres.');
    const account=await one('SELECT password_hash FROM users WHERE id=?',user.id);if(!await verify(current,account.password_hash))fail(400,'La contraseña actual no coincide.');
    await db.batch([db.prepare('UPDATE users SET password_hash=?,must_change=0 WHERE id=?').bind(await hashPassword(password),user.id),db.prepare('DELETE FROM sessions WHERE user_id=?').bind(user.id)]);
    return json({ok:true},200,{'set-cookie':cookie('',req,0)});
  }
  if(user.must_change)fail(403,'Cambia tu contraseña temporal para continuar.');
  const admin=()=>{if(user.role!=='admin')fail(403,'Solo el administrador puede modificar información.');};
  const company=async id=>{text(id,100);if(user.role!=='admin'&&!(user.role==='staff'?await one('SELECT id FROM user_companies WHERE user_id=? AND company_id=?',user.id,id):user.company_id===id))fail(403,'No tienes acceso a esta empresa.');if(!await one('SELECT id FROM companies WHERE id=?',id))fail(404,'Empresa no encontrada.');return id;};
  if(path==='/api/company-logo'&&req.method==='GET'){
    const cid=await company(url.searchParams.get('company')),c=await one('SELECT logo_key FROM companies WHERE id=?',cid);
    const image=c.logo_key&&env.BUCKET?await env.BUCKET.get(c.logo_key):null;if(!image)fail(404,'Imagen no disponible.');
    return new Response(image.body,{headers:{'content-type':'image/jpeg','cache-control':'private, max-age=300','x-content-type-options':'nosniff'}});
  }
  const prefs=preferences(env,db);
  const permissions=rights(user),allow=key=>{if(!permissions[key])fail(403,'No tienes permiso para esta función.');};
  const socialResponse=await social({path,req,body,user,db,one,all,company,json,fail,permissions});if(socialResponse)return socialResponse;
  const accountResponse=await accounts({path,req,body,user,db,run,one,all,company,admin,json,text,choice,random,hashPassword,fail});if(accountResponse)return accountResponse;
  if(path==='/api/upcoming'&&req.method==='GET'){
    allow('calendar.view');
    const parts=new Intl.DateTimeFormat('en-US',{timeZone:'America/Lima',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date()),part=k=>parts.find(p=>p.type===k).value;
    const today=part('year')+'-'+part('month')+'-'+part('day'),end=new Date(Date.parse(today+'T12:00:00Z')+6*86400000).toISOString().slice(0,10);
    const access=user.role==='admin'?'1=1':user.role==='staff'?'EXISTS (SELECT 1 FROM user_companies a WHERE a.company_id=t.company_id AND a.user_id=?)':'t.company_id=?';
    const args=user.role==='admin'?[]:[user.role==='staff'?user.id:user.company_id];
    const events=(await all(`SELECT t.*,c.name AS company_name FROM tasks t JOIN companies c ON c.id=t.company_id WHERE t.date>=? AND t.date<=? AND t.status!='Completado' AND t.type IN ('Grabación','Reunión') AND ${access} ORDER BY t.date,CASE WHEN t.time='' THEN 1 ELSE 0 END,t.time,c.name,t.title`,today,end,...args)).filter(t=>(!contentTask(t)||permissions['content.view'])&&(t.date>today||!t.time||t.time>part('hour')+':'+part('minute')));
    return json({today,end,total:events.length,events:events.slice(0,100)});
  }
  if(path==='/api/appearance'&&write){
    if(req.method!=='POST')fail(405,'Método no permitido.');
    const themes=['getpes','white','neon','blue','red','orange','violet','black','green'];
    if(body.scope==='company'){admin();const cid=await company(body.company_id);const theme=choice(body.theme,themes);await prefs.set(cid,{...await prefs.get(cid),theme});await run('UPDATE companies SET theme=? WHERE id=?',theme,cid);}
    else if(body.scope==='personal'){const theme=body.theme===null?null:choice(body.theme,themes);if(body.hide_branding!==undefined){if(user.username.toLowerCase()!=='grupoe@getpes.com')fail(403,'Esta opción no está disponible para esta cuenta.');if(typeof body.hide_branding!=='boolean')fail(400,'Configuración no válida.');}await run('UPDATE users SET theme=?,hide_branding=? WHERE id=?',theme,body.hide_branding===undefined?user.hide_branding:(body.hide_branding?1:0),user.id);}
    else fail(400,'Configuración no válida.');return json({ok:true});
  }
  if(path==='/api/campaigns/import'&&write){
    allow('campaigns.manage');if(req.method!=='POST')fail(405,'Método no permitido.');const cid=await company(body.company_id);
    if(!Array.isArray(body.rows)||!body.rows.length||body.rows.length>200)fail(400,'Importa entre 1 y 200 campañas.');
    const settings=await prefs.get(cid),companyName=(await one('SELECT name FROM companies WHERE id=?',cid)).name;
    const currency=settings.campaign?.currency||(companyName.trim().toUpperCase()==='LGNA'?'USD':'PEN');if(body.currency!==currency)fail(400,'La moneda del archivo debe coincidir con la de la empresa.');
    const fields=['month','name','platform','objective','status','start_date','end_date','spend','impressions','clicks','leads','sales','revenue','notes','audience','days','daily_budget','frequency','meetings'];
    const repairs=[],seen=new Set(),statements=body.rows.map(row=>{if(!row||typeof row!=='object')fail(400,'Fila no válida.');const period=month(row.month),name=text(row.name,150),key=period+'|'+name.toLowerCase();if(seen.has(key))fail(400,'El archivo repite una campaña en el mismo mes.');seen.add(key);const start=row.start_date?date(row.start_date):'',end=row.end_date?date(row.end_date):'';if(start&&end&&end<start)fail(400,'La fecha final debe ser posterior al inicio.');
      const values=[period,name,choice(row.platform,['Meta Ads']),text(row.objective||'Sin definir',150),choice(row.status||'Sin definir',['Sin definir','Activa','Pausada','Finalizada']),start,end,number(row.spend),number(row.impressions,true),number(row.clicks,true),number(row.leads,true),number(row.sales,true),number(row.revenue),text(row.notes||'Importado desde Meta Ads.',3000,false),'',0,number(row.daily_budget||0),number(row.frequency||0),null];
      if(row.leads_from_messages===true&&number(row.leads,true)>0)repairs.push(db.prepare("UPDATE campaigns SET leads=? WHERE company_id=? AND month=? AND lower(trim(name))=lower(?) AND platform='Meta Ads' AND leads=0 AND notes LIKE 'Importado desde Meta Ads.%'").bind(number(row.leads,true),cid,period,name));
      return db.prepare(`INSERT INTO campaigns(id,company_id,${fields.join(',')}) SELECT ${Array(fields.length+2).fill('?').join(',')} WHERE NOT EXISTS (SELECT 1 FROM campaigns WHERE company_id=? AND month=? AND lower(trim(name))=lower(?) AND platform='Meta Ads')`).bind(crypto.randomUUID(),cid,...values,cid,period,name);
    });
    const results=await db.batch([...repairs,...statements]),count=list=>list.reduce((n,r)=>n+Number(r.meta?.changes??r.changes??0),0),updated=count(results.slice(0,repairs.length)),created=count(results.slice(repairs.length));return json({ok:true,created,updated,skipped:Math.max(0,body.rows.length-created-updated)});
  }
  if(path==='/api/dashboard-preferences'&&write){
    allow('campaigns.manage');if(req.method!=='POST')fail(405,'Método no permitido.');const cid=await company(body.company_id),campaign=validateCampaignPreferences(body.preferences,fail);
    const previousPreferences=await prefs.get(cid);await prefs.set(cid,{...previousPreferences,campaign:{...previousPreferences.campaign,...campaign}});return json({ok:true});
  }
  if(path==='/api/company-settings'&&write){
    admin();if(req.method!=='POST')fail(405,'Método no permitido.');const cid=await company(body.company_id);
    if(typeof body.show_meetings!=='boolean')fail(400,'Configuración no válida.');
    await run('UPDATE companies SET show_meetings=? WHERE id=?',body.show_meetings?1:0,cid);return json({ok:true});
  }
  if(path==='/api/companies'&&req.method==='DELETE'){
    admin();const cid=await company(body.id),target=await one('SELECT name FROM companies WHERE id=?',cid);
    if(body.confirm!==target.name)fail(400,'Escribe el nombre de la empresa para confirmar.');
    if(await one('SELECT id FROM users WHERE company_id=?',cid))fail(409,'Primero reasigna o elimina los usuarios de esta empresa desde Usuarios.');
    await db.batch(['lead_events','leads','campaigns','tasks','reports','campaign_metrics','access_requests','user_companies','dashboard_preferences','companies'].map(table=>db.prepare(table==='lead_events'?'DELETE FROM lead_events WHERE lead_id IN (SELECT id FROM leads WHERE company_id=?)':`DELETE FROM ${table} WHERE ${table==='companies'?'id':'company_id'}=?`).bind(cid)));
    return json({ok:true});
  }
  if(path==='/api/companies'){
    if(req.method==='GET')return json({companies:user.role==='admin'?await all('SELECT * FROM companies ORDER BY name'):user.role==='staff'?await all('SELECT c.* FROM companies c JOIN user_companies a ON a.company_id=c.id WHERE a.user_id=? ORDER BY c.name',user.id):await all('SELECT * FROM companies WHERE id=?',user.company_id)});
    if(['POST','PATCH'].includes(req.method)){
      admin();const cid=req.method==='PATCH'?await company(body.id):crypto.randomUUID(),name=text(body.name,120),industry=text(body.industry||'',150,false),old=req.method==='PATCH'?await one('SELECT logo_key FROM companies WHERE id=?',cid):null;
      let logo=old?.logo_key||'';
      if(body.logo){
        if(!env.BUCKET)fail(503,'No se pudo acceder al almacenamiento de imágenes.');
        if(typeof body.logo!=='string'||!/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(body.logo))fail(400,'Imagen no válida.');
        const bytes=Uint8Array.from(atob(body.logo.split(',')[1]),c=>c.charCodeAt(0));if(bytes.length>180000||bytes[0]!==255||bytes[1]!==216||bytes[2]!==255)fail(400,'Imagen demasiado grande o inválida.');
        logo='company-logos/'+cid+'/'+crypto.randomUUID()+'.jpg';await env.BUCKET.put(logo,bytes,{httpMetadata:{contentType:'image/jpeg'}});
      }
      if(req.method==='PATCH')await run('UPDATE companies SET name=?,industry=?,logo_key=? WHERE id=?',name,industry,logo,cid);
      else await run('INSERT INTO companies(id,name,industry,logo_key,created_at) VALUES(?,?,?,?,?)',cid,name,industry,logo,new Date().toISOString());
      return json({ok:true});
    }
  }
  if(path==='/api/users'){
    admin();if(req.method==='GET')return json({users:await all('SELECT u.id,u.username,u.role,u.company_id,u.active,c.name AS company FROM users u LEFT JOIN companies c ON c.id=u.company_id ORDER BY u.username')});
    if(req.method==='POST'){
      if(body.action==='disable'){const target=await one('SELECT role FROM users WHERE id=?',text(body.id,100));if(!target||target.role==='admin')fail(400,'No se puede desactivar esta cuenta.');await db.batch([db.prepare('UPDATE users SET active=0 WHERE id=?').bind(body.id),db.prepare('DELETE FROM sessions WHERE user_id=?').bind(body.id)]);return json({ok:true});}
      const password='Gp!'+random().slice(0,20);
      if(body.action==='reset'){const target=await one('SELECT role FROM users WHERE id=?',text(body.id,100));if(!target||target.role==='admin')fail(400,'Usa Cambiar contraseña para tu cuenta.');await db.batch([db.prepare('UPDATE users SET password_hash=?,must_change=1,active=1 WHERE id=?').bind(await hashPassword(password),body.id),db.prepare('DELETE FROM sessions WHERE user_id=?').bind(body.id)]);}
      else{const id=await company(body.company_id),username=text(body.username,150).toLowerCase();if(!/^[a-z0-9._+-]+@[a-z0-9.-]+\.[a-z]{2,}$/.test(username))fail(400,'Usa un usuario como nombre@getpes.com.');if(await one('SELECT id FROM users WHERE username=?',username))fail(409,'Ese usuario ya existe.');await run('INSERT INTO users(id,username,password_hash,role,company_id,active,must_change) VALUES(?,?,?,\'client\',?,1,1)',crypto.randomUUID(),username,await hashPassword(password),id);}
      return json({ok:true,password});
    }
  }
  if(path==='/api/data'&&req.method==='GET'){
    const id=await company(url.searchParams.get('company')),m=month(url.searchParams.get('month'));
    const calendarStart=url.searchParams.has('calendar_start')?date(url.searchParams.get('calendar_start')):m+'-01',calendarEnd=url.searchParams.has('calendar_end')?date(url.searchParams.get('calendar_end')):m+'-31';if(calendarEnd<calendarStart||(Date.parse(calendarEnd)-Date.parse(calendarStart))/86400000>31)fail(400,'Periodo de calendario no válido.');
    const report=permissions['reports.view']?await one('SELECT * FROM reports WHERE company_id=? AND month=?'+(permissions['reports.publish']?'':' AND published=1'),id,m):null;
    const comparison=await all('SELECT month,COUNT(*) AS entries,SUM(spend) AS spend,SUM(leads) AS leads,SUM(revenue) AS revenue FROM campaigns WHERE company_id=? AND month>=? AND month<=? GROUP BY month ORDER BY month',id,'2026-09','2027-12');
    const overrides=await all('SELECT month,leads,revenue FROM campaign_metrics WHERE company_id=? AND month>=? AND month<=?',id,'2026-09','2027-12');
    for(const o of overrides){let r=comparison.find(r=>r.month===o.month);if(!r&&(o.leads!==null||o.revenue!==null)){r={month:o.month,entries:1,spend:0,leads:0,revenue:0};comparison.push(r);}if(r){if(o.leads!==null)r.leads=o.leads;if(o.revenue!==null)r.revenue=o.revenue;}}
    const dashboardPreferences=await prefs.get(id);
    const companySettings=await one('SELECT show_meetings,theme FROM companies WHERE id=?',id);if(dashboardPreferences.theme)companySettings.theme=dashboardPreferences.theme;
    const priorDate=new Date(m+'-01T12:00:00Z');priorDate.setUTCMonth(priorDate.getUTCMonth()-1);const previousMonth=priorDate.toISOString().slice(0,7);
    const trendStart=new Date(m+'-01T12:00:00Z');trendStart.setUTCMonth(trendStart.getUTCMonth()-5);
    const trend=await all('SELECT month,COUNT(*) AS entries,SUM(spend) AS spend,SUM(impressions) AS impressions,SUM(clicks) AS clicks,SUM(leads) AS leads,SUM(sales) AS sales,SUM(meetings) AS meetings,SUM(revenue) AS revenue FROM campaigns WHERE company_id=? AND month>=? AND month<=? GROUP BY month ORDER BY month',id,trendStart.toISOString().slice(0,7),m);
    for(const o of await all('SELECT * FROM campaign_metrics WHERE company_id=? AND month>=? AND month<=?',id,trendStart.toISOString().slice(0,7),m)){let r=trend.find(r=>r.month===o.month);if(!r&&['leads','revenue','meetings','sales'].some(k=>o[k]!==null)){r={month:o.month,entries:1,spend:0,impressions:0,clicks:0,leads:0,sales:0,revenue:0};trend.push(r);}if(r)for(const k of ['leads','revenue','meetings','sales'])if(o[k]!==null)r[k]=o[k];}
    const allCampaigns=await all('SELECT * FROM campaigns WHERE company_id=? AND month=? ORDER BY name',id,m);
    const summary=Object.fromEntries(['spend','impressions','clicks','leads','sales','revenue'].map(k=>[k,allCampaigns.reduce((sum,c)=>sum+Number(c[k]||0),0)]));
    summary.meetings=allCampaigns.some(c=>c.meetings!==null)?allCampaigns.reduce((sum,c)=>sum+Number(c.meetings||0),0):null;
    const tasks=(await all('SELECT * FROM tasks WHERE company_id=? AND date>=? AND date<=? ORDER BY date,CASE WHEN time=\'\' THEN 1 ELSE 0 END,time,title',id,calendarStart,calendarEnd)).filter(t=>contentTask(t)?permissions['content.view']:permissions['calendar.view']);
    const calendarAccess=user.role==='admin'?'1=1':user.role==='staff'?'EXISTS (SELECT 1 FROM user_companies a WHERE a.company_id=t.company_id AND a.user_id=?)':'t.company_id=?';
    const calendarArgs=user.role==='admin'?[]:[user.role==='staff'?user.id:user.company_id];
    const calendarHub=id==='getpes'||String((await one('SELECT name FROM companies WHERE id=?',id))?.name||'').trim().toLowerCase()==='getpes';
    const calendarTasks=permissions['calendar.view']&&calendarHub?(await all(`SELECT t.*,c.name AS company_name FROM tasks t JOIN companies c ON c.id=t.company_id WHERE t.date>=? AND t.date<=? AND ${calendarAccess} ORDER BY t.date,t.time,c.name,t.title`,calendarStart,calendarEnd,...calendarArgs)).filter(t=>contentTask(t)?permissions['content.view']:permissions['calendar.view']):[];
    const calendarCampaigns=permissions['calendar.view']&&permissions['campaigns.view']?await all(`SELECT t.id,t.company_id,c.name AS company_name,t.name,t.platform,t.start_date,t.end_date,t.status FROM campaigns t JOIN companies c ON c.id=t.company_id WHERE ((t.start_date>=? AND t.start_date<=?) OR (t.end_date>=? AND t.end_date<=?)) AND ${calendarHub?calendarAccess:'t.company_id=?'}`,calendarStart,calendarEnd,calendarStart,calendarEnd,...(calendarHub?calendarArgs:[id])):[];
    return json({calendarCampaigns,calendarTasks,permissions,summary,companySettings,dashboardPreferences:dashboardPreferences.campaign||null,trend,previousMonth,previous:trend.find(r=>r.month===previousMonth)||null,campaignMetrics:await one('SELECT * FROM campaign_metrics WHERE company_id=? AND month=?',id,m),pipelineCampaigns:permissions['pipeline.view']?await all('SELECT id,name,month,platform FROM campaigns WHERE company_id=? ORDER BY month DESC,name',id):[],leads:permissions['pipeline.view']?await all('SELECT * FROM leads WHERE company_id=? ORDER BY updated_at DESC',id):[],comparison,campaigns:permissions['campaigns.view']?allCampaigns:[],tasks,report:report?{...report,config:JSON.parse(report.config)}:null});
  }
  if(path==='/api/campaign-metrics'&&write){
    allow('campaigns.manage');if(req.method!=='POST')fail(405,'Método no permitido.');const cid=await company(body.company_id),m=month(body.month),key=choice(body.key,['leads','revenue','meetings','sales']);
    const value=body.value===null?null:number(body.value,key!=='revenue');
    await run(`INSERT INTO campaign_metrics(id,company_id,month,${key}) VALUES(?,?,?,?) ON CONFLICT(company_id,month) DO UPDATE SET ${key}=excluded.${key}`,crypto.randomUUID(),cid,m,value);return json({ok:true});
  }
  if(path==='/api/lead-events'){
    allow('pipeline.view');

    const cid=await company(write?body.company_id:url.searchParams.get('company')),lid=text(write?body.lead_id:url.searchParams.get('lead'),100);
    if(!await one('SELECT id FROM leads WHERE id=? AND company_id=?',lid,cid))fail(404,'Prospecto no encontrado.');
    if(req.method==='GET')return json({events:await all('SELECT * FROM lead_events WHERE lead_id=? ORDER BY occurred_at DESC,created_at DESC',lid)});
    admin();if(req.method!=='POST')fail(405,'Método no permitido.');
    const type=choice(body.type,['Llamada registrada','Correo enviado','WhatsApp enviado','Reunión realizada','Nota']),detail=text(body.detail,3000),occurred=new Date(body.occurred_at);
    if(!body.occurred_at||!Number.isFinite(occurred.getTime())||occurred.getTime()>Date.now()+60000)fail(400,'Indica una fecha válida que no esté en el futuro.');
    const stamp=new Date().toISOString();
    await db.batch([db.prepare('INSERT INTO lead_events(id,lead_id,type,detail,actor,occurred_at,created_at) VALUES(?,?,?,?,?,?,?)').bind(crypto.randomUUID(),lid,type,detail,user.username,occurred.toISOString(),stamp),db.prepare('UPDATE leads SET updated_at=? WHERE id=? AND company_id=?').bind(stamp,lid,cid)]);
    return json({ok:true});
  }
  if(path==='/api/leads'&&write){
    allow('pipeline.manage');const cid=await company(body.company_id),id=body.id?text(body.id,100):crypto.randomUUID();
    const existing=body.id?await one('SELECT * FROM leads WHERE id=? AND company_id=?',id,cid):null;
    if(body.id&&!existing)fail(404,'Prospecto no encontrado.');
    if(req.method==='DELETE'){if(!body.id)fail(400,'Selecciona un prospecto.');await run('DELETE FROM leads WHERE id=? AND company_id=?',id,cid);return json({ok:true});}
    const stage=choice(body.stage,['Nuevos','Contactados','En negociación','Ganados','Perdidos']),stamp=new Date().toISOString();
    const stageEvent=db.prepare("INSERT INTO lead_events(id,lead_id,type,detail,actor,occurred_at,created_at) SELECT ?,id,'Cambio de etapa',stage || ' → ' || ?,?,?,? FROM leads WHERE id=? AND company_id=? AND stage<>?").bind(crypto.randomUUID(),stage,user.username,stamp,stamp,id,cid,stage);
    const closedAt=['Ganados','Perdidos'].includes(stage)?(existing?.stage===stage?existing?.closed_at||'':stamp.slice(0,10)):'';
    if(req.method==='PATCH'){if(!body.id)fail(400,'Selecciona un prospecto.');await db.batch([stageEvent,db.prepare('UPDATE leads SET stage=?,updated_at=?,closed_at=? WHERE id=? AND company_id=?').bind(stage,stamp,closedAt,id,cid)]);return json({ok:true});}
    if(req.method!=='POST')fail(405,'Método no permitido.');
    const campaignId=body.campaign_id||null;if(campaignId&&!await one('SELECT id FROM campaigns WHERE id=? AND company_id=?',text(campaignId,100),cid))fail(400,'Selecciona una campaña de esta empresa.');
    const email=text(body.email??existing?.email??'',254,false);if(email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))fail(400,'Revisa el correo del prospecto.');
    const statement=db.prepare('INSERT INTO leads(id,company_id,name,contact,source,stage,value,follow_up,notes,created_at,updated_at,campaign_id,email,industry,services,billing,closed_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name,contact=excluded.contact,source=excluded.source,stage=excluded.stage,value=excluded.value,follow_up=excluded.follow_up,notes=excluded.notes,updated_at=excluded.updated_at,campaign_id=excluded.campaign_id,email=excluded.email,industry=excluded.industry,services=excluded.services,billing=excluded.billing,closed_at=excluded.closed_at').bind(id,cid,text(body.name,150),text(body.contact||'',200,false),choice(body.source,['Meta Ads','Google Ads','Instagram','Facebook','TikTok','LinkedIn','Página web','Orgánico','Referido','Otro']),stage,number(body.value||0),body.follow_up?date(body.follow_up):'',text(body.notes||'',3000,false),stamp,stamp,campaignId,email,text(body.industry??existing?.industry??'',150,false),text(body.services??existing?.services??'',300,false),choice(body.billing??existing?.billing??'Estimado',['Estimado','Mensual','Por proyecto']),closedAt);
    const batch=existing?[stageEvent,statement]:[statement,db.prepare('INSERT INTO lead_events(id,lead_id,type,detail,actor,occurred_at,created_at) VALUES(?,?,?,?,?,?,?)').bind(crypto.randomUUID(),id,'Prospecto creado','Etapa inicial: '+stage,user.username,stamp,stamp)];
    await db.batch(batch);return json({ok:true});
  }
  if(path==='/api/tasks/batch'&&write){
    if(req.method!=='POST')fail(405,'Método no permitido.');
    const action=choice(body.action,['copy','move','delete']),items=body.items;
    if(!Array.isArray(items)||!items.length||items.length>100)fail(400,'Selecciona entre 1 y 100 actividades.');
    const statements=[],seen=new Set(),before=[],affected=[];
    for(const item of items){
      const id=text(item.id,100),cid=await company(item.company_id),target=date(item.date);
      if(seen.has(id))fail(400,'Actividad repetida.');seen.add(id);
      const task=await one('SELECT * FROM tasks WHERE id=? AND company_id=?',id,cid);
      if(!task)fail(404,'Una actividad ya no existe. Actualiza el calendario.');
      allow(contentTask(task)?'content.manage':'calendar.manage');
      if(item.expected_date&&task.date!==item.expected_date)fail(409,'La actividad cambió de fecha. Actualiza el calendario.');
      if(item.expected&&(Object.keys(task).length!==Object.keys(item.expected).length||Object.keys(task).some(key=>task[key]!==item.expected[key])))fail(409,'La actividad cambió. No se puede deshacer sin revisar esos cambios.');
      before.push({id,company_id:cid,date:task.date});const newId=action==='copy'?crypto.randomUUID():id;affected.push(newId);
      if(action==='delete')statements.push(db.prepare('DELETE FROM tasks WHERE id=? AND company_id=?').bind(id,cid));
      else if(action==='move')statements.push(db.prepare('UPDATE tasks SET date=? WHERE id=? AND company_id=?').bind(target,id,cid));
      else statements.push(db.prepare("INSERT INTO tasks(id,company_id,date,title,type,status,notes,url,time,end_time,subtype) VALUES(?,?,?,?,?,'Pendiente',?,?,?,?,?)").bind(newId,cid,target,task.title,task.type,task.notes,task.url,task.time,task.end_time,task.subtype));
    }
    await db.batch(statements);return json({ok:true,count:items.length,before,records:action==='delete'?[]:await Promise.all(affected.map(id=>one('SELECT * FROM tasks WHERE id=?',id)))});
  }
  if(['/api/campaigns','/api/tasks','/api/reports'].includes(path)&&write){
    const cid=await company(body.company_id),table=path.split('/').pop(),id=body.id||crypto.randomUUID();
    if(table==='campaigns')allow('campaigns.manage');
    if(table==='reports')allow('reports.publish');
    let taskBefore=null;
    if(table==='tasks'){const existing=body.id?await one('SELECT * FROM tasks WHERE id=? AND company_id=?',id,cid):null;taskBefore=existing;if(body.id&&!existing){if(!body.restore)fail(404,'Actividad no encontrada.');if(await one('SELECT id FROM tasks WHERE id=?',id))fail(409,'No se puede restaurar esta actividad.');}if(body.expected&&(!existing||Object.keys(body.expected).some(k=>existing[k]!==body.expected[k])))fail(409,'La actividad cambió. Actualiza antes de deshacer.');allow(contentTask(existing||body)?'content.manage':'calendar.manage');if(!['DELETE','PATCH'].includes(req.method))allow(contentTask(body)?'content.manage':'calendar.manage');}
    if(req.method==='DELETE'){if(table==='reports')fail(405,'Usa Guardar borrador para retirar un reporte.');await run(`DELETE FROM ${table} WHERE id=? AND company_id=?`,text(id,100),cid);return json({ok:true,...(table==='tasks'?{before:taskBefore,record:null}:{})});}
    if(table==='tasks'&&req.method==='PATCH'){
      if(!body.id)fail(400,'Selecciona una actividad.');
      await run('UPDATE tasks SET date=? WHERE id=? AND company_id=?',date(body.date),id,cid);
      return json({ok:true});
    }
    if(req.method!=='POST')fail(405,'Método no permitido.');
    if(body.id&&!(table==='tasks'&&body.restore)&&!await one(`SELECT id FROM ${table} WHERE id=? AND company_id=?`,id,cid))fail(404,'Registro no encontrado.');
    if(table==='campaigns'){
      const fields=['meetings','status','start_date','end_date','month','name','platform','objective','spend','impressions','clicks','leads','sales','revenue','notes','audience','days','daily_budget','frequency'];
      const existing=body.id?await one('SELECT meetings,status,start_date,end_date FROM campaigns WHERE id=? AND company_id=?',id,cid):null;const start=body.start_date===undefined?existing?.start_date||'':body.start_date,end=body.end_date===undefined?existing?.end_date||'':body.end_date;if(start)date(start);if(end)date(end);if(start&&end&&end<start)fail(400,'La fecha final debe ser posterior al inicio.');
      const values=[body.meetings===undefined?(existing?.meetings??null):body.meetings===null||body.meetings===''?null:number(body.meetings,true),choice(body.status??existing?.status??'Sin definir',['Sin definir','Activa','Pausada','Finalizada']),start,end,month(body.month),text(body.name,150),choice(body.platform,['Meta Ads','Google Ads']),text(body.objective,150),number(body.spend),number(body.impressions,true),number(body.clicks,true),number(body.leads,true),number(body.sales,true),number(body.revenue),text(body.notes||'',3000,false),text(body.audience||'',300,false),number(body.days||0,true),number(body.daily_budget||0),number(body.frequency||0)];
      await run(`INSERT INTO campaigns(id,company_id,${fields.join(',')}) VALUES(${Array(fields.length+2).fill('?').join(',')}) ON CONFLICT(id) DO UPDATE SET ${fields.map(f=>`${f}=excluded.${f}`).join(',')}`,id,cid,...values);
    } else if(table==='tasks'){
      const previous=body.id?await one('SELECT status,time,end_time,type,subtype FROM tasks WHERE id=? AND company_id=?',id,cid):null;
      const time=body.time??previous?.time??'';if(typeof time!=='string'||(time&&!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)))fail(400,'Selecciona una hora válida.');
      const endTime=body.type==='Video publicado'?'':body.end_time??previous?.end_time??'';if(typeof endTime!=='string'||(endTime&&!/^([01]\d|2[0-3]):[0-5]\d$/.test(endTime)))fail(400,'Selecciona una hora final válida.');if(endTime&&(!time||endTime<=time))fail(400,'La hora final debe ser posterior al inicio en el mismo día.');
      const subtypeOptions=body.type==='Campaña'?['Meta Ads','Google Ads','TikTok Ads','LinkedIn Ads']:body.type==='Video publicado'?['Post','Carrusel','Video']:null;const subtype=subtypeOptions?body.subtype??(previous?.type===body.type?previous.subtype:'')??'':'';if(subtype)choice(subtype,subtypeOptions);
      const fields=['date','title','type','status','notes','url','time','end_time','subtype'],values=[date(body.date),text(body.title,180),choice(body.type,['Grabación','Video editado','Video publicado','Diseño','Guiones / Copy','Reunión','Entrega','Sesión de fotos','Otra actividad','Campaña']),choice(body.status??previous?.status??'Pendiente',['Pendiente','En proceso','En revisión','Completado']),text(body.notes||'',3000,false),safeUrl(body.url),time,endTime,subtype];
      await run(`INSERT INTO tasks(id,company_id,${fields.join(',')}) VALUES(${Array(fields.length+2).fill('?').join(',')}) ON CONFLICT(id) DO UPDATE SET ${fields.map(f=>`${f}=excluded.${f}`).join(',')},approval='Pendiente',approved_by=''`,id,cid,...values);
    }else{
      const config={campaigns:!!body.config?.campaigns,calendar:!!body.config?.calendar,deliverables:!!body.config?.deliverables};
      await run('INSERT INTO reports(id,company_id,month,title,summary,next_steps,config,published,updated_at) VALUES(?,?,?,?,?,?,?,?,?) ON CONFLICT(company_id,month) DO UPDATE SET title=excluded.title,summary=excluded.summary,next_steps=excluded.next_steps,config=excluded.config,published=excluded.published,updated_at=excluded.updated_at',id,cid,month(body.month),text(body.title,180),text(body.summary||'',5000,false),text(body.next_steps||'',5000,false),JSON.stringify(config),body.published?1:0,new Date().toISOString());
    }return json({ok:true,...(table==='tasks'?{before:taskBefore,record:await one('SELECT * FROM tasks WHERE id=? AND company_id=?',id,cid)}:{})});
  }
  fail(404,'Ruta no encontrada.');
 } catch(e){if(!e.status)console.error('Portal request failed',e.message);return json({error:e.status?e.message:'No se pudo guardar o cargar la información. Intenta nuevamente.'},e.status||503);}
}
