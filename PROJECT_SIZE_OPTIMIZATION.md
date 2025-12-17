# 项目体积优化指南

## 📊 当前项目体积分析

```
总大小: 2.6GB
├── .git/              1.0GB  (Git 历史记录)
├── src-tauri/target/  1.4GB  (Rust 编译产物)
├── node_modules/      173MB  (前端依赖)
├── server/            28MB   (后端代码 + 依赖)
├── dist/              504KB  (构建产物)
├── screenshots/       1.3MB  (截图)
└── src/               592KB  (源代码)
```

---

## 🧹 立即清理（不影响开发）

### 1. 清理 Rust 编译产物（节省 1.4GB）

```bash
# 清理 Tauri 编译产物
cd src-tauri
cargo clean
cd ..

# 或者直接删除
rm -rf src-tauri/target
```

**说明**：下次运行 `npm run tauri dev` 或 `npm run tauri build` 时会自动重新编译。

### 2. 清理 Node.js 依赖（节省 200MB+）

```bash
# 清理前端依赖
rm -rf node_modules

# 清理后端依赖
rm -rf server/node_modules

# 需要时重新安装
npm install
cd server && npm install
```

### 3. 清理构建产物（节省 500KB）

```bash
rm -rf dist
```

---

## 🎯 Git 仓库优化（节省 1GB）

### 方案一：清理 Git 历史（推荐）

如果不需要保留完整的 Git 历史：

```bash
# 1. 备份当前代码
cp -r . ../kiro-account-manager-backup

# 2. 删除 .git 目录
rm -rf .git

# 3. 重新初始化 Git
git init
git add .
git commit -m "Initial commit - cleaned history"

# 4. 如果需要推送到远程
git remote add origin <your-repo-url>
git push -f origin main
```

**效果**：项目体积从 2.6GB 降至 200MB 左右

### 方案二：浅克隆（适合新克隆）

如果是从远程克隆项目：

```bash
# 只克隆最近的提交
git clone --depth 1 <repo-url>
```

### 方案三：Git GC 优化

保留历史但优化存储：

```bash
git gc --aggressive --prune=now
```

---

## 📦 分发优化

### 1. 创建 .gitattributes

创建 `.gitattributes` 文件，优化 Git LFS：

```gitattributes
# 大文件使用 LFS
*.dmg filter=lfs diff=lfs merge=lfs -text
*.exe filter=lfs diff=lfs merge=lfs -text
*.msi filter=lfs diff=lfs merge=lfs -text
*.AppImage filter=lfs diff=lfs merge=lfs -text
*.deb filter=lfs diff=lfs merge=lfs -text
*.rpm filter=lfs diff=lfs merge=lfs -text

# 截图
screenshots/*.png filter=lfs diff=lfs merge=lfs -text
```

### 2. 优化 .gitignore

确保以下内容在 `.gitignore` 中：

```gitignore
# 编译产物
dist/
dist-ssr/
src-tauri/target/
src-tauri/gen/

# 依赖
node_modules/
server/node_modules/

# 数据库
*.db
*.sqlite
server/data.db

# 日志
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# 环境变量
.env
.env.local
.env.*.local
server/.env

# IDE
.vscode/
.idea/
.kiro/

# OS
.DS_Store
Thumbs.db

# Tauri
.tauri-updater-key
.tauri-updater-key.pub
```

---

## 🚀 发布优化

### 1. 只发布必要文件

创建 `.npmignore` 或使用 `files` 字段：

**package.json**:
```json
{
  "files": [
    "dist",
    "src",
    "index.html",
    "vite.config.js",
    "tailwind.config.js",
    "postcss.config.js"
  ]
}
```

### 2. 使用 GitHub Releases

不要将编译后的二进制文件提交到 Git：
- 使用 GitHub Actions 自动构建
- 将构建产物上传到 Releases
- 用户从 Releases 下载

### 3. 压缩截图

```bash
# 安装 imagemagick
brew install imagemagick  # macOS
apt install imagemagick   # Ubuntu

# 压缩截图
cd screenshots
for img in *.png; do
  convert "$img" -quality 85 -resize 1920x1080\> "optimized_$img"
done
```

---

## 📝 一键清理脚本

创建 `clean.sh` 脚本：

```bash
#!/bin/bash

echo "🧹 开始清理项目..."

# 清理 Rust 编译产物
echo "清理 Rust 编译产物..."
rm -rf src-tauri/target
echo "✅ 已清理 src-tauri/target (节省 ~1.4GB)"

# 清理 Node.js 依赖
echo "清理 Node.js 依赖..."
rm -rf node_modules
rm -rf server/node_modules
echo "✅ 已清理 node_modules (节省 ~200MB)"

# 清理构建产物
echo "清理构建产物..."
rm -rf dist
echo "✅ 已清理 dist"

# 清理日志
echo "清理日志文件..."
find . -name "*.log" -type f -delete
echo "✅ 已清理日志文件"

# 清理临时文件
echo "清理临时文件..."
find . -name ".DS_Store" -type f -delete
echo "✅ 已清理 .DS_Store"

# 显示清理后的大小
echo ""
echo "📊 清理完成！当前项目大小："
du -sh .

echo ""
echo "💡 提示："
echo "  - 运行 'npm install' 重新安装前端依赖"
echo "  - 运行 'cd server && npm install' 重新安装后端依赖"
echo "  - 运行 'npm run tauri dev' 会自动重新编译 Rust"
```

使用方法：

```bash
chmod +x clean.sh
./clean.sh
```

---

## 🎯 推荐的项目结构

### 开发环境（本地）
```
项目大小: ~2.6GB
- 包含所有依赖和编译产物
- 可以直接运行和调试
```

### 源代码仓库（Git）
```
项目大小: ~10MB
- 只包含源代码
- 不包含 node_modules、target、dist
- 使用 .gitignore 排除大文件
```

### 发布版本（Releases）
```
项目大小: 根据平台不同
- Windows: ~15MB (压缩后)
- macOS: ~20MB (压缩后)
- Linux: ~18MB (压缩后)
- 通过 GitHub Actions 自动构建
```

---

## ✅ 优化检查清单

- [ ] 已清理 `src-tauri/target` 目录
- [ ] 已清理 `node_modules` 目录
- [ ] 已清理 `dist` 目录
- [ ] `.gitignore` 配置正确
- [ ] 不提交编译产物到 Git
- [ ] 不提交依赖包到 Git
- [ ] 截图已压缩优化
- [ ] 使用 GitHub Releases 发布二进制文件
- [ ] 考虑使用 Git LFS 管理大文件

---

## 📈 优化效果对比

| 项目 | 优化前 | 优化后 | 节省 |
|------|--------|--------|------|
| 本地开发 | 2.6GB | 2.6GB | - |
| Git 仓库 | 1.0GB | 10MB | 99% |
| 源代码包 | 200MB | 10MB | 95% |
| 克隆时间 | 5-10分钟 | 10秒 | 97% |

---

## 💡 最佳实践

1. **开发时**：保留所有文件，方便调试
2. **提交前**：确保 .gitignore 正确配置
3. **发布时**：使用 CI/CD 自动构建
4. **分享时**：只分享源代码，不分享编译产物
5. **备份时**：定期清理后再备份

---

## 🔗 相关命令速查

```bash
# 查看目录大小
du -sh */

# 查看 Git 仓库大小
du -sh .git

# 查看最大的文件
find . -type f -size +10M -exec ls -lh {} \;

# 清理 Git 缓存
git rm -r --cached .
git add .
git commit -m "Clean cache"

# 查看 Git 仓库中最大的文件
git rev-list --objects --all | \
  git cat-file --batch-check='%(objecttype) %(objectname) %(objectsize) %(rest)' | \
  sed -n 's/^blob //p' | \
  sort --numeric-sort --key=2 | \
  tail -10
```

---

**优化完成后，你的项目将更轻量、更易分享！** 🎉
---
noteId: "05229330db1a11f0b7308b83690d5da1"
tags: []

---

