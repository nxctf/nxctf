/**
 * Server-only secrets entrypoint.
 * Put truly secret values here (will not be committed if you add to .gitignore).
 * This file reads from env vars but centralizes access so other modules import from here.
 */

// Server-only secrets entrypoint.
// Only truly secret values belong here. Keep Supabase public values
// (NEXT_PUBLIC_*) out of this file; those are safe to read from env.

// NXCTL / other secret tokens (server-only)
export const NXCTL_API_URL = process.env.NXCTL_API_URL || ''
export const NXCTL_API_TOKEN = process.env.NXCTL_API_TOKEN || ''

const SECRETS = {
  NXCTL_API_URL,
  NXCTL_API_TOKEN,
}
export default SECRETS
