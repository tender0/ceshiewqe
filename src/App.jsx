import { useState, useEffect, useRef } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'
import Sidebar from './components/Sidebar'
import Home from './components/Home'
import AccountManager from './components/AccountManager/index'
import KiroConfig from './components/KiroConfig/index'
import AuthCallback from './components/AuthCallback'
import Auth from './components/Auth/index'
import AdminLogin from './components/AdminPanel/AdminLogin'
import AdminPanel from './components/AdminPanel/index'
import UserAssignments from './components/UserAssignments/index'

import { useTheme } from './contexts/ThemeContext'

// API 基础 URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.tender12321.com'

// 默认自动刷新间隔：50分钟
const DEFAULT_REFRESH_INTERVAL = 50 * 60 * 1000

function App() {
  const [user, setUser] = useState(null)
  const [admin, setAdmin] = useState(null)
  const [authToken, setAuthToken] = useState(null)
  const [adminToken, setAdminToken] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeMenu, setActiveMenu] = useState('home')
  const [isAdminMode, setIsAdminMode] = useState(false)
  const { colors } = useTheme()
  const refreshTimerRef = useRef(null)

  // 启动时只刷新 token（不获取 usage，快速启动）
  const refreshExpiredTokensOnly = async () => {
    try {
      const settings = await invoke('get_app_settings').catch(() => ({}))
      if (!settings.autoRefresh) return
      
      const accounts = await invoke('get_accounts')
      if (!accounts || accounts.length === 0) return
      
      const now = new Date()
      const refreshThreshold = 5 * 60 * 1000 // 提前 5 分钟
      
      const expiredAccounts = accounts.filter(acc => {
        // 跳过已封禁账号
        if (acc.status === '已封禁' || acc.status === '封禁') return false
        if (!acc.expiresAt) return false
        const expiresAt = new Date(acc.expiresAt.replace(/\//g, '-'))
        return (expiresAt.getTime() - now.getTime()) < refreshThreshold
      })
      
      if (expiredAccounts.length === 0) {
        console.log('[AutoRefresh] 没有需要刷新的 token')
        return
      }
      
      console.log(`[AutoRefresh] 刷新 ${expiredAccounts.length} 个过期 token...`)
      
      // 并发刷新
      await Promise.allSettled(
        expiredAccounts.map(async (account) => {
          try {
            await invoke('refresh_account_token', { id: account.id })
            console.log(`[AutoRefresh] ${account.email} token 刷新成功`)
          } catch (e) {
            console.warn(`[AutoRefresh] ${account.email} token 刷新失败:`, e)
          }
        })
      )
      
      console.log('[AutoRefresh] token 刷新完成')
    } catch (e) {
      console.error('[AutoRefresh] 刷新失败:', e)
    }
  }

  // 定时刷新：只刷新 token
  const checkAndRefreshExpiringTokens = async () => {
    try {
      const settings = await invoke('get_app_settings').catch(() => ({}))
      if (!settings.autoRefresh) return
      
      const accounts = await invoke('get_accounts')
      if (!accounts || accounts.length === 0) return
      
      const now = new Date()
      const refreshThreshold = 5 * 60 * 1000
      
      const expiredAccounts = accounts.filter(acc => {
        // 跳过已封禁账号
        if (acc.status === '已封禁' || acc.status === '封禁') return false
        if (!acc.expiresAt) return false
        const expiresAt = new Date(acc.expiresAt.replace(/\//g, '-'))
        return (expiresAt.getTime() - now.getTime()) < refreshThreshold
      })
      
      if (expiredAccounts.length === 0) {
        console.log('[AutoRefresh] 没有需要刷新的 token')
        return
      }
      
      console.log(`[AutoRefresh] 刷新 ${expiredAccounts.length} 个 token...`)
      
      await Promise.allSettled(
        expiredAccounts.map(async (account) => {
          try {
            await invoke('refresh_account_token', { id: account.id })
            console.log(`[AutoRefresh] ${account.email} token 刷新成功`)
          } catch (e) {
            console.warn(`[AutoRefresh] ${account.email} token 刷新失败:`, e)
          }
        })
      )
      
      console.log('[AutoRefresh] token 刷新完成')
    } catch (e) {
      console.error('[AutoRefresh] 刷新失败:', e)
    }
  }

  // 启动自动刷新定时器
  const startAutoRefreshTimer = async () => {
    if (refreshTimerRef.current) {
      clearInterval(refreshTimerRef.current)
    }
    
    // 启动时只刷新 token（快速启动）
    refreshExpiredTokensOnly()
    
    // 从设置读取刷新间隔
    const settings = await invoke('get_app_settings').catch(() => ({}))
    const intervalMs = (settings.autoRefreshInterval || 50) * 60 * 1000
    
    console.log(`[AutoRefresh] 定时器间隔: ${settings.autoRefreshInterval || 50} 分钟`)
    refreshTimerRef.current = setInterval(checkAndRefreshExpiringTokens, intervalMs)
  }

  useEffect(() => {
    // 检查本地存储的认证信息
    const storedToken = localStorage.getItem('auth_token')
    const storedUser = localStorage.getItem('user')
    const storedAdminToken = localStorage.getItem('admin_token')
    const storedAdmin = localStorage.getItem('admin')

    if (storedToken && storedUser) {
      setAuthToken(storedToken)
      setUser(JSON.parse(storedUser))
    }

    if (storedAdminToken && storedAdmin) {
      setAdminToken(storedAdminToken)
      setAdmin(JSON.parse(storedAdmin))
      setIsAdminMode(true)
    }

    checkAuth()
    
    // 检查是否是回调页面
    const url = new URL(window.location.href)
    if (url.pathname === '/callback' && (url.searchParams.has('code') || url.searchParams.has('state'))) {
      setActiveMenu('callback')
      return
    }
    
    // 监听登录成功事件
    const unlisten = listen('login-success', (event) => {
      console.log('Login success in App:', event.payload)
      checkAuth()
      setActiveMenu('token')
    })
    
    // 监听设置变化，重启定时器
    const unlistenSettings = listen('settings-changed', () => {
      console.log('[AutoRefresh] 设置已变化，重启定时器')
      startAutoRefreshTimer()
    })
    
    // 启动自动刷新定时器
    startAutoRefreshTimer()
    
    return () => { 
      unlisten.then(fn => fn())
      unlistenSettings.then(fn => fn())
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current)
      }
    }
  }, [])

  const checkAuth = async () => {
    try {
      const currentUser = await invoke('get_current_user')
      setUser(currentUser)
    } catch (e) {
      console.error('Auth check failed:', e)
    } finally {
      setLoading(false)
    }
  }

  const handleUserAuth = (loggedInUser, token) => {
    setUser(loggedInUser)
    setAuthToken(token)
    localStorage.setItem('auth_token', token)
    localStorage.setItem('user', JSON.stringify(loggedInUser))
    setLoading(false)
  }

  const handleAdminAuth = (loggedInAdmin, token) => {
    setAdmin(loggedInAdmin)
    setAdminToken(token)
    setIsAdminMode(true)
    localStorage.setItem('admin_token', token)
    localStorage.setItem('admin', JSON.stringify(loggedInAdmin))
  }

  const handleUserLogout = async () => {
    await invoke('logout').catch(() => {})
    setUser(null)
    setAuthToken(null)
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user')
  }

  const handleAdminLogout = () => {
    setAdmin(null)
    setAdminToken(null)
    setIsAdminMode(false)
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin')
  }

  const renderContent = () => {
    switch (activeMenu) {
      case 'home': return <Home onNavigate={setActiveMenu} />
      case 'token': return <AccountManager />
      case 'assignments': return <UserAssignments apiBaseUrl={API_BASE_URL} token={authToken} />
      case 'kiro-config': return <KiroConfig />
      case 'callback': return <AuthCallback />
      default: return <Home />
    }
  }

  // 如果未登录，显示登录页面
  if (!user && !admin && !loading) {
    // 检查是否是管理员模式（通过 URL 参数或特殊路径）
    const url = new URL(window.location.href)
    const isAdminPath = url.searchParams.get('admin') === 'true' || url.pathname.includes('/admin')
    
    if (isAdminPath) {
      return <AdminLogin onLogin={handleAdminAuth} apiBaseUrl={API_BASE_URL} />
    }
    
    return <Auth onAuthSuccess={handleUserAuth} apiBaseUrl={API_BASE_URL} />
  }

  // 管理员模式
  if (isAdminMode && admin && adminToken) {
    return <AdminPanel apiBaseUrl={API_BASE_URL} token={adminToken} onLogout={handleAdminLogout} />
  }

  if (loading) {
    return (
      <div className="h-screen bg-[#0d0d0d] flex items-center justify-center">
        <div className="text-white">加载中...</div>
      </div>
    )
  }

  return (
    <div className={`flex h-screen ${colors.main}`}>
      <Sidebar 
        activeMenu={activeMenu} 
        onMenuChange={setActiveMenu}
        user={user}
        onLogout={handleUserLogout}
        apiBaseUrl={API_BASE_URL}
        authToken={authToken}
      />
      <main className="flex-1 overflow-hidden">
        {renderContent()}
      </main>
    </div>
  )
}

export default App
