(() => {
 const section=document.querySelector('.kinetic-process');if(!section)return;
 const shell=section.closest('.process-scroll-shell')||section;
 const pieces=[...section.querySelectorAll('.process-prefix-piece')],stages=[...section.querySelectorAll('[data-process-stage]')],common=section.querySelector('.process-common');
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let current=0,timer,transitioning=false,animations=[];
 const duration=500,hold=2500;
 const clear=()=>{clearTimeout(timer);animations.forEach(a=>a.cancel());animations=[];transitioning=false;pieces.forEach((p,i)=>p.hidden=i!==current);stages.forEach((p,i)=>p.hidden=i!==current);};
 const schedule=()=>{clearTimeout(timer);if(!document.hidden)timer=setTimeout(advance,hold);};
 function advance(){
  if(document.hidden)return;
  const next=(current+1)%pieces.length,out=pieces[current],incoming=pieces[next];
  incoming.hidden=false;stages[current].hidden=true;stages[next].hidden=false;
  if(reduced.matches||!incoming.animate){out.hidden=true;current=next;schedule();return;}
  transitioning=true;
  const options={duration,easing:'cubic-bezier(.22,.8,.25,1)',fill:'both'};
  animations=[out.animate([{transform:'translateY(0) rotateX(0) skewX(0)'},{transform:'translateY(-115%) rotateX(35deg) skewX(-8deg)'}],options),incoming.animate([{transform:'translateY(115%) rotateX(-35deg) skewX(8deg)'},{transform:'translateY(0) rotateX(0) skewX(0)'}],options),common.animate([{transform:'translateX(0) scaleX(1)'},{transform:'translateX(.04em) scaleX(1.025)',offset:.45},{transform:'translateX(0) scaleX(1)'}],options),stages[next].animate([{transform:'translateY(18px)'},{transform:'translateY(0)'}],options)];
  current=next;timer=setTimeout(()=>{clear();schedule();},duration);
 }
 document.addEventListener('visibilitychange',()=>{clear();if(!document.hidden)schedule();});
 let scrollFrame=0;
 const updateScale=()=>{
  scrollFrame=0;
  const height=window.innerHeight||document.documentElement.clientHeight;
  // Measure the stable shell so the scaled panel cannot feed back into progress.
  const progress=Math.max(0,Math.min(1,(height*.95-shell.getBoundingClientRect().top)/(height*.75)));
  section.style.setProperty('--process-scroll-scale',reduced.matches||matchMedia('(max-width:760px)').matches?'1':String(.78+.22*progress));
 };
 const requestScale=()=>{if(!scrollFrame)scrollFrame=requestAnimationFrame(updateScale);};
 window.addEventListener('scroll',requestScale,{passive:true});
 window.addEventListener('resize',requestScale,{passive:true});
 reduced.addEventListener?.('change',()=>{clear();schedule();requestScale();});
 updateScale();schedule();
})();
