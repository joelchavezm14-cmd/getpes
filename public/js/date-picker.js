const GetpesDates=(()=>{
 let active=null;
 const format=value=>value?value.split('-').reverse().join('/'):'dd/mm/aaaa';
 const iso=date=>`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
 function close(focus=false){if(!active)return;const {popup,button}=active;active=null;popup.remove();button.setAttribute('aria-expanded','false');if(focus&&button.isConnected)button.focus();}
 function open(input,button){
  if(active?.input===input){close();return;}close();
  const chosen=input.value||getpesToday(),month=new Date(chosen+'T12:00:00');month.setDate(1);
  const popup=document.createElement('div');popup.className='gp-date-popup';popup.setAttribute('popover','manual');popup.setAttribute('role','dialog');popup.setAttribute('aria-label','Elegir fecha');
  (input.closest('dialog')||document.body).append(popup);active={input,button,popup,month};if(typeof popup.showPopover==='function')popup.showPopover();button.setAttribute('aria-expanded','true');
  if(innerHeight-button.getBoundingClientRect().bottom<300)button.scrollIntoView({block:'center',behavior:'instant'});
  const select=value=>{input.value=value;input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));button.querySelector('span').textContent=format(input.value);close(true);};
  function position(){
   const rect=button.getBoundingClientRect(),width=Math.min(312,innerWidth-24),top=rect.bottom+8;
   popup.style.width=width+'px';popup.style.maxHeight=Math.max(80,innerHeight-top-12)+'px';
   let left=Math.max(12,Math.min(rect.left,innerWidth-width-12)),y=top;
   // Top-layer popovers use viewport coordinates even inside the Neon Glass dialog.
   if(typeof popup.showPopover!=='function'){const host=input.closest('dialog');if(host){const box=host.getBoundingClientRect();popup.style.position='absolute';left-=box.left+host.clientLeft;y=top-box.top-host.clientTop+host.scrollTop;}}
   popup.style.left=left+'px';popup.style.top=y+'px';
  }
  active.position=position;
  function draw(){
   const title=month.toLocaleDateString('es-PE',{month:'long',year:'numeric'}),first=(month.getDay()+6)%7,days=new Date(month.getFullYear(),month.getMonth()+1,0).getDate();
   popup.innerHTML=`<div class="gp-date-header"><button type="button" data-prev aria-label="Mes anterior">‹</button><strong>${title}</strong><button type="button" data-next aria-label="Mes siguiente">›</button></div><div class="gp-date-week">${['L','M','M','J','V','S','D'].map(x=>`<span>${x}</span>`).join('')}</div><div class="gp-date-days">${Array.from({length:Math.ceil((first+days)/7)*7},(_,i)=>{const date=new Date(month.getFullYear(),month.getMonth(),i-first+1,12),value=iso(date),off=date.getMonth()!==month.getMonth(),disabled=(input.min&&value<input.min)||(input.max&&value>input.max);return `<button type="button" data-date="${value}" ${disabled?'disabled':''} class="${off?'outside ':''}${value===input.value?'selected ':''}${value===getpesToday()?'today':''}" aria-label="${date.toLocaleDateString('es-PE',{day:'numeric',month:'long',year:'numeric'})}" ${value===input.value?'aria-pressed="true"':''}>${date.getDate()}</button>`;}).join('')}</div><div class="gp-date-footer"><button type="button" data-clear ${input.required?'disabled':''}>Borrar</button><button type="button" data-today>Hoy</button><button type="button" data-close>Cerrar</button></div>`;
   popup.querySelector('[data-prev]').onclick=()=>{month.setMonth(month.getMonth()-1);draw();popup.querySelector('[data-prev]').focus();};
   popup.querySelector('[data-next]').onclick=()=>{month.setMonth(month.getMonth()+1);draw();popup.querySelector('[data-next]').focus();};
   popup.querySelectorAll('[data-date]').forEach(b=>b.onclick=()=>select(b.dataset.date));
   popup.querySelector('[data-clear]').onclick=()=>select('');popup.querySelector('[data-close]').onclick=()=>close(true);
   const today=getpesToday(),todayButton=popup.querySelector('[data-today]');todayButton.disabled=!!((input.min&&today<input.min)||(input.max&&today>input.max));todayButton.onclick=()=>select(today);
   position();
  }
  draw();(popup.querySelector('.selected:not(:disabled)')||popup.querySelector('[data-date]:not(:disabled)')).focus({preventScroll:true});
  popup.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();close(true);}if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)&&e.target.dataset.date){e.preventDefault();const buttons=[...popup.querySelectorAll('[data-date]')],i=buttons.indexOf(e.target),next=buttons[i+({ArrowLeft:-1,ArrowRight:1,ArrowUp:-7,ArrowDown:7}[e.key])];if(next&&!next.disabled)next.focus();}});
 }
 function prepare(root){root.querySelectorAll('input[type=date]:not([data-gp-date])').forEach(input=>{
  input.dataset.gpDate='true';input.classList.add('gp-date-source');input.tabIndex=-1;
  const button=document.createElement('button');button.type='button';button.className='gp-date-trigger';button.disabled=input.disabled||input.readOnly;button.id=input.id+'-picker';button.setAttribute('aria-haspopup','dialog');button.setAttribute('aria-expanded','false');
  const label=root.querySelector(`label[for="${input.id}"]`);if(label){button.setAttribute('aria-label',label.textContent);label.htmlFor=button.id;}
  button.innerHTML='<span>'+format(input.value)+'</span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M7 3v4m10-4v4M3 11h18"/></svg>';
  input.after(button);input.addEventListener('change',()=>button.querySelector('span').textContent=format(input.value));input.addEventListener('invalid',()=>button.focus());button.onclick=()=>open(input,button);
 });}
 document.addEventListener('pointerdown',e=>{if(active&&!active.popup.contains(e.target)&&!active.button.contains(e.target))close();});
 document.addEventListener('close',()=>close(),true);window.addEventListener('resize',()=>close());document.addEventListener('scroll',e=>{if(active&&!active.popup.contains(e.target))active.position();},true);
 return {prepare};
})();
