from database import SessionLocal
from models.user import User
from security import hash_password

db = SessionLocal()
user = db.query(User).first()
print('Usuário encontrado:', user.email, '| Nome:', user.name)
user.password_hash = hash_password('admin123')
db.commit()
print('Senha redefinida para: admin123')
db.close()
