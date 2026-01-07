# Implementation Plan: User Session Persistence

## Overview

实现用户会话持久化、侧边栏用户信息显示、Kiro 账号切换时机器码重置以及刷新账号时同步刷新使用量功能。

## Tasks

- [x] 1. 验证并完善会话持久化逻辑
  - [x] 1.1 检查 App.jsx 中的会话恢复逻辑是否完整
    - 确认 useEffect 中正确检查 localStorage
    - 确认 handleUserAuth 正确保存凭证
    - 确认 handleUserLogout 正确清除凭证
    - _Requirements: 1.1, 1.2, 1.4, 1.5_

- [x] 2. 实现侧边栏用户信息显示
  - [x] 2.1 修改 Sidebar.jsx 添加用户信息区域
    - 添加 user 和 onLogout props
    - 创建用户信息显示区域（邮箱 + 退出按钮）
    - 实现邮箱过长时的截断显示
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_
  - [x] 2.2 更新 App.jsx 传递 user 和 onLogout 给 Sidebar
    - 确保 Sidebar 接收正确的 props
    - _Requirements: 2.1, 2.2_

- [x] 3. 实现 Kiro 账号切换时重置机器码
  - [x] 3.1 修改 AccountManager/index.jsx 的 confirmSwitch 函数
    - 在切换账号时调用 reset_system_machine_guid
    - 确保重置失败不阻塞切换流程
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 4. 实现刷新账号时同步刷新使用量
  - [x] 4.1 修改 useAccounts.js 的 autoRefreshAll 函数
    - 将 refresh_account_token 改为 sync_account
    - sync_account 会同时刷新 token 和 usage 数据
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 5. Checkpoint - 功能验证
  - 确保所有功能正常工作
  - 测试会话持久化：登录后关闭应用再打开
  - 测试用户信息显示：侧边栏显示邮箱和退出按钮
  - 测试机器码重置：切换账号时机器码变化
  - 测试刷新使用量：刷新后使用量数据更新

## Notes

- 会话持久化功能在现有代码中已有基础实现，主要是验证和完善
- 侧边栏用户信息显示是新增功能，需要修改 Sidebar 组件
- 机器码重置需要在账号切换流程中添加调用
- 刷新使用量只需将 API 调用从 refresh_account_token 改为 sync_account
