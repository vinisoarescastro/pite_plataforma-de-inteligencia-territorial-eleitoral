# PITE — Plataforma de Inteligência Territorial Eleitoral

> Plataforma SPA de inteligência territorial eleitoral para análise estratégica de dados do TSE, pesquisas eleitorais e classificação territorial.

---

## Visão Geral

A **PITE** é uma plataforma web que permite analisar, visualizar e interpretar dados eleitorais históricos públicos (TSE), cruzados com pesquisas próprias autorizadas, dados geográficos e perfis políticos territoriais — apoiando decisões estratégicas de candidatos, pré-candidatos, partidos, consultorias eleitorais e equipes de campanha.

Todas as análises são de natureza **territorial, estatística e agregada** — nunca individuais.

---

## Público-Alvo

| Perfil | Necessidade Principal |
|---|---|
| Candidato | Entender histórico eleitoral e zonas de força por território |
| Pré-candidato | Avaliar potencial eleitoral com base em perfil político e histórico partidário |
| Coordenador de campanha | Priorizar esforços por zona, município e seção eleitoral |
| Consultor eleitoral | Análise comparativa entre eleições, territórios e candidatos |
| Partido político | Mapear forças, fragilidades e oportunidades territoriais |
| Pesquisador | Cruzar dados públicos do TSE com pesquisas próprias |
| Analista | Produzir indicadores, relatórios e painéis para suporte à decisão |

---

## Principais Diferenciais

- Visão territorial integrada: da seção eleitoral ao estado, em mapa interativo (Leaflet).
- Classificação automática e objetiva de territórios com critérios documentados.
- Suporte nativo a pré-candidatos sem histórico eleitoral próprio.
- Integração entre dados públicos do TSE e pesquisas eleitorais próprias.
- Análise agregada e territorial — sem microdirecionamento individual de eleitores.
- Interface e nomenclatura integralmente em português do Brasil.

---

## Stack Tecnológica

| Camada | Tecnologia |
|---|---|
| Front-end | React 18 + TypeScript + Vite |
| Mapas | Leaflet + React-Leaflet |
| Back-end | Node.js + TypeScript (Fastify) |
| Banco de dados | PostgreSQL 15+ + PostGIS |
| Cache | Redis |
| Autenticação | JWT (RBAC) |

---

## Documentação

Toda a documentação do projeto está na pasta [`documentacao/`](documentacao/).

| Documento | Descrição |
|---|---|
| [01 — Visão do Produto](documentacao/01-visao-do-produto.md) | Propósito, público-alvo, problemas resolvidos e escopo |
| [02 — Histórias de Usuário](documentacao/02-historias-de-usuario.md) | HUs por perfil com critérios de aceitação |
| [03 — Requisitos Funcionais](documentacao/03-requisitos-funcionais.md) | O que o sistema deve fazer |
| [04 — Requisitos Não Funcionais](documentacao/04-requisitos-nao-funcionais.md) | Desempenho, segurança, escalabilidade |
| [05 — Regras de Negócio](documentacao/05-regras-de-negocio.md) | Classificação territorial e fórmulas de cálculo |
| [06 — Arquitetura](documentacao/06-arquitetura.md) | Camadas, tecnologias e fluxo de dados |
| [07 — Modelo de Dados](documentacao/07-modelo-de-dados.md) | Entidades, campos e relacionamentos |
| [08 — Fontes de Dados](documentacao/08-fontes-de-dados.md) | Catálogo de fontes (TSE, IBGE, pesquisas) |
| [09 — Governança, Segurança e Privacidade](documentacao/09-governanca-seguranca-privacidade.md) | LGPD, segurança da informação e ética |
| [10 — Roadmap](documentacao/10-roadmap.md) | Fases e marcos do desenvolvimento |
| [11 — Backlog Inicial](documentacao/11-backlog-inicial.md) | Épicos e tarefas por prioridade |
| [12 — Dicionário de Dados](documentacao/12-dicionario-de-dados.md) | Glossário técnico de entidades e termos |
| [13 — Guia de Nomenclatura](documentacao/13-guia-de-nomenclatura.md) | Padrões de código em português do Brasil |

---

## Módulos do Sistema

| Módulo | Descrição |
|---|---|
| `modulo_candidato` | Cadastro e gestão de candidatos e pré-candidatos |
| `modulo_eleicao` | Histórico, candidaturas e resultados eleitorais |
| `modulo_territorio` | Mapa interativo, zonas, seções e classificação territorial |
| `modulo_pesquisa` | Cadastro, importação e cruzamento de pesquisas eleitorais |
| `modulo_importacao` | Importação e normalização de dados do TSE |
| `modulo_painel` | Painéis analíticos, gráficos e indicadores |
| `modulo_usuario` | Autenticação, perfis e controle de acesso |
| `modulo_configuracao` | Configurações da plataforma |

---

## Status do Projeto

> **Fase 0 — Fundação** — Documentação estratégica e técnica em elaboração.

---

## Cuidados Éticos e Legais

- Utiliza exclusivamente dados públicos do TSE e pesquisas próprias autorizadas.
- Análises sempre territoriais e agregadas — **nunca dados individuais de eleitores**.
- Conformidade com a **LGPD** e legislação eleitoral brasileira.
- Proibição absoluta de microdirecionamento de eleitores.

Veja o documento completo: [09 — Governança, Segurança e Privacidade](documentacao/09-governanca-seguranca-privacidade.md).
