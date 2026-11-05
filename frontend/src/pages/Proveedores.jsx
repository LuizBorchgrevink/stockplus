import { useState, useEffect, useCallback } from 'react'
import { api } from '../services/api'
import { useAuth } from '../context/AuthContext'
import './CRUD.css'

export default function Proveedores() {
  const { usuario } = useAuth()
  const esAdmin = usuario?.rol === 'administrador'

  const [proveedores, setProveedores] = useState([])
  const [modal, setModal] = useState(false)
  const [editando, setEditando] = useState(null)
  const [busqueda, setBusqueda] = useState('')
  const [form, setForm] = useState({ nombre: '', contacto: '', telefono: '', direccion: '' })
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' })
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)

  const cargar = useCallback(async () => {
    setCargando(true)
    try {
      setProveedores(await api.getProveedores())
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.message })
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => { cargar() }, [cargar])

  const aviso = (tipo, texto) => {
    setMensaje({ tipo, texto })
    setTimeout(() => setMensaje({ tipo: '', texto: '' }), 3500)
  }

  const abrirModal = (p = null) => {
    setEditando(p ? p.id_proveedor : null)
    setForm(p
      ? { nombre: p.nombre, contacto: p.contacto || '', telefono: p.telefono || '', direccion: p.direccion || '' }
      : { nombre: '', contacto: '', telefono: '', direccion: '' })
    setModal(true)
  }

  const guardar = async (e) => {
    e.preventDefault()
    setGuardando(true)
    try {
      if (editando) await api.updateProveedor(editando, form)
      else await api.createProveedor(form)
      setModal(false)
      aviso('success', editando ? 'Proveedor actualizado' : 'Proveedor creado')
      cargar()
    } catch (err) {
      aviso('error', err.message)
    } finally {
      setGuardando(false)
    }
  }

  const eliminar = async (id, nombre) => {
    if (!confirm(`¿Eliminar el proveedor "${nombre}"?\n\nSolo es posible si no tiene productos asociados.`)) return
    try {
      await api.deleteProveedor(id)
      aviso('success', 'Proveedor eliminado')
      cargar()
    } catch (err) {
      aviso('error', err.message)
    }
  }

  const filtrados = proveedores.filter(p =>
    p.nombre.toLowerCase().includes(busqueda.toLowerCase())
  )

  const columnas = esAdmin ? 5 : 4

  return (
    <div className="crud-page">
      <div className="page-header">
        <h1>Proveedores</h1>
        {esAdmin && (
          <button className="btn-primary" onClick={() => abrirModal()}>+ Nuevo proveedor</button>
        )}
      </div>

      {!esAdmin && (
        <div className="info-banner">
          Solo un administrador puede crear, editar o eliminar proveedores.
        </div>
      )}

      {mensaje.texto && <div className={`alert alert-${mensaje.tipo}`}>{mensaje.texto}</div>}

      <div className="card">
        <div className="table-toolbar">
          <input
            type="text"
            placeholder="Buscar proveedor..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            className="search-input"
          />
          <span className="table-count">{filtrados.length} proveedores</span>
        </div>

        {cargando ? (
          <div className="table-loading">Cargando proveedores...</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Contacto</th>
                <th>Teléfono</th>
                <th>Dirección</th>
                {esAdmin && <th>Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {filtrados.map(p => (
                <tr key={p.id_proveedor}>
                  <td><strong>{p.nombre}</strong></td>
                  <td>{p.contacto || '-'}</td>
                  <td>{p.telefono || '-'}</td>
                  <td>{p.direccion || '-'}</td>
                  {esAdmin && (
                    <td>
                      <div className="action-btns">
                        <button className="btn-outline" onClick={() => abrirModal(p)}>Editar</button>
                        <button className="btn-danger" onClick={() => eliminar(p.id_proveedor, p.nombre)}>Eliminar</button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
              {filtrados.length === 0 && (
                <tr>
                  <td colSpan={columnas} style={{ textAlign: 'center', padding: 30, color: '#999' }}>
                    {busqueda ? 'No se encontraron proveedores con esa búsqueda' : 'No hay proveedores registrados'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>{editando ? 'Editar proveedor' : 'Nuevo proveedor'}</h2>
            <form onSubmit={guardar}>
              <div className="form-group">
                <label>Nombre *</label>
                <input value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} maxLength={100} required autoFocus />
              </div>
              <div className="form-group">
                <label>Contacto</label>
                <input value={form.contacto} onChange={e => setForm({ ...form, contacto: e.target.value })} maxLength={100} />
              </div>
              <div className="form-group">
                <label>Teléfono</label>
                <input type="tel" value={form.telefono} onChange={e => setForm({ ...form, telefono: e.target.value })} maxLength={20} />
              </div>
              <div className="form-group">
                <label>Dirección</label>
                <input value={form.direccion} onChange={e => setForm({ ...form, direccion: e.target.value })} maxLength={255} />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-outline" onClick={() => setModal(false)}>Cancelar</button>
                <button type="submit" className="btn-primary" disabled={guardando}>
                  {guardando ? 'Guardando...' : editando ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
