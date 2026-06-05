import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import styles from './MapaPage.module.css'
import {
  listarEleicoes, listarCandidatos,
  buscarResultadoMunicipio, buscarHistoricoMunicipio,
  type Eleicao, type Candidato, type ResultadoMunicipio, type HistoricoItem,
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

// ── Classificação territorial ──────────────────────────────────────
const CLASSIFICACOES = [
  { key: 'forca',       label: 'Zona de Força',  cor: '#1a7a4a' },
  { key: 'consolidado', label: 'Consolidado',     cor: '#0d5c37' },
  { key: 'expansao',    label: 'Expansão',        cor: '#5aab61' },
  { key: 'disputa',     label: 'Zona de Disputa', cor: '#f5a623' },
  { key: 'adversario',  label: 'Adversário',      cor: '#c0392b' },
  { key: 'neutro',      label: 'Neutro',          cor: '#bdc3c7' },
  { key: 'volatil',     label: 'Volátil',         cor: '#9b59b6' },
]

const CAMADAS = [
  { key: 'municipios', label: 'Municípios' },
  { key: 'zonas',      label: 'Zonas eleitorais' },
  { key: 'bairros',    label: 'Bairros' },
  { key: 'locais',     label: 'Locais de votação' },
]

// ── Tipos de navegação ─────────────────────────────────────────────
type Nivel = 'brasil' | 'regiao' | 'estado' | 'municipio'

interface NavState {
  nivel: Nivel
  regiao: typeof REGIOES[0] | null
  estado: string | null
  municipio: { nome: string; uf: string; codigo: string } | null
}

const NAV_INICIAL: NavState = { nivel: 'brasil', regiao: null, estado: null, municipio: null }

interface TerrStats {
  totalMunicipios: number
  totalEstados: number
  totalRegioes: number
  munComBairros: number
  porRegiao: { regiao: string; sigla: string; cor: string; municipios: number; estados: number }[]
  porUf: Record<string, number>
}

// ── Estilo do mapa por nível ───────────────────────────────────────
function estiloFeature(
  feature: GeoJSON.Feature | undefined,
  nav: NavState,
): L.PathOptions {
  const uf  = (feature?.properties?.SIGLA_UF ?? '') as string
  const cod = (feature?.properties?.CD_MUN   ?? '') as string
  const regiaoUf = REGIOES.find(r => r.ufs.includes(uf))

  switch (nav.nivel) {
    case 'brasil':
      return { fillColor: regiaoUf?.cor ?? '#bdc3c7', fillOpacity: 0.55, color: '#fff', weight: 0.3 }

    case 'regiao':
      if (nav.regiao?.ufs.includes(uf)) {
        return { fillColor: nav.regiao.cor, fillOpacity: 0.6, color: '#fff', weight: 0.5 }
      }
      return { fillColor: '#e5e7eb', fillOpacity: 0.12, color: '#d1d5db', weight: 0.2 }

    case 'estado':
      if (uf === nav.estado) {
        return { fillColor: regiaoUf?.cor ?? '#3b82f6', fillOpacity: 0.6, color: '#fff', weight: 0.5 }
      }
      return { fillColor: '#e5e7eb', fillOpacity: 0.1, color: '#d1d5db', weight: 0.2 }

    case 'municipio':
      if (cod === nav.municipio?.codigo) {
        return { fillColor: '#3b6ef2', fillOpacity: 0.75, color: '#1e35ae', weight: 2.5 }
      }
      if (uf === nav.estado) {
        return { fillColor: regiaoUf?.cor ?? '#3b82f6', fillOpacity: 0.3, color: '#fff', weight: 0.3 }
      }
      return { fillColor: '#e5e7eb', fillOpacity: 0.08, color: '#d1d5db', weight: 0.15 }
  }
}

// ── Componente ─────────────────────────────────────────────────────
export default function MapaPage() {
  const mapRef          = useRef<HTMLDivElement>(null)
  const mapInst         = useRef<L.Map | null>(null)
  const geojsonLayer    = useRef<L.GeoJSON | null>(null)
  const outlineLayer    = useRef<L.GeoJSON | null>(null)
  const geoData         = useRef<GeoJSON.FeatureCollection | null>(null)
  const brasilGeo       = useRef<GeoJSON.FeatureCollection | null>(null)
  const regioesGeo      = useRef<GeoJSON.FeatureCollection | null>(null)
  const estadosGeo      = useRef<GeoJSON.FeatureCollection | null>(null)
  const ufLayers        = useRef<Record<string, L.Layer[]>>({})
  const navRef          = useRef<NavState>(NAV_INICIAL)

  const [camadaAtiva, setCamadaAtiva]     = useState('municipios')
  const [nav, setNavState]               = useState<NavState>(NAV_INICIAL)
  const [loading, setLoading]            = useState(false)
  const [stats, setStats]               = useState<TerrStats | null>(null)

  // ── Dados eleitorais ───────────────────────────────────────────
  const [eleicoes, setEleicoes]           = useState<Eleicao[]>([])
  const [candidatos, setCandidatos]       = useState<Candidato[]>([])
  const [eleicaoId, setEleicaoId]         = useState<string>('')
  const [candidatoId, setCandidatoId]     = useState<string>('')
  const [resultado, setResultado]         = useState<ResultadoMunicipio | null>(null)
  const [historico, setHistorico]         = useState<HistoricoItem[]>([])
  const [loadingRes, setLoadingRes]       = useState(false)

  // Sincroniza ref com state (eventos Leaflet não enxergam state)
  function setNav(next: NavState) {
    navRef.current = next
    setNavState(next)
  }

  // ── Carrega eleições e candidatos na montagem ─────────────────
  useEffect(() => {
    listarEleicoes().then(data => {
      setEleicoes(data)
      if (data.length > 0) setEleicaoId(data[0].id)
    }).catch(() => {})
    listarCandidatos().then(data => {
      setCandidatos(data)
      if (data.length > 0) setCandidatoId(data[0].id)
    }).catch(() => {})
  }, [])

  // ── Busca resultado quando município, eleição ou candidato mudam ─
  useEffect(() => {
    const cd = nav.municipio?.codigo
    if (!cd || !eleicaoId || !candidatoId) {
      setResultado(null)
      setHistorico([])
      return
    }
    setLoadingRes(true)
    Promise.all([
      buscarResultadoMunicipio(cd, eleicaoId, candidatoId).catch(() => null),
      buscarHistoricoMunicipio(cd, candidatoId).catch(() => []),
    ]).then(([res, hist]) => {
      setResultado(res)
      setHistorico(hist as HistoricoItem[])
    }).finally(() => setLoadingRes(false))
  }, [nav.municipio?.codigo, eleicaoId, candidatoId])

  // ── Carrega arquivos de contorno dissolvido ────────────────────
  useEffect(() => {
    async function fetchOutlines() {
      const [b, r, e] = await Promise.all([
        fetch('/geo/brasil_outline.json').then(r => r.json()),
        fetch('/geo/regioes_outline.json').then(r => r.json()),
        fetch('/geo/estados_outline.json').then(r => r.json()),
      ])
      brasilGeo.current  = b
      regioesGeo.current = r
      estadosGeo.current = e
      // Aplica contorno inicial depois de carregar
      atualizarContorno(navRef.current)
    }
    fetchOutlines()
  }, [])

  // ── Camada de contorno usando GeoJSON pré-dissolvido ──────────
  function atualizarContorno(navState: NavState) {
    if (outlineLayer.current) {
      mapInst.current?.removeLayer(outlineLayer.current)
      outlineLayer.current = null
    }
    if (!mapInst.current) return

    let fc: GeoJSON.FeatureCollection | null = null
    let cor: string
    let weight: number

    switch (navState.nivel) {
      case 'brasil':
        fc     = brasilGeo.current
        cor    = '#000000a2'
        weight = 1.80
        break
      case 'regiao':
        if (!navState.regiao || !regioesGeo.current) return
        fc = {
          type: 'FeatureCollection',
          features: regioesGeo.current.features.filter(
            f => f.properties?.regiao === navState.regiao!.nome
          ),
        }
        cor    = navState.regiao.cor
        weight = 2.5
        break
      case 'estado':
        if (!navState.estado || !estadosGeo.current) return
        fc = {
          type: 'FeatureCollection',
          features: estadosGeo.current.features.filter(
            f => f.properties?.uf === navState.estado
          ),
        }
        cor    = REGIOES.find(r => r.ufs.includes(navState.estado!))?.cor ?? '#3b82f6'
        weight = 3
        break
      case 'municipio':
        if (!navState.municipio || !geoData.current) return
        fc = {
          type: 'FeatureCollection',
          features: geoData.current.features.filter(
            f => f.properties?.CD_MUN === navState.municipio!.codigo
          ),
        }
        cor    = '#1e35ae'
        weight = 3.5
        break
      default:
        return
    }

    if (!fc || fc.features.length === 0) return

    outlineLayer.current = L.geoJSON(
      fc as Parameters<typeof L.geoJSON>[0],
      {
        style: { fill: false, fillOpacity: 0, color: cor, weight, opacity: navState.nivel === 'brasil' ? 0.55 : 0.85 },
        interactive: false,
      }
    ).addTo(mapInst.current)
  }

  // ── Inicializa mapa ────────────────────────────────────────────
  useEffect(() => {
    if (mapInst.current || !mapRef.current) return

    const map = L.map(mapRef.current, {
      center: [-15.77, -47.93],
      zoom: 4,
      zoomControl: false,
      attributionControl: false,
    })
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      opacity: 0.5,
    }).addTo(map)
    mapInst.current = map
    carregarMunicipios(map)

    return () => {
      map.remove()
      mapInst.current      = null
      geojsonLayer.current = null
      outlineLayer.current = null
      geoData.current      = null
      ufLayers.current     = {}
    }
  }, [])

  // Re-estiliza e atualiza contorno quando o nível muda
  useEffect(() => {
    geojsonLayer.current?.setStyle(
      (feature) => estiloFeature(feature as GeoJSON.Feature, nav)
    )
    // Traz município selecionado ao topo
    if (nav.nivel === 'municipio' && nav.municipio) {
      geojsonLayer.current?.eachLayer(layer => {
        const f = (layer as L.GeoJSON).feature as GeoJSON.Feature | undefined
        if (f?.properties?.CD_MUN === nav.municipio?.codigo) {
          (layer as L.Path).bringToFront()
        }
      })
    }
    atualizarContorno(nav)
  }, [nav])

  async function carregarMunicipios(map: L.Map) {
    setLoading(true)
    try {
      const res = await fetch('/geo/municipios_br.json')
      if (!res.ok) throw new Error('Arquivo não encontrado')
      const data = await res.json()

      // Salva dados para reutilização na camada de contorno
      geoData.current = data

      // Calcula stats
      const features = data.features ?? []
      const ufsSet = new Set<string>()
      const munPorUf: Record<string, number> = {}

      for (const f of features) {
        const uf = f.properties?.SIGLA_UF ?? ''
        if (uf) {
          ufsSet.add(uf)
          munPorUf[uf] = (munPorUf[uf] ?? 0) + 1
        }
      }

      const porRegiao = REGIOES.map(r => {
        const ufsPresentes = r.ufs.filter(uf => ufsSet.has(uf))
        const totalMun = ufsPresentes.reduce((acc, uf) => acc + (munPorUf[uf] ?? 0), 0)
        return { regiao: r.nome, sigla: r.sigla, cor: r.cor, municipios: totalMun, estados: ufsPresentes.length }
      })

      setStats({
        totalMunicipios: features.length,
        totalEstados: ufsSet.size,
        totalRegioes: REGIOES.filter(r => r.ufs.some(uf => ufsSet.has(uf))).length,
        munComBairros: 0,
        porRegiao,
        porUf: munPorUf,
      })

      const layer = L.geoJSON(data, {
        style: (feature) => estiloFeature(feature as GeoJSON.Feature, navRef.current),
        onEachFeature: (feature, layer) => {
          const p      = feature.properties ?? {}
          const nome   = p.NM_MUN   ?? 'Município'
          const uf     = p.SIGLA_UF ?? ''
          const codigo = p.CD_MUN   ?? ''
          const path   = layer as L.Path

          // Acumula layers por UF para zoom
          if (!ufLayers.current[uf]) ufLayers.current[uf] = []
          ufLayers.current[uf].push(layer)

          layer.on({
            mouseover: () => {
              const cur = navRef.current
              const isSelecionado =
                cur.nivel === 'municipio' && cur.municipio?.codigo === codigo
              if (!isSelecionado) {
                path.setStyle({ weight: 2, color: '#1e40af', fillOpacity: 0.65 })
                path.bringToFront()
              }
            },
            mouseout: () => {
              const cur = navRef.current
              const isSelecionado =
                cur.nivel === 'municipio' && cur.municipio?.codigo === codigo
              if (!isSelecionado) {
                geojsonLayer.current?.resetStyle(path)
              }
            },
            click: () => {
              const regiaoObj = REGIOES.find(r => r.ufs.includes(uf)) ?? null
              const next: NavState = {
                nivel: 'municipio',
                regiao: regiaoObj,
                estado: uf,
                municipio: { nome, uf, codigo },
              }
              setNav(next)
              // Zoom para o município
              const bounds = (layer as L.GeoJSON).getBounds?.()
              if (bounds) map.fitBounds(bounds, { padding: [40, 40], maxZoom: 10 })
            },
          })
        },
      }).addTo(map)

      geojsonLayer.current = layer
      map.fitBounds(layer.getBounds())

      // Contorno inicial do Brasil inteiro
      atualizarContorno(navRef.current)
    } catch (e) {
      console.error('Erro ao carregar municípios:', e)
    } finally {
      setLoading(false)
    }
  }

  // ── Navegação hierárquica ──────────────────────────────────────
  function irParaBrasil() {
    setNav(NAV_INICIAL)
    if (geojsonLayer.current) {
      mapInst.current?.fitBounds(geojsonLayer.current.getBounds())
    }
  }

  function irParaRegiao(regiao: typeof REGIOES[0]) {
    setNav({ nivel: 'regiao', regiao, estado: null, municipio: null })
    const layers = regiao.ufs.flatMap(uf => ufLayers.current[uf] ?? [])
    if (layers.length > 0) {
      const group = L.featureGroup(layers as L.Layer[])
      mapInst.current?.fitBounds(group.getBounds(), { padding: [30, 30] })
    }
  }

  function irParaEstado(uf: string) {
    const regiaoObj = REGIOES.find(r => r.ufs.includes(uf)) ?? null
    setNav({ nivel: 'estado', regiao: regiaoObj, estado: uf, municipio: null })
    const layers = ufLayers.current[uf] ?? []
    if (layers.length > 0) {
      const group = L.featureGroup(layers as L.Layer[])
      mapInst.current?.fitBounds(group.getBounds(), { padding: [30, 30] })
    }
  }

  function zoomIn()    { mapInst.current?.zoomIn() }
  function zoomOut()   { mapInst.current?.zoomOut() }
  function resetView() { irParaBrasil() }

  const maxMunRegiao = Math.max(...(stats?.porRegiao.map(r => r.municipios) ?? [1]))

  // ── Painel: estados de uma região ─────────────────────────────
  function estadosDaRegiao(regiao: typeof REGIOES[0]) {
    return regiao.ufs
      .filter(uf => stats?.porUf[uf])
      .map(uf => ({ uf, nome: UF_NOMES[uf] ?? uf, municipios: stats?.porUf[uf] ?? 0 }))
      .sort((a, b) => a.nome.localeCompare(b.nome))
  }

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

          {/* Toolbar de camadas */}
          <div className={styles.mapTools}>
            {CAMADAS.map(c => (
              <button
                key={c.key}
                className={`${styles.mapTb} ${camadaAtiva === c.key ? styles.mapTbActive : ''}`}
                onClick={() => setCamadaAtiva(c.key)}
              >
                {c.label}
              </button>
            ))}
          </div>

          {/* Breadcrumb sobre o mapa */}
          <div className={styles.mapBreadcrumb}>
            <button className={styles.bcBtn} onClick={irParaBrasil}>
              <i className="fa-solid fa-earth-americas" /> Brasil
            </button>
            {nav.regiao && (
              <>
                <i className="fa-solid fa-chevron-right fa-xs" style={{ color: 'var(--gray-400)' }} />
                <button
                  className={`${styles.bcBtn} ${nav.nivel !== 'regiao' ? '' : styles.bcBtnActive}`}
                  onClick={() => irParaRegiao(nav.regiao!)}
                  style={{ color: nav.regiao.cor }}
                >
                  {nav.regiao.nome}
                </button>
              </>
            )}
            {nav.estado && (
              <>
                <i className="fa-solid fa-chevron-right fa-xs" style={{ color: 'var(--gray-400)' }} />
                <button
                  className={`${styles.bcBtn} ${nav.nivel !== 'estado' ? '' : styles.bcBtnActive}`}
                  onClick={() => irParaEstado(nav.estado!)}
                >
                  {UF_NOMES[nav.estado] ?? nav.estado}
                </button>
              </>
            )}
            {nav.municipio && (
              <>
                <i className="fa-solid fa-chevron-right fa-xs" style={{ color: 'var(--gray-400)' }} />
                <span className={`${styles.bcBtn} ${styles.bcBtnActive}`}>
                  {nav.municipio.nome}
                </span>
              </>
            )}
          </div>

          {/* Filtros */}
          <div className={styles.mapFilters}>
            <select
              className={styles.mapSel}
              value={eleicaoId}
              onChange={e => setEleicaoId(e.target.value)}
            >
              {eleicoes.length === 0
                ? <option value="">Nenhuma eleição importada</option>
                : eleicoes.map(el => (
                    <option key={el.id} value={el.id}>
                      {el.descricao ?? `${el.ano} · T${el.turno}`}
                    </option>
                  ))
              }
            </select>
            <select
              className={styles.mapSel}
              value={candidatoId}
              onChange={e => setCandidatoId(e.target.value)}
            >
              {candidatos.length === 0
                ? <option value="">Nenhum candidato cadastrado</option>
                : candidatos.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.nm_candidato} {c.sg_partido ? `· ${c.sg_partido}` : ''}
                    </option>
                  ))
              }
            </select>
          </div>

          {/* Zoom */}
          <div className={styles.mapZoom}>
            <button onClick={zoomIn}    title="Ampliar"><i className="fa-solid fa-plus" /></button>
            <button onClick={zoomOut}   title="Reduzir"><i className="fa-solid fa-minus" /></button>
            <button onClick={resetView} title="Ver Brasil todo"><i className="fa-solid fa-expand" /></button>
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

            {/* ══ BRASIL ══ */}
            {nav.nivel === 'brasil' && (
              <>
                <div className={styles.statRow4}>
                  <div className={styles.statCard}>
                    <div className={styles.statIcon} style={{ background: '#eff6ff', color: '#3b82f6' }}>
                      <i className="fa-solid fa-earth-americas" />
                    </div>
                    <div className={styles.statNum}>{loading ? '…' : (stats?.totalRegioes ?? '—')}</div>
                    <div className={styles.statDesc}>Regiões</div>
                  </div>
                  <div className={styles.statCard}>
                    <div className={styles.statIcon} style={{ background: '#f0fdf4', color: '#16a34a' }}>
                      <i className="fa-solid fa-flag" />
                    </div>
                    <div className={styles.statNum}>{loading ? '…' : (stats?.totalEstados ?? '—')}</div>
                    <div className={styles.statDesc}>Estados</div>
                  </div>
                  <div className={styles.statCard}>
                    <div className={styles.statIcon} style={{ background: '#faf5ff', color: '#9333ea' }}>
                      <i className="fa-solid fa-map-location-dot" />
                    </div>
                    <div className={styles.statNum}>{loading ? '…' : (stats?.totalMunicipios.toLocaleString('pt-BR') ?? '—')}</div>
                    <div className={styles.statDesc}>Municípios</div>
                  </div>
                  <div className={styles.statCard}>
                    <div className={styles.statIcon} style={{ background: '#fff7ed', color: '#ea580c' }}>
                      <i className="fa-solid fa-map-pin" />
                    </div>
                    <div className={styles.statNum}>{loading ? '…' : 0}</div>
                    <div className={styles.statDesc}>Com Bairros</div>
                  </div>
                </div>

                <div className={styles.secLabel} style={{ marginBottom: 8 }}>
                  Regiões — clique para explorar
                </div>
                <div className={styles.regiaoCards}>
                  {REGIOES.map(r => {
                    const dado = stats?.porRegiao.find(p => p.regiao === r.nome)
                    return (
                      <button key={r.nome} className={styles.regiaoCard} onClick={() => irParaRegiao(r)}
                        style={{ borderColor: r.cor + '55' }}>
                        <div className={styles.rcTop}>
                          <span className={styles.rcBadge} style={{ background: r.cor + '22', color: r.cor }}>{r.sigla}</span>
                          <span className={styles.rcNome}>{r.nome}</span>
                          <i className="fa-solid fa-chevron-right fa-xs" style={{ color: r.cor }} />
                        </div>
                        <div className={styles.rcMeta}>
                          {dado?.estados ?? '—'} estados · {dado?.municipios.toLocaleString('pt-BR') ?? '—'} municípios
                        </div>
                        <div className={styles.barTrack}>
                          <div className={styles.barFill}
                            style={{ width: `${((dado?.municipios ?? 0) / maxMunRegiao) * 100}%`, background: r.cor }} />
                        </div>
                      </button>
                    )
                  })}
                </div>

                <div className={styles.divider} />
                <div className={styles.secLabel}>Classificação territorial</div>
                <div className={styles.legGrid}>
                  {CLASSIFICACOES.map(c => (
                    <div key={c.key} className={styles.legItem}>
                      <span className={styles.legDot} style={{ background: c.cor }} />
                      {c.label}
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* ══ REGIÃO ══ */}
            {nav.nivel === 'regiao' && nav.regiao && (
              <>
                <div className={styles.statRow2}>
                  <div className={styles.statCard}>
                    <div className={styles.statIcon} style={{ background: nav.regiao.cor + '22', color: nav.regiao.cor }}>
                      <i className="fa-solid fa-flag" />
                    </div>
                    <div className={styles.statNum}>
                      {stats?.porRegiao.find(p => p.regiao === nav.regiao!.nome)?.estados ?? '—'}
                    </div>
                    <div className={styles.statDesc}>Estados</div>
                  </div>
                  <div className={styles.statCard}>
                    <div className={styles.statIcon} style={{ background: nav.regiao.cor + '22', color: nav.regiao.cor }}>
                      <i className="fa-solid fa-map-location-dot" />
                    </div>
                    <div className={styles.statNum}>
                      {stats?.porRegiao.find(p => p.regiao === nav.regiao!.nome)?.municipios.toLocaleString('pt-BR') ?? '—'}
                    </div>
                    <div className={styles.statDesc}>Municípios</div>
                  </div>
                </div>

                <div className={styles.secLabel} style={{ marginBottom: 8 }}>
                  Estados — clique para explorar
                </div>
                <div className={styles.stateList}>
                  {estadosDaRegiao(nav.regiao).map(est => {
                    const maxMun = Math.max(...estadosDaRegiao(nav.regiao!).map(e => e.municipios))
                    return (
                      <button key={est.uf} className={styles.stateItem}
                        onClick={() => irParaEstado(est.uf)}>
                        <div className={styles.stateTop}>
                          <span className={styles.stateUf}
                            style={{ background: nav.regiao!.cor + '22', color: nav.regiao!.cor }}>
                            {est.uf}
                          </span>
                          <span className={styles.stateNome}>{est.nome}</span>
                          <span className={styles.stateMun}>{est.municipios} mun</span>
                          <i className="fa-solid fa-chevron-right fa-xs" style={{ color: 'var(--gray-300)' }} />
                        </div>
                        <div className={styles.barTrack}>
                          <div className={styles.barFill}
                            style={{ width: `${(est.municipios / maxMun) * 100}%`, background: nav.regiao!.cor }} />
                        </div>
                      </button>
                    )
                  })}
                </div>
              </>
            )}

            {/* ══ ESTADO ══ */}
            {nav.nivel === 'estado' && nav.estado && (
              <>
                <div className={styles.statRow2}>
                  <div className={styles.statCard}>
                    <div className={styles.statIcon}
                      style={{ background: (nav.regiao?.cor ?? '#3b82f6') + '22', color: nav.regiao?.cor ?? '#3b82f6' }}>
                      <i className="fa-solid fa-map-location-dot" />
                    </div>
                    <div className={styles.statNum}>
                      {stats?.porUf[nav.estado]?.toLocaleString('pt-BR') ?? '—'}
                    </div>
                    <div className={styles.statDesc}>Municípios</div>
                  </div>
                  <div className={styles.statCard}>
                    <div className={styles.statIcon}
                      style={{ background: '#fff7ed', color: '#ea580c' }}>
                      <i className="fa-solid fa-map-pin" />
                    </div>
                    <div className={styles.statNum}>0</div>
                    <div className={styles.statDesc}>Com Bairros</div>
                  </div>
                </div>

                <div className={styles.infoBox}>
                  <i className="fa-solid fa-hand-pointer" />
                  <span>Clique em um município no mapa para ver detalhes.</span>
                </div>

                <div className={styles.divider} />
                <div className={styles.secLabel}>Classificação territorial</div>
                <div className={styles.legGrid}>
                  {CLASSIFICACOES.map(c => (
                    <div key={c.key} className={styles.legItem}>
                      <span className={styles.legDot} style={{ background: c.cor }} />
                      {c.label}
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* ══ MUNICÍPIO ══ */}
            {nav.nivel === 'municipio' && nav.municipio && (
              <>
                <div className={styles.munHeader}>
                  <div className={styles.munNome}>{nav.municipio.nome}</div>
                  <div className={styles.munMeta}>
                    <span className={styles.munBadgeUf}
                      style={{ background: (nav.regiao?.cor ?? '#3b82f6') + '22', color: nav.regiao?.cor ?? '#3b82f6' }}>
                      {nav.municipio.uf}
                    </span>
                    <span className={styles.munCod}>Cód. IBGE {nav.municipio.codigo || '—'}</span>
                  </div>
                </div>

                {/* Cards de resultado */}
                {loadingRes ? (
                  <div className={styles.resLoading}>
                    <i className="fa-solid fa-spinner fa-spin" /> Carregando dados…
                  </div>
                ) : resultado ? (
                  <>
                    <div className={styles.statRow4}>
                      <div className={styles.statCard}>
                        <div className={styles.statIcon} style={{ background: '#eff6ff', color: '#3b82f6' }}>
                          <i className="fa-solid fa-check-to-slot" />
                        </div>
                        <div className={styles.statNum}>
                          {resultado.qt_votos_nominais.toLocaleString('pt-BR')}
                        </div>
                        <div className={styles.statDesc}>Votos</div>
                      </div>
                      <div className={styles.statCard}>
                        <div className={styles.statIcon} style={{ background: '#f0fdf4', color: '#16a34a' }}>
                          <i className="fa-solid fa-percent" />
                        </div>
                        <div className={styles.statNum}>
                          {resultado.pct_votos != null ? `${resultado.pct_votos.toFixed(1)}%` : '—'}
                        </div>
                        <div className={styles.statDesc}>dos válidos</div>
                      </div>
                      <div className={styles.statCard}>
                        <div className={styles.statIcon} style={{ background: '#faf5ff', color: '#9333ea' }}>
                          <i className="fa-solid fa-users" />
                        </div>
                        <div className={styles.statNum}>
                          {resultado.qt_aptos != null ? resultado.qt_aptos.toLocaleString('pt-BR') : '—'}
                        </div>
                        <div className={styles.statDesc}>Aptos</div>
                      </div>
                      <div className={styles.statCard}>
                        <div className={styles.statIcon} style={{ background: '#fff7ed', color: '#ea580c' }}>
                          <i className="fa-solid fa-xmark" />
                        </div>
                        <div className={styles.statNum}>
                          {resultado.qt_abstencoes != null ? resultado.qt_abstencoes.toLocaleString('pt-BR') : '—'}
                        </div>
                        <div className={styles.statDesc}>Abstenções</div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className={styles.infoBox} style={{ marginBottom: 12 }}>
                    <i className="fa-solid fa-circle-info" />
                    <span>
                      {(!eleicaoId || !candidatoId)
                        ? 'Selecione uma eleição e um candidato nos filtros acima.'
                        : 'Sem dados para este município na eleição selecionada.'}
                    </span>
                  </div>
                )}

                <div className={styles.divider} />

                <div className={styles.secLabel}>Histórico de votos</div>
                {historico.length > 0 ? (
                  <table className={styles.histTbl}>
                    <thead>
                      <tr><th>Eleição</th><th>Votos</th><th>%</th></tr>
                    </thead>
                    <tbody>
                      {historico.map((h, i) => {
                        const prev = historico[i + 1]
                        const var_ = prev ? h.qt_votos_nominais - prev.qt_votos_nominais : null
                        return (
                          <tr key={h.eleicao_id}>
                            <td>{h.ano} T{h.turno}</td>
                            <td>{h.qt_votos_nominais.toLocaleString('pt-BR')}</td>
                            <td>
                              {h.pct_votos != null ? `${h.pct_votos.toFixed(1)}%` : '—'}
                              {var_ != null && (
                                <span style={{ marginLeft: 4, fontSize: 10,
                                  color: var_ >= 0 ? '#16a34a' : '#dc2626' }}>
                                  {var_ >= 0 ? '▲' : '▼'}
                                  {Math.abs(var_).toLocaleString('pt-BR')}
                                </span>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                ) : (
                  <p className={styles.histVazio}>
                    Nenhum histórico disponível para o candidato selecionado.
                  </p>
                )}

                <div className={styles.divider} />
                <div className={styles.secLabel}>Bairros cadastrados</div>
                <div className={styles.infoBox}>
                  <i className="fa-solid fa-layer-group" />
                  <span>Nenhum bairro cadastrado. Importe via <strong>Importação de Dados</strong>.</span>
                </div>
              </>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}
