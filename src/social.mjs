const platforms=['facebook','instagram','tiktok','linkedin'];
export async function social(c){
 const {path,req,body,user,db,one,all,company,json,fail,permissions}=c;if(!path.startsWith('/api/social/'))return null;
 if(!permissions['social.view'])fail(403,'Sin permiso para redes sociales.');
 const url=new URL(req.url),cid=await company(req.method==='GET'?url.searchParams.get('company'):body.company_id),manage=['admin','company_admin'].includes(user.role);
 if(path==='/api/social/connection'&&['POST','DELETE'].includes(req.method)){
  if(!manage)fail(403,'Solo el administrador puede preparar o desvincular cuentas.');if(!platforms.includes(body.platform))fail(400,'Red no válida.');
  if(req.method==='DELETE'){await db.prepare("UPDATE social_connections SET status='disconnected' WHERE company_id=? AND platform=?").bind(cid,body.platform).run();return json({ok:true});}
  await db.prepare("INSERT INTO social_connections(id,company_id,platform,status,created_at) VALUES(?,?,?,'pending',?) ON CONFLICT(company_id,platform) DO UPDATE SET status=CASE WHEN social_connections.status='connected' THEN 'connected' ELSE 'pending' END").bind(crypto.randomUUID(),cid,body.platform,new Date().toISOString()).run();
  return json({ok:true,status:'pending',message:'Preparación guardada. Falta configurar la aplicación oficial y autorizar la cuenta.'});
 }
 if(path!=='/api/social/analytics'||req.method!=='GET')fail(404,'Operación no disponible.');
 const valid=v=>{const d=new Date(v+'T12:00:00Z');return /^\d{4}-\d{2}-\d{2}$/.test(v||'')&&Number.isFinite(+d)&&d.toISOString().slice(0,10)===v;};
 const start=url.searchParams.get('start'),end=url.searchParams.get('end');if(!valid(start)||!valid(end)||end<start||(Date.parse(end)-Date.parse(start))/86400000>730)fail(400,'Selecciona un periodo válido de hasta dos años.');
 const connections=await all('SELECT * FROM social_connections WHERE company_id=?',cid),networks=[];
 for(const platform of platforms){const account=connections.find(x=>x.platform===platform),connected=account?.status==='connected';let daily=[],posts=[],latest=null,baseline=null;
  if(connected){daily=await all('SELECT date,followers,views,reach FROM social_daily WHERE connection_id=? AND date>=? AND date<=? ORDER BY date',account.id,start,end);posts=await all('SELECT title,url,kind,published_at,views,reach,likes FROM social_posts WHERE connection_id=? AND published_at>=? AND published_at<? ORDER BY views DESC',account.id,start,end+'T23:59:59.999Z');latest=await one('SELECT date,followers FROM social_daily WHERE connection_id=? AND followers IS NOT NULL ORDER BY date DESC LIMIT 1',account.id);baseline=await one('SELECT date,followers FROM social_daily WHERE connection_id=? AND date<? AND followers IS NOT NULL ORDER BY date DESC LIMIT 1',account.id,start);}
  const last=daily.filter(x=>x.followers!==null).at(-1),growth=baseline&&last?last.followers-baseline.followers:null,viewDays=daily.filter(x=>x.views!==null);
  networks.push({platform,status:account?.status||'disconnected',account_name:account?.account_name||'',last_synced:account?.last_synced||null,followers:latest?.followers??null,followers_date:latest?.date||null,growth,growth_start:baseline?.date||null,growth_end:last?.date||null,views:viewDays.length?viewDays.reduce((n,x)=>n+x.views,0):null,view_days:viewDays.length,reach:null,post_count:connected?posts.length:null,daily,posts,top:posts.filter(p=>p.views!==null).slice(0,5)});
 }
 const items=await all("SELECT id,title,date,url FROM tasks WHERE company_id=? AND type='Video publicado' AND date>=? AND date<=? ORDER BY date DESC",cid,start,end);
 return json({networks,items,manage,start,end,integration_status:'setup_required'});
}
