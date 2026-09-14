import fs from 'node:fs';
const edit=(p,f)=>fs.writeFileSync(p,f(fs.readFileSync(p,'utf8')));
edit('db/schema.ts',s=>s.replace("sqliteTable('companies',{","sqliteTable('companies',{theme:text('theme').notNull().default('getpes'),").replace("sqliteTable('users',{","sqliteTable('users',{theme:text('theme'),"));
edit('src/api.mjs',s=>s.replace('u.id,u.username,u.role,u.company_id,u.must_change','u.id,u.username,u.role,u.company_id,u.must_change,u.theme').replace("  if(path==='/api/company-settings'",`  if(path==='/api/appearance'&&write){
    if(req.method!=='POST')fail(405,'Método no permitido.');
    const themes=['getpes','blue','red','orange','violet','black','green'];
    if(body.scope==='company'){admin();const cid=await company(body.company_id);await run('UPDATE companies SET theme=? WHERE id=?',choice(body.theme,themes),cid);}
    else if(body.scope==='personal'){const theme=body.theme===null?null:choice(body.theme,themes);await run('UPDATE users SET theme=? WHERE id=?',theme,user.id);}
    else fail(400,'Configuración no válida.');return json({ok:true});
  }
  if(path==='/api/company-settings'`).replace('SELECT show_meetings FROM companies','SELECT show_meetings,theme FROM companies'));
edit('public/js/portal.js',s=>s.replace('function login(){','function login(){\n document.documentElement.removeAttribute(\'data-theme\');').replace('<button id="logout">','<button id="appearance">Colores del panel</button><button id="logout">').replace(" $('#logout').onclick=", " $('#appearance').onclick=appearanceForm;\n $('#logout').onclick=").replace('state.data=data;if(state.view', 'state.data=data;applyTheme();if(state.view'));
for(const p of ['public/admin.html','public/dashboard.html'])edit(p,s=>s.replace('</head>','<link rel="stylesheet" href="/css/themes.css"></head>').replace('<script src="/js/portal.js"','<script src="/js/themes.js" defer></script><script src="/js/portal.js"'));
