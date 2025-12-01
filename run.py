from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os

app = FastAPI()

# Archivos estáticos
app.mount("/html", StaticFiles(directory="html"), name="html")
app.mount("/css", StaticFiles(directory="css"), name="css")
app.mount("/js", StaticFiles(directory="js"), name="js")
app.mount("/json", StaticFiles(directory="json"), name="json")
app.mount("/img", StaticFiles(directory="img"), name="img")

# Landing page por defecto
@app.get("/")
def landing():
    return FileResponse(os.path.join("html", "landing.html"))

# Acceso directo al index (si lo querés separado)
@app.get("/index")
def index():
    return FileResponse(os.path.join("html", "index.html"))
