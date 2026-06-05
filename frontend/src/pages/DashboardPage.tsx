import { useNavigate } from 'react-router-dom'
import styles from './DashboardPage.module.css'

export default function DashboardPage() {
  const navigate = useNavigate()
  const name = localStorage.getItem('user_name') ?? 'Usuário'
  const profile = localStorage.getItem('user_profile') ?? ''

  function logout() {
    localStorage.removeItem('access_token')
    localStorage.removeItem('user_name')
    localStorage.removeItem('user_profile')
    navigate('/login')
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.avatar}>{name.charAt(0).toUpperCase()}</div>
        <h1 className={styles.greeting}>Olá, {name}!</h1>
        <p className={styles.profile}>{profile}</p>
        <p className={styles.hint}>Dashboard em construção. O módulo de análise territorial estará disponível em breve.</p>
        <button className={styles.logoutBtn} onClick={logout}>
          <i className="fa-solid fa-arrow-right-from-bracket" />
          Sair
        </button>
      </div>
    </div>
  )
}
