import styles from './KpiCard.module.css'

type Cor = 'blue' | 'green' | 'amber' | 'purple' | 'teal'

interface Props {
  valor: string | number
  label: string
  icone: string
  cor: Cor
  trend: string
  trendType: 'up' | 'green' | 'neutral'
  onClick?: () => void
}

export default function KpiCard({ valor, label, icone, cor, trend, trendType, onClick }: Props) {
  return (
    <div className={`${styles.card} ${onClick ? styles.clickable : ''}`} onClick={onClick}>
      <div className={styles.top}>
        <div>
          <div className={styles.valor}>{valor}</div>
          <div className={styles.label}>{label}</div>
        </div>
        <div className={`${styles.icone} ${styles[cor]}`}>
          <i className={`fa-solid ${icone}`} />
        </div>
      </div>
      <span
        className={`${styles.trend} ${
          trendType === 'up' ? styles.trendUp :
          trendType === 'green' ? styles.trendGreen :
          styles.trendNeutral
        }`}
        dangerouslySetInnerHTML={{ __html: trend }}
      />
    </div>
  )
}
