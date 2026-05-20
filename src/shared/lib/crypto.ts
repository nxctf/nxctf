import CryptoJS from 'crypto-js'

/**
 * Hash flag menggunakan SHA256
 * @param flag String flag yang akan di-hash
 * @returns Hash SHA256 dalam format hexadecimal
 */
export function hashFlag(flag: string): string {
  return CryptoJS.SHA256(flag).toString()
}

/**
 * Validasi flag dengan membandingkan hash
 * @param flag Flag yang akan divalidasi
 * @param expectedHash Hash yang diharapkan
 * @returns True jika flag valid
 */
export function validateFlag(flag: string, expectedHash: string): boolean {
  const flagHash = hashFlag(flag)
  return flagHash === expectedHash
}
