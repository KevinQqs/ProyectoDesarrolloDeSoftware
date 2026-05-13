from fastapi import APIRouter, HTTPException, Depends
from sqlmodel import Session, select
from app.models import Genero, GeneroCrear
from app.db import get_session

router = APIRouter(prefix="/generos", tags=["generos"])


@router.get("/", response_model=list[Genero])
def obtener_generos(session: Session = Depends(get_session)):
    return session.exec(select(Genero)).all()


@router.get("/{genero_id}", response_model=Genero)
def obtener_genero(genero_id: int, session: Session = Depends(get_session)):
    genero = session.get(Genero, genero_id)
    if not genero:
        raise HTTPException(status_code=404, detail="Género no encontrado")
    return genero


@router.post("/", response_model=Genero, status_code=201)
def crear_genero(genero: GeneroCrear, session: Session = Depends(get_session)):
    nuevo = Genero(**genero.model_dump())
    session.add(nuevo)
    session.commit()
    session.refresh(nuevo)
    return nuevo


@router.delete("/{genero_id}", status_code=204)
def eliminar_genero(genero_id: int, session: Session = Depends(get_session)):
    genero = session.get(Genero, genero_id)
    if not genero:
        raise HTTPException(status_code=404, detail="Género no encontrado")
    session.delete(genero)
    session.commit()