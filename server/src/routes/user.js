import express from 'express'
import db from '../db/index.js'
import { authUser } from '../middleware/auth.js'

const router = express.Router()

// 所有路由需要用户认证
router.use(authUser)

// 获取当前用户的账号分配列表
router.get('/assignments', async (req, res) => {
  try {
    const assignments = await db.prepare(`
      SELECT 
        a.id,
        a.status,
        a.assigned_at,
        a.accepted_at,
        a.rejected_at,
        k.id as account_id,
        k.email as account_email,
        k.provider,
        k.status as account_status,
        k.remark
      FROM assignments a
      JOIN kiro_accounts k ON a.account_id = k.id
      WHERE a.user_id = ?
      ORDER BY a.assigned_at DESC
    `).all(req.user.id)
    
    res.json({ assignments })
  } catch (error) {
    console.error('Get assignments error:', error)
    res.status(500).json({ error: '获取分配列表失败' })
  }
})

// 获取待接受的账号分配
router.get('/assignments/pending', async (req, res) => {
  try {
    const assignments = await db.prepare(`
      SELECT 
        a.id,
        a.assigned_at,
        k.id as account_id,
        k.email as account_email,
        k.provider,
        k.remark
      FROM assignments a
      JOIN kiro_accounts k ON a.account_id = k.id
      WHERE a.user_id = ? AND a.status = 'pending'
      ORDER BY a.assigned_at DESC
    `).all(req.user.id)
    
    res.json({ assignments })
  } catch (error) {
    console.error('Get pending assignments error:', error)
    res.status(500).json({ error: '获取待接受列表失败' })
  }
})

// 接受账号分配
router.post('/assignments/:id/accept', async (req, res) => {
  try {
    const assignmentId = req.params.id
    
    // 检查分配是否存在且属于当前用户
    const assignment = await db.prepare(`
      SELECT * FROM assignments 
      WHERE id = ? AND user_id = ?
    `).get(assignmentId, req.user.id)
    
    if (!assignment) {
      return res.status(404).json({ error: '分配记录不存在' })
    }
    
    if (assignment.status !== 'pending') {
      return res.status(400).json({ error: '该分配已被处理' })
    }
    
    // 更新分配状态
    await db.prepare(`
      UPDATE assignments 
      SET status = 'accepted', accepted_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).run(assignmentId)
    
    // 更新账号状态为已分配
    await db.prepare(`
      UPDATE kiro_accounts 
      SET status = 'assigned' 
      WHERE id = ?
    `).run(assignment.account_id)
    
    // 记录使用日志
    await db.prepare(`
      INSERT INTO usage_logs (user_id, account_id, action) 
      VALUES (?, ?, 'accept')
    `).run(req.user.id, assignment.account_id)
    
    // 获取账号详情
    const account = await db.prepare('SELECT * FROM kiro_accounts WHERE id = ?').get(assignment.account_id)
    
    res.json({ 
      message: '接受成功', 
      account: {
        id: account.id,
        email: account.email,
        provider: account.provider,
        access_token: account.access_token,
        refresh_token: account.refresh_token,
        profile_arn: account.profile_arn,
        client_id_hash: account.client_id_hash,
        region: account.region,
        client_id: account.client_id,
        client_secret: account.client_secret,
        expires_at: account.expires_at
      }
    })
  } catch (error) {
    console.error('Accept assignment error:', error)
    res.status(500).json({ error: '接受失败' })
  }
})

// 拒绝账号分配
router.post('/assignments/:id/reject', async (req, res) => {
  try {
    const assignmentId = req.params.id
    
    // 检查分配是否存在且属于当前用户
    const assignment = await db.prepare(`
      SELECT * FROM assignments 
      WHERE id = ? AND user_id = ?
    `).get(assignmentId, req.user.id)
    
    if (!assignment) {
      return res.status(404).json({ error: '分配记录不存在' })
    }
    
    if (assignment.status !== 'pending') {
      return res.status(400).json({ error: '该分配已被处理' })
    }
    
    // 更新分配状态
    await db.prepare(`
      UPDATE assignments 
      SET status = 'rejected', rejected_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).run(assignmentId)
    
    // 将账号状态改回可用
    await db.prepare(`
      UPDATE kiro_accounts 
      SET status = 'available' 
      WHERE id = ?
    `).run(assignment.account_id)
    
    res.json({ message: '已拒绝' })
  } catch (error) {
    console.error('Reject assignment error:', error)
    res.status(500).json({ error: '拒绝失败' })
  }
})

// 获取当前用户信息
router.get('/me', async (req, res) => {
  try {
    const user = await db.prepare('SELECT id, email, nickname, status, created_at, last_login_at FROM users WHERE id = ?').get(req.user.id)
    if (!user) {
      return res.status(404).json({ error: '用户不存在' })
    }
    res.json({ user })
  } catch (error) {
    console.error('Get user error:', error)
    res.status(500).json({ error: '获取用户信息失败' })
  }
})

export default router

