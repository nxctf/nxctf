'use client'

import { Lock } from 'lucide-react'

type EventJoinSectionProps = {
  isLocked?: boolean
}

export default function EventJoinSection({ isLocked }: EventJoinSectionProps) {
  if (!isLocked) return null

  return <Lock size={16} className="text-gray-500" />
}
