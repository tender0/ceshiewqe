import { useState } from 'react'
import Login from './Login'
import Register from './Register'

function Auth({ onAuthSuccess, apiBaseUrl }) {
  const [mode, setMode] = useState('login') // 'login' or 'register'

  const handleAuth = (user, token) => {
    onAuthSuccess(user, token)
  }

  return (
    <>
      {mode === 'login' ? (
        <Login 
          onLogin={handleAuth}
          onSwitchToRegister={() => setMode('register')}
          apiBaseUrl={apiBaseUrl}
        />
      ) : (
        <Register 
          onRegister={handleAuth}
          onSwitchToLogin={() => setMode('login')}
          apiBaseUrl={apiBaseUrl}
        />
      )}
    </>
  )
}

export default Auth

