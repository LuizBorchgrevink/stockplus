from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from models.db import get_db, cursor_dict
import bcrypt
import json

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json()
    nombre     = data.get("nombre")
    correo     = data.get("correo")
    contrasena = data.get("contrasena")

    if not nombre or not correo or not contrasena:
        return jsonify({"error": "Todos los campos son requeridos"}), 400

    hashed = bcrypt.hashpw(contrasena.encode("utf-8"), bcrypt.gensalt())

    conn = get_db()
    cur  = conn.cursor()
    try:
        cur.execute(
            "INSERT INTO usuarios (nombre, correo, contrasena) VALUES (%s, %s, %s)",
            (nombre, correo, hashed.decode("utf-8"))
        )
        conn.commit()
        return jsonify({"mensaje": "Usuario registrado exitosamente"}), 201
    except Exception:
        conn.rollback()
        return jsonify({"error": "El correo ya está registrado"}), 409
    finally:
        cur.close(); conn.close()


@auth_bp.route("/login", methods=["POST"])
def login():
    data       = request.get_json()
    correo     = data.get("correo")
    contrasena = data.get("contrasena")

    conn = get_db()
    cur  = cursor_dict(conn)
    cur.execute("SELECT * FROM usuarios WHERE correo = %s", (correo,))
    usuario = cur.fetchone()
    cur.close(); conn.close()

    if not usuario:
        return jsonify({"error": "Credenciales incorrectas"}), 401

    if not bcrypt.checkpw(contrasena.encode("utf-8"), usuario["contrasena"].encode("utf-8")):
        return jsonify({"error": "Credenciales incorrectas"}), 401

    # Flask-JWT-Extended 4.x requiere identity como STRING
    identity_str = json.dumps({
        "id":     usuario["id_usuario"],
        "nombre": usuario["nombre"],
        "rol":    usuario["rol"]
    })

    token = create_access_token(identity=identity_str)

    return jsonify({
        "token": token,
        "usuario": {
            "id":     usuario["id_usuario"],
            "nombre": usuario["nombre"],
            "correo": usuario["correo"],
            "rol":    usuario["rol"]
        }
    })


@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def me():
    identity = json.loads(get_jwt_identity())
    return jsonify(identity)