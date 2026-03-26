from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from models.db import get_db, cursor_dict

productos_bp = Blueprint("productos", __name__)


@productos_bp.route("", methods=["GET"])
@productos_bp.route("/", methods=["GET"])
@jwt_required()
def get_productos():
    conn = get_db()
    cur  = cursor_dict(conn)
    try:
        cur.execute("""
            SELECT p.*, pr.nombre AS proveedor_nombre
            FROM productos p
            LEFT JOIN proveedores pr ON p.id_proveedor = pr.id_proveedor
            ORDER BY p.nombre
        """)
        rows = cur.fetchall()
        return jsonify([dict(r) for r in rows])
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cur.close(); conn.close()


@productos_bp.route("/<int:id>", methods=["GET"])
@jwt_required()
def get_producto(id):
    conn = get_db()
    cur  = cursor_dict(conn)
    try:
        cur.execute("SELECT * FROM productos WHERE id_producto = %s", (id,))
        row = cur.fetchone()
        if not row:
            return jsonify({"error": "Producto no encontrado"}), 404
        return jsonify(dict(row))
    finally:
        cur.close(); conn.close()


@productos_bp.route("", methods=["POST"])
@productos_bp.route("/", methods=["POST"])
@jwt_required()
def create_producto():
    d = request.get_json()
    if not d:
        return jsonify({"error": "No se recibieron datos"}), 400

    nombre         = d.get("nombre", "").strip()
    descripcion    = d.get("descripcion", "")
    precio         = float(d.get("precio", 0))
    cantidad_stock = int(d.get("cantidad_stock", 0))
    stock_minimo   = int(d.get("stock_minimo", 5))
    id_proveedor   = d.get("id_proveedor") or None
    if id_proveedor:
        id_proveedor = int(id_proveedor)

    if not nombre:
        return jsonify({"error": "El nombre es requerido"}), 400
    if precio <= 0:
        return jsonify({"error": "El precio debe ser mayor a cero"}), 400

    conn = get_db()
    cur  = conn.cursor()
    try:
        cur.execute(
            """INSERT INTO productos
               (nombre, descripcion, precio, cantidad_stock, stock_minimo, id_proveedor)
               VALUES (%s, %s, %s, %s, %s, %s) RETURNING id_producto""",
            (nombre, descripcion, precio, cantidad_stock, stock_minimo, id_proveedor)
        )
        new_id = cur.fetchone()[0]
        conn.commit()
        return jsonify({"mensaje": "Producto creado", "id": new_id}), 201
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        cur.close(); conn.close()


@productos_bp.route("/<int:id>", methods=["PUT"])
@jwt_required()
def update_producto(id):
    d = request.get_json()
    if not d:
        return jsonify({"error": "No se recibieron datos"}), 400

    nombre         = d.get("nombre", "").strip()
    descripcion    = d.get("descripcion", "")
    precio         = float(d.get("precio", 0))
    cantidad_stock = int(d.get("cantidad_stock", 0))
    stock_minimo   = int(d.get("stock_minimo", 5))
    id_proveedor   = d.get("id_proveedor") or None
    if id_proveedor:
        id_proveedor = int(id_proveedor)

    conn = get_db()
    cur  = conn.cursor()
    try:
        cur.execute(
            """UPDATE productos
               SET nombre=%s, descripcion=%s, precio=%s,
                   cantidad_stock=%s, stock_minimo=%s, id_proveedor=%s
               WHERE id_producto=%s""",
            (nombre, descripcion, precio, cantidad_stock, stock_minimo, id_proveedor, id)
        )
        conn.commit()
        return jsonify({"mensaje": "Producto actualizado"})
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        cur.close(); conn.close()


@productos_bp.route("/<int:id>", methods=["DELETE"])
@jwt_required()
def delete_producto(id):
    conn = get_db()
    cur  = conn.cursor()
    try:
        cur.execute("DELETE FROM productos WHERE id_producto = %s", (id,))
        conn.commit()
        return jsonify({"mensaje": "Producto eliminado"})
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        cur.close(); conn.close()


@productos_bp.route("/stock-bajo", methods=["GET"])
@jwt_required()
def stock_bajo():
    conn = get_db()
    cur  = cursor_dict(conn)
    try:
        cur.execute("""
            SELECT * FROM productos
            WHERE cantidad_stock <= stock_minimo
            ORDER BY cantidad_stock ASC
        """)
        return jsonify([dict(r) for r in cur.fetchall()])
    finally:
        cur.close(); conn.close()
