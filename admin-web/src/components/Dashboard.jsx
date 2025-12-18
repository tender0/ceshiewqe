import { useState, useEffect } from 'react'
import { API_BASE_URL } from '../config'
import { 
  Users, Key, GitBranch, BarChart3, LogOut, Plus, Trash2, RefreshCw,
  Edit, Ban, Check, X, Upload, UserPlus, Lock
} from 'lucide-react'

export default function Dashboard({ admin, token, onLogout }) {
  const [activeTab, setActiveTab] = useState('stats')
  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [accounts, setAccounts] = useState([])
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)

  const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }

  const showMessage = (text, type = 'success') => {
    setMessage({ text, type })
    setTimeout(() => setMessage(null), 3000)
  }

  useEffect(() => {
    loadData()
  }, [activeTab])

  // 初始加载账号列表（用于用户管理页面的分配功能）
  useEffect(() => {
    loadAccounts()
  }, [])

  const loadAccounts = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/accounts`, { headers })
      const data = await res.json()
      if (res.ok) setAccounts(data.accounts || [])
    } catch (e) {
      console.error('加载账号列表失败:', e)
    }
  }

  const loadData = async () => {
    setLoading(true)
    try {
      if (activeTab === 'stats') {
        const res = await fetch(`${API_BASE_URL}/api/admin/stats`, { headers })
        const data = await res.json()
        if (res.ok) setStats(data.stats)
      } else if (activeTab === 'users') {
        const res = await fetch(`${API_BASE_URL}/api/admin/users`, { headers })
        const data = await res.json()
        if (res.ok) setUsers(data.users || [])
        // 同时刷新账号列表
        loadAccounts()
      } else if (activeTab === 'accounts') {
        const res = await fetch(`${API_BASE_URL}/api/admin/accounts`, { headers })
        const data = await res.json()
        if (res.ok) setAccounts(data.accounts || [])
      } else if (activeTab === 'assignments') {
        const res = await fetch(`${API_BASE_URL}/api/admin/assignments`, { headers })
        const data = await res.json()
        if (res.ok) setAssignments(data.assignments || [])
      }
    } catch (e) {
      showMessage('加载数据失败: ' + e.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const tabs = [
    { id: 'stats', name: '统计概览', icon: BarChart3 },
    { id: 'users', name: '用户管理', icon: Users },
    { id: 'accounts', name: '账号池', icon: Key },
    { id: 'assignments', name: '分配记录', icon: GitBranch },
  ]

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-800">Kiro 后台管理</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-600">欢迎, {admin.username}</span>
            <button onClick={onLogout} className="btn btn-secondary flex items-center gap-2">
              <LogOut className="w-4 h-4" /> 退出
            </button>
          </div>
        </div>
      </header>

      {message && (
        <div className={`fixed top-4 right-4 px-4 py-2 rounded-lg shadow-lg z-50 ${
          message.type === 'error' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'
        }`}>
          {message.text}
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-2 mb-6 flex-wrap">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === tab.id ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.name}
            </button>
          ))}
          <button onClick={loadData} className="ml-auto btn btn-secondary flex items-center gap-2">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> 刷新
          </button>
        </div>

        <div className="card">
          {loading ? (
            <div className="text-center py-12 text-gray-500">加载中...</div>
          ) : (
            <>
              {activeTab === 'stats' && <StatsView stats={stats} />}
              {activeTab === 'users' && <UsersView users={users} accounts={accounts} token={token} onRefresh={loadData} showMessage={showMessage} />}
              {activeTab === 'accounts' && <AccountsView accounts={accounts} token={token} onRefresh={loadData} showMessage={showMessage} />}
              {activeTab === 'assignments' && <AssignmentsView assignments={assignments} token={token} onRefresh={loadData} showMessage={showMessage} />}
            </>
          )}
        </div>
      </div>
    </div>
  )
}


function StatsView({ stats }) {
  if (!stats) return <div className="text-gray-500">暂无数据</div>

  const items = [
    { label: '用户总数', value: stats.userCount, color: 'bg-blue-500' },
    { label: '账号总数', value: stats.accountCount, color: 'bg-green-500' },
    { label: '可用账号', value: stats.availableCount, color: 'bg-emerald-500' },
    { label: '已分配', value: stats.assignedCount, color: 'bg-orange-500' },
    { label: '待接受', value: stats.pendingAssignments, color: 'bg-yellow-500' },
    { label: '已接受', value: stats.acceptedAssignments, color: 'bg-purple-500' },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {items.map(item => (
        <div key={item.label} className="bg-gray-50 rounded-lg p-4 text-center">
          <div className={`w-12 h-12 ${item.color} rounded-full flex items-center justify-center mx-auto mb-2`}>
            <span className="text-white text-xl font-bold">{item.value}</span>
          </div>
          <div className="text-gray-600 text-sm">{item.label}</div>
        </div>
      ))}
    </div>
  )
}

function UsersView({ users, accounts, token, onRefresh, showMessage }) {
  const [showAssign, setShowAssign] = useState(null)
  const [showResetPwd, setShowResetPwd] = useState(null)
  const [newPassword, setNewPassword] = useState('')
  const [selectedAccount, setSelectedAccount] = useState('')

  const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
  const availableAccounts = accounts?.filter(a => a.status === 'available') || []

  const toggleStatus = async (user) => {
    const newStatus = user.status === 'active' ? 'inactive' : 'active'
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/users/${user.id}/status`, {
        method: 'PUT', headers, body: JSON.stringify({ status: newStatus })
      })
      if (res.ok) {
        showMessage(`用户已${newStatus === 'active' ? '启用' : '禁用'}`)
        onRefresh()
      } else {
        const data = await res.json()
        showMessage(data.error || '操作失败', 'error')
      }
    } catch (e) {
      showMessage('操作失败', 'error')
    }
  }

  const resetPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      showMessage('密码至少6位', 'error')
      return
    }
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/users/${showResetPwd}/reset-password`, {
        method: 'POST', headers, body: JSON.stringify({ newPassword })
      })
      if (res.ok) {
        showMessage('密码已重置')
        setShowResetPwd(null)
        setNewPassword('')
      } else {
        const data = await res.json()
        showMessage(data.error || '重置失败', 'error')
      }
    } catch (e) {
      showMessage('重置失败', 'error')
    }
  }

  const assignAccount = async () => {
    if (!selectedAccount) {
      showMessage('请选择账号', 'error')
      return
    }
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/assignments`, {
        method: 'POST', headers,
        body: JSON.stringify({ user_id: showAssign, account_id: parseInt(selectedAccount) })
      })
      if (res.ok) {
        showMessage('分配成功')
        setShowAssign(null)
        setSelectedAccount('')
        onRefresh()
      } else {
        const data = await res.json()
        showMessage(data.error || '分配失败', 'error')
      }
    } catch (e) {
      showMessage('分配失败', 'error')
    }
  }

  const deleteUser = async (id) => {
    if (!confirm('确定要删除此用户吗？')) return
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/users/${id}`, { method: 'DELETE', headers })
      if (res.ok) {
        showMessage('删除成功')
        onRefresh()
      }
    } catch (e) {
      showMessage('删除失败', 'error')
    }
  }

  if (users.length === 0) return <div className="text-gray-500 text-center py-8">暂无用户</div>

  return (
    <div>
      {/* 重置密码弹窗 */}
      {showResetPwd && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-medium mb-4">重置密码</h3>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="输入新密码（至少6位）"
              className="input w-full mb-4"
            />
            <div className="flex gap-2 justify-end">
              <button onClick={() => { setShowResetPwd(null); setNewPassword('') }} className="btn btn-secondary">取消</button>
              <button onClick={resetPassword} className="btn btn-primary">确认重置</button>
            </div>
          </div>
        </div>
      )}

      {/* 分配账号弹窗 */}
      {showAssign && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-medium mb-4">分配账号</h3>
            {availableAccounts.length === 0 ? (
              <p className="text-gray-500 mb-4">暂无可用账号</p>
            ) : (
              <select
                value={selectedAccount}
                onChange={(e) => setSelectedAccount(e.target.value)}
                className="input w-full mb-4"
              >
                <option value="">选择账号</option>
                {availableAccounts.map(acc => (
                  <option key={acc.id} value={acc.id}>{acc.email}</option>
                ))}
              </select>
            )}
            <div className="flex gap-2 justify-end">
              <button onClick={() => { setShowAssign(null); setSelectedAccount('') }} className="btn btn-secondary">取消</button>
              <button onClick={assignAccount} disabled={!selectedAccount} className="btn btn-primary">确认分配</button>
            </div>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-3 px-4">ID</th>
              <th className="text-left py-3 px-4">邮箱</th>
              <th className="text-left py-3 px-4">昵称</th>
              <th className="text-left py-3 px-4">状态</th>
              <th className="text-left py-3 px-4">注册时间</th>
              <th className="text-left py-3 px-4">操作</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id} className="border-b hover:bg-gray-50">
                <td className="py-3 px-4">{user.id}</td>
                <td className="py-3 px-4">{user.email}</td>
                <td className="py-3 px-4">{user.nickname || '-'}</td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-1 rounded text-xs ${
                    user.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {user.status === 'active' ? '正常' : '禁用'}
                  </span>
                </td>
                <td className="py-3 px-4 text-sm text-gray-500">
                  {new Date(user.created_at).toLocaleString()}
                </td>
                <td className="py-3 px-4">
                  <div className="flex gap-2">
                    <button onClick={() => setShowAssign(user.id)} className="text-blue-600 hover:text-blue-800" title="分配账号">
                      <UserPlus className="w-4 h-4" />
                    </button>
                    <button onClick={() => setShowResetPwd(user.id)} className="text-yellow-600 hover:text-yellow-800" title="重置密码">
                      <Lock className="w-4 h-4" />
                    </button>
                    <button onClick={() => toggleStatus(user)} className={user.status === 'active' ? 'text-orange-600 hover:text-orange-800' : 'text-green-600 hover:text-green-800'} title={user.status === 'active' ? '禁用' : '启用'}>
                      {user.status === 'active' ? <Ban className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                    </button>
                    <button onClick={() => deleteUser(user.id)} className="text-red-600 hover:text-red-800" title="删除">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}


function AccountsView({ accounts, token, onRefresh, showMessage }) {
  const [showAdd, setShowAdd] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [showEdit, setShowEdit] = useState(null)
  const [newAccount, setNewAccount] = useState({ email: '', remark: '' })
  const [editAccount, setEditAccount] = useState({})
  const [importJson, setImportJson] = useState('')
  const [processing, setProcessing] = useState(false)

  const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }

  const addAccount = async () => {
    if (!newAccount.email) {
      showMessage('请输入邮箱', 'error')
      return
    }
    setProcessing(true)
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/accounts`, {
        method: 'POST', headers, body: JSON.stringify(newAccount)
      })
      if (res.ok) {
        showMessage('添加成功')
        setNewAccount({ email: '', remark: '' })
        setShowAdd(false)
        onRefresh()
      } else {
        const data = await res.json()
        showMessage(data.error || '添加失败', 'error')
      }
    } catch (e) {
      showMessage('添加失败', 'error')
    } finally {
      setProcessing(false)
    }
  }

  const importAccounts = async () => {
    if (!importJson.trim()) {
      showMessage('请输入JSON数据', 'error')
      return
    }
    let accounts
    try {
      accounts = JSON.parse(importJson)
      if (!Array.isArray(accounts)) accounts = [accounts]
    } catch (e) {
      showMessage('JSON格式错误', 'error')
      return
    }
    setProcessing(true)
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/accounts/import`, {
        method: 'POST', headers, body: JSON.stringify({ accounts })
      })
      const data = await res.json()
      if (res.ok) {
        showMessage(data.message || '导入成功')
        setImportJson('')
        setShowImport(false)
        onRefresh()
      } else {
        showMessage(data.error || '导入失败', 'error')
      }
    } catch (e) {
      showMessage('导入失败', 'error')
    } finally {
      setProcessing(false)
    }
  }

  const updateAccount = async () => {
    setProcessing(true)
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/accounts/${editAccount.id}`, {
        method: 'PUT', headers, body: JSON.stringify(editAccount)
      })
      if (res.ok) {
        showMessage('更新成功')
        setShowEdit(null)
        onRefresh()
      } else {
        const data = await res.json()
        showMessage(data.error || '更新失败', 'error')
      }
    } catch (e) {
      showMessage('更新失败', 'error')
    } finally {
      setProcessing(false)
    }
  }

  const deleteAccount = async (id) => {
    if (!confirm('确定要删除此账号吗？')) return
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/accounts/${id}`, { method: 'DELETE', headers })
      if (res.ok) {
        showMessage('删除成功')
        onRefresh()
      } else {
        const data = await res.json()
        showMessage(data.error || '删除失败', 'error')
      }
    } catch (e) {
      showMessage('删除失败', 'error')
    }
  }

  const openEdit = (acc) => {
    setEditAccount({ ...acc })
    setShowEdit(acc.id)
  }

  return (
    <div>
      {/* 添加账号弹窗 */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[500px] max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-medium mb-4">添加账号</h3>
            <div className="space-y-3">
              <input type="text" value={newAccount.email} onChange={(e) => setNewAccount({...newAccount, email: e.target.value})} placeholder="邮箱 *" className="input w-full" />
              <input type="text" value={newAccount.remark || ''} onChange={(e) => setNewAccount({...newAccount, remark: e.target.value})} placeholder="备注" className="input w-full" />
            </div>
            <div className="flex gap-2 justify-end mt-4">
              <button onClick={() => setShowAdd(false)} className="btn btn-secondary">取消</button>
              <button onClick={addAccount} disabled={processing} className="btn btn-primary">{processing ? '添加中...' : '添加'}</button>
            </div>
          </div>
        </div>
      )}

      {/* 批量导入弹窗 */}
      {showImport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[600px] max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-medium mb-4">批量导入账号</h3>
            <p className="text-sm text-gray-500 mb-2">JSON格式：[{`{"email":"xxx@example.com","remark":"备注"}`}]</p>
            <textarea
              value={importJson}
              onChange={(e) => setImportJson(e.target.value)}
              placeholder='粘贴JSON数组...'
              className="input w-full h-48 font-mono text-sm"
            />
            <div className="flex gap-2 justify-end mt-4">
              <button onClick={() => setShowImport(false)} className="btn btn-secondary">取消</button>
              <button onClick={importAccounts} disabled={processing} className="btn btn-primary">{processing ? '导入中...' : '导入'}</button>
            </div>
          </div>
        </div>
      )}

      {/* 编辑账号弹窗 */}
      {showEdit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[500px] max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-medium mb-4">编辑账号</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-600">邮箱</label>
                <input type="text" value={editAccount.email || ''} onChange={(e) => setEditAccount({...editAccount, email: e.target.value})} className="input w-full" />
              </div>
              <div>
                <label className="text-sm text-gray-600">状态</label>
                <select value={editAccount.status || ''} onChange={(e) => setEditAccount({...editAccount, status: e.target.value})} className="input w-full">
                  <option value="available">可用</option>
                  <option value="assigned">已分配</option>
                  <option value="pending">待接受</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-600">备注</label>
                <input type="text" value={editAccount.remark || ''} onChange={(e) => setEditAccount({...editAccount, remark: e.target.value})} className="input w-full" />
              </div>
            </div>
            <div className="flex gap-2 justify-end mt-4">
              <button onClick={() => setShowEdit(null)} className="btn btn-secondary">取消</button>
              <button onClick={updateAccount} disabled={processing} className="btn btn-primary">{processing ? '保存中...' : '保存'}</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-4">
        <h3 className="font-medium">账号列表 ({accounts.length})</h3>
        <div className="flex gap-2">
          <button onClick={() => setShowImport(true)} className="btn btn-secondary flex items-center gap-2">
            <Upload className="w-4 h-4" /> 批量导入
          </button>
          <button onClick={() => setShowAdd(true)} className="btn btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> 添加账号
          </button>
        </div>
      </div>

      {accounts.length === 0 ? (
        <div className="text-gray-500 text-center py-8">暂无账号</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4">ID</th>
                <th className="text-left py-3 px-4">邮箱</th>
                <th className="text-left py-3 px-4">状态</th>
                <th className="text-left py-3 px-4">备注</th>
                <th className="text-left py-3 px-4">创建时间</th>
                <th className="text-left py-3 px-4">操作</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map(acc => (
                <tr key={acc.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4">{acc.id}</td>
                  <td className="py-3 px-4">{acc.email}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded text-xs ${
                      acc.status === 'available' ? 'bg-green-100 text-green-700' :
                      acc.status === 'assigned' ? 'bg-blue-100 text-blue-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {acc.status === 'available' ? '可用' : acc.status === 'assigned' ? '已分配' : '待接受'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-500">{acc.remark || '-'}</td>
                  <td className="py-3 px-4 text-sm text-gray-500">
                    {new Date(acc.created_at).toLocaleString()}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(acc)} className="text-blue-600 hover:text-blue-800" title="编辑">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => deleteAccount(acc.id)} className="text-red-600 hover:text-red-800" title="删除">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}


function AssignmentsView({ assignments, token, onRefresh, showMessage }) {
  const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }

  const cancelAssignment = async (id) => {
    if (!confirm('确定要取消此分配吗？')) return
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/assignments/${id}`, { method: 'DELETE', headers })
      if (res.ok) {
        showMessage('取消成功')
        onRefresh()
      } else {
        const data = await res.json()
        showMessage(data.error || '取消失败', 'error')
      }
    } catch (e) {
      showMessage('取消失败', 'error')
    }
  }

  if (assignments.length === 0) return <div className="text-gray-500 text-center py-8">暂无分配记录</div>

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className="text-left py-3 px-4">ID</th>
            <th className="text-left py-3 px-4">用户</th>
            <th className="text-left py-3 px-4">账号</th>
            <th className="text-left py-3 px-4">状态</th>
            <th className="text-left py-3 px-4">分配时间</th>
            <th className="text-left py-3 px-4">操作</th>
          </tr>
        </thead>
        <tbody>
          {assignments.map(a => (
            <tr key={a.id} className="border-b hover:bg-gray-50">
              <td className="py-3 px-4">{a.id}</td>
              <td className="py-3 px-4">{a.user_email}</td>
              <td className="py-3 px-4">{a.account_email}</td>
              <td className="py-3 px-4">
                <span className={`px-2 py-1 rounded text-xs ${
                  a.status === 'accepted' ? 'bg-green-100 text-green-700' :
                  a.status === 'rejected' ? 'bg-red-100 text-red-700' :
                  'bg-yellow-100 text-yellow-700'
                }`}>
                  {a.status === 'accepted' ? '已接受' : a.status === 'rejected' ? '已拒绝' : '待接受'}
                </span>
              </td>
              <td className="py-3 px-4 text-sm text-gray-500">
                {new Date(a.assigned_at).toLocaleString()}
              </td>
              <td className="py-3 px-4">
                {a.status === 'pending' && (
                  <button onClick={() => cancelAssignment(a.id)} className="text-red-600 hover:text-red-800" title="取消分配">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
