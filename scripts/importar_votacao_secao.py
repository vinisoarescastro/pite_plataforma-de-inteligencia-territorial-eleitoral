"""
Importa votação por seção eleitoral (VOTACAO_SECAO_<ANO>_<UF>.csv do TSE).
O turno é lido da coluna NR_TURNO do próprio arquivo — não precisa informar.

Uso:
    python scripts/importar_votacao_secao.py --arquivo VOTACAO_SECAO_2024_GO.csv --ano 2024 --tipo municipal
    python scripts/importar_votacao_secao.py --arquivo VOTACAO_SECAO_2024_GO.csv --ano 2024 --tipo municipal --cargo "Vereador"
    python scripts/importar_votacao_secao.py --arquivo VOTACAO_SECAO_2024_GO.csv --ano 2024 --tipo municipal --votavel "12345"

    # Analisar duplicatas antes de importar:
    python scripts/importar_votacao_secao.py --arquivo VOTACAO_SECAO_2024_GO.csv --ano 2024 --tipo municipal --analisar-duplicatas
"""
import sys
import argparse
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent / 'backend'))

import pandas as pd
from sqlalchemy.dialects.postgresql import insert as pg_insert
from database import SessionLocal
from models.eleitoral import Eleicao, VotacaoSecao


BATCH     = 2000
CHUNKSIZE = 50_000
COLS_CHAVE = ['CD_MUNICIPIO', 'NR_ZONA', 'NR_SECAO', 'NR_VOTAVEL', 'CD_CARGO', 'NR_TURNO']


def parse_args():
    p = argparse.ArgumentParser()
    p.add_argument('--arquivo',             required=True)
    p.add_argument('--ano',                 required=False, type=int, default=None,
                   help='Ano da eleição (opcional — lido do arquivo se omitido)')
    p.add_argument('--tipo',                required=False, default=None,
                   choices=['municipal', 'federal', 'estadual'],
                   help='Tipo da eleição (opcional — lido do arquivo se omitido)')
    p.add_argument('--cargo',               default=None)
    p.add_argument('--votavel',             default=None)
    p.add_argument('--uf',                  default=None)
    p.add_argument('--analisar-duplicatas', action='store_true',
                   help='Analisa duplicatas no arquivo e sai sem importar')
    return p.parse_args()


def contar_linhas(csv_path: Path) -> int:
    print('Contando linhas do arquivo...', end=' ', flush=True)
    n = 0
    with open(csv_path, 'rb') as f:
        for _ in f:
            n += 1
    total = n - 1
    print(f'{total:,} linhas')
    return total


def analisar_duplicatas(csv_path: Path):
    print(f'\nAnalisando duplicatas em {csv_path.name}...')
    print('(Carregando arquivo completo — pode demorar alguns segundos)\n')

    df = pd.read_csv(csv_path, sep=';', encoding='latin1', dtype=str, low_memory=False)
    df.columns = [c.strip().upper() for c in df.columns]

    total = len(df)
    cols = [c for c in COLS_CHAVE if c in df.columns]
    n_dupes = df.duplicated(subset=cols).sum()
    duplicatas = df[df.duplicated(subset=cols, keep=False)].copy()

    print(f'Total de linhas          : {total:,}')
    print(f'Linhas únicas            : {total - n_dupes:,}')
    print(f'Linhas duplicadas (extra): {n_dupes:,}  ({n_dupes/total*100:.2f}%)')

    if 'NR_TURNO' in df.columns:
        print(f'\nTurnos encontrados no arquivo:')
        print(df['NR_TURNO'].value_counts().sort_index().to_string())

    if n_dupes > 0:
        print('\n── Exemplos de duplicatas ──────────────────────────────────')
        exemplo = duplicatas.sort_values(cols).head(20)
        pd.set_option('display.max_columns', None)
        pd.set_option('display.width', 200)
        print(exemplo[cols + ['NM_VOTAVEL', 'DS_CARGO', 'QT_VOTOS']].to_string(index=False))

        if 'DS_CARGO' in duplicatas.columns:
            print('\n── Distribuição por cargo ──────────────────────────────────')
            print(duplicatas.groupby('DS_CARGO').size().sort_values(ascending=False).to_string())
    print()


def barra_progresso(atual: int, total: int, inseridos: int, largura: int = 40) -> str:
    pct = atual / total if total > 0 else 0
    cheio = int(largura * pct)
    barra = '█' * cheio + '░' * (largura - cheio)
    faltam = total - atual
    return (
        f'\r[{barra}] {pct*100:5.1f}%  '
        f'{atual:>10,}/{total:,}  '
        f'inseridas={inseridos:,}  faltam={faltam:,}'
    )


def obter_ou_criar_eleicao(db, ano: int, turno: int, tipo: str) -> object:
    eleicao = db.query(Eleicao).filter_by(ano=ano, turno=turno, tipo=tipo).first()
    if not eleicao:
        descricao = f'Eleições {tipo.capitalize()} {ano} - {turno}º turno'
        eleicao = Eleicao(ano=ano, turno=turno, tipo=tipo, descricao=descricao)
        db.add(eleicao)
        db.flush()
        print(f'  Eleição criada: {descricao}')
    return eleicao


def main():
    args = parse_args()
    csv_path = Path(args.arquivo)
    if not csv_path.exists():
        print(f'Arquivo não encontrado: {csv_path}')
        sys.exit(1)

    if args.analisar_duplicatas:
        analisar_duplicatas(csv_path)
        sys.exit(0)

    total_arquivo = contar_linhas(csv_path)

    db = SessionLocal()
    try:
        # Cache de eleições por turno para não consultar o banco em cada linha
        eleicoes_cache: dict[int, object] = {}

        print(f'Importando {csv_path.name}...\n')
        total_processadas = 0
        total_inseridos   = 0

        reader = pd.read_csv(
            csv_path,
            sep=';',
            encoding='latin1',
            dtype=str,
            low_memory=False,
            chunksize=CHUNKSIZE,
        )

        for chunk in reader:
            chunk.columns = [c.strip().upper() for c in chunk.columns]

            if args.uf:
                chunk = chunk[chunk['SG_UF'].str.strip().str.upper() == args.uf.upper()]
            if args.cargo:
                chunk = chunk[chunk['DS_CARGO'].str.strip().str.upper() == args.cargo.upper()]
            if args.votavel:
                chunk = chunk[chunk['NR_VOTAVEL'].str.strip() == args.votavel.strip()]

            if chunk.empty:
                continue

            total_processadas += len(chunk)

            chunk['QT_VOTOS']         = pd.to_numeric(chunk.get('QT_VOTOS',         0), errors='coerce').fillna(0).astype(int)
            chunk['NR_ZONA']          = pd.to_numeric(chunk.get('NR_ZONA',          0), errors='coerce').fillna(0).astype(int)
            chunk['NR_SECAO']         = pd.to_numeric(chunk.get('NR_SECAO',         0), errors='coerce').fillna(0).astype(int)
            chunk['NR_TURNO']         = pd.to_numeric(chunk.get('NR_TURNO',         1), errors='coerce').fillna(1).astype(int)
            chunk['NR_LOCAL_VOTACAO'] = pd.to_numeric(chunk.get('NR_LOCAL_VOTACAO', 0), errors='coerce').fillna(0).astype(int)
            chunk['CD_CARGO']         = pd.to_numeric(chunk.get('CD_CARGO',        -1), errors='coerce').fillna(-1).astype(int)

            # Detecta o ano do arquivo se não foi passado via --ano
            if args.ano is None:
                if 'ANO_ELEICAO' not in chunk.columns:
                    print('ERRO: coluna ANO_ELEICAO não encontrada. Use --ano para informar manualmente.')
                    sys.exit(1)
                ano = int(chunk['ANO_ELEICAO'].dropna().iloc[0])
            else:
                ano = args.ano

            # Detecta o tipo do arquivo se não foi passado via --tipo
            if args.tipo is None:
                if 'TP_ABRANGENCIA' not in chunk.columns:
                    print('ERRO: coluna TP_ABRANGENCIA não encontrada. Use --tipo para informar manualmente.')
                    sys.exit(1)
                tp_raw = chunk['TP_ABRANGENCIA'].dropna().iloc[0].strip().upper()
                mapa_tipo = {'MUNICIPAL': 'municipal', 'FEDERAL': 'federal', 'ESTADUAL': 'estadual',
                             'M': 'municipal', 'F': 'federal', 'E': 'estadual'}
                tipo = mapa_tipo.get(tp_raw)
                if tipo is None:
                    print(f'ERRO: valor desconhecido em TP_ABRANGENCIA: "{tp_raw}". Use --tipo.')
                    sys.exit(1)
            else:
                tipo = args.tipo

            # Garante que as eleições de cada turno presente no chunk existem
            for turno in chunk['NR_TURNO'].unique():
                turno = int(turno)
                if turno not in eleicoes_cache:
                    eleicoes_cache[turno] = obter_ou_criar_eleicao(db, ano, turno, tipo)
            db.commit()

            registros = []
            for _, row in chunk.iterrows():
                turno = int(row['NR_TURNO'])
                eleicao_id = eleicoes_cache[turno].id
                registros.append({
                    'eleicao_id':        eleicao_id,
                    'cd_municipio_tse':  str(row.get('CD_MUNICIPIO', '')).strip(),
                    'nr_turno':          turno,
                    'nr_zona':           int(row['NR_ZONA']),
                    'nr_secao':          int(row['NR_SECAO']),
                    'nr_local_votacao':  int(row['NR_LOCAL_VOTACAO']) or None,
                    'nm_local_votacao':  str(row.get('NM_LOCAL_VOTACAO', '') or '').strip() or None,
                    'ds_endereco':       str(row.get('DS_LOCAL_VOTACAO_ENDERECO', '') or '').strip() or None,
                    'nr_votavel':        str(row.get('NR_VOTAVEL', '')).strip(),
                    'nm_votavel':        str(row.get('NM_VOTAVEL', '')).strip(),
                    'cd_cargo':          int(row['CD_CARGO']) if row['CD_CARGO'] != -1 else None,
                    'ds_cargo':          str(row.get('DS_CARGO', '') or '').strip() or None,
                    'sq_candidato':      str(row.get('SQ_CANDIDATO', '') or '').strip() or None,
                    'qt_votos':          int(row['QT_VOTOS']),
                })

            for i in range(0, len(registros), BATCH):
                batch = registros[i:i + BATCH]
                stmt = pg_insert(VotacaoSecao).values(batch).on_conflict_do_nothing(
                    constraint='uq_votacao_secao'
                )
                result = db.execute(stmt)
                total_inseridos += result.rowcount

            db.commit()
            print(barra_progresso(total_processadas, total_arquivo, total_inseridos), end='', flush=True)

        print()
        print(f'\nConcluído!')
        print(f'  Total no arquivo    : {total_arquivo:,}')
        print(f'  Linhas processadas  : {total_processadas:,}')
        print(f'  Registros inseridos : {total_inseridos:,}  ({total_inseridos/max(total_processadas,1)*100:.2f}%)')
        print(f'  Turnos importados   :')
        for turno, el in sorted(eleicoes_cache.items()):
            print(f'    Turno {turno} → Eleição ID: {el.id}')

    except KeyboardInterrupt:
        db.rollback()
        print(f'\n\nImportação cancelada.')
        print(f'  Inseridos até agora: {total_inseridos:,}')
    except Exception as e:
        db.rollback()
        print(f'\nErro: {e}')
        raise
    finally:
        db.close()


if __name__ == '__main__':
    main()
