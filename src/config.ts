export const APP = {
  shortName: "NXCTF",
  fullName: "NXCTF",
  description: "Aplikasi CTF minimalis dengan Next.js dan Supabase",

  image_icon: "favicon.ico",
  image_logo: "/logo.svg",
  image_preview: "og-image.png",

  /* Setting Config */
  notifSolves: true, // notifikasi global saat ada yang solve challenge

  teams: {
    enabled: true,
    hideScoreboardIndividual: false,
    hidescoreboardTotal: false,
  },

  difficultyStyles: {
    Baby: 'cyan',
    Easy: 'green',
    Medium: 'yellow',
    Hard: 'red',
    Insane: 'purple',
  },
}

export default APP
