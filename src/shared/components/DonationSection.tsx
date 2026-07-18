'use client'

import React, { useEffect, useState } from 'react'
import { Trophy, ArrowUpRight, Heart } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/shared/ui/dialog'
import { SurfaceCard } from '@/shared/ui/surface'
import CustomBadge from '@/shared/ui/CustomBadge'
import { NXCTF } from '@/_vars/const'

interface Donor {
  donator: string;
  amount: number;
  currency: string;
  is_user?: boolean;
}

interface RecentDonation {
  donator: string;
  amount: number;
  currency: string;
  message?: string;
}

export default function DonationSection() {
  const apiUrl = process.env.NEXT_PUBLIC_SAWERIA_API_URL
  const donationUrl = NXCTF.nxctf_donation || 'https://saweria.co/nxctf'

  const [isOpen, setIsOpen] = useState(false)
  const [leaderboard, setLeaderboard] = useState<Donor[]>([])
  const [recent, setRecent] = useState<RecentDonation[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch Saweria data
  useEffect(() => {
    if (!apiUrl) return

    const sanitizedUrl = apiUrl.replace(/\/$/, '')

    const fetchData = async () => {
      try {
        // Fetch Leaderboard
        const lbRes = await fetch(`${sanitizedUrl}/leaderboard.json`)
        let lbData: Donor[] = []
        if (lbRes.ok) {
          const lbJson = await lbRes.json()
          lbData = lbJson.data || []
        }

        // Fetch Recent Transactions
        const recRes = await fetch(`${sanitizedUrl}/recent.json`)
        let recData: RecentDonation[] = []
        if (recRes.ok) {
          const recJson = await recRes.json()
          recData = recJson.data || []
        }

        setLeaderboard(lbData)
        setRecent(recData)
      } catch (err) {
        console.error('Failed to fetch Saweria donation data:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [apiUrl])

  // Handle auto-open on mount with sessionStorage
  useEffect(() => {
    if (!apiUrl) return

    const hasDismissed = sessionStorage.getItem('nxctf_donate_dismissed')
    if (!hasDismissed) {
      setIsOpen(true)
    }
  }, [apiUrl])

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
  }

  const handleDismiss = () => {
    sessionStorage.setItem('nxctf_donate_dismissed', 'true')
    setIsOpen(false)
  }

  if (!apiUrl) return null

  const formatIDR = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(value).replace(/\s+/g, '')
  }

  // Show top 10 supporters for a complete list
  const top10 = Array.from({ length: 10 }, (_, i) => {
    return leaderboard[i] || { donator: '...', amount: 0, currency: 'IDR' }
  })

  // Format recent track entries for marquee
  const marqueeItems = recent.length > 0
    ? recent.slice(0, 10).map(i => `${i.donator}: ${formatIDR(i.amount)}`)
    : []

  const marqueeText = marqueeItems.length > 0
    ? marqueeItems.join('    ·    ') + '    ·    '
    : 'Belum ada donasi terbaru    ·    '

  return (
    <>
      {/* Floating Action Button Widget */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed left-6 bottom-6 z-40 group flex items-center justify-start h-10 w-10 hover:w-24 px-3 py-2 text-xs font-semibold rounded-full border border-red-200 bg-white/90 text-red-500 shadow-md backdrop-blur-md transition-all hover:bg-red-50 hover:shadow-lg dark:border-red-950/40 dark:bg-red-950/20 dark:text-red-400 dark:hover:bg-red-950/30 duration-300 overflow-hidden"
        title="Dukung Donasi Operasional"
      >
        <Heart className="h-4 w-4 shrink-0 fill-red-500/10 group-hover:fill-red-500/20 transition-all group-hover:scale-110 duration-300 animate-pulse" />
        <span className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
          Donasi
        </span>
      </button>

      {/* Donation Dialog Modal */}
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogContent 
          className="max-w-md sm:max-w-lg p-5" 
          hideCloseButton={true}
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <DialogHeader className="border-b border-gray-100 dark:border-gray-800 pb-2">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-base font-bold text-gray-900 dark:text-white">Dukung Operasional</DialogTitle>
              <CustomBadge
                label="Donasi"
                color="bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20"
                width={50}
              />
            </div>
            <DialogDescription className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
              Dukungan operasional hosting, API, dan server event CTF publik.
            </DialogDescription>
          </DialogHeader>

          {/* Leaders Board */}
          <div className="space-y-2 py-1">
            <div className="flex items-center gap-2 pb-1 border-b border-gray-100 dark:border-gray-800">
              <Trophy className="h-3.5 w-3.5 text-cyan-500" />
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-gray-800 dark:text-gray-300">Top Supporters</span>
            </div>

            <div className="flex flex-col divide-y divide-gray-100/50 dark:divide-gray-800/50">
              {top10.map((item, idx) => {
                const rank = String(idx + 1).padStart(2, '0')
                const isPlaceholder = item.donator === '...'

                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between py-1.5 transition hover:bg-gray-50/30 dark:hover:bg-white/[0.01] px-1 rounded"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`font-mono text-xs w-4 text-right ${isPlaceholder ? 'text-gray-400 dark:text-gray-600' : 'text-cyan-500 dark:text-cyan-400 font-semibold'}`}>
                        {rank}
                      </span>
                      <span className={`font-mono text-sm ${isPlaceholder ? 'text-gray-400 dark:text-gray-600' : 'text-gray-800 dark:text-gray-200 font-semibold'}`}>
                        {item.donator}
                      </span>
                    </div>
                    <span className={isPlaceholder
                      ? 'font-mono text-[11px] text-gray-400 dark:text-gray-600'
                      : 'font-mono text-xs font-bold text-cyan-600 dark:text-cyan-400'
                    }>
                      {isPlaceholder ? '—' : formatIDR(item.amount)}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Marquee Ticker */}
          <SurfaceCard className="overflow-hidden px-3 py-1.5 bg-gray-50/50 dark:bg-black/10 rounded-lg" variant="flat">
            <div className="relative overflow-hidden rounded mask-edges-custom w-full">
              <div className="marquee-track-custom text-xs font-mono text-gray-500 dark:text-gray-400 whitespace-nowrap inline-block">
                <span>{marqueeText.repeat(8)}</span>
              </div>
            </div>
          </SurfaceCard>

          {/* Footer Call-To-Action */}
          <div className="flex flex-col gap-2.5 pt-1">
            <p className="text-[10px] leading-relaxed text-gray-400 dark:text-gray-500">
              Setiap donasi sangat membantu untuk mempertahankan biaya infrastruktur server CTF agar tetap aktif. Pembayaran mendukung QRIS, Gopay, OVO, Dana, LinkAja, dll.
            </p>
            <div className="flex flex-col gap-1.5">
              <a
                href={donationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-red-500 text-white hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 px-5 text-xs font-semibold shadow transition-all duration-200 hover:-translate-y-0.5"
              >
                Donasi via Web Saweria
                <ArrowUpRight className="h-4 w-4" />
              </a>
              <button
                onClick={handleDismiss}
                className="w-full text-center text-[11px] text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 transition-colors py-1 hover:underline underline-offset-2"
              >
                Tutup Sementara / Nanti Saja
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <style jsx global>{`
        .mask-edges-custom {
          -webkit-mask-image: linear-gradient(to right, transparent 0%, #000 8%, #000 92%, transparent 100%);
          mask-image: linear-gradient(to right, transparent 0%, #000 8%, #000 92%, transparent 100%);
        }
        @keyframes marquee-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-12.5%); }
        }
        .marquee-track-custom {
          display: inline-block;
          will-change: transform;
          animation: marquee-scroll 25s linear infinite;
        }
        .marquee-track-custom:hover {
          animation-play-state: paused;
        }
      `}</style>
    </>
  )
}
