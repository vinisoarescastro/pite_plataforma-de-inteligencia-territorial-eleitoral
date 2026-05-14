# 06 — Arquitetura

> Descreve a estrutura técnica da plataforma: camadas, serviços, tecnologias e fluxo de dados.

---

## 1. Visão Geral

```
┌──────────────────────────────────────────────────────┐
│              NAVEGADOR — SPA React                   │
│    React + TypeScript | Leaflet | React Router       │
│    Context API / Zustand (estado global)             │
└─────────────────────────┬────────────────────────────┘
                           │ HTTPS / REST / JSON
┌─────────────────────────▼────────────────────────────┐
│              API REST — Node.js + TypeScript         │
│          Fastify ou Express                          │
│  Autenticação JWT  │ Autorização RBAC  │ Validação   │
│  Auditoria de ações │ Rate limiting    │ OpenAPI     │
└───────┬──────────────────┬──────────────────┬────────┘
        │                  │                  │
┌───────▼──────┐   ┌───────▼──────┐   ┌──────▼───────┐
│  PostgreSQL  │   │ Processamento│   │  Importação  │
│  + PostGIS   │   │  e Cálculo   │   │  de Dados    │
│              │   │  de Índices  │   │  (TSE, CSV)  │
│  Redis Cache │   └──────────────┘   └──────────────┘
└──────────────┘
```

---

## 2. Camadas da Arquitetura

### 2.1 Camada de Apresentação — SPA React

| Decisão | Escolha |
|---|---|
| Framework | React 18 (Hooks, Context API) |
| Linguagem | TypeScript |
| Build | Vite |
| Mapas | Leaflet + React-Leaflet |
| Roteamento | React Router |
| Estado global | Context API ou Zustand |
| Gráficos | ECharts ou Recharts |
| Estilização | CSS Modules ou Tailwind |
| Testes | Vitest + Testing Library |

**Uso do Leaflet:**
- Renderizar camadas de municípios, zonas eleitorais, seções eleitorais e bairros.
- Exibir camadas temáticas por classificação territorial (zona de força, disputa, expansão, adversário, neutro, consolidado, volátil).
- Suportar interatividade: clique em território, zoom, filtros visuais e painel lateral de detalhes.
- Exibir locais de votação como marcadores.

---

### 2.2 Camada de API — Node.js

| Decisão | Escolha |
|---|---|
| Runtime | Node.js |
| Framework | Fastify ou Express |
| Linguagem | TypeScript |
| Autenticação | JWT (access token 15min + refresh token 7d) |
| Autorização | RBAC por perfil de acesso |
| Documentação | OpenAPI / Swagger |
| Validação | Zod |
| ORM | Knex ou Prisma |
| Testes | Jest ou Vitest |

---

### 2.3 Camada de Banco de Dados

| Componente | Escolha |
|---|---|
| Banco principal | PostgreSQL 15+ com PostGIS |
| Consultas geoespaciais | PostGIS (ST_Contains, ST_Intersects, ST_Within) |
| Cache | Redis (consultas frequentes, sessões) |
| Migrations | Knex migrations ou Flyway |

---

### 2.4 Camada de Importação de Dados

- Scripts TypeScript/Node.js para processar arquivos CSV do TSE.
- Validação de integridade antes da inserção (hash SHA-256).
- Processamento em etapas: **staging → validação → consolidação**.
- Registro em `importacao_dados` para rastreabilidade completa.
- Suporte a execução manual e agendada.

---

### 2.5 Camada de Processamento

- Cálculo do índice de força territorial.
- Classificação automática de territórios por regras documentadas.
- Agregação de resultados por múltiplas granularidades territoriais.
- Processamento assíncrono via filas (**BullMQ**) para importações pesadas.

---

### 2.6 Camada de Mapas e Georreferenciamento

- Dados geográficos: GeoJSON/Shapefile do TSE e IBGE.
- PostGIS para consultas espaciais no banco.
- Coordenadas em **WGS84 (EPSG:4326)** — padrão Leaflet.
- Tiles: OpenStreetMap como base ou tiles próprios via PMTiles.
- Camadas disponíveis no Leaflet: municípios, zonas eleitorais, seções, bairros, locais de votação.

---

### 2.7 Camada de Autenticação e Autorização

- JWT com access token de curta duração (15 min) e refresh token (7 dias).
- Perfis: `administrador`, `analista`, `visualizador`.
- **Multi-tenant**: cada organização acessa apenas seus dados e os dados públicos do TSE.
- Log de acessos e ações sensíveis via `servico_auditoria`.

---

### 2.8 Camada de Auditoria e Logs

- Registro de importações com hash do arquivo.
- Log de consultas a dados sensíveis.
- Auditoria de CRUD das entidades principais.
- Logs estruturados em JSON para análise.

---

## 3. Estrutura de Pastas do Repositório

```
plataforma-inteligencia-territorial-eleitoral/
│
├── documentacao/           # Todos os documentos do projeto
│
├── aplicacao/              # SPA React (front-end)
│   ├── publico/
│   └── src/
│       ├── ativos/
│       ├── componentes/
│       │   ├── comuns/
│       │   ├── mapa/
│       │   ├── graficos/
│       │   └── layout/
│       ├── modulos/
│       │   ├── candidato/
│       │   ├── eleicao/
│       │   ├── territorio/
│       │   ├── pesquisa/
│       │   ├── painel/
│       │   ├── importacao/
│       │   └── usuario/
│       ├── nucleo/
│       ├── utilitarios/
│       ├── configuracoes/
│       └── tipos/
│
├── api/                    # Back-end Node.js
│   └── src/
│       ├── modulos/
│       │   ├── candidato/
│       │   ├── eleicao/
│       │   ├── territorio/
│       │   ├── resultado_eleitoral/
│       │   ├── pesquisa/
│       │   ├── importacao/
│       │   └── usuario/
│       ├── nucleo/
│       └── processamento/
│
├── banco_dados/
│   ├── migracoes/
│   ├── sementes/
│   └── esquema.sql
│
├── importacao/
│   ├── tse/
│   └── geografico/
│
├── infraestrutura/
│   ├── docker/
│   └── ci_cd/
│
├── .gitignore
├── .editorconfig
├── README.md
└── LICENCA.md
```

---

## 4. Fluxo de Dados

```
TSE (CSV/ZIP)
     │
     ▼
Importação → Staging → Validação → Consolidação → PostgreSQL/PostGIS
                                                        │
                                                        ▼
                                                  API Node.js
                                                  (cache Redis)
                                                        │
                                                        ▼
                                               SPA React + Leaflet
```

---

## 5. Decisões Técnicas e Justificativas

| Decisão | Justificativa |
|---|---|
| React SPA | Interface interativa e responsiva; ecossistema maduro para dashboards |
| Leaflet | Biblioteca de mapas open-source leve; suporte robusto a GeoJSON |
| Node.js + TypeScript | Mesma linguagem no front e back-end; tipagem estática reduz erros |
| PostgreSQL + PostGIS | Banco relacional com suporte nativo a dados geoespaciais |
| Redis | Cache para consultas frequentes de resultados eleitorais |
| BullMQ | Processamento assíncrono de importações pesadas sem bloquear a API |
| JWT + RBAC | Padrão amplamente adotado; perfis granulares para múltiplos públicos |
