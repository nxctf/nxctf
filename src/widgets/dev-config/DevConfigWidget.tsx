"use client"

import { useState } from 'react'
import { Settings2 } from 'lucide-react'
import DevConfigDialog from './components/DevConfigDialog'

export default function DevConfigWidget() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="p-1.5 rounded-xl border border-orange-500/10 bg-orange-500/5 hover:bg-orange-500/10 hover:border-orange-500/20 transition-all mr-1 group active:scale-95"
        title="Platform Setup (Dev Only)"
      >
        <Settings2 size={20} className="text-orange-500/70 group-hover:text-orange-500 transition-colors" />
      </button>

      <DevConfigDialog open={open} onOpenChange={setOpen} />
    </>
  )
}
