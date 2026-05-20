import { LINKS, YEAR, DIFFICULTY_STYLES, NXCTF } from './const'

export const APP = {
  shortName: "NXCTF",
  fullName: "NXCTF",
  description: "Aplikasi CTF minimalis dengan Next.js dan Supabase",
  flagFormat: "NXCTF{your_flag_here}",

  challengeCategories: [
    "Intro",
    "Boot To Root",
    "Web",
    "Forensics",
    "AI",
    "Osint",
    "Crypto",
    "Reverse",
    "Pwn",
    "Stegnography",
    "Misc",
    "Blockchain",
    "Network"
  ],

  // Base URL (ambil dari env kalau ada). Prefer changing NEXT_PUBLIC_SITE_URL in .env.local.
  baseUrl: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  image_icon: "favicon.ico",
  image_logo: "logo.svg",
  image_preview: "og-image.png",

  // Turnstile aktif otomatis kalau site key ada di env.
  captchaEnabled: Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim()),
  captchaSiteKey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() || '',

  /* Setting Config */
  notifSolves: true, // notifikasi global saat ada yang solve challenge

  teams: {
    enabled: true,
    hideScoreboardIndividual: false,
    hidescoreboardTotal: false,
  },
  hideEventMain: false, // enable / disable hiding "Main Event" in event selector (useful for single event nxctf)
  // Label untuk challenges tanpa event_id (event_id = NULL). Jika kosong, fallback ke "Main".

  eventMainLabel: "main",
  // Gambar untuk "Main/Featured" event (boleh URL external atau path public). Contoh:
  // 'https://example.com/banner.png' atau '/images/banner.png'
  eventMainImageUrl: "https://raw.githubusercontent.com/ariafatah0711/fgte_s1/refs/heads/main/img/FGTE_2026.png",
  // Fallback image untuk event yang tidak punya image_url.
  eventFallbackImageUrl: "https://raw.githubusercontent.com/ariafatah0711/fgte_s1/refs/heads/main/img/FGTE_Blank.png",

  /* Maintenance configuration (env-only): NEXT_PUBLIC_MAINTENANCE_MODE should be 'yes' or 'no'. */
  maintenance: {
    mode: process.env.NEXT_PUBLIC_MAINTENANCE_MODE === 'yes' ? 'yes' : 'no',
  },

  links: {
    ...LINKS,
    discord: "https://discord.gg/5etKks6aQQ",
  },
  difficultyStyles: DIFFICULTY_STYLES,
  year: YEAR,
  nxctf: NXCTF
}

export default APP
