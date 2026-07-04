"use client"

import React, { useState, useRef, useEffect } from "react"
import { Flag, Copy, Check } from "lucide-react"
import { Button, Dialog, DialogContent, Input } from "@/shared/ui"
import { cn } from "@/shared/lib/utils"
import { diffFlag, diffSummary, DIFF_STYLES } from "../lib/flag-diff-utils"

interface FlagPreviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  fetchedFlag: string | null
}

export const FlagPreviewDialog: React.FC<FlagPreviewDialogProps> = ({
  open,
  onOpenChange,
  fetchedFlag,
}) => {
  const [copyType, setCopyType] = useState<"fetched" | null>(null)
  const [testInput, setTestInput] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setTestInput("")
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [open])

  const handleCopy = async (text: string) => {
    if (!text) return
    await navigator.clipboard.writeText(text)
    setCopyType("fetched")
    setTimeout(() => setCopyType(null), 2000)
  }

  const effectiveDBFlag = fetchedFlag ?? ""
  const maxCompareLen = effectiveDBFlag.length + 15
  const trimmedInput = testInput.slice(0, maxCompareLen)
  const slicedFlag = effectiveDBFlag.slice(0, maxCompareLen)
  const isMatch = testInput && effectiveDBFlag === testInput
  const diffResult = trimmedInput ? diffFlag(slicedFlag, trimmedInput) : []
  const summary = diffResult.length > 0 ? diffSummary(diffResult) : null
  const hasDiffIssue = trimmedInput && !isMatch

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        hideCloseButton
        className="sm:max-w-md p-5 gap-0 flex flex-col max-h-[85dvh] overflow-y-auto scroll-hidden"
        aria-describedby={undefined}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 font-semibold text-sm text-orange-600 dark:text-orange-400">
            <Flag size={16} />
            FLAG INSPECTOR
          </div>
          {testInput && (
            <span
              className={cn(
                "text-[10px] font-bold px-2 py-0.5 rounded",
                isMatch
                  ? "bg-emerald-500/10 text-emerald-500"
                  : "bg-red-500/10 text-red-500",
              )}
            >
              {isMatch ? "VALID" : "MISMATCH"}
            </span>
          )}
        </div>

        <div className="bg-muted/40 rounded-lg px-3 py-2.5 font-mono text-sm text-foreground flex items-center justify-between border mb-3">
          <span className="truncate mr-2">{effectiveDBFlag || "No flag"}</span>
          <button
            onClick={() => handleCopy(effectiveDBFlag)}
            className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Copy flag"
          >
            {copyType === "fetched" ? <Check size={14} /> : <Copy size={14} />}
          </button>
        </div>

        <Input
          ref={inputRef}
          value={testInput}
          onChange={(e) => setTestInput(e.target.value.slice(0, maxCompareLen))}
          placeholder="Type flag to test..."
          maxLength={maxCompareLen}
          className={cn(
            "font-mono text-sm mb-3 transition-colors",
            testInput &&
              (isMatch
                ? "border-emerald-500"
                : "border-red-500"),
          )}
        />

        {testInput ? (
          <>
            <div
              className={cn(
                "rounded-lg border p-3 font-mono text-sm flex flex-wrap gap-[2px] transition-colors content-start leading-relaxed",
                hasDiffIssue
                  ? "bg-red-500/5 border-red-500/20"
                  : isMatch
                    ? "bg-emerald-500/5 border-emerald-500/20"
                    : "bg-transparent border-dashed border-muted-foreground/20",
              )}
            >
              {diffResult.length > 0 ? (
                diffResult.map((item, i) => (
                  <span
                    key={i}
                    className={cn("px-[1px] rounded", DIFF_STYLES[item.type])}
                  >
                    {item.char || "_"}
                  </span>
                ))
              ) : (
                <span className="text-muted-foreground text-xs italic">
                  Empty flag
                </span>
              )}
            </div>

            {summary && (
              <div className="flex items-center justify-between mt-2 text-[11px]">
                <div className="flex gap-3">
                  <span className="text-emerald-500 font-medium">
                    ✓ {summary.correct}
                  </span>
                  {summary.case > 0 && (
                    <span className="text-blue-500 font-medium">
                      ▲ {summary.case}
                    </span>
                  )}
                  {summary.wrong > 0 && (
                    <span className="text-red-500 font-medium">
                      ✗ {summary.wrong}
                    </span>
                  )}
                  {summary.missing > 0 && (
                    <span className="text-yellow-500 font-medium">
                      ◻ {summary.missing}
                    </span>
                  )}
                </div>
                <div className="flex gap-2 text-muted-foreground/60">
                  {summary.correct > 0 && (
                    <span className="text-emerald-500/70">correct</span>
                  )}
                  {summary.case > 0 && (
                    <span className="text-blue-500/70">case</span>
                  )}
                  {summary.wrong > 0 && (
                    <span className="text-red-500/70">wrong</span>
                  )}
                  {summary.missing > 0 && (
                    <span className="text-yellow-500/70">missing</span>
                  )}
                </div>
              </div>
            )}
          </>
        ) : (
          <div
            className={cn(
              "rounded-lg border p-3 font-mono text-sm flex flex-wrap gap-[2px] transition-colors content-start",
              "bg-transparent border-dashed border-muted-foreground/20",
            )}
          >
            <span className="text-muted-foreground/40 text-xs italic">
              Characters will be compared here...
            </span>
          </div>
        )}

        <Button
          variant="outline"
          onClick={() => onOpenChange(false)}
          className="w-full text-xs h-9 mt-3"
        >
          Close
        </Button>
      </DialogContent>
    </Dialog>
  )
}
