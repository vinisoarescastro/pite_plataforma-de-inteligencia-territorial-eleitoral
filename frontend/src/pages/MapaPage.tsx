import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import styles from './MapaPage.module.css'
import {
  listarEleicoes, listarCargos, listarVotaveis,
  buscarVotacaoMapaUF, buscarZonasPorIbge, buscarRankingMunicipio,
  type Eleicao, type Votavel, type VotacaoMunicipio, type VotacaoZona, type RankingPorCargo,
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

// Populado dinamicamente ao carregar dados eleitorais do mapa
const UF_COM_DADOS_INICIAL = new Set<string>()

type Nivel = 'brasil' | 'regiao' | 'estado' | 'municipio'

interface NavState {
  nivel: Nivel
  regiao: typeof REGIOES[0] | null
  estado: string | null
  municipio: { nome: string; uf: string; codigo: string; codigoTse: string } | null
}

const NAV_INICIAL: NavState = { nivel: 'brasil', regiao: null, estado: null, municipio: null }

// Degradê contínuo: mínimo → meio → máximo
const COR_MIN = '#fef9c3'   // amarelo claro — poucos votos
const COR_MID = '#f97316'   // laranja — metade
const COR_MAX = '#7f1d1d'   // vermelho escuro — muitos votos

function hexToRgb(hex: string): [number, number, number] {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ]
}
function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(v => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('')
}
function lerpColor(a: string, b: string, t: number): string {
  const [ar, ag, ab] = hexToRgb(a)
  const [br, bg, bb] = hexToRgb(b)
  return rgbToHex(ar + (br - ar) * t, ag + (bg - ag) * t, ab + (bb - ab) * t)
}

function corPorPct(pct: number): string {
  const t = Math.max(0, Math.min(100, pct)) / 100
  return t <= 0.5
    ? lerpColor(COR_MIN, COR_MID, t * 2)
    : lerpColor(COR_MID, COR_MAX, (t - 0.5) * 2)
}

function estiloBase(uf: string, nav: NavState, ufsComDados: Set<string>): L.PathOptions {
  const regiaoUf = REGIOES.find(r => r.ufs.includes(uf))
  const temDados = ufsComDados.has(uf)

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
  const mapRef           = useRef<HTMLDivElement>(null)
  const mapInst          = useRef<L.Map | null>(null)
  const geojsonLayer     = useRef<L.GeoJSON | null>(null)
  const outlineLayer     = useRef<L.GeoJSON | null>(null)
  const selectedMunPath  = useRef<{ path: L.Path; feature: GeoJSON.Feature } | null>(null)
  const geoData          = useRef<GeoJSON.FeatureCollection | null>(null)
  const brasilGeo        = useRef<GeoJSON.FeatureCollection | null>(null)
  const regioesGeo       = useRef<GeoJSON.FeatureCollection | null>(null)
  const estadosGeo       = useRef<GeoJSON.FeatureCollection | null>(null)
  const ufLayers         = useRef<Record<string, L.Layer[]>>({})
  const navRef           = useRef<NavState>(NAV_INICIAL)
  const votacaoMap       = useRef<Map<string, number>>(new Map())
  const ibgeNomeMap      = useRef<Map<string, string>>(new Map())

  const [nav, setNavState]     = useState<NavState>(NAV_INICIAL)
  const [loading, setLoading]  = useState(false)
  const [filtrosAbertos, setFiltrosAbertos] = useState(true)

  // ── Filtros ──────────────────────────────────────────────────
  const [eleicoes, setEleicoes]               = useState<Eleicao[]>([])
  const [eleicaoId, setEleicaoId]             = useState('')
  const [eleicaoBase, setEleicaoBase]         = useState('')
  const [turnos, setTurnos]                   = useState<number[]>([])
  const [turno, setTurno]                     = useState<number | null>(null)
  const [cargos, setCargos]                   = useState<string[]>([])
  const [cargo, setCargo]                     = useState('')
  const [votaveis, setVotaveis]               = useState<Votavel[]>([])
  const [nrVotavel, setNrVotavel]             = useState('')
  const [loadingFiltros, setLoadingFiltros]   = useState(false)
  const [temDadosMapa, setTemDadosMapa]       = useState(false)
  const [buscaCand, setBuscaCand]             = useState('')
  const [candAberto, setCandAberto]           = useState(false)
  const candRef                               = useRef<HTMLDivElement>(null)
  const [nomeVotavelSel, setNomeVotavelSel]   = useState('')

  // ── Dados do painel lateral ──────────────────────────────────
  const [zonas, setZonas]               = useState<VotacaoZona[]>([])
  const [loadingZonas, setLoadingZonas] = useState(false)
  const [totalVotos, setTotalVotos]     = useState<number | null>(null)
  const [dadosMapa, setDadosMapa]       = useState<VotacaoMunicipio[]>([])
  const [ranking, setRanking]           = useState<RankingPorCargo[]>([])
  const [loadingRanking, setLoadingRanking] = useState(false)
  const [ufsComDados, setUfsComDados]   = useState<Set<string>>(UF_COM_DADOS_INICIAL)
  const ufsComDadosRef                  = useRef<Set<string>>(UF_COM_DADOS_INICIAL)

  function setNav(next: NavState) {
    navRef.current = next
    setNavState(next)
  }

  useEffect(() => {
    listarEleicoes().then(data => {
      setEleicoes(data)
      if (data.length > 0) {
        const base = `${data[0].ano}|${data[0].tipo}`
        setEleicaoBase(base)
      }
    }).catch(() => {})
  }, [])

  useEffect(() => {
    if (!eleicaoBase || eleicoes.length === 0) return
    const [ano, tipo] = eleicaoBase.split('|')
    const grupo = eleicoes.filter(e => String(e.ano) === ano && e.tipo === tipo)
    const turnosEl = grupo.map(e => e.turno).sort()
    setTurnos(turnosEl)
    const t0 = turnosEl[0] ?? null
    setTurno(t0)
    const elMatch = grupo.find(e => e.turno === t0)
    setEleicaoId(elMatch?.id ?? '')
    setCargo('')
    setNrVotavel('')
  }, [eleicaoBase, eleicoes])

  useEffect(() => {
    if (!eleicaoBase || turno == null || eleicoes.length === 0) return
    const [ano, tipo] = eleicaoBase.split('|')
    const elMatch = eleicoes.find(e => String(e.ano) === ano && e.tipo === tipo && e.turno === turno)
    if (elMatch) setEleicaoId(elMatch.id)
    setCargo('')
    setNrVotavel('')
  }, [turno])

  useEffect(() => {
    if (!eleicaoId) return
    setLoadingFiltros(true)
    listarCargos(eleicaoId)
      .then(data => { setCargos(data); setCargo(''); setNrVotavel('') })
      .catch(() => { setCargos([]) })
      .finally(() => setLoadingFiltros(false))
  }, [eleicaoId])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (candRef.current && !candRef.current.contains(e.target as Node))
        setCandAberto(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

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

  const recolorirMapa = useCallback(async () => {
    const ufAtual = navRef.current.estado
    if (!eleicaoId || !nrVotavel || !nomeVotavelSel || !ufAtual) {
      votacaoMap.current.clear()
      setTemDadosMapa(false)
      setDadosMapa([])
      geojsonLayer.current?.setStyle(f => estiloBase((f as GeoJSON.Feature)?.properties?.SIGLA_UF ?? '', navRef.current, ufsComDadosRef.current))
      return
    }
    try {
      const dados: VotacaoMunicipio[] = await buscarVotacaoMapaUF(
        ufAtual, eleicaoId, { nr_votavel: nrVotavel, nm_votavel: nomeVotavelSel, nr_turno: turno ?? undefined }
      )
      const ordenados = [...dados].sort((a, b) => b.total_votos - a.total_votos)
      setDadosMapa(ordenados)
      votacaoMap.current.clear()
      dados.forEach(d => {
        if (d.cd_municipio_ibge) {
          votacaoMap.current.set(String(parseInt(d.cd_municipio_ibge, 10)), d.pct_votos ?? 0)
        }
      })
      // Marca essa UF como tendo dados no indicador do mapa-brasil
      if (dados.length > 0) {
        const novas = new Set(ufsComDadosRef.current).add(ufAtual)
        ufsComDadosRef.current = novas
        setUfsComDados(novas)
      }
      setTemDadosMapa(votacaoMap.current.size > 0)
      geojsonLayer.current?.setStyle(f => estiloComVotos(f as GeoJSON.Feature))
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

  function estiloComVotos(feature: GeoJSON.Feature | undefined): L.PathOptions {
    const uf   = feature?.properties?.SIGLA_UF ?? ''
    const ibge = feature?.properties?.CD_MUN ?? ''
    const base = estiloBase(uf, navRef.current, ufsComDadosRef.current)
    if (votacaoMap.current.size > 0 && uf === navRef.current.estado) {
      const key = String(parseInt(String(ibge), 10))
      const pct = votacaoMap.current.get(key)
      if (pct != null) return { ...base, fillColor: corPorPct(pct), fillOpacity: 0.8 }
      return { ...base, fillColor: '#f3f4f6', fillOpacity: 0.5 }
    }
    return base
  }

  // ── Zonas (quando candidato selecionado) ─────────────────────
  useEffect(() => {
    const ibge = nav.municipio?.codigo
    if (!ibge || !eleicaoId || !nrVotavel) { setZonas([]); setTotalVotos(null); return }
    setLoadingZonas(true)
    buscarZonasPorIbge(ibge, eleicaoId, { nr_votavel: nrVotavel, nr_turno: turno ?? undefined })
      .then((data: VotacaoZona[]) => {
        setZonas(data)
        setTotalVotos(data.reduce((s: number, z: VotacaoZona) => s + z.total_votos, 0))
      })
      .catch(() => { setZonas([]); setTotalVotos(null) })
      .finally(() => setLoadingZonas(false))
  }, [nav.municipio?.codigo, eleicaoId, nrVotavel, turno])

  // ── Ranking (quando NÃO há candidato selecionado) ─────────────
  useEffect(() => {
    const ibge = nav.municipio?.codigo
    if (!ibge || !eleicaoId || nrVotavel) { setRanking([]); return }
    setLoadingRanking(true)
    buscarRankingMunicipio(ibge, eleicaoId, { nr_turno: turno ?? undefined, ds_cargo: cargo || undefined })
      .then(data => setRanking(data))
      .catch(() => setRanking([]))
      .finally(() => setLoadingRanking(false))
  }, [nav.municipio?.codigo, eleicaoId, nrVotavel, turno, cargo])

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

  useEffect(() => {
    if (nav.nivel !== 'municipio') resetarMunSelecionado()
    if (votacaoMap.current.size > 0) {
      geojsonLayer.current?.setStyle(f => estiloComVotos(f as GeoJSON.Feature))
    } else {
      geojsonLayer.current?.setStyle(f => estiloBase((f as GeoJSON.Feature)?.properties?.SIGLA_UF ?? '', nav, ufsComDadosRef.current))
    }
    atualizarContorno(nav)
    if (nav.nivel === 'municipio' && selectedMunPath.current) {
      const cor = REGIOES.find(r => r.ufs.includes(nav.estado ?? ''))?.cor ?? '#3b82f6'
      const base = estiloComVotos(selectedMunPath.current.feature)
      selectedMunPath.current.path.setStyle({ ...base, color: cor, weight: 4, opacity: 1 })
      selectedMunPath.current.path.bringToFront()
    }
  }, [nav])

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

      ;(data as GeoJSON.FeatureCollection).features.forEach(f => {
        const cd = String(f.properties?.CD_MUN ?? '')
        const nm = String(f.properties?.NM_MUN ?? '')
        if (cd && nm) ibgeNomeMap.current.set(String(parseInt(cd, 10)), nm)
      })

      const layer = L.geoJSON(data, {
        style: (f) => estiloBase((f as GeoJSON.Feature)?.properties?.SIGLA_UF ?? '', navRef.current, ufsComDadosRef.current),
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
              // Clicou no município já selecionado → desselecionar
              if (navRef.current.nivel === 'municipio' && navRef.current.municipio?.codigo === codigo) {
                resetarMunSelecionado()
                const regiaoObj = navRef.current.regiao
                setNav({ nivel: 'estado', regiao: regiaoObj, estado: uf, municipio: null })
                const layers = ufLayers.current[uf] ?? []
                if (layers.length > 0) {
                  mapInst.current?.fitBounds(
                    L.featureGroup(layers as L.Layer[]).getBounds(),
                    { padding: [30, 30] }
                  )
                }
                return
              }

              if (selectedMunPath.current) {
                selectedMunPath.current.path.setStyle(estiloComVotos(selectedMunPath.current.feature))
              }
              if (outlineLayer.current) { map.removeLayer(outlineLayer.current); outlineLayer.current = null }
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

  const votavelAtual = votaveisUnicos.find(v => v.nr_votavel === nrVotavel && v.nm_votavel === nomeVotavelSel)
    ?? votaveisUnicos.find(v => v.nr_votavel === nrVotavel)

  // título do painel
  const panelTitle =
    nav.nivel === 'brasil'    ? 'Brasil' :
    nav.nivel === 'regiao'    ? `Região ${nav.regiao?.nome}` :
    nav.nivel === 'estado'    ? (UF_NOMES[nav.estado ?? ''] ?? nav.estado) :
    nav.municipio?.nome ?? ''

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

          {/* ── Filtros overlay ── */}
          <div className={styles.filterCard}>
            {/* Cabeçalho clicável para recolher/expandir */}
            <button
              className={`${styles.filterCardTitle} ${!filtrosAbertos ? styles.filterCardTitleCollapsed : ''}`}
              onClick={() => setFiltrosAbertos(v => !v)}
            >
              <div className={styles.filterCardTitleLeft}>
                <i className="fa-solid fa-sliders fa-xs" />
                <span>Filtros</span>
              </div>
              {!filtrosAbertos && (() => {
                const qtd = [eleicaoBase, cargo, nrVotavel].filter(Boolean).length
                if (qtd === 0) return null
                const nomeCand = nrVotavel ? (nomeVotavelSel || votaveis.find(v => v.nr_votavel === nrVotavel)?.nm_votavel || '') : ''
                return (
                  <div className={styles.fcResumoWrap}>
                    <span className={styles.fcResumoBadge}>{qtd} filtro{qtd > 1 ? 's' : ''}</span>
                    {nomeCand && <span className={styles.fcResumoCand}>{nomeCand}</span>}
                  </div>
                )
              })()}
              <i className={`fa-solid fa-chevron-${filtrosAbertos ? 'up' : 'down'} fa-xs`} style={{ color: 'var(--gray-400)', flexShrink: 0 }} />
            </button>

            {filtrosAbertos && (
              <>
                {/* Eleição */}
                <div className={styles.fcItem}>
                  <div className={styles.fcLabelRow}>
                    <span className={`${styles.fcStep} ${eleicaoBase ? styles.fcStepDone : ''}`}>1</span>
                    <label className={styles.fcLabel}>Eleição</label>
                  </div>
                  <div className={styles.fcSelWrap}>
                    <select
                      className={styles.fcSel}
                      value={eleicaoBase}
                      onChange={e => setEleicaoBase(e.target.value)}
                    >
                      {eleicoes.length === 0
                        ? <option value="">Nenhuma eleição</option>
                        : [...new Map(eleicoes.map(el => [`${el.ano}|${el.tipo}`, el])).values()]
                            .map(el => {
                              const key = `${el.ano}|${el.tipo}`
                              return <option key={key} value={key}>{el.ano} — {el.tipo.charAt(0).toUpperCase() + el.tipo.slice(1)}</option>
                            })
                      }
                    </select>
                    <i className="fa-solid fa-chevron-down fa-xs" style={{ position: 'absolute', right: 9, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--gray-400)', fontSize: 10 }} />
                  </div>
                </div>

                {/* Turno */}
                {turnos.length > 1 && (
                  <div className={styles.fcItem}>
                    <div className={styles.fcLabelRow}>
                      <span className={`${styles.fcStep} ${turno != null ? styles.fcStepDone : ''}`}>2</span>
                      <label className={styles.fcLabel}>Turno</label>
                    </div>
                    <div className={styles.fcSelWrap}>
                      <select className={styles.fcSel} value={turno ?? ''} onChange={e => setTurno(Number(e.target.value))}>
                        {turnos.map(t => <option key={t} value={t}>{t}º turno</option>)}
                      </select>
                      <i className="fa-solid fa-chevron-down fa-xs" style={{ position: 'absolute', right: 9, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--gray-400)', fontSize: 10 }} />
                    </div>
                  </div>
                )}

                {/* Cargo */}
                <div className={styles.fcItem}>
                  <div className={styles.fcLabelRow}>
                    <span className={`${styles.fcStep} ${cargo ? styles.fcStepDone : ''}`}>{turnos.length > 1 ? '3' : '2'}</span>
                    <label className={styles.fcLabel}>Cargo</label>
                    {loadingFiltros && !cargo && <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: 10, color: 'var(--brand-400)' }} />}
                    {cargos.length > 0 && !cargo && <span className={styles.fcCount}>{cargos.length}</span>}
                  </div>
                  <div className={styles.fcSelWrap}>
                    <select
                      className={styles.fcSel}
                      value={cargo}
                      onChange={e => setCargo(e.target.value)}
                      disabled={loadingFiltros || cargos.length === 0}
                    >
                      <option value="">Selecione…</option>
                      {cargos.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    {loadingFiltros && !cargo
                      ? <i className="fa-solid fa-spinner fa-spin" style={{ position: 'absolute', right: 9, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--brand-400)', fontSize: 10 }} />
                      : <i className="fa-solid fa-chevron-down fa-xs" style={{ position: 'absolute', right: 9, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--gray-400)', fontSize: 10 }} />
                    }
                  </div>
                </div>

                {/* Candidato */}
                <div className={styles.fcItem}>
                  <div className={styles.fcLabelRow}>
                    <span className={`${styles.fcStep} ${nrVotavel ? styles.fcStepDone : ''}`}>{turnos.length > 1 ? '4' : '3'}</span>
                    <label className={styles.fcLabel}>Candidato</label>
                    {loadingFiltros && cargo && <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: 10, color: 'var(--brand-400)' }} />}
                    {votaveisUnicos.length > 0 && !nrVotavel && <span className={styles.fcCount}>{votaveisUnicos.length}</span>}
                  </div>
                  <div
                    ref={candRef}
                    className={styles.fcCandWrap}
                  >
                    <div
                      className={`${styles.fcCandTrigger} ${!cargo || loadingFiltros ? styles.fcCandDisabled : ''} ${candAberto ? styles.fcCandTriggerOpen : ''}`}
                      onClick={() => cargo && !loadingFiltros && setCandAberto(v => !v)}
                    >
                      <span className={nrVotavel ? styles.fcCandValor : styles.fcCandPlaceholder}>
                        {nrVotavel
                          ? (nomeVotavelSel || votaveis.find(v => v.nr_votavel === nrVotavel)?.nm_votavel || 'Selecione…')
                          : 'Selecione…'}
                      </span>
                      {nrVotavel
                        ? <i className="fa-solid fa-xmark fa-xs" style={{ color: 'var(--gray-400)', flexShrink: 0 }} onClick={e => { e.stopPropagation(); setNrVotavel(''); setNomeVotavelSel(''); setBuscaCand('') }} />
                        : <i className={`fa-solid fa-chevron-${candAberto ? 'up' : 'down'} fa-xs`} style={{ color: 'var(--gray-400)', flexShrink: 0 }} />
                      }
                    </div>

                    {candAberto && (
                      <div className={styles.fcCandDropdown}>
                        {votaveisUnicos.length > 0 && (
                          <div className={styles.fcCandDropHd}>
                            <span>{votaveisFiltrados.length === votaveisUnicos.length ? `${votaveisUnicos.length} candidatos` : `${votaveisFiltrados.length} de ${votaveisUnicos.length}`}</span>
                          </div>
                        )}
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

                {/* Limpar */}
                {(cargo || nrVotavel) && (
                  <>
                    <div className={styles.fcDivider} />
                    <button
                      className={styles.fcLimpar}
                      onClick={() => { setNrVotavel(''); setNomeVotavelSel(''); setCargo(''); setBuscaCand('') }}
                    >
                      <i className="fa-solid fa-rotate-left fa-xs" /> Limpar filtros
                    </button>
                  </>
                )}
              </>
            )}
          </div>

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

          {/* Legenda */}
          {temDadosMapa && (
            <div className={styles.mapLegenda}>
              <div className={styles.legTitle}>Votos relativos</div>
              <div
                className={styles.legGradBar}
                style={{ background: `linear-gradient(to right, ${COR_MIN}, ${COR_MID}, ${COR_MAX})` }}
              />
              <div className={styles.legGradLabels}>
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
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
            <span className={styles.panelTitle}>{panelTitle}</span>
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

            {/* ══ NÍVEL: BRASIL / REGIÃO / ESTADO ══ */}
            {nav.nivel !== 'municipio' && (
              <>
                {/* Candidato selecionado → resumo geral */}
                {votavelAtual ? (
                  <>
                    <div className={styles.candidatoBox}>
                      <div className={styles.candidatoNome}>{votavelAtual.nm_votavel}</div>
                      <div className={styles.candidatoMeta}>
                        Nº {votavelAtual.nr_votavel}
                        {votavelAtual.ds_cargo && <> · {votavelAtual.ds_cargo}</>}
                        {eleicaoAtual && <> · {eleicaoAtual.ano}{turnos.length > 1 ? ` T${turno}` : ''}</>}
                      </div>
                    </div>

                    {dadosMapa.length > 0 && (() => {
                      const totalGO = dadosMapa.reduce((s, d) => s + d.total_votos, 0)
                      const top5    = dadosMapa.slice(0, 5)
                      const maxTop  = top5[0]?.total_votos || 1
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

                    <div className={styles.infoBox} style={{ marginTop: 8 }}>
                      <i className="fa-solid fa-hand-pointer" />
                      <span>Clique em um município no mapa para ver os votos por zona eleitoral.</span>
                    </div>
                  </>
                ) : (
                  /* Sem candidato → instrução */
                  <div className={styles.infoBox}>
                    <i className="fa-solid fa-circle-info" />
                    <span>
                      {nav.nivel === 'brasil' || nav.nivel === 'regiao'
                        ? 'Selecione cargo e candidato nos filtros do mapa para visualizar os dados eleitorais.'
                        : 'Selecione um candidato nos filtros e clique em um município para ver os votos por zona.'}
                    </span>
                  </div>
                )}
              </>
            )}

            {/* ══ NÍVEL: MUNICÍPIO ══ */}
            {nav.nivel === 'municipio' && nav.municipio && (
              <>
                {/* Cabeçalho do município */}
                <div className={styles.munHeader}>
                  <div className={styles.munNome}>{nav.municipio.nome}</div>
                  <div className={styles.munMeta}>
                    <span
                      className={styles.munBadgeUf}
                      style={{ background: (nav.regiao?.cor ?? '#3b82f6') + '22', color: nav.regiao?.cor ?? '#3b82f6' }}
                    >
                      {nav.municipio.uf}
                    </span>
                    <span className={styles.munCod}>Cód. IBGE {nav.municipio.codigo || '—'}</span>
                  </div>
                </div>

                {/* COM candidato → votos totais + zonas */}
                {nrVotavel && votavelAtual && (
                  <>
                    <div className={styles.candidatoBox}>
                      <div className={styles.candidatoNome}>{votavelAtual.nm_votavel}</div>
                      <div className={styles.candidatoMeta}>
                        Nº {votavelAtual.nr_votavel}
                        {votavelAtual.ds_cargo && <> · {votavelAtual.ds_cargo}</>}
                        {eleicaoAtual && <> · {eleicaoAtual.ano}{turnos.length > 1 ? ` T${turno}` : ''}</>}
                      </div>
                    </div>

                    {loadingZonas ? (
                      <div className={styles.resLoading}>
                        <i className="fa-solid fa-spinner fa-spin" /> Carregando votos…
                      </div>
                    ) : zonas.length > 0 ? (
                      <>
                        <div className={styles.totalVotos}>
                          <span className={styles.totalNum}>{totalVotos?.toLocaleString('pt-BR')}</span>
                          <span className={styles.totalLabel}>votos neste município</span>
                        </div>
                        <div className={styles.secLabel}>Por zona eleitoral</div>
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

                {/* SEM candidato → ranking por cargo */}
                {!nrVotavel && (
                  loadingRanking ? (
                    <div className={styles.resLoading}>
                      <i className="fa-solid fa-spinner fa-spin" /> Carregando ranking…
                    </div>
                  ) : ranking.length > 0 ? (
                    <>
                      <div className={styles.secLabel}>Candidatos mais votados</div>
                      <div className={styles.rankingWrap}>
                        {ranking.map(grupo => (
                          <div key={grupo.ds_cargo} className={styles.rankingCargo}>
                            <div className={styles.rankingCargoHd}>
                              <span className={styles.rankingCargoNome}>{grupo.ds_cargo}</span>
                              <span className={styles.rankingCargoTotal}>{grupo.total_votos_cargo.toLocaleString('pt-BR')} votos</span>
                            </div>
                            <div className={styles.rankingList}>
                              {grupo.candidatos.map((c, i) => {
                                const bar = grupo.candidatos[0].total_votos > 0
                                  ? c.total_votos / grupo.candidatos[0].total_votos * 100
                                  : 0
                                return (
                                  <div key={c.nr_votavel} className={styles.rankingItem}>
                                    <div className={styles.rankingItemTop}>
                                      <span className={styles.rankingPos}>{i + 1}º</span>
                                      <span className={styles.rankingNome}>{c.nm_votavel}</span>
                                      <span className={styles.rankingVotos}>{c.total_votos.toLocaleString('pt-BR')}</span>
                                    </div>
                                    <div className={styles.barTrack}>
                                      <div
                                        className={styles.barFill}
                                        style={{ width: `${bar}%`, background: i === 0 ? '#1d4ed8' : '#60a5fa' }}
                                      />
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : !eleicaoId ? (
                    <div className={styles.infoBox}>
                      <i className="fa-solid fa-circle-info" />
                      <span>Selecione uma eleição nos filtros para ver os dados deste município.</span>
                    </div>
                  ) : (
                    <div className={styles.infoBox}>
                      <i className="fa-solid fa-circle-xmark" />
                      <span>Sem dados eleitorais para este município na eleição selecionada.</span>
                    </div>
                  )
                )}
              </>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}
