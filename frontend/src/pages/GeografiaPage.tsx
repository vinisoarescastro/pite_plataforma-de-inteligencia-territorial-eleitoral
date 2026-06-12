import { useState, useEffect, useRef } from 'react'
import styles from './GeografiaPage.module.css'
import {
  listarUfsGeo, listarMunicipiosGeo, listarBairros, criarBairro,
  renomearBairro, excluirBairro, listarLocaisBairro, vincularLocal,
  desvincularLocal, buscarLocaisVotacao,
  type MunicipioGeo, type BairroOut, type LocalVotacaoOut,
} from '../services/geo'

// ── Toast ──────────────────────────────────────────────────────
function useToast() {
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null)
  function toast(text: string, ok = true) {
    setMsg({ text, ok })
    setTimeout(() => setMsg(null), 3000)
  }
  return { msg, toast }
}

export default function GeografiaPage() {
  const { msg: toastMsg, toast } = useToast()

  // ── Seletores de contexto ──────────────────────────────────
  const [ufs, setUfs]             = useState<string[]>([])
  const [selectedUf, setSelectedUf] = useState('')
  const [municipios, setMunicipios] = useState<MunicipioGeo[]>([])
  const [selectedMun, setSelectedMun] = useState<MunicipioGeo | null>(null)

  // ── Bairros ────────────────────────────────────────────────
  const [bairros, setBairros]       = useState<BairroOut[]>([])
  const [loadingBairros, setLoadingBairros] = useState(false)
  const [selectedBairro, setSelectedBairro] = useState<BairroOut | null>(null)

  // ── Criar bairro ───────────────────────────────────────────
  const [criando, setCriando]   = useState(false)
  const [novoNome, setNovoNome] = useState('')
  const [salvandoNovo, setSalvandoNovo] = useState(false)

  // ── Renomear bairro ────────────────────────────────────────
  const [editandoId, setEditandoId]   = useState<string | null>(null)
  const [editNome, setEditNome]       = useState('')
  const [salvandoEdit, setSalvandoEdit] = useState(false)

  // ── Excluir bairro ─────────────────────────────────────────
  const [excluindoId, setExcluindoId] = useState<string | null>(null)

  // ── Locais vinculados ──────────────────────────────────────
  const [locaisVinc, setLocaisVinc]     = useState<LocalVotacaoOut[]>([])
  const [loadingLocais, setLoadingLocais] = useState(false)

  // ── Busca de locais disponíveis ────────────────────────────
  const [busca, setBusca]             = useState('')
  const [locaisDisp, setLocaisDisp]   = useState<LocalVotacaoOut[]>([])
  const [loadingBusca, setLoadingBusca] = useState(false)
  const buscarTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Carrega UFs na montagem ────────────────────────────────
  useEffect(() => {
    listarUfsGeo().then(setUfs).catch(() => {})
  }, [])

  // ── Carrega municípios ao trocar UF ───────────────────────
  useEffect(() => {
    setMunicipios([])
    setSelectedMun(null)
    setBairros([])
    setSelectedBairro(null)
    if (!selectedUf) return
    listarMunicipiosGeo(selectedUf).then(setMunicipios).catch(() => {})
  }, [selectedUf])

  // ── Carrega bairros ao trocar município ───────────────────
  useEffect(() => {
    setBairros([])
    setSelectedBairro(null)
    if (!selectedMun) return
    setLoadingBairros(true)
    listarBairros(selectedUf, selectedMun.cd_ibge)
      .then(setBairros)
      .catch(() => toast('Erro ao carregar bairros.', false))
      .finally(() => setLoadingBairros(false))
  }, [selectedMun])

  // ── Carrega locais ao trocar bairro ───────────────────────
  useEffect(() => {
    setLocaisVinc([])
    setLocaisDisp([])
    setBusca('')
    if (!selectedBairro) return
    setLoadingLocais(true)
    listarLocaisBairro(selectedBairro.id)
      .then(setLocaisVinc)
      .catch(() => toast('Erro ao carregar locais vinculados.', false))
      .finally(() => setLoadingLocais(false))
  }, [selectedBairro?.id])

  // ── Busca de locais disponíveis (debounce 300ms) ──────────
  useEffect(() => {
    if (!selectedBairro || !selectedMun) return
    if (buscarTimer.current) clearTimeout(buscarTimer.current)
    buscarTimer.current = setTimeout(() => {
      setLoadingBusca(true)
      buscarLocaisVotacao(selectedUf, selectedMun.cd_tse, busca, selectedBairro.id)
        .then(setLocaisDisp)
        .catch(() => {})
        .finally(() => setLoadingBusca(false))
    }, 300)
    return () => { if (buscarTimer.current) clearTimeout(buscarTimer.current) }
  }, [busca, selectedBairro?.id, selectedMun?.cd_tse])

  // ── Handlers ───────────────────────────────────────────────
  async function handleCriarBairro() {
    if (!novoNome.trim() || !selectedUf || !selectedMun) return
    setSalvandoNovo(true)
    try {
      const novo = await criarBairro({
        nm_bairro: novoNome.trim(),
        sg_uf: selectedUf,
        cd_municipio_ibge: selectedMun.cd_ibge,
        nm_municipio: selectedMun.nm_municipio,
      })
      setBairros(prev => [...prev, novo].sort((a, b) => a.nm_bairro.localeCompare(b.nm_bairro)))
      setNovoNome('')
      setCriando(false)
      setSelectedBairro(novo)
      toast('Bairro criado.')
    } catch (e: unknown) {
      toast(e instanceof Error ? e.message : 'Erro ao criar bairro.', false)
    } finally {
      setSalvandoNovo(false)
    }
  }

  async function handleRenomear(bairro: BairroOut) {
    if (!editNome.trim()) return
    setSalvandoEdit(true)
    try {
      const atualizado = await renomearBairro(bairro.id, editNome.trim(), bairro.sg_uf, bairro.cd_municipio_ibge ?? undefined, bairro.nm_municipio ?? undefined)
      setBairros(prev => prev.map(b => b.id === bairro.id ? { ...atualizado, total_locais: b.total_locais } : b))
      if (selectedBairro?.id === bairro.id) setSelectedBairro(prev => prev ? { ...prev, nm_bairro: atualizado.nm_bairro } : prev)
      setEditandoId(null)
      toast('Bairro renomeado.')
    } catch (e: unknown) {
      toast(e instanceof Error ? e.message : 'Erro ao renomear.', false)
    } finally {
      setSalvandoEdit(false)
    }
  }

  async function handleExcluir(bairro: BairroOut) {
    setExcluindoId(bairro.id)
    try {
      await excluirBairro(bairro.id)
      setBairros(prev => prev.filter(b => b.id !== bairro.id))
      if (selectedBairro?.id === bairro.id) setSelectedBairro(null)
      toast('Bairro excluído.')
    } catch (e: unknown) {
      toast(e instanceof Error ? e.message : 'Erro ao excluir.', false)
    } finally {
      setExcluindoId(null)
    }
  }

  async function handleVincular(local: LocalVotacaoOut) {
    if (!selectedBairro) return
    try {
      await vincularLocal(selectedBairro.id, {
        sg_uf: local.sg_uf,
        cd_municipio_tse: local.cd_municipio_tse,
        nr_local_votacao: local.nr_local_votacao,
        nm_local_votacao: local.nm_local_votacao,
        ds_endereco: local.ds_endereco,
      })
      setLocaisVinc(prev => [...prev, local].sort((a, b) => (a.nm_local_votacao ?? '').localeCompare(b.nm_local_votacao ?? '')))
      setLocaisDisp(prev => prev.filter(l => l.nr_local_votacao !== local.nr_local_votacao))
      setBairros(prev => prev.map(b => b.id === selectedBairro.id ? { ...b, total_locais: b.total_locais + 1 } : b))
      setSelectedBairro(prev => prev ? { ...prev, total_locais: prev.total_locais + 1 } : prev)
      toast(`"${local.nm_local_votacao ?? local.nr_local_votacao}" vinculado.`)
    } catch (e: unknown) {
      toast(e instanceof Error ? e.message : 'Erro ao vincular.', false)
    }
  }

  async function handleDesvincular(local: LocalVotacaoOut) {
    if (!selectedBairro) return
    try {
      await desvincularLocal(selectedBairro.id, local.sg_uf, local.cd_municipio_tse, local.nr_local_votacao)
      setLocaisVinc(prev => prev.filter(l => l.nr_local_votacao !== local.nr_local_votacao))
      setLocaisDisp(prev => [...prev, local].sort((a, b) => (a.nm_local_votacao ?? '').localeCompare(b.nm_local_votacao ?? '')))
      setBairros(prev => prev.map(b => b.id === selectedBairro.id ? { ...b, total_locais: Math.max(0, b.total_locais - 1) } : b))
      setSelectedBairro(prev => prev ? { ...prev, total_locais: Math.max(0, prev.total_locais - 1) } : prev)
      toast(`"${local.nm_local_votacao ?? local.nr_local_votacao}" desvinculado.`)
    } catch (e: unknown) {
      toast(e instanceof Error ? e.message : 'Erro ao desvincular.', false)
    }
  }

  // ── Render ─────────────────────────────────────────────────
  return (
    <div className={styles.page}>

      {/* Seletores de contexto */}
      <div className={styles.contextBar}>
        <div className={styles.ctxGroup}>
          <label className={styles.ctxLabel}>Estado</label>
          <select className={styles.ctxSel} value={selectedUf} onChange={e => setSelectedUf(e.target.value)}>
            <option value="">Selecione…</option>
            {ufs.map(uf => <option key={uf} value={uf}>{uf}</option>)}
          </select>
        </div>
        <div className={styles.ctxGroup}>
          <label className={styles.ctxLabel}>Município</label>
          <select
            className={styles.ctxSel}
            value={selectedMun?.cd_ibge ?? ''}
            onChange={e => setSelectedMun(municipios.find(m => m.cd_ibge === e.target.value) ?? null)}
            disabled={!selectedUf}
          >
            <option value="">Selecione…</option>
            {municipios.map(m => <option key={m.cd_ibge} value={m.cd_ibge}>{m.nm_municipio}</option>)}
          </select>
        </div>
        <div className={styles.ctxInfo}>
          <i className="fa-solid fa-circle-info fa-xs" />
          Selecione um estado e município para gerenciar os bairros.
        </div>
      </div>

      {selectedMun && (
        <div className={styles.workspace}>

          {/* ── Coluna: lista de bairros ── */}
          <div className={styles.bairroCol}>
            <div className={styles.colHd}>
              <span className={styles.colTitle}>
                <i className="fa-solid fa-layer-group fa-xs" /> Bairros
                {bairros.length > 0 && <span className={styles.badge}>{bairros.length}</span>}
              </span>
              {!criando && (
                <button className={styles.btnNovoSmall} onClick={() => { setCriando(true); setNovoNome('') }}>
                  <i className="fa-solid fa-plus fa-xs" /> Novo
                </button>
              )}
            </div>

            {/* Formulário novo bairro */}
            {criando && (
              <div className={styles.formNovo}>
                <input
                  className={styles.inputNome}
                  placeholder="Nome do bairro…"
                  value={novoNome}
                  onChange={e => setNovoNome(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleCriarBairro(); if (e.key === 'Escape') setCriando(false) }}
                  autoFocus
                />
                <div className={styles.formNovoActions}>
                  <button className={styles.btnSalvar} onClick={handleCriarBairro} disabled={!novoNome.trim() || salvandoNovo}>
                    {salvandoNovo ? <i className="fa-solid fa-spinner fa-spin fa-xs" /> : <i className="fa-solid fa-check fa-xs" />}
                    {salvandoNovo ? ' Salvando…' : ' Salvar'}
                  </button>
                  <button className={styles.btnCancelar} onClick={() => setCriando(false)}>Cancelar</button>
                </div>
              </div>
            )}

            {/* Lista */}
            {loadingBairros ? (
              <div className={styles.colLoading}><i className="fa-solid fa-spinner fa-spin" /></div>
            ) : bairros.length === 0 ? (
              <div className={styles.colVazio}>
                <i className="fa-solid fa-layer-group" />
                <span>Nenhum bairro cadastrado.</span>
                <span>Clique em "Novo" para começar.</span>
              </div>
            ) : (
              <div className={styles.bairroList}>
                {bairros.map(b => (
                  <div
                    key={b.id}
                    className={`${styles.bairroItem} ${selectedBairro?.id === b.id ? styles.bairroItemAtivo : ''}`}
                    onClick={() => { if (editandoId !== b.id) setSelectedBairro(b) }}
                  >
                    {editandoId === b.id ? (
                      <div className={styles.editInline} onClick={e => e.stopPropagation()}>
                        <input
                          className={styles.inputNome}
                          value={editNome}
                          onChange={e => setEditNome(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') handleRenomear(b); if (e.key === 'Escape') setEditandoId(null) }}
                          autoFocus
                        />
                        <div className={styles.formNovoActions}>
                          <button className={styles.btnSalvar} onClick={() => handleRenomear(b)} disabled={!editNome.trim() || salvandoEdit}>
                            {salvandoEdit ? <i className="fa-solid fa-spinner fa-spin fa-xs" /> : <i className="fa-solid fa-check fa-xs" />}
                          </button>
                          <button className={styles.btnCancelar} onClick={() => setEditandoId(null)}>
                            <i className="fa-solid fa-xmark fa-xs" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className={styles.bairroItemInfo}>
                          <span className={styles.bairroNome}>{b.nm_bairro}</span>
                          <span className={styles.bairroMeta}>
                            {b.total_locais} {b.total_locais === 1 ? 'local' : 'locais'}
                          </span>
                        </div>
                        <div className={styles.bairroActions} onClick={e => e.stopPropagation()}>
                          <button
                            className={styles.btnIconSm}
                            title="Renomear"
                            onClick={() => { setEditandoId(b.id); setEditNome(b.nm_bairro) }}
                          >
                            <i className="fa-solid fa-pen fa-xs" />
                          </button>
                          <button
                            className={`${styles.btnIconSm} ${styles.btnDel}`}
                            title="Excluir"
                            disabled={excluindoId === b.id}
                            onClick={() => handleExcluir(b)}
                          >
                            {excluindoId === b.id
                              ? <i className="fa-solid fa-spinner fa-spin fa-xs" />
                              : <i className="fa-solid fa-trash fa-xs" />}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Coluna: detalhe do bairro ── */}
          <div className={styles.detalheCol}>
            {!selectedBairro ? (
              <div className={styles.detalheVazio}>
                <i className="fa-solid fa-arrow-left" />
                <span>Selecione um bairro para gerenciar seus locais de votação.</span>
              </div>
            ) : (
              <>
                {/* Cabeçalho do bairro */}
                <div className={styles.detalheHd}>
                  <div className={styles.detalheTitle}>
                    <i className="fa-solid fa-location-dot fa-sm" />
                    {selectedBairro.nm_bairro}
                  </div>
                  <div className={styles.detalheMeta}>
                    {selectedBairro.nm_municipio} · {selectedBairro.sg_uf}
                    <span className={styles.detalheBadge}>{selectedBairro.total_locais} locais vinculados</span>
                  </div>
                </div>

                {/* Locais vinculados */}
                <div className={styles.secaoLabel}>
                  <i className="fa-solid fa-link fa-xs" /> Locais vinculados
                </div>

                {loadingLocais ? (
                  <div className={styles.colLoading}><i className="fa-solid fa-spinner fa-spin" /></div>
                ) : locaisVinc.length === 0 ? (
                  <div className={styles.semLocais}>
                    Nenhum local vinculado ainda. Use a busca abaixo para vincular.
                  </div>
                ) : (
                  <div className={styles.localList}>
                    {locaisVinc.map(l => (
                      <div key={l.nr_local_votacao} className={styles.localItem}>
                        <div className={styles.localInfo}>
                          <span className={styles.localNome}>{l.nm_local_votacao ?? `Local ${l.nr_local_votacao}`}</span>
                          {l.ds_endereco && <span className={styles.localEnd}>{l.ds_endereco}</span>}
                          <span className={styles.localSecoes}>{l.total_secoes} {l.total_secoes === 1 ? 'seção' : 'seções'}</span>
                        </div>
                        <button className={`${styles.btnIconSm} ${styles.btnDel}`} title="Desvincular" onClick={() => handleDesvincular(l)}>
                          <i className="fa-solid fa-link-slash fa-xs" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Busca de locais disponíveis */}
                <div className={styles.secaoLabel} style={{ marginTop: 20 }}>
                  <i className="fa-solid fa-magnifying-glass fa-xs" /> Vincular local de votação
                </div>
                <div className={styles.buscaWrap}>
                  <i className="fa-solid fa-search" />
                  <input
                    className={styles.buscaInput}
                    placeholder="Buscar por nome do local…"
                    value={busca}
                    onChange={e => setBusca(e.target.value)}
                  />
                  {busca && (
                    <button className={styles.buscaClear} onClick={() => setBusca('')}>
                      <i className="fa-solid fa-xmark fa-xs" />
                    </button>
                  )}
                </div>

                {loadingBusca ? (
                  <div className={styles.colLoading}><i className="fa-solid fa-spinner fa-spin fa-xs" /></div>
                ) : locaisDisp.length === 0 ? (
                  <div className={styles.semLocais}>
                    {busca ? 'Nenhum resultado.' : 'Todos os locais já foram vinculados ou não há locais neste município.'}
                  </div>
                ) : (
                  <div className={styles.localList}>
                    {locaisDisp.map(l => (
                      <div key={l.nr_local_votacao} className={styles.localItem}>
                        <div className={styles.localInfo}>
                          <span className={styles.localNome}>{l.nm_local_votacao ?? `Local ${l.nr_local_votacao}`}</span>
                          {l.ds_endereco && <span className={styles.localEnd}>{l.ds_endereco}</span>}
                          <span className={styles.localSecoes}>{l.total_secoes} {l.total_secoes === 1 ? 'seção' : 'seções'}</span>
                        </div>
                        <button className={styles.btnVincular} title="Vincular" onClick={() => handleVincular(l)}>
                          <i className="fa-solid fa-plus fa-xs" /> Vincular
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Toast */}
      {toastMsg && (
        <div className={`${styles.toast} ${toastMsg.ok ? '' : styles.toastErro}`}>
          <i className={`fa-solid ${toastMsg.ok ? 'fa-circle-check' : 'fa-circle-xmark'}`} />
          {toastMsg.text}
        </div>
      )}
    </div>
  )
}
