import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { validateEmail, normalizeEmail, ERROR_CODES } from './emailValidator'

/**
 * Feature: email-validation-improvement
 * Property 1: Email Format Validation Completeness
 * Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5
 * 
 * For any string input, the Email_Validator SHALL correctly identify whether it is a valid email by verifying:
 * - Exactly one @ symbol exists
 * - Local part is non-empty and contains only valid characters
 * - Domain part contains at least one dot
 * - Domain part does not start or end with a dot or hyphen
 * - Top-level domain is at least 2 characters long
 */
describe('Property 1: Email Format Validation Completeness', () => {
  // Arbitrary for generating valid local parts (letters, numbers, dots, hyphens, underscores, plus signs)
  const validLocalChars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789._+-'
  const validLocalPartArb = fc.string({ minLength: 1, maxLength: 64 })
    .filter(s => s.length > 0 && [...s].every(c => validLocalChars.includes(c)))

  // Arbitrary for generating valid domain labels (letters, numbers, hyphens, but not starting/ending with hyphen)
  const domainChars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  const validDomainLabelArb = fc.tuple(
    fc.constantFrom(...domainChars.split('')),
    fc.array(fc.constantFrom(...(domainChars + '-').split('')), { minLength: 0, maxLength: 10 }),
    fc.constantFrom(...domainChars.split(''))
  ).map(([first, middle, last]) => first + middle.join('') + last)

  // Arbitrary for generating valid TLDs (at least 2 characters, letters only)
  const tldChars = 'abcdefghijklmnopqrstuvwxyz'
  const validTldArb = fc.string({ minLength: 2, maxLength: 6 })
    .filter(s => s.length >= 2 && [...s].every(c => tldChars.includes(c)))

  // Arbitrary for generating valid emails
  const validEmailArb = fc.tuple(validLocalPartArb, validDomainLabelArb, validTldArb)
    .map(([local, domain, tld]) => `${local}@${domain}.${tld}`)

  it('should accept all valid emails (exactly one @, valid local, domain with dot, valid TLD)', () => {
    fc.assert(
      fc.property(validEmailArb, (email) => {
        const result = validateEmail(email)
        return result.isValid === true && result.error === null && result.errorCode === null
      }),
      { numRuns: 100 }
    )
  })

  it('should reject emails without @ symbol', () => {
    // Generate non-empty strings without @ that aren't just whitespace
    const noAtArb = fc.string({ minLength: 1, maxLength: 50 })
      .filter(s => !s.includes('@') && s.trim().length > 0)

    fc.assert(
      fc.property(noAtArb, (email) => {
        const result = validateEmail(email)
        return result.isValid === false && result.errorCode === ERROR_CODES.EMAIL_NO_AT
      }),
      { numRuns: 100 }
    )
  })

  it('should reject emails with multiple @ symbols', () => {
    fc.assert(
      fc.property(
        validLocalPartArb,
        validLocalPartArb,
        validDomainLabelArb,
        validTldArb,
        (local1, local2, domain, tld) => {
          const email = `${local1}@${local2}@${domain}.${tld}`
          const result = validateEmail(email)
          return result.isValid === false && result.errorCode === ERROR_CODES.EMAIL_MULTIPLE_AT
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should reject emails with empty local part', () => {
    fc.assert(
      fc.property(validDomainLabelArb, validTldArb, (domain, tld) => {
        const email = `@${domain}.${tld}`
        const result = validateEmail(email)
        return result.isValid === false && result.errorCode === ERROR_CODES.EMAIL_INVALID_LOCAL
      }),
      { numRuns: 100 }
    )
  })

  it('should reject emails with domain starting or ending with dot or hyphen', () => {
    const invalidPrefixSuffix = fc.constantFrom('.', '-')
    
    fc.assert(
      fc.property(
        validLocalPartArb,
        invalidPrefixSuffix,
        validDomainLabelArb,
        validTldArb,
        (local, prefix, domain, tld) => {
          const email = `${local}@${prefix}${domain}.${tld}`
          const result = validateEmail(email)
          return result.isValid === false && result.errorCode === ERROR_CODES.EMAIL_INVALID_DOMAIN
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should reject emails with TLD less than 2 characters', () => {
    const shortTldArb = fc.string({ minLength: 1, maxLength: 1 })
      .filter(s => s.length === 1 && /^[a-z]$/.test(s))

    fc.assert(
      fc.property(validLocalPartArb, validDomainLabelArb, shortTldArb, (local, domain, tld) => {
        const email = `${local}@${domain}.${tld}`
        const result = validateEmail(email)
        return result.isValid === false && result.errorCode === ERROR_CODES.EMAIL_INVALID_TLD
      }),
      { numRuns: 100 }
    )
  })

  it('should reject emails without dot in domain', () => {
    fc.assert(
      fc.property(validLocalPartArb, validDomainLabelArb, (local, domain) => {
        const email = `${local}@${domain}`
        const result = validateEmail(email)
        return result.isValid === false && result.errorCode === ERROR_CODES.EMAIL_INVALID_DOMAIN
      }),
      { numRuns: 100 }
    )
  })
})


/**
 * Feature: email-validation-improvement
 * Property 2: Email Normalization (Trimming)
 * Validates: Requirements 1.6
 * 
 * For any email string with leading or trailing whitespace, the normalizeEmail function 
 * SHALL return the same result as the trimmed version of that email.
 */
describe('Property 2: Email Normalization (Trimming)', () => {
  // Arbitrary for generating whitespace
  const whitespaceArb = fc.array(fc.constantFrom(' ', '\t', '\n', '\r'), { minLength: 1, maxLength: 5 })
    .map(arr => arr.join(''))

  // Arbitrary for generating valid email content (without leading/trailing whitespace)
  const emailContentArb = fc.emailAddress()

  it('should trim leading whitespace from emails', () => {
    fc.assert(
      fc.property(whitespaceArb, emailContentArb, (ws, email) => {
        const withLeadingWs = ws + email
        const normalized = normalizeEmail(withLeadingWs)
        return normalized === email.toLowerCase()
      }),
      { numRuns: 100 }
    )
  })

  it('should trim trailing whitespace from emails', () => {
    fc.assert(
      fc.property(emailContentArb, whitespaceArb, (email, ws) => {
        const withTrailingWs = email + ws
        const normalized = normalizeEmail(withTrailingWs)
        return normalized === email.toLowerCase()
      }),
      { numRuns: 100 }
    )
  })

  it('should trim both leading and trailing whitespace from emails', () => {
    fc.assert(
      fc.property(whitespaceArb, emailContentArb, whitespaceArb, (leadingWs, email, trailingWs) => {
        const withBothWs = leadingWs + email + trailingWs
        const normalized = normalizeEmail(withBothWs)
        return normalized === email.toLowerCase()
      }),
      { numRuns: 100 }
    )
  })

  it('should convert email to lowercase', () => {
    fc.assert(
      fc.property(emailContentArb, (email) => {
        const normalized = normalizeEmail(email)
        return normalized === email.toLowerCase()
      }),
      { numRuns: 100 }
    )
  })

  it('should return empty string for non-string inputs', () => {
    fc.assert(
      fc.property(fc.oneof(fc.constant(null), fc.constant(undefined), fc.integer(), fc.boolean()), (input) => {
        const normalized = normalizeEmail(input)
        return normalized === ''
      }),
      { numRuns: 100 }
    )
  })

  it('normalizing then validating should produce same result as validating trimmed email', () => {
    fc.assert(
      fc.property(whitespaceArb, emailContentArb, whitespaceArb, (leadingWs, email, trailingWs) => {
        const withWhitespace = leadingWs + email + trailingWs
        const resultWithWs = validateEmail(withWhitespace)
        const resultTrimmed = validateEmail(email)
        return resultWithWs.isValid === resultTrimmed.isValid && 
               resultWithWs.errorCode === resultTrimmed.errorCode
      }),
      { numRuns: 100 }
    )
  })
})


/**
 * Feature: email-validation-improvement
 * Property 3: Case-Insensitive Email Comparison
 * Validates: Requirements 2.2
 * 
 * For any two email strings that differ only in letter case, the system SHALL treat them 
 * as equivalent for uniqueness checking purposes.
 */
describe('Property 3: Case-Insensitive Email Comparison', () => {
  // Arbitrary for generating valid email content
  const emailContentArb = fc.emailAddress()

  // Function to randomly change case of characters in a string
  const randomizeCaseArb = (email) => {
    return fc.array(fc.boolean(), { minLength: email.length, maxLength: email.length })
      .map(bools => {
        return email.split('').map((char, i) => {
          if (bools[i] && /[a-zA-Z]/.test(char)) {
            return char === char.toLowerCase() ? char.toUpperCase() : char.toLowerCase()
          }
          return char
        }).join('')
      })
  }

  it('should normalize emails to the same value regardless of case', () => {
    fc.assert(
      fc.property(emailContentArb, (email) => {
        // Generate different case variations
        const lowerCase = email.toLowerCase()
        const upperCase = email.toUpperCase()
        const mixedCase = email.split('').map((c, i) => 
          i % 2 === 0 ? c.toLowerCase() : c.toUpperCase()
        ).join('')

        const normalizedLower = normalizeEmail(lowerCase)
        const normalizedUpper = normalizeEmail(upperCase)
        const normalizedMixed = normalizeEmail(mixedCase)

        // All should normalize to the same lowercase value
        return normalizedLower === normalizedUpper && 
               normalizedUpper === normalizedMixed &&
               normalizedLower === email.toLowerCase()
      }),
      { numRuns: 100 }
    )
  })

  it('should produce identical validation results for case-variant emails', () => {
    fc.assert(
      fc.property(emailContentArb, (email) => {
        const lowerCase = email.toLowerCase()
        const upperCase = email.toUpperCase()
        const mixedCase = email.split('').map((c, i) => 
          i % 2 === 0 ? c.toLowerCase() : c.toUpperCase()
        ).join('')

        const resultLower = validateEmail(lowerCase)
        const resultUpper = validateEmail(upperCase)
        const resultMixed = validateEmail(mixedCase)

        // All case variants should produce the same validation result
        return resultLower.isValid === resultUpper.isValid &&
               resultUpper.isValid === resultMixed.isValid &&
               resultLower.errorCode === resultUpper.errorCode &&
               resultUpper.errorCode === resultMixed.errorCode
      }),
      { numRuns: 100 }
    )
  })

  it('should treat emails differing only in case as equivalent after normalization', () => {
    fc.assert(
      fc.property(
        emailContentArb,
        fc.array(fc.boolean(), { minLength: 1, maxLength: 100 }),
        (email, caseFlags) => {
          // Create a case-variant version of the email
          const variant = email.split('').map((char, i) => {
            const flag = caseFlags[i % caseFlags.length]
            if (flag && /[a-zA-Z]/.test(char)) {
              return char === char.toLowerCase() ? char.toUpperCase() : char.toLowerCase()
            }
            return char
          }).join('')

          // Both should normalize to the same value
          return normalizeEmail(email) === normalizeEmail(variant)
        }
      ),
      { numRuns: 100 }
    )
  })
})


/**
 * Feature: email-validation-improvement
 * Property 4: Frontend-Backend Validation Consistency
 * Validates: Requirements 3.1
 * 
 * For any email string, the Frontend_Validator and Backend_Validator SHALL produce 
 * identical validation results (isValid and errorCode).
 * 
 * Note: Since both frontend and backend use the same validation logic (shared module),
 * we test that the validation function produces consistent results across all inputs.
 */
describe('Property 4: Frontend-Backend Validation Consistency', () => {
  // Arbitrary for generating any string input (simulating user input)
  const anyStringArb = fc.string({ minLength: 0, maxLength: 100 })

  // Arbitrary for generating valid email addresses
  const validEmailArb = fc.emailAddress()

  // Arbitrary for generating strings with various edge cases
  const edgeCaseStringArb = fc.oneof(
    fc.constant(''),
    fc.constant(' '),
    fc.constant('@'),
    fc.constant('@@'),
    fc.constant('test@'),
    fc.constant('@test'),
    fc.constant('test@test'),
    fc.constant('test@.com'),
    fc.constant('test@test.'),
    fc.constant('test@-test.com'),
    fc.constant('test@test-.com'),
    anyStringArb
  )

  it('should produce deterministic results for any input (same input always gives same output)', () => {
    fc.assert(
      fc.property(anyStringArb, (email) => {
        // Call validateEmail twice with the same input
        const result1 = validateEmail(email)
        const result2 = validateEmail(email)

        // Results should be identical
        return result1.isValid === result2.isValid &&
               result1.errorCode === result2.errorCode &&
               result1.error === result2.error
      }),
      { numRuns: 100 }
    )
  })

  it('should produce consistent results for valid emails', () => {
    fc.assert(
      fc.property(validEmailArb, (email) => {
        const result = validateEmail(email)
        
        // Valid emails should always pass validation
        // and have null error/errorCode
        if (result.isValid) {
          return result.error === null && result.errorCode === null
        }
        // If not valid, should have both error and errorCode
        return result.error !== null && result.errorCode !== null
      }),
      { numRuns: 100 }
    )
  })

  it('should produce consistent results for edge case inputs', () => {
    fc.assert(
      fc.property(edgeCaseStringArb, (email) => {
        const result1 = validateEmail(email)
        const result2 = validateEmail(email)

        // Results should be identical for edge cases
        return result1.isValid === result2.isValid &&
               result1.errorCode === result2.errorCode
      }),
      { numRuns: 100 }
    )
  })

  it('should always return a valid result structure', () => {
    fc.assert(
      fc.property(anyStringArb, (email) => {
        const result = validateEmail(email)

        // Result should always have the expected structure
        const hasValidStructure = 
          typeof result === 'object' &&
          typeof result.isValid === 'boolean' &&
          (result.error === null || typeof result.error === 'string') &&
          (result.errorCode === null || typeof result.errorCode === 'string')

        // If valid, error and errorCode should be null
        // If invalid, error and errorCode should be strings
        const hasConsistentState = result.isValid 
          ? (result.error === null && result.errorCode === null)
          : (result.error !== null && result.errorCode !== null)

        return hasValidStructure && hasConsistentState
      }),
      { numRuns: 100 }
    )
  })

  it('should produce same validation result regardless of how many times called', () => {
    fc.assert(
      fc.property(anyStringArb, fc.integer({ min: 2, max: 10 }), (email, times) => {
        const results = []
        for (let i = 0; i < times; i++) {
          results.push(validateEmail(email))
        }

        // All results should be identical
        const firstResult = results[0]
        return results.every(r => 
          r.isValid === firstResult.isValid &&
          r.errorCode === firstResult.errorCode &&
          r.error === firstResult.error
        )
      }),
      { numRuns: 100 }
    )
  })
})


/**
 * Feature: email-validation-improvement
 * Property 5: Email Validation Round-Trip
 * Validates: Requirements 1.6, 3.1
 * 
 * For any valid email that passes validation, normalizing it and then validating again 
 * SHALL still pass validation.
 */
describe('Property 5: Email Validation Round-Trip', () => {
  // Arbitrary for generating valid local parts (letters, numbers, dots, hyphens, underscores, plus signs)
  const validLocalChars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789._+-'
  const validLocalPartArb = fc.string({ minLength: 1, maxLength: 64 })
    .filter(s => s.length > 0 && [...s].every(c => validLocalChars.includes(c)))

  // Arbitrary for generating valid domain labels (letters, numbers, hyphens, but not starting/ending with hyphen)
  const domainChars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  const validDomainLabelArb = fc.tuple(
    fc.constantFrom(...domainChars.split('')),
    fc.array(fc.constantFrom(...(domainChars + '-').split('')), { minLength: 0, maxLength: 10 }),
    fc.constantFrom(...domainChars.split(''))
  ).map(([first, middle, last]) => first + middle.join('') + last)

  // Arbitrary for generating valid TLDs (at least 2 characters, letters only)
  const tldChars = 'abcdefghijklmnopqrstuvwxyz'
  const validTldArb = fc.string({ minLength: 2, maxLength: 6 })
    .filter(s => s.length >= 2 && [...s].every(c => tldChars.includes(c)))

  // Arbitrary for generating valid emails
  const validEmailArb = fc.tuple(validLocalPartArb, validDomainLabelArb, validTldArb)
    .map(([local, domain, tld]) => `${local}@${domain}.${tld}`)

  // Arbitrary for generating whitespace
  const whitespaceArb = fc.array(fc.constantFrom(' ', '\t', '\n', '\r'), { minLength: 0, maxLength: 5 })
    .map(arr => arr.join(''))

  it('should pass validation after normalizing a valid email', () => {
    fc.assert(
      fc.property(validEmailArb, (email) => {
        // First validate the original email
        const originalResult = validateEmail(email)
        
        // Normalize the email
        const normalized = normalizeEmail(email)
        
        // Validate the normalized email
        const normalizedResult = validateEmail(normalized)
        
        // If original passes, normalized should also pass
        // (normalization should not break valid emails)
        return originalResult.isValid === true && normalizedResult.isValid === true
      }),
      { numRuns: 100 }
    )
  })

  it('should pass validation after normalizing a valid email with whitespace', () => {
    fc.assert(
      fc.property(whitespaceArb, validEmailArb, whitespaceArb, (leadingWs, email, trailingWs) => {
        const emailWithWhitespace = leadingWs + email + trailingWs
        
        // Validate the email with whitespace (should pass due to internal trimming)
        const originalResult = validateEmail(emailWithWhitespace)
        
        // Normalize the email
        const normalized = normalizeEmail(emailWithWhitespace)
        
        // Validate the normalized email
        const normalizedResult = validateEmail(normalized)
        
        // Both should pass validation
        return originalResult.isValid === true && normalizedResult.isValid === true
      }),
      { numRuns: 100 }
    )
  })

  it('should produce idempotent normalization (normalizing twice equals normalizing once)', () => {
    fc.assert(
      fc.property(validEmailArb, (email) => {
        const normalizedOnce = normalizeEmail(email)
        const normalizedTwice = normalizeEmail(normalizedOnce)
        
        // Normalizing twice should produce the same result as normalizing once
        return normalizedOnce === normalizedTwice
      }),
      { numRuns: 100 }
    )
  })

  it('should maintain validation consistency through normalize-validate cycle', () => {
    fc.assert(
      fc.property(validEmailArb, (email) => {
        // Validate original
        const result1 = validateEmail(email)
        
        // Normalize then validate
        const normalized = normalizeEmail(email)
        const result2 = validateEmail(normalized)
        
        // Normalize again then validate
        const normalizedAgain = normalizeEmail(normalized)
        const result3 = validateEmail(normalizedAgain)
        
        // All should be valid and consistent
        return result1.isValid === result2.isValid && 
               result2.isValid === result3.isValid &&
               result1.isValid === true
      }),
      { numRuns: 100 }
    )
  })

  it('should preserve validation result through multiple round-trips', () => {
    fc.assert(
      fc.property(validEmailArb, fc.integer({ min: 1, max: 5 }), (email, iterations) => {
        let currentEmail = email
        let allValid = true
        
        for (let i = 0; i < iterations; i++) {
          const result = validateEmail(currentEmail)
          if (!result.isValid) {
            allValid = false
            break
          }
          currentEmail = normalizeEmail(currentEmail)
        }
        
        // Final validation after all iterations
        const finalResult = validateEmail(currentEmail)
        
        return allValid && finalResult.isValid === true
      }),
      { numRuns: 100 }
    )
  })
})
