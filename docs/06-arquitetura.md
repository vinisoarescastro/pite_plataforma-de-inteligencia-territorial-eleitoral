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
│              API REST — Python + FastAPI             │
│  Autenticação JWT  │ Autorização RBAC  │ Pydantic    │
│  Auditoria de ações │ Rate limiting    │ OpenAPI/Swagger (automático) │
└───────┬──────────────────┬──────────────────┬────────┘
        │                  │                  │
┌───────▼──────┐   ┌───────▼──────┐   ┌──────▼───────┐
│  PostgreSQL  │   │ Processamento│   │  Importação  │
│  + PostGIS   │   │  e Cálculo   │   │  de Dados    │
│  (local no   │   │  de Índices  │   │  (TSE, CSV)  │
│  dev; nuvem  │   └──────────────┘   │  Pandas +    │
│  em produção)│                      │  GeoPandas   │
└──────────────┘                      └──────────────┘
```

**Modelo de instalação: Single-tenant** — uma organização por instalação. Sem isolamento de dados entre organizações.

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
| Testes | Vitest + Testing Library (planejado) |

**Uso do Leaflet — implementado:**
- GeoJSON de 5.572 municípios (IBGE 2022) carregado via fetch e renderizado com `L.geoJSON`.
- Navegação hierárquica em 4 níveis: Brasil → Região → Estado → Município.
- Contornos dissolvidos por nível (sem bordas internas) via arquivos GeoJSON pré-computados com Shapely.
- Painel lateral dinâmico com estatísticas e dados eleitorais por nível de navegação.
- Breadcrumb interativo sobre o mapa para navegação reversa.
- Dados eleitorais (votos, %, aptos, abstenções, histórico) consumidos da API e exibidos no painel do município.

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

**Estratégia de banco por ambiente:**
- **Desenvolvimento:** PostgreSQL instalado localmente na máquina (sem containers). Instalação via [postgresql.org/download](https://www.postgresql.org/download/) + extensão PostGIS via Stack Builder.
- **Produção:** banco gerenciado em nuvem. Opção recomendada: **Neon.tech** (PostgreSQL serverless com PostGIS, plano gratuito até 0,5 GB, migração simples alterando a string de conexão no `.env`).

**Por que PostgreSQL + PostGIS?**
O PostGIS é uma extensão do PostgreSQL que permite guardar polígonos geográficos (shapes de municípios, zonas, seções) e fazer consultas espaciais como "quais seções estão dentro deste município". É essencial para o funcionamento do mapa. Não há alternativa equivalente em outros bancos relacionais.

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

- JWT com access token de curta duração (padrão: 15 min, configurável via `JWT_EXPIRATION_MINUTES` no `.env`).
- Perfis: `administrador`, `gestor`, `analista`, `assessor`.
- **Single-tenant**: todos os usuários pertencem à mesma instalação.
- `last_login` gravado no banco a cada login bem-sucedido.
- Tela de boas-vindas exibida uma vez por sessão, com conteúdo dinâmico por perfil.

**Dependências de autenticação (`backend/dependencies.py`):**
```python
# Rota protegida — qualquer usuário autenticado
@router.get("/dados")
def listar(user: User = Depends(get_current_user)):
    ...

# Rota restrita ao administrador
@router.get("/users")
def listar_usuarios(_: User = Depends(require_admin)):
    ...
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
├── docs/                       # toda a documentação do projeto
│
├── scripts/                    # scripts utilitários (rodados uma vez)
│   ├── gerar_contornos.py      # gera GeoJSON dissolvidos (Brasil, Regiões, Estados) com Shapely
│   ├── importar_municipios_tse.py  # popula tabela municipio_tse_ibge (5.571 municípios)
│   └── importar_resultados_tse.py  # importa CSV do TSE → tabelas de eleição/resultado
│
├── frontend/                   # SPA React + Vite
│   ├── vite.config.ts          # proxy /auth, /users, /eleicoes, /candidatos, /resultados → :8000
│   └── src/
│       ├── pages/
│       │   ├── LoginPage.tsx
│       │   ├── WelcomePage.tsx
│       │   ├── HomePage.tsx    # shell principal (sidebar + topbar + conteúdo)
│       │   ├── MapaPage.tsx    # mapa territorial com navegação hierárquica
│       │   └── UsuariosPage.tsx
│       ├── services/
│       │   ├── auth.ts
│       │   ├── users.ts
│       │   └── eleitoral.ts    # listarEleicoes, listarCandidatos, buscarResultado…
│       └── components/
│           ├── Sidebar.tsx
│           ├── Topbar.tsx
│           ├── painel/
│           └── usuarios/
│   └── public/
│       └── geo/
│           ├── municipios_br.json      # GeoJSON IBGE 2022 (59 MB, 5.572 municípios)
│           ├── brasil_outline.json     # contorno Brasil dissolvido (95 KB)
│           ├── regioes_outline.json    # contornos 5 regiões dissolvidos (185 KB)
│           └── estados_outline.json   # contornos 27 estados dissolvidos (374 KB)
│
├── backend/                    # API Python + FastAPI
│   ├── main.py                 # registra todos os routers
│   ├── settings.py             # variáveis de ambiente
│   ├── database.py             # conexão SQLAlchemy
│   ├── dependencies.py         # get_current_user, require_admin
│   ├── security.py             # JWT, bcrypt
│   ├── requirements.txt        # inclui pandas
│   ├── models/
│   │   ├── user.py             # tabela users
│   │   └── eleitoral.py        # MunicipioTSE, Eleicao, Candidato, ResultadoEleitoral
│   ├── auth/                   # POST /auth/login
│   ├── users/                  # GET/POST/PUT /users
│   ├── eleicoes/               # GET/POST/DELETE /eleicoes
│   ├── resultados/             # /candidatos, /resultados/municipio/{cd}, /resultados/mapa
│   ├── migrations/
│   │   └── versions/
│   │       ├── 0f08b7443f87_create_users_table.py
│   │       ├── b9e3f1a2c847_add_user_permissions_and_last_login.py
│   │       └── c3d4e5f6a7b8_create_electoral_tables.py
│   └── seeds/
│
├── municipio_tse_ibge.csv      # mapeamento TSE→IBGE (fonte: TSE) — não versionar se grande
├── .gitignore
├── .env.example
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
| React 19 + TypeScript + CSS Modules | Interface interativa com mapas e dashboards; TypeScript adotado desde o início para segurança de tipos |
| Leaflet | Biblioteca de mapas open-source leve; suporte robusto a GeoJSON |
| Python + FastAPI | Linguagem mais legível para iniciante; FastAPI gera Swagger automaticamente; melhor ecossistema para dados |
| Pydantic | Validação automática de dados com mensagens de erro claras; incluso no FastAPI |
| SQLAlchemy + GeoAlchemy2 | ORM maduro com suporte nativo a PostGIS; consultas geoespaciais integradas |
| Alembic | Migrações versionadas, padrão do ecossistema SQLAlchemy |
| PostgreSQL + PostGIS | Banco relacional com suporte nativo a dados geoespaciais — sem alternativa equivalente |
| Sem Redis no MVP | Cache adiciona complexidade de configuração sem necessidade no início; incluir em V2 se necessário |
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
| Frontend | React + TypeScript | React 19 + TypeScript + CSS Modules | TypeScript adotado desde o início |
| Filas | BullMQ | Sem fila no MVP (Celery no futuro) | Complexidade desnecessária no início |
| Multi-tenant | Sim | Não — single-tenant | Simplifica autenticação, banco e queries |
| Importação CSV | TypeScript/Node.js | Python + Pandas | Pandas é muito superior para este caso |
| Migrations | Knex migrations / Flyway | Alembic | Padrão do ecossistema Python/SQLAlchemy |
| Documentação API | OpenAPI manual | Gerada automaticamente pelo FastAPI | Menos trabalho, sempre atualizada |
| Infraestrutura | Docker / containers | Sem containers | Instalação direta simplifica o desenvolvimento; sem overhead de configuração |
| Banco (dev) | Container PostgreSQL | PostgreSQL local instalado na máquina | Mais simples, sem dependência de Docker |
| Banco (produção) | Container / auto-hospedado | Neon.tech (banco gerenciado na nuvem) | Sem gerenciamento de servidor; plano gratuito para MVP |
