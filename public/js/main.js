// ============================================
// GETPES — main.js
// Header/footer compartidos + interacciones base
// ============================================

const NAV_ITEMS = [
  { href: 'index.html', label: 'Inicio' },
  { href: 'nosotros.html', label: 'Nosotros' },
  { href: 'portafolio.html', label: 'Portafolio' },
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
    const active = (item.href === page || (item.href === 'portafolio.html' && page.startsWith('portafolio-'))) ? ' active' : '';
    return `<a href="${item.href}" class="${active.trim()}" ${active ? 'aria-current="page"' : ''}>${item.label}</a>`;
  }).join('');

  mount.innerHTML = `
    <div class="wrap">
      <a href="index.html" class="brand">
        <img src="assets/logo.svg" alt="Getpes — agencia digital">
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
          <a href="index.html" class="brand"><img src="assets/logo.svg" alt="Getpes"></a>
        </div>
        <div class="footer-cols">
          <div class="footer-col">
            <h5>Navegación</h5>
            <a href="index.html">Inicio</a>
            <a href="nosotros.html">Nosotros</a>
            <a href="portafolio.html">Portafolio</a>
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
  const motionAllowed = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let current = 0;
  let timer;

  const showSlide = (index) => {
    current = (index + slides.length) % slides.length;
    slides.forEach((slide, slideIndex) => {
      const active = slideIndex === current;
      slide.classList.toggle('is-active', active);
      slide.setAttribute('aria-hidden', String(!active));
    });
    copies.forEach((copy, copyIndex) => {
      const active = copyIndex === current;
      copy.classList.toggle('is-active', active);
      copy.setAttribute('aria-hidden', String(!active));
    });
    dots.forEach((dot, dotIndex) => {
      const active = dotIndex === current;
      dot.classList.toggle('is-active', active);
      dot.setAttribute('aria-current', String(active));
    });
  };

  const start = () => {
    stop();
    timer = window.setInterval(() => showSlide(current + 1), 9000);
  };
  const stop = () => window.clearInterval(timer);

  dots.forEach((dot, index) => dot.addEventListener('click', () => {
    showSlide(index);
    stop();
  }));
  const navigate = (step) => {
    showSlide(current + step);
    if (motionAllowed) {
      stop();
      start();
    }
  };
  previous?.addEventListener('click', () => navigate(-1));
  next?.addEventListener('click', () => navigate(1));
  slider.addEventListener('mouseenter', stop);


  // El carrusel avanza a petición para permitir leer sin interrupciones.
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
  initHeroSlider();
  initReviewsCarousel();
});
