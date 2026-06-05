"""
Importa resultados eleitorais do CSV do TSE para o banco de dados.

Uso:
    python scripts/importar_resultados_tse.py --arquivo votacao_candidato_munzona_2024.csv \
        --ano 2024 --turno 1 --tipo municipal \
        --candidato "NOME DO CANDIDATO"

Argumentos:
    --arquivo    Caminho para o CSV do TSE (encoding latin1, separador ;)
    --ano        Ano da eleicao (ex: 2024)
    --turno      Turno (1 ou 2)
    --tipo       Tipo: municipal | federal | estadual
    --candidato  Nome exato do candidato (como aparece no CSV, coluna NM_CANDIDATO)
                 Se omitido, importa TODOS os candidatos do arquivo.

O script:
  1. Cria a eleicao se ainda nao existir
  2. Cria os candidatos encontrados
  3. Faz o JOIN com municipio_tse_ibge para obter o codigo IBGE
  4. Insere os resultados por municipio (agrupa zonas eleitorais do mesmo municipio)
"""
import sys
import argparse
from pathlib import Path
from collections import defaultdict

sys.path.insert(0, str(Path(__file__).parent.parent / 'backend'))

import pandas as pd
from database import SessionLocal
from models.eleitoral import MunicipioTSE, Eleicao, Candidato, ResultadoEleitoral


def parse_args():
    p = argparse.ArgumentParser()
    p.add_argument('--arquivo',   required=True)
    p.add_argument('--ano',       required=True, type=int)
    p.add_argument('--turno',     required=True, type=int)
    p.add_argument('--tipo',      required=True, choices=['municipal', 'federal', 'estadual'])
    p.add_argument('--candidato', required=False, default=None,
                   help='Filtra apenas este candidato pelo nome (NM_CANDIDATO)')
    return p.parse_args()


def main():
    args = parse_args()
    csv_path = Path(args.arquivo)
    if not csv_path.exists():
        print(f'Arquivo nao encontrado: {csv_path}')
        sys.exit(1)

    db = SessionLocal()
    try:
        # ── 1. Carrega mapa TSE → IBGE ─────────────────────────────
        print('Carregando mapa TSE -> IBGE...')
        mapa = {
            str(m.cd_tse): str(m.cd_ibge)
            for m in db.query(MunicipioTSE).all()
        }
        if not mapa:
            print('ERRO: tabela municipio_tse_ibge esta vazia.')
            print('Execute primeiro: python scripts/importar_municipios_tse.py')
            sys.exit(1)
        print(f'  {len(mapa)} municipios no mapa.')

        # ── 2. Le o CSV ────────────────────────────────────────────
        print(f'Lendo {csv_path.name}...')
        df = pd.read_csv(
            csv_path,
            sep=';',
            encoding='latin1',
            dtype=str,
            low_memory=False,
        )
        print(f'  {len(df)} linhas carregadas.')

        # Normaliza nomes de coluna (remove espacos, uppercase)
        df.columns = [c.strip().upper() for c in df.columns]

        # Filtra candidato se informado
        if args.candidato:
            df = df[df['NM_CANDIDATO'].str.strip().str.upper() == args.candidato.strip().upper()]
            if df.empty:
                print(f'Nenhuma linha encontrada para o candidato "{args.candidato}".')
                print('Candidatos disponiveis no arquivo:')
                todos = pd.read_csv(csv_path, sep=';', encoding='latin1', dtype=str,
                                    usecols=['NM_CANDIDATO']).dropna()
                for nome in sorted(todos['NM_CANDIDATO'].unique()):
                    print(f'  - {nome}')
                sys.exit(1)
            print(f'  Filtrado para o candidato "{args.candidato}": {len(df)} linhas.')

        # ── 3. Cria/busca eleicao ──────────────────────────────────
        eleicao = db.query(Eleicao).filter_by(
            ano=args.ano, turno=args.turno, tipo=args.tipo
        ).first()
        if not eleicao:
            descricao = f'Eleicoes {args.tipo.capitalize()} {args.ano} - {args.turno}o turno'
            eleicao = Eleicao(ano=args.ano, turno=args.turno, tipo=args.tipo, descricao=descricao)
            db.add(eleicao)
            db.flush()
            print(f'  Eleicao criada: {descricao}')
        else:
            print(f'  Eleicao existente: {eleicao.descricao or eleicao.id}')

        # ── 4. Agrupa por candidato + municipio (soma zonas) ───────
        cols_necessarias = ['NM_CANDIDATO', 'NR_CANDIDATO', 'NM_PARTIDO', 'SG_PARTIDO',
                            'SG_UF', 'CD_MUNICIPIO', 'DS_CARGO',
                            'QT_VOTOS_NOMINAIS', 'QT_VOTOS_VALIDOS', 'QT_APTOS', 'QT_ABSTENCOES']
        # Usa apenas colunas que existem
        cols_presentes = [c for c in cols_necessarias if c in df.columns]
        df = df[cols_presentes].copy()

        for col in ['QT_VOTOS_NOMINAIS', 'QT_VOTOS_VALIDOS', 'QT_APTOS', 'QT_ABSTENCOES']:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0).astype(int)

        group_cols = ['NM_CANDIDATO', 'NR_CANDIDATO', 'SG_UF', 'CD_MUNICIPIO']
        if 'NM_PARTIDO'  in df.columns: group_cols.append('NM_PARTIDO')
        if 'SG_PARTIDO'  in df.columns: group_cols.append('SG_PARTIDO')
        if 'DS_CARGO'    in df.columns: group_cols.append('DS_CARGO')

        sum_cols = [c for c in ['QT_VOTOS_NOMINAIS', 'QT_VOTOS_VALIDOS', 'QT_APTOS', 'QT_ABSTENCOES']
                    if c in df.columns]
        df_mun = df.groupby(group_cols, as_index=False)[sum_cols].sum()
        print(f'  {len(df_mun)} linhas apos agregar por municipio.')

        # ── 5. Insere candidatos e resultados ──────────────────────
        candidatos_cache: dict[str, Candidato] = {}
        inseridos = 0
        sem_ibge  = 0

        for _, row in df_mun.iterrows():
            nm_cand = str(row.get('NM_CANDIDATO', '')).strip()
            nr_cand = str(row.get('NR_CANDIDATO', '')).strip()
            cd_mun_tse = str(row.get('CD_MUNICIPIO', '')).strip()

            # Busca código IBGE
            cd_ibge = mapa.get(cd_mun_tse)
            if not cd_ibge:
                sem_ibge += 1
                continue

            # Cria candidato se ainda nao existir nessa sessao
            chave_cand = f'{nr_cand}|{row.get("SG_UF", "")}|{row.get("DS_CARGO", "")}'
            if chave_cand not in candidatos_cache:
                cand = db.query(Candidato).filter_by(
                    nr_candidato=nr_cand,
                    sg_uf=str(row.get('SG_UF', '')).strip() or None,
                    cargo=str(row.get('DS_CARGO', '')).strip() or None,
                ).first()
                if not cand:
                    cand = Candidato(
                        nr_candidato=nr_cand,
                        nm_candidato=nm_cand,
                        nm_partido=str(row.get('NM_PARTIDO', '')).strip() or None,
                        sg_partido=str(row.get('SG_PARTIDO', '')).strip() or None,
                        sg_uf=str(row.get('SG_UF', '')).strip() or None,
                        cargo=str(row.get('DS_CARGO', '')).strip() or None,
                    )
                    db.add(cand)
                    db.flush()
                candidatos_cache[chave_cand] = cand

            cand = candidatos_cache[chave_cand]

            # Insere resultado (ignora se já existe)
            existente = db.query(ResultadoEleitoral).filter_by(
                eleicao_id=eleicao.id,
                candidato_id=cand.id,
                cd_municipio_ibge=cd_ibge,
            ).first()
            if existente:
                continue

            db.add(ResultadoEleitoral(
                eleicao_id=eleicao.id,
                candidato_id=cand.id,
                cd_municipio_ibge=cd_ibge,
                qt_votos_nominais=int(row.get('QT_VOTOS_NOMINAIS', 0)),
                qt_votos_validos=int(row.get('QT_VOTOS_VALIDOS', 0)) or None,
                qt_aptos=int(row.get('QT_APTOS', 0)) or None,
                qt_abstencoes=int(row.get('QT_ABSTENCOES', 0)) or None,
            ))
            inseridos += 1

            if inseridos % 500 == 0:
                db.flush()
                print(f'  {inseridos} resultados inseridos...')

        db.commit()
        print(f'\nConcluido!')
        print(f'  Resultados inseridos : {inseridos}')
        print(f'  Municipios sem IBGE  : {sem_ibge}')
        print(f'  Candidatos criados   : {len(candidatos_cache)}')
        print(f'\nEleicao ID: {eleicao.id}')
        for nm, cand in candidatos_cache.items():
            print(f'Candidato ID: {cand.id}  |  {cand.nm_candidato}  ({cand.nr_candidato})')

    except Exception as e:
        db.rollback()
        print(f'Erro: {e}')
        raise
    finally:
        db.close()


if __name__ == '__main__':
    main()
