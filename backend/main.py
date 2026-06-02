# Ponto de entrada da API. Aqui o FastAPI é criado e os módulos são registrados.

from fastapi import FastAPI
from auth.router import router as auth_router

# FastAPI() cria a aplicação. Acesse a documentação automática em /docs após subir o servidor.
app = FastAPI(title="PITE API", version="0.1.0")

# include_router() conecta as rotas de autenticação (tudo em /auth/...)
app.include_router(auth_router)


@app.get("/health")
def health():
    """Rota simples para verificar se a API está no ar. Retorna {"status": "ok"}."""
    return {"status": "ok"}
