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
| RF-C09 | O sistema deve permitir criar candidatura vinculando o candidato à eleição informando o `SQ_CANDIDATO` do TSE | MVP | — |
| RF-C10 | O sistema deve exibir, na tela de criação de candidatura, os campos `SQ_CANDIDATO`, `NR_VOTAVEL` e nome de urna exato do TSE | MVP | — |
| RF-C11 | O sistema deve validar que o `SQ_CANDIDATO` informado não está já vinculado a outro candidato na mesma eleição | MVP | — |

---

## Módulo: Eleição (RF-E)

| ID | Requisito | Prioridade | HU Relacionada |
|---|---|---|---|
| RF-E01 | O sistema deve registrar eleições com ano, turno, UF, tipo e data de realização | MVP | — |
| RF-E02 | O sistema deve exibir histórico eleitoral por candidato, partido, cargo e território | MVP | HU-C01 |
| RF-E03 | O sistema deve permitir comparar o desempenho de um candidato entre duas eleições | MVP | HU-C02 |
| RF-E04 | O sistema deve exibir variação absoluta e percentual de votos entre eleições por território | MVP | HU-C02 |
| RF-E05 | O sistema deve exibir gráfico de evolução de votação ao longo do tempo | MVP | HU-C04 |
| RF-E06 | O sistema deve permitir comparar candidato com a média do partido por território | Importante | HU-CC04 |
| RF-E07 | Uma eleição deve cobrir múltiplos cargos — o cargo específico fica na candidatura, não na eleição | MVP | — |
| RF-E08 | O sistema deve extrair e exibir todos os cargos distintos presentes em uma importação do TSE | MVP | — |

---

## Módulo: Território (RF-T)

| ID | Requisito | Prioridade | HU Relacionada |
|---|---|---|---|
| RF-T01 | O sistema deve exibir mapa interativo com camadas de municípios, zonas eleitorais, bairros e locais de votação | MVP | HU-C01 |
| RF-T02 | O sistema deve classificar territórios automaticamente segundo os critérios documentados | MVP | HU-CC01 |
| RF-T03 | O sistema deve exibir camadas temáticas por classificação territorial com cores distintas | MVP | HU-CC01 |
| RF-T04 | O sistema deve exibir painel lateral com detalhes ao clicar em um território | MVP | HU-CC01 |
| RF-T05 | O sistema deve calcular o índice de força territorial de 0 a 100 | MVP | HU-A02 |
| RF-T06 | O sistema deve exibir os componentes do índice de força de forma transparente | MVP | HU-A02 |
| RF-T07 | O sistema deve permitir classificação manual de território com justificativa registrada | Importante | HU-CE03 |
| RF-T08 | O sistema deve exibir locais de votação como marcadores (pins) no mapa com a quantidade de votos por seção | MVP | HU-CC06 |
| RF-T09 | O sistema deve permitir filtros do mapa por eleição, cargo, candidato e partido | MVP | HU-CC01 |
| RF-T10 | O sistema deve suportar zoom e navegação por nível territorial (estado → município → bairro → zona → local de votação) | MVP | HU-CC02 |
| RF-T11 | O sistema deve geocodificar automaticamente o endereço dos locais de votação (via Nominatim/OpenStreetMap) para obter lat/lng | MVP | — |
| RF-T12 | O sistema deve vincular automaticamente cada local de votação ao bairro correspondente via consulta espacial PostGIS | Importante | — |
| RF-T13 | O sistema deve exibir análise de votos agregados por bairro, incluindo mapa colorido por desempenho | Importante | HU-CC02 |
| RF-T14 | O sistema deve exibir votos por partido por território (município, zona, bairro) | MVP | — |

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
| RF-I01 | O sistema deve importar dados do TSE a partir de arquivos CSV (`votacao_secao_AAAA_UF.csv`) | MVP | HU-PQ01 |
| RF-I02 | O sistema deve validar integridade dos arquivos importados via hash SHA-256 | MVP | — |
| RF-I03 | O sistema deve registrar cada importação com status, responsável e data | MVP | HU-A05 |
| RF-I04 | O sistema deve exibir histórico de importações com detalhes de erros por linha | Importante | HU-A05 |
| RF-I05 | O sistema deve nunca sobrescrever dados importados — apenas adicionar ou marcar como substituído | MVP | — |
| RF-I06 | O sistema deve extrair e armazenar o campo `SQ_CANDIDATO` de cada linha do CSV do TSE | MVP | — |
| RF-I07 | O sistema deve criar automaticamente os registros de `municipio`, `zona_eleitoral`, `secao_eleitoral` e `local_votacao` a partir dos dados do CSV, caso ainda não existam | MVP | — |
| RF-I08 | O sistema deve importar polígonos geográficos de municípios a partir de GeoJSON do IBGE | MVP | — |
| RF-I09 | O sistema deve importar polígonos de bairros a partir de GeoJSON da prefeitura ou IBGE | Importante | — |
| RF-I10 | O sistema deve importar polígonos de zonas eleitorais a partir do shapefile do TSE | Importante | — |
| RF-I11 | O sistema deve executar geocodificação em lote dos locais de votação pendentes via Nominatim | MVP | — |

---

## Módulo: Painel e Indicadores (RF-PA)

| ID | Requisito | Prioridade | HU Relacionada |
|---|---|---|---|
| RF-PA01 | O sistema deve exibir painel principal com indicadores consolidados | MVP | HU-A01 |
| RF-PA02 | O sistema deve permitir filtros combinados por eleição, cargo, partido, candidato, município, zona e seção | MVP | HU-A03 |
| RF-PA03 | O sistema deve permitir exportação de dados e tabelas em formato CSV | MVP | HU-CC05, HU-A06 |
| RF-PA04 | O sistema deve exibir gráficos de evolução eleitoral por território ao longo de múltiplas eleições | MVP | HU-A07 |
| RF-PA05 | O sistema deve exibir o espectro político histórico de cada território | Importante | HU-CE04 |
| RF-PA06 | O conteúdo do painel (home) deve ser renderizado dinamicamente de acordo com o perfil do usuário autenticado — nunca exibir o painel do administrador para outros perfis | MVP | — |

### Painel por perfil

| Perfil | KPIs exibidos | Ações disponíveis | Escopo dos dados |
|---|---|---|---|
| `administrador` | Candidatos (total), Territórios, Zonas de Força, Pesquisas, Importações TSE | Exportar, Importar dados | Todos os candidatos da plataforma |
| `gestor` | Territórios, Zonas de Força, Pesquisas, Última atualização | Exportar | Candidato vinculado |
| `analista` | Territórios, Zonas de Força, Pesquisas, Candidatos disponíveis para comparação | Exportar, Comparar candidatos | Candidato vinculado (comparação: todos, somente leitura) |
| `assessor` | Territórios, Zonas de Força, Pesquisas | Nenhuma (somente visualização) | Candidato vinculado |

---

## Módulo: Usuário e Acesso (RF-U)

| ID | Requisito | Prioridade | HU Relacionada |
|---|---|---|---|
| RF-U01 | O sistema deve autenticar usuários via e-mail e senha | MVP | — |
| RF-U02 | O sistema deve implementar controle de acesso por 4 perfis: `administrador`, `gestor`, `analista`, `assessor` | MVP | — |
| RF-U03 | O sistema deve operar em modelo **single-tenant** — uma única organização por instalação | MVP | — |
| RF-U04 | O sistema deve registrar log de ações sensíveis por usuário (login, exportação, edição) | MVP | — |
| RF-U05 | O sistema deve implementar JWT com access token (15 min) e refresh token (7 dias) | MVP | — |
| RF-U06 | O sistema deve obrigar vínculo de candidato no cadastro de usuários com perfil `gestor`, `analista` ou `assessor` | MVP | — |
| RF-U07 | O sistema deve filtrar automaticamente todos os dados pelo candidato vinculado para perfis não-administradores | MVP | — |
| RF-U08 | O sistema deve exibir o nome e cargo do candidato vinculado na tela de boas-vindas | MVP | — |
| RF-U09 | O sistema deve exibir o candidato vinculado em destaque na barra lateral para perfis não-administradores | MVP | — |
| RF-U10 | O sistema deve pré-selecionar o candidato vinculado automaticamente em todos os filtros de análise | MVP | — |
| RF-U11 | O perfil `analista` deve poder acessar a tela de comparação e visualizar dados de outros candidatos em modo leitura | MVP | — |
| RF-U12 | As permissões de exportação e comparação são configuráveis por perfil (`gestor`, `analista`, `assessor`) — o administrador define os padrões de cada perfil na tela de Usuários | MVP | HU-ADM02 |
| RF-U13 | O administrador pode sobrescrever as permissões padrão do perfil para um usuário específico (permissão individual) | MVP | HU-ADM02 |
| RF-U14 | A importação de dados TSE é sempre exclusiva do `administrador` e não pode ser delegada a nenhum outro perfil | MVP | — |
| RF-U15 | Somente o `administrador` pode criar, editar, desativar e reativar usuários | MVP | HU-ADM01 |
| RF-U16 | Somente o `administrador` pode importar dados do TSE e gerenciar eleições e candidaturas | MVP | — |
| RF-U17 | Toda exportação deve ser registrada em log com usuário, data, escopo e formato | MVP | — |
| RF-U18 | O formulário de criação de usuário deve exigir: nome, e-mail, senha temporária, perfil e candidato vinculado (obrigatório para perfis não-admin) | MVP | HU-ADM01 |
| RF-U19 | O formulário de edição de usuário deve permitir alterar: nome, e-mail, perfil, candidato vinculado, permissões individuais e status ativo/inativo | MVP | HU-ADM01 |
| RF-U20 | O administrador deve poder configurar as permissões padrão de cada perfil (`gestor`, `analista`, `assessor`) em um painel dedicado na tela de Usuários, com efeito imediato sobre novos usuários criados | MVP | HU-ADM02 |
| RF-U21 | Permissões individuais de um usuário específico sobrepõem as permissões padrão do perfil — essa sobreposição deve ser visualmente indicada na tela de edição | Importante | HU-ADM02 |

### Permissões configuráveis por perfil

| Permissão | `administrador` | `gestor` | `analista` | `assessor` |
|---|---|---|---|---|
| Exportar dados | Sempre ativo (fixo) | Configurável | Configurável | Configurável |
| Comparar candidatos | Sempre ativo (fixo) | Configurável | Configurável | Configurável |
| Importar dados TSE | Sempre ativo (fixo) | Sempre bloqueado (fixo) | Sempre bloqueado (fixo) | Sempre bloqueado (fixo) |
| Gerenciar usuários | Sempre ativo (fixo) | Sempre bloqueado (fixo) | Sempre bloqueado (fixo) | Sempre bloqueado (fixo) |

> **Nota:** O sistema não suporta múltiplas organizações isoladas (multi-tenant). Cada instalação serve uma única organização. O isolamento de dados é feito por vínculo de candidato, não por organização.
