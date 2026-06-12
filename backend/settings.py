# Configurações da aplicação lidas do arquivo .env.
# Nunca coloque senhas ou chaves diretamente aqui — use variáveis de ambiente.

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """
    Pydantic lê automaticamente as variáveis do arquivo .env e valida os tipos.
    Copie .env.exemplo para .env e preencha os valores antes de rodar o servidor.
    """
    database_url: str           # Ex: postgresql://user:senha@localhost:5432/pite
    jwt_secret_key: str         # Chave secreta para assinar tokens JWT (mantenha em segredo!)
    jwt_algorithm: str = "HS256"       # Algoritmo de assinatura (padrão: HS256)
    jwt_expiration_minutes: int = 15   # Tempo de validade do token em minutos
    cors_origins: str = "http://localhost:5173"  # Origens permitidas, separadas por vírgula

    class Config:
        env_file = "../.env"    # Caminho relativo ao backend/ para o arquivo .env


settings = Settings()
