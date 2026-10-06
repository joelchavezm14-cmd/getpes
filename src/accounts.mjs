import {rights,normalizePermissions,contentTask} from './permissions.mjs';
export async function accounts(c){const {path,req,body,user,db,run,one,all,company,admin,json,text,choice,random,hashPassword,fail}=c;
 if(path==='/api/social'&&req.method==='GET'){if(!rights(user)['social.view'])fail(403,'Sin permiso para redes sociales.');const cid=await company(new URL(req.url).searchParams.get('company'));return json({items:await all("SELECT id,title,date,url FROM tasks WHERE company_id=? AND type='Video publicado' ORDER BY date DESC",cid)});}
 if(path==='/api/task-approval'&&req.method==='POST'){
  if(!rights(user)['content.approve'])fail(403,'No puedes aprobar contenido.');const cid=await company(body.company_id),id=text(body.id,100),task=await one('SELECT * FROM tasks WHERE id=? AND company_id=?',id,cid);if(!task||!contentTask(task))fail(404,'Contenido no encontrado.');
  await run('UPDATE tasks SET approval=?,approved_by=? WHERE id=? AND company_id=?',choice(body.approval,['Pendiente','Aprobado','Cambios solicitados']),user.username,id,cid);return json({ok:true});
 }
 if(path==='/api/team'&&req.method==='GET'){
  if(!rights(user)['team.view'])fail(403,'No puedes ver el equipo.');const cid=await company(new URL(req.url).searchParams.get('company'));
  return json({users:await all('SELECT DISTINCT u.id,u.username,u.display_name,u.phone,u.role,u.active FROM users u LEFT JOIN user_companies a ON a.user_id=u.id WHERE u.company_id=? OR a.company_id=? ORDER BY u.username',cid,cid)});
 }
 if(path==='/api/access-requests'){
  if(req.method==='GET'){if(user.role==='admin')return json({requests:await all('SELECT r.*,c.name AS company,u.username FROM access_requests r JOIN companies c ON c.id=r.company_id JOIN users u ON u.id=r.requester ORDER BY r.created_at DESC')});if(!rights(user)['requests.create'])fail(403,'Sin acceso.');const cid=await company(new URL(req.url).searchParams.get('company'));return json({requests:await all('SELECT * FROM access_requests WHERE company_id=? ORDER BY created_at DESC',cid)});}
  if(req.method==='POST'){if(!rights(user)['requests.create'])fail(403,'Solo Admin Empresa puede solicitar accesos.');const cid=await company(body.company_id);await run('INSERT INTO access_requests(id,company_id,requester,type,detail,status,created_at) VALUES(?,?,?,?,?,?,?)',crypto.randomUUID(),cid,user.id,choice(body.type,['Nuevo acceso','Baja de usuario']),text(body.detail,1500),'Pendiente',new Date().toISOString());return json({ok:true});}
  if(req.method==='PATCH'){admin();await run('UPDATE access_requests SET status=? WHERE id=?',choice(body.status,['Pendiente','Resuelta','Rechazada']),text(body.id,100));return json({ok:true});}
 }
 if(path!=='/api/users')return null;
 admin();
 if(req.method==='GET'){const users=await all('SELECT u.id,u.username,u.display_name,u.phone,u.role,u.company_id,u.active,u.permissions,c.name AS company FROM users u LEFT JOIN companies c ON c.id=u.company_id ORDER BY u.username');const assignments=await all('SELECT user_id,company_id FROM user_companies');return json({users:users.map(u=>({...u,permissions:JSON.parse(u.permissions||'[]'),companies:assignments.filter(a=>a.user_id===u.id).map(a=>a.company_id)}))});}
 if(req.method==='DELETE'){
  const target=await one('SELECT * FROM users WHERE id=?',text(body.id,100));
  if(!target)fail(404,'Usuario no encontrado.');
  if(target.role==='admin'||target.id===user.id)fail(400,'La cuenta administradora está protegida.');
  if(body.confirm!==target.username)fail(400,'Escribe el correo del usuario para confirmar.');
  await db.batch(['DELETE FROM sessions WHERE user_id=?','DELETE FROM access_requests WHERE requester=?','DELETE FROM user_companies WHERE user_id=?','DELETE FROM users WHERE id=?'].map(sql=>db.prepare(sql).bind(target.id)));
  return json({ok:true});
 }
 if(req.method==='POST'&&['disable','reset','enable'].includes(body.action)){
  const target=await one('SELECT * FROM users WHERE id=?',text(body.id,100));if(!target||target.role==='admin')fail(400,'Usa las opciones de tu cuenta para administración.');const batch=[];let password;
  if(body.action==='disable')batch.push(db.prepare('UPDATE users SET active=0 WHERE id=?').bind(target.id));
  if(body.action==='enable')batch.push(db.prepare('UPDATE users SET active=1 WHERE id=?').bind(target.id));
  if(body.action==='reset'){password='Gp!'+random().slice(0,20);batch.push(db.prepare('UPDATE users SET password_hash=?,must_change=1,active=1 WHERE id=?').bind(await hashPassword(password),target.id));}
  batch.push(db.prepare('DELETE FROM sessions WHERE user_id=?').bind(target.id));await db.batch(batch);return json({ok:true,...(password?{password}:{})});
 }
 if(!['POST','PATCH'].includes(req.method))fail(405,'Método no permitido.');
 const existing=req.method==='PATCH'?await one('SELECT * FROM users WHERE id=?',text(body.id,100)):null;
 if(req.method==='PATCH'&&!existing)fail(404,'Usuario no encontrado.');
 if(existing?.role==='admin')fail(400,'La cuenta de Getpes Admin se mantiene protegida.');
 const role=choice(body.role||existing?.role||'client',['admin','staff','company_admin','client']);
 const username=text(body.username||existing?.username,150).toLowerCase();if(!/^[a-z0-9._+-]+@[a-z0-9.-]+\.[a-z]{2,}$/.test(username))fail(400,'Escribe un usuario como nombre@getpes.com.');
 if(await one('SELECT id FROM users WHERE username=? AND id<>?',username,existing?.id||''))fail(409,'Ese usuario ya existe.');
 const cid=['company_admin','client'].includes(role)?await company(body.company_id):null;
 const assigned=role==='staff'?body.companies||[]:[];if(!Array.isArray(assigned)||assigned.length>100)fail(400,'Selecciona empresas válidas.');for(const id of assigned)await company(id);
 const perms=role==='staff'?normalizePermissions(body.permissions||[]):[];
 const id=existing?.id||crypto.randomUUID(),display=text(body.display_name||'',150,false),phone=text(body.phone||'',60,false),batch=[];let password;
 if(existing){batch.push(db.prepare('UPDATE users SET username=?,display_name=?,phone=?,role=?,company_id=?,permissions=? WHERE id=?').bind(username,display,phone,role,cid,JSON.stringify(perms),id));batch.push(db.prepare('DELETE FROM sessions WHERE user_id=?').bind(id));}
 else{password='Gp!'+random().slice(0,20);batch.push(db.prepare('INSERT INTO users(id,username,password_hash,role,company_id,active,must_change,display_name,phone,permissions) VALUES(?,?,?,?,?,1,1,?,?,?)').bind(id,username,await hashPassword(password),role,cid,display,phone,JSON.stringify(perms)));}
 batch.push(db.prepare('DELETE FROM user_companies WHERE user_id=?').bind(id));for(const companyId of new Set(assigned))batch.push(db.prepare('INSERT INTO user_companies(id,user_id,company_id) VALUES(?,?,?)').bind(crypto.randomUUID(),id,companyId));await db.batch(batch);
 return json({ok:true,...(password?{password}:{})});
}
