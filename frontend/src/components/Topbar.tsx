import styles from './Topbar.module.css'

const initials = (n: string) =>
  n.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()

interface Props {
  pageName: string
  profile: string
  name: string
  onLogout: () => void
}

export default function Topbar({ pageName, name, onLogout }: Props) {
  return (
    <header className={styles.topbar}>
      <div className={styles.breadcrumb}>
        <span className={styles.bcItem}>PITE</span>
        <span className={styles.bcSep}><i className="fa-solid fa-chevron-right" /></span>
        <span className={styles.bcCur}>{pageName}</span>
      </div>

      <div className={styles.search}>
        <i className="fa-solid fa-magnifying-glass" />
        <input placeholder="Buscar candidato, território..." />
      </div>

      <div className={styles.actions}>
        <button className={styles.tbBtn} title="Notificações">
          <i className="fa-solid fa-bell" />
          <span className={styles.notifDot} />
        </button>
        <button
          className={`${styles.tbBtn} ${styles.logoutBtn}`}
          title="Sair"
          onClick={onLogout}
        >
          <i className="fa-solid fa-arrow-right-from-bracket" />
        </button>
        <div className={styles.avatar}>{initials(name)}</div>
      </div>
    </header>
  )
}
