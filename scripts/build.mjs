import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
const assets={};
async function walk(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const file=path.join(dir,entry.name);if(entry.isDirectory()){await walk(file);continue;}if(['dashboard.js','dashboard.css','README.md'].includes(entry.name))continue;const ext=path.extname(file).toLowerCase();if(!['.html','.css','.js','.svg','.png','.jpg','.jpeg','.txt','.xml'].includes(ext))continue;
 let bytes=fs.readFileSync(file),type=({'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.txt':'text/plain','.xml':'application/xml'})[ext],binary=!type;
 if(binary){bytes=await sharp(bytes).resize({width:1920,withoutEnlargement:true}).webp({quality:86}).toBuffer();type='image/webp';}
 assets['/'+path.relative('public',file).replaceAll('\\','/')]={type,base64:binary,body:binary?bytes.toString('base64'):bytes.toString('utf8')};
}}
await walk('public');
// Only the explicitly generated server folder is replaced. Authored public assets remain untouched.
fs.mkdirSync('dist/server',{recursive:true});fs.mkdirSync('dist/.openai',{recursive:true});
fs.writeFileSync('dist/server/assets.mjs','export const assets='+JSON.stringify(assets)+';');
fs.copyFileSync('src/social.mjs','dist/server/social.mjs');
fs.copyFileSync('src/api.mjs','dist/server/api.mjs');fs.copyFileSync('src/worker.mjs','dist/server/index.js');
fs.copyFileSync('src/permissions.mjs','dist/server/permissions.mjs');fs.copyFileSync('src/accounts.mjs','dist/server/accounts.mjs');
fs.copyFileSync('src/dashboard-preferences.mjs','dist/server/dashboard-preferences.mjs');
fs.copyFileSync('src/media.mjs','dist/server/media.mjs');
fs.copyFileSync('.openai/hosting.json','dist/.openai/hosting.json');
fs.cpSync('drizzle','dist/.openai/drizzle',{recursive:true});
console.log('Portal and '+Object.keys(assets).length+' public assets built.');
