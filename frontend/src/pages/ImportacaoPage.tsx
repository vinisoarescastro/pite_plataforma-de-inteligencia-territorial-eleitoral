import { useState, useRef, useEffect, useCallback, useMemo, type DragEvent } from 'react'
import type { PageId } from './HomePage'
import styles from './ImportacaoPage.module.css'
import {
  importarMunicipios,
  importarResultados,
  importarSecoes,
  getSecoesEstados,
  type ImportUpdate,
  type SecaoEstadoCobertura,
} from '../services/importacao'
import { listarEleicoes, type Eleicao } from '../services/eleitoral'

type Aba = 'municipios' | 'resultados' | 'secoes'

interface Progresso {
  processadas: number
  total: number
  inseridos: number
  eta?: string
  fase?: string
}

interface EstadoImport {
  status: 'idle' | 'enviando' | 'ok' | 'erro'
  progresso?: Progresso
  resultado?: ImportUpdate
  erro?: string
}

export default function ImportacaoPage({ onNavigate: _onNavigate }: { onNavigate?: (page: PageId) => void }) {
  const [aba, setAba]                   = useState<Aba>('resultados')
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleImportado = useCallback(() => setRefreshTrigger(v => v + 1), [])

  return (
    <div className={styles.page}>
      <div className={styles.ph}>
        <div className={styles.phTitle}>Cobertura de Dados</div>
      </div>

      <TabelaCobertura onImportado={handleImportado} refreshTrigger={refreshTrigger} />

      <div className={styles.importSection}>
        <div className={styles.importSectionLabel}>Importação manual</div>
        <div className={styles.tabs}>
          <button className={`${styles.tab} ${aba === 'resultados' ? styles.tabActive : ''}`} onClick={() => setAba('resultados')}>
            <i className="fa-solid fa-chart-bar" /> Resultados
          </button>
          <button className={`${styles.tab} ${aba === 'secoes' ? styles.tabActive : ''}`} onClick={() => setAba('secoes')}>
            <i className="fa-solid fa-layer-group" /> Seções
          </button>
          <button className={`${styles.tab} ${aba === 'municipios' ? styles.tabActive : ''}`} onClick={() => setAba('municipios')}>
            <i className="fa-solid fa-map-location-dot" /> Municípios
          </button>
        </div>
        <div className={styles.content}>
          {aba === 'resultados' && <AbaResultados onImportado={handleImportado} />}
          {aba === 'secoes'     && <AbaSecoes     onImportado={handleImportado} />}
          {aba === 'municipios' && <AbaMunicipios  onImportado={handleImportado} />}
        </div>
      </div>
    </div>
  )
}

// ── Abas de importação ────────────────────────────────────────────────────

type ItemFila = { arquivo: File; status: 'aguardando' | 'enviando' | 'ok' | 'erro'; progresso?: Progresso; resultado?: ImportUpdate; erro?: string }

function AbaResultados({ onImportado }: { onImportado: () => void }) {
  const [arquivos, setArquivos]   = useState<File[]>([])
  const [ano, setAno]             = useState(new Date().getFullYear())
  const [turno, setTurno]         = useState(1)
  const [tipo, setTipo]           = useState('municipal')
  const [candidato, setCandidato] = useState('')
  const [fila, setFila]           = useState<ItemFila[]>([])
  const [rodando, setRodando]     = useState(false)

  function addArquivos(novos: File[]) {
    setArquivos(prev => {
      const nomes = new Set(prev.map(f => f.name))
      return [...prev, ...novos.filter(f => !nomes.has(f.name))]
    })
  }

  function removerArquivo(idx: number) {
    setArquivos(prev => prev.filter((_, i) => i !== idx))
  }

  function atualizarItem(idx: number, patch: Partial<ItemFila>) {
    setFila(prev => prev.map((it, i) => i === idx ? { ...it, ...patch } : it))
  }

  async function handleEnviar() {
    if (!arquivos.length) return
    const filaInicial: ItemFila[] = arquivos.map(f => ({ arquivo: f, status: 'aguardando' }))
    setFila(filaInicial)
    setRodando(true)

    for (let i = 0; i < filaInicial.length; i++) {
      const f = filaInicial[i].arquivo
      atualizarItem(i, { status: 'enviando', progresso: { processadas: 0, total: 0, inseridos: 0, fase: 'Enviando…' } })
      try {
        await importarResultados(f, ano, turno, tipo, candidato || undefined, u => {
          if (u.tipo === 'inicio') {
            atualizarItem(i, { progresso: { processadas: 0, total: u.total ?? 0, inseridos: 0, fase: 'Iniciando…' } })
          } else if (u.tipo === 'progresso') {
            atualizarItem(i, { progresso: { processadas: u.processadas ?? 0, total: u.total ?? 0, inseridos: u.inseridos ?? 0, eta: u.eta, fase: u.fase } })
          } else if (u.tipo === 'concluido') {
            atualizarItem(i, { status: 'ok', resultado: u })
            onImportado()
          }
        })
      } catch (e: any) {
        atualizarItem(i, { status: 'erro', erro: e.message })
      }
    }
    setRodando(false)
  }

  function handleReset() { setArquivos([]); setFila([]) }

  const tudo_ok   = fila.length > 0 && fila.every(it => it.status === 'ok')
  const tem_erro  = fila.some(it => it.status === 'erro')

  return (
    <div className={styles.card}>
      <div className={styles.form}>
        <div className={styles.row}>
          <div className={styles.field}>
            <label>Ano</label>
            <input type="number" value={ano} min={1990} max={2050} onChange={e => setAno(+e.target.value)} />
          </div>
          <div className={styles.field}>
            <label>Turno</label>
            <select value={turno} onChange={e => setTurno(+e.target.value)}>
              <option value={1}>1º turno</option>
              <option value={2}>2º turno</option>
            </select>
          </div>
          <div className={styles.field}>
            <label>Tipo de eleição</label>
            <select value={tipo} onChange={e => setTipo(e.target.value)}>
              <option value="municipal">Municipal</option>
              <option value="federal">Federal</option>
              <option value="estadual">Estadual</option>
            </select>
          </div>
        </div>

        <div className={styles.field}>
          <label>Filtrar candidato <span className={styles.opcional}>(opcional — deixe em branco para importar todos)</span></label>
          <input
            type="text"
            placeholder="Nome exato como aparece no CSV (ex: NOME DO CANDIDATO)"
            value={candidato}
            onChange={e => setCandidato(e.target.value)}
          />
        </div>

        <DropZoneMulti arquivos={arquivos} onArquivos={addArquivos} onRemover={removerArquivo} accept=".csv" disabled={rodando} />

        {fila.length > 0 && <FilaProgresso fila={fila} />}

        {(tudo_ok || tem_erro) ? (
          <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={handleReset}>
            <i className="fa-solid fa-rotate-left" /> Nova importação
          </button>
        ) : (
          <button
            className={`${styles.btn} ${styles.btnPrimary}`}
            disabled={!arquivos.length || rodando}
            onClick={handleEnviar}
          >
            {rodando
              ? <><i className="fa-solid fa-spinner fa-spin" /> Importando…</>
              : <><i className="fa-solid fa-file-import" /> Iniciar importação {arquivos.length > 1 ? `(${arquivos.length} arquivos)` : ''}</>
            }
          </button>
        )}
      </div>

    </div>
  )
}

// ── Aba: Votação por seção ─────────────────────────────────────────────────

const UFS_BRASIL = [
  'AC','AL','AM','AP','BA','CE','DF','ES','GO',
  'MA','MG','MS','MT','PA','PB','PE','PI','PR',
  'RJ','RN','RO','RR','RS','SC','SE','SP','TO',
]

function formatNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${Math.round(n / 1_000)}k`
  return n.toLocaleString('pt-BR')
}

function TabelaCobertura({ onImportado, refreshTrigger }: { onImportado: () => void; refreshTrigger?: number }) {
  const [eleicoes, setEleicoes]           = useState<Eleicao[]>([])
  const [cobertura, setCobertura]         = useState<SecaoEstadoCobertura[]>([])
  const [carregando, setCarregando]       = useState(true)
  const [recarregando, setRecarregando]   = useState(false)
  const [erroCarreg, setErroCarreg]       = useState<string | null>(null)
  const [celula, setCelula]               = useState<{ sg_uf: string; eleicao_id: string; ano: number; desc: string } | null>(null)
  const [arquivo, setArquivo]             = useState<File | null>(null)
  const [importando, setImportando]       = useState(false)
  const [progImport, setProgImport]       = useState<Progresso | null>(null)
  const [resultImport, setResultImport]   = useState<ImportUpdate | null>(null)
  const [erroImport, setErroImport]       = useState<string | null>(null)
  const miniRef = useRef<HTMLDivElement>(null)

  const recarregar = useCallback((inicial = false) => {
    if (inicial) setCarregando(true)
    else setRecarregando(true)
    setErroCarreg(null)
    Promise.all([listarEleicoes(), getSecoesEstados()])
      .then(([e, c]) => {
        setEleicoes([...e].sort((a, b) => b.ano - a.ano || a.turno - b.turno))
        setCobertura(c)
      })
      .catch(e => setErroCarreg(e.message ?? 'Erro ao carregar cobertura'))
      .finally(() => { setCarregando(false); setRecarregando(false) })
  }, [])

  useEffect(() => { recarregar(true) }, [recarregar])
  useEffect(() => { if (refreshTrigger) recarregar(false) }, [refreshTrigger, recarregar])

  const lookup = useMemo(() => {
    const m = new Map<string, Map<string, number>>()
    for (const { sg_uf, eleicao_id, total } of cobertura) {
      if (!m.has(sg_uf)) m.set(sg_uf, new Map())
      m.get(sg_uf)!.set(eleicao_id, total)
    }
    return m
  }, [cobertura])

  function handleCelulaClick(sg_uf: string, e: Eleicao) {
    const tipo = e.tipo.charAt(0).toUpperCase() + e.tipo.slice(1)
    setCelula({ sg_uf, eleicao_id: e.id, ano: e.ano, desc: `${sg_uf} — ${e.ano} ${tipo} T${e.turno}` })
    setArquivo(null)
    setImportando(false)
    setProgImport(null)
    setResultImport(null)
    setErroImport(null)
    setTimeout(() => miniRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 50)
  }

  async function handleImportar() {
    if (!arquivo || !celula) return
    setImportando(true)
    setProgImport({ processadas: 0, total: 0, inseridos: 0, fase: 'Iniciando…' })
    setResultImport(null)
    setErroImport(null)
    try {
      await importarSecoes(arquivo, celula.ano, undefined, undefined, undefined, u => {
        if (u.tipo === 'inicio') {
          setProgImport({ processadas: 0, total: u.total ?? 0, inseridos: 0, fase: 'Iniciando…' })
        } else if (u.tipo === 'progresso') {
          setProgImport({ processadas: u.processadas ?? 0, total: u.total ?? 0, inseridos: u.inseridos ?? 0, eta: u.eta, fase: u.fase })
        } else if (u.tipo === 'concluido') {
          setResultImport(u)
          onImportado()
          recarregar()
        }
      })
    } catch (e: any) {
      setErroImport(e.message ?? 'Erro ao importar')
    } finally {
      setImportando(false)
      setProgImport(null)
    }
  }

  if (carregando) return (
    <div className={styles.card} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: '16px 24px' }}>
      <i className="fa-solid fa-spinner fa-spin" style={{ color: 'var(--gray-400)' }} />
      <span style={{ color: 'var(--gray-400)', fontSize: 13 }}>Carregando cobertura de dados…</span>
    </div>
  )

  if (erroCarreg) return (
    <div className={styles.card} style={{ padding: '16px 24px' }}>
      <span style={{ color: '#dc2626', fontSize: 13 }}>{erroCarreg}</span>
    </div>
  )

  if (eleicoes.length === 0) return (
    <div className={styles.card} style={{ padding: '16px 24px' }}>
      <span style={{ color: 'var(--gray-400)', fontSize: 13 }}>
        <i className="fa-solid fa-table-cells" style={{ marginRight: 8 }} />
        Nenhuma eleição encontrada. Importe resultados eleitorais primeiro para visualizar a cobertura por estado.
      </span>
    </div>
  )

  return (
    <div className={styles.card}>
      <div className={styles.cardHd}>
        <div className={styles.cardIcon} style={{ background: '#f0f9ff', color: '#0284c7' }}>
          <i className="fa-solid fa-table-cells" />
        </div>
        <div style={{ flex: 1 }}>
          <div className={styles.cardTitle}>Cobertura de Dados por Estado</div>
          <div className={styles.cardSub}>
            Quais estados e eleições já têm dados importados.
            Clique em <strong>+ CSV</strong> para importar dados de um estado/eleição ausente.
          </div>
        </div>
        <button className={styles.statusRefresh} onClick={() => recarregar(false)} title="Atualizar tabela" disabled={recarregando}>
          <i className={`fa-solid fa-rotate ${recarregando ? 'fa-spin' : ''}`} />
        </button>
      </div>

      <div className={styles.coberturaWrap}>
        <table className={styles.coberturaTable}>
          <thead>
            <tr>
              <th className={styles.coberturaThUf}>UF</th>
              {eleicoes.map(e => (
                <th key={e.id} className={styles.coberturaTh}>
                  <div>{e.ano}</div>
                  <div className={styles.coberturaThSub}>{e.tipo[0].toUpperCase() + e.tipo.slice(1)} T{e.turno}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {UFS_BRASIL.map(uf => (
              <tr key={uf}>
                <td className={styles.coberturaTdUf}>{uf}</td>
                {eleicoes.map(el => {
                  const total = lookup.get(uf)?.get(el.id)
                  const ativa = celula?.sg_uf === uf && celula?.eleicao_id === el.id
                  return (
                    <td key={el.id} className={total != null ? styles.coberturaTdCom : styles.coberturaTdSem}>
                      {total != null ? (
                        <span className={styles.coberturaCount}>
                          <i className="fa-solid fa-circle-check" /> {formatNum(total)}
                        </span>
                      ) : (
                        <button
                          className={`${styles.btnEnviarCsv} ${ativa ? styles.btnEnviarCsvAtivo : ''}`}
                          onClick={() => handleCelulaClick(uf, el)}
                          title={`Enviar dados de ${uf} — ${el.ano}`}
                        >
                          <i className="fa-solid fa-plus" /> CSV
                        </button>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {celula && (
        <div ref={miniRef} className={styles.miniUpload}>
          <div className={styles.miniUploadHd}>
            <i className="fa-solid fa-file-arrow-up" style={{ color: '#2552e8' }} />
            <span>Importando: <strong>{celula.desc}</strong></span>
            <button
              className={styles.miniFechar}
              onClick={() => { setCelula(null); setArquivo(null); setProgImport(null); setResultImport(null); setErroImport(null) }}
              title="Fechar"
            >
              <i className="fa-solid fa-xmark" />
            </button>
          </div>

          {!resultImport && (
            <>
              <DropZone arquivo={arquivo} onArquivo={f => { setArquivo(f); setErroImport(null) }} accept=".csv" disabled={importando} />
              {importando && progImport && <BarraProgresso progresso={progImport} />}
              {!importando && (
                <button className={`${styles.btn} ${styles.btnPrimary}`} disabled={!arquivo} onClick={handleImportar}>
                  <i className="fa-solid fa-file-import" /> Importar
                </button>
              )}
              {erroImport && (
                <div className={styles.miniErro}>
                  <i className="fa-solid fa-triangle-exclamation" /> {erroImport}
                </div>
              )}
            </>
          )}

          {resultImport && (
            <div className={styles.miniSucesso}>
              <i className="fa-solid fa-circle-check" />
              <span>Concluído! <strong>{(resultImport.inseridos ?? 0).toLocaleString('pt-BR')}</strong> registros inseridos.</span>
              <button
                className={`${styles.btn} ${styles.btnSecondary}`}
                style={{ marginLeft: 'auto', height: 28, fontSize: 12, padding: '0 10px' }}
                onClick={() => { setCelula(null); setArquivo(null); setResultImport(null) }}
              >
                Fechar
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function AbaSecoes({ onImportado }: { onImportado: () => void }) {
  const [arquivos, setArquivos] = useState<File[]>([])
  const [ano, setAno]           = useState<number | ''>('')
  const [tipo, setTipo]         = useState('')
  const [cargo, setCargo]       = useState('')
  const [votavel, setVotavel]   = useState('')
  const [fila, setFila]         = useState<ItemFila[]>([])
  const [rodando, setRodando]   = useState(false)

  function addArquivos(novos: File[]) {
    setArquivos(prev => {
      const nomes = new Set(prev.map(f => f.name))
      return [...prev, ...novos.filter(f => !nomes.has(f.name))]
    })
  }

  function atualizarItem(idx: number, patch: Partial<ItemFila>) {
    setFila(prev => prev.map((it, i) => i === idx ? { ...it, ...patch } : it))
  }

  async function handleEnviar() {
    if (!arquivos.length) return
    const filaInicial: ItemFila[] = arquivos.map(f => ({ arquivo: f, status: 'aguardando' }))
    setFila(filaInicial)
    setRodando(true)

    for (let i = 0; i < filaInicial.length; i++) {
      const f = filaInicial[i].arquivo
      atualizarItem(i, { status: 'enviando', progresso: { processadas: 0, total: 0, inseridos: 0, fase: 'Enviando…' } })
      try {
        await importarSecoes(f, ano !== '' ? ano : undefined, tipo || undefined, cargo || undefined, votavel || undefined, u => {
          if (u.tipo === 'inicio') {
            atualizarItem(i, { progresso: { processadas: 0, total: u.total ?? 0, inseridos: 0, fase: 'Iniciando…' } })
          } else if (u.tipo === 'progresso') {
            atualizarItem(i, { progresso: { processadas: u.processadas ?? 0, total: u.total ?? 0, inseridos: u.inseridos ?? 0, eta: u.eta, fase: u.fase } })
          } else if (u.tipo === 'concluido') {
            atualizarItem(i, { status: 'ok', resultado: u })
            onImportado()
          }
        })
      } catch (e: any) {
        atualizarItem(i, { status: 'erro', erro: e.message })
      }
    }
    setRodando(false)
  }

  function handleReset() { setArquivos([]); setFila([]) }

  const tudo_ok  = fila.length > 0 && fila.every(it => it.status === 'ok')
  const tem_erro = fila.some(it => it.status === 'erro')

  return (
    <>
      <div className={styles.card}>
        <div className={styles.form}>
          <div className={styles.row}>
            <div className={styles.field}>
              <label>Ano <span className={styles.opcional}>(opcional — lido do arquivo)</span></label>
              <input type="number" min={1990} max={2050} value={ano} onChange={e => setAno(e.target.value === '' ? '' : +e.target.value)} placeholder="ex: 2024" />
            </div>
            <div className={styles.field}>
              <label>Tipo <span className={styles.opcional}>(opcional — lido do arquivo)</span></label>
              <select value={tipo} onChange={e => setTipo(e.target.value)}>
                <option value="">Detectar automaticamente</option>
                <option value="municipal">Municipal</option>
                <option value="federal">Federal</option>
                <option value="estadual">Estadual</option>
              </select>
            </div>
          </div>
          <div className={styles.row}>
            <div className={styles.field}>
              <label>Filtrar cargo <span className={styles.opcional}>(opcional)</span></label>
              <input type="text" placeholder="ex: Vereador, Prefeito" value={cargo} onChange={e => setCargo(e.target.value)} />
            </div>
            <div className={styles.field}>
              <label>Filtrar votável <span className={styles.opcional}>(opcional)</span></label>
              <input type="text" placeholder="Número do candidato/partido" value={votavel} onChange={e => setVotavel(e.target.value)} />
            </div>
          </div>

          <DropZoneMulti arquivos={arquivos} onArquivos={addArquivos} onRemover={i => setArquivos(prev => prev.filter((_, j) => j !== i))} accept=".csv" disabled={rodando} />

          {fila.length > 0 && <FilaProgresso fila={fila} />}

          {(tudo_ok || tem_erro) ? (
            <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={handleReset}>
              <i className="fa-solid fa-rotate-left" /> Nova importação
            </button>
          ) : (
            <button
              className={`${styles.btn} ${styles.btnPrimary}`}
              disabled={!arquivos.length || rodando}
              onClick={handleEnviar}
            >
              {rodando
                ? <><i className="fa-solid fa-spinner fa-spin" /> Importando…</>
                : <><i className="fa-solid fa-file-import" /> Iniciar importação {arquivos.length > 1 ? `(${arquivos.length} arquivos)` : ''}</>
              }
            </button>
          )}
        </div>
      </div>
    </>
  )
}

// ── Aba: Municípios ────────────────────────────────────────────────────────

function AbaMunicipios({ onImportado }: { onImportado: () => void }) {
  const [arquivo, setArquivo] = useState<File | null>(null)
  const [forcar, setForcar]   = useState(false)
  const [estado, setEstado]   = useState<EstadoImport>({ status: 'idle' })

  async function handleEnviar() {
    if (!arquivo) return
    setEstado({ status: 'enviando', progresso: { processadas: 0, total: 0, inseridos: 0, fase: 'Importando municípios…' } })
    try {
      await importarMunicipios(arquivo, forcar, u => {
        if (u.tipo === 'concluido') { setEstado({ status: 'ok', resultado: u }); onImportado() }
      })
    } catch (e: any) {
      setEstado({ status: 'erro', erro: e.message })
    }
  }

  return (
    <div className={styles.card}>
      <div className={styles.aviso} style={{ background: '#f0fdf4', borderColor: '#bbf7d0', color: '#166534' }}>
        <i className="fa-solid fa-circle-info" />
        <span>Deve ser importado <strong>antes dos demais</strong>. Arquivo: <code>municipio_tse_ibge.csv</code></span>
      </div>

      <div className={styles.form}>
        <DropZone arquivo={arquivo} onArquivo={f => { setArquivo(f); setEstado({ status: 'idle' }) }} accept=".csv" disabled={estado.status === 'enviando'} />

        <label className={styles.checkRow}>
          <input type="checkbox" checked={forcar} onChange={e => setForcar(e.target.checked)} />
          <span>Forçar reimportação (apaga os dados existentes)</span>
        </label>

        {estado.status === 'enviando' && estado.progresso && (
          <BarraProgresso progresso={estado.progresso} />
        )}

        <BotaoEnviar arquivo={arquivo} estado={estado} onEnviar={handleEnviar} onReset={() => setEstado({ status: 'idle' })} />
      </div>

      {estado.status === 'ok'   && <ResultadoCard resultado={estado.resultado!} />}
      {estado.status === 'erro' && <ErroCard erro={estado.erro!} onReset={() => setEstado({ status: 'idle' })} />}
    </div>
  )
}

// ── Barra de progresso ─────────────────────────────────────────────────────

function BarraProgresso({ progresso }: { progresso: Progresso }) {
  const { processadas, total, inseridos, eta, fase } = progresso
  const pct = total > 0 ? Math.min(100, Math.round((processadas / total) * 100)) : null

  return (
    <div className={styles.progresso}>
      <div className={styles.progressoHd}>
        <span className={styles.progressoFase}>
          <i className="fa-solid fa-spinner fa-spin" /> {fase ?? 'Processando…'}
        </span>
        <span className={styles.progressoPct}>{pct !== null ? `${pct}%` : '—'}</span>
      </div>

      <div className={styles.progressoBarWrap}>
        <div
          className={styles.progressoBar}
          style={{ width: pct !== null ? `${pct}%` : '0%' }}
        />
      </div>

      <div className={styles.progressoInfo}>
        {total > 0 ? (
          <span>{processadas.toLocaleString('pt-BR')} / {total.toLocaleString('pt-BR')} linhas</span>
        ) : (
          <span>Processando…</span>
        )}
        <span>{inseridos.toLocaleString('pt-BR')} inseridos</span>
        {eta && <span><i className="fa-regular fa-clock" /> {eta} restante</span>}
      </div>
    </div>
  )
}

// ── Componentes auxiliares ─────────────────────────────────────────────────

function DropZone({ arquivo, onArquivo, accept, disabled }: {
  arquivo: File | null
  onArquivo: (f: File | null) => void
  accept: string
  disabled?: boolean
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [drag, setDrag] = useState(false)

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    if (disabled) return
    setDrag(false)
    const file = e.dataTransfer.files[0]
    if (file) onArquivo(file)
  }

  return (
    <div
      className={`${styles.dropZone} ${drag ? styles.dragging : ''} ${arquivo ? styles.hasFile : ''} ${disabled ? styles.dropDisabled : ''}`}
      onClick={() => !disabled && inputRef.current?.click()}
      onDragOver={e => { e.preventDefault(); if (!disabled) setDrag(true) }}
      onDragLeave={() => setDrag(false)}
      onDrop={handleDrop}
    >
      <input ref={inputRef} type="file" accept={accept} style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) onArquivo(f) }} />
      {arquivo ? (
        <div className={styles.fileInfo}>
          <i className="fa-solid fa-file-csv" />
          <div>
            <div className={styles.fileName}>{arquivo.name}</div>
            <div className={styles.fileSize}>{(arquivo.size / 1024 / 1024).toFixed(2)} MB</div>
          </div>
          {!disabled && (
            <button className={styles.fileRemove} onClick={e => { e.stopPropagation(); onArquivo(null) }} title="Remover arquivo">
              <i className="fa-solid fa-xmark" />
            </button>
          )}
        </div>
      ) : (
        <div className={styles.dropHint}>
          <i className="fa-solid fa-cloud-arrow-up" />
          <span>Arraste o arquivo CSV aqui ou <strong>clique para selecionar</strong></span>
        </div>
      )}
    </div>
  )
}

function DropZoneMulti({ arquivos, onArquivos, onRemover, accept, disabled }: {
  arquivos: File[]
  onArquivos: (f: File[]) => void
  onRemover: (idx: number) => void
  accept: string
  disabled?: boolean
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [drag, setDrag] = useState(false)

  function absorver(files: FileList | null) {
    if (!files || disabled) return
    onArquivos(Array.from(files))
  }

  return (
    <div className={styles.dropMultiWrap}>
      <div
        className={`${styles.dropZone} ${drag ? styles.dragging : ''} ${disabled ? styles.dropDisabled : ''}`}
        onClick={() => !disabled && inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); if (!disabled) setDrag(true) }}
        onDragLeave={() => setDrag(false)}
        onDrop={e => { e.preventDefault(); setDrag(false); absorver(e.dataTransfer.files) }}
      >
        <input ref={inputRef} type="file" accept={accept} multiple style={{ display: 'none' }} onChange={e => absorver(e.target.files)} />
        <div className={styles.dropHint}>
          <i className="fa-solid fa-cloud-arrow-up" />
          <span>Arraste arquivos CSV aqui ou <strong>clique para selecionar</strong></span>
          <small style={{ color: 'var(--gray-400)', fontSize: 11 }}>Múltiplos arquivos permitidos</small>
        </div>
      </div>

      {arquivos.length > 0 && (
        <div className={styles.fileList}>
          {arquivos.map((f, i) => (
            <div key={f.name} className={styles.fileListItem}>
              <i className="fa-solid fa-file-csv" style={{ color: '#16a34a' }} />
              <span className={styles.fileName}>{f.name}</span>
              <span className={styles.fileSize}>{(f.size / 1024 / 1024).toFixed(2)} MB</span>
              {!disabled && (
                <button className={styles.fileRemove} onClick={() => onRemover(i)} title="Remover">
                  <i className="fa-solid fa-xmark" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function FilaProgresso({ fila }: { fila: ItemFila[] }) {
  return (
    <div className={styles.filaWrap}>
      {fila.map((item, i) => (
        <div key={item.arquivo.name} className={styles.filaItem}>
          <div className={styles.filaItemHd}>
            {item.status === 'ok'       && <i className="fa-solid fa-circle-check" style={{ color: '#16a34a' }} />}
            {item.status === 'erro'     && <i className="fa-solid fa-circle-xmark" style={{ color: '#dc2626' }} />}
            {item.status === 'enviando' && <i className="fa-solid fa-spinner fa-spin" style={{ color: '#2552e8' }} />}
            {item.status === 'aguardando' && <i className="fa-regular fa-clock" style={{ color: '#94a3b8' }} />}
            <span className={styles.filaItemNome}>{item.arquivo.name}</span>
            <span className={styles.filaItemNum}>#{i + 1}</span>
          </div>
          {item.status === 'enviando' && item.progresso && (
            <BarraProgresso progresso={item.progresso} />
          )}
          {item.status === 'ok' && item.resultado && (
            <div className={styles.filaItemOk}>
              {item.resultado.inseridos?.toLocaleString('pt-BR')} inseridos
              {item.resultado.candidatos_criados ? ` · ${item.resultado.candidatos_criados} candidatos` : ''}
              {item.resultado.sem_ibge ? ` · ${item.resultado.sem_ibge} sem IBGE` : ''}
            </div>
          )}
          {item.status === 'erro' && (
            <div className={styles.filaItemErro}>{item.erro}</div>
          )}
        </div>
      ))}
    </div>
  )
}

function BotaoEnviar({ arquivo, estado, onEnviar, onReset }: {
  arquivo: File | null
  estado: EstadoImport
  onEnviar: () => void
  onReset: () => void
}) {
  if (estado.status === 'ok') {
    return (
      <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={onReset}>
        <i className="fa-solid fa-rotate-left" /> Nova importação
      </button>
    )
  }
  return (
    <button
      className={`${styles.btn} ${styles.btnPrimary}`}
      disabled={!arquivo || estado.status === 'enviando'}
      onClick={onEnviar}
    >
      {estado.status === 'enviando'
        ? <><i className="fa-solid fa-spinner fa-spin" /> Importando…</>
        : <><i className="fa-solid fa-file-import" /> Iniciar importação</>
      }
    </button>
  )
}

function ResultadoCard({ resultado }: { resultado: ImportUpdate }) {
  return (
    <div className={styles.resultadoCard}>
      <div className={styles.resultadoHd}>
        <i className="fa-solid fa-circle-check" style={{ color: '#16a34a' }} />
        <span>Importação concluída</span>
      </div>
      {resultado.aviso && <div className={styles.resultadoAviso}>{resultado.aviso}</div>}
      <div className={styles.resultadoStats}>
        <Stat icone="fa-database" label="Registros inseridos" valor={(resultado.inseridos ?? 0).toLocaleString('pt-BR')} />
        {resultado.candidatos_criados !== undefined && (
          <Stat icone="fa-user-tie" label="Candidatos criados" valor={resultado.candidatos_criados.toLocaleString('pt-BR')} />
        )}
        {!!resultado.sem_ibge && (
          <Stat icone="fa-triangle-exclamation" label="Municípios sem IBGE" valor={resultado.sem_ibge.toLocaleString('pt-BR')} cor="#b45309" />
        )}
        {resultado.total_processadas !== undefined && (
          <Stat icone="fa-file-lines" label="Linhas processadas" valor={resultado.total_processadas.toLocaleString('pt-BR')} />
        )}
        {resultado.descricao && (
          <Stat icone="fa-calendar" label="Eleição" valor={resultado.descricao} />
        )}
      </div>
      {resultado.turnos && Object.keys(resultado.turnos).length > 0 && (
        <div className={styles.turnos}>
          {Object.entries(resultado.turnos).map(([turno, id]) => (
            <div key={turno} className={styles.turnoItem}>
              <span>Turno {turno}</span><code>{id}</code>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function Stat({ icone, label, valor, cor }: { icone: string; label: string; valor: string; cor?: string }) {
  return (
    <div className={styles.stat}>
      <i className={`fa-solid ${icone}`} style={cor ? { color: cor } : undefined} />
      <div>
        <div className={styles.statLabel}>{label}</div>
        <div className={styles.statValor} style={cor ? { color: cor } : undefined}>{valor}</div>
      </div>
    </div>
  )
}

function ErroCard({ erro, onReset }: { erro: string; onReset: () => void }) {
  return (
    <div className={styles.erroCard}>
      <div className={styles.erroHd}>
        <i className="fa-solid fa-circle-xmark" />
        <span>Erro na importação</span>
      </div>
      <div className={styles.erroMsg}>{erro}</div>
      <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={onReset}>
        <i className="fa-solid fa-rotate-left" /> Tentar novamente
      </button>
    </div>
  )
}


