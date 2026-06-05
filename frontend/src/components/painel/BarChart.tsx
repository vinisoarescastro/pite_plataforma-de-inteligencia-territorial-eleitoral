import styles from './BarChart.module.css'

interface BarRow {
  label: string
  valor: string
  largura: number
  cor: string
}

export default function BarChart({ rows }: { rows: BarRow[] }) {
  return (
    <div>
      {rows.map((r, i) => (
        <div key={i} className={styles.row}>
          <div className={styles.meta}>
            <span className={styles.name}>{r.label}</span>
            <span className={styles.count}>{r.valor}</span>
          </div>
          <div className={styles.track}>
            <div
              className={styles.fill}
              style={{ width: `${r.largura}%`, background: r.cor }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
