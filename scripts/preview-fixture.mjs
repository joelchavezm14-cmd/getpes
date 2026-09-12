import {database} from './local-db.mjs';import {hashPassword} from '../src/api.mjs';
// Local visual test data only. This script never runs during build or deployment.
const db=database('.local/getpes.sqlite'),run=(s,...a)=>db.prepare(s).bind(...a).run();
await run('INSERT OR IGNORE INTO companies(id,name,created_at) VALUES(?,?,?)','qa','Vista previa · Datos de prueba',new Date().toISOString());
await run('INSERT OR IGNORE INTO users(id,username,password_hash,role,company_id,active,must_change) VALUES(?,?,?,?,?,1,0)','qa-admin','preview@getpes.test',await hashPassword('Preview-only-123456'),'admin',null);
await run('INSERT OR IGNORE INTO users(id,username,password_hash,role,company_id,active,must_change) VALUES(?,?,?,?,?,1,0)','qa-client','client@getpes.test',await hashPassword('Preview-only-123456'),'client','qa');
const m=new Date().toISOString().slice(0,7);
for(const [id,name,platform,spend,impressions,clicks,leads] of [['qa-meta','Reconocimiento de marca','Meta Ads',540,24000,640,32],['qa-google','Búsqueda de servicios','Google Ads',320,6400,220,18]])await run('INSERT OR IGNORE INTO campaigns(id,company_id,month,name,platform,objective,spend,impressions,clicks,leads,sales,revenue,notes) VALUES(?,?,?,?,?,?,?,?,?,?,0,0,?)',id,'qa',m,name,platform,'Clientes potenciales',spend,impressions,clicks,leads,'Datos de prueba para verificar la vista.');
for(const [i,type,status] of [[1,'Grabación','Completado'],[2,'Video editado','En revisión'],[3,'Video publicado','Pendiente']])await run('INSERT OR IGNORE INTO tasks(id,company_id,date,title,type,status,notes,url) VALUES(?,?,?,?,?,?,?,?)','qa-task-'+i,'qa',m+'-'+String(10+i*3).padStart(2,'0'),type+' · Contenido de marca',type,status,'Actividad de prueba.','');
db.close();console.log('Local preview fixture ready.');
