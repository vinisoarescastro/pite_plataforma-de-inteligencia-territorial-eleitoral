import type { PageId } from '../pages/HomePage'
import styles from './Sidebar.module.css'
import logoColorido from '../assets/logo/logo-nucleo-de-dados-colorido.png'

interface NavItem {
  id: PageId
  icon: string
  label: string
  adminOnly?: boolean
  section?: string
}

const NAV: (NavItem | { section: string })[] = [
  { id: 'painel',       icon: 'fa-house',          label: 'Painel' },
  { section: 'Análise' },
  { id: 'mapa',         icon: 'fa-map',             label: 'Mapa Territorial' },
  { id: 'candidatos',   icon: 'fa-user-tie',        label: 'Candidatos' },
  { id: 'partidos',     icon: 'fa-flag',            label: 'Partidos' },
  { id: 'pesquisas',    icon: 'fa-clipboard-list',  label: 'Pesquisas' },
  { id: 'comparacao',   icon: 'fa-scale-balanced',  label: 'Comparação' },
  { id: 'eleicoes',     icon: 'fa-landmark',        label: 'Eleições',     adminOnly: true },
  { id: 'candidaturas', icon: 'fa-link',            label: 'Candidaturas', adminOnly: true },
  { section: 'Dados' },
  { id: 'importacao',   icon: 'fa-file-import',     label: 'Importação',   adminOnly: true },
  { id: 'geografia',    icon: 'fa-globe',           label: 'Geografia',    adminOnly: true },
  { section: 'Sistema' },
  { id: 'usuarios',     icon: 'fa-users',           label: 'Usuários',     adminOnly: true },
]

const PROFILE_LABELS: Record<string, string> = {
  administrador: 'Administrador',
  gestor: 'Gestor',
  analista: 'Analista',
  assessor: 'Assessor',
}

const initials = (n: string) =>
  n.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()

interface Props {
  collapsed: boolean
  activePage: PageId
  profile: string
  name: string
  onNavigate: (page: PageId) => void
}

export default function Sidebar({ collapsed, activePage, profile, name, onNavigate }: Props) {
  const isAdmin = profile === 'administrador'
  const canCompare = ['administrador', 'analista'].includes(profile)

  function isVisible(item: NavItem): boolean {
    if (item.adminOnly && !isAdmin) return false
    if (item.id === 'comparacao' && !canCompare) return false
    return true
  }

  return (
    <aside className={`${styles.sidebar} ${collapsed ? styles.collapsed : ''}`}>
      {/* Header */}
      <div className={styles.sbHd}>
        <img src={logoColorido} alt="Núcleo de Dados" className={styles.sbLogoExpanded} />
        <img src={logoColorido} alt="Núcleo de Dados" className={styles.sbLogoCollapsed} />
      </div>

      {/* Nav */}
      <nav className={styles.sbNav}>
        {NAV.map((item, i) => {
          if ('section' in item && !('id' in item)) {
            return (
              <div key={`sec-${i}`} className={styles.sbSec}>
                {item.section}
              </div>
            )
          }
          const navItem = item as NavItem
          if (!isVisible(navItem)) return null
          return (
            <div
              key={navItem.id}
              className={`${styles.sbLink} ${activePage === navItem.id ? styles.active : ''}`}
              onClick={() => onNavigate(navItem.id)}
            >
              <div className={styles.sbIcon}>
                <i className={`fa-solid ${navItem.icon}`} />
              </div>
              <span className={styles.sbLbl}>{navItem.label}</span>
            </div>
          )
        })}
      </nav>

      {/* Footer — usuário */}
      <div className={styles.sbFt}>
        <div className={styles.sbUser}>
          <div className={styles.sbAv}>{initials(name)}</div>
          <div className={styles.sbUi}>
            <div className={styles.sbUname}>{name.split(' ').slice(0, 2).join(' ')}</div>
            <div className={styles.sbUrole}>{PROFILE_LABELS[profile] ?? profile}</div>
          </div>
        </div>
      </div>
    </aside>
  )
}
