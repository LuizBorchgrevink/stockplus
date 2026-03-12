from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from dotenv import load_dotenv
import os

load_dotenv()

app = Flask(__name__)

CORS(app, resources={r"/api/*": {"origins": "*"}})

app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY", "stockplus-secret-2024")
app.config["PG_HOST"]     = os.getenv("PG_HOST", "localhost")
app.config["PG_PORT"]     = os.getenv("PG_PORT", "5432")
app.config["PG_USER"]     = os.getenv("PG_USER", "postgres")
app.config["PG_PASSWORD"] = os.getenv("PG_PASSWORD", "")
app.config["PG_DB"]       = os.getenv("PG_DB", "stockplus")

jwt = JWTManager(app)

# ── Mostrar error exacto del JWT en la respuesta ──────────────
@jwt.invalid_token_loader
def invalid_token_callback(error_string):
    return jsonify({"error": f"Token inválido: {error_string}"}), 422

@jwt.unauthorized_loader
def missing_token_callback(error_string):
    return jsonify({"error": f"Token faltante: {error_string}"}), 401

@jwt.expired_token_loader
def expired_token_callback(jwt_header, jwt_payload):
    return jsonify({"error": "Token expirado. Inicia sesión de nuevo."}), 401

# ─────────────────────────────────────────────────────────────
@app.route("/")
def health():
    return jsonify({"status": "ok", "mensaje": "StockPlus API ✓"}), 200

@app.route("/api/ping")
def ping():
    try:
        from models.db import get_db
        conn = get_db()
        cur = conn.cursor()
        cur.execute("SELECT COUNT(*) FROM productos")
        prods = cur.fetchone()[0]
        cur.close(); conn.close()
        return jsonify({"db": "conectada ✓", "productos": prods})
    except Exception as e:
        return jsonify({"db": "ERROR", "detalle": str(e)}), 500

from routes.auth_routes      import auth_bp
from routes.producto_routes  import productos_bp
from routes.cliente_routes   import clientes_bp
from routes.proveedor_routes import proveedores_bp
from routes.venta_routes     import ventas_bp
from routes.dashboard_routes import dashboard_bp

app.register_blueprint(auth_bp,        url_prefix="/api/auth")
app.register_blueprint(productos_bp,   url_prefix="/api/productos")
app.register_blueprint(clientes_bp,    url_prefix="/api/clientes")
app.register_blueprint(proveedores_bp, url_prefix="/api/proveedores")
app.register_blueprint(ventas_bp,      url_prefix="/api/ventas")
app.register_blueprint(dashboard_bp,   url_prefix="/api/dashboard")

if __name__ == "__main__":
    app.run(debug=True, port=5000)