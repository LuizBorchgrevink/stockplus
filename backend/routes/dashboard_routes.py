from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required
from models.db import get_db, cursor_dict

dashboard_bp = Blueprint("dashboard", __name__)


@dashboard_bp.route("/stats", methods=["GET"])
@jwt_required()
def get_stats():
    conn = get_db(); cur = cursor_dict(conn)
    try:
        cur.execute("SELECT COUNT(*) AS total FROM productos")
        total_productos = cur.fetchone()["total"]

        cur.execute("SELECT COALESCE(SUM(precio * cantidad_stock), 0) AS valor FROM productos")
        valor_inventario = float(cur.fetchone()["valor"])

        cur.execute("SELECT COUNT(*) AS total FROM productos WHERE cantidad_stock <= stock_minimo")
        alertas = cur.fetchone()["total"]

        cur.execute("""
            SELECT COUNT(*) AS total, COALESCE(SUM(total), 0) AS monto
            FROM ventas WHERE fecha >= NOW() - INTERVAL '7 days'
        """)
        row = cur.fetchone()
        ventas_semana = {"cantidad": int(row["total"]), "monto": float(row["monto"])}

        cur.execute("""
            SELECT id_producto, nombre, cantidad_stock, stock_minimo, precio
            FROM productos WHERE cantidad_stock <= stock_minimo
            ORDER BY cantidad_stock ASC LIMIT 10
        """)
        productos_stock_bajo = [dict(r) for r in cur.fetchall()]

        cur.execute("""
            SELECT DATE(fecha) AS dia, COUNT(*) AS cantidad, SUM(total) AS monto
            FROM ventas WHERE fecha >= NOW() - INTERVAL '7 days'
            GROUP BY DATE(fecha) ORDER BY dia
        """)
        ventas_grafica = [
            {"dia": r["dia"].isoformat(), "cantidad": int(r["cantidad"]), "monto": float(r["monto"])}
            for r in cur.fetchall()
        ]

        return jsonify({
            "total_productos":      total_productos,
            "valor_inventario":     valor_inventario,
            "alertas_stock":        alertas,
            "ventas_semana":        ventas_semana,
            "productos_stock_bajo": productos_stock_bajo,
            "ventas_grafica":       ventas_grafica
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cur.close(); conn.close()
