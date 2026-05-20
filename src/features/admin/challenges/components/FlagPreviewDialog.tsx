import React, { useState } from 'react'
import { Check, Copy, Flag } from 'lucide-react'

import { Button, Dialog, DialogContent } from '@/shared/ui'
import { cn } from '@/shared/lib/utils'

interface FlagPreviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  fetchedFlag: string | null
}

type DiffItem = { char: string; type: 'correct' | 'case' | 'wrong' }

function diffFlag(correct: string, input: string): DiffItem[] {
  const result: DiffItem[] = []
  const maxLen = Math.max(correct.length, input.length)

  for (let i = 0; i < maxLen; i++) {
    const c = correct[i] || ''
    const t = input[i] || ''

    if (c === t) {
      result.push({ char: t || c, type: 'correct' })
    } else if (c.toLowerCase() === t.toLowerCase()) {
      result.push({ char: t || c, type: 'case' })
    } else {
      result.push({ char: t || c, type: 'wrong' })
    }
  }

  return result
}

export const FlagPreviewDialog: React.FC<FlagPreviewDialogProps> = ({
  open,
  onOpenChange,
  fetchedFlag
}) => {
  const [copyType, setCopyType] = useState<'fetched' | null>(null)
  const [testInput, setTestInput] = useState('')

  const handleCopy = async (text: string, type: 'fetched') => {
    if (!text) return
    await navigator.clipboard.writeText(text)
    setCopyType(type)
    setTimeout(() => setCopyType(null), 2000)
  }

  React.useEffect(() => {
    if (open) {
      setTestInput('')
    }
  }, [open, fetchedFlag])

  const effectiveDBFlag = fetchedFlag || ""
  const isMatchWithTest = testInput && effectiveDBFlag === testInput

  const diffResult = testInput ? diffFlag(effectiveDBFlag, testInput) : []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={'w-[calc(100vw-32px)] sm:w-full fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 max-w-md rounded-2xl bg-card border border-border text-card-foreground p-6'}>
        <div className="p-5 space-y-5">

          {/* HEADER */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-sm text-orange-600 dark:text-orange-400">
              <Flag size={16} />
              FLAG INSPECTOR
            </div>

            {isMatchWithTest && (
              <span className="text-[10px] font-bold px-2 py-1 rounded bg-emerald-500/10 text-emerald-500">
                VALID
              </span>
            )}
          </div>

          {/* FLAG DB */}
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-2 font-mono text-sm text-gray-700 dark:text-gray-200 flex justify-between items-center">
            <span className="truncate">{effectiveDBFlag || 'No flag'}</span>
            <button onClick={() => handleCopy(effectiveDBFlag, 'fetched')}>
              {copyType === 'fetched' ? <Check size={14} /> : <Copy size={14} />}
            </button>
          </div>

          {/* INPUT */}
          <input
            value={testInput}
            onChange={(e) => setTestInput(e.target.value)}
            placeholder="Type flag..."
            className={cn(
              "w-full px-3 py-2 rounded-lg font-mono text-sm outline-none border",
              "bg-white dark:bg-gray-900",
              "text-gray-900 dark:text-white",
              "placeholder:text-gray-400",
              testInput
                ? isMatchWithTest
                  ? "border-emerald-500"
                  : "border-red-500"
                : "border-gray-200 dark:border-gray-700"
            )}
          />

          {/* DIFF */}
          {testInput && (
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 font-mono text-sm flex flex-wrap gap-0.5">
              {diffResult.map((item, i) => (
                <span
                  key={i}
                  className={cn(
                    "px-0.5 rounded",
                    item.type === 'correct' && "text-emerald-500",
                    item.type === 'case' && "text-blue-500",
                    item.type === 'wrong' && "text-red-500"
                  )}
                >
                  {item.char || "_"}
                </span>
              ))}
            </div>
          )}

          {/* LEGEND */}
          {testInput && (
            <div className="flex gap-3 text-[10px] opacity-70">
              <span className="text-emerald-500">correct</span>
              <span className="text-blue-500">case</span>
              <span className="text-red-500">wrong</span>
            </div>
          )}

          {/* ACTION */}
          <Button
            onClick={() => onOpenChange(false)}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white text-xs h-9 rounded-lg"
          >
            Close
          </Button>

        </div>
      </DialogContent>
    </Dialog>
  )
}
