import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { Input as InputPrimitive } from "@base-ui/react/input";

import { cn } from "@/shared/lib/utils";

export type InputProps = React.ComponentProps<"input"> & {
  icon?: LucideIcon
  leftElement?: React.ReactNode
  rightElement?: React.ReactNode
  error?: React.ReactNode
  description?: React.ReactNode
  wrapperClassName?: string
}

const baseInputClassName =
  "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40"

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({
    className,
    type,
    icon: Icon,
    leftElement,
    rightElement,
    error,
    description,
    wrapperClassName,
    id,
    "aria-describedby": ariaDescribedBy,
    "aria-invalid": ariaInvalid,
    ...props
  }, ref) => {
  const generatedId = React.useId()
  const inputId = id ?? generatedId
  const descriptionId = description ? `${inputId}-description` : undefined
  const errorId = error ? `${inputId}-error` : undefined
  const describedBy = [ariaDescribedBy, descriptionId, errorId]
    .filter(Boolean)
    .join(' ') || undefined
  const hasLeftAdornment = Boolean(Icon || leftElement)
  const hasWrapper = hasLeftAdornment || Boolean(rightElement || error || description)

  const input = (
    <InputPrimitive
      ref={ref}
      id={inputId}
      type={type}
      data-slot="input"
      aria-describedby={describedBy}
      aria-invalid={error ? true : ariaInvalid}
      className={cn(
        baseInputClassName,
        hasLeftAdornment && "pl-10",
        rightElement && "pr-10",
        className,
      )}
      {...props}
    />
  )

  if (!hasWrapper) {
    return input
  }

  return (
    <div data-slot="input-field" className={cn("flex w-full flex-col gap-2", wrapperClassName)}>
      <div
        data-slot="input-control"
        className="group relative [&_svg]:pointer-events-none [&_svg]:size-4"
      >
        {Icon ? (
          <Icon
            aria-hidden="true"
            className="absolute left-3 top-1/2 z-10 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary"
          />
        ) : leftElement ? (
          <div className="absolute left-3 top-1/2 z-10 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary">
            {leftElement}
          </div>
        ) : null}
        {input}
        {rightElement ? (
          <div className="absolute right-3 top-1/2 z-10 -translate-y-1/2">
            {rightElement}
          </div>
        ) : null}
      </div>
      {description ? (
        <p id={descriptionId} className="text-sm text-muted-foreground">
          {description}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} role="alert" className="text-sm font-medium text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
})

Input.displayName = "Input";

export { Input };
