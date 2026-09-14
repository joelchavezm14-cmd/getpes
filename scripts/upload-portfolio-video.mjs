import fs from 'node:fs';
const [token,siteToken]=process.argv.slice(2);
const root='https://getpes-estudio-digital.joelchavezm14.chatgpt.site';
for(const [file,name] of [['ALEJANDRA - REMODELACIÓN LGNA.mp4','alejandra-56ffa174.mp4'],['CUANDO SE QUEDAN CON EL DE MARKETING.mp4','marketing.mp4'],['DISEÑAMOS MOMENTO INOLVIDABLES - LGNA.mp4','momentos-b1419dbd.mp4'],['HABIBIS - VIDEO.mp4','habibis-8f2f4875.mp4'],['LISTO EN UNOS MESES - LGNA.mp4','meses-59f537b7.mp4']]){
 const path='public/assets/portafolio/VIDEOS/'+file;
 const r=await fetch(root+'/media/'+name,{method:'PUT',headers:{Authorization:'Bearer '+token,'OAI-Sites-Authorization':'Bearer '+siteToken,'Content-Type':'video/mp4','Content-Length':String(fs.statSync(path).size)},body:fs.createReadStream(path),duplex:'half',signal:AbortSignal.timeout(180000)});
 console.log(name,r.status,(await r.text()).slice(0,200));if(!r.ok)process.exit(1);
}
