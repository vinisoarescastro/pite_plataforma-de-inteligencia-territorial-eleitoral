# 13 — Guia de Nomenclatura em Português do Brasil

> Padrão de nomeação para pastas, arquivos, variáveis, funções, tabelas, endpoints e commits.  
> Objetivo: garantir consistência no código e na documentação, facilitar manutenção e onboarding.
>
> **Stack:** Backend em Python + FastAPI | Frontend em React + JavaScript

---

## 1. Princípios Gerais

- Toda a base de código em **português do Brasil**.
- **Exceções aceitas:** termos técnicos sem equivalente consolidado em PT-BR: `id`, `hash`, `token`, `url`, `uuid`, `boolean`, `timestamp`, `schema`, `status`.
- Convenções por contexto:

| Contexto | Convenção | Exemplo |
|---|---|---|
| Banco de dados (tabelas, colunas) | `snake_case` | `resultado_eleitoral`, `zona_eleitoral_id` |
| Variáveis Python (backend) | `snake_case` | `candidato_id`, `total_votos` |
| Funções Python (backend) | `snake_case` | `listar_candidatos()`, `calcular_indice_forca()` |
| Classes Python | `PascalCase` | `EsquemaCandidato`, `ModeloCandidato` |
| Nomes de arquivos Python | `snake_case` | `servico_candidato.py`, `roteador_eleicao.py` |
| Nomes de arquivos React | `snake_case` ou `PascalCase` | `mapa_territorial.jsx` ou `MapaTerritorial.jsx` |
| Componentes React | `PascalCase` | `MapaTerritorial`, `PainelPrincipal` |
| Variáveis JavaScript | `camelCase` | `totalVotos`, `candidatoId` |
| Funções JavaScript | `camelCase` | `listarCandidatos()`, `calcularIndiceForca()` |
| Rotas HTTP | `kebab-case` | `/candidatos`, `/zonas-eleitorais` |
| Constantes Python | `UPPER_CASE` | `CLASSIFICACAO_ZONA_FORCA` |
| Hooks React | `camelCase` com prefixo `usar` | `usarCandidato()`, `usarMapa()` |

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

## 4. Funções e Métodos Python — Backend (snake_case)

```python
# Candidato
def listar_candidatos() -> list[EsquemaCandidato]: ...
def obter_candidato_por_id(candidato_id: str) -> EsquemaCandidato: ...
def criar_candidato(dados: EsquemaCriarCandidato) -> EsquemaCandidato: ...
def atualizar_candidato(candidato_id: str, dados: EsquemaAtualizarCandidato): ...
def excluir_candidato(candidato_id: str): ...

# Resultados eleitorais
def obter_resultado_eleitoral(filtros: FiltroResultadoEleitoral): ...
def obter_resultado_por_zona(eleicao_id: str, zona_eleitoral_id: str): ...
def agregar_resultado_por_municipio(eleicao_id: str, municipio_id: str): ...
def calcular_variacao_entre_eleicoes(candidato_id: str, eleicao_id_a: str, eleicao_id_b: str): ...

# Território e classificação
def classificar_territorio(territorio_id: str, candidato_id: str, eleicao_id: str): ...
def calcular_indice_forca_territorial(candidato_id: str, eleicao_id: str, territorio_id: str): ...
def calcular_indice_forca_partidaria(partido_id: str, eleicao_id: str, territorio_id: str): ...
def calcular_potencial_eleitoral(candidato_id: str, territorio_id: str): ...
def obter_classificacao_territorial(territorio_id: str, candidato_id: str): ...

# Pesquisa
def importar_pesquisa_csv(caminho_arquivo: str, pesquisa_id: str): ...
def cruzar_pesquisa_com_historico(pesquisa_id: str, eleicao_id: str, territorio_id: str): ...

# Importação TSE
def importar_resultado_tse(caminho_arquivo: str): ...
def normalizar_dado_eleitoral(registro_bruto: dict): ...
def validar_dado_importacao(registro: dict): ...
```

---

## 5. Esquemas Pydantic — Validação (PascalCase)

```python
# Padrão: Esquema + Nome + Ação
class EsquemaCandidato(BaseModel): ...          # resposta padrão
class EsquemaCriarCandidato(BaseModel): ...     # criação (POST)
class EsquemaAtualizarCandidato(BaseModel): ... # atualização (PUT)
class EsquemaListaCandidatos(BaseModel): ...    # listagem paginada

class EsquemaEleicao(BaseModel): ...
class EsquemaResultadoEleitoral(BaseModel): ...
class EsquemaTerritorio(BaseModel): ...
class EsquemaClassificacaoTerritorial(BaseModel): ...
class EsquemaPesquisaEleitoral(BaseModel): ...
class EsquemaUsuario(BaseModel): ...
class EsquemaLogin(BaseModel): ...
class EsquemaTokenJWT(BaseModel): ...
```

---

## 6. Modelos SQLAlchemy — Banco de Dados (PascalCase)

```python
# Padrão: Modelo + Nome
class ModeloCandidato(Base): ...
class ModeloEleicao(Base): ...
class ModeloCandidatura(Base): ...
class ModeloResultadoEleitoral(Base): ...
class ModeloTerritorio(Base): ...
class ModeloClassificacaoTerritorial(Base): ...
class ModeloPesquisaEleitoral(Base): ...
class ModeloUsuario(Base): ...
class ModeloImportacaoDados(Base): ...
```

---

## 7. Arquivos e Módulos Python (snake_case)

```
api/
├── main.py
├── configuracoes.py
├── banco_dados.py
├── dependencias.py
├── modulos/
│   ├── candidato/
│   │   ├── roteador.py        → rotas FastAPI
│   │   ├── esquemas.py        → modelos Pydantic
│   │   ├── servico.py         → lógica de negócio
│   │   └── repositorio.py     → acesso ao banco
│   ├── eleicao/
│   │   ├── roteador.py
│   │   ├── esquemas.py
│   │   ├── servico.py
│   │   └── repositorio.py
│   └── usuario/
│       ├── roteador.py
│       ├── esquemas.py
│       ├── servico.py
│       └── repositorio.py
├── processamento/
│   ├── calcular_indice_forca.py
│   └── classificar_territorio.py

banco_dados/
├── modelos/
│   ├── candidato.py
│   ├── eleicao.py
│   └── usuario.py
├── migracoes/
│   ├── env.py
│   └── versoes/
│       └── 001_criar_tabelas_iniciais.py

importacao/
├── tse/
│   ├── importar_resultados.py
│   ├── importar_candidaturas.py
│   └── normalizar_dados.py
└── geografico/
    └── importar_geojson.py
```

---

## 8. Componentes React (PascalCase)

```jsx
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

## 9. Hooks React (camelCase, prefixo `usar`)

```javascript
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

## 10. Endpoints da API (kebab-case)

```
GET    /candidatos
GET    /candidatos/{candidato_id}
POST   /candidatos
PUT    /candidatos/{candidato_id}
DELETE /candidatos/{candidato_id}

GET    /eleicoes
GET    /eleicoes/{eleicao_id}
GET    /eleicoes/{eleicao_id}/candidaturas
GET    /eleicoes/{eleicao_id}/resultados

GET    /resultados-eleitorais
GET    /resultados-eleitorais/por-candidato/{candidato_id}
GET    /resultados-eleitorais/por-partido/{partido_id}
GET    /resultados-eleitorais/por-municipio/{municipio_id}
GET    /resultados-eleitorais/por-zona/{zona_eleitoral_id}

GET    /territorios
GET    /territorios/{territorio_id}
GET    /territorios/{territorio_id}/classificacao
POST   /territorios/{territorio_id}/classificar
GET    /territorios/{territorio_id}/indicadores

GET    /municipios
GET    /municipios/{municipio_id}
GET    /municipios/{municipio_id}/zonas-eleitorais

GET    /zonas-eleitorais/{zona_id}
GET    /zonas-eleitorais/{zona_id}/secoes

GET    /pesquisas-eleitorais
GET    /pesquisas-eleitorais/{pesquisa_id}
POST   /pesquisas-eleitorais
POST   /pesquisas-eleitorais/{pesquisa_id}/importar

GET    /importacoes
POST   /importacoes/tse
POST   /importacoes/pesquisa-csv
GET    /importacoes/{importacao_id}/status

GET    /indicadores-eleitorais
POST   /indicadores-eleitorais/calcular-indice-forca-territorial
POST   /indicadores-eleitorais/calcular-indice-forca-partidaria

POST   /autenticacao/login
POST   /autenticacao/refresh
POST   /autenticacao/logout
```

> **Nota:** No FastAPI, os parâmetros de rota usam `{chaves}` em vez de `:dois-pontos` do Node.js/Express.

---

## 11. Rotas do Front-end

```
/painel
/candidatos
/candidatos/novo
/candidatos/:candidatoId
/candidatos/:candidatoId/historico-eleitoral
/eleicoes
/eleicoes/:eleicaoId
/eleicoes/comparar
/mapa-territorial
/mapa-territorial/:territorioId
/pesquisas-eleitorais
/pesquisas-eleitorais/nova
/pesquisas-eleitorais/:pesquisaId
/importacoes
/importacoes/historico
/configuracoes
/perfil
/login
```

---

## 12. Commits (Conventional Commits em português)

```
feat: adicionar mapa territorial com camadas Leaflet por classificação
feat: implementar cálculo do índice de força territorial em Python
feat: adicionar importação de pesquisa eleitoral via CSV com Pandas
feat: criar tela de detalhe do candidato com histórico eleitoral
feat: implementar autenticação JWT com FastAPI e python-jose
feat: configurar Alembic com migração inicial do banco de dados
fix: corrigir cálculo de percentual de votos válidos por zona
fix: corrigir sobreposição de camadas no mapa Leaflet
refactor: extrair lógica de classificação territorial para calcular_indice_forca.py
docs: documentar fórmula do índice de força territorial
test: adicionar testes pytest para calcular_indice_forca_territorial
chore: configurar serviço de importação do TSE com Pandas
style: padronizar nomenclatura das variáveis em português no módulo candidato
```

---

## 13. Constantes Python (UPPER_CASE)

```python
# classificacao_territorial.py

CLASSIFICACAO_ZONA_FORCA = "zona_forca"
CLASSIFICACAO_ZONA_DISPUTA = "zona_disputa"
CLASSIFICACAO_ZONA_EXPANSAO = "zona_expansao"
CLASSIFICACAO_TERRITORIO_ADVERSARIO = "territorio_adversario"
CLASSIFICACAO_TERRITORIO_NEUTRO = "territorio_neutro"
CLASSIFICACAO_TERRITORIO_CONSOLIDADO = "territorio_consolidado"
CLASSIFICACAO_TERRITORIO_VOLATIL = "territorio_volatil"

ESPECTRO_ESQUERDA = "esquerda"
ESPECTRO_CENTRO_ESQUERDA = "centro_esquerda"
ESPECTRO_CENTRO = "centro"
ESPECTRO_CENTRO_DIREITA = "centro_direita"
ESPECTRO_DIREITA = "direita"

PERFIL_ADMINISTRADOR = "administrador"
PERFIL_ANALISTA = "analista"
PERFIL_VISUALIZADOR = "visualizador"

TIPO_ELEICAO_MUNICIPAL = "municipal"
TIPO_ELEICAO_ESTADUAL_FEDERAL = "estadual_federal"
TIPO_ELEICAO_SUPLEMENTAR = "suplementar"

TIPO_PESQUISA_INTENCAO_VOTO = "intencao_voto"
TIPO_PESQUISA_REJEICAO = "rejeicao"
TIPO_PESQUISA_APROVACAO = "aprovacao"
TIPO_PESQUISA_ESPONTANEA = "espontanea"
TIPO_PESQUISA_ESTIMULADA = "estimulada"

COR_ZONA_FORCA = "#1a7a4a"
COR_TERRITORIO_CONSOLIDADO = "#0d5c37"
COR_ZONA_EXPANSAO = "#5aab61"
COR_ZONA_DISPUTA = "#f5a623"
COR_TERRITORIO_ADVERSARIO = "#c0392b"
COR_TERRITORIO_NEUTRO = "#bdc3c7"
COR_TERRITORIO_VOLATIL = "#9b59b6"
```

---

## 14. Exemplo de Roteador FastAPI

```python
# api/modulos/candidato/roteador.py
from fastapi import APIRouter, Depends
from . import servico, esquemas
from api.dependencias import obter_sessao_db, obter_usuario_atual

roteador = APIRouter(prefix="/candidatos", tags=["Candidatos"])

@roteador.get("/", response_model=list[esquemas.EsquemaCandidato])
def listar_candidatos(
    db=Depends(obter_sessao_db),
    usuario=Depends(obter_usuario_atual)
):
    return servico.listar_candidatos(db)

@roteador.get("/{candidato_id}", response_model=esquemas.EsquemaCandidato)
def obter_candidato(
    candidato_id: str,
    db=Depends(obter_sessao_db),
    usuario=Depends(obter_usuario_atual)
):
    return servico.obter_candidato_por_id(db, candidato_id)

@roteador.post("/", response_model=esquemas.EsquemaCandidato, status_code=201)
def criar_candidato(
    dados: esquemas.EsquemaCriarCandidato,
    db=Depends(obter_sessao_db),
    usuario=Depends(obter_usuario_atual)
):
    return servico.criar_candidato(db, dados)
```
