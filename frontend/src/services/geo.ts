function authHeaders(): HeadersInit {
  const token = localStorage.getItem('access_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function get<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: authHeaders() })
  if (res.status === 401) { localStorage.removeItem('access_token'); window.location.href = '/login'; throw new Error('Sessão expirada') }
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
  return res.json()
}

async function req(method: string, url: string, body?: unknown): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: { ...authHeaders() as Record<string, string>, 'Content-Type': 'application/json' },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  if (res.status === 401) { localStorage.removeItem('access_token'); window.location.href = '/login'; throw new Error('Sessão expirada') }
  return res
}

// ── Tipos ──────────────────────────────────────────────────────
export interface MunicipioGeo {
  cd_tse: string
  cd_ibge: string
  nm_municipio: string
}

export interface BairroOut {
  id: string
  nm_bairro: string
  sg_uf: string
  cd_municipio_ibge: string | null
  nm_municipio: string | null
  total_locais: number
  tem_geom: boolean
}

export interface LocalVotacaoOut {
  sg_uf: string
  cd_municipio_tse: string
  nr_local_votacao: number
  nm_local_votacao: string | null
  ds_endereco: string | null
  total_secoes: number
}

// ── API ────────────────────────────────────────────────────────
export const listarUfsGeo = () =>
  get<string[]>('/geo/ufs')

export const listarMunicipiosGeo = (sg_uf: string) =>
  get<MunicipioGeo[]>(`/geo/municipios?sg_uf=${sg_uf}`)

export const listarBairros = (sg_uf: string, cd_municipio_ibge?: string) => {
  const p = new URLSearchParams({ sg_uf })
  if (cd_municipio_ibge) p.set('cd_municipio_ibge', cd_municipio_ibge)
  return get<BairroOut[]>(`/geo/bairros?${p}`)
}

export async function criarBairro(data: { nm_bairro: string; sg_uf: string; cd_municipio_ibge?: string; nm_municipio?: string }): Promise<BairroOut> {
  const res = await req('POST', '/geo/bairros', data)
  if (!res.ok) { const b = await res.json().catch(() => ({})); throw new Error(b.detail ?? `Erro ${res.status}`) }
  return res.json()
}

export async function renomearBairro(id: string, nm_bairro: string, sg_uf: string, cd_municipio_ibge?: string, nm_municipio?: string): Promise<BairroOut> {
  const res = await req('PUT', `/geo/bairros/${id}`, { nm_bairro, sg_uf, cd_municipio_ibge, nm_municipio })
  if (!res.ok) { const b = await res.json().catch(() => ({})); throw new Error(b.detail ?? `Erro ${res.status}`) }
  return res.json()
}

export async function excluirBairro(id: string): Promise<void> {
  const res = await req('DELETE', `/geo/bairros/${id}`)
  if (!res.ok) { const b = await res.json().catch(() => ({})); throw new Error(b.detail ?? `Erro ${res.status}`) }
}

export const listarLocaisBairro = (bairroId: string) =>
  get<LocalVotacaoOut[]>(`/geo/bairros/${bairroId}/locais`)

export async function vincularLocal(bairroId: string, local: Omit<LocalVotacaoOut, 'total_secoes'>): Promise<void> {
  const res = await req('POST', `/geo/bairros/${bairroId}/locais`, local)
  if (!res.ok) { const b = await res.json().catch(() => ({})); throw new Error(b.detail ?? `Erro ${res.status}`) }
}

export async function desvincularLocal(bairroId: string, sg_uf: string, cd_municipio_tse: string, nr_local_votacao: number): Promise<void> {
  const p = new URLSearchParams({ sg_uf, cd_municipio_tse, nr_local_votacao: String(nr_local_votacao) })
  const res = await req('DELETE', `/geo/bairros/${bairroId}/locais?${p}`)
  if (!res.ok) { const b = await res.json().catch(() => ({})); throw new Error(b.detail ?? `Erro ${res.status}`) }
}

// ── Geometria ──────────────────────────────────────────────────
export interface BairroFeature {
  type: 'Feature'
  geometry: object
  properties: { id: string; nm_bairro: string; cd_municipio_ibge: string | null; nm_municipio: string | null }
}

export interface BairrosGeoJSON {
  type: 'FeatureCollection'
  features: BairroFeature[]
}

export const buscarBairrosGeoJSON = (sg_uf: string, cd_municipio_ibge: string) =>
  get<BairrosGeoJSON>(`/geo/bairros/geojson?sg_uf=${sg_uf}&cd_municipio_ibge=${cd_municipio_ibge}`)

export async function salvarGeomBairro(id: string, geom: object): Promise<void> {
  const res = await req('PATCH', `/geo/bairros/${id}/geom`, geom)
  if (!res.ok) { const b = await res.json().catch(() => ({})); throw new Error(b.detail ?? `Erro ${res.status}`) }
}

export async function removerGeomBairro(id: string): Promise<void> {
  const res = await req('DELETE', `/geo/bairros/${id}/geom`)
  if (!res.ok) { const b = await res.json().catch(() => ({})); throw new Error(b.detail ?? `Erro ${res.status}`) }
}

export const buscarLocaisVotacao = (sg_uf: string, cd_municipio_tse: string, busca: string, bairroId?: string) => {
  const p = new URLSearchParams({ sg_uf, cd_municipio_tse, busca })
  if (bairroId) p.set('bairro_id', bairroId)
  return get<LocalVotacaoOut[]>(`/geo/locais-votacao?${p}`)
}

// ── Geocodificação ─────────────────────────────────────────────────────────────

export interface GeocodingStatus {
  total: number
  geocodificados: number
  com_erro: number
  pendentes: number
  em_andamento: boolean
}

export const buscarStatusGeocodificacao = (sg_uf: string, cd_municipio_tse: string) =>
  get<GeocodingStatus>(`/geo/geocoding/status?sg_uf=${sg_uf}&cd_municipio_tse=${cd_municipio_tse}`)

export async function iniciarGeocodificacao(sg_uf: string, cd_municipio_tse: string, nm_municipio: string): Promise<void> {
  const res = await req('POST', '/geo/geocoding/municipio', { sg_uf, cd_municipio_tse, nm_municipio })
  if (!res.ok) { const b = await res.json().catch(() => ({})); throw new Error(b.detail ?? `Erro ${res.status}`) }
}

export const sugerirLocais = (bairroId: string, geom: object) =>
  req('POST', `/geo/bairros/${bairroId}/sugerir-locais`, geom).then(r => r.json() as Promise<LocalVotacaoOut[]>)
