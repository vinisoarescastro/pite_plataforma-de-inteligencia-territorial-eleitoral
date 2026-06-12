"""
Script para criar o primeiro usuário administrador.
Execute uma única vez após rodar as migrations:

  docker compose exec backend python create_admin.py
"""
import sys
from database import SessionLocal
from models.user import User, UserProfile
from security import hash_password

NAME     = "Vinicius Soares Castro"
EMAIL    = "vinisoarescastro@gmail.com"
PASSWORD = "admin123"   # troque após o primeiro login

db = SessionLocal()

if db.query(User).filter_by(email=EMAIL).first():
    print(f"Usuário {EMAIL} já existe.")
    db.close()
    sys.exit(0)

user = User(
    name=NAME,
    email=EMAIL,
    password_hash=hash_password(PASSWORD),
    profile=UserProfile.administrador,
    is_active=True,
    can_export=True,
    can_compare=True,
)
db.add(user)
db.commit()
db.close()

print(f"Admin criado: {EMAIL} / {PASSWORD}")
print("IMPORTANTE: troque a senha após o primeiro login.")
