"""
Importa a tabela de correspondência TSE ↔ IBGE para o banco de dados.

Uso:
    python scripts/importar_municipios_tse.py

O arquivo municipio_tse_ibge.csv deve estar na raiz do repositório.
Executa apenas uma vez. Se já houver dados, não duplica.
"""
import sys
import csv
from pathlib import Path

# Adiciona o backend ao path para importar os modelos
sys.path.insert(0, str(Path(__file__).parent.parent / 'backend'))

from database import SessionLocal
from models.eleitoral import MunicipioTSE

CSV_PATH = Path(__file__).parent.parent / 'municipio_tse_ibge.csv'


def main():
    if not CSV_PATH.exists():
        print(f'Arquivo nao encontrado: {CSV_PATH}')
        sys.exit(1)

    db = SessionLocal()
    try:
        existentes = db.query(MunicipioTSE).count()
        if existentes > 0:
            print(f'Tabela ja tem {existentes} registros. Nada a importar.')
            return

        inseridos = 0
        with open(CSV_PATH, encoding='latin1', newline='') as f:
            reader = csv.DictReader(f, delimiter=';')
            for row in reader:
                cd_tse  = row['CD_MUNICIPIO_TSE'].strip().strip('"')
                cd_ibge = str(row['CD_MUNICIPIO_IBGE']).strip().strip('"')
                sg_uf   = row['SG_UF'].strip().strip('"')
                nome    = row['NM_MUNICIPIO_IBGE'].strip().strip('"')

                db.add(MunicipioTSE(
                    cd_tse=cd_tse,
                    cd_ibge=cd_ibge,
                    sg_uf=sg_uf,
                    nm_municipio=nome,
                ))
                inseridos += 1

        db.commit()
        print(f'Importados {inseridos} municipios.')
    except Exception as e:
        db.rollback()
        print(f'Erro: {e}')
        raise
    finally:
        db.close()


if __name__ == '__main__':
    main()
