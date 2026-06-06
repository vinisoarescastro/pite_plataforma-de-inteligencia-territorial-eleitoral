export interface Candidato {
  id: string
  nr_candidato: string | null
  nm_candidato: string
  nm_partido: string | null
  sg_partido: string | null
  sg_uf: string | null
  cargo: string | null
}

export interface CandidatoPayload {
  nr_candidato?: string
  nm_candidato: string
  nm_partido?: string
  sg_partido?: string
  sg_uf?: string
  cargo?: string
}

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem('access_token') ?? ''
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
}

async function handleError(res: Response): Promise<never> {
  const body = await res.json().catch(() => ({}))
  throw new Error(body.detail ?? `Erro ${res.status}`)
}

export async function listarCandidatos(): Promise<Candidato[]> {
  const res = await fetch('/candidatos', { headers: authHeaders() })
  if (!res.ok) await handleError(res)
  return res.json()
}

export async function criarCandidato(payload: CandidatoPayload): Promise<Candidato> {
  const res = await fetch('/candidatos', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  })
  if (!res.ok) await handleError(res)
  return res.json()
}

export async function atualizarCandidato(id: string, payload: Partial<CandidatoPayload>): Promise<Candidato> {
  const res = await fetch(`/candidatos/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  })
  if (!res.ok) await handleError(res)
  return res.json()
}

export async function excluirCandidato(id: string): Promise<void> {
  const res = await fetch(`/candidatos/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  })
  if (!res.ok) await handleError(res)
}
