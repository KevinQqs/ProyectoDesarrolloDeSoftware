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

function abrirModal(id) {
  document.getElementById(id).classList.add('open');
}

function cerrarModal(id) {
  document.getElementById(id).classList.remove('open');
}

function abrirModalNuevaPelicula() {
  limpiarFormPelicula();
  cargarDirectoresEnSelect();
  abrirModal('modal-pelicula');
}

document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', e => {
    if (e.target === overlay) overlay.classList.remove('open');
  });
});

// ── NAVEGACIÓN ────────────────────────────────────────────────────────────

function showSection(name, btn) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('nav button').forEach(b => b.classList.remove('active'));
  document.getElementById('section-' + name).classList.add('active');
  if (btn) btn.classList.add('active');

  const searchWrap = document.getElementById('search-wrap');
  const filterRow = document.getElementById('filter-row');
  const isPeliculas = name === 'peliculas';
  searchWrap.style.display = isPeliculas ? '' : 'none';
  filterRow.style.display = isPeliculas ? '' : 'none';

  if (name === 'directores') cargarDirectores();
  if (name === 'generos') cargarGeneros();
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
    toast('Error al buscar películas', 'error');
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
  if (filtroActual === 'activas')   filtradas = peliculas.filter(p => p.activo);
  if (filtroActual === 'inactivas') filtradas = peliculas.filter(p => !p.activo);
  renderPeliculas(filtradas);
}

// ── PELÍCULAS ─────────────────────────────────────────────────────────────

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
        <div class="card-actions">
          <button class="btn btn-surface btn-sm" onclick="editarPelicula(${p.id})">Editar</button>
          <button class="btn btn-surface btn-sm" onclick="gestionarGeneros(${p.id}, '${p.titulo}')">Géneros</button>
          ${p.activo
            ? `<button class="btn btn-danger btn-sm" onclick="desactivarPelicula(${p.id})">Desactivar</button>`
            : `<button class="btn btn-success btn-sm" onclick="reactivarPelicula(${p.id})">Activar</button>`}
        </div>
      </div>
    </div>
  `).join('');
}

async function guardarPelicula() {
  const id = document.getElementById('pelicula-edit-id').value;
  const titulo = document.getElementById('p-titulo').value.trim();
  const director_id = parseInt(document.getElementById('p-director').value);

  if (!titulo || !director_id) {
    toast('Título y director son obligatorios', 'error');
    return;
  }

  const body = {
    titulo,
    director_id,
    anio: parseInt(document.getElementById('p-anio').value) || null,
    calificacion: parseFloat(document.getElementById('p-calificacion').value) || null,
    poster_url: document.getElementById('p-poster').value || null,
    sinopsis: document.getElementById('p-sinopsis').value || null,
  };

  try {
    const url    = id ? `${API}/peliculas/${id}` : `${API}/peliculas/`;
    const method = id ? 'PATCH' : 'POST';
    const r = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!r.ok) throw new Error();
    toast(id ? 'Película actualizada' : 'Película creada');
    cerrarModal('modal-pelicula');
    limpiarFormPelicula();
    cargarPeliculas();
  } catch {
    toast('Error al guardar la película', 'error');
  }
}

async function editarPelicula(id) {
  await cargarDirectoresEnSelect();
  const r = await fetch(`${API}/peliculas/${id}`);
  const p = await r.json();
  document.getElementById('pelicula-edit-id').value   = p.id;
  document.getElementById('p-titulo').value           = p.titulo;
  document.getElementById('p-anio').value             = p.anio || '';
  document.getElementById('p-calificacion').value     = p.calificacion || '';
  document.getElementById('p-director').value         = p.director_id;
  document.getElementById('p-poster').value           = p.poster_url || '';
  document.getElementById('p-sinopsis').value         = p.sinopsis || '';
  document.getElementById('modal-pelicula-title').textContent = 'Editar Película';
  abrirModal('modal-pelicula');
}

async function desactivarPelicula(id) {
  if (!confirm('¿Desactivar esta película?')) return;
  await fetch(`${API}/peliculas/${id}`, { method: 'DELETE' });
  toast('Película desactivada');
  cargarPeliculas();
}

async function reactivarPelicula(id) {
  await fetch(`${API}/peliculas/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ activo: true }),
  });
  toast('Película reactivada');
  cargarPeliculas();
}

function limpiarFormPelicula() {
  ['pelicula-edit-id', 'p-titulo', 'p-anio', 'p-calificacion', 'p-poster', 'p-sinopsis']
    .forEach(id => { document.getElementById(id).value = ''; });
  document.getElementById('modal-pelicula-title').textContent = 'Nueva Película';
}

// ── GÉNEROS DE PELÍCULA ───────────────────────────────────────────────────

async function gestionarGeneros(peliculaId, titulo) {
  document.getElementById('modal-generos-titulo').textContent = `Géneros — ${titulo}`;

  const [todosGeneros, generosActuales] = await Promise.all([
    fetch(`${API}/generos/`).then(r => r.json()),
    fetch(`${API}/peliculas/${peliculaId}/generos`).then(r => r.json()).catch(() => []),
  ]);

  const idsActuales = generosActuales.map(g => g.id);

  document.getElementById('lista-generos-checks').innerHTML = todosGeneros.map(g => `
    <label style="display:flex;align-items:center;gap:12px;cursor:pointer;padding:10px 14px;border-radius:10px;border:1px solid var(--border);background:var(--surface2)">
      <input type="checkbox"
        ${idsActuales.includes(g.id) ? 'checked' : ''}
        onchange="toggleGenero(${peliculaId}, ${g.id}, this.checked)"
        style="width:16px;height:16px;accent-color:var(--accent)">
      <span>${g.nombre}</span>
      ${g.descripcion ? `<span style="color:var(--muted);font-size:0.75rem;margin-left:auto">${g.descripcion}</span>` : ''}
    </label>
  `).join('');

  abrirModal('modal-generos-pelicula');
}

async function toggleGenero(peliculaId, generoId, agregar) {
  const url = `${API}/peliculas/${peliculaId}/generos/${generoId}`;
  const method = agregar ? 'POST' : 'DELETE';
  const r = await fetch(url, { method });
  if (r.ok) {
    toast(agregar ? 'Género agregado' : 'Género removido');
  } else {
    toast('Error al actualizar género', 'error');
  }
}

// ── DIRECTORES ────────────────────────────────────────────────────────────

async function cargarDirectores() {
  const r = await fetch(`${API}/directores/`);
  const lista = await r.json();
  const el = document.getElementById('list-directores');

  if (!lista.length) {
    el.innerHTML = `
      <div class="empty">
        <div class="empty-icon">🎬</div>
        <div class="empty-text">No hay directores registrados</div>
      </div>`;
    return;
  }

  el.innerHTML = lista.map(d => `
    <div class="dir-card">
      <div class="dir-avatar">
        ${d.foto_url
          ? `<img src="${d.foto_url}" style="width:100%;height:100%;object-fit:cover;border-radius:50%" onerror="this.parentElement.innerHTML='🎬'">`
          : '🎬'}
      </div>
      <div>
        <div class="dir-name">${d.nombre}</div>
        <div class="dir-meta">${d.nacionalidad || '—'} · ${d.anio_nacimiento || '—'}</div>
      </div>
      <div class="dir-actions">
        <button class="btn btn-danger btn-sm" onclick="eliminarDirector(${d.id})">Eliminar</button>
      </div>
    </div>
  `).join('');
}

async function cargarDirectoresEnSelect() {
  const r = await fetch(`${API}/directores/`);
  const lista = await r.json();
  const sel = document.getElementById('p-director');
  sel.innerHTML =
    '<option value="">Selecciona un director</option>' +
    lista.map(d => `<option value="${d.id}">${d.nombre}</option>`).join('');
}

async function guardarDirector() {
  const nombre = document.getElementById('d-nombre').value.trim();
  if (!nombre) { toast('El nombre es obligatorio', 'error'); return; }

  const body = {
    nombre,
    nacionalidad: document.getElementById('d-nacionalidad').value || null,
    anio_nacimiento: parseInt(document.getElementById('d-anio').value) || null,
    foto_url: document.getElementById('d-foto').value || null,
    biografia: document.getElementById('d-biografia').value || null,
  };

  const r = await fetch(`${API}/directores/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (r.ok) {
    toast('Director creado');
    cerrarModal('modal-director');
    ['d-nombre', 'd-nacionalidad', 'd-anio', 'd-foto', 'd-biografia'].forEach(id => {
      document.getElementById(id).value = '';
    });
    cargarDirectores();
  } else {
    toast('Error al crear director', 'error');
  }
}

async function eliminarDirector(id) {
  if (!confirm('¿Eliminar este director?')) return;
  await fetch(`${API}/directores/${id}`, { method: 'DELETE' });
  toast('Director eliminado');
  cargarDirectores();
}

// ── GÉNEROS ───────────────────────────────────────────────────────────────

async function cargarGeneros() {
  const r = await fetch(`${API}/generos/`);
  const lista = await r.json();
  const el = document.getElementById('list-generos');

  if (!lista.length) {
    el.innerHTML = `
      <div class="empty">
        <div class="empty-icon">🏷️</div>
        <div class="empty-text">No hay géneros registrados</div>
      </div>`;
    return;
  }

  el.innerHTML = lista.map(g => `
    <div class="genre-card">
      <div>
        <div class="genre-name">${g.nombre}</div>
        <div class="genre-desc">${g.descripcion || '—'}</div>
      </div>
      <button class="btn btn-danger btn-sm" onclick="eliminarGenero(${g.id})">Eliminar</button>
    </div>
  `).join('');
}

async function guardarGenero() {
  const nombre = document.getElementById('g-nombre').value.trim();
  if (!nombre) { toast('El nombre es obligatorio', 'error'); return; }

  const body = {
    nombre,
    descripcion: document.getElementById('g-descripcion').value || null,
  };

  const r = await fetch(`${API}/generos/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (r.ok) {
    toast('Género creado');
    cerrarModal('modal-genero');
    ['g-nombre', 'g-descripcion'].forEach(id => {
      document.getElementById(id).value = '';
    });
    cargarGeneros();
  } else {
    toast('Error al crear género', 'error');
  }
}

async function eliminarGenero(id) {
  if (!confirm('¿Eliminar este género?')) return;
  await fetch(`${API}/generos/${id}`, { method: 'DELETE' });
  toast('Género eliminado');
  cargarGeneros();
}

// ── DASHBOARD ─────────────────────────────────────────────────────────────

async function cargarDashboard() {
  const [peliculas, directores, generos] = await Promise.all([
    fetch(`${API}/peliculas/`).then(r => r.json()),
    fetch(`${API}/directores/`).then(r => r.json()),
    fetch(`${API}/generos/`).then(r => r.json()),
  ]);

  const activas = peliculas.filter(p => p.activo);
  const ratings = peliculas.filter(p => p.calificacion).map(p => p.calificacion);
  const avgRating = ratings.length
    ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)
    : '—';

  document.getElementById('stat-peliculas').textContent  = peliculas.length;
  document.getElementById('stat-activas').textContent    = activas.length;
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

// ── INIT ──────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  if (!localStorage.getItem('pelisb_auth')) {
    window.location.href = '/login';
    return;
  }
  cargarPeliculas();
  cargarDirectoresEnSelect();
});

function cerrarSesion() {
  localStorage.removeItem('pelisb_auth');
  window.location.href = '/login';
}