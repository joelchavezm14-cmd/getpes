(() => {
  const motion=matchMedia('(prefers-reduced-motion: reduce)');
  const thumbs=[...document.querySelectorAll('.portfolio-thumb:has([data-project-photo])')];
  thumbs.forEach(thumb=>{
    let photos=[...thumb.querySelectorAll('[data-project-photo]')];
    let current=0,timer=0,visible=false,ready=false;
    const stop=()=>{clearInterval(timer);timer=0;};
    const sync=()=>{
      stop();
      if(!ready||!visible||document.hidden||motion.matches||photos.length<2)return;
      timer=setInterval(()=>{
        current=(current+1)%photos.length;
        photos.forEach((photo,index)=>photo.classList.toggle('is-active',index===current));
      },1000);
    };
    // Begin only when every frame is decoded, so no blank frames are displayed.
    Promise.all(photos.map(async photo=>{
      try{await photo.decode();return photo;}catch{return null;}
    })).then(loaded=>{
      photos=loaded.filter(Boolean);ready=true;current=0;
      photos.forEach((photo,index)=>photo.classList.toggle('is-active',index===0));
      sync();
    });
    if('IntersectionObserver' in window){
      new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;sync();},{threshold:.1}).observe(thumb);
    }else{visible=true;}
    document.addEventListener('visibilitychange',sync);
    motion.addEventListener('change',sync);
  });
})();
