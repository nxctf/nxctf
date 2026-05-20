import { Globe, Bomb, Binary, Cpu, Search, Puzzle, Shield, Terminal, Lightbulb, Eye, Wifi, Bot, Link2 } from 'lucide-react'
import type { ElementType } from 'react'
import { ImageIcon } from 'lucide-react'
import type { ChallengeWithSolve } from '@/shared/types'

export interface CategoryDetails {
  color: string
  borderColor: string
  badgeColor: string
}

export function getCategoryDetails(category: string): CategoryDetails {
  const cat = (category || '').toLowerCase()
  if (cat.includes('intro'))        return { color: 'text-yellow-500',  borderColor: 'border-yellow-500/30',  badgeColor: 'bg-yellow-500/15 text-yellow-400'   }
  if (cat.includes('boot to root')) return { color: 'text-emerald-500', borderColor: 'border-emerald-500/30', badgeColor: 'bg-emerald-500/15 text-emerald-400'  }
  if (cat.includes('web'))          return { color: 'text-blue-500',    borderColor: 'border-blue-500/30',    badgeColor: 'bg-blue-500/15 text-blue-400'        }
  if (cat.includes('forensic'))     return { color: 'text-teal-500',    borderColor: 'border-teal-500/30',    badgeColor: 'bg-teal-500/15 text-teal-400'        }
  if (cat.includes('osint'))        return { color: 'text-cyan-500',    borderColor: 'border-cyan-500/30',    badgeColor: 'bg-cyan-500/15 text-cyan-400'        }
  if (cat.includes('crypto'))       return { color: 'text-purple-500',  borderColor: 'border-purple-500/30',  badgeColor: 'bg-purple-500/15 text-purple-400'    }
  if (cat.includes('rev'))          return { color: 'text-orange-500',  borderColor: 'border-orange-500/30',  badgeColor: 'bg-orange-500/15 text-orange-400'    }
  if (cat.includes('pwn') || cat.includes('exploit')) return { color: 'text-red-500', borderColor: 'border-red-500/30', badgeColor: 'bg-red-500/15 text-red-400' }
  if (cat.includes('steg'))         return { color: 'text-pink-500',    borderColor: 'border-pink-500/30',    badgeColor: 'bg-pink-500/15 text-pink-400'        }
  if (cat.includes('network'))      return { color: 'text-indigo-500',  borderColor: 'border-indigo-500/30',  badgeColor: 'bg-indigo-500/15 text-indigo-400'    }
  if (cat.includes('blockchain') || cat.includes('web3')) return { color: 'text-fuchsia-500', borderColor: 'border-fuchsia-500/30', badgeColor: 'bg-fuchsia-500/15 text-fuchsia-400' }
  if (cat.includes('ai'))           return { color: 'text-violet-500',  borderColor: 'border-violet-500/30',  badgeColor: 'bg-violet-500/15 text-violet-400'    }
  if (cat.includes('misc'))         return { color: 'text-gray-500',    borderColor: 'border-gray-500/30',    badgeColor: 'bg-gray-500/15 text-gray-400'        }
  return                                   { color: 'text-gray-500',    borderColor: 'border-gray-500/30',    badgeColor: 'bg-gray-500/15 text-gray-400'        }
}

const CATEGORY_ICON_MAP: Record<string, ElementType> = {
  'text-yellow-500': Lightbulb,
  'text-emerald-500': Terminal,
  'text-blue-500': Globe,
  'text-teal-500': Search,
  'text-cyan-500': Eye,
  'text-purple-500': Binary,
  'text-orange-500': Cpu,
  'text-red-500': Bomb,
  'text-pink-500': ImageIcon,
  'text-indigo-500': Wifi,
  'text-violet-500': Bot,
  'text-fuchsia-500': Link2,
  'text-gray-500': Puzzle,
}

export function getCategoryIcon(category: string): ElementType {
  const { color } = getCategoryDetails(category)
  return CATEGORY_ICON_MAP[color] ?? Shield
}

export interface DifficultyStyle {
  dotClass: string
  textClass: string
}

export function getDifficultyStyle(colorName: string): DifficultyStyle {
  const map: Record<string, DifficultyStyle> = {
    cyan:   { dotClass: 'bg-cyan-500',   textClass: 'text-cyan-400'   },
    green:  { dotClass: 'bg-green-500',  textClass: 'text-green-400'  },
    yellow: { dotClass: 'bg-yellow-400', textClass: 'text-yellow-400' },
    red:    { dotClass: 'bg-red-500',    textClass: 'text-red-400'    },
    purple: { dotClass: 'bg-purple-500', textClass: 'text-purple-400' },
  }
  return map[colorName] ?? { dotClass: 'bg-gray-400', textClass: 'text-gray-400' }
}


export function normalizeChallengeHints(raw: unknown): string[] {
  let hints: string[] = []

  if (Array.isArray(raw)) {
    hints = raw.filter((hint): hint is string => typeof hint === 'string')
  } else if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) hints = parsed.filter((hint): hint is string => typeof hint === 'string')
      else if (typeof parsed === 'string') hints = [parsed]
    } catch {
      if (raw.trim() !== '') hints = [raw]
    }
  } else if (raw && typeof raw !== 'object') {
    hints = [String(raw)]
  }

  return hints
}

export function getDifficultyOrder(difficultyStyles?: Record<string, unknown>): string[] {
  return Object.keys(difficultyStyles || {}).map((key) => String(key).trim().toLowerCase())
}

export function getDifficultyRank(difficulty: unknown, difficultyOrder: string[]): number {
  if (!difficulty) return difficultyOrder.length

  const normalized = String(difficulty).trim().toLowerCase()
  if (normalized === 'imposible') {
    const fixedIndex = difficultyOrder.indexOf('impossible')
    return fixedIndex === -1 ? difficultyOrder.length : fixedIndex
  }

  const index = difficultyOrder.indexOf(normalized)
  return index === -1 ? difficultyOrder.length : index
}

export function sortChallengesByDisplayPriority<T extends Pick<ChallengeWithSolve, 'points' | 'total_solves' | 'difficulty' | 'title'>>(
  list: T[],
  difficultyOrder: string[]
): T[] {
  return [...list].sort((a, b) => {
    if ((a.points ?? 0) !== (b.points ?? 0)) return (a.points ?? 0) - (b.points ?? 0)

    const solvesA = a.total_solves ?? 0
    const solvesB = b.total_solves ?? 0
    if (solvesA !== solvesB) return solvesB - solvesA

    const rankA = getDifficultyRank(a.difficulty, difficultyOrder)
    const rankB = getDifficultyRank(b.difficulty, difficultyOrder)
    if (rankA !== rankB) return rankA - rankB

    return String(a.title || '').localeCompare(String(b.title || ''))
  })
}

export function sortChallengesByNewest<T extends Pick<ChallengeWithSolve, 'created_at' | 'title'>>(
  list: T[]
): T[] {
  return [...list].sort((a, b) => {
    const createdA = a.created_at ? new Date(a.created_at).getTime() : 0
    const createdB = b.created_at ? new Date(b.created_at).getTime() : 0

    if (createdA !== createdB) return createdB - createdA

    return String(a.title || '').localeCompare(String(b.title || ''))
  })
}

export function buildFuzzyOrderedList(preferredOrder: string[], values: string[]): string[] {
  const matchedValues = new Set<string>()

  return [
    ...preferredOrder.flatMap((preferred) => {
      const preferredLower = preferred.toLowerCase()
      const found = values.find((value) => {
        const valueLower = value.toLowerCase()
        return valueLower.includes(preferredLower) || preferredLower.includes(valueLower)
      })

      if (found && !matchedValues.has(found)) {
        matchedValues.add(found)
        return found
      }

      return [] as string[]
    }),
    ...values.filter((value) => !matchedValues.has(value)).sort(),
  ]
}

export function groupChallengesByCategory(challenges: ChallengeWithSolve[]): Record<string, ChallengeWithSolve[]> {
  return challenges.reduce((acc, challenge) => {
    if (!acc[challenge.category]) acc[challenge.category] = []
    acc[challenge.category].push(challenge)
    return acc
  }, {} as Record<string, ChallengeWithSolve[]>)
}
