# 09 — Governança, Segurança e Privacidade

> Define políticas de acesso, proteção de dados, conformidade com a LGPD e segurança da informação.

---

## 1. Princípios Fundamentais

1. **Dados públicos e autorizados apenas** — a plataforma utiliza exclusivamente dados públicos do TSE, dados geográficos de fontes oficiais, ou pesquisas próprias devidamente autorizadas.
2. **Análise territorial e agregada** — todas as análises são feitas no nível de território (município, zona, seção, bairro) — **nunca no nível individual de eleitores**.
3. **Proibição absoluta de microdirecionamento** — a plataforma não é e não deve ser usada para identificar, segmentar ou direcionar comunicações a eleitores individuais.
4. **Transparência metodológica** — todos os critérios de classificação territorial são documentados, auditáveis e visíveis ao usuário.
5. **Minimização de dados** — coletar e manter apenas os dados estritamente necessários para as funcionalidades da plataforma.

---

## 2. Conformidade com a LGPD

| Aspecto | Medida |
|---|---|
| Dados de usuários | Coletados com consentimento, usados apenas para funcionamento da plataforma |
| Dados de candidatos | Informações mínimas de fontes públicas. CPF armazenado apenas como hash SHA-256 não reversível |
| Direito de acesso | Implementar mecanismo para solicitação de acesso aos dados pessoais |
| Direito de exclusão | Implementar mecanismo para solicitação de exclusão de dados pessoais |
| Relatório de Impacto (RIPD) | Elaborar antes do lançamento da plataforma |
| Encarregado de Dados (DPO) | Designar antes do lançamento |
| Inventário de dados | Manter registro atualizado de operações de tratamento |

---

## 3. Conformidade com a Legislação Eleitoral

- Consultar o Código Eleitoral e resoluções do TSE quanto ao uso de dados eleitorais em plataformas digitais.
- Não utilizar a plataforma para monitoramento individual de eleitores.
- Verificar necessidade de registro como software eleitoral junto ao TSE.
- Não utilizar dados de candidatos para fins alheios à análise territorial e estatística.

---

## 4. Segurança da Informação

| Medida | Detalhamento |
|---|---|
| HTTPS | Obrigatório em todos os ambientes, sem exceções |
| Senhas | Hash bcrypt com custo mínimo 12 — nunca em texto claro |
| JWT | Access token (15 min) + refresh token (7 dias) |
| CPF | Hash SHA-256 unidirecional — nunca armazenado em texto claro |
| SQL Injection | Prevenção via ORM com queries parametrizadas |
| XSS | Sanitização de todos os dados de entrada |
| CSRF | Proteção com tokens de sessão |
| Rate limiting | Aplicado em todas as APIs |
| Banco de dados | Acessível apenas via API — nunca exposto diretamente |
| Backups | Automáticos com retenção mínima de 30 dias |
| Logs de auditoria | Imutáveis para ações sensíveis |

---

## 5. Controle de Acesso (RBAC)

| Perfil | Permissões |
|---|---|
| `administrador` | CRUD completo, gestão de usuários e organizações, acesso a logs de auditoria |
| `analista` | Leitura de todos os dados, importação de dados, cadastro de candidatos e pesquisas |
| `visualizador` | Somente leitura — sem permissão de cadastro, importação ou exportação |

### Isolamento Multi-Tenant

- Cada organização acessa apenas seus próprios dados e os dados públicos do TSE.
- Dados de candidatos de uma organização **não são acessíveis** a outras organizações.
- Dados públicos do TSE são compartilhados entre todas as organizações.

---

## 6. Auditoria

- Log de todas as ações de importação de dados (usuário, data, hash do arquivo).
- Log de acesso a dados sensíveis.
- Log de criação, edição e exclusão das entidades principais.
- Logs em formato JSON estruturado para facilitar análise.
- Logs de auditoria não podem ser editados ou excluídos por usuários comuns.

---

## 7. O que Nunca Fazer

- ❌ Armazenar dados individuais de eleitores.
- ❌ Cruzar dados eleitorais com dados pessoais identificáveis de eleitores.
- ❌ Usar a plataforma para microdirecionamento de propaganda eleitoral individual.
- ❌ Vender ou compartilhar dados com terceiros sem base legal.
- ❌ Armazenar CPF em texto claro.
- ❌ Manter dados desnecessários após o fim da finalidade.
- ❌ Expor o banco de dados diretamente à internet.
- ❌ Desabilitar HTTPS em qualquer ambiente.

---

## 8. Checklist Pré-Lançamento

- [ ] Elaborar Relatório de Impacto à Proteção de Dados (RIPD).
- [ ] Designar Encarregado de Dados (DPO).
- [ ] Criar inventário de operações de tratamento de dados.
- [ ] Verificar necessidade de registro como software eleitoral no TSE.
- [ ] Auditar todas as queries para garantir ausência de exposição de dados individuais.
- [ ] Validar configurações de HTTPS em produção.
- [ ] Testar mecanismos de solicitação de acesso e exclusão de dados pessoais.
- [ ] Revisar logs de auditoria e confirmar imutabilidade.
