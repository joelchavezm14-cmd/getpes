(() => {
  const track=document.querySelector('.portfolio-captures-track');
  if(!track)return;
  const group=track.querySelector('.portfolio-captures-group');
  group.querySelectorAll('.portfolio-capture').forEach(frame=>{
    const background=frame.querySelector('img').cloneNode(true);
    background.className='capture-backdrop';
    background.alt='';
    background.setAttribute('aria-hidden','true');
    frame.prepend(background);
  });
  const copy=group.cloneNode(true);
  copy.setAttribute('aria-hidden','true');
  copy.querySelectorAll('img').forEach(image=>{image.alt='';});
  track.append(copy);
  const images=[...track.querySelectorAll('img')];
  images.forEach(image=>{image.loading='eager';});
  Promise.all(images.map(image=>image.decode().catch(()=>{}))).then(()=>track.classList.add('is-ready'));
  let visible=true;
  const sync=()=>track.classList.toggle('is-offscreen',!visible||document.hidden);
  if('IntersectionObserver' in window){new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;sync();},{rootMargin:'100px'}).observe(track.parentElement);}
  document.addEventListener('visibilitychange',sync);
})();
