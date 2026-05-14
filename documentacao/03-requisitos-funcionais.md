# 03 — Requisitos Funcionais

> Define o que o sistema deve fazer — funcionalidades, comportamentos e regras observáveis pelo usuário.

---

## Módulo: Candidato (RF-C)

| ID | Requisito | Prioridade | HU Relacionada |
|---|---|---|---|
| RF-C01 | O sistema deve permitir cadastrar candidatos com histórico eleitoral | MVP | HU-C01 |
| RF-C02 | O sistema deve permitir cadastrar pré-candidatos sem histórico eleitoral | MVP | HU-P01 |
| RF-C03 | O sistema deve identificar visualmente pré-candidatos com marcação distinta | MVP | HU-P01 |
| RF-C04 | O sistema deve associar candidato a partido, cargo pretendido e espectro político | MVP | HU-P01 |
| RF-C05 | O sistema deve converter automaticamente pré-candidato em candidato após registro de candidatura | Importante | HU-P05 |
| RF-C06 | O sistema deve permitir associar candidatos de referência a um pré-candidato | MVP | HU-P01 |
| RF-C07 | O sistema deve permitir buscar e filtrar candidatos por nome, partido, cargo e município | MVP | — |
| RF-C08 | O sistema deve armazenar CPF apenas como hash SHA-256 irreversível | MVP | — |

---

## Módulo: Eleição (RF-E)

| ID | Requisito | Prioridade | HU Relacionada |
|---|---|---|---|
| RF-E01 | O sistema deve registrar eleições com ano, turno, tipo e data de realização | MVP | — |
| RF-E02 | O sistema deve exibir histórico eleitoral por candidato, partido, cargo e território | MVP | HU-C01 |
| RF-E03 | O sistema deve permitir comparar o desempenho de um candidato entre duas eleições | MVP | HU-C02 |
| RF-E04 | O sistema deve exibir variação absoluta e percentual de votos entre eleições por território | MVP | HU-C02 |
| RF-E05 | O sistema deve exibir gráfico de evolução de votação ao longo do tempo | MVP | HU-C04 |
| RF-E06 | O sistema deve permitir comparar candidato com a média do partido por território | Importante | HU-CC04 |

---

## Módulo: Território (RF-T)

| ID | Requisito | Prioridade | HU Relacionada |
|---|---|---|---|
| RF-T01 | O sistema deve exibir mapa interativo com camadas de municípios, zonas eleitorais, seções e bairros | MVP | HU-C01 |
| RF-T02 | O sistema deve classificar territórios automaticamente segundo os critérios documentados | MVP | HU-CC01 |
| RF-T03 | O sistema deve exibir camadas temáticas por classificação territorial com cores distintas | MVP | HU-CC01 |
| RF-T04 | O sistema deve exibir painel lateral com detalhes ao clicar em um território | MVP | HU-CC01 |
| RF-T05 | O sistema deve calcular o índice de força territorial de 0 a 100 | MVP | HU-A02 |
| RF-T06 | O sistema deve exibir os componentes do índice de força de forma transparente | MVP | HU-A02 |
| RF-T07 | O sistema deve permitir classificação manual de território com justificativa registrada | Importante | HU-CE03 |
| RF-T08 | O sistema deve exibir locais de votação como marcadores no mapa | Importante | HU-CC06 |
| RF-T09 | O sistema deve permitir filtros do mapa por eleição, cargo, candidato e partido | MVP | HU-CC01 |
| RF-T10 | O sistema deve suportar zoom e navegação por nível territorial (estado → município → zona → seção) | MVP | HU-CC02 |

---

## Módulo: Pesquisa Eleitoral (RF-P)

| ID | Requisito | Prioridade | HU Relacionada |
|---|---|---|---|
| RF-P01 | O sistema deve permitir cadastrar metadados completos de pesquisas eleitorais | MVP | HU-PQ03 |
| RF-P02 | O sistema deve importar resultados de pesquisa em formato CSV padronizado | MVP | HU-PQ01 |
| RF-P03 | O sistema deve validar o arquivo CSV antes da importação e exibir erros por linha | MVP | HU-PQ01 |
| RF-P04 | O sistema deve aceitar apenas dados agregados — nunca dados individuais de respondentes | MVP | HU-PQ01 |
| RF-P05 | O sistema deve cruzar resultados de pesquisa com histórico eleitoral por território | Importante | HU-PQ02 |
| RF-P06 | O sistema deve sobrepor dados de pesquisa no mapa junto ao histórico eleitoral | Importante | HU-CE02 |
| RF-P07 | O sistema deve exibir metadados da pesquisa (data, metodologia, amostra, margem de erro) | MVP | HU-PQ02 |

---

## Módulo: Importação de Dados (RF-I)

| ID | Requisito | Prioridade | HU Relacionada |
|---|---|---|---|
| RF-I01 | O sistema deve importar dados do TSE a partir de arquivos CSV | MVP | HU-PQ01 |
| RF-I02 | O sistema deve validar integridade dos arquivos importados via hash SHA-256 | MVP | — |
| RF-I03 | O sistema deve registrar cada importação com status, responsável e data | MVP | HU-A05 |
| RF-I04 | O sistema deve exibir histórico de importações com detalhes de erros | Importante | HU-A05 |
| RF-I05 | O sistema deve nunca sobrescrever dados importados — apenas adicionar ou marcar como substituído | MVP | — |

---

## Módulo: Painel e Indicadores (RF-PA)

| ID | Requisito | Prioridade | HU Relacionada |
|---|---|---|---|
| RF-PA01 | O sistema deve exibir painel principal com indicadores consolidados | MVP | HU-A01 |
| RF-PA02 | O sistema deve permitir filtros combinados por eleição, cargo, partido, candidato, município, zona e seção | MVP | HU-A03 |
| RF-PA03 | O sistema deve permitir exportação de dados e tabelas em formato CSV | MVP | HU-CC05, HU-A06 |
| RF-PA04 | O sistema deve exibir gráficos de evolução eleitoral por território ao longo de múltiplas eleições | MVP | HU-A07 |
| RF-PA05 | O sistema deve exibir o espectro político histórico de cada território | Importante | HU-CE04 |

---

## Módulo: Usuário e Acesso (RF-U)

| ID | Requisito | Prioridade | HU Relacionada |
|---|---|---|---|
| RF-U01 | O sistema deve autenticar usuários via e-mail e senha | MVP | — |
| RF-U02 | O sistema deve implementar controle de acesso por perfil (RBAC): administrador, analista, visualizador | MVP | — |
| RF-U03 | O sistema deve suportar múltiplas organizações isoladas (multi-tenant) | MVP | HU-CE05 |
| RF-U04 | O sistema deve registrar log de ações sensíveis por usuário | MVP | — |
| RF-U05 | O sistema deve implementar JWT com access token (15 min) e refresh token (7 dias) | MVP | — |
