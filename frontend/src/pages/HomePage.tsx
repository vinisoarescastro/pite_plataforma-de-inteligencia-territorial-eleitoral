import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styles from './HomePage.module.css'
import Sidebar from '../components/Sidebar'
import Topbar from '../components/Topbar'
import Painel from '../components/painel/Painel'
import UsuariosPage from './UsuariosPage'
import WelcomePage from './WelcomePage'
import MapaPage from './MapaPage'
import CandidatosPage from './CandidatosPage'
import PartidosPage from './PartidosPage'
import ImportacaoPage from './ImportacaoPage'
import EleioesPage from './EleioesPage'
import GeografiaPage from './GeografiaPage'

export type PageId =
  | 'painel' | 'mapa' | 'candidatos' | 'partidos' | 'pesquisas'
  | 'comparacao' | 'eleicoes' | 'candidaturas'
  | 'importacao' | 'geografia' | 'usuarios'

export const PAGE_NAMES: Record<PageId, string> = {
  painel:       'Painel Principal',
  mapa:         'Mapa Territorial',
  candidatos:   'Candidatos',
  partidos:     'Partidos',
  pesquisas:    'Pesquisas Eleitorais',
  comparacao:   'Comparação de Eleições',
  eleicoes:     'Eleições',
  candidaturas: 'Candidaturas',
  importacao:   'Cobertura de Dados',
  geografia:    'Geografia · Geocodificação',
  usuarios:     'Usuários',
}

export default function HomePage() {
  const navigate = useNavigate()
  const [activePage, setActivePage] = useState<PageId>('painel')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [showWelcome, setShowWelcome] = useState(
    () => localStorage.getItem('show_welcome') === '1'
  )

  const profile  = localStorage.getItem('user_profile') ?? ''
  const name     = localStorage.getItem('user_name') ?? 'Usuário'
  const candidato = localStorage.getItem('user_candidate') ?? null

  const podeExportar = profile === 'administrador' || localStorage.getItem('user_can_export') === 'true'
  const podeComparar = profile === 'administrador' || localStorage.getItem('user_can_compare') === 'true'

  function handleEntrar() {
    localStorage.removeItem('show_welcome')
    setShowWelcome(false)
  }

  function handleNavigate(page: PageId) {
    const adminOnly: PageId[] = ['eleicoes','candidaturas','importacao','geografia','usuarios']
    const canCompare = ['administrador','analista'].includes(profile)

    if (adminOnly.includes(page) && profile !== 'administrador') {
      alert('Acesso restrito ao Administrador.')
      return
    }
    if (page === 'comparacao' && !canCompare) {
      alert('Comparação disponível apenas para Analista e Administrador.')
      return
    }
    setActivePage(page)
  }

  function handleLogout() {
    localStorage.removeItem('access_token')
    localStorage.removeItem('user_name')
    localStorage.removeItem('user_profile')
    localStorage.removeItem('user_candidate')
    localStorage.removeItem('user_can_export')
    localStorage.removeItem('user_can_compare')
    localStorage.removeItem('show_welcome')
    navigate('/login')
  }

  return (
    <>
      {showWelcome && (
        <WelcomePage
          name={name}
          profile={profile}
          candidato={candidato}
          podeExportar={podeExportar}
          podeComparar={podeComparar}
          onEntrar={handleEntrar}
        />
      )}

      <div className={styles.shell}>
        <div className={`${styles.sidebarWrap} ${sidebarCollapsed ? styles.collapsed : ''}`}>
          <Sidebar
            collapsed={sidebarCollapsed}
            activePage={activePage}
            profile={profile}
            name={name}
            onNavigate={handleNavigate}
          />
          <button
            className={styles.sbArrow}
            onClick={() => setSidebarCollapsed(v => !v)}
            title={sidebarCollapsed ? 'Expandir menu' : 'Recolher menu'}
          >
            <i className={`fa-solid fa-chevron-left ${sidebarCollapsed ? styles.arrowFlipped : ''}`} />
          </button>
        </div>

        <div className={styles.appBody}>
          <Topbar
            pageName={PAGE_NAMES[activePage]}
            profile={profile}
            name={name}
            onLogout={handleLogout}
          />
          <main className={styles.contentArea}>
            {activePage === 'painel' && (
              <Painel profile={profile} name={name} onNavigate={handleNavigate} />
            )}
            {activePage === 'usuarios' && <UsuariosPage />}
            {activePage === 'mapa' && <MapaPage />}
            {activePage === 'candidatos' && <CandidatosPage isAdmin={profile === 'administrador'} />}
            {activePage === 'partidos' && <PartidosPage isAdmin={profile === 'administrador'} />}
            {activePage === 'importacao' && <ImportacaoPage onNavigate={handleNavigate} />}
            {activePage === 'eleicoes'   && <EleioesPage />}
            {activePage === 'geografia'  && <GeografiaPage />}
            {activePage !== 'painel' && activePage !== 'usuarios' && activePage !== 'mapa' && activePage !== 'candidatos' && activePage !== 'partidos' && activePage !== 'importacao' && activePage !== 'eleicoes' && activePage !== 'geografia' && (
              <div className={styles.emptyPage}>
                <i className="fa-solid fa-hammer" />
                <h2>{PAGE_NAMES[activePage]}</h2>
                <p>Esta seção está em desenvolvimento.</p>
              </div>
            )}
          </main>
        </div>
      </div>
    </>
  )
}
