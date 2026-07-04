"use client";

// React Imports
import { useEffect, useState } from 'react'
import { motion } from "framer-motion";
import { Star, GitBranch, Users, Github, BookOpen, ScrollText, Info, ListOrdered, MessageSquare, Clock, Globe } from 'lucide-react'
import Image from "next/image";

// Shared Imports
import APP from "@/config";
import { NXCTF } from "@/_vars/const";
import { VERSION, BUILD_TIME } from "@/_vars/version";
import Loader from '@/shared/components/Loader'
import ImageWithFallback from '@/shared/components/ImageWithFallback'
import BrandLogo from '@/shared/components/BrandLogo'
import PageBackground from '@/shared/components/PageBackground'
import Footer from "@/_layouts/Footer";
import { useAuth } from '@/shared/contexts/AuthContext'
import {
  SURFACE_GLASS_CARD_COMPACT_CLASS,
  SURFACE_GLASS_CARD_INTERACTIVE_BLUE_CLASS,
  THEME_PRIMARY_PILL_CLASS,
  THEME_PRIMARY_SELECTION_CLASS,
} from '@/shared/styles'

const CONTRIBUTORS = [
  "@ariafatah0711",
  // "@GZTimeWalker",
  // "@hez2010",
  // "@GrakePch",
  //   "@Hanmur",
  //   "@KPwnZ",
  //   "@kengwang",
  //   "@idawnlight",
  //   "@Konano",
  //   "@YanWQ-monad",
  //   "@Ad-Bean",
  //   "@Reverier-Xu",
  //   "@TonyCrane",
  //   "@mcyydscc",
  //   "@cyc4188",
  //   "@Zeroc0077",
  //   "@weyung",
  //   "@happybear1234",
  //   "@xfoxfu",
];

function fillContributors(list: string[], minLength = 14) {
  if (list.length === 0) return [];

  const result: string[] = [];
  let i = 0;

  while (result.length < minLength) {
    result.push(list[i % list.length]);
    i++;
  }

  return result;
}
const filledContributors = fillContributors(CONTRIBUTORS, 14);

const LINKS = [
  { name: "Website", href: NXCTF.nxctf_url || "#", icon: Globe, description: "Official site" },
  { name: "GitHub", href: NXCTF.nxctf_github || "#", icon: Github, description: "Source code" },
  { name: "Docs", href: NXCTF.nxctf_docs || "#", icon: BookOpen, description: "Documentation" },
  { name: "Discord", href: NXCTF?.nxctf_discord || "#", icon: MessageSquare, description: "Community chat" },
];

export default function InfoPage() {
  const [repoStats, setRepoStats] = useState<{ stars: number; forks: number } | null>(null)
  const { loading } = useAuth()

  useEffect(() => {
    const repoUrl = NXCTF.nxctf_github
    if (!repoUrl) return
    try {
      const m = repoUrl.match(/github\.com\/(.+?)\/(.+?)(?:\.git|\/|$)/i)
      if (!m) return
      const owner = m[1]
      const repo = m[2]
      const api = `https://api.github.com/repos/${owner}/${repo}`
      fetch(api)
        .then(r => r.ok ? r.json() : null)
        .then((data) => {
          if (!data) return
          setRepoStats({ stars: data.stargazers_count || 0, forks: data.forks_count || 0 })
        })
        .catch(() => { })
    } catch (e) {
      // ignore
    }
  }, [])

  if (loading) return <Loader fullscreen />;

  return (
    <PageBackground
      className="flex flex-col overflow-hidden"
      selectionClassName={THEME_PRIMARY_SELECTION_CLASS}
    >
      <main className="flex-1 flex flex-col items-center relative z-10 w-full px-4 py-6 sm:px-6 lg:py-8">
        {/* HERO SECTION */}
        <section className="w-full max-w-3xl mx-auto flex flex-col items-center text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-2 flex flex-row items-center justify-center gap-3 text-3xl font-black tracking-tight sm:text-5xl"
          >
            <ImageWithFallback
              src={NXCTF.nxctf_logo}
              alt={`${NXCTF.nxctf_title} logo`}
              size={80}
              rounded={false}
            />
            <motion.span
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl sm:text-5xl"
            >
              <BrandLogo name={NXCTF.nxctf_title} />
            </motion.span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="max-w-5xl text-sm leading-6 text-gray-600 dark:text-gray-400 sm:text-base pb-5"
          >
            A modern Capture The Flag (CTF) platform built for security competitions, workshops, and training.
          </motion.p>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mb-4 font-mono text-[10px] text-gray-500 dark:text-gray-500 sm:text-xs"
          >
            &gt; {APP.description || "Ngehack untuk senang-senang, bukan buat nyari profit"}
          </motion.p>
        </section>

        {/* COMBINED STATS & PROJECT INFO STRIP */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className={`mb-6 flex w-full max-w-3xl flex-col p-3 sm:p-4 ${SURFACE_GLASS_CARD_INTERACTIVE_BLUE_CLASS}`}
        >
          {/* Top: GitHub Stats */}
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 pb-4">
            {repoStats && (
              <>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${THEME_PRIMARY_PILL_CLASS}`}>
                    <Star className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <div className="text-lg font-bold text-gray-900 dark:text-white leading-tight">{repoStats.stars}</div>
                    <div className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Stars</div>
                  </div>
                </div>
                <div className="h-8 w-px bg-gray-200 dark:bg-gray-800 hidden sm:block"></div>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${THEME_PRIMARY_PILL_CLASS}`}>
                    <GitBranch className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <div className="text-lg font-bold text-gray-900 dark:text-white leading-tight">{repoStats.forks}</div>
                    <div className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Forks</div>
                  </div>
                </div>
                <div className="h-8 w-px bg-gray-200 dark:bg-gray-800 hidden sm:block"></div>
              </>
            )}
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl ${THEME_PRIMARY_PILL_CLASS}`}>
                <Users className="w-4 h-4" />
              </div>
              <div className="text-left">
                <div className="text-lg font-bold text-gray-900 dark:text-white leading-tight">{CONTRIBUTORS.length}</div>
                <div className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Contributors</div>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="w-full h-px bg-gray-200 dark:bg-gray-800"></div>

          {/* Bottom: Technical Details */}
          <div className="flex flex-wrap items-center justify-center gap-y-2 gap-x-4 sm:gap-x-6 pt-3 text-[11px] font-mono text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-1.5">
              <Info size={14} className="text-blue-500" />
              <span className="font-medium text-gray-700 dark:text-gray-300">v{VERSION}</span>
            </div>

            <div className="flex items-center gap-1.5">
              <Clock size={14} className="text-blue-500" />
              <span>{BUILD_TIME}</span>
            </div>

            <a href={`${NXCTF.nxctf_github}/blob/main/LICENSE` || "https://www.apache.org/licenses/LICENSE-2.0"} target="_blank" rel="noopener" className="flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400 transition-colors group">
              <ScrollText size={14} className="group-hover:text-blue-500 transition-colors" /> Apache 2.0
            </a>

            <a href={`${NXCTF.nxctf_github}/blob/main/CHANGELOG.md` || '#'} target="_blank" rel="noopener" className="flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400 transition-colors group">
              <ListOrdered size={14} className="group-hover:text-blue-500 transition-colors" /> Changelog
            </a>
          </div>
        </motion.div>

        {/* QUICK LINKS */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mb-8 grid w-full max-w-3xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          {LINKS.map((link, i) => {
            const Icon = link.icon;
            if (link.href === "#") return null;
            return (
              <a
                key={i}
                href={link.href}
                target="_blank"
                rel="noopener"
                className={`group flex flex-row items-center gap-4 p-3.5 ${SURFACE_GLASS_CARD_INTERACTIVE_BLUE_CLASS}`}
              >
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 group-hover:text-blue-500 group-hover:bg-blue-50 dark:group-hover:bg-blue-500/10 group-hover:scale-110 transition-all duration-300">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-blue-500 transition-colors">
                    {link.name}
                  </span>
                  <span className="text-[10px] text-gray-500 font-medium">{link.description}</span>
                </div>
              </a>
            );
          })}
        </motion.div>

        {/* CONTRIBUTORS MARQUEE */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="relative mb-6 w-full max-w-5xl"
        >
          <div className="mb-4 text-center">
            <h2 className="flex items-center justify-center gap-2 text-sm sm:text-lg font-black uppercase tracking-widest text-gray-900 dark:text-white">
              <Users size={20} className="text-blue-500 sm:w-6 sm:h-6" /> Built by the Community
            </h2>
          </div>

          <div className="marquee-group relative w-full overflow-hidden space-y-3 py-2">
            {/* Gradient Fades for Marquee */}
            <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[#fafafa] dark:from-[#0b0f19] to-transparent z-10" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-[#fafafa] dark:from-[#0b0f19] to-transparent z-10" />

            {/* ROW 1 */}
            <div className="marquee marquee-left">
              <div className="marquee-track" style={{ willChange: 'transform' }}>
                {[...filledContributors, ...filledContributors].map((name, i) => {
                  const username = name.replace("@", "");
                  return (
                    <a
                      key={`top-${i}`}
                      href={`https://github.com/${username}`}
                      target="_blank"
                      rel="noopener"
                      className={`group mx-2 flex shrink-0 items-center gap-3 px-4 py-2 ${SURFACE_GLASS_CARD_COMPACT_CLASS} rounded-full hover:border-blue-500/40`}
                    >
                      <ProfileAvatar username={username} />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-blue-500 transition-colors">
                        {username}
                      </span>
                    </a>
                  );
                })}
              </div>
            </div>

            {/* ROW 2 */}
            <div className="marquee marquee-right">
              <div className="marquee-track" style={{ willChange: 'transform' }}>
                {[...filledContributors, ...filledContributors].map((name, i) => {
                  const username = name.replace("@", "");
                  return (
                    <a
                      key={`bot-${i}`}
                      href={`https://github.com/${username}`}
                      target="_blank"
                      rel="noopener"
                      className={`group mx-2 flex shrink-0 items-center gap-3 px-4 py-2 ${SURFACE_GLASS_CARD_COMPACT_CLASS} rounded-full hover:border-blue-500/40`}
                    >
                      <ProfileAvatar username={username} />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-blue-500 transition-colors">
                        {username}
                      </span>
                    </a>
                  );
                })}
              </div>
            </div>
          </div>
        </motion.div>

      </main>

      <Footer />
    </PageBackground>
  );
}

function ProfileAvatar({ username, size = 32 }: { username: string; size?: number }) {
  const [loaded, setLoaded] = useState(false)
  const [errored, setErrored] = useState(false)
  const url = `https://github.com/${username}.png`

  useEffect(() => {
    let cancelled = false
    setLoaded(false)
    setErrored(false)
    const img = new window.Image()
    img.src = url
    img.onload = () => { if (!cancelled) setLoaded(true) }
    img.onerror = () => { if (!cancelled) setErrored(true) }
    return () => { cancelled = true }
  }, [url])

  const sizeClass = size === 32 ? 'w-8 h-8' : `w-[${size}px] h-[${size}px]`

  if (!loaded) {
    return (
      <div className={`${sizeClass} rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse`} aria-hidden />
    )
  }

  return (
    <Image
      src={url}
      alt={`${username} avatar`}
      width={size}
      height={size}
      className={`${sizeClass} rounded-full grayscale group-hover:grayscale-0 transition-all duration-300 shadow-sm`}
      style={{ opacity: loaded && !errored ? 1 : 0 }}
      unoptimized
    />
  )
}
