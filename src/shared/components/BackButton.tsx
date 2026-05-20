"use client"

import { ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/shared/ui/button"

type Props = {
  href?: string
  label?: string
  onClick?: () => void
  className?: string
}

export default function BackButton({ href, label = "Back", onClick, className = "" }: Props) {
  const router = useRouter()

  const handleClick = () => {
    if (onClick) {
      onClick()
      return
    }

    if (href) router.push(href)
    else router.back()
  }

  return (
    <Button
      onClick={handleClick}
      variant="outline"
      className={`h-9 gap-2 rounded-full px-4 text-xs font-bold uppercase tracking-wider text-gray-600 sm:h-10 sm:text-sm dark:text-gray-400 ${className}`}
    >
      <ArrowLeft size={14} aria-hidden="true" />
      {label}
    </Button>
  )
}
