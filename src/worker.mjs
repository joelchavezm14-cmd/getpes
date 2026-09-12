import { api } from './api.mjs';
import { assets } from './assets.mjs';
export default {async fetch(request,env){
 let path;try{path=decodeURIComponent(new URL(request.url).pathname);}catch{return new Response('Ruta inválida',{status:400});}
 if(path.startsWith('/api/'))return api(request,env);
 const alias=path==='/'?'/index.html':path==='/gestion-getpes'?'/admin.html':path==='/dashboard'?'/dashboard.html':path;
 const asset=assets[alias];
 if(!asset||!['GET','HEAD'].includes(request.method))return new Response('No encontrado',{status:404});
 const body=asset.base64?Uint8Array.from(atob(asset.body),c=>c.charCodeAt(0)):asset.body;
 return new Response(request.method==='HEAD'?null:body,{headers:{'content-type':asset.type,'x-content-type-options':'nosniff','referrer-policy':'same-origin','cache-control':asset.type.startsWith('text/html')?'no-store':'public, max-age=300'}});
}};
