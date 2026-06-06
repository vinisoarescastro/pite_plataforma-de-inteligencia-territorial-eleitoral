import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import styles from './MapaPage.module.css'
import {
  listarEleicoes, listarCargos, listarVotaveis,
  buscarVotacaoMapaUF, buscarVotacaoPorZona,
  type Eleicao, type Votavel, type VotacaoMunicipio, type VotacaoZona,
} from '../services/eleitoral'

// ── Regiões ────────────────────────────────────────────────────────
const REGIOES = [
  { nome: 'Norte',        sigla: 'N',  cor: '#0e9f6e', ufs: ['AC','AM','AP','PA','RO','RR','TO'] },
  { nome: 'Nordeste',     sigla: 'NE', cor: '#f59e0b', ufs: ['AL','BA','CE','MA','PB','PE','PI','RN','SE'] },
  { nome: 'Centro-Oeste', sigla: 'CO', cor: '#8b5cf6', ufs: ['DF','GO','MS','MT'] },
  { nome: 'Sudeste',      sigla: 'SE', cor: '#3b82f6', ufs: ['ES','MG','RJ','SP'] },
  { nome: 'Sul',          sigla: 'S',  cor: '#ef4444', ufs: ['PR','RS','SC'] },
]

const UF_NOMES: Record<string, string> = {
  AC:'Acre', AL:'Alagoas', AP:'Amapá', AM:'Amazonas', BA:'Bahia',
  CE:'Ceará', DF:'Distrito Federal', ES:'Espírito Santo', GO:'Goiás',
  MA:'Maranhão', MT:'Mato Grosso', MS:'Mato Grosso do Sul', MG:'Minas Gerais',
  PA:'Pará', PB:'Paraíba', PR:'Paraná', PE:'Pernambuco', PI:'Piauí',
  RJ:'Rio de Janeiro', RN:'Rio Grande do Norte', RS:'Rio Grande do Sul',
  RO:'Rondônia', RR:'Roraima', SC:'Santa Catarina', SP:'São Paulo',
  SE:'Sergipe', TO:'Tocantins',
}

// UF com dados disponíveis
const UF_COM_DADOS = new Set(['GO'])

type Nivel = 'brasil' | 'regiao' | 'estado' | 'municipio'

interface NavState {
  nivel: Nivel
  regiao: typeof REGIOES[0] | null
  estado: string | null
  municipio: { nome: string; uf: string; codigo: string; codigoTse: string } | null
}

const NAV_INICIAL: NavState = { nivel: 'brasil', regiao: null, estado: null, municipio: null }

// ── Cor por % relativo ao máximo ─────────────────────────────────
function corPorPct(pct: number): string {
  if (pct >= 80) return '#1a3a8f'
  if (pct >= 60) return '#2563eb'
  if (pct >= 40) return '#60a5fa'
  if (pct >= 20) return '#93c5fd'
  return '#dbeafe'
}

// ── Estilo base por nível ────────────────────────────────────────
function estiloBase(uf: string, nav: NavState): L.PathOptions {
  const regiaoUf = REGIOES.find(r => r.ufs.includes(uf))
  const temDados = UF_COM_DADOS.has(uf)

  switch (nav.nivel) {
    case 'brasil':
      if (!temDados) return { fillColor: '#e5e7eb', fillOpacity: 0.4, color: '#d1d5db', weight: 0.3 }
      return { fillColor: regiaoUf?.cor ?? '#bdc3c7', fillOpacity: 0.55, color: '#fff', weight: 0.3 }
    case 'regiao':
      if (nav.regiao?.ufs.includes(uf)) {
        if (!temDados) return { fillColor: '#d1d5db', fillOpacity: 0.5, color: '#fff', weight: 0.5 }
        return { fillColor: nav.regiao.cor, fillOpacity: 0.6, color: '#fff', weight: 0.5 }
      }
      return { fillColor: '#e5e7eb', fillOpacity: 0.12, color: '#d1d5db', weight: 0.2 }
    case 'estado':
    case 'municipio':
      if (uf === nav.estado) return { fillColor: regiaoUf?.cor ?? '#3b82f6', fillOpacity: 0.45, color: '#fff', weight: 0.5 }
      return { fillColor: '#e5e7eb', fillOpacity: 0.1, color: '#d1d5db', weight: 0.2 }
  }
}

// ── Componente ───────────────────────────────────────────────────
export default function MapaPage() {
  const mapRef       = useRef<HTMLDivElement>(null)
  const mapInst      = useRef<L.Map | null>(null)
  const geojsonLayer    = useRef<L.GeoJSON | null>(null)
  const outlineLayer    = useRef<L.GeoJSON | null>(null)
  const selectedMunPath = useRef<{ path: L.Path; feature: GeoJSON.Feature } | null>(null)
  const geoData      = useRef<GeoJSON.FeatureCollection | null>(null)
  const brasilGeo    = useRef<GeoJSON.FeatureCollection | null>(null)
  const regioesGeo   = useRef<GeoJSON.FeatureCollection | null>(null)
  const estadosGeo   = useRef<GeoJSON.FeatureCollection | null>(null)
  const ufLayers     = useRef<Record<string, L.Layer[]>>({})
  const navRef       = useRef<NavState>(NAV_INICIAL)
  // mapa cd_municipio_ibge → pct para colorir (chave = IBGE 7 dígitos normalizado)
  const votacaoMap   = useRef<Map<string, number>>(new Map())
  // mapa ibge → nome do município (preenchido ao carregar o GeoJSON)
  const ibgeNomeMap  = useRef<Map<string, string>>(new Map())

  const [nav, setNavState]       = useState<NavState>(NAV_INICIAL)
  const [loading, setLoading]    = useState(false)

  // ── Filtros ──────────────────────────────────────────────────
  const [eleicoes, setEleicoes]         = useState<Eleicao[]>([])
  // eleicaoId = UUID da eleição ativa (já inclui o turno certo)
  const [eleicaoId, setEleicaoId]       = useState('')
  // chave "ano|tipo" para o seletor de eleição base
  const [eleicaoBase, setEleicaoBase]   = useState('')
  const [turnos, setTurnos]             = useState<number[]>([])
  const [turno, setTurno]               = useState<number | null>(null)
  const [cargos, setCargos]             = useState<string[]>([])
  const [cargo, setCargo]               = useState('')
  const [votaveis, setVotaveis]         = useState<Votavel[]>([])
  const [nrVotavel, setNrVotavel]       = useState('')
  const [loadingFiltros, setLoadingFiltros]   = useState(false)
  const [temDadosMapa, setTemDadosMapa]       = useState(false)
  // busca de candidato
  const [buscaCand, setBuscaCand]             = useState('')
  const [candAberto, setCandAberto]           = useState(false)
  const candRef                               = useRef<HTMLDivElement>(null)
  const [nomeVotavelSel, setNomeVotavelSel]   = useState('')

  // ── Dados do painel lateral ──────────────────────────────────
  const [zonas, setZonas]                     = useState<VotacaoZona[]>([])
  const [loadingZonas, setLoadingZonas]       = useState(false)
  const [totalVotos, setTotalVotos]           = useState<number | null>(null)
  const [dadosMapa, setDadosMapa]             = useState<VotacaoMunicipio[]>([])

  function setNav(next: NavState) {
    navRef.current = next
    setNavState(next)
  }

  // ── Carrega eleições na montagem ─────────────────────────────
  useEffect(() => {
    listarEleicoes().then(data => {
      setEleicoes(data)
      if (data.length > 0) {
        const base = `${data[0].ano}|${data[0].tipo}`
        setEleicaoBase(base)
      }
    }).catch(() => {})
  }, [])

  // ── Quando eleição base muda → atualiza turnos disponíveis e eleicaoId ──
  useEffect(() => {
    if (!eleicaoBase || eleicoes.length === 0) return
    const [ano, tipo] = eleicaoBase.split('|')
    const grupo = eleicoes.filter(e => String(e.ano) === ano && e.tipo === tipo)
    const turnosEl = grupo.map(e => e.turno).sort()
    setTurnos(turnosEl)
    const t0 = turnosEl[0] ?? null
    setTurno(t0)
    // aponta eleicaoId para a eleição do primeiro turno
    const elMatch = grupo.find(e => e.turno === t0)
    setEleicaoId(elMatch?.id ?? '')
    setCargo('')
    setNrVotavel('')
  }, [eleicaoBase, eleicoes])

  // ── Quando turno muda → atualiza eleicaoId para a eleição correta ───────
  useEffect(() => {
    if (!eleicaoBase || turno == null || eleicoes.length === 0) return
    const [ano, tipo] = eleicaoBase.split('|')
    const elMatch = eleicoes.find(e => String(e.ano) === ano && e.tipo === tipo && e.turno === turno)
    if (elMatch) setEleicaoId(elMatch.id)
    setCargo('')
    setNrVotavel('')
  }, [turno])

  // ── Quando eleicaoId muda → carrega cargos ───────────────────
  useEffect(() => {
    if (!eleicaoId) return
    setLoadingFiltros(true)
    listarCargos(eleicaoId)
      .then(data => { setCargos(data); setCargo(''); setNrVotavel('') })
      .catch(() => { setCargos([]) })
      .finally(() => setLoadingFiltros(false))
  }, [eleicaoId])

  // ── Fecha dropdown candidato ao clicar fora ──────────────────
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (candRef.current && !candRef.current.contains(e.target as Node))
        setCandAberto(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // ── Quando cargo muda → carrega votáveis ─────────────────────
  useEffect(() => {
    setBuscaCand('')
    setNrVotavel('')
    setNomeVotavelSel('')
    if (!eleicaoId || !cargo) { setVotaveis([]); return }
    setLoadingFiltros(true)
    listarVotaveis(eleicaoId, { nr_turno: turno ?? undefined, ds_cargo: cargo })
      .then(data => { setVotaveis(data); setNrVotavel('') })
      .catch(() => {})
      .finally(() => setLoadingFiltros(false))
  }, [eleicaoId, turno, cargo])

  // ── Quando votável muda → recolore o mapa ───────────────────
  const recolorirMapa = useCallback(async () => {
    if (!eleicaoId || !nrVotavel || !nomeVotavelSel) {
      votacaoMap.current.clear()
      setTemDadosMapa(false)
      setDadosMapa([])
      geojsonLayer.current?.setStyle(f => estiloBase((f as GeoJSON.Feature)?.properties?.SIGLA_UF ?? '', navRef.current))
      return
    }
    try {
      const dados: VotacaoMunicipio[] = await buscarVotacaoMapaUF(
        'GO', eleicaoId, { nr_votavel: nrVotavel, nm_votavel: nomeVotavelSel, nr_turno: turno ?? undefined }
      )
      // ordena por total_votos desc para ranking
      const ordenados = [...dados].sort((a, b) => b.total_votos - a.total_votos)
      setDadosMapa(ordenados)
      votacaoMap.current.clear()
      dados.forEach(d => {
        if (d.cd_municipio_ibge) {
          votacaoMap.current.set(String(parseInt(d.cd_municipio_ibge, 10)), d.pct_votos ?? 0)
        }
      })
      setTemDadosMapa(votacaoMap.current.size > 0)
      geojsonLayer.current?.setStyle(f => estiloComVotos(f as GeoJSON.Feature))
      // re-destaca município selecionado após recolorir
      if (selectedMunPath.current) {
        const nav = navRef.current
        const cor = REGIOES.find(r => r.ufs.includes(nav.estado ?? ''))?.cor ?? '#3b82f6'
        const base = estiloComVotos(selectedMunPath.current.feature)
        selectedMunPath.current.path.setStyle({ ...base, color: cor, weight: 4, opacity: 1 })
        selectedMunPath.current.path.bringToFront()
      }
    } catch {}
  }, [eleicaoId, nrVotavel, nomeVotavelSel, turno])

  useEffect(() => { recolorirMapa() }, [recolorirMapa])

  // ── Estilo com dados de votação ──────────────────────────────
  function estiloComVotos(feature: GeoJSON.Feature | undefined): L.PathOptions {
    const uf   = feature?.properties?.SIGLA_UF ?? ''
    const ibge = feature?.properties?.CD_MUN ?? ''
    const base = estiloBase(uf, navRef.current)

    if (votacaoMap.current.size > 0 && uf === 'GO') {
      const key = String(parseInt(String(ibge), 10))
      const pct = votacaoMap.current.get(key)
      if (pct != null) return { ...base, fillColor: corPorPct(pct), fillOpacity: 0.8 }
      return { ...base, fillColor: '#f3f4f6', fillOpacity: 0.5 }
    }
    return base
  }

  // ── Zonas do município selecionado ───────────────────────────
  useEffect(() => {
    const tse = nav.municipio?.codigoTse
    if (!tse || !eleicaoId || !nrVotavel) { setZonas([]); setTotalVotos(null); return }
    setLoadingZonas(true)
    buscarVotacaoPorZona(tse, eleicaoId, { nr_votavel: nrVotavel, nr_turno: turno ?? undefined })
      .then(data => {
        setZonas(data)
        setTotalVotos(data.reduce((s, z) => s + z.total_votos, 0))
      })
      .catch(() => { setZonas([]); setTotalVotos(null) })
      .finally(() => setLoadingZonas(false))
  }, [nav.municipio?.codigoTse, eleicaoId, nrVotavel, turno])

  // ── Contornos ────────────────────────────────────────────────
  useEffect(() => {
    Promise.all([
      fetch('/geo/brasil_outline.json').then(r => r.json()),
      fetch('/geo/regioes_outline.json').then(r => r.json()),
      fetch('/geo/estados_outline.json').then(r => r.json()),
    ]).then(([b, rg, e]) => {
      brasilGeo.current  = b
      regioesGeo.current = rg
      estadosGeo.current = e
      atualizarContorno(navRef.current)
    }).catch(() => {})
  }, [])

  function resetarMunSelecionado() {
    if (selectedMunPath.current) {
      selectedMunPath.current.path.setStyle(estiloComVotos(selectedMunPath.current.feature))
      selectedMunPath.current = null
    }
  }

  function atualizarContorno(navState: NavState) {
    if (outlineLayer.current) { mapInst.current?.removeLayer(outlineLayer.current); outlineLayer.current = null }
    if (!mapInst.current) return
    // se o nav já mudou (chamada assíncrona com navState obsoleto), aborta
    if (navRef.current.nivel !== navState.nivel) return
    if (navRef.current.nivel === 'municipio') return

    let fc: GeoJSON.FeatureCollection | null = null
    let cor = '#6366f1'; let weight = 2

    switch (navState.nivel) {
      case 'brasil':
        fc = brasilGeo.current; cor = 'rgba(0,0,0,0.55)'; weight = 1.8; break

      case 'regiao':
        if (!navState.regiao || !regioesGeo.current) return
        fc = { type: 'FeatureCollection', features: regioesGeo.current.features.filter(f => f.properties?.regiao === navState.regiao!.nome) }
        cor = navState.regiao.cor; weight = 2.5; break

      case 'estado':
        if (!navState.estado || !estadosGeo.current) return
        fc = { type: 'FeatureCollection', features: estadosGeo.current.features.filter(f => f.properties?.uf === navState.estado) }
        cor = REGIOES.find(r => r.ufs.includes(navState.estado!))?.cor ?? '#3b82f6'; weight = 3; break
    }
    if (!fc || fc.features.length === 0) return
    outlineLayer.current = L.geoJSON(fc as Parameters<typeof L.geoJSON>[0], {
      style: { fill: false, fillOpacity: 0, color: cor, weight, opacity: navState.nivel === 'brasil' ? 0.55 : 0.85 },
      interactive: false,
    }).addTo(mapInst.current)
  }

  // Re-estiliza quando nav muda
  useEffect(() => {
    // ao sair do nível municipio, limpa o destaque direto no path
    if (nav.nivel !== 'municipio') resetarMunSelecionado()
    if (votacaoMap.current.size > 0) {
      geojsonLayer.current?.setStyle(f => estiloComVotos(f as GeoJSON.Feature))
    } else {
      geojsonLayer.current?.setStyle(f => estiloBase((f as GeoJSON.Feature)?.properties?.SIGLA_UF ?? '', nav))
    }
    atualizarContorno(nav)
    // re-aplica destaque se ainda em nível municipio (ex: mudança de candidato)
    if (nav.nivel === 'municipio' && selectedMunPath.current) {
      const cor = REGIOES.find(r => r.ufs.includes(nav.estado ?? ''))?.cor ?? '#3b82f6'
      const base = estiloComVotos(selectedMunPath.current.feature)
      selectedMunPath.current.path.setStyle({ ...base, color: cor, weight: 4, opacity: 1 })
      selectedMunPath.current.path.bringToFront()
    }
  }, [nav])

  // ── Inicializa mapa ──────────────────────────────────────────
  useEffect(() => {
    if (mapInst.current || !mapRef.current) return
    const map = L.map(mapRef.current, { center: [-15.77, -47.93], zoom: 4, zoomControl: false, attributionControl: false })
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, opacity: 0.5 }).addTo(map)
    mapInst.current = map
    carregarMunicipios(map)
    return () => { map.remove(); mapInst.current = null; geojsonLayer.current = null; outlineLayer.current = null; geoData.current = null; ufLayers.current = {}; selectedMunPath.current = null }
  }, [])

  async function carregarMunicipios(map: L.Map) {
    setLoading(true)
    try {
      const res  = await fetch('/geo/municipios_br.json')
      const data = await res.json()
      geoData.current = data

      // monta lookup ibge → nome para o painel de resumo
      ;(data as GeoJSON.FeatureCollection).features.forEach(f => {
        const cd  = String(f.properties?.CD_MUN ?? '')
        const nm  = String(f.properties?.NM_MUN ?? '')
        if (cd && nm) ibgeNomeMap.current.set(String(parseInt(cd, 10)), nm)
      })

      const layer = L.geoJSON(data, {
        style: (f) => estiloBase((f as GeoJSON.Feature)?.properties?.SIGLA_UF ?? '', navRef.current),
        onEachFeature: (feature, layer) => {
          const p      = feature.properties ?? {}
          const nome   = p.NM_MUN    ?? 'Município'
          const uf     = p.SIGLA_UF  ?? ''
          const codigo = p.CD_MUN    ?? ''
          const tse    = p.CD_MUN_TSE ?? p.CD_TSE ?? ''
          const path   = layer as L.Path

          if (!ufLayers.current[uf]) ufLayers.current[uf] = []
          ufLayers.current[uf].push(layer)

          ;(layer as L.GeoJSON).bindTooltip(
            `<strong>${nome}</strong><span style="color:#6b7280;font-size:11px;margin-left:6px">${uf}</span>`,
            { sticky: true, opacity: 0.95, className: 'mapa-tooltip' }
          )

          layer.on({
            mouseover: () => {
              const cur = navRef.current
              if (cur.nivel === 'municipio' && cur.municipio?.codigo === codigo) return
              const estiloAtual = estiloComVotos(feature)
              path.setStyle({ ...estiloAtual, weight: 2, color: '#1e40af', fillOpacity: Math.min((estiloAtual.fillOpacity ?? 0.5) + 0.15, 1) })
              path.bringToFront()
            },
            mouseout: () => {
              const cur = navRef.current
              if (cur.nivel === 'municipio' && cur.municipio?.codigo === codigo) return
              path.setStyle(estiloComVotos(feature))
            },
            click: () => {
              // reset destaque anterior
              if (selectedMunPath.current) {
                selectedMunPath.current.path.setStyle(estiloComVotos(selectedMunPath.current.feature))
              }
              // remove qualquer outlineLayer anterior imediatamente (evita quadrado residual)
              if (outlineLayer.current) { map.removeLayer(outlineLayer.current); outlineLayer.current = null }
              // aplica destaque diretamente no polygon path — sem camada separada, sem quadrado
              const regiaoObj = REGIOES.find(r => r.ufs.includes(uf)) ?? null
              const cor = regiaoObj?.cor ?? '#3b82f6'
              const base = estiloComVotos(feature)
              path.setStyle({ ...base, color: cor, weight: 4, opacity: 1 })
              path.bringToFront()
              selectedMunPath.current = { path, feature }
              setNav({ nivel: 'municipio', regiao: regiaoObj, estado: uf, municipio: { nome, uf, codigo, codigoTse: String(tse) } })
              const bounds = (layer as L.GeoJSON).getBounds?.()
              if (bounds) map.fitBounds(bounds, { padding: [40, 40], maxZoom: 10 })
            },
          })
        },
      }).addTo(map)
      geojsonLayer.current = layer
      map.fitBounds(layer.getBounds())
      atualizarContorno(navRef.current)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  // ── Navegação ────────────────────────────────────────────────
  function irParaBrasil() {
    setNav(NAV_INICIAL)
    if (geojsonLayer.current) mapInst.current?.fitBounds(geojsonLayer.current.getBounds())
  }
  function irParaRegiao(regiao: typeof REGIOES[0]) {
    setNav({ nivel: 'regiao', regiao, estado: null, municipio: null })
    const layers = regiao.ufs.flatMap(uf => ufLayers.current[uf] ?? [])
    if (layers.length > 0) mapInst.current?.fitBounds(L.featureGroup(layers as L.Layer[]).getBounds(), { padding: [30, 30] })
  }
  function irParaEstado(uf: string) {
    const regiaoObj = REGIOES.find(r => r.ufs.includes(uf)) ?? null
    setNav({ nivel: 'estado', regiao: regiaoObj, estado: uf, municipio: null })
    const layers = ufLayers.current[uf] ?? []
    if (layers.length > 0) mapInst.current?.fitBounds(L.featureGroup(layers as L.Layer[]).getBounds(), { padding: [30, 30] })
  }

  const eleicaoAtual = eleicoes.find(e => e.id === eleicaoId) ?? null

  // chave única por candidato: nr + nome (evita colisão quando mesmo número aparece em cargos distintos)
  const votaveisUnicos = useMemo(() =>
    votaveis.filter((v, i, arr) =>
      arr.findIndex(x => x.nr_votavel === v.nr_votavel && x.nm_votavel === v.nm_votavel) === i
    )
  , [votaveis])

  const votaveisFiltrados = useMemo(() => {
    const norm = (s: string) =>
      s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

    const q = buscaCand.trim()
    if (!q) return votaveisUnicos

    const termos = norm(q).split(/\s+/).filter(Boolean)

    const filtrados = votaveisUnicos.filter(v => {
      const nome = norm(v.nm_votavel)
      return termos.every(t => nome.includes(t) || v.nr_votavel.includes(t))
    })

    const qNorm = norm(q)
    filtrados.sort((a, b) => {
      const na = norm(a.nm_votavel)
      const nb = norm(b.nm_votavel)
      const aExato = na.startsWith(qNorm) ? 0 : na.includes(qNorm) ? 1 : 2
      const bExato = nb.startsWith(qNorm) ? 0 : nb.includes(qNorm) ? 1 : 2
      return aExato !== bExato ? aExato - bExato : na.localeCompare(nb)
    })

    return filtrados
  }, [votaveisUnicos, buscaCand])

  // seleção usa nr_votavel+nome para identificar univocamente
  const votavelAtual = votaveisUnicos.find(v => v.nr_votavel === nrVotavel && v.nm_votavel === nomeVotavelSel)
    ?? votaveisUnicos.find(v => v.nr_votavel === nrVotavel)

  return (
    <div className={styles.page}>
      <div className={styles.layout}>

        {/* ── Mapa ── */}
        <div className={styles.mapCont}>
          <div ref={mapRef} className={styles.mapLeaflet} />

          {loading && (
            <div className={styles.loadingOverlay}>
              <div className={styles.loadingCard}>
                <i className="fa-solid fa-spinner fa-spin" />
                <span>Carregando municípios do Brasil…</span>
                <span className={styles.loadingHint}>Arquivo grande — pode levar alguns segundos</span>
              </div>
            </div>
          )}

          {/* Breadcrumb */}
          <div className={styles.mapBreadcrumb}>
            <button className={styles.bcBtn} onClick={irParaBrasil}><i className="fa-solid fa-earth-americas" /> Brasil</button>
            {nav.regiao && (<>
              <i className="fa-solid fa-chevron-right fa-xs" style={{ color: 'var(--gray-400)' }} />
              <button className={`${styles.bcBtn} ${nav.nivel === 'regiao' ? styles.bcBtnActive : ''}`} onClick={() => irParaRegiao(nav.regiao!)} style={{ color: nav.regiao.cor }}>{nav.regiao.nome}</button>
            </>)}
            {nav.estado && (<>
              <i className="fa-solid fa-chevron-right fa-xs" style={{ color: 'var(--gray-400)' }} />
              <button className={`${styles.bcBtn} ${nav.nivel === 'estado' ? styles.bcBtnActive : ''}`} onClick={() => irParaEstado(nav.estado!)}>{UF_NOMES[nav.estado] ?? nav.estado}</button>
            </>)}
            {nav.municipio && (<>
              <i className="fa-solid fa-chevron-right fa-xs" style={{ color: 'var(--gray-400)' }} />
              <span className={`${styles.bcBtn} ${styles.bcBtnActive}`}>{nav.municipio.nome}</span>
            </>)}
          </div>

          {/* Legenda de cores (só quando tem dados) */}
          {temDadosMapa && (
            <div className={styles.mapLegenda}>
              <div className={styles.legTitle}>Votos relativos</div>
              {[['#1a3a8f','80–100%'],['#2563eb','60–79%'],['#60a5fa','40–59%'],['#93c5fd','20–39%'],['#dbeafe','0–19%']].map(([cor, label]) => (
                <div key={cor} className={styles.legRow}>
                  <span className={styles.legSwatch} style={{ background: cor }} />
                  <span>{label}</span>
                </div>
              ))}
            </div>
          )}

          {/* Zoom */}
          <div className={styles.mapZoom}>
            <button onClick={() => mapInst.current?.zoomIn()}  title="Ampliar"><i className="fa-solid fa-plus" /></button>
            <button onClick={() => mapInst.current?.zoomOut()} title="Reduzir"><i className="fa-solid fa-minus" /></button>
            <button onClick={irParaBrasil} title="Ver Brasil todo"><i className="fa-solid fa-expand" /></button>
          </div>

          <div className={styles.mapAttr}>© OpenStreetMap contributors · IBGE 2022</div>
        </div>

        {/* ── Painel lateral ── */}
        <div className={styles.panel}>
          <div className={styles.panelHd}>
            <span className={styles.panelTitle}>
              {nav.nivel === 'brasil'    && 'Brasil'}
              {nav.nivel === 'regiao'    && `Região ${nav.regiao?.nome}`}
              {nav.nivel === 'estado'    && (UF_NOMES[nav.estado ?? ''] ?? nav.estado)}
              {nav.nivel === 'municipio' && nav.municipio?.nome}
            </span>
            {nav.nivel !== 'brasil' && (
              <button className={styles.panelBack} onClick={() => {
                if (nav.nivel === 'municipio' && nav.estado) irParaEstado(nav.estado)
                else if (nav.nivel === 'estado' && nav.regiao) irParaRegiao(nav.regiao)
                else irParaBrasil()
              }}>
                <i className="fa-solid fa-arrow-left" /> Voltar
              </button>
            )}
          </div>

          <div className={styles.panelBody}>

            {/* ── Filtros ── */}
            <div className={styles.filtrosSection}>
              <div className={styles.filtroItem}>
                <label className={styles.filtroLabel}>Eleição</label>
                <select className={styles.filtroSel} value={eleicaoBase} onChange={e => setEleicaoBase(e.target.value)}>
                  {eleicoes.length === 0
                    ? <option value="">Nenhuma eleição</option>
                    : [...new Map(eleicoes.map(el => [`${el.ano}|${el.tipo}`, el])).values()]
                        .map(el => {
                          const key = `${el.ano}|${el.tipo}`
                          const label = `${el.ano} — ${el.tipo.charAt(0).toUpperCase() + el.tipo.slice(1)}`
                          return <option key={key} value={key}>{label}</option>
                        })
                  }
                </select>
              </div>

              {turnos.length > 1 && (
                <div className={styles.filtroItem}>
                  <label className={styles.filtroLabel}>Turno</label>
                  <select className={styles.filtroSel} value={turno ?? ''} onChange={e => setTurno(Number(e.target.value))}>
                    {turnos.map(t => <option key={t} value={t}>{t}º turno</option>)}
                  </select>
                </div>
              )}

              <div className={styles.filtroItem}>
                <label className={styles.filtroLabel}>Cargo</label>
                <select className={styles.filtroSel} value={cargo} onChange={e => setCargo(e.target.value)} disabled={loadingFiltros || cargos.length === 0}>
                  <option value="">Selecione…</option>
                  {cargos.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className={styles.filtroItem}>
                <label className={styles.filtroLabel}>Candidato</label>
                <div ref={candRef} className={styles.candWrap} style={{ opacity: (!cargo || loadingFiltros) ? 0.45 : 1, pointerEvents: (!cargo || loadingFiltros) ? 'none' : 'auto' }}>
                  <div className={styles.candTriggerPanel} onClick={() => cargo && setCandAberto(v => !v)}>
                    <span className={nrVotavel ? styles.candValor : styles.candPlaceholder}>
                      {nrVotavel
                        ? (votaveis.find(v => v.nr_votavel === nrVotavel)?.nm_votavel ?? 'Selecione…')
                        : 'Selecione…'}
                    </span>
                    <i className={`fa-solid fa-chevron-${candAberto ? 'up' : 'down'} fa-xs`} style={{ color: 'var(--gray-400)', flexShrink: 0 }} />
                  </div>

                  {candAberto && (
                    <div className={styles.candDropdownPanel}>
                      <div className={styles.candSearch}>
                        <i className="fa-solid fa-magnifying-glass fa-xs" />
                        <input
                          autoFocus
                          className={styles.candInput}
                          placeholder="Buscar por nome ou número…"
                          value={buscaCand}
                          onChange={e => setBuscaCand(e.target.value)}
                        />
                        {buscaCand && (
                          <button className={styles.candClear} onClick={() => setBuscaCand('')}>
                            <i className="fa-solid fa-xmark fa-xs" />
                          </button>
                        )}
                      </div>
                      <div className={styles.candList}>
                        {votaveisFiltrados.slice(0, 50).map(v => {
                          const ativo = v.nr_votavel === nrVotavel && v.nm_votavel === nomeVotavelSel
                          return (
                            <button
                              key={`${v.nr_votavel}|${v.nm_votavel}`}
                              className={`${styles.candItem} ${ativo ? styles.candItemAtivo : ''}`}
                              onClick={() => { setNrVotavel(v.nr_votavel); setNomeVotavelSel(v.nm_votavel); setCandAberto(false); setBuscaCand('') }}
                            >
                              <span className={styles.candNr}>{v.nr_votavel}</span>
                              <span className={styles.candNome}>{v.nm_votavel}</span>
                            </button>
                          )
                        })}
                        {votaveisFiltrados.length === 0 && (
                          <div className={styles.candVazio}>Nenhum candidato encontrado</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {nrVotavel && (
                <button className={styles.filtroLimpar} onClick={() => { setNrVotavel(''); setCargo(''); setBuscaCand('') }}>
                  <i className="fa-solid fa-xmark fa-xs" /> Limpar filtros
                </button>
              )}
            </div>

            <div className={styles.divider} />

            {/* Candidato selecionado + resumo */}
            {votavelAtual && (
              <>
                <div className={styles.candidatoBox}>
                  <div className={styles.candidatoNome}>{votavelAtual.nm_votavel}</div>
                  <div className={styles.candidatoMeta}>
                    Nº {votavelAtual.nr_votavel}
                    {votavelAtual.ds_cargo && <> · {votavelAtual.ds_cargo}</>}
                    {eleicaoAtual && <> · {eleicaoAtual.ano} {turnos.length > 1 ? `T${turno}` : ''}</>}
                  </div>
                </div>

                {dadosMapa.length > 0 && (() => {
                  const totalGO    = dadosMapa.reduce((s, d) => s + d.total_votos, 0)
                  const top5       = dadosMapa.slice(0, 5)
                  const maxTop     = top5[0]?.total_votos || 1

                  return (
                    <div className={styles.resumoBox}>
                      <div className={styles.resumoTotais}>
                        <div className={styles.resumoStat}>
                          <span className={styles.resumoNum}>{totalGO.toLocaleString('pt-BR')}</span>
                          <span className={styles.resumoDesc}>votos em GO</span>
                        </div>
                        <div className={styles.resumoStat}>
                          <span className={styles.resumoNum}>{dadosMapa.length}</span>
                          <span className={styles.resumoDesc}>municípios</span>
                        </div>
                      </div>

                      <div className={styles.secLabel} style={{ marginTop: 12 }}>Top municípios</div>
                      <div className={styles.topMunList}>
                        {top5.map((d, i) => {
                          const ibge = d.cd_municipio_ibge ? String(parseInt(d.cd_municipio_ibge, 10)) : ''
                          const nm   = ibgeNomeMap.current.get(ibge) ?? d.cd_municipio_tse
                          const bar  = d.total_votos / maxTop * 100
                          return (
                            <div key={d.cd_municipio_tse} className={styles.topMunItem}>
                              <div className={styles.topMunTop}>
                                <span className={styles.topMunPos}>{i + 1}º</span>
                                <span className={styles.topMunNome}>{nm}</span>
                                <span className={styles.topMunVotos}>{d.total_votos.toLocaleString('pt-BR')}</span>
                              </div>
                              <div className={styles.barTrack}>
                                <div className={styles.barFill} style={{ width: `${bar}%`, background: corPorPct(d.pct_votos ?? 0) }} />
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })()}
              </>
            )}

            {/* ══ BRASIL ══ */}
            {nav.nivel === 'brasil' && (
              <div className={styles.infoBox}>
                <i className="fa-solid fa-circle-info" />
                <span>Selecione cargo e candidato nos filtros acima e clique em um município de <strong>Goiás</strong> para ver os dados eleitorais.</span>
              </div>
            )}

            {/* ══ REGIÃO / ESTADO ══ */}
            {(nav.nivel === 'regiao' || nav.nivel === 'estado') && (
              <div className={styles.infoBox}>
                <i className="fa-solid fa-hand-pointer" />
                <span>Clique em um município no mapa para ver os votos por zona eleitoral.</span>
              </div>
            )}

            {/* ══ MUNICÍPIO ══ */}
            {nav.nivel === 'municipio' && nav.municipio && (
              <>
                <div className={styles.munHeader}>
                  <div className={styles.munNome}>{nav.municipio.nome}</div>
                  <div className={styles.munMeta}>
                    <span className={styles.munBadgeUf} style={{ background: (nav.regiao?.cor ?? '#3b82f6') + '22', color: nav.regiao?.cor ?? '#3b82f6' }}>
                      {nav.municipio.uf}
                    </span>
                    <span className={styles.munCod}>Cód. IBGE {nav.municipio.codigo || '—'}</span>
                  </div>
                </div>

                {!nrVotavel ? (
                  <div className={styles.infoBox}>
                    <i className="fa-solid fa-circle-info" />
                    <span>Selecione um cargo e candidato nos filtros para ver os votos por zona.</span>
                  </div>
                ) : loadingZonas ? (
                  <div className={styles.resLoading}><i className="fa-solid fa-spinner fa-spin" /> Carregando zonas…</div>
                ) : zonas.length > 0 ? (
                  <>
                    <div className={styles.totalVotos}>
                      <span className={styles.totalNum}>{totalVotos?.toLocaleString('pt-BR')}</span>
                      <span className={styles.totalLabel}>votos totais neste município</span>
                    </div>

                    <div className={styles.secLabel}>Votos por zona eleitoral</div>
                    <div className={styles.zonaList}>
                      {zonas.map(z => {
                        const maxZona = Math.max(...zonas.map(z => z.total_votos))
                        const pct = maxZona > 0 ? z.total_votos / maxZona * 100 : 0
                        return (
                          <div key={z.nr_zona} className={styles.zonaItem}>
                            <div className={styles.zonaTop}>
                              <span className={styles.zonaBadge}>Zona {z.nr_zona}</span>
                              <span className={styles.zonaVotos}>{z.total_votos.toLocaleString('pt-BR')} votos</span>
                            </div>
                            <div className={styles.barTrack}>
                              <div className={styles.barFill} style={{ width: `${pct}%`, background: '#2563eb' }} />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </>
                ) : (
                  <div className={styles.infoBox}>
                    <i className="fa-solid fa-circle-xmark" />
                    <span>Sem dados para este município com os filtros selecionados.</span>
                  </div>
                )}
              </>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}
