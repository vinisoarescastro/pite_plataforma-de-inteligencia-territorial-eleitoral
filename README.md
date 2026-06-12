# PITE: Plataforma de Inteligência Territorial Eleitoral

> Plataforma web de inteligência territorial eleitoral para análise estratégica de dados do TSE, pesquisas eleitorais e classificação territorial.

---

## Visão Geral

A **PITE** é uma plataforma SPA que permite analisar, visualizar e interpretar dados eleitorais históricos públicos (TSE), cruzados com pesquisas próprias autorizadas, dados geográficos e perfis políticos territoriais — apoiando decisões estratégicas de candidatos, pré-candidatos, partidos, consultorias eleitorais e equipes de campanha.

Todas as análises são de natureza **territorial, estatística e agregada** — nunca individuais.

---

## Status do Projeto

> **Fase 1 — Funcional** — Backend FastAPI com autenticação JWT, modelos eleitorais, importação TSE via interface web e API completa. Frontend com mapa territorial interativo (Leaflet), filtros eleitorais em cascata, visualização de votos por município/zona/seção, CRUD de candidatos, eleições, partidos e usuários. Módulo de Geografia com gerenciamento de bairros, polígonos desenhados via Leaflet-Geoman e geocodificação automática de locais de votação via Nominatim. Deploy via Docker Compose.

---

## Stack Tecnológica

| Camada | Tecnologia | Versão |
|---|---|---|
| Front-end | React + Vite + TypeScript | 19 / Latest |
| Mapas | Leaflet (vanilla, sem react-leaflet) | 1.9+ |
| Desenho de polígonos | Leaflet-Geoman | 2.18+ |
| Estilização | CSS Modules | — |
| Back-end | Python + FastAPI | 3.12 / Latest |
| Validação | Pydantic | 2.0+ |
| ORM | SQLAlchemy + GeoAlchemy2 | 2.0+ |
| Migrations | Alembic | Latest |
| Banco de dados | PostgreSQL + PostGIS | 16+ |
| Autenticação | JWT — python-jose + passlib | Latest |
| Scripts de dados | Pandas | Latest |
| Geocodificação | Nominatim (OpenStreetMap) | — |
| Infraestrutura | Docker + Docker Compose + nginx | Latest |

---

## Arquitetura

O sistema é **single-tenant** (uma organização por instalação) e roda via Docker Compose com três serviços:

```
Internet
    └── frontend (nginx :80)
            ├── /                             → arquivos estáticos React
            └── /auth, /geo, /resultados…     → proxy → backend:8000 (FastAPI)
                                                              └── db:5432 (PostgreSQL + PostGIS)
```

Controle de acesso por **4 perfis RBAC**: `administrador`, `gestor`, `analista`, `assessor`.
Cada perfil não-admin é vinculado a um único candidato e só acessa os dados desse candidato.

---

## Estrutura de Pastas

```
pite/
├── .env                        # Variáveis de ambiente (não versionado)
├── .env.exemplo                # Template do .env
├── .gitignore
├── README.md
├── docker-compose.yml          # Orquestração dos serviços
├── municipio_tse_ibge.csv      # Mapeamento TSE→IBGE (5.571 municípios)
│
├── docs/                       # Documentação estratégica e técnica
│
├── backend/                    # Python 3.12 + FastAPI
│   ├── Dockerfile
│   ├── main.py                 # Entry point — registra todos os routers
│   ├── settings.py             # Configurações via variáveis de ambiente
│   ├── database.py             # Conexão SQLAlchemy
│   ├── dependencies.py         # get_current_user, require_admin
│   ├── security.py             # JWT, bcrypt
│   ├── create_admin.py         # Script para criar o primeiro usuário admin
│   ├── requirements.txt
│   ├── alembic.ini
│   ├── models/
│   │   ├── user.py             # Tabela users
│   │   └── eleitoral.py        # Eleicao, Candidato, Candidatura, Partido, etc.
│   ├── auth/                   # POST /auth/login
│   ├── users/                  # GET/POST/PUT/PATCH /users
│   ├── eleicoes/               # GET/POST/DELETE /eleicoes
│   ├── resultados/             # /candidatos, /candidaturas, /partidos, /resultados, /secoes
│   ├── importacao/             # POST /importar/* (streaming SSE)
│   ├── geo/                    # /geo/bairros, /geo/geocoding, /geo/locais-votacao
│   └── migrations/             # Alembic versions
│
└── frontend/                   # React 19 + Vite + TypeScript
    ├── Dockerfile
    ├── nginx.conf               # Proxy nginx (dev: vite proxy; prod: este arquivo)
    ├── package.json
    ├── vite.config.ts           # Proxy de desenvolvimento → localhost:8000
    ├── public/
    │   └── geo/
    │       ├── municipios_br.json      # GeoJSON IBGE 2022 (5.572 municípios)
    │       ├── brasil_outline.json
    │       ├── regioes_outline.json
    │       └── estados_outline.json
    └── src/
        ├── pages/              # LoginPage, HomePage, MapaPage, CandidatosPage,
        │                       # EleioesPage, PartidosPage, ImportacaoPage,
        │                       # UsuariosPage, GeografiaPage
        ├── components/         # Sidebar, Topbar, painel/, candidatos/, usuarios/
        └── services/           # auth.ts, eleitoral.ts, candidatos.ts, users.ts,
                                #  importacao.ts, geo.ts
```

---

## Módulos do Sistema

| Módulo | Status | Descrição |
|---|---|---|
| `auth` | ✅ Implementado | Login, JWT |
| `users` | ✅ Implementado | CRUD de usuários com RBAC |
| `eleicoes` | ✅ Implementado | Eleições com cache in-memory |
| `candidatos` | ✅ Implementado | Candidatos e candidaturas |
| `partidos` | ✅ Implementado | Partidos políticos |
| `resultados` | ✅ Implementado | Resultados eleitorais (70+ endpoints) |
| `importacao` | ✅ Implementado | Import de CSVs do TSE via interface web (SSE) |
| `mapa` | ✅ Implementado | Mapa territorial interativo com Leaflet, ranking por cargo, perfil de candidato por escopo |
| `geografia` | ✅ Implementado | Gerenciamento de bairros, polígonos (Leaflet-Geoman), geocodificação de locais de votação |
| `pesquisas` | 🔜 Planejado | Pesquisas eleitorais próprias |
| `comparacao` | 🔜 Planejado | Comparação entre eleições/candidatos |

---

## Público-Alvo

| Perfil | Necessidade Principal |
|---|---|
| Candidato | Entender histórico eleitoral e zonas de força por território |
| Pré-candidato | Avaliar potencial com base em perfil político e histórico partidário |
| Coordenador de campanha | Priorizar esforços por zona, município e seção eleitoral |
| Consultor eleitoral | Análise comparativa entre eleições, territórios e candidatos |
| Partido político | Mapear forças, fragilidades e oportunidades territoriais |

---

## Como Rodar Localmente

### Pré-requisitos

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado e rodando

### 1. Configurar o ambiente

```bash
git clone <url-do-repositorio>
cd pite
cp .env.exemplo .env
```

Edite o `.env` com suas credenciais:

```ini
DB_PASSWORD=senha-segura-aqui
JWT_SECRET_KEY=   # gere com: python -c "import secrets; print(secrets.token_hex(32))"
JWT_EXPIRATION_MINUTES=60
CORS_ORIGINS=http://localhost,http://127.0.0.1
```

### 2. Subir os containers

```bash
docker compose up -d --build
```

### 3. Criar as tabelas e o primeiro admin

```bash
docker compose exec backend alembic upgrade head
docker compose cp backend/create_admin.py backend:/app/backend/create_admin.py
docker compose exec backend python create_admin.py
```

### 4. Acessar

| URL | Descrição |
|---|---|
| `http://127.0.0.1:8080` | Aplicação (local Windows) |
| `http://localhost` | Aplicação (Linux/macOS) |
| `http://localhost:8000/docs` | Swagger — apenas sem Docker ou com port expose |

> **Windows:** use `http://127.0.0.1:8080` — `localhost` pode não funcionar com Docker Desktop/WSL2.

---

## Deploy em VPS

Ver [14 — Guia de Desenvolvimento](docs/14-guia-de-desenvolvimento.md) — seção Deploy em VPS.

**Resumo:**
1. Provisionar VPS Ubuntu 22.04 (Hostinger, Hetzner, DigitalOcean)
2. Instalar Docker: `curl -fsSL https://get.docker.com | sh`
3. Clonar o repositório e criar o `.env` com as variáveis de produção
4. `docker compose up -d --build`
5. Rodar migrations e criar admin
6. Configurar domínio + SSL com Certbot

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
| [14 — Guia de Desenvolvimento](docs/14-guia-de-desenvolvimento.md) | Setup local, Docker, deploy em VPS, módulos e troubleshooting |

---

## Cuidados Éticos e Legais

- Utiliza exclusivamente dados **públicos** do TSE e pesquisas próprias autorizadas.
- Análises sempre **territoriais e agregadas** — nunca dados individuais de eleitores.
- Conformidade com a **LGPD** e legislação eleitoral brasileira.
- Proibição absoluta de microdirecionamento de eleitores.

Veja: [09 — Governança, Segurança e Privacidade](docs/09-governanca-seguranca-privacidade.md)
