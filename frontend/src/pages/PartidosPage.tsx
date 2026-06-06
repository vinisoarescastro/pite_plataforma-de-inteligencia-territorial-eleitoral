import { useState, useEffect } from 'react'
import styles from './PartidosPage.module.css'
import {
  listarPartidos, criarPartido, atualizarPartido, excluirPartido,
  type Partido, type PartidoPayload,
} from '../services/partidos'

interface Props { isAdmin: boolean }

const VAZIO: PartidoPayload = { sigla: '', nome: '', numero: undefined }

export default function PartidosPage({ isAdmin }: Props) {
  const [partidos, setPartidos]     = useState<Partido[]>([])
  const [carregando, setCarregando] = useState(true)
  const [busca, setBusca]           = useState('')
  const [modal, setModal]           = useState<'criar' | Partido | null>(null)
  const [form, setForm]             = useState<PartidoPayload>(VAZIO)
  const [salvando, setSalvando]     = useState(false)
  const [erro, setErro]             = useState('')
  const [confirmId, setConfirmId]   = useState<string | null>(null)

  async function carregar() {
    setCarregando(true)
    try { setPartidos(await listarPartidos()) } catch {}
    finally { setCarregando(false) }
  }

  useEffect(() => { carregar() }, [])

  function abrirCriar() {
    setForm(VAZIO)
    setErro('')
    setModal('criar')
  }

  function abrirEditar(p: Partido) {
    setForm({ sigla: p.sigla, nome: p.nome ?? '', numero: p.numero ?? undefined })
    setErro('')
    setModal(p)
  }

  async function handleSalvar(e: React.FormEvent) {
    e.preventDefault()
    if (!form.sigla.trim()) { setErro('Sigla é obrigatória.'); return }
    setSalvando(true); setErro('')
    try {
      const payload: PartidoPayload = {
        sigla: form.sigla.trim().toUpperCase(),
        nome: form.nome?.trim() || undefined,
        numero: form.numero || undefined,
      }
      if (modal === 'criar') {
        const novo = await criarPartido(payload)
        setPartidos(prev => [...prev, novo].sort((a, b) => a.sigla.localeCompare(b.sigla)))
      } else {
        const atualizado = await atualizarPartido((modal as Partido).id, payload)
        setPartidos(prev => prev.map(p => p.id === atualizado.id ? atualizado : p))
      }
      setModal(null)
    } catch (e: any) {
      setErro(e.message ?? 'Erro ao salvar.')
    } finally {
      setSalvando(false)
    }
  }

  async function handleExcluir(id: string) {
    try {
      await excluirPartido(id)
      setPartidos(prev => prev.filter(p => p.id !== id))
    } catch (e: any) {
      alert(e.message ?? 'Erro ao excluir.')
    } finally {
      setConfirmId(null)
    }
  }

  const filtrados = partidos.filter(p =>
    p.sigla.toLowerCase().includes(busca.toLowerCase()) ||
    (p.nome ?? '').toLowerCase().includes(busca.toLowerCase())
  )

  return (
    <div className={styles.page}>
      <div className={styles.topbar}>
        <div className={styles.topLeft}>
          <div className={styles.searchWrap}>
            <i className="fa-solid fa-magnifying-glass" />
            <input
              className={styles.searchInput}
              placeholder="Buscar partido…"
              value={busca}
              onChange={e => setBusca(e.target.value)}
            />
          </div>
          <span className={styles.count}>{filtrados.length} partido{filtrados.length !== 1 ? 's' : ''}</span>
        </div>
        {isAdmin && (
          <button className={styles.btnNovo} onClick={abrirCriar}>
            <i className="fa-solid fa-plus" /> Novo partido
          </button>
        )}
      </div>

      {carregando ? (
        <div className={styles.loading}><i className="fa-solid fa-spinner fa-spin" /> Carregando…</div>
      ) : filtrados.length === 0 ? (
        <div className={styles.empty}>
          <i className="fa-solid fa-flag" />
          <p>{busca ? 'Nenhum partido encontrado.' : 'Nenhum partido cadastrado ainda.'}</p>
        </div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Sigla</th>
                <th>Nome</th>
                <th>Número</th>
                {isAdmin && <th></th>}
              </tr>
            </thead>
            <tbody>
              {filtrados.map(p => (
                <tr key={p.id}>
                  <td><span className={styles.sigla}>{p.sigla}</span></td>
                  <td className={styles.nome}>{p.nome ?? <span className={styles.vazio}>—</span>}</td>
                  <td>{p.numero ?? <span className={styles.vazio}>—</span>}</td>
                  {isAdmin && (
                    <td className={styles.acoes}>
                      <button className={styles.btnEdit} onClick={() => abrirEditar(p)} title="Editar">
                        <i className="fa-solid fa-pen" />
                      </button>
                      {confirmId === p.id ? (
                        <>
                          <button className={styles.btnConfirm} onClick={() => handleExcluir(p.id)}>Confirmar</button>
                          <button className={styles.btnCancel} onClick={() => setConfirmId(null)}>Cancelar</button>
                        </>
                      ) : (
                        <button className={styles.btnDel} onClick={() => setConfirmId(p.id)} title="Excluir">
                          <i className="fa-solid fa-trash" />
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <div className={styles.backdrop} onClick={() => setModal(null)}>
          <div className={styles.modalCard} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHd}>
              <div className={styles.modalIcon}><i className="fa-solid fa-flag" /></div>
              <div>
                <div className={styles.modalTitle}>{modal === 'criar' ? 'Novo partido' : 'Editar partido'}</div>
                <div className={styles.modalSub}>{modal === 'criar' ? 'Preencha os dados' : (modal as Partido).sigla}</div>
              </div>
              <button className={styles.closeBtn} onClick={() => setModal(null)}>
                <i className="fa-solid fa-xmark" />
              </button>
            </div>
            <form className={styles.modalBody} onSubmit={handleSalvar}>
              <div className={styles.row2}>
                <div className={styles.fieldSm}>
                  <label className={styles.label}>Sigla <span className={styles.req}>*</span></label>
                  <input
                    className={styles.input}
                    value={form.sigla}
                    onChange={e => setForm(f => ({ ...f, sigla: e.target.value.toUpperCase() }))}
                    placeholder="PT"
                    maxLength={20}
                    autoFocus
                  />
                </div>
                <div className={styles.fieldSm}>
                  <label className={styles.label}>Número</label>
                  <input
                    className={styles.input}
                    type="number"
                    value={form.numero ?? ''}
                    onChange={e => setForm(f => ({ ...f, numero: e.target.value ? parseInt(e.target.value) : undefined }))}
                    placeholder="13"
                  />
                </div>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Nome completo</label>
                <input
                  className={styles.input}
                  value={form.nome ?? ''}
                  onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
                  placeholder="Partido dos Trabalhadores"
                />
              </div>
              {erro && (
                <div className={styles.erro}><i className="fa-solid fa-circle-exclamation" /> {erro}</div>
              )}
              <div className={styles.ft}>
                <button type="button" className={`${styles.btn} ${styles.btnSec}`} onClick={() => setModal(null)} disabled={salvando}>Cancelar</button>
                <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`} disabled={salvando}>
                  {salvando
                    ? <><i className="fa-solid fa-spinner fa-spin" /> Salvando…</>
                    : <><i className="fa-solid fa-check" /> {modal === 'criar' ? 'Criar partido' : 'Salvar'}</>
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
