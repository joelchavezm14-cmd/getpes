import http from 'node:http';import fs from 'node:fs';import path from 'node:path';
import {api} from '../src/api.mjs';import {database} from './local-db.mjs';
fs.mkdirSync('.local',{recursive:true});const env={DB:database('.local/getpes.sqlite'),...JSON.parse(fs.readFileSync('.local/bootstrap.json','utf8'))};
http.createServer(async(req,res)=>{try{const origin='http://127.0.0.1:4174',u=new URL(req.url,origin);
 if(u.pathname.startsWith('/api/')){let body='';for await(const chunk of req){body+=chunk;if(body.length>21000){res.writeHead(413).end();return;}}const r=await api(new Request(u,{method:req.method,headers:req.headers,body:['GET','HEAD'].includes(req.method)?undefined:body}),env);res.writeHead(r.status,Object.fromEntries(r.headers));res.end(Buffer.from(await r.arrayBuffer()));return;}
 const pathname=u.pathname==='/gestion-getpes'?'/admin.html':u.pathname==='/'?'/index.html':decodeURIComponent(u.pathname),root=path.resolve('public'),file=path.resolve(root,'.'+pathname);if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
 const data=await fs.promises.readFile(file);res.setHeader('content-type',({'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg'})[path.extname(file)]||'application/octet-stream');res.end(data);
 }catch{res.writeHead(404).end('No encontrado');}}).listen(4174,'127.0.0.1',()=>console.log('http://127.0.0.1:4174/dashboard.html'));
