import { useState, useEffect, useRef } from 'react'
import styles from './ModalCandidatura.module.css'
import { buscarVotavelTSE, type CandidaturaPayload, type VotavelTSE } from '../../services/candidaturas'
import { listarEleicoes, type Eleicao } from '../../services/eleitoral'
import { listarPartidos, type Partido } from '../../services/partidos'
import type { Candidato } from '../../services/candidatos'

const SITUACOES = ['deferida', 'indeferida', 'cassada', 'eleito', 'nao_eleito', 'segundo_turno']

interface Props {
  candidato: Candidato
  onSalvar: (payload: CandidaturaPayload) => Promise<void>
  onFechar: () => void
}

export default function ModalCandidatura({ candidato, onSalvar, onFechar }: Props) {
  const [eleicoes, setEleicoes]         = useState<Eleicao[]>([])
  const [partidos, setPartidos]         = useState<Partido[]>([])
  const [eleicaoId, setEleicaoId]       = useState('')
  const [partidoId, setPartidoId]       = useState('')
  const [busca, setBusca]               = useState('')
  const [buscaTipo, setBuscaTipo]       = useState<'sq' | 'nome'>('nome')
  const [buscando, setBuscando]         = useState(false)
  const [resultados, setResultados]     = useState<VotavelTSE[]>([])
  const [selecionado, setSelecionado]   = useState<VotavelTSE | null>(null)
  const [situacao, setSituacao]         = useState('')
  const [salvando, setSalvando]         = useState(false)
  const [erro, setErro]                 = useState('')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    listarEleicoes().then(setEleicoes).catch(() => {})
    listarPartidos().then(setPartidos).catch(() => {})
  }, [])

  useEffect(() => {
    setSelecionado(null)
    setResultados([])
    setBusca('')
  }, [eleicaoId])

  useEffect(() => {
    if (!eleicaoId || !busca.trim()) { setResultados([]); return }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setBuscando(true)
      try {
        const params = buscaTipo === 'sq'
          ? { sq: parseInt(busca, 10) || undefined }
          : { nome: busca.trim() }
        const res = await buscarVotavelTSE(eleicaoId, params)
        setResultados(res)
      } catch {}
      finally { setBuscando(false) }
    }, 400)
  }, [busca, buscaTipo, eleicaoId])

  async function handleSalvar() {
    if (!eleicaoId) { setErro('Selecione uma eleição.'); return }
    if (!selecionado && !busca) { setErro('Busque e selecione o candidato no TSE.'); return }
    setSalvando(true); setErro('')
    try {
      await onSalvar({
        candidato_id:     candidato.id,
        eleicao_id:       eleicaoId,
        partido_id:       partidoId || undefined,
        sq_candidato_tse: selecionado?.sq_candidato ? parseInt(selecionado.sq_candidato, 10) : undefined,
        nr_votavel:       selecionado?.nr_votavel ?? undefined,
        nm_votavel:       selecionado?.nm_votavel ?? undefined,
        ds_cargo:         selecionado?.ds_cargo   ?? undefined,
        situacao:         situacao || undefined,
      })
    } catch (e: any) {
      setErro(e.message ?? 'Erro ao salvar.')
    } finally {
      setSalvando(false)
    }
  }

  const eleicoesFiltradas = [...eleicoes].sort((a, b) =>
    b.ano - a.ano || a.turno - b.turno
  )

  return (
    <div className={styles.backdrop} onClick={onFechar}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.hd}>
          <div className={styles.hdIcon}><i className="fa-solid fa-link" /></div>
          <div>
            <div className={styles.hdTitle}>Vincular à eleição</div>
            <div className={styles.hdSub}>{candidato.nm_candidato}</div>
          </div>
          <button className={styles.closeBtn} onClick={onFechar}>
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        <div className={styles.body}>
          {/* Passo 1: eleição */}
          <div className={styles.step}>
            <div className={styles.stepLabel}><span className={styles.stepNum}>1</span> Eleição</div>
            <select
              className={styles.select}
              value={eleicaoId}
              onChange={e => setEleicaoId(e.target.value)}
            >
              <option value="">Selecione a eleição…</option>
              {eleicoesFiltradas.map(e => (
                <option key={e.id} value={e.id}>
                  {e.ano} · {e.tipo.charAt(0).toUpperCase() + e.tipo.slice(1)} · {e.turno}º turno
                  {e.descricao ? ` · ${e.descricao}` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Passo 2: busca no TSE */}
          {eleicaoId && (
            <div className={styles.step}>
              <div className={styles.stepLabel}><span className={styles.stepNum}>2</span> Encontrar no TSE</div>

              <div className={styles.buscaTipos}>
                <button
                  className={`${styles.tipBtn} ${buscaTipo === 'nome' ? styles.tipBtnAtivo : ''}`}
                  onClick={() => { setBuscaTipo('nome'); setBusca('') }}
                >Por nome</button>
                <button
                  className={`${styles.tipBtn} ${buscaTipo === 'sq' ? styles.tipBtnAtivo : ''}`}
                  onClick={() => { setBuscaTipo('sq'); setBusca('') }}
                >Por SQ_CANDIDATO</button>
              </div>

              <div className={styles.searchWrap}>
                <i className="fa-solid fa-magnifying-glass fa-xs" style={{ color: 'var(--gray-400)' }} />
                <input
                  className={styles.searchInput}
                  placeholder={buscaTipo === 'nome' ? 'Digite o nome na urna…' : 'SQ_CANDIDATO do TSE…'}
                  value={busca}
                  onChange={e => { setBusca(e.target.value); setSelecionado(null) }}
                  type={buscaTipo === 'sq' ? 'number' : 'text'}
                />
                {buscando && <i className="fa-solid fa-spinner fa-spin fa-xs" style={{ color: 'var(--brand-400)' }} />}
              </div>

              {resultados.length > 0 && !selecionado && (
                <div className={styles.resultList}>
                  {resultados.map(v => (
                    <button
                      key={v.sq_candidato ?? v.nr_votavel}
                      className={styles.resultItem}
                      onClick={() => { setSelecionado(v); setResultados([]) }}
                    >
                      <span className={styles.resultNr}>{v.nr_votavel}</span>
                      <div className={styles.resultInfo}>
                        <span className={styles.resultNome}>{v.nm_votavel}</span>
                        <div className={styles.resultMeta}>
                          {v.ds_cargo && <span className={styles.resultCargo}>{v.ds_cargo}</span>}
                          {v.sq_candidato && <span className={styles.resultSq}>SQ {v.sq_candidato}</span>}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {resultados.length === 0 && busca && !buscando && !selecionado && (
                <div className={styles.semResult}>
                  <i className="fa-solid fa-circle-info fa-xs" /> Nenhum resultado nos dados importados desta eleição.
                </div>
              )}

              {selecionado && (
                <div className={styles.selecionadoBox}>
                  <div className={styles.selecionadoInfo}>
                    <span className={styles.selecionadoNr}>{selecionado.nr_votavel}</span>
                    <div>
                      <div className={styles.selecionadoNome}>{selecionado.nm_votavel}</div>
                      <div className={styles.selecionadoMeta}>
                        {selecionado.ds_cargo && <span className={styles.selecionadoCargo}>{selecionado.ds_cargo}</span>}
                        {selecionado.sq_candidato && <span className={styles.selecionadoSq}>SQ {selecionado.sq_candidato}</span>}
                      </div>
                    </div>
                  </div>
                  <button className={styles.selecionadoClear} onClick={() => { setSelecionado(null); setBusca('') }}>
                    <i className="fa-solid fa-xmark fa-xs" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Passo 3: partido */}
          {eleicaoId && (
            <div className={styles.step}>
              <div className={styles.stepLabel}><span className={styles.stepNum}>3</span> Partido <span className={styles.optional}>(nesta eleição)</span></div>
              <select
                className={styles.select}
                value={partidoId}
                onChange={e => setPartidoId(e.target.value)}
              >
                <option value="">Não informado</option>
                {partidos.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.sigla}{p.nome ? ` — ${p.nome}` : ''}{p.numero ? ` (${p.numero})` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Passo 4: situação */}
          {(selecionado || eleicaoId) && (
            <div className={styles.step}>
              <div className={styles.stepLabel}><span className={styles.stepNum}>4</span> Situação <span className={styles.optional}>(opcional)</span></div>
              <select className={styles.select} value={situacao} onChange={e => setSituacao(e.target.value)}>
                <option value="">Não informada</option>
                {SITUACOES.map(s => (
                  <option key={s} value={s}>{s.replace('_', ' ').replace(/^\w/, c => c.toUpperCase())}</option>
                ))}
              </select>
            </div>
          )}

          {erro && (
            <div className={styles.erro}><i className="fa-solid fa-circle-exclamation" /> {erro}</div>
          )}

          <div className={styles.ft}>
            <button className={`${styles.btn} ${styles.btnSec}`} onClick={onFechar} disabled={salvando}>Cancelar</button>
            <button
              className={`${styles.btn} ${styles.btnPrimary}`}
              onClick={handleSalvar}
              disabled={salvando || !eleicaoId}
            >
              {salvando
                ? <><i className="fa-solid fa-spinner fa-spin" /> Salvando…</>
                : <><i className="fa-solid fa-link" /> Vincular</>
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
