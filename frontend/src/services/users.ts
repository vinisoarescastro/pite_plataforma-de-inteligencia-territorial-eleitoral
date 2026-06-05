export interface Usuario {
  id: string
  nome: string
  email: string
  perfil: 'administrador' | 'gestor' | 'analista' | 'assessor'
  candidato: string | null
  podeExportar: boolean
  podeComparar: boolean
  ativo: boolean
  ultimoAcesso: string | null
}

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem('access_token') ?? ''
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
}

function mapUser(u: any): Usuario {
  return {
    id: u.id,
    nome: u.name,
    email: u.email,
    perfil: u.profile,
    candidato: u.candidate_name ?? null,
    podeExportar: u.can_export,
    podeComparar: u.can_compare,
    ativo: u.is_active,
    ultimoAcesso: u.last_login ? new Date(u.last_login).toLocaleString('pt-BR') : null,
  }
}

async function handleError(res: Response): Promise<never> {
  const body = await res.json().catch(() => ({}))
  throw new Error(body.detail ?? `Erro ${res.status}`)
}

export async function listarUsuarios(): Promise<Usuario[]> {
  const res = await fetch('/users', { headers: authHeaders() })
  if (!res.ok) await handleError(res)
  return (await res.json()).map(mapUser)
}

export async function criarUsuario(payload: {
  nome: string; email: string; senha: string
  perfil: string; candidato: string | null
  podeExportar: boolean; podeComparar: boolean
}): Promise<Usuario> {
  const res = await fetch('/users', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({
      name: payload.nome,
      email: payload.email,
      password: payload.senha,
      profile: payload.perfil,
      candidate_name: payload.candidato || null,
      can_export: payload.podeExportar,
      can_compare: payload.podeComparar,
    }),
  })
  if (!res.ok) await handleError(res)
  return mapUser(await res.json())
}

export async function atualizarUsuario(id: string, payload: {
  nome?: string; email?: string; perfil?: string
  candidato?: string | null; podeExportar?: boolean; podeComparar?: boolean; ativo?: boolean
}): Promise<Usuario> {
  const body: Record<string, unknown> = {}
  if (payload.nome      !== undefined) body.name           = payload.nome
  if (payload.email     !== undefined) body.email          = payload.email
  if (payload.perfil    !== undefined) body.profile        = payload.perfil
  if (payload.candidato !== undefined) body.candidate_name = payload.candidato || null
  if (payload.podeExportar !== undefined) body.can_export  = payload.podeExportar
  if (payload.podeComparar !== undefined) body.can_compare = payload.podeComparar
  if (payload.ativo     !== undefined) body.is_active      = payload.ativo

  const res = await fetch(`/users/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(body),
  })
  if (!res.ok) await handleError(res)
  return mapUser(await res.json())
}

export async function desativarUsuario(id: string): Promise<Usuario> {
  const res = await fetch(`/users/${id}/deactivate`, {
    method: 'PATCH',
    headers: authHeaders(),
  })
  if (!res.ok) await handleError(res)
  return mapUser(await res.json())
}
