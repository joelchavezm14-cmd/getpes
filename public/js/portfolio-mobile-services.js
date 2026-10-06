(() => {
 const track=document.querySelector('.getpes-cover-grid');if(!track)return;
 const mobile=matchMedia('(max-width:760px)'),reduced=matchMedia('(prefers-reduced-motion:reduce)');
 const originals=[...track.children];
 let active=false,visible=false,span=0,position=0,last=0,frameId=0,touch=null,velocity=0;
 const wrap=()=>{if(!span)return;if(position<span*.5)position+=span;else if(position>=span*1.5)position-=span;};
 const measure=()=>{if(!active)return;span=track.children[originals.length].offsetLeft-originals[0].offsetLeft;position=span;track.scrollLeft=position;};
 const frame=now=>{
  if(!active)return;
  const delta=Math.min(40,now-(last||now));last=now;
  if(visible&&!document.hidden&&!touch&&span){velocity*=Math.exp(-delta/150);position+=delta*(.028+velocity);if(Math.abs(velocity)<.001)velocity=0;wrap();track.scrollLeft=position;}
  frameId=requestAnimationFrame(frame);
 };
 function sync(){
  const enabled=mobile.matches&&!reduced.matches;if(enabled===active)return;
  active=enabled;cancelAnimationFrame(frameId);last=0;touch=null;velocity=0;
  track.querySelectorAll('[data-mobile-service-copy]').forEach(el=>el.remove());
  track.classList.toggle('is-mobile-moving',active);
  if(active){for(let i=0;i<2;i++)originals.forEach(card=>{const clone=card.cloneNode(true);clone.dataset.mobileServiceCopy='';clone.setAttribute('aria-hidden','true');clone.querySelectorAll('img').forEach(img=>{img.alt='';img.loading='eager';img.draggable=false;});track.append(clone);});measure();frameId=requestAnimationFrame(frame);}
  else{span=0;position=0;track.scrollLeft=0;}
 }
 track.addEventListener('touchstart',event=>{if(!active||event.touches.length!==1)return;const p=event.touches[0];velocity=0;position=track.scrollLeft;touch={x:p.clientX,y:p.clientY,lastX:p.clientX,time:performance.now(),axis:null};},{passive:true});
 track.addEventListener('touchmove',event=>{
  if(!active||!touch||event.touches.length!==1)return;
  const p=event.touches[0],now=performance.now(),dx=p.clientX-touch.x,dy=p.clientY-touch.y;
  if(!touch.axis&&Math.max(Math.abs(dx),Math.abs(dy))>6)touch.axis=Math.abs(dx)>Math.abs(dy)?'x':'y';
  if(touch.axis!=='x')return;if(event.cancelable)event.preventDefault();
  const step=touch.lastX-p.clientX;velocity=Math.max(-1.2,Math.min(1.2,step/Math.max(8,now-touch.time)));
  position+=step;wrap();track.scrollLeft=position;touch.lastX=p.clientX;touch.time=now;
 },{passive:false});
 const release=event=>{if(!active)return;if(event.touches.length)return;if(!touch||touch.axis!=='x'||performance.now()-touch.time>100||event.type==='touchcancel')velocity=0;touch=null;};
 track.addEventListener('touchend',release,{passive:true});track.addEventListener('touchcancel',release,{passive:true});
 mobile.addEventListener('change',sync);reduced.addEventListener('change',sync);
 new ResizeObserver(measure).observe(track);
 new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;last=0;}).observe(track);
 document.addEventListener('visibilitychange',()=>{last=0;touch=null;velocity=0;});sync();
})();
