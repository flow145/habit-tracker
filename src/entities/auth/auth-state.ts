import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { useShallow } from 'zustand/react/shallow'

import { authClient } from '~/shared/auth'

export type AuthState = { status: 'signedOut' } | { status: 'signedIn'; email: string }

type SessionState = ReturnType<typeof authClient.useSession>
type User = NonNullable<SessionState['data']>['user']

interface RememberedUser {
  id: string
  email: string
}

interface AuthStore {
  /**
   * Last User the server confirmed on this device; persisted to show the auth state
   * without waiting for the server. Without one, the app shows the sign-in form.
   */
  user: RememberedUser | null
}

const useAuthStore = create<AuthStore>()(
  persist((): AuthStore => ({ user: null }), {
    name: 'auth',
    version: 1,
    storage: createJSONStorage(() => localStorage),
    partialize: ({ user }) => ({ user }),
  }),
)

const confirmSignedIn = ({ id, email }: User) => useAuthStore.setState({ user: { id, email } })

const confirmSignedOut = () => useAuthStore.setState({ user: null })

/**
 * Applies one better-auth session update. Only a settled answer from the server changes
 * the auth state; an in-flight refetch (better-auth re-enables `isPending` and clears `error`
 * for a signed-out session, e.g. on tab focus) and a failed check keep the current state.
 */
const handleSession = (session: SessionState) => {
  if (session.isPending || session.isRefetching) return

  const { data, error } = session

  // better-auth keeps the last data on a failed refetch, so check the error first.
  if (error && error.status !== 401) return

  if (data) confirmSignedIn(data.user)
  else confirmSignedOut()
}

const sessionAtom = authClient.$store.atoms.session as {
  get: () => SessionState
  subscribe: (listener: (value: SessionState) => void) => () => void
}

sessionAtom.subscribe(handleSession)

const selectAuthState = ({ user }: AuthStore) =>
  user ? ({ status: 'signedIn', email: user.email } as const) : ({ status: 'signedOut' } as const)

export const useAuthState = (): AuthState => useAuthStore(useShallow(selectAuthState))

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
