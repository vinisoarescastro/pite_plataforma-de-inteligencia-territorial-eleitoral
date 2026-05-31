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

| Conjunto | Fonte | Formato |
|---|---|---|
| Divisão municipal | IBGE | Shapefile / GeoJSON |
| Setores censitários | IBGE | Shapefile |
| Polígonos de zonas eleitorais | TSE | Shapefile / GeoJSON |
| Bairros | Prefeituras / IBGE | GeoJSON |

**Observações:**
- Coordenadas padronizadas em **WGS84 (EPSG:4326)** para compatibilidade com Leaflet.
- Shapefiles do IBGE disponíveis em geoftp.ibge.gov.br.

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
| TSE — resultados eleitorais | Equipe técnica | A cada eleição realizada |
| TSE — candidaturas | Equipe técnica | A cada eleição realizada |
| IBGE — dados geográficos | Equipe técnica | Revisão anual |
| Pesquisas eleitorais próprias | Usuário pesquisador | Sob demanda |
