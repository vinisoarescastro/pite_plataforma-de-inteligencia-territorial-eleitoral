# 14 — Guia de Desenvolvimento

> Documentação técnica de como configurar, rodar e evoluir o projeto localmente.  
> Atualizado em: 2026-06-05 (v5)

---

## Índice

1. [Pré-requisitos](#1-pré-requisitos)
2. [Estrutura do Projeto](#2-estrutura-do-projeto)
3. [Configuração do Ambiente](#3-configuração-do-ambiente)
4. [Banco de Dados — Supabase](#4-banco-de-dados--supabase)
5. [Backend — FastAPI](#5-backend--fastapi)
6. [Migrations — Alembic](#6-migrations--alembic)
7. [Módulos Implementados](#7-módulos-implementados)
8. [Scripts de Importação e Geração de Dados](#8-scripts-de-importação-e-geração-de-dados)
9. [Como Adicionar um Novo Módulo](#9-como-adicionar-um-novo-módulo)
10. [Problemas Conhecidos e Soluções](#10-problemas-conhecidos-e-soluções)
11. [Próximos Passos](#11-próximos-passos)

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
│   ├── dependencies.py         # get_current_user, require_admin
│   ├── security.py             # JWT, bcrypt, hash_password, decode_token
│   ├── requirements.txt        # Dependências Python
│   │
│   ├── models/
│   │   └── user.py             # Model SQLAlchemy — tabela users
│   │
│   ├── auth/
│   │   ├── router.py           # POST /auth/login
│   │   ├── schemas.py          # LoginRequest, TokenResponse
│   │   └── service.py          # Lógica de autenticação + atualiza last_login
│   │
│   ├── users/
│   │   ├── router.py           # GET/POST /users, PUT/PATCH /users/{id}
│   │   └── schemas.py          # UserResponse, UserCreate, UserUpdate
│   │
│   ├── migrations/             # Alembic
│   │   ├── env.py
│   │   └── versions/
│   │       ├── 0f08b7443f87_create_users_table.py
│   │       └── b9e3f1a2c847_add_user_permissions_and_last_login.py
│   │
│   └── seeds/                  # Dados iniciais
│
├── frontend/                   # React 19 + Vite + TypeScript
│   ├── index.html              # Plus Jakarta Sans + Font Awesome 6.5 (CDN)
│   ├── vite.config.ts          # Proxy /auth e /users → localhost:8000
│   ├── public/
│   │   └── geo/
│   │       └── municipios_br.json  # GeoJSON IBGE 2022 (5.570 municípios)
│   ├── tsconfig.json
│   └── src/
│       ├── vite-env.d.ts       # Declarações de tipo (CSS Modules, PNG)
│       ├── index.css           # CSS variables globais (brand, gray, radius…)
│       ├── App.tsx             # BrowserRouter + PrivateRoute
│       ├── assets/logo/        # Logomarcas (branco e colorido)
│       ├── services/
│       │   ├── auth.ts         # login() → POST /auth/login
│       │   └── users.ts        # CRUD de usuários → /users
│       ├── pages/
│       │   ├── LoginPage.tsx
│       │   ├── WelcomePage.tsx  # Tela de boas-vindas pós-login
│       │   ├── HomePage.tsx     # Shell principal
│       │   ├── MapaPage.tsx     # Mapa territorial interativo (Leaflet)
│       │   └── UsuariosPage.tsx
│       └── components/
│           ├── Sidebar.tsx
│           ├── Topbar.tsx
│           ├── painel/          # KpiCard, BarChart, TopMunicipios, Painel
│           └── usuarios/        # ModalNovoUsuario, ModalEditarUsuario, ModalPermissoes
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

**Migrations:**
- `0f08b7443f87_create_users_table.py` — cria a tabela `users`
- `b9e3f1a2c847_add_user_permissions_and_last_login.py` — adiciona `candidate_name`, `can_export`, `can_compare`, `last_login`

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | UUID | Chave primária |
| `name` | String(120) | Nome completo |
| `email` | String(255) | E-mail único (index) |
| `password_hash` | String(255) | Senha hasheada com bcrypt |
| `profile` | Enum | `administrador`, `gestor`, `analista`, `assessor` |
| `candidate_name` | String(255) | Nome do candidato vinculado (nulo para admin) |
| `can_export` | Boolean | Pode exportar dados (padrão: `true`) |
| `can_compare` | Boolean | Pode comparar candidatos (padrão: `false`) |
| `is_active` | Boolean | Conta ativa ou inativa |
| `last_login` | DateTime | Data/hora do último login |
| `created_at` | DateTime | Data de criação (automático) |
| `updated_at` | DateTime | Última atualização (automático) |

**Aplicar migrations no banco:**
```bash
cd backend
alembic upgrade head
```

**Criar usuário admin (seed manual):**
```bash
cd backend
python -c "
from database import SessionLocal
from models.user import User, UserProfile
from security import hash_password
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
  "user_profile": "administrador",
  "user_candidate": null,
  "user_can_export": true,
  "user_can_compare": true
}
```

> O campo `user_candidate` é `null` para administrador e contém o nome do candidato para os demais perfis.  
> O serviço também grava `last_login` no banco a cada login bem-sucedido.

Response `401 Unauthorized`:
```json
{
  "detail": "E-mail ou senha incorretos."
}
```

### 7.3 `users` — API de Gerenciamento de Usuários

Todos os endpoints exigem `Authorization: Bearer <token>` de um **administrador**.

| Método | Endpoint | Descrição |
|---|---|---|
| `GET` | `/users` | Lista todos os usuários |
| `POST` | `/users` | Cria novo usuário |
| `PUT` | `/users/{id}` | Atualiza dados de um usuário |
| `PATCH` | `/users/{id}/deactivate` | Desativa um usuário |

**Criar usuário — request:**
```json
{
  "name": "Carlos Neto",
  "email": "gestor@pite.app",
  "password": "Senha@123",
  "profile": "gestor",
  "candidate_name": "João Ferreira da Silva",
  "can_export": true,
  "can_compare": false
}
```

**Dependências de autenticação (`backend/dependencies.py`):**
- `get_current_user` — lê o Bearer token, decodifica o JWT, retorna o `User` do banco
- `require_admin` — estende `get_current_user` e lança 403 se o perfil não for `administrador`

### 7.4 Frontend — React 19 + Vite + TypeScript

**Stack:**
- React 19 + TypeScript + Vite (porta 5173)
- CSS Modules para estilização
- React Router DOM v7 (`/login`, `/home`)
- Proxy Vite: `/auth` e `/users` → `http://localhost:8000`

**`localStorage` — chaves armazenadas após o login:**

| Chave | Conteúdo |
|---|---|
| `access_token` | JWT para chamadas autenticadas à API |
| `user_name` | Nome completo do usuário |
| `user_profile` | Perfil: `administrador`, `gestor`, `analista`, `assessor` |
| `user_candidate` | Nome do candidato vinculado (ausente para admin) |
| `user_can_export` | `"true"` ou `"false"` |
| `user_can_compare` | `"true"` ou `"false"` |
| `show_welcome` | `"1"` quando deve exibir a tela de boas-vindas |

**Fluxo após o login:**
1. `POST /auth/login` → tokens e dados do usuário salvos no `localStorage`
2. Navegação para `/home` → `WelcomePage` aparece na frente do shell
3. Usuário clica em "Acessar o portal" → `show_welcome` removido, shell exibido

**Páginas e componentes implementados:**

| Caminho | Descrição |
|---|---|
| `src/pages/LoginPage.tsx` | Formulário de login integrado ao backend |
| `src/pages/WelcomePage.tsx` | Tela de boas-vindas pós-login, conteúdo dinâmico por perfil |
| `src/pages/HomePage.tsx` | Shell principal: sidebar + topbar + conteúdo |
| `src/pages/UsuariosPage.tsx` | CRUD de usuários integrado à API real |
| `src/pages/MapaPage.tsx` | Mapa territorial interativo com Leaflet |
| `src/components/Sidebar.tsx` | Sidebar com RBAC — oculta itens por perfil |
| `src/components/Topbar.tsx` | Barra superior com breadcrumb e logout |
| `src/components/painel/Painel.tsx` | Dashboard com KPIs e gráficos por perfil |
| `src/components/usuarios/ModalNovoUsuario.tsx` | Modal de criação de usuário |
| `src/components/usuarios/ModalEditarUsuario.tsx` | Modal de edição e desativação |
| `src/components/usuarios/ModalPermissoes.tsx` | Modal de permissões padrão por perfil |

**Serviços (`frontend/src/services/`):**
- `auth.ts` — `login(payload)` → `POST /auth/login`
- `users.ts` — `listarUsuarios()`, `criarUsuario()`, `atualizarUsuario()`, `desativarUsuario()`

**Dados geográficos estáticos (`frontend/public/geo/`):**
- `municipios_br.json` — GeoJSON com os 5.572 municípios do Brasil (fonte: IBGE 2022, 59 MB)
- `brasil_outline.json` — contorno do Brasil dissolvido (95 KB, gerado por `scripts/gerar_contornos.py`)
- `regioes_outline.json` — contornos das 5 regiões dissolvidos (185 KB)
- `estados_outline.json` — contornos dos 27 estados dissolvidos (374 KB)
- Servidos estaticamente pelo Vite em `/geo/<arquivo>`
- Recomendado simplificar `municipios_br.json` para ~3 MB usando [mapshaper.org](https://mapshaper.org) com `simplify 5%`

**Dependências adicionadas:**
```bash
npm install leaflet @types/leaflet
```

**Proxy Vite (`frontend/vite.config.ts`)** — redireciona para o backend:
```
/auth        → http://localhost:8000
/users       → http://localhost:8000
/eleicoes    → http://localhost:8000
/candidatos  → http://localhost:8000
/resultados  → http://localhost:8000
```

**Subir o frontend:**
```bash
cd frontend
npm install   # primeira vez
npm run dev   # http://localhost:5173
```

### 7.5 Mapa Territorial — Leaflet + GeoJSON

**Biblioteca:** `leaflet` + `@types/leaflet` (sem react-leaflet — instância gerenciada via `useRef`)

**Arquivo de dados:** `frontend/public/geo/municipios_br.json`
- Fonte: IBGE Malhas Municipais 2022
- Formato: GeoJSON (`FeatureCollection`)
- Propriedades utilizadas por feature: `NM_MUN`, `SIGLA_UF`, `CD_MUN`

**Comportamento implementado:**

| Interação | Comportamento |
|---|---|
| Hover | Borda azul + fill destacado; removido ao sair |
| Clique simples | Município fica com destaque persistente (azul escuro); painel lateral abre com nome, UF e código |
| Segundo clique no mesmo | Deseleciona; painel volta para legenda |
| Clique em outro | Deseleciona o anterior, seleciona o novo |

**Classificações territoriais (sem dados eleitorais por enquanto):**

| Classificação | Cor |
|---|---|
| Zona de Força | `#1a7a4a` |
| Consolidado | `#0d5c37` |
| Expansão | `#5aab61` |
| Zona de Disputa | `#f5a623` |
| Adversário | `#c0392b` |
| Neutro | `#bdc3c7` |
| Volátil | `#9b59b6` |

**Navegação hierárquica implementada:**

| Nível | Comportamento |
|---|---|
| Brasil | Mapa colorido por região; painel com totais nacionais e cards de região |
| Região | Região destacada; demais em cinza; painel com lista de estados clicáveis |
| Estado | Estado destacado; painel com lista de municípios e stats |
| Município | Município selecionado; painel com dados eleitorais da API |

**Contornos dissolvidos:** ao navegar por nível, um contorno sem bordas internas é carregado do GeoJSON pré-computado (ver seção 8). A camada é `interactive: false` para não interferir nos cliques dos municípios.

**Padrão `navRef`:** o estado de navegação (`NavState`) é espelhado em um `ref` (`navRef`) para que os handlers do Leaflet (que fecham sobre o `ref`) leiam sempre o valor atual sem staleness.

**Camadas previstas (toolbar):** Municípios · Zonas eleitorais · Bairros · Locais de votação
> Apenas Municípios está funcional. As demais dependem de dados a serem importados.

**Recomendação de performance:**
O arquivo bruto do IBGE tem ~59 MB. Para produção, simplificar com [mapshaper.org](https://mapshaper.org):
```
simplify 5%
```
Resultado: ~3 MB — carregamento em ~1–2s.

### 7.6 `eleicoes` — API de Eleições

**Endpoints:**

| Método | Endpoint | Autenticação | Descrição |
|---|---|---|---|
| `GET` | `/eleicoes` | Bearer token | Lista todas as eleições |
| `POST` | `/eleicoes` | Admin | Cria nova eleição |
| `DELETE` | `/eleicoes/{id}` | Admin | Remove eleição |

### 7.7 `resultados` — API de Resultados Eleitorais

**Endpoints:**

| Método | Endpoint | Autenticação | Descrição |
|---|---|---|---|
| `GET` | `/candidatos` | Bearer token | Lista todos os candidatos |
| `POST` | `/candidatos` | Admin | Cria candidato |
| `GET` | `/resultados/municipio/{cd_ibge}` | Bearer token | Resultado de um município (parâmetros: `eleicao_id`, `candidato_id`) |
| `GET` | `/resultados/municipio/{cd_ibge}/historico` | Bearer token | Histórico de eleições de um município (parâmetro: `candidato_id`) |
| `GET` | `/resultados/mapa` | Bearer token | Todos os municípios com votos (para colorir o mapa) |
| `GET` | `/resultados/resumo/uf` | Bearer token | Totais agrupados por UF |

**Serviço frontend (`frontend/src/services/eleitoral.ts`):**
- `listarEleicoes()` — lista eleições
- `listarCandidatos()` — lista candidatos
- `buscarResultadoMunicipio(cdIbge, eleicaoId, candidatoId)` — resultado do município
- `buscarHistoricoMunicipio(cdIbge, candidatoId)` — histórico de eleições
- `buscarResultadosMapa(eleicaoId, candidatoId)` — dados para coloração do mapa

### 7.8 Migration `c3d4e5f6a7b8`

Cria as 4 tabelas eleitorais: `municipio_tse_ibge`, `eleicoes`, `candidatos`, `resultados_eleitorais`.

```bash
cd backend
alembic upgrade head
```

---

## 8. Scripts de Importação e Geração de Dados

Os scripts ficam em `scripts/` na raiz do repositório. Devem ser executados a partir da pasta `backend/` para que o `.env` seja encontrado.

### 8.1 `gerar_contornos.py` — Contornos Dissolvidos

Gera os 3 arquivos GeoJSON de contorno sem bordas internas usando Shapely.

**Pré-requisitos:**
```bash
pip install shapely
```

**Uso (da raiz do repositório):**
```bash
python scripts/gerar_contornos.py
```

**Saída:** cria `frontend/public/geo/brasil_outline.json` (95 KB), `regioes_outline.json` (185 KB) e `estados_outline.json` (374 KB).

> Executar apenas uma vez. Não é necessário repetir salvo que `municipios_br.json` seja substituído.

### 8.2 `importar_municipios_tse.py` — Mapeamento TSE→IBGE

Popula a tabela `municipio_tse_ibge` a partir do CSV `municipio_tse_ibge.csv` na raiz do repositório.

**Uso:**
```bash
cd backend
.venv\Scripts\python.exe ..\scripts\importar_municipios_tse.py
```

**Saída esperada:** `5571 municípios importados.`

> Executar apenas uma vez. A tabela já está populada no banco de produção.

### 8.3 `importar_resultados_tse.py` — Resultados Eleitorais

Importa um CSV de resultados do TSE (votação por candidato e município).

**Formato do CSV:** separador `;`, encoding `latin1`. Colunas esperadas: `NM_CANDIDATO`, `NR_CANDIDATO`, `NM_PARTIDO`, `SG_PARTIDO`, `SG_UF`, `CD_MUNICIPIO`, `DS_CARGO`, `QT_VOTOS_NOMINAIS`, `QT_VOTOS_VALIDOS`, `QT_APTOS`, `QT_ABSTENCOES`.

**Uso:**
```bash
cd backend
.venv\Scripts\python.exe ..\scripts\importar_resultados_tse.py \
  --arquivo "caminho\para\votacao_candidato_munzona_2024.csv" \
  --ano 2024 \
  --turno 1 \
  --tipo municipal \
  --candidato "NOME DO CANDIDATO"
```

**Parâmetros:**
- `--arquivo` — caminho do CSV do TSE
- `--ano` — ano da eleição
- `--turno` — 1 ou 2
- `--tipo` — `municipal`, `federal` ou `estadual`
- `--candidato` — nome exato do candidato no CSV (opcional; se omitido importa todos)

**Saída:** imprime o `eleicao_id` e `candidato_id` gerados — guarde-os para usar nos filtros da API.

---

## 9. Como Adicionar um Novo Módulo

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
backend/candidates/
├── __init__.py
├── router.py       # endpoints HTTP
└── schemas.py      # Pydantic models
```

**Passo 5 — Registrar o router no `main.py`:**
```python
from candidates.router import router as candidates_router
app.include_router(candidates_router)
```

---

## 10. Problemas Conhecidos e Soluções

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

### `MapaPage` não abre / tela em branco

**Causa:** quebra na cadeia de height flexbox — algum ancestral sem `min-height: 0` ou sem `flex-direction: column`.  
**Solução confirmada:**
- `HomePage.module.css → .contentArea`: `flex: 1; min-height: 0; display: flex; flex-direction: column`
- `MapaPage.module.css → .page`: `flex: 1; min-height: 0` (não usar `calc(100vh - N)`)
- `MapaPage.module.css → .layout`: `overflow: hidden`

---

## 11. Próximos Passos

| Ordem | Módulo | Descrição |
|---|---|---|
| 1 | Importar CSV do TSE | Usar `scripts/importar_resultados_tse.py` com CSV real para ver dados no mapa |
| 2 | Coloração do mapa por votos | Usar `buscarResultadosMapa()` para colorir municípios por % de votos do candidato |
| 3 | GeoJSON simplificado | Reduzir `municipios_br.json` de 59 MB para ~3 MB via mapshaper |
| 4 | CRUD de candidatos | Tela frontend de candidatos (backend já tem `/candidatos`) |
| 5 | `territories` | Classificação territorial e índice de força |
| 6 | Dashboard real | Substituir dados mock do Painel por dados reais da API |
| 7 | `polls` | Pesquisas eleitorais |
