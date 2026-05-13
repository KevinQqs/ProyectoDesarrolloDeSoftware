# 🎬 PelisB API

API REST para gestionar películas, directores y géneros, construida con **FastAPI** y almacenamiento en archivos CSV.

## 📋 Requisitos

- Python 3.10+

## 🚀 Instalación

```bash
# Clonar el repositorio
git clone <url-del-repo>
cd ProyectoDesarrolloDeSoftware

# Crear entorno virtual
python -m venv venv
source venv/bin/activate        # Linux/Mac
venv\Scripts\activate           # Windows

# Instalar dependencias
pip install -r requirements.txt
```

## ▶️ Ejecutar la API

```bash
uvicorn main:app --reload
```

La API estará disponible en: http://localhost:8000  
Documentación interactiva: http://localhost:8000/docs

## 📚 Endpoints

### Películas `/peliculas`
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/peliculas/` | Listar todas (filtros: `titulo`, `activo`) |
| GET | `/peliculas/{id}` | Obtener por ID |
| GET | `/peliculas/buscar/{titulo}` | Buscar por título |
| GET | `/peliculas/{id}/director` | Ver director de la película |
| POST | `/peliculas/` | Crear nueva película |
| PATCH | `/peliculas/{id}` | Actualizar película |
| DELETE | `/peliculas/{id}` | Desactivar (soft delete) |

### Directores `/directores`
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/directores/` | Listar todos |
| GET | `/directores/{id}` | Obtener por ID |
| POST | `/directores/` | Crear director |
| PATCH | `/directores/{id}` | Actualizar director |
| DELETE | `/directores/{id}` | Eliminar director |

### Géneros `/generos`
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/generos/` | Listar todos |
| GET | `/generos/{id}` | Obtener por ID |
| POST | `/generos/` | Crear género |
| DELETE | `/generos/{id}` | Eliminar género |

## 🗂️ Estructura del proyecto
├── main.py
├── requirements.txt
├── app/
│   ├── init.py
│   ├── db.py
│   ├── models.py
│   └── routers/
│       ├── init.py
│       ├── movies.py
│       ├── directors.py
│       └── genres.py
└── datos/
├── pelicula.csv
├── director.csv
└── genero.csv

## 📝 Notas

- El delete de películas es un **soft delete** (marca `activo=False`).
- Los datos se persisten en archivos CSV dentro de la carpeta `datos/`.