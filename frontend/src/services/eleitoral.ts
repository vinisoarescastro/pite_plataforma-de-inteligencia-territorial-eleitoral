function authHeaders(): HeadersInit {
  const token = localStorage.getItem('access_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function get<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: authHeaders() })
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
