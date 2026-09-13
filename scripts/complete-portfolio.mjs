import fs from 'node:fs';
const root='public/assets/portafolio/';
for(const [page,folder,lead] of [
 ['branding','BRANDING Y DISEÑO','Identidad visual y diseño de empaques para llevar cada marca a sus productos.'],
 ['redes','GESTION DE REDES','Piezas gráficas y contenido creados para comunicar, presentar productos y conectar con la audiencia.']
]){
 const file=`public/portafolio-${page}.html`;
 let html=fs.readFileSync(file,'utf8');
 const figures=fs.readdirSync(root+folder).filter(f=>/\.(png|jpe?g)$/i.test(f)).map((name,i)=>{
  const title=page==='branding'?name.replace(/ con fondo| con pita| tela| \(1\)|\.png/gi,''):`Contenido para redes · ${String(i+1).padStart(2,'0')}`;
  const url='assets/portafolio/'+encodeURIComponent(folder)+'/'+encodeURIComponent(name);
  return `<figure class="portfolio-gallery-item"><a href="${url}" target="_blank" rel="noopener" aria-label="Ampliar ${title}"><img src="${url}" alt="${title}" loading="lazy"></a><figcaption>${title}</figcaption></figure>`;
 }).join('\n');
 html=html.replace(/<p class="lead">.*?<\/p>/,`<p class="lead">${lead}</p>`).replace(/<div class="portfolio-gallery">[\s\S]*?<\/div>/,`<div class="portfolio-gallery real-work-gallery">${figures}</div><p style="margin-top:28px"><a class="btn btn-primary" href="contacto.html?servicio=${page}">Movamos tu marca ↗</a></p>`);
 if(page==='branding')html=html.replace('Muestras de proyectos de campañas digitales realizados por Getpes.','Identidad visual y diseño de empaques realizados por Getpes.');
 html=html.replace('</head>','<style>.real-work-gallery img{object-fit:contain;height:auto;max-height:620px;background:#111}.real-work-gallery a{display:block}.real-work-gallery figcaption{overflow-wrap:anywhere}</style></head>');
 fs.writeFileSync(file,html);
}
let home=fs.readFileSync('public/index.html','utf8');
const fourth=home.match(/        <article class="service-card">\s*<span class="num">04<\/span>[\s\S]*?<\/article>/)?.[0];
if(fourth){home=home.replace(fourth,'');home=home.replace('      </div>\n\n      <div class="project-showcase">',fourth+'\n      </div>\n\n      <div class="project-showcase">');}
fs.writeFileSync('public/index.html',home);
let portfolio=fs.readFileSync('public/portafolio.html','utf8').replace('Contenido, video y campañas. Explora las tres formas en que movemos tu marca.','Contenido, video, campañas y diseño. Explora las cuatro formas en que movemos tu marca.').replace('<strong>Estamos cargando el contenido real de nuestros proyectos.</strong> Muy pronto cada tarjeta mostrará casos concretos de clientes, con resultados y capturas de campaña.','Explora nuestras piezas reales de redes y diseño. Seguimos preparando la selección de videos y casos de campañas.');
fs.writeFileSync('public/portafolio.html',portfolio);
