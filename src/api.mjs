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
  let body={};if(write){const raw=await req.text();if(raw.length>20000)fail(413,'El contenido es demasiado extenso.');try{body=JSON.parse(raw);}catch{fail(400,'Solicitud no válida.');}}
  const token=(req.headers.get('cookie')||'').match(/(?:^|;\s*)getpes_session=([a-f0-9]{64})/)?.[1];
  const user=token?await one('SELECT u.id,u.username,u.role,u.company_id,u.must_change FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token=? AND s.expires>? AND u.active=1',await digest(token),Date.now()):null;
  if(path==='/api/session'&&req.method==='GET')return json({user});
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
  const company=async id=>{text(id,100);if(user.role!=='admin'&&user.company_id!==id)fail(403,'No tienes acceso a esta empresa.');if(!await one('SELECT id FROM companies WHERE id=?',id))fail(404,'Empresa no encontrada.');return id;};
  if(path==='/api/company-settings'&&write){
    admin();if(req.method!=='POST')fail(405,'Método no permitido.');const cid=await company(body.company_id);
    if(typeof body.show_meetings!=='boolean')fail(400,'Configuración no válida.');
    await run('UPDATE companies SET show_meetings=? WHERE id=?',body.show_meetings?1:0,cid);return json({ok:true});
  }
  if(path==='/api/companies'){
    if(req.method==='GET')return json({companies:user.role==='admin'?await all('SELECT * FROM companies ORDER BY name'):await all('SELECT * FROM companies WHERE id=?',user.company_id)});
    if(req.method==='POST'){admin();await run('INSERT INTO companies(id,name,created_at) VALUES(?,?,?)',crypto.randomUUID(),text(body.name,120),new Date().toISOString());return json({ok:true});}
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
    const report=await one('SELECT * FROM reports WHERE company_id=? AND month=?'+(user.role==='admin'?'':' AND published=1'),id,m);
    const comparison=await all('SELECT month,COUNT(*) AS entries,SUM(spend) AS spend,SUM(leads) AS leads FROM campaigns WHERE company_id=? AND month>=? AND month<=? GROUP BY month ORDER BY month',id,'2026-09','2027-12');
    return json({companySettings:await one('SELECT show_meetings FROM companies WHERE id=?',id),campaignMetrics:await one('SELECT * FROM campaign_metrics WHERE company_id=? AND month=?',id,m),pipelineCampaigns:await all('SELECT id,name,month,platform FROM campaigns WHERE company_id=? ORDER BY month DESC,name',id),leads:await all('SELECT * FROM leads WHERE company_id=? ORDER BY updated_at DESC',id),comparison,campaigns:await all('SELECT * FROM campaigns WHERE company_id=? AND month=? ORDER BY name',id,m),tasks:await all('SELECT * FROM tasks WHERE company_id=? AND date>=? AND date<=? ORDER BY date,title',id,m+'-01',m+'-31'),report:report?{...report,config:JSON.parse(report.config)}:null});
  }
  if(path==='/api/campaign-metrics'&&write){
    admin();if(req.method!=='POST')fail(405,'Método no permitido.');const cid=await company(body.company_id),m=month(body.month),key=choice(body.key,['leads','revenue','meetings','sales']);
    const value=body.value===null?null:number(body.value,key!=='revenue');
    await run(`INSERT INTO campaign_metrics(id,company_id,month,${key}) VALUES(?,?,?,?) ON CONFLICT(company_id,month) DO UPDATE SET ${key}=excluded.${key}`,crypto.randomUUID(),cid,m,value);return json({ok:true});
  }
  if(path==='/api/lead-events'){

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
    admin();const cid=await company(body.company_id),id=body.id?text(body.id,100):crypto.randomUUID();
    const existing=body.id?await one('SELECT * FROM leads WHERE id=? AND company_id=?',id,cid):null;
    if(body.id&&!existing)fail(404,'Prospecto no encontrado.');
    if(req.method==='DELETE'){if(!body.id)fail(400,'Selecciona un prospecto.');await run('DELETE FROM leads WHERE id=? AND company_id=?',id,cid);return json({ok:true});}
    const stage=choice(body.stage,['Nuevos','Contactados','En negociación','Ganados','Perdidos']),stamp=new Date().toISOString();
    const stageEvent=db.prepare("INSERT INTO lead_events(id,lead_id,type,detail,actor,occurred_at,created_at) SELECT ?,id,'Cambio de etapa',stage || ' → ' || ?,?,?,? FROM leads WHERE id=? AND company_id=? AND stage<>?").bind(crypto.randomUUID(),stage,user.username,stamp,stamp,id,cid,stage);
    if(req.method==='PATCH'){if(!body.id)fail(400,'Selecciona un prospecto.');await db.batch([stageEvent,db.prepare('UPDATE leads SET stage=?,updated_at=? WHERE id=? AND company_id=?').bind(stage,stamp,id,cid)]);return json({ok:true});}
    if(req.method!=='POST')fail(405,'Método no permitido.');
    const campaignId=body.campaign_id||null;if(campaignId&&!await one('SELECT id FROM campaigns WHERE id=? AND company_id=?',text(campaignId,100),cid))fail(400,'Selecciona una campaña de esta empresa.');
    const email=text(body.email??existing?.email??'',254,false);if(email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))fail(400,'Revisa el correo del prospecto.');
    const statement=db.prepare('INSERT INTO leads(id,company_id,name,contact,source,stage,value,follow_up,notes,created_at,updated_at,campaign_id,email,industry) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name,contact=excluded.contact,source=excluded.source,stage=excluded.stage,value=excluded.value,follow_up=excluded.follow_up,notes=excluded.notes,updated_at=excluded.updated_at,campaign_id=excluded.campaign_id,email=excluded.email,industry=excluded.industry').bind(id,cid,text(body.name,150),text(body.contact||'',200,false),choice(body.source,['Meta Ads','Google Ads','Orgánico','Referido','Otro']),stage,number(body.value||0),body.follow_up?date(body.follow_up):'',text(body.notes||'',3000,false),stamp,stamp,campaignId,email,text(body.industry??existing?.industry??'',150,false));
    const batch=existing?[stageEvent,statement]:[statement,db.prepare('INSERT INTO lead_events(id,lead_id,type,detail,actor,occurred_at,created_at) VALUES(?,?,?,?,?,?,?)').bind(crypto.randomUUID(),id,'Prospecto creado','Etapa inicial: '+stage,user.username,stamp,stamp)];
    await db.batch(batch);return json({ok:true});
  }
  if(['/api/campaigns','/api/tasks','/api/reports'].includes(path)&&write){
    admin();const cid=await company(body.company_id),table=path.split('/').pop(),id=body.id||crypto.randomUUID();
    if(req.method==='DELETE'){if(table==='reports')fail(405,'Usa Guardar borrador para retirar un reporte.');await run(`DELETE FROM ${table} WHERE id=? AND company_id=?`,text(id,100),cid);return json({ok:true});}
    if(req.method!=='POST')fail(405,'Método no permitido.');
    if(body.id&&!await one(`SELECT id FROM ${table} WHERE id=? AND company_id=?`,id,cid))fail(404,'Registro no encontrado.');
    if(table==='campaigns'){
      const fields=['month','name','platform','objective','spend','impressions','clicks','leads','sales','revenue','notes','audience','days','daily_budget','frequency'];
      const values=[month(body.month),text(body.name,150),choice(body.platform,['Meta Ads','Google Ads']),text(body.objective,150),number(body.spend),number(body.impressions,true),number(body.clicks,true),number(body.leads,true),number(body.sales,true),number(body.revenue),text(body.notes||'',3000,false),text(body.audience||'',300,false),number(body.days||0,true),number(body.daily_budget||0),number(body.frequency||0)];
      await run(`INSERT INTO campaigns(id,company_id,${fields.join(',')}) VALUES(${Array(fields.length+2).fill('?').join(',')}) ON CONFLICT(id) DO UPDATE SET ${fields.map(f=>`${f}=excluded.${f}`).join(',')}`,id,cid,...values);
    } else if(table==='tasks'){
      const fields=['date','title','type','status','notes','url'],values=[date(body.date),text(body.title,180),choice(body.type,['Grabación','Video editado','Video publicado','Diseño','Reunión','Otra actividad']),choice(body.status,['Pendiente','En proceso','En revisión','Completado']),text(body.notes||'',3000,false),safeUrl(body.url)];
      await run(`INSERT INTO tasks(id,company_id,${fields.join(',')}) VALUES(${Array(8).fill('?').join(',')}) ON CONFLICT(id) DO UPDATE SET ${fields.map(f=>`${f}=excluded.${f}`).join(',')}`,id,cid,...values);
    }else{
      const config={campaigns:!!body.config?.campaigns,calendar:!!body.config?.calendar,deliverables:!!body.config?.deliverables};
      await run('INSERT INTO reports(id,company_id,month,title,summary,next_steps,config,published,updated_at) VALUES(?,?,?,?,?,?,?,?,?) ON CONFLICT(company_id,month) DO UPDATE SET title=excluded.title,summary=excluded.summary,next_steps=excluded.next_steps,config=excluded.config,published=excluded.published,updated_at=excluded.updated_at',id,cid,month(body.month),text(body.title,180),text(body.summary||'',5000,false),text(body.next_steps||'',5000,false),JSON.stringify(config),body.published?1:0,new Date().toISOString());
    }return json({ok:true});
  }
  fail(404,'Ruta no encontrada.');
 } catch(e){if(!e.status)console.error('Portal request failed',e.message);return json({error:e.status?e.message:'No se pudo guardar o cargar la información. Intenta nuevamente.'},e.status||503);}
}
