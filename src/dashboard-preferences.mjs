// Called only after the API has checked the session, role and company assignment.
export function preferences(env, db) {
 const remote=env.PREFERENCES_STORE==='supabase';
 async function rest(query,options={}) {
  if(!env.SUPABASE_URL||!env.SUPABASE_SECRET_KEY)throw new Error('Supabase preferences are not configured');
  const base=new URL(env.SUPABASE_URL);if(base.protocol!=='https:')throw new Error('Supabase requires HTTPS');
  const r=await fetch(new URL('/rest/v1/getpes_preferences'+query,base),{...options,signal:AbortSignal.timeout(10000),headers:{apikey:env.SUPABASE_SECRET_KEY,'content-type':'application/json',Prefer:'resolution=merge-duplicates,return=minimal'}});
  if(!r.ok)throw new Error('Preferences storage unavailable');return options.method?null:r.json();
 }
 return {
  async get(companyId){if(remote){const rows=await rest('?company_id=eq.'+encodeURIComponent(companyId)+'&select=settings');if(rows[0])return rows[0].settings;}
   const row=await db.prepare('SELECT settings FROM dashboard_preferences WHERE company_id=?').bind(companyId).first();return row?JSON.parse(row.settings):{};},
  async set(companyId,settings){if(remote)await rest('?on_conflict=company_id',{method:'POST',body:JSON.stringify({company_id:companyId,settings,updated_at:new Date().toISOString()})});
   await db.prepare('INSERT INTO dashboard_preferences(company_id,settings) VALUES(?,?) ON CONFLICT(company_id) DO UPDATE SET settings=excluded.settings').bind(companyId,JSON.stringify(settings)).run();}
 };
}
export const indicatorKeys=['spend','leads','cpl','cpa','roas','revenue','conversion','meetings','sales','clicks','impressions','ctr','cpc'];
export const columnKeys=['platform','name','objective','status','spend','results','cost','roas','dates','audience','days','daily_budget','frequency','impressions','clicks','leads','sales','revenue'];
export function validateCampaignPreferences(value,fail){
 if(!value||!['leads','sales','traffic','awareness'].includes(value.objective))fail(400,'Selecciona un objetivo válido.');
 for(const [key,allowed,max] of [['indicators',indicatorKeys,5],['columns',columnKeys,18]])if(!Array.isArray(value[key])||!value[key].length||value[key].length>max||new Set(value[key]).size!==value[key].length||value[key].some(k=>!allowed.includes(k)))fail(400,key==='indicators'?'Elige entre uno y cinco indicadores.':'Selecciona columnas válidas.');
 if(value.currency!==undefined&&!['PEN','USD'].includes(value.currency))fail(400,'Selecciona soles o dólares.');
 return {...(value.currency?{currency:value.currency}:{}),objective:value.objective,indicators:value.indicators,columns:value.columns};
}
