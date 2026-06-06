function authHeaders(): Record<string, string> {
  const token = localStorage.getItem('access_token') ?? ''
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
}
async function handleError(res: Response): Promise<never> {
  const body = await res.json().catch(() => ({}))
  throw new Error(body.detail ?? `Erro ${res.status}`)
}

export interface Partido {
  id: string
  sigla: string
  nome: string | null
  numero: number | null
}

export interface PartidoPayload {
  sigla: string
  nome?: string
  numero?: number
}

export async function listarPartidos(): Promise<Partido[]> {
  const res = await fetch('/partidos', { headers: authHeaders() })
  if (!res.ok) await handleError(res)
  return res.json()
}

export async function criarPartido(payload: PartidoPayload): Promise<Partido> {
  const res = await fetch('/partidos', {
    method: 'POST', headers: authHeaders(), body: JSON.stringify(payload),
  })
  if (!res.ok) await handleError(res)
  return res.json()
}

export async function atualizarPartido(id: string, payload: PartidoPayload): Promise<Partido> {
  const res = await fetch(`/partidos/${id}`, {
    method: 'PUT', headers: authHeaders(), body: JSON.stringify(payload),
  })
  if (!res.ok) await handleError(res)
  return res.json()
}

export async function excluirPartido(id: string): Promise<void> {
  const res = await fetch(`/partidos/${id}`, { method: 'DELETE', headers: authHeaders() })
  if (!res.ok) await handleError(res)
}
