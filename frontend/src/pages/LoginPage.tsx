import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { login } from '../services/auth'
import styles from './LoginPage.module.css'
import logoColorido from '../assets/logo/logo-nucleo-de-dados-colorido.png'
import logoBranco from '../assets/logo/logo-nucleo-de-dados-branco-colorido.png'


export default function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await login({ email, password })
      localStorage.setItem('access_token', data.access_token)
      localStorage.setItem('user_name', data.user_name)
      localStorage.setItem('user_profile', data.user_profile)
      if (data.user_candidate) localStorage.setItem('user_candidate', data.user_candidate)
      else localStorage.removeItem('user_candidate')
      localStorage.setItem('user_can_export', String(data.user_can_export))
      localStorage.setItem('user_can_compare', String(data.user_can_compare))
      localStorage.setItem('show_welcome', '1')
      navigate('/home')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao fazer login.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.screen}>
      <div className={styles.bg} />
      <div className={styles.grid} />

      <div className={styles.wrap}>
        {/* Lado esquerdo — branding */}
        <div className={styles.left}>
          <div>
            <img src={logoBranco} alt="Núcleo de Dados" className={styles.logo} />
          </div>
          <div>
            <div className={styles.tagline}>
              Inteligência territorial para decisões eleitorais estratégicas.
            </div>
            <p className={styles.desc}>
              Analise dados do TSE, pesquisas e perfis territoriais em uma plataforma
              integrada — com segurança e controle de acesso por perfil.
            </p>
            <div className={styles.pills}>
              {['Dados TSE', 'Mapas Eleitorais', 'RBAC', 'Análise Territorial'].map((p) => (
                <span key={p} className={styles.pill}>
                  <i className="fa-solid fa-check" />
                  {p}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Lado direito — formulário */}
        <div className={styles.right}>
          <img src={logoColorido} alt="Núcleo de Dados" className={styles.logoMobile} />
          <div className={styles.title}>Entrar na plataforma</div>
          <div className={styles.subtitle}>Acesse com seu e-mail e senha</div>

          <form onSubmit={handleSubmit} noValidate>
            <div className={styles.fieldGroup}>
              <label className={styles.label} htmlFor="email">E-mail</label>
              <div className={styles.inputWrap}>
                <i className={`fa-solid fa-envelope ${styles.icon}`} />
                <input
                  id="email"
                  type="email"
                  className={styles.input}
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.label} htmlFor="password">Senha</label>
              <div className={styles.inputWrap}>
                <i className={`fa-solid fa-lock ${styles.icon}`} />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className={styles.input}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className={styles.eyeBtn}
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`} />
                </button>
              </div>
            </div>

            <div className={styles.forgotRow}>
              <a href="#forgot" className={styles.forgot}>Esqueci minha senha</a>
            </div>

            {error && (
              <div className={styles.error}>
                <i className="fa-solid fa-circle-exclamation" />
                {error}
              </div>
            )}

            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading
                ? <><i className="fa-solid fa-circle-notch fa-spin" /> Entrando…</>
                : <><i className="fa-solid fa-arrow-right-to-bracket" /> Entrar</>
              }
            </button>
          </form>

          <p className={styles.footer}>
            PITE © {new Date().getFullYear()} — Uso restrito e autorizado
          </p>
        </div>
      </div>
    </div>
  )
}
