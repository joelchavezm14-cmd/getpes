function getpesToday(){const parts=new Intl.DateTimeFormat('en-US',{timeZone:'America/Lima',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());const part=k=>parts.find(p=>p.type===k).value;return `${part('year')}-${part('month')}-${part('day')}`;}
// Delegation also covers fields created later inside any dashboard dialog.
document.addEventListener('click',event=>{const input=event.target.closest('input[type="month"]');if(!input||input.disabled||input.readOnly)return;try{input.showPicker?.();}catch{/* Keep the browser's native picker and keyboard editing available. */}});
// Shared presentation primitives. Existing field names, validation attributes,
// form serialization and save callbacks remain owned by their current modules.
const GetpesForms={
 block(title,icon,content,kind=""){return `<fieldset class="gp-block ${kind}"><legend>${navIcon(icon)}<span>${esc(title)}</span></legend><div class="gp-block-fields">${content}</div></fieldset>`;},
 field(name,label,value='',type='text',attrs=''){return `<div class="gp-field"><label for="f-${name}">${label}</label><input class="gp-input" id="f-${name}" name="${name}" type="${type}" value="${esc(value)}" ${attrs}></div>`;},
 select(name,label,values,current){return `<div class="gp-field"><label for="f-${name}">${label}</label><select class="gp-select" id="f-${name}" name="${name}">${values.map(v=>`<option ${v===current?'selected':''}>${esc(v)}</option>`).join('')}</select></div>`;},
 textarea(name,label,value=''){return `<div class="gp-field full"><label for="f-${name}">${label}</label><textarea class="gp-textarea" id="f-${name}" name="${name}">${esc(value)}</textarea></div>`;},
 date(name,label,value='',attrs=''){return this.field(name,label,value,'date',attrs);},
 time(name,label,value='',attrs=''){return this.field(name,label,value,'time',attrs);},
 status(name,label,values,current){return this.select(name,label,values,current);},
 user(name,label,values,current){return this.select(name,label,values,current);},
 fileLink(name,label,value='',attrs=''){return this.field(name,label,value,'url',attrs);},
 toggle(name,label,checked=false){return `<label class="gp-toggle"><input type="checkbox" name="${name}" ${checked?'checked':''}><span>${label}</span></label>`;},
 header(title,description=''){return `<div class="dialog-head gp-modal-header"><div><h2 id="dialog-title">${title}</h2>${description?`<p class="muted">${description}</p>`:''}</div><button type="button" id="close-dialog" class="gp-close" aria-label="Cerrar">×</button></div>`;},
 footer(remove=false){return `<div class="actions gp-modal-footer">${remove?'<button type="button" class="danger" id="delete-record">Eliminar</button>':''}<button type="button" id="cancel-dialog">Cancelar</button><button type="submit" class="primary">Guardar</button></div>`;},
 prepare(d){
  GetpesDates.prepare(d);
  d.classList.add('gp-modal');
  let header=d.querySelector('.dialog-head');
  if(!header){const title=d.querySelector('#dialog-title');if(title){header=document.createElement('div');header.className='dialog-head';title.before(header);header.append(title);}}
  if(header){header.classList.add('gp-modal-header');let close=header.querySelector('button');if(!close){close=document.createElement('button');close.type='button';close.onclick=()=>d.close();header.append(close);}close.classList.add('gp-close');close.setAttribute('aria-label','Cerrar');if(close.textContent!=='×')close.textContent='×';}
  d.querySelectorAll('input:not([type=checkbox]):not([type=radio]),select,textarea').forEach(el=>{el.classList.add(el.tagName==='SELECT'?'gp-select':el.tagName==='TEXTAREA'?'gp-textarea':'gp-input');});
  d.querySelectorAll('.form-grid').forEach(grid=>{grid.classList.add('gp-form-grid');grid.dataset.density=grid.querySelectorAll('input:not([type=checkbox]),select').length>=10?'dense':'regular';});
  d.querySelectorAll('form').forEach(form=>{
   const submit=form.querySelector('button[type=submit],button.primary:not([type=button])');if(!submit)return;
   let footer=submit.closest('.actions');if(!footer){footer=document.createElement('div');footer.className='actions';submit.before(footer);footer.append(submit);}
   footer.classList.add('gp-modal-footer');
   if(!footer.querySelector('#cancel-dialog,[data-gp-cancel]')){const cancel=document.createElement('button');cancel.type='button';cancel.dataset.gpCancel='';cancel.textContent='Cancelar';cancel.onclick=()=>d.close();footer.append(cancel);}
  });
  d.querySelectorAll(':scope > .confirm-actions').forEach(el=>el.classList.add('gp-modal-footer'));
  d.querySelectorAll('#delete-record,#confirm-activity-delete').forEach(el=>el.classList.add('danger'));
  d.querySelectorAll('[role=tablist]').forEach(el=>el.classList.add('gp-tabs'));
 },
 open(d){this.prepare(d);if(!d.open)d.showModal();}
};
function field(name,label,value='',type='text',attrs=''){return GetpesForms.field(name,label,value,type,attrs);}
function select(name,label,values,current){return GetpesForms.select(name,label,values,current);}
function area(name,label,value=''){return GetpesForms.textarea(name,label,value);}
function dialog(title,fields,save,remove){const d=$('#editor');d.innerHTML=GetpesForms.header(title)+`<form><div class="form-grid">${fields}</div><p class="status" role="alert"></p>${GetpesForms.footer(!!remove)}</form>`;GetpesForms.open(d);$('#close-dialog').onclick=$('#cancel-dialog').onclick=()=>d.close();d.querySelector('form').onsubmit=async e=>{e.preventDefault();const f=e.target,b=f.querySelector('[type=submit]');b.disabled=true;try{await save(Object.fromEntries(new FormData(f)));d.close();await load();toast('Cambios guardados.');}catch(err){f.querySelector('.status').textContent=err.message;}finally{b.disabled=false;}};if(remove)$('#delete-record').onclick=()=>{const b=$('#delete-record');if(b.dataset.confirm!=='yes'){b.dataset.confirm='yes';b.textContent='Confirmar eliminación';return;}remove().then(async()=>{d.close();await load();toast('Registro eliminado.');}).catch(message);};}
// Some existing dialogs replace their body after an asynchronous read (timeline,
// permissions, etc.). Normalize those nodes without replacing attached handlers.
const getpesEditor=document.getElementById('editor');
new MutationObserver(()=>GetpesForms.prepare(getpesEditor)).observe(getpesEditor,{childList:true,subtree:true});

// Sectioned forms keep all controls mounted so switching sections preserves edits.
GetpesForms.sections=sections=>`<div class="full prospect-layout"><nav class="prospect-nav" aria-label="Secciones del formulario">${sections.map(([id,label,icon],i)=>`<button type="button" data-form-section="${id}" aria-controls="section-${id}" aria-current="${i===0?'step':'false'}">${navIcon(icon)}${label}</button>`).join('')}</nav><div class="prospect-panels">${sections.map(([id,label,icon,fields],i)=>`<section id="section-${id}" class="prospect-section" ${i?'hidden':''}><h3>${navIcon(icon)}${label}</h3><div class="form-grid">${fields}</div></section>`).join('')}</div></div>`;
GetpesForms.bindSections=d=>{
 const show=id=>{d.querySelectorAll('.prospect-section').forEach(s=>s.hidden=s.id!=='section-'+id);d.querySelectorAll('[data-form-section]').forEach(b=>b.setAttribute('aria-current',b.dataset.formSection===id?'step':'false'));};
 d.querySelectorAll('[data-form-section]').forEach(b=>b.onclick=()=>show(b.dataset.formSection));
 d.querySelector('form').addEventListener('invalid',e=>{const section=e.target.closest('.prospect-section');if(section)show(section.id.slice(8));},true);
};
const prospectIndustries=['Arquitectura y construcción','Automotriz','Belleza y estética','Comercio y retail','Educación','Gastronomía y restaurantes','Inmobiliaria','Moda y accesorios','Salud y bienestar','Servicios profesionales','Tecnología','Turismo y hotelería','Otros'];
const prospectServices=['Gestión de redes','Edición de video','Campañas digitales','Branding y diseño'];
function industryPicker(value=''){return `<div class="gp-field industry-picker"><label id="industry-label">Rubro</label><input type="hidden" name="industry" id="f-industry" value="${esc(value||'')}"><details id="industry-dropdown"><summary aria-labelledby="industry-label industry-current"><span id="industry-current">${esc(value||'Selecciona un rubro')}</span><span aria-hidden="true">⌄</span></summary><div class="industry-popover"><label for="industry-search">Buscar rubro</label><input id="industry-search" type="search" placeholder="Escribe para buscar…" autocomplete="off"><div id="industry-options" role="group" aria-label="Rubros disponibles"></div></div></details><div id="other-industry" hidden>${field('industry_other','Especifica el rubro',value&&!prospectIndustries.includes(value)?value:'','text','maxlength="150"')}</div></div>`;}
function bindIndustryPicker(initial){const input=$('#f-industry'),search=$('#industry-search'),custom=$('#f-industry_other'),other=$('#other-industry'),options=$('#industry-options');const draw=()=>{const q=search.value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();const values=prospectIndustries.filter(v=>v==='Otros'||v.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().includes(q));options.innerHTML=values.map(v=>`<button type="button" data-industry="${esc(v)}" aria-pressed="${input.value===v}">${esc(v)}</button>`).join('');options.querySelectorAll('button').forEach(b=>b.onclick=()=>{other.hidden=b.dataset.industry!=='Otros';input.value=other.hidden?b.dataset.industry:(custom.value||'Otros');$('#industry-current').textContent=b.dataset.industry;$('#industry-dropdown').open=false;if(!other.hidden)custom.focus();});};search.oninput=draw;custom.oninput=()=>input.value=custom.value.trim()||'Otros';$('#industry-dropdown').ontoggle=()=>{if($('#industry-dropdown').open)search.focus();};if(initial&&!prospectIndustries.includes(initial)){other.hidden=false;$('#industry-current').textContent='Otros';}draw();}
function serviceChips(value=''){const selected=(value||'').split(',').map(v=>v.trim()).filter(Boolean),options=[...new Set([...prospectServices,...selected])];return `<div class="full gp-field"><label id="services-label">Servicios de interés</label><input type="hidden" name="services" id="f-services" value="${esc(value||'')}"><div class="service-chips" role="group" aria-labelledby="services-label">${options.map(v=>`<button type="button" data-service="${esc(v)}" aria-pressed="${selected.includes(v)}"><span aria-hidden="true">${selected.includes(v)?'✓':'+'}</span>${esc(v)}</button>`).join('')}</div><small>Puedes seleccionar varios servicios.</small></div>`;}
function bindServiceChips(){const input=$('#f-services');document.querySelectorAll('[data-service]').forEach(b=>b.onclick=()=>{const selected=b.getAttribute('aria-pressed')!=='true';b.setAttribute('aria-pressed',selected);b.querySelector('span').textContent=selected?'✓':'+';input.value=[...document.querySelectorAll('[data-service][aria-pressed="true"]')].map(x=>x.dataset.service).join(', ');});}

// Escape closes the active editor after inner widgets have handled it.
document.addEventListener('keydown',event=>{
 if(event.key!=='Escape'||event.defaultPrevented||!getpesEditor.open||document.getElementById('getpes-loader')?.open)return;
 const expanded=getpesEditor.querySelector('details[open]');
 event.preventDefault();
 if(expanded){expanded.open=false;expanded.querySelector('summary')?.focus();return;}
 getpesEditor.close();
});
getpesEditor.addEventListener('cancel',event=>{event.preventDefault();getpesEditor.close();});
