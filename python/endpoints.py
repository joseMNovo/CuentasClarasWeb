from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
import uvicorn
import os
import sys
from loguru import logger
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from python.app_client import calcular_cuentas, agregar_a_historial, obtener_historial, eliminar_registro_historial

app = FastAPI()

# Montar carpetas estáticas
app.mount("/html", StaticFiles(directory="html"), name="html")
app.mount("/css", StaticFiles(directory="css"), name="css")
app.mount("/js", StaticFiles(directory="js"), name="js")
app.mount("/json", StaticFiles(directory="json"), name="json")
app.mount("/img", StaticFiles(directory="img"), name="img")

# Ruta principal para servir el landing.html
@app.get("/")
def root():
    return FileResponse(os.path.join("html", "landing.html"))

@app.post("/api/calcular")
async def api_calcular(request: Request):
    data = await request.json()
    sueldo1 = data.get("sueldo1", "")
    sueldo2 = data.get("sueldo2", "")
    total = data.get("total", "")
    resultado = calcular_cuentas(sueldo1, sueldo2, total)
    logger.info(f"Resultado de calcular_cuentas: {resultado}")
    return JSONResponse(content=resultado)

@app.post("/api/agregar_historial")
async def api_agregar_historial(request: Request):
    data = await request.json()
    sueldo1 = data.get("sueldo1", "")
    sueldo2 = data.get("sueldo2", "")
    total = data.get("total", "")
    resultado = agregar_a_historial(sueldo1, sueldo2, total)
    logger.info(f"Resultado de agregar_a_historial: {resultado}")
    return JSONResponse(content=resultado)

@app.get("/api/historial")
def api_historial():
    logger.info("Obteniendo historial")
    return JSONResponse(content=obtener_historial())

@app.delete("/api/historial/{id_registro}")
def api_eliminar_historial(id_registro: str):
    logger.info(f"Eliminando registro de historial: {id_registro}")
    ok = eliminar_registro_historial(id_registro)
    return JSONResponse(content={"success": ok})

if __name__ == "__main__":
    logger.info("Iniciando servidor...")
    uvicorn.run("python.run:app", host="127.0.0.1", port=8000, reload=True) 