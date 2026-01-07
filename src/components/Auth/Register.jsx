import { useState } from 'react'
import { Mail, Lock, UserPlus, ArrowLeft, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'
import { useDialog } from '../../contexts/DialogContext'
import { useEmailValidation } from '../../hooks/useEmailValidation'

function Register({ onRegister, onSwitchToLogin, apiBaseUrl }) {
  const { colors } = useTheme()
  const { showError } = useDialog()
  const {
    email,
    setEmail: handleEmailChange,
    isValid: isEmailValid,
    isValidating: isEmailValidating,
    error: emailError,
    touched: emailTouched,
    handleBlur: handleEmailBlur,
    getNormalizedEmail,
  } = useEmailValidation('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [nickname, setNickname] = useState('')
  const [loading, setLoading] = useState(false)

  // 获取邮箱输入框的边框样式
  const getEmailBorderClass = () => {
    if (!emailTouched && !email) {
      return colors.cardBorder // 默认边框
    }
    if (isEmailValidating) {
      return 'border-blue-400' // 验证中
    }
    if (isEmailValid) {
      return 'border-green-500' // 验证通过 - 绿色边框
    }
    if (emailError) {
      return 'border-red-500' // 验证失败 - 红色边框
    }
    return colors.cardBorder
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!email || !password) {
      showError('错误', '请输入邮箱和密码')
      return
    }

    // 使用新的邮箱验证逻辑 - 阻止表单提交如果邮箱无效
    if (!isEmailValid) {
      showError('错误', emailError || '请输入正确的邮箱格式')
      return
    }

    if (password.length < 6) {
      showError('错误', '密码长度至少6位')
      return
    }

    if (password !== confirmPassword) {
      showError('错误', '两次输入的密码不一致')
      return
    }

    setLoading(true)
    try {
      // 使用规范化后的邮箱提交
      const normalizedEmail = getNormalizedEmail()
      const response = await fetch(`${apiBaseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizedEmail, password, nickname: nickname || null })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '注册失败')
      }

      // 保存 token
      localStorage.setItem('auth_token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      
      onRegister(data.user, data.token)
    } catch (error) {
      showError('注册失败', error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`min-h-screen flex items-center justify-center ${colors.main}`}>
      <div className={`w-full max-w-md ${colors.card} rounded-2xl shadow-xl border ${colors.cardBorder} p-8`}>
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <UserPlus size={32} className="text-white" />
          </div>
          <h1 className={`text-2xl font-bold ${colors.text} mb-2`}>用户注册</h1>
          <p className={colors.textMuted}>创建账号以开始使用</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={`block text-sm font-medium ${colors.text} mb-2`}>
              邮箱 <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Mail className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${colors.textMuted}`} size={18} />
              <input
                type="text"
                value={email}
                onChange={(e) => handleEmailChange(e.target.value)}
                onBlur={handleEmailBlur}
                className={`w-full pl-10 pr-10 py-3 ${colors.input} border ${getEmailBorderClass()} rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 ${colors.text} transition-colors`}
                placeholder="请输入邮箱"
              />
              {/* 验证状态指示器 */}
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                {isEmailValidating && (
                  <Loader2 className="text-blue-400 animate-spin" size={18} />
                )}
                {!isEmailValidating && isEmailValid && email && (
                  <CheckCircle className="text-green-500" size={18} />
                )}
                {!isEmailValidating && emailError && emailTouched && (
                  <AlertCircle className="text-red-500" size={18} />
                )}
              </div>
            </div>
            {/* 错误消息显示 */}
            {emailError && emailTouched && (
              <p className="mt-1 text-sm text-red-500">{emailError}</p>
            )}
          </div>

          <div>
            <label className={`block text-sm font-medium ${colors.text} mb-2`}>
              昵称（可选）
            </label>
            <div className="relative">
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className={`w-full pl-4 pr-4 py-3 ${colors.input} border ${colors.cardBorder} rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 ${colors.text}`}
                placeholder="请输入昵称"
              />
            </div>
          </div>

          <div>
            <label className={`block text-sm font-medium ${colors.text} mb-2`}>
              密码 <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Lock className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${colors.textMuted}`} size={18} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full pl-10 pr-4 py-3 ${colors.input} border ${colors.cardBorder} rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 ${colors.text}`}
                placeholder="至少6位字符"
                required
                minLength={6}
              />
            </div>
          </div>

          <div>
            <label className={`block text-sm font-medium ${colors.text} mb-2`}>
              确认密码 <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Lock className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${colors.textMuted}`} size={18} />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`w-full pl-10 pr-4 py-3 ${colors.input} border ${colors.cardBorder} rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 ${colors.text}`}
                placeholder="请再次输入密码"
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
                注册中...
              </>
            ) : (
              <>
                <UserPlus size={18} />
                注册
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={onSwitchToLogin}
            className={`text-sm ${colors.textMuted} hover:text-blue-500 transition-colors flex items-center justify-center gap-1`}
          >
            <ArrowLeft size={14} />
            已有账号？返回登录
          </button>
        </div>
      </div>
    </div>
  )
}

export default Register

