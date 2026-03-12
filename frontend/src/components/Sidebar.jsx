import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
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

  const handleLogout = () => { logout(); navigate('/login') }

  const initials = usuario?.nombre?.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <img src={logo} alt="StockPlus" className="sidebar-logo-img" />
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
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <span className="nav-emoji">{link.emoji}</span>
            <span>{link.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-bottom">
        <button className="logout-btn" onClick={handleLogout}>
          <span>🚪</span>
          <span>Cerrar sesión</span>
        </button>
      </div>
    </aside>
  )
}
