from uuid import UUID
from datetime import datetime
from pydantic import BaseModel


# ── Partidos ──────────────────────────────────────────────────────
class PartidoCreate(BaseModel):
    sigla: str
    nome: str | None = None
    numero: int | None = None


class PartidoOut(BaseModel):
    id: UUID
    sigla: str
    nome: str | None
    numero: int | None

    model_config = {"from_attributes": True}


# ── Candidatos ────────────────────────────────────────────────────
class CandidatoCreate(BaseModel):
    nr_candidato: str | None = None
    nm_candidato: str
    nm_partido: str | None = None
    sg_partido: str | None = None
    sg_uf: str | None = None
    cargo: str | None = None


class CandidatoOut(BaseModel):
    id: UUID
    nr_candidato: str | None
    nm_candidato: str
    nm_partido: str | None
    sg_partido: str | None
    sg_uf: str | None
    cargo: str | None

    model_config = {"from_attributes": True}


# ── Candidaturas ─────────────────────────────────────────────────
class CandidaturaCreate(BaseModel):
    candidato_id: UUID
    eleicao_id: UUID
    partido_id: UUID | None = None
    sq_candidato_tse: int | None = None
    nr_votavel: str | None = None
    nm_votavel: str | None = None
    ds_cargo: str | None = None
    situacao: str | None = None


class CandidaturaEleicaoOut(BaseModel):
    id: UUID
    ano: int
    turno: int
    tipo: str
    descricao: str | None

    model_config = {"from_attributes": True}


class CandidaturaOut(BaseModel):
    id: UUID
    candidato_id: UUID
    eleicao_id: UUID
    partido_id: UUID | None
    sq_candidato_tse: int | None
    nr_votavel: str | None
    nm_votavel: str | None
    ds_cargo: str | None
    situacao: str | None
    eleicao: CandidaturaEleicaoOut | None = None
    partido: PartidoOut | None = None

    model_config = {"from_attributes": True}


# ── Resultados por município ───────────────────────────────────────
class ResultadoMunicipioOut(BaseModel):
    cd_municipio_ibge: str
    qt_votos_nominais: int
    qt_votos_validos: int | None
    qt_aptos: int | None
    qt_abstencoes: int | None
    pct_votos: float | None          # votos_nominais / votos_validos * 100

    model_config = {"from_attributes": True}


class ResultadoHistoricoItem(BaseModel):
    eleicao_id: UUID
    ano: int
    turno: int
    tipo: str
    descricao: str | None
    qt_votos_nominais: int
    qt_votos_validos: int | None
    pct_votos: float | None


# ── Dados para o mapa ─────────────────────────────────────────────
class ResultadoMapaItem(BaseModel):
    cd_municipio_ibge: str
    qt_votos_nominais: int
    pct_votos: float | None          # para colorir o mapa proporcionalmente


# ── Votação por seção ─────────────────────────────────────────────
class VotacaoSecaoItem(BaseModel):
    cd_municipio_tse: str
    nr_zona: int
    nr_secao: int
    nr_local_votacao: int | None
    nm_local_votacao: str | None
    ds_endereco: str | None
    nr_votavel: str
    nm_votavel: str
    ds_cargo: str | None
    qt_votos: int

    model_config = {"from_attributes": True}


class VotacaoZonaAgregada(BaseModel):
    cd_municipio_tse: str
    nr_zona: int
    nr_votavel: str
    nm_votavel: str
    ds_cargo: str | None
    total_votos: int


class VotacaoMunicipioAgregada(BaseModel):
    cd_municipio_tse: str
    cd_municipio_ibge: str | None = None
    total_votos: int
    pct_votos: float | None


class VotavelOut(BaseModel):
    sq_candidato: str | None = None
    nr_votavel: str
    nm_votavel: str
    ds_cargo: str | None


# ── Ranking por município ─────────────────────────────────────────
class RankingCandidatoItem(BaseModel):
    nr_votavel: str
    nm_votavel: str
    ds_cargo: str | None
    total_votos: int
    pct_votos: float | None  # % em relação ao total do cargo no município


class RankingPorCargoOut(BaseModel):
    ds_cargo: str
    total_votos_cargo: int
    candidatos: list[RankingCandidatoItem]
