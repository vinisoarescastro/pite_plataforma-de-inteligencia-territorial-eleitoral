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
  return PARTIDO_CORES[sg?.toUpperCase() ?? ''] ?? '#6b7280'
}

const TIPO_COR: Record<string, string> = {
  municipal: '#0369a1',
  federal:   '#7c3aed',
  estadual:  '#b45309',
}
const TIPO_LABEL: Record<string, string> = {
  municipal: 'Mun',
  federal:   'Fed',
  estadual:  'Est',
}

interface Props { isAdmin: boolean }

export default function CandidatosPage({ isAdmin }: Props) {
  const [candidatos, setCandidatos]         = useState<Candidato[]>([])
  const [carregando, setCarregando]         = useState(true)
  const [erro, setErro]                     = useState('')
  const [busca, setBusca]                   = useState('')
  const [filtroUf, setFiltroUf]             = useState('')
  const [filtroPartido, setFiltroPartido]   = useState('')
  const [filtroCargo, setFiltroCargo]       = useState('')
  const [modal, setModal]                   = useState<'novo' | Candidato | null>(null)
  const [modalCandidatura, setModalCandidatura] = useState<Candidato | null>(null)
  const [candidaturas, setCandidaturas]     = useState<Record<string, Candidatura[]>>({})
  const [candidaturasOk, setCandidaturasOk] = useState(false)
  const [expandido, setExpandido]           = useState<string | null>(null)
  const [excluindo, setExcluindo]           = useState<string | null>(null)
  const [toast, setToast]                   = useState('')

  useEffect(() => {
    setCarregando(true)
    listarCandidatos()
      .then(lista => {
        setCandidatos(lista)
        Promise.all(
          lista.map(c =>
            listarCandidaturas(c.id)
              .then(cands => [c.id, cands] as const)
              .catch(() => [c.id, []] as const)
          )
        ).then(res => {
          setCandidaturas(Object.fromEntries(res))
          setCandidaturasOk(true)
        })
      })
      .catch(e => setErro(e.message))
      .finally(() => setCarregando(false))
  }, [])

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  const ufs      = useMemo(() => [...new Set(candidatos.map(c => c.sg_uf).filter(Boolean))].sort() as string[], [candidatos])
  const partidos = useMemo(() => [...new Set(candidatos.map(c => c.sg_partido).filter(Boolean))].sort() as string[], [candidatos])
  const cargos   = useMemo(() => [...new Set(candidatos.map(c => c.cargo).filter(Boolean))].sort() as string[], [candidatos])

  const filtrados = useMemo(() => {
    const q = busca.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    return candidatos.filter(c => {
      const nome = (c.nm_candidato + ' ' + (c.sg_partido ?? '') + ' ' + (c.nr_candidato ?? ''))
        .toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
      if (q && !nome.includes(q)) return false
      if (filtroUf      && c.sg_uf      !== filtroUf)     return false
      if (filtroPartido && c.sg_partido !== filtroPartido) return false
      if (filtroCargo   && c.cargo      !== filtroCargo)   return false
      return true
    })
  }, [candidatos, busca, filtroUf, filtroPartido, filtroCargo])

  async function handleSalvar(payload: CandidatoPayload) {
    if (modal === 'novo') {
      const novo = await criarCandidato(payload)
      setCandidatos(prev => [novo, ...prev])
      setCandidaturas(prev => ({ ...prev, [novo.id]: [] }))
      showToast('Candidato criado com sucesso.')
    } else if (modal && typeof modal === 'object') {
      const atualizado = await atualizarCandidato(modal.id, payload)
      setCandidatos(prev => prev.map(c => c.id === atualizado.id ? atualizado : c))
      showToast('Candidato atualizado.')
    }
    setModal(null)
  }

  async function handleSalvarCandidatura(payload: CandidaturaPayload) {
    const nova = await criarCandidatura(payload)
    setCandidaturas(prev => ({
      ...prev,
      [payload.candidato_id]: [nova, ...(prev[payload.candidato_id] ?? [])],
    }))
    setModalCandidatura(null)
    setExpandido(payload.candidato_id)
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
      <div className={styles.ph}>
        <div>
          <div className={styles.phTitle}>Candidatos</div>
          <div className={styles.phSub}>
            {carregando ? 'Carregando…' : `${candidatos.length} candidato${candidatos.length !== 1 ? 's' : ''}`}
          </div>
        </div>
        {isAdmin && (
          <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => setModal('novo')}>
            <i className="fa-solid fa-plus" /> Novo candidato
          </button>
        )}
      </div>

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
          {temFiltro && <div className={styles.resultCount}>{filtrados.length} resultado{filtrados.length !== 1 ? 's' : ''}</div>}
          <div className={styles.grid}>
            {filtrados.map(c => (
              <CandidatoCard
                key={c.id}
                candidato={c}
                isAdmin={isAdmin}
                excluindo={excluindo === c.id}
                expandido={expandido === c.id}
                candidaturas={candidaturasOk ? (candidaturas[c.id] ?? []) : null}
                onEditar={() => setModal(c)}
                onExcluir={() => handleExcluir(c)}
                onToggle={() => setExpandido(prev => prev === c.id ? null : c.id)}
                onVincular={() => setModalCandidatura(c)}
                onExcluirCandidatura={(cid) => handleExcluirCandidatura(c.id, cid)}
              />
            ))}
          </div>
        </>
      )}

      {modal !== null && (
        <ModalCandidato
          candidato={modal === 'novo' ? null : modal}
          onSalvar={handleSalvar}
          onFechar={() => setModal(null)}
        />
      )}

      {modalCandidatura && (
        <ModalCandidatura
          candidato={modalCandidatura}
          onSalvar={handleSalvarCandidatura}
          onFechar={() => setModalCandidatura(null)}
        />
      )}

      {toast && (
        <div className={styles.toast}>
          <i className="fa-solid fa-circle-check" /> {toast}
        </div>
      )}
    </div>
  )
}

// ── Card ─────────────────────────────────────────────────────────
function CandidatoCard({ candidato: c, isAdmin, excluindo, expandido, candidaturas, onEditar, onExcluir, onToggle, onVincular, onExcluirCandidatura }: {
  candidato: Candidato
  isAdmin: boolean
  excluindo: boolean
  expandido: boolean
  candidaturas: Candidatura[] | null   // null = ainda carregando
  onEditar: () => void
  onExcluir: () => void
  onToggle: () => void
  onVincular: () => void
  onExcluirCandidatura: (id: string) => void
}) {
  const cor = corPartido(c.sg_partido)
  const iniciais = c.nm_candidato.split(' ').filter(Boolean).slice(0, 2).map(p => p[0]).join('').toUpperCase()
  const temCands = candidaturas !== null && candidaturas.length > 0

  return (
    <div className={`${styles.card} ${expandido ? styles.cardExpanded : ''}`}>
      {/* ── Cabeçalho ── */}
      <div className={styles.cardHd}>
        <div className={styles.avatar} style={{ background: cor + '1a', color: cor, borderColor: cor + '33' }}>
          {iniciais}
        </div>
        <div className={styles.cardInfo}>
          <div className={styles.cardNome}>{c.nm_candidato}</div>
          <div className={styles.cardMeta}>
            {c.sg_partido && (
              <span className={styles.badgePartido} style={{ background: cor + '15', color: cor, borderColor: cor + '40' }}>
                {c.sg_partido}
              </span>
            )}
            {c.sg_uf && <span className={styles.badgeUf}>{c.sg_uf}</span>}
            {c.nr_candidato && <span className={styles.metaNum}>Nº {c.nr_candidato}</span>}
          </div>
        </div>
      </div>

      {/* ── Cargo ── */}
      {c.cargo && (
        <div className={styles.cardCargo}>
          <i className="fa-solid fa-briefcase fa-xs" />
          {c.cargo}
        </div>
      )}

      {/* ── Eleições ── */}
      <div className={styles.eleicoes}>
        <div className={styles.eleicoesTitulo}>
          <i className="fa-solid fa-landmark fa-xs" />
          <span>Eleições</span>
          {candidaturas !== null && candidaturas.length > 0 && (
            <span className={styles.eleicoesCont}>{candidaturas.length}</span>
          )}
        </div>

        {candidaturas === null ? (
          <div className={styles.eleicoesSkel}>
            <span /><span /><span />
          </div>
        ) : candidaturas.length === 0 ? (
          <div className={styles.semEleicoes}>
            <span>Nenhuma eleição vinculada</span>
            {isAdmin && (
              <button className={styles.btnAddInline} onClick={onVincular} title="Vincular eleição">
                <i className="fa-solid fa-plus fa-xs" /> Vincular
              </button>
            )}
          </div>
        ) : (
          <div className={styles.eleicoesPills}>
            {candidaturas.map(ct => {
              const ano  = ct.eleicao?.ano
              const tipo = ct.eleicao?.tipo ?? ''
              const corTipo = TIPO_COR[tipo] ?? '#6b7280'
              const labelTipo = TIPO_LABEL[tipo] ?? tipo
              return (
                <span key={ct.id} className={styles.eleicaoPill} style={{ background: corTipo + '12', borderColor: corTipo + '30', color: corTipo }}>
                  {ano ?? '?'}
                  {labelTipo && <em>{labelTipo}</em>}
                </span>
              )
            })}
            {isAdmin && (
              <button className={styles.pillAdd} onClick={onVincular} title="Vincular outra eleição">
                <i className="fa-solid fa-plus fa-xs" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Detalhe expandido ── */}
      {temCands && (
        <button className={styles.detalheToggle} onClick={onToggle}>
          <i className={`fa-solid fa-chevron-${expandido ? 'up' : 'down'} fa-xs`} />
          {expandido ? 'Ocultar detalhes' : 'Ver detalhes'}
        </button>
      )}

      {expandido && candidaturas && (
        <div className={styles.detalheList}>
          {candidaturas.map(ct => (
            <div key={ct.id} className={styles.detalheItem}>
              <div className={styles.detalheItemInfo}>
                <span className={styles.detalheAno} style={{ color: TIPO_COR[ct.eleicao?.tipo ?? ''] ?? '#6b7280' }}>
                  {ct.eleicao?.ano ?? '—'}
                  <small>{TIPO_LABEL[ct.eleicao?.tipo ?? ''] ?? ''}</small>
                </span>
                <div className={styles.detalheDesc}>
                  <span>{ct.ds_cargo ?? ct.nm_votavel ?? '—'}</span>
                  {ct.nr_votavel && <span className={styles.detalheNr}>Nº {ct.nr_votavel}</span>}
                  {ct.situacao   && <span className={styles.detalheSit}>{ct.situacao.replace('_', ' ')}</span>}
                </div>
              </div>
              {isAdmin && (
                <button className={styles.detalheRemover} onClick={() => onExcluirCandidatura(ct.id)} title="Remover vínculo">
                  <i className="fa-solid fa-xmark fa-xs" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Ações ── */}
      {isAdmin && (
        <div className={styles.cardActions}>
          <button className={`${styles.actBtn} ${styles.actBtnEdit}`} onClick={onEditar}>
            <i className="fa-solid fa-pen-to-square fa-xs" /> Editar
          </button>
          <button className={`${styles.actBtn} ${styles.actBtnDel}`} onClick={onExcluir} disabled={excluindo}>
            {excluindo ? <i className="fa-solid fa-spinner fa-spin fa-xs" /> : <i className="fa-solid fa-trash fa-xs" />}
          </button>
        </div>
      )}
    </div>
  )
}
