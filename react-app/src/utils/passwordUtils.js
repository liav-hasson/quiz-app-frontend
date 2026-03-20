/**
 * Password strength checker and generator utilities.
 */

const SPECIAL_CHARS = '!@#$%^&*()_+-=[]{}|;:,.<>?'

/**
 * Check password strength and return a detailed result.
 * @param {string} password
 * @returns {{ score: number, checks: object, label: string, color: string }}
 */
export function checkPasswordStrength(password) {
  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    digit: /\d/.test(password),
    special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]/.test(password),
  }

  const score = Object.values(checks).filter(Boolean).length

  const labels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong']
  const colors = [
    'bg-red-500',       // 0 - Very Weak
    'bg-red-500',       // 1 - Weak
    'bg-orange-500',    // 2 - Fair
    'bg-yellow-500',    // 3 - Good
    'bg-green-400',     // 4 - Strong
    'bg-emerald-400',   // 5 - Very Strong
  ]
  const glows = [
    'shadow-[0_0_8px_rgba(239,68,68,0.6)]',
    'shadow-[0_0_8px_rgba(239,68,68,0.6)]',
    'shadow-[0_0_8px_rgba(249,115,22,0.6)]',
    'shadow-[0_0_8px_rgba(234,179,8,0.6)]',
    'shadow-[0_0_8px_rgba(74,222,128,0.6)]',
    'shadow-[0_0_8px_rgba(52,211,153,0.6)]',
  ]

  return {
    score,
    checks,
    label: labels[score],
    color: colors[score],
    glow: glows[score],
  }
}

/**
 * Generate a cryptographically random strong password.
 * @param {number} length - Password length (default 16)
 * @returns {string}
 */
export function generateStrongPassword(length = 16) {
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const lower = 'abcdefghijklmnopqrstuvwxyz'
  const digits = '0123456789'
  const special = SPECIAL_CHARS
  const all = upper + lower + digits + special

  const array = new Uint32Array(length)
  crypto.getRandomValues(array)

  // Guarantee at least one of each type
  const pick = (chars, idx) => chars[array[idx] % chars.length]
  const password = [
    pick(upper, 0),
    pick(lower, 1),
    pick(digits, 2),
    pick(special, 3),
  ]

  for (let i = 4; i < length; i++) {
    password.push(pick(all, i))
  }

  // Shuffle (Fisher-Yates using remaining random values)
  for (let i = password.length - 1; i > 0; i--) {
    const j = array[i] % (i + 1)
    ;[password[i], password[j]] = [password[j], password[i]]
  }

  return password.join('')
}
