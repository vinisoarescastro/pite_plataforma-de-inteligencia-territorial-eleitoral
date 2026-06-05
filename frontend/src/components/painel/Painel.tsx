import type { PageId } from '../../pages/HomePage'
import KpiCard from './KpiCard'
import BarChart from './BarChart'
import TopMunicipios from './TopMunicipios'
import styles from './Painel.module.css'

interface Props {
  profile: string
  name: string
  onNavigate: (page: PageId) => void
}

const VOTOS_HIST = [
  { label: '2016', valor: '42.890', largura: 46, cor: '#5aab61' },
  { label: '2018', valor: '56.120', largura: 61, cor: '#1a7a4a' },
  { label: '2020', valor: '38.744', largura: 41, cor: '#f5a623' },
  { label: '2022', valor: '68.391', largura: 74, cor: '#1a7a4a' },
  { label: '2024', valor: '79.840', largura: 86, cor: '#0d5c37' },
]

const CLASS_TERR = [
  { label: 'Consolidado',   valor: '22%', largura: 22, cor: '#0d5c37' },
  { label: 'Zona de Força', valor: '25%', largura: 25, cor: '#1a7a4a' },
  { label: 'Expansão',      valor: '15%', largura: 15, cor: '#5aab61' },
  { label: 'Em Disputa',    valor: '18%', largura: 18, cor: '#f5a623' },
  { label: 'Adversário',    valor: '12%', largura: 12, cor: '#c0392b' },
  { label: 'Volátil',       valor: '8%',  largura: 8,  cor: '#9b59b6' },
]

const VOTOS_ADMIN = [
  { label: '2016', valor: '142.890', largura: 48, cor: '#5aab61' },
  { label: '2018', valor: '198.120', largura: 67, cor: '#1a7a4a' },
  { label: '2020', valor: '167.744', largura: 57, cor: '#f5a623' },
  { label: '2022', valor: '231.391', largura: 78, cor: '#1a7a4a' },
  { label: '2024', valor: '296.840', largura: 100, cor: '#0d5c37' },
]

const ATIVIDADES = [
  { icone: 'fa-file-import',   bg: '#f0fdf4', cor: '#1a7a4a', titulo: 'Importação TSE 2024 GO',          sub: '12.847 registros importados',      tempo: '2h' },
  { icone: 'fa-clipboard-list',bg: '#eff4ff', cor: '#2552e8', titulo: 'Pesquisa #14 importada',           sub: 'Goiânia · mai 2024',               tempo: '5h' },
  { icone: 'fa-map-pin',       bg: '#f0fdf4', cor: '#5aab61', titulo: '3 territórios reclassificados',   sub: 'Zona de Expansão · João F.',        tempo: '1d' },
  { icone: 'fa-user-plus',     bg: '#fffbeb', cor: '#f59e0b', titulo: 'Pré-candidata cadastrada',        sub: 'Maria L. · Anápolis',               tempo: '2d' },
  { icone: 'fa-users',         bg: '#eff4ff', cor: '#2552e8', titulo: 'Novo usuário criado',             sub: 'Pedro Lima · Assessor',             tempo: '3d' },
]

export default function Painel({ profile, onNavigate }: Props) {
  const isAdmin  = profile === 'administrador'
  const isGestor = profile === 'gestor'
  const isAnalista = profile === 'analista'
  const isAssessor = profile === 'assessor'

  return (
    <div className={styles.page}>
      {/* ── Cabeçalho ── */}
      <div className={styles.ph}>
        <div>
          <div className={styles.phTitle}>
            {isAdmin ? 'Painel Principal' : 'Meu Painel'}
          </div>
          <div className={styles.phSub}>
            {isAdmin
              ? 'Visão geral da plataforma · todos os candidatos · Goiás 2024'
              : 'Análise territorial · Goiás 2024'}
          </div>
        </div>
        <div className={styles.phR}>
          {isAssessor && (
            <span className={styles.somenteLeitura}>
              <i className="fa-solid fa-eye" /> Somente visualização
            </span>
          )}
          {(isAdmin || isGestor || isAnalista) && (
            <button className={`${styles.btn} ${styles.btnSecondary}`}>
              <i className="fa-solid fa-download" /> Exportar
            </button>
          )}
          {isAdmin && (
            <button
              className={`${styles.btn} ${styles.btnPrimary}`}
              onClick={() => onNavigate('importacao')}
            >
              <i className="fa-solid fa-file-import" /> Importar dados
            </button>
          )}
          {isAnalista && (
            <button
              className={`${styles.btn} ${styles.btnPrimary}`}
              onClick={() => onNavigate('comparacao')}
            >
              <i className="fa-solid fa-scale-balanced" /> Comparar candidatos
            </button>
          )}
        </div>
      </div>

      {/* ── KPIs ── */}
      <div className={`${styles.kpiGrid} ${!isAdmin ? styles.kpiGrid4 : ''}`}>
        {isAdmin && (
          <KpiCard valor={48}  label="Candidatos"     icone="fa-user-tie"       cor="blue"   trend='<i class="fa-solid fa-arrow-up"></i> 12 pré-candidatos' trendType="up"     onClick={() => onNavigate('candidatos')} />
        )}
        <KpiCard valor={246} label="Territórios"    icone="fa-map"            cor="green"  trend='<i class="fa-solid fa-check"></i> 100% mapeados'      trendType="green"  onClick={() => onNavigate('mapa')} />
        <KpiCard valor={61}  label="Zonas de Força" icone="fa-location-dot"  cor="amber"  trend='<i class="fa-solid fa-arrow-up"></i> +7 vs 2022'        trendType="up" />
        <KpiCard valor={14}  label="Pesquisas"       icone="fa-clipboard-list" cor="purple" trend='<i class="fa-solid fa-clock"></i> Última: 12 mai'       trendType="neutral" onClick={() => onNavigate('pesquisas')} />
        {isAdmin
          ? <KpiCard valor={9}     label="Importações TSE"     icone="fa-database"       cor="teal"   trend='<i class="fa-solid fa-clock"></i> Última: 02 jun'   trendType="neutral" onClick={() => onNavigate('importacao')} />
          : isAnalista
          ? <KpiCard valor={47}    label="Candidatos p/ comparar" icone="fa-scale-balanced" cor="teal" trend='<i class="fa-solid fa-eye"></i> somente leitura'  trendType="neutral" onClick={() => onNavigate('comparacao')} />
          : isGestor
          ? <KpiCard valor="02/06" label="Última atualização"  icone="fa-rotate"         cor="teal"   trend='<i class="fa-solid fa-check"></i> TSE 2024'        trendType="green" />
          : null
        }
      </div>

      {/* ── Banner Analista — comparação ── */}
      {isAnalista && (
        <div className={styles.comparacaoBanner} onClick={() => onNavigate('comparacao')}>
          <div className={styles.comparacaoIco}>
            <i className="fa-solid fa-scale-balanced" />
          </div>
          <div className={styles.comparacaoText}>
            <div className={styles.comparacaoTitle}>Comparação disponível para você</div>
            <div className={styles.comparacaoSub}>Como analista, você pode comparar o candidato vinculado com outros 47 candidatos da plataforma.</div>
          </div>
          <i className="fa-solid fa-arrow-right" style={{ color: 'var(--brand-500)', fontSize: 13 }} />
        </div>
      )}

      {/* ── Assessor: aviso somente leitura ── */}
      {isAssessor && (
        <div className={styles.assessorAviso}>
          <i className="fa-solid fa-eye" style={{ color: '#b45309' }} />
          <div>
            <div className={styles.avisoTitle}>Perfil Assessor — somente visualização</div>
            <div className={styles.avisoSub}>Você pode visualizar dados, mapas e pesquisas. Exportação e comparação não estão disponíveis para este perfil.</div>
          </div>
        </div>
      )}

      {/* ── Grid de cards ── */}
      <div className={`${styles.grid} ${isAdmin ? styles.threeCol : styles.twoCol}`}>
        {/* Evolução de votos */}
        <div className={styles.card}>
          <div className={styles.cardHd}>
            <div>
              <div className={styles.cardTitle}>Evolução de Votos</div>
              <div className={styles.cardSub}>
                {isAdmin ? 'Todos os candidatos · 2016–2024' : 'Candidato vinculado · 2016–2024'}
              </div>
            </div>
          </div>
          <div className={styles.cardBd}>
            <BarChart rows={isAdmin ? VOTOS_ADMIN : VOTOS_HIST} />
          </div>
        </div>

        {/* Classificação territorial */}
        {(isAdmin || isGestor || isAssessor) && (
          <div className={styles.card}>
            <div className={styles.cardHd}>
              <div className={styles.cardTitle}>Classificação Territorial</div>
            </div>
            <div className={styles.cardBd}>
              <BarChart rows={CLASS_TERR} />
            </div>
          </div>
        )}

        {/* Atividade recente */}
        {(isAdmin || isAnalista) && (
          <div className={styles.card}>
            <div className={styles.cardHd}>
              <div className={styles.cardTitle}>Atividade Recente</div>
              <div className={styles.cardSub}>
                {isAdmin ? 'Toda a plataforma' : 'Candidato vinculado'}
              </div>
            </div>
            <div className={`${styles.cardBd} ${styles.actBd}`}>
              <div className={styles.actList}>
                {ATIVIDADES.map((a, i) => (
                  <div key={i} className={styles.actItem}>
                    <div className={styles.actIco} style={{ background: a.bg, color: a.cor }}>
                      <i className={`fa-solid ${a.icone}`} />
                    </div>
                    <div className={styles.actInfo}>
                      <div className={styles.actTitle}>{a.titulo}</div>
                      <div className={styles.actSub}>{a.sub}</div>
                    </div>
                    <div className={styles.actTime}>{a.tempo}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Top Municípios ── */}
      <div className={styles.topMunicWrap}>
        <TopMunicipios />
      </div>
    </div>
  )
}
