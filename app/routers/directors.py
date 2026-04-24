from fastapi import APIRouter, HTTPException
from app.models import Director, DirectorCrear, DirectorActualizar
from app.db import leer_todos, escribir_todos, obtener_siguiente_id

router = APIRouter(prefix="/directores", tags=["directores"])


@router.get("/", response_model=list[Director])
def obtener_directores():
    registros = leer_todos(Director)
    return [Director(**r) for r in registros]


@router.get("/{director_id}", response_model=Director)
def obtener_director(director_id: int):
    registros = leer_todos(Director)
    for r in registros:
        if int(r["id"]) == director_id:
            return Director(**r)
    raise HTTPException(status_code=404, detail="Director no encontrado")


@router.post("/", response_model=Director, status_code=201)
def crear_director(director: DirectorCrear):
    registros = leer_todos(Director)
    nuevo = Director(id=obtener_siguiente_id(registros), **director.model_dump())
    registros.append(nuevo.model_dump())
    escribir_todos(Director, registros)
    return nuevo


@router.patch("/{director_id}", response_model=Director)
def actualizar_director(director_id: int, datos: DirectorActualizar):
    registros = leer_todos(Director)
    for r in registros:
        if int(r["id"]) == director_id:
            actualizado = {**r, **{k: v for k, v in datos.model_dump().items() if v is not None}}
            registros[registros.index(r)] = actualizado
            escribir_todos(Director, registros)
            return Director(**actualizado)
    raise HTTPException(status_code=404, detail="Director no encontrado")


@router.delete("/{director_id}", status_code=204)
def eliminar_director(director_id: int):
    registros = leer_todos(Director)
    filtrados = [r for r in registros if int(r["id"]) != director_id]
    if len(filtrados) == len(registros):
        raise HTTPException(status_code=404, detail="Director no encontrado")
    escribir_todos(Director, filtrados)