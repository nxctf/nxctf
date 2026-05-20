/**
 * Auth Utility functions
 */

export function getAuthAvatarUrl(authUser: any): string | null {
  if (!authUser) return null
  const meta = authUser.user_metadata ?? authUser.raw_user_meta_data ?? null
  if (!meta) return null

  const candidate =
    meta.picture ||
    meta.avatar_url ||
    meta.photoURL ||
    meta.profile_picture_url ||
    meta.picture_url ||
    null

  if (!candidate) return null
  const trimmed = String(candidate).trim()
  if (!trimmed) return null
  const lower = trimmed.toLowerCase()
  if (lower === 'null' || lower === 'undefined' || lower === 'none') return null
  return trimmed
}

export function mergeProfilePicture<T extends Record<string, any>>(base: T, authUser: any, profileRow?: any): T {
  const merged: any = { ...base }

  // Prefer DB-managed profile_picture_url if present
  if (profileRow?.profile_picture_url != null) {
    merged.profile_picture_url = profileRow.profile_picture_url
  }

  // Prefer RPC picture, else fall back to auth metadata
  const authAvatar = getAuthAvatarUrl(authUser)
  merged.picture = profileRow?.picture ?? merged.picture ?? authAvatar ?? null

  // If base was missing profile_picture_url and RPC has it, keep it
  if (merged.profile_picture_url == null && profileRow?.profile_picture_url != null) {
    merged.profile_picture_url = profileRow.profile_picture_url
  }

  return merged
}

export function isValidUsername(username: string): string | null {
  // Tidak boleh lebih dari 30 karakter
  if (username.length > 30) {
    return 'Username must be at most 30 characters.'
  }
  // Tidak boleh kurang dari 3 karakter
  if (username.length < 3) {
    return 'Username must be at least 3 characters.'
  }
  // Tidak boleh mengandung karakter berbahaya
  if (/[></?"'\\]/.test(username)) {
    return 'Username contains invalid characters.'
  }
  // Tidak boleh mengandung emoji (unicode range emoji, tanpa flag 'u')
  // Ini blokir sebagian besar emoji umum
  if (/([\uD83C-\uDBFF][\uDC00-\uDFFF]|[\u2600-\u27BF])/.test(username)) {
    return 'Username cannot contain emoji.'
  }
  // Hanya boleh huruf, angka, underscore, titik, strip
  if (!/^[a-zA-Z0-9_.-]+$/.test(username)) {
    return 'Username can only contain letters, numbers, ".", "_", and "-".'
  }
  return null // valid
}
