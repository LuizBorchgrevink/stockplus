import psycopg2
import psycopg2.extras
from flask import current_app


def get_db():
    """Crea y retorna una conexión a PostgreSQL."""
    conn = psycopg2.connect(
        host=current_app.config["PG_HOST"],
        port=current_app.config["PG_PORT"],
        user=current_app.config["PG_USER"],
        password=current_app.config["PG_PASSWORD"],
        dbname=current_app.config["PG_DB"]
    )
    return conn


def cursor_dict(conn):
    """Retorna un cursor que devuelve filas como diccionarios."""
    return conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
