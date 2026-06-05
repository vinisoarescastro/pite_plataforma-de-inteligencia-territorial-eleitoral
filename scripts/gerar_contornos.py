"""
Gera arquivos GeoJSON com os contornos dissolvidos por Brasil, Região e Estado.
Resultado: frontend/public/geo/brasil_outline.json
           frontend/public/geo/regioes_outline.json
           frontend/public/geo/estados_outline.json

Uso: python scripts/gerar_contornos.py
"""
import json
import sys
from pathlib import Path
from shapely.ops import unary_union
from shapely.geometry import shape, mapping

REGIOES = {
    'Norte':        ['AC','AM','AP','PA','RO','RR','TO'],
    'Nordeste':     ['AL','BA','CE','MA','PB','PE','PI','RN','SE'],
    'Centro-Oeste': ['DF','GO','MS','MT'],
    'Sudeste':      ['ES','MG','RJ','SP'],
    'Sul':          ['PR','RS','SC'],
}

GEO_DIR = Path('frontend/public/geo')
SRC     = GEO_DIR / 'municipios_br.json'


def feature(geometry, props=None):
    return {'type': 'Feature', 'geometry': mapping(geometry), 'properties': props or {}}


def featurecollection(features):
    return {'type': 'FeatureCollection', 'features': features}


def salvar(path, data):
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, separators=(',', ':'))
    size_kb = path.stat().st_size / 1024
    print(f'  OK {path.name}  ({size_kb:.0f} KB)')


def main():
    print(f'Lendo {SRC}...')
    with open(SRC, encoding='utf-8') as f:
        data = json.load(f)

    features_src = data['features']
    print(f'  {len(features_src)} municípios carregados')

    # Indexa shapes por UF
    uf_shapes: dict[str, list] = {}
    skipped = 0
    for feat in features_src:
        if not feat.get('geometry'):
            skipped += 1
            continue
        uf = feat['properties'].get('SIGLA_UF', '')
        geom = shape(feat['geometry'])
        if not geom.is_valid:
            geom = geom.buffer(0)
        uf_shapes.setdefault(uf, []).append(geom)
    if skipped:
        print(f'  {skipped} features sem geometria ignoradas')

    # ── Brasil ────────────────────────────────────────────────────
    print('\nDissolvendo Brasil...')
    all_shapes = [s for shapes in uf_shapes.values() for s in shapes]
    brasil_geom = unary_union(all_shapes)
    salvar(GEO_DIR / 'brasil_outline.json',
           featurecollection([feature(brasil_geom, {'nome': 'Brasil'})]))

    # ── Estados ──────────────────────────────────────────────────
    print('Dissolvendo estados...')
    estado_features = []
    for uf, shapes in sorted(uf_shapes.items()):
        regiao = next((r for r, ufs in REGIOES.items() if uf in ufs), '')
        geom   = unary_union(shapes)
        estado_features.append(feature(geom, {'uf': uf, 'regiao': regiao}))
    salvar(GEO_DIR / 'estados_outline.json', featurecollection(estado_features))

    # ── Regiões ───────────────────────────────────────────────────
    print('Dissolvendo regiões...')
    regiao_features = []
    for nome, ufs in REGIOES.items():
        shapes = [s for uf in ufs for s in uf_shapes.get(uf, [])]
        if not shapes:
            continue
        geom = unary_union(shapes)
        regiao_features.append(feature(geom, {'regiao': nome}))
    salvar(GEO_DIR / 'regioes_outline.json', featurecollection(regiao_features))

    print('\nPronto!')


if __name__ == '__main__':
    main()
