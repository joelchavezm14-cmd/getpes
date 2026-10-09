import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const root=path.resolve('public');
const backup=path.resolve('../RESPALDO-IMAGENES-ORIGINALES');
const list=directory=>fs.readdirSync(directory,{withFileTypes:true}).flatMap(entry=>{
  const file=path.join(directory,entry.name);
  return entry.isDirectory()?list(file):[file];
});
const files=list(path.join(root,'assets')).filter(file=>/\.(png|jpe?g)$/i.test(file));
const changes=[];
for(const file of files){
  const relative=path.relative(root,file).replaceAll('\\','/');
  const next=relative.replace(/\.(png|jpe?g)$/i,'.webp');
  const destination=path.join(root,next);
  if(fs.existsSync(destination))throw new Error(`La versión WebP ya existe: ${next}`);
  const original=fs.readFileSync(file);
  const bytes=await sharp(original).rotate().resize({width:1920,withoutEnlargement:true}).webp({quality:88,effort:6}).toBuffer();
  const saved=path.join(backup,relative);
  fs.mkdirSync(path.dirname(saved),{recursive:true});
  if(fs.existsSync(saved)&&!fs.readFileSync(saved).equals(original))throw new Error(`Existe otro original: ${relative}`);
  if(!fs.existsSync(saved))fs.writeFileSync(saved,original);
  fs.writeFileSync(destination,bytes);
  changes.push({original:relative,optimized:next,before:original.length,after:bytes.length});
}
for(const file of list(root).filter(file=>/\.(html|css|js|xml|txt)$/i.test(file))){
  let text=fs.readFileSync(file,'utf8');
  const before=text;
  for(const change of changes){
    const variants=[x=>x,x=>x.replaceAll(' ','%20'),encodeURI,x=>x.split('/').map(encodeURIComponent).join('/')];
    for(const encode of variants)text=text.split(encode(change.original)).join(encode(change.optimized));
  }
  if(text!==before)fs.writeFileSync(file,text);
}
for(const change of changes){
  const file=path.resolve(root,change.original);
  if(!file.startsWith(root+path.sep))throw new Error('Archivo fuera de public');
  if(!fs.readFileSync(path.join(backup,change.original)).equals(fs.readFileSync(file)))throw new Error('El respaldo no coincide');
  fs.unlinkSync(file);
}
fs.mkdirSync(backup,{recursive:true});
fs.writeFileSync(path.join(backup,'OPTIMIZACION.json'),JSON.stringify(changes,null,2));
const before=changes.reduce((sum,c)=>sum+c.before,0),after=changes.reduce((sum,c)=>sum+c.after,0);
console.log(JSON.stringify({images:changes.length,originalMB:+(before/1048576).toFixed(2),optimizedMB:+(after/1048576).toFixed(2),reduction:before?+(100*(1-after/before)).toFixed(1):0,backup}));
