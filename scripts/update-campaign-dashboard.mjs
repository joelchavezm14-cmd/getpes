import fs from 'node:fs';
let schema=fs.readFileSync('db/schema.ts','utf8');
schema=schema.replace("objective:text('objective').notNull(),spend:","objective:text('objective').notNull(),audience:text('audience').notNull().default(''),days:integer('days').notNull().default(0),dailyBudget:real('daily_budget').notNull().default(0),frequency:real('frequency').notNull().default(0),spend:");
schema+=`\nexport const campaignMetrics = sqliteTable('campaign_metrics',{id:text('id').primaryKey(),companyId:text('company_id').notNull().references(()=>companies.id),month:text('month').notNull(),leads:integer('leads'),revenue:real('revenue'),meetings:integer('meetings'),sales:integer('sales')},t=>[uniqueIndex('campaign_metrics_company_month').on(t.companyId,t.month)]);\n`;
fs.writeFileSync('db/schema.ts',schema);
let api=fs.readFileSync('src/api.mjs','utf8');
api=api.replace('return json({pipelineCampaigns:',"return json({campaignMetrics:await one('SELECT * FROM campaign_metrics WHERE company_id=? AND month=?',id,m),pipelineCampaigns:");
api=api.replace("  if(path==='/api/lead-events'){",`  if(path==='/api/campaign-metrics'&&write){
    admin();if(req.method!=='POST')fail(405,'Método no permitido.');const cid=await company(body.company_id),m=month(body.month),key=choice(body.key,['leads','revenue','meetings','sales']);
    const value=body.value===null?null:number(body.value,key!=='revenue');
    await run(\`INSERT INTO campaign_metrics(id,company_id,month,\${key}) VALUES(?,?,?,?) ON CONFLICT(company_id,month) DO UPDATE SET \${key}=excluded.\${key}\`,crypto.randomUUID(),cid,m,value);return json({ok:true});
  }
  if(path==='/api/lead-events'){
`);
api=api.replace("'revenue','notes'];","'revenue','notes','audience','days','daily_budget','frequency'];");
api=api.replace("number(body.revenue),text(body.notes||'',3000,false)];","number(body.revenue),text(body.notes||'',3000,false),text(body.audience||'',300,false),number(body.days||0,true),number(body.daily_budget||0),number(body.frequency||0)];");
api=api.replace("Array(13).fill('?')","Array(fields.length+2).fill('?')");
fs.writeFileSync('src/api.mjs',api);
let js=fs.readFileSync('public/js/portal.js','utf8');
js=js.replace(/ if\(state.view==='campanas'\)html=.*?;\r?\n/," if(state.view==='campanas')html=campaignDashboard();\n");
js=js.replace(" $('#add-campaign')", " document.querySelectorAll('[data-metric]').forEach(b=>b.onclick=()=>metricForm(b.dataset.metric));\n $('#add-campaign')");
js=js.replace("+field('objective','Objetivo',c.objective||'Clientes potenciales','text','required')", "+select('objective','Objetivo',campaignObjectives(c.platform||'Meta Ads',c.objective),c.objective)");
js=js.replace("+[['spend','Inversión (S/)']", "+field('audience','Público',c.audience||'','text','maxlength=\"300\"')+field('days','Días',c.days||0,'number','min=\"0\" step=\"1\" required')+field('daily_budget','Presupuesto diario (S/)',c.daily_budget||0,'number','min=\"0\" step=\"0.01\" required')+field('frequency','Frecuencia',c.frequency||0,'number','min=\"0\" step=\"0.01\" required')+[['spend','Presupuesto total / inversión real (S/)']");
js=js.replace("},'DELETE'):null);}\nfunction taskForm", "},'DELETE'):null);$('#f-platform').onchange=()=>{$('#f-objective').innerHTML=campaignObjectives($('#f-platform').value).map(o=>`<option>${esc(o)}</option>`).join('');};}\nfunction taskForm");
fs.writeFileSync('public/js/portal.js',js);
