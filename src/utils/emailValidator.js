// 邮箱验证模块 - 共享验证逻辑

/**
 * 错误代码定义
 */
export const ERROR_CODES = {
  EMAIL_EMPTY: 'EMAIL_EMPTY',
  EMAIL_NO_AT: 'EMAIL_NO_AT',
  EMAIL_MULTIPLE_AT: 'EMAIL_MULTIPLE_AT',
  EMAIL_INVALID_LOCAL: 'EMAIL_INVALID_LOCAL',
  EMAIL_INVALID_DOMAIN: 'EMAIL_INVALID_DOMAIN',
  EMAIL_INVALID_TLD: 'EMAIL_INVALID_TLD',
  EMAIL_EXISTS: 'EMAIL_EXISTS',
}

/**
 * 错误消息映射（中文）
 */
export const ERROR_MESSAGES = {
  [ERROR_CODES.EMAIL_EMPTY]: '请输入邮箱地址',
  [ERROR_CODES.EMAIL_NO_AT]: '邮箱格式不正确，缺少 @ 符号',
  [ERROR_CODES.EMAIL_MULTIPLE_AT]: '邮箱格式不正确，包含多个 @ 符号',
  [ERROR_CODES.EMAIL_INVALID_LOCAL]: '邮箱 @ 前的部分格式不正确',
  [ERROR_CODES.EMAIL_INVALID_DOMAIN]: '邮箱域名格式不正确',
  [ERROR_CODES.EMAIL_INVALID_TLD]: '邮箱顶级域名格式不正确',
  [ERROR_CODES.EMAIL_EXISTS]: '该邮箱已被注册',
}

/**
 * 规范化邮箱（去除首尾空格，转小写）
 * @param {string} email - 原始邮箱
 * @returns {string} 规范化后的邮箱
 */
export function normalizeEmail(email) {
  if (typeof email !== 'string') {
    return ''
  }
  return email.trim().toLowerCase()
}

/**
 * 验证邮箱格式
 * @param {string} email - 待验证的邮箱地址
 * @returns {{ isValid: boolean, error: string | null, errorCode: string | null }}
 */
export function validateEmail(email) {
  // 先规范化邮箱
  const normalized = normalizeEmail(email)

  // 检查是否为空
  if (!normalized) {
    return {
      isValid: false,
      error: ERROR_MESSAGES[ERROR_CODES.EMAIL_EMPTY],
      errorCode: ERROR_CODES.EMAIL_EMPTY,
    }
  }

  // 检查 @ 符号数量
  const atCount = (normalized.match(/@/g) || []).length
  if (atCount === 0) {
    return {
      isValid: false,
      error: ERROR_MESSAGES[ERROR_CODES.EMAIL_NO_AT],
      errorCode: ERROR_CODES.EMAIL_NO_AT,
    }
  }
  if (atCount > 1) {
    return {
      isValid: false,
      error: ERROR_MESSAGES[ERROR_CODES.EMAIL_MULTIPLE_AT],
      errorCode: ERROR_CODES.EMAIL_MULTIPLE_AT,
    }
  }

  // 分割本地部分和域名部分
  const [localPart, domainPart] = normalized.split('@')

  // 验证本地部分（@ 前的部分）
  // 允许字母、数字、点、连字符、下划线、加号
  const localRegex = /^[a-zA-Z0-9.+_-]+$/
  if (!localPart || !localRegex.test(localPart)) {
    return {
      isValid: false,
      error: ERROR_MESSAGES[ERROR_CODES.EMAIL_INVALID_LOCAL],
      errorCode: ERROR_CODES.EMAIL_INVALID_LOCAL,
    }
  }

  // 验证域名部分
  // 1. 必须包含至少一个点
  // 2. 不能以点或连字符开头或结尾
  if (!domainPart || !domainPart.includes('.')) {
    return {
      isValid: false,
      error: ERROR_MESSAGES[ERROR_CODES.EMAIL_INVALID_DOMAIN],
      errorCode: ERROR_CODES.EMAIL_INVALID_DOMAIN,
    }
  }

  if (domainPart.startsWith('.') || domainPart.endsWith('.') ||
      domainPart.startsWith('-') || domainPart.endsWith('-')) {
    return {
      isValid: false,
      error: ERROR_MESSAGES[ERROR_CODES.EMAIL_INVALID_DOMAIN],
      errorCode: ERROR_CODES.EMAIL_INVALID_DOMAIN,
    }
  }

  // 验证域名只包含有效字符（字母、数字、点、连字符）
  const domainRegex = /^[a-zA-Z0-9.-]+$/
  if (!domainRegex.test(domainPart)) {
    return {
      isValid: false,
      error: ERROR_MESSAGES[ERROR_CODES.EMAIL_INVALID_DOMAIN],
      errorCode: ERROR_CODES.EMAIL_INVALID_DOMAIN,
    }
  }

  // 验证顶级域名（最后一个点后的部分）至少2个字符
  const tld = domainPart.split('.').pop()
  if (!tld || tld.length < 2) {
    return {
      isValid: false,
      error: ERROR_MESSAGES[ERROR_CODES.EMAIL_INVALID_TLD],
      errorCode: ERROR_CODES.EMAIL_INVALID_TLD,
    }
  }

  // 所有验证通过
  return {
    isValid: true,
    error: null,
    errorCode: null,
  }
}

/**
 * 获取错误消息
 * @param {string} errorCode - 错误代码
 * @returns {string} 错误消息
 */
export function getErrorMessage(errorCode) {
  return ERROR_MESSAGES[errorCode] || '邮箱格式不正确'
}
