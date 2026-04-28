from fastapi import APIRouter, HTTPException
from app.models import Pelicula, PeliculaCrear, PeliculaActualizar, Director
from app.db import leer_todos, escribir_todos, obtener_siguiente_id

router = APIRouter(prefix="/peliculas", tags=["peliculas"])


@router.get("/", response_model=list[Pelicula])
def obtener_peliculas(titulo: str = None, activo: bool = True):
    registros = leer_todos(Pelicula)

    resultado = [r for r in registros if r.get("activo", True) == activo]

    if titulo:
        resultado = [
            r for r in resultado
            if titulo.lower() in r["titulo"].lower()
        ]

    return [Pelicula(**r) for r in resultado]

@router.get("/buscar/{titulo}", response_model=list[Pelicula])
def buscar_por_titulo(titulo: str):
    registros = leer_todos(Pelicula)

    resultado = [
        r for r in registros
        if titulo.lower() in r["titulo"].lower()
    ]

    if not resultado:
        raise HTTPException(status_code=404, detail="No se encontraron películas")

    return [Pelicula(**r) for r in resultado]

@router.get("/{pelicula_id}", response_model=Pelicula)
def obtener_pelicula(pelicula_id: int):
    registros = leer_todos(Pelicula)
    for r in registros:
        if int(r["id"]) == pelicula_id:
            return Pelicula(**r)
    raise HTTPException(status_code=404, detail="Película no encontrada")


@router.get("/{pelicula_id}/director", response_model=Director)
def obtener_director_pelicula(pelicula_id: int):
    peliculas = leer_todos(Pelicula)
    for r in peliculas:
        if int(r["id"]) == pelicula_id:
            directores = leer_todos(Director)
            for d in directores:
                if int(d["id"]) == int(r["director_id"]):
                    return Director(**d)
            raise HTTPException(status_code=404, detail="Director no encontrado")
    raise HTTPException(status_code=404, detail="Película no encontrada")


@router.post("/", response_model=Pelicula, status_code=201)
def crear_pelicula(pelicula: PeliculaCrear):
    directores = leer_todos(Director)
    if not any(int(d["id"]) == pelicula.director_id for d in directores):
        raise HTTPException(status_code=404, detail="Director no encontrado")
    registros = leer_todos(Pelicula)
    data = pelicula.model_dump()
    data["activo"] = True

    nueva = Pelicula(id=obtener_siguiente_id(registros), **data)
    registros.append(nueva.model_dump())
    escribir_todos(Pelicula, registros)
    return nueva


@router.patch("/{pelicula_id}", response_model=Pelicula)
def actualizar_pelicula(pelicula_id: int, datos: PeliculaActualizar):
    registros = leer_todos(Pelicula)
    for r in registros:
        if int(r["id"]) == pelicula_id:
            actualizado = {**r, **{k: v for k, v in datos.model_dump().items() if v is not None}}
            registros[registros.index(r)] = actualizado
            escribir_todos(Pelicula, registros)
            return Pelicula(**actualizado)
    raise HTTPException(status_code=404, detail="Película no encontrada")


@router.delete("/{pelicula_id}")
def eliminar_pelicula(pelicula_id: int):
    registros = leer_todos(Pelicula)

    for r in registros:
        if int(r["id"]) == pelicula_id:
            r["activo"] = False
            escribir_todos(Pelicula, registros)
            return {"mensaje": "Película desactivada"}

    raise HTTPException(status_code=404, detail="Película no encontrada")