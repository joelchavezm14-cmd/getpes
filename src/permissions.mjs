export const permissionKeys=['social.view','campaigns.view','campaigns.manage','content.view','content.manage','content.approve','calendar.view','calendar.manage','reports.view','reports.publish','reports.download'];
export function rights(user){
 if(user.role==='admin')return Object.fromEntries([...permissionKeys,'pipeline.view','pipeline.manage','team.view','requests.create'].map(k=>[k,k!=='requests.create']));
 if(user.role==='company_admin')return Object.fromEntries([...permissionKeys,'team.view','requests.create'].map(k=>[k,k!=='reports.publish']));
 if(user.role==='client')return Object.fromEntries(['campaigns.view','content.view','calendar.view','reports.view','reports.download','pipeline.view'].map(k=>[k,true]));
 if(user.role==='staff'){let keys=[];try{keys=JSON.parse(user.permissions||'[]');}catch{}return Object.fromEntries(permissionKeys.map(k=>[k,Array.isArray(keys)&&keys.includes(k)]));}
 return {};
}
export function normalizePermissions(keys){if(!Array.isArray(keys)||keys.some(k=>!permissionKeys.includes(k)))throw Object.assign(new Error('Selecciona permisos válidos.'),{status:400});const result=new Set(keys);for(const [a,b] of [['campaigns.manage','campaigns.view'],['content.manage','content.view'],['content.approve','content.view'],['calendar.manage','calendar.view'],['reports.publish','reports.view'],['reports.download','reports.view']])if(result.has(a))result.add(b);return [...result];}
export const contentTask=t=>['Video editado','Video publicado','Diseño','Guiones / Copy','Entrega'].includes(t.type)||!!t.url;
