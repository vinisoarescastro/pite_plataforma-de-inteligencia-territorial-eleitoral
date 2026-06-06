import { useState, useEffect } from 'react'
import ModalNovoUsuario from '../components/usuarios/ModalNovoUsuario'
import ModalEditarUsuario from '../components/usuarios/ModalEditarUsuario'
import ModalPermissoes from '../components/usuarios/ModalPermissoes'
import styles from './UsuariosPage.module.css'
import {
  listarUsuarios, criarUsuario, atualizarUsuario, desativarUsuario,
  type Usuario,
} from '../services/users'

export type { Usuario }

export interface PermsPeril {
  gestor:   { exportar: boolean; comparar: boolean }
  analista: { exportar: boolean; comparar: boolean }
  assessor: { exportar: boolean; comparar: boolean }
}

const PERFIL_LABELS: Record<string, string> = {
  administrador: 'Administrador',
  gestor: 'Gestor',
  analista: 'Analista',
  assessor: 'Assessor',
}

const PERFIL_ICONE: Record<string, string> = {
  administrador: 'fa-shield-halved',
  gestor: 'fa-user-tie',
  analista: 'fa-chart-bar',
  assessor: 'fa-eye',
}

const PERFIL_COR: Record<string, string> = {
  administrador: styles.corAdmin,
  gestor: styles.corGestor,
  analista: styles.corAnalista,
  assessor: styles.corAssessor,
}

export default function UsuariosPage() {
  const [usuarios, setUsuarios]           = useState<Usuario[]>([])
  const [carregando, setCarregando]       = useState(true)
  const [erroCarregar, setErroCarregar]   = useState('')
  const [busca, setBusca]                 = useState('')
  const [filtroPerfil, setFiltroPerfil]   = useState('')
  const [filtroCandidato, setFiltroCandidato] = useState('')
  const [modalNovo, setModalNovo]         = useState(false)
  const [modalEditar, setModalEditar]     = useState<Usuario | null>(null)
  const [modalPerms, setModalPerms]       = useState(false)
  const [perms, setPerms] = useState<PermsPeril>({
    gestor:   { exportar: true,  comparar: false },
    analista: { exportar: true,  comparar: true  },
    assessor: { exportar: false, comparar: false },
  })
  const [toast, setToast] = useState('')

  useEffect(() => {
    listarUsuarios()
      .then(setUsuarios)
      .catch(e => setErroCarregar(e.message))
      .finally(() => setCarregando(false))
  }, [])

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  const usuariosFiltrados = usuarios.filter(u => {
    const matchBusca = busca === '' ||
      u.nome.toLowerCase().includes(busca.toLowerCase()) ||
      u.email.toLowerCase().includes(busca.toLowerCase())
    const matchPerfil = filtroPerfil === '' || u.perfil === filtroPerfil
    const matchCandidato = filtroCandidato === '' ||
      (u.candidato ?? '').toLowerCase().includes(filtroCandidato.toLowerCase())
    return matchBusca && matchPerfil && matchCandidato
  })

  async function handleCriar(payload: Omit<Usuario, 'id' | 'ultimoAcesso'> & { senha?: string }) {
    try {
      const novo = await criarUsuario({
        nome: payload.nome,
        email: payload.email,
        senha: (payload as any).senha,
        perfil: payload.perfil,
        candidato: payload.candidato,
        podeExportar: payload.podeExportar,
        podeComparar: payload.podeComparar,
      })
      setUsuarios(prev => [novo, ...prev])
      setModalNovo(false)
      showToast('Usuário criado com sucesso.')
    } catch (e: any) {
      showToast(`Erro: ${e.message}`)
    }
  }

  async function handleSalvar(atualizado: Usuario) {
    try {
      const salvo = await atualizarUsuario(atualizado.id, {
        nome: atualizado.nome,
        email: atualizado.email,
        perfil: atualizado.perfil,
        candidato: atualizado.candidato,
        candidato_id: atualizado.candidato_id,
        podeExportar: atualizado.podeExportar,
        podeComparar: atualizado.podeComparar,
        ativo: atualizado.ativo,
      })
      setUsuarios(prev => prev.map(u => u.id === salvo.id ? salvo : u))
      setModalEditar(null)
      showToast('Usuário atualizado com sucesso.')
    } catch (e: any) {
      showToast(`Erro: ${e.message}`)
    }
  }

  async function handleDesativar(id: string) {
    try {
      const salvo = await desativarUsuario(id)
      setUsuarios(prev => prev.map(u => u.id === salvo.id ? salvo : u))
      setModalEditar(null)
      showToast('Usuário desativado.')
    } catch (e: any) {
      showToast(`Erro: ${e.message}`)
    }
  }

  return (
    <div className={styles.page}>
      {/* ── Cabeçalho ── */}
      <div className={styles.ph}>
        <div>
          <div className={styles.phTitle}>Usuários</div>
          <div className={styles.phSub}>Controle de acesso e perfis · somente Administrador pode gerenciar</div>
        </div>
        <div className={styles.phR}>
          <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={() => setModalPerms(true)}>
            <i className="fa-solid fa-sliders" /> Permissões por Perfil
          </button>
          <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => setModalNovo(true)}>
            <i className="fa-solid fa-plus" /> Novo Usuário
          </button>
        </div>
      </div>

      {/* ── Cards de perfis ── */}
      <div className={styles.perfilGrid}>
        <div className={styles.perfilCard}>
          <div className={styles.perfilHd}>
            <div className={`${styles.perfilIco} ${styles.corAdmin}`}>
              <i className="fa-solid fa-shield-halved" />
            </div>
            <div>
              <div className={styles.perfilNome}>Administrador</div>
              <div className={styles.perfilDesc}>Acesso total à plataforma</div>
            </div>
          </div>
          <div className={styles.perfilBd}>
            {['Exportar dados', 'Comparar candidatos', 'Importar TSE'].map(p => (
              <div key={p} className={styles.toggleRow}>
                <span className={styles.toggleLbl}>{p}</span>
                <span className={styles.badgeLock}><i className="fa-solid fa-lock" /> Sempre ativo</span>
              </div>
            ))}
          </div>
        </div>

        {(['gestor', 'analista', 'assessor'] as const).map(p => (
          <div key={p} className={styles.perfilCard}>
            <div className={styles.perfilHd}>
              <div className={`${styles.perfilIco} ${PERFIL_COR[p]}`}>
                <i className={`fa-solid ${PERFIL_ICONE[p]}`} />
              </div>
              <div>
                <div className={styles.perfilNome}>{PERFIL_LABELS[p]}</div>
                <div className={styles.perfilDesc}>
                  {p === 'gestor' ? 'Dados completos · 1 candidato' :
                   p === 'analista' ? 'Dados + comparação · 1 candidato' :
                   'Somente leitura · 1 candidato'}
                </div>
              </div>
            </div>
            <div className={styles.perfilBd}>
              <div className={styles.toggleRow}>
                <span className={styles.toggleLbl}>Exportar dados</span>
                <label className={styles.toggle}>
                  <input
                    type="checkbox"
                    checked={perms[p].exportar}
                    onChange={e => setPerms(prev => ({ ...prev, [p]: { ...prev[p], exportar: e.target.checked } }))}
                  />
                  <span className={styles.toggleTrack} />
                </label>
              </div>
              <div className={styles.toggleRow}>
                <span className={styles.toggleLbl}>Comparar candidatos</span>
                <label className={styles.toggle}>
                  <input
                    type="checkbox"
                    checked={perms[p].comparar}
                    onChange={e => setPerms(prev => ({ ...prev, [p]: { ...prev[p], comparar: e.target.checked } }))}
                  />
                  <span className={styles.toggleTrack} />
                </label>
              </div>
              <div className={styles.toggleRow}>
                <span className={styles.toggleLbl}>Importar dados TSE</span>
                <span className={styles.badgeBlocked}><i className="fa-solid fa-ban" /> Bloqueado</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Tabela ── */}
      <div className={styles.card}>
        <div className={styles.toolbar}>
          <div className={styles.searchWrap}>
            <i className="fa-solid fa-magnifying-glass" />
            <input
              className={styles.searchInp}
              placeholder="Buscar usuário..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
            />
          </div>
          <select className={styles.filterSel} value={filtroPerfil} onChange={e => setFiltroPerfil(e.target.value)}>
            <option value="">Todos os perfis</option>
            <option value="administrador">Administrador</option>
            <option value="gestor">Gestor</option>
            <option value="analista">Analista</option>
            <option value="assessor">Assessor</option>
          </select>
          <input
            className={styles.filterSel}
            style={{ minWidth: 160 }}
            placeholder="Filtrar por candidato..."
            value={filtroCandidato}
            onChange={e => setFiltroCandidato(e.target.value)}
          />
        </div>

        <div className={styles.tblWrap}>
          {carregando ? (
            <div style={{ padding: '32px', textAlign: 'center', color: 'var(--gray-400)' }}>
              <i className="fa-solid fa-spinner fa-spin" /> Carregando usuários...
            </div>
          ) : erroCarregar ? (
            <div style={{ padding: '32px', textAlign: 'center', color: 'var(--danger-500)' }}>
              <i className="fa-solid fa-circle-exclamation" /> {erroCarregar}
            </div>
          ) : (
            <table className={styles.tbl}>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>E-mail</th>
                  <th>Perfil</th>
                  <th>Candidato vinculado</th>
                  <th>Exportar</th>
                  <th>Comparar</th>
                  <th>Último acesso</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {usuariosFiltrados.map(u => (
                  <tr key={u.id} className={!u.ativo ? styles.rowInativo : ''}>
                    <td className={styles.tdBold}>{u.nome}</td>
                    <td className={styles.tdEmail}>{u.email}</td>
                    <td>
                      <span className={`${styles.badge} ${PERFIL_COR[u.perfil]}`}>
                        <i className={`fa-solid ${PERFIL_ICONE[u.perfil]}`} />
                        {PERFIL_LABELS[u.perfil]}
                      </span>
                    </td>
                    <td>{u.candidato ?? <span className={styles.tdMuted}>—</span>}</td>
                    <td>
                      {u.perfil === 'administrador' || u.podeExportar
                        ? <i className="fa-solid fa-check" style={{ color: '#1a7a4a' }} />
                        : <i className="fa-solid fa-minus" style={{ color: 'var(--gray-300)' }} />
                      }
                    </td>
                    <td>
                      {u.perfil === 'administrador' || u.podeComparar
                        ? <i className="fa-solid fa-check" style={{ color: '#1a7a4a' }} />
                        : <i className="fa-solid fa-minus" style={{ color: 'var(--gray-300)' }} />
                      }
                    </td>
                    <td className={styles.tdMuted}>{u.ultimoAcesso ?? '—'}</td>
                    <td>
                      {u.ativo
                        ? <span className={styles.statusAtivo}><span className={styles.statusDot} />Ativo</span>
                        : <span className={styles.statusInativo}>Inativo</span>
                      }
                    </td>
                    <td>
                      <button
                        className={`${styles.btn} ${styles.btnGhost} ${styles.btnSm}`}
                        onClick={() => setModalEditar(u)}
                      >
                        Editar
                      </button>
                    </td>
                  </tr>
                ))}
                {usuariosFiltrados.length === 0 && !carregando && (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: '28px', color: 'var(--gray-400)' }}>
                      Nenhum usuário encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
        <div className={styles.tblFooter}>
          Exibindo {usuariosFiltrados.length} de {usuarios.length} usuários
        </div>
      </div>

      {/* ── Modais ── */}
      {modalNovo && (
        <ModalNovoUsuario onCriar={handleCriar} onFechar={() => setModalNovo(false)} />
      )}
      {modalEditar && (
        <ModalEditarUsuario
          usuario={modalEditar}
          onSalvar={handleSalvar}
          onDesativar={handleDesativar}
          onFechar={() => setModalEditar(null)}
        />
      )}
      {modalPerms && (
        <ModalPermissoes
          perms={perms}
          onSalvar={p => { setPerms(p); setModalPerms(false); showToast('Permissões salvas.') }}
          onFechar={() => setModalPerms(false)}
        />
      )}

      {/* ── Toast ── */}
      {toast && (
        <div className={styles.toast}>
          <i className="fa-solid fa-circle-check" />
          {toast}
        </div>
      )}
    </div>
  )
}
