# PITE: Plataforma de Inteligência Territorial Eleitoral

> Plataforma web de inteligência territorial eleitoral para análise estratégica de dados do TSE, pesquisas eleitorais e classificação territorial.

---

## Visão Geral

A **PITE** é uma plataforma SPA que permite analisar, visualizar e interpretar dados eleitorais históricos públicos (TSE), cruzados com pesquisas próprias autorizadas, dados geográficos e perfis políticos territoriais — apoiando decisões estratégicas de candidatos, pré-candidatos, partidos, consultorias eleitorais e equipes de campanha.

Todas as análises são de natureza **territorial, estatística e agregada** — nunca individuais.

---

## Status do Projeto

> **Fase 1 — Em desenvolvimento** — Backend FastAPI com autenticação JWT, modelos eleitorais e importação TSE. Frontend com mapa territorial interativo (Leaflet), filtros eleitorais em cascata e visualização de votos por município e zona.

---

## Stack Tecnológica

| Camada | Tecnologia | Versão |
|---|---|---|
| Front-end | React + Vite + TypeScript | 19 / Latest |
| Mapas | Leaflet (vanilla, sem react-leaflet) | 1.9+ |
| Estilização | CSS Modules | — |
| Back-end | Python + FastAPI | 3.12 / Latest |
| Validação | Pydantic | 2.0+ |
| ORM | SQLAlchemy + GeoAlchemy2 | 2.0+ |
| Migrations | Alembic | Latest |
| Banco de dados | PostgreSQL + PostGIS | 16+ |
| Autenticação | JWT — python-jose + passlib | Latest |
| Scripts de dados | Pandas + GeoPandas | Latest |

---

## Arquitetura

O sistema é **single-tenant** (uma organização por instalação) e organizado em três camadas separadas:

```
Browser (React SPA)
      ↕ HTTP / REST / JSON
API (Python + FastAPI)
      ↕
PostgreSQL + PostGIS
```

Controle de acesso por **4 perfis RBAC**: `administrador`, `gestor`, `analista`, `assessor`.  
Cada perfil não-admin é vinculado a um único candidato e só acessa os dados desse candidato.

---

## Estrutura de Pastas

```
pite/
│
├── .env.example
├── .gitignore
├── README.md
│
├── docs/                           # Documentação estratégica e técnica
│
├── backend/                        # Python 3.12 + FastAPI
│   ├── main.py
│   ├── settings.py
│   ├── database.py
│   ├── dependencies.py
│   ├── requirements.txt
│   ├── models/                     # SQLAlchemy ORM models
│   ├── modules/                    # Feature modules (auth, candidates, elections...)
│   │   └── <module>/
│   │       ├── router.py
│   │       ├── schemas.py
│   │       ├── service.py
│   │       └── repository.py
│   ├── core/                       # Security, RBAC, exceptions, pagination
│   ├── processing/                 # Strength index, territory classifier
│   ├── seeds/                      # Initial data (parties, roles)
│   ├── migrations/                 # Alembic versions
│   └── tests/
│
├── frontend/                       # React 18 + Vite
│   └── src/
│       ├── pages/                  # All application pages
│       │   ├── auth/
│       │   ├── dashboard/
│       │   ├── candidates/
│       │   ├── elections/
│       │   ├── territories/
│       │   ├── polls/
│       │   ├── comparison/
│       │   ├── import/
│       │   ├── geography/
│       │   └── users/
│       ├── components/             # Shared UI (ui/, layout/, map/, charts/)
│       ├── modules/                # Domain logic (components/ + hooks/)
│       ├── store/                  # Global state — Context API
│       ├── services/               # HTTP layer — API calls
│       ├── utils/                  # Formatters, validators, constants
│       ├── config/                 # API config, map config
│       └── router/                 # React Router v6 + RoleGuard
│
├── import-scripts/                 # Standalone data import (TSE + geo)
│   ├── tse/
│   └── geo/
│
└── data/                           # Raw data — not versioned (.gitignore)
    ├── tse/
    └── geo/
```

---

## Módulos do Sistema

| Módulo | Descrição |
|---|---|
| `auth` | Login, JWT, refresh token |
| `candidates` | Cadastro de candidatos e pré-candidatos |
| `elections` | Eleições e candidaturas vinculadas ao TSE |
| `territories` | Mapa interativo, zonas, seções e classificação territorial |
| `polls` | Cadastro, importação e cruzamento de pesquisas eleitorais |
| `results` | Resultados eleitorais importados do TSE |
| `import` | Importação e normalização de arquivos CSV do TSE |
| `users` | Usuários, perfis RBAC e permissões |
| `audit` | Log de ações sensíveis por usuário |

---

## Público-Alvo

| Perfil | Necessidade Principal |
|---|---|
| Candidato | Entender histórico eleitoral e zonas de força por território |
| Pré-candidato | Avaliar potencial com base em perfil político e histórico partidário |
| Coordenador de campanha | Priorizar esforços por zona, município e seção eleitoral |
| Consultor eleitoral | Análise comparativa entre eleições, territórios e candidatos |
| Partido político | Mapear forças, fragilidades e oportunidades territoriais |
| Pesquisador | Cruzar dados públicos do TSE com pesquisas próprias |
| Analista | Produzir indicadores, relatórios e painéis para suporte à decisão |

---

## Como Rodar Localmente

### Pré-requisitos

- [PostgreSQL 16+](https://www.postgresql.org/download/) com extensão **PostGIS**
- [Python 3.12+](https://www.python.org/)
- [Node.js 20+](https://nodejs.org/)

### 1. Banco de dados

```sql
CREATE DATABASE pite;
\c pite
CREATE EXTENSION postgis;
```

```bash
cp .env.example .env
# Edite .env com suas credenciais do PostgreSQL
```

### 2. Backend

```bash
cd backend
python -m venv .venv

# Windows
.venv\Scripts\activate
# Linux / macOS
source .venv/bin/activate

pip install -r requirements.txt
alembic upgrade head       # Cria as tabelas
uvicorn main:app --reload  # Inicia o servidor
```

| Endpoint | URL |
|---|---|
| API | http://localhost:8000 |
| Documentação (Swagger) | http://localhost:8000/docs |
| Documentação (Redoc) | http://localhost:8000/redoc |

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

| Endpoint | URL |
|---|---|
| App | http://localhost:5173 |

### 4. Scripts de importação (opcional)

```bash
cd import-scripts
python -m venv .venv && source .venv/bin/activate  # ou .venv\Scripts\activate no Windows
pip install -r requirements.txt

# Importar resultados TSE
python tse/import_results.py --file ../data/tse/2024/votacao_secao_2024_GO.csv

# Importar municípios (GeoJSON IBGE)
python geo/import_municipalities.py --file ../data/geo/municipalities/municipios_go.geojson
```

---

## Documentação

| Documento | Descrição |
|---|---|
| [01 — Visão do Produto](docs/01-visao-do-produto.md) | Propósito, público-alvo, problemas resolvidos e escopo |
| [02 — Histórias de Usuário](docs/02-historias-de-usuario.md) | HUs por perfil com critérios de aceitação |
| [03 — Requisitos Funcionais](docs/03-requisitos-funcionais.md) | O que o sistema deve fazer |
| [04 — Requisitos Não Funcionais](docs/04-requisitos-nao-funcionais.md) | Desempenho, segurança, escalabilidade |
| [05 — Regras de Negócio](docs/05-regras-de-negocio.md) | Classificação territorial e fórmulas de cálculo |
| [06 — Arquitetura](docs/06-arquitetura.md) | Camadas, tecnologias e fluxo de dados |
| [07 — Modelo de Dados](docs/07-modelo-de-dados.md) | Entidades, campos e relacionamentos |
| [08 — Fontes de Dados](docs/08-fontes-de-dados.md) | Catálogo de fontes (TSE, IBGE, pesquisas) |
| [09 — Governança, Segurança e Privacidade](docs/09-governanca-seguranca-privacidade.md) | LGPD, segurança e ética |
| [10 — Roadmap](docs/10-roadmap.md) | Fases e marcos do desenvolvimento |
| [11 — Backlog Inicial](docs/11-backlog-inicial.md) | Épicos e tarefas por prioridade |
| [12 — Dicionário de Dados](docs/12-dicionario-de-dados.md) | Glossário técnico |
| [13 — Guia de Nomenclatura](docs/13-guia-de-nomenclatura.md) | Padrões de código |
| [14 — Guia de Desenvolvimento](docs/14-guia-de-desenvolvimento.md) | Setup local, migrations, módulos implementados e troubleshooting |

---

## Cuidados Éticos e Legais

- Utiliza exclusivamente dados **públicos** do TSE e pesquisas próprias autorizadas.
- Análises sempre **territoriais e agregadas** — nunca dados individuais de eleitores.
- Conformidade com a **LGPD** e legislação eleitoral brasileira.
- Proibição absoluta de microdirecionamento de eleitores.

Veja: [09 — Governança, Segurança e Privacidade](docs/09-governanca-seguranca-privacidade.md)
