// ============================================
// GETPES — main.js
// Header/footer compartidos + interacciones base
// ============================================

const NAV_ITEMS = [
  { href: 'index.html', label: 'Inicio' },
  { href: 'nosotros.html', label: 'Nosotros' },
  { href: 'portafolio.html', label: 'Portafolio' },
  { href: 'blog.html', label: 'Blog' },
  { href: 'contacto.html', label: 'Contacto' },
];

function currentPage() {
  const path = window.location.pathname.split('/').pop() || 'index.html';
  return path;
}

function renderHeader() {
  const mount = document.getElementById('site-header');
  if (!mount) return;
  const page = currentPage();

  const links = NAV_ITEMS.map(item => {
    const active = (item.href === page || (item.href === 'portafolio.html' && page.startsWith('portafolio-')) || (item.href === 'blog.html' && page.startsWith('blog-'))) ? ' active' : '';
    return `<a href="${item.href}" class="${active.trim()}" ${active ? 'aria-current="page"' : ''}>${item.label}</a>`;
  }).join('');

  mount.innerHTML = `
    <div class="wrap">
      <a href="index.html" class="brand">
        <img src="assets/getpes-logo.svg" alt="Getpes — agencia digital">
      </a>
      <nav class="nav-links" id="nav-links" aria-label="Navegación principal">
        ${links}
        <a href="dashboard.html" class="nav-cta">Dashboard</a>
      </nav>
      <button class="nav-toggle" id="nav-toggle" aria-controls="nav-links" aria-label="Abrir menú" aria-expanded="false">
      
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
      </button>
    </div>
  `;

  const main = document.querySelector('main');
  if (main) { main.id = 'contenido'; mount.insertAdjacentHTML('beforebegin', '<a class="skip-link" href="#contenido">Saltar al contenido</a>'); }
  const toggle = document.getElementById('nav-toggle');
  const nav = document.getElementById('nav-links');
  // Place the diagonal before the desktop links or the mobile menu button.
  const positionTopbarCut = () => {
    if (matchMedia('(max-width:860px)').matches) {
      mount.style.setProperty('--topbar-cut', `${toggle.getBoundingClientRect().left - mount.getBoundingClientRect().left - 16}px`);
      return;
    }
    const firstLink = nav.querySelector('a');
    if (firstLink) mount.style.setProperty('--topbar-cut', `${firstLink.getBoundingClientRect().left - mount.getBoundingClientRect().left - 28}px`);
  };
  positionTopbarCut();
  const topbarObserver = new ResizeObserver(positionTopbarCut);
  topbarObserver.observe(mount.querySelector('.wrap'));
  topbarObserver.observe(nav.querySelector('a'));
  document.fonts.ready.then(positionTopbarCut);
  toggle.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(isOpen));
    toggle.setAttribute('aria-label', isOpen ? 'Cerrar menú' : 'Abrir menú');
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && nav.classList.contains('open')) {
      nav.classList.remove('open'); toggle.setAttribute('aria-expanded','false'); toggle.setAttribute('aria-label','Abrir menú'); toggle.focus();
    }
  });
  nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    nav.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Abrir menú');
  }));
}

function renderFooter() {
  const mount = document.getElementById('site-footer');
  if (!mount) return;
  const year = new Date().getFullYear();

  mount.innerHTML = `
    <div class="wrap">
      <div class="footer-top">
        <div>
          <a href="index.html" class="brand"><img src="assets/getpes-logo.svg" alt="Getpes"></a>
          <nav class="footer-social" aria-label="Redes sociales de Getpes">
            <a href="https://www.instagram.com/getpes/" target="_blank" rel="noopener noreferrer" aria-label="Getpes en Instagram (abre una nueva pestaña)">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"></rect><circle cx="12" cy="12" r="4"></circle><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"></circle></svg>
              Instagram
            </a>
            <a href="https://www.tiktok.com/@agencia.getpes?lang=es" target="_blank" rel="noopener noreferrer" aria-label="Getpes en TikTok (abre una nueva pestaña)">
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M16.7 2h-3.2v13.2a3 3 0 1 1-2.6-3V9a6.2 6.2 0 1 0 5.8 6.2V8.5a8.3 8.3 0 0 0 4.3 1.2V6.5A5.2 5.2 0 0 1 16.7 2Z"></path></svg>
              TikTok
            </a>
            <a href="https://www.youtube.com/@agenciagetpes" target="_blank" rel="noopener noreferrer" aria-label="Getpes en YouTube (abre una nueva pestaña)">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><rect x="2" y="5" width="20" height="14" rx="4"></rect><path d="m10 9 5 3-5 3Z" fill="currentColor" stroke="none"></path></svg>
              YouTube
            </a>
          </nav>
        </div>
        <div class="footer-cols">
          <div class="footer-col">
            <h5>Navegación</h5>
            <a href="index.html">Inicio</a>
            <a href="nosotros.html">Nosotros</a>
            <a href="portafolio.html">Portafolio</a>
            <a href="blog.html">Blog</a>
            <a href="contacto.html">Contacto</a>
          </div>
          <div class="footer-col">
            <h5>Clientes</h5>
            <a href="dashboard.html">Dashboard</a>
          </div>
        </div>
      </div>
      <div class="footer-bottom">
        <span>© ${year} Getpes agencia digital. Todos los derechos reservados.</span>
        <span>Lima, Perú</span>
      </div>
    </div>
  `;
}

function renderFloatingWhatsApp() {
  if (document.querySelector('.whatsapp-float')) return;

  const link = document.createElement('a');
  link.className = 'whatsapp-float';
  link.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Hola Getpes, quisiera conversar sobre mi marca.')}`;
  link.target = '_blank';
  link.rel = 'noopener';
  link.setAttribute('aria-label', 'Escribir por WhatsApp');
  link.title = 'Escribir por WhatsApp';
  link.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.5 3.5A11.8 11.8 0 0 0 12.1 0C5.6 0 .3 5.3.3 11.8c0 2.1.6 4.1 1.6 5.9L.2 24l6.5-1.7a11.8 11.8 0 0 0 5.4 1.3h.1c6.5 0 11.8-5.3 11.8-11.8 0-3.2-1.3-6.1-3.5-8.3ZM12.2 21.6h-.1c-1.7 0-3.4-.5-4.8-1.3l-.3-.2-3.9 1 1-3.8-.2-.3a9.8 9.8 0 0 1-1.5-5.2C2.4 6.4 6.8 2 12.2 2c2.6 0 5.1 1 6.9 2.9a9.7 9.7 0 0 1 2.9 6.9c0 5.4-4.4 9.8-9.8 9.8Zm5.4-7.3c-.3-.2-1.8-.9-2.1-1-.3-.1-.5-.2-.7.2-.2.3-.8 1-.9 1.2-.2.2-.3.2-.6.1-1.5-.7-2.5-1.3-3.5-3-.3-.5.3-.5.9-1.7.1-.2.1-.4 0-.6-.1-.2-.7-1.7-1-2.3-.3-.6-.5-.5-.7-.5h-.6c-.2 0-.6.1-.9.4-.3.3-1.1 1.1-1.1 2.6s1.1 3 1.2 3.2c.2.2 2.2 3.4 5.4 4.7 2 .8 2.8.9 3.8.8.6-.1 1.8-.7 2-1.4.3-.7.3-1.3.2-1.4-.1-.2-.3-.3-.6-.4Z"/></svg>';
  document.body.appendChild(link);
}

// Número de WhatsApp de Getpes en formato internacional sin signos (ej. 51987654321).
// TODO: reemplazar por el número real antes de publicar.
const WHATSAPP_NUMBER = '51937207043';

const SERVICE_LABELS = {
  redes: 'Gestión de redes',
  video: 'Edición de video',
  campanas: 'Campañas digitales',
  branding: 'Branding y diseño',
  otro: 'Otro',
};

function initContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;
  const selectedService = new URLSearchParams(location.search).get('servicio');
  if (Object.hasOwn(SERVICE_LABELS, selectedService)) form.querySelector('#service').value = selectedService;
  const status = document.getElementById('form-status');

  let requestId = crypto.randomUUID();
  const submit = form.querySelector('[type="submit"]');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (submit.disabled) return;

    const name = form.querySelector('#name').value.trim();
    const email = form.querySelector('#email').value.trim();
    const service = form.querySelector('#service').value;
    const message = form.querySelector('#message').value.trim();
    const contact = form.querySelector('#contact').value.trim();
    const industry = form.querySelector('#industry').value.trim();

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const lines = [
      `Hola, soy ${name}.`,
      `Correo: ${email}`,
      `Me interesa: ${SERVICE_LABELS[service] || service}`,
    ];
    if (message) lines.push(`Mensaje: ${message}`);
    if (contact) lines.push(`Teléfono: ${contact}`);
    if (industry) lines.push(`Rubro: ${industry}`);

    const text = encodeURIComponent(lines.join('\n'));
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${text}`;

    status.textContent = 'Guardando tu consulta…';
    status.classList.add('show');
    submit.disabled = true;
    try {
      const response = await fetch('/api/contact', {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({name,email,service,message,contact,industry,request_id:requestId,website:form.elements.website.value}),
        signal: AbortSignal.timeout(20000),
      });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.error || 'No pudimos confirmar el guardado. Intenta nuevamente.');
      status.textContent = 'Consulta guardada. Continúa en WhatsApp para enviar tu mensaje.';
      const link = document.createElement('a');
      link.href = url; link.textContent = ' Abrir WhatsApp';
      status.append(link);
      window.location.assign(url);
    } catch (error) {
      status.textContent = error.name === 'TimeoutError' ? 'No pudimos confirmar el guardado. Intenta nuevamente; evitaremos duplicar la consulta.' : (error.message || 'No se pudo guardar. Revisa tu conexión e intenta nuevamente.');
    } finally {
      submit.disabled = false;
    }
  });
}

function initScrollReveal() {
  const targets = document.querySelectorAll('.scroll-reveal');
  if (!targets.length) return;

  if (!('IntersectionObserver' in window)) {
    targets.forEach(el => el.classList.add('in-view'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });

  targets.forEach(el => observer.observe(el));
}

function initHeroSlider() {
  const slider = document.querySelector('[data-hero-slider]');
  if (!slider) return;
  const slides = [...slider.querySelectorAll('.hero-slide')];
  const copies = [...document.querySelectorAll('[data-hero-copy]')];
  const dots = [...slider.querySelectorAll('.hero-slider-dot')];
  const previous = slider.querySelector('.hero-slider-prev');
  const next = slider.querySelector('.hero-slider-next');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const DURATION = 1800, HOLD = 4000, EASING = 'linear';
  const fills = dots.map(dot => {
    const track = document.createElement('span');
    track.className = 'hero-slider-dot-track';
    track.setAttribute('aria-hidden', 'true');
    const fill = document.createElement('span');
    fill.className = 'hero-slider-dot-fill';
    track.appendChild(fill); dot.appendChild(track);
    return fill;
  });
  let progressAnimation = null;
  const activePointers = new Set();
  let current = 0, timer, moving = false, pending = null, animations = [], generation = 0;
  const normalize = index => (index + slides.length) % slides.length;

  function updateState() {
    slides.forEach((slide, index) => {
      slide.classList.toggle('is-active', index === current);
      slide.setAttribute('aria-hidden', String(index !== current));
      slide.inert = index !== current;
    });
    copies.forEach((copy, index) => {
      copy.classList.toggle('is-active', index === current);
      // The outgoing copy remains visible inside its moving panel until it exits.
      copy.setAttribute('aria-hidden', String(index !== current));
      copy.inert = index !== current;
    });
    dots.forEach((dot, index) => {
      dot.classList.toggle('is-active', index === current);
      dot.setAttribute('aria-current', String(index === current));
    });
  }

  function finish() {
    generation++;
    slides.forEach(slide => slide.classList.remove('is-exiting'));
    animations.forEach(animation => animation.cancel());
    animations = []; moving = false;
    updateState();
  }

  function showSlide(index, direction = 1) {
    stop();
    const target = normalize(index);
    if (moving) { pending = {index:target, direction}; return; }
    if (target === current) { start(); return; }
    const outgoing = slides[current];
    current = target;
    outgoing.classList.add('is-exiting');
    updateState();
    if (reduced.matches || !slides[current].animate) { finish(); start(); return; }
    moving = true;
    const token = ++generation;
    const options = {duration:DURATION, easing:EASING, fill:'both'};
    animations = [
      outgoing.animate([
        {transform:'translate3d(0,0,0)',offset:0,easing:'linear'},
        // Cover the first half quickly, then settle as the next copy is revealed.
        {transform:`translate3d(${-direction * 55}%,0,0)`,offset:.35,easing:'cubic-bezier(.2,.45,.25,1)'},
        {transform:`translate3d(${-direction * 100}%,0,0)`,offset:1}
      ],options),
      // Matching progress keeps the rear edge beneath the departing foreground.
      slides[current].animate([
        {transform:`translate3d(${direction * 4}%,0,0)`,offset:0,easing:'linear'},
        {transform:`translate3d(${direction * 1.8}%,0,0)`,offset:.35,easing:'cubic-bezier(.2,.45,.25,1)'},
        {transform:'translate3d(0,0,0)',offset:1}
      ],options)
    ];
    Promise.all(animations.map(animation => animation.finished.catch(() => {}))).then(() => {
      if (token !== generation) return;
      finish();
      const requested = pending; pending = null;
      if (requested) showSlide(requested.index, requested.direction);
      else start();
    });
  }

  const stop = () => {
    window.clearTimeout(timer);
    progressAnimation?.cancel(); progressAnimation = null;
  };
  const start = () => {
    stop();
    if (document.hidden || moving || pending || touchStart || activePointers.size || slides.length < 2) return;
    progressAnimation = fills[current]?.animate?.(
      [{transform:'scaleX(0)'}, {transform:'scaleX(1)'}],
      {duration:HOLD, easing:'linear', fill:'forwards'}
    );
    timer = window.setTimeout(() => showSlide(current + 1, 1), HOLD);
  };
  dots.forEach((dot,index) => dot.addEventListener('click', () => {
    showSlide(index,index < current ? -1 : 1); start();
  }));
  const navigate = step => { showSlide((pending?.index ?? current) + step,step); start(); };
  previous?.addEventListener('click', () => navigate(-1));
  next?.addEventListener('click', () => navigate(1));
  const swipeSurface=slider.closest('.hero')||slider;
  let touchStart=null,swiped=false;
  // Pause from initial contact, not only when the eventual click/swipe fires.
  swipeSurface.addEventListener('pointerdown', event => {
    activePointers.add(event.pointerId); stop();
  }, {passive:true});
  const releasePointer = event => {
    if (!activePointers.delete(event.pointerId)) return;
    start(); // start also waits for the gesture and any slide transition to finish.
  };
  document.addEventListener('pointerup', releasePointer, {passive:true});
  document.addEventListener('pointercancel', releasePointer, {passive:true});
  window.addEventListener('blur', () => {
    activePointers.clear(); touchStart=null; stop();
  });
  window.addEventListener('focus', () => start());
  swipeSurface.addEventListener('touchstart',e=>{swiped=false;touchStart=e.touches.length===1?{x:e.touches[0].clientX,y:e.touches[0].clientY}:null;stop();},{passive:true});
  swipeSurface.addEventListener('touchend',e=>{if(!touchStart||!e.changedTouches.length){start();return;}const dx=e.changedTouches[0].clientX-touchStart.x,dy=e.changedTouches[0].clientY-touchStart.y;touchStart=null;if(Math.abs(dx)>50&&Math.abs(dx)>Math.abs(dy)*1.4){swiped=true;navigate(dx<0?1:-1);}else start();},{passive:true});
  swipeSurface.addEventListener('touchcancel',()=>{touchStart=null;start();},{passive:true});
  swipeSurface.addEventListener('click',e=>{if(swiped){e.preventDefault();e.stopPropagation();swiped=false;}},true);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { stop(); activePointers.clear(); touchStart=null; pending=null; finish(); } else start();
  });
  reduced.addEventListener('change', () => { pending=null; finish(); start(); });
  updateState(); start();
}

function initReviewsCarousel() {
  const track = document.getElementById('reviews-track');
  if (!track) return;
  const previous = document.querySelector('[data-review-prev]');
  const next = document.querySelector('[data-review-next]');
  const update = () => {
    previous.disabled = track.scrollLeft < 2;
    next.disabled = track.scrollLeft >= track.scrollWidth - track.clientWidth - 2;
  };
  const move = direction => track.scrollBy({left: direction * (track.firstElementChild.getBoundingClientRect().width + parseFloat(getComputedStyle(track).columnGap)), behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'});
  previous.addEventListener('click', () => move(-1));
  next.addEventListener('click', () => move(1));
  track.addEventListener('scroll', update, {passive:true});
  track.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {event.preventDefault();move(event.key === 'ArrowLeft' ? -1 : 1);}
  });
  new ResizeObserver(update).observe(track);
  update();
}

document.addEventListener('DOMContentLoaded', () => {
  renderHeader();
  renderFooter();
  renderFloatingWhatsApp();
  initContactForm();
  initScrollReveal();
  initScrollExitFade();
  initHeroSlider();
  initReviewsCarousel();
});

function initScrollExitFade() {
  const main = document.querySelector('body > #site-header + main, body > main');
  if (!main || !CSS.supports('mask-image', 'linear-gradient(#000, #000)')) return;
  const sections = [...main.querySelectorAll(':scope > section')];
  const targets = sections.length ? sections : [...main.querySelectorAll(':scope > .wrap > *')];
  if (!targets.length) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const header = document.getElementById('site-header');
  let scheduled = false;
  const reset = element => {
    element.style.removeProperty('mask-image');
    element.style.removeProperty('-webkit-mask-image');
  };
  const update = () => {
    scheduled = false;
    const edge = Math.max(0, header?.getBoundingClientRect().bottom || 0);
    const band = Math.min(150, innerHeight * .18);
    for (const element of targets) {
      const rect = element.getBoundingClientRect();
      const passed = edge - rect.top;
      if (reduced.matches || passed <= 0 || rect.bottom <= 0 || rect.top >= innerHeight || element.contains(document.activeElement)) {
        reset(element);
        continue;
      }
      // Only soften the outgoing top edge; content farther down stays opaque.
      const progress = Math.min(1, passed / band);
      const alpha = 1 - .45 * progress;
      const start = Math.max(0, passed - band * .35);
      const end = passed + band;
      const mask = `linear-gradient(to bottom, rgba(0,0,0,${alpha.toFixed(3)}) ${start.toFixed(1)}px, #000 ${end.toFixed(1)}px)`;
      element.style.maskImage = mask;
      element.style.webkitMaskImage = mask;
    }
  };
  const schedule = () => {
    if (!scheduled) { scheduled = true; requestAnimationFrame(update); }
  };
  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', schedule, { passive: true });
  document.addEventListener('focusin', schedule);
  document.addEventListener('focusout', schedule);
  reduced.addEventListener('change', schedule);
  update();
}


function initServicesCarousel(){
 const track=document.getElementById('services-track');if(!track)return;
 const shell=document.createElement('div');shell.className='services-shell';track.before(shell);shell.append(track);
 const originals=[...track.children];originals.forEach((card,index)=>card.dataset.service=String(index+1));for(let copy=0;copy<2;copy++)originals.forEach(card=>{const clone=card.cloneNode(true);clone.setAttribute('aria-hidden','true');track.append(clone);});
 let span=0,position=0,last=0,drag=null,anim=null,touching=false,visible=false,touch=null,velocity=0;
 const measure=()=>{const mobile=matchMedia('(max-width:760px)').matches;track.style.setProperty('--service-width',`${mobile?shell.clientWidth:(shell.clientWidth-24)/2}px`);track.style.setProperty('--service-gutter',`${shell.getBoundingClientRect().left}px`);track.style.setProperty('--service-viewport',`${document.documentElement.clientWidth}px`);span=track.children[originals.length].offsetLeft-track.children[0].offsetLeft;position=span;track.scrollLeft=position;};
 const wrap=()=>{if(!span)return;if(position<span*.5)position+=span;else if(position>=span*1.5)position-=span;};
 const move=direction=>{if(!span)return;position=track.scrollLeft;wrap();track.scrollLeft=position;anim={from:position,to:position+direction*span/originals.length,time:performance.now()};};
 track.addEventListener('pointerdown',e=>{if(e.pointerType!=='mouse'||e.button!==0)return;anim=null;drag={x:e.clientX,left:track.scrollLeft};track.setPointerCapture(e.pointerId);track.classList.add('is-dragging');});
 track.addEventListener('pointermove',e=>{if(drag){position=drag.left+drag.x-e.clientX;track.scrollLeft=position;}});
 const release=()=>{if(!drag)return;drag=null;track.classList.remove('is-dragging');position=track.scrollLeft;wrap();track.scrollLeft=position;};
 track.addEventListener('pointerup',release);track.addEventListener('pointercancel',release);
 // Own horizontal touch movement so native momentum cannot fight autoplay.
 track.style.touchAction='pan-y pinch-zoom';
 track.addEventListener('touchstart',e=>{
   if(e.touches.length!==1){touch=null;return;}
   const point=e.touches[0];touching=true;anim=null;velocity=0;
   position=track.scrollLeft;touch={x:point.clientX,y:point.clientY,lastX:point.clientX,time:performance.now(),axis:null};
 },{passive:true});
 track.addEventListener('touchmove',e=>{
   if(!touch||e.touches.length!==1)return;
   const point=e.touches[0],now=performance.now(),dx=point.clientX-touch.x,dy=point.clientY-touch.y;
   if(!touch.axis&&Math.max(Math.abs(dx),Math.abs(dy))>6)touch.axis=Math.abs(dx)>Math.abs(dy)?'x':'y';
   if(touch.axis!=='x')return;
   if(e.cancelable)e.preventDefault();
   const step=touch.lastX-point.clientX;
   velocity=Math.max(-1.2,Math.min(1.2,step/Math.max(8,now-touch.time)));
   position+=step;wrap();track.scrollLeft=position;touch.lastX=point.clientX;touch.time=now;
 },{passive:false});
 const touchEnd=e=>{
   if(e.touches.length)return;
   if(!touch||touch.axis!=='x'||performance.now()-touch.time>100||e.type==='touchcancel')velocity=0;
   touch=null;touching=false;
 };
 track.addEventListener('touchend',touchEnd,{passive:true});track.addEventListener('touchcancel',touchEnd,{passive:true});
 track.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();move(e.key==='ArrowRight'?1:-1);}});
 new ResizeObserver(measure).observe(track);new IntersectionObserver(entries=>visible=entries[0].isIntersecting).observe(track);measure();
 const frame=now=>{const delta=Math.min(40,now-(last||now));last=now;if(visible&&!document.hidden&&!drag&&!touching&&span){if(anim){const t=Math.min(1,(now-anim.time)/650),ease=t*t*(3-2*t);position=anim.from+(anim.to-anim.from)*ease;if(t===1)anim=null;}else {velocity*=Math.exp(-delta/150);position+=delta*(.028+velocity);if(Math.abs(velocity)<.001)velocity=0;}if(!anim)wrap();track.scrollLeft=position;}requestAnimationFrame(frame);};requestAnimationFrame(frame);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initServicesCarousel);else initServicesCarousel();
