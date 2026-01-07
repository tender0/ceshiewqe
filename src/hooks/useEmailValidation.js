import { useState, useCallback, useRef, useEffect } from 'react'
import { validateEmail, normalizeEmail } from '../utils/emailValidator'

/**
 * 邮箱验证 Hook
 * 提供 debounce 300ms 的实时验证和失焦验证
 * 
 * @param {string} initialValue - 初始邮箱值
 * @returns {Object} 验证状态和处理函数
 */
export function useEmailValidation(initialValue = '') {
  const [email, setEmail] = useState(initialValue)
  const [isValid, setIsValid] = useState(false)
  const [isValidating, setIsValidating] = useState(false)
  const [error, setError] = useState(null)
  const [touched, setTouched] = useState(false)
  
  const debounceTimerRef = useRef(null)

  /**
   * 执行验证
   * @param {string} value - 待验证的邮箱
   */
  const performValidation = useCallback((value) => {
    const result = validateEmail(value)
    setIsValid(result.isValid)
    setError(result.error)
    setIsValidating(false)
  }, [])

  /**
   * 处理邮箱输入变化
   * 实现 300ms debounce 的实时验证
   * @param {string} value - 新的邮箱值
   */
  const handleEmailChange = useCallback((value) => {
    setEmail(value)
    setIsValidating(true)
    
    // 清除之前的 debounce 定时器
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }
    
    // 设置新的 debounce 定时器
    debounceTimerRef.current = setTimeout(() => {
      performValidation(value)
    }, 300)
  }, [performValidation])

  /**
   * 处理失焦事件
   * 立即执行验证并标记为已触碰
   */
  const handleBlur = useCallback(() => {
    setTouched(true)
    
    // 清除 debounce 定时器，立即验证
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }
    
    performValidation(email)
  }, [email, performValidation])

  /**
   * 获取规范化后的邮箱
   * @returns {string} 规范化后的邮箱
   */
  const getNormalizedEmail = useCallback(() => {
    return normalizeEmail(email)
  }, [email])

  /**
   * 重置验证状态
   */
  const reset = useCallback(() => {
    setEmail(initialValue)
    setIsValid(false)
    setIsValidating(false)
    setError(null)
    setTouched(false)
    
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }
  }, [initialValue])

  // 清理 debounce 定时器
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [])

  return {
    email,
    setEmail: handleEmailChange,
    isValid,
    isValidating,
    error,
    touched,
    handleBlur,
    getNormalizedEmail,
    reset,
  }
}

export default useEmailValidation
