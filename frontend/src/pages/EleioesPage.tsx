import { useState, useEffect, useRef } from 'react'
import {
  listarResumoEleicoes,
  buscarDetalheEleicao,
  excluirEleicao,
  type EleicaoResumo,
  type TurnoResumo,
  type DetalheEleicao,
  type CandidatoResumo,
} from '../services/eleitoral'
import styles from './EleioesPage.module.css'

const UFS_BR = [
  'AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT',
  'PA','PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO',
]

const TIPO_LABEL: Record<string, string> = {
  municipal: 'Municipal', federal: 'Federal', estadual: 'Estadual',
}
const TIPO_COLOR: Record<string, string> = {
  municipal: '#2552e8', federal: '#9333ea', estadual: '#0891b2',
}

type DetalheState = DetalheEleicao | 'loading' | 'error'

export default function EleioesPage() {
  const [eleicoes, setEleicoes] = useState<EleicaoResumo[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [aberto, setAberto] = useState<string | null>(null)
  const [excluindo, setExcluindo] = useState<string | null>(null)
  const [detalhes, setDetalhes] = useState<Record<string, DetalheState>>({})

  function carregar() {
    setCarregando(true)
    listarResumoEleicoes()
      .then(data => {
        setEleicoes(data)
        if (data.length > 0) setAberto(prev => prev ?? `${data[0].ano}-${data[0].tipo}`)
      })
      .catch(e => setErro(e.message))
      .finally(() => setCarregando(false))
  }

  useEffect(() => { carregar() }, [])

  function carregarDetalhe(eleicaoId: string) {
    setDetalhes(prev => ({ ...prev, [eleicaoId]: 'loading' }))
    buscarDetalheEleicao(eleicaoId)
      .then(d  => setDetalhes(prev => ({ ...prev, [eleicaoId]: d })))
      .catch(() => setDetalhes(prev => ({ ...prev, [eleicaoId]: 'error' })))
  }

  function aoExpandir(chave: string, turnos: TurnoResumo[]) {
    const novoAberto = aberto === chave ? null : chave
    setAberto(novoAberto)
    if (novoAberto) {
      for (const t of turnos) {
        if (!detalhes[t.eleicao_id]) carregarDetalhe(t.eleicao_id)
      }
    }
  }

  async function handleExcluir(eleicaoId: string, descricao: string) {
    if (!confirm(`Excluir "${descricao}"?\n\nTodos os resultados e votos vinculados serão removidos permanentemente.`)) return
    setExcluindo(eleicaoId)
    try {
      await excluirEleicao(eleicaoId)
      setDetalhes(prev => { const n = { ...prev }; delete n[eleicaoId]; return n })
      carregar()
    } catch (e: any) {
      alert(`Erro ao excluir: ${e.message}`)
    } finally {
      setExcluindo(null)
    }
  }

  if (carregando) return (
    <div className={styles.page}>
      <PageHeader />
      <BarraCarregamento />
    </div>
  )

  if (erro) return (
    <div className={styles.page}>
      <div className={styles.erroMsg}><i className="fa-solid fa-circle-exclamation" /> {erro}</div>
    </div>
  )

  if (eleicoes.length === 0) return (
    <div className={styles.page}>
      <PageHeader />
      <div className={styles.vazio}><i className="fa-solid fa-box-open" /> Nenhuma eleição cadastrada.</div>
    </div>
  )

  return (
    <div className={styles.page}>
      <PageHeader />
      <div className={styles.lista}>
        {eleicoes.map(el => {
          const chave = `${el.ano}-${el.tipo}`
          const expandido = aberto === chave
          const temT2 = el.turnos.length > 1
          const cor = TIPO_COLOR[el.tipo] ?? '#64748b'
          const totalVotos = el.turnos.reduce((s, t) => s + t.votos_total, 0)

          return (
            <div key={chave} className={styles.card}>
              <div className={styles.cardHeader} onClick={() => aoExpandir(chave, el.turnos)}>
                <div className={styles.cardLeft}>
                  <span className={styles.badge} style={{ background: cor + '18', color: cor }}>
                    {TIPO_LABEL[el.tipo] ?? el.tipo}
                  </span>
                  <span className={styles.cardAno}>{el.ano}</span>
                  {temT2 && <span className={styles.t2Tag}>2 turnos</span>}
                </div>
                <div className={styles.cardRight}>
                  {totalVotos > 0 && (
                    <span className={styles.cardMeta}>
                      <i className="fa-solid fa-check-to-slot" />
                      {totalVotos.toLocaleString('pt-BR')} votos
                    </span>
                  )}
                  <i className={`fa-solid fa-chevron-down ${expandido ? styles.chevronUp : ''}`} />
                </div>
              </div>

              {expandido && (
                <div className={styles.cardBody}>
                  {el.turnos.map(t => (
                    <TurnoPanel
                      key={t.eleicao_id}
                      turno={t}
                      temT2={temT2}
                      cor={cor}
                      detalhe={detalhes[t.eleicao_id]}
                      onRecarregarDetalhe={() => carregarDetalhe(t.eleicao_id)}
                      onExcluir={handleExcluir}
                      excluindo={excluindo}
                    />
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function BarraCarregamento() {
  const [pct, setPct] = useState(0)
  const [elapsed, setElapsed] = useState(0)
  const inicio = useRef(Date.now())

  useEffect(() => {
    const id = setInterval(() => {
      const t = (Date.now() - inicio.current) / 1000
      setElapsed(Math.round(t))
      setPct(Math.min(92, Math.round(92 * (1 - Math.exp(-t / 4)))))
    }, 200)
    return () => clearInterval(id)
  }, [])

  return (
    <div className={styles.loadWrap}>
      <div className={styles.loadTop}>
        <span className={styles.loadLabel}>
          <i className="fa-solid fa-rotate fa-spin" /> Carregando eleições…
        </span>
        <span className={styles.loadPct}>{pct}%</span>
      </div>
      <div className={styles.loadBarTrack}>
        <div className={styles.loadBar} style={{ width: `${pct}%` }} />
      </div>
      <div className={styles.loadSub}>{elapsed}s decorrido{elapsed !== 1 ? 's' : ''}</div>
    </div>
  )
}

function PageHeader() {
  return (
    <div className={styles.ph}>
      <div>
        <div className={styles.phTitle}>Eleições</div>
        <div className={styles.phSub}>Resumo das eleições cadastradas e dados importados por estado</div>
      </div>
    </div>
  )
}

function TurnoPanel({ turno, temT2, cor, detalhe, onRecarregarDetalhe, onExcluir, excluindo }: {
  turno: TurnoResumo
  temT2: boolean
  cor: string
  detalhe: DetalheState | undefined
  onRecarregarDetalhe: () => void
  onExcluir: (id: string, desc: string) => void
  excluindo: string | null
}) {
  const [expandirEstados, setExpandirEstados]       = useState(false)
  const [expandirFaltantes, setExpandirFaltantes]   = useState(false)
  const [expandirCandidatos, setExpandirCandidatos] = useState(false)
  const [filtroCand, setFiltroCand]                 = useState('')

  const temDados      = turno.votos_total > 0 || turno.municipios > 0
  const esteExcluindo = excluindo === turno.eleicao_id

  const detalheOk = detalhe && detalhe !== 'loading' && detalhe !== 'error'
  const por_estado = detalheOk ? detalhe.por_estado : []
  const candidatos = detalheOk ? detalhe.candidatos  : []

  const ufsImportadas = new Set(por_estado.map(e => e.sg_uf))
  const ufsFaltantes  = UFS_BR.filter(uf => !ufsImportadas.has(uf))

  const candidatosFiltrados: CandidatoResumo[] = filtroCand
    ? candidatos.filter(c =>
        c.nm_candidato.toLowerCase().includes(filtroCand.toLowerCase()) ||
        (c.nr_candidato ?? '').includes(filtroCand) ||
        (c.sg_partido ?? '').toLowerCase().includes(filtroCand.toLowerCase())
      )
    : candidatos

  return (
    <div className={styles.turno}>
      {temT2 && (
        <div className={styles.turnoLabel} style={{ color: cor }}>
          <i className="fa-solid fa-circle-dot" /> {turno.turno}º turno
        </div>
      )}

      <div className={styles.turnoActions}>
        <button
          className={styles.btnExcluir}
          onClick={() => onExcluir(turno.eleicao_id, turno.descricao ?? 'esta eleição')}
          disabled={esteExcluindo}
        >
          {esteExcluindo
            ? <><i className="fa-solid fa-spinner fa-spin" /> Excluindo…</>
            : <><i className="fa-solid fa-trash" /> Excluir</>
          }
        </button>
      </div>

      {!temDados ? (
        <div className={styles.semDados}>
          <i className="fa-solid fa-database" style={{ color: '#94a3b8' }} /> Sem dados importados
        </div>
      ) : (
        <>
          <div className={styles.kpis}>
            <Kpi icone="fa-map"           label="Estados"    valor={turno.estados} />
            <Kpi icone="fa-city"          label="Municípios" valor={turno.municipios.toLocaleString('pt-BR')} />
            <Kpi icone="fa-check-to-slot" label="Votos"      valor={turno.votos_total.toLocaleString('pt-BR')} />
          </div>

          {detalhe === 'loading' && (
            <div className={styles.detalheLoading}>
              <i className="fa-solid fa-spinner fa-spin" /> Carregando detalhes…
            </div>
          )}

          {detalhe === 'error' && (
            <div className={styles.detalheErro}>
              <i className="fa-solid fa-circle-exclamation" /> Erro ao carregar detalhes.{' '}
              <button className={styles.detalheRetry} onClick={onRecarregarDetalhe}>
                Tentar novamente
              </button>
            </div>
          )}

          {detalheOk && (
            <>
              {por_estado.length > 0 && (
                <div className={styles.estadosWrap}>
                  <button className={styles.estadosToggle} onClick={() => setExpandirEstados(v => !v)}>
                    <i className={`fa-solid fa-chevron-right ${expandirEstados ? styles.chevronUp : ''}`} />
                    {expandirEstados ? 'Ocultar' : 'Ver'} detalhes por estado ({por_estado.length})
                  </button>
                  {expandirEstados && (
                    <table className={styles.tabela}>
                      <thead><tr><th>Estado</th><th>Municípios</th><th>Votos</th></tr></thead>
                      <tbody>
                        {por_estado.map(e => (
                          <tr key={e.sg_uf}>
                            <td><span className={styles.ufBadge}>{e.sg_uf}</span></td>
                            <td>{e.municipios.toLocaleString('pt-BR')}</td>
                            <td>{e.votos.toLocaleString('pt-BR')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {ufsFaltantes.length > 0 && (
                <div className={styles.estadosWrap}>
                  <button
                    className={styles.estadosToggle}
                    style={{ color: '#b45309' }}
                    onClick={() => setExpandirFaltantes(v => !v)}
                  >
                    <i className={`fa-solid fa-chevron-right ${expandirFaltantes ? styles.chevronUp : ''}`} />
                    <i className="fa-solid fa-triangle-exclamation" />
                    {ufsFaltantes.length} estado{ufsFaltantes.length > 1 ? 's' : ''} sem dados
                  </button>
                  {expandirFaltantes && (
                    <div className={styles.ufsFaltantes}>
                      {ufsFaltantes.map(uf => <span key={uf} className={styles.ufFaltante}>{uf}</span>)}
                    </div>
                  )}
                </div>
              )}

              {turno.total_candidatos > 0 && (
                <div className={styles.estadosWrap}>
                  <button className={styles.estadosToggle} onClick={() => setExpandirCandidatos(v => !v)}>
                    <i className={`fa-solid fa-chevron-right ${expandirCandidatos ? styles.chevronUp : ''}`} />
                    <i className="fa-solid fa-user-tie" />
                    {turno.total_candidatos.toLocaleString('pt-BR')} candidato{turno.total_candidatos !== 1 ? 's' : ''}
                    {turno.total_candidaturas > 0 && (
                      <> · {turno.total_candidaturas.toLocaleString('pt-BR')} candidatura{turno.total_candidaturas !== 1 ? 's' : ''}</>
                    )}
                  </button>
                  {expandirCandidatos && (
                    <div className={styles.candidatosWrap}>
                      <input
                        className={styles.candidatosFiltro}
                        placeholder="Filtrar por nome, número ou partido…"
                        value={filtroCand}
                        onChange={e => setFiltroCand(e.target.value)}
                      />
                      <table className={styles.tabela}>
                        <thead>
                          <tr>
                            <th>Nome</th><th>Nº</th><th>Partido</th>
                            <th>UF</th><th>Cargo</th><th>Votos</th><th>Cand.</th>
                          </tr>
                        </thead>
                        <tbody>
                          {candidatosFiltrados.map(c => (
                            <tr key={c.id}>
                              <td>{c.nm_candidato}</td>
                              <td>{c.nr_candidato ?? '—'}</td>
                              <td>{c.sg_partido ?? '—'}</td>
                              <td>{c.sg_uf ? <span className={styles.ufBadge}>{c.sg_uf}</span> : '—'}</td>
                              <td>{c.cargo ?? '—'}</td>
                              <td>{c.total_votos.toLocaleString('pt-BR')}</td>
                              <td>
                                {c.tem_candidatura
                                  ? <i className="fa-solid fa-check" style={{ color: '#16a34a' }} />
                                  : <i className="fa-solid fa-xmark" style={{ color: '#94a3b8' }} />
                                }
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {turno.total_candidatos > 200 && (
                        <div className={styles.aviso200}>
                          Exibindo os 200 candidatos com mais votos. Use filtro para localizar outros.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}

function Kpi({ icone, label, valor }: { icone: string; label: string; valor: string | number }) {
  return (
    <div className={styles.kpi}>
      <i className={`fa-solid ${icone}`} />
      <div>
        <div className={styles.kpiValor}>{valor}</div>
        <div className={styles.kpiLabel}>{label}</div>
      </div>
    </div>
  )
}
