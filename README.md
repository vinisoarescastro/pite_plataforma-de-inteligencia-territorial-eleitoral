# PITE — Plataforma de Inteligência Territorial Eleitoral

> Plataforma SPA de inteligência territorial eleitoral para análise estratégica de dados do TSE, pesquisas eleitorais e classificação territorial.

---

## Visão Geral

A **PITE** é uma plataforma web que permite analisar, visualizar e interpretar dados eleitorais históricos públicos (TSE), cruzados com pesquisas próprias autorizadas, dados geográficos e perfis políticos territoriais — apoiando decisões estratégicas de candidatos, pré-candidatos, partidos, consultorias eleitorais e equipes de campanha.

Todas as análises são de natureza **territorial, estatística e agregada** — nunca individuais.

---

## Público-Alvo

| Perfil | Necessidade Principal |
|---|---|
| Candidato | Entender histórico eleitoral e zonas de força por território |
| Pré-candidato | Avaliar potencial eleitoral com base em perfil político e histórico partidário |
| Coordenador de campanha | Priorizar esforços por zona, município e seção eleitoral |
| Consultor eleitoral | Análise comparativa entre eleições, territórios e candidatos |
| Partido político | Mapear forças, fragilidades e oportunidades territoriais |
| Pesquisador | Cruzar dados públicos do TSE com pesquisas próprias |
| Analista | Produzir indicadores, relatórios e painéis para suporte à decisão |

---

## Stack Tecnológica

| Camada | Tecnologia |
|---|---|
| Front-end | React 18 + JavaScript + Vite |
| Mapas | Leaflet + React-Leaflet |
| Back-end | Python 3.12 + FastAPI |
| Validação | Pydantic (incluso no FastAPI) |
| ORM | SQLAlchemy + GeoAlchemy2 |
| Migrations | Alembic |
| Banco de dados | PostgreSQL 16 + PostGIS (local no dev; Neon.tech em produção) |
| Autenticação | JWT (python-jose + passlib) |
| Scripts de dados | Python + Pandas + GeoPandas |

---

## Arquitetura

O sistema é **single-tenant** (uma organização por instalação) e organizado em dois projetos separados:

```
NAVEGADOR (SPA React)
       ↕ HTTP / REST / JSON
API REST (Python + FastAPI)
       ↕
PostgreSQL + PostGIS
```

---

## Documentação

Toda a documentação do projeto está na pasta [`docs/`](docs/).

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
| [09 — Governança, Segurança e Privacidade](docs/09-governanca-seguranca-privacidade.md) | LGPD, segurança da informação e ética |
| [10 — Roadmap](docs/10-roadmap.md) | Fases e marcos do desenvolvimento |
| [11 — Backlog Inicial](docs/11-backlog-inicial.md) | Épicos e tarefas por prioridade |
| [12 — Dicionário de Dados](docs/12-dicionario-de-dados.md) | Glossário técnico de entidades e termos |
| [13 — Guia de Nomenclatura](docs/13-guia-de-nomenclatura.md) | Padrões de código em português do Brasil |

---

## Como Rodar o Projeto Localmente

### Pré-requisitos

- [PostgreSQL 16+](https://www.postgresql.org/download/) instalado localmente com a extensão **PostGIS** (disponível via Stack Builder durante a instalação)
- [Python 3.12+](https://www.python.org/) instalado
- [Node.js 20+](https://nodejs.org/) instalado

### 1. Configurar o banco de dados local

Após instalar o PostgreSQL, crie o banco e habilite o PostGIS:

```sql
CREATE DATABASE pite;
\c pite
CREATE EXTENSION postgis;
```

Copie o arquivo de exemplo e ajuste as credenciais:

```bash
cp .env.exemplo .env
# edite o .env com seu usuário e senha do PostgreSQL local
```

### 2. Rodar o backend (API Python)

```bash
cd backend
python -m venv .venv
# Windows:
.venv\Scripts\activate
# Linux/Mac:
source .venv/bin/activate

pip install -r requirements.txt
alembic upgrade head      # cria as tabelas no banco
uvicorn main:app --reload  # inicia o servidor
```

A API estará disponível em: http://localhost:8000

Documentação automática: http://localhost:8000/docs

### 3. Rodar o frontend (SPA React)

```bash
cd frontend
npm install
npm run dev
```

O frontend estará disponível em: http://localhost:5173

---

## Módulos do Sistema

| Módulo | Descrição |
|---|---|
| `modulo_candidato` | Cadastro e gestão de candidatos e pré-candidatos |
| `modulo_eleicao` | Histórico, candidaturas e resultados eleitorais |
| `modulo_territorio` | Mapa interativo, zonas, seções e classificação territorial |
| `modulo_pesquisa` | Cadastro, importação e cruzamento de pesquisas eleitorais |
| `modulo_importacao` | Importação e normalização de dados do TSE |
| `modulo_painel` | Painéis analíticos, gráficos e indicadores |
| `modulo_usuario` | Autenticação e controle de acesso |

---

## Status do Projeto

> **Fase 0 — Fundação** — Documentação estratégica e técnica concluída. Início do desenvolvimento.

---

## Cuidados Éticos e Legais

- Utiliza exclusivamente dados públicos do TSE e pesquisas próprias autorizadas.
- Análises sempre territoriais e agregadas — **nunca dados individuais de eleitores**.
- Conformidade com a **LGPD** e legislação eleitoral brasileira.
- Proibição absoluta de microdirecionamento de eleitores.

Veja o documento completo: [09 — Governança, Segurança e Privacidade](docs/09-governanca-seguranca-privacidade.md).
