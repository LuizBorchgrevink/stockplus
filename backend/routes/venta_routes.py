from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.db import get_db, cursor_dict
import json

ventas_bp = Blueprint("ventas", __name__)


@ventas_bp.route("", methods=["GET"])
@ventas_bp.route("/", methods=["GET"])
@jwt_required()
def get_ventas():
    conn = get_db(); cur = cursor_dict(conn)
    try:
        cur.execute("""
            SELECT v.*, c.nombre AS cliente_nombre, u.nombre AS vendedor_nombre
            FROM ventas v
            LEFT JOIN clientes c ON v.id_cliente = c.id_cliente
            LEFT JOIN usuarios u ON v.id_usuario = u.id_usuario
            ORDER BY v.fecha DESC LIMIT 50
        """)
        result = []
        for r in cur.fetchall():
            row = dict(r)
            if row.get("fecha"):
                row["fecha"] = row["fecha"].isoformat()
            result.append(row)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cur.close(); conn.close()


@ventas_bp.route("/<int:id>", methods=["GET"])
@jwt_required()
def get_venta(id):
    conn = get_db(); cur = cursor_dict(conn)
    try:
        cur.execute("""
            SELECT v.*, c.nombre AS cliente_nombre
            FROM ventas v LEFT JOIN clientes c ON v.id_cliente = c.id_cliente
            WHERE v.id_venta = %s
        """, (id,))
        venta = cur.fetchone()
        if not venta:
            return jsonify({"error": "Venta no encontrada"}), 404
        venta = dict(venta)
        if venta.get("fecha"):
            venta["fecha"] = venta["fecha"].isoformat()
        cur.execute("""
            SELECT dv.*, p.nombre AS producto_nombre
            FROM detalle_venta dv JOIN productos p ON dv.id_producto = p.id_producto
            WHERE dv.id_venta = %s
        """, (id,))
        venta["detalles"] = [dict(r) for r in cur.fetchall()]
        return jsonify(venta)
    finally:
        cur.close(); conn.close()


@ventas_bp.route("", methods=["POST"])
@ventas_bp.route("/", methods=["POST"])
@jwt_required()
def create_venta():
    data       = request.get_json()
    identity   = json.loads(get_jwt_identity())   # ← fix: parsear string a dict
    id_cliente = data.get("id_cliente") or None
    if id_cliente:
        id_cliente = int(id_cliente)
    productos  = data.get("productos", [])

    if not productos:
        return jsonify({"error": "La venta debe tener al menos un producto"}), 400

    conn = get_db()
    cur  = cursor_dict(conn)
    try:
        for item in productos:
            cur.execute(
                "SELECT nombre, cantidad_stock FROM productos WHERE id_producto = %s",
                (int(item["id_producto"]),)
            )
            prod = cur.fetchone()
            if not prod:
                raise Exception(f"Producto ID {item['id_producto']} no existe")
            if prod["cantidad_stock"] < int(item["cantidad"]):
                raise Exception(
                    f"Stock insuficiente para '{prod['nombre']}'. "
                    f"Disponible: {prod['cantidad_stock']}"
                )

        total = sum(float(it["cantidad"]) * float(it["precio_unitario"]) for it in productos)

        cur2 = conn.cursor()
        cur2.execute(
            "INSERT INTO ventas (id_cliente, total, id_usuario) VALUES (%s, %s, %s) RETURNING id_venta",
            (id_cliente, total, identity["id"])   # ← ahora funciona porque identity es dict
        )
        id_venta = cur2.fetchone()[0]

        for item in productos:
            cur2.execute(
                """INSERT INTO detalle_venta (id_venta, id_producto, cantidad, precio_unitario)
                   VALUES (%s, %s, %s, %s)""",
                (id_venta, int(item["id_producto"]), int(item["cantidad"]), float(item["precio_unitario"]))
            )
            cur2.execute(
                "UPDATE productos SET cantidad_stock = cantidad_stock - %s WHERE id_producto = %s",
                (int(item["cantidad"]), int(item["id_producto"]))
            )

        conn.commit()
        return jsonify({"mensaje": "Venta registrada", "id_venta": id_venta, "total": total}), 201

    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 400
    finally:
        cur.close(); conn.close()