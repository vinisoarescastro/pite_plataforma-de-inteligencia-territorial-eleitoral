# Plataforma de Inteligência Territorial Eleitoral
> Plano Estratégico e Técnico Inicial  
> Versão 0.2 — Revisado com decisões técnicas definidas e histórias de usuário

---

## Sumário

1. [Visão Geral do Produto](#1-visão-geral-do-produto)
2. [Escopo Inicial da Plataforma](#2-escopo-inicial-da-plataforma)
3. [Histórias de Usuário](#3-histórias-de-usuário)
4. [Documentos Recomendados Antes do Desenvolvimento](#4-documentos-recomendados-antes-do-desenvolvimento)
5. [Estrutura Inicial do Repositório](#5-estrutura-inicial-do-repositório)
6. [Modelo de Dados Inicial](#6-modelo-de-dados-inicial)
7. [Arquitetura Inicial](#7-arquitetura-inicial)
8. [Fontes de Dados](#8-fontes-de-dados)
9. [Critérios de Classificação Territorial](#9-critérios-de-classificação-territorial)
10. [Backlog Inicial](#10-backlog-inicial)
11. [Cuidados Éticos, Legais e de Privacidade](#11-cuidados-éticos-legais-e-de-privacidade)
12. [Guia de Nomenclatura em Português do Brasil](#12-guia-de-nomenclatura-em-português-do-brasil)
13. [Próximos Passos](#13-próximos-passos)

---

## 1. Visão Geral do Produto

### 1.1 Nome da Plataforma

**Plataforma de Inteligência Territorial Eleitoral**

Sigla interna de referência: **PITE**

### 1.2 Objetivo Principal

Fornecer uma plataforma SPA de inteligência territorial eleitoral que permita analisar, visualizar e interpretar dados eleitorais históricos públicos (TSE), cruzados com pesquisas próprias autorizadas, dados geográficos e perfis políticos territoriais — apoiando decisões estratégicas de candidatos, pré-candidatos, partidos, consultorias eleitorais e equipes de campanha, com análises sempre de natureza territorial, estatística e agregada.

### 1.3 Público-Alvo

| Perfil | Necessidade Principal |
|---|---|
| Candidato | Entender seu histórico eleitoral e zonas de força por território |
| Pré-candidato | Avaliar potencial eleitoral com base em perfil político e histórico partidário |
| Coordenador de campanha | Priorizar esforços por zona, município e seção eleitoral |
| Consultor eleitoral | Análise comparativa entre eleições, territórios e candidatos |
| Partido político | Mapear forças, fragilidades e oportunidades territoriais |
| Pesquisador | Cruzar dados públicos do TSE com pesquisas próprias |
| Analista | Produzir indicadores, relatórios e painéis para suporte à decisão |

### 1.4 Principais Problemas que a Plataforma Resolve

1. **Dispersão e complexidade dos dados eleitorais públicos** — dados do TSE são volumosos, fragmentados e de difícil interpretação prática.
2. **Ausência de visão territorial integrada** — campanhas operam sem inteligência geográfica estruturada por zona, seção e bairro.
3. **Dificuldade de integrar pesquisas próprias aos dados históricos** — não há ferramenta que una dados do TSE com pesquisas de campo de forma prática.
4. **Falta de classificação territorial objetiva** — territórios de força, disputa e adversidade são identificados de forma subjetiva e não sistematizada.
5. **Análise comparativa entre ciclos eleitorais exige esforço manual** — sem ferramenta, comparar desempenho entre eleições demanda planilhas complexas.
6. **Impossibilidade de avaliar pré-candidatos sem histórico** — candidatos que ainda não disputaram eleições não têm como avaliar seu potencial de forma estruturada.

### 1.5 Principais Diferenciais

- Visão territorial integrada: da seção eleitoral ao estado, em mapa interativo.
- Classificação automática e objetiva de territórios com critérios documentados.
- Suporte nativo a pré-candidatos sem histórico eleitoral próprio.
- Integração entre dados públicos do TSE e pesquisas eleitorais próprias.
- Análise agregada e territorial — sem microdirecionamento individual de eleitores.
- Interface e nomenclatura integralmente em português do Brasil.
- Plataforma SPA responsiva, com mapas baseados em Leaflet.

### 1.6 Decisões Técnicas Definidas

| Camada | Decisão |
|---|---|
| Front-end | React (SPA, JavaScript/TypeScript) |
| Back-end | Node.js (JavaScript/TypeScript) |
| Mapas | Leaflet |
| Banco de dados | PostgreSQL + PostGIS |
| Linguagem e nomenclatura | Português do Brasil em toda a base de código |

---

## 2. Escopo Inicial da Plataforma

### 2.1 Funcionalidades Essenciais para o MVP

- [ ] Importação e normalização de dados eleitorais públicos do TSE.
- [ ] Cadastro de candidatos com e sem histórico eleitoral (pré-candidatos).
- [ ] Cadastro de partidos e cargos.
- [ ] Visualização de histórico eleitoral por candidato, partido, cargo e território.
- [ ] Mapa interativo (Leaflet) com camadas territoriais classificadas.
- [ ] Classificação automática de territórios (zona de força, disputa, expansão, adversário, neutro).
- [ ] Cadastro e importação de pesquisas eleitorais próprias.
- [ ] Painel analítico com filtros por eleição, cargo, partido, candidato e município.
- [ ] Autenticação com controle de acesso por perfil (RBAC).
- [ ] Exportação básica de dados (CSV).

### 2.2 Funcionalidades para Versões Futuras

- Simulador de potencial eleitoral para pré-candidatos.
- Análise de volatilidade eleitoral por território.
- Integração com dados demográficos (IBGE).
- Comparação automática com territórios similares.
- Exportação de relatórios em PDF.
- API pública com dados consolidados.
- Módulo de monitoramento durante eleições.
- Módulo colaborativo para equipes de campanha.
- Notificações e alertas por território.
- Aplicativo móvel.

### 2.3 Módulos Principais do Sistema

| Módulo | Descrição |
|---|---|
| `modulo_candidato` | Cadastro e gestão de candidatos e pré-candidatos |
| `modulo_eleicao` | Histórico, candidaturas e resultados eleitorais |
| `modulo_territorio` | Mapa interativo, zonas, seções, bairros e classificação territorial |
| `modulo_pesquisa` | Cadastro, importação e cruzamento de pesquisas eleitorais |
| `modulo_importacao` | Importação e normalização de dados do TSE e dados externos |
| `modulo_painel` | Painéis analíticos, gráficos, indicadores e relatórios |
| `modulo_usuario` | Autenticação, perfis e controle de acesso |
| `modulo_configuracao` | Configurações da plataforma, organização e preferências |

### 2.4 Fluxos Principais de Uso

**Fluxo 1 — Análise de candidato com histórico eleitoral:**
> Usuário seleciona candidato → Visualiza histórico por eleição e cargo → Aplica filtros territoriais → Mapa exibe zonas de força → Identifica territórios de expansão → Exporta dados.

**Fluxo 2 — Avaliação de pré-candidato sem histórico:**
> Usuário cadastra pré-candidato → Associa perfil político e partido → Sistema consulta histórico do partido por território → Exibe mapa de compatibilidade territorial → Analista interpreta potencial por região.

**Fluxo 3 — Cadastro e cruzamento de pesquisa eleitoral:**
> Usuário cadastra pesquisa → Importa resultados agregados via CSV → Sistema cruza com histórico eleitoral → Visualiza tendências por localidade no mapa → Identifica variações entre pesquisa e histórico.

**Fluxo 4 — Classificação e análise territorial:**
> Usuário seleciona candidato e eleição de referência → Sistema classifica territórios automaticamente → Mapa exibe camadas por classificação → Usuário clica em zona e vê painel de detalhes → Exporta classificação.

**Fluxo 5 — Comparação entre eleições:**
> Usuário seleciona candidato ou partido → Escolhe duas eleições para comparar → Sistema exibe variação de desempenho por território → Identifica avanços e recuos → Visualiza em mapa comparativo.

---

## 3. Histórias de Usuário

As histórias de usuário estão organizadas por perfil de acesso. Cada história segue o formato:

> **COMO** [tipo de usuário]  
> **QUERO** [ação ou funcionalidade]  
> **PARA** [benefício ou objetivo]

As histórias marcadas com ★ incluem critérios de aceitação detalhados.

---

### 3.1 Candidato

---

**HU-C01 ★**

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

**HU-C02 ★**

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

**HU-C03**

> **COMO** candidato  
> **QUERO** identificar meus territórios de força, disputa e expansão  
> **PARA** priorizar onde investir recursos de campanha na próxima eleição

---

**HU-C04**

> **COMO** candidato  
> **QUERO** visualizar a evolução da minha votação ao longo do tempo em um gráfico  
> **PARA** acompanhar minha trajetória eleitoral de forma visual e objetiva

---

**HU-C05**

> **COMO** candidato  
> **QUERO** visualizar quais partidos e candidatos dominam cada território  
> **PARA** entender o campo político de cada região e identificar possíveis aliados ou adversários

---

**HU-C06**

> **COMO** candidato  
> **QUERO** cruzar meu histórico eleitoral com pesquisas eleitorais cadastradas  
> **PARA** verificar se minhas zonas de força históricas confirmam ou contradizem dados recentes de intenção de voto

---

### 3.2 Pré-Candidato

---

**HU-P01 ★**

> **COMO** pré-candidato  
> **QUERO** ser cadastrado na plataforma mesmo sem ter disputado eleições anteriores  
> **PARA** que minha equipe possa analisar meu potencial eleitoral com base em dados de candidatos e partidos semelhantes

**Critérios de aceitação:**
- O formulário de cadastro permite registrar um pré-candidato sem exigir número de candidato ou histórico eleitoral.
- É possível associar o pré-candidato a um partido, cargo pretendido, município de atuação e espectro político.
- O perfil do pré-candidato fica claramente identificado como "pré-candidato" na plataforma.
- O sistema permite associar o pré-candidato a candidatos já existentes de referência para fins comparativos.

---

**HU-P02 ★**

> **COMO** pré-candidato  
> **QUERO** visualizar o histórico eleitoral do meu partido por território  
> **PARA** entender em quais regiões o partido tem tradição de votos e identificar meu ponto de partida estratégico

**Critérios de aceitação:**
- O mapa exibe o desempenho histórico do partido selecionado por território e eleição.
- É possível filtrar por cargo, eleição e nível territorial.
- O sistema deixa claro que os dados exibidos são do partido, não do pré-candidato.
- Ao clicar em um território, o painel exibe o desempenho do partido nas últimas N eleições disponíveis.

---

**HU-P03**

> **COMO** pré-candidato  
> **QUERO** identificar territórios compatíveis com meu perfil político declarado  
> **PARA** entender em quais regiões candidatos com perfil semelhante historicamente obtiveram melhor desempenho

---

**HU-P04**

> **COMO** pré-candidato  
> **QUERO** visualizar pesquisas eleitorais cadastradas que mencionem minha região de atuação  
> **PARA** complementar a análise histórica com dados de percepção recente do eleitorado

---

**HU-P05**

> **COMO** pré-candidato  
> **QUERO** que meu perfil seja convertido automaticamente para candidato após minha primeira candidatura registrada  
> **PARA** manter a continuidade dos dados e análises sem precisar recadastrar informações

---

### 3.3 Coordenador de Campanha

---

**HU-CC01 ★**

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

**HU-CC02 ★**

> **COMO** coordenador de campanha  
> **QUERO** filtrar os resultados eleitorais por zona eleitoral, seção eleitoral e bairro  
> **PARA** planejar ações de campanha no nível mais granular disponível

**Critérios de aceitação:**
- O sistema permite filtrar resultados até o nível de seção eleitoral quando os dados do TSE estiverem disponíveis nesse nível.
- O mapa atualiza as camadas conforme o nível territorial selecionado.
- A tabela analítica exibe os dados no nível de granularidade selecionado.
- Os filtros disponíveis incluem: eleição, cargo, candidato, partido, município, zona eleitoral e seção eleitoral.

---

**HU-CC03**

> **COMO** coordenador de campanha  
> **QUERO** importar os resultados de pesquisas de campo realizadas pela equipe  
> **PARA** cruzar dados coletados internamente com o histórico eleitoral disponível

---

**HU-CC04**

> **COMO** coordenador de campanha  
> **QUERO** comparar o desempenho do candidato em relação à média do partido por território  
> **PARA** identificar onde o candidato performa acima ou abaixo da média partidária

---

**HU-CC05**

> **COMO** coordenador de campanha  
> **QUERO** exportar os dados territoriais em CSV  
> **PARA** compartilhar com a equipe operacional e usar em análises externas à plataforma

---

**HU-CC06**

> **COMO** coordenador de campanha  
> **QUERO** visualizar a localização dos locais de votação no mapa  
> **PARA** planejar a presença da campanha nos pontos de maior concentração de eleitores

---

### 3.4 Consultor Eleitoral

---

**HU-CE01 ★**

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

**HU-CE02 ★**

> **COMO** consultor eleitoral  
> **QUERO** cruzar dados históricos do TSE com pesquisas eleitorais cadastradas  
> **PARA** identificar divergências e convergências entre o comportamento histórico e as tendências atuais por território

**Critérios de aceitação:**
- O sistema permite selecionar uma pesquisa eleitoral cadastrada e sobrepor seus dados ao mapa de histórico eleitoral.
- A sobreposição exibe dois indicadores lado a lado por território: dado histórico e dado da pesquisa.
- É possível identificar visualmente territórios onde há divergência entre histórico e pesquisa.
- O sistema exibe a fonte, data e tamanho amostral da pesquisa utilizada.

---

**HU-CE03**

> **COMO** consultor eleitoral  
> **QUERO** classificar territórios manualmente com justificativa registrada  
> **PARA** complementar a classificação automática com análise qualitativa da minha equipe

---

**HU-CE04**

> **COMO** consultor eleitoral  
> **QUERO** visualizar o espectro político histórico de cada território  
> **PARA** identificar o perfil ideológico predominante em cada região com base em dados objetivos

---

**HU-CE05**

> **COMO** consultor eleitoral  
> **QUERO** cadastrar e gerenciar múltiplos candidatos e pré-candidatos de clientes diferentes  
> **PARA** centralizar a inteligência eleitoral de toda a minha carteira de clientes em uma única plataforma

---

**HU-CE06**

> **COMO** consultor eleitoral  
> **QUERO** gerar relatórios analíticos por território e candidato  
> **PARA** apresentar diagnósticos estruturados aos meus clientes com dados verificáveis

---

### 3.5 Partido Político

---

**HU-PP01 ★**

> **COMO** partido político  
> **QUERO** visualizar o desempenho histórico do partido em todos os territórios disponíveis  
> **PARA** identificar onde o partido tem base eleitoral consolidada e onde há oportunidades de crescimento

**Critérios de aceitação:**
- O mapa exibe o desempenho agregado do partido por território em todas as eleições disponíveis.
- É possível filtrar por eleição, cargo e nível territorial.
- O sistema exibe indicadores como: melhor resultado histórico, média de votos e tendência (crescimento/queda).
- Os territórios são classificados automaticamente como zona de força, expansão, disputa, adversário ou neutro para o partido.

---

**HU-PP02**

> **COMO** partido político  
> **QUERO** comparar o desempenho dos candidatos do partido entre si por território  
> **PARA** identificar quais candidatos constroem votos próprios e quais dependem do desempenho partidário

---

**HU-PP03**

> **COMO** partido político  
> **QUERO** identificar territórios onde candidatos de partidos aliados têm forte presença  
> **PARA** planejar estratégias de coligação e complementaridade territorial

---

**HU-PP04**

> **COMO** partido político  
> **QUERO** cadastrar pré-candidatos do partido para avaliação de potencial eleitoral  
> **PARA** apoiar decisões internas sobre quais candidaturas lançar e em quais territórios

---

**HU-PP05**

> **COMO** partido político  
> **QUERO** visualizar a evolução do partido por eleição em um painel histórico consolidado  
> **PARA** acompanhar o crescimento ou declínio do partido ao longo do tempo por território

---

### 3.6 Pesquisador

---

**HU-PQ01 ★**

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

**HU-PQ02 ★**

> **COMO** pesquisador  
> **QUERO** cruzar resultados de pesquisas por território com dados históricos do TSE  
> **PARA** identificar tendências, variações e padrões que não aparecem apenas nos dados históricos

**Critérios de aceitação:**
- O sistema permite selecionar uma pesquisa e uma eleição histórica de referência para cruzamento.
- O cruzamento exibe, por território: dado histórico (TSE), dado da pesquisa e variação entre eles.
- É possível visualizar o cruzamento em mapa e em tabela.
- O sistema exibe metadados da pesquisa (data, metodologia, tamanho amostral, margem de erro) junto aos resultados.

---

**HU-PQ03**

> **COMO** pesquisador  
> **QUERO** cadastrar os metadados completos de cada pesquisa eleitoral  
> **PARA** garantir rastreabilidade, transparência metodológica e credibilidade dos dados

---

**HU-PQ04**

> **COMO** pesquisador  
> **QUERO** visualizar tendências de intenção de voto por localidade ao longo do tempo  
> **PARA** analisar a evolução da percepção eleitoral em diferentes territórios

---

**HU-PQ05**

> **COMO** pesquisador  
> **QUERO** acessar os dados históricos do TSE de forma estruturada e filtrada  
> **PARA** usar a plataforma como base de dados confiável para análises acadêmicas e técnicas

---

### 3.7 Analista

---

**HU-A01 ★**

> **COMO** analista  
> **QUERO** visualizar o painel principal com indicadores eleitorais consolidados  
> **PARA** ter uma visão rápida e objetiva do cenário eleitoral antes de aprofundar as análises

**Critérios de aceitação:**
- O painel principal exibe indicadores como: total de candidatos cadastrados, eleições disponíveis, territórios classificados, pesquisas cadastradas e última importação realizada.
- Os indicadores são filtráveis por organização e eleição de referência.
- O painel carrega em menos de 3 segundos.
- Cada indicador é clicável e redireciona para a seção correspondente da plataforma.

---

**HU-A02 ★**

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

**HU-A03**

> **COMO** analista  
> **QUERO** aplicar filtros combinados por eleição, cargo, partido, candidato, município, zona e seção  
> **PARA** produzir recortes analíticos precisos sem precisar exportar dados para ferramentas externas

---

**HU-A04**

> **COMO** analista  
> **QUERO** visualizar o perfil político histórico de cada território  
> **PARA** classificar regiões por espectro político dominante com base em dados objetivos

---

**HU-A05**

> **COMO** analista  
> **QUERO** acessar o histórico de importações de dados realizadas na plataforma  
> **PARA** verificar a origem, integridade e rastreabilidade de cada conjunto de dados disponível

---

**HU-A06**

> **COMO** analista  
> **QUERO** exportar tabelas analíticas filtradas em formato CSV  
> **PARA** realizar análises complementares em ferramentas externas ou compartilhar com a equipe

---

**HU-A07**

> **COMO** analista  
> **QUERO** visualizar gráficos de evolução eleitoral por território ao longo de múltiplas eleições  
> **PARA** identificar padrões, tendências e anomalias históricas de forma visual

---

## 4. Documentos Recomendados Antes do Desenvolvimento

### 4.1 Documento de Visão do Produto
**O que é:** Define o propósito, problema, público-alvo, diferenciais e limites da plataforma.  
**Por que criar:** Alinha toda a equipe antes de qualquer linha de código.  
**Conteúdo mínimo:** Nome, objetivo, público, problemas resolvidos, diferenciais, fora de escopo.

### 4.2 Documento de Requisitos Funcionais
**O que é:** Lista o que o sistema deve fazer — funcionalidades, comportamentos e regras observáveis pelo usuário.  
**Por que criar:** Base para desenvolvimento, testes e validação das histórias de usuário.  
**Conteúdo mínimo:** Identificador, descrição, módulo, prioridade, história de usuário relacionada, critério de aceitação.

### 4.3 Documento de Requisitos Não Funcionais
**O que é:** Define restrições e qualidades do sistema — desempenho, segurança, escalabilidade, acessibilidade.  
**Por que criar:** Orienta decisões arquiteturais e tecnológicas.  
**Exemplos:** Tempo de resposta ≤ 3s, criptografia em repouso e em trânsito, responsividade mobile, conformidade com LGPD.

### 4.4 Documento de Regras de Negócio
**O que é:** Define critérios e lógicas que governam o comportamento do sistema.  
**Por que criar:** Evita ambiguidade na implementação de cálculos, classificações e lógicas complexas.  
**Exemplos:** Fórmula do índice de força territorial, critérios de classificação de território, regras de importação de dados do TSE, regras de compatibilidade entre pré-candidatos e territórios.

### 4.5 Documento de Arquitetura
**O que é:** Descreve a estrutura técnica da plataforma — camadas, serviços, integrações e fluxo de dados.  
**Por que criar:** Guia decisões tecnológicas e facilita onboarding de desenvolvedores.  
**Conteúdo mínimo:** Diagrama de arquitetura, descrição das camadas, tecnologias escolhidas (React, Node.js, Leaflet, PostgreSQL/PostGIS), justificativas.

### 4.6 Documento de Modelo de Dados
**O que é:** Diagrama e descrição das entidades, campos, relacionamentos e índices do banco de dados.  
**Por que criar:** Garante consistência, facilita manutenção e orienta migrações.  
**Conteúdo mínimo:** Entidades, campos, tipos, relacionamentos, índices, observações de privacidade e segurança.

### 4.7 Documento de Fontes de Dados
**O que é:** Cataloga todas as fontes de dados utilizadas — origem, formato, periodicidade, licença e responsável.  
**Por que criar:** Garante rastreabilidade, conformidade legal e facilita atualizações.  
**Conteúdo mínimo:** Nome da fonte, URL, formato, periodicidade, licença, responsável pela atualização.

### 4.8 Documento de Governança, Segurança e Privacidade
**O que é:** Define políticas de acesso, proteção de dados, conformidade com LGPD e segurança da informação.  
**Por que criar:** Obrigatório para conformidade legal e proteção dos usuários.  
**Conteúdo mínimo:** Política de dados, papéis e permissões, criptografia, auditoria, retenção e exclusão de dados.

### 4.9 Documento de Roadmap
**O que é:** Linha do tempo planejada de entregas — fases, versões e marcos principais.  
**Por que criar:** Comunica prioridades e expectativas para stakeholders.  
**Conteúdo mínimo:** Fases (MVP, V1, V2), marcos, datas estimadas, dependências críticas.

### 4.10 Documento de Backlog Inicial
**O que é:** Lista estruturada de épicos, funcionalidades e tarefas técnicas organizadas por prioridade.  
**Por que criar:** Base para gestão ágil do desenvolvimento.  
**Conteúdo mínimo:** Épico, história de usuário relacionada, critérios de aceitação, prioridade, estimativa.

### 4.11 Dicionário de Dados
**O que é:** Glossário técnico com definição precisa de cada entidade, campo e termo utilizado no sistema.  
**Por que criar:** Elimina ambiguidade entre equipe técnica, de produto e de negócio.  
**Conteúdo mínimo:** Termo, definição, tipo de dado, domínio, exemplo, notas.

### 4.12 Guia de Nomenclatura em Português do Brasil
**O que é:** Padrão de nomeação para pastas, arquivos, variáveis, funções, tabelas, endpoints e commits.  
**Por que criar:** Garante consistência no código, na documentação e facilita manutenção.

---

## 5. Estrutura Inicial do Repositório

```
plataforma-inteligencia-territorial-eleitoral/
│
├── documentacao/
│   ├── visao_produto.md
│   ├── requisitos_funcionais.md
│   ├── requisitos_nao_funcionais.md
│   ├── regras_negocio.md
│   ├── arquitetura.md
│   ├── modelo_dados.md
│   ├── fontes_dados.md
│   ├── governanca_seguranca_privacidade.md
│   ├── roadmap.md
│   ├── backlog_inicial.md
│   ├── historias_usuario.md
│   ├── dicionario_dados.md
│   └── guia_nomenclatura.md
│
├── aplicacao/                              # SPA React (front-end)
│   ├── publico/                            # Arquivos estáticos
│   │   ├── icones/
│   │   ├── imagens/
│   │   └── fontes/
│   │
│   ├── src/
│   │   ├── ativos/                         # Assets globais
│   │   │   ├── estilos/
│   │   │   │   ├── global.css
│   │   │   │   ├── variaveis.css
│   │   │   │   └── temas.css
│   │   │   └── imagens/
│   │   │
│   │   ├── componentes/                    # Componentes reutilizáveis
│   │   │   ├── comuns/
│   │   │   │   ├── BotaoAcao/
│   │   │   │   │   ├── BotaoAcao.tsx
│   │   │   │   │   └── BotaoAcao.test.tsx
│   │   │   │   ├── CampoFiltro/
│   │   │   │   ├── TabelaAnalitica/
│   │   │   │   ├── IndicadorEleitoral/
│   │   │   │   ├── CaixaAlerta/
│   │   │   │   ├── SeletorEleicao/
│   │   │   │   ├── SeletorTerritorio/
│   │   │   │   └── PainelCarregamento/
│   │   │   │
│   │   │   ├── mapa/
│   │   │   │   ├── MapaInterativo/
│   │   │   │   │   ├── MapaInterativo.tsx
│   │   │   │   │   └── MapaInterativo.test.tsx
│   │   │   │   ├── CamadaTerritorio/
│   │   │   │   ├── CamadaZonaEleitoral/
│   │   │   │   ├── CamadaSecaoEleitoral/
│   │   │   │   ├── CamadaMunicipio/
│   │   │   │   ├── CamadaBairro/
│   │   │   │   ├── LegendaMapa/
│   │   │   │   ├── PainelDetalheZona/
│   │   │   │   └── ControleFiltroMapa/
│   │   │   │
│   │   │   ├── graficos/
│   │   │   │   ├── GraficoEvolucaoEleitoral/
│   │   │   │   ├── GraficoComparativoPartido/
│   │   │   │   ├── GraficoDistribuicaoVotos/
│   │   │   │   └── GraficoIndiceTerritorial/
│   │   │   │
│   │   │   └── layout/
│   │   │       ├── BarraNavegacao/
│   │   │       ├── MenuLateral/
│   │   │       ├── RodapeAplicacao/
│   │   │       └── EstruturaPainel/
│   │   │
│   │   ├── modulos/                        # Módulos funcionais
│   │   │   ├── candidato/
│   │   │   │   ├── paginas/
│   │   │   │   │   ├── ListaCandidatos.tsx
│   │   │   │   │   ├── DetalheCandidato.tsx
│   │   │   │   │   └── FormularioCandidato.tsx
│   │   │   │   ├── hooks/
│   │   │   │   │   └── usarCandidato.ts
│   │   │   │   ├── servicos/
│   │   │   │   │   └── servico_candidato.ts
│   │   │   │   ├── tipos/
│   │   │   │   │   └── tipos_candidato.ts
│   │   │   │   └── candidato.rotas.ts
│   │   │   │
│   │   │   ├── eleicao/
│   │   │   │   ├── paginas/
│   │   │   │   │   ├── ListaEleicoes.tsx
│   │   │   │   │   ├── DetalheEleicao.tsx
│   │   │   │   │   └── ComparativoEleicoes.tsx
│   │   │   │   ├── hooks/
│   │   │   │   │   └── usarEleicao.ts
│   │   │   │   ├── servicos/
│   │   │   │   │   └── servico_eleicao.ts
│   │   │   │   ├── tipos/
│   │   │   │   └── eleicao.rotas.ts
│   │   │   │
│   │   │   ├── territorio/
│   │   │   │   ├── paginas/
│   │   │   │   │   ├── MapaTerritorial.tsx
│   │   │   │   │   ├── ClassificacaoTerritorio.tsx
│   │   │   │   │   └── DetalheZonaEleitoral.tsx
│   │   │   │   ├── hooks/
│   │   │   │   │   ├── usarTerritorio.ts
│   │   │   │   │   └── usarMapa.ts
│   │   │   │   ├── servicos/
│   │   │   │   │   └── servico_territorio.ts
│   │   │   │   ├── tipos/
│   │   │   │   └── territorio.rotas.ts
│   │   │   │
│   │   │   ├── pesquisa/
│   │   │   │   ├── paginas/
│   │   │   │   │   ├── ListaPesquisas.tsx
│   │   │   │   │   ├── DetalhePesquisa.tsx
│   │   │   │   │   ├── FormularioPesquisa.tsx
│   │   │   │   │   └── ImportacaoPesquisa.tsx
│   │   │   │   ├── hooks/
│   │   │   │   │   └── usarPesquisa.ts
│   │   │   │   ├── servicos/
│   │   │   │   │   └── servico_pesquisa.ts
│   │   │   │   ├── tipos/
│   │   │   │   └── pesquisa.rotas.ts
│   │   │   │
│   │   │   ├── painel/
│   │   │   │   ├── paginas/
│   │   │   │   │   ├── PainelPrincipal.tsx
│   │   │   │   │   ├── PainelHistoricoEleitoral.tsx
│   │   │   │   │   └── PainelInteligenciaTerritorial.tsx
│   │   │   │   ├── hooks/
│   │   │   │   │   └── usarPainel.ts
│   │   │   │   └── painel.rotas.ts
│   │   │   │
│   │   │   ├── importacao/
│   │   │   │   ├── paginas/
│   │   │   │   │   ├── PainelImportacao.tsx
│   │   │   │   │   └── HistoricoImportacoes.tsx
│   │   │   │   ├── hooks/
│   │   │   │   │   └── usarImportacao.ts
│   │   │   │   ├── servicos/
│   │   │   │   │   └── servico_importacao.ts
│   │   │   │   └── importacao.rotas.ts
│   │   │   │
│   │   │   └── usuario/
│   │   │       ├── paginas/
│   │   │       │   ├── PaginaLogin.tsx
│   │   │       │   └── PaginaPerfil.tsx
│   │   │       ├── hooks/
│   │   │       │   └── usarAutenticacao.ts
│   │   │       ├── servicos/
│   │   │       │   └── servico_autenticacao.ts
│   │   │       └── usuario.rotas.ts
│   │   │
│   │   ├── nucleo/                         # Infraestrutura da aplicação
│   │   │   ├── roteador/
│   │   │   │   └── indice_rotas.tsx
│   │   │   ├── estado/                     # Gerenciamento de estado global
│   │   │   │   ├── contexto_candidato.tsx
│   │   │   │   ├── contexto_eleicao.tsx
│   │   │   │   ├── contexto_territorio.tsx
│   │   │   │   └── contexto_usuario.tsx
│   │   │   ├── autenticacao/
│   │   │   │   ├── protecao_rota.tsx
│   │   │   │   └── gerenciador_sessao.ts
│   │   │   └── http/
│   │   │       ├── cliente_http.ts
│   │   │       └── interceptadores.ts
│   │   │
│   │   ├── utilitarios/
│   │   │   ├── formatar_numero.ts
│   │   │   ├── formatar_data.ts
│   │   │   ├── calcular_percentual.ts
│   │   │   ├── classificar_territorio.ts
│   │   │   └── normalizar_dado_eleitoral.ts
│   │   │
│   │   ├── configuracoes/
│   │   │   ├── variaveis_ambiente.ts
│   │   │   └── constantes_eleitorais.ts
│   │   │
│   │   ├── tipos/                          # Tipos TypeScript globais
│   │   │   ├── tipos_candidato.ts
│   │   │   ├── tipos_eleicao.ts
│   │   │   ├── tipos_territorio.ts
│   │   │   ├── tipos_pesquisa.ts
│   │   │   └── tipos_api.ts
│   │   │
│   │   ├── App.tsx
│   │   └── principal.tsx
│   │
│   ├── testes/
│   │   ├── unitarios/
│   │   ├── integracao/
│   │   └── ponta_a_ponta/
│   │
│   ├── .env.exemplo
│   ├── tsconfig.json
│   ├── package.json
│   └── vite.config.ts
│
├── api/                                    # Back-end Node.js (API REST)
│   ├── src/
│   │   ├── modulos/
│   │   │   ├── candidato/
│   │   │   │   ├── controlador_candidato.ts
│   │   │   │   ├── servico_candidato.ts
│   │   │   │   ├── repositorio_candidato.ts
│   │   │   │   └── validador_candidato.ts
│   │   │   ├── eleicao/
│   │   │   │   ├── controlador_eleicao.ts
│   │   │   │   ├── servico_eleicao.ts
│   │   │   │   └── repositorio_eleicao.ts
│   │   │   ├── territorio/
│   │   │   │   ├── controlador_territorio.ts
│   │   │   │   ├── servico_territorio.ts
│   │   │   │   └── repositorio_territorio.ts
│   │   │   ├── resultado_eleitoral/
│   │   │   │   ├── controlador_resultado_eleitoral.ts
│   │   │   │   ├── servico_resultado_eleitoral.ts
│   │   │   │   └── repositorio_resultado_eleitoral.ts
│   │   │   ├── pesquisa/
│   │   │   │   ├── controlador_pesquisa.ts
│   │   │   │   ├── servico_pesquisa.ts
│   │   │   │   └── repositorio_pesquisa.ts
│   │   │   ├── importacao/
│   │   │   │   ├── controlador_importacao.ts
│   │   │   │   ├── servico_importacao_tse.ts
│   │   │   │   ├── servico_importacao_pesquisa.ts
│   │   │   │   └── repositorio_importacao.ts
│   │   │   └── usuario/
│   │   │       ├── controlador_usuario.ts
│   │   │       ├── servico_usuario.ts
│   │   │       └── repositorio_usuario.ts
│   │   │
│   │   ├── nucleo/
│   │   │   ├── banco_dados/
│   │   │   │   ├── conexao.ts
│   │   │   │   └── migracao/
│   │   │   ├── autenticacao/
│   │   │   │   ├── middleware_autenticacao.ts
│   │   │   │   └── gerenciador_token.ts
│   │   │   ├── autorizacao/
│   │   │   │   └── middleware_autorizacao.ts
│   │   │   ├── auditoria/
│   │   │   │   └── servico_auditoria.ts
│   │   │   └── erros/
│   │   │       └── tratador_erros.ts
│   │   │
│   │   ├── processamento/
│   │   │   ├── calculador_indice_territorial.ts
│   │   │   ├── classificador_territorio.ts
│   │   │   └── agregador_resultado_eleitoral.ts
│   │   │
│   │   └── rotas/
│   │       └── indice_rotas.ts
│   │
│   ├── testes/
│   ├── .env.exemplo
│   ├── tsconfig.json
│   └── package.json
│
├── banco_dados/
│   ├── migracoes/
│   │   ├── 001_criar_tabela_municipio.sql
│   │   ├── 002_criar_tabela_zona_eleitoral.sql
│   │   ├── 003_criar_tabela_secao_eleitoral.sql
│   │   ├── 004_criar_tabela_local_votacao.sql
│   │   ├── 005_criar_tabela_bairro.sql
│   │   ├── 006_criar_tabela_partido.sql
│   │   ├── 007_criar_tabela_cargo.sql
│   │   ├── 008_criar_tabela_eleicao.sql
│   │   ├── 009_criar_tabela_candidato.sql
│   │   ├── 010_criar_tabela_candidatura.sql
│   │   ├── 011_criar_tabela_resultado_eleitoral.sql
│   │   ├── 012_criar_tabela_territorio.sql
│   │   ├── 013_criar_tabela_classificacao_territorial.sql
│   │   ├── 014_criar_tabela_pesquisa_eleitoral.sql
│   │   ├── 015_criar_tabela_resultado_pesquisa.sql
│   │   ├── 016_criar_tabela_indicador_eleitoral.sql
│   │   ├── 017_criar_tabela_fonte_dados.sql
│   │   ├── 018_criar_tabela_importacao_dados.sql
│   │   └── 019_criar_tabela_usuario.sql
│   ├── sementes/
│   │   ├── municipios_br.sql
│   │   ├── partidos_tse.sql
│   │   └── cargos_eleitorais.sql
│   └── esquema.sql
│
├── importacao/
│   ├── tse/
│   │   ├── baixar_dados_tse.sh
│   │   ├── processar_resultado_eleicao.ts
│   │   ├── normalizar_candidatura.ts
│   │   └── LEIAME.md
│   ├── geografico/
│   │   ├── processar_geojson_zonas.ts
│   │   └── LEIAME.md
│   └── LEIAME.md
│
├── infraestrutura/
│   ├── docker/
│   │   ├── Dockerfile.api
│   │   ├── Dockerfile.aplicacao
│   │   └── docker-compose.yml
│   └── ci_cd/
│       └── fluxo_implantacao.yml
│
├── .gitignore
├── .editorconfig
├── LEIAME.md
└── LICENCA.md
```

---

## 6. Modelo de Dados Inicial

### 6.1 `municipio`
**Objetivo:** Base territorial fundamental — representa os municípios brasileiros.

| Campo | Tipo | Descrição |
|---|---|---|
| `municipio_id` | UUID (PK) | Identificador único |
| `codigo_ibge` | VARCHAR (7) | Código oficial do IBGE |
| `codigo_tse` | VARCHAR (6) | Código utilizado pelo TSE |
| `nome` | VARCHAR | Nome do município |
| `uf` | CHAR (2) | Sigla do estado |
| `regiao` | VARCHAR | Norte, Nordeste, Centro-Oeste, Sudeste, Sul |
| `populacao_estimada` | INTEGER | Estimativa populacional |
| `geometria` | GEOMETRY | Polígono geográfico (PostGIS) |
| `criado_em` | TIMESTAMP | Data de criação |
| `atualizado_em` | TIMESTAMP | Data de última atualização |

**Relacionamentos:** Tem muitas `zona_eleitoral`, `bairro`, `resultado_eleitoral`, `pesquisa_eleitoral`.  
**Índices:** `codigo_ibge`, `codigo_tse`, `uf`.  
**Observações:** Geometria em WGS84 (EPSG:4326) para uso no Leaflet. Dados provenientes de TSE e IBGE.

---

### 6.2 `zona_eleitoral`
**Objetivo:** Unidade de organização eleitoral do TSE subordinada ao município.

| Campo | Tipo | Descrição |
|---|---|---|
| `zona_eleitoral_id` | UUID (PK) | Identificador único |
| `municipio_id` | UUID (FK) | Município ao qual pertence |
| `numero_zona` | INTEGER | Número da zona eleitoral |
| `nome_zona` | VARCHAR | Nome da zona (opcional) |
| `uf` | CHAR (2) | Sigla do estado |
| `geometria` | GEOMETRY | Polígono geográfico (opcional) |
| `criado_em` | TIMESTAMP | Data de criação |

**Relacionamentos:** Pertence a `municipio`. Tem muitas `secao_eleitoral`, `resultado_eleitoral`.  
**Índices:** `municipio_id`, `numero_zona`, `uf`.

---

### 6.3 `secao_eleitoral`
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

### 6.4 `local_votacao`
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

### 6.5 `bairro`
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

### 6.6 `partido`
**Objetivo:** Representa os partidos políticos registrados no TSE.

| Campo | Tipo | Descrição |
|---|---|---|
| `partido_id` | UUID (PK) | Identificador único |
| `sigla` | VARCHAR (12) | Sigla do partido |
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

### 6.7 `cargo`
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

### 6.8 `eleicao`
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

### 6.9 `candidato`
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
**Observações:** **CPF nunca em texto puro.** Hash unidirecional apenas para deduplicação. Dados biográficos coletados de fontes públicas (TSE).

---

### 6.10 `candidatura`
**Objetivo:** Une candidato, eleição, cargo e partido — representa a participação em uma eleição.

| Campo | Tipo | Descrição |
|---|---|---|
| `candidatura_id` | UUID (PK) | Identificador único |
| `candidato_id` | UUID (FK) | Candidato |
| `eleicao_id` | UUID (FK) | Eleição |
| `cargo_id` | UUID (FK) | Cargo disputado |
| `partido_id` | UUID (FK) | Partido na eleição |
| `municipio_id` | UUID (FK) | Município (cargos municipais) |
| `uf` | CHAR (2) | Estado (cargos estaduais/federais) |
| `numero_candidato` | INTEGER | Número nas urnas |
| `situacao_candidatura` | ENUM | deferida, indeferida, cassada, eleito, nao_eleito |
| `codigo_tse` | VARCHAR | Código único do TSE |
| `fonte_dados_id` | UUID (FK) | Fonte de dados |
| `criado_em` | TIMESTAMP | Data de criação |

**Índices:** `candidato_id`, `eleicao_id`, `codigo_tse`, `partido_id`.

---

### 6.11 `resultado_eleitoral`
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
**Observações:** Dados por seção são públicos (TSE). Nunca expor dados individuais de eleitores. Tabela central para todos os módulos analíticos.

---

### 6.12 `territorio`
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

### 6.13 `classificacao_territorial`
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

### 6.14 `pesquisa_eleitoral`
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

### 6.15 `resultado_pesquisa`
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

**Observações:** Dados sempre agregados por localidade. Nunca armazenar resposta individual de respondente.

---

### 6.16 `usuario`
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

### 6.17 `fonte_dados`
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

### 6.18 `importacao_dados`
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

### 6.19 `indicador_eleitoral`
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

---

## 7. Arquitetura Inicial

### 7.1 Visão Geral

```
┌──────────────────────────────────────────────────────┐
│              NAVEGADOR — SPA React                   │
│    React + TypeScript | Leaflet | React Router       │
│    Context API / Zustand (estado global)             │
└─────────────────────────┬────────────────────────────┘
                           │ HTTPS / REST / JSON
┌─────────────────────────▼────────────────────────────┐
│              API REST — Node.js + TypeScript         │
│          Fastify ou Express                          │
│  Autenticação JWT  │ Autorização RBAC  │ Validação   │
│  Auditoria de ações │ Rate limiting    │ OpenAPI     │
└───────┬──────────────────┬──────────────────┬────────┘
        │                  │                  │
┌───────▼──────┐   ┌───────▼──────┐   ┌──────▼───────┐
│  PostgreSQL  │   │ Processamento│   │  Importação  │
│  + PostGIS   │   │  e Cálculo   │   │  de Dados    │
│              │   │  de Índices  │   │  (TSE, CSV)  │
│  Redis Cache │   └──────────────┘   └──────────────┘
└──────────────┘
```

### 7.2 Camadas da Arquitetura

---

**Camada de Apresentação — SPA React**

| Decisão | Escolha |
|---|---|
| Framework | React 18 (Hooks, Context API) |
| Linguagem | TypeScript |
| Build | Vite |
| Mapas | Leaflet + React-Leaflet |
| Roteamento | React Router |
| Estado global | Context API ou Zustand |
| Gráficos | ECharts ou Recharts |
| Estilização | CSS Modules ou Tailwind |
| Testes | Vitest + Testing Library |

O Leaflet será utilizado para:
- Renderizar camadas de municípios, zonas eleitorais, seções eleitorais e bairros.
- Exibir camadas temáticas por classificação territorial (zona de força, disputa, expansão, adversário, neutro, consolidado, volátil).
- Suportar interatividade: clique em território, zoom, filtros visuais e painel lateral de detalhes.
- Exibir locais de votação como marcadores.

---

**Camada de API — Node.js**

| Decisão | Escolha |
|---|---|
| Runtime | Node.js |
| Framework | Fastify ou Express |
| Linguagem | TypeScript |
| Autenticação | JWT (access token 15min + refresh token 7d) |
| Autorização | RBAC por perfil de acesso |
| Documentação | OpenAPI / Swagger |
| Validação | Zod |
| ORM | Knex ou Prisma |
| Testes | Jest ou Vitest |

---

**Camada de Banco de Dados**

| Componente | Escolha |
|---|---|
| Banco principal | PostgreSQL 15+ com PostGIS |
| Consultas geoespaciais | PostGIS (ST_Contains, ST_Intersects, ST_Within) |
| Cache | Redis (consultas frequentes, sessões) |
| Migrations | Knex migrations ou Flyway |

---

**Camada de Importação de Dados**

- Scripts TypeScript/Node.js para processar arquivos CSV do TSE.
- Validação de integridade antes da inserção (hash SHA-256).
- Processamento em etapas: staging → validação → consolidação.
- Registro em `importacao_dados` para rastreabilidade completa.
- Suporte a execução manual e agendada.

---

**Camada de Processamento**

- Cálculo do índice de força territorial.
- Classificação automática de territórios por regras documentadas.
- Agregação de resultados por múltiplas granularidades territoriais.
- Processamento assíncrono via filas (BullMQ) para importações pesadas.

---

**Camada de Mapas e Georreferenciamento**

- Dados geográficos: GeoJSON/Shapefile do TSE e IBGE.
- PostGIS para consultas espaciais no banco.
- Coordenadas em WGS84 (EPSG:4326) — padrão Leaflet.
- Tiles: OpenStreetMap como base ou tiles próprios via PMTiles.
- Camadas disponíveis no Leaflet: municípios, zonas eleitorais, seções, bairros, locais de votação.

---

**Camada de Autenticação e Autorização**

- JWT com access token de curta duração (15 min) e refresh token (7 dias).
- Perfis: `administrador`, `analista`, `visualizador`.
- Multi-tenant: cada organização acessa apenas seus dados e os dados públicos do TSE.
- Log de acessos e ações sensíveis via `servico_auditoria`.

---

**Camada de Auditoria e Logs**

- Registro de importações com hash do arquivo.
- Log de consultas a dados sensíveis.
- Auditoria de CRUD das entidades principais.
- Logs estruturados em JSON para análise.

---

## 8. Fontes de Dados

### 8.1 Dados Públicos do TSE

| Conjunto | URL de referência | Formato | Periodicidade |
|---|---|---|---|
| Resultados por seção eleitoral | dados.tse.jus.br | CSV (ZIP) | Por eleição |
| Candidaturas | dados.tse.jus.br | CSV (ZIP) | Por eleição |
| Partidos registrados | tse.jus.br | CSV | Sob demanda |
| Locais de votação | dados.tse.jus.br | CSV | Por eleição |
| Zonas eleitorais | dados.tse.jus.br | CSV | Periódico |
| Eleitorado por seção | dados.tse.jus.br | CSV | Por eleição |

### 8.2 Dados Geográficos

| Conjunto | Fonte | Formato |
|---|---|---|
| Divisão municipal | IBGE | Shapefile / GeoJSON |
| Setores censitários | IBGE | Shapefile |
| Polígonos de zonas eleitorais | TSE | Shapefile / GeoJSON |
| Bairros | Prefeituras / IBGE | GeoJSON |

### 8.3 Dados de Pesquisas Próprias

- Importação via CSV com modelo padronizado.
- Campos obrigatórios: data, localidade, tipo de pesquisa, tamanho da amostra, margem de erro, resultados agregados.
- Nunca importar dados individuais de respondentes.
- Validação de formato antes da inserção.

### 8.4 Estratégia de Dados

**Importação:**
1. Download dos arquivos do TSE (manual ou agendado).
2. Verificação de integridade via hash SHA-256.
3. Validação de formato e colunas esperadas.
4. Transformação e normalização (encoding, padronização de nomes, unificação de códigos TSE/IBGE).
5. Inserção em tabela de staging.
6. Aplicação das regras de negócio.
7. Consolidação nas tabelas principais.
8. Registro em `importacao_dados`.

**Versionamento:**
- Nunca sobrescrever dados importados — apenas adicionar ou marcar como substituído.
- Cada `resultado_eleitoral` referencia `fonte_dados_id`.

**Rastreabilidade:**
- Todo registro importado possui `fonte_dados_id` e `importacao_dados_id`.
- Hash do arquivo armazenado para auditoria.

**Normalização:**
- Codificações de municípios unificadas (TSE ↔ IBGE).
- Nomes em UTF-8, sem variações de grafia.
- Coordenadas em WGS84 (EPSG:4326) para compatibilidade com Leaflet.

---

## 9. Critérios de Classificação Territorial

Toda classificação é baseada em dados históricos objetivos e deve ser documentada em `regras_negocio.md`.

### 9.1 Classificações e Critérios

| Classificação | Definição | Critério Objetivo |
|---|---|---|
| **Zona de Força** | Alto desempenho consistente | Média ≥ 40% dos votos válidos nas últimas 2 eleições comparáveis |
| **Território Consolidado** | Zona de força com baixa variação | Zona de força + desvio padrão ≤ 5 p.p. entre eleições |
| **Zona em Disputa** | Sem dominância clara | Diferença entre 1º e 2º colocados ≤ 10 p.p. na última eleição |
| **Zona de Expansão** | Tendência de crescimento | Crescimento ≥ 10% de votos entre as duas últimas eleições |
| **Território Adversário** | Dominado pelo campo oposto | Candidato/partido adversário com > 50% dos votos válidos |
| **Território Neutro** | Sem padrão definido | Nenhuma das condições acima satisfeita |
| **Território Volátil** | Alta variação entre eleições | Desvio padrão > 15 p.p. entre eleições comparáveis |

### 9.2 Fórmula do Índice de Força Territorial

```
indice_forca = (media_percentual_votos × 0.5)
             + (tendencia_crescimento × 0.3)
             + (consistencia_historica × 0.2)

Onde:
  media_percentual_votos   = média do % de votos válidos nas últimas N eleições
  tendencia_crescimento    = variação percentual entre a última e a penúltima eleição
  consistencia_historica   = 1 - (desvio_padrao / media) — normalizado entre 0 e 1

Resultado: índice de 0 a 100
```

### 9.3 Compatibilidade para Pré-Candidatos

Para pré-candidatos sem histórico, a avaliação de potencial considera:
1. Histórico do partido no território.
2. Desempenho de candidatos com espectro político similar no território.
3. Resultados de pesquisas eleitorais disponíveis para o território.

### 9.4 Transparência das Classificações

- Toda classificação exibe os dados que a originaram.
- O método de cálculo é documentado, auditável e visível ao usuário.
- É possível registrar ajuste manual com justificativa, sem apagar o cálculo automático.

---

## 10. Backlog Inicial

### ÉPICO 1 — Infraestrutura e Fundação Técnica

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

### ÉPICO 2 — Importação de Dados do TSE

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

### ÉPICO 3 — Módulo de Candidatos

| ID | Tarefa | Prioridade | HU Relacionada |
|---|---|---|---|
| T19 | CRUD de candidatos (com histórico) | MVP | HU-C01, HU-CE05 |
| T20 | Cadastro de pré-candidatos (sem histórico) | MVP | HU-P01, HU-PP04 |
| T21 | Associação candidato ↔ partido ↔ cargo ↔ eleição | MVP | HU-P01, HU-PP02 |
| T22 | Tela de detalhe do candidato com histórico eleitoral | MVP | HU-C01, HU-C04 |
| T23 | Conversão de pré-candidato para candidato | Importante | HU-P05 |
| T24 | Busca e filtro de candidatos | MVP | — |

### ÉPICO 4 — Histórico Eleitoral

| ID | Tarefa | Prioridade | HU Relacionada |
|---|---|---|---|
| T25 | API `obter_resultado_eleitoral` por candidato, partido, território | MVP | HU-C01, HU-CE01 |
| T26 | Tela de histórico eleitoral com tabela analítica | MVP | HU-C01, HU-A01 |
| T27 | Gráfico de evolução de votação ao longo do tempo | MVP | HU-C04, HU-A07 |
| T28 | Comparação entre duas eleições diferentes | MVP | HU-C02, HU-CE01 |
| T29 | Comparação candidato vs. média do partido por território | Importante | HU-CC04 |
| T30 | Filtros combinados por eleição, cargo, partido, candidato e território | MVP | HU-A03, HU-CC02 |

### ÉPICO 5 — Mapa Interativo e Inteligência Territorial (Leaflet)

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

### ÉPICO 6 — Módulo de Pesquisas Eleitorais

| ID | Tarefa | Prioridade | HU Relacionada |
|---|---|---|---|
| T43 | CRUD de pesquisas eleitorais | MVP | HU-PQ03 |
| T44 | Importação de resultados de pesquisa via CSV | MVP | HU-PQ01 |
| T45 | Validação e registro de importação de pesquisa | MVP | HU-PQ01 |
| T46 | Cruzamento pesquisa × histórico eleitoral | Importante | HU-PQ02, HU-CE02 |
| T47 | Sobreposição de pesquisa no mapa Leaflet | Importante | HU-CE02 |
| T48 | Visualização de tendências por localidade | Importante | HU-PQ04 |

### ÉPICO 7 — Painéis e Indicadores

| ID | Tarefa | Prioridade | HU Relacionada |
|---|---|---|---|
| T49 | `PainelPrincipal` com indicadores consolidados | MVP | HU-A01 |
| T50 | `PainelInteligenciaTerritorial` | MVP | HU-CC01, HU-A02 |
| T51 | `PainelHistoricoEleitoral` | MVP | HU-C01, HU-A07 |
| T52 | `calcular_indice_forca_partidaria` e exibição por território | MVP | HU-A02 |
| T53 | Exportação de dados em CSV | MVP | HU-CC05, HU-A06 |
| T54 | Painel de perfil político territorial | Importante | HU-CE04, HU-A04 |
| T55 | Exportação de relatório em PDF | Futuro | HU-CE06 |

### ÉPICO 8 — Pré-Candidatos e Potencial Eleitoral

| ID | Tarefa | Prioridade | HU Relacionada |
|---|---|---|---|
| T56 | Análise de compatibilidade pré-candidato × território | Importante | HU-P03 |
| T57 | Visualização de territórios compatíveis por perfil político | Importante | HU-P03 |
| T58 | `calcular_potencial_eleitoral` por território e partido | Futuro | HU-P03, HU-PP04 |
| T59 | Simulador de potencial eleitoral para pré-candidatos | Futuro | HU-P03, HU-PP04 |

---

## 11. Cuidados Éticos, Legais e de Privacidade

### 11.1 Princípios Fundamentais

1. **Dados públicos e autorizados apenas** — a plataforma utiliza exclusivamente dados públicos do TSE, dados geográficos de fontes oficiais, ou pesquisas próprias devidamente autorizadas.
2. **Análise territorial e agregada** — todas as análises são feitas no nível de território (município, zona, seção, bairro) — nunca no nível individual de eleitores.
3. **Proibição absoluta de microdirecionamento** — a plataforma não é e não deve ser usada para identificar, segmentar ou direcionar comunicações a eleitores individuais.
4. **Transparência metodológica** — todos os critérios de classificação territorial são documentados, auditáveis e visíveis ao usuário.
5. **Minimização de dados** — coletar e manter apenas os dados estritamente necessários para as funcionalidades da plataforma.

### 11.2 Conformidade com a LGPD

- **Dados de usuários**: coletados com consentimento, usados apenas para funcionamento da plataforma.
- **Dados de candidatos**: informações mínimas de fontes públicas. CPF armazenado apenas como hash SHA-256 não reversível.
- **Direito de acesso e exclusão**: implementar mecanismo para solicitação de acesso e exclusão de dados pessoais.
- **Relatório de Impacto (RIPD)**: elaborar antes do lançamento.
- **Encarregado de Dados (DPO)**: designar antes do lançamento.
- **Inventário de dados**: manter registro atualizado de operações de tratamento.

### 11.3 Conformidade com a Legislação Eleitoral

- Consultar o Código Eleitoral e resoluções do TSE quanto ao uso de dados eleitorais em plataformas digitais.
- Não utilizar a plataforma para monitoramento individual de eleitores.
- Verificar necessidade de registro como software eleitoral junto ao TSE.
- Não utilizar dados de candidatos para fins alheios à análise territorial e estatística.

### 11.4 Segurança da Informação

- HTTPS obrigatório em todos os ambientes (sem exceções).
- Senhas com hash bcrypt (custo mínimo 12).
- JWT com expiração curta (15 min access + 7 dias refresh).
- Proteção contra SQL Injection, XSS e CSRF.
- Rate limiting nas APIs.
- Backups automáticos com retenção mínima de 30 dias.
- Logs de auditoria imutáveis para ações sensíveis.
- Banco de dados acessível apenas via API — nunca exposto diretamente.

### 11.5 O que Nunca Fazer

- ❌ Armazenar dados individuais de eleitores.
- ❌ Cruzar dados eleitorais com dados pessoais identificáveis de eleitores.
- ❌ Usar a plataforma para microdirecionamento de propaganda eleitoral individual.
- ❌ Vender ou compartilhar dados com terceiros sem base legal.
- ❌ Armazenar CPF em texto claro.
- ❌ Manter dados desnecessários após o fim da finalidade.

---

## 12. Guia de Nomenclatura em Português do Brasil

### 12.1 Princípios Gerais

- Toda a base de código em português do Brasil.
- Exceções aceitas: termos técnicos sem equivalente consolidado em PT-BR (`id`, `hash`, `token`, `url`, `uuid`, `boolean`, `timestamp`).
- Convenções por contexto:
  - **snake_case**: banco de dados, variáveis de back-end, nomes de arquivos.
  - **PascalCase**: componentes React.
  - **camelCase**: variáveis e funções JavaScript/TypeScript.
  - **kebab-case**: rotas HTTP, nomes de arquivos de módulo front-end.
  - **UPPER_CASE**: constantes e enums.

### 12.2 Entidades e Tabelas

| Entidade | Tabela no banco |
|---|---|
| Candidato | `candidato` |
| Pré-candidato | campo `eh_pre_candidato` em `candidato` |
| Partido | `partido` |
| Eleição | `eleicao` |
| Cargo | `cargo` |
| Candidatura | `candidatura` |
| Resultado eleitoral | `resultado_eleitoral` |
| Município | `municipio` |
| Bairro | `bairro` |
| Zona eleitoral | `zona_eleitoral` |
| Seção eleitoral | `secao_eleitoral` |
| Local de votação | `local_votacao` |
| Pesquisa eleitoral | `pesquisa_eleitoral` |
| Resultado de pesquisa | `resultado_pesquisa` |
| Território | `territorio` |
| Classificação territorial | `classificacao_territorial` |
| Indicador eleitoral | `indicador_eleitoral` |
| Fonte de dados | `fonte_dados` |
| Importação de dados | `importacao_dados` |
| Usuário | `usuario` |

### 12.3 Colunas e Campos

```
candidato_id
nome_urna
nome_completo
cpf_hash
data_nascimento
espectro_politico
eh_pre_candidato
quantidade_votos
percentual_votos_validos
zona_eleitoral_id
municipio_id
secao_eleitoral_id
criado_em
atualizado_em
fonte_dados_id
importacao_dados_id
indice_forca
metodo_calculo
calculado_em
```

### 12.4 Funções e Métodos (TypeScript)

```typescript
// Candidato
listarCandidatos()
obterCandidatoPorId(candidatoId: string)
criarCandidato(dadosCandidato: TipoCandidato)
atualizarCandidato(candidatoId: string, dados: Partial<TipoCandidato>)
excluirCandidato(candidatoId: string)

// Resultados eleitorais
obterResultadoEleitoral(filtros: FiltroResultadoEleitoral)
obterResultadoEleitoralPorZona(eleicaoId: string, zonaEleitoralId: string)
agregrarResultadoPorMunicipio(eleicaoId: string, municipioId: string)
calcularVariacaoEntreEleicoes(candidatoId: string, eleicaoIdA: string, eleicaoIdB: string)

// Território e classificação
classificarTerritorio(territorioId: string, candidatoId: string, eleicaoId: string)
calcularIndiceForcaTerritorial(candidatoId: string, eleicaoId: string, territorioId: string)
calcularIndiceForcaPartidaria(partidoId: string, eleicaoId: string, territorioId: string)
calcularPotencialEleitoral(candidatoId: string, territorioId: string)
obterClassificacaoTerritorial(territorioId: string, candidatoId: string)

// Pesquisa
importarPesquisaCsv(caminhoArquivo: string, pesquisaId: string)
cruzarPesquisaComHistorico(pesquisaId: string, eleicaoId: string, territorioId: string)

// Importação
importarResultadoTse(caminhoArquivo: string)
normalizarDadoEleitoral(registroBruto: RegistroTse)
validarDadoImportacao(registro: unknown)
```

### 12.5 Componentes React (PascalCase)

```
MapaTerritorial
CamadaZonaEleitoral
CamadaSecaoEleitoral
CamadaMunicipio
CamadaBairro
LegendaClassificacaoTerritorial
PainelDetalheZona
ControleFiltroMapa
PainelInteligenciaTerritorial
PainelHistoricoEleitoral
PainelPrincipal
TabelaResultadoEleitoral
TabelaAnalitica
GraficoEvolucaoEleitoral
GraficoComparativoPartido
GraficoDistribuicaoVotos
GraficoIndiceTerritorial
FormularioCandidato
FormularioPesquisa
IndicadorForcaTerritorial
IndicadorForcaPartidaria
SeletorEleicao
SeletorTerritorio
ComparativoEleicoes
BotaoExportarCsv
```

### 12.6 Hooks React (camelCase, prefixo `usar`)

```typescript
usarCandidato()
usarEleicao()
usarTerritorio()
usarMapa()
usarPesquisa()
usarAutenticacao()
usarFiltroEleitoral()
usarClassificacaoTerritorial()
usarResultadoEleitoral()
usarImportacao()
usarIndicadorEleitoral()
usarComparativoEleicoes()
```

### 12.7 Serviços (back-end, snake_case)

```typescript
servico_candidato
servico_eleicao
servico_territorio
servico_resultado_eleitoral
servico_pesquisa_eleitoral
servico_importacao_tse
servico_importacao_pesquisa
servico_classificacao_territorial
servico_indicador_eleitoral
servico_autenticacao
servico_auditoria
```

### 12.8 Endpoints da API

```
GET    /candidatos
GET    /candidatos/:candidato_id
POST   /candidatos
PUT    /candidatos/:candidato_id
DELETE /candidatos/:candidato_id

GET    /eleicoes
GET    /eleicoes/:eleicao_id
GET    /eleicoes/:eleicao_id/candidaturas
GET    /eleicoes/:eleicao_id/resultados

GET    /resultados-eleitorais
GET    /resultados-eleitorais/por-candidato/:candidato_id
GET    /resultados-eleitorais/por-partido/:partido_id
GET    /resultados-eleitorais/por-municipio/:municipio_id
GET    /resultados-eleitorais/por-zona/:zona_eleitoral_id

GET    /territorios
GET    /territorios/:territorio_id
GET    /territorios/:territorio_id/classificacao
POST   /territorios/:territorio_id/classificar
GET    /territorios/:territorio_id/indicadores

GET    /municipios
GET    /municipios/:municipio_id
GET    /municipios/:municipio_id/zonas-eleitorais

GET    /zonas-eleitorais/:zona_id
GET    /zonas-eleitorais/:zona_id/secoes

GET    /pesquisas-eleitorais
GET    /pesquisas-eleitorais/:pesquisa_id
POST   /pesquisas-eleitorais
POST   /pesquisas-eleitorais/:pesquisa_id/importar

GET    /importacoes
POST   /importacoes/tse
POST   /importacoes/pesquisa-csv
GET    /importacoes/:importacao_id/status

GET    /indicadores-eleitorais
POST   /indicadores-eleitorais/calcular-indice-forca-territorial
POST   /indicadores-eleitorais/calcular-indice-forca-partidaria
POST   /indicadores-eleitorais/calcular-potencial-eleitoral
```

### 12.9 Rotas do Front-end

```
/painel
/candidatos
/candidatos/novo
/candidatos/:candidato_id
/candidatos/:candidato_id/historico-eleitoral
/eleicoes
/eleicoes/:eleicao_id
/eleicoes/comparar
/mapa-territorial
/mapa-territorial/:territorio_id
/pesquisas-eleitorais
/pesquisas-eleitorais/nova
/pesquisas-eleitorais/:pesquisa_id
/importacoes
/importacoes/historico
/configuracoes
/perfil
/login
```

### 12.10 Commits (Conventional Commits em português)

```
feat: adicionar mapa territorial com camadas Leaflet por classificação
feat: implementar cálculo do índice de força territorial
feat: adicionar importação de pesquisa eleitoral via CSV
feat: criar tela de detalhe do candidato com histórico eleitoral
fix: corrigir cálculo de percentual de votos válidos por zona
fix: corrigir sobreposição de camadas no mapa Leaflet
refactor: extrair lógica de classificação territorial para servico_classificacao_territorial
docs: documentar fórmula do índice de força territorial
test: adicionar testes para calcular_indice_forca_territorial
chore: configurar serviço de importação do TSE
style: padronizar nomenclatura das variáveis em português no módulo candidato
```

### 12.11 Constantes

```typescript
const CLASSIFICACAO_TERRITORIO = {
  ZONA_FORCA: 'zona_forca',
  ZONA_DISPUTA: 'zona_disputa',
  ZONA_EXPANSAO: 'zona_expansao',
  TERRITORIO_ADVERSARIO: 'territorio_adversario',
  TERRITORIO_NEUTRO: 'territorio_neutro',
  TERRITORIO_CONSOLIDADO: 'territorio_consolidado',
  TERRITORIO_VOLATIL: 'territorio_volatil',
} as const

const ESPECTRO_POLITICO = {
  ESQUERDA: 'esquerda',
  CENTRO_ESQUERDA: 'centro_esquerda',
  CENTRO: 'centro',
  CENTRO_DIREITA: 'centro_direita',
  DIREITA: 'direita',
} as const

const PERFIL_ACESSO = {
  ADMINISTRADOR: 'administrador',
  ANALISTA: 'analista',
  VISUALIZADOR: 'visualizador',
} as const

const TIPO_ELEICAO = {
  MUNICIPAL: 'municipal',
  ESTADUAL_FEDERAL: 'estadual_federal',
  SUPLEMENTAR: 'suplementar',
} as const

const TIPO_PESQUISA = {
  INTENCAO_VOTO: 'intencao_voto',
  REJEICAO: 'rejeicao',
  APROVACAO: 'aprovacao',
  ESPONTANEA: 'espontanea',
  ESTIMULADA: 'estimulada',
} as const

const NIVEL_TERRITORIO = {
  MUNICIPIO: 'municipio',
  ZONA_ELEITORAL: 'zona_eleitoral',
  SECAO_ELEITORAL: 'secao_eleitoral',
  BAIRRO: 'bairro',
  REGIAO_PERSONALIZADA: 'regiao_personalizada',
} as const

// Cores do mapa Leaflet por classificação
const COR_CLASSIFICACAO_TERRITORIAL = {
  ZONA_FORCA: '#1a7a4a',
  TERRITORIO_CONSOLIDADO: '#0d5c37',
  ZONA_EXPANSAO: '#5aab61',
  ZONA_DISPUTA: '#f5a623',
  TERRITORIO_ADVERSARIO: '#c0392b',
  TERRITORIO_NEUTRO: '#bdc3c7',
  TERRITORIO_VOLATIL: '#9b59b6',
} as const
```

---

## 13. Próximos Passos

### Fase 0 — Fundação (Semanas 1–2)
- [ ] Revisar e aprovar este documento com os stakeholders.
- [ ] Criar os 12 documentos listados na Seção 4.
- [ ] Validar histórias de usuário com representantes de cada perfil.
- [ ] Confirmar stack tecnológica: React + TypeScript + Node.js + Leaflet + PostgreSQL/PostGIS.
- [ ] Configurar repositório Git com estrutura de pastas definida na Seção 5.
- [ ] Configurar ambiente de desenvolvimento local com Docker.
- [ ] Criar migrações iniciais do banco de dados.
- [ ] Definir e documentar o modelo de dados final.

### Fase 1 — MVP (Semanas 3–14)
- [ ] Importar dados do TSE para as eleições selecionadas como referência.
- [ ] Implementar módulo de candidatos e pré-candidatos.
- [ ] Implementar visualização de histórico eleitoral com filtros.
- [ ] Implementar mapa interativo com Leaflet e classificação territorial.
- [ ] Implementar autenticação JWT e controle de acesso RBAC.
- [ ] Implementar painel analítico principal.
- [ ] Implementar exportação de dados em CSV.
- [ ] Testes com usuários representativos dos perfis definidos.

### Fase 2 — V1 (Semanas 15–22)
- [ ] Módulo de pesquisas eleitorais (cadastro, importação, cruzamento).
- [ ] Sobreposição de pesquisas no mapa Leaflet.
- [ ] Exportação de relatórios em PDF.
- [ ] Refinamentos de UX com base no feedback do MVP.
- [ ] Documentação para usuários finais.
- [ ] Análise de compatibilidade territorial para pré-candidatos.

### Fase 3 — V2 (Semanas 23+)
- [ ] Simulador de potencial eleitoral para pré-candidatos (`calcular_potencial_eleitoral`).
- [ ] Integração com dados demográficos do IBGE.
- [ ] Painéis comparativos avançados (múltiplos candidatos, múltiplas eleições).
- [ ] Módulo colaborativo para equipes de campanha.
- [ ] API pública de dados consolidados.

---

*Documento elaborado como plano estratégico e técnico da Plataforma de Inteligência Territorial Eleitoral.*  
*Versão 0.2 — Revisado com definições técnicas (React, Node.js, Leaflet, TypeScript) e histórias de usuário por perfil.*

---

**Fim do documento**
