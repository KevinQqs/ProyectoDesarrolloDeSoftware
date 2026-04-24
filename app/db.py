import csv
import os
from typing import Type
from sqlmodel import SQLModel

DIRECTORIO_DATOS = "datos"

def obtener_ruta_csv(modelo: Type[SQLModel]) -> str:
    os.makedirs(DIRECTORIO_DATOS, exist_ok=True)
    return os.path.join(DIRECTORIO_DATOS, f"{modelo.__tablename__}.csv")

def leer_todos(modelo: Type[SQLModel]) -> list[dict]:
    ruta = obtener_ruta_csv(modelo)
    if not os.path.exists(ruta):
        return []
    with open(ruta, newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))

def escribir_todos(modelo: Type[SQLModel], registros: list[dict]) -> None:
    ruta = obtener_ruta_csv(modelo)
    if not registros:
        return
    with open(ruta, "w", newline="", encoding="utf-8") as f:
        escritor = csv.DictWriter(f, fieldnames=registros[0].keys())
        escritor.writeheader()
        escritor.writerows(registros)

def obtener_siguiente_id(registros: list[dict]) -> int:
    if not registros:
        return 1
    return max(int(r["id"]) for r in registros) + 1