import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../services/api'
import logo from '../assets/logo.png'
import './Auth.css'

export default function Login() {
  const [correo, setCorreo] = useState('')
  const [contrasena, setContrasena] = useState('')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setCargando(true)
    try {
      const data = await api.login(correo.trim(), contrasena)
      login(data.usuario, data.token)
      navigate('/dashboard')
    } catch (err) {
      setError(err.message || 'No se pudo iniciar sesión.')
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
          <h2>Gestiona tu inventario con precisión</h2>
          <p>Control total de productos, ventas y proveedores desde una sola plataforma.</p>
          <div className="auth-features">
            {['Inventario en tiempo real', 'Alertas automáticas', 'Reportes instantáneos'].map((f, i) => (
              <div className="auth-feature" key={i}>
                <span className="af-check">✓</span>{f}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-form-box">
          <div className="auth-form-logo"><img src={logo} alt="StockPlus" /></div>
          <h1>Bienvenido de vuelta</h1>
          <p className="auth-sub">Ingresa tus credenciales para continuar</p>

          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Correo electrónico</label>
              <input
                type="email"
                placeholder="tu@email.com"
                value={correo}
                onChange={e => setCorreo(e.target.value)}
                autoComplete="email"
                required
              />
            </div>
            <div className="form-group">
              <label>Contraseña</label>
              <input
                type="password"
                placeholder="••••••••"
                value={contrasena}
                onChange={e => setContrasena(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>
            <div className="auth-opts">
              <span className="auth-hint">Si olvidaste tu contraseña, el administrador puede restablecerla.</span>
            </div>
            <button type="submit" className="auth-submit-btn" disabled={cargando}>
              {cargando ? <span className="spinner" /> : 'Iniciar sesión'}
            </button>
          </form>

          <p className="auth-switch">¿No tienes cuenta? <Link to="/register">Regístrate</Link></p>

          <div className="auth-demo">
            <div className="demo-title">Acceso de demostración</div>
            <div>Administrador: admin@stockplus.com</div>
            <div>Vendedor: vendedor@stockplus.com</div>
            <div>Contraseña: password123</div>
          </div>
        </div>
      </div>
    </div>
  )
}
