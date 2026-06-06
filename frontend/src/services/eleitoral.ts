function authHeaders(): HeadersInit {
  const token = localStorage.getItem('access_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function get<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: authHeaders() })
  if (res.status === 401) {
    localStorage.removeItem('access_token')
    window.location.href = '/login'
    throw new Error('Sessão expirada')
  }
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
  return res.json()
}

// ── Tipos ──────────────────────────────────────────────────────
export interface Eleicao {
  id: string
  ano: number
  turno: number
  tipo: string
  descricao: string | null
}

export interface Candidato {
  id: string
  nr_candidato: string
  nm_candidato: string
  nm_partido: string | null
  sg_partido: string | null
  sg_uf: string | null
  cargo: string | null
}

export interface ResultadoMunicipio {
  cd_municipio_ibge: string
  qt_votos_nominais: number
  qt_votos_validos: number | null
  qt_aptos: number | null
  qt_abstencoes: number | null
  pct_votos: number | null
}

export interface HistoricoItem {
  eleicao_id: string
  ano: number
  turno: number
  tipo: string
  descricao: string | null
  qt_votos_nominais: number
  qt_votos_validos: number | null
  pct_votos: number | null
}

export interface ResultadoMapa {
  cd_municipio_ibge: string
  qt_votos_nominais: number
  pct_votos: number | null
}

// ── API ────────────────────────────────────────────────────────
export const listarEleicoes = () =>
  get<Eleicao[]>('/eleicoes')

export const listarCandidatos = () =>
  get<Candidato[]>('/candidatos')

export const buscarResultadoMunicipio = (cdIbge: string, eleicaoId: string, candidatoId: string) =>
  get<ResultadoMunicipio>(
    `/resultados/municipio/${cdIbge}?eleicao_id=${eleicaoId}&candidato_id=${candidatoId}`
  )

export const buscarHistoricoMunicipio = (cdIbge: string, candidatoId: string) =>
  get<HistoricoItem[]>(
    `/resultados/municipio/${cdIbge}/historico?candidato_id=${candidatoId}`
  )

export const buscarResultadosMapa = (eleicaoId: string, candidatoId: string) =>
  get<ResultadoMapa[]>(
    `/resultados/mapa?eleicao_id=${eleicaoId}&candidato_id=${candidatoId}`
  )

// ── Seções ─────────────────────────────────────────────────────
export interface VotacaoMunicipio {
  cd_municipio_tse: string
  cd_municipio_ibge: string | null
  total_votos: number
  pct_votos: number | null
}

export interface VotacaoZona {
  cd_municipio_tse: string
  nr_zona: number
  nr_votavel: string
  nm_votavel: string
  ds_cargo: string | null
  total_votos: number
}

export interface Votavel {
  nr_votavel: string
  nm_votavel: string
  ds_cargo: string | null
  sg_partido: string | null
}

export const buscarVotacaoMapaUF = (
  sgUf: string, eleicaoId: string, params: { nr_votavel?: string; nm_votavel?: string; nr_turno?: number; cd_cargo?: number } = {}
) => {
  const p = new URLSearchParams({ eleicao_id: eleicaoId })
  if (params.nr_votavel) p.set('nr_votavel', params.nr_votavel)
  if (params.nm_votavel) p.set('nm_votavel', params.nm_votavel)
  if (params.nr_turno != null) p.set('nr_turno', String(params.nr_turno))
  if (params.cd_cargo != null) p.set('cd_cargo', String(params.cd_cargo))
  return get<VotacaoMunicipio[]>(`/secoes/mapa/uf/${sgUf}?${p}`)
}

export const buscarVotacaoPorZona = (
  cdMunicipioTse: string, eleicaoId: string, params: { nr_votavel?: string; nr_turno?: number } = {}
) => {
  const p = new URLSearchParams({ eleicao_id: eleicaoId })
  if (params.nr_votavel) p.set('nr_votavel', params.nr_votavel)
  if (params.nr_turno != null) p.set('nr_turno', String(params.nr_turno))
  return get<VotacaoZona[]>(`/secoes/municipio/${cdMunicipioTse}/por-zona?${p}`)
}

export const listarVotaveis = (
  eleicaoId: string, params: { nr_turno?: number; ds_cargo?: string } = {}
) => {
  const p = new URLSearchParams({ eleicao_id: eleicaoId })
  if (params.nr_turno != null) p.set('nr_turno', String(params.nr_turno))
  if (params.ds_cargo) p.set('ds_cargo', params.ds_cargo)
  return get<Votavel[]>(`/secoes/votaveis?${p}`)
}

export const listarCargos = (eleicaoId: string, nr_turno?: number) => {
  const p = new URLSearchParams({ eleicao_id: eleicaoId })
  if (nr_turno != null) p.set('nr_turno', String(nr_turno))
  return get<string[]>(`/secoes/cargos?${p}`)
}

// ── Ranking por município ──────────────────────────────────────
export interface RankingCandidatoItem {
  nr_votavel: string
  nm_votavel: string
  ds_cargo: string | null
  total_votos: number
  pct_votos: number | null
}

export interface RankingPorCargo {
  ds_cargo: string
  total_votos_cargo: number
  candidatos: RankingCandidatoItem[]
}

export const buscarRankingMunicipio = (
  cdIbge: string,
  eleicaoId: string,
  params: { nr_turno?: number; ds_cargo?: string; limit?: number } = {}
) => {
  const p = new URLSearchParams({ eleicao_id: eleicaoId })
  if (params.nr_turno != null) p.set('nr_turno', String(params.nr_turno))
  if (params.ds_cargo)         p.set('ds_cargo', params.ds_cargo)
  if (params.limit != null)    p.set('limit', String(params.limit))
  return get<RankingPorCargo[]>(`/secoes/ranking/ibge/${cdIbge}?${p}`)
}

export const buscarZonasPorIbge = (
  cdIbge: string,
  eleicaoId: string,
  params: { nr_votavel?: string; nr_turno?: number } = {}
) => {
  const p = new URLSearchParams({ eleicao_id: eleicaoId })
  if (params.nr_votavel)       p.set('nr_votavel', params.nr_votavel)
  if (params.nr_turno != null) p.set('nr_turno', String(params.nr_turno))
  return get<VotacaoZona[]>(`/secoes/zonas/ibge/${cdIbge}?${p}`)
}
