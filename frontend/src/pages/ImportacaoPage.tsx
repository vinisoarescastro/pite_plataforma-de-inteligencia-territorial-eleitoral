import { useState, useRef, useEffect, useCallback, type DragEvent } from 'react'
import type { PageId } from './HomePage'
import styles from './ImportacaoPage.module.css'
import {
  importarMunicipios,
  importarResultados,
  importarSecoes,
  getStatusImportacao,
  getHistoricoImportacao,
  type ImportUpdate,
  type StatusEleicao,
  type ImportacaoLogItem,
} from '../services/importacao'

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

export default function ImportacaoPage({ onNavigate }: { onNavigate?: (page: PageId) => void }) {
  const [aba, setAba] = useState<Aba>('resultados')
  const [modoAvancado, setModoAvancado] = useState(false)
  const [status, setStatus] = useState<StatusEleicao[]>([])
  const [carregandoStatus, setCarregandoStatus] = useState(true)
  const [erroStatus, setErroStatus] = useState<string | null>(null)
  const [historico, setHistorico] = useState<ImportacaoLogItem[]>([])
  const [showHistorico, setShowHistorico] = useState(false)

  const recarregarStatus = useCallback(() => {
    setCarregandoStatus(true)
    setErroStatus(null)
    getStatusImportacao()
      .then(setStatus)
      .catch(e => setErroStatus(e.message ?? 'Erro ao carregar status'))
      .finally(() => setCarregandoStatus(false))
    getHistoricoImportacao()
      .then(setHistorico)
      .catch(() => {})
  }, [])

  useEffect(() => { recarregarStatus() }, [recarregarStatus])

  return (
    <div className={styles.page}>
      <div className={styles.ph}>
        <div>
          <div className={styles.phTitle}>Importação de Dados</div>
          <div className={styles.phSub}>Importe arquivos CSV do TSE para o banco de dados da plataforma</div>
        </div>
        <button
          className={`${styles.btn} ${modoAvancado ? styles.btnActive : styles.btnSecondary}`}
          onClick={() => setModoAvancado(v => !v)}
          title="Exibe os comandos CLI equivalentes"
        >
          <i className="fa-solid fa-terminal" /> Modo CLI
        </button>
      </div>

      <PainelStatus status={status} carregando={carregandoStatus} erro={erroStatus} onRecarregar={recarregarStatus} onVerEleicoes={onNavigate ? () => onNavigate('eleicoes') : undefined} />

      {historico.length > 0 && (
        <PainelHistorico
          historico={historico}
          aberto={showHistorico}
          onToggle={() => setShowHistorico(v => !v)}
        />
      )}

      <div className={styles.tabs}>
        <button className={`${styles.tab} ${aba === 'resultados' ? styles.tabActive : ''}`} onClick={() => setAba('resultados')}>
          <i className="fa-solid fa-chart-bar" /> Resultados por município
        </button>
        <button className={`${styles.tab} ${aba === 'secoes' ? styles.tabActive : ''}`} onClick={() => setAba('secoes')}>
          <i className="fa-solid fa-layer-group" /> Votação por seção
        </button>
        <button className={`${styles.tab} ${aba === 'municipios' ? styles.tabActive : ''}`} onClick={() => setAba('municipios')}>
          <i className="fa-solid fa-map-location-dot" /> Municípios TSE ↔ IBGE
        </button>
      </div>

      <div className={styles.content}>
        {aba === 'resultados' && <AbaResultados modoAvancado={modoAvancado} onImportado={recarregarStatus} />}
        {aba === 'secoes'     && <AbaSecoes     modoAvancado={modoAvancado} onImportado={recarregarStatus} />}
        {aba === 'municipios' && <AbaMunicipios  modoAvancado={modoAvancado} onImportado={recarregarStatus} />}
      </div>
    </div>
  )
}

// ── Painel de status ───────────────────────────────────────────────────────

function PainelStatus({ status, carregando, erro, onRecarregar, onVerEleicoes }: {
  status: StatusEleicao[]
  carregando: boolean
  erro: string | null
  onRecarregar: () => void
  onVerEleicoes?: () => void
}) {
  if (carregando) return null

  if (erro) {
    return (
      <div className={styles.statusPanel}>
        <i className="fa-solid fa-circle-exclamation" style={{ color: '#dc2626' }} />
        <span style={{ color: '#dc2626' }}>{erro}</span>
        <button className={styles.statusRefresh} onClick={onRecarregar} title="Tentar novamente">
          <i className="fa-solid fa-rotate-right" /> Tentar novamente
        </button>
      </div>
    )
  }

  if (status.length === 0) {
    return (
      <div className={styles.statusPanel}>
        <i className="fa-solid fa-database" style={{ color: '#94a3b8' }} />
        <span style={{ color: '#64748b' }}>Nenhuma eleição importada ainda.</span>
      </div>
    )
  }

  return (
    <div className={styles.statusPanel}>
      <div className={styles.statusHd}>
        <span><i className="fa-solid fa-database" /> Dados no banco</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {onVerEleicoes && (
            <button className={`${styles.btn} ${styles.btnSecondary}`} style={{ height: 28, fontSize: 12, padding: '0 10px' }} onClick={onVerEleicoes}>
              <i className="fa-solid fa-arrow-up-right-from-square" /> Ver eleições
            </button>
          )}
          <button className={styles.statusRefresh} onClick={onRecarregar} title="Atualizar" disabled={carregando}>
            <i className={`fa-solid fa-rotate-right ${carregando ? 'fa-spin' : ''}`} />
          </button>
        </div>
      </div>
      <div className={styles.statusGrid}>
        {status.map(s => (
          <div key={s.eleicao_id} className={styles.statusCard}>
            <div className={styles.statusCardTitle}>{s.descricao}</div>
            {s.registros > 0 && (
              <div className={styles.statusCardSection}>
                <span className={styles.statusCardLabel}>Resultados por município</span>
                <div className={styles.statusCardStats}>
                  <span title="Estados importados">
                    <i className="fa-solid fa-map" /> {s.estados} <em>estados</em>
                  </span>
                  <span title="Municípios com dados">
                    <i className="fa-solid fa-city" /> {s.municipios.toLocaleString('pt-BR')} <em>municípios</em>
                  </span>
                  <span title="Registros na tabela">
                    <i className="fa-solid fa-table" /> {s.registros.toLocaleString('pt-BR')} <em>registros</em>
                  </span>
                </div>
              </div>
            )}
            {s.secoes_registros > 0 && (
              <div className={styles.statusCardSection}>
                <span className={styles.statusCardLabel}>Votação por seção</span>
                <div className={styles.statusCardStats}>
                  <span title="Municípios com seções">
                    <i className="fa-solid fa-city" /> {s.secoes_municipios.toLocaleString('pt-BR')} <em>municípios</em>
                  </span>
                  <span title="Total de votos">
                    <i className="fa-solid fa-ballot-check" /> {s.secoes_votos.toLocaleString('pt-BR')} <em>votos</em>
                  </span>
                  <span title="Registros de seção">
                    <i className="fa-solid fa-layer-group" /> {s.secoes_registros.toLocaleString('pt-BR')} <em>registros</em>
                  </span>
                </div>
              </div>
            )}
            {s.registros === 0 && s.secoes_registros === 0 && (
              <div className={styles.statusCardEmpty}>Nenhum dado importado</div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Aba: Resultados por município ──────────────────────────────────────────

type ItemFila = { arquivo: File; status: 'aguardando' | 'enviando' | 'ok' | 'erro'; progresso?: Progresso; resultado?: ImportUpdate; erro?: string }

function AbaResultados({ modoAvancado, onImportado }: { modoAvancado: boolean; onImportado: () => void }) {
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

  const cmdCli = `python scripts/importar_resultados_tse.py \\
  --arquivo arquivo.csv \\
  --ano ${ano} --turno ${turno} --tipo ${tipo}${candidato ? ` \\\n  --candidato "${candidato}"` : ''}`

  const tudo_ok   = fila.length > 0 && fila.every(it => it.status === 'ok')
  const tem_erro  = fila.some(it => it.status === 'erro')

  return (
    <div className={styles.card}>
      <div className={styles.cardHd}>
        <div className={styles.cardIcon} style={{ background: '#eff4ff', color: '#2552e8' }}>
          <i className="fa-solid fa-chart-bar" />
        </div>
        <div>
          <div className={styles.cardTitle}>Resultados Eleitorais por Município</div>
          <div className={styles.cardSub}>
            Arquivo: <code>votacao_candidato_munzona_YYYY.csv</code> — encoding latin1, separador ponto-e-vírgula
          </div>
        </div>
      </div>

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

      {modoAvancado && <BlocoCliCard cmd={cmdCli} />}
    </div>
  )
}

// ── Aba: Votação por seção ─────────────────────────────────────────────────

function AbaSecoes({ modoAvancado, onImportado }: { modoAvancado: boolean; onImportado: () => void }) {
  const [arquivos, setArquivos] = useState<File[]>([])
  const [ano, setAno]           = useState<number | ''>(new Date().getFullYear())
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

  const cmdCli = `python scripts/importar_votacao_secao.py \\
  --arquivo VOTACAO_SECAO_YYYY_UF.csv${ano ? ` \\\n  --ano ${ano}` : ''}${tipo ? ` \\\n  --tipo ${tipo}` : ''}${cargo ? ` \\\n  --cargo "${cargo}"` : ''}${votavel ? ` \\\n  --votavel "${votavel}"` : ''}`

  return (
    <div className={styles.card}>
      <div className={styles.cardHd}>
        <div className={styles.cardIcon} style={{ background: '#f0fdf4', color: '#1a7a4a' }}>
          <i className="fa-solid fa-layer-group" />
        </div>
        <div>
          <div className={styles.cardTitle}>Votação por Seção Eleitoral</div>
          <div className={styles.cardSub}>
            Arquivo: <code>VOTACAO_SECAO_YYYY_UF.csv</code> — dados granulares por zona/seção/local
          </div>
        </div>
      </div>

      <div className={styles.aviso}>
        <i className="fa-solid fa-triangle-exclamation" />
        <span>
          Arquivos de seção podem ser muito grandes (centenas de MB). Para arquivos acima de 100 MB,
          recomenda-se usar o <strong>modo CLI</strong> diretamente no servidor.
        </span>
      </div>

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

      {modoAvancado && <BlocoCliCard cmd={cmdCli} />}
    </div>
  )
}

// ── Aba: Municípios ────────────────────────────────────────────────────────

function AbaMunicipios({ modoAvancado, onImportado }: { modoAvancado: boolean; onImportado: () => void }) {
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
      <div className={styles.cardHd}>
        <div className={styles.cardIcon} style={{ background: '#fdf4ff', color: '#9333ea' }}>
          <i className="fa-solid fa-map-location-dot" />
        </div>
        <div>
          <div className={styles.cardTitle}>Tabela de Municípios TSE ↔ IBGE</div>
          <div className={styles.cardSub}>
            Arquivo: <code>municipio_tse_ibge.csv</code> — pré-requisito para as demais importações
          </div>
        </div>
      </div>

      <div className={styles.aviso} style={{ background: '#f0fdf4', borderColor: '#bbf7d0', color: '#166534' }}>
        <i className="fa-solid fa-circle-info" />
        <span>Esta tabela deve ser importada <strong>antes das demais</strong>. Ela vincula os códigos TSE com os códigos IBGE usados no mapa.</span>
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

      {modoAvancado && <BlocoCliCard cmd="python scripts/importar_municipios_tse.py" />}
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

// ── Painel de histórico ────────────────────────────────────────────────────

const TIPO_ICONE: Record<string, string> = {
  secoes:     'fa-layer-group',
  resultados: 'fa-chart-bar',
  municipios: 'fa-map-location-dot',
}
const TIPO_COR: Record<string, string> = {
  secoes:     '#1a7a4a',
  resultados: '#2552e8',
  municipios: '#9333ea',
}

function PainelHistorico({ historico, aberto, onToggle }: {
  historico: ImportacaoLogItem[]
  aberto: boolean
  onToggle: () => void
}) {
  const sucessos = historico.filter(h => h.status === 'sucesso').length
  const erros    = historico.filter(h => h.status === 'erro').length

  return (
    <div className={styles.historicoWrap}>
      <button className={styles.historicoToggle} onClick={onToggle}>
        <i className={`fa-solid fa-chevron-right ${aberto ? styles.chevronDown : ''}`} />
        <i className="fa-solid fa-clock-rotate-left" />
        Histórico de importações
        <span className={styles.historicoBadge}>{historico.length}</span>
        {sucessos > 0 && <span className={styles.historicoBadgeSucesso}>{sucessos} ok</span>}
        {erros    > 0 && <span className={styles.historicoBadgeErro}>{erros} erro{erros > 1 ? 's' : ''}</span>}
      </button>

      {aberto && (
        <div className={styles.historicoTabela}>
          <table className={styles.htabela}>
            <thead>
              <tr>
                <th>Data/hora</th>
                <th>Tipo</th>
                <th>Arquivo</th>
                <th>Status</th>
                <th>Inseridos</th>
                <th>Linhas</th>
                <th>Duração</th>
                <th>Detalhes</th>
              </tr>
            </thead>
            <tbody>
              {historico.map(h => {
                const data = h.criado_em ? new Date(h.criado_em).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '—'
                const cor  = TIPO_COR[h.tipo] ?? '#64748b'
                const ico  = TIPO_ICONE[h.tipo] ?? 'fa-file'
                return (
                  <tr key={h.id} className={h.status === 'erro' ? styles.hrowErro : ''}>
                    <td className={styles.htdData}>{data}</td>
                    <td>
                      <span className={styles.htipo} style={{ color: cor }}>
                        <i className={`fa-solid ${ico}`} /> {h.tipo}
                      </span>
                    </td>
                    <td className={styles.htdArquivo} title={h.arquivo ?? ''}>
                      {h.arquivo ? h.arquivo.split(/[\\/]/).pop() : '—'}
                    </td>
                    <td>
                      {h.status === 'sucesso'
                        ? <span className={styles.hstatusOk}><i className="fa-solid fa-circle-check" /> sucesso</span>
                        : <span className={styles.hstatusErro}><i className="fa-solid fa-circle-xmark" /> erro</span>
                      }
                    </td>
                    <td className={styles.htdNum}>{h.inseridos != null ? h.inseridos.toLocaleString('pt-BR') : '—'}</td>
                    <td className={styles.htdNum}>{h.processadas != null ? h.processadas.toLocaleString('pt-BR') : '—'}</td>
                    <td className={styles.htdNum}>{h.duracao_s != null ? `${h.duracao_s}s` : '—'}</td>
                    <td className={styles.htdMsg} title={h.mensagem ?? ''}>{h.mensagem ? h.mensagem.slice(0, 60) + (h.mensagem.length > 60 ? '…' : '') : '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function BlocoCliCard({ cmd }: { cmd: string }) {
  const [copiado, setCopiado] = useState(false)

  function copiar() {
    navigator.clipboard.writeText(cmd)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  return (
    <div className={styles.cliCard}>
      <div className={styles.cliHd}>
        <i className="fa-solid fa-terminal" />
        <span>Comando CLI equivalente</span>
        <button className={styles.cliCopy} onClick={copiar}>
          {copiado ? <><i className="fa-solid fa-check" /> Copiado!</> : <><i className="fa-solid fa-copy" /> Copiar</>}
        </button>
      </div>
      <pre className={styles.cliPre}>{cmd}</pre>
    </div>
  )
}
