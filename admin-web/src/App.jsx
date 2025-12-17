import { useState, useEffect } from 'react'
import { API_BASE_URL } from './config'
import Login from './components/Login'
import Dashboard from './components/Dashboard'

function App() {
  const [token, setToken] = useState(localStorage.getItem('adminToken'))
  const [admin, setAdmin] = useState(null)

  useEffect(() => {
    if (token) {
      verifyToken()
    }
  }, [token])

  const verifyToken = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/admin/verify`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setAdmin(data.admin)
      } else {
        handleLogout()
      }
    } catch (e) {
      console.error('验证失败:', e)
    }
  }

  const handleLogin = (newToken, adminData) => {
    localStorage.setItem('adminToken', newToken)
    setToken(newToken)
    setAdmin(adminData)
  }

  const handleLogout = () => {
    localStorage.removeItem('adminToken')
    setToken(null)
    setAdmin(null)
  }

  if (!token || !admin) {
    return <Login onLogin={handleLogin} />
  }

  return <Dashboard admin={admin} token={token} onLogout={handleLogout} />
}

export default App
