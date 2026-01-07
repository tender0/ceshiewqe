# Requirements Document

## Introduction

本功能为桌面端应用添加用户会话持久化和账号切换时的机器码重置功能。主要包括三个核心需求：
1. 用户登录后关闭应用再次打开时无需重新登录（会话持久化）
2. 登录后在侧边栏显示用户邮箱和退出按钮
3. 用户切换账号（退出登录）时自动重置机器码

## Glossary

- **User_Session**: 用户登录会话，包含认证令牌和用户信息
- **Auth_Token**: 用户认证令牌，用于验证用户身份
- **Machine_ID**: 系统机器码，用于设备标识
- **Kiro_Account**: Kiro IDE 账号，存储在账号管理器中
- **Account_Switch**: 切换 Kiro 账号操作，将账号 token 应用到 Kiro IDE
- **Sidebar**: 应用侧边栏组件，显示导航菜单和用户信息
- **Local_Storage**: 浏览器本地存储，用于持久化数据
- **Tauri_Store**: Tauri 后端的数据存储

## Requirements

### Requirement 1: 会话持久化

**User Story:** As a user, I want my login session to persist after closing the application, so that I don't need to log in again every time I open the app.

#### Acceptance Criteria

1. WHEN the application starts, THE User_Session SHALL check for stored authentication credentials in Local_Storage
2. WHEN valid Auth_Token exists in Local_Storage, THE User_Session SHALL automatically restore the user's logged-in state
3. WHEN the Auth_Token is invalid or expired, THE User_Session SHALL clear stored credentials and show the login page
4. WHEN a user successfully logs in, THE User_Session SHALL persist the Auth_Token and user information to Local_Storage
5. WHEN a user logs out, THE User_Session SHALL clear all stored credentials from Local_Storage

### Requirement 2: 用户信息显示

**User Story:** As a user, I want to see my email and a logout button in the sidebar, so that I can easily identify my account and log out when needed.

#### Acceptance Criteria

1. WHILE a user is logged in, THE Sidebar SHALL display the user's email address
2. WHILE a user is logged in, THE Sidebar SHALL display a logout button
3. WHEN the logout button is clicked, THE Sidebar SHALL trigger the logout process
4. WHEN the user information is displayed, THE Sidebar SHALL show a user avatar placeholder or icon
5. WHEN the email is too long, THE Sidebar SHALL truncate it with ellipsis to maintain layout

### Requirement 3: Kiro 账号切换时重置机器码

**User Story:** As a user, I want the machine ID to be reset when I switch Kiro accounts in the account manager, so that each Kiro account uses a unique device identifier.

#### Acceptance Criteria

1. WHEN a user switches to a different Kiro account (applies token to Kiro IDE), THE Machine_ID SHALL be reset to a new random value
2. WHEN the Machine_ID is reset, THE system SHALL generate a valid UUID format machine ID
3. WHEN the Machine_ID reset fails, THE system SHALL log the error but continue with the account switch process
4. WHEN a Kiro account is applied, THE system SHALL use the newly generated Machine_ID for that session


### Requirement 4: 刷新账号时同步刷新使用量

**User Story:** As a user, I want the usage data to be refreshed when I refresh all accounts, so that I can see the latest quota and usage information.

#### Acceptance Criteria

1. WHEN a user triggers a refresh all accounts action, THE system SHALL refresh both the token and usage data for each account
2. WHEN refreshing usage data, THE system SHALL call the usage API to get the latest quota and usage information
3. WHEN the usage data is successfully retrieved, THE system SHALL update the account's usage_data field
4. IF the usage API call fails, THEN THE system SHALL log the error but continue with the token refresh
5. WHEN the refresh is complete, THE system SHALL update the UI to display the latest usage information
