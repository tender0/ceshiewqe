import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { initPromise } from './db/index.js'
import userRoutes from './routes/user.js'
import adminRoutes from './routes/admin.js'
import authRoutes from './routes/auth.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

// CORS 配置 - 允许所有来源
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))

app.use(express.json({ limit: '10mb' }))  // 限制请求体大小

// 简单的请求频率限制
const requestCounts = new Map()
const RATE_LIMIT_WINDOW = 60000  // 1分钟
const RATE_LIMIT_MAX = 100  // 每分钟最多100次请求

app.use((req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress
  const now = Date.now()
  const windowStart = now - RATE_LIMIT_WINDOW
  
  if (!requestCounts.has(ip)) {
    requestCounts.set(ip, [])
  }
  
  const requests = requestCounts.get(ip).filter(time => time > windowStart)
  requests.push(now)
  requestCounts.set(ip, requests)
  
  if (requests.length > RATE_LIMIT_MAX) {
    return res.status(429).json({ error: '请求过于频繁，请稍后再试' })
  }
  
  next()
})

// 路由
app.use('/api/auth', authRoutes)
app.use('/api/user', userRoutes)
app.use('/api/admin', adminRoutes)

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok' })
})

// 等待数据库初始化后启动服务器
initPromise.then(() => {
  app.listen(PORT, () => {
    console.log(`服务器运行在端口 ${PORT}`)
  })
}).catch(err => {
  console.error('数据库初始化失败:', err)
  process.exit(1)
})
