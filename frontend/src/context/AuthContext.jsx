import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('token'))
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    const storedUser = localStorage.getItem('usuario')
    if (storedUser && token) {
      setUsuario(JSON.parse(storedUser))
    }
    setCargando(false)
  }, [token])

  const login = (userData, userToken) => {
    setUsuario(userData)
    setToken(userToken)
    localStorage.setItem('token', userToken)
    localStorage.setItem('usuario', JSON.stringify(userData))
  }

  const logout = () => {
    setUsuario(null)
    setToken(null)
    localStorage.removeItem('token')
    localStorage.removeItem('usuario')
  }

  return (
    <AuthContext.Provider value={{ usuario, token, login, logout, cargando }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
