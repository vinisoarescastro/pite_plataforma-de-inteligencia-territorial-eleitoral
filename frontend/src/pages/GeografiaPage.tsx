import { useState, useEffect, useRef, useCallback } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import '@geoman-io/leaflet-geoman-free'
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css'
import styles from './GeografiaPage.module.css'
import {
  listarUfsGeo, listarMunicipiosGeo, listarBairros, criarBairro,
  renomearBairro, excluirBairro, listarLocaisBairro, vincularLocal,
  desvincularLocal, buscarLocaisVotacao,
  buscarBairrosGeoJSON, salvarGeomBairro, removerGeomBairro,
  type MunicipioGeo, type BairroOut, type LocalVotacaoOut,
} from '../services/geo'

// Cache do GeoJSON de municípios (5 MB, carregado uma única vez)
let _munGeoCache: { features: { properties: Record<string, string>; geometry: object; type: string }[] } | null = null
async function getMunGeo() {
  if (!_munGeoCache) _munGeoCache = await fetch('/geo/municipios_br.json').then(r => r.json())
  return _munGeoCache!
}

// Paleta de cores para bairros no mapa
const CORES = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16']
function corBairro(idx: number) { return CORES[idx % CORES.length] }

function useToast() {
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null)
  function toast(text: string, ok = true) { setMsg({ text, ok }); setTimeout(() => setMsg(null), 3200) }
  return { msg, toast }
}

export default function GeografiaPage() {
  const { msg: toastMsg, toast } = useToast()

  // ── Seletores de contexto ──────────────────────────────────
  const [ufs, setUfs]               = useState<string[]>([])
  const [selectedUf, setSelectedUf] = useState('')
  const [municipios, setMunicipios] = useState<MunicipioGeo[]>([])
  const [selectedMun, setSelectedMun] = useState<MunicipioGeo | null>(null)

  // ── Bairros ────────────────────────────────────────────────
  const [bairros, setBairros]           = useState<BairroOut[]>([])
  const [loadingBairros, setLoadingBairros] = useState(false)
  const [selectedBairro, setSelectedBairro] = useState<BairroOut | null>(null)
  const [criando, setCriando]           = useState(false)
  const [novoNome, setNovoNome]         = useState('')
  const [salvandoNovo, setSalvandoNovo] = useState(false)
  const [editandoId, setEditandoId]     = useState<string | null>(null)
  const [editNome, setEditNome]         = useState('')
  const [salvandoEdit, setSalvandoEdit] = useState(false)
  const [excluindoId, setExcluindoId]   = useState<string | null>(null)

  // ── Locais vinculados ──────────────────────────────────────
  const [locaisVinc, setLocaisVinc]         = useState<LocalVotacaoOut[]>([])
  const [loadingLocais, setLoadingLocais]   = useState(false)
  const [busca, setBusca]                   = useState('')
  const [locaisDisp, setLocaisDisp]         = useState<LocalVotacaoOut[]>([])
  const [loadingBusca, setLoadingBusca]     = useState(false)
  const buscarTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Mapa ───────────────────────────────────────────────────
  const mapDivRef    = useRef<HTMLDivElement | null>(null)
  const mapRef       = useRef<L.Map | null>(null)
  const bairrosGrpRef = useRef<L.LayerGroup | null>(null)
  const munGrpRef    = useRef<L.LayerGroup | null>(null)
  const pendingRef   = useRef<L.Layer | null>(null)
  const [desenhando, setDesenhando]     = useState(false)
  const [geomPendente, setGeomPendente] = useState<object | null>(null)
  const [salvandoGeom, setSalvandoGeom] = useState(false)

  // Ref para não precisar de deps no handler do pm:create
  const selectedBairroRef = useRef<BairroOut | null>(null)
  useEffect(() => { selectedBairroRef.current = selectedBairro }, [selectedBairro])

  // ── Init mapa (uma única vez) ──────────────────────────────
  useEffect(() => {
    if (!mapDivRef.current || mapRef.current) return
    const map = L.map(mapDivRef.current, { zoomControl: true, attributionControl: false })
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map)
    bairrosGrpRef.current = L.layerGroup().addTo(map)
    munGrpRef.current     = L.layerGroup().addTo(map)
    map.setView([-15.8, -47.9], 4)
    mapRef.current = map

    // Geoman sem toolbar (controle é feito pelos nossos botões)
    ;(map as any).pm.setGlobalOptions({ snappable: true, snapDistance: 15 })

    ;(map as any).on('pm:create', ({ layer }: any) => {
      const geo = (layer as L.Polygon).toGeoJSON()
      setGeomPendente(geo.geometry)
      pendingRef.current = layer
      // Estiliza como "pendente"
      ;(layer as L.Path).setStyle({ color: '#f59e0b', weight: 2.5, fillColor: '#fef08a', fillOpacity: 0.5, dashArray: '6 3' })
      setDesenhando(false)
    })

    return () => { map.remove(); mapRef.current = null }
  }, [])

  // ── Carrega UFs ────────────────────────────────────────────
  useEffect(() => { listarUfsGeo().then(setUfs).catch(() => {}) }, [])

  // ── Ao trocar UF ──────────────────────────────────────────
  useEffect(() => {
    setMunicipios([]); setSelectedMun(null); setBairros([]); setSelectedBairro(null)
    if (!selectedUf) return
    listarMunicipiosGeo(selectedUf).then(setMunicipios).catch(() => {})
  }, [selectedUf])

  // ── Ao trocar município: carrega bairros + zoom no mapa ───
  useEffect(() => {
    setBairros([]); setSelectedBairro(null)
    if (!selectedMun) {
      munGrpRef.current?.clearLayers()
      bairrosGrpRef.current?.clearLayers()
      mapRef.current?.setView([-15.8, -47.9], 4)
      return
    }
    setLoadingBairros(true)
    listarBairros(selectedUf, selectedMun.cd_ibge)
      .then(setBairros)
      .catch(() => toast('Erro ao carregar bairros.', false))
      .finally(() => setLoadingBairros(false))

    // Carrega contorno do município no mapa
    munGrpRef.current?.clearLayers()
    getMunGeo().then(data => {
      const feature = data.features.find(f => {
        const cd = String(parseInt(f.properties.CD_MUN ?? '0', 10))
        return cd === String(parseInt(selectedMun.cd_ibge, 10))
      })
      if (!feature || !mapRef.current) return
      const layer = L.geoJSON(feature as any, {
        style: { color: '#6366f1', weight: 2, fillColor: '#e0e7ff', fillOpacity: 0.08, dashArray: '5 4' },
      })
      munGrpRef.current?.addLayer(layer)
      mapRef.current.fitBounds((layer as L.GeoJSON).getBounds(), { padding: [40, 40] })
    }).catch(() => {})
  }, [selectedMun?.cd_ibge])

  // ── Ao trocar bairro selecionado ──────────────────────────
  useEffect(() => {
    // Limpa camada pendente
    if (pendingRef.current && mapRef.current) {
      mapRef.current.removeLayer(pendingRef.current)
      pendingRef.current = null
    }
    setGeomPendente(null)
    setDesenhando(false)
    if (mapRef.current) (mapRef.current as any).pm.disableDraw()

    setLocaisVinc([]); setLocaisDisp([]); setBusca('')
    if (!selectedBairro) return

    setLoadingLocais(true)
    listarLocaisBairro(selectedBairro.id)
      .then(setLocaisVinc)
      .catch(() => toast('Erro ao carregar locais.', false))
      .finally(() => setLoadingLocais(false))
  }, [selectedBairro?.id])

  // ── Redesenha polígonos dos bairros no mapa ───────────────
  const redesenharBairros = useCallback(async () => {
    const grp = bairrosGrpRef.current
    if (!grp || !selectedMun) return
    grp.clearLayers()
    const comGeom = bairros.filter(b => b.tem_geom)
    if (comGeom.length === 0) return
    try {
      const fc = await buscarBairrosGeoJSON(selectedUf, selectedMun.cd_ibge)
      fc.features.forEach((f, idx) => {
        const isSelected = f.properties?.id === selectedBairro?.id
        const cor = corBairro(idx)
        L.geoJSON(f as any, {
          style: {
            color: isSelected ? '#1d4ed8' : cor,
            weight: isSelected ? 3 : 1.5,
            fillColor: isSelected ? '#3b82f6' : cor,
            fillOpacity: isSelected ? 0.4 : 0.18,
          },
        })
        .bindTooltip(f.properties?.nm_bairro ?? '', {
          permanent: true, direction: 'center', sticky: false,
          className: 'bairroLabel',
        })
        .addTo(grp)
      })
    } catch { /* silencioso */ }
  }, [bairros, selectedBairro?.id, selectedMun?.cd_ibge, selectedUf])

  useEffect(() => { redesenharBairros() }, [redesenharBairros])

  // ── Busca de locais disponíveis (debounce) ─────────────────
  useEffect(() => {
    if (!selectedBairro || !selectedMun) return
    if (buscarTimerRef.current) clearTimeout(buscarTimerRef.current)
    buscarTimerRef.current = setTimeout(() => {
      setLoadingBusca(true)
      buscarLocaisVotacao(selectedUf, selectedMun.cd_tse, busca, selectedBairro.id)
        .then(setLocaisDisp).catch(() => {})
        .finally(() => setLoadingBusca(false))
    }, 300)
    return () => { if (buscarTimerRef.current) clearTimeout(buscarTimerRef.current) }
  }, [busca, selectedBairro?.id, selectedMun?.cd_tse])

  // ── Handlers: bairros ─────────────────────────────────────
  async function handleCriarBairro() {
    if (!novoNome.trim() || !selectedUf || !selectedMun) return
    setSalvandoNovo(true)
    try {
      const novo = await criarBairro({
        nm_bairro: novoNome.trim(), sg_uf: selectedUf,
        cd_municipio_ibge: selectedMun.cd_ibge, nm_municipio: selectedMun.nm_municipio,
      })
      setBairros(prev => [...prev, novo].sort((a, b) => a.nm_bairro.localeCompare(b.nm_bairro)))
      setNovoNome(''); setCriando(false); setSelectedBairro(novo)
      toast('Bairro criado.')
    } catch (e: unknown) { toast(e instanceof Error ? e.message : 'Erro.', false) }
    finally { setSalvandoNovo(false) }
  }

  async function handleRenomear(b: BairroOut) {
    if (!editNome.trim()) return
    setSalvandoEdit(true)
    try {
      const atualizado = await renomearBairro(b.id, editNome.trim(), b.sg_uf, b.cd_municipio_ibge ?? undefined, b.nm_municipio ?? undefined)
      setBairros(prev => prev.map(x => x.id === b.id ? { ...atualizado, total_locais: x.total_locais, tem_geom: x.tem_geom } : x))
      if (selectedBairro?.id === b.id) setSelectedBairro(prev => prev ? { ...prev, nm_bairro: atualizado.nm_bairro } : prev)
      setEditandoId(null)
      toast('Bairro renomeado.')
    } catch (e: unknown) { toast(e instanceof Error ? e.message : 'Erro.', false) }
    finally { setSalvandoEdit(false) }
  }

  async function handleExcluir(b: BairroOut) {
    setExcluindoId(b.id)
    try {
      await excluirBairro(b.id)
      setBairros(prev => prev.filter(x => x.id !== b.id))
      if (selectedBairro?.id === b.id) setSelectedBairro(null)
      toast('Bairro excluído.')
    } catch (e: unknown) { toast(e instanceof Error ? e.message : 'Erro.', false) }
    finally { setExcluindoId(null) }
  }

  // ── Handlers: locais ──────────────────────────────────────
  async function handleVincular(local: LocalVotacaoOut) {
    if (!selectedBairro) return
    try {
      await vincularLocal(selectedBairro.id, {
        sg_uf: local.sg_uf, cd_municipio_tse: local.cd_municipio_tse,
        nr_local_votacao: local.nr_local_votacao, nm_local_votacao: local.nm_local_votacao,
        ds_endereco: local.ds_endereco,
      })
      setLocaisVinc(prev => [...prev, local].sort((a, b) => (a.nm_local_votacao ?? '').localeCompare(b.nm_local_votacao ?? '')))
      setLocaisDisp(prev => prev.filter(l => l.nr_local_votacao !== local.nr_local_votacao))
      setBairros(prev => prev.map(b => b.id === selectedBairro.id ? { ...b, total_locais: b.total_locais + 1 } : b))
      setSelectedBairro(prev => prev ? { ...prev, total_locais: prev.total_locais + 1 } : prev)
      toast(`"${local.nm_local_votacao ?? local.nr_local_votacao}" vinculado.`)
    } catch (e: unknown) { toast(e instanceof Error ? e.message : 'Erro.', false) }
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
    } catch (e: unknown) { toast(e instanceof Error ? e.message : 'Erro.', false) }
  }

  // ── Handlers: geometria ───────────────────────────────────
  function iniciarDesenho() {
    if (!mapRef.current || !selectedBairro) return
    // Remove polígono pendente anterior
    if (pendingRef.current) { mapRef.current.removeLayer(pendingRef.current); pendingRef.current = null }
    setGeomPendente(null)
    ;(mapRef.current as any).pm.enableDraw('Polygon', { snappable: true, allowSelfIntersection: false })
    setDesenhando(true)
  }

  function cancelarDesenho() {
    if (!mapRef.current) return
    ;(mapRef.current as any).pm.disableDraw()
    if (pendingRef.current) { mapRef.current.removeLayer(pendingRef.current); pendingRef.current = null }
    setGeomPendente(null)
    setDesenhando(false)
  }

  function descartarGeom() {
    if (pendingRef.current && mapRef.current) { mapRef.current.removeLayer(pendingRef.current); pendingRef.current = null }
    setGeomPendente(null)
  }

  async function handleSalvarGeom() {
    if (!selectedBairro || !geomPendente) return
    setSalvandoGeom(true)
    try {
      await salvarGeomBairro(selectedBairro.id, geomPendente)
      // Remove camada pendente (será substituída pela camada do layer group)
      if (pendingRef.current && mapRef.current) { mapRef.current.removeLayer(pendingRef.current); pendingRef.current = null }
      setGeomPendente(null)
      // Atualiza tem_geom no state para forçar redesenho
      setBairros(prev => prev.map(b => b.id === selectedBairro.id ? { ...b, tem_geom: true } : b))
      setSelectedBairro(prev => prev ? { ...prev, tem_geom: true } : prev)
      toast('Polígono salvo com sucesso.')
    } catch (e: unknown) { toast(e instanceof Error ? e.message : 'Erro ao salvar.', false) }
    finally { setSalvandoGeom(false) }
  }

  async function handleRemoverGeom() {
    if (!selectedBairro) return
    try {
      await removerGeomBairro(selectedBairro.id)
      setBairros(prev => prev.map(b => b.id === selectedBairro.id ? { ...b, tem_geom: false } : b))
      setSelectedBairro(prev => prev ? { ...prev, tem_geom: false } : prev)
      toast('Polígono removido.')
    } catch (e: unknown) { toast(e instanceof Error ? e.message : 'Erro.', false) }
  }

  // ── Render ─────────────────────────────────────────────────
  return (
    <div className={styles.page}>
      <div className={styles.workspace}>

        {/* ════ PAINEL ESQUERDO ════ */}
        <div className={styles.leftPanel}>

          {/* Context bar */}
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
          </div>

          {/* Seção: lista de bairros */}
          {selectedMun && (
            <div className={styles.bairroSection}>
              <div className={styles.secHd}>
                <span className={styles.secTitle}>
                  <i className="fa-solid fa-layer-group fa-xs" /> Bairros
                  {bairros.length > 0 && <span className={styles.badge}>{bairros.length}</span>}
                </span>
                {!criando && (
                  <button className={styles.btnNovoSmall} onClick={() => { setCriando(true); setNovoNome('') }}>
                    <i className="fa-solid fa-plus fa-xs" /> Novo
                  </button>
                )}
              </div>

              {criando && (
                <div className={styles.formNovo}>
                  <input
                    className={styles.inputNome} placeholder="Nome do bairro…"
                    value={novoNome} onChange={e => setNovoNome(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleCriarBairro(); if (e.key === 'Escape') setCriando(false) }}
                    autoFocus
                  />
                  <div className={styles.formNovoActions}>
                    <button className={styles.btnSalvar} onClick={handleCriarBairro} disabled={!novoNome.trim() || salvandoNovo}>
                      {salvandoNovo ? <><i className="fa-solid fa-spinner fa-spin fa-xs" /> Salvando…</> : <><i className="fa-solid fa-check fa-xs" /> Salvar</>}
                    </button>
                    <button className={styles.btnCancelar} onClick={() => setCriando(false)}>Cancelar</button>
                  </div>
                </div>
              )}

              {loadingBairros ? (
                <div className={styles.colLoading}><i className="fa-solid fa-spinner fa-spin" /></div>
              ) : bairros.length === 0 ? (
                <div className={styles.colVazio}>
                  <i className="fa-solid fa-layer-group" />
                  <span>Nenhum bairro cadastrado.</span>
                </div>
              ) : (
                <div className={styles.bairroList}>
                  {bairros.map((b, idx) => (
                    <div
                      key={b.id}
                      className={`${styles.bairroItem} ${selectedBairro?.id === b.id ? styles.bairroItemAtivo : ''}`}
                      onClick={() => { if (editandoId !== b.id) setSelectedBairro(b) }}
                    >
                      {editandoId === b.id ? (
                        <div className={styles.editInline} onClick={e => e.stopPropagation()}>
                          <input className={styles.inputNome} value={editNome} onChange={e => setEditNome(e.target.value)}
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
                          <div className={styles.bairroColorDot} style={{ background: corBairro(idx) }} />
                          <div className={styles.bairroItemInfo}>
                            <span className={styles.bairroNome}>{b.nm_bairro}</span>
                            <span className={styles.bairroMeta}>
                              {b.total_locais} {b.total_locais === 1 ? 'local' : 'locais'}
                              {b.tem_geom && <span className={styles.geomBadge}><i className="fa-solid fa-draw-polygon fa-xs" /></span>}
                            </span>
                          </div>
                          <div className={styles.bairroActions} onClick={e => e.stopPropagation()}>
                            <button className={styles.btnIconSm} title="Renomear"
                              onClick={() => { setEditandoId(b.id); setEditNome(b.nm_bairro) }}>
                              <i className="fa-solid fa-pen fa-xs" />
                            </button>
                            <button className={`${styles.btnIconSm} ${styles.btnDel}`} title="Excluir"
                              disabled={excluindoId === b.id} onClick={() => handleExcluir(b)}>
                              {excluindoId === b.id ? <i className="fa-solid fa-spinner fa-spin fa-xs" /> : <i className="fa-solid fa-trash fa-xs" />}
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Seção: detalhe do bairro selecionado */}
          {selectedBairro && (
            <div className={styles.detalheSection}>
              <div className={styles.secHd} style={{ background: 'var(--brand-50)', borderTop: '1px solid var(--brand-100)' }}>
                <span className={styles.secTitle}>
                  <i className="fa-solid fa-link fa-xs" /> {selectedBairro.nm_bairro}
                  <span className={styles.badge} style={{ background: 'var(--gray-400)' }}>{selectedBairro.total_locais}</span>
                </span>
              </div>

              {loadingLocais ? (
                <div className={styles.colLoading}><i className="fa-solid fa-spinner fa-spin" /></div>
              ) : locaisVinc.length === 0 ? (
                <div className={styles.semLocais}>Nenhum local vinculado.</div>
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

              <div className={styles.secHd} style={{ borderTop: '1px solid var(--gray-100)', marginTop: 4 }}>
                <span className={styles.secTitle} style={{ fontSize: 10 }}>
                  <i className="fa-solid fa-plus fa-xs" /> Vincular local
                </span>
              </div>
              <div className={styles.buscaWrap}>
                <i className="fa-solid fa-search" />
                <input className={styles.buscaInput} placeholder="Buscar por nome…"
                  value={busca} onChange={e => setBusca(e.target.value)} />
                {busca && <button className={styles.buscaClear} onClick={() => setBusca('')}><i className="fa-solid fa-xmark fa-xs" /></button>}
              </div>
              {loadingBusca ? (
                <div className={styles.colLoading}><i className="fa-solid fa-spinner fa-spin fa-xs" /></div>
              ) : (
                <div className={styles.localList}>
                  {locaisDisp.length === 0 ? (
                    <div className={styles.semLocais}>{busca ? 'Nenhum resultado.' : 'Todos os locais vinculados.'}</div>
                  ) : locaisDisp.map(l => (
                    <div key={l.nr_local_votacao} className={styles.localItem}>
                      <div className={styles.localInfo}>
                        <span className={styles.localNome}>{l.nm_local_votacao ?? `Local ${l.nr_local_votacao}`}</span>
                        {l.ds_endereco && <span className={styles.localEnd}>{l.ds_endereco}</span>}
                        <span className={styles.localSecoes}>{l.total_secoes} {l.total_secoes === 1 ? 'seção' : 'seções'}</span>
                      </div>
                      <button className={styles.btnVincular} onClick={() => handleVincular(l)}>
                        <i className="fa-solid fa-plus fa-xs" /> Vincular
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ════ PAINEL MAPA ════ */}
        <div className={styles.mapPanel}>
          {/* Toolbar do mapa */}
          <div className={styles.mapToolbar}>
            {!selectedMun ? (
              <span className={styles.mapToolbarHint}>
                <i className="fa-solid fa-circle-info fa-xs" /> Selecione estado e município para visualizar o mapa.
              </span>
            ) : !selectedBairro ? (
              <span className={styles.mapToolbarHint}>
                <i className="fa-solid fa-hand-pointer fa-xs" /> Selecione um bairro para desenhar seu polígono.
              </span>
            ) : (
              <div className={styles.mapToolbarActions}>
                <span className={styles.mapToolbarBairro}>
                  <i className="fa-solid fa-draw-polygon fa-xs" /> {selectedBairro.nm_bairro}
                </span>
                <div className={styles.mapToolbarBtns}>
                  {!desenhando && !geomPendente && (
                    <button className={styles.btnDesenhar} onClick={iniciarDesenho}>
                      <i className="fa-solid fa-pencil fa-xs" />
                      {selectedBairro.tem_geom ? ' Redesenhar' : ' Desenhar polígono'}
                    </button>
                  )}
                  {desenhando && (
                    <button className={`${styles.btnDesenhar} ${styles.btnDesenharCancel}`} onClick={cancelarDesenho}>
                      <i className="fa-solid fa-xmark fa-xs" /> Cancelar
                    </button>
                  )}
                  {geomPendente && !desenhando && (
                    <>
                      <button className={styles.btnSalvarGeom} onClick={handleSalvarGeom} disabled={salvandoGeom}>
                        {salvandoGeom ? <i className="fa-solid fa-spinner fa-spin fa-xs" /> : <i className="fa-solid fa-check fa-xs" />}
                        {salvandoGeom ? ' Salvando…' : ' Salvar polígono'}
                      </button>
                      <button className={styles.btnDescartarGeom} onClick={descartarGeom}>
                        <i className="fa-solid fa-trash fa-xs" /> Descartar
                      </button>
                    </>
                  )}
                  {selectedBairro.tem_geom && !geomPendente && !desenhando && (
                    <button className={styles.btnRemoverGeom} onClick={handleRemoverGeom}>
                      <i className="fa-solid fa-trash fa-xs" /> Remover polígono
                    </button>
                  )}
                </div>
                {desenhando && (
                  <div className={styles.mapDesenhandoHint}>
                    <i className="fa-solid fa-circle-info fa-xs" />
                    Clique no mapa para adicionar vértices. Clique no primeiro ponto para fechar o polígono.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Container do mapa */}
          <div ref={mapDivRef} className={styles.mapContainer} />
        </div>
      </div>

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
