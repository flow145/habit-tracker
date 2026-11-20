import { emailOTPClient } from 'better-auth/client/plugins'
import { createAuthClient } from 'better-auth/react'

type AuthErrorCode = keyof typeof authClient.$ERROR_CODES

export const OTP_LENGTH = 6

export const authErrors = {
  INVALID_EMAIL: 'INVALID_EMAIL',
  INVALID_OTP: 'INVALID_OTP',
  OTP_EXPIRED: 'OTP_EXPIRED',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  TOO_MANY_ATTEMPTS: 'TOO_MANY_ATTEMPTS',
} as const satisfies { [Code in AuthErrorCode]?: Code }

export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_BACKEND_URL,
  plugins: [emailOTPClient()],
})
