from fastapi import FastAPI
from app.routers import movies, directors, genres

app = FastAPI(
    title="PelisB",
    description="API para buscar y gestionar películas, directores y géneros",
    version="1.0.0"
)

app.include_router(movies.router)
app.include_router(directors.router)
app.include_router(genres.router)