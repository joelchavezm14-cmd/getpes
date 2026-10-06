function companyGradient(name){
 const key=String(name||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 if(key.includes('enovus'))return 'linear-gradient(135deg,#cffafe,#7dd3fc,#38bdf8)';
 if(key.includes('exactus'))return 'linear-gradient(135deg,#fecaca,#fca5a5,#f87171)';
 if(key.includes('lucente'))return 'linear-gradient(135deg,#fef08a,#facc15,#eab308)';
 if(key.includes('getpes'))return 'linear-gradient(135deg,#c6ff87,#8bff32,#46b515)';
 if(key.includes('lgna'))return 'linear-gradient(135deg,#bfdbfe,#93c5fd,#60a5fa)';
 if(key.includes('sultan'))return 'linear-gradient(135deg,#fecdd3,#fda4af,#fb7185)';
 return 'linear-gradient(135deg,#cbd5e1,#64748b)';
}
function companyTag(name){return `<span class="company-identity" style="background:${companyGradient(name)}"><span>${esc(name)}</span></span>`;}
function companyOption(c){return `<span class="company-option-content">${c.logo_key?`<img class="company-logo" src="/api/company-logo?company=${encodeURIComponent(c.id)}&v=${encodeURIComponent(c.logo_key)}" alt="">`:`<span class="company-logo company-placeholder" aria-hidden="true">${navIcon('empresas')}</span>`}<span class="company-option-copy"><strong>${esc(c.name)}</strong>${c.industry?`<small>${esc(c.industry)}</small>`:''}</span></span>`;}
function enhanceCompanySelector(){
 const select=document.getElementById('company');if(!select)return;
 const selected=state.companies.find(c=>c.id===state.company),picker=document.createElement('details');picker.className='company-picker company-search-picker';
 picker.innerHTML=`<summary aria-label="Elegir empresa">${selected?companyOption(selected):'Empresa'}<span aria-hidden="true">⌄</span></summary><div class="company-options"><input type="search" class="company-search" placeholder="Buscar empresa…" aria-label="Buscar empresa"><div class="company-option-list">${state.companies.map(c=>`<button type="button" data-company-choice="${esc(c.id)}" aria-pressed="${c.id===state.company}">${companyOption(c)}${c.id===state.company?'<span class="company-check" aria-hidden="true">✓</span>':''}</button>`).join('')}</div><p class="company-no-results" hidden>Sin coincidencias</p></div>`;
 select.hidden=true;select.after(picker);picker.addEventListener('toggle',positionCompanyMenu);
 const normalize=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 picker.querySelector('.company-search').oninput=e=>{let count=0;picker.querySelectorAll('[data-company-choice]').forEach(b=>{b.hidden=!normalize(b.textContent).includes(normalize(e.target.value));if(!b.hidden)count++;});picker.querySelector('.company-no-results').hidden=count>0;};
 picker.querySelectorAll('[data-company-choice]').forEach(b=>b.onclick=()=>{picker.open=false;if(select.value===b.dataset.companyChoice)return;select.value=b.dataset.companyChoice;select.dispatchEvent(new Event('change',{bubbles:true}));});
 picker.addEventListener('keydown',e=>{if(e.key==='Escape'){picker.open=false;picker.querySelector('summary').focus();}});
}
document.addEventListener('pointerdown',e=>document.querySelectorAll('.company-picker[open]').forEach(p=>{if(!p.contains(e.target))p.open=false;}));
function companyForm(c={}){
 let logo='',loading=false,imageError='';
 dialog(c.id?'Editar empresa':'Nueva empresa',field('name','Nombre de empresa',c.name||'','text','required maxlength="120"')+field('industry','Rubro de empresa',c.industry||'','text','required maxlength="150"')+`<div class="full"><label for="company-image">Imagen o logo de empresa</label><input id="company-image" type="file" accept="image/png,image/jpeg,image/webp"><small>PNG, JPG o WebP. Se ajusta completa, sin recortarla.</small><div id="company-image-preview">${c.logo_key?companyOption(c):''}</div></div>`,async d=>{
 if(loading)throw Error('Espera a que termine de preparar la imagen.');if(imageError)throw Error(imageError);
 await request('/api/companies',{...d,id:c.id,...(logo?{logo}:{})},c.id?'PATCH':'POST');state.companies=(await request('/api/companies')).companies;if(!state.company)state.company=state.companies[0]?.id||'';shell();
 });
 $('#company-image').onchange=async e=>{const file=e.target.files[0];logo='';imageError='';if(!file)return;loading=true;const form=e.target.closest('form'),status=form.querySelector('.status');status.textContent='Preparando imagen…';try{
 if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>10*1024*1024)throw Error('Selecciona una imagen PNG, JPG o WebP de hasta 10 MB.');
 const image=await createImageBitmap(file),canvas=document.createElement('canvas');canvas.width=256;canvas.height=256;const ctx=canvas.getContext('2d');ctx.fillStyle='#ffffff';ctx.fillRect(0,0,256,256);const scale=Math.min(256/image.width,256/image.height);ctx.drawImage(image,(256-image.width*scale)/2,(256-image.height*scale)/2,image.width*scale,image.height*scale);image.close();logo=canvas.toDataURL('image/jpeg',.88);$('#company-image-preview').innerHTML=`<img class="company-logo-preview" src="${logo}" alt="Vista previa del logo">`;status.textContent='';
 }catch(err){imageError=err.message;status.textContent=imageError;}finally{loading=false;}};
}

function positionCompanyMenu(){document.querySelectorAll('.company-picker[open]').forEach(p=>{const menu=p.querySelector('.company-options');if(!matchMedia('(max-width:760px)').matches){menu.style.removeProperty('top');menu.style.removeProperty('max-height');return;}const rect=p.querySelector('summary').getBoundingClientRect(),top=Math.min(Math.max(12,rect.bottom+6),innerHeight-140);menu.style.top=top+'px';menu.style.maxHeight=Math.max(120,innerHeight-top-12)+'px';});}
window.addEventListener('resize',positionCompanyMenu);document.addEventListener('scroll',e=>{if(!e.target.closest?.('.company-options'))positionCompanyMenu();},true);
