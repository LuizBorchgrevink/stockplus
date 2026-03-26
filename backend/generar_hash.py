"""
Ejecuta este script UNA VEZ para actualizar las contraseñas en la BD.
Uso: python generar_hash.py
"""
import bcrypt
import psycopg2
from dotenv import load_dotenv
import os

load_dotenv()

# Generar hash
nueva_contrasena = "password123"
hashed = bcrypt.hashpw(nueva_contrasena.encode("utf-8"), bcrypt.gensalt(12))
hash_str = hashed.decode("utf-8")

print(f"Hash generado: {hash_str}")
print(f"Verificacion: {bcrypt.checkpw(nueva_contrasena.encode(), hashed)}")

# Actualizar en la BD
conn = psycopg2.connect(
    host=os.getenv("PG_HOST", "localhost"),
    port=os.getenv("PG_PORT", "5432"),
    user=os.getenv("PG_USER", "postgres"),
    password=os.getenv("PG_PASSWORD", ""),
    dbname=os.getenv("PG_DB", "stockplus")
)
cur = conn.cursor()
cur.execute("UPDATE usuarios SET contrasena = %s", (hash_str,))
conn.commit()
print(f"\n✅ Contraseña actualizada para {cur.rowcount} usuario(s)")
print("   Email:      admin@stockplus.com")
print("   Contraseña: password123")
cur.close()
conn.close()
