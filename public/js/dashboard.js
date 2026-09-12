// ============================================
// GETPES — dashboard.js
//
// DEMO DE AUTENTICACIÓN EN EL NAVEGADOR
// ---------------------------------------------
// Esto es una simulación de login para maquetar el flujo (front-end puro,
// sin backend). Las "cuentas" viven en localStorage, en texto plano.
// NO es seguro para producción: antes de lanzar con clientes reales,
// esto debe reemplazarse por un backend real (ej. Supabase/Firebase/API
// propia) con contraseñas hasheadas y tokens de sesión.
// ============================================

const DB_KEY = 'getpes_clients_db_v2';
const SESSION_KEY = 'getpes_session';

const META_OBJECTIVES = [
  'Reconocimiento de marca',
  'Tráfico',
  'Interacción (mensajes, likes, comentarios)',
  'Clientes potenciales (Leads)',
  'Promoción de la app',
  'Ventas',
];

const GOOGLE_OBJECTIVES = [
  'Ventas',
  'Clientes potenciales',
  'Tráfico al sitio web',
  'Consideración de producto/marca',
  'Alcance y notoriedad de marca',
  'Promoción de la app',
  'Visitas a tienda física',
];

// ---------- Datos demo iniciales (solo si no existe DB aún) ----------
const SEED_CLIENTS = [
  {
    id: 'cliente-1',
    name: 'Sonrisa Dental',
    email: 'sonrisa@cliente.com',
    password: '123456',
    initials: 'SD',
    chart: [40, 65, 50, 80, 60, 90, 70, 55, 75, 95, 68, 82],
    funnel: { leads: 214, reuniones: 96, clientesFinales: 42, ganancias: 18600 },
    campaigns: [
      { id: 'c1', platform: 'meta', objetivo: 'Clientes potenciales (Leads)', nombre: 'Promo Blanqueamiento', publico: 'Mujeres 25-45, Barranco', dias: 30, presupDiario: 27.3, frecuencia: 2.1, impresiones: 48200 },
      { id: 'c2', platform: 'google', objetivo: 'Ventas', nombre: 'Consulta gratis Sept', publico: 'Búsqueda "dentista Lima"', dias: 30, presupDiario: 23.6, frecuencia: 1.4, impresiones: 35600 },
      { id: 'c3', platform: 'meta', objetivo: 'Interacción (mensajes, likes, comentarios)', nombre: 'Reels Antes/Después', publico: 'Seguidores + similares', dias: 30, presupDiario: 11.3, frecuencia: 3.2, impresiones: 22100 },
    ],
    settings: { emailReports: true, weeklyDigest: true, autoOptim: false, reportFreq: 'weekly' }
  },
  {
    id: 'cliente-2',
    name: 'Café Andino',
    email: 'cafeandino@cliente.com',
    password: '123456',
    initials: 'CA',
    chart: [30, 45, 42, 60, 55, 48, 62, 58, 70, 65, 72, 66],
    funnel: { leads: 132, reuniones: 40, clientesFinales: 18, ganancias: 7200 },
    campaigns: [
      { id: 'c1', platform: 'meta', objetivo: 'Ventas', nombre: 'Lanzamiento Blend Otoño', publico: 'Lima, 20-40 años', dias: 30, presupDiario: 17.3, frecuencia: 2.4, impresiones: 30100 },
      { id: 'c2', platform: 'google', objetivo: 'Tráfico al sitio web', nombre: 'Suscripción mensual', publico: 'Búsqueda "café suscripción"', dias: 30, presupDiario: 20.0, frecuencia: 1.1, impresiones: 26400 },
    ],
    settings: { emailReports: true, weeklyDigest: false, autoOptim: true, reportFreq: 'monthly' }
  }
];

function loadDB() {
  const raw = localStorage.getItem(DB_KEY);
  if (!raw) {
    localStorage.setItem(DB_KEY, JSON.stringify(SEED_CLIENTS));
    return structuredClone(SEED_CLIENTS);
  }
  try { return JSON.parse(raw); } catch { return structuredClone(SEED_CLIENTS); }
}
function saveDB(db) {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
}
function getSession() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY)); } catch { return null; }
}
function setSession(clientId) {
  localStorage.setItem(SESSION_KEY, JSON.stringify({ clientId }));
}
function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

// ---------- Helpers ----------
function fmtMoney(n) {
  return 'S/ ' + Number(n || 0).toLocaleString('es-PE', { maximumFractionDigits: 0 });
}
function fmtNum(n) {
  return Number(n || 0).toLocaleString('es-PE');
}
function persistClient(client) {
  const idx = db.findIndex(c => c.id === client.id);
  db[idx] = client;
  saveDB(db);
}

// ---------- Elements ----------
let db = loadDB();
let currentClient = null;
let selectedPlatform = null;

const loginShell = document.getElementById('login-shell');
const dashShell = document.getElementById('dash-shell');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');

function boot() {
  const session = getSession();
  if (session) {
    const client = db.find(c => c.id === session.clientId);
    if (client) {
      enterDashboard(client);
      return;
    }
  }
  showLogin();
}

function showLogin() {
  loginShell.style.display = 'flex';
  dashShell.classList.remove('show');
}

function enterDashboard(client) {
  currentClient = client;
  loginShell.style.display = 'none';
  dashShell.classList.add('show');
  renderDashboard(client);
}

// ---------- Login ----------
loginForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const email = document.getElementById('login-email').value.trim().toLowerCase();
  const password = document.getElementById('login-password').value;

  const client = db.find(c => c.email.toLowerCase() === email && c.password === password);
  if (!client) {
    loginError.textContent = 'Correo o contraseña incorrectos. Revisa los datos demo abajo.';
    loginError.classList.add('show');
    return;
  }
  loginError.classList.remove('show');
  setSession(client.id);
  enterDashboard(client);
});

document.querySelectorAll('[data-fill]').forEach(btn => {
  btn.addEventListener('click', () => {
    const [email, pass] = btn.dataset.fill.split('|');
    document.getElementById('login-email').value = email;
    document.getElementById('login-password').value = pass;
  });
});

// ---------- Render dashboard (shell) ----------
function renderDashboard(client) {
  document.getElementById('user-initials').textContent = client.initials;
  document.getElementById('user-name').textContent = client.name;
  document.getElementById('user-email').textContent = client.email;

  renderChart(client.chart);
  renderCampaignManagement(client);

  // Settings
  document.getElementById('setting-email-reports').checked = client.settings.emailReports;
  document.getElementById('setting-weekly-digest').checked = client.settings.weeklyDigest;
  document.getElementById('setting-auto-optim').checked = client.settings.autoOptim;
  document.getElementById('setting-freq').value = client.settings.reportFreq;
}

function renderChart(values) {
  const svg = document.getElementById('perf-chart');
  const max = Math.max(...values, 1);
  const w = 640, h = 200, pad = 10;
  const stepX = (w - pad * 2) / (values.length - 1);
  const points = values.map((v, i) => {
    const x = pad + i * stepX;
    const y = h - pad - (v / max) * (h - pad * 2);
    return [x, y];
  });
  const line = points.map((p, i) => (i === 0 ? 'M' : 'L') + p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ');
  const area = line + ` L${points[points.length - 1][0].toFixed(1)},${h - pad} L${points[0][0].toFixed(1)},${h - pad} Z`;

  svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
  svg.innerHTML = `
    <defs>
      <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#a2e42e" stop-opacity="0.35"></stop>
        <stop offset="100%" stop-color="#a2e42e" stop-opacity="0"></stop>
      </linearGradient>
    </defs>
    <path d="${area}" fill="url(#chartFill)" stroke="none"></path>
    <path d="${line}" fill="none" stroke="#a2e42e" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"></path>
    ${points.map(p => `<circle cx="${p[0]}" cy="${p[1]}" r="3" fill="#0a0a0a" stroke="#a2e42e" stroke-width="2"></circle>`).join('')}
  `;
}

// ============================================
// Gestión General de Campañas
// ============================================
function computeKPIs(client) {
  const presupuesto = client.campaigns.reduce((sum, c) => sum + (c.dias * c.presupDiario), 0);
  const impresiones = client.campaigns.reduce((sum, c) => sum + Number(c.impresiones || 0), 0);
  const { leads, reuniones, clientesFinales, ganancias } = client.funnel;

  const cpl = leads > 0 ? presupuesto / leads : null;
  const cpa = clientesFinales > 0 ? presupuesto / clientesFinales : null;
  const roas = presupuesto > 0 ? ganancias / presupuesto : null;
  const conversion = leads > 0 ? (clientesFinales / leads) * 100 : null;

  return { presupuesto, impresiones, leads, reuniones, clientesFinales, ganancias, cpl, cpa, roas, conversion };
}

const KPI_ICONS = {
  presupuesto: '<circle cx="12" cy="12" r="9"></circle><path d="M12 7v10M9.5 9.5a2.5 2.5 0 012.5-1h.3a2.2 2.2 0 010 4.4H12a2.2 2.2 0 000 4.4h.3a2.5 2.5 0 002.5-1"></path>',
  leads: '<circle cx="9" cy="8" r="3.2"></circle><path d="M2.5 19c0-3.3 2.9-5.5 6.5-5.5s6.5 2.2 6.5 5.5"></path><path d="M16 8.2a3 3 0 010 5.8"></path><path d="M18.5 13.5c2.6.5 4 2 4 5.5"></path>',
  cpl: '<circle cx="12" cy="12" r="8.5"></circle><circle cx="12" cy="12" r="4.5"></circle><circle cx="12" cy="12" r=".8" fill="currentColor" stroke="none"></circle>',
  cpa: '<path d="M12 2v4M12 18v4M2 12h4M18 12h4"></path><circle cx="12" cy="12" r="5.5"></circle>',
  roas: '<path d="M3 17l6-6 4 4 8-9"></path><path d="M15 6h6v6"></path>',
  ganancias: '<path d="M4 19V10M10 19V5M16 19v-7M22 19v-3"></path><path d="M2 19h22"></path>',
  conversion: '<path d="M8 12.5l2.7 2.7L16.5 9"></path><circle cx="12" cy="12" r="9.5"></circle>',
  reuniones: '<rect x="3.5" y="5" width="17" height="15.5" rx="2"></rect><path d="M3.5 9.5h17M8 3v3.5M16 3v3.5"></path><path d="M8 13.5h2.2M8 17h5"></path>',
  clientesFinales: '<path d="M8 4h8v3.5a4 4 0 01-8 0V4z"></path><path d="M5 4h3M16 4h3M5 4c0 3 1 5 3 5.6M19 4c0 3-1 5-3 5.6"></path><path d="M12 13.5v3M9 20.5h6M9.5 17h5l.5 3.5H9l.5-3.5z"></path>',
};

function kpiIcon(name) {
  return `<svg class="kpi-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${KPI_ICONS[name]}</svg>`;
}

function renderCampaignManagement(client) {
  const k = computeKPIs(client);

  const kpiRow = document.getElementById('kpi-row-wide');
  kpiRow.innerHTML = `
    ${kpiCardComputed(kpiIcon('presupuesto'), 'Presupuesto', fmtMoney(k.presupuesto), 'Total invertido')}
    ${kpiCardEditable(kpiIcon('leads'), 'Leads', k.leads, 'leads', 'Total generados')}
    ${kpiCardComputed(kpiIcon('cpl'), 'CPL', k.cpl === null ? '—' : fmtMoney(k.cpl), 'Costo por lead')}
    ${kpiCardComputed(kpiIcon('cpa'), 'CPA', k.cpa === null ? '—' : fmtMoney(k.cpa), 'Costo por adquisición')}
    ${kpiCardComputed(kpiIcon('roas'), 'ROAS', k.roas === null ? '—' : k.roas.toFixed(1) + 'x', 'Retorno sobre inversión')}
    ${kpiCardEditable(kpiIcon('ganancias'), 'Ganancias', k.ganancias, 'ganancias', 'ROI ' + (k.roas === null ? '—' : k.roas.toFixed(1) + 'x'), true)}
    ${kpiCardComputed(kpiIcon('conversion'), 'Conversión', k.conversion === null ? '0%' : k.conversion.toFixed(1) + '%', 'Leads convertidos')}
    ${kpiCardEditable(kpiIcon('reuniones'), 'Reuniones', k.reuniones, 'reuniones', 'Agendadas')}
    ${kpiCardEditable(kpiIcon('clientesFinales'), 'Clientes finales', k.clientesFinales, 'clientesFinales', '—')}
  `;

  kpiRow.querySelectorAll('[data-edit-field]').forEach(el => {
    el.addEventListener('click', () => startInlineEdit(el, client));
  });

  renderInvestChart(k);
  renderFunnelChart(k);
  renderCampaignsTable(client);
}

function kpiCardComputed(icon, label, value, sub) {
  return `
    <div class="kpi-card-sm">
      <div class="top-bar computed"></div>
      <div class="icon">${icon}</div>
      <span class="label">${label}</span>
      <span class="value">${value}</span>
      <span class="sub">${sub}</span>
    </div>`;
}

function kpiCardEditable(icon, label, rawValue, field, sub, isMoney) {
  const display = isMoney ? fmtMoney(rawValue) : fmtNum(rawValue);
  return `
    <div class="kpi-card-sm">
      <div class="top-bar editable"></div>
      <div class="icon">${icon}</div>
      <span class="label">${label}</span>
      <span class="value editable" data-edit-field="${field}" data-raw="${rawValue}" title="Clic para editar">${display}</span>
      <span class="sub">${sub}</span>
    </div>`;
}

function startInlineEdit(el, client) {
  if (el.querySelector('input')) return;
  const field = el.dataset.editField;
  const raw = client.funnel[field];

  el.innerHTML = `<input type="number" min="0" step="1" value="${raw}">`;
  const input = el.querySelector('input');
  input.focus();
  input.select();

  const commit = () => {
    const newVal = Math.max(0, Number(input.value) || 0);
    client.funnel[field] = newVal;
    persistClient(client);
    renderCampaignManagement(client);
  };
  input.addEventListener('blur', commit);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); input.blur(); }
    if (e.key === 'Escape') { renderCampaignManagement(client); }
  });
}

function emptyState(message, iconPath) {
  return `
    <div class="empty-chart">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">${iconPath}</svg>
      <span>${message}</span>
    </div>`;
}

function renderInvestChart(k) {
  const mount = document.getElementById('invest-chart-mount');
  if (k.presupuesto === 0 && k.ganancias === 0) {
    mount.innerHTML = emptyState(
      'Ingresa presupuesto (vía campañas) y ganancias para ver el gráfico',
      '<rect x="3" y="12" width="4" height="8"></rect><rect x="10" y="6" width="4" height="14"></rect><rect x="17" y="2" width="4" height="18"></rect>'
    );
    return;
  }
  const max = Math.max(k.presupuesto, k.ganancias, 1);
  const barH = 160;
  const invH = (k.presupuesto / max) * barH;
  const ganH = (k.ganancias / max) * barH;

  mount.innerHTML = `
    <div style="display:flex; align-items:flex-end; gap:40px; height:${barH + 40}px; padding:0 20px;">
      <div style="display:flex; flex-direction:column; align-items:center; gap:10px;">
        <span style="font-family:var(--display); font-size:.85rem; color:var(--blue);">${fmtMoney(k.presupuesto)}</span>
        <div style="width:56px; height:${Math.max(invH,4)}px; background:var(--blue); border-radius:8px 8px 0 0;"></div>
        <span style="font-size:.78rem; color:var(--muted);">Inversión</span>
      </div>
      <div style="display:flex; flex-direction:column; align-items:center; gap:10px;">
        <span style="font-family:var(--display); font-size:.85rem; color:var(--lime);">${fmtMoney(k.ganancias)}</span>
        <div style="width:56px; height:${Math.max(ganH,4)}px; background:var(--lime); border-radius:8px 8px 0 0;"></div>
        <span style="font-size:.78rem; color:var(--muted);">Ganancias</span>
      </div>
    </div>
  `;
}

function renderFunnelChart(k) {
  const mount = document.getElementById('funnel-chart-mount');
  if (k.leads === 0 && k.reuniones === 0 && k.clientesFinales === 0) {
    mount.innerHTML = emptyState(
      'Ingresa leads, reuniones y clientes para ver el funnel',
      '<path d="M4 4l7 8v7l2 1v-8l7-8z"></path>'
    );
    return;
  }
  const max = Math.max(k.leads, 1);
  const rows = [
    ['Leads', k.leads, 'var(--blue)'],
    ['Reuniones', k.reuniones, 'var(--pink)'],
    ['Clientes', k.clientesFinales, 'var(--lime)'],
  ];
  mount.innerHTML = `
    <div class="funnel-bars">
      ${rows.map(([name, val, color]) => `
        <div class="funnel-row">
          <span class="fname">${name}</span>
          <div class="ftrack"><div class="ffill" style="width:${Math.max((val/max)*100,3)}%; background:${color};"></div></div>
          <span class="fval">${fmtNum(val)}</span>
        </div>
      `).join('')}
    </div>
  `;
}

const PLATFORM_LABEL = { meta: 'Meta Ads', google: 'Google Ads' };

function renderCampaignsTable(client) {
  const tbody = document.getElementById('campaigns-body');

  if (!client.campaigns.length) {
    tbody.innerHTML = `
      <tr class="empty-table-row">
        <td colspan="10">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 12h6M9 16h6M9 8h2"></path><rect x="5" y="3" width="14" height="18" rx="2"></rect></svg>
          <div>No hay campañas — haz clic en "+ Agregar campaña" para comenzar</div>
        </td>
      </tr>`;
    return;
  }

  tbody.innerHTML = client.campaigns.map(c => {
    const total = c.dias * c.presupDiario;
    return `
      <tr>
        <td><span class="platform-pill ${c.platform}">${PLATFORM_LABEL[c.platform]}</span></td>
        <td>${c.objetivo}</td>
        <td>${c.nombre}</td>
        <td>${c.publico || '—'}</td>
        <td>${c.dias}</td>
        <td>${fmtMoney(c.presupDiario)}</td>
        <td>${fmtMoney(total)}</td>
        <td>${c.frecuencia || '—'}</td>
        <td>${fmtNum(c.impresiones)}</td>
        <td>
          <div style="display:flex; gap:4px; justify-content:flex-end;">
            <button type="button" class="row-delete" data-edit="${c.id}" title="Editar campaña"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z"></path></svg></button>
            <button type="button" class="row-delete" data-delete="${c.id}" title="Eliminar campaña"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"></path><path d="M10 11v6M14 11v6"></path></svg></button>
          </div>
        </td>
      </tr>`;
  }).join('');

  tbody.querySelectorAll('[data-edit]').forEach(btn => {
    btn.addEventListener('click', () => {
      const campaign = client.campaigns.find(c => c.id === btn.dataset.edit);
      if (campaign) openModal(campaign);
    });
  });

  tbody.querySelectorAll('[data-delete]').forEach(btn => {
    btn.addEventListener('click', () => {
      client.campaigns = client.campaigns.filter(c => c.id !== btn.dataset.delete);
      persistClient(client);
      renderCampaignManagement(client);
    });
  });
}

// ---------- Modal: agregar campaña ----------
const modal = document.getElementById('campaign-modal');
const campaignForm = document.getElementById('campaign-form');
const objetivoSelect = document.getElementById('camp-objetivo');

let editingCampaignId = null;

function openModal(campaignToEdit) {
  campaignForm.reset();
  document.querySelectorAll('.platform-option').forEach(b => b.classList.remove('selected'));

  const modalTitle = document.getElementById('modal-title');
  const modalHint = document.getElementById('modal-hint');
  const submitBtn = document.getElementById('campaign-submit-btn');

  if (campaignToEdit) {
    editingCampaignId = campaignToEdit.id;
    selectedPlatform = campaignToEdit.platform;

    modalTitle.textContent = 'Editar campaña';
    modalHint.textContent = 'Actualiza los datos de esta campaña. Si cambias de plataforma, vuelve a elegir el objetivo.';
    submitBtn.textContent = 'Guardar cambios';

    const platformBtn = document.querySelector(`.platform-option[data-platform="${campaignToEdit.platform}"]`);
    if (platformBtn) platformBtn.classList.add('selected');

    const objectives = campaignToEdit.platform === 'meta' ? META_OBJECTIVES : GOOGLE_OBJECTIVES;
    objetivoSelect.disabled = false;
    objetivoSelect.innerHTML = objectives.map(o => `<option value="${o}" ${o === campaignToEdit.objetivo ? 'selected' : ''}>${o}</option>`).join('');

    document.getElementById('camp-nombre').value = campaignToEdit.nombre;
    document.getElementById('camp-publico').value = campaignToEdit.publico;
    document.getElementById('camp-dias').value = campaignToEdit.dias;
    document.getElementById('camp-presup-diario').value = campaignToEdit.presupDiario;
    document.getElementById('camp-frecuencia').value = campaignToEdit.frecuencia;
    document.getElementById('camp-impresiones').value = campaignToEdit.impresiones;
  } else {
    editingCampaignId = null;
    selectedPlatform = null;

    modalTitle.textContent = 'Nueva campaña';
    modalHint.textContent = 'Primero elige la plataforma: Meta Ads y Google Ads tienen objetivos publicitarios distintos.';
    submitBtn.textContent = 'Guardar campaña';

    objetivoSelect.innerHTML = '<option value="">Selecciona primero una plataforma</option>';
    objetivoSelect.disabled = true;
  }

  modal.classList.add('show');
}
function closeModal() {
  modal.classList.remove('show');
}

document.getElementById('open-add-campaign').addEventListener('click', () => openModal());
document.getElementById('open-add-campaign-2').addEventListener('click', () => openModal());
document.getElementById('cancel-add-campaign').addEventListener('click', closeModal);
modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

document.querySelectorAll('.platform-option').forEach(btn => {
  btn.addEventListener('click', () => {
    selectedPlatform = btn.dataset.platform;
    document.querySelectorAll('.platform-option').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');

    const objectives = selectedPlatform === 'meta' ? META_OBJECTIVES : GOOGLE_OBJECTIVES;
    objetivoSelect.disabled = false;
    objetivoSelect.innerHTML = objectives.map(o => `<option value="${o}">${o}</option>`).join('');
  });
});

campaignForm.addEventListener('submit', (e) => {
  e.preventDefault();
  if (!currentClient) return;
  if (!selectedPlatform) {
    alert('Elige una plataforma (Meta Ads o Google Ads) antes de guardar.');
    return;
  }

  const data = {
    platform: selectedPlatform,
    objetivo: objetivoSelect.value,
    nombre: document.getElementById('camp-nombre').value.trim(),
    publico: document.getElementById('camp-publico').value.trim(),
    dias: Number(document.getElementById('camp-dias').value) || 0,
    presupDiario: Number(document.getElementById('camp-presup-diario').value) || 0,
    frecuencia: Number(document.getElementById('camp-frecuencia').value) || 0,
    impresiones: Number(document.getElementById('camp-impresiones').value) || 0,
  };

  if (editingCampaignId) {
    const idx = currentClient.campaigns.findIndex(c => c.id === editingCampaignId);
    if (idx !== -1) currentClient.campaigns[idx] = { ...currentClient.campaigns[idx], ...data };
  } else {
    currentClient.campaigns.push({ id: 'c' + Date.now(), ...data });
  }

  persistClient(currentClient);
  renderCampaignManagement(currentClient);
  closeModal();
});

// ---------- Nav switching ----------
document.querySelectorAll('.dash-nav button[data-view]').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.dash-nav button[data-view]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.querySelectorAll('.dash-view').forEach(v => v.classList.remove('active'));
    document.getElementById('view-' + btn.dataset.view).classList.add('active');

    const sidebar = document.getElementById('dash-side');
    sidebar.classList.remove('open');
  });
});

// ---------- Mobile sidebar ----------
const mobileToggle = document.getElementById('dash-mobile-toggle');
if (mobileToggle) {
  mobileToggle.addEventListener('click', () => {
    document.getElementById('dash-side').classList.toggle('open');
  });
}

// ---------- Logout ----------
document.getElementById('logout-btn').addEventListener('click', () => {
  clearSession();
  currentClient = null;
  loginForm.reset();
  showLogin();
});

// ---------- Settings form ----------
document.getElementById('settings-form').addEventListener('submit', (e) => {
  e.preventDefault();
  if (!currentClient) return;

  currentClient.settings.emailReports = document.getElementById('setting-email-reports').checked;
  currentClient.settings.weeklyDigest = document.getElementById('setting-weekly-digest').checked;
  currentClient.settings.autoOptim = document.getElementById('setting-auto-optim').checked;
  currentClient.settings.reportFreq = document.getElementById('setting-freq').value;

  persistClient(currentClient);

  const msg = document.getElementById('save-msg');
  msg.classList.add('show');
  setTimeout(() => msg.classList.remove('show'), 2200);
});

boot();
