import { useState } from 'react'
import { Mail, Lock, LogIn, UserPlus } from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'
import { useDialog } from '../../contexts/DialogContext'

function Login({ onLogin, onSwitchToRegister, apiBaseUrl }) {
  const { colors } = useTheme()
  const { showError } = useDialog()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!email || !password) {
      showError('错误', '请输入邮箱和密码')
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`${apiBaseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '登录失败')
      }

      // 保存 token
      localStorage.setItem('auth_token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      
      onLogin(data.user, data.token)
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
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <LogIn size={32} className="text-white" />
          </div>
          <h1 className={`text-2xl font-bold ${colors.text} mb-2`}>用户登录</h1>
          <p className={colors.textMuted}>登录以管理您的账号</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={`block text-sm font-medium ${colors.text} mb-2`}>
              邮箱
            </label>
            <div className="relative">
              <Mail className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${colors.textMuted}`} size={18} />
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value.trim())}
                className={`w-full pl-10 pr-4 py-3 ${colors.input} border ${colors.cardBorder} rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 ${colors.text}`}
                placeholder="请输入邮箱"
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
                className={`w-full pl-10 pr-4 py-3 ${colors.input} border ${colors.cardBorder} rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 ${colors.text}`}
                placeholder="请输入密码"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-medium hover:from-blue-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                登录中...
              </>
            ) : (
              <>
                <LogIn size={18} />
                登录
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={onSwitchToRegister}
            className={`text-sm ${colors.textMuted} hover:text-blue-500 transition-colors flex items-center justify-center gap-1`}
          >
            <UserPlus size={14} />
            还没有账号？立即注册
          </button>
        </div>
      </div>
    </div>
  )
}

export default Login

