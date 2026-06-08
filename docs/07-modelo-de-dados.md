# 07 — Modelo de Dados

> Descreve as entidades, campos, tipos, relacionamentos e índices do banco de dados.  
> Banco: **PostgreSQL 16 com PostGIS**. ORM: **SQLAlchemy + GeoAlchemy2**. Migrations: **Alembic**.  
> Coordenadas em **WGS84 (EPSG:4326)**. Arquitetura **single-tenant**.

---

## Tabelas Implementadas (MVP — estado atual)

As tabelas abaixo estão criadas e ativas no banco. As demais seções deste documento descrevem o modelo completo planejado.

### `users`
Gerenciada por `backend/models/user.py`. Migrations: `0f08b7443f87` + `b9e3f1a2c847`.  
Ver seção [17. usuario](#17-usuario) para detalhes.

### `municipio_tse_ibge`
Criada pela migration `c3d4e5f6a7b8`. Populada com 5.571 municípios via `scripts/importar_municipios_tse.py`.

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | Integer (PK) | Identificador interno |
| `cd_tse` | String (unique) | Código do município no TSE (`CD_MUNICIPIO`) |
| `cd_ibge` | String (unique) | Código do município no IBGE (`CD_MUN`) |
| `sg_uf` | String(2) | Sigla da UF |
| `nm_municipio` | String | Nome do município |

### `eleicoes`
Criada pela migration `c3d4e5f6a7b8`. Gerenciada por `backend/models/eleitoral.py`.

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | UUID (PK) | Identificador único |
| `ano` | Integer | Ano da eleição (ex: 2024) |
| `turno` | Integer | Turno (1 ou 2) |
| `tipo` | String | `municipal`, `federal` ou `estadual` |
| `descricao` | String | Descrição textual |
| `created_at` | DateTime | Data de criação |

Constraint única: `(ano, turno, tipo)`.

### `candidatos`
Criada pela migration `c3d4e5f6a7b8`. Gerenciada por `backend/models/eleitoral.py`.  
Endpoints admin: `GET /candidatos`, `POST /candidatos`, `PUT /candidatos/{id}`, `DELETE /candidatos/{id}`.

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | UUID (PK) | Identificador único |
| `nr_candidato` | String (**nullable**) | Número nas urnas — opcional, pois o número muda por eleição/partido e é armazenado em `candidatura.nr_votavel` |
| `nm_candidato` | String | Nome do candidato (`NM_CANDIDATO`) |
| `nm_partido` | String | Nome do partido |
| `sg_partido` | String | Sigla do partido |
| `sg_uf` | String(2) | UF do candidato |
| `cargo` | String | Cargo principal (`DS_CARGO`) |
| `created_at` | DateTime | Data de criação |

### `candidaturas`
Criada junto ao modelo de dados. Gerenciada por `backend/models/eleitoral.py`.  
Endpoints: `GET /candidatos/{id}/candidaturas`, `POST /candidaturas`, `PUT /candidaturas/{id}`, `DELETE /candidaturas/{id}`.  
Endpoint auxiliar: `GET /candidaturas/buscar-votavel?eleicao_id=&sq_candidato_tse=|nome=` (busca em `VotacaoSecao` para pré-preencher campos ao vincular).

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | UUID (PK) | Identificador único |
| `candidato_id` | UUID (FK → candidatos) | Candidato cadastrado na plataforma |
| `eleicao_id` | UUID (FK → eleicoes) | Eleição à qual pertence |
| `sq_candidato_tse` | String | `SQ_CANDIDATO` do CSV do TSE — chave de ligação com `VotacaoSecao` |
| `nr_votavel` | String | `NR_VOTAVEL` do CSV do TSE — número do candidato nas urnas nesta eleição |
| `nm_votavel` | String | `NM_VOTAVEL` — nome exato como aparece nas urnas |
| `ds_cargo` | String | `DS_CARGO` — cargo disputado nesta eleição |
| `situacao` | String | `deferida`, `indeferida`, `cassada`, `eleito`, `nao_eleito`, `segundo_turno` |
| `created_at` | DateTime | Data de criação |

Constraint única: `(candidato_id, eleicao_id)`.

### `resultados_eleitorais`
Criada pela migration `c3d4e5f6a7b8`. Gerenciada por `backend/models/eleitoral.py`.

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | UUID (PK) | Identificador único |
| `eleicao_id` | UUID (FK → eleicoes) | Eleição de referência |
| `candidato_id` | UUID (FK → candidatos) | Candidato de referência |
| `cd_municipio_ibge` | String | Código IBGE do município |
| `qt_votos_nominais` | Integer | Total de votos nominais no município |
| `qt_votos_validos` | Integer | Total de votos válidos |
| `qt_aptos` | Integer | Eleitores aptos |
| `qt_abstencoes` | Integer | Abstenções |
| `created_at` | DateTime | Data de criação |

Constraint única: `(eleicao_id, candidato_id, cd_municipio_ibge)`.

### `votacao_secao`
Criada pela migration `c3d4e5f6a7b8`. Coluna `sg_uf` adicionada pela migration `j7e8f9a0b1c2`. Índices adicionais: `ix_vs_eleicao_cargo (eleicao_id, cd_cargo)` e `ix_vs_eleicao_sg_uf (eleicao_id, sg_uf)`.

Granularidade máxima dos dados do TSE — uma linha por candidato/votável por seção eleitoral por cargo.

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | BigInteger (PK) | Identificador sequencial |
| `eleicao_id` | UUID (FK → eleicoes) | Eleição de referência |
| `cd_municipio_tse` | String(10) | Código do município no TSE (`CD_MUNICIPIO`) |
| `sg_uf` | String(2) | Sigla da UF — preenchida na importação via `SG_UF` do CSV do TSE; elimina JOIN com `municipio_tse_ibge` nas queries |
| `nr_turno` | SmallInteger | Turno (`NR_TURNO`) |
| `nr_zona` | SmallInteger | Número da zona eleitoral (`NR_ZONA`) |
| `nr_secao` | SmallInteger | Número da seção (`NR_SECAO`) |
| `nr_local_votacao` | Integer | Número do local de votação (`NR_LOCAL_VOTACAO`) |
| `nm_local_votacao` | String | Nome do local de votação (`NM_LOCAL_VOTACAO`) |
| `ds_endereco` | String | Endereço do local (`DS_LOCAL_VOTACAO_ENDERECO`) |
| `nr_votavel` | String(10) | Número do candidato/partido nas urnas (`NR_VOTAVEL`) |
| `nm_votavel` | String(160) | Nome nas urnas (`NM_VOTAVEL`) |
| `cd_cargo` | SmallInteger | Código do cargo (`CD_CARGO`) — usado para filtrar cargo principal (MIN) |
| `ds_cargo` | String(60) | Descrição do cargo (`DS_CARGO`) |
| `sq_candidato` | String(20) | Sequencial do candidato no TSE (`SQ_CANDIDATO`) |
| `qt_votos` | Integer | Quantidade de votos nesta seção (`QT_VOTOS`) |

Constraint única: `(eleicao_id, cd_municipio_tse, nr_zona, nr_secao, nr_votavel, cd_cargo, nr_turno)`.

> **Nota sobre contagem de votos:** A tabela armazena uma linha por candidato por seção por cargo. Para obter o total de votos de uma eleição sem inflação, filtre pelo `MIN(cd_cargo)` da eleição (cargo principal). Somar todas as linhas sem esse filtro resulta em múltiplo do total real (uma vez por cargo).

### `importacao_log`
Criada pela migration `i6d7e8f9a0b1`. Registra histórico de todas as importações realizadas.

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | UUID (PK) | Identificador único |
| `arquivo` | String(260) | Nome do arquivo importado |
| `tipo` | String(20) | `secoes`, `resultados` ou `municipios` |
| `eleicao_id` | UUID (nullable) | Eleição relacionada (quando aplicável) |
| `status` | String(10) | `sucesso` ou `erro` |
| `mensagem` | Text | Detalhes do resultado ou erro |
| `inseridos` | Integer | Registros inseridos com sucesso |
| `processadas` | Integer | Linhas processadas do arquivo |
| `duracao_s` | Float | Duração em segundos |
| `criado_em` | DateTime | Data/hora da importação |

Índice: `ix_importacao_log_criado_em`.

### `eleicao_resumo_cache`
Criada pela migration `k8f9a0b1c2d3`. Cache pré-computado de KPIs por eleição — atualizado automaticamente ao final de cada importação de seções.

| Campo | Tipo | Descrição |
|---|---|---|
| `eleicao_id` | UUID (PK, FK → eleicoes) | Eleição de referência |
| `municipios` | Integer | Quantidade de municípios com votos |
| `estados` | Integer | Quantidade de UFs com votos |
| `votos_total` | BigInteger | Total de votos do cargo principal (`MIN(cd_cargo)`) |
| `atualizado_em` | DateTime | Data/hora do último recálculo |

> **Objetivo:** Eliminar full scan de `votacao_secao` na listagem de eleições. O endpoint `GET /eleicoes/resumo` lê desta tabela (O(n_eleições)) em vez de agregar milhões de linhas a cada requisição.

> **Observação:** Este modelo é simplificado para o MVP. O modelo completo planejado (com `zona_eleitoral`, `secao_eleitoral`, `local_votacao` etc.) está descrito nas seções abaixo.

---

## Visão Geral do Modelo

```
uf
 └── municipio  ←── polígono IBGE
       ├── bairro  ←── polígono IBGE/prefeitura
       ├── zona_eleitoral  ←── polígono TSE (opcional)
       │     └── local_votacao  ←── lat/lng geocodificado do endereço TSE
       │           └── secao_eleitoral
       │                 └── resultado_eleitoral  ←── qt_votos por seção
       │                                               (ligado via sq_candidato_tse)
       └── ...

candidato  (perfil permanente)
 └── candidatura  ←── sq_candidato_tse: chave de ligação com os dados do TSE
       └── resultado_eleitoral (agregado pela candidatura)

eleicao  (contexto: ano + UF — cobre múltiplos cargos)
 └── candidatura  (cargo específico dentro da eleição)
```

**Decisão de design — `sq_candidato_tse`:**  
O campo `SQ_CANDIDATO` do CSV do TSE é o identificador sequencial único por candidato por eleição gerado internamente pela Justiça Eleitoral. É a chave de ligação entre o candidato cadastrado na plataforma e os resultados brutos importados do TSE. Mais confiável do que nome (variações de grafia) ou número (pertence ao partido, não à pessoa).

**Decisão de design — eleição cobre múltiplos cargos:**  
Uma importação do TSE (ex.: `votacao_secao_2024_GO.csv`) contém todos os cargos (Presidente, Governador, Senador, Dep. Federal, Dep. Estadual) em uma única tabela, diferenciados pelo campo `DS_CARGO`. A entidade `eleicao` representa o contexto geral (ano + UF + turno). O cargo específico fica na `candidatura`.

---

## Entidades

1. [uf](#1-uf)
2. [municipio](#2-municipio)
3. [bairro](#3-bairro)
4. [zona_eleitoral](#4-zona_eleitoral)
5. [local_votacao](#5-local_votacao)
6. [secao_eleitoral](#6-secao_eleitoral)
7. [partido](#7-partido)
8. [cargo](#8-cargo)
9. [eleicao](#9-eleicao)
10. [candidato](#10-candidato)
11. [candidatura](#11-candidatura)
12. [resultado_eleitoral](#12-resultado_eleitoral)
13. [territorio](#13-territorio)
14. [classificacao_territorial](#14-classificacao_territorial)
15. [pesquisa_eleitoral](#15-pesquisa_eleitoral)
16. [resultado_pesquisa](#16-resultado_pesquisa)
17. [usuario](#17-usuario)
18. [fonte_dados](#18-fonte_dados)
19. [importacao_dados](#19-importacao_dados)
20. [indicador_eleitoral](#20-indicador_eleitoral)

---

## 1. `uf`

**Objetivo:** Representa as unidades federativas. Base para agrupamento geográfico e filtragem de dados do TSE.

| Campo | Tipo | Descrição |
|---|---|---|
| `sigla` | CHAR(2) (PK) | Sigla da UF — ex.: `GO`, `SP`, `MG` |
| `nome` | VARCHAR | Nome completo — ex.: `Goiás` |
| `codigo_ibge` | INTEGER | Código numérico do IBGE — ex.: `52` |
| `regiao` | ENUM | `norte`, `nordeste`, `centro_oeste`, `sudeste`, `sul` |

**Observações:** Tabela de referência simples. Populada manualmente na semente inicial. A sigla da UF aparece em todos os arquivos CSV do TSE no campo `SG_UF`.

---

## 2. `municipio`

**Objetivo:** Base territorial fundamental. Ponto de entrada para análises por município.

| Campo | Tipo | Descrição |
|---|---|---|
| `municipio_id` | UUID (PK) | Identificador único |
| `sigla_uf` | CHAR(2) (FK → uf) | Estado ao qual pertence |
| `codigo_tse` | INTEGER | `CD_MUNICIPIO` do CSV do TSE — chave de ligação com dados importados |
| `codigo_ibge` | VARCHAR(7) | Código oficial do IBGE — chave para dados geográficos |
| `nome` | VARCHAR | Nome do município |
| `populacao_estimada` | INTEGER | Estimativa populacional (IBGE, opcional) |
| `geometria` | GEOMETRY(Polygon, 4326) | Polígono do município em WGS84 — fonte: IBGE malha municipal |
| `criado_em` | TIMESTAMP | Data de criação |
| `atualizado_em` | TIMESTAMP | Data de atualização |

**Relacionamentos:** Pertence a `uf`. Tem muitos `bairro`, `zona_eleitoral`, `local_votacao`.  
**Índices:** `sigla_uf`, `codigo_tse`, `codigo_ibge`.  
**Observações:** O polígono é importado do shapefile municipal do IBGE (geoftp.ibge.gov.br). Necessário para colorir municípios no mapa conforme desempenho eleitoral.

---

## 3. `bairro`

**Objetivo:** Granularidade territorial abaixo do município. Permite análise de votos por região urbana.

| Campo | Tipo | Descrição |
|---|---|---|
| `bairro_id` | UUID (PK) | Identificador único |
| `municipio_id` | UUID (FK → municipio) | Município ao qual pertence |
| `nome` | VARCHAR | Nome do bairro |
| `codigo_externo` | VARCHAR | Código de referência externa (IBGE ou prefeitura) |
| `geometria` | GEOMETRY(Polygon, 4326) | Polígono do bairro em WGS84 — fonte: IBGE ou prefeitura |
| `criado_em` | TIMESTAMP | Data de criação |

**Observações:** O vínculo entre `local_votacao` e `bairro` é feito automaticamente via consulta espacial PostGIS: verifica em qual polígono de bairro a coordenada (lat/lng) do local de votação está contida. Isso elimina a necessidade de informar o bairro manualmente.

```sql
-- Vínculo automático via PostGIS
UPDATE local_votacao lv
SET bairro_id = b.bairro_id
FROM bairro b
WHERE ST_Within(
    ST_SetSRID(ST_MakePoint(lv.longitude, lv.latitude), 4326),
    b.geometria
);
```

---

## 4. `zona_eleitoral`

**Objetivo:** Unidade de organização eleitoral do TSE subordinada ao município.

| Campo | Tipo | Descrição |
|---|---|---|
| `zona_eleitoral_id` | UUID (PK) | Identificador único |
| `municipio_id` | UUID (FK → municipio) | Município ao qual pertence |
| `sigla_uf` | CHAR(2) | Sigla do estado (redundante para queries diretas) |
| `numero_zona` | INTEGER | `NR_ZONA` do CSV do TSE |
| `nome_zona` | VARCHAR | Nome da zona (opcional) |
| `geometria` | GEOMETRY(Polygon, 4326) | Polígono da zona em WGS84 — fonte: shapefile TSE (opcional) |
| `criado_em` | TIMESTAMP | Data de criação |

**Relacionamentos:** Pertence a `municipio`. Tem muitos `local_votacao`, `secao_eleitoral`.  
**Índices:** `municipio_id`, `numero_zona`, `sigla_uf`.  
**Observações:** O polígono é importado do shapefile de zonas eleitorais do TSE (dadosabertos.tse.jus.br). Campo opcional — o sistema funciona sem ele, mas habilita coloração de zonas no mapa.

---

## 5. `local_votacao`

**Objetivo:** Local físico onde ocorre a votação. Geocodificado para exibição como marcador no mapa.

| Campo | Tipo | Descrição |
|---|---|---|
| `local_votacao_id` | UUID (PK) | Identificador único |
| `municipio_id` | UUID (FK → municipio) | Município |
| `zona_eleitoral_id` | UUID (FK → zona_eleitoral) | Zona eleitoral |
| `bairro_id` | UUID (FK → bairro) | Bairro — preenchido automaticamente via PostGIS |
| `numero_tse` | INTEGER | `NR_LOCAL_VOTACAO` do CSV do TSE |
| `nome` | VARCHAR | `NM_LOCAL_VOTACAO` do CSV do TSE |
| `endereco` | VARCHAR | `DS_LOCAL_VOTACAO_ENDERECO` do CSV do TSE |
| `latitude` | DECIMAL(9,6) | Latitude obtida por geocodificação do endereço |
| `longitude` | DECIMAL(9,6) | Longitude obtida por geocodificação do endereço |
| `geocodificado` | BOOLEAN | Indica se a geocodificação já foi realizada |
| `criado_em` | TIMESTAMP | Data de criação |

**Relacionamentos:** Pertence a `municipio`, `zona_eleitoral`, `bairro`. Tem muitas `secao_eleitoral`.  
**Índices:** `municipio_id`, `zona_eleitoral_id`, `bairro_id`, `numero_tse`.  
**Observações:** O endereço vem diretamente do campo `DS_LOCAL_VOTACAO_ENDERECO` do CSV do TSE. A geocodificação é feita por um script Python usando a API Nominatim (OpenStreetMap, gratuita) ou Google Maps. Após geocodificado, o ponto lat/lng é o marcador exibido no mapa Leaflet.

---

## 6. `secao_eleitoral`

**Objetivo:** Menor unidade de organização eleitoral — equivale a uma urna de votação.

| Campo | Tipo | Descrição |
|---|---|---|
| `secao_eleitoral_id` | UUID (PK) | Identificador único |
| `zona_eleitoral_id` | UUID (FK → zona_eleitoral) | Zona à qual pertence |
| `local_votacao_id` | UUID (FK → local_votacao) | Local físico de votação |
| `municipio_id` | UUID (FK → municipio) | Município (redundante para queries diretas) |
| `numero_secao` | INTEGER | `NR_SECAO` do CSV do TSE |
| `total_eleitores_aptos` | INTEGER | Total de eleitores aptos (cadastro eleitoral TSE, opcional) |
| `criado_em` | TIMESTAMP | Data de criação |

**Relacionamentos:** Pertence a `zona_eleitoral` e `local_votacao`. Tem muitos `resultado_eleitoral`.  
**Índices:** `zona_eleitoral_id`, `local_votacao_id`, `municipio_id`, `numero_secao`.  
**Observações:** Dados de votos por seção são públicos (TSE). Representam totais agregados — nunca dados individuais de eleitores.

---

## 7. `partido`

**Objetivo:** Representa os partidos políticos registrados no TSE.

| Campo | Tipo | Descrição |
|---|---|---|
| `partido_id` | UUID (PK) | Identificador único |
| `sigla` | VARCHAR(12) | Sigla do partido |
| `nome_completo` | VARCHAR | Nome por extenso |
| `numero_eleitoral` | INTEGER | Número nas urnas |
| `espectro_politico` | ENUM | esquerda, centro_esquerda, centro, centro_direita, direita |
| `data_fundacao` | DATE | Data de fundação |
| `data_extincao` | DATE | Data de extinção (nulo se ativo) |
| `ativo` | BOOLEAN | Status atual |
| `logotipo_url` | VARCHAR | URL do logotipo |
| `criado_em` | TIMESTAMP | Data de criação |
| `atualizado_em` | TIMESTAMP | Data de atualização |

**Índices:** `sigla`, `numero_eleitoral`.  
**Observações:** A classificação de espectro político deve ser baseada em critérios objetivos e documentados. Manter histórico de fusões e extinções de partidos.

---

## 8. `cargo`

**Objetivo:** Representa os cargos disputados em eleições brasileiras.

| Campo | Tipo | Descrição |
|---|---|---|
| `cargo_id` | UUID (PK) | Identificador único |
| `nome` | VARCHAR | Nome do cargo (ex.: Vereador) |
| `codigo_tse` | VARCHAR | Código interno do TSE |
| `ambito` | ENUM | municipal, estadual, federal, distrital |
| `tipo_sistema_eleitoral` | ENUM | proporcional, majoritario |
| `criado_em` | TIMESTAMP | Data de criação |

---

## 9. `eleicao`

**Objetivo:** Representa um ciclo eleitoral em uma UF e turno específicos. Uma eleição cobre **múltiplos cargos** — o cargo específico fica na `candidatura`.

| Campo | Tipo | Descrição |
|---|---|---|
| `eleicao_id` | UUID (PK) | Identificador único |
| `ano` | INTEGER | `ANO_ELEICAO` do CSV do TSE |
| `turno` | INTEGER | `NR_TURNO` — 1 ou 2 |
| `sigla_uf` | CHAR(2) (FK → uf) | Estado da eleição — `SG_UF` do CSV do TSE |
| `cd_eleicao_tse` | INTEGER | `CD_ELEICAO` do CSV do TSE — código único por eleição e turno |
| `tipo_eleicao` | ENUM | `municipal`, `estadual_federal`, `suplementar` |
| `nm_tipo_eleicao_tse` | VARCHAR | `NM_TIPO_ELEICAO` do CSV do TSE (descritivo) |
| `data_realizacao` | DATE | `DT_ELEICAO` do CSV do TSE |
| `descricao` | VARCHAR | `DS_ELEICAO` do CSV do TSE |
| `importacao_dados_id` | UUID (FK → importacao_dados) | Importação que originou este registro |
| `criado_em` | TIMESTAMP | Data de criação |

**Índices:** `ano`, `sigla_uf`, `cd_eleicao_tse`, `turno`.  
**Observações:** Uma única importação (`votacao_secao_2024_GO.csv`) cria uma `eleicao`. Os cargos (Dep. Federal, Governador, Senador etc.) não ficam aqui — ficam nas `candidaturas` vinculadas a esta eleição. O campo `cd_eleicao_tse` garante unicidade e permite cruzar com outros arquivos do TSE da mesma eleição.

---

## 10. `candidato`

**Objetivo:** Representa candidatos com histórico eleitoral e pré-candidatos sem histórico.

| Campo | Tipo | Descrição |
|---|---|---|
| `candidato_id` | UUID (PK) | Identificador único |
| `nome_urna` | VARCHAR | Nome na urna eleitoral |
| `nome_completo` | VARCHAR | Nome civil completo |
| `cpf_hash` | VARCHAR | Hash SHA-256 do CPF (sem texto puro) |
| `data_nascimento` | DATE | Data de nascimento |
| `genero` | ENUM | masculino, feminino, outro |
| `partido_atual_id` | UUID (FK) | Partido atual (nulo se sem partido) |
| `descricao_perfil_politico` | TEXT | Descrição do perfil político |
| `espectro_politico_declarado` | ENUM | Espectro político declarado |
| `eh_pre_candidato` | BOOLEAN | Indica pré-candidato sem histórico |
| `ativo` | BOOLEAN | Status ativo na plataforma |
| `foto_url` | VARCHAR | URL da foto |
| `criado_em` | TIMESTAMP | Data de criação |
| `atualizado_em` | TIMESTAMP | Data de atualização |

**Índices:** `cpf_hash`, `nome_urna`, `partido_atual_id`, `eh_pre_candidato`.  
**Observações:** **CPF nunca em texto puro.** Hash unidirecional apenas para deduplicação. Dados biográficos de fontes públicas (TSE).

---

## 11. `candidatura`

> **Status: implementado.** Tabela `candidaturas` ativa no banco. Ver também seção [Tabelas Implementadas](#tabelas-implementadas-mvp--estado-atual) acima.

**Objetivo:** Une candidato e eleição — representa a participação em uma eleição específica. O campo `sq_candidato_tse` é a chave que liga o candidato cadastrado na plataforma aos dados brutos importados do TSE (`VotacaoSecao`).

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | UUID (PK) | Identificador único |
| `candidato_id` | UUID (FK → candidatos) | Candidato cadastrado na plataforma |
| `eleicao_id` | UUID (FK → eleicoes) | Eleição à qual pertence |
| `sq_candidato_tse` | String | **`SQ_CANDIDATO` do CSV do TSE** — chave de ligação com `VotacaoSecao`. Informado no fluxo de vinculação. |
| `nr_votavel` | String | `NR_VOTAVEL` do CSV do TSE — número do candidato nas urnas nesta eleição |
| `nm_votavel` | String | `NM_VOTAVEL` — nome exato como aparece nas urnas |
| `ds_cargo` | String | `DS_CARGO` — cargo disputado nesta eleição |
| `situacao` | String | `deferida`, `indeferida`, `cassada`, `eleito`, `nao_eleito`, `segundo_turno` |
| `created_at` | TIMESTAMP | Data de criação |

**Constraint única:** `(candidato_id, eleicao_id)`.  
**Índices:** `candidato_id`, `eleicao_id`, `sq_candidato_tse`.  
**Endpoints:** `GET /candidatos/{id}/candidaturas`, `POST /candidaturas`, `PUT /candidaturas/{id}`, `DELETE /candidaturas/{id}`.  
**Endpoint auxiliar:** `GET /candidaturas/buscar-votavel?eleicao_id=&sq_candidato_tse=|nome=` — busca em `VotacaoSecao` e pré-preenche `nr_votavel`, `nm_votavel` e `ds_cargo` ao informar `sq_candidato_tse`.

**Fluxo de vinculação (ModalCandidatura — 3 passos):**  
1. Selecionar eleição  
2. Buscar candidato nos dados do TSE por nome ou `SQ_CANDIDATO` — campos `nr_votavel`, `nm_votavel` e `ds_cargo` são preenchidos automaticamente  
3. Definir `situacao` (opcional)

**Observações:** O número de urna (`nr_votavel`) muda a cada eleição e por partido, por isso é armazenado aqui e não em `candidatos.nr_candidato`. Um mesmo candidato pode ter múltiplas candidaturas (uma por eleição). Pré-candidatos não possuem `sq_candidato_tse` — o campo fica nulo até a primeira vinculação real.

---

## 12. `resultado_eleitoral`

**Objetivo:** Armazena os votos brutos importados do TSE por seção eleitoral. Núcleo analítico da plataforma — todas as análises derivam desta tabela.

| Campo | Tipo | Descrição |
|---|---|---|
| `resultado_eleitoral_id` | UUID (PK) | Identificador único |
| `importacao_dados_id` | UUID (FK → importacao_dados) | Importação que originou este registro |
| `eleicao_id` | UUID (FK → eleicao) | Eleição — derivada do `cd_eleicao_tse` na importação |
| `sq_candidato_tse` | BIGINT | `SQ_CANDIDATO` do CSV do TSE — chave de ligação com `candidatura` |
| `nr_votavel` | INTEGER | `NR_VOTAVEL` do CSV do TSE |
| `nm_votavel_tse` | VARCHAR | `NM_VOTAVEL` do CSV do TSE |
| `sg_partido_tse` | CHAR(12) | Sigla do partido no TSE |
| `cd_cargo_tse` | INTEGER | `CD_CARGO` do CSV do TSE |
| `ds_cargo_tse` | VARCHAR | `DS_CARGO` do CSV do TSE — ex.: `DEPUTADO FEDERAL` |
| `municipio_id` | UUID (FK → municipio) | Município — derivado do `CD_MUNICIPIO` na importação |
| `zona_eleitoral_id` | UUID (FK → zona_eleitoral) | Zona eleitoral — derivada do `NR_ZONA` na importação |
| `secao_eleitoral_id` | UUID (FK → secao_eleitoral) | Seção eleitoral — derivada do `NR_SECAO` na importação |
| `local_votacao_id` | UUID (FK → local_votacao) | Local de votação — derivado do `NR_LOCAL_VOTACAO` na importação |
| `qt_votos` | INTEGER | `QT_VOTOS` do CSV do TSE — votos nesta seção |
| `criado_em` | TIMESTAMP | Data de criação |

**Índices:** `eleicao_id`, `sq_candidato_tse`, `municipio_id`, `zona_eleitoral_id`, `secao_eleitoral_id`, `local_votacao_id`, `cd_cargo_tse`.

**Ligação com candidato cadastrado:**
```sql
-- Votos do candidato João por seção — cruzando pelo sq_candidato_tse
SELECT
    re.municipio_id, re.zona_eleitoral_id, re.secao_eleitoral_id,
    lv.nome AS local_votacao, lv.latitude, lv.longitude,
    b.nome AS bairro,
    re.qt_votos
FROM resultado_eleitoral re
JOIN candidatura c ON c.sq_candidato_tse = re.sq_candidato_tse
                   AND c.eleicao_id = re.eleicao_id
JOIN candidato ca ON ca.candidato_id = c.candidato_id
JOIN secao_eleitoral se ON se.secao_eleitoral_id = re.secao_eleitoral_id
JOIN local_votacao lv ON lv.local_votacao_id = se.local_votacao_id
LEFT JOIN bairro b ON b.bairro_id = lv.bairro_id
WHERE ca.nome_completo = 'João Ferreira da Silva'
  AND re.eleicao_id = '<uuid-eleicao-2024>'
```

**Votos por bairro:**
```sql
SELECT b.nome AS bairro, SUM(re.qt_votos) AS total_votos
FROM resultado_eleitoral re
JOIN candidatura c ON c.sq_candidato_tse = re.sq_candidato_tse
JOIN secao_eleitoral se ON se.secao_eleitoral_id = re.secao_eleitoral_id
JOIN local_votacao lv ON lv.local_votacao_id = se.local_votacao_id
JOIN bairro b ON b.bairro_id = lv.bairro_id
WHERE c.candidato_id = '<uuid-candidato>'
GROUP BY b.nome ORDER BY total_votos DESC
```

**Observações:** Dados por seção são públicos (TSE). **Nunca expor dados individuais de eleitores.** Os campos `sq_candidato_tse` e `candidatura` são o elo que transforma dados brutos do TSE em análise direcionada ao candidato cadastrado.

---

## 13. `territorio`

**Objetivo:** Representa recortes territoriais para análise estratégica — pode ser padrão ou personalizado.

| Campo | Tipo | Descrição |
|---|---|---|
| `territorio_id` | UUID (PK) | Identificador único |
| `nome` | VARCHAR | Nome do território |
| `tipo_territorio` | ENUM | municipio, zona_eleitoral, bairro, regiao_personalizada |
| `descricao` | TEXT | Descrição estratégica |
| `geometria` | GEOMETRY | GeoJSON do polígono |
| `municipio_id` | UUID (FK) | Município de referência (opcional) |
| `zona_eleitoral_id` | UUID (FK) | Zona de referência (opcional) |
| `bairro_id` | UUID (FK) | Bairro de referência (opcional) |
| `criado_em` | TIMESTAMP | Data de criação |

---

## 14. `classificacao_territorial`

**Objetivo:** Registra a classificação estratégica de um território em relação a um candidato ou partido.

| Campo | Tipo | Descrição |
|---|---|---|
| `classificacao_territorial_id` | UUID (PK) | Identificador único |
| `territorio_id` | UUID (FK) | Território classificado |
| `candidato_id` | UUID (FK) | Candidato de referência (opcional) |
| `partido_id` | UUID (FK) | Partido de referência (opcional) |
| `eleicao_referencia_id` | UUID (FK) | Eleição base do cálculo |
| `classificacao` | ENUM | zona_forca, zona_disputa, zona_expansao, territorio_adversario, territorio_neutro, territorio_consolidado, territorio_volatil |
| `indice_forca` | DECIMAL | Índice de 0 a 100 |
| `metodo_calculo` | VARCHAR | Referência à regra de negócio aplicada |
| `calculado_em` | TIMESTAMP | Data do cálculo |
| `valido_ate` | TIMESTAMP | Validade da classificação (opcional) |

**Índices:** `territorio_id`, `candidato_id`, `partido_id`, `eleicao_referencia_id`.

---

## 15. `pesquisa_eleitoral`

**Objetivo:** Representa pesquisas eleitorais cadastradas ou importadas pela equipe.

| Campo | Tipo | Descrição |
|---|---|---|
| `pesquisa_eleitoral_id` | UUID (PK) | Identificador único |
| `titulo` | VARCHAR | Título da pesquisa |
| `descricao` | TEXT | Descrição e contexto |
| `data_inicio` | DATE | Início da coleta |
| `data_fim` | DATE | Fim da coleta |
| `organizacao_responsavel` | VARCHAR | Organização que realizou |
| `metodologia` | TEXT | Descrição da metodologia |
| `tamanho_amostra` | INTEGER | Tamanho da amostra |
| `margem_erro` | DECIMAL | Margem de erro (%) |
| `nivel_confianca` | DECIMAL | Nível de confiança (%) |
| `tipo_pesquisa` | ENUM | intencao_voto, rejeicao, aprovacao, espontanea, estimulada |
| `ambito_geografico` | ENUM | nacional, estadual, municipal, zona, bairro |
| `municipio_id` | UUID (FK) | Município (opcional) |
| `zona_eleitoral_id` | UUID (FK) | Zona eleitoral (opcional) |
| `fonte_dados_id` | UUID (FK) | Fonte de dados |
| `criado_por_usuario_id` | UUID (FK) | Usuário que cadastrou |
| `criado_em` | TIMESTAMP | Data de criação |

---

## 16. `resultado_pesquisa`

**Objetivo:** Armazena resultados agregados de uma pesquisa eleitoral por território.

| Campo | Tipo | Descrição |
|---|---|---|
| `resultado_pesquisa_id` | UUID (PK) | Identificador único |
| `pesquisa_eleitoral_id` | UUID (FK) | Pesquisa de referência |
| `candidato_id` | UUID (FK) | Candidato (opcional) |
| `partido_id` | UUID (FK) | Partido (opcional) |
| `municipio_id` | UUID (FK) | Município (opcional) |
| `zona_eleitoral_id` | UUID (FK) | Zona eleitoral (opcional) |
| `percentual` | DECIMAL | Percentual obtido |
| `quantidade_respostas` | INTEGER | Respostas neste recorte |
| `tipo_resultado` | ENUM | intencao, rejeicao, aprovacao |
| `criado_em` | TIMESTAMP | Data de criação |

**Observações:** Dados sempre agregados por localidade. **Nunca armazenar resposta individual de respondente.**

---

## 17. `usuario`

**Objetivo:** Representa os usuários com acesso à plataforma. Usuários não-administradores são obrigatoriamente vinculados a um candidato e enxergam apenas os dados desse candidato.

> **Tabela real no banco:** `users` (SQLAlchemy model em `backend/models/user.py`)

| Campo (banco) | Tipo | Descrição |
|---|---|---|
| `id` | UUID (PK) | Identificador único |
| `name` | VARCHAR(120) | Nome completo do usuário |
| `email` | VARCHAR(255) | E-mail único (index) |
| `password_hash` | VARCHAR(255) | Hash bcrypt da senha — nunca texto puro |
| `profile` | ENUM | `administrador`, `gestor`, `analista`, `assessor` |
| `candidate_name` | VARCHAR(255) | Nome do candidato vinculado — mantido por compatibilidade legada; nulo para administrador |
| `candidato_id` | UUID (FK → candidatos, nullable) | FK para o candidato vinculado — substitui `candidate_name` como referência estrutural; SET NULL ao excluir candidato |
| `can_export` | BOOLEAN | Permite exportar dados (padrão: `true`) |
| `can_compare` | BOOLEAN | Permite comparar candidatos (padrão: `false`) |
| `is_active` | BOOLEAN | Conta ativa ou inativa (padrão: `true`) |
| `last_login` | TIMESTAMP | Data/hora do último login (atualizado pela API) |
| `created_at` | TIMESTAMP | Data de criação (automático) |
| `updated_at` | TIMESTAMP | Última atualização (automático) |

**Perfis de acesso:**

| Perfil | Vínculo | Ver dados próprios | Comparar outros | Exportar | Gerenciar usuários | Importar TSE | Gerenciar eleições |
|---|---|---|---|---|---|---|---|
| `administrador` | Nenhum (acesso total) | ✅ todos | ✅ | ✅ | ✅ | ✅ | ✅ |
| `gestor` | 1 candidato | ✅ só o seu | ❌ | ✅ | ❌ | ❌ | ❌ |
| `analista` | 1 candidato | ✅ só o seu | ✅ leitura | ✅ | ❌ | ❌ | ❌ |
| `assessor` | 1 candidato | ✅ só o seu | ❌ | ❌ | ❌ | ❌ | ❌ |

**Descrição dos perfis:**
- **Administrador:** acesso irrestrito à plataforma. Gerencia todos os candidatos, eleições, importações e usuários. Tipicamente o responsável técnico da instalação.
- **Gestor:** vinculado a um candidato específico (ex.: chefe de gabinete). Vê todos os dados do seu candidato e pode exportar relatórios. Não vê dados de outros candidatos.
- **Analista:** vinculado a um candidato. Vê os dados completos do seu candidato e pode fazer comparações com outros candidatos (leitura apenas — sem editar dados alheios). Pode exportar. Indicado para consultores e analistas políticos que precisam de contexto comparativo.
- **Assessor:** vinculado a um candidato. Acesso somente leitura dos dados do seu candidato. Não pode exportar nem comparar. Indicado para equipes operacionais que precisam consultar informações sem extrair dados.

**Regra de isolamento de dados:**
```python
# Toda query de dados aplica o filtro de candidato quando o usuário não é administrador
def aplicar_filtro_candidato(query, usuario):
    if usuario.perfil_acesso == 'administrador':
        return query  # sem filtro
    return query.filter(candidatura.candidato_id == usuario.candidato_id)

# Comparação: liberada apenas para administrador e analista
def pode_ver_comparacao(usuario):
    return usuario.perfil_acesso in ('administrador', 'analista')
```

**Observações:** Senha nunca em texto puro (bcrypt). O campo `candidato_id` é nulo para administrador e obrigatório para os demais perfis — o sistema deve validar isso na criação do usuário. A resposta da API inclui objeto `candidato` aninhado com `id`, `nm_candidato`, `sg_partido`, `cargo` e `sg_uf`. Os formulários de criação e edição de usuário aceitam `candidato_id` e carregam a lista de candidatos em tempo real via `GET /candidatos`.

---

## 18. `fonte_dados`

**Objetivo:** Cataloga todas as fontes de dados, garantindo rastreabilidade de origem.

| Campo | Tipo | Descrição |
|---|---|---|
| `fonte_dados_id` | UUID (PK) | Identificador único |
| `nome` | VARCHAR | Nome descritivo da fonte |
| `tipo` | ENUM | tse, ibge, pesquisa_propria, manual, geografico, outro |
| `url_origem` | VARCHAR | URL de origem (quando aplicável) |
| `formato` | ENUM | csv, json, geojson, xml, xlsx, api |
| `periodicidade` | ENUM | unica, anual, quadrienal, sob_demanda |
| `licenca` | VARCHAR | Licença de uso |
| `descricao` | TEXT | Descrição da fonte |
| `responsavel_atualizacao` | VARCHAR | Responsável pela atualização |
| `criado_em` | TIMESTAMP | Data de criação |

---

## 19. `importacao_dados`

**Objetivo:** Registra cada processo de importação com rastreabilidade e status.

| Campo | Tipo | Descrição |
|---|---|---|
| `importacao_dados_id` | UUID (PK) | Identificador único |
| `fonte_dados_id` | UUID (FK) | Fonte de dados utilizada |
| `usuario_id` | UUID (FK) | Usuário que executou |
| `nome_arquivo` | VARCHAR | Nome do arquivo importado |
| `tamanho_arquivo` | BIGINT | Tamanho em bytes |
| `hash_arquivo` | VARCHAR | SHA-256 para verificação de integridade |
| `status` | ENUM | pendente, em_processamento, concluido, erro |
| `quantidade_registros_importados` | INTEGER | Registros processados com sucesso |
| `quantidade_registros_erro` | INTEGER | Registros com erro |
| `mensagem_erro` | TEXT | Detalhes de erros (opcional) |
| `iniciado_em` | TIMESTAMP | Início do processamento |
| `concluido_em` | TIMESTAMP | Conclusão do processamento |

---

## 20. `indicador_eleitoral`

**Objetivo:** Armazena indicadores calculados para análise territorial e comparativa.

| Campo | Tipo | Descrição |
|---|---|---|
| `indicador_eleitoral_id` | UUID (PK) | Identificador único |
| `nome_indicador` | VARCHAR | Nome do indicador |
| `descricao` | TEXT | Descrição e interpretação |
| `candidato_id` | UUID (FK) | Candidato de referência (opcional) |
| `partido_id` | UUID (FK) | Partido de referência (opcional) |
| `eleicao_id` | UUID (FK) | Eleição de referência |
| `territorio_id` | UUID (FK) | Território calculado |
| `valor` | DECIMAL | Valor numérico do indicador |
| `formula_aplicada` | VARCHAR | Fórmula utilizada |
| `calculado_em` | TIMESTAMP | Data do cálculo |
