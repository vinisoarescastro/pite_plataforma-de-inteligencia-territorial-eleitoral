# 12 — Dicionário de Dados

> Glossário técnico com definição precisa de cada entidade, campo e termo utilizado no sistema.  
> Objetivo: eliminar ambiguidade entre equipe técnica, de produto e de negócio.

---

## Entidades Principais

| Termo | Definição | Tipo | Exemplo |
|---|---|---|---|
| `candidato` | Pessoa que disputou ou disputa uma eleição, registrada no TSE | Entidade | João da Silva |
| `pre_candidato` | Pessoa que pretende disputar eleições mas ainda não tem histórico eleitoral registrado | Atributo de `candidato` (`eh_pre_candidato = true`) | Maria Souza |
| `partido` | Organização política registrada no TSE | Entidade | PT, MDB, PL |
| `cargo` | Cargo eletivo disputado em uma eleição | Entidade | Vereador, Prefeito, Deputado Federal |
| `eleicao` | Ciclo eleitoral realizado em um determinado ano e turno | Entidade | Eleições Municipais 2020, 1º Turno |
| `candidatura` | Participação de um candidato em uma eleição específica para um cargo em um partido | Entidade | João Silva pelo PT para Vereador em 2020 |
| `resultado_eleitoral` | Resultado agregado de uma candidatura em um território específico | Entidade | João Silva obteve 350 votos na Zona 01 em 2020 |
| `territorio` | Recorte geográfico para análise estratégica (município, zona, seção, bairro ou personalizado) | Entidade | Zona Eleitoral 001 de São Paulo |
| `classificacao_territorial` | Classificação estratégica de um território em relação a um candidato ou partido | Entidade | Zona 001 = Zona de Força para João Silva (2020) |
| `pesquisa_eleitoral` | Levantamento de intenção de voto, aprovação ou rejeição realizado pela equipe | Entidade | Pesquisa de intenção de voto — junho/2024 |
| `resultado_pesquisa` | Resultado agregado de uma pesquisa por território e candidato/partido | Entidade | João Silva com 35% de intenção de voto na Zona 01 |
| `importacao_dados` | Registro de cada processo de importação de dados externos | Entidade | Import TSE 2020 — concluído em 15/01/2024 |
| `fonte_dados` | Origem dos dados importados (TSE, IBGE, pesquisa própria) | Entidade | TSE — Resultados por Seção 2020 |
| `indicador_eleitoral` | Indicador calculado para análise territorial | Entidade | Índice de Força Territorial = 72.5 |

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
| `WGS84` | Sistema de coordenadas geográficas padrão (EPSG:4326) utilizado pelo Leaflet |
| `PostGIS` | Extensão do PostgreSQL para dados geoespaciais |
| `GeoJSON` | Formato de dados geográficos baseado em JSON |
| `multi-tenant` | Arquitetura onde múltiplas organizações compartilham a plataforma com dados isolados |
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
