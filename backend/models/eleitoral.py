import uuid
import enum
from sqlalchemy import Column, String, SmallInteger, Integer, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy import DateTime
from sqlalchemy.orm import relationship
from database import Base


class MunicipioTSE(Base):
    """Tabela de correspondência entre o código do TSE e o código IBGE do município."""
    __tablename__ = "municipio_tse_ibge"

    id           = Column(Integer, primary_key=True, autoincrement=True)
    cd_tse       = Column(String(10), unique=True, nullable=False, index=True)
    cd_ibge      = Column(String(10), unique=True, nullable=False, index=True)
    sg_uf        = Column(String(2),  nullable=False)
    nm_municipio = Column(String(120), nullable=False)


class TipoEleicao(str, enum.Enum):
    municipal = "municipal"
    federal   = "federal"
    estadual  = "estadual"


class Eleicao(Base):
    """Representa uma eleição (ex: Eleições Municipais 2024 - 1º turno)."""
    __tablename__ = "eleicoes"

    id        = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    ano       = Column(SmallInteger, nullable=False)
    turno     = Column(SmallInteger, nullable=False, default=1)
    tipo      = Column(String(20), nullable=False)   # 'municipal' | 'federal' | 'estadual'
    descricao = Column(String(120), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    resultados = relationship("ResultadoEleitoral", back_populates="eleicao")

    __table_args__ = (
        UniqueConstraint("ano", "turno", "tipo", name="uq_eleicao"),
    )


class Candidato(Base):
    """Candidato registrado no TSE."""
    __tablename__ = "candidatos"

    id           = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nr_candidato = Column(String(10),  nullable=False)
    nm_candidato = Column(String(160), nullable=False)
    nm_partido   = Column(String(80),  nullable=True)
    sg_partido   = Column(String(20),  nullable=True)
    sg_uf        = Column(String(2),   nullable=True)
    cargo        = Column(String(60),  nullable=True)
    created_at   = Column(DateTime(timezone=True), server_default=func.now())

    resultados = relationship("ResultadoEleitoral", back_populates="candidato")


class ResultadoEleitoral(Base):
    """Votos de um candidato em um município numa eleição."""
    __tablename__ = "resultados_eleitorais"

    id                = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    eleicao_id        = Column(UUID(as_uuid=True), ForeignKey("eleicoes.id", ondelete="CASCADE"), nullable=False)
    candidato_id      = Column(UUID(as_uuid=True), ForeignKey("candidatos.id", ondelete="CASCADE"), nullable=False)
    cd_municipio_ibge = Column(String(10), nullable=False, index=True)  # código IBGE 7 dígitos
    qt_votos_nominais = Column(Integer, nullable=False, default=0)
    qt_votos_validos  = Column(Integer, nullable=True)
    qt_aptos          = Column(Integer, nullable=True)
    qt_abstencoes     = Column(Integer, nullable=True)
    created_at        = Column(DateTime(timezone=True), server_default=func.now())

    eleicao   = relationship("Eleicao",   back_populates="resultados")
    candidato = relationship("Candidato", back_populates="resultados")

    __table_args__ = (
        UniqueConstraint("eleicao_id", "candidato_id", "cd_municipio_ibge",
                         name="uq_resultado_por_municipio"),
    )
