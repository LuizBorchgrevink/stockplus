import { useNavigate } from 'react-router-dom'
import logo from '../assets/logo.png'
import './Landing.css'

export default function Landing() {
  const navigate = useNavigate()

  return (
    <div className="landing">
      {/* ── Header ── */}
      <header className="lp-header">
        <div className="lp-logo">
          <img src={logo} alt="StockPlus" />
        </div>
        <nav className="lp-nav">
          <a href="#beneficios">Beneficios</a>
          <a href="#modulos">Módulos</a>
          <button className="lp-btn-ghost" onClick={() => navigate('/login')}>Iniciar sesión</button>
          <button className="lp-btn-cta" onClick={() => navigate('/register')}>Comenzar gratis →</button>
        </nav>
      </header>

      {/* ── Hero ── */}
      <section className="lp-hero">
        <div className="lp-hero-bg">
          <div className="hero-orb orb1" />
          <div className="hero-orb orb2" />
          <div className="hero-orb orb3" />
          <div className="hero-grid" />
        </div>
        <div className="lp-hero-inner">
          <div className="lp-hero-text">
            <div className="hero-tag">
              <span className="hero-tag-dot" />
              Sistema de gestión de inventario
            </div>
            <h1>
              Control total de<br />
              <span className="hero-highlight">tu inventario</span>
            </h1>
            <p>
              Gestiona productos, ventas y proveedores desde una sola plataforma.
              Reduce errores y toma decisiones comerciales con datos reales.
            </p>
            <div className="hero-actions">
              <button className="lp-btn-hero-main" onClick={() => navigate('/register')}>
                Comenzar gratis
              </button>
              <button className="lp-btn-hero-sec" onClick={() => navigate('/login')}>
                Ver demo →
              </button>
            </div>
            <div className="hero-trust">
              <div className="trust-item">✓ Sin tarjeta de crédito</div>
              <div className="trust-item">✓ Configuración en minutos</div>
              <div className="trust-item">✓ Soporte incluido</div>
            </div>
          </div>

          <div className="lp-hero-visual">
            <div className="dashboard-preview">
              <div className="dp-header">
                <div className="dp-dot red" /><div className="dp-dot yellow" /><div className="dp-dot green" />
                <span className="dp-title">Dashboard — StockPlus</span>
              </div>
              <div className="dp-stats">
                {[
                  { label: 'Productos', val: '1,284', icon: '📦', color: 'navy' },
                  { label: 'Ventas hoy', val: '$4.2M', icon: '💰', color: 'gold' },
                  { label: 'Stock bajo', val: '3', icon: '⚠️', color: 'coral' },
                ].map((s, i) => (
                  <div key={i} className={`dp-stat dp-stat-${s.color}`}>
                    <span className="dp-stat-icon">{s.icon}</span>
                    <div>
                      <div className="dp-stat-val">{s.val}</div>
                      <div className="dp-stat-label">{s.label}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="dp-chart-area">
                <div className="dp-chart-label">Rotación de inventario</div>
                <div className="dp-bars">
                  {[55, 72, 48, 88, 63, 95, 78].map((h, i) => (
                    <div key={i} className="dp-bar-wrap">
                      <div className="dp-bar" style={{ height: `${h}%` }} />
                      <div className="dp-bar-day">{['L','M','M','J','V','S','D'][i]}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="dp-table-mini">
                <div className="dp-table-row header">
                  <span>Producto</span><span>Stock</span><span>Estado</span>
                </div>
                {[
                  ['Laptop Dell', '3', 'bajo'],
                  ['Mouse USB', '45', 'ok'],
                  ['Monitor 24"', '1', 'crítico'],
                ].map(([name, stock, status], i) => (
                  <div key={i} className="dp-table-row">
                    <span>{name}</span>
                    <span>{stock}</span>
                    <span className={`dp-badge dp-badge-${status}`}>{status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats strip ── */}
      <div className="lp-stats-strip">
        {[
          { n: '500+', label: 'Negocios activos' },
          { n: '2M+', label: 'Productos gestionados' },
          { n: '99.9%', label: 'Disponibilidad' },
          { n: '<2s', label: 'Tiempo de respuesta' },
        ].map((s, i) => (
          <div key={i} className="stats-strip-item">
            <strong>{s.n}</strong>
            <span>{s.label}</span>
          </div>
        ))}
      </div>

      {/* ── Beneficios ── */}
      <section className="lp-benefits" id="beneficios">
        <div className="lp-section-header">
          <div className="section-tag">Beneficios</div>
          <h2>Todo lo que necesitas<br />en un solo lugar</h2>
          <p>Diseñado para pequeños negocios que quieren crecer sin perder el control.</p>
        </div>
        <div className="lp-benefits-grid" id="modulos">
          {[
            { icon: '📊', color: 'navy', title: 'Control en tiempo real', desc: 'Monitorea tu inventario al instante. Stock actualizado automáticamente con cada venta.' },
            { icon: '🔔', color: 'gold', title: 'Alertas de stock bajo', desc: 'Recibe notificaciones cuando un producto esté por agotarse. Nunca pierdas una venta.' },
            { icon: '📈', color: 'teal', title: 'Reportes automáticos', desc: 'Gráficas y reportes listos para tomar decisiones con datos reales de tu negocio.' },
            { icon: '👥', color: 'coral', title: 'Gestión de clientes', desc: 'Historial de compras de cada cliente. Conoce tu base de clientes y fideliza.' },
            { icon: '🚚', color: 'navy', title: 'Control de proveedores', desc: 'Administra tu red de proveedores y vincula cada producto a su origen.' },
            { icon: '🔐', color: 'teal', title: 'Roles y permisos', desc: 'Administradores y vendedores con accesos diferenciados para mayor seguridad.' },
          ].map((b, i) => (
            <div className={`benefit-card bc-${b.color}`} key={i}>
              <div className="bc-icon">{b.icon}</div>
              <h3>{b.title}</h3>
              <p>{b.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="lp-cta">
        <img src={logo} alt="StockPlus" className="cta-logo" />
        <h2>Empieza hoy, es gratis</h2>
        <p>Crea tu cuenta en menos de 2 minutos y toma el control de tu inventario.</p>
        <button className="lp-btn-hero-main cta-btn" onClick={() => navigate('/register')}>
          Crear cuenta gratuita →
        </button>
      </section>

      {/* ── Footer ── */}
      <footer className="lp-footer">
        <img src={logo} alt="StockPlus" className="footer-logo" />
        <p>© 2024 StockPlus · Sistema de gestión de inventario para pequeños negocios</p>
      </footer>
    </div>
  )
}
