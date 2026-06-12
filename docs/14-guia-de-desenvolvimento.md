# 14 — Guia de Desenvolvimento

> Documentação técnica de como configurar, rodar e evoluir o projeto.
> Atualizado em: 2026-06-12 (v7)

---

## Índice

1. [Pré-requisitos](#1-pré-requisitos)
2. [Estrutura do Projeto](#2-estrutura-do-projeto)
3. [Configuração do Ambiente — Docker (recomendado)](#3-configuração-do-ambiente--docker-recomendado)
4. [Configuração do Ambiente — Desenvolvimento Manual](#4-configuração-do-ambiente--desenvolvimento-manual)
5. [Migrations — Alembic](#5-migrations--alembic)
6. [Módulos Implementados](#6-módulos-implementados)
7. [Como Adicionar um Novo Módulo](#7-como-adicionar-um-novo-módulo)
8. [Deploy em VPS](#8-deploy-em-vps)
9. [Problemas Conhecidos e Soluções](#9-problemas-conhecidos-e-soluções)
10. [Próximos Passos](#10-próximos-passos)

---

## 1. Pré-requisitos

### Para rodar via Docker (recomendado)

| Ferramenta | Versão | Download |
|---|---|---|
| Docker Desktop | Latest | [docker.com](https://www.docker.com/products/docker-desktop/) |
| Git | Qualquer | [git-scm.com](https://git-scm.com/) |

### Para desenvolvimento sem Docker (opcional)

| Ferramenta | Versão | Download |
|---|---|---|
| Python | 3.12+ | [python.org](https://www.python.org/) |
| Node.js | 20+ | [nodejs.org](https://nodejs.org/) |
| PostgreSQL + PostGIS | 16+ | [postgresql.org](https://www.postgresql.org/download/) |

---

## 2. Estrutura do Projeto

```
pite/
├── docker-compose.yml          # Orquestração: db + backend + frontend
├── .env                        # Variáveis de ambiente (não versionado)
├── .env.exemplo                # Template do .env
├── municipio_tse_ibge.csv      # Mapeamento TSE→IBGE (5.571 municípios)
│
├── backend/
│   ├── Dockerfile
│   ├── main.py                 # Entry point — registra routers + CORS
│   ├── settings.py             # Lê DATABASE_URL, JWT_*, CORS_ORIGINS do ambiente
│   ├── database.py             # Engine SQLAlchemy + get_db
│   ├── dependencies.py         # get_current_user, require_admin
│   ├── security.py             # hash_password, verify_password, create_access_token
│   ├── create_admin.py         # Script de seed do primeiro usuário admin
│   ├── requirements.txt
│   ├── alembic.ini
│   ├── models/
│   │   ├── user.py             # Tabela users
│   │   └── eleitoral.py        # Todos os modelos eleitorais
│   ├── auth/                   # POST /auth/login
│   ├── users/                  # CRUD /users
│   ├── eleicoes/               # /eleicoes + cache in-memory
│   ├── resultados/             # /candidatos, /candidaturas, /partidos,
│   │                           # /resultados/*, /secoes/*
│   ├── importacao/             # /importar/* (streaming SSE)
│   ├── geo/                    # /geo/ufs, /geo/municipios, /geo/bairros/*,
│   │   ├── router.py           # /geo/geocoding/*, /geo/locais-votacao
│   │   ├── schemas.py          # Pydantic schemas do módulo geo
│   │   └── geocoding.py        # BackgroundTask Nominatim (rate-limited 1 req/s)
│   └── migrations/versions/
│
└── frontend/
    ├── Dockerfile               # Multi-stage: node → nginx
    ├── nginx.conf               # Proxy reverso + SPA fallback
    ├── vite.config.ts           # Proxy de dev → localhost:8000
    ├── public/geo/              # GeoJSON estáticos (municipios, regioes, estados)
    └── src/
        ├── pages/
        ├── components/
        └── services/
```

---

## 3. Configuração do Ambiente — Docker (recomendado)

### 3.1 Clonar e configurar

```bash
git clone <url-do-repositorio>
cd pite
cp .env.exemplo .env
```

Edite o `.env`:

```ini
DB_PASSWORD=senha-forte-aqui

# Gere com: python -c "import secrets; print(secrets.token_hex(32))"
JWT_SECRET_KEY=chave-aleatoria-aqui

JWT_ALGORITHM=HS256
JWT_EXPIRATION_MINUTES=60
CORS_ORIGINS=http://localhost,http://127.0.0.1
```

### 3.2 Subir os containers

```bash
docker compose up -d --build
```

Aguarda o build (~2 min na primeira vez) e sobe três containers:
- `pite-db-1` — PostgreSQL 16 + PostGIS
- `pite-backend-1` — FastAPI na porta 8000 (interna)
- `pite-frontend-1` — nginx na porta 8080 (local) ou 80 (produção)

### 3.3 Criar as tabelas (primeira vez)

```bash
docker compose exec backend alembic upgrade head
```

### 3.4 Criar o primeiro usuário administrador

```bash
# Copiar o script para dentro do container
docker compose cp backend/create_admin.py backend:/app/backend/create_admin.py

# Executar
docker compose exec backend python create_admin.py
```

Credenciais padrão do script: `vinisoarescastro@gmail.com` / `admin123`.
**Troque a senha após o primeiro login.**

### 3.5 Acessar

| Ambiente | URL |
|---|---|
| Local — Windows | `http://127.0.0.1:8080` |
| Local — Linux/macOS | `http://localhost` |
| Produção (VPS) | `https://seudominio.com` |

> **Windows:** use `http://127.0.0.1:8080` — `localhost` pode não funcionar com Docker Desktop/WSL2.

### 3.6 Comandos úteis

```bash
# Ver logs em tempo real
docker compose logs -f backend
docker compose logs -f frontend

# Reiniciar um serviço
docker compose restart backend

# Parar tudo
docker compose down

# Parar e apagar o banco (cuidado — perde os dados)
docker compose down -v

# Rebuildar após mudanças no código
docker compose up -d --build
```

---

## 4. Configuração do Ambiente — Desenvolvimento Manual

Use este modo para editar o código e ver as mudanças em tempo real (hot reload).

### 4.1 Backend

```bash
cd backend
python -m venv .venv

# Windows
.venv\Scripts\activate
# Linux/macOS
source .venv/bin/activate

pip install -r requirements.txt
uvicorn main:app --reload
```

O backend precisa de um PostgreSQL + PostGIS rodando. A forma mais simples é deixar o container do banco rodando:

```bash
docker compose up -d db
```

Configure o `.env` com:
```ini
DATABASE_URL=postgresql://pite:senha@localhost:5432/pite
```

| URL | Descrição |
|---|---|
| `http://localhost:8000/health` | Health check |
| `http://localhost:8000/docs` | Swagger UI |

### 4.2 Frontend

```bash
cd frontend
npm install
npm run dev
```

O Vite sobe na porta 5173 e faz proxy automático de todas as rotas de API para `localhost:8000`.

| URL | Descrição |
|---|---|
| `http://localhost:5173` | App com hot reload |

---

## 5. Migrations — Alembic

### 5.1 Aplicar todas as migrations

```bash
# Via Docker
docker compose exec backend alembic upgrade head

# Sem Docker (dentro de backend/ com .venv ativo)
alembic upgrade head
```

### 5.2 Gerar nova migration após alterar um model

```bash
# Via Docker
docker compose exec backend alembic revision --autogenerate -m "descricao"

# Sem Docker
alembic revision --autogenerate -m "descricao"
```

> Sempre revise o arquivo gerado em `migrations/versions/` antes de aplicar.
> Remova qualquer `op.drop_table` de tabelas do PostGIS (`spatial_ref_sys`, etc.) que apareça.

### 5.3 Migrations existentes (cadeia atual)

| ID | Descrição |
|---|---|
| `a1b2c3d4e5f6` | Tabelas base (eleicoes, candidatos, candidaturas, partidos, resultados, votacao_secao, etc.) |
| `b2c3d4e5f6a7` | Índices e constraints iniciais |
| `j7e8f9a0b1c2` | Coluna `sg_uf` em `votacao_secao`; índices por eleição+UF e eleição+cargo |
| `k8f9a0b1c2d3` | Tabela `eleicao_resumo_cache` — KPIs pré-computados por eleição |
| `l9a0b1c2d3e4` | Tabelas `bairro` e `bairro_local_votacao` — módulo de geografia (fase 1) |
| `m0b1c2d3e4f5` | Coluna `geom GEOMETRY(POLYGON, 4326)` em `bairro` + índice GIST (fase 2) |
| `n1c2d3e4f5g6` | Tabela `local_votacao_geo` — coordenadas dos locais de votação via geocodificação (fase 3) |

### 5.4 Outros comandos

```bash
alembic current          # migration atual
alembic history          # histórico
alembic downgrade -1     # desfazer última migration
```

### 5.5 Configuração do `migrations/env.py`

O `env.py` filtra tabelas do PostGIS para que o Alembic não as detecte como "removidas":

```python
POSTGIS_TABLES = {"spatial_ref_sys", "geometry_columns", ...}

def include_object(object, name, type_, reflected, compare_to):
    if type_ == "table" and name in POSTGIS_TABLES:
        return False
    return True
```

> Sempre que criar um novo model, importe-o no `env.py`:
> ```python
> from models import user, eleitoral  # adicione novos models aqui
> ```

---

## 6. Módulos Implementados

### 6.1 Banco de dados — Tabelas principais

| Tabela | Descrição |
|---|---|
| `users` | Usuários com 4 perfis RBAC; UUID PK; vínculo opcional com candidato |
| `eleicoes` | Eleições com chave única (ano, turno, tipo) |
| `candidatos` | Candidatos; usuários não-admin veem apenas o seu |
| `candidaturas` | Vínculo candidato ↔ eleição + código TSE (`sq_candidato_tse`, `nr_votavel`) |
| `partidos` | Partidos políticos com sigla única |
| `resultados_eleitorais` | Votos totais por município (pré-agregados) |
| `votacao_secao` | Ground truth — votos por seção (BigInt PK, milhões de linhas) |
| `municipio_tse_ibge` | Mapeamento TSE ↔ IBGE (5.571 municípios) |
| `eleicao_resumo_cache` | KPIs pré-computados por eleição |
| `importacao_log` | Histórico de todos os imports com status e métricas |
| `bairro` | Regiões urbanas de um município; coluna `geom GEOMETRY(POLYGON, 4326)` opcional desenhada via Leaflet-Geoman |
| `bairro_local_votacao` | Vínculo N:N entre `bairro` e locais de votação |
| `local_votacao_geo` | Coordenadas lat/lng dos locais de votação geocodificados via Nominatim; campo `status` (pendente/geocodificado/erro) |

### 6.2 `auth` — Autenticação JWT

**Endpoint:** `POST /auth/login`

Response `200 OK`:
```json
{
  "access_token": "eyJ...",
  "token_type": "bearer",
  "user_name": "Vinícius Soares Castro",
  "user_profile": "administrador",
  "user_candidate": null,
  "user_can_export": true,
  "user_can_compare": true
}
```

**`localStorage` — chaves armazenadas após o login:**

| Chave | Conteúdo |
|---|---|
| `access_token` | JWT para chamadas autenticadas |
| `user_name` | Nome completo |
| `user_profile` | `administrador` \| `gestor` \| `analista` \| `assessor` |
| `user_candidate` | Nome do candidato vinculado (null para admin) |
| `user_can_export` | `"true"` ou `"false"` |
| `user_can_compare` | `"true"` ou `"false"` |

### 6.3 `users` — Gerenciamento de Usuários

Todos os endpoints exigem token de **administrador**.

| Método | Endpoint | Descrição |
|---|---|---|
| `GET` | `/users` | Lista todos os usuários |
| `POST` | `/users` | Cria novo usuário |
| `PUT` | `/users/{id}` | Atualiza dados |
| `PATCH` | `/users/{id}/deactivate` | Desativa usuário |

### 6.4 `eleicoes` — Eleições

| Método | Endpoint | Auth | Descrição |
|---|---|---|---|
| `GET` | `/eleicoes` | Bearer | Lista todas |
| `GET` | `/eleicoes/resumo` | Bearer | Resumo agrupado (cache 600s) |
| `POST` | `/eleicoes` | Admin | Cria eleição |
| `DELETE` | `/eleicoes/{id}` | Admin | Remove eleição |

> Cada turno é um registro separado com UUID próprio. Eleição municipal 2024 = dois registros (turno 1 e turno 2).

### 6.5 `resultados` — Candidatos, Candidaturas, Partidos e Resultados

**Candidatos:**

| Método | Endpoint | Descrição |
|---|---|---|
| `GET` | `/candidatos` | Admin vê todos; outros veem apenas o seu |
| `POST` | `/candidatos` | Cria candidato (admin) |
| `PUT` | `/candidatos/{id}` | Atualiza (admin) |
| `DELETE` | `/candidatos/{id}` | Remove (admin) |
| `GET` | `/candidatos/{id}/candidaturas` | Eleições do candidato |

**Candidaturas:**

| Método | Endpoint | Descrição |
|---|---|---|
| `POST` | `/candidaturas` | Vincula candidato à eleição (admin) |
| `PUT` | `/candidaturas/{id}` | Atualiza vínculo |
| `DELETE` | `/candidaturas/{id}` | Remove vínculo |
| `GET` | `/candidaturas/buscar-votavel` | Busca código TSE por nome/cargo |

**Resultados eleitorais:**

| Endpoint | Descrição |
|---|---|
| `GET /resultados/mapa` | Todos os municípios com votos (para colorir o mapa) |
| `GET /resultados/municipio/{cd_ibge}` | Resultado de um município |
| `GET /resultados/municipio/{cd_ibge}/historico` | Histórico por eleição |
| `GET /resultados/resumo/uf` | Totais por UF |

**Seções eleitorais:**

| Endpoint | Parâmetros obrigatórios | Descrição |
|---|---|---|
| `GET /secoes/cargos` | `eleicao_id` | Lista cargos da eleição |
| `GET /secoes/votaveis` | `eleicao_id` | Lista candidatos/votáveis (exclui branco/nulo) |
| `GET /secoes/mapa/uf/{sg_uf}` | `eleicao_id` | Total de votos por município da UF |
| `GET /secoes/municipio/{cd_tse}/por-zona` | `eleicao_id` | Agregado por zona |
| `GET /secoes/municipio/{cd_tse}` | `eleicao_id` | Votos por seção individual |
| `GET /secoes/municipio/{cd_tse}/ranking` | `eleicao_id` | Top candidatos do município |

> **Importante:** Para VEREADOR, `nr_votavel` não é único por eleição — o mesmo número é reutilizado em municípios diferentes. Sempre filtre por `nr_votavel` **e** `nm_votavel` em conjunto.

### 6.6 `importacao` — Import de CSVs do TSE

Todos os endpoints exigem token de **administrador**.

| Método | Endpoint | Descrição |
|---|---|---|
| `POST` | `/importar/municipios` | Importa mapeamento TSE→IBGE (CSV) |
| `POST` | `/importar/resultados` | Importa resultados eleitorais (CSV, streaming SSE) |
| `POST` | `/importar/secoes` | Importa votação por seção (CSV, streaming SSE) |
| `GET` | `/importar/status` | Status de importação por eleição |
| `GET` | `/importar/historico` | Últimos 100 imports com métricas |

**Formato SSE — eventos enviados:**
```
data: {"tipo": "inicio", "total": 150000}
data: {"tipo": "progresso", "processadas": 50000, "inseridos": 49800, "eta": "2min"}
data: {"tipo": "concluido", "descricao": "Eleição Municipal 2024 - T1"}
data: {"tipo": "erro", "mensagem": "Coluna X não encontrada"}
```

### 6.7 Mapa Territorial — Leaflet

- Navegação em 4 níveis: **Brasil → Região → Estado → Município**
- GeoJSON de 5.572 municípios carregado via fetch (`/geo/municipios_br.json`)
- Contornos dissolvidos por nível (sem bordas internas)
- Coloração por % de votos: gradiente amarelo → laranja → vermelho escuro
- Breadcrumb interativo para navegação reversa

**Filtros em cascata:**
1. Eleição (agrupada por `ano|tipo`, expandida por turno)
2. Turno (habilitado após eleição)
3. Cargo (busca via `/secoes/cargos`)
4. Candidato (busca por palavras via `/secoes/votaveis`)

**Dados geográficos estáticos (`frontend/public/geo/`):**
- `municipios_br.json` — 5.572 municípios, ~59 MB (recomendado simplificar para ~3 MB com [mapshaper.org](https://mapshaper.org) usando `simplify 5%`)
- `brasil_outline.json`, `regioes_outline.json`, `estados_outline.json` — contornos dissolvidos

### 6.8 `geo` — Módulo de Geografia

Gerenciamento de bairros, polígonos e geocodificação. Todos os endpoints requerem token de usuário autenticado; operações de escrita requerem **administrador**.

**UFs e municípios:**

| Método | Endpoint | Descrição |
|---|---|---|
| `GET` | `/geo/ufs` | Lista UFs disponíveis |
| `GET` | `/geo/municipios` | Lista municípios por UF |

**Bairros:**

| Método | Endpoint | Descrição |
|---|---|---|
| `GET` | `/geo/bairros` | Lista bairros por município (query: `sg_uf`, `cd_municipio_tse`) |
| `POST` | `/geo/bairros` | Cria bairro |
| `PUT` | `/geo/bairros/{id}` | Atualiza nome/cor |
| `DELETE` | `/geo/bairros/{id}` | Remove bairro |
| `PUT` | `/geo/bairros/{id}/geom` | Salva polígono GeoJSON desenhado via Leaflet-Geoman |
| `DELETE` | `/geo/bairros/{id}/geom` | Remove polígono |
| `GET` | `/geo/bairros/geojson` | GeoJSON de todos os bairros com geometria (para renderizar no mapa) |
| `GET` | `/geo/bairros/{id}/locais` | Lista locais de votação vinculados ao bairro |
| `POST` | `/geo/bairros/{id}/locais` | Vincula locais de votação ao bairro |
| `DELETE` | `/geo/bairros/{id}/locais/{nr_local}` | Remove vínculo |
| `POST` | `/geo/bairros/{id}/sugerir-locais` | Retorna locais geocodificados dentro do polígono via `ST_Within` |

**Geocodificação:**

| Método | Endpoint | Descrição |
|---|---|---|
| `GET` | `/geo/geocoding/status` | Status da geocodificação do município (total/geocodificados/pendentes/erros/em_andamento) |
| `POST` | `/geo/geocoding/municipio` | Inicia geocodificação em background via Nominatim (retorna 202) |

> **Ordem dos endpoints:** Rotas literais (`/geo/bairros/geojson`) e `/{id}/sugerir-locais` estão definidas ANTES das rotas parametrizadas `/{bairro_id}` no `router.py` para evitar conflito de matching no FastAPI.

---

## 7. Como Adicionar um Novo Módulo

**Passo 1 — Criar o model em `backend/models/`:**
```python
# backend/models/pesquisa.py
from database import Base
class Pesquisa(Base):
    __tablename__ = "pesquisas"
    ...
```

**Passo 2 — Importar no `migrations/env.py`:**
```python
from models import user, eleitoral, pesquisa  # adicionar aqui
```

**Passo 3 — Gerar e aplicar a migration:**
```bash
docker compose exec backend alembic revision --autogenerate -m "create pesquisas table"
docker compose exec backend alembic upgrade head
```

**Passo 4 — Criar a estrutura do módulo:**
```
backend/pesquisas/
├── __init__.py
├── router.py       # endpoints HTTP
└── schemas.py      # Pydantic models
```

**Passo 5 — Registrar o router no `main.py`:**
```python
from pesquisas.router import router as pesquisas_router
app.include_router(pesquisas_router)
```

---

## 8. Deploy em VPS

### 8.1 Provedores recomendados

| Provedor | Plano | Preço | Data center BR |
|---|---|---|---|
| Hostinger | KVM 1 (4 GB / 2 vCPUs) | ~R$35/mês | São Paulo |
| Hetzner | CX22 (4 GB / 2 vCPUs) | ~€4/mês | Não |
| DigitalOcean | Basic (2 GB / 1 vCPU) | ~$12/mês | São Paulo |

Escolha **Ubuntu 22.04 LTS** na criação do servidor.

### 8.2 Instalar Docker no servidor

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker
```

### 8.3 Clonar e configurar

```bash
git clone <url-do-repositorio>
cd pite
nano .env
```

Conteúdo do `.env` de produção:

```ini
DB_PASSWORD=senha-forte-aqui-nunca-compartilhe
JWT_SECRET_KEY=  # openssl rand -hex 32
JWT_ALGORITHM=HS256
JWT_EXPIRATION_MINUTES=60
CORS_ORIGINS=https://seudominio.com,http://seudominio.com
```

### 8.4 Subir em produção

```bash
docker compose up -d --build
docker compose exec backend alembic upgrade head
docker compose cp backend/create_admin.py backend:/app/backend/create_admin.py
docker compose exec backend python create_admin.py
```

Acesse `http://ip-do-servidor` — o sistema deve estar online.

### 8.5 Configurar domínio e HTTPS (Let's Encrypt)

```bash
# Instalar Certbot
sudo apt install -y certbot

# Parar temporariamente o frontend para liberar a porta 80
docker compose stop frontend

# Gerar certificado
sudo certbot certonly --standalone -d seudominio.com

# Restartar
docker compose start frontend
```

Depois configure o `frontend/nginx.conf` para incluir os blocos `listen 443 ssl` com os certificados gerados e rode `docker compose up -d --build frontend`.

### 8.6 Atualizar código em produção

```bash
git pull
docker compose up -d --build
```

---

## 9. Problemas Conhecidos e Soluções

### `localhost` não abre no Windows com Docker Desktop

**Causa:** Docker Desktop com WSL2 pode não rotear `localhost` corretamente.
**Solução:** Use `http://127.0.0.1:8080` em vez de `http://localhost:8080`.

### `Failed to fetch` / `ERR_CONNECTION_REFUSED` para rotas de API

**Causa:** Serviço frontend chamando `http://localhost:8000` diretamente em vez de usar o proxy nginx.
**Causa raiz:** `VITE_API_URL` não estava definido e o fallback era `localhost:8000`.
**Solução aplicada:** Fallback alterado para `''` (string vazia) em `importacao.ts` e `eleitoral.ts` — chamadas agora usam URLs relativas que o nginx intercepta.

### `ModuleNotFoundError: No module named 'database'`

**Causa:** Comando rodado fora da pasta `backend/`.
**Solução:** `cd backend` antes de qualquer comando Python (sem Docker) ou usar `docker compose exec backend`.

### `password authentication failed`

**Causa:** Senha com caracteres especiais não URL-encoded na `DATABASE_URL`.
**Solução:**
```python
import urllib.parse
print(urllib.parse.quote("Senha@123", safe=""))
```

### `cannot drop table spatial_ref_sys` na migration

**Causa:** Alembic detectou tabelas do PostGIS como "removidas".
**Solução:** Remover manualmente o `op.drop_table('spatial_ref_sys')` do arquivo gerado. O `env.py` já tem `include_object` configurado para evitar isso.

### `error reading bcrypt version`

**Causa:** Versão nova do `bcrypt` incompatível com `passlib`.
**Solução:** `requirements.txt` já fixa `bcrypt==4.0.1`.

### Candidato selecionado errado no mapa (VEREADOR)

**Causa:** `nr_votavel` não é único por eleição para VEREADOR.
**Solução:** Filtrar sempre por `nr_votavel` **e** `nm_votavel` em conjunto.

### Contorno do município aparece como retângulo

**Causa:** Race condition assíncrona nos GeoJSONs de contorno.
**Solução:** `atualizarContorno()` verifica `navRef.current.nivel !== navState.nivel` antes de desenhar; aborta se divergirem.

### Rotas `/geo/*` retornam `index.html` em vez do JSON da API

**Causa:** O padrão de regex no `frontend/nginx.conf` não incluía o prefixo `geo`.
**Solução:** Garantir que todos os prefixos de módulos backend estejam na regex:
```nginx
location ~ ^/(auth|users|eleicoes|candidatos|candidaturas|partidos|resultados|secoes|importar|health|geo) {
    proxy_pass http://backend:8000;
}
```
Qualquer novo módulo backend deve ser adicionado aqui para não cair no SPA fallback.

### Sessão expira rapidamente

**Causa:** `JWT_EXPIRATION_MINUTES` pequeno.
**Solução:** Ajustar no `.env` para `60` ou mais.

---

## 10. Próximos Passos

| Ordem | Módulo | Descrição |
|---|---|---|
| 1 | GeoJSON simplificado | Reduzir `municipios_br.json` de 59 MB para ~3 MB via [mapshaper.org](https://mapshaper.org) (`simplify 5%`) |
| 2 | HTTPS na VPS | Configurar Let's Encrypt + nginx HTTPS no container |
| 3 | Mapa de zonas | Exibir dados por zona intra-municipal no drill-down |
| 4 | Dashboard real | Substituir dados mock do Painel por dados reais da API |
| 5 | `pesquisas` | Pesquisas eleitorais próprias |
| 6 | `comparacao` | Comparação entre eleições/candidatos |
| 7 | Backups automáticos | Script de backup do volume `pgdata` para armazenamento externo |
| 8 | Celery + Redis | Importações verdadeiramente assíncronas para arquivos muito grandes |
