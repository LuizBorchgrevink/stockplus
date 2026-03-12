import { useState, useEffect } from 'react'
import { api } from '../services/api'
import { useAuth } from '../context/AuthContext'
import './Dashboard.css'

function StatCard({ icon, label, value, sub, color }) {
  return (
    <div className={`stat-card stat-${color}`}>
      <div className="stat-top">
        <div className="stat-icon-wrap">{icon}</div>
      </div>
      <div>
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
        {sub && <div className="stat-sub">{sub}</div>}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [cargando, setCargando] = useState(true)
  const { usuario } = useAuth()

  useEffect(() => {
    api.getDashboard().then(setStats).catch(console.error).finally(() => setCargando(false))
  }, [])

  const formatCOP = n =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(n)

  if (cargando) return (
    <div className="loading">
      <span style={{ fontSize: 28 }}>📦</span> Cargando dashboard...
    </div>
  )

  const maxMonto = stats?.ventas_grafica?.length
    ? Math.max(...stats.ventas_grafica.map(v => v.monto), 1) : 1

  return (
    <div className="dashboard">
      <div className="dash-header">
        <div>
          <h1>Dashboard</h1>
          <p>Bienvenido de vuelta, <strong>{usuario?.nombre}</strong></p>
        </div>
        <div className="dash-date">
          {new Date().toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      <div className="stats-grid">
        <StatCard icon="📦" label="Total productos" value={stats?.total_productos ?? 0} color="blue" />
        <StatCard icon="💵" label="Valor inventario" value={formatCOP(stats?.valor_inventario ?? 0)} color="green" />
        <StatCard
          icon="⚠️" label="Alertas stock bajo"
          value={stats?.alertas_stock ?? 0}
          sub={stats?.alertas_stock > 0 ? 'Requieren atención' : 'Todo en orden'}
          color="orange"
        />
        <StatCard
          icon="🛒" label="Ventas esta semana"
          value={stats?.ventas_semana?.cantidad ?? 0}
          sub={formatCOP(stats?.ventas_semana?.monto ?? 0)}
          color="purple"
        />
      </div>

      <div className="dash-bottom">
        <div className="card chart-card">
          <h2>📈 Ventas — últimos 7 días</h2>
          <div className="chart">
            {stats?.ventas_grafica?.length > 0 ? stats.ventas_grafica.map((v, i) => (
              <div key={i} className="chart-bar-wrap">
                <div className="chart-amount">{formatCOP(v.monto)}</div>
                <div className="chart-bar" style={{ height: `${Math.max((v.monto / maxMonto) * 100, 6)}%` }} />
                <div className="chart-label">
                  {new Date(v.dia).toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric' })}
                </div>
              </div>
            )) : (
              <div className="empty-chart">
                <span style={{ fontSize: 32 }}>📊</span>
                Sin ventas en los últimos 7 días
              </div>
            )}
          </div>
        </div>

        <div className="card stock-table-card">
          <h2>⚠️ Productos con stock bajo</h2>
          {stats?.productos_stock_bajo?.length > 0 ? (
            <table>
              <thead>
                <tr><th>Producto</th><th>Stock</th><th>Estado</th></tr>
              </thead>
              <tbody>
                {stats.productos_stock_bajo.map(p => (
                  <tr key={p.id_producto}>
                    <td><strong>{p.nombre}</strong></td>
                    <td style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700 }}>{p.cantidad_stock}</td>
                    <td>
                      <span className={`badge ${p.cantidad_stock === 0 ? 'badge-danger' : 'badge-warning'}`}>
                        {p.cantidad_stock === 0 ? '● Agotado' : '● Stock bajo'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="empty-state">✅ Todos los productos tienen stock suficiente</div>
          )}
        </div>
      </div>
    </div>
  )
}
