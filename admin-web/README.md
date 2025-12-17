# Kiro 后台管理 - 网页版

独立的网页版后台管理系统，可以在浏览器中访问。

## 部署步骤

### 1. 安装依赖

```bash
cd admin-web
npm install
```

### 2. 配置 API 地址

创建 `.env` 文件：

```bash
cp .env.example .env
```

修改 `VITE_API_URL` 为你的 API 服务器地址。

### 3. 构建

```bash
npm run build
```

### 4. 部署到宝塔

1. 在宝塔面板创建新网站，域名如 `admin.yourdomain.com`
2. 将 `dist` 目录下的文件上传到网站根目录
3. 配置 SSL 证书（推荐）

### 5. Nginx 配置

确保 Nginx 配置支持 SPA 路由：

```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

## 默认管理员账号

- 用户名: `admin`
- 密码: `Admin@123456`

**首次登录后请立即修改密码！**

## 功能

- 📊 统计概览
- 👥 用户管理
- 🔑 账号池管理
- 📋 分配记录查看
---
noteId: "a2a2f0b0db4111f0b7308b83690d5da1"
tags: []

---

