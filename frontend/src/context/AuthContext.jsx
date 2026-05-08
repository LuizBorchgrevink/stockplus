import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('token'))
  const [cargando, setCargando] = useState(true)

  // Validar token al montar el componente
  useEffect(() => {
    const storedToken = localStorage.getItem('token')
    const storedUser = localStorage.getItem('usuario')

    if (storedToken && storedUser) {
      // Verificar que el token sigue siendo válido con el backend
      fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${storedToken}` }
      })
        .then(res => {
          if (res.ok) {
            return res.json()
          }
          throw new Error('Token inválido')
        })
        .then(userData => {
          setUsuario(userData)
          setToken(storedToken)
        })
        .catch(() => {
          // Token inválido, limpiar sesión
          localStorage.removeItem('token')
          localStorage.removeItem('usuario')
          setToken(null)
          setUsuario(null)
        })
        .finally(() => setCargando(false))
    } else {
      // No hay token almacenado
      localStorage.removeItem('token')
      localStorage.removeItem('usuario')
      setToken(null)
      setUsuario(null)
      setCargando(false)
    }
  }, [])

  const login = useCallback((userData, userToken) => {
    setUsuario(userData)
    setToken(userToken)
    localStorage.setItem('token', userToken)
    localStorage.setItem('usuario', JSON.stringify(userData))
  }, [])

  const logout = useCallback(() => {
    setUsuario(null)
    setToken(null)
    localStorage.removeItem('token')
    localStorage.removeItem('usuario')
  }, [])

  return (
    <AuthContext.Provider value={{ usuario, token, login, logout, cargando }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
