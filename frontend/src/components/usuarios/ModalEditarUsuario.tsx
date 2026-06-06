import { useState, useEffect } from 'react'
import type { Usuario } from '../../pages/UsuariosPage'
import m from './Modal.module.css'
import { listarCandidatos, type Candidato } from '../../services/candidatos'

interface Props {
  usuario: Usuario & { candidato_id?: string | null }
  onSalvar: (u: Usuario & { candidato_id?: string | null }) => void
  onDesativar: (id: string) => void
  onFechar: () => void
}

export default function ModalEditarUsuario({ usuario, onSalvar, onDesativar, onFechar }: Props) {
  const [nome, setNome]         = useState(usuario.nome)
  const [email, setEmail]       = useState(usuario.email)
  const [perfil, setPerfil]     = useState(usuario.perfil)
  const [candidatoId, setCandidatoId] = useState(usuario.candidato_id ?? '')
  const [candidatos, setCandidatos]   = useState<Candidato[]>([])
  const [exportar, setExportar] = useState(usuario.podeExportar)
  const [comparar, setComparar] = useState(usuario.podeComparar)
  const [ativo, setAtivo]       = useState(usuario.ativo)

  useEffect(() => { listarCandidatos().then(setCandidatos).catch(() => {}) }, [])

  const precisaCandidato = perfil !== 'administrador'
  const candSelecionado  = candidatos.find(c => c.id === candidatoId)

  function handleSalvar() {
    onSalvar({
      ...usuario,
      nome, email, perfil,
      candidato: precisaCandidato ? (candSelecionado?.nm_candidato ?? usuario.candidato ?? null) : null,
      candidato_id: precisaCandidato ? candidatoId || null : null,
      podeExportar: exportar,
      podeComparar: comparar,
      ativo,
    })
  }

  return (
    <div className={m.overlay} onClick={e => e.target === e.currentTarget && onFechar()}>
      <div className={m.modal}>
        <div className={m.hd}>
          <div>
            <div className={m.title}>Editar Usuário</div>
            <div className={m.sub}>{usuario.email}</div>
          </div>
          <button className={m.close} onClick={onFechar}><i className="fa-solid fa-times" /></button>
        </div>

        <div className={m.bd}>
          <div className={m.secLabel}>Dados pessoais</div>
          <div className={m.grid2}>
            <div className={m.formG}>
              <label className={m.lbl}>Nome completo</label>
              <input className={m.inp} value={nome} onChange={e => setNome(e.target.value)} />
            </div>
            <div className={m.formG}>
              <label className={m.lbl}>E-mail</label>
              <input className={m.inp} type="email" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
          </div>

          <div className={m.divider} />

          <div className={m.secLabel}>Perfil e vínculo</div>
          <div className={m.grid2}>
            <div className={m.formG}>
              <label className={m.lbl}>Perfil de acesso</label>
              <select className={m.sel} value={perfil} onChange={e => setPerfil(e.target.value as Usuario['perfil'])}>
                <option value="administrador">Administrador</option>
                <option value="gestor">Gestor</option>
                <option value="analista">Analista</option>
                <option value="assessor">Assessor</option>
              </select>
            </div>
            <div className={m.formG}>
              <label className={m.lbl}>Candidato vinculado</label>
              <select className={m.sel} value={candidatoId} onChange={e => setCandidatoId(e.target.value)} disabled={!precisaCandidato}>
                <option value="">— Nenhum (admin) —</option>
                {candidatos.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.nm_candidato}{c.sg_partido ? ` · ${c.sg_partido}` : ''}{c.sg_uf ? ` · ${c.sg_uf}` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className={m.divider} />

          <div className={m.secLabel}>Permissões individuais</div>
          <p className={m.secDesc}>Substituem as permissões padrão do perfil para este usuário específico.</p>
          <div className={m.permsBox}>
            <div className={m.permRow}>
              <div>
                <div className={m.permLbl}>Exportar dados</div>
                <div className={m.permDesc}>Baixar CSVs de tabelas e relatórios</div>
              </div>
              <label className={m.toggle}>
                <input type="checkbox" checked={exportar} onChange={e => setExportar(e.target.checked)} />
                <span className={m.toggleTrack} />
              </label>
            </div>
            <div className={m.permRow}>
              <div>
                <div className={m.permLbl}>Comparar candidatos</div>
                <div className={m.permDesc}>Acesso à tela de comparação entre candidatos</div>
              </div>
              <label className={m.toggle}>
                <input type="checkbox" checked={comparar} onChange={e => setComparar(e.target.checked)} />
                <span className={m.toggleTrack} />
              </label>
            </div>
          </div>

          <div className={m.divider} />

          <div className={m.statusRow}>
            <div>
              <div className={m.permLbl}>Status da conta</div>
              <div className={m.permDesc}>Usuários inativos não conseguem fazer login</div>
            </div>
            <label className={m.toggle}>
              <input type="checkbox" checked={ativo} onChange={e => setAtivo(e.target.checked)} />
              <span className={m.toggleTrack} />
            </label>
          </div>
        </div>

        <div className={`${m.ft} ${m.ftSpaced}`}>
          <button className={`${m.btn} ${m.btnDanger}`} onClick={() => onDesativar(usuario.id)}>
            <i className="fa-solid fa-user-slash" /> Desativar
          </button>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className={`${m.btn} ${m.btnSecondary}`} onClick={onFechar}>Cancelar</button>
            <button className={`${m.btn} ${m.btnPrimary}`} onClick={handleSalvar}>
              <i className="fa-solid fa-check" /> Salvar alterações
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
