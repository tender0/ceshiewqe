# 更新日志

## [v1.5.1] - 2024-12-17

### ✨ 新增功能

#### 后端系统
- 🚀 完整的后端 API 服务（Express + MySQL）
- 👤 用户注册/登录系统
- 🔐 JWT 认证和权限控制
- 🛡️ 管理员后台面板
- 📊 账号分配管理功能
- 📝 完整的审计日志系统
- 🔒 登录失败锁定机制（5次失败锁定15分钟）
- ⚡ 请求频率限制（100次/分钟）

#### 数据库设计
- 📦 6张数据库表（users, admins, kiro_accounts, assignments, usage_logs, admin_audit_logs）
- 🗄️ 完整的 MySQL 数据库支持
- 🔄 自动数据库初始化脚本

#### 前端功能
- 🎨 用户注册/登录界面
- 👥 用户账号分配管理
- 🛡️ 管理员后台面板
  - 用户管理
  - 账号池管理
  - 分配记录管理
  - 统计数据展示
- 📱 响应式设计

#### 部署支持
- 📚 完整的宝塔面板部署文档
- 🔧 详细的环境配置说明
- 🚀 一键部署脚本
- 📖 开发和生产环境配置

### 🔧 优化改进

- 🧹 项目体积优化（2.6GB → 9.7MB）
- 📦 清理脚本和优化文档
- 🔒 安全性增强
- 📝 完善的文档系统

### 📚 文档

- ✅ README.md - 项目介绍
- ✅ SETUP.md - 开发环境配置
- ✅ BAOTA_DEPLOY.md - 宝塔部署指南
- ✅ PROJECT_CHECK_REPORT.md - 项目检查报告
- ✅ PROJECT_SIZE_OPTIMIZATION.md - 体积优化指南
- ✅ CLEANUP_REPORT.md - 清理报告

### 🛠️ 技术栈

**后端**
- Node.js 18+
- Express 4.18
- MySQL 5.7+
- JWT 认证
- bcryptjs 密码加密

**前端**
- React 18
- Tauri 2.x
- TailwindCSS 3.3
- i18next 多语言
- Vite 5.0

### 📦 安装说明

#### 桌面应用
1. 从 [Releases](https://github.com/tender0/ceshi/releases) 下载对应平台的安装包
2. 安装并运行

#### 后端部署
1. 参考 [BAOTA_DEPLOY.md](BAOTA_DEPLOY.md) 进行部署
2. 配置 MySQL 数据库
3. 运行初始化脚本

### 🐛 已知问题

- 无

### 🔜 计划功能

- [ ] 账号自动刷新 Token
- [ ] 批量导入账号
- [ ] 数据导出功能
- [ ] 更多统计图表
- [ ] 邮件通知功能

---

## [v1.5.0] - 之前版本

### 基础功能
- 多账号管理
- 配额监控
- 主题切换
- 多语言支持
- Kiro 配置管理
---
noteId: "debecd30db2311f0b7308b83690d5da1"
tags: []

---

