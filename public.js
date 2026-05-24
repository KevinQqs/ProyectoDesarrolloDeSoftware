const API = 'https://proyectodesarrollodesoftware.onrender.com';

let todasLasPeliculas = [];
let filtroActual = 'todas';
let searchTimeout = null;

// ── UTILS ──────────────────────────────────────────────────────────────────

function toast(msg, type = 'success') {
  const container = document.getElementById('toasts');
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = `<span>${type === 'success' ? '✓' : '✕'}</span> ${msg}`;
  container.appendChild(t);
  setTimeout(() => t.remove(), 3500);
}

// ── NAVEGACIÓN ────────────────────────────────────────────────────────────

function showSection(name, btn) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('nav button').forEach(b => b.classList.remove('active'));
  document.getElementById('section-' + name).classList.add('active');
  if (btn) btn.classList.add('active');

  const searchWrap = document.querySelector('.search-wrap');
  const filterRow = document.querySelector('.filter-row');
  const isPeliculas = name === 'peliculas';
  if (searchWrap) searchWrap.style.display = isPeliculas ? '' : 'none';
  if (filterRow) filterRow.style.display = isPeliculas ? '' : 'none';

  if (name === 'dashboard') cargarDashboard();
}

// ── BÚSQUEDA ──────────────────────────────────────────────────────────────

function onSearch(val) {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => buscarPeliculas(), 400);
}

async function buscarPeliculas() {
  const q = document.getElementById('search-input').value.trim();
  if (!q) { aplicarFiltro(todasLasPeliculas); return; }
  try {
    const r = await fetch(`${API}/peliculas/buscar/${encodeURIComponent(q)}`);
    if (r.status === 404) { renderPeliculas([]); return; }
    renderPeliculas(await r.json());
  } catch {
    toast('Error al buscar', 'error');
  }
}

function limpiarBusqueda() {
  document.getElementById('search-input').value = '';
  aplicarFiltro(todasLasPeliculas);
}

// ── FILTRO ────────────────────────────────────────────────────────────────

function setFiltro(tipo, btn) {
  filtroActual = tipo;
  document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
  btn.classList.add('active');
  aplicarFiltro(todasLasPeliculas);
}

function aplicarFiltro(peliculas) {
  let filtradas = peliculas;
  if (filtroActual === 'activas') filtradas = peliculas.filter(p => p.activo);
  renderPeliculas(filtradas);
}

// ── PELÍCULAS (solo lectura) ───────────────────────────────────────────────

async function cargarPeliculas() {
  try {
    const r = await fetch(`${API}/peliculas/`);
    todasLasPeliculas = await r.json();
    aplicarFiltro(todasLasPeliculas);
  } catch {
    toast('Error al cargar películas', 'error');
  }
}

function renderPeliculas(lista) {
  const grid = document.getElementById('grid-peliculas');
  document.getElementById('count-peliculas').textContent =
    `${lista.length} resultado${lista.length !== 1 ? 's' : ''}`;

  if (!lista.length) {
    grid.innerHTML = `
      <div class="empty">
        <div class="empty-icon">🎬</div>
        <div class="empty-text">No se encontraron películas</div>
      </div>`;
    return;
  }

  // Solo vista, sin botones de editar/eliminar
  grid.innerHTML = lista.map(p => `
    <div class="card ${p.activo ? '' : 'inactiva'}">
      <div class="card-poster">
        ${p.poster_url
          ? `<img src="${p.poster_url}" alt="${p.titulo}" onerror="this.style.display='none'">`
          : '🎬'}
        ${p.calificacion ? `<span class="card-badge">★ ${p.calificacion}</span>` : ''}
        ${!p.activo ? `<span class="card-inactive-badge">Inactiva</span>` : ''}
      </div>
      <div class="card-body">
        <div class="card-title">${p.titulo}</div>
        <div class="card-meta">${p.anio || '—'}</div>
      </div>
    </div>
  `).join('');
}

// ── DASHBOARD ─────────────────────────────────────────────────────────────

async function cargarDashboard() {
  const [peliculas, directores, generos] = await Promise.all([
    fetch(`${API}/peliculas/`).then(r => r.json()),
    fetch(`${API}/directores/`).then(r => r.json()),
    fetch(`${API}/generos/`).then(r => r.json()),
  ]);

  const ratings = peliculas.filter(p => p.calificacion).map(p => p.calificacion);
  const avgRating = ratings.length
    ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)
    : '—';

  document.getElementById('stat-peliculas').textContent  = peliculas.length;
  document.getElementById('stat-directores').textContent = directores.length;
  document.getElementById('stat-generos').textContent    = generos.length;
  document.getElementById('stat-rating').textContent     = avgRating;

  // Gráfica: películas por director
  const porDirector = {};
  for (const p of peliculas) {
    const dir = directores.find(d => d.id === p.director_id);
    const nombre = dir ? dir.nombre : 'Desconocido';
    porDirector[nombre] = (porDirector[nombre] || 0) + 1;
  }
  const maxDir = Math.max(...Object.values(porDirector), 1);
  document.getElementById('chart-directores').innerHTML =
    Object.entries(porDirector)
      .sort((a, b) => b[1] - a[1]).slice(0, 10)
      .map(([nombre, valor]) => `
        <div class="bar-row">
          <div class="bar-label" title="${nombre}">${nombre}</div>
          <div class="bar-track">
            <div class="bar-fill" style="width:${(valor / maxDir * 100)}%">
              <span class="bar-value">${valor}</span>
            </div>
          </div>
        </div>`).join('');

  // Gráfica: top rating
  const conRating = peliculas
    .filter(p => p.calificacion)
    .sort((a, b) => b.calificacion - a.calificacion)
    .slice(0, 10);

  document.getElementById('chart-ratings').innerHTML = conRating.map(p => `
    <div class="bar-row">
      <div class="bar-label" title="${p.titulo}">${p.titulo}</div>
      <div class="bar-track">
        <div class="bar-fill" style="width:${(p.calificacion / 10 * 100)}%">
          <span class="bar-value">${p.calificacion}</span>
        </div>
      </div>
    </div>`).join('');
}

// ── INIT ──────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  cargarPeliculas();
});
