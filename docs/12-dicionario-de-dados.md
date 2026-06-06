# 12 — Dicionário de Dados

> Glossário técnico com definição precisa de cada entidade, campo e termo utilizado no sistema.  
> Objetivo: eliminar ambiguidade entre equipe técnica, de produto e de negócio.

---

## Entidades Principais

| Termo | Definição | Tipo | Exemplo |
|---|---|---|---|
| `uf` | Unidade federativa brasileira | Entidade | GO, SP, MG |
| `municipio` | Município brasileiro com polígono geográfico (IBGE) | Entidade | Goiânia — código TSE 09200 |
| `municipio_tse_ibge` | Tabela de correspondência entre código TSE e código IBGE do município | Entidade | cd_tse=09200 → cd_ibge=5208707 |
| `bairro` | Região urbana dentro de um município com polígono geográfico | Entidade | Setor Bueno, Goiânia |
| `zona_eleitoral` | Unidade de organização eleitoral do TSE dentro de um município | Entidade | 1ª Zona Eleitoral de Goiânia |
| `local_votacao` | Local físico onde ocorre a votação — geocodificado com lat/lng | Entidade | Escola Estadual X — Rua Y, nº Z |
| `secao_eleitoral` | Menor unidade eleitoral — equivale a uma urna de votação | Entidade | Seção 0042 da Zona 01 |
| `candidato` | Pessoa que disputou ou disputa uma eleição, registrada na plataforma | Entidade | JOÃO DA SILVA |
| `partido` | Partido político cadastrado na plataforma — vinculado às candidaturas por eleição | Entidade | PT — Partido dos Trabalhadores (13) |
| `cargo` | Cargo eletivo disputado em uma eleição — provém do campo `ds_cargo` dos dados TSE | Entidade | VEREADOR, PREFEITO, DEPUTADO FEDERAL |
| `eleicao` | Ciclo eleitoral com ano, turno e tipo — cobre múltiplos cargos e candidatos | Entidade | 2024 · Municipal · 1º Turno |
| `candidatura` | Participação de um candidato em uma eleição específica, vinculada ao TSE via `sq_candidato_tse`. Armazena o partido da eleição (pode diferir do partido atual do candidato) | Entidade | JOÃO SILVA · PT · VEREADOR · 2024 · SQ 280000614682 |
| `votacao_secao` | Votos brutos por seção eleitoral — granularidade máxima dos dados importados do TSE | Entidade | nr_votavel=13123 obteve 12 votos na Seção 0042 da Zona 01 |
| `resultado_eleitoral` | Votos agregados por município por candidato — gerado a partir da `votacao_secao` | Entidade | JOÃO SILVA obteve 4.231 votos em Goiânia nas Municipais 2024 |
| `territorio` | Recorte geográfico para análise estratégica (município, zona, bairro ou personalizado) | Entidade | Zona Eleitoral 001 de Goiânia |
| `classificacao_territorial` | Classificação estratégica de um território em relação a um candidato ou partido | Entidade | Zona 001 = Zona de Força para João Silva (2024) |
| `pesquisa_eleitoral` | Levantamento de intenção de voto, aprovação ou rejeição realizado pela equipe | Entidade | Pesquisa de intenção de voto — jun/2024 |
| `resultado_pesquisa` | Resultado agregado de uma pesquisa por território e candidato/partido | Entidade | João Silva com 35% de intenção de voto na Zona 01 |
| `importacao_dados` | Registro de cada processo de importação de dados externos | Entidade | Import TSE 2024 GO — concluído em 02/06/2024 |
| `fonte_dados` | Origem dos dados importados (TSE, IBGE, pesquisa própria) | Entidade | TSE — Resultados por Seção 2024 |
| `indicador_eleitoral` | Indicador calculado para análise territorial | Entidade | Índice de Força Territorial = 82 |

---

## Classificações Territoriais

| Termo | Definição |
|---|---|
| `zona_forca` | Território onde o candidato/partido obteve média ≥ 40% dos votos válidos nas últimas 2 eleições |
| `territorio_consolidado` | Zona de força com baixa variação (desvio padrão ≤ 5 p.p. entre eleições) |
| `zona_disputa` | Território sem dominância clara — diferença entre 1º e 2º colocados ≤ 10 p.p. |
| `zona_expansao` | Território com tendência de crescimento — crescimento ≥ 10% de votos entre as duas últimas eleições |
| `territorio_adversario` | Território dominado pelo campo oposto — candidato/partido adversário com > 50% dos votos válidos |
| `territorio_neutro` | Território sem padrão definido — nenhuma das condições de outra classificação satisfeita |
| `territorio_volatil` | Território com alta variação entre eleições — desvio padrão > 15 p.p. entre eleições comparáveis |

---

## Espectro Político

| Valor | Definição |
|---|---|
| `esquerda` | Partidos/candidatos classificados no espectro político de esquerda |
| `centro_esquerda` | Partidos/candidatos classificados no centro-esquerda |
| `centro` | Partidos/candidatos classificados no centro do espectro político |
| `centro_direita` | Partidos/candidatos classificados no centro-direita |
| `direita` | Partidos/candidatos classificados no espectro político de direita |

---

## Tabelas Implementadas — Estrutura Atual do Banco

### `partidos`

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | UUID (PK) | Identificador único |
| `sigla` | VARCHAR(20) UNIQUE | Sigla do partido em maiúsculas (ex.: PT, MDB) |
| `nome` | VARCHAR(120) | Nome por extenso (opcional) |
| `numero` | INTEGER | Número eleitoral (opcional) |
| `created_at` | TIMESTAMP | Data de criação |

**Observações:** Um candidato pode ter concorrido por partidos diferentes em eleições distintas. O vínculo partido ↔ eleição está na tabela `candidaturas`.

---

### `candidatos`

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | UUID (PK) | Identificador único |
| `nm_candidato` | VARCHAR(160) | Nome do candidato (obrigatório, em maiúsculas) |
| `nr_candidato` | VARCHAR(10) | Número nas urnas — **opcional**, pois varia por eleição |
| `nm_partido` | VARCHAR(80) | Nome do partido principal — denormalizado para referência rápida |
| `sg_partido` | VARCHAR(20) | Sigla do partido principal |
| `sg_uf` | VARCHAR(2) | UF de atuação |
| `cargo` | VARCHAR(60) | Cargo principal — **opcional**, pois varia por eleição |
| `created_at` | TIMESTAMP | Data de criação |

**Observações:** `nr_candidato` e `cargo` são campos secundários no perfil do candidato. Os valores definitivos por eleição estão na `candidatura`, preenchidos a partir dos dados TSE via `sq_candidato_tse`.

---

### `candidaturas`

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | UUID (PK) | Identificador único |
| `candidato_id` | UUID (FK → candidatos) | Candidato |
| `eleicao_id` | UUID (FK → eleicoes) | Eleição |
| `partido_id` | UUID (FK → partidos, nullable) | Partido na **esta** eleição específica |
| `sq_candidato_tse` | BIGINT | **Chave principal de ligação com os dados TSE** — único por candidato por eleição |
| `nr_votavel` | VARCHAR(10) | Número nas urnas nesta eleição |
| `nm_votavel` | VARCHAR(160) | Nome exato como aparece nas urnas (TSE) |
| `ds_cargo` | VARCHAR(60) | Cargo disputado nesta eleição (preenchido via TSE) |
| `situacao` | VARCHAR(30) | deferida, indeferida, cassada, eleito, nao_eleito, segundo_turno |
| `created_at` | TIMESTAMP | Data de criação |

**Restrição:** `UNIQUE(candidato_id, eleicao_id)` — um candidato só pode ter uma candidatura por eleição.  
**Observações:** O cargo não é inserido manualmente — é auto-preenchido ao buscar o candidato no TSE pelo `sq_candidato_tse` ou pelo nome na urna. O partido pode ser diferente do `sg_partido` no perfil do candidato.

---

### `users` (campos relevantes)

| Campo | Tipo | Descrição |
|---|---|---|
| `candidato_id` | UUID (FK → candidatos, nullable) | Candidato vinculado ao usuário |

**Controle de acesso:** Usuários com perfil `administrador` têm acesso a todos os candidatos. Demais perfis (`gestor`, `analista`, `assessor`) visualizam apenas o candidato vinculado ao seu `candidato_id`.

---

## Campos TSE — Mapeamento com a Plataforma

| Campo CSV (TSE) | Campo no banco | Definição |
|---|---|---|
| `SQ_CANDIDATO` | `sq_candidato_tse` | **Chave principal de ligação.** Número sequencial único por candidato por eleição, gerado internamente pelo TSE. Não é o número de campanha. Informado manualmente ao criar a candidatura para vincular o candidato cadastrado aos dados importados. |
| `NR_VOTAVEL` | `nr_votavel` | Número do candidato nas urnas (ex.: 13123). Pertence ao partido, não à pessoa. |
| `NM_VOTAVEL` | `nm_votavel_tse` | Nome exato como aparece nas urnas e no CSV do TSE. |
| `CD_MUNICIPIO` | `codigo_tse` em `municipio` | Código numérico do município no TSE — diferente do código IBGE. |
| `NR_ZONA` | `numero_zona` em `zona_eleitoral` | Número da zona eleitoral dentro do município. |
| `NR_SECAO` | `numero_secao` em `secao_eleitoral` | Número da seção (urna). |
| `NR_LOCAL_VOTACAO` | `numero_tse` em `local_votacao` | Número do local físico de votação. |
| `DS_LOCAL_VOTACAO_ENDERECO` | `endereco` em `local_votacao` | Endereço completo do local — usado para geocodificação (obtenção de lat/lng). |
| `CD_ELEICAO` | `cd_eleicao_tse` em `eleicao` | Código único da eleição e turno no TSE. Uma eleição cobre múltiplos cargos. |
| `CD_CARGO` / `DS_CARGO` | `cd_cargo_tse` / `ds_cargo_tse` em `resultado_eleitoral` | Código e nome do cargo (ex.: 6 = DEPUTADO FEDERAL). |
| `QT_VOTOS` | `qt_votos` em `resultado_eleitoral` | Votos recebidos naquela seção específica. |

---

## Termos de Importação

| Termo | Definição |
|---|---|
| `staging` | Tabela temporária onde os dados são inseridos antes de validação e consolidação |
| `hash_arquivo` | Hash SHA-256 do arquivo importado para verificação de integridade e auditoria |
| `normalização` | Processo de padronizar dados de diferentes fontes (encoding, nomes, códigos) |
| `rastreabilidade` | Capacidade de identificar a origem, responsável e data de cada dado na plataforma |

---

## Termos Técnicos

| Termo | Definição |
|---|---|
| `indice_forca` | Índice de 0 a 100 que quantifica o desempenho territorial de um candidato ou partido |
| `media_percentual_votos` | Média do percentual de votos válidos nas últimas N eleições em um território |
| `tendencia_crescimento` | Variação percentual de votos entre a última e a penúltima eleição em um território |
| `consistencia_historica` | Medida de regularidade do desempenho: `1 - (desvio_padrão / média)`, normalizado entre 0 e 1 |
| `geocodificacao` | Processo de converter um endereço textual em coordenadas geográficas (lat/lng). Realizado via Nominatim (OpenStreetMap, gratuito) sobre o campo `DS_LOCAL_VOTACAO_ENDERECO` do TSE. |
| `vinculo_spatial` | Processo PostGIS que determina automaticamente em qual bairro um local de votação está, via `ST_Within(ponto, polígono)` |
| `WGS84` | Sistema de coordenadas geográficas padrão (EPSG:4326) utilizado pelo Leaflet e pelo TSE |
| `PostGIS` | Extensão do PostgreSQL para dados geoespaciais — habilita polígonos, cálculos de área e consultas espaciais |
| `GeoJSON` | Formato de dados geográficos baseado em JSON — padrão para polígonos no Leaflet |
| `Shapefile` | Formato de dados geográficos vetoriais usado pelo TSE e IBGE — deve ser convertido para GeoJSON |
| `Nominatim` | API gratuita de geocodificação baseada no OpenStreetMap |
| `single-tenant` | Arquitetura onde cada instalação serve uma única organização — sem isolamento entre organizações |
| `multi-tenant` | Arquitetura onde múltiplas organizações compartilham a plataforma com dados isolados — **não adotada neste projeto** |
| `RBAC` | Role-Based Access Control — controle de acesso baseado em perfis de usuário |
| `JWT` | JSON Web Token — padrão de autenticação sem estado |
| `SPA` | Single Page Application — aplicação web de página única |

---

## Termos Eleitorais (Glossário)

| Termo | Definição |
|---|---|
| `votos_validos` | Total de votos excluindo nulos e brancos |
| `votos_nominais` | Votos atribuídos diretamente ao candidato |
| `votos_de_legenda` | Votos atribuídos ao partido, não a candidato específico |
| `zona_eleitoral` | Unidade de organização eleitoral do TSE subordinada ao município |
| `secao_eleitoral` | Menor unidade de organização eleitoral — a urna de votação |
| `local_votacao` | Local físico onde estão instaladas as seções eleitorais |
| `eleitorado_apto` | Total de eleitores com domicílio eleitoral em uma seção/zona/município |
| `sistema_proporcional` | Sistema onde os votos são convertidos em cadeiras proporcionalmente (ex.: vereadores) |
| `sistema_majoritario` | Sistema onde vence o candidato com mais votos (ex.: prefeito) |
| `TSE` | Tribunal Superior Eleitoral — órgão máximo da Justiça Eleitoral brasileira |
| `IBGE` | Instituto Brasileiro de Geografia e Estatística |
| `LGPD` | Lei Geral de Proteção de Dados — Lei nº 13.709/2018 |
| `DPO` | Data Protection Officer — Encarregado de Dados |
| `RIPD` | Relatório de Impacto à Proteção de Dados |
