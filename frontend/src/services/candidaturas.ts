function authHeaders(): Record<string, string> {
  const token = localStorage.getItem('access_token') ?? ''
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
}
async function handleError(res: Response): Promise<never> {
  const body = await res.json().catch(() => ({}))
  throw new Error(body.detail ?? `Erro ${res.status}`)
}

export interface CandidaturaEleicao {
  id: string
  ano: number
  turno: number
  tipo: string
  descricao: string | null
}

export interface Candidatura {
  id: string
  candidato_id: string
  eleicao_id: string
  partido_id: string | null
  sq_candidato_tse: number | null
  nr_votavel: string | null
  nm_votavel: string | null
  ds_cargo: string | null
  situacao: string | null
  eleicao: CandidaturaEleicao | null
  partido: { id: string; sigla: string; nome: string | null; numero: number | null } | null
}

export interface CandidaturaPayload {
  candidato_id: string
  eleicao_id: string
  partido_id?: string
  sq_candidato_tse?: number
  nr_votavel?: string
  nm_votavel?: string
  ds_cargo?: string
  situacao?: string
}

export interface VotavelTSE {
  sq_candidato: string | null
  nr_votavel: string
  nm_votavel: string
  ds_cargo: string | null
}

export async function listarCandidaturas(candidatoId: string): Promise<Candidatura[]> {
  const res = await fetch(`/candidatos/${candidatoId}/candidaturas`, { headers: authHeaders() })
  if (!res.ok) await handleError(res)
  return res.json()
}

export async function criarCandidatura(payload: CandidaturaPayload): Promise<Candidatura> {
  const res = await fetch('/candidaturas', {
    method: 'POST', headers: authHeaders(), body: JSON.stringify(payload),
  })
  if (!res.ok) await handleError(res)
  return res.json()
}

export async function atualizarCandidatura(id: string, payload: Partial<CandidaturaPayload>): Promise<Candidatura> {
  const res = await fetch(`/candidaturas/${id}`, {
    method: 'PUT', headers: authHeaders(), body: JSON.stringify(payload),
  })
  if (!res.ok) await handleError(res)
  return res.json()
}

export async function excluirCandidatura(id: string): Promise<void> {
  const res = await fetch(`/candidaturas/${id}`, { method: 'DELETE', headers: authHeaders() })
  if (!res.ok) await handleError(res)
}

export async function buscarVotavelTSE(eleicaoId: string, params: { sq?: number; nome?: string }): Promise<VotavelTSE[]> {
  const p = new URLSearchParams({ eleicao_id: eleicaoId })
  if (params.sq)   p.set('sq_candidato_tse', String(params.sq))
  if (params.nome) p.set('nome', params.nome)
  const res = await fetch(`/candidaturas/buscar-votavel?${p}`, { headers: authHeaders() })
  if (!res.ok) await handleError(res)
  return res.json()
}
