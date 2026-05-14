# 02 — Histórias de Usuário

> As histórias de usuário estão organizadas por perfil de acesso.  
> Formato: **COMO** [tipo de usuário] **QUERO** [ação] **PARA** [benefício]  
> Histórias marcadas com ★ incluem critérios de aceitação detalhados.

---

## Perfis de Usuário

1. [Candidato](#1-candidato)
2. [Pré-Candidato](#2-pré-candidato)
3. [Coordenador de Campanha](#3-coordenador-de-campanha)
4. [Consultor Eleitoral](#4-consultor-eleitoral)
5. [Partido Político](#5-partido-político)
6. [Pesquisador](#6-pesquisador)
7. [Analista](#7-analista)

---

## 1. Candidato

### HU-C01 ★

> **COMO** candidato  
> **QUERO** visualizar meu histórico eleitoral em mapa por território  
> **PARA** entender em quais regiões obtive mais e menos votos nas eleições anteriores

**Critérios de aceitação:**
- O mapa exibe os territórios (municípios, zonas eleitorais e seções) com cores proporcionais ao meu desempenho eleitoral.
- É possível filtrar por eleição, cargo e nível territorial (município, zona, seção).
- Ao clicar em um território, um painel lateral exibe: quantidade de votos, percentual sobre votos válidos, colocação e eleição de referência.
- Os dados exibidos correspondem exclusivamente às minhas candidaturas registradas.
- O mapa responde a mudanças de filtro em menos de 3 segundos.

---

### HU-C02 ★

> **COMO** candidato  
> **QUERO** comparar meu desempenho entre duas eleições diferentes  
> **PARA** identificar onde cresci, onde regredi e onde posso concentrar esforços na próxima campanha

**Critérios de aceitação:**
- É possível selecionar duas eleições em que participei para comparação.
- O sistema exibe a variação de votos (absoluta e percentual) por território entre as duas eleições.
- Territórios com crescimento são destacados em uma cor e territórios com queda em outra.
- A comparação pode ser visualizada em mapa e em tabela analítica.
- É possível exportar a comparação em CSV.

---

### HU-C03

> **COMO** candidato  
> **QUERO** identificar meus territórios de força, disputa e expansão  
> **PARA** priorizar onde investir recursos de campanha na próxima eleição

---

### HU-C04

> **COMO** candidato  
> **QUERO** visualizar a evolução da minha votação ao longo do tempo em um gráfico  
> **PARA** acompanhar minha trajetória eleitoral de forma visual e objetiva

---

### HU-C05

> **COMO** candidato  
> **QUERO** visualizar quais partidos e candidatos dominam cada território  
> **PARA** entender o campo político de cada região e identificar possíveis aliados ou adversários

---

### HU-C06

> **COMO** candidato  
> **QUERO** cruzar meu histórico eleitoral com pesquisas eleitorais cadastradas  
> **PARA** verificar se minhas zonas de força históricas confirmam ou contradizem dados recentes de intenção de voto

---

## 2. Pré-Candidato

### HU-P01 ★

> **COMO** pré-candidato  
> **QUERO** ser cadastrado na plataforma mesmo sem ter disputado eleições anteriores  
> **PARA** que minha equipe possa analisar meu potencial eleitoral com base em dados de candidatos e partidos semelhantes

**Critérios de aceitação:**
- O formulário de cadastro permite registrar um pré-candidato sem exigir número de candidato ou histórico eleitoral.
- É possível associar o pré-candidato a um partido, cargo pretendido, município de atuação e espectro político.
- O perfil do pré-candidato fica claramente identificado como "pré-candidato" na plataforma.
- O sistema permite associar o pré-candidato a candidatos já existentes de referência para fins comparativos.

---

### HU-P02 ★

> **COMO** pré-candidato  
> **QUERO** visualizar o histórico eleitoral do meu partido por território  
> **PARA** entender em quais regiões o partido tem tradição de votos e identificar meu ponto de partida estratégico

**Critérios de aceitação:**
- O mapa exibe o desempenho histórico do partido selecionado por território e eleição.
- É possível filtrar por cargo, eleição e nível territorial.
- O sistema deixa claro que os dados exibidos são do partido, não do pré-candidato.
- Ao clicar em um território, o painel exibe o desempenho do partido nas últimas N eleições disponíveis.

---

### HU-P03

> **COMO** pré-candidato  
> **QUERO** identificar territórios compatíveis com meu perfil político declarado  
> **PARA** entender em quais regiões candidatos com perfil semelhante historicamente obtiveram melhor desempenho

---

### HU-P04

> **COMO** pré-candidato  
> **QUERO** visualizar pesquisas eleitorais cadastradas que mencionem minha região de atuação  
> **PARA** complementar a análise histórica com dados de percepção recente do eleitorado

---

### HU-P05

> **COMO** pré-candidato  
> **QUERO** que meu perfil seja convertido automaticamente para candidato após minha primeira candidatura registrada  
> **PARA** manter a continuidade dos dados e análises sem precisar recadastrar informações

---

## 3. Coordenador de Campanha

### HU-CC01 ★

> **COMO** coordenador de campanha  
> **QUERO** visualizar o mapa territorial com classificação das zonas eleitorais  
> **PARA** definir a estratégia de distribuição de recursos e equipes de campanha por prioridade territorial

**Critérios de aceitação:**
- O mapa exibe todos os territórios classificados por categoria (zona de força, disputa, expansão, adversário, neutro, consolidado, volátil).
- Cada categoria tem uma cor distinta e uma legenda visível.
- É possível filtrar a visualização por tipo de classificação.
- Ao selecionar um território, o painel exibe: classificação, índice de força, dados de referência da classificação e eleição utilizada como base.
- A visualização pode ser exportada como imagem ou dados em CSV.

---

### HU-CC02 ★

> **COMO** coordenador de campanha  
> **QUERO** filtrar os resultados eleitorais por zona eleitoral, seção eleitoral e bairro  
> **PARA** planejar ações de campanha no nível mais granular disponível

**Critérios de aceitação:**
- O sistema permite filtrar resultados até o nível de seção eleitoral quando os dados do TSE estiverem disponíveis nesse nível.
- O mapa atualiza as camadas conforme o nível territorial selecionado.
- A tabela analítica exibe os dados no nível de granularidade selecionado.
- Os filtros disponíveis incluem: eleição, cargo, candidato, partido, município, zona eleitoral e seção eleitoral.

---

### HU-CC03

> **COMO** coordenador de campanha  
> **QUERO** importar os resultados de pesquisas de campo realizadas pela equipe  
> **PARA** cruzar dados coletados internamente com o histórico eleitoral disponível

---

### HU-CC04

> **COMO** coordenador de campanha  
> **QUERO** comparar o desempenho do candidato em relação à média do partido por território  
> **PARA** identificar onde o candidato performa acima ou abaixo da média partidária

---

### HU-CC05

> **COMO** coordenador de campanha  
> **QUERO** exportar os dados territoriais em CSV  
> **PARA** compartilhar com a equipe operacional e usar em análises externas à plataforma

---

### HU-CC06

> **COMO** coordenador de campanha  
> **QUERO** visualizar a localização dos locais de votação no mapa  
> **PARA** planejar a presença da campanha nos pontos de maior concentração de eleitores

---

## 4. Consultor Eleitoral

### HU-CE01 ★

> **COMO** consultor eleitoral  
> **QUERO** analisar o histórico eleitoral de múltiplos candidatos e partidos em um mesmo território  
> **PARA** produzir análises comparativas e identificar padrões de comportamento eleitoral regional

**Critérios de aceitação:**
- É possível selecionar múltiplos candidatos e/ou partidos para comparação simultânea no mesmo mapa ou tabela.
- O sistema exibe os resultados de cada candidato/partido com cores distintas.
- A comparação pode ser feita por eleição, cargo e território.
- Os dados exibidos incluem: votos absolutos, percentual de votos válidos, colocação e eleição.
- É possível exportar a análise comparativa em CSV.

---

### HU-CE02 ★

> **COMO** consultor eleitoral  
> **QUERO** cruzar dados históricos do TSE com pesquisas eleitorais cadastradas  
> **PARA** identificar divergências e convergências entre o comportamento histórico e as tendências atuais por território

**Critérios de aceitação:**
- O sistema permite selecionar uma pesquisa eleitoral cadastrada e sobrepor seus dados ao mapa de histórico eleitoral.
- A sobreposição exibe dois indicadores lado a lado por território: dado histórico e dado da pesquisa.
- É possível identificar visualmente territórios onde há divergência entre histórico e pesquisa.
- O sistema exibe a fonte, data e tamanho amostral da pesquisa utilizada.

---

### HU-CE03

> **COMO** consultor eleitoral  
> **QUERO** classificar territórios manualmente com justificativa registrada  
> **PARA** complementar a classificação automática com análise qualitativa da minha equipe

---

### HU-CE04

> **COMO** consultor eleitoral  
> **QUERO** visualizar o espectro político histórico de cada território  
> **PARA** identificar o perfil ideológico predominante em cada região com base em dados objetivos

---

### HU-CE05

> **COMO** consultor eleitoral  
> **QUERO** cadastrar e gerenciar múltiplos candidatos e pré-candidatos de clientes diferentes  
> **PARA** centralizar a inteligência eleitoral de toda a minha carteira de clientes em uma única plataforma

---

### HU-CE06

> **COMO** consultor eleitoral  
> **QUERO** gerar relatórios analíticos por território e candidato  
> **PARA** apresentar diagnósticos estruturados aos meus clientes com dados verificáveis

---

## 5. Partido Político

### HU-PP01 ★

> **COMO** partido político  
> **QUERO** visualizar o desempenho histórico do partido em todos os territórios disponíveis  
> **PARA** identificar onde o partido tem base eleitoral consolidada e onde há oportunidades de crescimento

**Critérios de aceitação:**
- O mapa exibe o desempenho agregado do partido por território em todas as eleições disponíveis.
- É possível filtrar por eleição, cargo e nível territorial.
- O sistema exibe indicadores como: melhor resultado histórico, média de votos e tendência (crescimento/queda).
- Os territórios são classificados automaticamente como zona de força, expansão, disputa, adversário ou neutro para o partido.

---

### HU-PP02

> **COMO** partido político  
> **QUERO** comparar o desempenho dos candidatos do partido entre si por território  
> **PARA** identificar quais candidatos constroem votos próprios e quais dependem do desempenho partidário

---

### HU-PP03

> **COMO** partido político  
> **QUERO** identificar territórios onde candidatos de partidos aliados têm forte presença  
> **PARA** planejar estratégias de coligação e complementaridade territorial

---

### HU-PP04

> **COMO** partido político  
> **QUERO** cadastrar pré-candidatos do partido para avaliação de potencial eleitoral  
> **PARA** apoiar decisões internas sobre quais candidaturas lançar e em quais territórios

---

### HU-PP05

> **COMO** partido político  
> **QUERO** visualizar a evolução do partido por eleição em um painel histórico consolidado  
> **PARA** acompanhar o crescimento ou declínio do partido ao longo do tempo por território

---

## 6. Pesquisador

### HU-PQ01 ★

> **COMO** pesquisador  
> **QUERO** importar resultados de pesquisas eleitorais próprias em formato CSV  
> **PARA** integrar dados de campo coletados pela minha equipe à base histórica da plataforma

**Critérios de aceitação:**
- O sistema aceita arquivos CSV com campos padronizados: data, localidade, tipo de pesquisa, tamanho da amostra, margem de erro e resultados agregados por candidato ou partido.
- O sistema valida o arquivo antes da importação e exibe erros por linha quando houver inconsistências.
- Após importação bem-sucedida, os dados ficam disponíveis para cruzamento com o histórico eleitoral.
- O sistema registra o responsável pela importação, data e hash do arquivo para rastreabilidade.
- Dados de respondentes individuais não são aceitos — apenas resultados agregados.

---

### HU-PQ02 ★

> **COMO** pesquisador  
> **QUERO** cruzar resultados de pesquisas por território com dados históricos do TSE  
> **PARA** identificar tendências, variações e padrões que não aparecem apenas nos dados históricos

**Critérios de aceitação:**
- O sistema permite selecionar uma pesquisa e uma eleição histórica de referência para cruzamento.
- O cruzamento exibe, por território: dado histórico (TSE), dado da pesquisa e variação entre eles.
- É possível visualizar o cruzamento em mapa e em tabela.
- O sistema exibe metadados da pesquisa (data, metodologia, tamanho amostral, margem de erro) junto aos resultados.

---

### HU-PQ03

> **COMO** pesquisador  
> **QUERO** cadastrar os metadados completos de cada pesquisa eleitoral  
> **PARA** garantir rastreabilidade, transparência metodológica e credibilidade dos dados

---

### HU-PQ04

> **COMO** pesquisador  
> **QUERO** visualizar tendências de intenção de voto por localidade ao longo do tempo  
> **PARA** analisar a evolução da percepção eleitoral em diferentes territórios

---

### HU-PQ05

> **COMO** pesquisador  
> **QUERO** acessar os dados históricos do TSE de forma estruturada e filtrada  
> **PARA** usar a plataforma como base de dados confiável para análises acadêmicas e técnicas

---

## 7. Analista

### HU-A01 ★

> **COMO** analista  
> **QUERO** visualizar o painel principal com indicadores eleitorais consolidados  
> **PARA** ter uma visão rápida e objetiva do cenário eleitoral antes de aprofundar as análises

**Critérios de aceitação:**
- O painel principal exibe indicadores como: total de candidatos cadastrados, eleições disponíveis, territórios classificados, pesquisas cadastradas e última importação realizada.
- Os indicadores são filtráveis por organização e eleição de referência.
- O painel carrega em menos de 3 segundos.
- Cada indicador é clicável e redireciona para a seção correspondente da plataforma.

---

### HU-A02 ★

> **COMO** analista  
> **QUERO** calcular e visualizar o índice de força territorial por candidato, partido e eleição  
> **PARA** quantificar o desempenho territorial de forma objetiva e comparável

**Critérios de aceitação:**
- O sistema calcula o índice de força territorial com base na fórmula documentada nas regras de negócio.
- O índice é exibido de 0 a 100 por território, com legenda de interpretação.
- É possível filtrar o cálculo por candidato, partido, cargo e eleição.
- O sistema exibe os componentes do índice (média de votos, tendência, consistência) de forma transparente.
- Os índices calculados são armazenados com a referência ao método aplicado.

---

### HU-A03

> **COMO** analista  
> **QUERO** aplicar filtros combinados por eleição, cargo, partido, candidato, município, zona e seção  
> **PARA** produzir recortes analíticos precisos sem precisar exportar dados para ferramentas externas

---

### HU-A04

> **COMO** analista  
> **QUERO** visualizar o perfil político histórico de cada território  
> **PARA** classificar regiões por espectro político dominante com base em dados objetivos

---

### HU-A05

> **COMO** analista  
> **QUERO** acessar o histórico de importações de dados realizadas na plataforma  
> **PARA** verificar a origem, integridade e rastreabilidade de cada conjunto de dados disponível

---

### HU-A06

> **COMO** analista  
> **QUERO** exportar tabelas analíticas filtradas em formato CSV  
> **PARA** realizar análises complementares em ferramentas externas ou compartilhar com a equipe

---

### HU-A07

> **COMO** analista  
> **QUERO** visualizar gráficos de evolução eleitoral por território ao longo de múltiplas eleições  
> **PARA** identificar padrões, tendências e anomalias históricas de forma visual
