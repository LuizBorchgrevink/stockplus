import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { api } from '../services/api'
import logo from '../assets/logo.png'
import './Auth.css'

export default function Register() {
  const [form, setForm] = useState({ nombre: '', correo: '', contrasena: '' })
  const [terminos, setTerminos] = useState(false)
  const [error, setError] = useState('')
  const [exito, setExito] = useState('')
  const [cargando, setCargando] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!terminos) {
      setError('Debes aceptar las condiciones de uso')
      return
    }

    setError('')
    setCargando(true)
    try {
      await api.register({
        nombre: form.nombre.trim(),
        correo: form.correo.trim(),
        contrasena: form.contrasena
      })
      setExito('Cuenta creada. Redirigiendo al inicio de sesión...')
      setTimeout(() => navigate('/login'), 1500)
    } catch (err) {
      setError(err.message || 'No se pudo crear la cuenta.')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-left-bg">
          <div className="al-orb al-orb1" /><div className="al-orb al-orb2" />
        </div>
        <div className="auth-left-content">
          <img src={logo} alt="StockPlus" className="auth-logo" />
          <h2>Empieza a controlar tu inventario hoy</h2>
          <p>Crea tu cuenta y accede a las funciones de StockPlus.</p>
          <div className="auth-features">
            {['Registro de productos', 'Control de ventas automático', 'Acceso desde tu red local'].map((f, i) => (
              <div className="auth-feature" key={i}><span className="af-check">✓</span>{f}</div>
            ))}
          </div>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-form-box">
          <div className="auth-form-logo"><img src={logo} alt="StockPlus" /></div>
          <h1>Crear cuenta</h1>
          <p className="auth-sub">Completa el formulario para comenzar</p>

          {error && <div className="alert alert-error">{error}</div>}
          {exito && <div className="alert alert-success">{exito}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Nombre completo</label>
              <input
                type="text"
                placeholder="Tu nombre"
                value={form.nombre}
                onChange={e => setForm({ ...form, nombre: e.target.value })}
                maxLength={100}
                autoComplete="name"
                required
              />
            </div>
            <div className="form-group">
              <label>Correo electrónico</label>
              <input
                type="email"
                placeholder="tu@email.com"
                value={form.correo}
                onChange={e => setForm({ ...form, correo: e.target.value })}
                maxLength={100}
                autoComplete="email"
                required
              />
            </div>
            <div className="form-group">
              <label>Contraseña</label>
              <input
                type="password"
                placeholder="Mínimo 8 caracteres"
                value={form.contrasena}
                onChange={e => setForm({ ...form, contrasena: e.target.value })}
                required
                minLength={8}
                maxLength={72}
                autoComplete="new-password"
              />
            </div>
            <div className="auth-checkbox">
              <input type="checkbox" id="terminos" checked={terminos} onChange={e => setTerminos(e.target.checked)} />
              <label htmlFor="terminos">Acepto las condiciones de uso de StockPlus</label>
            </div>
            <button type="submit" className="auth-submit-btn" disabled={cargando}>
              {cargando ? <span className="spinner" /> : 'Crear cuenta'}
            </button>
          </form>

          <p className="auth-switch">¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link></p>
          <p className="auth-hint auth-hint-center">Las cuentas nuevas se crean con rol Vendedor.</p>
        </div>
      </div>
    </div>
  )
}
