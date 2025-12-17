import { useState, useEffect } from 'react'
import { API_BASE_URL } from '../config'
import { Users, Key, GitBranch, BarChart3, LogOut, Plus, Trash2, RefreshCw } from 'lucide-react'

export default function Dashboard({ admin, token, onLogout }) {
  const [activeTab, setActiveTab] = useState('stats')
  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [accounts, setAccounts] = useState([])
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(false)

  const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }

  useEffect(() => {
    loadData()
  }, [activeTab])

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
      console.error('加载数据失败:', e)
    } finally {
      setLoading(false)
    }
  }

  const deleteUser = async (id) => {
    if (!confirm('确定要删除此用户吗？')) return
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/users/${id}`, { method: 'DELETE', headers })
      if (res.ok) loadData()
    } catch (e) {
      alert('删除失败')
    }
  }

  const deleteAccount = async (id) => {
    if (!confirm('确定要删除此账号吗？')) return
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/accounts/${id}`, { method: 'DELETE', headers })
      if (res.ok) loadData()
    } catch (e) {
      alert('删除失败')
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
      {/* 顶部导航 */}
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

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* 标签页 */}
        <div className="flex gap-2 mb-6">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
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

        {/* 内容区域 */}
        <div className="card">
          {loading ? (
            <div className="text-center py-12 text-gray-500">加载中...</div>
          ) : (
            <>
              {activeTab === 'stats' && <StatsView stats={stats} />}
              {activeTab === 'users' && <UsersView users={users} onDelete={deleteUser} />}
              {activeTab === 'accounts' && <AccountsView accounts={accounts} onDelete={deleteAccount} token={token} onRefresh={loadData} />}
              {activeTab === 'assignments' && <AssignmentsView assignments={assignments} />}
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

function UsersView({ users, onDelete }) {
  if (users.length === 0) return <div className="text-gray-500 text-center py-8">暂无用户</div>

  return (
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
                <button onClick={() => onDelete(user.id)} className="text-red-600 hover:text-red-800">
                  <Trash2 className="w-4 h-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function AccountsView({ accounts, onDelete, token, onRefresh }) {
  const [showAdd, setShowAdd] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [adding, setAdding] = useState(false)

  const addAccount = async () => {
    if (!newEmail) return
    setAdding(true)
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/accounts`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newEmail })
      })
      if (res.ok) {
        setNewEmail('')
        setShowAdd(false)
        onRefresh()
      }
    } catch (e) {
      alert('添加失败')
    } finally {
      setAdding(false)
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-medium">账号列表 ({accounts.length})</h3>
        <button onClick={() => setShowAdd(!showAdd)} className="btn btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> 添加账号
        </button>
      </div>

      {showAdd && (
        <div className="bg-gray-50 p-4 rounded-lg mb-4 flex gap-2">
          <input
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="输入账号邮箱"
            className="input flex-1"
          />
          <button onClick={addAccount} disabled={adding} className="btn btn-primary">
            {adding ? '添加中...' : '添加'}
          </button>
          <button onClick={() => setShowAdd(false)} className="btn btn-secondary">取消</button>
        </div>
      )}

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
                  <td className="py-3 px-4 text-sm text-gray-500">
                    {new Date(acc.created_at).toLocaleString()}
                  </td>
                  <td className="py-3 px-4">
                    <button onClick={() => onDelete(acc.id)} className="text-red-600 hover:text-red-800">
                      <Trash2 className="w-4 h-4" />
                    </button>
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

function AssignmentsView({ assignments }) {
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
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
