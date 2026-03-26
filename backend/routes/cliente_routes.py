from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from models.db import get_db, cursor_dict

clientes_bp = Blueprint("clientes", __name__)


@clientes_bp.route("", methods=["GET"])
@clientes_bp.route("/", methods=["GET"])
@jwt_required()
def get_clientes():
    conn = get_db(); cur = cursor_dict(conn)
    try:
        cur.execute("SELECT * FROM clientes ORDER BY nombre")
        return jsonify([dict(r) for r in cur.fetchall()])
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cur.close(); conn.close()


@clientes_bp.route("", methods=["POST"])
@clientes_bp.route("/", methods=["POST"])
@jwt_required()
def create_cliente():
    d = request.get_json()
    conn = get_db(); cur = conn.cursor()
    try:
        cur.execute(
            "INSERT INTO clientes (nombre, correo, telefono) VALUES (%s, %s, %s) RETURNING id_cliente",
            (d["nombre"].strip(), d.get("correo") or None, d.get("telefono") or None)
        )
        new_id = cur.fetchone()[0]
        conn.commit()
        return jsonify({"mensaje": "Cliente creado", "id": new_id}), 201
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        cur.close(); conn.close()


@clientes_bp.route("/<int:id>", methods=["PUT"])
@jwt_required()
def update_cliente(id):
    d = request.get_json()
    conn = get_db(); cur = conn.cursor()
    try:
        cur.execute(
            "UPDATE clientes SET nombre=%s, correo=%s, telefono=%s WHERE id_cliente=%s",
            (d["nombre"].strip(), d.get("correo") or None, d.get("telefono") or None, id)
        )
        conn.commit()
        return jsonify({"mensaje": "Cliente actualizado"})
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        cur.close(); conn.close()


@clientes_bp.route("/<int:id>", methods=["DELETE"])
@jwt_required()
def delete_cliente(id):
    conn = get_db(); cur = conn.cursor()
    try:
        cur.execute("DELETE FROM clientes WHERE id_cliente = %s", (id,))
        conn.commit()
        return jsonify({"mensaje": "Cliente eliminado"})
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        cur.close(); conn.close()
