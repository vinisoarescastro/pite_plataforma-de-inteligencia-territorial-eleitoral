const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

function authHeaders(): HeadersInit {
  const token = localStorage.getItem('access_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export interface ImportUpdate {
  tipo: 'inicio' | 'progresso' | 'concluido' | 'erro'
  // inicio
  total?: number
  // progresso
  processadas?: number
  inseridos?: number
  eta?: string
  fase?: string
  // concluido
  descricao?: string
  eleicao_id?: string
  candidatos_criados?: number
  sem_ibge?: number
  total_processadas?: number
  turnos?: Record<string, string>
  aviso?: string
  // erro
  mensagem?: string
}

async function streamPost(
  url: string,
  form: FormData,
  onUpdate: (u: ImportUpdate) => void,
): Promise<void> {
  const res = await fetch(url, { method: 'POST', headers: authHeaders(), body: form })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.detail ?? `Erro ${res.status}`)
  }

  // Endpoint de municípios retorna JSON simples (sem stream)
  const ct = res.headers.get('content-type') ?? ''
  if (!ct.includes('text/event-stream')) {
    const data = await res.json()
    onUpdate({ tipo: 'concluido', ...data })
    return
  }

  const reader = res.body!.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop()!  // guarda linha incompleta
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      try {
        const update: ImportUpdate = JSON.parse(line.slice(6))
        onUpdate(update)
        if (update.tipo === 'erro') throw new Error(update.mensagem ?? 'Erro desconhecido')
      } catch (e) {
        if (e instanceof SyntaxError) continue
        throw e
      }
    }
  }
}

export interface StatusEleicao {
  eleicao_id: string
  descricao: string
  ano: number
  turno: number
  tipo: string
  // resultados_eleitorais
  estados: number
  municipios: number
  registros: number
  // votacao_secao
  secoes_municipios: number
  secoes_votos: number
  secoes_registros: number
}

export async function getStatusImportacao(): Promise<StatusEleicao[]> {
  const res = await fetch(`${BASE}/importar/status`, { headers: authHeaders() })
  if (!res.ok) throw new Error(`Erro ${res.status}`)
  return res.json()
}

export async function importarMunicipios(
  arquivo: File,
  forcar: boolean,
  onUpdate: (u: ImportUpdate) => void,
): Promise<void> {
  const form = new FormData()
  form.append('arquivo', arquivo)
  form.append('forcar', String(forcar))
  await streamPost(`${BASE}/importar/municipios`, form, onUpdate)
}

export async function importarResultados(
  arquivo: File,
  ano: number,
  turno: number,
  tipo: string,
  candidato: string | undefined,
  onUpdate: (u: ImportUpdate) => void,
): Promise<void> {
  const form = new FormData()
  form.append('arquivo', arquivo)
  form.append('ano', String(ano))
  form.append('turno', String(turno))
  form.append('tipo', tipo)
  if (candidato) form.append('candidato', candidato)
  await streamPost(`${BASE}/importar/resultados`, form, onUpdate)
}

export interface ImportacaoLogItem {
  id: string
  arquivo: string | null
  tipo: string
  eleicao_id: string | null
  status: 'sucesso' | 'erro'
  mensagem: string | null
  inseridos: number | null
  processadas: number | null
  duracao_s: number | null
  criado_em: string | null
}

export async function getHistoricoImportacao(): Promise<ImportacaoLogItem[]> {
  const res = await fetch(`${BASE}/importar/historico`, { headers: authHeaders() })
  if (!res.ok) throw new Error(`Erro ${res.status}`)
  return res.json()
}

export async function importarSecoes(
  arquivo: File,
  ano: number | undefined,
  tipo: string | undefined,
  cargo: string | undefined,
  votavel: string | undefined,
  onUpdate: (u: ImportUpdate) => void,
): Promise<void> {
  const form = new FormData()
  form.append('arquivo', arquivo)
  if (ano)    form.append('ano', String(ano))
  if (tipo)   form.append('tipo', tipo)
  if (cargo)  form.append('cargo', cargo)
  if (votavel) form.append('votavel', votavel)
  await streamPost(`${BASE}/importar/secoes`, form, onUpdate)
}
