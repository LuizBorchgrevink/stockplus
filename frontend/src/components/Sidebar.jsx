import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../services/api'
import logo from '../assets/logo.png'
import './Sidebar.css'

const links = [
  { to: '/dashboard',   label: 'Dashboard',   emoji: '📊' },
  { to: '/inventario',  label: 'Inventario',   emoji: '📦' },
  { to: '/ventas',      label: 'Ventas',       emoji: '💰' },
  { to: '/clientes',    label: 'Clientes',     emoji: '👥' },
  { to: '/proveedores', label: 'Proveedores',  emoji: '🚚' },
]

export default function Sidebar() {
  const { usuario, logout } = useAuth()
  const navigate = useNavigate()

  const [menuAbierto, setMenuAbierto] = useState(false)
  const [modalClave, setModalClave] = useState(false)
  const [clave, setClave] = useState({ actual: '', nueva: '', confirmar: '' })
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' })
  const [guardando, setGuardando] = useState(false)

  const handleLogout = () => {
    setMenuAbierto(false)
    logout()
    navigate('/login')
  }

  const abrirClave = () => {
    setClave({ actual: '', nueva: '', confirmar: '' })
    setMensaje({ tipo: '', texto: '' })
    setModalClave(true)
  }

  const cambiarClave = async (e) => {
    e.preventDefault()
    if (clave.nueva !== clave.confirmar) {
      setMensaje({ tipo: 'error', texto: 'La confirmación no coincide con la nueva contraseña' })
      return
    }

    setGuardando(true)
    setMensaje({ tipo: '', texto: '' })
    try {
      const data = await api.cambiarPassword(clave.actual, clave.nueva)
      setMensaje({ tipo: 'success', texto: data.mensaje })
      setClave({ actual: '', nueva: '', confirmar: '' })
      setTimeout(() => setModalClave(false), 1500)
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.message })
    } finally {
      setGuardando(false)
    }
  }

  const initials = usuario?.nombre?.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || 'SP'

  return (
    <>
      <button
        type="button"
        className="sidebar-toggle"
        aria-label="Abrir menú"
        onClick={() => setMenuAbierto(true)}
      >
        ☰
      </button>

      {menuAbierto && (
        <div className="sidebar-overlay" onClick={() => setMenuAbierto(false)} />
      )}

      <aside className={`sidebar ${menuAbierto ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <img src={logo} alt="StockPlus" className="sidebar-logo-img" />
          <button
            type="button"
            className="sidebar-close"
            aria-label="Cerrar menú"
            onClick={() => setMenuAbierto(false)}
          >
            ✕
          </button>
        </div>

        <div className="sidebar-user">
          <div className="user-avatar">{initials}</div>
          <div className="user-info">
            <div className="user-name">{usuario?.nombre}</div>
            <div className="user-role-badge">{usuario?.rol}</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <p className="nav-section-label">Menú principal</p>
          {links.map(link => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={() => setMenuAbierto(false)}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <span className="nav-emoji">{link.emoji}</span>
              <span>{link.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <button type="button" className="password-btn" onClick={abrirClave}>
            <span>🔑</span>
            <span>Cambiar contraseña</span>
          </button>
          <button type="button" className="logout-btn" onClick={handleLogout}>
            <span>🚪</span>
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>

      {modalClave && (
        <div className="modal-overlay" onClick={() => setModalClave(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Cambiar contraseña</h2>
            {mensaje.texto && <div className={`alert alert-${mensaje.tipo}`}>{mensaje.texto}</div>}
            <form onSubmit={cambiarClave}>
              <div className="form-group">
                <label>Contraseña actual *</label>
                <input
                  type="password"
                  value={clave.actual}
                  onChange={e => setClave({ ...clave, actual: e.target.value })}
                  required
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label>Nueva contraseña *</label>
                <input
                  type="password"
                  value={clave.nueva}
                  onChange={e => setClave({ ...clave, nueva: e.target.value })}
                  minLength={8}
                  maxLength={72}
                  required
                />
              </div>
              <div className="form-group">
                <label>Confirmar nueva contraseña *</label>
                <input
                  type="password"
                  value={clave.confirmar}
                  onChange={e => setClave({ ...clave, confirmar: e.target.value })}
                  minLength={8}
                  maxLength={72}
                  required
                />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-outline" onClick={() => setModalClave(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" disabled={guardando}>
                  {guardando ? 'Guardando...' : 'Guardar contraseña'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
