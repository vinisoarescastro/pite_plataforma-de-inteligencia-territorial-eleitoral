# 04 — Requisitos Não Funcionais

> Define restrições e qualidades do sistema: desempenho, segurança, escalabilidade, acessibilidade e conformidade.

---

## Desempenho (RNF-D)

| ID | Requisito | Valor Alvo |
|---|---|---|
| RNF-D01 | Tempo de resposta da API para consultas comuns | ≤ 2 segundos |
| RNF-D02 | Tempo de atualização do mapa ao mudar filtros | ≤ 3 segundos |
| RNF-D03 | Tempo de carregamento do painel principal | ≤ 3 segundos |
| RNF-D04 | Tempo de importação de arquivo CSV de até 50MB | ≤ 5 minutos (assíncrono) |
| RNF-D05 | Suporte a cache Redis para consultas frequentes | Obrigatório |
| RNF-D06 | Paginação obrigatória em listagens com mais de 50 registros | Obrigatório |

---

## Segurança (RNF-S)

| ID | Requisito |
|---|---|
| RNF-S01 | HTTPS obrigatório em todos os ambientes (produção, homologação e desenvolvimento com certificado local) |
| RNF-S02 | Senhas armazenadas com hash bcrypt (custo mínimo 12) |
| RNF-S03 | CPF armazenado apenas como hash SHA-256 irreversível — nunca em texto claro |
| RNF-S04 | Proteção contra SQL Injection via uso de ORM com queries parametrizadas |
| RNF-S05 | Proteção contra XSS com sanitização de dados de entrada |
| RNF-S06 | Proteção contra CSRF com tokens de sessão |
| RNF-S07 | Rate limiting nas APIs para prevenir abuso |
| RNF-S08 | Banco de dados acessível apenas via API — nunca exposto diretamente à internet |
| RNF-S09 | Logs de auditoria imutáveis para ações sensíveis |
| RNF-S10 | Backups automáticos do banco de dados com retenção mínima de 30 dias |
| RNF-S11 | JWT com access token de curta duração (15 min) e refresh token (7 dias) |

---

## Privacidade e Conformidade (RNF-P)

| ID | Requisito |
|---|---|
| RNF-P01 | Conformidade com a Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018) |
| RNF-P02 | Nenhum dado individual de eleitores pode ser armazenado ou processado |
| RNF-P03 | Todas as análises devem ser territoriais e agregadas |
| RNF-P04 | Implementar mecanismo de solicitação de acesso e exclusão de dados pessoais |
| RNF-P05 | Elaborar Relatório de Impacto à Proteção de Dados (RIPD) antes do lançamento |
| RNF-P06 | Designar Encarregado de Dados (DPO) antes do lançamento |
| RNF-P07 | Manter inventário atualizado de operações de tratamento de dados |
| RNF-P08 | Verificar necessidade de registro como software eleitoral junto ao TSE |

---

## Escalabilidade e Disponibilidade (RNF-E)

| ID | Requisito |
|---|---|
| RNF-E01 | Arquitetura deve suportar múltiplas organizações (multi-tenant) sem degradação de desempenho |
| RNF-E02 | Processamento de importações pesadas deve ser assíncrono (BullMQ ou equivalente) |
| RNF-E03 | Banco de dados com suporte a índices otimizados para consultas geoespaciais (PostGIS) |
| RNF-E04 | Disponibilidade mínima de 99% em horário comercial (MVP) |
| RNF-E05 | Suporte a deploy containerizado via Docker |

---

## Usabilidade e Acessibilidade (RNF-U)

| ID | Requisito |
|---|---|
| RNF-U01 | Interface responsiva — funcional em desktop e tablet (mobile como futuro) |
| RNF-U02 | Toda a interface em português do Brasil |
| RNF-U03 | Legenda de classificação territorial sempre visível no mapa |
| RNF-U04 | Indicadores com descrições de interpretação acessíveis ao usuário não técnico |
| RNF-U05 | Mensagens de erro claras e orientadas à ação corretiva |

---

## Manutenibilidade (RNF-M)

| ID | Requisito |
|---|---|
| RNF-M01 | Toda a base de código em TypeScript (front-end e back-end) |
| RNF-M02 | Nomenclatura integralmente em português do Brasil (conforme guia de nomenclatura) |
| RNF-M03 | Documentação OpenAPI (Swagger) para todos os endpoints da API |
| RNF-M04 | Cobertura de testes unitários mínima de 60% para lógicas de negócio críticas (MVP) |
| RNF-M05 | Migrações de banco de dados versionadas e rastreáveis |
| RNF-M06 | Logs estruturados em JSON para facilitar análise e monitoramento |
