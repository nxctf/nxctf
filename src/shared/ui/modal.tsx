"use client"

import * as React from "react"
import { Drawer } from "vaul"
import { cn } from "@/shared/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/shared/ui/dialog"

const MODAL_SIZE_CLASS = {
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  "3xl": "max-w-3xl",
  "4xl": "max-w-4xl",
} as const

const BASE_MODAL_CONTENT_CLASS =
  "w-[calc(100vw-32px)] sm:w-full h-[88vh] max-h-[90vh] flex flex-col overflow-hidden rounded-2xl border border-border bg-card p-0 text-card-foreground shadow-2xl [&_button.absolute.right-4.top-4]:block md:[&_button.absolute.right-4.top-4]:hidden [&_button.absolute.right-4.top-4]:text-muted-foreground"

const DRAWER_MODAL_CONTENT_CLASS =
  "fixed inset-x-0 bottom-0 z-50 flex max-h-[92dvh] flex-col overflow-hidden rounded-t-2xl border border-border bg-card p-0 text-card-foreground shadow-2xl outline-none"

type ModalSurface = "dialog" | "drawer"

const ModalSurfaceContext = React.createContext<ModalSurface>("dialog")

export type ModalSize = keyof typeof MODAL_SIZE_CLASS

type ModalProps = {
  children: React.ReactNode
  trigger?: React.ReactElement
  size?: ModalSize
  contentClassName?: string
  drawerContentClassName?: string
  desktopBreakpoint?: string
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  modal?: boolean
}

export function Modal({
  children,
  trigger,
  size = "3xl",
  contentClassName,
  drawerContentClassName,
  desktopBreakpoint = "(min-width: 768px)",
  open,
  defaultOpen,
  onOpenChange,
  modal,
}: ModalProps) {
  const isDesktop = useMediaQuery(desktopBreakpoint)

  if (!isDesktop) {
    return (
      <Drawer.Root
        open={open}
        defaultOpen={defaultOpen}
        onOpenChange={onOpenChange}
        modal={modal}
      >
        {trigger ? <Drawer.Trigger asChild>{trigger}</Drawer.Trigger> : null}
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 z-50 bg-black/20 backdrop-blur-xs" />
          <Drawer.Content
            className={cn(DRAWER_MODAL_CONTENT_CLASS, drawerContentClassName ?? contentClassName)}
          >
            <ModalSurfaceContext.Provider value="drawer">
              <div className="mx-auto mt-3 h-1.5 w-12 shrink-0 rounded-full bg-muted-foreground/30" />
              {children}
            </ModalSurfaceContext.Provider>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    )
  }

  return (
    <Dialog
      open={open}
      defaultOpen={defaultOpen}
      onOpenChange={(nextOpen) => onOpenChange?.(nextOpen)}
      modal={modal}
    >
      {trigger ? <DialogTrigger render={trigger} /> : null}
      <DialogContent
        className={cn(
          BASE_MODAL_CONTENT_CLASS,
          MODAL_SIZE_CLASS[size],
          contentClassName
        )}
      >
        <ModalSurfaceContext.Provider value="dialog">
          {children}
        </ModalSurfaceContext.Provider>
      </DialogContent>
    </Dialog>
  )
}

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = React.useState(true)

  React.useEffect(() => {
    const mediaQuery = window.matchMedia(query)
    const updateMatches = () => setMatches(mediaQuery.matches)

    updateMatches()
    mediaQuery.addEventListener("change", updateMatches)
    return () => mediaQuery.removeEventListener("change", updateMatches)
  }, [query])

  return matches
}

type ModalHeaderProps = {
  title: React.ReactNode
  description?: React.ReactNode
  actions?: React.ReactNode
  className?: string
  titleClassName?: string
  descriptionClassName?: string
}

export function ModalHeader({
  title,
  description,
  actions,
  className,
  titleClassName,
  descriptionClassName,
}: ModalHeaderProps) {
  const surface = React.useContext(ModalSurfaceContext)
  const Title = surface === "drawer" ? Drawer.Title : DialogTitle
  const Description = surface === "drawer" ? Drawer.Description : DialogDescription

  return (
    <div
      className={cn(
        "shrink-0 border-b border-border bg-card px-4 py-4 md:px-6",
        className
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <Title
            className={cn(
              "text-lg font-bold tracking-tight md:text-xl",
              titleClassName
            )}
          >
            {title}
          </Title>
          {description ? (
            <Description
              className={cn(
                "mt-1 text-sm text-muted-foreground",
                descriptionClassName
              )}
            >
              {description}
            </Description>
          ) : null}
        </div>

        {actions ? (
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {actions}
          </div>
        ) : null}
      </div>
    </div>
  )
}

type ModalBodyProps = {
  children: React.ReactNode
  className?: string
}

export function ModalBody({ children, className }: ModalBodyProps) {
  return (
    <div
      className={cn(
        "flex-1 overflow-y-auto px-4 py-5 md:px-6 scroll-hidden",
        className
      )}
    >
      {children}
    </div>
  )
}

type ModalFooterProps = {
  children: React.ReactNode
  className?: string
  contentClassName?: string
}

export function ModalFooter({
  children,
  className,
  contentClassName,
}: ModalFooterProps) {
  return (
    <div
      className={cn(
        "shrink-0 border-t border-border bg-card px-4 py-4 md:px-6",
        className
      )}
    >
      <div
        className={cn(
          "flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end",
          contentClassName
        )}
      >
        {children}
      </div>
    </div>
  )
}
