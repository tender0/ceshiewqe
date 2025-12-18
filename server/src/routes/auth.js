import express from 'express'
import bcrypt from 'bcryptjs'
import db from '../db/index.js'
import { generateToken, authUser, authAdmin } from '../middleware/auth.js'

const router = express.Router()

// 用户注册
router.post('/register', async (req, res) => {
  try {
    const { email, password, nickname } = req.body
    
    if (!email || !password) {
      return res.status(400).json({ error: '邮箱和密码不能为空' })
    }
    
    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: '邮箱格式不正确' })
    }
    
    // 检查邮箱是否已存在
    const existing = await db.prepare('SELECT id FROM users WHERE email = ?').get(email)
    if (existing) {
      return res.status(400).json({ error: '该邮箱已被注册' })
    }
    
    // 密码长度验证
    if (password.length < 6) {
      return res.status(400).json({ error: '密码长度至少6位' })
    }
    
    const passwordHash = bcrypt.hashSync(password, 10)
    const result = await db.prepare('INSERT INTO users (email, password_hash, nickname) VALUES (?, ?, ?)')
      .run(email, passwordHash, nickname || null)
    
    const token = generateToken({ id: result.lastInsertRowid, email, type: 'user' })
    
    res.json({ 
      token, 
      user: { 
        id: result.lastInsertRowid, 
        email, 
        nickname: nickname || null 
      } 
    })
  } catch (error) {
    console.error('Register error:', error)
    res.status(500).json({ error: '注册失败' })
  }
})

// 用户登录
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    
    if (!email || !password) {
      return res.status(400).json({ error: '邮箱和密码不能为空' })
    }
    
    const user = await db.prepare('SELECT * FROM users WHERE email = ?').get(email)
    if (!user) {
      return res.status(401).json({ error: '邮箱或密码错误' })
    }
    
    if (user.status !== 'active') {
      return res.status(403).json({ error: '账号已被禁用' })
    }
    
    if (!bcrypt.compareSync(password, user.password_hash)) {
      return res.status(401).json({ error: '邮箱或密码错误' })
    }
    
    // 更新最后登录时间
    await db.prepare('UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?').run(user.id)
    
    const token = generateToken({ id: user.id, email: user.email, type: 'user' })
    
    res.json({ 
      token, 
      user: { 
        id: user.id, 
        email: user.email, 
        nickname: user.nickname 
      } 
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ error: '登录失败' })
  }
})

// 管理员登录
router.post('/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body
    
    if (!username || !password) {
      return res.status(400).json({ error: '用户名和密码不能为空' })
    }
    
    const admin = await db.prepare('SELECT * FROM admins WHERE username = ?').get(username)
    if (!admin) {
      return res.status(401).json({ error: '用户名或密码错误' })
    }
    
    if (!bcrypt.compareSync(password, admin.password_hash)) {
      return res.status(401).json({ error: '用户名或密码错误' })
    }
    
    const token = generateToken({ id: admin.id, username: admin.username, type: 'admin' })
    
    res.json({ 
      token, 
      admin: { 
        id: admin.id, 
        username: admin.username, 
        role: admin.role 
      } 
    })
  } catch (error) {
    console.error('Admin login error:', error)
    res.status(500).json({ error: '登录失败' })
  }
})

// 验证 token（用户）
router.get('/verify', authUser, async (req, res) => {
  try {
    const user = await db.prepare('SELECT id, email, nickname, status FROM users WHERE id = ?').get(req.user.id)
    if (!user) {
      return res.status(404).json({ error: '用户不存在' })
    }
    res.json({ user })
  } catch (error) {
    console.error('Verify user error:', error)
    res.status(500).json({ error: '获取用户信息失败' })
  }
})

// 验证 token（管理员）
router.get('/admin/verify', authAdmin, async (req, res) => {
  try {
    const admin = await db.prepare('SELECT id, username, role FROM admins WHERE id = ?').get(req.admin.id)
    if (!admin) {
      return res.status(404).json({ error: '管理员不存在' })
    }
    res.json({ admin })
  } catch (error) {
    console.error('Verify admin error:', error)
    res.status(500).json({ error: '获取管理员信息失败' })
  }
})

export default router

