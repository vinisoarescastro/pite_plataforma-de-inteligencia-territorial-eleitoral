from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from settings import settings
from auth.router import router as auth_router
from users.router import router as users_router
from eleicoes.router import router as eleicoes_router
from resultados.router import router as resultados_router
from importacao.router import router as importacao_router

app = FastAPI(title="PITE API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.cors_origins.split(",")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(users_router)
app.include_router(eleicoes_router)
app.include_router(resultados_router)
app.include_router(importacao_router)


@app.get("/health")
def health():
    return {"status": "ok"}
