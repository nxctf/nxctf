export const NXCTF = {
  nxctf_title: 'NXCTF',
  nxctf_logo: 'https://raw.githubusercontent.com/nxctf/assets/refs/heads/main/logo/logo-no-bg.svg',
  nxctf_discord: 'https://discord.gg/5etKks6aQQ',
  nxctf_donation: 'https://saweria.co/nxctf',
  nxctf_github: 'https://github.com/nxctf/nxctf',
  nxctf_github_org: 'https://github.com/nxctf',
  nxctf_author: 'https://github.com/ariafatah0711',
  nxctf_docs: 'https://docs.nxctf.my.id/'
}

export const LINKS = {
  nextjs: 'https://nextjs.org/',
  tailwind: 'https://tailwindcss.com/',
  framer: 'https://www.framer.com/motion/',
  supabase: 'https://supabase.com/',
  vercel: 'https://vercel.com/',
}

export const YEAR = new Date().getFullYear()

export const DIFFICULTY_STYLES: Record<string, string> = {
  Baby: 'cyan',
  Easy: 'green',
  Medium: 'yellow',
  Hard: 'red',
  Insane: 'purple',
}

// Supabase configuration
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || ''

// Maintenance mode
export const MAINTENANCE_MODE = process.env.NEXT_PUBLIC_MAINTENANCE_MODE || 'no'

const APP_CONSTANTS = { LINKS, YEAR, DIFFICULTY_STYLES, SUPABASE_URL, SUPABASE_ANON_KEY, MAINTENANCE_MODE }
export default APP_CONSTANTS
