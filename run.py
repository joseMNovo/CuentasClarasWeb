from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import uvicorn
import os

app = FastAPI()

# Montar carpetas estáticas
app.mount("/html", StaticFiles(directory="html"), name="html")
app.mount("/css", StaticFiles(directory="css"), name="css")
app.mount("/js", StaticFiles(directory="js"), name="js")

# Ruta principal para servir el index.html
@app.get("/")
def root():
    return FileResponse(os.path.join("html", "index.html"))

if __name__ == "__main__":
    uvicorn.run("python.endpoints:app", host="127.0.0.1", port=8000, reload=True) 