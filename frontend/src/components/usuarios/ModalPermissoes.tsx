import { useState } from 'react'
import type { PermsPeril } from '../../pages/UsuariosPage'
import m from './Modal.module.css'

interface Props {
  perms: PermsPeril
  onSalvar: (p: PermsPeril) => void
  onFechar: () => void
}

const PERFIS = [
  { key: 'gestor'   as const, label: 'Gestor',   icone: 'fa-user-tie',   cor: '#15803d', bg: '#f0fdf4', desc: '· Vinculado a 1 candidato · dados completos' },
  { key: 'analista' as const, label: 'Analista', icone: 'fa-chart-bar',  cor: '#1d4ed8', bg: '#eff6ff', desc: '· Vinculado a 1 candidato · dados + comparação' },
  { key: 'assessor' as const, label: 'Assessor', icone: 'fa-eye',        cor: '#b45309', bg: '#fffbeb', desc: '· Vinculado a 1 candidato · somente leitura' },
]

export default function ModalPermissoes({ perms, onSalvar, onFechar }: Props) {
  const [local, setLocal] = useState<PermsPeril>({ ...perms })

  return (
    <div className={m.overlay} onClick={e => e.target === e.currentTarget && onFechar()}>
      <div className={m.modal} style={{ maxWidth: 620 }}>
        <div className={m.hd}>
          <div>
            <div className={m.title}>Permissões por Perfil</div>
            <div className={m.sub}>Configure as capacidades padrão de cada perfil. Permissões individuais podem sobrescrever.</div>
          </div>
          <button className={m.close} onClick={onFechar}><i className="fa-solid fa-times" /></button>
        </div>

        <div className={m.bd}>
          {/* Aviso admin */}
          <div className={m.infoBox}>
            <i className="fa-solid fa-circle-info" style={{ color: 'var(--brand-500)', flexShrink: 0, marginTop: 1 }} />
            <span>O perfil <strong>Administrador</strong> sempre tem acesso total e não pode ser restringido. A importação de dados TSE é exclusiva do Administrador em todos os perfis.</span>
          </div>

          {PERFIS.map(p => (
            <div key={p.key} className={m.perfilSection}>
              <div className={m.perfilSectionHd}>
                <div className={m.perfilSectionIco} style={{ background: p.bg, color: p.cor }}>
                  <i className={`fa-solid ${p.icone}`} />
                </div>
                <div className={m.perfilSectionNome}>{p.label}</div>
                <span className={m.perfilSectionDesc}>{p.desc}</span>
              </div>
              <div className={m.permsBox}>
                <div className={m.permRow}>
                  <div>
                    <div className={m.permLbl}>Exportar dados</div>
                    <div className={m.permDesc}>Permite baixar CSV de tabelas e relatórios</div>
                  </div>
                  <label className={m.toggle}>
                    <input
                      type="checkbox"
                      checked={local[p.key].exportar}
                      onChange={e => setLocal(prev => ({ ...prev, [p.key]: { ...prev[p.key], exportar: e.target.checked } }))}
                    />
                    <span className={m.toggleTrack} />
                  </label>
                </div>
                <div className={m.permRow}>
                  <div>
                    <div className={m.permLbl}>Comparar candidatos</div>
                    <div className={m.permDesc}>Acesso à tela de comparação entre eleições e candidatos</div>
                  </div>
                  <label className={m.toggle}>
                    <input
                      type="checkbox"
                      checked={local[p.key].comparar}
                      onChange={e => setLocal(prev => ({ ...prev, [p.key]: { ...prev[p.key], comparar: e.target.checked } }))}
                    />
                    <span className={m.toggleTrack} />
                  </label>
                </div>
                <div className={m.permRow}>
                  <div>
                    <div className={m.permLbl}>Importar dados TSE</div>
                    <div className={m.permDesc}>Envio de arquivos CSV do TSE para o sistema</div>
                  </div>
                  <span className={m.badgeBlocked}><i className="fa-solid fa-ban" /> Sempre bloqueado</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className={m.ft}>
          <button className={`${m.btn} ${m.btnSecondary}`} onClick={onFechar}>Cancelar</button>
          <button className={`${m.btn} ${m.btnPrimary}`} onClick={() => onSalvar(local)}>
            <i className="fa-solid fa-check" /> Salvar permissões
          </button>
        </div>
      </div>
    </div>
  )
}
