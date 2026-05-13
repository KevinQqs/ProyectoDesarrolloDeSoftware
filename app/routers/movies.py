from fastapi import APIRouter, HTTPException, Depends
from sqlmodel import Session, select
from app.models import Pelicula, PeliculaCrear, PeliculaActualizar, Director
from app.db import get_session

router = APIRouter(prefix="/peliculas", tags=["peliculas"])


@router.get("/", response_model=list[Pelicula])
def obtener_peliculas(titulo: str = None, activo: bool = None, session: Session = Depends(get_session)):
    query = select(Pelicula)
    if activo is not None:
        query = query.where(Pelicula.activo == activo)
    if titulo:
        query = query.where(Pelicula.titulo.contains(titulo))
    return session.exec(query).all()


@router.get("/buscar/{titulo}", response_model=list[Pelicula])
def buscar_por_titulo(titulo: str, session: Session = Depends(get_session)):
    query = select(Pelicula).where(Pelicula.titulo.contains(titulo))
    resultado = session.exec(query).all()
    if not resultado:
        raise HTTPException(status_code=404, detail="No se encontraron películas")
    return resultado


@router.get("/{pelicula_id}", response_model=Pelicula)
def obtener_pelicula(pelicula_id: int, session: Session = Depends(get_session)):
    pelicula = session.get(Pelicula, pelicula_id)
    if not pelicula:
        raise HTTPException(status_code=404, detail="Película no encontrada")
    return pelicula


@router.get("/{pelicula_id}/director", response_model=Director)
def obtener_director_pelicula(pelicula_id: int, session: Session = Depends(get_session)):
    pelicula = session.get(Pelicula, pelicula_id)
    if not pelicula:
        raise HTTPException(status_code=404, detail="Película no encontrada")
    director = session.get(Director, pelicula.director_id)
    if not director:
        raise HTTPException(status_code=404, detail="Director no encontrado")
    return director


@router.post("/", response_model=Pelicula, status_code=201)
def crear_pelicula(pelicula: PeliculaCrear, session: Session = Depends(get_session)):
    director = session.get(Director, pelicula.director_id)
    if not director:
        raise HTTPException(status_code=404, detail="Director no encontrado")
    nueva = Pelicula(**pelicula.model_dump(), activo=True)
    session.add(nueva)
    session.commit()
    session.refresh(nueva)
    return nueva


@router.patch("/{pelicula_id}", response_model=Pelicula)
def actualizar_pelicula(pelicula_id: int, datos: PeliculaActualizar, session: Session = Depends(get_session)):
    pelicula = session.get(Pelicula, pelicula_id)
    if not pelicula:
        raise HTTPException(status_code=404, detail="Película no encontrada")
    for key, value in datos.model_dump(exclude_unset=True).items():
        setattr(pelicula, key, value)
    session.add(pelicula)
    session.commit()
    session.refresh(pelicula)
    return pelicula


@router.delete("/{pelicula_id}")
def eliminar_pelicula(pelicula_id: int, session: Session = Depends(get_session)):
    pelicula = session.get(Pelicula, pelicula_id)
    if not pelicula:
        raise HTTPException(status_code=404, detail="Película no encontrada")
    pelicula.activo = False
    session.add(pelicula)
    session.commit()
    return {"mensaje": "Película desactivada"}