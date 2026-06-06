from uuid import UUID
from datetime import datetime
from pydantic import BaseModel


# ── Candidatos ────────────────────────────────────────────────────
class CandidatoCreate(BaseModel):
    nr_candidato: str
    nm_candidato: str
    nm_partido: str | None = None
    sg_partido: str | None = None
    sg_uf: str | None = None
    cargo: str | None = None


class CandidatoOut(BaseModel):
    id: UUID
    nr_candidato: str
    nm_candidato: str
    nm_partido: str | None
    sg_partido: str | None
    sg_uf: str | None
    cargo: str | None

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
    nr_votavel: str
    nm_votavel: str
    ds_cargo: str | None
    sg_partido: str | None
