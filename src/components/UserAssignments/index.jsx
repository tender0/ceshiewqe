import { useState, useEffect } from 'react'
import { Bell, CheckCircle, XCircle, Clock, Zap } from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'
import { useDialog } from '../../contexts/DialogContext'
import { invoke } from '@tauri-apps/api/core'

function UserAssignments({ apiBaseUrl, token }) {
  const { colors } = useTheme()
  const { showError, showConfirm } = useDialog()
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(false)
  const [acceptingId, setAcceptingId] = useState(null)

  useEffect(() => {
    loadAssignments()
  }, [])

  const loadAssignments = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${apiBaseUrl}/api/user/assignments/pending`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || '加载失败')

      setAssignments(data.assignments || [])
    } catch (error) {
      showError('加载失败', error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAccept = async (assignment) => {
    const confirmed = await showConfirm(
      '接受账号',
      `确定要接受账号 ${assignment.account_email} 吗？接受后可以一键换号使用。`
    )
    if (!confirmed) return

    setAcceptingId(assignment.id)
    try {
      const response = await fetch(`${apiBaseUrl}/api/user/assignments/${assignment.id}/accept`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || '接受失败')

      // 将账号添加到本地账号列表
      if (data.account) {
        const accountData = {
          email: data.account.email,
          label: `分配的账号 - ${data.account.email}`,
          provider: data.account.provider || 'Google',
          accessToken: data.account.access_token,
          refreshToken: data.account.refresh_token,
          profileArn: data.account.profile_arn,
          clientIdHash: data.account.client_id_hash,
          region: data.account.region,
          clientId: data.account.client_id,
          clientSecret: data.account.client_secret,
          expiresAt: data.account.expires_at
        }

        // 判断是 IdC 还是 Social
        const isIdC = data.account.client_id_hash || data.account.region
        if (isIdC) {
          await invoke('add_account_by_idc', {
            email: accountData.email,
            label: accountData.label,
            accessToken: accountData.accessToken,
            refreshToken: accountData.refreshToken,
            clientIdHash: accountData.clientIdHash,
            region: accountData.region || 'us-east-1',
            clientId: accountData.clientId,
            clientSecret: accountData.clientSecret
          })
        } else {
          await invoke('add_account_by_social', {
            email: accountData.email,
            label: accountData.label,
            provider: accountData.provider,
            accessToken: accountData.accessToken,
            refreshToken: accountData.refreshToken,
            profileArn: accountData.profileArn
          })
        }
      }

      loadAssignments()
    } catch (error) {
      showError('接受失败', error.message)
    } finally {
      setAcceptingId(null)
    }
  }

  const handleReject = async (assignment) => {
    const confirmed = await showConfirm('拒绝账号', '确定要拒绝这个账号分配吗？')
    if (!confirmed) return

    try {
      const response = await fetch(`${apiBaseUrl}/api/user/assignments/${assignment.id}/reject`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || '拒绝失败')

      loadAssignments()
    } catch (error) {
      showError('拒绝失败', error.message)
    }
  }

  if (loading) {
    return (
      <div className={`flex items-center justify-center h-full ${colors.main}`}>
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (assignments.length === 0) {
    return (
      <div className={`h-full flex items-center justify-center ${colors.main}`}>
        <div className="text-center">
          <Bell size={48} className={`${colors.textMuted} mx-auto mb-4`} />
          <p className={colors.textMuted}>暂无待接受的账号分配</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`h-full overflow-auto ${colors.main} p-6`}>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className={`text-2xl font-bold ${colors.text} flex items-center gap-2`}>
            <Bell size={24} />
            待接受的账号分配
          </h2>
          <button
            onClick={loadAssignments}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            刷新
          </button>
        </div>

        <div className="space-y-4">
          {assignments.map(assignment => (
            <div
              key={assignment.id}
              className={`${colors.card} rounded-xl border ${colors.cardBorder} p-6`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                      <Zap size={24} className="text-white" />
                    </div>
                    <div>
                      <h3 className={`text-lg font-semibold ${colors.text}`}>
                        {assignment.account_email}
                      </h3>
                      <p className={`text-sm ${colors.textMuted}`}>
                        Provider: {assignment.provider || 'N/A'}
                      </p>
                    </div>
                  </div>
                  
                  {assignment.remark && (
                    <p className={`text-sm ${colors.textMuted} mt-2`}>
                      备注: {assignment.remark}
                    </p>
                  )}
                  
                  <p className={`text-xs ${colors.textMuted} mt-2`}>
                    分配时间: {new Date(assignment.assigned_at).toLocaleString()}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleAccept(assignment)}
                    disabled={acceptingId === assignment.id}
                    className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
                  >
                    {acceptingId === assignment.id ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        接受中...
                      </>
                    ) : (
                      <>
                        <CheckCircle size={18} />
                        接受
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleReject(assignment)}
                    className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                  >
                    <XCircle size={18} />
                    拒绝
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default UserAssignments

