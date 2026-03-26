from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from dotenv import load_dotenv
import os

load_dotenv()

app = Flask(__name__)

# Allow requests from localhost on any port AND from file:// (for opening HTML directly)
CORS(app, origins=["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5500",
                    "http://localhost:5500", "null"],
     supports_credentials=False)

app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY", "stockplus-secret-key-2024-segura")
app.config["PG_HOST"]     = os.getenv("PG_HOST", "localhost")
app.config["PG_PORT"]     = os.getenv("PG_PORT", "5432")
app.config["PG_USER"]     = os.getenv("PG_USER", "postgres")
app.config["PG_PASSWORD"] = os.getenv("PG_PASSWORD", "")
app.config["PG_DB"]       = os.getenv("PG_DB", "stockplus")

jwt = JWTManager(app)

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
        cur.execute("SELECT COUNT(*) FROM usuarios")
        users = cur.fetchone()[0]
        cur.close(); conn.close()
        return jsonify({"db": "conectada ✓", "productos": prods, "usuarios": users})
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
