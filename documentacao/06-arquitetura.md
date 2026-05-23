# 06 — Arquitetura

> Descreve a estrutura técnica da plataforma: camadas, serviços, tecnologias e fluxo de dados.

---

## 1. Visão Geral

```
┌──────────────────────────────────────────────────────┐
│              NAVEGADOR — SPA React                   │
│    React 18 + JavaScript | Leaflet | React Router    │
│    Context API (estado global)                       │
└─────────────────────────┬────────────────────────────┘
                           │ HTTP / REST / JSON
┌─────────────────────────▼────────────────────────────┐
│              API REST — Python + FastAPI             │
│  Autenticação JWT  │ Autorização RBAC  │ Pydantic    │
│  Auditoria de ações │ Rate limiting    │ OpenAPI/Swagger (automático) │
└───────┬──────────────────┬──────────────────┬────────┘
        │                  │                  │
┌───────▼──────┐   ┌───────▼──────┐   ┌──────▼───────┐
│  PostgreSQL  │   │ Processamento│   │  Importação  │
│  + PostGIS   │   │  e Cálculo   │   │  de Dados    │
│              │   │  de Índices  │   │  (TSE, CSV)  │
│  Redis Cache │   └──────────────┘   │  Pandas +    │
│  (opcional)  │                      │  GeoPandas   │
└──────────────┘                      └──────────────┘
```

**Modelo de instalação: Single-tenant** — uma organização por instalação. Sem isolamento de dados entre organizações.

---

## 2. Camadas da Arquitetura

### 2.1 Camada de Apresentação — SPA React

| Decisão | Escolha |
|---|---|
| Framework | React 18 (Hooks, Context API) |
| Linguagem | JavaScript (TypeScript pode ser adicionado futuramente) |
| Build | Vite |
| Mapas | Leaflet + React-Leaflet |
| Roteamento | React Router |
| Estado global | Context API |
| Gráficos | Recharts |
| Estilização | Tailwind CSS |
| Testes | Vitest + Testing Library |

**Por que JavaScript sem TypeScript inicialmente?**
TypeScript adiciona uma camada extra de complexidade (configuração, tipos, interfaces, generics). Para uma pessoa iniciante, começar com JavaScript puro acelera o aprendizado. TypeScript pode ser migrado futuramente, quando o código já estiver funcionando.

**Uso do Leaflet:**
- Renderizar camadas de municípios, zonas eleitorais, seções eleitorais e bairros.
- Exibir camadas temáticas por classificação territorial (zona de força, disputa, expansão, adversário, neutro, consolidado, volátil).
- Suportar interatividade: clique em território, zoom, filtros visuais e painel lateral de detalhes.
- Exibir locais de votação como marcadores.

---

### 2.2 Camada de API — Python + FastAPI

| Decisão | Escolha |
|---|---|
| Linguagem | Python 3.12 |
| Framework | FastAPI |
| Validação | Pydantic v2 (incluso no FastAPI) |
| Autenticação | JWT — python-jose + passlib (bcrypt) |
| Autorização | RBAC por perfil de acesso |
| Documentação | OpenAPI / Swagger — gerado **automaticamente** pelo FastAPI |
| ORM | SQLAlchemy 2.0 |
| Suporte geoespacial | GeoAlchemy2 |
| Migrations | Alembic |
| Testes | pytest + httpx |
| Servidor | Uvicorn |

**Por que FastAPI?**
- Sintaxe simples e próxima do Python puro
- Valida automaticamente os dados de entrada com Pydantic
- Gera documentação Swagger automática em `/docs` — sem esforço extra
- Performance excelente para uma API REST
- Comunidade grande e documentação clara

**Estrutura de um módulo no backend:**
```
api/modulos/candidato/
├── roteador.py       → define as rotas (GET, POST, PUT, DELETE)
├── esquemas.py       → modelos Pydantic para validação
├── servico.py        → lógica de negócio
└── repositorio.py    → acessa o banco via SQLAlchemy
```

---

### 2.3 Camada de Banco de Dados

| Componente | Escolha |
|---|---|
| Banco principal | PostgreSQL 16 com PostGIS |
| Consultas geoespaciais | PostGIS (ST_Contains, ST_Intersects, ST_Within) |
| ORM | SQLAlchemy + GeoAlchemy2 |
| Migrations | Alembic (versionadas e rastreáveis) |
| Cache | Redis (opcional no MVP — habilitar conforme necessidade) |

**Por que PostgreSQL + PostGIS?**
O PostGIS é uma extensão do PostgreSQL que permite guardar polígonos geográficos (shapes de municípios, zonas, seções) e fazer consultas espaciais como "quais seções estão dentro deste município". É essencial para o funcionamento do mapa.

---

### 2.4 Camada de Importação de Dados

- Scripts Python que processam os arquivos CSV do TSE.
- **Pandas**: leitura, limpeza e transformação dos CSVs.
- **GeoPandas**: processamento de arquivos geográficos (Shapefile, GeoJSON).
- Validação de integridade antes da inserção (hash SHA-256).
- Processamento em etapas: **staging → validação → consolidação**.
- Registro em `importacao_dados` para rastreabilidade completa.
- No MVP: execução manual e síncrona (sem fila).
- No futuro (V2): Celery + Redis para importações assíncronas pesadas.

**Por que Python + Pandas para importação?**
Os arquivos do TSE são CSVs grandes, com encoding especial e nomes inconsistentes. Pandas é o padrão da indústria para esse tipo de trabalho — muito mais simples do que fazer em JavaScript.

---

### 2.5 Camada de Processamento

- Cálculo do índice de força territorial (função Python pura).
- Classificação automática de territórios por regras documentadas.
- Agregação de resultados por múltiplas granularidades territoriais.
- No MVP: processamento síncrono (junto à requisição da API).
- No futuro (V2): processamento assíncrono via **Celery + Redis** para operações pesadas.

---

### 2.6 Camada de Mapas e Georreferenciamento

- Dados geográficos: GeoJSON/Shapefile do TSE e IBGE.
- PostGIS para consultas espaciais no banco.
- Coordenadas em **WGS84 (EPSG:4326)** — padrão Leaflet.
- Tiles: OpenStreetMap como base.
- Camadas disponíveis no Leaflet: municípios, zonas eleitorais, seções, bairros, locais de votação.

---

### 2.7 Camada de Autenticação e Autorização

- JWT com access token de curta duração (15 min) e refresh token (7 dias).
- Perfis: `administrador`, `analista`, `visualizador`.
- **Single-tenant**: todos os usuários pertencem à mesma instalação. Não há separação por organização.
- Log de acessos e ações sensíveis via `servico_auditoria`.

**Implementação no FastAPI:**
```python
# Exemplo simples de rota protegida
@roteador.get("/candidatos")
def listar_candidatos(usuario_atual = Depends(obter_usuario_atual)):
    return servico_candidato.listar()
```

---

### 2.8 Camada de Auditoria e Logs

- Registro de importações com hash do arquivo.
- Log de acesso a dados sensíveis.
- Auditoria de CRUD das entidades principais.
- Logs estruturados em JSON.

---

## 3. Estrutura de Pastas do Repositório

```
pite/
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
│       ├── nucleo/         # autenticação, contextos, hooks globais
│       ├── utilitarios/
│       ├── configuracoes/
│       └── paginas/        # uma pasta por página/rota
│
├── api/                    # Back-end Python + FastAPI
│   ├── main.py             # ponto de entrada da API
│   ├── configuracoes.py    # variáveis de ambiente
│   ├── banco_dados.py      # conexão com PostgreSQL via SQLAlchemy
│   ├── dependencias.py     # injeção de dependências (auth, db session)
│   ├── requirements.txt    # dependências Python
│   ├── modulos/
│   │   ├── candidato/
│   │   │   ├── roteador.py
│   │   │   ├── esquemas.py
│   │   │   ├── servico.py
│   │   │   └── repositorio.py
│   │   ├── eleicao/
│   │   ├── territorio/
│   │   ├── resultado_eleitoral/
│   │   ├── pesquisa/
│   │   ├── importacao/
│   │   └── usuario/
│   └── processamento/      # cálculos: índice de força, classificação
│
├── banco_dados/
│   ├── migracoes/          # migrações Alembic
│   │   ├── env.py
│   │   └── versoes/        # arquivos de migração versionados
│   ├── modelos/            # modelos SQLAlchemy (tabelas)
│   └── sementes/           # dados iniciais (partidos, cargos)
│
├── importacao/             # scripts de importação de dados externos
│   ├── tse/                # scripts para CSVs do TSE (Pandas)
│   └── geografico/         # scripts para GeoJSON/Shapefile (GeoPandas)
│
├── docker-compose.yml      # sobe PostgreSQL + PostGIS + Redis
├── .gitignore
├── .editorconfig
└── README.md
```

---

## 4. Fluxo de Dados

```
TSE (CSV/ZIP)
     │
     ▼ python importacao/tse/importar_resultados.py
Pandas (limpeza) → Staging → Validação → PostgreSQL/PostGIS
                                               │
                                               ▼
                                      API FastAPI (SQLAlchemy)
                                      (cache Redis — opcional)
                                               │
                                               ▼
                                     SPA React + Leaflet
```

---

## 5. Decisões Técnicas e Justificativas

| Decisão | Justificativa |
|---|---|
| React 18 + JavaScript | Interface interativa com mapas e dashboards; JavaScript sem TypeScript é mais simples para iniciante |
| Leaflet | Biblioteca de mapas open-source leve; suporte robusto a GeoJSON |
| Python + FastAPI | Linguagem mais legível para iniciante; FastAPI gera Swagger automaticamente; melhor ecossistema para dados |
| Pydantic | Validação automática de dados com mensagens de erro claras; incluso no FastAPI |
| SQLAlchemy + GeoAlchemy2 | ORM maduro com suporte nativo a PostGIS; consultas geoespaciais integradas |
| Alembic | Migrações versionadas, padrão do ecossistema SQLAlchemy |
| PostgreSQL + PostGIS | Banco relacional com suporte nativo a dados geoespaciais — sem alternativa equivalente |
| Redis (opcional MVP) | Cache para consultas frequentes; pode ser ativado quando o volume de dados justificar |
| Pandas + GeoPandas | Padrão da indústria para processamento de CSV e dados geográficos em Python |
| JWT + RBAC | Padrão amplamente adotado; perfis granulares sem complexidade de multi-tenant |
| Single-tenant | Elimina toda a complexidade de isolamento de dados entre organizações; cada instalação é uma implantação independente |
| Sem BullMQ/Celery no MVP | Filas assíncronas adicionam complexidade sem necessidade no início; importações síncronas são suficientes para o MVP |

---

## 6. Comparação: Stack Anterior vs. Stack Atual

| Aspecto | Antes (planejado) | Agora (adotado) | Motivo da mudança |
|---|---|---|---|
| Backend | Node.js + TypeScript + Fastify | Python + FastAPI | Python é mais simples para iniciante e melhor para dados |
| ORM | Knex ou Prisma | SQLAlchemy + GeoAlchemy2 | Suporte nativo a PostGIS; ecossistema Python |
| Validação | Zod | Pydantic (incluso no FastAPI) | Menos dependências; automático |
| Frontend | React + TypeScript | React + JavaScript | TypeScript pode ser adicionado depois |
| Filas | BullMQ | Sem fila no MVP (Celery no futuro) | Complexidade desnecessária no início |
| Multi-tenant | Sim | Não — single-tenant | Simplifica autenticação, banco e queries |
| Importação CSV | TypeScript/Node.js | Python + Pandas | Pandas é muito superior para este caso |
| Migrations | Knex migrations / Flyway | Alembic | Padrão do ecossistema Python/SQLAlchemy |
| Documentação API | OpenAPI manual | Gerada automaticamente pelo FastAPI | Menos trabalho, sempre atualizada |
