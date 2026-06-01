import sys
import os
from logging.config import fileConfig

from sqlalchemy import pool
from alembic import context

# Adiciona o diretório backend ao path para importar os módulos
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from database import engine, Base
from models import user  # importe cada novo model aqui conforme for criando

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata

# Tabelas do PostGIS que o Alembic deve ignorar sempre
POSTGIS_TABLES = {"spatial_ref_sys", "geometry_columns", "geography_columns", "raster_columns", "raster_overviews"}

def include_object(object, name, type_, reflected, compare_to):
    if type_ == "table" and name in POSTGIS_TABLES:
        return False
    return True


def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        include_object=include_object,
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    with engine.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            include_object=include_object,
        )
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
