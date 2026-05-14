# 13 — Guia de Nomenclatura em Português do Brasil

> Padrão de nomeação para pastas, arquivos, variáveis, funções, tabelas, endpoints e commits.  
> Objetivo: garantir consistência no código e na documentação, facilitar manutenção e onboarding.

---

## 1. Princípios Gerais

- Toda a base de código em **português do Brasil**.
- **Exceções aceitas:** termos técnicos sem equivalente consolidado em PT-BR: `id`, `hash`, `token`, `url`, `uuid`, `boolean`, `timestamp`.
- Convenções por contexto:

| Contexto | Convenção |
|---|---|
| Banco de dados (tabelas, colunas) | `snake_case` |
| Variáveis de back-end | `snake_case` |
| Nomes de arquivos | `snake_case` |
| Componentes React | `PascalCase` |
| Variáveis JavaScript/TypeScript | `camelCase` |
| Funções e métodos TypeScript | `camelCase` |
| Rotas HTTP | `kebab-case` |
| Constantes e Enums | `UPPER_CASE` |
| Hooks React | `camelCase` com prefixo `usar` |

---

## 2. Entidades e Tabelas

| Entidade | Tabela no Banco |
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

---

## 3. Colunas e Campos (snake_case)

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

---

## 4. Funções e Métodos TypeScript (camelCase)

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
agregarResultadoPorMunicipio(eleicaoId: string, municipioId: string)
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

---

## 5. Componentes React (PascalCase)

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

---

## 6. Hooks React (camelCase, prefixo `usar`)

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

---

## 7. Serviços Back-end (snake_case)

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

---

## 8. Endpoints da API (kebab-case)

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

---

## 9. Rotas do Front-end

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

---

## 10. Commits (Conventional Commits em português)

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

---

## 11. Constantes e Enums (UPPER_CASE)

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
