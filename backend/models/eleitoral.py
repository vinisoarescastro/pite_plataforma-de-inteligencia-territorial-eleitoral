import uuid
import enum
from sqlalchemy import Column, String, SmallInteger, Integer, BigInteger, ForeignKey, UniqueConstraint
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
    nr_candidato = Column(String(10),  nullable=True)
    nm_candidato = Column(String(160), nullable=False)
    nm_partido   = Column(String(80),  nullable=True)
    sg_partido   = Column(String(20),  nullable=True)
    sg_uf        = Column(String(2),   nullable=True)
    cargo        = Column(String(60),  nullable=True)
    created_at   = Column(DateTime(timezone=True), server_default=func.now())

    resultados   = relationship("ResultadoEleitoral", back_populates="candidato")
    candidaturas = relationship("Candidatura", back_populates="candidato", cascade="all, delete-orphan")


class Partido(Base):
    """Partido político."""
    __tablename__ = "partidos"

    id         = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    sigla      = Column(String(20),  nullable=False, unique=True)
    nome       = Column(String(120), nullable=True)
    numero     = Column(Integer,     nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    candidaturas = relationship("Candidatura", back_populates="partido")


class Candidatura(Base):
    """Liga um candidato cadastrado à sua participação em uma eleição específica."""
    __tablename__ = "candidaturas"

    id                = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    candidato_id      = Column(UUID(as_uuid=True), ForeignKey("candidatos.id", ondelete="CASCADE"), nullable=False, index=True)
    eleicao_id        = Column(UUID(as_uuid=True), ForeignKey("eleicoes.id",   ondelete="CASCADE"), nullable=False, index=True)
    partido_id        = Column(UUID(as_uuid=True), ForeignKey("partidos.id",   ondelete="SET NULL"), nullable=True, index=True)
    sq_candidato_tse  = Column(BigInteger,   nullable=True)
    nr_votavel        = Column(String(10),   nullable=True)
    nm_votavel        = Column(String(160),  nullable=True)
    ds_cargo          = Column(String(60),   nullable=True)
    situacao          = Column(String(30),   nullable=True)
    created_at        = Column(DateTime(timezone=True), server_default=func.now())

    candidato = relationship("Candidato", back_populates="candidaturas")
    eleicao   = relationship("Eleicao")
    partido   = relationship("Partido",   back_populates="candidaturas")

    __table_args__ = (
        UniqueConstraint("candidato_id", "eleicao_id", name="uq_candidatura_candidato_eleicao"),
    )


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


class VotacaoSecao(Base):
    """Votos por seção eleitoral — granularidade máxima do TSE."""
    __tablename__ = "votacao_secao"

    id               = Column(BigInteger, primary_key=True, autoincrement=True)
    eleicao_id       = Column(UUID(as_uuid=True), ForeignKey("eleicoes.id", ondelete="CASCADE"), nullable=False)
    cd_municipio_tse = Column(String(10),    nullable=False, index=True)
    nr_turno         = Column(SmallInteger,  nullable=False, default=1)
    nr_zona          = Column(SmallInteger,  nullable=False)
    nr_secao         = Column(SmallInteger,  nullable=False)
    nr_local_votacao = Column(Integer,       nullable=True)
    nm_local_votacao = Column(String(200),   nullable=True)
    ds_endereco      = Column(String(300),   nullable=True)
    nr_votavel       = Column(String(10),    nullable=False)
    nm_votavel       = Column(String(160),   nullable=False)
    cd_cargo         = Column(SmallInteger,  nullable=True)
    ds_cargo         = Column(String(60),    nullable=True)
    sq_candidato     = Column(String(20),    nullable=True)
    qt_votos         = Column(Integer,       nullable=False, default=0)

    eleicao = relationship("Eleicao")

    __table_args__ = (
        UniqueConstraint(
            "eleicao_id", "cd_municipio_tse", "nr_zona", "nr_secao", "nr_votavel", "cd_cargo", "nr_turno",
            name="uq_votacao_secao"
        ),
    )
