import { useState, useEffect } from 'react'
import styles from './ModalCandidato.module.css'
import type { Candidato, CandidatoPayload } from '../../services/candidatos'
import { listarPartidos, type Partido } from '../../services/partidos'

const UFS = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG',
  'PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO',
]

interface Props {
  candidato?: Candidato | null
  onSalvar: (payload: CandidatoPayload) => Promise<void>
  onFechar: () => void
}

interface FormState {
  nm_candidato: string
  partido_id: string   // apenas para seleção local
  sg_uf: string
}

const VAZIO: FormState = { nm_candidato: '', partido_id: '', sg_uf: '' }

export default function ModalCandidato({ candidato, onSalvar, onFechar }: Props) {
  const [form, setForm]         = useState<FormState>(VAZIO)
  const [partidos, setPartidos] = useState<Partido[]>([])
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro]         = useState('')

  useEffect(() => {
    listarPartidos().then(setPartidos).catch(() => {})
  }, [])

  useEffect(() => {
    if (candidato) {
      // tenta encontrar o partido pelo sg_partido salvo no candidato
      setForm({
        nm_candidato: candidato.nm_candidato,
        partido_id:   '',   // será preenchido abaixo após partidos carregarem
        sg_uf:        candidato.sg_uf ?? '',
      })
    } else {
      setForm(VAZIO)
    }
  }, [candidato])

  // ajusta partido_id após partidos carregarem ao editar
  useEffect(() => {
    if (candidato && partidos.length > 0) {
      const match = partidos.find(p => p.sigla === candidato.sg_partido)
      if (match) setForm(f => ({ ...f, partido_id: match.id }))
    }
  }, [partidos, candidato])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nm_candidato.trim()) { setErro('Nome é obrigatório.'); return }
    setSalvando(true)
    setErro('')
    try {
      const partido = partidos.find(p => p.id === form.partido_id)
      await onSalvar({
        nm_candidato: form.nm_candidato.trim(),
        nm_partido:   partido?.nome   ?? undefined,
        sg_partido:   partido?.sigla  ?? undefined,
        sg_uf:        form.sg_uf      || undefined,
      })
    } catch (e: any) {
      setErro(e.message ?? 'Erro ao salvar.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className={styles.backdrop} onClick={onFechar}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.hd}>
          <div className={styles.hdIcon}>
            <i className="fa-solid fa-user-tie" />
          </div>
          <div>
            <div className={styles.hdTitle}>{candidato ? 'Editar candidato' : 'Novo candidato'}</div>
            <div className={styles.hdSub}>{candidato ? candidato.nm_candidato : 'Preencha os dados do candidato'}</div>
          </div>
          <button className={styles.closeBtn} onClick={onFechar}>
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        <form className={styles.body} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label className={styles.label}>Nome completo <span className={styles.req}>*</span></label>
            <input
              className={styles.input}
              value={form.nm_candidato}
              onChange={e => setForm(f => ({ ...f, nm_candidato: e.target.value.toUpperCase() }))}
              placeholder="NOME DO CANDIDATO"
              autoFocus
            />
          </div>

          <div className={styles.row2}>
            <div className={styles.field}>
              <label className={styles.label}>Partido <span className={styles.optional}>(principal)</span></label>
              <select
                className={styles.select}
                value={form.partido_id}
                onChange={e => setForm(f => ({ ...f, partido_id: e.target.value }))}
              >
                <option value="">Não informado</option>
                {partidos.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.sigla}{p.nome ? ` — ${p.nome}` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.fieldSm}>
              <label className={styles.label}>UF</label>
              <select
                className={styles.select}
                value={form.sg_uf}
                onChange={e => setForm(f => ({ ...f, sg_uf: e.target.value }))}
              >
                <option value="">—</option>
                {UFS.map(uf => <option key={uf} value={uf}>{uf}</option>)}
              </select>
            </div>
          </div>

          {erro && (
            <div className={styles.erro}>
              <i className="fa-solid fa-circle-exclamation" /> {erro}
            </div>
          )}

          <div className={styles.ft}>
            <button type="button" className={`${styles.btn} ${styles.btnSec}`} onClick={onFechar} disabled={salvando}>
              Cancelar
            </button>
            <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`} disabled={salvando}>
              {salvando
                ? <><i className="fa-solid fa-spinner fa-spin" /> Salvando…</>
                : <><i className="fa-solid fa-check" /> {candidato ? 'Salvar alterações' : 'Criar candidato'}</>
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
