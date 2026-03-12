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
    if (!terminos) { setError('Debes aceptar los términos y condiciones'); return }
    setError(''); setCargando(true)
    try {
      const data = await api.register(form)
      if (data.error) { setError(data.error); return }
      setExito('¡Cuenta creada! Redirigiendo...')
      setTimeout(() => navigate('/login'), 2000)
    } catch { setError('Error al conectar con el servidor.') }
    finally { setCargando(false) }
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
          <p>Crea tu cuenta gratis y accede a todas las funciones de StockPlus sin límites.</p>
          <div className="auth-features">
            {['Registro de productos ilimitado', 'Control de ventas automático', 'Acceso 24/7 desde cualquier lugar'].map((f,i) => (
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

          {error && <div className="alert alert-error">⚠️ {error}</div>}
          {exito && <div className="alert alert-success">✓ {exito}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Nombre completo</label>
              <input type="text" placeholder="Tu nombre" value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} required />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input type="email" placeholder="tu@email.com" value={form.correo} onChange={e => setForm({...form, correo: e.target.value})} required />
            </div>
            <div className="form-group">
              <label>Contraseña</label>
              <input type="password" placeholder="Mínimo 8 caracteres" value={form.contrasena} onChange={e => setForm({...form, contrasena: e.target.value})} required minLength={8} />
            </div>
            <div className="auth-checkbox">
              <input type="checkbox" id="terminos" checked={terminos} onChange={e => setTerminos(e.target.checked)} />
              <label htmlFor="terminos">Acepto los <a href="#">términos y condiciones</a></label>
            </div>
            <button type="submit" className="auth-submit-btn" disabled={cargando}>
              {cargando ? <span className="spinner" /> : 'Crear cuenta gratis'}
            </button>
          </form>

          <p className="auth-switch">¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link></p>
        </div>
      </div>
    </div>
  )
}
