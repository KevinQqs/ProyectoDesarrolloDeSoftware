# 🎬 PelisB

> Plataforma web para buscar y gestionar películas, directores y géneros cinematográficos.

**Estudiante:** Kevin Quiñones  
**Demo:** [proyectodesarrollodesoftware.onrender.com](https://proyectodesarrollodesoftware.onrender.com)  
**Repositorio:** [github.com/KevinQqs/ProyectoDesarrolloDeSoftware](https://github.com/KevinQqs/ProyectoDesarrolloDeSoftware)  
**Documentación API:** [/docs](https://proyectodesarrollodesoftware.onrender.com/docs)

---

## 📌 Descripción

PelisB es una API REST construida con **FastAPI** y **Python**, con frontend en HTML/CSS/JS puro que consume la API directamente. Permite gestionar un catálogo de películas con sus directores y géneros, con panel de administración protegido y vista pública con buscador y dashboard de estadísticas.

---

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────────┐
│                   CLIENTE (Browser)                  │
│  index.html (público)  │  admin.html (protegido)     │
│  public.js             │  app.js                     │
│  style.css             │                             │
└──────────────┬──────────────────────────────────────┘
               │ HTTP/REST (fetch API)
               ▼
┌─────────────────────────────────────────────────────┐
│              FastAPI (Render - Python)               │
│                                                      │
│  main.py ──► routers/                               │
│              ├── movies.py    /peliculas             │
│              ├── directors.py /directores            │
│              └── genres.py   /generos                │
│                                                      │
│  models.py (SQLModel + Pydantic)                     │
│  db.py     (SQLModel Engine)                         │
└──────────────┬──────────────────────────────────────┘
               │ PostgreSQL (SQLModel)
               ▼
┌─────────────────────────────────────────────────────┐
│              Neon PostgreSQL (Servidor Remoto)        │
│  tabla: pelicula  │  director  │  genero             │
│  tabla: peliculagenero (N:M)                         │
└─────────────────────────────────────────────────────┘
```

---

## 🗂️ Estructura del Proyecto

```
ProyectoDesarrolloDeSoftware/
├── main.py                  # Entry point FastAPI + rutas HTML
├── requirements.txt
├── index.html               # Vista pública (solo lectura)
├── admin.html               # Panel de administración
├── login.html               # Formulario de acceso admin
├── style.css                # Estilos globales
├── public.js                # JS vista pública
├── app.js                   # JS panel admin
└── app/
    ├── __init__.py
    ├── db.py                # Conexión Neon PostgreSQL
    ├── models.py            # Modelos SQLModel/Pydantic
    └── routers/
        ├── __init__.py
        ├── movies.py        # CRUD Películas
        ├── directors.py     # CRUD Directores
        └── genres.py        # CRUD Géneros
```

---

## 🧩 Modelos de Datos

### Diagrama de Relaciones

```
┌──────────────┐       1:N      ┌──────────────────┐
│   Director   │───────────────►│     Pelicula     │
│──────────────│                │──────────────────│
│ id (PK)      │                │ id (PK)          │
│ nombre       │                │ titulo           │
│ nacionalidad │                │ anio             │
│ anio_nac.    │                │ calificacion     │
│ foto_url     │                │ sinopsis         │
│ biografia    │                │ poster_url       │
└──────────────┘                │ activo           │
                                │ director_id (FK) │
                                └────────┬─────────┘
                                         │ N:M
                                         ▼
                                ┌──────────────────┐
                                │  PeliculaGenero  │
                                │──────────────────│
                                │ pelicula_id (FK) │
                                │ genero_id (FK)   │
                                └────────┬─────────┘
                                         │
                                         ▼
                                ┌──────────────────┐
                                │     Genero       │
                                │──────────────────│
                                │ id (PK)          │
                                │ nombre           │
                                │ descripcion      │
                                └──────────────────┘
```

**Relaciones implementadas:**
- **1:N** — Un Director dirige muchas Películas
- **N:M** — Una Película puede tener varios Géneros (tabla intermedia `PeliculaGenero`)

---

## 📡 Mapa de Endpoints

### 🎬 Películas `/peliculas`

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/peliculas/` | Lista todas las películas (filtros: `titulo`, `activo`) |
| `GET` | `/peliculas/{id}` | Obtiene una película por ID |
| `GET` | `/peliculas/buscar/{titulo}` | Busca películas por título |
| `GET` | `/peliculas/{id}/director` | Obtiene el director de una película (1:N) |
| `GET` | `/peliculas/{id}/generos` | Obtiene los géneros de una película (N:M) |
| `POST` | `/peliculas/` | Crea una nueva película |
| `POST` | `/peliculas/{id}/generos/{genero_id}` | Asigna un género a una película |
| `PATCH` | `/peliculas/{id}` | Actualiza campos de una película |
| `DELETE` | `/peliculas/{id}` | Desactiva una película (soft delete) |
| `DELETE` | `/peliculas/{id}/generos/{genero_id}` | Quita un género de una película |

### 🎬 Directores `/directores`

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/directores/` | Lista todos los directores |
| `GET` | `/directores/{id}` | Obtiene un director por ID |
| `POST` | `/directores/` | Crea un nuevo director |
| `PATCH` | `/directores/{id}` | Actualiza un director |
| `DELETE` | `/directores/{id}` | Elimina un director |

### 🏷️ Géneros `/generos`

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/generos/` | Lista todos los géneros |
| `GET` | `/generos/{id}` | Obtiene un género por ID |
| `POST` | `/generos/` | Crea un nuevo género |
| `DELETE` | `/generos/{id}` | Elimina un género |

---

## ⚙️ Lógica de Negocio

- **Soft Delete**: Las películas no se eliminan físicamente — se marcan como `activo=False`, preservando el historial
- **Validación de integridad**: No se puede crear una película con un `director_id` que no exista
- **Búsqueda flexible**: El endpoint `/buscar/{titulo}` usa `ILIKE` para búsqueda parcial e insensible a mayúsculas
- **Relación N:M protegida**: No se puede asignar el mismo género dos veces a la misma película (llave primaria compuesta)

---

## 🖥️ Frontend

| Página | Ruta | Descripción |
|--------|------|-------------|
| Vista pública | `/` | Catálogo de películas, buscador, filtro por género, dashboard |
| Login | `/login` | Acceso al panel de administración |
| Admin | `/admin` | Gestión completa de películas, directores y géneros |

**Credenciales de acceso al admin:**
- Usuario: `admin`
- Contraseña: `pelis123`

### Funcionalidades del frontend público
- Búsqueda en tiempo real por título
- Filtro por estado (todas / activas)
- Filtro por género
- Modal de detalle con póster, sinopsis, géneros y calificación
- Clic en director para ver su biografía y foto
- Dashboard con estadísticas y gráficas de barras

---

## 🚀 Instalación Local

```bash
# 1. Clonar repositorio
git clone https://github.com/KevinQqs/ProyectoDesarrolloDeSoftware
cd ProyectoDesarrolloDeSoftware

# 2. Crear entorno virtual
python -m venv .venv
source .venv/bin/activate       # Linux/Mac
.venv\Scripts\activate          # Windows

# 3. Instalar dependencias
pip install -r requirements.txt

# 4. Configurar variable de entorno
# Crear archivo .env con:
DATABASE_URL=postgresql://...   # URL de tu base de datos Neon

# 5. Ejecutar
uvicorn main:app --reload
```

Disponible en: `http://localhost:8000`  
Documentación Swagger: `http://localhost:8000/docs`

---

## 🛠️ Tecnologías

| Tecnología | Uso |
|------------|-----|
| **FastAPI** | Framework principal del backend |
| **SQLModel** | ORM + validación Pydantic |
| **PostgreSQL (Neon)** | Base de datos remota |
| **HTML/CSS/JS** | Frontend sin frameworks |
| **Render** | Despliegue en la nube |
| **Python 3.11+** | Lenguaje principal |

---

## 📦 Dependencias

```
fastapi
uvicorn
sqlmodel
psycopg2-binary
python-dotenv
aiofiles
```

---

## 👨‍💻 Autor

**Kevin Quiñones**  
Universidad Católica de Colombia  
Ingeniería de Sistemas y Computación — Desarrollo de Software
