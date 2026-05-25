const API = 'https://proyectodesarrollodesoftware.onrender.com';

let todasLasPeliculas = [];
let filtroActual = 'todas';
let searchTimeout = null;
let generoActual = null;

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
  document.querySelectorAll('#filter-estado .filter-chip').forEach(c => c.classList.remove('active'));
  btn.classList.add('active');
  aplicarFiltro(todasLasPeliculas);
}


function setGenero(generoId, btn) {
  generoActual = generoId;
  document.querySelectorAll('#filter-generos .filter-chip').forEach(c => c.classList.remove('active'));
  btn.classList.add('active');
  aplicarFiltro(todasLasPeliculas);
}
function aplicarFiltro(peliculas) {
  let filtradas = peliculas;
  if (filtroActual === 'activas') filtradas = filtradas.filter(p => p.activo);
  if (generoActual !== null) filtradas = filtradas.filter(p => p._generos && p._generos.includes(generoActual));
  renderPeliculas(filtradas);
}

// ── PELÍCULAS (solo lectura) ───────────────────────────────────────────────

async function cargarPeliculas() {
  try {
    const [peliculas, generos] = await Promise.all([
      fetch(`${API}/peliculas/`).then(r => r.json()),
      fetch(`${API}/generos/`).then(r => r.json()),
    ]);

    // Cargar géneros de cada película en paralelo
    const generosMap = await Promise.all(
      peliculas.map(p =>
        fetch(`${API}/peliculas/${p.id}/generos`)
          .then(r => r.json())
          .catch(() => [])
      )
    );

    todasLasPeliculas = peliculas.map((p, i) => ({
      ...p,
      _generos: generosMap[i].map(g => g.id),
    }));

    // Poblar chips de géneros
    const filterGeneros = document.getElementById('filter-generos');
    filterGeneros.innerHTML =
      `<span class="filter-label">GÉNERO:</span>
       <button class="filter-chip active" onclick="setGenero(null, this)">Todos</button>` +
      generos.map(g =>
        `<button class="filter-chip" onclick="setGenero(${g.id}, this)">${g.nombre}</button>`
      ).join('');

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

  grid.innerHTML = lista.map(p => `
    <div class="card ${p.activo ? '' : 'inactiva'}" onclick="abrirDetalle(${p.id})" style="cursor:pointer">
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

// ── DETALLE PELÍCULA ──────────────────────────────────────────────────────

async function abrirDetalle(id) {
  const [pelicula, directores] = await Promise.all([
    fetch(`${API}/peliculas/${id}`).then(r => r.json()),
    fetch(`${API}/directores/`).then(r => r.json()),
  ]);

  const director = directores.find(d => d.id === pelicula.director_id);
  const generosP = await fetch(`${API}/peliculas/${id}/generos`).then(r => r.json()).catch(() => []);

  const posterEl = document.getElementById('detalle-poster');
  posterEl.innerHTML = pelicula.poster_url
    ? `<img src="${pelicula.poster_url}" style="width:100%;height:100%;object-fit:cover" onerror="this.parentElement.innerHTML='🎬'">`
    : '🎬';

  document.getElementById('detalle-titulo').textContent = pelicula.titulo;

  document.getElementById('detalle-meta').innerHTML =
    `${pelicula.anio || '—'} · Dir. <span
      onclick="abrirDirector(${pelicula.director_id})"
      style="color:var(--accent);cursor:pointer;text-decoration:underline;font-weight:500"
    >${director ? director.nombre : '—'}</span>`;

  document.getElementById('detalle-rating').innerHTML = pelicula.calificacion
    ? `<span style="font-family:'Bebas Neue',sans-serif;font-size:1.4rem;color:var(--accent)">★ ${pelicula.calificacion}</span><span style="color:var(--muted);font-size:0.8rem"> / 10</span>`
    : '';

  document.getElementById('detalle-generos').innerHTML = generosP.map(g =>
    `<span style="background:rgba(232,197,71,0.1);border:1px solid rgba(232,197,71,0.3);color:var(--accent);padding:3px 10px;border-radius:20px;font-size:0.75rem">${g.nombre}</span>`
  ).join('');

  document.getElementById('detalle-sinopsis').textContent =
    pelicula.sinopsis || 'Sin sinopsis disponible.';

  document.getElementById('modal-detalle').classList.add('open');
}

function cerrarDetalle() {
  document.getElementById('modal-detalle').classList.remove('open');
}

document.getElementById('modal-detalle').addEventListener('click', e => {
  if (e.target === document.getElementById('modal-detalle')) cerrarDetalle();
});

// ── DETALLE DIRECTOR ──────────────────────────────────────────────────────

async function abrirDirector(id) {
  const director = await fetch(`${API}/directores/${id}`).then(r => r.json());

  const fotoEl = document.getElementById('dir-detalle-foto');
  fotoEl.innerHTML = director.foto_url
    ? `<img src="${director.foto_url}" style="width:100%;height:100%;object-fit:cover" onerror="this.parentElement.innerHTML='🎬'">`
    : '🎬';

  document.getElementById('dir-detalle-nombre').textContent = director.nombre;
  document.getElementById('dir-detalle-meta').textContent =
    `${director.nacionalidad || '—'} · ${director.anio_nacimiento || '—'}`;
  document.getElementById('dir-detalle-bio').textContent =
    director.biografia || 'Sin biografía disponible.';

  document.getElementById('modal-director-detalle').classList.add('open');
}

function cerrarDirector() {
  document.getElementById('modal-director-detalle').classList.remove('open');
}

document.getElementById('modal-director-detalle').addEventListener('click', e => {
  if (e.target === document.getElementById('modal-director-detalle')) cerrarDirector();
});

// ── INIT ──────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  cargarPeliculas();
});