import { useState, useEffect, useMemo } from 'react'
import { API_BASE_URL } from '../config'
import {
  Users, Key, GitBranch, BarChart3, LogOut, Plus, Trash2, RefreshCw,
  Edit, Ban, Check, X, Upload, UserPlus, Lock, Search, Download,
  FileText, Settings, Shield, Eye, AlertTriangle, CheckCircle, Clock
} from 'lucide-react'

export default function Dashboard({ admin, token, onLogout }) {
  const [activeTab, setActiveTab] = useState('stats')
  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [accounts, setAccounts] = useState([])
  const [assignments, setAssignments] = useState([])
  const [auditLogs, setAuditLogs] = useState([])
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
        if (res.ok) setStats(data)
      } else if (activeTab === 'users') {
        const res = await fetch(`${API_BASE_URL}/api/admin/users`, { headers })
        const data = await res.json()
        if (res.ok) setUsers(data.users || [])
        loadAccounts()
      } else if (activeTab === 'accounts') {
        const res = await fetch(`${API_BASE_URL}/api/admin/accounts`, { headers })
        const data = await res.json()
        if (res.ok) setAccounts(data.accounts || [])
      } else if (activeTab === 'assignments') {
        const res = await fetch(`${API_BASE_URL}/api/admin/assignments`, { headers })
        const data = await res.json()
        if (res.ok) setAssignments(data.assignments || [])
      } else if (activeTab === 'audit') {
        const res = await fetch(`${API_BASE_URL}/api/admin/audit-logs?limit=200`, { headers })
        const data = await res.json()
        if (res.ok) setAuditLogs(data.logs || [])
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
    { id: 'audit', name: '审计日志', icon: FileText },
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
        <div className={`fixed top-4 right-4 px-4 py-2 rounded-lg shadow-lg z-50 ${message.type === 'error' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}>
          {message.text}
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-2 mb-6 flex-wrap">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === tab.id ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
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
              {activeTab === 'audit' && <AuditLogsView logs={auditLogs} />}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// 统计概览 - 增加图表
function StatsView({ stats }) {
  if (!stats?.stats) return <div className="text-gray-500">暂无数据</div>

  const s = stats.stats
  const items = [
    { label: '用户总数', value: s.userCount, color: 'bg-blue-500', icon: Users },
    { label: '账号总数', value: s.accountCount, color: 'bg-green-500', icon: Key },
    { label: '可用账号', value: s.availableCount, color: 'bg-emerald-500', icon: CheckCircle },
    { label: '已分配', value: s.assignedCount, color: 'bg-orange-500', icon: GitBranch },
    { label: '待接受', value: s.pendingAssignments, color: 'bg-yellow-500', icon: Clock },
    { label: '已接受', value: s.acceptedAssignments, color: 'bg-purple-500', icon: Check },
  ]

  // 账号使用率
  const usageRate = s.accountCount > 0 ? Math.round((s.assignedCount / s.accountCount) * 100) : 0
  const availableRate = s.accountCount > 0 ? Math.round((s.availableCount / s.accountCount) * 100) : 0
  const pendingRate = s.accountCount > 0 ? Math.round(((s.accountCount - s.availableCount - s.assignedCount) / s.accountCount) * 100) : 0

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {items.map(item => (
          <div key={item.label} className="bg-gray-50 rounded-lg p-4 text-center">
            <div className={`w-12 h-12 ${item.color} rounded-full flex items-center justify-center mx-auto mb-2`}>
              <item.icon className="w-6 h-6 text-white" />
            </div>
            <div className="text-2xl font-bold text-gray-800">{item.value}</div>
            <div className="text-gray-600 text-sm">{item.label}</div>
          </div>
        ))}
      </div>

      {/* 账号使用率饼图 */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="font-medium mb-4">账号使用率</h3>
          <div className="flex items-center gap-6">
            <div className="relative w-32 h-32">
              <svg className="w-32 h-32 transform -rotate-90">
                <circle cx="64" cy="64" r="56" stroke="#e5e7eb" strokeWidth="12" fill="none" />
                <circle cx="64" cy="64" r="56" stroke="#10b981" strokeWidth="12" fill="none"
                  strokeDasharray={`${availableRate * 3.52} 352`} />
                <circle cx="64" cy="64" r="56" stroke="#f59e0b" strokeWidth="12" fill="none"
                  strokeDasharray={`${usageRate * 3.52} 352`} strokeDashoffset={`-${availableRate * 3.52}`} />
                <circle cx="64" cy="64" r="56" stroke="#eab308" strokeWidth="12" fill="none"
                  strokeDasharray={`${pendingRate * 3.52} 352`} strokeDashoffset={`-${(availableRate + usageRate) * 3.52}`} />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xl font-bold">{s.accountCount}</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                <span className="text-sm">可用 {s.availableCount} ({availableRate}%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                <span className="text-sm">已分配 {s.assignedCount} ({usageRate}%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span className="text-sm">待接受 {s.pendingAssignments} ({pendingRate}%)</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="font-medium mb-4">快速统计</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">账号利用率</span>
              <span className="font-medium">{usageRate}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${usageRate}%` }}></div>
            </div>
            <div className="flex justify-between items-center mt-4">
              <span className="text-gray-600">分配接受率</span>
              <span className="font-medium">
                {s.acceptedAssignments + s.pendingAssignments > 0 
                  ? Math.round((s.acceptedAssignments / (s.acceptedAssignments + s.pendingAssignments)) * 100) 
                  : 0}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-green-600 h-2 rounded-full" style={{ 
                width: `${s.acceptedAssignments + s.pendingAssignments > 0 
                  ? Math.round((s.acceptedAssignments / (s.acceptedAssignments + s.pendingAssignments)) * 100) 
                  : 0}%` 
              }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


// 用户管理 - 增加搜索、筛选、批量操作、导出、详情
function UsersView({ users, accounts, token, onRefresh, showMessage }) {
  const [showAssign, setShowAssign] = useState(null)
  const [showResetPwd, setShowResetPwd] = useState(null)
  const [showDetail, setShowDetail] = useState(null)
  const [userDetail, setUserDetail] = useState(null)
  const [newPassword, setNewPassword] = useState('')
  const [selectedAccount, setSelectedAccount] = useState('')
  const [selectedUsers, setSelectedUsers] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
  const availableAccounts = accounts?.filter(a => a.status === 'available') || []

  // 筛选用户
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchSearch = !searchTerm || 
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.nickname && user.nickname.toLowerCase().includes(searchTerm.toLowerCase()))
      const matchStatus = !statusFilter || user.status === statusFilter
      return matchSearch && matchStatus
    })
  }, [users, searchTerm, statusFilter])

  const toggleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([])
    } else {
      setSelectedUsers(filteredUsers.map(u => u.id))
    }
  }

  const toggleSelectUser = (id) => {
    setSelectedUsers(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
  }

  const batchDeleteUsers = async () => {
    if (selectedUsers.length === 0) return showMessage('请先选择用户', 'error')
    if (!confirm(`确定删除 ${selectedUsers.length} 个用户？`)) return
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/users/batch-delete`, {
        method: 'POST', headers, body: JSON.stringify({ ids: selectedUsers })
      })
      const data = await res.json()
      if (res.ok) {
        showMessage(data.message)
        setSelectedUsers([])
        onRefresh()
      } else {
        showMessage(data.error || '批量删除失败', 'error')
      }
    } catch (e) {
      showMessage('批量删除失败', 'error')
    }
  }

  const batchUpdateStatus = async (status) => {
    if (selectedUsers.length === 0) return showMessage('请先选择用户', 'error')
    if (!confirm(`确定${status === 'active' ? '启用' : '禁用'} ${selectedUsers.length} 个用户？`)) return
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/users/batch-status`, {
        method: 'POST', headers, body: JSON.stringify({ ids: selectedUsers, status })
      })
      const data = await res.json()
      if (res.ok) {
        showMessage(data.message)
        setSelectedUsers([])
        onRefresh()
      } else {
        showMessage(data.error || '操作失败', 'error')
      }
    } catch (e) {
      showMessage('操作失败', 'error')
    }
  }

  const exportUsers = () => {
    if (filteredUsers.length === 0) {
      return showMessage('没有可导出的数据', 'error')
    }
    const data = filteredUsers.map(u => ({
      ID: u.id,
      邮箱: u.email,
      昵称: u.nickname || '',
      状态: u.status === 'active' ? '正常' : '禁用',
      注册时间: new Date(u.created_at).toLocaleString(),
      最后登录: u.last_login_at ? new Date(u.last_login_at).toLocaleString() : ''
    }))
    const csv = [Object.keys(data[0]).join(','), ...data.map(row => Object.values(row).join(','))].join('\n')
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `users_${new Date().toISOString().slice(0,10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    showMessage('导出成功')
  }

  const viewUserDetail = async (userId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/users/${userId}/detail`, { headers })
      const data = await res.json()
      if (res.ok) {
        setUserDetail(data)
        setShowDetail(userId)
      }
    } catch (e) {
      showMessage('获取详情失败', 'error')
    }
  }

  const toggleStatus = async (user) => {
    const newStatus = user.status === 'active' ? 'inactive' : 'active'
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/users/${user.id}/status`, {
        method: 'PUT', headers, body: JSON.stringify({ status: newStatus })
      })
      if (res.ok) {
        showMessage(`用户已${newStatus === 'active' ? '启用' : '禁用'}`)
        onRefresh()
      }
    } catch (e) {
      showMessage('操作失败', 'error')
    }
  }

  const resetPassword = async () => {
    if (!newPassword || newPassword.length < 6) return showMessage('密码至少6位', 'error')
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/users/${showResetPwd}/reset-password`, {
        method: 'POST', headers, body: JSON.stringify({ newPassword })
      })
      if (res.ok) {
        showMessage('密码已重置')
        setShowResetPwd(null)
        setNewPassword('')
      }
    } catch (e) {
      showMessage('重置失败', 'error')
    }
  }

  const assignAccount = async () => {
    if (!selectedAccount) return showMessage('请选择账号', 'error')
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
      }
    } catch (e) {
      showMessage('分配失败', 'error')
    }
  }

  const deleteUser = async (id) => {
    if (!confirm('确定删除此用户？')) return
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

  return (
    <div>
      {/* 搜索和筛选栏 */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="搜索邮箱或昵称..."
            className="input pl-10 w-full"
          />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input w-32">
          <option value="">全部状态</option>
          <option value="active">正常</option>
          <option value="inactive">禁用</option>
        </select>
        <button onClick={exportUsers} className="btn btn-secondary flex items-center gap-2">
          <Download className="w-4 h-4" /> 导出
        </button>
      </div>

      {/* 批量操作栏 */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-medium">用户列表 ({filteredUsers.length}/{users.length})</h3>
        {selectedUsers.length > 0 && (
          <div className="flex gap-2">
            <button onClick={() => batchUpdateStatus('active')} className="btn btn-secondary flex items-center gap-2">
              <Check className="w-4 h-4" /> 批量启用
            </button>
            <button onClick={() => batchUpdateStatus('inactive')} className="btn btn-secondary flex items-center gap-2">
              <Ban className="w-4 h-4" /> 批量禁用
            </button>
            <button onClick={batchDeleteUsers} className="btn btn-danger flex items-center gap-2">
              <Trash2 className="w-4 h-4" /> 批量删除 ({selectedUsers.length})
            </button>
          </div>
        )}
      </div>

      {/* 用户详情弹窗 */}
      {showDetail && userDetail && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[600px] max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-medium mb-4">用户详情</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><span className="text-gray-500">邮箱：</span>{userDetail.user?.email}</div>
                <div><span className="text-gray-500">昵称：</span>{userDetail.user?.nickname || '-'}</div>
                <div><span className="text-gray-500">状态：</span>{userDetail.user?.status === 'active' ? '正常' : '禁用'}</div>
                <div><span className="text-gray-500">注册时间：</span>{new Date(userDetail.user?.created_at).toLocaleString()}</div>
              </div>
              <div>
                <h4 className="font-medium mb-2">分配历史 ({userDetail.assignments?.length || 0})</h4>
                {userDetail.assignments?.length > 0 ? (
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {userDetail.assignments.map(a => (
                      <div key={a.id} className="flex justify-between text-sm bg-gray-50 p-2 rounded">
                        <span>{a.account_email}</span>
                        <span className={a.status === 'accepted' ? 'text-green-600' : a.status === 'rejected' ? 'text-red-600' : 'text-yellow-600'}>
                          {a.status === 'accepted' ? '已接受' : a.status === 'rejected' ? '已拒绝' : '待接受'}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-gray-500 text-sm">暂无分配记录</p>}
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <button onClick={() => setShowDetail(null)} className="btn btn-secondary">关闭</button>
            </div>
          </div>
        </div>
      )}

      {/* 重置密码弹窗 */}
      {showResetPwd && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-medium mb-4">重置密码</h3>
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
              placeholder="输入新密码（至少6位）" className="input w-full mb-4" />
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
              <select value={selectedAccount} onChange={(e) => setSelectedAccount(e.target.value)} className="input w-full mb-4">
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

      {filteredUsers.length === 0 ? (
        <div className="text-gray-500 text-center py-8">暂无用户</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4">
                  <input type="checkbox" checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                    onChange={toggleSelectAll} className="w-4 h-4 rounded border-gray-300" />
                </th>
                <th className="text-left py-3 px-4">ID</th>
                <th className="text-left py-3 px-4">邮箱</th>
                <th className="text-left py-3 px-4">昵称</th>
                <th className="text-left py-3 px-4">状态</th>
                <th className="text-left py-3 px-4">注册时间</th>
                <th className="text-left py-3 px-4">操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(user => (
                <tr key={user.id} className={`border-b hover:bg-gray-50 ${selectedUsers.includes(user.id) ? 'bg-blue-50' : ''}`}>
                  <td className="py-3 px-4">
                    <input type="checkbox" checked={selectedUsers.includes(user.id)}
                      onChange={() => toggleSelectUser(user.id)} className="w-4 h-4 rounded border-gray-300" />
                  </td>
                  <td className="py-3 px-4">{user.id}</td>
                  <td className="py-3 px-4">{user.email}</td>
                  <td className="py-3 px-4">{user.nickname || '-'}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded text-xs ${user.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {user.status === 'active' ? '正常' : '禁用'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-500">{new Date(user.created_at).toLocaleString()}</td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      <button onClick={() => viewUserDetail(user.id)} className="text-gray-600 hover:text-gray-800" title="查看详情">
                        <Eye className="w-4 h-4" />
                      </button>
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
      )}
    </div>
  )
}


// 账号池 - 增加搜索、筛选、批量操作、导出、过期提醒
function AccountsView({ accounts, token, onRefresh, showMessage }) {
  const [showAdd, setShowAdd] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [showEdit, setShowEdit] = useState(null)
  const [newAccount, setNewAccount] = useState({ email: '', remark: '' })
  const [editAccount, setEditAccount] = useState({})
  const [importJson, setImportJson] = useState('')
  const [processing, setProcessing] = useState(false)
  const [selectedAccounts, setSelectedAccounts] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }

  // 检查账号是否即将过期（7天内）
  const isExpiringSoon = (expiresAt) => {
    if (!expiresAt) return false
    const expDate = new Date(expiresAt)
    const now = new Date()
    const diffDays = (expDate - now) / (1000 * 60 * 60 * 24)
    return diffDays > 0 && diffDays <= 7
  }

  const isExpired = (expiresAt) => {
    if (!expiresAt) return false
    return new Date(expiresAt) < new Date()
  }

  // 筛选账号
  const filteredAccounts = useMemo(() => {
    return accounts.filter(acc => {
      const matchSearch = !searchTerm || acc.email.toLowerCase().includes(searchTerm.toLowerCase())
      const matchStatus = !statusFilter || acc.status === statusFilter
      return matchSearch && matchStatus
    })
  }, [accounts, searchTerm, statusFilter])

  const toggleSelectAll = () => {
    if (selectedAccounts.length === filteredAccounts.length) {
      setSelectedAccounts([])
    } else {
      setSelectedAccounts(filteredAccounts.map(a => a.id))
    }
  }

  const toggleSelectAccount = (id) => {
    setSelectedAccounts(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
  }

  const batchDeleteAccounts = async () => {
    if (selectedAccounts.length === 0) return showMessage('请先选择账号', 'error')
    if (!confirm(`确定删除 ${selectedAccounts.length} 个账号？`)) return
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/accounts/batch-delete`, {
        method: 'POST', headers, body: JSON.stringify({ ids: selectedAccounts })
      })
      const data = await res.json()
      if (res.ok) {
        showMessage(data.message)
        setSelectedAccounts([])
        onRefresh()
      } else {
        showMessage(data.error || '批量删除失败', 'error')
      }
    } catch (e) {
      showMessage('批量删除失败', 'error')
    }
  }

  const batchUpdateStatus = async (status) => {
    if (selectedAccounts.length === 0) return showMessage('请先选择账号', 'error')
    if (!confirm(`确定将 ${selectedAccounts.length} 个账号状态改为${status === 'available' ? '可用' : status === 'assigned' ? '已分配' : '待接受'}？`)) return
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/accounts/batch-status`, {
        method: 'POST', headers, body: JSON.stringify({ ids: selectedAccounts, status })
      })
      const data = await res.json()
      if (res.ok) {
        showMessage(data.message)
        setSelectedAccounts([])
        onRefresh()
      } else {
        showMessage(data.error || '操作失败', 'error')
      }
    } catch (e) {
      showMessage('操作失败', 'error')
    }
  }

  const exportAccounts = () => {
    if (filteredAccounts.length === 0) {
      return showMessage('没有可导出的数据', 'error')
    }
    const data = filteredAccounts.map(a => ({
      ID: a.id,
      邮箱: a.email,
      状态: a.status === 'available' ? '可用' : a.status === 'assigned' ? '已分配' : '待接受',
      备注: a.remark || '',
      创建时间: new Date(a.created_at).toLocaleString(),
      过期时间: a.expires_at ? new Date(a.expires_at).toLocaleString() : ''
    }))
    const csv = [Object.keys(data[0]).join(','), ...data.map(row => Object.values(row).join(','))].join('\n')
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `accounts_${new Date().toISOString().slice(0,10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    showMessage('导出成功')
  }

  const addAccount = async () => {
    if (!newAccount.email) return showMessage('请输入邮箱', 'error')
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
    if (!importJson.trim()) return showMessage('请输入JSON数据', 'error')
    let accs
    try {
      accs = JSON.parse(importJson)
      if (!Array.isArray(accs)) accs = [accs]
    } catch (e) {
      return showMessage('JSON格式错误', 'error')
    }
    setProcessing(true)
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/accounts/import`, {
        method: 'POST', headers, body: JSON.stringify({ accounts: accs })
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
    if (!confirm('确定删除此账号？')) return
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

  // 统计即将过期和已过期的账号
  const expiringCount = accounts.filter(a => isExpiringSoon(a.expires_at)).length
  const expiredCount = accounts.filter(a => isExpired(a.expires_at)).length

  return (
    <div>
      {/* 搜索和筛选栏 */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="搜索邮箱..." className="input pl-10 w-full" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input w-32">
          <option value="">全部状态</option>
          <option value="available">可用</option>
          <option value="assigned">已分配</option>
          <option value="pending">待接受</option>
        </select>
        <button onClick={exportAccounts} className="btn btn-secondary flex items-center gap-2">
          <Download className="w-4 h-4" /> 导出
        </button>
      </div>

      {/* 操作栏 */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-medium">账号列表 ({filteredAccounts.length}/{accounts.length})</h3>
        <div className="flex gap-2">
          {selectedAccounts.length > 0 && (
            <>
              <select onChange={(e) => e.target.value && batchUpdateStatus(e.target.value)} className="input w-36" defaultValue="">
                <option value="" disabled>批量改状态</option>
                <option value="available">设为可用</option>
                <option value="assigned">设为已分配</option>
                <option value="pending">设为待接受</option>
              </select>
              <button onClick={batchDeleteAccounts} className="btn btn-danger flex items-center gap-2">
                <Trash2 className="w-4 h-4" /> 批量删除 ({selectedAccounts.length})
              </button>
            </>
          )}
          <button onClick={() => setShowImport(true)} className="btn btn-secondary flex items-center gap-2">
            <Upload className="w-4 h-4" /> 批量导入
          </button>
          <button onClick={() => setShowAdd(true)} className="btn btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> 添加账号
          </button>
        </div>
      </div>

      {/* 添加账号弹窗 */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[500px]">
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
          <div className="bg-white rounded-lg p-6 w-[600px]">
            <h3 className="text-lg font-medium mb-4">批量导入账号</h3>
            <p className="text-sm text-gray-500 mb-2">JSON格式：[{`{"email":"xxx@example.com","remark":"备注"}`}]</p>
            <textarea value={importJson} onChange={(e) => setImportJson(e.target.value)}
              placeholder='粘贴JSON数组...' className="input w-full h-48 font-mono text-sm" />
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
          <div className="bg-white rounded-lg p-6 w-[500px]">
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

      {filteredAccounts.length === 0 ? (
        <div className="text-gray-500 text-center py-8">暂无账号</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4">
                  <input type="checkbox" checked={selectedAccounts.length === filteredAccounts.length && filteredAccounts.length > 0}
                    onChange={toggleSelectAll} className="w-4 h-4 rounded border-gray-300" />
                </th>
                <th className="text-left py-3 px-4">ID</th>
                <th className="text-left py-3 px-4">邮箱</th>
                <th className="text-left py-3 px-4">状态</th>
                <th className="text-left py-3 px-4">备注</th>
                <th className="text-left py-3 px-4">创建时间</th>
                <th className="text-left py-3 px-4">操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredAccounts.map(acc => (
                <tr key={acc.id} className={`border-b hover:bg-gray-50 ${selectedAccounts.includes(acc.id) ? 'bg-blue-50' : ''}`}>
                  <td className="py-3 px-4">
                    <input type="checkbox" checked={selectedAccounts.includes(acc.id)}
                      onChange={() => toggleSelectAccount(acc.id)} className="w-4 h-4 rounded border-gray-300" />
                  </td>
                  <td className="py-3 px-4">{acc.id}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      {acc.email}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded text-xs ${acc.status === 'available' ? 'bg-green-100 text-green-700' : acc.status === 'assigned' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {acc.status === 'available' ? '可用' : acc.status === 'assigned' ? '已分配' : '待接受'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-500">{acc.remark || '-'}</td>
                  <td className="py-3 px-4 text-sm text-gray-500">{new Date(acc.created_at).toLocaleString()}</td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      <button onClick={() => { setEditAccount({...acc}); setShowEdit(acc.id) }} className="text-blue-600 hover:text-blue-800" title="编辑">
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


// 分配记录 - 增加筛选、批量取消
function AssignmentsView({ assignments, token, onRefresh, showMessage }) {
  const [selectedAssignments, setSelectedAssignments] = useState([])
  const [statusFilter, setStatusFilter] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }

  const filteredAssignments = useMemo(() => {
    return assignments.filter(a => {
      const matchSearch = !searchTerm || 
        a.user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.account_email.toLowerCase().includes(searchTerm.toLowerCase())
      const matchStatus = !statusFilter || a.status === statusFilter
      return matchSearch && matchStatus
    })
  }, [assignments, searchTerm, statusFilter])

  const pendingAssignments = filteredAssignments.filter(a => a.status === 'pending')

  const toggleSelectAll = () => {
    if (selectedAssignments.length === pendingAssignments.length) {
      setSelectedAssignments([])
    } else {
      setSelectedAssignments(pendingAssignments.map(a => a.id))
    }
  }

  const toggleSelect = (id) => {
    setSelectedAssignments(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
  }

  const cancelAssignment = async (id) => {
    if (!confirm('确定取消此分配？')) return
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

  const batchCancelAssignments = async () => {
    if (selectedAssignments.length === 0) return showMessage('请先选择分配记录', 'error')
    if (!confirm(`确定取消 ${selectedAssignments.length} 个分配？`)) return
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/assignments/batch-cancel`, {
        method: 'POST', headers, body: JSON.stringify({ ids: selectedAssignments })
      })
      const data = await res.json()
      if (res.ok) {
        showMessage(data.message)
        setSelectedAssignments([])
        onRefresh()
      } else {
        showMessage(data.error || '批量取消失败', 'error')
      }
    } catch (e) {
      showMessage('批量取消失败', 'error')
    }
  }

  // 统计
  const statusCounts = {
    pending: assignments.filter(a => a.status === 'pending').length,
    accepted: assignments.filter(a => a.status === 'accepted').length,
    rejected: assignments.filter(a => a.status === 'rejected').length
  }

  return (
    <div>
      {/* 统计卡片 */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="bg-yellow-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-yellow-600">{statusCounts.pending}</div>
          <div className="text-sm text-yellow-700">待接受</div>
        </div>
        <div className="bg-green-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-green-600">{statusCounts.accepted}</div>
          <div className="text-sm text-green-700">已接受</div>
        </div>
        <div className="bg-red-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-red-600">{statusCounts.rejected}</div>
          <div className="text-sm text-red-700">已拒绝</div>
        </div>
      </div>

      {/* 搜索和筛选 */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="搜索用户或账号..." className="input pl-10 w-full" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input w-32">
          <option value="">全部状态</option>
          <option value="pending">待接受</option>
          <option value="accepted">已接受</option>
          <option value="rejected">已拒绝</option>
        </select>
        {selectedAssignments.length > 0 && (
          <button onClick={batchCancelAssignments} className="btn btn-danger flex items-center gap-2">
            <X className="w-4 h-4" /> 批量取消 ({selectedAssignments.length})
          </button>
        )}
      </div>

      {filteredAssignments.length === 0 ? (
        <div className="text-gray-500 text-center py-8">暂无分配记录</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4">
                  <input type="checkbox" 
                    checked={selectedAssignments.length === pendingAssignments.length && pendingAssignments.length > 0}
                    onChange={toggleSelectAll} className="w-4 h-4 rounded border-gray-300" />
                </th>
                <th className="text-left py-3 px-4">ID</th>
                <th className="text-left py-3 px-4">用户</th>
                <th className="text-left py-3 px-4">账号</th>
                <th className="text-left py-3 px-4">状态</th>
                <th className="text-left py-3 px-4">分配时间</th>
                <th className="text-left py-3 px-4">操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredAssignments.map(a => (
                <tr key={a.id} className={`border-b hover:bg-gray-50 ${selectedAssignments.includes(a.id) ? 'bg-blue-50' : ''}`}>
                  <td className="py-3 px-4">
                    {a.status === 'pending' && (
                      <input type="checkbox" checked={selectedAssignments.includes(a.id)}
                        onChange={() => toggleSelect(a.id)} className="w-4 h-4 rounded border-gray-300" />
                    )}
                  </td>
                  <td className="py-3 px-4">{a.id}</td>
                  <td className="py-3 px-4">{a.user_email}</td>
                  <td className="py-3 px-4">{a.account_email}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded text-xs ${a.status === 'accepted' ? 'bg-green-100 text-green-700' : a.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {a.status === 'accepted' ? '已接受' : a.status === 'rejected' ? '已拒绝' : '待接受'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-500">{new Date(a.assigned_at).toLocaleString()}</td>
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
      )}
    </div>
  )
}

// 审计日志
function AuditLogsView({ logs }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [actionFilter, setActionFilter] = useState('')

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchSearch = !searchTerm || 
        log.admin_username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action.toLowerCase().includes(searchTerm.toLowerCase())
      const matchAction = !actionFilter || log.action.includes(actionFilter)
      return matchSearch && matchAction
    })
  }, [logs, searchTerm, actionFilter])

  const actionLabels = {
    'add_account': '添加账号',
    'delete_account': '删除账号',
    'batch_delete_accounts': '批量删除账号',
    'delete_user': '删除用户',
    'batch_delete_users': '批量删除用户',
    'update_user_status': '更新用户状态',
    'reset_user_password': '重置用户密码',
    'assign_account': '分配账号',
    'delete_assignment': '取消分配',
    'update_settings': '更新设置'
  }

  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="搜索管理员或操作..." className="input pl-10 w-full" />
        </div>
        <select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)} className="input w-40">
          <option value="">全部操作</option>
          <option value="account">账号相关</option>
          <option value="user">用户相关</option>
          <option value="assignment">分配相关</option>
          <option value="settings">设置相关</option>
        </select>
      </div>

      {filteredLogs.length === 0 ? (
        <div className="text-gray-500 text-center py-8">暂无日志</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4">时间</th>
                <th className="text-left py-3 px-4">管理员</th>
                <th className="text-left py-3 px-4">操作</th>
                <th className="text-left py-3 px-4">目标</th>
                <th className="text-left py-3 px-4">详情</th>
                <th className="text-left py-3 px-4">IP</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map(log => (
                <tr key={log.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm text-gray-500">{new Date(log.created_at).toLocaleString()}</td>
                  <td className="py-3 px-4">{log.admin_username}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                      {actionLabels[log.action] || log.action}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm">
                    {log.target_type && <span className="text-gray-500">{log.target_type} #{log.target_id}</span>}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-500 max-w-xs truncate">
                    {log.details ? JSON.stringify(log.details) : '-'}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-500">{log.ip_address}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// 系统设置
function SettingsView({ token, showMessage, onRefresh }) {
  const [settings, setSettings] = useState({
    allowRegistration: true,
    requireInviteCode: false,
    inviteCodes: '',
    maxAssignmentsPerUser: 1,
    autoApproveAssignment: false
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/settings`, { headers })
      const data = await res.json()
      if (res.ok && data.settings) {
        setSettings(data.settings)
      }
    } catch (e) {
      console.error('加载设置失败:', e)
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = async () => {
    setSaving(true)
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/settings`, {
        method: 'PUT', headers, body: JSON.stringify(settings)
      })
      if (res.ok) {
        showMessage('设置已保存')
      } else {
        const data = await res.json()
        showMessage(data.error || '保存失败', 'error')
      }
    } catch (e) {
      showMessage('保存失败', 'error')
    } finally {
      setSaving(false)
    }
  }

  const exportData = async (type) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/export/${type}`, { headers })
      const data = await res.json()
      if (res.ok) {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${type}_backup_${new Date().toISOString().slice(0,10)}.json`
        a.click()
        URL.revokeObjectURL(url)
        showMessage('导出成功')
      }
    } catch (e) {
      showMessage('导出失败', 'error')
    }
  }

  if (loading) return <div className="text-center py-8 text-gray-500">加载中...</div>

  return (
    <div className="space-y-6">
      {/* 注册设置 */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="font-medium mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5" /> 注册设置
        </h3>
        <div className="space-y-4">
          <label className="flex items-center gap-3">
            <input type="checkbox" checked={settings.allowRegistration}
              onChange={(e) => setSettings({...settings, allowRegistration: e.target.checked})}
              className="w-4 h-4 rounded" />
            <span>允许新用户注册</span>
          </label>
          <label className="flex items-center gap-3">
            <input type="checkbox" checked={settings.requireInviteCode}
              onChange={(e) => setSettings({...settings, requireInviteCode: e.target.checked})}
              className="w-4 h-4 rounded" />
            <span>注册需要邀请码</span>
          </label>
          {settings.requireInviteCode && (
            <div>
              <label className="text-sm text-gray-600 block mb-1">邀请码（每行一个）</label>
              <textarea value={settings.inviteCodes}
                onChange={(e) => setSettings({...settings, inviteCodes: e.target.value})}
                className="input w-full h-24 font-mono text-sm" placeholder="CODE001&#10;CODE002&#10;CODE003" />
            </div>
          )}
        </div>
      </div>

      {/* 分配设置 */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="font-medium mb-4 flex items-center gap-2">
          <GitBranch className="w-5 h-5" /> 分配设置
        </h3>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-600 block mb-1">每用户最大分配数</label>
            <input type="number" min="1" max="10" value={settings.maxAssignmentsPerUser}
              onChange={(e) => setSettings({...settings, maxAssignmentsPerUser: parseInt(e.target.value) || 1})}
              className="input w-32" />
          </div>
          <label className="flex items-center gap-3">
            <input type="checkbox" checked={settings.autoApproveAssignment}
              onChange={(e) => setSettings({...settings, autoApproveAssignment: e.target.checked})}
              className="w-4 h-4 rounded" />
            <span>自动批准分配（跳过用户确认）</span>
          </label>
        </div>
      </div>

      {/* 数据备份 */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="font-medium mb-4 flex items-center gap-2">
          <Download className="w-5 h-5" /> 数据备份
        </h3>
        <div className="flex gap-3">
          <button onClick={() => exportData('users')} className="btn btn-secondary">导出用户数据</button>
          <button onClick={() => exportData('accounts')} className="btn btn-secondary">导出账号数据</button>
          <button onClick={() => exportData('all')} className="btn btn-secondary">导出全部数据</button>
        </div>
      </div>

      <div className="flex justify-end">
        <button onClick={saveSettings} disabled={saving} className="btn btn-primary">
          {saving ? '保存中...' : '保存设置'}
        </button>
      </div>
    </div>
  )
}
