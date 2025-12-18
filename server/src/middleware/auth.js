import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET

if (!JWT_SECRET || JWT_SECRET === 'your-secret-key-change-in-production') {
  console.warn('⚠️  警告: JWT_SECRET 未配置或使用默认值，这在生产环境中不安全！')
  console.warn('⚠️  请在 .env 文件中设置一个强密钥')
}

export function authUser(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: '未登录' })
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    if (decoded.type !== 'user') return res.status(403).json({ error: '无权限' })
    req.user = decoded
    next()
  } catch {
    res.status(401).json({ error: 'Token 无效' })
  }
}

export function authAdmin(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: '未登录' })
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    if (decoded.type !== 'admin') return res.status(403).json({ error: '无权限' })
    req.admin = decoded
    next()
  } catch {
    res.status(401).json({ error: 'Token 无效' })
  }
}

export function generateToken(payload, expiresIn = '7d') {
  return jwt.sign(payload, JWT_SECRET, { expiresIn })
}
