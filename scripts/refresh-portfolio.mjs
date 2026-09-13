import fs from 'node:fs';
let p=fs.readFileSync('public/portafolio.html','utf8');
for(const [old,next] of [['assets/portafolio/getpes-redes.png','assets/portafolio/g%20redes.png'],['assets/portafolio/getpes-video.png','assets/portafolio/g%20videos.png'],['assets/portafolio/getpes-campanas.png','assets/portafolio/g%20campañas.png'],['assets/inicio/sultanas.png','assets/portafolio/g%20branding.png']])p=p.replaceAll(old,next);
p=p.replace('Seguimos preparando la selección de videos y casos de campañas.','También puedes reproducir nuestros videos y explorar las áreas de trabajo.');
fs.writeFileSync('public/portafolio.html',p);
for(const page of ['branding','redes']){
 const file=`public/portafolio-${page}.html`;
 let s=fs.readFileSync(file,'utf8').replace(/<style>.*?<\/style>/s,'');
 s=s.replace('</head>','<link rel="stylesheet" href="css/portfolio-flow.css"></head>');fs.writeFileSync(file,s);
}
let v=fs.readFileSync('public/portafolio-video.html','utf8');
v=v.replace('Espacios para mostrar reels, videos de producto, testimonios y piezas audiovisuales de tus proyectos.','Edición, ritmo y contenido para marcas y creadores.');
v=v.replace(/<div class="portfolio-gallery">[\s\S]*?\n      <\/div>/,`<div class="real-video-grid">
<figure><video controls playsinline preload="metadata" src="/media/marketing.mp4" aria-label="Cuando se quedan con el de marketing"></video><figcaption>Cuando se quedan con el de marketing</figcaption></figure>
<figure><video controls playsinline preload="metadata" src="/media/arizema.mp4" aria-label="Diseño para vender, arquitecta Arizema"></video><figcaption>Diseño para vender · Arquitecta Arizema</figcaption></figure>
</div>`).replace('</head>','<link rel="stylesheet" href="css/portfolio-flow.css"></head>');
fs.writeFileSync('public/portafolio-video.html',v);
