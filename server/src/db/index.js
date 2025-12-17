import mysql from 'mysql2/promise'
import dotenv from 'dotenv'

dotenv.config()

// MySQL 连接配置
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'kiro_account_manager',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
}

let pool = null
let initialized = false

// 初始化数据库连接池
async function initDb() {
  if (initialized) return
  
  try {
    // 先连接不指定数据库，创建数据库
    const tempPool = mysql.createPool({
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      password: dbConfig.password,
      waitForConnections: true,
      connectionLimit: 2
    })
    
    await tempPool.execute(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`)
    await tempPool.end()
    
    // 创建正式连接池
    pool = mysql.createPool(dbConfig)
    
    // 测试连接
    const conn = await pool.getConnection()
    console.log('MySQL 连接成功')
    conn.release()
    
    initialized = true
  } catch (error) {
    console.error('MySQL 连接失败:', error.message)
    throw error
  }
}

// 包装器，模拟 better-sqlite3 的同步 API（实际是异步但对外表现一致）
const dbWrapper = {
  prepare: (sql) => ({
    run: async (...params) => {
      if (!pool) throw new Error('Database not initialized')
      try {
        const [result] = await pool.execute(sql, params)
        return { lastInsertRowid: result.insertId || 0, changes: result.affectedRows || 0 }
      } catch (e) {
        console.error('DB run error:', e.message)
        throw e
      }
    },
    get: async (...params) => {
      if (!pool) return null
      try {
        const [rows] = await pool.execute(sql, params)
        return rows[0] || null
      } catch (e) {
        console.error('DB get error:', e.message)
        return null
      }
    },
    all: async (...params) => {
      if (!pool) return []
      try {
        const [rows] = await pool.execute(sql, params)
        return rows
      } catch (e) {
        console.error('DB all error:', e.message)
        return []
      }
    }
  }),
  execute: async (sql, params = []) => {
    if (!pool) throw new Error('Database not initialized')
    const [result] = await pool.execute(sql, params)
    return result
  },
  query: async (sql, params = []) => {
    if (!pool) throw new Error('Database not initialized')
    const [rows] = await pool.execute(sql, params)
    return rows
  },
  close: async () => {
    if (pool) {
      await pool.end()
      pool = null
      initialized = false
    }
  }
}

// 导出初始化 Promise
export const initPromise = initDb()
export default dbWrapper
