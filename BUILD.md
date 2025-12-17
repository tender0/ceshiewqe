# GitHub 构建指南

通过 GitHub 网页手动操作，构建 macOS 和 Windows 应用程序。

## 一、上传代码到 GitHub

### 1. 创建仓库

1. 打开 https://github.com/new
2. 填写仓库名称，如 `kiro-account-manager`
3. 选择 **Public** 或 **Private**
4. 点击 **Create repository**

### 2. 上传代码

方式一：网页上传
1. 在仓库页面点击 **Add file** > **Upload files**
2. 拖拽项目文件夹中的所有文件
3. 填写 Commit message，点击 **Commit changes**

方式二：GitHub Desktop
1. 下载 https://desktop.github.com/
2. 登录 GitHub 账号
3. **File** > **Add Local Repository** 选择项目文件夹
4. 点击 **Publish repository**

## 二、创建 Release 触发构建

### 1. 进入 Releases 页面

1. 打开你的仓库页面
2. 点击右侧 **Releases**
3. 点击 **Create a new release**

### 2. 填写 Release 信息

1. **Choose a tag**: 输入版本号如 `v1.5.2`，点击 **Create new tag**
2. **Release title**: 输入标题如 `Kiro Account Manager v1.5.2`
3. **Describe this release**: 填写更新说明（可选）
4. 点击 **Publish release**

### 3. 等待构建完成

1. 点击顶部 **Actions** 标签
2. 可以看到 **Release** workflow 正在运行
3. 点击进入查看详细日志
4. 等待所有任务变成绿色 ✓

### 4. 下载构建产物

1. 返回 **Releases** 页面
2. 在刚创建的 Release 下方可以看到构建好的文件：
   - `Kiro Account Manager_x.x.x_x64-setup.exe` (Windows)
   - `Kiro Account Manager_x.x.x_x64_en-US.msi` (Windows)
   - `Kiro Account Manager_x.x.x_aarch64.dmg` (macOS Apple Silicon)
   - `Kiro Account Manager_x.x.x_x64.dmg` (macOS Intel)

## 三、手动触发构建（可选）

如果 workflow 配置了手动触发，可以：

1. 点击 **Actions** 标签
2. 左侧选择 **Release** workflow
3. 点击 **Run workflow**
4. 选择分支，点击绿色 **Run workflow** 按钮

## 四、常见问题

### 构建失败怎么办？

1. 点击 **Actions** > 失败的 workflow
2. 点击红色 ✗ 的任务查看错误日志
3. 根据错误信息修复代码后重新提交

### 如何重新构建同一版本？

1. 进入 **Releases** 页面
2. 点击要重新构建的 Release 右侧 **Edit**
3. 点击 **Delete this release**
4. 进入 **Code** 页面，点击 **Tags**
5. 找到对应标签，点击删除
6. 重新创建 Release

### 构建产物在哪里？

构建完成后，产物会自动上传到对应的 Release 页面，在 **Assets** 部分可以下载。

## 五、版本号说明

发布新版本前，确保以下文件中的版本号一致：

| 文件 | 字段 |
|------|------|
| `package.json` | `"version": "1.5.2"` |
| `src-tauri/tauri.conf.json` | `"version": "1.5.2"` |
| `src-tauri/Cargo.toml` | `version = "1.5.2"` |
