# 11 — Backlog Inicial

> Lista estruturada de épicos e tarefas técnicas organizadas por prioridade.  
> Prioridades: **MVP** (essencial para a primeira entrega), **Importante** (V1), **Futuro** (V2+).

---

## ÉPICO 1 — Infraestrutura e Fundação Técnica

| ID | Tarefa | Prioridade | HU Relacionada |
|---|---|---|---|
| T01 | Configurar repositório, estrutura e padrões de código | MVP | — |
| T02 | Configurar PostgreSQL + PostGIS | MVP | — |
| T03 | Criar migrações iniciais do banco de dados | MVP | — |
| T04 | Configurar API Node.js / Fastify em TypeScript | MVP | — |
| T05 | Configurar SPA React + Vite + TypeScript | MVP | — |
| T06 | Implementar autenticação JWT (access + refresh token) | MVP | — |
| T07 | Implementar RBAC (perfis: administrador, analista, visualizador) | MVP | — |
| T08 | Configurar Docker e ambiente de desenvolvimento | MVP | — |
| T09 | Configurar pipeline CI/CD básico | Importante | — |
| T10 | Configurar Redis para cache e sessões | Importante | — |

---

## ÉPICO 2 — Importação de Dados do TSE

| ID | Tarefa | Prioridade | HU Relacionada |
|---|---|---|---|
| T11 | Desenvolver `servico_importacao_tse` (CSV do TSE) | MVP | HU-PQ01, HU-A05 |
| T12 | Desenvolver normalizador e validador de dados TSE | MVP | — |
| T13 | Importar municípios, zonas eleitorais e seções | MVP | — |
| T14 | Importar candidaturas, partidos e cargos históricos | MVP | — |
| T15 | Importar locais de votação | MVP | HU-CC06 |
| T16 | Importar dados geográficos (GeoJSON/Shapefile) para Leaflet | MVP | — |
| T17 | Implementar rastreabilidade via `importacao_dados` | MVP | HU-A05 |
| T18 | Tela de gerenciamento e histórico de importações | Importante | HU-A05 |

---

## ÉPICO 3 — Módulo de Candidatos

| ID | Tarefa | Prioridade | HU Relacionada |
|---|---|---|---|
| T19 | CRUD de candidatos (com histórico) | MVP | HU-C01, HU-CE05 |
| T20 | Cadastro de pré-candidatos (sem histórico) | MVP | HU-P01, HU-PP04 |
| T21 | Associação candidato ↔ partido ↔ cargo ↔ eleição | MVP | HU-P01, HU-PP02 |
| T22 | Tela de detalhe do candidato com histórico eleitoral | MVP | HU-C01, HU-C04 |
| T23 | Conversão de pré-candidato para candidato | Importante | HU-P05 |
| T24 | Busca e filtro de candidatos | MVP | — |

---

## ÉPICO 4 — Histórico Eleitoral

| ID | Tarefa | Prioridade | HU Relacionada |
|---|---|---|---|
| T25 | API `obter_resultado_eleitoral` por candidato, partido, território | MVP | HU-C01, HU-CE01 |
| T26 | Tela de histórico eleitoral com tabela analítica | MVP | HU-C01, HU-A01 |
| T27 | Gráfico de evolução de votação ao longo do tempo | MVP | HU-C04, HU-A07 |
| T28 | Comparação entre duas eleições diferentes | MVP | HU-C02, HU-CE01 |
| T29 | Comparação candidato vs. média do partido por território | Importante | HU-CC04 |
| T30 | Filtros combinados por eleição, cargo, partido, candidato e território | MVP | HU-A03, HU-CC02 |

---

## ÉPICO 5 — Mapa Interativo e Inteligência Territorial (Leaflet)

| ID | Tarefa | Prioridade | HU Relacionada |
|---|---|---|---|
| T31 | Implementar mapa interativo com Leaflet + React-Leaflet | MVP | HU-C01, HU-CC01 |
| T32 | Camada de municípios com dados eleitorais | MVP | HU-C01 |
| T33 | Camada de zonas eleitorais | MVP | HU-CC01, HU-CC02 |
| T34 | Camada de seções eleitorais | MVP | HU-CC02 |
| T35 | Camada de bairros | Importante | HU-CC02 |
| T36 | Camada de locais de votação (marcadores) | Importante | HU-CC06 |
| T37 | Classificação automática de territórios | MVP | HU-CC01, HU-PP01 |
| T38 | Camadas de classificação territorial (cores temáticas) | MVP | HU-CC01 |
| T39 | Painel lateral de detalhes ao clicar no território | MVP | HU-CC01 |
| T40 | Filtros do mapa por eleição, cargo, candidato, partido | MVP | HU-CC01 |
| T41 | Calcular e exibir `indice_forca` por território | MVP | HU-A02 |
| T42 | Mapa comparativo entre dois candidatos | Futuro | HU-CE01 |

---

## ÉPICO 6 — Módulo de Pesquisas Eleitorais

| ID | Tarefa | Prioridade | HU Relacionada |
|---|---|---|---|
| T43 | CRUD de pesquisas eleitorais | MVP | HU-PQ03 |
| T44 | Importação de resultados de pesquisa via CSV | MVP | HU-PQ01 |
| T45 | Validação e registro de importação de pesquisa | MVP | HU-PQ01 |
| T46 | Cruzamento pesquisa × histórico eleitoral | Importante | HU-PQ02, HU-CE02 |
| T47 | Sobreposição de pesquisa no mapa Leaflet | Importante | HU-CE02 |
| T48 | Visualização de tendências por localidade | Importante | HU-PQ04 |

---

## ÉPICO 7 — Painéis e Indicadores

| ID | Tarefa | Prioridade | HU Relacionada |
|---|---|---|---|
| T49 | `PainelPrincipal` com indicadores consolidados | MVP | HU-A01 |
| T50 | `PainelInteligenciaTerritorial` | MVP | HU-CC01, HU-A02 |
| T51 | `PainelHistoricoEleitoral` | MVP | HU-C01, HU-A07 |
| T52 | `calcular_indice_forca_partidaria` e exibição por território | MVP | HU-A02 |
| T53 | Exportação de dados em CSV | MVP | HU-CC05, HU-A06 |
| T54 | Painel de perfil político territorial | Importante | HU-CE04, HU-A04 |
| T55 | Exportação de relatório em PDF | Futuro | HU-CE06 |

---

## ÉPICO 8 — Pré-Candidatos e Potencial Eleitoral

| ID | Tarefa | Prioridade | HU Relacionada |
|---|---|---|---|
| T56 | Análise de compatibilidade pré-candidato × território | Importante | HU-P03 |
| T57 | Visualização de territórios compatíveis por perfil político | Importante | HU-P03 |
| T58 | `calcular_potencial_eleitoral` por território e partido | Futuro | HU-P03, HU-PP04 |
| T59 | Simulador de potencial eleitoral para pré-candidatos | Futuro | HU-P03, HU-PP04 |

---

## Resumo por Prioridade

| Prioridade | Total de Tarefas |
|---|---|
| MVP | 38 |
| Importante | 15 |
| Futuro | 6 |
| **Total** | **59** |
