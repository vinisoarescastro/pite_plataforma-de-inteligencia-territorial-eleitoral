# 05 — Regras de Negócio

> Define critérios e lógicas que governam o comportamento do sistema: classificações territoriais, fórmulas de cálculo e regras de importação.

---

## 1. Classificação Territorial

Toda classificação é baseada em dados históricos objetivos. O método de cálculo é documentado, auditável e visível ao usuário.

### 1.1 Classificações e Critérios

| Classificação | Definição | Critério Objetivo |
|---|---|---|
| **Zona de Força** | Alto desempenho consistente | Média ≥ 40% dos votos válidos nas últimas 2 eleições comparáveis |
| **Território Consolidado** | Zona de força com baixa variação | Zona de força + desvio padrão ≤ 5 p.p. entre eleições |
| **Zona em Disputa** | Sem dominância clara | Diferença entre 1º e 2º colocados ≤ 10 p.p. na última eleição |
| **Zona de Expansão** | Tendência de crescimento | Crescimento ≥ 10% de votos entre as duas últimas eleições |
| **Território Adversário** | Dominado pelo campo oposto | Candidato/partido adversário com > 50% dos votos válidos |
| **Território Neutro** | Sem padrão definido | Nenhuma das condições acima satisfeita |
| **Território Volátil** | Alta variação entre eleições | Desvio padrão > 15 p.p. entre eleições comparáveis |

### 1.2 Prioridade de Classificação

Quando múltiplos critérios são satisfeitos simultaneamente, a prioridade é:

1. Território Consolidado (mais restritivo de Zona de Força)
2. Zona de Força
3. Território Adversário
4. Território Volátil
5. Zona em Disputa
6. Zona de Expansão
7. Território Neutro

### 1.3 Cores de Visualização no Mapa

| Classificação | Cor (HEX) |
|---|---|
| Zona de Força | `#1a7a4a` |
| Território Consolidado | `#0d5c37` |
| Zona de Expansão | `#5aab61` |
| Zona em Disputa | `#f5a623` |
| Território Adversário | `#c0392b` |
| Território Neutro | `#bdc3c7` |
| Território Volátil | `#9b59b6` |

---

## 2. Fórmula do Índice de Força Territorial

O índice de força territorial quantifica o desempenho de um candidato ou partido em um território, em uma escala de **0 a 100**.

```
indice_forca = (media_percentual_votos × 0.5)
             + (tendencia_crescimento × 0.3)
             + (consistencia_historica × 0.2)
```

### Componentes

| Componente | Peso | Descrição |
|---|---|---|
| `media_percentual_votos` | 50% | Média do % de votos válidos nas últimas N eleições |
| `tendencia_crescimento` | 30% | Variação percentual entre a última e a penúltima eleição |
| `consistencia_historica` | 20% | `1 - (desvio_padrão / média)`, normalizado entre 0 e 1 |

### Regras de Aplicação

- O índice deve ser calculado por combinação de candidato/partido + eleição de referência + território.
- O resultado do cálculo é armazenado em `classificacao_territorial` com referência ao método aplicado.
- O método de cálculo deve ser exibido ao usuário junto ao resultado.
- Índices calculados ficam válidos até a próxima importação de dados da mesma eleição.

---

## 3. Avaliação de Potencial para Pré-Candidatos

Para pré-candidatos sem histórico eleitoral próprio, a avaliação de potencial territorial considera, nesta ordem:

1. **Histórico do partido** no território — média e tendência de votos do partido nas últimas eleições.
2. **Desempenho de candidatos com espectro político similar** no território — candidatos de outros partidos com mesmo espectro declarado.
3. **Resultados de pesquisas eleitorais** disponíveis para o território — quando houver pesquisas cadastradas na plataforma.

O sistema deve deixar explícito ao usuário que a análise de pré-candidatos é baseada em dados indiretos (partido e perfil político), não em histórico próprio.

---

## 4. Regras de Importação de Dados

### 4.1 Dados do TSE

1. Download dos arquivos do TSE (manual ou agendado).
2. Verificação de integridade via hash SHA-256 antes do processamento.
3. Validação de formato e colunas esperadas.
4. Transformação e normalização (encoding UTF-8, padronização de nomes, unificação de códigos TSE/IBGE).
5. Inserção em tabela de staging.
6. Aplicação das regras de negócio.
7. Consolidação nas tabelas principais.
8. Registro em `importacao_dados`.

### 4.2 Pesquisas Eleitorais (CSV)

- Campos obrigatórios: `data`, `localidade`, `tipo_pesquisa`, `tamanho_amostra`, `margem_erro`, `resultados_agregados`.
- Apenas dados agregados são aceitos — **nunca dados individuais de respondentes**.
- O sistema valida cada linha antes da importação e exibe erros detalhados.
- O hash SHA-256 do arquivo é armazenado para rastreabilidade.

### 4.3 Versionamento de Dados

- Nunca sobrescrever dados importados — apenas adicionar novos ou marcar registros como substituídos.
- Todo `resultado_eleitoral` mantém referência a `fonte_dados_id` e `importacao_dados_id`.
- A data e responsável de cada importação são sempre registrados.

---

## 5. Regras de Classificação de Espectro Político

A classificação de espectro político de partidos e candidatos deve ser baseada em critérios objetivos e documentados — não em opinião editorial.

| Valor | Descrição |
|---|---|
| `esquerda` | — |
| `centro_esquerda` | — |
| `centro` | — |
| `centro_direita` | — |
| `direita` | — |

> Os critérios objetivos para classificação de espectro político devem ser definidos e documentados antes da entrada de dados.

---

## 6. Regras de Acesso e Isolamento de Dados

- Cada organização acessa apenas seus próprios dados e os dados públicos do TSE.
- Dados de candidatos de uma organização não são acessíveis a outras organizações.
- Dados públicos do TSE são compartilhados entre todas as organizações.
- Perfis de acesso: `administrador` (CRUD completo), `analista` (leitura e importação), `visualizador` (somente leitura).

---

## 7. Transparência das Classificações

- Toda classificação deve exibir os dados que a originaram.
- O método de cálculo é documentado, auditável e visível ao usuário.
- É possível registrar ajuste manual com justificativa, sem apagar o cálculo automático.
- A data do cálculo e a eleição de referência são sempre exibidas junto à classificação.
