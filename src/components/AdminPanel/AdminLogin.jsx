import { useState } from 'react'
import { User, Lock, Shield } from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'
import { useDialog } from '../../contexts/DialogContext'

function AdminLogin({ onLogin, apiBaseUrl }) {
  const { colors } = useTheme()
  const { showError } = useDialog()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!username || !password) {
      showError('错误', '请输入用户名和密码')
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`${apiBaseUrl}/api/auth/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '登录失败')
      }

      // 保存 token
      localStorage.setItem('admin_token', data.token)
      localStorage.setItem('admin', JSON.stringify(data.admin))
      
      onLogin(data.admin, data.token)
    } catch (error) {
      showError('登录失败', error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`min-h-screen flex items-center justify-center ${colors.main}`}>
      <div className={`w-full max-w-md ${colors.card} rounded-2xl shadow-xl border ${colors.cardBorder} p-8`}>
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Shield size={32} className="text-white" />
          </div>
          <h1 className={`text-2xl font-bold ${colors.text} mb-2`}>管理员登录</h1>
          <p className={colors.textMuted}>后台管理系统</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={`block text-sm font-medium ${colors.text} mb-2`}>
              用户名
            </label>
            <div className="relative">
              <User className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${colors.textMuted}`} size={18} />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className={`w-full pl-10 pr-4 py-3 ${colors.input} border ${colors.cardBorder} rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 ${colors.text}`}
                placeholder="请输入用户名"
                required
              />
            </div>
          </div>

          <div>
            <label className={`block text-sm font-medium ${colors.text} mb-2`}>
              密码
            </label>
            <div className="relative">
              <Lock className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${colors.textMuted}`} size={18} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full pl-10 pr-4 py-3 ${colors.input} border ${colors.cardBorder} rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 ${colors.text}`}
                placeholder="请输入密码"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 bg-gradient-to-r from-red-500 to-orange-600 text-white rounded-xl font-medium hover:from-red-600 hover:to-orange-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                登录中...
              </>
            ) : (
              <>
                <Shield size={18} />
                登录
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}

export default AdminLogin

