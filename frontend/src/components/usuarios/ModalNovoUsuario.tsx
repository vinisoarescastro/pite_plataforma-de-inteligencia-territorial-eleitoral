import { useState, useEffect } from 'react'
import type { Usuario } from '../../pages/UsuariosPage'
import m from './Modal.module.css'
import { listarCandidatos, type Candidato } from '../../services/candidatos'

interface Props {
  onCriar: (u: Omit<Usuario, 'id' | 'ultimoAcesso'> & { senha: string }) => void
  onFechar: () => void
}

export default function ModalNovoUsuario({ onCriar, onFechar }: Props) {
  const [nome, setNome]       = useState('')
  const [email, setEmail]     = useState('')
  const [senha, setSenha]     = useState('')
  const [senha2, setSenha2]   = useState('')
  const [perfil, setPerfil]   = useState<Usuario['perfil'] | ''>('')
  const [candidatoId, setCandidatoId] = useState('')
  const [candidatos, setCandidatos]   = useState<Candidato[]>([])
  const [exportar, setExportar]   = useState(true)
  const [comparar, setComparar]   = useState(false)
  const [erro, setErro]           = useState('')

  useEffect(() => { listarCandidatos().then(setCandidatos).catch(() => {}) }, [])

  const precisaCandidato = perfil !== '' && perfil !== 'administrador'
  const candSelecionado  = candidatos.find(c => c.id === candidatoId)

  function handleSubmit() {
    if (!nome || !email || !senha || !perfil) { setErro('Preencha todos os campos obrigatórios.'); return }
    if (senha !== senha2) { setErro('As senhas não coincidem.'); return }
    if (precisaCandidato && !candidatoId) { setErro('Selecione o candidato vinculado.'); return }
    if (senha.length < 8) { setErro('A senha deve ter no mínimo 8 caracteres.'); return }
    setErro('')
    onCriar({
      nome, email, senha,
      perfil: perfil as Usuario['perfil'],
      candidato: precisaCandidato ? (candSelecionado?.nm_candidato ?? null) : null,
      candidato_id: precisaCandidato ? candidatoId || null : null,
      podeExportar: perfil === 'administrador' ? true : exportar,
      podeComparar: perfil === 'administrador' ? true : comparar,
      ativo: true,
    })
  }

  return (
    <div className={m.overlay} onClick={e => e.target === e.currentTarget && onFechar()}>
      <div className={m.modal}>
        <div className={m.hd}>
          <div>
            <div className={m.title}>Novo Usuário</div>
            <div className={m.sub}>Preencha os dados e defina as permissões do novo acesso</div>
          </div>
          <button className={m.close} onClick={onFechar}><i className="fa-solid fa-times" /></button>
        </div>

        <div className={m.bd}>
          <div className={m.secLabel}>Dados pessoais</div>
          <div className={m.grid2}>
            <div className={m.formG}>
              <label className={m.lbl}>Nome completo</label>
              <input className={m.inp} placeholder="Ex: Maria Luíza Conceição" value={nome} onChange={e => setNome(e.target.value)} />
            </div>
            <div className={m.formG}>
              <label className={m.lbl}>E-mail</label>
              <input className={m.inp} type="email" placeholder="usuario@email.com" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div className={m.formG}>
              <label className={m.lbl}>Senha temporária</label>
              <input className={m.inp} type="password" placeholder="Mínimo 8 caracteres" value={senha} onChange={e => setSenha(e.target.value)} />
            </div>
            <div className={m.formG}>
              <label className={m.lbl}>Confirmar senha</label>
              <input className={m.inp} type="password" placeholder="Repita a senha" value={senha2} onChange={e => setSenha2(e.target.value)} />
            </div>
          </div>

          <div className={m.divider} />

          <div className={m.secLabel}>Perfil e vínculo</div>
          <div className={m.grid2}>
            <div className={m.formG}>
              <label className={m.lbl}>Perfil de acesso</label>
              <select className={m.sel} value={perfil} onChange={e => setPerfil(e.target.value as Usuario['perfil'])}>
                <option value="">Selecionar perfil...</option>
                <option value="gestor">Gestor</option>
                <option value="analista">Analista</option>
                <option value="assessor">Assessor</option>
              </select>
            </div>
            {precisaCandidato && (
              <div className={m.formG}>
                <label className={m.lbl}>Candidato vinculado <span className={m.required}>★</span></label>
                <select className={m.sel} value={candidatoId} onChange={e => setCandidatoId(e.target.value)}>
                  <option value="">Selecionar candidato…</option>
                  {candidatos.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.nm_candidato}{c.sg_partido ? ` · ${c.sg_partido}` : ''}{c.sg_uf ? ` · ${c.sg_uf}` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}
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

          {erro && <div className={m.erro}><i className="fa-solid fa-circle-exclamation" />{erro}</div>}
        </div>

        <div className={m.ft}>
          <button className={`${m.btn} ${m.btnSecondary}`} onClick={onFechar}>Cancelar</button>
          <button className={`${m.btn} ${m.btnPrimary}`} onClick={handleSubmit}>
            <i className="fa-solid fa-user-plus" /> Criar Usuário
          </button>
        </div>
      </div>
    </div>
  )
}
