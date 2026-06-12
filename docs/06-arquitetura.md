# 06 — Arquitetura

> Descreve a estrutura técnica da plataforma: camadas, serviços, tecnologias e fluxo de dados.

---

## 1. Visão Geral

```
┌──────────────────────────────────────────────────────┐
│              NAVEGADOR — SPA React                   │
│    React 19 + TypeScript | Leaflet | React Router    │
│    CSS Modules | localStorage (auth)                 │
└─────────────────────────┬────────────────────────────┘
                           │ HTTP / REST / JSON
┌─────────────────────────▼────────────────────────────┐
│           nginx (container frontend)                 │
│   Serve arquivos estáticos + proxy reverso para API  │
└─────────────────────────┬────────────────────────────┘
                           │ proxy interno Docker
┌─────────────────────────▼────────────────────────────┐
│              API REST — Python + FastAPI             │
│  Autenticação JWT  │ Autorização RBAC  │ Pydantic    │
│  Cache in-memory (eleições)  │ OpenAPI/Swagger       │
└─────────────────────────┬────────────────────────────┘
                           │ SQLAlchemy
┌─────────────────────────▼────────────────────────────┐
│         PostgreSQL 16 + PostGIS (container)          │
│         Volume Docker persistente (pgdata)           │
└──────────────────────────────────────────────────────┘
```

**Modelo de instalação: Single-tenant** — uma organização por instalação.
**Infraestrutura: Docker Compose** — três containers na mesma rede interna.

---

## 2. Camadas da Arquitetura

### 2.1 Camada de Apresentação — SPA React

| Decisão | Escolha |
|---|---|
| Framework | React 19 (Hooks) |
| Linguagem | TypeScript |
| Build | Vite |
| Mapas | Leaflet (direto, sem react-leaflet — instância via `useRef`) |
| Roteamento | React Router DOM v7 |
| Estado | useState / useEffect (local por página) |
| Estilização | CSS Modules |
| Ícones | Font Awesome 6.5 (CDN) |
| Fontes | Plus Jakarta Sans (Google Fonts CDN) |

**Em desenvolvimento:** Vite serve o app na porta 5173 e faz proxy das chamadas de API para `localhost:8000`.

**Em produção:** o build (`npm run build`) gera arquivos estáticos servidos pelo nginx. O nginx também faz proxy de `/auth`, `/users`, `/eleicoes`, etc. para o container do backend.

---

### 2.2 Camada de API — Python + FastAPI

| Decisão | Escolha |
|---|---|
| Linguagem | Python 3.12 |
| Framework | FastAPI |
| Validação | Pydantic v2 |
| Autenticação | JWT — python-jose + passlib (bcrypt) |
| Autorização | RBAC por perfil de acesso |
| Documentação | OpenAPI / Swagger — gerado automaticamente pelo FastAPI em `/docs` |
| ORM | SQLAlchemy 2.0 |
| Suporte geoespacial | GeoAlchemy2 |
| Migrations | Alembic |
| Servidor | Uvicorn |
| Cache | In-memory com TTL 600s (eleições e resumos) |

**Estrutura de um módulo no backend:**
```
backend/<modulo>/
├── router.py    → define as rotas (GET, POST, PUT, DELETE)
├── schemas.py   → modelos Pydantic para validação
└── service.py   → lógica de negócio
```

**Módulos ativos:** `auth`, `users`, `eleicoes`, `resultados` (candidatos, candidaturas, partidos, resultados, secoes), `importacao`.

---

### 2.3 Camada de Banco de Dados

| Componente | Escolha |
|---|---|
| Banco principal | PostgreSQL 16 com PostGIS |
| Consultas geoespaciais | PostGIS |
| ORM | SQLAlchemy + GeoAlchemy2 |
| Migrations | Alembic (versionadas e rastreáveis) |
| Container | `postgis/postgis:16-3.4` |
| Persistência | Volume Docker `pgdata` |

**Estratégia de banco por ambiente:**
- **Desenvolvimento local:** container PostgreSQL + PostGIS via Docker Compose (mesmo `docker-compose.yml` de produção).
- **Produção (VPS):** mesmo container, volume persistente em disco do servidor.

---

### 2.4 Camada de Importação de Dados

- Interface web na tela **Importação de Dados** (sem necessidade de acesso ao servidor).
- Streaming em tempo real via **Server-Sent Events (SSE)** — o frontend recebe atualizações de progresso linha a linha.
- **Pandas** para leitura e limpeza dos CSVs do TSE.
- **psycopg2 COPY** para bulk insert em chunks de 50.000 linhas (muito mais rápido que ORM).
- Registro em `importacao_log` para rastreabilidade completa.
- Suporta: municípios TSE→IBGE, resultados eleitorais e votação por seção.

---

### 2.5 Camada de Autenticação e Autorização

- JWT com duração configurável via `JWT_EXPIRATION_MINUTES` no `.env` (padrão: 60 min).
- Perfis: `administrador`, `gestor`, `analista`, `assessor`.
- Usuários não-admin são vinculados a um `candidato_id` e só acessam dados desse candidato.
- `last_login` gravado no banco a cada login bem-sucedido.

```python
# Rota protegida — qualquer usuário autenticado
@router.get("/dados")
def listar(user: User = Depends(get_current_user)): ...

# Rota restrita ao administrador
@router.get("/users")
def listar_usuarios(_: User = Depends(require_admin)): ...
```

---

### 2.6 Infraestrutura — Docker Compose

```yaml
services:
  db:        # postgis/postgis:16-3.4 — porta 5432 (interna)
  backend:   # Python + FastAPI — porta 8000 (interna)
  frontend:  # nginx — porta 80/443 (exposta)
```

O nginx no container `frontend` serve os arquivos estáticos do React e faz proxy das rotas de API:

```nginx
location ~ ^/(auth|users|eleicoes|candidatos|resultados|secoes|importar|health) {
    proxy_pass http://backend:8000;
    proxy_buffering off;   # necessário para SSE
}
```

**Atualização do código em produção:**
```bash
git pull
docker compose up -d --build
```

---

## 3. Estrutura de Pastas do Repositório

```
pite/
├── docker-compose.yml          # Orquestração dos 3 serviços
├── .env                        # Variáveis de ambiente (não versionado)
├── .env.exemplo                # Template
├── municipio_tse_ibge.csv      # Mapeamento TSE→IBGE (5.571 linhas)
│
├── docs/                       # Documentação do projeto
│
├── backend/                    # API Python + FastAPI
│   ├── Dockerfile
│   ├── main.py                 # Registra todos os routers + CORS
│   ├── settings.py             # DATABASE_URL, JWT_*, CORS_ORIGINS
│   ├── database.py             # Engine + SessionLocal + get_db
│   ├── dependencies.py         # get_current_user, require_admin
│   ├── security.py             # hash_password, create_access_token
│   ├── create_admin.py         # Script de seed do primeiro admin
│   ├── requirements.txt
│   ├── alembic.ini
│   ├── models/
│   │   ├── user.py             # Tabela users (UUID PK, perfis, candidato_id)
│   │   └── eleitoral.py        # Eleicao, Candidato, Candidatura, Partido,
│   │                           # ResultadoEleitoral, VotacaoSecao,
│   │                           # MunicipioTSEIBGE, ImportacaoLog,
│   │                           # EleicaoResumoCache
│   ├── auth/                   # POST /auth/login
│   ├── users/                  # GET/POST/PUT/PATCH /users
│   ├── eleicoes/               # GET/POST/DELETE /eleicoes + cache
│   ├── resultados/             # 70+ endpoints: /candidatos, /candidaturas,
│   │                           # /partidos, /resultados/*, /secoes/*
│   ├── importacao/             # POST /importar/* (streaming SSE)
│   └── migrations/versions/    # Alembic migrations versionadas
│
└── frontend/                   # React 19 + Vite + TypeScript
    ├── Dockerfile               # Multi-stage: node build → nginx serve
    ├── nginx.conf               # Proxy reverso + SPA fallback
    ├── vite.config.ts           # Proxy de dev → localhost:8000
    ├── public/geo/              # GeoJSON IBGE 2022 (municipios, regioes, estados)
    └── src/
        ├── pages/               # LoginPage, HomePage, MapaPage, CandidatosPage,
        │                        # EleioesPage, PartidosPage, ImportacaoPage, UsuariosPage
        ├── components/          # Sidebar, Topbar, painel/, candidatos/, usuarios/
        └── services/            # auth.ts, eleitoral.ts, candidatos.ts,
                                 # candidaturas.ts, partidos.ts, users.ts, importacao.ts
```

---

## 4. Fluxo de Dados

```
TSE (CSV)
    │
    ▼  Upload via interface web (ImportacaoPage)
API FastAPI (/importar/resultados, /importar/secoes)
    │  Pandas + psycopg2 COPY (chunks 50k)
    ▼  Streaming SSE → frontend
PostgreSQL + PostGIS
    │
    ▼  SQLAlchemy (queries + cache in-memory)
API FastAPI (/resultados, /secoes, /eleicoes)
    │
    ▼  JSON
nginx → SPA React + Leaflet
```

---

## 5. Decisões Técnicas e Justificativas

| Decisão | Justificativa |
|---|---|
| React 19 + TypeScript + CSS Modules | Interface interativa com mapas e dashboards; TypeScript desde o início para segurança de tipos |
| Leaflet | Biblioteca de mapas open-source leve; suporte robusto a GeoJSON |
| Python + FastAPI | Ecossistema superior para dados (Pandas, GeoAlchemy); Swagger automático |
| Pydantic v2 | Validação automática com mensagens claras; incluso no FastAPI |
| SQLAlchemy + GeoAlchemy2 | ORM maduro com suporte nativo a PostGIS |
| Alembic | Migrações versionadas, padrão do ecossistema SQLAlchemy |
| PostgreSQL + PostGIS | Único banco relacional com suporte completo a geoespacial |
| Docker Compose | Ambiente reproduzível em dev e produção; elimina "funciona na minha máquina" |
| nginx como proxy reverso | Serve estáticos com performance, proxy da API, preparado para HTTPS |
| SSE para importações | Progresso em tempo real sem WebSocket; simples de implementar no FastAPI |
| Cache in-memory (eleições) | Evita varredura de milhões de linhas de `votacao_secao` por requisição |
| sg_uf desnormalizado em `votacao_secao` | Elimina JOINs frequentes com `municipio_tse_ibge` |
| Single-tenant | Elimina toda a complexidade de isolamento de dados entre organizações |
| Sem Redis/Celery no MVP | Filas e cache distribuído adicionam complexidade sem necessidade no início |

---

## 6. Comparação: Planejado vs. Implementado

| Aspecto | Planejado | Implementado | Motivo |
|---|---|---|---|
| Backend | Node.js + Fastify | Python + FastAPI | Melhor para dados |
| ORM | Knex / Prisma | SQLAlchemy + GeoAlchemy2 | Suporte nativo PostGIS |
| Frontend | React + JS | React 19 + TypeScript | TypeScript desde o início |
| Infraestrutura | Sem containers | Docker Compose | Ambiente reproduzível |
| Banco (dev) | PostgreSQL local | Container Docker | Sem instalação manual |
| Banco (prod) | Neon.tech (serverless) | Container na VPS | Mais controle, sem custo extra |
| Import de dados | Scripts CLI | Interface web com SSE | Mais acessível para o usuário |
| Filas | BullMQ | Sem fila no MVP | Complexidade desnecessária |
| Multi-tenant | Sim | Não — single-tenant | Simplifica tudo |
