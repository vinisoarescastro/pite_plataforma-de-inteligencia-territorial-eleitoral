import uuid
from pydantic import BaseModel


class BairroCreate(BaseModel):
    nm_bairro: str
    sg_uf: str
    cd_municipio_ibge: str | None = None
    nm_municipio: str | None = None


class BairroOut(BaseModel):
    id: uuid.UUID
    nm_bairro: str
    sg_uf: str
    cd_municipio_ibge: str | None
    nm_municipio: str | None
    total_locais: int = 0

    class Config:
        from_attributes = True


class MunicipioOut(BaseModel):
    cd_tse: str
    cd_ibge: str
    nm_municipio: str


class LocalVotacaoOut(BaseModel):
    sg_uf: str
    cd_municipio_tse: str
    nr_local_votacao: int
    nm_local_votacao: str | None
    ds_endereco: str | None
    total_secoes: int


class VincularLocalRequest(BaseModel):
    sg_uf: str
    cd_municipio_tse: str
    nr_local_votacao: int
    nm_local_votacao: str | None = None
    ds_endereco: str | None = None
