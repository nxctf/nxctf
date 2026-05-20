import { atom } from 'jotai'
import type { UserLite } from '../types'

export const usernameQueryAtom = atom('')
export const selectedUserAtom = atom<UserLite | null>(null)
export const selectedEventIdAtom = atom('')
export const confirmOpenAtom = atom(false)

