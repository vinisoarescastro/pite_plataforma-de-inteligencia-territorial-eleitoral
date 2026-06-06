import { useState, useEffect, useMemo } from 'react'
import styles from './CandidatosPage.module.css'
import ModalCandidato from '../components/candidatos/ModalCandidato'
import ModalCandidatura from '../components/candidatos/ModalCandidatura'
import {
  listarCandidatos, criarCandidato, atualizarCandidato, excluirCandidato,
  type Candidato, type CandidatoPayload,
} from '../services/candidatos'
import {
  listarCandidaturas, criarCandidatura, excluirCandidatura,
  type Candidatura, type CandidaturaPayload,
} from '../services/candidaturas'

const PARTIDO_CORES: Record<string, string> = {
  PT:    '#e11d48', PL:    '#1d4ed8', UNIÃO: '#d97706', MDB:   '#7c3aed',
  PP:    '#0891b2', PSD:   '#15803d', PSDB:  '#1e40af', PDT:   '#b45309',
  PODE:  '#6d28d9', PSB:   '#dc2626', PRD:   '#9333ea', AVANTE:'#0369a1',
  SOLID: '#b91c1c', REPUB: '#0f766e', DC:    '#7e22ce',
}
function corPartido(sg: string | null): string {
  if (!sg) return '#6b7280'
  return PARTIDO_CORES[sg.toUpperCase()] ?? '#6b7280'
}

interface Props {
  isAdmin: boolean
}

export default function CandidatosPage({ isAdmin }: Props) {
  const [candidatos, setCandidatos]     = useState<Candidato[]>([])
  const [carregando, setCarregando]     = useState(true)
  const [erro, setErro]                 = useState('')
  const [busca, setBusca]               = useState('')
  const [filtroUf, setFiltroUf]         = useState('')
  const [filtroPartido, setFiltroPartido] = useState('')
  const [filtroCargo, setFiltroCargo]   = useState('')
  const [modal, setModal]                   = useState<'novo' | Candidato | null>(null)
  const [modalCandidatura, setModalCandidatura] = useState<Candidato | null>(null)
  const [candidaturas, setCandidaturas]     = useState<Record<string, Candidatura[]>>({})
  const [expandido, setExpandido]           = useState<string | null>(null)
  const [excluindo, setExcluindo]           = useState<string | null>(null)
  const [toast, setToast]                   = useState('')

  useEffect(() => {
    listarCandidatos()
      .then(setCandidatos)
      .catch(e => setErro(e.message))
      .finally(() => setCarregando(false))
  }, [])

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  // Opções únicas para filtros
  const ufs      = useMemo(() => [...new Set(candidatos.map(c => c.sg_uf).filter(Boolean))].sort() as string[], [candidatos])
  const partidos = useMemo(() => [...new Set(candidatos.map(c => c.sg_partido).filter(Boolean))].sort() as string[], [candidatos])
  const cargos   = useMemo(() => [...new Set(candidatos.map(c => c.cargo).filter(Boolean))].sort() as string[], [candidatos])

  const filtrados = useMemo(() => {
    const q = busca.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    return candidatos.filter(c => {
      const nome = (c.nm_candidato + ' ' + (c.sg_partido ?? '') + ' ' + (c.nr_candidato ?? ''))
        .toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
      if (q && !nome.includes(q)) return false
      if (filtroUf      && c.sg_uf      !== filtroUf)      return false
      if (filtroPartido && c.sg_partido !== filtroPartido)  return false
      if (filtroCargo   && c.cargo      !== filtroCargo)    return false
      return true
    })
  }, [candidatos, busca, filtroUf, filtroPartido, filtroCargo])

  async function handleSalvar(payload: CandidatoPayload) {
    if (modal === 'novo') {
      const novo = await criarCandidato(payload)
      setCandidatos(prev => [novo, ...prev])
      showToast('Candidato criado com sucesso.')
    } else if (modal && typeof modal === 'object') {
      const atualizado = await atualizarCandidato(modal.id, payload)
      setCandidatos(prev => prev.map(c => c.id === atualizado.id ? atualizado : c))
      showToast('Candidato atualizado.')
    }
    setModal(null)
  }

  async function toggleCandidaturas(candidatoId: string) {
    if (expandido === candidatoId) { setExpandido(null); return }
    setExpandido(candidatoId)
    if (!candidaturas[candidatoId]) {
      try {
        const lista = await listarCandidaturas(candidatoId)
        setCandidaturas(prev => ({ ...prev, [candidatoId]: lista }))
      } catch {}
    }
  }

  async function handleSalvarCandidatura(payload: CandidaturaPayload) {
    const nova = await criarCandidatura(payload)
    setCandidaturas(prev => ({
      ...prev,
      [payload.candidato_id]: [nova, ...(prev[payload.candidato_id] ?? [])],
    }))
    setModalCandidatura(null)
    showToast('Candidatura vinculada.')
  }

  async function handleExcluirCandidatura(candidatoId: string, candidaturaId: string) {
    if (!confirm('Remover este vínculo com a eleição?')) return
    await excluirCandidatura(candidaturaId)
    setCandidaturas(prev => ({
      ...prev,
      [candidatoId]: (prev[candidatoId] ?? []).filter(c => c.id !== candidaturaId),
    }))
    showToast('Vínculo removido.')
  }

  async function handleExcluir(c: Candidato) {
    if (!confirm(`Excluir "${c.nm_candidato}"? Esta ação não pode ser desfeita.`)) return
    setExcluindo(c.id)
    try {
      await excluirCandidato(c.id)
      setCandidatos(prev => prev.filter(x => x.id !== c.id))
      showToast('Candidato excluído.')
    } catch (e: any) {
      alert(e.message ?? 'Erro ao excluir.')
    } finally {
      setExcluindo(null)
    }
  }

  const temFiltro = busca || filtroUf || filtroPartido || filtroCargo

  return (
    <div className={styles.page}>
      {/* ── Header ── */}
      <div className={styles.ph}>
        <div>
          <div className={styles.phTitle}>Candidatos</div>
          <div className={styles.phSub}>
            {carregando ? 'Carregando…' : `${candidatos.length} candidato${candidatos.length !== 1 ? 's' : ''} cadastrado${candidatos.length !== 1 ? 's' : ''}`}
          </div>
        </div>
        {isAdmin && (
          <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => setModal('novo')}>
            <i className="fa-solid fa-plus" /> Novo candidato
          </button>
        )}
      </div>

      {/* ── Barra de filtros ── */}
      <div className={styles.filterBar}>
        <div className={styles.searchWrap}>
          <i className="fa-solid fa-magnifying-glass" />
          <input
            className={styles.searchInput}
            placeholder="Buscar por nome, número ou partido…"
            value={busca}
            onChange={e => setBusca(e.target.value)}
          />
          {busca && (
            <button className={styles.searchClear} onClick={() => setBusca('')}>
              <i className="fa-solid fa-xmark" />
            </button>
          )}
        </div>
        <select className={styles.sel} value={filtroUf} onChange={e => setFiltroUf(e.target.value)}>
          <option value="">Todas as UFs</option>
          {ufs.map(uf => <option key={uf} value={uf}>{uf}</option>)}
        </select>
        <select className={styles.sel} value={filtroPartido} onChange={e => setFiltroPartido(e.target.value)}>
          <option value="">Todos os partidos</option>
          {partidos.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <select className={styles.sel} value={filtroCargo} onChange={e => setFiltroCargo(e.target.value)}>
          <option value="">Todos os cargos</option>
          {cargos.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        {temFiltro && (
          <button className={styles.btnLimpar} onClick={() => { setBusca(''); setFiltroUf(''); setFiltroPartido(''); setFiltroCargo('') }}>
            <i className="fa-solid fa-rotate-left fa-xs" /> Limpar
          </button>
        )}
      </div>

      {/* ── Conteúdo ── */}
      {carregando ? (
        <div className={styles.loading}>
          <i className="fa-solid fa-spinner fa-spin" />
          <span>Carregando candidatos…</span>
        </div>
      ) : erro ? (
        <div className={styles.erroBox}>
          <i className="fa-solid fa-circle-exclamation" />
          <span>{erro}</span>
        </div>
      ) : filtrados.length === 0 ? (
        <div className={styles.vazio}>
          <i className="fa-solid fa-user-slash" />
          <span>{temFiltro ? 'Nenhum candidato encontrado para os filtros selecionados.' : 'Nenhum candidato cadastrado.'}</span>
          {isAdmin && !temFiltro && (
            <button className={`${styles.btn} ${styles.btnPrimary} ${styles.btnSm}`} onClick={() => setModal('novo')}>
              <i className="fa-solid fa-plus" /> Cadastrar primeiro candidato
            </button>
          )}
        </div>
      ) : (
        <>
          {temFiltro && (
            <div className={styles.resultCount}>
              {filtrados.length} resultado{filtrados.length !== 1 ? 's' : ''}
            </div>
          )}
          <div className={styles.grid}>
            {filtrados.map(c => (
              <CandidatoCard
                key={c.id}
                candidato={c}
                isAdmin={isAdmin}
                excluindo={excluindo === c.id}
                expandido={expandido === c.id}
                candidaturas={candidaturas[c.id] ?? null}
                onEditar={() => setModal(c)}
                onExcluir={() => handleExcluir(c)}
                onToggleCandidaturas={() => toggleCandidaturas(c.id)}
                onVincular={() => setModalCandidatura(c)}
                onExcluirCandidatura={(cid) => handleExcluirCandidatura(c.id, cid)}
              />
            ))}
          </div>
        </>
      )}

      {/* ── Modal candidato ── */}
      {modal !== null && (
        <ModalCandidato
          candidato={modal === 'novo' ? null : modal}
          onSalvar={handleSalvar}
          onFechar={() => setModal(null)}
        />
      )}

      {/* ── Modal candidatura ── */}
      {modalCandidatura && (
        <ModalCandidatura
          candidato={modalCandidatura}
          onSalvar={handleSalvarCandidatura}
          onFechar={() => setModalCandidatura(null)}
        />
      )}

      {/* ── Toast ── */}
      {toast && (
        <div className={styles.toast}>
          <i className="fa-solid fa-circle-check" /> {toast}
        </div>
      )}
    </div>
  )
}

// ── Card individual ──────────────────────────────────────────────
function CandidatoCard({ candidato: c, isAdmin, excluindo, expandido, candidaturas, onEditar, onExcluir, onToggleCandidaturas, onVincular, onExcluirCandidatura }: {
  candidato: Candidato
  isAdmin: boolean
  excluindo: boolean
  expandido: boolean
  candidaturas: Candidatura[] | null
  onEditar: () => void
  onExcluir: () => void
  onToggleCandidaturas: () => void
  onVincular: () => void
  onExcluirCandidatura: (id: string) => void
}) {
  const cor = corPartido(c.sg_partido)
  const iniciais = c.nm_candidato
    .split(' ').filter(Boolean).slice(0, 2)
    .map(p => p[0]).join('').toUpperCase()

  return (
    <div className={styles.card}>
      <div className={styles.cardHd}>
        <div className={styles.avatar} style={{ background: cor + '22', color: cor }}>
          {iniciais}
        </div>
        <div className={styles.cardInfo}>
          <div className={styles.cardNome}>{c.nm_candidato}</div>
          <div className={styles.cardMeta}>
            {c.sg_partido && (
              <span className={styles.badgePartido} style={{ background: cor + '18', color: cor, borderColor: cor + '44' }}>
                {c.sg_partido}
              </span>
            )}
            {c.sg_uf && <span className={styles.badgeUf}>{c.sg_uf}</span>}
            {c.nr_candidato && <span className={styles.metaNum}>Nº {c.nr_candidato}</span>}
          </div>
        </div>
      </div>

      {c.cargo && (
        <div className={styles.cardCargo}>
          <i className="fa-solid fa-briefcase fa-xs" />
          <span>{c.cargo}</span>
        </div>
      )}

      {c.nm_partido && <div className={styles.cardPartidoNome}>{c.nm_partido}</div>}

      {/* Candidaturas (eleições vinculadas) */}
      <button className={styles.candToggle} onClick={onToggleCandidaturas}>
        <i className={`fa-solid fa-chevron-${expandido ? 'up' : 'down'} fa-xs`} />
        <span>Eleições vinculadas</span>
        {candidaturas !== null && (
          <span className={styles.candCount}>{candidaturas.length}</span>
        )}
      </button>

      {expandido && (
        <div className={styles.candList}>
          {candidaturas === null ? (
            <div className={styles.candLoading}><i className="fa-solid fa-spinner fa-spin fa-xs" /> Carregando…</div>
          ) : candidaturas.length === 0 ? (
            <div className={styles.candVazio}>Nenhuma eleição vinculada.</div>
          ) : (
            candidaturas.map(ct => (
              <div key={ct.id} className={styles.candItem}>
                <div className={styles.candItemInfo}>
                  <span className={styles.candAno}>{ct.eleicao?.ano ?? '—'}</span>
                  <div className={styles.candDetalhe}>
                    <span>{ct.ds_cargo ?? ct.nm_votavel ?? '—'}</span>
                    {ct.nr_votavel && <span className={styles.candNr}>Nº {ct.nr_votavel}</span>}
                    {ct.situacao && <span className={styles.candSit}>{ct.situacao.replace('_', ' ')}</span>}
                  </div>
                </div>
                {isAdmin && (
                  <button className={styles.candDel} onClick={() => onExcluirCandidatura(ct.id)} title="Remover vínculo">
                    <i className="fa-solid fa-xmark fa-xs" />
                  </button>
                )}
              </div>
            ))
          )}
          {isAdmin && (
            <button className={styles.candAdd} onClick={onVincular}>
              <i className="fa-solid fa-plus fa-xs" /> Vincular eleição
            </button>
          )}
        </div>
      )}

      {isAdmin && (
        <div className={styles.cardActions}>
          <button className={`${styles.actBtn} ${styles.actBtnEdit}`} onClick={onEditar}>
            <i className="fa-solid fa-pen-to-square fa-xs" /> Editar
          </button>
          <button
            className={`${styles.actBtn} ${styles.actBtnDel}`}
            onClick={onExcluir}
            disabled={excluindo}
          >
            {excluindo
              ? <i className="fa-solid fa-spinner fa-spin fa-xs" />
              : <i className="fa-solid fa-trash fa-xs" />
            }
          </button>
        </div>
      )}
    </div>
  )
}
