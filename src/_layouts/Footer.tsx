import React from 'react'
import APP from '@/config'
import { NXCTF } from '@/_vars/const'
import { VERSION, BUILD_TIME } from "@/_vars/version";
import { useSystemSettings } from '@/shared/contexts/SystemSettingsContext'
import { Github, Coffee, Code2, Shield } from 'lucide-react'
import { SURFACE_GLASS_CARD_COMPACT_CLASS } from '@/shared/styles'

const Footer: React.FC = () => {
  const { settings } = useSystemSettings()

  return (
    <footer className="relative z-10 mt-auto w-full border-t border-gray-200/70 py-8 dark:border-gray-800/80">
      <div className="max-w-6xl mx-auto px-6">

        {/* Layout 3 Kolom Presisi (33% masing-masing) */}
        <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-8">

          {/* KOLOM KIRI: Brand & Build */}
          <div className="flex flex-col items-center md:items-start space-y-2 overflow-hidden">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
              <a
                href={NXCTF.nxctf_url}
                target="_blank"
                rel="noopener"
                className="text-lg font-black tracking-tighter text-gray-900 dark:text-white uppercase leading-none transition-colors hover:text-blue-600 dark:hover:text-blue-400"
                title={`${NXCTF.nxctf_title} website`}
              >
                {APP.shortName}<span className="text-blue-600"></span>
              </a>
            </div>

            <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400/80 font-mono">
                V{VERSION}
              </span>
              <span className="opacity-30">|</span>
              <span className="font-mono text-[9px]">{BUILD_TIME.split('T')[0]}</span>
            </div>
          </div>

          {/* KOLOM TENGAH: Support & Links */}
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">
              <a href={NXCTF.nxctf_url} className="hover:text-blue-500 transition-colors">Site</a>
              <a href={NXCTF.nxctf_github} className="hover:text-blue-500 transition-colors">Repo</a>
              <a href={NXCTF.nxctf_docs} className="hover:text-blue-500 transition-colors">Docs</a>
              <a href={NXCTF.nxctf_discord} className="hover:text-blue-500 transition-colors">Discord</a>
            </div>

            <a
              href={NXCTF.nxctf_donation}
              target="_blank"
              rel="noopener"
              className="group flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-600/5 px-3 py-2 text-blue-600 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-500/40 hover:bg-blue-500/10 hover:text-blue-700 dark:bg-blue-400/5 dark:text-blue-400 dark:hover:text-blue-300"
            >
              <Coffee size={14} className="text-blue-500" />
              <span className="text-[11px] font-bold uppercase tracking-wider">Support Dev</span>
            </a>
          </div>

          {/* KOLOM KANAN: Developer & Social (Gaya Favorit Lo) */}
          <div className="flex items-center justify-center md:justify-end gap-3">
            {/* Org Link */}
            <a
              href={NXCTF.nxctf_github_org}
              target="_blank"
              className={`group flex items-center gap-3 py-3 pl-3 pr-4 ${SURFACE_GLASS_CARD_COMPACT_CLASS} hover:border-blue-500/40`}
              title="Organization"
            >
              <div className="p-1 rounded-lg bg-blue-500/10 text-blue-600 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                <Github size={18} />
              </div>
              <div className="flex flex-col items-start leading-none">
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">Org</span>
                <span className="text-xs font-black text-gray-900 dark:text-white group-hover:text-blue-500 transition-colors">{NXCTF.nxctf_title}</span>
              </div>
            </a>

            {/* Personal Link Card */}
            <a
              href={NXCTF.nxctf_author}
              target="_blank"
              className={`group flex items-center gap-3 py-3 pl-3 pr-4 ${SURFACE_GLASS_CARD_COMPACT_CLASS} hover:border-blue-500/40`}
            >
              <div className="p-1 rounded-lg bg-blue-500/10 text-blue-600 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                <Code2 size={16} />
              </div>
              <div className="flex flex-col items-start leading-none">
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">Creator</span>
                <span className="text-xs font-black text-gray-900 dark:text-white group-hover:text-blue-500 transition-colors">Aria Fatah</span>
              </div>
            </a>
          </div>

        </div>
      </div >
    </footer >
  )
}

export default Footer
