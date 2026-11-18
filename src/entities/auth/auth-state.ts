import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { useShallow } from 'zustand/react/shallow'

import { authClient } from '~/shared/auth'

export type AuthState =
  | { status: 'checking' }
  | { status: 'unreachable'; isRetrying: boolean }
  | { status: 'signedOut' }
  | { status: 'signedIn'; email: string }

type SessionState = ReturnType<typeof authClient.useSession>
type User = NonNullable<SessionState['data']>['user']

interface RememberedUser {
  id: string
  email: string
}

interface AuthStore {
  /** Last User the server confirmed on this device; persisted to show it before the server answers. */
  user: RememberedUser | null
  /** The server has answered whether a Session exists since the app started. */
  isConfirmed: boolean
  /** The latest session check failed to reach the server. */
  isUnreachable: boolean
  isChecking: boolean
}

const useAuthStore = create<AuthStore>()(
  persist(
    (): AuthStore => ({ user: null, isConfirmed: false, isUnreachable: false, isChecking: false }),
    {
      name: 'auth',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: ({ user }) => ({ user }),
    },
  ),
)

const confirmSignedIn = ({ id, email }: User) =>
  useAuthStore.setState({
    user: { id, email },
    isConfirmed: true,
    isUnreachable: false,
    isChecking: false,
  })

const confirmSignedOut = () =>
  useAuthStore.setState({ user: null, isConfirmed: true, isUnreachable: false, isChecking: false })

/**
 * Applies one better-auth session update. Only a settled answer from the server changes
 * the auth state; an in-flight refetch (better-auth re-enables `isPending` and clears `error`
 * for a signed-out session, e.g. on tab focus) only marks a check as running.
 */
const handleSession = (session: SessionState) => {
  if (session.isPending || session.isRefetching) {
    useAuthStore.setState({ isChecking: true })
    return
  }

  const { data, error } = session

  // better-auth keeps the last data on a failed refetch, so check the error first.
  if (error && error.status !== 401) {
    useAuthStore.setState({ isUnreachable: true, isChecking: false })
    return
  }

  if (data) confirmSignedIn(data.user)
  else confirmSignedOut()
}

const sessionAtom = authClient.$store.atoms.session as {
  get: () => SessionState
  subscribe: (listener: (value: SessionState) => void) => () => void
}

sessionAtom.subscribe(handleSession)

const selectAuthState = ({ user, isConfirmed, isUnreachable, isChecking }: AuthStore) => {
  if (user) return { status: 'signedIn', email: user.email } as const
  if (isConfirmed) return { status: 'signedOut' } as const
  if (isUnreachable) return { status: 'unreachable', isRetrying: isChecking } as const
  return { status: 'checking' } as const
}

export const useAuthState = (): AuthState => useAuthStore(useShallow(selectAuthState))

export const checkAuth = () => sessionAtom.get().refetch()

export const signIn = async (email: string, otp: string) => {
  const result = await authClient.signIn.emailOtp({ email, otp })
  if (!result.error) confirmSignedIn(result.data.user)
  return result
}

export const signOut = async () => {
  const result = await authClient.signOut()
  if (!result.error) confirmSignedOut()
  return result
}
