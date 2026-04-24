from sqlmodel import SQLModel, Field, Relationship


class DirectorBase(SQLModel):
    nombre: str
    nacionalidad: str | None = Field(default=None, nullable=True)
    anio_nacimiento: int | None = Field(default=None, nullable=True)

class Director(DirectorBase, table=True):
    id: int | None = Field(default=None, primary_key=True)
    peliculas: list["Pelicula"] = Relationship(back_populates="director")

class DirectorCrear(DirectorBase):
    pass

class DirectorActualizar(SQLModel):
    nombre: str | None = None
    nacionalidad: str | None = None
    anio_nacimiento: int | None = None


class PeliculaGenero(SQLModel, table=True):
    pelicula_id: int = Field(foreign_key="pelicula.id", primary_key=True)
    genero_id: int = Field(foreign_key="genero.id", primary_key=True)


class PeliculaBase(SQLModel):
    titulo: str
    anio: int | None = Field(default=None, nullable=True)
    calificacion: float | None = Field(default=None, nullable=True)
    director_id: int = Field(foreign_key="director.id")

class Pelicula(PeliculaBase, table=True):
    id: int | None = Field(default=None, primary_key=True)
    director: Director = Relationship(back_populates="peliculas")
    generos: list["Genero"] = Relationship(back_populates="peliculas", link_model=PeliculaGenero)

class PeliculaCrear(PeliculaBase):
    pass

class PeliculaActualizar(SQLModel):
    titulo: str | None = None
    anio: int | None = None
    calificacion: float | None = None
    director_id: int | None = None


class GeneroBase(SQLModel):
    nombre: str
    descripcion: str | None = Field(default=None, nullable=True)

class Genero(GeneroBase, table=True):
    id: int | None = Field(default=None, primary_key=True)
    peliculas: list["Pelicula"] = Relationship(back_populates="generos", link_model=PeliculaGenero)

class GeneroCrear(GeneroBase):
    pass