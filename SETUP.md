# 用户端和后台管理系统设置指南

## 功能概述

本项目已改造为包含以下功能：

1. **用户端**：
   - 用户注册/登录（需要邮箱）
   - 查看待接受的账号分配
   - 接受/拒绝账号分配
   - 接受后账号自动添加到本地账号列表
   - 一键换号功能

2. **后台管理**：
   - 管理员登录
   - 用户管理
   - 账号池管理（添加、删除账号）
   - 账号分配（将账号分配给用户）
   - 查看分配记录

## 安装和启动

### 1. 安装依赖

```bash
# 前端依赖
npm install

# 服务器依赖
cd server
npm install
```

### 2. 安装和配置 MySQL

确保已安装 MySQL 数据库（5.7+ 或 8.0+）。

### 3. 配置环境变量

在 `server` 目录下创建 `.env` 文件（可以复制 `.env.example`）：

```env
PORT=3001
JWT_SECRET=your-secret-key-change-in-production
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123

# MySQL 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=kiro_account_manager

# CORS 允许的域名
CORS_ORIGIN=*
```

**重要**：请修改以下配置：
- `JWT_SECRET`: 使用强随机密钥（至少32位）
- `DB_PASSWORD`: 你的 MySQL 密码
- `ADMIN_PASSWORD`: 管理员密码（首次启动后请立即修改）

### 4. 初始化数据库

```bash
cd server
npm run db:init
```

这将自动创建数据库 `kiro_account_manager` 并初始化所有表结构，同时创建默认管理员账号：
- 用户名: `admin`（可在 .env 中配置）
- 密码: `admin123`（可在 .env 中配置）

### 5. 启动服务器

```bash
cd server
npm run dev
# 或
npm start
```

服务器将在 `http://localhost:3001` 启动

### 6. 配置前端 API 地址

在项目根目录创建 `.env` 文件（或修改 `vite.config.js`）：

```env
VITE_API_BASE_URL=http://localhost:3001
```

### 7. 启动前端

```bash
npm run dev
# 或使用 Tauri
npm run tauri dev
```

## 使用说明

### 用户端使用

1. **注册账号**：
   - 打开应用，会显示登录页面
   - 点击"还没有账号？立即注册"
   - 输入邮箱（必填）、昵称（可选）、密码（至少6位）
   - 注册成功后自动登录

2. **查看待接受的账号**：
   - 登录后，在侧边栏点击"账号分配"
   - 查看管理员分配的账号
   - 点击"接受"将账号添加到本地账号列表
   - 点击"拒绝"拒绝该分配

3. **一键换号**：
   - 在"账号管理"页面
   - 点击账号的"切换"按钮
   - 确认后即可切换到该账号

### 后台管理使用

1. **管理员登录**：
   - 在浏览器中访问 `http://localhost:5173?admin=true`（开发环境）
   - 或直接访问管理员登录页面
   - 使用默认账号登录：`admin` / `admin123`

2. **管理账号池**：
   - 在"账号池"标签页
   - 点击"添加账号"按钮
   - 填写账号信息（邮箱、Provider、Token 等）
   - 保存后账号进入"可用"状态

3. **分配账号给用户**：
   - 在"用户管理"标签页
   - 找到要分配账号的用户
   - 点击"分配账号"按钮
   - 选择要分配的账号
   - 确认后，用户将收到待接受的账号分配

4. **查看分配记录**：
   - 在"分配记录"标签页
   - 查看所有分配记录及其状态（pending/accepted/rejected）

## 数据库结构（MySQL）

- `users`: 用户表（邮箱、密码、昵称、状态等）
- `admins`: 管理员表（用户名、密码、角色等）
- `kiro_accounts`: Kiro 账号池（邮箱、Token、状态等）
- `assignments`: 账号分配记录（用户ID、账号ID、状态等）
- `usage_logs`: 使用统计日志（用户操作记录）
- `admin_audit_logs`: 管理员审计日志（管理员操作记录）

## 安全建议

1. **修改默认管理员密码**：首次登录后立即修改
2. **使用强密钥**：JWT_SECRET 至少32位随机字符
3. **数据库安全**：使用强密码，限制远程访问
4. **HTTPS**：生产环境必须使用 HTTPS
5. **定期备份**：定期备份 MySQL 数据库
6. **CORS 配置**：生产环境设置具体允许的域名

## 注意事项

1. 服务器必须运行才能使用用户端和后台管理功能
2. 账号分配后，用户需要主动接受才能使用
3. 已接受的账号会自动添加到用户的本地账号列表
4. 管理员可以查看所有分配记录，但无法取消已接受的分配

