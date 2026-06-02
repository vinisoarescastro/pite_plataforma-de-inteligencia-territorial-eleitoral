# Configuração do banco de dados. SQLAlchemy faz a ponte entre Python e o PostgreSQL.

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from settings import settings

# Engine é a "conexão" com o banco. A URL vem do arquivo .env (DATABASE_URL).
engine = create_engine(settings.database_url)

# SessionLocal é a fábrica de sessões — cada requisição abre e fecha uma sessão.
SessionLocal = sessionmaker(bind=engine)


class Base(DeclarativeBase):
    """Classe base para todos os modelos do banco. Todo model herda dessa classe."""
    pass


def get_db():
    """
    Dependency injection do FastAPI: abre uma sessão do banco para cada requisição
    e garante que ela seja fechada ao final, mesmo se ocorrer um erro.
    Use com `db: Session = Depends(get_db)` nas rotas.
    """
    db = SessionLocal()
    try:
        yield db      # entrega a sessão para a rota
    finally:
        db.close()    # fecha sempre, com ou sem erro
