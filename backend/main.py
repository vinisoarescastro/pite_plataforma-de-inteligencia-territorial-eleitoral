from fastapi import FastAPI
from auth.router import router as auth_router
from users.router import router as users_router
from eleicoes.router import router as eleicoes_router
from resultados.router import router as resultados_router

app = FastAPI(title="PITE API", version="0.1.0")

app.include_router(auth_router)
app.include_router(users_router)
app.include_router(eleicoes_router)
app.include_router(resultados_router)


@app.get("/health")
def health():
    return {"status": "ok"}
