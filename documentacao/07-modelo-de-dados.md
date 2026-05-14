# 07 — Modelo de Dados

> Descreve as entidades, campos, tipos, relacionamentos e índices do banco de dados.  
> Banco: **PostgreSQL 15+ com PostGIS**. Coordenadas em **WGS84 (EPSG:4326)**.

---

## Entidades

1. [municipio](#1-municipio)
2. [zona_eleitoral](#2-zona_eleitoral)
3. [secao_eleitoral](#3-secao_eleitoral)
4. [local_votacao](#4-local_votacao)
5. [bairro](#5-bairro)
6. [partido](#6-partido)
7. [cargo](#7-cargo)
8. [eleicao](#8-eleicao)
9. [candidato](#9-candidato)
10. [candidatura](#10-candidatura)
11. [resultado_eleitoral](#11-resultado_eleitoral)
12. [territorio](#12-territorio)
13. [classificacao_territorial](#13-classificacao_territorial)
14. [pesquisa_eleitoral](#14-pesquisa_eleitoral)
15. [resultado_pesquisa](#15-resultado_pesquisa)
16. [usuario](#16-usuario)
17. [fonte_dados](#17-fonte_dados)
18. [importacao_dados](#18-importacao_dados)
19. [indicador_eleitoral](#19-indicador_eleitoral)

---

## 1. `municipio`

**Objetivo:** Base territorial fundamental — representa os municípios brasileiros.

| Campo | Tipo | Descrição |
|---|---|---|
| `municipio_id` | UUID (PK) | Identificador único |
| `codigo_ibge` | VARCHAR(7) | Código oficial do IBGE |
| `codigo_tse` | VARCHAR(6) | Código utilizado pelo TSE |
| `nome` | VARCHAR | Nome do município |
| `uf` | CHAR(2) | Sigla do estado |
| `regiao` | VARCHAR | Norte, Nordeste, Centro-Oeste, Sudeste, Sul |
| `populacao_estimada` | INTEGER | Estimativa populacional |
| `geometria` | GEOMETRY | Polígono geográfico (PostGIS) |
| `criado_em` | TIMESTAMP | Data de criação |
| `atualizado_em` | TIMESTAMP | Data de última atualização |

**Relacionamentos:** Tem muitas `zona_eleitoral`, `bairro`, `resultado_eleitoral`, `pesquisa_eleitoral`.  
**Índices:** `codigo_ibge`, `codigo_tse`, `uf`.  
**Observações:** Geometria em WGS84 (EPSG:4326) para uso no Leaflet. Dados provenientes do TSE e IBGE.

---

## 2. `zona_eleitoral`

**Objetivo:** Unidade de organização eleitoral do TSE subordinada ao município.

| Campo | Tipo | Descrição |
|---|---|---|
| `zona_eleitoral_id` | UUID (PK) | Identificador único |
| `municipio_id` | UUID (FK) | Município ao qual pertence |
| `numero_zona` | INTEGER | Número da zona eleitoral |
| `nome_zona` | VARCHAR | Nome da zona (opcional) |
| `uf` | CHAR(2) | Sigla do estado |
| `geometria` | GEOMETRY | Polígono geográfico (opcional) |
| `criado_em` | TIMESTAMP | Data de criação |

**Relacionamentos:** Pertence a `municipio`. Tem muitas `secao_eleitoral`, `resultado_eleitoral`.  
**Índices:** `municipio_id`, `numero_zona`, `uf`.

---

## 3. `secao_eleitoral`

**Objetivo:** Menor unidade de organização eleitoral — a seção de votação.

| Campo | Tipo | Descrição |
|---|---|---|
| `secao_eleitoral_id` | UUID (PK) | Identificador único |
| `zona_eleitoral_id` | UUID (FK) | Zona à qual pertence |
| `municipio_id` | UUID (FK) | Município ao qual pertence |
| `local_votacao_id` | UUID (FK) | Local de votação (opcional) |
| `numero_secao` | INTEGER | Número da seção |
| `quantidade_eleitores_aptos` | INTEGER | Total de eleitores aptos |
| `criado_em` | TIMESTAMP | Data de criação |

**Relacionamentos:** Pertence a `zona_eleitoral`. Tem muitos `resultado_eleitoral`.  
**Observações:** Resultados por seção são dados públicos — representam totais agregados por seção, não dados individuais.

---

## 4. `local_votacao`

**Objetivo:** Representa os locais físicos onde ocorre a votação.

| Campo | Tipo | Descrição |
|---|---|---|
| `local_votacao_id` | UUID (PK) | Identificador único |
| `municipio_id` | UUID (FK) | Município |
| `zona_eleitoral_id` | UUID (FK) | Zona eleitoral |
| `nome_local` | VARCHAR | Nome do local |
| `endereco` | VARCHAR | Endereço completo |
| `bairro` | VARCHAR | Bairro |
| `latitude` | DECIMAL | Coordenada geográfica |
| `longitude` | DECIMAL | Coordenada geográfica |
| `criado_em` | TIMESTAMP | Data de criação |

**Relacionamentos:** Tem muitas `secao_eleitoral`.

---

## 5. `bairro`

**Objetivo:** Representa bairros para análise territorial mais fina que o município.

| Campo | Tipo | Descrição |
|---|---|---|
| `bairro_id` | UUID (PK) | Identificador único |
| `municipio_id` | UUID (FK) | Município ao qual pertence |
| `nome` | VARCHAR | Nome do bairro |
| `codigo_externo` | VARCHAR | Código de referência externa (IBGE, prefeitura) |
| `geometria` | GEOMETRY | Polígono geográfico (opcional) |
| `criado_em` | TIMESTAMP | Data de criação |

**Observações:** Populado via IBGE, TSE ou cadastro manual. Geometria opcional mas recomendada para análises no Leaflet.

---

## 6. `partido`

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

## 7. `cargo`

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

## 8. `eleicao`

**Objetivo:** Representa cada ciclo eleitoral realizado no Brasil.

| Campo | Tipo | Descrição |
|---|---|---|
| `eleicao_id` | UUID (PK) | Identificador único |
| `ano` | INTEGER | Ano da eleição |
| `turno` | INTEGER | 1 ou 2 |
| `tipo_eleicao` | ENUM | municipal, estadual_federal, suplementar |
| `data_realizacao` | DATE | Data de realização |
| `descricao` | VARCHAR | Descrição da eleição |
| `fonte_dados_id` | UUID (FK) | Fonte de dados utilizada |
| `importado_em` | TIMESTAMP | Data da importação |
| `criado_em` | TIMESTAMP | Data de criação |

**Índices:** `ano`, `tipo_eleicao`.

---

## 9. `candidato`

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

## 10. `candidatura`

**Objetivo:** Une candidato, eleição, cargo e partido — representa a participação em uma eleição.

| Campo | Tipo | Descrição |
|---|---|---|
| `candidatura_id` | UUID (PK) | Identificador único |
| `candidato_id` | UUID (FK) | Candidato |
| `eleicao_id` | UUID (FK) | Eleição |
| `cargo_id` | UUID (FK) | Cargo disputado |
| `partido_id` | UUID (FK) | Partido na eleição |
| `municipio_id` | UUID (FK) | Município (cargos municipais) |
| `uf` | CHAR(2) | Estado (cargos estaduais/federais) |
| `numero_candidato` | INTEGER | Número nas urnas |
| `situacao_candidatura` | ENUM | deferida, indeferida, cassada, eleito, nao_eleito |
| `codigo_tse` | VARCHAR | Código único do TSE |
| `fonte_dados_id` | UUID (FK) | Fonte de dados |
| `criado_em` | TIMESTAMP | Data de criação |

**Índices:** `candidato_id`, `eleicao_id`, `codigo_tse`, `partido_id`.

---

## 11. `resultado_eleitoral`

**Objetivo:** Armazena resultados eleitorais agregados por território — núcleo analítico da plataforma.

| Campo | Tipo | Descrição |
|---|---|---|
| `resultado_eleitoral_id` | UUID (PK) | Identificador único |
| `candidatura_id` | UUID (FK) | Candidatura referenciada |
| `eleicao_id` | UUID (FK) | Eleição |
| `cargo_id` | UUID (FK) | Cargo |
| `partido_id` | UUID (FK) | Partido |
| `municipio_id` | UUID (FK) | Município |
| `zona_eleitoral_id` | UUID (FK) | Zona eleitoral (nulo se agregado por município) |
| `secao_eleitoral_id` | UUID (FK) | Seção eleitoral (nulo se agregado por zona) |
| `quantidade_votos` | INTEGER | Votos absolutos |
| `percentual_votos_validos` | DECIMAL | % sobre votos válidos |
| `percentual_votos_totais` | DECIMAL | % sobre total de votos |
| `colocacao` | INTEGER | Posição no território |
| `eleito` | BOOLEAN | Se foi eleito |
| `fonte_dados_id` | UUID (FK) | Fonte de dados |
| `criado_em` | TIMESTAMP | Data de criação |

**Índices:** `eleicao_id`, `candidatura_id`, `partido_id`, `municipio_id`, `zona_eleitoral_id`, `secao_eleitoral_id`.  
**Observações:** Dados por seção são públicos (TSE). **Nunca expor dados individuais de eleitores.** Tabela central para todos os módulos analíticos.

---

## 12. `territorio`

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

## 13. `classificacao_territorial`

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

## 14. `pesquisa_eleitoral`

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

## 15. `resultado_pesquisa`

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

## 16. `usuario`

**Objetivo:** Representa os usuários com acesso à plataforma.

| Campo | Tipo | Descrição |
|---|---|---|
| `usuario_id` | UUID (PK) | Identificador único |
| `nome` | VARCHAR | Nome do usuário |
| `email` | VARCHAR | E-mail (único) |
| `senha_hash` | VARCHAR | Hash bcrypt da senha |
| `perfil_acesso` | ENUM | administrador, analista, visualizador |
| `organizacao_id` | UUID (FK) | Organização à qual pertence |
| `ativo` | BOOLEAN | Status ativo |
| `ultimo_acesso_em` | TIMESTAMP | Data do último acesso |
| `criado_em` | TIMESTAMP | Data de criação |

**Observações:** Senha nunca em texto puro. E-mail recomendado com criptografia em repouso.

---

## 17. `fonte_dados`

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

## 18. `importacao_dados`

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

## 19. `indicador_eleitoral`

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
