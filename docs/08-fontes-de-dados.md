# 08 — Fontes de Dados

> Cataloga todas as fontes de dados utilizadas: origem, formato, periodicidade, licença e responsável.

---

## 1. Dados Públicos do TSE

Fonte: **Tribunal Superior Eleitoral (TSE)** — dados abertos em `dados.tse.jus.br`

| Conjunto | URL de Referência | Formato | Periodicidade |
|---|---|---|---|
| Resultados por seção eleitoral | dados.tse.jus.br | CSV (ZIP) | Por eleição |
| Candidaturas | dados.tse.jus.br | CSV (ZIP) | Por eleição |
| Partidos registrados | tse.jus.br | CSV | Sob demanda |
| Locais de votação | dados.tse.jus.br | CSV | Por eleição |
| Zonas eleitorais | dados.tse.jus.br | CSV | Periódico |
| Eleitorado por seção | dados.tse.jus.br | CSV | Por eleição |

**Licença:** Dados públicos do TSE são de domínio público, disponíveis para consulta e uso conforme a legislação brasileira.

---

## 2. Dados Geográficos

| Conjunto | Fonte | Formato | URL de Referência | Uso na plataforma |
|---|---|---|---|---|
| Polígonos de municípios | IBGE | Shapefile / GeoJSON | geoftp.ibge.gov.br/organizacao_do_territorio/malhas_territoriais | Colorir municípios no mapa |
| Polígonos de bairros | IBGE / Prefeitura | GeoJSON | Varia por município — prefeitura local ou dados IBGE | Colorir bairros no mapa; vínculo automático com locais de votação |
| Polígonos de zonas eleitorais | TSE | Shapefile | dadosabertos.tse.jus.br | Colorir zonas eleitorais no mapa (opcional) |
| Lat/lng dos locais de votação | Geocodificação automática | — | Nominatim (OpenStreetMap) — gratuito | Marcadores de pins no mapa para cada local de votação |

**Observações:**
- Coordenadas padronizadas em **WGS84 (EPSG:4326)** para compatibilidade com Leaflet.
- Shapefiles devem ser convertidos para GeoJSON antes da importação (ferramenta: `ogr2ogr` ou QGIS).
- Polígonos de bairros variam por município — disponíveis para capitais e municípios maiores.

### Geocodificação dos Locais de Votação

O endereço de cada local de votação (`DS_LOCAL_VOTACAO_ENDERECO`) é extraído de `votacao_secao` e convertido em coordenadas lat/lng via Nominatim (API gratuita do OpenStreetMap). O processo roda em **background** sem bloquear a API:

```
1. POST /geo/geocoding/municipio → dispara BackgroundTask no FastAPI
2. Coletar endereços únicos de votacao_secao para o município
3. Fazer upsert em local_votacao_geo com status='pendente' (ON CONFLICT DO NOTHING)
4. Para cada pendente: GET https://nominatim.openstreetmap.org/search?q=<endereço>&format=json
5. Estratégia de fallback: tenta ds_endereco; se não encontrar, tenta nm_local_votacao
6. Salvar GEOMETRY(POINT, 4326) + atualizar status ('geocodificado' ou 'erro')
7. Rate limit obrigatório: sleep(1.1s) entre chamadas (ToS do Nominatim)
8. Frontend faz polling em GET /geo/geocoding/status a cada 3 s enquanto em_andamento=true
```

**Tabela de resultado:** `local_votacao_geo` com campos `sg_uf`, `cd_municipio_tse`, `nr_local_votacao` (PK composta), `geom`, `status`, `geocodificado_em`.

**Vínculo espacial com bairros:** Após geocodificação, o endpoint `POST /geo/bairros/{id}/sugerir-locais` usa `ST_Within(geom, bairro.geom)` para sugerir automaticamente quais locais estão dentro de um polígono de bairro desenhado pelo usuário.

**Alternativas se Nominatim não encontrar:** Google Maps Geocoding API (pago, mais preciso), ViaCEP + conversão por CEP.

---

## 3. Dados de Pesquisas Eleitorais Próprias

- Importação via **CSV com modelo padronizado** pela equipe do usuário.
- Campos obrigatórios: `data`, `localidade`, `tipo_pesquisa`, `tamanho_amostra`, `margem_erro`, `resultados_agregados`.
- **Nunca importar dados individuais de respondentes** — apenas resultados agregados por localidade.
- Validação de formato antes da inserção.
- Hash SHA-256 do arquivo armazenado para rastreabilidade.

---

## 4. Estratégia de Importação de Dados

### 4.1 Pipeline de Importação TSE

```
1. Download dos arquivos do TSE (manual ou agendado)
2. Verificação de integridade via hash SHA-256
3. Validação de formato e colunas esperadas
4. Transformação e normalização:
   - Encoding: UTF-8
   - Padronização de nomes
   - Unificação de códigos TSE/IBGE
5. Inserção em tabela de staging
6. Aplicação das regras de negócio
7. Consolidação nas tabelas principais
8. Registro em importacao_dados
```

### 4.2 Versionamento de Dados

- **Nunca sobrescrever** dados importados — apenas adicionar novos ou marcar registros como substituídos.
- Todo `resultado_eleitoral` mantém referência a `fonte_dados_id`.
- A data e responsável de cada importação são sempre registrados.

### 4.3 Rastreabilidade

- Todo registro importado possui `fonte_dados_id` e `importacao_dados_id`.
- Hash do arquivo armazenado para auditoria.
- Registro de erros por linha durante a importação.

### 4.4 Normalização

- Codificações de municípios unificadas (TSE ↔ IBGE).
- Nomes em UTF-8, sem variações de grafia.
- Coordenadas em WGS84 (EPSG:4326) para compatibilidade com Leaflet.

---

## 5. O que Nunca Importar

- ❌ Dados individuais de eleitores.
- ❌ Dados de respondentes individuais de pesquisas.
- ❌ Dados obtidos fora das fontes autorizadas.
- ❌ Dados com licença incompatível com o uso da plataforma.

---

## 6. Responsabilidades de Atualização

| Fonte | Responsável | Periodicidade |
|---|---|---|
| TSE — resultados por seção (`votacao_secao_AAAA_UF.csv`) | Equipe técnica | A cada eleição realizada |
| TSE — candidaturas | Equipe técnica | A cada eleição realizada |
| IBGE — malha municipal (polígonos) | Equipe técnica | Revisão anual |
| IBGE / Prefeitura — polígonos de bairros | Equipe técnica | Sob demanda |
| TSE — shapefile de zonas eleitorais | Equipe técnica | Sob demanda |
| Geocodificação dos locais de votação | Script automático | Após cada importação TSE |
| Pesquisas eleitorais próprias | Usuário pesquisador | Sob demanda |

---

## 7. Campos-Chave do CSV do TSE (`votacao_secao`)

Campos utilizados diretamente na importação e suas correspondências no banco:

| Campo CSV | Campo no banco | Tabela | Observação |
|---|---|---|---|
| `SQ_CANDIDATO` | `sq_candidato_tse` | `candidatura`, `resultado_eleitoral` | **Chave de ligação candidato ↔ resultados** |
| `NR_VOTAVEL` | `nr_votavel` | `candidatura`, `resultado_eleitoral` | Número nas urnas |
| `NM_VOTAVEL` | `nm_votavel_tse` | `candidatura`, `resultado_eleitoral` | Nome exato nas urnas |
| `CD_MUNICIPIO` | `codigo_tse` | `municipio` | Liga resultado ao município |
| `NR_ZONA` | `numero_zona` | `zona_eleitoral` | Liga resultado à zona |
| `NR_SECAO` | `numero_secao` | `secao_eleitoral` | Liga resultado à seção |
| `NR_LOCAL_VOTACAO` | `numero_tse` | `local_votacao` | Liga seção ao local físico |
| `DS_LOCAL_VOTACAO_ENDERECO` | `endereco` | `local_votacao` | Endereço para geocodificação |
| `CD_ELEICAO` | `cd_eleicao_tse` | `eleicao` | Código único da eleição e turno |
| `CD_CARGO` | `cd_cargo_tse` | `resultado_eleitoral`, `cargo` | Cargo disputado |
| `DS_CARGO` | `ds_cargo_tse` | `resultado_eleitoral` | Descrição textual do cargo |
| `QT_VOTOS` | `qt_votos` | `resultado_eleitoral` | Votos nesta seção |
| `SG_UF` | `sigla_uf` | `uf`, `eleicao` | Estado |
