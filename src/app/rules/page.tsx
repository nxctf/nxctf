"use client"

import { RulesMarkdownRenderer } from '@/shared/markdown/MarkdownRenderer'
import Loader from '@/shared/components/Loader'
import PageBackground from '@/shared/components/PageBackground'
import Footer from "@/_layouts/Footer";
import { rulesConfig } from "@/_vars/rules";
import { useAuth } from '@/shared/contexts/AuthContext'
import {
  SURFACE_GLASS_CARD_COMPACT_CLASS,
  THEME_PRIMARY_SELECTION_CLASS,
  TYPO_PAGE_TITLE_CLASS,
  TYPO_CARD_TITLE_CLASS,
  TYPO_METADATA_CLASS,
  PAGE_MAIN_CONTAINER_5XL
} from '@/shared/styles'
import { cn } from '@/shared/lib/utils'
import BackButton from '@/shared/components/BackButton'

export default function RulesPage() {
  const { loading } = useAuth()

  if (loading) {
    return (
      <PageBackground
        className="flex justify-center items-center overflow-hidden"
        selectionClassName={THEME_PRIMARY_SELECTION_CLASS}
      >
        <Loader color="text-blue-500" />
      </PageBackground>
    )
  }

  return (
    <PageBackground
      className="flex flex-col overflow-hidden"
      selectionClassName={THEME_PRIMARY_SELECTION_CLASS}
    >

      <main className={cn(PAGE_MAIN_CONTAINER_5XL, "flex-1 flex flex-col space-y-4")}>
        {/* TACTICAL HEADER */}
        <header className="flex items-center justify-between border-b border-gray-200/50 pb-4 dark:border-gray-800/60">
          <div className="flex flex-col">
            <h1 className={TYPO_PAGE_TITLE_CLASS}>
              Platform Rules
            </h1>
            <div className={cn("flex items-center gap-1.5", TYPO_METADATA_CLASS)}>
              <div className="h-1 w-1 rounded-full bg-blue-500" />
              Play fair, hack hard
            </div>
          </div>

          <BackButton
            href="/"
            label="Dashboard"
          />
        </header>

        {/* RULES LIST - Lightweight Grid */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {rulesConfig.rules.map((rule, idx) => (
            <div
              key={idx}
              className={cn("group flex flex-col gap-2 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-500/40", SURFACE_GLASS_CARD_COMPACT_CLASS)}
            >
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-[11px] font-mono font-black text-blue-600 ring-1 ring-blue-500/20 transition-transform group-hover:scale-105 dark:text-blue-400">
                  {String(idx + 1).padStart(2, '0')}
                </div>
                <div className="mt-1.5 flex-1 space-y-1.5 min-w-0">
                  <h3 className={cn(TYPO_CARD_TITLE_CLASS, "leading-tight")}>
                    {rule.title}
                  </h3>
                  <div className="text-xs text-gray-500 dark:text-gray-400/90 leading-relaxed font-medium">
                    <RulesMarkdownRenderer content={rule.description} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* STEALTH FLAG - Perfectly Invisible */}
        {rulesConfig.showHiddenFlag && (
          <div className="mt-8 flex justify-center">
            <p className="text-[15px] font-mono select-all cursor-help text-[#fafafa] dark:text-[#0b0f19] leading-none opacity-100 hover:opacity-100 transition-opacity">
              {rulesConfig.hiddenFlagBase64}
            </p>
          </div>
        )}
      </main>

      <Footer />
    </PageBackground>
  )
}
