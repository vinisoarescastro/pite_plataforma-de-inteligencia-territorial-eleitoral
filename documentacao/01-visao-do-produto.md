# 01 — Visão do Produto

> PITE — Plataforma de Inteligência Territorial Eleitoral

---

## 1. Nome da Plataforma

**Plataforma de Inteligência Territorial Eleitoral**

Sigla interna de referência: **PITE**

---

## 2. Objetivo Principal

Fornecer uma plataforma SPA de inteligência territorial eleitoral que permita analisar, visualizar e interpretar dados eleitorais históricos públicos (TSE), cruzados com pesquisas próprias autorizadas, dados geográficos e perfis políticos territoriais — apoiando decisões estratégicas de candidatos, pré-candidatos, partidos, consultorias eleitorais e equipes de campanha, com análises sempre de natureza territorial, estatística e agregada.

---

## 3. Público-Alvo

| Perfil | Necessidade Principal |
|---|---|
| Candidato | Entender seu histórico eleitoral e zonas de força por território |
| Pré-candidato | Avaliar potencial eleitoral com base em perfil político e histórico partidário |
| Coordenador de campanha | Priorizar esforços por zona, município e seção eleitoral |
| Consultor eleitoral | Análise comparativa entre eleições, territórios e candidatos |
| Partido político | Mapear forças, fragilidades e oportunidades territoriais |
| Pesquisador | Cruzar dados públicos do TSE com pesquisas próprias |
| Analista | Produzir indicadores, relatórios e painéis para suporte à decisão |

---

## 4. Problemas que a Plataforma Resolve

1. **Dispersão e complexidade dos dados eleitorais públicos** — dados do TSE são volumosos, fragmentados e de difícil interpretação prática.
2. **Ausência de visão territorial integrada** — campanhas operam sem inteligência geográfica estruturada por zona, seção e bairro.
3. **Dificuldade de integrar pesquisas próprias aos dados históricos** — não há ferramenta que una dados do TSE com pesquisas de campo de forma prática.
4. **Falta de classificação territorial objetiva** — territórios de força, disputa e adversidade são identificados de forma subjetiva e não sistematizada.
5. **Análise comparativa entre ciclos eleitorais exige esforço manual** — sem ferramenta, comparar desempenho entre eleições demanda planilhas complexas.
6. **Impossibilidade de avaliar pré-candidatos sem histórico** — candidatos que ainda não disputaram eleições não têm como avaliar seu potencial de forma estruturada.

---

## 5. Principais Diferenciais

- Visão territorial integrada: da seção eleitoral ao estado, em mapa interativo.
- Classificação automática e objetiva de territórios com critérios documentados.
- Suporte nativo a pré-candidatos sem histórico eleitoral próprio.
- Integração entre dados públicos do TSE e pesquisas eleitorais próprias.
- Análise agregada e territorial — sem microdirecionamento individual de eleitores.
- Interface e nomenclatura integralmente em português do Brasil.
- Plataforma SPA responsiva, com mapas baseados em Leaflet.

---

## 6. Decisões Técnicas Definidas

| Camada | Decisão |
|---|---|
| Front-end | React (SPA, JavaScript/TypeScript) |
| Back-end | Node.js (JavaScript/TypeScript) |
| Mapas | Leaflet |
| Banco de dados | PostgreSQL + PostGIS |
| Linguagem e nomenclatura | Português do Brasil em toda a base de código |

---

## 7. Escopo do MVP

### 7.1 Funcionalidades Essenciais

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

### 7.2 Funcionalidades para Versões Futuras

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

---

## 8. Módulos Principais do Sistema

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

---

## 9. Fluxos Principais de Uso

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

## 10. Fora do Escopo

- Dados individuais de eleitores.
- Microdirecionamento de propaganda eleitoral.
- Integração com sistemas de CRM ou marketing.
- Monitoramento de redes sociais.
- Gestão financeira de campanhas.
