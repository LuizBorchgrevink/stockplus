import { useState, useEffect, useRef } from 'react'
import { api } from '../services/api'
import { useAuth } from '../context/AuthContext'
import './Dashboard.css'

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [cargando, setCargando] = useState(true)
  const { usuario } = useAuth()
  const donutRef = useRef(null)
  const lineRef  = useRef(null)
  const [darkMode, setDarkMode] = useState(false)   

  const toggleDark = () => {                         
  setDarkMode(prev => {
    const next = !prev
    document.documentElement.classList.toggle('dark', next)
    return next
  })
}

  useEffect(() => {
    api.getDashboard().then(setStats).catch(console.error).finally(() => setCargando(false))
  }, [])

  useEffect(() => {
    if (!stats) return
    drawDonut()
    drawLine()
  }, [stats])

  const formatCOP = n =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(n)

  const formatK = n => n >= 1000000 ? (n/1000000).toFixed(1)+'M' : n >= 1000 ? Math.round(n/1000)+'k' : n

  function drawDonut() {
    const c = donutRef.current
    if (!c) return
    const ctx = c.getContext('2d')
    const cx = 60, cy = 60, R = 46, T = 14
    const sold = (stats.ventas_semana?.cantidad ?? 0)
    const total = (stats.total_productos ?? 1)
    const pct = Math.min(sold / (total || 1), 1)

    ctx.clearRect(0, 0, 120, 120)
    const arc = (start, end, color) => {
      ctx.beginPath(); ctx.arc(cx, cy, R, start, end)
      ctx.arc(cx, cy, R - T, end, start, true)
      ctx.closePath(); ctx.fillStyle = color; ctx.fill()
    }
    arc(-Math.PI/2, -Math.PI/2 + 2*Math.PI*(1-pct), '#001f30')
    arc(-Math.PI/2 + 2*Math.PI*(1-pct), 3*Math.PI/2, '#4b9696')
    ctx.fillStyle = '#eef2f7'
    ctx.beginPath(); ctx.arc(cx, cy, R - T - 2, 0, 2*Math.PI); ctx.fill()
    ctx.fillStyle = '#0d1f2d'; ctx.font = 'bold 13px Plus Jakarta Sans'
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
    ctx.fillText(Math.round((1-pct)*100)+'%', cx, cy - 7)
    ctx.fillStyle = '#6b7e92'; ctx.font = '500 10px Plus Jakarta Sans'
    ctx.fillText(Math.round(pct*100)+'%', cx, cy + 9)
  }

  function drawLine() {
    const c = lineRef.current
    if (!c) return
    const ctx = c.getContext('2d')
    const data = stats.ventas_grafica || []
    if (data.length < 2) return
    const lw = c.parentElement.offsetWidth
    c.width = lw; c.height = 130
    const pad = { l: 44, r: 16, t: 12, b: 28 }
    const W = lw - pad.l - pad.r, H = 130 - pad.t - pad.b
    const montos = data.map(v => v.monto)
    const maxV = Math.max(...montos, 1)
    const xp = i => pad.l + (i / (data.length - 1)) * W
    const yp = v => pad.t + H - (v / maxV) * H

    ctx.strokeStyle = '#e0e7f0'; ctx.lineWidth = 0.5
    for (let i = 0; i <= 4; i++) {
      const y = pad.t + (i / 4) * H
      ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(pad.l + W, y); ctx.stroke()
    }
    ctx.fillStyle = '#9bafc4'; ctx.font = '500 10px Plus Jakarta Sans'; ctx.textAlign = 'right'
    for (let i = 0; i <= 4; i++) {
      const val = Math.round(maxV * (4 - i) / 4)
      ctx.fillText(formatK(val), pad.l - 6, pad.t + (i / 4) * H + 3)
    }
    ctx.fillStyle = '#9bafc4'; ctx.textAlign = 'center'
    data.forEach((v, i) => {
      const label = new Date(v.dia).toLocaleDateString('es-CO', { weekday: 'short' })
      ctx.fillText(label, xp(i), pad.t + H + 18)
    })
    const drawCurve = (pts, color) => {
      ctx.beginPath(); ctx.setLineDash([]); ctx.strokeStyle = color; ctx.lineWidth = 2.5
      pts.forEach((v, i) => i === 0 ? ctx.moveTo(xp(i), yp(v)) : ctx.lineTo(xp(i), yp(v)))
      ctx.stroke()
      pts.forEach((v, i) => {
        ctx.beginPath(); ctx.arc(xp(i), yp(v), 4, 0, 2*Math.PI)
        ctx.fillStyle = color; ctx.fill()
        ctx.beginPath(); ctx.arc(xp(i), yp(v), 2, 0, 2*Math.PI)
        ctx.fillStyle = '#fff'; ctx.fill()
      })
    }
    drawCurve(montos, '#4b9696')
    const estimado = montos.map(v => Math.round(v * 0.72))
    ctx.setLineDash([5, 3])
    ctx.beginPath(); ctx.strokeStyle = '#e1644b'; ctx.lineWidth = 2
    estimado.forEach((v, i) => i === 0 ? ctx.moveTo(xp(i), yp(v)) : ctx.lineTo(xp(i), yp(v)))
    ctx.stroke(); ctx.setLineDash([])
  }

  if (cargando) return (
    <div className="dash-loading">
      <div className="dash-spinner"></div>
      Cargando dashboard...
    </div>
  )

  if (!stats) return (
    <div className="dash-loading">
      No se pudieron cargar los datos. Verifica que el backend esté corriendo.
    </div>
  )


  const topProductos = (stats.productos_stock_bajo || []).slice(0, 10)
  const maxStock = topProductos.length ? Math.max(...topProductos.map(p => p.cantidad_stock + p.stock_minimo), 1) : 1

  return (
    <div className="dashboard">

      {/* HEADER */}
      <div className="dash-header">
        <div className="dash-header-left">
          <h1>Bienvenido, {usuario?.nombre?.split(' ')[0]}!</h1>
        </div>
        <div className="dash-header-right">
          <div className="dash-search">
            <svg width="14" height="14" viewBox="0 0 20 20" fill="#9bafc4"><path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd"/></svg>
            <input placeholder="Buscar..." />
          </div>
          <div className="dash-mode-toggle" onClick={toggleDark}>
            <span className={!darkMode ? 'on' : ''}>☀</span>
            <span className={darkMode ? 'on' : ''}>☾</span>
      </div>
          <div className="dash-bell">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="#6b7e92"><path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zm0 16a2 2 0 01-2-2h4a2 2 0 01-2 2z"/></svg>
          </div>
        </div>
      </div>

      <div className="dash-body">
        <div className="dash-overview-label">DASHBOARD</div>

        {/* STAT CARDS */}
        <div className="stats-grid">
          <div className="stat-card sc-navy">
            <div className="sc-icon">
              <svg width="22" height="22" viewBox="0 0 20 20" fill="currentColor"><path d="M4 3a1 1 0 00-1 1v2a1 1 0 001 1h12a1 1 0 001-1V4a1 1 0 00-1-1H4zm0 5a1 1 0 00-1 1v2a1 1 0 001 1h12a1 1 0 001-1V9a1 1 0 00-1-1H4zm0 5a1 1 0 00-1 1v2a1 1 0 001 1h12a1 1 0 001-1v-2a1 1 0 00-1-1H4z"/></svg>
            </div>
            <div><div className="sc-val">{(stats.total_productos ?? 0).toLocaleString('es-CO')}</div><div className="sc-lbl">Total Productos</div></div>
          </div>
          <div className="stat-card sc-teal">
            <div className="sc-icon">
              <svg width="22" height="22" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd"/></svg>
            </div>
            <div><div className="sc-val">{stats.ventas_semana?.cantidad ?? 0}</div><div className="sc-lbl">Ordenes</div></div>
          </div>
          <div className="stat-card sc-gold">
            <div className="sc-icon">
              <svg width="22" height="22" viewBox="0 0 20 20" fill="currentColor"><path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"/><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.077 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.077-2.354-1.253V5z" clipRule="evenodd"/></svg>
            </div>
            <div>
              <div className="sc-val">{formatK(stats.valor_inventario ?? 0)}</div>
              <div className="sc-lbl">Total Stock</div>
            </div>
          </div>
          <div className="stat-card sc-coral">
            <div className="sc-icon">
              <svg width="22" height="22" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/></svg>
            </div>
            <div>
              <div className="sc-val">{stats.alertas_stock ?? 0}</div>
              <div className="sc-lbl">Sin Stock</div>
            </div>
          </div>
        </div>

        {/* MIDDLE ROW */}
        <div className="mid-grid">

          {/* Usuarios */}
          <div className="dash-card">
            <div className="card-hdr">
              <span className="card-title">Nº de usuarios</span>
              <span className="card-dots">⋯</span>
            </div>
            <div className="users-icon-box">
              <svg width="26" height="26" viewBox="0 0 20 20" fill="#00324b"><path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zm8 0a3 3 0 11-6 0 3 3 0 016 0zm-4.07 11c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"/></svg>
            </div>
            <div className="users-big">583 K</div>
            <div className="users-sub">Total Clientes</div>
          </div>

          {/* Donut */}
          <div className="dash-card">
            <div className="card-hdr">
              <span className="card-title">Valores de inventario</span>
            </div>
            <div className="donut-wrap">
              <canvas ref={donutRef} width={120} height={120} style={{width:120,height:120,flexShrink:0}} />
              <div className="donut-legend">
                <div className="legend-item">
                  <div className="legend-dot" style={{background:'#4b9696'}}></div>
                  Unidades vendidas
                </div>
                <div className="legend-item">
                  <div className="legend-dot" style={{background:'#001f30'}}></div>
                  Total unidades
                </div>
              </div>
            </div>
          </div>

          {/* Top productos */}
          <div className="dash-card">
            <div className="card-hdr">
              <span className="card-title">Top productos por ventas</span>
            </div>
            <div className="top-list">
              {(stats.productos_stock_bajo || []).slice(0, 8).map((p, i) => {
                const val = p.cantidad_stock + p.stock_minimo
                const pct = Math.round((val / maxStock) * 100)
                return (
                  <div className="top-row" key={p.id_producto}>
                    <div className="top-name">{p.nombre}</div>
                    <div className="top-bar-bg"><div className="top-bar-fill" style={{width: pct+'%'}}></div></div>
                    <div className="top-val">{val}</div>
                  </div>
                )
              })}
              {(stats.productos_stock_bajo || []).length === 0 && (
                <div style={{color:'#9bafc4',fontSize:12,textAlign:'center',padding:'16px 0'}}>Sin datos</div>
              )}
            </div>
          </div>
        </div>

        {/* LINE CHART */}
        <div className="dash-card line-card">
          <div className="line-hdr">
            <span className="card-title">Gasto vs Ganancia</span>
            <span className="line-period">Últimos 6 meses</span>
          </div>
          <div className="line-area">
            <canvas ref={lineRef}></canvas>
          </div>
          <div className="line-legend">
            <div className="ll-item"><div className="ll-dot" style={{background:'#e1644b'}}></div> Gasto estimado</div>
            <div className="ll-item"><div className="ll-dot" style={{background:'#4b9696'}}></div> Ganancia real</div>
          </div>
        </div>
      </div>
    </div>
  )
}
