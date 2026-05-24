from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from app.routers import movies, directors, genres
from app.db import crear_tablas

app = FastAPI(
    title="PelisB",
    description="API para buscar y gestionar películas, directores y géneros",
    version="1.0.0"
)

@app.on_event("startup")
def on_startup():
    crear_tablas()

app.include_router(movies.router)
app.include_router(directors.router)
app.include_router(genres.router)

app.mount("/static", StaticFiles(directory="."), name="static")

@app.get("/")
def index():
    return FileResponse("index.html")