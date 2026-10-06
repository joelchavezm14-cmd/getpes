function bindMobileClock(el){
 if(!matchMedia('(max-width:760px)').matches)return;
 const text=el.querySelector('[data-clock-text]'),period=el.querySelector('[data-period]'),hidden=el.querySelector('input[type=hidden]');
 const box=document.createElement('div');box.className='mobile-clock';
 const choices=[Array.from({length:12},(_,i)=>String(i+1).padStart(2,'0')),['00','15','30','45'],['AM','PM']];
 const labels=['Hora','Minutos','AM/PM'];
 box.innerHTML='<div class="wheel-heading"><output aria-live="polite"></output><button type="button" class="wheel-clear">Sin hora</button></div><div class="time-wheels">'+choices.map((values,i)=>'<div class="wheel-group"><span>'+labels[i]+'</span><div class="time-wheel" role="listbox" tabindex="0" aria-label="'+el.querySelector('label').textContent+' · '+labels[i]+'">'+values.map(v=>'<div role="option" aria-selected="false">'+v+'</div>').join('')+'</div></div>').join('')+'</div>';
 el.append(box);el.classList.add('has-mobile-clock');
 const wheels=[...box.querySelectorAll('.time-wheel')],output=box.querySelector('output');let initializing=true;
 const parts=(hidden.value||'00:00').split(':').map(Number);
 let indexes=[(parts[0]%12||12)-1,Math.min(3,Math.round(parts[1]/15)),parts[0]>=12?1:0];
 const paint=()=>{output.textContent=hidden.value?clockLabel(hidden.value):'Sin hora';wheels.forEach((w,i)=>[...w.children].forEach((o,n)=>o.setAttribute('aria-selected',String(n===indexes[i]))));};
 const commit=()=>{text.value=Number(choices[0][indexes[0]])+':'+choices[1][indexes[1]];period.value=choices[2][indexes[2]];text.dispatchEvent(new Event('input',{bubbles:true}));paint();};
 wheels.forEach((wheel,i)=>{
  wheel.addEventListener('scroll',()=>{if(initializing)return;indexes[i]=Math.max(0,Math.min(choices[i].length-1,Math.round(wheel.scrollTop/44)));commit();},{passive:true});
  wheel.addEventListener('click',e=>{const n=[...wheel.children].indexOf(e.target.closest('[role=option]'));if(n<0)return;indexes[i]=n;wheel.scrollTo({top:n*44,behavior:'smooth'});commit();});
  wheel.addEventListener('keydown',e=>{if(!['ArrowUp','ArrowDown','Home','End'].includes(e.key))return;e.preventDefault();indexes[i]=e.key==='Home'?0:e.key==='End'?choices[i].length-1:Math.max(0,Math.min(choices[i].length-1,indexes[i]+(e.key==='ArrowDown'?1:-1)));wheel.scrollTop=indexes[i]*44;commit();});
 });
 box.querySelector('.wheel-clear').onclick=()=>{initializing=true;wheels.forEach(w=>w.scrollTo({top:w.scrollTop,behavior:'instant'}));requestAnimationFrame(()=>initializing=false);text.value='';text.dispatchEvent(new Event('input',{bubbles:true}));paint();};
 // Keep existing non-quarter-hour values intact until the user changes a wheel.
 paint();const position=()=>{if(!box.getBoundingClientRect().width)return;initializing=true;wheels.forEach((w,i)=>w.scrollTop=indexes[i]*44);requestAnimationFrame(()=>initializing=false);};requestAnimationFrame(position);const observer=new ResizeObserver(()=>{if(!box.isConnected){observer.disconnect();return;}position();});observer.observe(box);el.closest('dialog')?.addEventListener('close',()=>observer.disconnect(),{once:true});
}
