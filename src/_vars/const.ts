export const NXCTF = {
  nxctf_title: 'NXCTF',
  nxctf_url: 'https://nxctf.my.id',
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

// APP
export const YEAR = new Date().getFullYear()

// Supabase configuration
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || ''

// Maintenance mode
export const MAINTENANCE_MODE = process.env.NEXT_PUBLIC_MAINTENANCE_MODE || 'no'

// Env-backed site configuration
export const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"

// Turnstile captcha configuration
export const CAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() || ''
export const CAPTCHA_ENABLED = Boolean(CAPTCHA_SITE_KEY)

export const CHALLENGE_DESC_TEMPLATE = `> Author: nama

Desc chall aaaaaaaaaaaaaaaaaaaaaaaa
aaaaaaaaaaaaaaaaaa

bbbbbbbbbbbbbbbbbbbbbbbbbbbb

![gambar](https://raw.githubusercontent.com/nxctf/assets/refs/heads/main/event/active_nxctf.png)

if ur want use link [link](https://nxctf.my.id)

\`\`\`python
print('a')
\`\`\`

> Format: {{FLAG_FORMAT}}`

const APP_CONSTANTS = { LINKS, YEAR, SUPABASE_URL, SUPABASE_ANON_KEY, MAINTENANCE_MODE, BASE_URL, CAPTCHA_SITE_KEY, CAPTCHA_ENABLED, CHALLENGE_DESC_TEMPLATE }
export default APP_CONSTANTS
