import styles from './TopMunicipios.module.css'

const MUNICIPIOS = [
  { rank: 1, nome: 'Goiânia',              zona: '1ª–14ª', votos: '79.840', pct: '38,2%', var: '+4,1 p.p.', varPos: true, idx: 82,  idxCor: 'var(--brand-700)',    idxW: 82,  idxGrad: 'var(--brand-700),var(--brand-400)', class: 'Consolidado',    badgeCls: 'consolidado' },
  { rank: 2, nome: 'Anápolis',             zona: '15ª–17ª',votos: '12.180', pct: '41,7%', var: '+7,3 p.p.', varPos: true, idx: 79,  idxCor: 'var(--brand-700)',    idxW: 79,  idxGrad: 'var(--brand-600),var(--brand-400)', class: 'Zona de Força',  badgeCls: 'forca' },
  { rank: 3, nome: 'Rio Verde',            zona: '42ª',    votos: '8.920',  pct: '35,4%', var: '+12,8 p.p.',varPos: true, idx: 71,  idxCor: '#16a34a',             idxW: 71,  idxGrad: '#5aab61,#86efac',                   class: 'Expansão',       badgeCls: 'expansao' },
  { rank: 4, nome: 'Aparecida de Goiânia', zona: '2ª–3ª', votos: '7.340',  pct: '29,1%', var: '–2,4 p.p.', varPos: false, idx: 54, idxCor: '#b45309',             idxW: 54,  idxGrad: '#f5a623,#fcd34d',                   class: 'Em Disputa',     badgeCls: 'disputa' },
  { rank: 5, nome: 'Caldas Novas',         zona: '53ª',    votos: '3.120',  pct: '22,6%', var: '–5,1 p.p.', varPos: false, idx: 38, idxCor: 'var(--danger-700)',   idxW: 38,  idxGrad: '#c0392b,#f87171',                   class: 'Adversário',     badgeCls: 'adversario' },
]

export default function TopMunicipios() {
  return (
    <div className={styles.card}>
      <div className={styles.cardHd}>
        <div>
          <div className={styles.cardTitle}>Top Municípios — Índice de Força · 2024</div>
          <div className={styles.cardSub}>Calculado por votos, tendência e consistência histórica</div>
        </div>
      </div>
      <div className={styles.tblWrap}>
        <table className={styles.tbl}>
          <thead>
            <tr>
              <th>#</th>
              <th>Município</th>
              <th>Zona</th>
              <th>Votos 2024</th>
              <th>% Válidos</th>
              <th>Var. 2022</th>
              <th>Índice de Força</th>
              <th>Classificação</th>
            </tr>
          </thead>
          <tbody>
            {MUNICIPIOS.map(m => (
              <tr key={m.rank}>
                <td className={styles.rank}>{m.rank}</td>
                <td className={styles.bold}>{m.nome}</td>
                <td>{m.zona}</td>
                <td>{m.votos}</td>
                <td>{m.pct}</td>
                <td className={m.varPos ? styles.tagUp : styles.tagDn}>{m.var}</td>
                <td>
                  <div className={styles.idxWrap}>
                    <div className={styles.idxTrack}>
                      <div
                        className={styles.idxFill}
                        style={{ width: `${m.idxW}%`, background: `linear-gradient(90deg,${m.idxGrad})` }}
                      />
                    </div>
                    <span className={styles.idxVal} style={{ color: m.idxCor }}>{m.idx}</span>
                  </div>
                </td>
                <td>
                  <span className={`${styles.badge} ${styles[m.badgeCls]}`}>
                    <i className="fa-solid fa-circle" style={{ fontSize: 6 }} />
                    {m.class}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
