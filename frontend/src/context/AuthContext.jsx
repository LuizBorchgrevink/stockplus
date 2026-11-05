import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { API_URL } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('token'))
  const [cargando, setCargando] = useState(true)

  const logout = useCallback(() => {
    setUsuario(null)
    setToken(null)
    localStorage.removeItem('token')
    localStorage.removeItem('usuario')
  }, [])

  // El servicio de API avisa cuando el token dejó de ser válido.
  useEffect(() => {
    const handleUnauthorized = () => {
      setUsuario(null)
      setToken(null)
    }

    window.addEventListener('stockplus:unauthorized', handleUnauthorized)
    return () => window.removeEventListener('stockplus:unauthorized', handleUnauthorized)
  }, [])

  // Validar la sesión guardada contra el backend.
  useEffect(() => {
    const storedToken = localStorage.getItem('token')
    const storedUser = localStorage.getItem('usuario')

    if (!storedToken || !storedUser) {
      localStorage.removeItem('token')
      localStorage.removeItem('usuario')
      setToken(null)
      setUsuario(null)
      setCargando(false)
      return
    }

    fetch(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${storedToken}` }
    })
      .then(async (res) => {
        if (res.ok) {
          const userData = await res.json()
          setUsuario(userData)
          setToken(storedToken)
          localStorage.setItem('usuario', JSON.stringify(userData))
          return
        }

        if (res.status === 401) {
          localStorage.removeItem('token')
          localStorage.removeItem('usuario')
          setToken(null)
          setUsuario(null)
          return
        }

        // Error temporal del servidor: conservar la sesión guardada.
        setUsuario(JSON.parse(storedUser))
        setToken(storedToken)
      })
      .catch(() => {
        setUsuario(JSON.parse(storedUser))
        setToken(storedToken)
      })
      .finally(() => setCargando(false))
  }, [])

  const login = useCallback((userData, userToken) => {
    setUsuario(userData)
    setToken(userToken)
    localStorage.setItem('token', userToken)
    localStorage.setItem('usuario', JSON.stringify(userData))
  }, [])

  return (
    <AuthContext.Provider value={{ usuario, token, login, logout, cargando }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
