import { BookOpen, GitBranch, MessageSquare } from 'lucide-react'
import APP from '@/config'

export const CONTRIBUTORS = ['@ariafatah0711']

export const INFO_LINKS = [
  { name: 'GitHub', href: APP.nxctf.nxctf_github || '#', icon: GitBranch },
  { name: 'Docs', href: APP.nxctf.nxctf_docs || '#', icon: BookOpen },
  { name: 'Discord', href: APP.nxctf?.nxctf_discord || '#', icon: MessageSquare },
]

export function fillContributors(list: string[], minLength = 14) {
  if (list.length === 0) return []
  const result: string[] = []
  let index = 0
  while (result.length < minLength) {
    result.push(list[index % list.length])
    index += 1
  }
  return result
}

export const FILLED_CONTRIBUTORS = fillContributors(CONTRIBUTORS, 14)
