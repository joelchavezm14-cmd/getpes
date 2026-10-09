(() => {
 const section=document.querySelector('.kinetic-process');if(!section)return;
 const shell=section.closest('.process-scroll-shell')||section;
 const pieces=[...section.querySelectorAll('.process-prefix-piece')],stages=[...section.querySelectorAll('[data-process-stage]')],common=section.querySelector('.process-common');
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const desktop=matchMedia('(min-width:1024px)');
 let runnerLane=null,runner=null,actor=null,lastRunnerProgress=0,blurTimer,restTimer,fatigueTimer,turnTimer,scrolling=false;
 let direction=1,pendingDirection=1,lastScrollY=window.scrollY||0;
 const face=next=>{
  direction=pendingDirection=next;if(!actor)return;
  actor.classList.toggle('is-left',next<0);
  actor.style.setProperty('--pose-facing',next<0?'-1':'1');
  actor.style.setProperty('--run-sheet',`url('/assets/inicio/${next<0?'g-return-cycle':'g-run-cycle-clean'}.webp')`);
  actor.style.setProperty('--run-sheet-size',next<0?'400% 300%':'400% 200%');
  actor.style.setProperty('--run-cycle',next<0?'process-return-cycle':'process-run-cycle');
 };
 const brake=()=>{
  const target=actor;if(!target)return;
  target.classList.add('is-braking');
  fatigueTimer=setTimeout(()=>{
   if(actor!==target||scrolling)return;
   target.classList.remove('is-braking');target.classList.add('is-settling');
   fatigueTimer=setTimeout(()=>{
    if(actor!==target||scrolling)return;
    target.classList.remove('is-settling');target.classList.add('is-resting');
   },480);
  },920);
 };
 const rest=()=>{
  scrolling=false;if(!actor||actor.classList.contains('is-turning'))return;
  brake();
 };
 const turn=next=>{
  if(next===pendingDirection)return;
  pendingDirection=next;if(!actor){face(next);return;}
  clearTimeout(turnTimer);clearTimeout(fatigueTimer);
  const target=actor;
  target.classList.remove('is-resting','is-braking','is-settling');
  target.classList.toggle('is-turning-right',next>0);target.classList.add('is-turning');
  turnTimer=setTimeout(()=>{
   if(actor!==target)return;
   face(next);target.classList.remove('is-turning','is-turning-right');
   if(!scrolling)brake();
  },320);
 };
 const updateRunner=()=>{
  if(!desktop.matches||reduced.matches){clearTimeout(blurTimer);clearTimeout(restTimer);clearTimeout(fatigueTimer);clearTimeout(turnTimer);scrolling=false;pendingDirection=direction;lastScrollY=window.scrollY||0;runnerLane?.remove();runnerLane=null;runner=null;actor=null;return;}
  const bounds=shell.getBoundingClientRect(),height=window.innerHeight;
  if(!runnerLane){
   // No image element or download on mobile; create only near the desktop section.
   if(bounds.top>height*1.5||bounds.bottom<0)return;
   runnerLane=document.createElement('div');runnerLane.className='process-runner-lane';runnerLane.setAttribute('aria-hidden','true');
   actor=document.createElement('div');actor.className='process-motion-actor'+(scrolling?'':' is-resting');
   actor.innerHTML='<span class="process-comic-dots"></span><span class="process-speed-lines"></span><span class="process-comic-echo process-comic-echo-pink"></span><span class="process-comic-echo process-comic-echo-green"></span><div class="process-runner"></div><svg class="process-comic-scribbles" viewBox="0 0 280 240" fill="none"><path class="comic-ink" d="M62 39Q86 12 116 25M68 45Q89 20 118 32M219 87l15-21-1 26 18-14M232 141l15 3-13 9 18 5M39 167l-12-6 8-9-18-1M83 207q35 16 67 4"/><path class="comic-accent" d="m189 28 10-14-1 20 13-6M50 92l-15-8 5 15-17-7M228 196l18-7-8 17"/></svg>';
   runner=actor.querySelector('.process-runner');
   face(direction);
   const resting=document.createElement('div');resting.className='process-resting-mascot';resting.style.backgroundImage="url('assets/inicio/g-resting.webp')";actor.appendChild(resting);
   const fatigue=document.createElement('div');fatigue.className='process-fatigue-mascot';fatigue.style.backgroundImage="url('assets/inicio/g-fatigue-sequence.webp')";actor.appendChild(fatigue);
   const turning=document.createElement('div');turning.className='process-turning-mascot';turning.style.backgroundImage="url('assets/inicio/g-turn-sequence.webp')";actor.appendChild(turning);
   const braking=document.createElement('div');braking.className='process-braking-mascot';braking.style.backgroundImage="url('assets/inicio/g-brake-sequence.webp')";actor.appendChild(braking);
   const sweat=document.createElement('div');sweat.className='process-sweat';sweat.innerHTML='<span class="process-sweat-drop"></span><span class="process-sweat-drop"></span><span class="process-sweat-drop"></span>';actor.appendChild(sweat);
   runnerLane.appendChild(actor);section.querySelector('.process-word').after(runnerLane);
  }
  const visible=bounds.top<height&&bounds.bottom>0&&!document.hidden;
  actor.classList.toggle('is-paused',!visible);
  if(!visible)return;
  const progress=Math.max(0,Math.min(1,1.2*(height*.45-bounds.top)/(bounds.height*.9+height*.25)));
  const width=runnerLane.clientWidth,size=actor.clientWidth;
  const exit=Math.max(0,Math.min(1,(progress-.72)/.22));
  const fade=1-exit*exit*(3-2*exit);
  const speed=Math.min(1,Math.abs(progress-lastRunnerProgress)*28);lastRunnerProgress=progress;
  // Keep the entire actor inside the panel, fading before any edge can clip it.
  actor.style.transform=`translate3d(${32+Math.max(0,width-size-64)*progress}px,0,0) scale(${1-.08*exit})`;
  actor.style.opacity=String(fade);
  actor.style.setProperty('--comic-blur',`${.35+speed*1.5+exit*2}px`);
  actor.style.setProperty('--comic-stretch',String(1+speed*.07));
  clearTimeout(blurTimer);
  blurTimer=setTimeout(()=>{
   actor?.style.setProperty('--comic-blur',`${.35+exit*2}px`);
   actor?.style.setProperty('--comic-stretch','1');
  },160);
 };
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
  // Let the full glyph and its blur travel outside the prefix box; fade before hiding it.
  animations=[out.animate([{transform:'translateY(0) rotateX(0) skewX(0)',filter:'blur(0px)',opacity:1},{transform:'translateY(-.36em) rotateX(12deg) skewX(-3deg)',filter:'blur(5px)',opacity:0,offset:.72},{transform:'translateY(-.5em) rotateX(15deg) skewX(-3deg)',filter:'blur(6px)',opacity:0}],options),incoming.animate([{transform:'translateY(.5em) rotateX(-15deg) skewX(3deg)',filter:'blur(7px)',opacity:0},{transform:'translateY(0) rotateX(0) skewX(0)',filter:'blur(0px)',opacity:1}],options),common.animate([{transform:'translateX(0) scaleX(1)',filter:'blur(0px)'},{transform:'translateX(.04em) scaleX(1.025)',filter:'blur(1.5px)',offset:.45},{transform:'translateX(0) scaleX(1)',filter:'blur(0px)'}],options),stages[next].animate([{transform:'translateY(18px)'},{transform:'translateY(0)'}],options)];
  current=next;timer=setTimeout(()=>{clear();schedule();},duration);
 }
 document.addEventListener('visibilitychange',()=>{clear();if(!document.hidden)schedule();requestScale();});
 let scrollFrame=0;
 const updateScale=()=>{
  scrollFrame=0;
  const height=window.innerHeight||document.documentElement.clientHeight;
  // Measure the stable shell so the scaled panel cannot feed back into progress.
  const progress=Math.max(0,Math.min(1,(height*.95-shell.getBoundingClientRect().top)/(height*.75)));
  section.style.setProperty('--process-scroll-scale',reduced.matches||matchMedia('(max-width:760px)').matches?'1':String(.78+.22*progress));
  updateRunner();
 };
 const requestScale=()=>{if(!scrollFrame)scrollFrame=requestAnimationFrame(updateScale);};
 window.addEventListener('scroll',()=>{
  if(desktop.matches&&!reduced.matches){
   scrolling=true;clearTimeout(fatigueTimer);actor?.classList.remove('is-resting','is-settling','is-braking');
   const y=window.scrollY||0,delta=y-lastScrollY;
   if(Math.abs(delta)>=2){turn(delta<0?-1:1);lastScrollY=y;}
   actor?.style.setProperty('--gait-duration','.48s');clearTimeout(restTimer);restTimer=setTimeout(rest,100);
  }
  requestScale();
 },{passive:true});
 window.addEventListener('resize',requestScale,{passive:true});
 desktop.addEventListener?.('change',requestScale);
 reduced.addEventListener?.('change',()=>{clear();schedule();requestScale();});
 updateScale();schedule();
})();
