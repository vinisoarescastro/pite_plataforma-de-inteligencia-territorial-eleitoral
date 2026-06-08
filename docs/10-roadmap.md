# 10 — Roadmap

> Linha do tempo planejada de entregas — fases, versões e marcos principais.

---

## Visão Geral das Fases

| Fase | Nome | Período | Objetivo |
|---|---|---|---|
| Fase 0 | Fundação | Semanas 1–2 | Documentação, aprovação e configuração do ambiente |
| Fase 1 | MVP | Semanas 3–14 | Core funcional: importação, mapa, histórico, painel |
| Fase 2 | V1 | Semanas 15–22 | Pesquisas eleitorais, cruzamentos e PDF |
| Fase 3 | V2 | Semanas 23+ | Simulador, IBGE, colaboração e API pública |

---

## Fase 0 — Fundação (Semanas 1–2)

- [x] Revisar e aprovar o plano estratégico e técnico com os stakeholders.
- [x] Criar os 13 documentos de suporte listados no plano inicial.
- [x] Validar histórias de usuário com representantes de cada perfil.
- [x] Definir stack tecnológica: React + JavaScript + Python + FastAPI + Leaflet + PostgreSQL/PostGIS.
- [x] Definir arquitetura single-tenant (uma organização por instalação).
- [x] Configurar repositório Git com estrutura de pastas definida.
- [ ] Configurar ambiente de desenvolvimento local com Docker.
- [x] Criar migrações iniciais do banco de dados com Alembic.
- [x] Definir e documentar o modelo de dados final.

---

## Fase 1 — MVP (Semanas 3–14)

**Épicos incluídos:**
- Infraestrutura e Fundação Técnica (T01–T10)
- Importação de Dados do TSE (T11–T18)
- Módulo de Candidatos (T19–T24)
- Histórico Eleitoral (T25–T30)
- Mapa Interativo e Inteligência Territorial — Leaflet (T31–T41)
- Painéis e Indicadores — parcial (T49–T53)

**Entregas:**
- [x] Configurar projeto FastAPI com estrutura de módulos e Alembic.
- [x] Configurar projeto React + Vite + Leaflet.
- [x] Implementar autenticação JWT (python-jose) e controle de acesso RBAC (single-tenant).
- [x] Importar dados do TSE para as eleições selecionadas (Python + Pandas) — scripts prontos; mapeamento TSE→IBGE importado (5.571 municípios).
- [x] Implementar módulo de candidatos — página Candidatos com grid de cards, filtros, seção de eleições vinculadas, CRUD admin e fluxo de vinculação de candidatura (ModalCandidatura).
- [ ] Implementar visualização de histórico eleitoral com filtros.
- [x] Implementar mapa interativo com Leaflet — navegação hierárquica Brasil→Região→Estado→Município, contornos dissolvidos, painel lateral com dados eleitorais, filtros colapsáveis com numeração de passos e legenda horizontal com gradiente multi-cor.
- [x] Refatorar importação de seções TSE com PostgreSQL COPY (psycopg2) + SSE + conexão dedicada fora do pool SQLAlchemy.
- [x] Implementar histórico de importações (`importacao_log`) com painel colapsável na tela de Importação.
- [x] Implementar página de Eleições com lazy loading — KPIs carregados via cache pré-computado (`eleicao_resumo_cache`); detalhes carregados por demanda ao expandir card.
- [x] Corrigir contagem de votos (filtro por cargo principal `MIN(cd_cargo)` por eleição).
- [x] Adicionar coluna `sg_uf` em `votacao_secao` para eliminar JOIN com `municipio_tse_ibge` nas queries de resumo e detalhe.
- [x] Corrigir mapa territorial: remover hardcode `'GO'` em `UF_COM_DADOS` e `buscarVotacaoMapaUF`; colorização de estados e busca de votos agora dinâmicas por UF selecionada.
- [x] Aplicar migration `k8f9a0b1c2d3` — tabela `eleicao_resumo_cache` criada; endpoint `GET /eleicoes/resumo` funcional.
- [ ] Implementar painel analítico principal com indicadores.
- [ ] Implementar exportação de dados em CSV.
- [ ] Testes com usuários representativos dos perfis definidos.

---

## Fase 2 — V1 (Semanas 15–22)

**Épicos incluídos:**
- Módulo de Pesquisas Eleitorais (T43–T48)
- Painéis e Indicadores — complemento (T54)
- Pré-Candidatos e Potencial Eleitoral — parcial (T56–T57)

**Entregas:**
- [ ] Módulo de pesquisas eleitorais (cadastro, importação, cruzamento).
- [ ] Sobreposição de pesquisas no mapa Leaflet.
- [ ] Exportação de relatórios em PDF.
- [ ] Refinamentos de UX com base no feedback do MVP.
- [ ] Documentação para usuários finais.
- [ ] Análise de compatibilidade territorial para pré-candidatos.

---

## Fase 3 — V2 (Semanas 23+)

**Épicos incluídos:**
- Pré-Candidatos e Potencial Eleitoral — completo (T58–T59)
- Funcionalidades futuras planejadas

**Entregas:**
- [ ] Simulador de potencial eleitoral para pré-candidatos (`calcular_potencial_eleitoral`).
- [ ] Integração com dados demográficos do IBGE.
- [ ] Painéis comparativos avançados (múltiplos candidatos, múltiplas eleições).
- [ ] Módulo colaborativo para equipes de campanha.
- [ ] API pública de dados consolidados.

---

## Funcionalidades Futuras (Pós-V2)

- Análise de volatilidade eleitoral por território.
- Módulo de monitoramento durante eleições.
- Notificações e alertas por território.
- Comparação automática com territórios similares.
- Aplicativo móvel.

---

## Dependências Críticas

| Dependência | Impacto | Responsável |
|---|---|---|
| Aprovação do plano técnico pelos stakeholders | Bloqueia início da Fase 1 | Gestão do projeto |
| Disponibilidade dos dados do TSE para eleições de referência | Bloqueia implementação do módulo de histórico | Equipe técnica |
| Dados geográficos (GeoJSON) do TSE e IBGE | Bloqueia implementação do mapa | Equipe técnica |
| Definição dos critérios de espectro político | Bloqueia análise de pré-candidatos | Produto |
| RIPD e designação do DPO | Bloqueia lançamento público | Jurídico |
