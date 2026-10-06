(() => {
 const panel=document.querySelector('#dashboard-teaser .mock-panel');if(!panel)return;
 const numbers=[...panel.querySelectorAll('[data-preview-value]')],bars=[...panel.querySelectorAll('.mock-bars span')];
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const numberFormat=new Intl.NumberFormat('es-PE'),compactFormat=new Intl.NumberFormat('es-PE',{minimumFractionDigits:1,maximumFractionDigits:1});
 let visible=false,hovered=false,frame=0,last=0,elapsed=0,phase=0,speed=0;
 const introDuration=4200;
 const render=()=>{
  const progress=Math.min(1,elapsed/1800),growth=1-Math.pow(1-progress,3),wave=Math.min(1,Math.max(0,(elapsed-1000)/1200));
  numbers.forEach((node,i)=>{
   const value=Number(node.dataset.previewValue)*growth*(1+wave*.035*Math.sin(phase*.55+i*.9));
   node.textContent=node.dataset.previewFormat==='compact'?compactFormat.format(value/1000)+'K':numberFormat.format(Math.round(value));
  });
  bars.forEach((bar,i)=>{bar.style.transform='scaleY('+(growth*(1+wave*.1*(Math.sin(phase*.9+i*.8)-1)))+')';});
 };
 const tick=now=>{
  frame=0;if(!visible||document.hidden||reduced.matches){last=0;return;}
  const delta=last?Math.min(100,now-last):0;last=now;elapsed+=delta;
  const target=hovered||elapsed<introDuration?1:0;
  speed+=(target-speed)*(1-Math.exp(-delta/(target?220:650)));
  phase+=delta*speed/1000;render();
  if(target||speed>.001)frame=requestAnimationFrame(tick);else{speed=0;last=0;}
 };
 const start=()=>{if(!frame&&visible&&!document.hidden&&!reduced.matches){last=0;frame=requestAnimationFrame(tick);}};
 const sync=()=>{if(!visible||document.hidden||reduced.matches){cancelAnimationFrame(frame);frame=0;last=0;}else if(elapsed<introDuration||hovered||speed>.001)start();};
 panel.addEventListener('pointerenter',event=>{if(event.pointerType==='touch')return;hovered=true;start();});
 panel.addEventListener('pointerleave',()=>{hovered=false;start();});
 new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;sync();},{threshold:.15}).observe(panel);
 document.addEventListener('visibilitychange',sync);
 reduced.addEventListener?.('change',()=>{if(reduced.matches){elapsed=Math.max(elapsed,1800);render();}sync();});
 if(reduced.matches){elapsed=1800;render();}
})();
