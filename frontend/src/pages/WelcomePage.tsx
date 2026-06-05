import styles from './WelcomePage.module.css'

interface Props {
  name: string
  profile: string
  candidato: string | null
  podeExportar: boolean
  podeComparar: boolean
  onEntrar: () => void
}

const PERFIL_LABELS: Record<string, string> = {
  administrador: 'Administrador',
  gestor: 'Gestor',
  analista: 'Analista',
  assessor: 'Assessor',
}

function initials(name: string) {
  return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
}

function Perm({ ok, label, icon }: { ok: boolean; label: string; icon: string }) {
  return (
    <span className={`${styles.perm} ${ok ? styles.permOk : styles.permNo}`}>
      <i className={`fa-solid ${icon}`} />
      {label}
    </span>
  )
}

export default function WelcomePage({ name, profile, candidato, podeExportar, podeComparar, onEntrar }: Props) {
  const isAdmin = profile === 'administrador'
  const firstName = name.split(' ').slice(0, 2).join(' ')

  return (
    <div className={styles.overlay}>
      <div className={styles.card}>
        {/* Saudação */}
        <div className={styles.top}>
          <div className={styles.av}>{initials(name)}</div>
          <div>
            <div className={styles.greet}>Bem-vindo de volta</div>
            <div className={styles.nome}>{firstName}</div>
            <div className={styles.role}>{PERFIL_LABELS[profile] ?? profile} · PITE</div>
          </div>
        </div>

        {/* Corpo dinâmico por perfil */}
        {isAdmin ? (
          <div className={styles.adminCard}>
            <div className={styles.stat}><div className={styles.statVal}>—</div><div className={styles.statLbl}>Candidatos</div></div>
            <div className={styles.stat}><div className={styles.statVal}>—</div><div className={styles.statLbl}>Territórios</div></div>
            <div className={styles.stat}><div className={styles.statVal}>—</div><div className={styles.statLbl}>Pesquisas</div></div>
            <div className={styles.stat}><div className={styles.statVal}>—</div><div className={styles.statLbl}>Importações</div></div>
          </div>
        ) : (
          <div className={styles.candCard}>
            <div className={styles.candLabel}>Candidato vinculado</div>
            <div className={styles.candRow}>
              <div className={styles.candIco}>
                {candidato ? initials(candidato) : '—'}
              </div>
              <div>
                <div className={styles.candNome}>{candidato ?? 'Não definido'}</div>
                <div className={styles.candCargo}>{PERFIL_LABELS[profile] ?? profile}</div>
              </div>
            </div>
            <div className={styles.perms}>
              <Perm ok={podeExportar} label="Exportar"  icon="fa-download" />
              <Perm ok={podeComparar} label="Comparar"  icon="fa-scale-balanced" />
              <Perm ok={false}        label="Importar"  icon="fa-file-import" />
            </div>
          </div>
        )}

        <button className={styles.btn} onClick={onEntrar}>
          <i className="fa-solid fa-arrow-right" /> Acessar o portal
        </button>
      </div>
    </div>
  )
}
