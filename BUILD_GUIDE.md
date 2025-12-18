# GitHub Actions 自动打包指南

本项目已配置 GitHub Actions 自动构建，可以自动打包 Windows、macOS 和 Linux 版本。

---

## 🚀 触发自动打包

### 方式一：创建 Release Tag（推荐）

```bash
# 1. 创建标签
git tag -a v1.5.1 -m "Release v1.5.1"

# 2. 推送标签到 GitHub
git push origin v1.5.1
```

推送后，GitHub Actions 会自动：
1. 构建 Windows、macOS、Linux 版本
2. 创建 Release
3. 上传安装包到 Release

### 方式二：手动触发

1. 访问 GitHub 仓库
2. 点击 **Actions** 标签
3. 选择 **Build and Release** 工作流
4. 点击 **Run workflow**
5. 选择分支并运行

---

## 📦 构建产物

构建完成后，会生成以下文件：

### Windows
- `Kiro-Account-Manager_1.5.1_x64_en-US.msi` - MSI 安装包
- `Kiro-Account-Manager_1.5.1_x64-setup.exe` - EXE 安装包

### macOS
- `Kiro-Account-Manager_1.5.1_x64.dmg` - Intel 芯片版本
- `Kiro-Account-Manager_1.5.1_aarch64.dmg` - Apple Silicon 版本

### Linux
- `kiro-account-manager_1.5.1_amd64.AppImage` - AppImage 格式
- `kiro-account-manager_1.5.1_amd64.deb` - Debian/Ubuntu 包

---

## ⏱️ 构建时间

- **Windows**: 约 10-15 分钟
- **macOS**: 约 15-20 分钟
- **Linux**: 约 10-15 分钟

总计约 **30-50 分钟**

---

## 🔍 查看构建状态

### 实时查看

1. 访问 https://github.com/tender0/ceshi/actions
2. 点击最新的工作流运行
3. 查看各平台的构建进度

### 构建日志

点击具体的任务可以查看详细日志。

---

## 📥 下载安装包

构建完成后：

1. 访问 https://github.com/tender0/ceshi/releases
2. 找到对应的版本
3. 下载对应平台的安装包

---

## 🛠️ 本地构建（可选）

如果需要本地构建：

### 前置要求

**所有平台**：
- Node.js 18+
- Rust 1.70+

**Linux 额外要求**：
```bash
sudo apt-get update
sudo apt-get install -y libwebkit2gtk-4.1-dev \
  libappindicator3-dev \
  librsvg2-dev \
  patchelf
```

### 构建命令

```bash
# 1. 安装依赖
npm install

# 2. 构建应用
npm run tauri build
```

构建产物位于 `src-tauri/target/release/bundle/`

---

## 🔧 配置说明

### 修改版本号

编辑以下文件：

1. `package.json` - 修改 `version` 字段
2. `src-tauri/tauri.conf.json` - 修改 `version` 字段
3. `src-tauri/Cargo.toml` - 修改 `version` 字段

### 修改应用信息

编辑 `src-tauri/tauri.conf.json`：

```json
{
  "productName": "你的应用名称",
  "identifier": "com.yourcompany.appname",
  "bundle": {
    "shortDescription": "简短描述",
    "longDescription": "详细描述"
  }
}
```

---

## 📝 发布检查清单

发布新版本前的检查：

- [ ] 更新版本号（package.json, tauri.conf.json, Cargo.toml）
- [ ] 更新 CHANGELOG.md
- [ ] 测试所有功能
- [ ] 提交所有更改
- [ ] 创建并推送 tag
- [ ] 等待 GitHub Actions 构建完成
- [ ] 检查 Release 页面
- [ ] 测试下载的安装包
- [ ] 更新 README.md 中的下载链接

---

## 🐛 常见问题

### Q: 构建失败怎么办？

**A**: 
1. 查看 Actions 日志找到错误信息
2. 常见原因：
   - 依赖安装失败：检查 package.json
   - Rust 编译错误：检查 Cargo.toml
   - 权限问题：检查 GITHUB_TOKEN

### Q: 如何修改构建配置？

**A**: 编辑 `.github/workflows/build.yml` 文件

### Q: 可以只构建特定平台吗？

**A**: 可以，修改 workflow 中的 `matrix.platform`：

```yaml
matrix:
  platform: [macos-latest]  # 只构建 macOS
```

### Q: 构建产物在哪里？

**A**: 
- GitHub Actions: 在 Release 页面
- 本地构建: `src-tauri/target/release/bundle/`

---

## 🎯 下一步

1. 推送 tag 触发构建
2. 等待构建完成（约 30-50 分钟）
3. 访问 Release 页面下载安装包
4. 测试安装包
5. 分享给用户

---

**开始构建吧！** 🚀
---
noteId: "e8633740db2311f0b7308b83690d5da1"
tags: []

---

