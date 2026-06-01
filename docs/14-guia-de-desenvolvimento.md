# 14 — Guia de Desenvolvimento

> Documentação técnica de como configurar, rodar e evoluir o projeto localmente.  
> Atualizado em: 2026-06-01

---

## Índice

1. [Pré-requisitos](#1-pré-requisitos)
2. [Estrutura do Projeto](#2-estrutura-do-projeto)
3. [Configuração do Ambiente](#3-configuração-do-ambiente)
4. [Banco de Dados — Supabase](#4-banco-de-dados--supabase)
5. [Backend — FastAPI](#5-backend--fastapi)
6. [Migrations — Alembic](#6-migrations--alembic)
7. [Módulos Implementados](#7-módulos-implementados)
8. [Como Adicionar um Novo Módulo](#8-como-adicionar-um-novo-módulo)
9. [Problemas Conhecidos e Soluções](#9-problemas-conhecidos-e-soluções)
10. [Próximos Passos](#10-próximos-passos)

---

## 1. Pré-requisitos

| Ferramenta | Versão | Download |
|---|---|---|
| Python | 3.12+ | [python.org](https://www.python.org/) |
| Node.js | 20+ | [nodejs.org](https://nodejs.org/) |
| Git | Qualquer | [git-scm.com](https://git-scm.com/) |
| Conta Supabase | — | [supabase.com](https://supabase.com/) |

---

## 2. Estrutura do Projeto

```
pite/
│
├── .env                        # Variáveis de ambiente (não versionado)
├── .env.example                # Template do .env
├── .gitignore
├── README.md
│
├── docs/                       # Documentação
│
├── backend/                    # API Python + FastAPI
│   ├── main.py                 # Entry point
│   ├── settings.py             # Configurações via .env
│   ├── database.py             # Conexão SQLAlchemy + Supabase
│   ├── dependencies.py         # Injeção de dependências (futuro)
│   ├── requirements.txt        # Dependências Python
│   │
│   ├── core/
│   │   └── security.py         # JWT, bcrypt, hash de senha
│   │
│   ├── models/
│   │   └── user.py             # Model SQLAlchemy — tabela users
│   │
│   ├── modules/
│   │   └── auth/
│   │       ├── router.py       # POST /auth/login
│   │       ├── schemas.py      # LoginRequest, TokenResponse
│   │       └── service.py      # Lógica de autenticação
│   │
│   ├── migrations/             # Alembic
│   │   ├── env.py
│   │   └── versions/
│   │       └── 0f08b7443f87_create_users_table.py
│   │
│   └── seeds/                  # Dados iniciais
│
├── frontend/                   # React 18 + Vite (a implementar)
│
├── import-scripts/             # Scripts de importação TSE (a implementar)
│
└── data/                       # Dados brutos — não versionado
```

---

## 3. Configuração do Ambiente

### 3.1 Clonar e criar o ambiente virtual

```bash
git clone <url-do-repositorio>
cd pite

# Criar ambiente virtual na raiz
python -m venv .venv

# Ativar — Windows
.venv\Scripts\activate

# Ativar — Linux/macOS
source .venv/bin/activate
```

### 3.2 Instalar dependências do backend

```bash
cd backend
pip install -r requirements.txt
```

### 3.3 Configurar o `.env`

Copie o `.env.example` e preencha:

```bash
cp .env.example .env
```

Conteúdo do `.env`:

```ini
# Supabase — Session Pooler (porta 5432)
# Caracteres especiais na senha devem ser URL-encoded:
#   @ → %40   [ → %5B   ] → %5D   # → %23
DATABASE_URL=postgresql://postgres.REFERENCIA:SENHA@aws-X-REGIAO.pooler.supabase.com:5432/postgres?sslmode=require

# JWT — gere com: python -c "import secrets; print(secrets.token_hex(32))"
JWT_SECRET_KEY=sua-chave-secreta-aqui
JWT_ALGORITHM=HS256
JWT_EXPIRATION_MINUTES=15
```

> **Atenção:** Se a senha contiver `@`, `[`, `]` ou outros caracteres especiais,
> use URL encoding. Exemplo: `Agecom2014@@@` → `Agecom2014%40%40%40`

---

## 4. Banco de Dados — Supabase

### 4.1 Criar projeto no Supabase

1. Acesse [supabase.com](https://supabase.com) e crie um projeto
2. Anote a senha do banco durante a criação
3. Vá em **Project Settings → Database → Connect → Session pooler**
4. Copie a URI e cole no `.env`

### 4.2 Habilitar PostGIS

No **SQL Editor** do Supabase:

```sql
CREATE EXTENSION IF NOT EXISTS postgis;
SELECT postgis_version(); -- deve retornar 3.x
```

### 4.3 Testar a conexão

```bash
cd backend
python -c "
from database import engine
from sqlalchemy import text
with engine.connect() as conn:
    print('PostGIS:', conn.execute(text('SELECT postgis_version()')).scalar())
"
```

Resultado esperado:
```
PostGIS: 3.3 USE_GEOS=1 USE_PROJ=1 USE_STATS=1
```

---

## 5. Backend — FastAPI

### 5.1 Arquivos base

**`backend/settings.py`**
```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    database_url: str
    jwt_secret_key: str
    jwt_algorithm: str = "HS256"
    jwt_expiration_minutes: int = 15

    class Config:
        env_file = "../.env"

settings = Settings()
```

**`backend/database.py`**
```python
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from settings import settings

engine = create_engine(settings.database_url)
SessionLocal = sessionmaker(bind=engine)

class Base(DeclarativeBase):
    pass

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

**`backend/main.py`**
```python
from fastapi import FastAPI
from modules.auth.router import router as auth_router

app = FastAPI(title="PITE API", version="0.1.0")

app.include_router(auth_router)

@app.get("/health")
def health():
    return {"status": "ok"}
```

### 5.2 Subir o servidor

```bash
cd backend
uvicorn main:app --reload
```

| URL | Descrição |
|---|---|
| `http://localhost:8000/health` | Health check |
| `http://localhost:8000/docs` | Swagger UI |
| `http://localhost:8000/redoc` | ReDoc |

### 5.3 Testar via terminal (alternativa ao navegador)

```bash
python -c "
import urllib.request, json
data = json.dumps({'email':'admin@pite.com','password':'Admin@2025'}).encode()
req = urllib.request.Request(
    'http://127.0.0.1:8000/auth/login',
    data=data,
    headers={'Content-Type':'application/json'},
    method='POST'
)
res = urllib.request.urlopen(req)
print(json.loads(res.read()))
"
```

---

## 6. Migrations — Alembic

### 6.1 Configuração do `env.py`

O `migrations/env.py` foi configurado para:
- Importar o `engine` e `Base` do `database.py`
- Ignorar tabelas do PostGIS (`spatial_ref_sys`, `geometry_columns` etc.)
- Usar `include_object` para filtrar tabelas automaticamente

```python
POSTGIS_TABLES = {
    "spatial_ref_sys", "geometry_columns",
    "geography_columns", "raster_columns", "raster_overviews"
}

def include_object(object, name, type_, reflected, compare_to):
    if type_ == "table" and name in POSTGIS_TABLES:
        return False
    return True
```

> **Importante:** Sempre que criar um novo model, importe-o no `env.py`:
> ```python
> from models import user, candidate  # adicione aqui
> ```

### 6.2 Criar e aplicar migrations

```bash
# Gerar migration a partir dos models
alembic revision --autogenerate -m "descricao da migration"

# Revisar o arquivo gerado em migrations/versions/
# Remover qualquer drop_table de tabelas PostGIS se aparecer

# Aplicar no banco
alembic upgrade head
```

### 6.3 Outros comandos úteis

```bash
alembic current          # migration atual aplicada
alembic history          # histórico de migrations
alembic downgrade -1     # desfazer a última migration
```

---

## 7. Módulos Implementados

### 7.1 `users` — Tabela de usuários

**Migration:** `0f08b7443f87_create_users_table.py`

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | UUID | Chave primária |
| `name` | String(120) | Nome completo |
| `email` | String(255) | E-mail único (index) |
| `password_hash` | String(255) | Senha hasheada com bcrypt |
| `profile` | Enum | `administrador`, `gestor`, `analista`, `assessor` |
| `is_active` | Boolean | Conta ativa ou inativa |
| `created_at` | DateTime | Data de criação (automático) |
| `updated_at` | DateTime | Última atualização (automático) |

**Criar usuário admin (seed manual):**
```bash
cd backend
python -c "
from database import SessionLocal
from models.user import User, UserProfile
from core.security import hash_password
import uuid

db = SessionLocal()
db.add(User(
    id=uuid.uuid4(),
    name='Vinícius Soares',
    email='admin@pite.com',
    password_hash=hash_password('Admin@2025'),
    profile=UserProfile.administrador,
    is_active=True
))
db.commit()
print('Admin criado!')
db.close()
"
```

### 7.2 `auth` — Autenticação JWT

**Endpoint:** `POST /auth/login`

Request:
```json
{
  "email": "admin@pite.com",
  "password": "Admin@2025"
}
```

Response `200 OK`:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user_name": "Vinícius Soares",
  "user_profile": "administrador"
}
```

Response `401 Unauthorized`:
```json
{
  "detail": "E-mail ou senha incorretos."
}
```

---

## 8. Como Adicionar um Novo Módulo

Exemplo: adicionar o módulo `candidates`.

**Passo 1 — Criar o model:**
```bash
# backend/models/candidate.py
```

**Passo 2 — Importar no `migrations/env.py`:**
```python
from models import user, candidate  # adicionar aqui
```

**Passo 3 — Criar a migration:**
```bash
alembic revision --autogenerate -m "create candidates table"
alembic upgrade head
```

**Passo 4 — Criar a estrutura do módulo:**
```
backend/modules/candidates/
├── __init__.py
├── router.py       # endpoints HTTP
├── schemas.py      # Pydantic models
├── service.py      # lógica de negócio
└── repository.py   # queries ao banco
```

**Passo 5 — Registrar o router no `main.py`:**
```python
from modules.candidates.router import router as candidates_router
app.include_router(candidates_router)
```

---

## 9. Problemas Conhecidos e Soluções

### `ModuleNotFoundError: No module named 'database'`
**Causa:** Comando rodado fora da pasta `backend/`.  
**Solução:** `cd backend` antes de rodar qualquer comando Python.

### `password authentication failed for user "postgres"`
**Causa:** Senha com caracteres especiais não está URL-encoded na `DATABASE_URL`.  
**Solução:** Encode os caracteres especiais:
```python
import urllib.parse
print(urllib.parse.quote("SuaSenha@123", safe=""))
# SuaSenha%40123
```

### `cannot drop table spatial_ref_sys`
**Causa:** Alembic detectou tabelas do PostGIS como "removidas" e gerou `drop_table`.  
**Solução:** Remover manualmente o `op.drop_table('spatial_ref_sys')` do arquivo de migration gerado. O `env.py` já foi configurado com `include_object` para evitar isso nas próximas migrations.

### `error reading bcrypt version` / `passlib` incompatível
**Causa:** Versão nova do `bcrypt` incompatível com `passlib`.  
**Solução:**
```bash
pip install "bcrypt==4.0.1"
```

### `email-validator is not installed`
**Causa:** `EmailStr` do Pydantic requer o pacote `email-validator`.  
**Solução:**
```bash
pip install "pydantic[email]"
```

### Swagger (`/docs`) não abre no navegador
**Causa:** Provável bloqueio de firewall ou rede.  
**Solução alternativa — testar via terminal:**
```bash
python -c "
import urllib.request, json
data = json.dumps({'email':'admin@pite.com','password':'Admin@2025'}).encode()
req = urllib.request.Request('http://127.0.0.1:8000/auth/login', data=data, headers={'Content-Type':'application/json'}, method='POST')
print(json.loads(urllib.request.urlopen(req).read()))
"
```

---

## 10. Próximos Passos

| Ordem | Módulo | Descrição |
|---|---|---|
| 1 | `candidates` | CRUD de candidatos e pré-candidatos |
| 2 | `elections` | Eleições e candidaturas vinculadas ao TSE |
| 3 | `results` | Importação de CSV do TSE → banco |
| 4 | `territories` | Classificação territorial e índice de força |
| 5 | `polls` | Pesquisas eleitorais |
| 6 | `dashboard` | Painel analítico por perfil |
| 7 | Frontend | React 18 + Vite consumindo a API |
