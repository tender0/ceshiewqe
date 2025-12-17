import express from 'express'
import bcrypt from 'bcryptjs'
import db from '../db/index.js'
import { authAdmin } from '../middleware/auth.js'

const router = express.Router()

// 所有路由需要管理员认证
router.use(authAdmin)

// 审计日志记录函数
async function logAdminAction(req, action, targetType = null, targetId = null, details = null) {
  try {
    const ip = req.ip || req.connection?.remoteAddress || 'unknown'
    await db.prepare(`
      INSERT INTO admin_audit_logs (admin_id, admin_username, action, target_type, target_id, details, ip_address)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(req.admin.id, req.admin.username, action, targetType, targetId, details ? JSON.stringify(details) : null, ip)
  } catch (e) {
    console.error('Failed to log admin action:', e)
  }
}

// 获取所有用户列表
router.get('/users', async (req, res) => {
  try {
    const users = await db.prepare(`
      SELECT 
        u.id,
        u.email,
        u.nickname,
        u.status,
        u.created_at,
        u.last_login_at,
        COUNT(DISTINCT a.id) as assignment_count,
        COUNT(DISTINCT CASE WHEN a.status = 'accepted' THEN a.id END) as accepted_count
      FROM users u
      LEFT JOIN assignments a ON u.id = a.user_id
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `).all()
    
    res.json({ users })
  } catch (error) {
    console.error('Get users error:', error)
    res.status(500).json({ error: '获取用户列表失败' })
  }
})

// 获取账号池列表
router.get('/accounts', async (req, res) => {
  try {
    const { status, provider } = req.query
    let query = 'SELECT * FROM kiro_accounts WHERE 1=1'
    const params = []
    
    if (status) {
      query += ' AND status = ?'
      params.push(status)
    }
    
    if (provider) {
      query += ' AND provider = ?'
      params.push(provider)
    }
    
    query += ' ORDER BY created_at DESC'
    
    const accounts = await db.prepare(query).all(...params)
    res.json({ accounts })
  } catch (error) {
    console.error('Get accounts error:', error)
    res.status(500).json({ error: '获取账号列表失败' })
  }
})

// 批量导入账号（JSON）
router.post('/accounts/import', async (req, res) => {
  try {
    const { accounts } = req.body
    
    if (!Array.isArray(accounts) || accounts.length === 0) {
      return res.status(400).json({ error: '请提供账号数组' })
    }
    
    let successCount = 0
    let failCount = 0
    const errors = []
    
    for (const account of accounts) {
      try {
        if (!account.email) {
          failCount++
          errors.push({ email: account.email || 'unknown', error: '邮箱不能为空' })
          continue
        }
        
        await db.prepare(`
          INSERT INTO kiro_accounts (
            email, provider, access_token, refresh_token, profile_arn, expires_at, status, remark,
            client_id_hash, region, client_id, client_secret, sso_session_id, id_token
          )
          VALUES (?, ?, ?, ?, ?, ?, 'available', ?, ?, ?, ?, ?, ?, ?)
        `).run(
          account.email,
          account.provider || null,
          account.access_token || account.accessToken || null,
          account.refresh_token || account.refreshToken || null,
          account.profile_arn || account.profileArn || null,
          account.expires_at || account.expiresAt || null,
          account.remark || null,
          account.client_id_hash || account.clientIdHash || null,
          account.region || null,
          account.client_id || account.clientId || null,
          account.client_secret || account.clientSecret || null,
          account.sso_session_id || account.ssoSessionId || null,
          account.id_token || account.idToken || null
        )
        successCount++
      } catch (e) {
        failCount++
        errors.push({ email: account.email, error: e.message })
      }
    }
    
    res.json({
      message: `导入完成：成功 ${successCount} 个，失败 ${failCount} 个`,
      successCount,
      failCount,
      errors: errors.length > 0 ? errors : undefined
    })
  } catch (error) {
    console.error('Import accounts error:', error)
    res.status(500).json({ error: '导入失败' })
  }
})

// 添加账号到账号池
router.post('/accounts', async (req, res) => {
  try {
    const { 
      email, provider, access_token, refresh_token, profile_arn, expires_at, remark,
      client_id_hash, region, client_id, client_secret, sso_session_id, id_token
    } = req.body
    
    if (!email) {
      return res.status(400).json({ error: '邮箱不能为空' })
    }
    
    const result = await db.prepare(`
      INSERT INTO kiro_accounts (
        email, provider, access_token, refresh_token, profile_arn, expires_at, status, remark,
        client_id_hash, region, client_id, client_secret, sso_session_id, id_token
      )
      VALUES (?, ?, ?, ?, ?, ?, 'available', ?, ?, ?, ?, ?, ?, ?)
    `).run(
      email, provider || null, access_token || null, refresh_token || null, 
      profile_arn || null, expires_at || null, remark || null,
      client_id_hash || null, region || null, client_id || null, 
      client_secret || null, sso_session_id || null, id_token || null
    )
    
    const account = await db.prepare('SELECT * FROM kiro_accounts WHERE id = ?').get(result.lastInsertRowid)
    await logAdminAction(req, 'add_account', 'account', result.lastInsertRowid, { email })
    res.json({ account, message: '添加成功' })
  } catch (error) {
    console.error('Add account error:', error)
    res.status(500).json({ error: '添加账号失败' })
  }
})

// 更新账号
router.put('/accounts/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { 
      email, provider, access_token, refresh_token, profile_arn, expires_at, status, remark,
      client_id_hash, region, client_id, client_secret, sso_session_id, id_token
    } = req.body
    
    await db.prepare(`
      UPDATE kiro_accounts 
      SET email = ?, provider = ?, access_token = ?, refresh_token = ?, 
          profile_arn = ?, expires_at = ?, status = ?, remark = ?,
          client_id_hash = ?, region = ?, client_id = ?, client_secret = ?,
          sso_session_id = ?, id_token = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      email, provider, access_token, refresh_token, profile_arn, expires_at, status, remark,
      client_id_hash, region, client_id, client_secret, sso_session_id, id_token, id
    )
    
    const account = await db.prepare('SELECT * FROM kiro_accounts WHERE id = ?').get(id)
    res.json({ account, message: '更新成功' })
  } catch (error) {
    console.error('Update account error:', error)
    res.status(500).json({ error: '更新账号失败' })
  }
})

// 删除账号
router.delete('/accounts/:id', async (req, res) => {
  try {
    const { id } = req.params
    
    // 检查是否有未完成的分配
    const assignment = await db.prepare('SELECT id FROM assignments WHERE account_id = ? AND status = "pending"').get(id)
    if (assignment) {
      return res.status(400).json({ error: '该账号有待处理的分配，无法删除' })
    }
    
    await db.prepare('DELETE FROM kiro_accounts WHERE id = ?').run(id)
    await logAdminAction(req, 'delete_account', 'account', parseInt(id))
    res.json({ message: '删除成功' })
  } catch (error) {
    console.error('Delete account error:', error)
    res.status(500).json({ error: '删除账号失败' })
  }
})

// 分配账号给用户
router.post('/assignments', async (req, res) => {
  try {
    const { user_id, account_id } = req.body
    
    if (!user_id || !account_id) {
      return res.status(400).json({ error: '用户ID和账号ID不能为空' })
    }
    
    // 检查用户是否存在
    const user = await db.prepare('SELECT id FROM users WHERE id = ?').get(user_id)
    if (!user) {
      return res.status(404).json({ error: '用户不存在' })
    }
    
    // 检查账号是否存在且可用
    const account = await db.prepare('SELECT * FROM kiro_accounts WHERE id = ?').get(account_id)
    if (!account) {
      return res.status(404).json({ error: '账号不存在' })
    }
    
    if (account.status !== 'available') {
      return res.status(400).json({ error: '该账号不可用' })
    }
    
    // 检查是否已有待处理的分配
    const existing = await db.prepare(`
      SELECT id FROM assignments 
      WHERE user_id = ? AND account_id = ? AND status = 'pending'
    `).get(user_id, account_id)
    
    if (existing) {
      return res.status(400).json({ error: '该用户已有该账号的待处理分配' })
    }
    
    // 创建分配记录
    const result = await db.prepare(`
      INSERT INTO assignments (user_id, account_id, status)
      VALUES (?, ?, 'pending')
    `).run(user_id, account_id)
    
    // 更新账号状态
    await db.prepare('UPDATE kiro_accounts SET status = ? WHERE id = ?').run('pending', account_id)
    
    const assignment = await db.prepare(`
      SELECT 
        a.*,
        u.email as user_email,
        k.email as account_email
      FROM assignments a
      JOIN users u ON a.user_id = u.id
      JOIN kiro_accounts k ON a.account_id = k.id
      WHERE a.id = ?
    `).get(result.lastInsertRowid)
    
    await logAdminAction(req, 'assign_account', 'assignment', result.lastInsertRowid, { user_id, account_id })
    res.json({ assignment, message: '分配成功' })
  } catch (error) {
    console.error('Create assignment error:', error)
    res.status(500).json({ error: '分配失败' })
  }
})

// 获取所有分配记录
router.get('/assignments', async (req, res) => {
  try {
    const { status, user_id } = req.query
    let query = `
      SELECT 
        a.*,
        u.email as user_email,
        u.nickname as user_nickname,
        k.email as account_email,
        k.provider
      FROM assignments a
      JOIN users u ON a.user_id = u.id
      JOIN kiro_accounts k ON a.account_id = k.id
      WHERE 1=1
    `
    const params = []
    
    if (status) {
      query += ' AND a.status = ?'
      params.push(status)
    }
    
    if (user_id) {
      query += ' AND a.user_id = ?'
      params.push(user_id)
    }
    
    query += ' ORDER BY a.assigned_at DESC'
    
    const assignments = await db.prepare(query).all(...params)
    res.json({ assignments })
  } catch (error) {
    console.error('Get assignments error:', error)
    res.status(500).json({ error: '获取分配记录失败' })
  }
})

// 取消分配
router.delete('/assignments/:id', async (req, res) => {
  try {
    const { id } = req.params
    
    const assignment = await db.prepare('SELECT * FROM assignments WHERE id = ?').get(id)
    if (!assignment) {
      return res.status(404).json({ error: '分配记录不存在' })
    }
    
    if (assignment.status === 'accepted') {
      return res.status(400).json({ error: '已接受的分配无法删除' })
    }
    
    // 删除分配记录
    await db.prepare('DELETE FROM assignments WHERE id = ?').run(id)
    
    // 将账号状态改回可用
    await db.prepare('UPDATE kiro_accounts SET status = ? WHERE id = ?').run('available', assignment.account_id)
    
    await logAdminAction(req, 'delete_assignment', 'assignment', parseInt(id))
    res.json({ message: '删除成功' })
  } catch (error) {
    console.error('Delete assignment error:', error)
    res.status(500).json({ error: '删除分配失败' })
  }
})

// 更新用户状态
router.put('/users/:id/status', async (req, res) => {
  try {
    const { id } = req.params
    const { status } = req.body
    
    if (!['active', 'inactive', 'banned'].includes(status)) {
      return res.status(400).json({ error: '无效的状态' })
    }
    
    await db.prepare('UPDATE users SET status = ? WHERE id = ?').run(status, id)
    await logAdminAction(req, 'update_user_status', 'user', parseInt(id), { status })
    res.json({ message: '更新成功' })
  } catch (error) {
    console.error('Update user status error:', error)
    res.status(500).json({ error: '更新用户状态失败' })
  }
})

// 删除用户
router.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params
    
    // 检查用户是否存在
    const user = await db.prepare('SELECT id FROM users WHERE id = ?').get(id)
    if (!user) {
      return res.status(404).json({ error: '用户不存在' })
    }
    
    // 获取用户的所有分配记录，将账号状态改回可用
    const assignments = await db.prepare('SELECT account_id, status FROM assignments WHERE user_id = ?').all(id)
    for (const assignment of assignments) {
      if (assignment.status === 'pending') {
        await db.prepare('UPDATE kiro_accounts SET status = ? WHERE id = ?').run('available', assignment.account_id)
      }
    }
    
    // 删除用户的分配记录
    await db.prepare('DELETE FROM assignments WHERE user_id = ?').run(id)
    
    // 删除用户的使用日志
    await db.prepare('DELETE FROM usage_logs WHERE user_id = ?').run(id)
    
    // 删除用户
    await db.prepare('DELETE FROM users WHERE id = ?').run(id)
    
    await logAdminAction(req, 'delete_user', 'user', parseInt(id))
    res.json({ message: '删除成功' })
  } catch (error) {
    console.error('Delete user error:', error)
    res.status(500).json({ error: '删除用户失败' })
  }
})

// 获取使用统计
router.get('/stats', async (req, res) => {
  try {
    const userCountRow = await db.prepare('SELECT COUNT(*) as count FROM users').get()
    const accountCountRow = await db.prepare('SELECT COUNT(*) as count FROM kiro_accounts').get()
    const availableCountRow = await db.prepare('SELECT COUNT(*) as count FROM kiro_accounts WHERE status = ?').get('available')
    const assignedCountRow = await db.prepare('SELECT COUNT(*) as count FROM kiro_accounts WHERE status = ?').get('assigned')
    const pendingAssignmentsRow = await db.prepare('SELECT COUNT(*) as count FROM assignments WHERE status = ?').get('pending')
    const acceptedAssignmentsRow = await db.prepare('SELECT COUNT(*) as count FROM assignments WHERE status = ?').get('accepted')
    
    const userCount = userCountRow?.count || 0
    const accountCount = accountCountRow?.count || 0
    const availableCount = availableCountRow?.count || 0
    const assignedCount = assignedCountRow?.count || 0
    const pendingAssignments = pendingAssignmentsRow?.count || 0
    const acceptedAssignments = acceptedAssignmentsRow?.count || 0
    
    // 最近7天的使用日志（MySQL 语法）
    const recentLogs = await db.prepare(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count,
        action
      FROM usage_logs
      WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
      GROUP BY DATE(created_at), action
      ORDER BY date DESC
    `).all()
    
    res.json({
      stats: {
        userCount,
        accountCount,
        availableCount,
        assignedCount,
        pendingAssignments,
        acceptedAssignments
      },
      recentLogs
    })
  } catch (error) {
    console.error('Get stats error:', error)
    res.status(500).json({ error: '获取统计失败' })
  }
})

// 重置用户密码（管理员功能）
router.post('/users/:id/reset-password', async (req, res) => {
  try {
    const { id } = req.params
    const { newPassword } = req.body
    
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: '密码长度至少6位' })
    }
    
    const hash = bcrypt.hashSync(newPassword, 10)
    
    await db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, id)
    await logAdminAction(req, 'reset_user_password', 'user', parseInt(id))
    res.json({ message: '密码重置成功' })
  } catch (error) {
    console.error('Reset password error:', error)
    res.status(500).json({ error: '重置密码失败' })
  }
})

// 获取管理员操作日志
router.get('/audit-logs', async (req, res) => {
  try {
    const { limit = 100, offset = 0 } = req.query
    const logs = await db.prepare(`
      SELECT * FROM admin_audit_logs 
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `).all(parseInt(limit), parseInt(offset))
    
    const totalRow = await db.prepare('SELECT COUNT(*) as count FROM admin_audit_logs').get()
    const total = totalRow?.count || 0
    
    res.json({ logs, total })
  } catch (error) {
    console.error('Get audit logs error:', error)
    res.status(500).json({ error: '获取审计日志失败' })
  }
})

export default router

