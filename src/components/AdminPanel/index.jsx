import { useState, useEffect } from 'react'
import { Users, Key, UserCheck, CheckCircle, XCircle, Clock, Plus, Trash2, Edit, Send, Upload } from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'
import { useDialog } from '../../contexts/DialogContext'

function AdminPanel({ apiBaseUrl, token, onLogout }) {
  const { colors } = useTheme()
  const { showError, showConfirm, showSuccess } = useDialog()
  const [activeTab, setActiveTab] = useState('users') // 'users', 'accounts', 'assignments'
  const [users, setUsers] = useState([])
  const [accounts, setAccounts] = useState([])
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(false)
  const [showAddAccount, setShowAddAccount] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [selectedAccount, setSelectedAccount] = useState(null)
  const [importJson, setImportJson] = useState('')
  const [importing, setImporting] = useState(false)

  // 新账号表单
  const [newAccount, setNewAccount] = useState({
    email: '',
    provider: '',
    access_token: '',
    refresh_token: '',
    profile_arn: '',
    client_id_hash: '',
    region: '',
    client_id: '',
    client_secret: '',
    expires_at: '',
    remark: ''
  })

  useEffect(() => {
    loadData()
  }, [activeTab])

  const loadData = async () => {
    setLoading(true)
    try {
      const headers = { 'Authorization': `Bearer ${token}` }
      
      if (activeTab === 'users') {
        const res = await fetch(`${apiBaseUrl}/api/admin/users`, { headers })
        const data = await res.json()
        if (res.ok) setUsers(data.users || [])
        else throw new Error(data.error)
      } else if (activeTab === 'accounts') {
        const res = await fetch(`${apiBaseUrl}/api/admin/accounts`, { headers })
        const data = await res.json()
        if (res.ok) setAccounts(data.accounts || [])
        else throw new Error(data.error)
      } else if (activeTab === 'assignments') {
        const res = await fetch(`${apiBaseUrl}/api/admin/assignments`, { headers })
        const data = await res.json()
        if (res.ok) setAssignments(data.assignments || [])
        else throw new Error(data.error)
      }
    } catch (error) {
      showError('加载失败', error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAddAccount = async () => {
    if (!newAccount.email) {
      showError('错误', '请输入邮箱')
      return
    }

    try {
      const res = await fetch(`${apiBaseUrl}/api/admin/accounts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newAccount)
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      setShowAddAccount(false)
      setNewAccount({
        email: '', provider: '', access_token: '', refresh_token: '',
        profile_arn: '', client_id_hash: '', region: '', client_id: '',
        client_secret: '', expires_at: '', remark: ''
      })
      loadData()
    } catch (error) {
      showError('添加失败', error.message)
    }
  }

  const handleAssign = async () => {
    if (!selectedUser || !selectedAccount) {
      showError('错误', '请选择用户和账号')
      return
    }

    try {
      const res = await fetch(`${apiBaseUrl}/api/admin/assignments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id: selectedUser.id,
          account_id: selectedAccount.id
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      setShowAssignModal(false)
      setSelectedUser(null)
      setSelectedAccount(null)
      loadData()
    } catch (error) {
      showError('分配失败', error.message)
    }
  }

  const handleDeleteAccount = async (id) => {
    const confirmed = await showConfirm('确认删除', '确定要删除这个账号吗？')
    if (!confirmed) return

    try {
      const res = await fetch(`${apiBaseUrl}/api/admin/accounts/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      loadData()
    } catch (error) {
      showError('删除失败', error.message)
    }
  }

  // 删除用户
  const handleDeleteUser = async (id) => {
    const confirmed = await showConfirm('确认删除', '确定要删除这个用户吗？该用户的所有分配记录也会被删除。')
    if (!confirmed) return

    try {
      const res = await fetch(`${apiBaseUrl}/api/admin/users/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      showSuccess('删除成功', '用户已删除')
      loadData()
    } catch (error) {
      showError('删除失败', error.message)
    }
  }

  // 删除分配记录
  const handleDeleteAssignment = async (id) => {
    const confirmed = await showConfirm('确认删除', '确定要删除这条分配记录吗？')
    if (!confirmed) return

    try {
      const res = await fetch(`${apiBaseUrl}/api/admin/assignments/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      showSuccess('删除成功', '分配记录已删除')
      loadData()
    } catch (error) {
      showError('删除失败', error.message)
    }
  }

  // JSON 批量导入
  const handleImport = async () => {
    if (!importJson.trim()) {
      showError('错误', '请输入 JSON 数据')
      return
    }

    let accounts
    try {
      const parsed = JSON.parse(importJson)
      // 支持数组或单个对象
      accounts = Array.isArray(parsed) ? parsed : [parsed]
    } catch (e) {
      showError('JSON 格式错误', '请检查 JSON 格式是否正确')
      return
    }

    setImporting(true)
    try {
      const res = await fetch(`${apiBaseUrl}/api/admin/accounts/import`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ accounts })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      showSuccess('导入完成', data.message)
      setShowImportModal(false)
      setImportJson('')
      loadData()
    } catch (error) {
      showError('导入失败', error.message)
    } finally {
      setImporting(false)
    }
  }

  const getStatusBadge = (status) => {
    const badges = {
      active: 'bg-green-500/20 text-green-400',
      inactive: 'bg-gray-500/20 text-gray-400',
      banned: 'bg-red-500/20 text-red-400',
      available: 'bg-blue-500/20 text-blue-400',
      pending: 'bg-yellow-500/20 text-yellow-400',
      assigned: 'bg-purple-500/20 text-purple-400',
      accepted: 'bg-green-500/20 text-green-400',
      rejected: 'bg-red-500/20 text-red-400'
    }
    return badges[status] || 'bg-gray-500/20 text-gray-400'
  }

  return (
    <div className={`h-full flex flex-col ${colors.main}`}>
      {/* Header */}
      <div className={`${colors.card} border-b ${colors.cardBorder} p-4`}>
        <div className="flex items-center justify-between">
          <h1 className={`text-xl font-bold ${colors.text}`}>后台管理</h1>
          <button
            onClick={onLogout}
            className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
          >
            退出登录
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className={`${colors.card} border-b ${colors.cardBorder} flex gap-2 p-2`}>
        {[
          { id: 'users', label: '用户管理', icon: Users },
          { id: 'accounts', label: '账号池', icon: Key },
          { id: 'assignments', label: '分配记录', icon: UserCheck }
        ].map(tab => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-500 text-white'
                  : `${colors.textMuted} hover:${colors.text}`
              }`}
            >
              <Icon size={18} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {activeTab === 'users' && (
              <div className="space-y-4">
                <div className={`${colors.card} rounded-xl border ${colors.cardBorder} overflow-hidden`}>
                  <table className="w-full">
                    <thead className={`${colors.card} border-b ${colors.cardBorder}`}>
                      <tr>
                        <th className={`px-4 py-3 text-left text-sm font-medium ${colors.text}`}>ID</th>
                        <th className={`px-4 py-3 text-left text-sm font-medium ${colors.text}`}>邮箱</th>
                        <th className={`px-4 py-3 text-left text-sm font-medium ${colors.text}`}>昵称</th>
                        <th className={`px-4 py-3 text-left text-sm font-medium ${colors.text}`}>状态</th>
                        <th className={`px-4 py-3 text-left text-sm font-medium ${colors.text}`}>分配数</th>
                        <th className={`px-4 py-3 text-left text-sm font-medium ${colors.text}`}>操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map(user => (
                        <tr key={user.id} className={`border-b ${colors.cardBorder} hover:${colors.card}`}>
                          <td className={`px-4 py-3 text-sm ${colors.text}`}>{user.id}</td>
                          <td className={`px-4 py-3 text-sm ${colors.text}`}>{user.email}</td>
                          <td className={`px-4 py-3 text-sm ${colors.textMuted}`}>{user.nickname || '-'}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadge(user.status)}`}>
                              {user.status}
                            </span>
                          </td>
                          <td className={`px-4 py-3 text-sm ${colors.text}`}>
                            {user.accepted_count || 0} / {user.assignment_count || 0}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  setSelectedUser(user)
                                  setShowAssignModal(true)
                                }}
                                className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors text-sm"
                              >
                                分配账号
                              </button>
                              <button
                                onClick={() => handleDeleteUser(user.id)}
                                className="px-3 py-1 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors text-sm"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'accounts' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className={`text-lg font-semibold ${colors.text}`}>账号池</h2>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowImportModal(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                    >
                      <Upload size={18} />
                      JSON 导入
                    </button>
                    <button
                      onClick={() => setShowAddAccount(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      <Plus size={18} />
                      添加账号
                    </button>
                  </div>
                </div>

                <div className={`${colors.card} rounded-xl border ${colors.cardBorder} overflow-hidden`}>
                  <table className="w-full">
                    <thead className={`${colors.card} border-b ${colors.cardBorder}`}>
                      <tr>
                        <th className={`px-4 py-3 text-left text-sm font-medium ${colors.text}`}>ID</th>
                        <th className={`px-4 py-3 text-left text-sm font-medium ${colors.text}`}>邮箱</th>
                        <th className={`px-4 py-3 text-left text-sm font-medium ${colors.text}`}>Provider</th>
                        <th className={`px-4 py-3 text-left text-sm font-medium ${colors.text}`}>状态</th>
                        <th className={`px-4 py-3 text-left text-sm font-medium ${colors.text}`}>备注</th>
                        <th className={`px-4 py-3 text-left text-sm font-medium ${colors.text}`}>操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {accounts.map(account => (
                        <tr key={account.id} className={`border-b ${colors.cardBorder} hover:${colors.card}`}>
                          <td className={`px-4 py-3 text-sm ${colors.text}`}>{account.id}</td>
                          <td className={`px-4 py-3 text-sm ${colors.text}`}>{account.email}</td>
                          <td className={`px-4 py-3 text-sm ${colors.textMuted}`}>{account.provider || '-'}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadge(account.status)}`}>
                              {account.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm ${colors.textMuted}">{account.remark || '-'}</td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => handleDeleteAccount(account.id)}
                              className="px-3 py-1 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors text-sm"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'assignments' && (
              <div className={`${colors.card} rounded-xl border ${colors.cardBorder} overflow-hidden`}>
                <table className="w-full">
                  <thead className={`${colors.card} border-b ${colors.cardBorder}`}>
                    <tr>
                      <th className={`px-4 py-3 text-left text-sm font-medium ${colors.text}`}>ID</th>
                      <th className={`px-4 py-3 text-left text-sm font-medium ${colors.text}`}>用户</th>
                      <th className={`px-4 py-3 text-left text-sm font-medium ${colors.text}`}>账号</th>
                      <th className={`px-4 py-3 text-left text-sm font-medium ${colors.text}`}>状态</th>
                      <th className={`px-4 py-3 text-left text-sm font-medium ${colors.text}`}>分配时间</th>
                      <th className={`px-4 py-3 text-left text-sm font-medium ${colors.text}`}>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assignments.map(assignment => (
                      <tr key={assignment.id} className={`border-b ${colors.cardBorder} hover:${colors.card}`}>
                        <td className={`px-4 py-3 text-sm ${colors.text}`}>{assignment.id}</td>
                        <td className={`px-4 py-3 text-sm ${colors.text}`}>
                          {assignment.user_email} {assignment.user_nickname && `(${assignment.user_nickname})`}
                        </td>
                        <td className={`px-4 py-3 text-sm ${colors.text}`}>{assignment.account_email}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadge(assignment.status)}`}>
                            {assignment.status === 'pending' && <Clock size={12} className="inline mr-1" />}
                            {assignment.status === 'accepted' && <CheckCircle size={12} className="inline mr-1" />}
                            {assignment.status === 'rejected' && <XCircle size={12} className="inline mr-1" />}
                            {assignment.status}
                          </span>
                        </td>
                        <td className={`px-4 py-3 text-sm ${colors.textMuted}`}>
                          {new Date(assignment.assigned_at).toLocaleString()}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleDeleteAssignment(assignment.id)}
                            className="px-3 py-1 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors text-sm"
                            title={assignment.status === 'accepted' ? '已接受的分配无法删除' : '删除分配'}
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>

      {/* Add Account Modal */}
      {showAddAccount && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className={`${colors.card} rounded-xl border ${colors.cardBorder} p-6 w-full max-w-2xl max-h-[90vh] overflow-auto`}>
            <h2 className={`text-xl font-bold ${colors.text} mb-4`}>添加账号</h2>
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium ${colors.text} mb-2`}>邮箱 *</label>
                <input
                  type="email"
                  value={newAccount.email}
                  onChange={(e) => setNewAccount({...newAccount, email: e.target.value})}
                  className={`w-full px-4 py-2 ${colors.input} border ${colors.cardBorder} rounded-lg ${colors.text}`}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium ${colors.text} mb-2`}>Provider</label>
                  <input
                    type="text"
                    value={newAccount.provider}
                    onChange={(e) => setNewAccount({...newAccount, provider: e.target.value})}
                    className={`w-full px-4 py-2 ${colors.input} border ${colors.cardBorder} rounded-lg ${colors.text}`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium ${colors.text} mb-2`}>Region</label>
                  <input
                    type="text"
                    value={newAccount.region}
                    onChange={(e) => setNewAccount({...newAccount, region: e.target.value})}
                    className={`w-full px-4 py-2 ${colors.input} border ${colors.cardBorder} rounded-lg ${colors.text}`}
                  />
                </div>
              </div>
              <div>
                <label className={`block text-sm font-medium ${colors.text} mb-2`}>Access Token</label>
                <textarea
                  value={newAccount.access_token}
                  onChange={(e) => setNewAccount({...newAccount, access_token: e.target.value})}
                  className={`w-full px-4 py-2 ${colors.input} border ${colors.cardBorder} rounded-lg ${colors.text}`}
                  rows={2}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium ${colors.text} mb-2`}>Refresh Token</label>
                <textarea
                  value={newAccount.refresh_token}
                  onChange={(e) => setNewAccount({...newAccount, refresh_token: e.target.value})}
                  className={`w-full px-4 py-2 ${colors.input} border ${colors.cardBorder} rounded-lg ${colors.text}`}
                  rows={2}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium ${colors.text} mb-2`}>Profile ARN</label>
                <input
                  type="text"
                  value={newAccount.profile_arn}
                  onChange={(e) => setNewAccount({...newAccount, profile_arn: e.target.value})}
                  className={`w-full px-4 py-2 ${colors.input} border ${colors.cardBorder} rounded-lg ${colors.text}`}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium ${colors.text} mb-2`}>备注</label>
                <input
                  type="text"
                  value={newAccount.remark}
                  onChange={(e) => setNewAccount({...newAccount, remark: e.target.value})}
                  className={`w-full px-4 py-2 ${colors.input} border ${colors.cardBorder} rounded-lg ${colors.text}`}
                />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button
                onClick={handleAddAccount}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                添加
              </button>
              <button
                onClick={() => setShowAddAccount(false)}
                className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className={`${colors.card} rounded-xl border ${colors.cardBorder} p-6 w-full max-w-3xl max-h-[90vh] overflow-auto`}>
            <h2 className={`text-xl font-bold ${colors.text} mb-4`}>JSON 批量导入</h2>
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium ${colors.text} mb-2`}>
                  JSON 数据（支持数组或单个对象）
                </label>
                <textarea
                  value={importJson}
                  onChange={(e) => setImportJson(e.target.value)}
                  className={`w-full px-4 py-3 ${colors.input} border ${colors.cardBorder} rounded-lg ${colors.text} font-mono text-sm`}
                  rows={15}
                  placeholder={`示例格式：
[
  {
    "email": "account1@example.com",
    "provider": "Google",
    "accessToken": "xxx",
    "refreshToken": "xxx",
    "profileArn": "xxx",
    "remark": "备注"
  },
  {
    "email": "account2@example.com",
    "provider": "Github",
    "accessToken": "xxx",
    "refreshToken": "xxx"
  }
]

支持的字段：
- email (必填)
- provider
- accessToken / access_token
- refreshToken / refresh_token
- profileArn / profile_arn
- expiresAt / expires_at
- clientIdHash / client_id_hash
- region
- clientId / client_id
- clientSecret / client_secret
- remark`}
                />
              </div>
              <div className={`text-sm ${colors.textMuted}`}>
                提示：可以直接粘贴从其他地方导出的账号 JSON 数据
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button
                onClick={handleImport}
                disabled={importing}
                className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {importing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    导入中...
                  </>
                ) : (
                  <>
                    <Upload size={18} />
                    开始导入
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  setShowImportModal(false)
                  setImportJson('')
                }}
                className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className={`${colors.card} rounded-xl border ${colors.cardBorder} p-6 w-full max-w-md`}>
            <h2 className={`text-xl font-bold ${colors.text} mb-4`}>分配账号</h2>
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium ${colors.text} mb-2`}>用户</label>
                <div className={`px-4 py-2 ${colors.input} border ${colors.cardBorder} rounded-lg ${colors.text}`}>
                  {selectedUser?.email} {selectedUser?.nickname && `(${selectedUser.nickname})`}
                </div>
              </div>
              <div>
                <label className={`block text-sm font-medium ${colors.text} mb-2`}>选择账号</label>
                <select
                  value={selectedAccount?.id || ''}
                  onChange={(e) => {
                    const account = accounts.find(a => a.id === parseInt(e.target.value))
                    setSelectedAccount(account)
                  }}
                  className={`w-full px-4 py-2 ${colors.input} border ${colors.cardBorder} rounded-lg ${colors.text}`}
                >
                  <option value="">请选择账号</option>
                  {accounts.filter(a => a.status === 'available').map(account => (
                    <option key={account.id} value={account.id}>
                      {account.email} ({account.provider || 'N/A'})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button
                onClick={handleAssign}
                disabled={!selectedAccount}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
              >
                分配
              </button>
              <button
                onClick={() => {
                  setShowAssignModal(false)
                  setSelectedAccount(null)
                }}
                className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminPanel

