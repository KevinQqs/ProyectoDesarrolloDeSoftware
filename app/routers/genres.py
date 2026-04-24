from fastapi import APIRouter, HTTPException
from app.models import Genero, GeneroCrear
from app.db import leer_todos, escribir_todos, obtener_siguiente_id

router = APIRouter(prefix="/generos", tags=["generos"])


@router.get("/", response_model=list[Genero])
def obtener_generos():
    registros = leer_todos(Genero)
    return [Genero(**r) for r in registros]


@router.get("/{genero_id}", response_model=Genero)
def obtener_genero(genero_id: int):
    registros = leer_todos(Genero)
    for r in registros:
        if int(r["id"]) == genero_id:
            return Genero(**r)
    raise HTTPException(status_code=404, detail="Género no encontrado")


@router.post("/", response_model=Genero, status_code=201)
def crear_genero(genero: GeneroCrear):
    registros = leer_todos(Genero)
    nuevo = Genero(id=obtener_siguiente_id(registros), **genero.model_dump())
    registros.append(nuevo.model_dump())
    escribir_todos(Genero, registros)
    return nuevo


@router.delete("/{genero_id}", status_code=204)
def eliminar_genero(genero_id: int):
    registros = leer_todos(Genero)
    filtrados = [r for r in registros if int(r["id"]) != genero_id]
    if len(filtrados) == len(registros):
        raise HTTPException(status_code=404, detail="Género no encontrado")
    escribir_todos(Genero, filtrados)