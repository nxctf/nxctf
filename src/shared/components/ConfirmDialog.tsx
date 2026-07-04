"use client"

import { Dialog, DialogContent, DialogTitle, DialogFooter } from "@/shared/ui/dialog"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui"
import { useState, useEffect, type ReactNode } from "react"

type ConfirmDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  description?: ReactNode
  variant?: "default" | "destructive"
  icon?: ReactNode
  onConfirm: () => void | Promise<void>
  confirmLabel?: string
  cancelLabel?: string
  confirmDisabled?: boolean
  verificationText?: string
  verificationValue?: string
  onVerificationValueChange?: (value: string) => void
  verificationPlaceholder?: string
  onRestoreWindowScroll?: () => void
}

export default function ConfirmDialog({
  open,
  onOpenChange,
  title = "Confirm",
  description = "Are you sure?",
  variant = "default",
  icon,
  onConfirm,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  confirmDisabled = false,
  verificationText,
  verificationValue: externalValue,
  onVerificationValueChange,
  verificationPlaceholder,
  onRestoreWindowScroll,
}: ConfirmDialogProps) {
  const [loading, setLoading] = useState(false)
  const [internalValue, setInternalValue] = useState("")
  const isExternallyControlled = externalValue !== undefined && onVerificationValueChange !== undefined
  const verificationValue = isExternallyControlled ? externalValue : internalValue

  useEffect(() => {
    if (!open && !isExternallyControlled) {
      setInternalValue("")
    }
  }, [open, isExternallyControlled])



  const handleConfirm = async () => {
    setLoading(true)
    try {
      await onConfirm()
    } finally {
      setLoading(false)
      onOpenChange(false)
    }
  }

  const confirmVariant = variant === "destructive" ? "destructive" : "default"

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) onRestoreWindowScroll?.()
      onOpenChange(isOpen)
    }}>
      <DialogContent className="sm:max-w-md p-3 gap-2" hideCloseButton aria-describedby={undefined} onKeyDown={(e) => {
        if (e.key === 'Enter' && !e.shiftKey && !loading && !confirmDisabled && (verificationText === undefined || verificationValue === verificationText)) {
          e.preventDefault()
          handleConfirm()
        }
      }} onOpenAutoFocus={(event) => {
        if (!onRestoreWindowScroll) return
        event.preventDefault()
        onRestoreWindowScroll()
      }} onCloseAutoFocus={(event) => {
        if (!onRestoreWindowScroll) return
        event.preventDefault()
        onRestoreWindowScroll()
      }}>
        <div className="flex items-start justify-between gap-2">
          <DialogTitle className="text-sm font-semibold tracking-tight pt-0.5">
            {title}
          </DialogTitle>
          {icon && (
            <div className="shrink-0 text-muted-foreground [&>svg]:h-5 [&>svg]:w-5">
              {icon}
            </div>
          )}
        </div>

        <div className="text-sm text-muted-foreground leading-relaxed">
          <div className="whitespace-pre-wrap">
            {description}
          </div>

          {verificationText && (
            <div className="mt-1 space-y-0.5">
              <div className="flex items-center gap-2 text-xs mb-3">
                <span className="text-muted-foreground">Type to confirm:</span>
                <code className="p-0.3 rounded border bg-muted/40 font-mono text-[11px]">
                  {verificationText}
                </code>
              </div>
              <Input
                value={verificationValue}
                onChange={(e) => {
                  const val = e.target.value
                  if (isExternallyControlled) {
                    onVerificationValueChange(val)
                  } else {
                    setInternalValue(val)
                  }
                }}
                placeholder={verificationPlaceholder || verificationText}
                className="h-9 text-sm"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    e.stopPropagation()
                    if (!loading && !confirmDisabled && (verificationText === undefined || verificationValue === verificationText)) {
                      handleConfirm()
                    }
                  }
                }}
              />
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="ghost"
            onMouseDown={(e) => e.preventDefault()}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.stopPropagation()
              }
            }}
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="text-xs font-medium"
          >
            {cancelLabel}
          </Button>
          <Button
            variant={confirmVariant}
            onMouseDown={(e) => e.preventDefault()}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.stopPropagation()
              }
            }}
            onClick={handleConfirm}
            disabled={loading || confirmDisabled || (verificationText !== undefined && verificationValue !== verificationText)}
            className="text-xs font-medium"
          >
            {loading ? "Processing..." : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
