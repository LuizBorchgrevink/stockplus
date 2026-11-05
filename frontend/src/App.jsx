import { BrowserRouter, Routes, Route, Navigate, Outlet, Link } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Sidebar from './components/Sidebar'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Inventario from './pages/Inventario'
import Ventas from './pages/Ventas'
import Clientes from './pages/Clientes'
import Proveedores from './pages/Proveedores'
import './App.css'

function PrivateLayout() {
  const { token, cargando } = useAuth()
  if (cargando) return <div style={{ padding: 40, textAlign: 'center' }}>Cargando...</div>
  if (!token) return <Navigate to="/login" />
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  )
}

function PublicRoute({ children }) {
  const { token } = useAuth()
  return token ? <Navigate to="/dashboard" /> : children
}

function NoEncontrado() {
  const { token } = useAuth()
  return (
    <div className="not-found">
      <h1>404</h1>
      <p>La página que buscas no existe.</p>
      <Link className="btn-primary" to={token ? '/dashboard' : '/'}>
        {token ? 'Ir al dashboard' : 'Volver al inicio'}
      </Link>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
          <Route element={<PrivateLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/inventario" element={<Inventario />} />
            <Route path="/ventas" element={<Ventas />} />
            <Route path="/clientes" element={<Clientes />} />
            <Route path="/proveedores" element={<Proveedores />} />
          </Route>
          <Route path="*" element={<NoEncontrado />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
