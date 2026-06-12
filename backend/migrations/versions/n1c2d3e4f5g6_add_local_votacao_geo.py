"""add local_votacao_geo table

Revision ID: n1c2d3e4f5g6
Revises: m0b1c2d3e4f5
Create Date: 2026-06-12
"""
from alembic import op

revision = 'n1c2d3e4f5g6'
down_revision = 'm0b1c2d3e4f5'
branch_labels = None
depends_on = None


def upgrade():
    op.execute("""
        CREATE TABLE local_votacao_geo (
            sg_uf            VARCHAR(2)   NOT NULL,
            cd_municipio_tse VARCHAR(10)  NOT NULL,
            nr_local_votacao INT          NOT NULL,
            nm_local_votacao VARCHAR(200),
            ds_endereco      VARCHAR(500),
            lat              DOUBLE PRECISION,
            lon              DOUBLE PRECISION,
            geom             GEOMETRY(POINT, 4326),
            status           VARCHAR(10)  NOT NULL DEFAULT 'pendente',
            geocodificado_em TIMESTAMPTZ,
            PRIMARY KEY (sg_uf, cd_municipio_tse, nr_local_votacao)
        )
    """)
    op.execute("CREATE INDEX ix_local_votacao_geo_mun  ON local_votacao_geo (sg_uf, cd_municipio_tse)")
    op.execute("CREATE INDEX ix_local_votacao_geo_geom ON local_votacao_geo USING GIST (geom)")
    op.execute("CREATE INDEX ix_local_votacao_geo_status ON local_votacao_geo (status)")


def downgrade():
    op.execute("DROP TABLE IF EXISTS local_votacao_geo")
