export interface LoginPayload {
  email: string
  password: string
}

export interface LoginResponse {
  access_token: string
  token_type: string
  user_name: string
  user_profile: string
  user_candidate: string | null
  user_can_export: boolean
  user_can_compare: boolean
}

export async function login(payload: LoginPayload): Promise<LoginResponse> {
  const res = await fetch('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: payload.email, password: payload.password }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.detail ?? 'Credenciais inválidas.')
  }

  return res.json()
}
