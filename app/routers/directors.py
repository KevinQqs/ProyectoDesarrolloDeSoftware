from fastapi import APIRouter, HTTPException, Depends
from sqlmodel import Session, select
from app.models import Director, DirectorCrear, DirectorActualizar
from app.db import get_session

router = APIRouter(prefix="/directores", tags=["directores"])


@router.get("/", response_model=list[Director])
def obtener_directores(session: Session = Depends(get_session)):
    return session.exec(select(Director)).all()


@router.get("/{director_id}", response_model=Director)
def obtener_director(director_id: int, session: Session = Depends(get_session)):
    director = session.get(Director, director_id)
    if not director:
        raise HTTPException(status_code=404, detail="Director no encontrado")
    return director


@router.post("/", response_model=Director, status_code=201)
def crear_director(director: DirectorCrear, session: Session = Depends(get_session)):
    nuevo = Director(**director.model_dump())
    session.add(nuevo)
    session.commit()
    session.refresh(nuevo)
    return nuevo


@router.patch("/{director_id}", response_model=Director)
def actualizar_director(director_id: int, datos: DirectorActualizar, session: Session = Depends(get_session)):
    director = session.get(Director, director_id)
    if not director:
        raise HTTPException(status_code=404, detail="Director no encontrado")
    for key, value in datos.model_dump(exclude_unset=True).items():
        setattr(director, key, value)
    session.add(director)
    session.commit()
    session.refresh(director)
    return director


@router.delete("/{director_id}", status_code=204)
def eliminar_director(director_id: int, session: Session = Depends(get_session)):
    director = session.get(Director, director_id)
    if not director:
        raise HTTPException(status_code=404, detail="Director no encontrado")
    session.delete(director)
    session.commit()