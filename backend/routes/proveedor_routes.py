from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from models.db import get_db, cursor_dict

proveedores_bp = Blueprint("proveedores", __name__)


@proveedores_bp.route("", methods=["GET"])
@proveedores_bp.route("/", methods=["GET"])
@jwt_required()
def get_proveedores():
    conn = get_db(); cur = cursor_dict(conn)
    try:
        cur.execute("SELECT * FROM proveedores ORDER BY nombre")
        return jsonify([dict(r) for r in cur.fetchall()])
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cur.close(); conn.close()


@proveedores_bp.route("", methods=["POST"])
@proveedores_bp.route("/", methods=["POST"])
@jwt_required()
def create_proveedor():
    d = request.get_json()
    conn = get_db(); cur = conn.cursor()
    try:
        cur.execute(
            "INSERT INTO proveedores (nombre, contacto, telefono, direccion) VALUES (%s, %s, %s, %s) RETURNING id_proveedor",
            (d["nombre"].strip(), d.get("contacto") or None, d.get("telefono") or None, d.get("direccion") or None)
        )
        new_id = cur.fetchone()[0]
        conn.commit()
        return jsonify({"mensaje": "Proveedor creado", "id": new_id}), 201
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        cur.close(); conn.close()


@proveedores_bp.route("/<int:id>", methods=["PUT"])
@jwt_required()
def update_proveedor(id):
    d = request.get_json()
    conn = get_db(); cur = conn.cursor()
    try:
        cur.execute(
            "UPDATE proveedores SET nombre=%s, contacto=%s, telefono=%s, direccion=%s WHERE id_proveedor=%s",
            (d["nombre"].strip(), d.get("contacto") or None, d.get("telefono") or None, d.get("direccion") or None, id)
        )
        conn.commit()
        return jsonify({"mensaje": "Proveedor actualizado"})
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        cur.close(); conn.close()


@proveedores_bp.route("/<int:id>", methods=["DELETE"])
@jwt_required()
def delete_proveedor(id):
    conn = get_db(); cur = conn.cursor()
    try:
        cur.execute("DELETE FROM proveedores WHERE id_proveedor = %s", (id,))
        conn.commit()
        return jsonify({"mensaje": "Proveedor eliminado"})
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        cur.close(); conn.close()
